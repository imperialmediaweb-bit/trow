import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../config/database.js';
import { config } from '../config/index.js';
import { authenticate } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/error-handler.js';
import { logger } from '../config/logger.js';
import { isStripeConfigured, createCheckoutSession, constructWebhookEvent } from '../services/stripe.service.js';
import { isPaypalConfigured, createPaypalOrder, capturePaypalOrder } from '../services/paypal.service.js';

export const billingRouter = Router();

// Plan definitions
const PLANS = [
  {
    id: 'free', name: 'Free', price_monthly: 0,
    features: { inboxes: 3, emails_per_day: 20, send_emails: false, ai_calls: 10, aliases: 0, api_access: false, custom_domains: false },
  },
  {
    id: 'pro', name: 'Pro', price_monthly: 9, stripe_price_id: 'price_pro_monthly',
    features: { inboxes: 25, emails_per_day: 500, send_emails: true, send_limit: 50, ai_calls: 100, aliases: 10, api_access: false, custom_domains: false, writing_assistant: true },
  },
  {
    id: 'business', name: 'Business', price_monthly: 29, stripe_price_id: 'price_business_monthly',
    features: { inboxes: 100, emails_per_day: 2000, send_emails: true, send_limit: 200, ai_calls: 500, aliases: 50, api_access: true, custom_domains: true, writing_assistant: true, priority_support: true },
  },
  {
    id: 'api_basic', name: 'API Basic', price_monthly: 19, stripe_price_id: 'price_api_basic_monthly',
    features: { rate_limit: 600, inboxes: 50, emails_per_day: 1000, ai_calls: 200, webhooks: true },
  },
  {
    id: 'api_pro', name: 'API Pro', price_monthly: 49, stripe_price_id: 'price_api_pro_monthly',
    features: { rate_limit: 1500, inboxes: 500, emails_per_day: 10000, ai_calls: 1000, webhooks: true, priority_support: true },
  },
];

function getPlan(id: string) {
  return PLANS.find((p) => p.id === id);
}

// ─── Ensure invoices table ───────────────────────────────────
async function ensureInvoicesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      plan VARCHAR(50) NOT NULL,
      amount_cents INTEGER NOT NULL,
      currency VARCHAR(3) DEFAULT 'USD',
      status VARCHAR(20) DEFAULT 'paid',
      payment_method VARCHAR(50) DEFAULT 'stripe',
      stripe_payment_id VARCHAR(255),
      billing_period_start TIMESTAMPTZ,
      billing_period_end TIMESTAMPTZ,
      pdf_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

/**
 * Activates a paid plan for a user after a confirmed payment: updates the
 * user's plan, upserts the active subscription, writes an invoice, and emails
 * a confirmation. Idempotent on (paymentMethod, paymentId) to tolerate webhook
 * retries / duplicate captures.
 */
