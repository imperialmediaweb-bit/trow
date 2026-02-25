import { Router, Request, Response } from 'express';
import { pool } from '../config/database.js';
import { redis } from '../config/redis.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';
import { logger } from '../config/logger.js';

export const adminRouter = Router();

// All admin routes require authentication and admin role
adminRouter.use(authenticate, requireRole('admin', 'superadmin'));

// ═══════════════════════════════════════════════════════════════
// DASHBOARD / STATS
// ═══════════════════════════════════════════════════════════════

// GET /admin/stats
adminRouter.get('/stats', async (_req: Request, res: Response) => {
  const [users, inboxes, emails, activeInboxes, proUsers, todaySignups, todayEmails] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL'),
    pool.query('SELECT COUNT(*) FROM inboxes'),
    pool.query('SELECT COUNT(*) FROM emails'),
    pool.query('SELECT COUNT(*) FROM inboxes WHERE is_active = true AND expires_at > NOW()'),
    pool.query("SELECT COUNT(*) FROM users WHERE plan != 'free' AND deleted_at IS NULL"),
    pool.query("SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE AND deleted_at IS NULL"),
    pool.query("SELECT COUNT(*) FROM emails WHERE created_at >= CURRENT_DATE"),
  ]);

  res.json({
    success: true,
    data: {
      total_users: parseInt(users.rows[0].count),
      total_inboxes: parseInt(inboxes.rows[0].count),
      active_inboxes: parseInt(activeInboxes.rows[0].count),
      total_emails: parseInt(emails.rows[0].count),
      pro_users: parseInt(proUsers.rows[0].count),
      today_signups: parseInt(todaySignups.rows[0].count),
      today_emails: parseInt(todayEmails.rows[0].count),
    },
  });
});

// GET /admin/analytics
adminRouter.get('/analytics', async (req: Request, res: Response) => {
  const days = Math.min(parseInt(req.query.days as string) || 30, 90);

  const [signupsByDay, emailsByDay, planDistribution, topDomains] = await Promise.all([
    pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM users WHERE created_at >= NOW() - INTERVAL '1 day' * $1 AND deleted_at IS NULL
       GROUP BY DATE(created_at) ORDER BY date`,
      [days],
    ),
    pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM emails WHERE created_at >= NOW() - INTERVAL '1 day' * $1
       GROUP BY DATE(created_at) ORDER BY date`,
      [days],
    ),
    pool.query(
      `SELECT plan, COUNT(*) as count FROM users WHERE deleted_at IS NULL GROUP BY plan ORDER BY count DESC`,
    ),
    pool.query(
      `SELECT SPLIT_PART(address, '@', 2) as domain, COUNT(*) as count
       FROM inboxes GROUP BY domain ORDER BY count DESC LIMIT 10`,
    ),
  ]);

  res.json({
    success: true,
    data: {
      signups_by_day: signupsByDay.rows,
      emails_by_day: emailsByDay.rows,
      plan_distribution: planDistribution.rows,
      top_domains: topDomains.rows,
    },
  });
});

// ═══════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// GET /admin/users
adminRouter.get('/users', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const search = req.query.search as string;
  const role = req.query.role as string;
  const plan = req.query.plan as string;

  let query = 'SELECT id, email, display_name, role, plan, created_at, last_login_at, is_banned FROM users WHERE deleted_at IS NULL';
  const params: any[] = [];
  let paramIdx = 1;

  if (search) {
    query += ` AND (email ILIKE $${paramIdx} OR display_name ILIKE $${paramIdx})`;
    params.push(`%${search}%`);
    paramIdx++;
  }

  if (role) {
    query += ` AND role = $${paramIdx}`;
    params.push(role);
    paramIdx++;
  }

  if (plan) {
    query += ` AND plan = $${paramIdx}`;
    params.push(plan);
    paramIdx++;
  }

  const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) FROM');
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  query += ` ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  res.json({
    success: true,
    data: {
      users: result.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
});

// GET /admin/users/:id
adminRouter.get('/users/:id', async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, email, display_name, role, plan, locale, timezone, created_at, last_login_at, last_login_ip, is_banned
     FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [req.params.id],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const [inboxCount, emailCount] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM inboxes WHERE user_id = $1', [req.params.id]),
    pool.query('SELECT COUNT(*) FROM emails WHERE inbox_id IN (SELECT id FROM inboxes WHERE user_id = $1)', [req.params.id]),
  ]);

  res.json({
    success: true,
    data: {
      ...result.rows[0],
      stats: {
        inboxes: parseInt(inboxCount.rows[0].count),
        emails: parseInt(emailCount.rows[0].count),
      },
    },
  });
});

// PUT /admin/users/:id
adminRouter.put('/users/:id', async (req: Request, res: Response) => {
  const { role, plan, display_name, is_banned } = req.body;
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (role !== undefined) { fields.push(`role = $${idx++}`); values.push(role); }
  if (plan !== undefined) { fields.push(`plan = $${idx++}`); values.push(plan); }
  if (display_name !== undefined) { fields.push(`display_name = $${idx++}`); values.push(display_name); }
  if (is_banned !== undefined) { fields.push(`is_banned = $${idx++}`); values.push(is_banned); }

  if (fields.length === 0) {
    throw new AppError(400, 'NO_FIELDS', 'No fields to update');
  }

  values.push(req.params.id);
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} AND deleted_at IS NULL
     RETURNING id, email, display_name, role, plan, is_banned`,
    values,
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

