import { Worker, Job } from 'bullmq';
import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';
import { analyzeEmail } from '../services/ai.service.js';
import { decrypt } from '../services/encryption.service.js';

const redisUrl = process.env.REDIS_URL;

async function processAiJob(job: Job) {
  const { emailId } = job.data;

  logger.info('Processing AI analysis', { emailId });
  const start = Date.now();

  // Fetch email
  const result = await pool.query(
    'SELECT subject, body_text, from_address, headers FROM emails WHERE id = $1',
    [emailId],
  );

  if (result.rowCount === 0) {
    logger.warn('Email not found for AI analysis', { emailId });
    return { status: 'skipped', reason: 'email_not_found' };
  }

  const email = result.rows[0];

  // Decrypt body
  let bodyText = email.body_text || '';
  try { bodyText = decrypt(bodyText); } catch { /* already plain */ }

  // Run AI analysis
  const analysis = await analyzeEmail(
    email.subject || '',
    bodyText,
    email.from_address,
    email.headers || {},
  );

  const processingMs = Date.now() - start;

  // Store results
  await pool.query(
    `INSERT INTO email_ai_analysis
     (email_id, summary, otp_codes, phishing_score, phishing_indicators, priority, categories, sentiment, language, ai_provider, processing_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (email_id) DO UPDATE SET
       summary = EXCLUDED.summary,
       otp_codes = EXCLUDED.otp_codes,
       phishing_score = EXCLUDED.phishing_score,
       phishing_indicators = EXCLUDED.phishing_indicators,
       priority = EXCLUDED.priority,
       categories = EXCLUDED.categories,
       sentiment = EXCLUDED.sentiment,
       language = EXCLUDED.language,
       processing_ms = EXCLUDED.processing_ms`,
    [
      emailId,
      analysis.summary,
      JSON.stringify(analysis.otp_codes),
      analysis.phishing_score,
      JSON.stringify(analysis.phishing_indicators),
      analysis.priority,
      JSON.stringify(analysis.categories),
      analysis.sentiment,
      analysis.language,
      'claude',
      processingMs,
    ],
  );

  logger.info('AI analysis complete', { emailId, processingMs });

  return { status: 'completed', emailId, processingMs };
}

// Only start BullMQ worker if Redis is available
if (redisUrl) {
  const aiWorker = new Worker(
    'ai-analysis',
    processAiJob,
    {
      connection: { url: redisUrl },
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000,
      },
    },
  );

  aiWorker.on('failed', (job, err) => {
    logger.error('AI analysis job failed', { jobId: job?.id, error: err.message });
  });
} else {
  logger.warn('REDIS_URL not set – AI worker disabled');
}

logger.info('AI worker started');
