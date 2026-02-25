import { Router, Request, Response } from 'express';
import { pool } from '../config/database.js';
import { authenticate, requirePlan } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/error-handler.js';
import { aiComposeSchema, aiSummarizeSchema } from '../models/schemas.js';
import * as aiService from '../services/ai.service.js';
import { decrypt } from '../services/encryption.service.js';

export const aiRouter = Router();

// POST /ai/summarize
aiRouter.post('/summarize', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const data = aiSummarizeSchema.parse(req.body);

  const result = await pool.query(
    `SELECT e.subject, e.body_text, e.from_address, e.headers
     FROM emails e JOIN inboxes i ON e.inbox_id = i.id
     WHERE e.id = $1 AND i.user_id = $2`,
    [data.email_id, req.user!.userId],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'EMAIL_NOT_FOUND', 'Email not found');
  }

  const email = result.rows[0];
  let bodyText = email.body_text;
  try { bodyText = decrypt(bodyText); } catch { /* already plain */ }

  const analysis = await aiService.analyzeEmail(
    email.subject,
    bodyText,
    email.from_address,
    email.headers || {},
  );

  // Store analysis
  await pool.query(
    `INSERT INTO email_ai_analysis (email_id, summary, otp_codes, phishing_score, phishing_indicators, priority, categories, sentiment, language, ai_provider)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (email_id) DO UPDATE SET
       summary = EXCLUDED.summary, otp_codes = EXCLUDED.otp_codes, phishing_score = EXCLUDED.phishing_score,
       phishing_indicators = EXCLUDED.phishing_indicators, priority = EXCLUDED.priority, categories = EXCLUDED.categories`,
    [
      data.email_id, analysis.summary, JSON.stringify(analysis.otp_codes),
      analysis.phishing_score, JSON.stringify(analysis.phishing_indicators),
      analysis.priority, JSON.stringify(analysis.categories),
      analysis.sentiment, analysis.language, 'claude',
    ],
  );

  res.json({ success: true, data: analysis });
}));

// POST /ai/extract-otp
aiRouter.post('/extract-otp', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { email_id } = req.body;

  const result = await pool.query(
    `SELECT e.body_text FROM emails e JOIN inboxes i ON e.inbox_id = i.id
     WHERE e.id = $1 AND i.user_id = $2`,
    [email_id, req.user!.userId],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'EMAIL_NOT_FOUND', 'Email not found');
  }

  let bodyText = result.rows[0].body_text;
  try { bodyText = decrypt(bodyText); } catch { /* already plain */ }

  // Regex extraction first (fast path)
  const otpRegex = /\b(\d{4,8})\b/g;
  const regexCodes = [...bodyText.matchAll(otpRegex)].map((m: RegExpMatchArray) => m[1]);

  // AI extraction for complex cases
  const analysis = await aiService.analyzeEmail('', bodyText, '', {});

  res.json({
    success: true,
    data: {
      email_id,
      otp_codes: analysis.otp_codes.length > 0 ? analysis.otp_codes : regexCodes.map(c => ({ code: c, type: 'numeric' })),
    },
  });
}));

// POST /ai/phishing-check
aiRouter.post('/phishing-check', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { email_id } = req.body;

  const result = await pool.query(
    `SELECT e.subject, e.body_text, e.from_address, e.headers, e.body_html
     FROM emails e JOIN inboxes i ON e.inbox_id = i.id
     WHERE e.id = $1 AND i.user_id = $2`,
    [email_id, req.user!.userId],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'EMAIL_NOT_FOUND', 'Email not found');
  }

  const email = result.rows[0];
  let bodyText = email.body_text;
  try { bodyText = decrypt(bodyText); } catch { /* already plain */ }

  const analysis = await aiService.analyzeEmail(
    email.subject, bodyText, email.from_address, email.headers || {},
  );

  res.json({
    success: true,
    data: {
      email_id,
      phishing_score: analysis.phishing_score,
      indicators: analysis.phishing_indicators,
      recommendation: analysis.phishing_score > 70 ? 'high_risk' : analysis.phishing_score > 40 ? 'medium_risk' : 'low_risk',
    },
  });
}));

// POST /ai/compose
aiRouter.post('/compose', authenticate, requirePlan('pro', 'business', 'enterprise'), asyncHandler(async (req: Request, res: Response) => {
  const data = aiComposeSchema.parse(req.body);

  let context: string | undefined;
  if (data.context?.email_id) {
    const result = await pool.query(
      `SELECT e.subject, e.body_text FROM emails e JOIN inboxes i ON e.inbox_id = i.id
       WHERE e.id = $1 AND i.user_id = $2`,
      [data.context.email_id, req.user!.userId],
    );
    if (result.rowCount! > 0) {
      let bodyText = result.rows[0].body_text;
      try { bodyText = decrypt(bodyText); } catch { /* already plain */ }
      context = `Subject: ${result.rows[0].subject}\n\n${bodyText}`;
    }
  }

  const composed = await aiService.composeEmail(
    data.prompt, data.tone, data.language, data.max_length, context,
  );

  res.json({ success: true, data: composed });
}));

// POST /ai/grammar
aiRouter.post('/grammar', authenticate, requirePlan('pro', 'business', 'enterprise'), asyncHandler(async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text) throw new AppError(400, 'MISSING_TEXT', 'Text is required');

  const corrected = await aiService.correctGrammar(text);
  res.json({ success: true, data: { original: text, corrected } });
}));

// POST /ai/tone-adjust
aiRouter.post('/tone-adjust', authenticate, requirePlan('pro', 'business', 'enterprise'), asyncHandler(async (req: Request, res: Response) => {
  const { text, tone } = req.body;
  if (!text || !tone) throw new AppError(400, 'MISSING_FIELDS', 'Text and tone are required');

  const adjusted = await aiService.adjustTone(text, tone);
  res.json({ success: true, data: { original: text, adjusted, tone } });
}));
