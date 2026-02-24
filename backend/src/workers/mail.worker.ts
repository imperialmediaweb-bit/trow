import { Worker, Job } from 'bullmq';
import { simpleParser } from 'mailparser';
import { pool } from '../config/database.js';
import { redis } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { encrypt } from '../services/encryption.service.js';
import { v4 as uuidv4 } from 'uuid';

// ─── Inbound Email Worker ───────────────────────────────────
const inboundWorker = new Worker(
  'inbound-email',
  async (job: Job) => {
    const { rawEmail, recipient, sender, spfResult, dkimResult, dmarcResult } = job.data;

    logger.info('Processing inbound email', { recipient, sender });

    // Parse MIME
    const parsed = await simpleParser(rawEmail);

    // Find inbox
    const [localPart, domain] = recipient.split('@');
    const inboxId = await redis.get(`inbox:addr:${recipient}`);

    if (!inboxId) {
      // Try database
      const inboxResult = await pool.query(
        `SELECT i.id FROM inboxes i JOIN domains d ON i.domain_id = d.id
         WHERE i.address = $1 AND d.domain = $2 AND i.is_active = true AND i.expires_at > NOW()`,
        [localPart, domain],
      );

      if (inboxResult.rowCount === 0) {
        logger.warn('No active inbox for recipient', { recipient });
        return { status: 'rejected', reason: 'no_inbox' };
      }
    }

    const resolvedInboxId = inboxId || (await pool.query(
      `SELECT i.id FROM inboxes i JOIN domains d ON i.domain_id = d.id
       WHERE i.address = $1 AND d.domain = $2`,
      [localPart, domain],
    )).rows[0]?.id;

    if (!resolvedInboxId) {
      return { status: 'rejected', reason: 'no_inbox' };
    }

    // Encrypt body
    const bodyText = parsed.text ? encrypt(parsed.text) : null;
    const bodyHtml = parsed.html ? encrypt(parsed.html as string) : null;
    const preview = (parsed.text || '').slice(0, 500);

    // Store email
    const emailId = uuidv4();
    await pool.query(
      `INSERT INTO emails (id, inbox_id, direction, message_id, from_address, from_name, to_addresses, cc_addresses, reply_to, subject, body_text, body_html, body_preview, headers, size_bytes, has_attachments, spf_result, dkim_result, dmarc_result)
       VALUES ($1, $2, 'inbound', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        emailId,
        resolvedInboxId,
        parsed.messageId,
        sender,
        parsed.from?.text || sender,
        JSON.stringify(parsed.to ? (Array.isArray(parsed.to) ? parsed.to : [parsed.to]).map((t: any) => ({ address: t.text })) : []),
        JSON.stringify(parsed.cc ? (Array.isArray(parsed.cc) ? parsed.cc : [parsed.cc]).map((c: any) => ({ address: c.text })) : []),
        parsed.replyTo?.text || null,
        parsed.subject || '(no subject)',
        bodyText,
        bodyHtml,
        preview,
        JSON.stringify(Object.fromEntries([...Object.entries(parsed.headers || {}).slice(0, 20)])),
        rawEmail.length,
        (parsed.attachments?.length || 0) > 0,
        spfResult,
        dkimResult,
        dmarcResult,
      ],
    );

    // Update inbox counters
    await pool.query(
      `UPDATE inboxes SET email_count = email_count + 1, last_email_at = NOW() WHERE id = $1`,
      [resolvedInboxId],
    );

    // TODO: Store attachments in S3
    // TODO: Queue AI analysis job
    // TODO: Emit WebSocket notification
    // TODO: Check forwarding rules

    logger.info('Email stored', { emailId, inbox: resolvedInboxId });

    return { status: 'stored', emailId };
  },
  {
    connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' },
    concurrency: 10,
  },
);

inboundWorker.on('failed', (job, err) => {
  logger.error('Inbound email job failed', { jobId: job?.id, error: err.message });
});

inboundWorker.on('completed', (job) => {
  logger.debug('Inbound email job completed', { jobId: job.id });
});

logger.info('Mail worker started');
