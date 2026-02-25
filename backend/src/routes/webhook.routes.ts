import { Router, Request, Response } from 'express';
import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';
import { encrypt } from '../services/encryption.service.js';
import { getIO } from '../services/websocket.service.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const webhookRouter = Router();

// ─── Verify Resend webhook signature (Svix) ────────────────
function verifyResendSignature(payload: string, headers: Record<string, string>): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification if no secret configured

  const svixId = headers['svix-id'];
  const svixTimestamp = headers['svix-timestamp'];
  const svixSignature = headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    logger.warn('Missing Svix headers in webhook');
    return false;
  }

  // Check timestamp to prevent replay attacks (5 min tolerance)
  const ts = parseInt(svixTimestamp);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 300) {
    logger.warn('Webhook timestamp too old', { diff: now - ts });
    return false;
  }

  // Verify signature
  const secretBytes = Buffer.from(secret.replace('whsec_', ''), 'base64');
  const toSign = `${svixId}.${svixTimestamp}.${payload}`;
  const expectedSig = crypto
    .createHmac('sha256', secretBytes)
    .update(toSign)
    .digest('base64');

  // svix-signature can contain multiple signatures separated by spaces
  const signatures = svixSignature.split(' ').map((s: string) => s.replace('v1,', ''));
  return signatures.some((sig: string) => sig === expectedSig);
}

// ─── Resend Inbound Email Webhook ──────────────────────────
// POST /api/v1/webhooks/resend/inbound
webhookRouter.post('/resend/inbound', async (req: Request, res: Response) => {
  try {
    const rawBody = JSON.stringify(req.body);

    // Verify signature
    const headers: Record<string, string> = {};
    for (const [key, val] of Object.entries(req.headers)) {
      if (typeof val === 'string') headers[key] = val;
    }

    if (!verifyResendSignature(rawBody, headers)) {
      logger.warn('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;

    // Handle different event types
    if (event.type !== 'email.received') {
      logger.debug('Ignoring webhook event type', { type: event.type });
      return res.status(200).json({ received: true });
    }

    const data = event.data;
    if (!data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const sender = data.from || 'unknown@unknown';
    const recipients: string[] = Array.isArray(data.to) ? data.to : [data.to];
    const subject = data.subject || '(no subject)';
    const textBody = data.text || '';
    const htmlBody = data.html || '';
    const ccAddresses = data.cc || [];
    const replyTo = data.reply_to || null;
    const messageId = data.email_id || data.message_id || null;
    const attachments = data.attachments || [];

    logger.info('Resend inbound webhook received', {
      from: sender,
      to: recipients,
      subject,
    });

    // Process each recipient
    for (const recipient of recipients) {
      const [localPart, domain] = recipient.split('@');

      if (!localPart || !domain) {
        logger.warn('Invalid recipient address', { recipient });
        continue;
      }

      // Find active inbox
      const inboxResult = await pool.query(
        `SELECT i.id, i.forwarding_to, i.auto_reply_msg
         FROM inboxes i JOIN domains d ON i.domain_id = d.id
         WHERE i.address = $1 AND d.domain = $2 AND i.is_active = true AND i.expires_at > NOW()`,
        [localPart, domain],
      );

      if (inboxResult.rowCount === 0) {
        // Check aliases
        const aliasResult = await pool.query(
          `SELECT a.forward_to FROM aliases a JOIN domains d ON a.domain_id = d.id
           WHERE a.alias_address = $1 AND d.domain = $2 AND a.is_active = true`,
          [localPart, domain],
        );

        if (aliasResult.rowCount! > 0 && aliasResult.rows[0].forward_to) {
          logger.info('Alias match - forwarding not handled via webhook (use Resend routing)', {
            alias: recipient,
          });
        } else {
          logger.warn('No active inbox for recipient', { recipient });
        }
        continue;
      }

      const inbox = inboxResult.rows[0];
      const inboxId = inbox.id;

      // Encrypt body
      const bodyText = textBody ? encrypt(textBody) : null;
      const bodyHtml = htmlBody ? encrypt(htmlBody) : null;
      const preview = textBody.slice(0, 500);

      // Store email
      const emailId = uuidv4();
      await pool.query(
        `INSERT INTO emails (id, inbox_id, direction, message_id, from_address, from_name, to_addresses, cc_addresses, reply_to, subject, body_text, body_html, body_preview, headers, size_bytes, has_attachments, spf_result, dkim_result, dmarc_result)
         VALUES ($1, $2, 'inbound', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          emailId,
          inboxId,
          messageId,
          sender,
          sender, // from_name - Resend may not separate name
          JSON.stringify(recipients.map((r: string) => ({ address: r }))),
          JSON.stringify(Array.isArray(ccAddresses) ? ccAddresses.map((c: string) => ({ address: c })) : []),
          replyTo,
          subject,
          bodyText,
          bodyHtml,
          preview,
          JSON.stringify(data.headers || {}),
          (textBody.length || 0) + (htmlBody.length || 0),
          attachments.length > 0,
          'pass', // Resend verifies SPF
          'pass', // Resend verifies DKIM
          'pass', // Resend verifies DMARC
        ],
      );

      // Update inbox counters
      await pool.query(
        `UPDATE inboxes SET email_count = email_count + 1, last_email_at = NOW() WHERE id = $1`,
        [inboxId],
      );

      // Store attachments
      if (attachments.length > 0) {
        for (const att of attachments) {
          await pool.query(
            `INSERT INTO email_attachments (email_id, filename, content_type, size_bytes, storage_key, is_inline)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              emailId,
              att.filename || att.name || 'unnamed',
              att.content_type || att.type || 'application/octet-stream',
              att.size || (att.content ? Buffer.from(att.content, 'base64').length : 0),
              `resend/${emailId}/${att.filename || att.name || uuidv4()}`,
              false,
            ],
          );
        }
      }

      // Emit real-time WebSocket event
      try {
        const ioInstance = getIO();
        if (ioInstance) {
          ioInstance.to(`inbox:${inboxId}`).emit('email:new', {
            id: emailId,
            inbox_id: inboxId,
            from_address: sender,
            from_name: sender,
            subject,
            body_preview: preview,
            has_attachments: attachments.length > 0,
            is_read: false,
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        logger.warn('WebSocket emit failed', { emailId, error: (err as Error).message });
      }

      logger.info('Inbound email stored via webhook', { emailId, inbox: inboxId, from: sender });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Webhook processing error', { error: (err as Error).message, stack: (err as Error).stack });
    res.status(500).json({ error: 'Internal error' });
  }
});

// ─── Resend Event Webhooks (delivery, bounce, etc.) ────────
// POST /api/v1/webhooks/resend/events
webhookRouter.post('/resend/events', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    logger.info('Resend event webhook', { type: event.type, id: event.data?.email_id });

    // Log delivery events for debugging
    switch (event.type) {
      case 'email.sent':
        logger.info('Email sent', { emailId: event.data?.email_id });
        break;
      case 'email.delivered':
        logger.info('Email delivered', { emailId: event.data?.email_id });
        break;
      case 'email.bounced':
        logger.warn('Email bounced', { emailId: event.data?.email_id, reason: event.data?.bounce?.type });
        break;
      case 'email.complained':
        logger.warn('Email complaint', { emailId: event.data?.email_id });
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Event webhook error', { error: (err as Error).message });
    res.status(500).json({ error: 'Internal error' });
  }
});
