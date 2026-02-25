import { Worker, Job, Queue } from 'bullmq';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import { pool } from '../config/database.js';
import { redis } from '../config/redis.js';
import { logger } from '../config/logger.js';
import { encrypt } from '../services/encryption.service.js';
import { v4 as uuidv4 } from 'uuid';

// ─── AI Analysis Queue ──────────────────────────────────────
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let aiQueue: Queue | null = null;
try {
  aiQueue = new Queue('ai-analysis', { connection: { url: redisUrl } });
} catch (err) {
  logger.warn('Could not connect AI queue', { error: (err as Error).message });
}

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
    let resolvedInboxId = await redis?.get(`inbox:addr:${recipient}`);

    if (!resolvedInboxId) {
      const inboxResult = await pool.query(
        `SELECT i.id FROM inboxes i JOIN domains d ON i.domain_id = d.id
         WHERE i.address = $1 AND d.domain = $2 AND i.is_active = true AND i.expires_at > NOW()`,
        [localPart, domain],
      );

      if (inboxResult.rowCount === 0) {
        logger.warn('No active inbox for recipient', { recipient });
        return { status: 'rejected', reason: 'no_inbox' };
      }
      resolvedInboxId = inboxResult.rows[0].id;
    }

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

    // Store attachment metadata
    if (parsed.attachments && parsed.attachments.length > 0) {
      for (const att of parsed.attachments) {
        await pool.query(
          `INSERT INTO email_attachments (email_id, filename, content_type, size_bytes, storage_key, checksum_sha256, is_inline, content_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            emailId,
            att.filename || 'unnamed',
            att.contentType || 'application/octet-stream',
            att.size || 0,
            `local/${emailId}/${att.filename || uuidv4()}`,
            att.checksum || null,
            att.contentDisposition === 'inline',
            att.contentId || null,
          ],
        );
      }
    }

    // Queue AI analysis job
    if (aiQueue) {
      try {
        await aiQueue.add('analyze', { emailId }, {
          delay: 1000,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        });
        logger.debug('AI analysis job queued', { emailId });
      } catch (err) {
        logger.warn('Failed to queue AI analysis', { emailId, error: (err as Error).message });
      }
    }

    // Check forwarding rules
    const inboxData = await pool.query(
      'SELECT forwarding_to, auto_reply_msg FROM inboxes WHERE id = $1',
      [resolvedInboxId],
    );
    const inbox = inboxData.rows[0];

    if (inbox?.forwarding_to) {
      try {
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: parseInt(process.env.SMTP_PORT || '587') === 465,
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
          tls: { rejectUnauthorized: false },
        });

        await transport.sendMail({
          from: `Throwbox Forwarding <noreply@${domain}>`,
          to: inbox.forwarding_to,
          subject: `[Fwd] ${parsed.subject || '(no subject)'}`,
          text: `Forwarded from ${recipient}\nFrom: ${sender}\n\n${parsed.text || ''}`,
          html: parsed.html ? `<p><em>Forwarded from ${recipient} | From: ${sender}</em></p><hr>${parsed.html}` : undefined,
        });

        logger.info('Email forwarded', { emailId, forwardTo: inbox.forwarding_to });
      } catch (err) {
        logger.error('Email forwarding failed', { emailId, error: (err as Error).message });
      }
    }

    // Send auto-reply if configured
    if (inbox?.auto_reply_msg) {
      try {
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: parseInt(process.env.SMTP_PORT || '587') === 465,
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
          tls: { rejectUnauthorized: false },
        });

        await transport.sendMail({
          from: `Throwbox <${recipient}>`,
          to: sender,
          subject: `Re: ${parsed.subject || '(no subject)'}`,
          text: inbox.auto_reply_msg,
        });

        logger.info('Auto-reply sent', { emailId, to: sender });
      } catch (err) {
        logger.error('Auto-reply failed', { emailId, error: (err as Error).message });
      }
    }

    logger.info('Email stored', { emailId, inbox: resolvedInboxId });

    return { status: 'stored', emailId };
  },
  {
    connection: { url: redisUrl },
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