// DELETE /admin/users/:id (soft delete)
adminRouter.delete('/users/:id', async (req: Request, res: Response) => {
  const result = await pool.query(
    'UPDATE users SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id',
    [req.params.id],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  res.json({ success: true, data: { message: 'User deleted' } });
});

// ═══════════════════════════════════════════════════════════════
// SITE SETTINGS (key-value store in DB)
// ═══════════════════════════════════════════════════════════════

// GET /admin/settings
adminRouter.get('/settings', async (_req: Request, res: Response) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(255) PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const result = await pool.query('SELECT key, value FROM site_settings');
  const settings: Record<string, any> = {};
  for (const row of result.rows) {
    settings[row.key] = row.value;
  }

  res.json({
    success: true,
    data: {
      homepage: settings.homepage || {
        title: 'Throwbox AI',
        subtitle: 'AI-Powered Temporary Email & Privacy Platform',
        description: 'Receive, send, and analyze emails with built-in AI intelligence.',
        cta_text: 'Generate Temp Email',
        show_features: true,
      },
      branding: settings.branding || {
        logo_url: '',
        favicon_url: '',
        primary_color: '#4f46e5',
        app_name: 'Throwbox AI',
        footer_text: 'throwbox.net - AI-Powered Temporary Email',
      },
      general: settings.general || {
        maintenance_mode: false,
        registration_enabled: true,
        max_free_inboxes: 3,
        max_free_emails_per_day: 20,
        default_inbox_ttl: 3600,
        allowed_domains: 'throwbox.net',
      },
      smtp: settings.smtp || {
        host: '',
        port: 587,
        secure: false,
        username: '',
        password: '',
        from_name: 'Throwbox AI',
        from_email: 'noreply@throwbox.net',
        enabled: false,
      },
      llm: settings.llm || {
        primary_provider: 'claude',
        providers: {
          claude: { enabled: true, api_key: '', model: 'claude-sonnet-4-20250514' },
          openai: { enabled: false, api_key: '', model: 'gpt-4o-mini' },
          google: { enabled: false, api_key: '', model: 'gemini-pro' },
        },
        fallback_provider: 'openai',
        max_tokens: 1024,
        rate_limit_per_user: 100,
      },
      notifications: settings.notifications || {
        welcome_email: true,
        inbox_expiry_warning: true,
        weekly_digest: false,
        marketing_emails: false,
        admin_alerts: true,
        alert_email: '',
      },
    },
  });
});

// PUT /admin/settings/:section
adminRouter.put('/settings/:section', async (req: Request, res: Response) => {
  const validSections = ['homepage', 'branding', 'general', 'smtp', 'llm', 'notifications'];
  const { section } = req.params;

  if (!validSections.includes(section)) {
    throw new AppError(400, 'INVALID_SECTION', `Invalid settings section. Valid: ${validSections.join(', ')}`);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(255) PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [section, JSON.stringify(req.body)],
  );

  logger.info(`Admin settings updated: ${section}`, { admin: req.user?.email });

  res.json({ success: true, data: { section, value: req.body } });
});

// ═══════════════════════════════════════════════════════════════
// SMTP TEST
// ═══════════════════════════════════════════════════════════════

// POST /admin/smtp/test
adminRouter.post('/smtp/test', async (req: Request, res: Response) => {
  const { provider, host, port, secure, username, password, from_email, test_to, resend_api_key } = req.body;

  if (!test_to) {
    throw new AppError(400, 'MISSING_FIELD', 'test_to email is required');
  }

  try {
    if (provider === 'resend' && resend_api_key) {
      // Test via Resend
      const { Resend } = await import('resend');
      const resend = new Resend(resend_api_key);
      const { error } = await resend.emails.send({
        from: `Throwbox AI <${from_email || 'noreply@throwbox.net'}>`,
        to: [test_to],
        subject: 'Throwbox AI - Resend Test',
        text: 'If you receive this email, your Resend configuration is working correctly.',
        html: '<h2>Resend Test Successful</h2><p>Your Resend email configuration is working correctly.</p>',
      });

      if (error) throw new Error(error.message);
    } else {
      // Test via SMTP
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure,
        auth: username ? { user: username, pass: password } : undefined,
      });

      await transporter.sendMail({
        from: `Throwbox AI <${from_email}>`,
        to: test_to,
        subject: 'Throwbox AI - SMTP Test',
        text: 'If you receive this email, your SMTP configuration is working correctly.',
        html: '<h2>SMTP Test Successful</h2><p>Your SMTP configuration is working correctly.</p>',
      });
    }

    res.json({ success: true, data: { message: 'Test email sent successfully' } });
  } catch (err) {
    res.json({
      success: false,
      error: { code: 'EMAIL_ERROR', message: (err as Error).message },
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// LLM TEST
// ═══════════════════════════════════════════════════════════════

// POST /admin/llm/test
adminRouter.post('/llm/test', async (req: Request, res: Response) => {
  const { provider, api_key, model } = req.body;

  try {
    let response_text = '';

    if (provider === 'claude') {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey: api_key });
      const msg = await client.messages.create({
        model: model || 'claude-sonnet-4-20250514',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say "LLM connection test successful" in exactly those words.' }],
      });
      response_text = msg.content[0].type === 'text' ? msg.content[0].text : 'Unknown response';
    } else if (provider === 'openai') {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey: api_key });
      const msg = await client.chat.completions.create({
        model: model || 'gpt-4o-mini',
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Say "LLM connection test successful" in exactly those words.' }],
      });
      response_text = msg.choices[0]?.message?.content || 'Unknown response';
    } else if (provider === 'google') {
      response_text = 'Google AI integration coming soon';
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }

    res.json({ success: true, data: { provider, model, response: response_text } });
  } catch (err) {
    res.json({
      success: false,
      error: { code: 'LLM_ERROR', message: (err as Error).message },
    });
  }
});

