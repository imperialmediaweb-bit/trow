import Stripe from 'stripe';
import { config } from '../config/index.js';

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(config.stripeSecretKey);
}

function getStripe(): Stripe {
  if (!config.stripeSecretKey) {
    throw new Error('Stripe is not configured (STRIPE_SECRET_KEY missing)');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(config.stripeSecretKey, { apiVersion: '2024-06-20' as Stripe.LatestApiVersion });
  }
  return stripeClient;
}

/**
 * Creates a Stripe Checkout session for a subscription plan and returns the
 * hosted checkout URL. Uses price_data so it works without pre-creating
 * Stripe Price objects (amount is in cents).
 */
export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  plan: string;
  planName: string;
  amountCents: number;
}): Promise<{ url: string; sessionId: string }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: params.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: `Throwbox AI — ${params.planName} Plan` },
          unit_amount: params.amountCents,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    metadata: { userId: params.userId, plan: params.plan },
    subscription_data: { metadata: { userId: params.userId, plan: params.plan } },
    success_url: `${config.appUrl}/pricing?checkout=success`,
    cancel_url: `${config.appUrl}/pricing?checkout=cancelled`,
  });

  return { url: session.url!, sessionId: session.id };
}

export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
}

export async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}
