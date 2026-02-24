import { Router, Request, Response } from 'express';
import { pool } from '../config/database.js';
import { redis } from '../config/redis.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const adminRouter = Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticate, requireRole('admin', 'superadmin'));

// GET /admin/stats
adminRouter.get('/stats', async (_req: Request, res: Response) => {
  const [users, inboxes, emails, activeInboxes] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL'),
    pool.query('SELECT COUNT(*) FROM inboxes'),
    pool.query('SELECT COUNT(*) FROM emails'),
    pool.query('SELECT COUNT(*) FROM inboxes WHERE is_active = true AND expires_at > NOW()'),
  ]);

  res.json({
    success: true,
    data: {
      total_users: parseInt(users.rows[0].count),
      total_inboxes: parseInt(inboxes.rows[0].count),
      active_inboxes: parseInt(activeInboxes.rows[0].count),
      total_emails: parseInt(emails.rows[0].count),
    },
  });
});

// GET /admin/users
adminRouter.get('/users', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const search = req.query.search as string;

  let query = 'SELECT id, email, display_name, role, plan, created_at, last_login_at FROM users WHERE deleted_at IS NULL';
  const params: any[] = [];

  if (search) {
    query += ` AND (email ILIKE $1 OR display_name ILIKE $1)`;
    params.push(`%${search}%`);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  res.json({ success: true, data: result.rows });
});

// GET /admin/system/health
adminRouter.get('/system/health', async (_req: Request, res: Response) => {
  const checks: Record<string, any> = {};

  // PostgreSQL
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    checks.postgresql = { status: 'ok', latency_ms: Date.now() - start };
  } catch (err) {
    checks.postgresql = { status: 'error', error: (err as Error).message };
  }

  // Redis
  try {
    const start = Date.now();
    await redis.ping();
    checks.redis = { status: 'ok', latency_ms: Date.now() - start };
  } catch (err) {
    checks.redis = { status: 'error', error: (err as Error).message };
  }

  const allOk = Object.values(checks).every((c: any) => c.status === 'ok');

  res.status(allOk ? 200 : 503).json({
    success: allOk,
    data: {
      status: allOk ? 'healthy' : 'degraded',
      checks,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  });
});
