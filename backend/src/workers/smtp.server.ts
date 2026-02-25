import { SMTPServer } from 'smtp-server';
import { Queue } from 'bullmq';
import { pool } from '../config/database.js';
import { logger } from '../config/logger.js';

const SMTP_PORT = parseInt(process.env.SMTP_LISTEN_PORT || '2525');
const redisUrl = process.env.REDIS_URL;

// ─── Inbound email queue ────────────────────────────────────
let inboundQueue: Queue | null = null;
if (redisUrl) {
  try {
    inboundQueue = new Queue('inbound-email', { connection: { url: redisUrl } });
  } catch (err) {
    logger.warn('Failed to connect inbound email queue', { error: (err as Error).message });
  }
} else {
  logger.warn('REDIS_URL not set – SMTP inbound queue disabled');
}

// ─── SMTP Server ────────────────────────────────────────────
const server = new SMTPServer({
  name: 'throwbox-mx',
  banner: 'Throwbox AI SMTP',
  disabledCommands: ['AUTH'], // No auth needed for inbound mail
  size: 25 * 1024 * 1024, // 25MB max
  allowInsecureAuth: false,
  authOptional: true,

  // Validate recipient - check if inbox exists
  async onRcptTo(address, _session, callback) {
    const email = address.address;
    const [localPart, domain] = email.split('@');

    try {
      const result = await pool.query(
        `SELECT i.id FROM inboxes i JOIN domains d ON i.domain_id = d.id
         WHERE i.address = $1 AND d.domain = $2 AND i.is_active = true AND i.expires_at > NOW()`,
        [localPart, domain],
      );

      if (result.rowCount === 0) {
        // Also check aliases
        const aliasResult = await pool.query(
          `SELECT a.id FROM aliases a JOIN domains d ON a.domain_id = d.id
           WHERE a.alias_address = $1 AND d.domain = $2 AND a.is_active = true`,
          [localPart, domain],
        );

        if (aliasResult.rowCount === 0) {
          logger.info('Rejected: no inbox or alias', { recipient: email });
          return callback(new Error('Mailbox not found'));
        }
      }

      callback();
    } catch (err) {
      logger.error('RCPT TO check failed', { error: (err as Error).message });
      callback(); // Accept on error to avoid losing mail
    }
  },

  // Process incoming email data
  onData(stream, session, callback) {
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    stream.on('end', async () => {
      const rawEmail = Buffer.concat(chunks).toString('utf-8');
      const sender = session.envelope.mailFrom
        ? (session.envelope.mailFrom as any).address
        : 'unknown@unknown';
      const recipients = session.envelope.rcptTo.map((r: any) => r.address);

      logger.info('Received email', {
        from: sender,
        to: recipients,
        size: rawEmail.length,
      });

      // Queue processing for each recipient
      for (const recipient of recipients) {
        if (!inboundQueue) {
          logger.warn('No queue available, email dropped', { recipient });
          continue;
        }
        try {
          await inboundQueue.add(
            'process',
            {
              rawEmail,
              recipient,
              sender,
              spfResult: 'none',
              dkimResult: 'none',
              dmarcResult: 'none',
            },
            {
              attempts: 3,
              backoff: { type: 'exponential', delay: 3000 },
            },
          );
        } catch (err) {
          logger.error('Failed to queue inbound email', {
            recipient,
            error: (err as Error).message,
          });
        }
      }

      callback();
    });
  },

  // Log connections
  onConnect(session, callback) {
    logger.debug('SMTP connection', { remoteAddress: session.remoteAddress });
    callback();
  },
});

server.on('error', (err) => {
  logger.error('SMTP server error', { error: err.message });
});

server.listen(SMTP_PORT, () => {
  logger.info(`SMTP server listening on port ${SMTP_PORT}`);
});

export { server as smtpServer };
