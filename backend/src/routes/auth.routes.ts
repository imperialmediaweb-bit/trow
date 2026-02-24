import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import { pool } from '../config/database.js';
import { redis } from '../config/redis.js';
import { registerSchema, loginSchema } from '../models/schemas.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/error-handler.js';

export const authRouter = Router();

// POST /auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const id = uuidv4();

  const result = await pool.query(
    `INSERT INTO users (id, email, password_hash, display_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, email, role, plan`,
    [id, data.email, passwordHash, data.display_name || null],
  );

  if (result.rowCount === 0) {
    throw new AppError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
  }

  const user = result.rows[0];
  const tokens = generateTokens(user);

  res.status(201).json({
    success: true,
    data: { user, ...tokens },
  });
});

// POST /auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);

  const result = await pool.query(
    'SELECT id, email, password_hash, role, plan FROM users WHERE email = $1 AND deleted_at IS NULL',
    [data.email],
  );

  if (result.rowCount === 0) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(data.password, user.password_hash);

  if (!valid) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  await pool.query(
    'UPDATE users SET last_login_at = NOW(), last_login_ip = $1 WHERE id = $2',
    [req.ip, user.id],
  );

  const tokens = generateTokens(user);

  res.json({
    success: true,
    data: {
      user: { id: user.id, email: user.email, role: user.role, plan: user.plan },
      ...tokens,
    },
  });
});

// POST /auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    throw new AppError(400, 'MISSING_TOKEN', 'Refresh token required');
  }

  const blacklisted = await redis?.get(`blacklist:${refresh_token}`);
  if (blacklisted) {
    throw new AppError(401, 'TOKEN_REVOKED', 'Token has been revoked');
  }

  try {
    const payload = jwt.verify(refresh_token, config.jwtRefreshSecret) as any;

    // Blacklist old refresh token (rotation)
    await redis?.set(`blacklist:${refresh_token}`, '1', 'EX', 7 * 24 * 3600);

    const result = await pool.query(
      'SELECT id, email, role, plan FROM users WHERE id = $1 AND deleted_at IS NULL',
      [payload.userId],
    );

    if (result.rowCount === 0) {
      throw new AppError(401, 'USER_NOT_FOUND', 'User not found');
    }

    const tokens = generateTokens(result.rows[0]);
    res.json({ success: true, data: tokens });
  } catch {
    throw new AppError(401, 'TOKEN_INVALID', 'Invalid refresh token');
  }
});

// POST /auth/logout
authRouter.post('/logout', authenticate, async (req: Request, res: Response) => {
  const token = req.headers.authorization?.slice(7);
  if (token) {
    await redis?.set(`blacklist:${token}`, '1', 'EX', 900); // 15 min JWT TTL
  }
  res.json({ success: true, data: { message: 'Logged out' } });
});

// GET /auth/me
authRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  const result = await pool.query(
    'SELECT id, email, display_name, role, plan, locale, timezone, created_at FROM users WHERE id = $1',
    [req.user!.userId],
  );
  res.json({ success: true, data: result.rows[0] });
});

// ─── Helpers ────────────────────────────────────────────────

function generateTokens(user: { id: string; email: string; role: string; plan: string }) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, plan: user.plan },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn },
  );

  return { access_token: accessToken, refresh_token: refreshToken };
}
