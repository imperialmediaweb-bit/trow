import { Router, Request, Response } from 'express';
import { pool } from '../config/database.js';
import { sendEmailSchema } from '../models/schemas.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';
import { checkSpamRisk } from '../services/ai.service.js';
import { decrypt } from '../services/encryption.service.js';

export const emailRouter = Router();

// GET /emails/:id
emailRouter.get('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT e.*, a.summary, a.otp_codes, a.phishing_score, a.priority, a.categories
     FROM emails e
     LEFT JOIN email_ai_analysis a ON a.email_id = e.id
     JOIN inboxes i ON e.inbox_id = i.id
     WHERE e.id = $1 AND i.user_id = $2`,
    [req.params.id, req.user!.userId],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'EMAIL_NOT_FOUND', 'Email not found');
  }

  const email = result.rows[0];

  // Decrypt body
  if (email.body_text) {
    try { email.body_text = decrypt(email.body_text); } catch { /* already plain */ }
  }
  if (email.body_html) {
    try { email.body_html = decrypt(email.body_html); } catch { /* already plain */ }
  }

  // Mark as read
  if (!email.is_read) {
    await pool.query('UPDATE emails SET is_read = true WHERE id = $1', [req.params.id]);
  }

  res.json({ success: true, data: email });
});

// POST /emails/send
emailRouter.post('/send', authenticate, async (req: Request, res: Response) => {
  const data = sendEmailSchema.parse(req.body);

  // Verify inbox ownership
  const inboxResult = await pool.query(
    `SELECT i.id, i.address, d.domain
     FROM inboxes i JOIN domains d ON i.domain_id = d.id
     WHERE i.id = $1 AND i.user_id = $2 AND i.is_active = true`,
    [data.from_inbox_id, req.user!.userId],
  );

  if (inboxResult.rowCount === 0) {
    throw new AppError(404, 'INBOX_NOT_FOUND', 'Inbox not found or not owned by you');
  }

  // Check send limits
  const planLimits: Record<string, number> = { free: 0, pro: 50, business: 200, enterprise: 9999 };
  const maxSends = planLimits[req.user!.plan] || 0;

  if (maxSends === 0) {
    throw new AppError(403, 'PLAN_REQUIRED', 'Sending requires a Pro plan or higher');
  }

  const todaySent = await pool.query(
    `SELECT COUNT(*) FROM emails
     WHERE inbox_id = $1 AND direction = 'outbound' AND created_at > NOW() - INTERVAL '1 day'`,
    [data.from_inbox_id],
  );

  if (parseInt(todaySent.rows[0].count) >= maxSends) {
    throw new AppError(429, 'SEND_LIMIT', 'Daily send limit reached');
  }

  // AI spam risk check
  const spamRisk = await checkSpamRisk(data.subject, data.body, data.to);
  if (spamRisk.risk_score > 80) {
    throw new AppError(400, 'SPAM_DETECTED', 'Email flagged as potential spam');
  }

  const inbox = inboxResult.rows[0];
  const fromAddress = `${inbox.address}@${inbox.domain}`;

  // Queue for sending (in production, this goes through BullMQ)
  const emailId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO emails (id, inbox_id, direction, from_address, to_addresses, subject, body_text, body_html, delivery_status)
     VALUES ($1, $2, 'outbound', $3, $4, $5, $6, $7, 'queued')`,
    [emailId, data.from_inbox_id, fromAddress, JSON.stringify(data.to.map(a => ({ address: a }))), data.subject, data.body, data.body_html || null],
  );

  res.status(202).json({
    success: true,
    data: {
      email_id: emailId,
      status: 'queued',
      from: fromAddress,
      to: data.to,
      spam_risk: spamRisk,
    },
  });
});

// GET /emails/sent
emailRouter.get('/sent/list', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT e.id, e.from_address, e.to_addresses, e.subject, e.delivery_status, e.sent_at, e.created_at
     FROM emails e
     JOIN inboxes i ON e.inbox_id = i.id
     WHERE i.user_id = $1 AND e.direction = 'outbound'
     ORDER BY e.created_at DESC
     LIMIT 50`,
    [req.user!.userId],
  );

  res.json({ success: true, data: result.rows });
});

// DELETE /emails/:id
emailRouter.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `DELETE FROM emails e
     USING inboxes i
     WHERE e.id = $1 AND e.inbox_id = i.id AND i.user_id = $2
     RETURNING e.id`,
    [req.params.id, req.user!.userId],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'EMAIL_NOT_FOUND', 'Email not found');
  }

  res.json({ success: true, data: { message: 'Email deleted' } });
});