async function activatePlan(opts: {
  userId: string;
  email?: string;
  plan: string;
  paymentMethod: 'stripe' | 'paypal' | 'manual';
  paymentId?: string;
  amountCents?: number;
}): Promise<{ invoiceNumber: string; periodEnd: Date } | null> {
  const planInfo = getPlan(opts.plan);
  if (!planInfo) throw new AppError(400, 'INVALID_PLAN', 'Unknown plan');

  await ensureInvoicesTable();

  // Idempotency: if we already recorded this payment, do nothing.
  if (opts.paymentId) {
    const existing = await pool.query('SELECT id FROM invoices WHERE stripe_payment_id = $1', [opts.paymentId]);
    if (existing.rowCount! > 0) {
      logger.info('Payment already processed, skipping', { paymentId: opts.paymentId });
      return null;
    }
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
  const amountCents = opts.amountCents ?? planInfo.price_monthly * 100;

  const client = await pool.connect();
  let invoiceNumber = '';
  let email = opts.email;
  try {
    await client.query('BEGIN');

    await client.query('UPDATE users SET plan = $1, updated_at = NOW() WHERE id = $2', [opts.plan, opts.userId]);

    await client.query(
      `INSERT INTO subscriptions (user_id, plan, status, current_period_start, current_period_end)
       VALUES ($1, $2, 'active', $3, $4)
       ON CONFLICT (user_id) WHERE status = 'active'
       DO UPDATE SET plan = $2, current_period_start = $3, current_period_end = $4, cancel_at_period_end = false`,
      [opts.userId, opts.plan, now, periodEnd],
    );

    invoiceNumber = `INV-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    await client.query(
      `INSERT INTO invoices (user_id, invoice_number, plan, amount_cents, payment_method, stripe_payment_id, billing_period_start, billing_period_end, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'paid')`,
      [opts.userId, invoiceNumber, opts.plan, amountCents, opts.paymentMethod, opts.paymentId || null, now, periodEnd],
    );

    if (!email) {
      const u = await client.query('SELECT email FROM users WHERE id = $1', [opts.userId]);
      email = u.rows[0]?.email;
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Confirmation email (best-effort, outside the transaction)
  if (email && process.env.EMAIL_PROVIDER === 'resend' && process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const domain = config.mailDomains[0];
      await resend.emails.send({
        from: `Throwbox AI <billing@${domain}>`,
        to: [email],
        subject: `Subscription Confirmed - ${planInfo.name} Plan`,
        html: `<h2>Welcome to ${planInfo.name}!</h2>
          <p>Your subscription is now active.</p>
          <table style="border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Plan</strong></td><td style="padding:8px;border:1px solid #ddd">${planInfo.name}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Amount</strong></td><td style="padding:8px;border:1px solid #ddd">$${(amountCents / 100).toFixed(2)}/month</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Invoice</strong></td><td style="padding:8px;border:1px solid #ddd">${invoiceNumber}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Period</strong></td><td style="padding:8px;border:1px solid #ddd">${now.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}</td></tr>
          </table>
          <p>Thank you for choosing Throwbox AI!</p>`,
      });
    } catch (err) {
      logger.warn('Failed to send subscription email', { error: (err as Error).message });
    }
  }

  return { invoiceNumber, periodEnd };
}

// GET /billing/plans
billingRouter.get('/plans', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: PLANS,
    meta: { stripe_enabled: isStripeConfigured(), paypal_enabled: isPaypalConfigured() },
  });
});

// GET /billing/subscription
billingRouter.get('/subscription', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userResult = await pool.query('SELECT plan, created_at FROM users WHERE id = $1', [req.user!.userId]);
  const user = userResult.rows[0];
  const planInfo = getPlan(user.plan) || PLANS[0];

  const subResult = await pool.query(
    `SELECT * FROM subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
    [req.user!.userId],
  );
  const subscription = subResult.rows[0] || null;

  res.json({
    success: true,
    data: {
      plan: user.plan,
      plan_details: planInfo,
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
      } : null,
      member_since: user.created_at,
    },
  });
}));

// POST /billing/subscribe
// - free        → immediate downgrade
// - paid + Stripe configured → returns a Checkout URL (payment required)
// - paid + no provider configured → immediate activation (dev/self-hosted)
billingRouter.post('/subscribe', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { plan } = req.body;
  const planInfo = getPlan(plan);
  if (!planInfo) {
    throw new AppError(400, 'INVALID_PLAN', `Valid plans: ${PLANS.map((p) => p.id).join(', ')}`);
  }

  if (plan === 'free') {
    await pool.query('UPDATE users SET plan = $1, updated_at = NOW() WHERE id = $2', ['free', req.user!.userId]);
    await pool.query(
      `UPDATE subscriptions SET status = 'cancelled', cancelled_at = NOW() WHERE user_id = $1 AND status = 'active'`,
      [req.user!.userId],
    );
    res.json({ success: true, data: { plan: 'free', message: 'Downgraded to free plan' } });
    return;
  }

  // Paid plan: require real payment when a provider is configured.
  if (isStripeConfigured()) {
    const session = await createCheckoutSession({
      userId: req.user!.userId,
      email: req.user!.email,
      plan,
      planName: planInfo.name,
      amountCents: planInfo.price_monthly * 100,
    });
    res.json({
      success: true,
      data: { requires_payment: true, provider: 'stripe', checkout_url: session.url, session_id: session.sessionId },
    });
    return;
  }

  // No payment provider configured: activate immediately (self-hosted / dev).
  logger.warn('No payment provider configured — activating plan without charge', { plan });
  const result = await activatePlan({
    userId: req.user!.userId,
    email: req.user!.email,
    plan,
    paymentMethod: 'manual',
  });

  res.json({
    success: true,
    data: {
      plan,
      plan_details: planInfo,
      invoice_number: result?.invoiceNumber,
      period_end: result?.periodEnd,
      message: `Upgraded to ${planInfo.name} plan`,
    },
  });
}));

