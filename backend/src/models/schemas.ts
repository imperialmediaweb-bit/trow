import { z } from 'zod';

// ─── Auth Schemas ───────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  display_name: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Inbox Schemas ──────────────────────────────────────────
export const createInboxSchema = z.object({
  domain: z.string().optional(),
  prefix: z.string().min(3).max(64).regex(/^[a-z0-9._-]+$/).optional(),
  ttl: z.enum(['600', '3600', '86400', '604800']).transform(Number).default('3600'),
  visibility: z.enum(['public', 'private']).default('private'),
  forwarding: z.object({
    enabled: z.boolean(),
    target: z.string().email(),
  }).optional(),
  auto_reply: z.object({
    enabled: z.boolean(),
    message: z.string().max(1000),
  }).optional(),
});

export const updateInboxSchema = z.object({
  forwarding_to: z.string().email().nullable().optional(),
  auto_reply_msg: z.string().max(1000).nullable().optional(),
  visibility: z.enum(['public', 'private']).optional(),
});

// ─── Email Send Schemas ─────────────────────────────────────
export const sendEmailSchema = z.object({
  from_inbox_id: z.string().uuid(),
  to: z.array(z.string().email()).min(1).max(10),
  cc: z.array(z.string().email()).max(10).default([]),
  subject: z.string().max(500),
  body: z.string().max(50000),
  body_html: z.string().max(100000).optional(),
  attachments: z.array(z.string()).max(5).default([]),
  captcha_token: z.string(),
});

// ─── AI Schemas ─────────────────────────────────────────────
export const aiComposeSchema = z.object({
  prompt: z.string().min(5).max(2000),
  tone: z.enum(['formal', 'casual', 'business', 'friendly']).default('business'),
  language: z.string().length(2).default('en'),
  context: z.object({
    email_id: z.string().uuid(),
  }).optional(),
  max_length: z.number().min(50).max(2000).default(500),
});

export const aiSummarizeSchema = z.object({
  email_id: z.string().uuid(),
  max_length: z.number().min(50).max(500).default(200),
});

// ─── Developer Schemas ──────────────────────────────────────
export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum(['read', 'write', 'admin'])).min(1).default(['read']),
  expires_in_days: z.number().min(1).max(365).optional(),
});

export const createWebhookSchema = z.object({
  url: z.string().url().max(2048),
  events: z.array(z.string()).min(1),
});

// ─── Privacy Schemas ────────────────────────────────────────
export const createAliasSchema = z.object({
  domain: z.string().optional(),
  label: z.string().max(100).optional(),
  forward_to: z.string().email(),
});

export const leakCheckSchema = z.object({
  email: z.string().email(),
});

// ─── Billing Schemas ────────────────────────────────────────
export const subscribeSchema = z.object({
  plan: z.enum(['pro', 'business', 'enterprise', 'api_basic', 'api_pro']),
  payment_method_id: z.string().optional(),
});
