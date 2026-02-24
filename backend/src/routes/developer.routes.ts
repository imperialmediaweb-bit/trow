import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { pool } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';
import { createApiKeySchema, createWebhookSchema } from '../models/schemas.js';
import { v4 as uuidv4 } from 'uuid';

export const developerRouter = Router();

// GET /developer/api-keys
developerRouter.get('/api-keys', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, name, key_prefix, scopes, rate_limit, last_used_at, expires_at, is_active, created_at
     FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user!.userId],
  );
  res.json({ success: true, data: result.rows });
});

// POST /developer/api-keys
developerRouter.post('/api-keys', authenticate, async (req: Request, res: Response) => {
  const data = createApiKeySchema.parse(req.body);

  const rawKey = `tb_live_${crypto.randomBytes(32).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 12);
  const id = uuidv4();

  const expiresAt = data.expires_in_days
    ? new Date(Date.now() + data.expires_in_days * 86400000)
    : null;

  await pool.query(
    `INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, scopes, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, req.user!.userId, data.name, keyHash, keyPrefix, JSON.stringify(data.scopes), expiresAt],
  );

  // Return the raw key only once
  res.status(201).json({
    success: true,
    data: {
      id,
      name: data.name,
      key: rawKey,
      key_prefix: keyPrefix,
      scopes: data.scopes,
      expires_at: expiresAt,
      warning: 'Save this key now. It will not be shown again.',
    },
  });
});

// DELETE /developer/api-keys/:id
developerRouter.delete('/api-keys/:id', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    'UPDATE api_keys SET is_active = false WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.userId],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'KEY_NOT_FOUND', 'API key not found');
  }

  res.json({ success: true, data: { message: 'API key revoked' } });
});

// GET /developer/webhooks
developerRouter.get('/webhooks', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, url, events, is_active, failure_count, last_triggered, last_status, created_at
     FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user!.userId],
  );
  res.json({ success: true, data: result.rows });
});

// POST /developer/webhooks
developerRouter.post('/webhooks', authenticate, async (req: Request, res: Response) => {
  const data = createWebhookSchema.parse(req.body);

  const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
  const id = uuidv4();

  await pool.query(
    `INSERT INTO webhooks (id, user_id, url, secret, events)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, req.user!.userId, data.url, secret, JSON.stringify(data.events)],
  );

  res.status(201).json({
    success: true,
    data: { id, url: data.url, secret, events: data.events },
  });
});

// DELETE /developer/webhooks/:id
developerRouter.delete('/webhooks/:id', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    'DELETE FROM webhooks WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.userId],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'WEBHOOK_NOT_FOUND', 'Webhook not found');
  }

  res.json({ success: true, data: { message: 'Webhook deleted' } });
});

// GET /developer/usage
developerRouter.get('/usage', authenticate, async (req: Request, res: Response) => {
  const inboxes = await pool.query(
    'SELECT COUNT(*) FROM inboxes WHERE user_id = $1 AND is_active = true',
    [req.user!.userId],
  );

  const emailsToday = await pool.query(
    `SELECT COUNT(*) FROM emails e JOIN inboxes i ON e.inbox_id = i.id
     WHERE i.user_id = $1 AND e.created_at > NOW() - INTERVAL '1 day'`,
    [req.user!.userId],
  );

  const aiCallsToday = await pool.query(
    `SELECT COUNT(*) FROM email_ai_analysis a JOIN emails e ON a.email_id = e.id JOIN inboxes i ON e.inbox_id = i.id
     WHERE i.user_id = $1 AND a.created_at > NOW() - INTERVAL '1 day'`,
    [req.user!.userId],
  );

  res.json({
    success: true,
    data: {
      plan: req.user!.plan,
      active_inboxes: parseInt(inboxes.rows[0].count),
      emails_today: parseInt(emailsToday.rows[0].count),
      ai_calls_today: parseInt(aiCallsToday.rows[0].count),
    },
  });
});