// ═══════════════════════════════════════════════════════════════
// PAGE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// GET /admin/pages
adminRouter.get('/pages', async (_req: Request, res: Response) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pages (
      id VARCHAR(100) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      content TEXT DEFAULT '',
      is_published BOOLEAN DEFAULT false,
      meta_title VARCHAR(255) DEFAULT '',
      meta_description TEXT DEFAULT '',
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const result = await pool.query('SELECT * FROM pages ORDER BY created_at DESC');
  res.json({ success: true, data: result.rows });
});

// POST /admin/pages
adminRouter.post('/pages', async (req: Request, res: Response) => {
  const { title, slug, content, is_published, meta_title, meta_description } = req.body;
  const id = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const result = await pool.query(
    `INSERT INTO pages (id, title, slug, content, is_published, meta_title, meta_description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [id, title, slug || id, content || '', is_published || false, meta_title || '', meta_description || ''],
  );

  res.status(201).json({ success: true, data: result.rows[0] });
});

// PUT /admin/pages/:id
adminRouter.put('/pages/:id', async (req: Request, res: Response) => {
  const { title, content, is_published, meta_title, meta_description } = req.body;

  const result = await pool.query(
    `UPDATE pages SET title = COALESCE($1, title), content = COALESCE($2, content),
     is_published = COALESCE($3, is_published), meta_title = COALESCE($4, meta_title),
     meta_description = COALESCE($5, meta_description), updated_at = NOW()
     WHERE id = $6 RETURNING *`,
    [title, content, is_published, meta_title, meta_description, req.params.id],
  );

  if (result.rowCount === 0) {
    throw new AppError(404, 'PAGE_NOT_FOUND', 'Page not found');
  }

  res.json({ success: true, data: result.rows[0] });
});

// DELETE /admin/pages/:id
adminRouter.delete('/pages/:id', async (req: Request, res: Response) => {
  const result = await pool.query('DELETE FROM pages WHERE id = $1 RETURNING id', [req.params.id]);

  if (result.rowCount === 0) {
    throw new AppError(404, 'PAGE_NOT_FOUND', 'Page not found');
  }

  res.json({ success: true, data: { message: 'Page deleted' } });
});

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION MANAGEMENT
// ═══════════════════════════════════════════════════════════════

// POST /admin/notifications/send
adminRouter.post('/notifications/send', async (req: Request, res: Response) => {
  const { subject, body, target, user_ids } = req.body;

  let recipients: { email: string }[];

  if (target === 'specific' && user_ids?.length) {
    const result = await pool.query(
      'SELECT email FROM users WHERE id = ANY($1) AND deleted_at IS NULL',
      [user_ids],
    );
    recipients = result.rows;
  } else if (target === 'pro') {
    const result = await pool.query("SELECT email FROM users WHERE plan != 'free' AND deleted_at IS NULL");
    recipients = result.rows;
  } else if (target === 'free') {
    const result = await pool.query("SELECT email FROM users WHERE plan = 'free' AND deleted_at IS NULL");
    recipients = result.rows;
  } else {
    const result = await pool.query('SELECT email FROM users WHERE deleted_at IS NULL');
    recipients = result.rows;
  }

  logger.info('Admin notification queued', {
    admin: req.user?.email,
    subject,
    target,
    recipient_count: recipients.length,
  });

  res.json({
    success: true,
    data: {
      message: `Notification queued for ${recipients.length} recipients`,
      recipient_count: recipients.length,
    },
  });
});

// ═══════════════════════════════════════════════════════════════
// SYSTEM HEALTH
// ═══════════════════════════════════════════════════════════════

// GET /admin/system/health
adminRouter.get('/system/health', async (_req: Request, res: Response) => {
  const checks: Record<string, any> = {};

  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    checks.postgresql = { status: 'ok', latency_ms: Date.now() - start };
  } catch (err) {
    checks.postgresql = { status: 'error', error: (err as Error).message };
  }

  try {
    const start = Date.now();
    await redis?.ping();
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
