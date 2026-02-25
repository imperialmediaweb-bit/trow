import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { pool } from '../config/database.js';
import { redis } from '../config/redis.js';
import { createInboxSchema, updateInboxSchema } from '../models/schemas.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/error-handler.js';
import { config } from '../config/index.js';

export const inboxRouter = Router();

// POST /inboxes - Create temporary inbox
inboxRouter.post('/', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const data = createInboxSchema.parse(req.body);

  const domain = data.domain || config.mailDomains[0];
  const prefix = data.prefix || generateRandomAddress();
  const accessToken = crypto.randomBytes(32).toString('hex');

  // Verify domain exists
  const domainResult = await pool.query(
    'SELECT id, is_premium FROM domains WHERE domain = $1 AND is_active = true',
    [domain],
  );

  if (domainResult.rowCount === 0) {
    throw new AppError(400, 'INVALID_DOMAIN', 'Domain not available');
  }

  const domainRow = domainResult.rows[0];

  if (domainRow.is_premium && (!req.user || req.user.plan === 'free')) {
    throw new AppError(403, 'PLAN_REQUIRED', 'Premium domain requires a paid plan');
  }

  // Check user inbox limits
  if (req.user) {
    const limits: Record<string, number> = { free: 3, pro: 25, business: 100, enterprise: 9999 };
    const max = limits[req.user.plan] || 3;
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM inboxes WHERE user_id = $1 AND is_active = true',
      [req.user.userId],
    );
    if (parseInt(countResult.rows[0].count) >= max) {
      throw new AppError(429, 'INBOX_LIMIT', `Plan allows maximum ${max} active inboxes`);
    }
  }

  const expiresAt = new Date(Date.now() + data.ttl * 1000);
  const id = uuidv4();

  const result = await pool.query(
    `INSERT INTO inboxes (id, user_id, domain_id, address, access_token, visibility, ttl_seconds, forwarding_to, auto_reply_msg, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, address, access_token, visibility, expires_at, created_at`,
    [
      id,
      req.user?.userId || null,
      domainRow.id,
      prefix,
      accessToken,
      data.visibility,
      data.ttl,
      data.forwarding?.target || null,
      data.auto_reply?.message || null,
      expiresAt,
    ],
  );

  const inbox = result.rows[0];

  // Cache in Redis
  await redis?.set(
    `inbox:${id}`,
    JSON.stringify(inbox),
    'EX',
    data.ttl,
  );
  await redis?.set(
    `inbox:addr:${prefix}@${domain}`,
    id,
    'EX',
    data.ttl,
  );

  res.status(201).json({
    success: true,
    data: {
      id: inbox.id,
      address: `${inbox.address}@${domain}`,
      token: inbox.access_token,
      visibility: inbox.visibility,
      expires_at: inbox.expires_at,
      created_at: inbox.created_at,
    },
  });
}));

// GET /inboxes - List user's inboxes
inboxRouter.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT i.id, i.address, d.domain, i.visibility, i.email_count, i.expires_at, i.is_active, i.created_at
     FROM inboxes i
     JOIN domains d ON i.domain_id = d.id
     WHERE i.user_id = $1
     ORDER BY i.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user!.userId, limit, offset],
  );

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM inboxes WHERE user_id = $1',
    [req.user!.userId],
  );

  const total = parseInt(countResult.rows[0].count);

  res.json({
    success: true,
    data: result.rows.map((row: any) => ({
      ...row,
      full_address: `${row.address}@${row.domain}`,
    })),
    meta: { page, per_page: limit, total, total_pages: Math.ceil(total / limit) },
  });
}));

// GET /inboxes/:id - Get inbox details
inboxRouter.get('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const inbox = await getInboxWithAuth(req.params.id, req);

  res.json({ success: true, data: inbox });
}));

// DELETE /inboxes/:id
inboxRouter.delete('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  await getInboxWithAuth(req.params.id, req);

  await pool.query('UPDATE inboxes SET is_active = false WHERE id = $1', [req.params.id]);
  await redis?.del(`inbox:${req.params.id}`);

  res.json({ success: true, data: { message: 'Inbox deleted' } });
}));

// PATCH /inboxes/:id
inboxRouter.patch('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const data = updateInboxSchema.parse(req.body);
  await getInboxWithAuth(req.params.id, req);

  const sets: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (data.forwarding_to !== undefined) {
    sets.push(`forwarding_to = $${idx++}`);
    values.push(data.forwarding_to);
  }
  if (data.auto_reply_msg !== undefined) {
    sets.push(`auto_reply_msg = $${idx++}`);
    values.push(data.auto_reply_msg);
  }
  if (data.visibility !== undefined) {
    sets.push(`visibility = $${idx++}`);
    values.push(data.visibility);
  }

  if (sets.length > 0) {
    values.push(req.params.id);
    await pool.query(
      `UPDATE inboxes SET ${sets.join(', ')} WHERE id = $${idx}`,
      values,
    );
  }

  res.json({ success: true, data: { message: 'Updated' } });
}));

// POST /inboxes/:id/extend
inboxRouter.post('/:id/extend', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const inbox = await getInboxWithAuth(req.params.id, req);

  const newExpiry = new Date(new Date(inbox.expires_at).getTime() + inbox.ttl_seconds * 1000);

  await pool.query(
    'UPDATE inboxes SET expires_at = $1 WHERE id = $2',
    [newExpiry, req.params.id],
  );

  res.json({ success: true, data: { expires_at: newExpiry } });
}));

// GET /inboxes/:id/emails
inboxRouter.get('/:id/emails', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  await getInboxWithAuth(req.params.id, req);

  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT id, direction, from_address, from_name, subject, body_preview, has_attachments, is_read, created_at
     FROM emails
     WHERE inbox_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.params.id, limit, offset],
  );

  res.json({ success: true, data: result.rows });
}));

// ─── Helpers ────────────────────────────────────────────────

function generateRandomAddress(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function getInboxWithAuth(id: string, req: Request): Promise<any> {
  const result = await pool.query(
    `SELECT i.*, d.domain FROM inboxes i JOIN domains d ON i.domain_id = d.id WHERE i.id = $1`,
    [id],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'INBOX_NOT_FOUND', 'Inbox not found or expired');
  }

  const inbox = result.rows[0];

  // Auth check: owner, token, or public
  const token = req.headers['x-inbox-token'] || req.query.token;
  const isOwner = req.user && inbox.user_id === req.user.userId;
  const hasToken = token === inbox.access_token;
  const isPublic = inbox.visibility === 'public';

  if (!isOwner && !hasToken && !isPublic) {
    throw new AppError(403, 'FORBIDDEN', 'Access denied');
  }

  return inbox;
}
