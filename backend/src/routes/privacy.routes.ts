import { Router, Request, Response } from 'express';
import { pool } from '../config/database.js';
import { authenticate, requirePlan } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';
import { createAliasSchema, leakCheckSchema } from '../models/schemas.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { config } from '../config/index.js';

export const privacyRouter = Router();

// GET /privacy/aliases
privacyRouter.get('/aliases', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT a.id, a.alias_address, d.domain, a.forward_to, a.label, a.is_active, a.emails_received, a.emails_blocked, a.created_at
     FROM aliases a JOIN domains d ON a.domain_id = d.id
     WHERE a.user_id = $1
     ORDER BY a.created_at DESC`,
    [req.user!.userId],
  );

  res.json({ success: true, data: result.rows });
});

// POST /privacy/aliases
privacyRouter.post('/aliases', authenticate, requirePlan('pro', 'business', 'enterprise'), async (req: Request, res: Response) => {
  const data = createAliasSchema.parse(req.body);

  const domain = data.domain || config.mailDomains[0];
  const aliasAddress = `${crypto.randomBytes(6).toString('hex')}`;

  const domainResult = await pool.query(
    'SELECT id FROM domains WHERE domain = $1 AND is_active = true',
    [domain],
  );

  if (domainResult.rowCount === 0) {
    throw new AppError(400, 'INVALID_DOMAIN', 'Domain not available');
  }

  const id = uuidv4();
  await pool.query(
    `INSERT INTO aliases (id, user_id, alias_address, domain_id, forward_to, label)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, req.user!.userId, aliasAddress, domainResult.rows[0].id, data.forward_to, data.label || null],
  );

  res.status(201).json({
    success: true,
    data: {
      id,
      alias: `${aliasAddress}@${domain}`,
      forward_to: data.forward_to,
      label: data.label,
    },
  });
});

// DELETE /privacy/aliases/:id
privacyRouter.delete('/aliases/:id', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    'DELETE FROM aliases WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user!.userId],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'ALIAS_NOT_FOUND', 'Alias not found');
  }

  res.json({ success: true, data: { message: 'Alias deleted' } });
});

// POST /privacy/leak-check
privacyRouter.post('/leak-check', authenticate, async (req: Request, res: Response) => {
  const data = leakCheckSchema.parse(req.body);

  // In production, integrate with HIBP API or similar service
  // For now, return a placeholder response
  const id = uuidv4();
  await pool.query(
    `INSERT INTO leak_checks (id, user_id, checked_email, breaches_found, breach_details)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, req.user!.userId, data.email, 0, JSON.stringify([])],
  );

  res.json({
    success: true,
    data: {
      email: data.email,
      breaches_found: 0,
      breaches: [],
      checked_at: new Date().toISOString(),
    },
  });
});

// GET /privacy/score
privacyRouter.get('/score', authenticate, async (req: Request, res: Response) => {
  // Calculate privacy score based on user's usage
  const aliasCount = await pool.query(
    'SELECT COUNT(*) FROM aliases WHERE user_id = $1 AND is_active = true',
    [req.user!.userId],
  );

  const leakCount = await pool.query(
    'SELECT COALESCE(SUM(breaches_found), 0) as total FROM leak_checks WHERE user_id = $1',
    [req.user!.userId],
  );

  const aliases = parseInt(aliasCount.rows[0].count);
  const breaches = parseInt(leakCount.rows[0].total);

  const aliasScore = Math.min(aliases * 20, 100);
  const breachPenalty = Math.min(breaches * 15, 60);
  const baseScore = 50;

  const score = Math.max(0, Math.min(100, baseScore + aliasScore - breachPenalty));

  res.json({
    success: true,
    data: {
      score,
      factors: {
        alias_usage: { score: aliasScore, detail: `${aliases} active aliases` },
        email_exposure: { score: Math.max(0, 100 - breachPenalty), detail: `Found in ${breaches} breaches` },
        tracking_blocked: { score: 90, detail: 'Tracking pixels stripped by default' },
        encryption: { score: 85, detail: 'TLS enforced' },
      },
      recommendations: [
        ...(aliases < 3 ? ['Create more aliases to reduce email exposure'] : []),
        ...(breaches > 0 ? ['Change passwords for breached accounts'] : []),
      ],
    },
  });
});
