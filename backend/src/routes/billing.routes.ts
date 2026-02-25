import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';

export const billingRouter = Router();

// GET /billing/plans
billingRouter.get('/plans', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'free',
        name: 'Free',
        price_monthly: 0,
        features: {
          inboxes: 3,
          emails_per_day: 20,
          send_emails: false,
          ai_calls: 10,
          aliases: 0,
          api_access: false,
          custom_domains: false,
        },
      },
      {
        id: 'pro',
        name: 'Pro',
        price_monthly: 9,
        stripe_price_id: 'price_pro_monthly',
        features: {
          inboxes: 25,
          emails_per_day: 500,
          send_emails: true,
          send_limit: 50,
          ai_calls: 100,
          aliases: 10,
          api_access: false,
          custom_domains: false,
          writing_assistant: true,
        },
      },
      {
        id: 'business',
        name: 'Business',
        price_monthly: 29,
        stripe_price_id: 'price_business_monthly',
        features: {
          inboxes: 100,
          emails_per_day: 2000,
          send_emails: true,
          send_limit: 200,
          ai_calls: 500,
          aliases: 50,
          api_access: true,
          custom_domains: true,
          writing_assistant: true,
          priority_support: true,
        },
      },
      {
        id: 'api_basic',
        name: 'API Basic',
        price_monthly: 19,
        stripe_price_id: 'price_api_basic_monthly',
        features: {
          rate_limit: 600,
          inboxes: 50,
          emails_per_day: 1000,
          ai_calls: 200,
          webhooks: true,
        },
      },
      {
        id: 'api_pro',
        name: 'API Pro',
        price_monthly: 49,
        stripe_price_id: 'price_api_pro_monthly',
        features: {
          rate_limit: 1500,
          inboxes: 500,
          emails_per_day: 10000,
          ai_calls: 1000,
          webhooks: true,
          priority_support: true,
        },
      },
    ],
  });
});

// GET /billing/subscription
billingRouter.get('/subscription', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Placeholder - integrate with Stripe
  res.json({
    success: true,
    data: {
      plan: req.user!.plan,
      status: 'active',
    },
  });
}));

// POST /billing/subscribe - Placeholder for Stripe integration
billingRouter.post('/subscribe', authenticate, asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { message: 'Stripe integration pending' },
  });
}));
