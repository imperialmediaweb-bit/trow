import cron from 'node-cron';
import { pool } from '../config/database.js';
import { redis } from '../config/redis.js';
import { logger } from '../config/logger.js';

// ─── Expire Inboxes (every minute) ─────────────────────────
cron.schedule('* * * * *', async () => {
  try {
    const result = await pool.query(
      `UPDATE inboxes SET is_active = false
       WHERE is_active = true AND expires_at < NOW()
       RETURNING id, address`,
    );

    if (result.rowCount! > 0) {
      logger.info(`Expired ${result.rowCount} inboxes`);

      // Clean Redis cache
      for (const row of result.rows) {
        await redis.del(`inbox:${row.id}`);
      }
    }
  } catch (err) {
    logger.error('Cleanup job failed: expire inboxes', { error: (err as Error).message });
  }
});

// ─── Delete Old Expired Inboxes + Emails (every hour) ───────
cron.schedule('0 * * * *', async () => {
  try {
    // Delete inboxes expired more than 24 hours ago (cascade deletes emails)
    const result = await pool.query(
      `DELETE FROM inboxes
       WHERE is_active = false AND expires_at < NOW() - INTERVAL '24 hours'
       RETURNING id`,
    );

    if (result.rowCount! > 0) {
      logger.info(`Purged ${result.rowCount} expired inboxes and their emails`);
    }
  } catch (err) {
    logger.error('Cleanup job failed: purge inboxes', { error: (err as Error).message });
  }
});

// ─── Clean Webhook Logs (daily at 3 AM) ─────────────────────
cron.schedule('0 3 * * *', async () => {
  try {
    const result = await pool.query(
      `DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '30 days'`,
    );
    logger.info(`Cleaned ${result.rowCount} old webhook logs`);
  } catch (err) {
    logger.error('Cleanup job failed: webhook logs', { error: (err as Error).message });
  }
});

// ─── Clean Audit Logs (daily at 3:30 AM) ────────────────────
cron.schedule('30 3 * * *', async () => {
  try {
    const result = await pool.query(
      `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days'`,
    );
    logger.info(`Cleaned ${result.rowCount} old audit logs`);
  } catch (err) {
    logger.error('Cleanup job failed: audit logs', { error: (err as Error).message });
  }
});

logger.info('Cleanup worker started');