// POST /billing/webhook — Stripe webhook (raw body, signature verified)
billingRouter.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  if (!isStripeConfigured() || !config.stripeWebhookSecret) {
    throw new AppError(503, 'STRIPE_NOT_CONFIGURED', 'Stripe webhooks not configured');
  }
  const signature = req.headers['stripe-signature'] as string;
  if (!signature) throw new AppError(400, 'MISSING_SIGNATURE', 'Missing Stripe signature');

  let event;
  try {
    // req.body is a raw Buffer (see express.raw mount in server.ts).
    event = constructWebhookEvent(req.body as unknown as Buffer, signature);
  } catch (err) {
    logger.warn('Stripe webhook signature verification failed', { error: (err as Error).message });
    throw new AppError(400, 'INVALID_SIGNATURE', 'Webhook signature verification failed');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan;
    if (userId && plan) {
      await activatePlan({
        userId,
        plan,
        paymentMethod: 'stripe',
        paymentId: session.id,
        amountCents: session.amount_total ?? undefined,
      });
      logger.info('Stripe checkout completed, plan activated', { userId, plan });
    }
  }

  res.json({ received: true });
}));

// ─── PayPal ──────────────────────────────────────────────────
// POST /billing/paypal/create-order
billingRouter.post('/paypal/create-order', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!isPaypalConfigured()) {
    throw new AppError(503, 'PAYPAL_NOT_CONFIGURED', 'PayPal is not configured on this server');
  }
  const { plan } = req.body;
  const planInfo = getPlan(plan);
  if (!planInfo || plan === 'free') throw new AppError(400, 'INVALID_PLAN', 'Invalid plan for payment');

  const order = await createPaypalOrder({ plan, planName: planInfo.name, amountUsd: planInfo.price_monthly });
  res.json({ success: true, data: { order_id: order.orderId, approve_url: order.approveUrl } });
}));

// POST /billing/paypal/capture
billingRouter.post('/paypal/capture', authenticate, asyncHandler(async (req: Request, res: Response) => {
  if (!isPaypalConfigured()) {
    throw new AppError(503, 'PAYPAL_NOT_CONFIGURED', 'PayPal is not configured on this server');
  }
  const { order_id, plan } = req.body;
  const planInfo = getPlan(plan);
  if (!order_id || !planInfo) throw new AppError(400, 'INVALID_REQUEST', 'order_id and valid plan are required');

  const capture = await capturePaypalOrder(order_id);
  if (!capture.completed) {
    throw new AppError(402, 'PAYMENT_NOT_COMPLETED', 'PayPal payment was not completed');
  }

  const result = await activatePlan({
    userId: req.user!.userId,
    email: req.user!.email,
    plan,
    paymentMethod: 'paypal',
    paymentId: capture.captureId,
    amountCents: capture.amountCents || planInfo.price_monthly * 100,
  });

  res.json({
    success: true,
    data: { plan, invoice_number: result?.invoiceNumber, period_end: result?.periodEnd, message: `Upgraded to ${planInfo.name} plan` },
  });
}));

// POST /billing/cancel
billingRouter.post('/cancel', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await pool.query(
    `UPDATE subscriptions SET cancel_at_period_end = true WHERE user_id = $1 AND status = 'active'`,
    [req.user!.userId],
  );
  res.json({ success: true, data: { message: 'Subscription will cancel at end of billing period' } });
}));

// GET /billing/invoices
billingRouter.get('/invoices', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await ensureInvoicesTable();
  const result = await pool.query(
    `SELECT id, invoice_number, plan, amount_cents, currency, status, payment_method, billing_period_start, billing_period_end, created_at
     FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [req.user!.userId],
  );
  res.json({ success: true, data: result.rows });
}));

// GET /billing/invoices/:id
billingRouter.get('/invoices/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  await ensureInvoicesTable();
  const result = await pool.query(`SELECT * FROM invoices WHERE id = $1 AND user_id = $2`, [req.params.id, req.user!.userId]);
  if (result.rowCount === 0) {
    throw new AppError(404, 'INVOICE_NOT_FOUND', 'Invoice not found');
  }
  res.json({ success: true, data: result.rows[0] });
}));
