import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import { Server as SocketServer } from 'socket.io';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/error-handler.js';
import { rateLimiter } from './middleware/rate-limiter.js';
import { authRouter } from './routes/auth.routes.js';
import { inboxRouter } from './routes/inbox.routes.js';
import { emailRouter } from './routes/email.routes.js';
import { aiRouter } from './routes/ai.routes.js';
import { privacyRouter } from './routes/privacy.routes.js';
import { developerRouter } from './routes/developer.routes.js';
import { billingRouter } from './routes/billing.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { setupWebSocket } from './services/websocket.service.js';
import { pool } from './config/database.js';

const app = express();
const server = createServer(app);

// ─── Frontend directory detection ────────────────────────────
const publicDir = resolve(process.cwd(), 'public');
const hasPublicDir = existsSync(publicDir);

// ─── WebSocket ──────────────────────────────────────────────
const io = new SocketServer(server, {
  cors: {
    origin: config.corsOrigins,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

setupWebSocket(io);

// ─── Health Check (before middleware so it works even if Redis is down) ──
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'throwbox-api',
    version: process.env.npm_package_version || '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Middleware ──────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: hasPublicDir ? false : undefined,
}));
app.use(compression());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(rateLimiter);

// ─── API Routes ─────────────────────────────────────────────
const api = express.Router();
api.use('/auth', authRouter);
api.use('/inboxes', inboxRouter);
api.use('/emails', emailRouter);
api.use('/ai', aiRouter);
api.use('/privacy', privacyRouter);
api.use('/developer', developerRouter);
api.use('/billing', billingRouter);
api.use('/admin', adminRouter);

app.use('/api/v1', api);

// ─── Frontend Static Files ──────────────────────────────────
if (hasPublicDir) {
  app.use(express.static(publicDir, { maxAge: '1y', immutable: true, index: false }));
  logger.info(`Serving frontend from ${publicDir}`);
}

// ─── Error Handling (API only) ──────────────────────────────
app.use('/api', errorHandler);

// ─── SPA Fallback ───────────────────────────────────────────
if (hasPublicDir) {
  const indexHtml = resolve(publicDir, 'index.html');
  app.get('*', (_req, res) => {
    res.sendFile(indexHtml);
  });
}

// ─── Auto-Migration ─────────────────────────────────────────
async function runMigrations() {
  try {
    const result = await pool.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')`,
    );
    if (result.rows[0].exists) {
      logger.info('Database tables already exist, skipping migration');
      return;
    }

    logger.info('Running database migrations...');
    const migrationPaths = [
      resolve(process.cwd(), 'database/migrations/001_initial.sql'),
      resolve(process.cwd(), '../backend/database/migrations/001_initial.sql'),
    ];

    let migrationSql = '';
    for (const p of migrationPaths) {
      if (existsSync(p)) {
        migrationSql = readFileSync(p, 'utf-8');
        break;
      }
    }

    if (!migrationSql) {
      logger.warn('Migration file not found, skipping');
      return;
    }

    await pool.query(migrationSql);
    logger.info('Database migration completed successfully');
  } catch (err) {
    logger.error('Database migration failed', { error: (err as Error).message });
  }
}

// ─── Start Workers (in same process for Railway) ────────────
async function startWorkers() {
  try {
    await import('./workers/cleanup.worker.js');
    logger.info('Cleanup worker started');
  } catch (err) {
    logger.warn('Cleanup worker failed to start', { error: (err as Error).message });
  }

  try {
    await import('./workers/mail.worker.js');
    logger.info('Mail worker started');
  } catch (err) {
    logger.warn('Mail worker failed to start', { error: (err as Error).message });
  }

  try {
    await import('./workers/ai.worker.js');
    logger.info('AI worker started');
  } catch (err) {
    logger.warn('AI worker failed to start', { error: (err as Error).message });
  }

  // Start inbound SMTP server
  if (process.env.ENABLE_SMTP_SERVER === 'true') {
    try {
      await import('./workers/smtp.server.js');
      logger.info('Inbound SMTP server started');
    } catch (err) {
      logger.warn('SMTP server failed to start', { error: (err as Error).message });
    }
  }
}

// ─── Global Error Handlers (prevent crashes) ────────────────
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled promise rejection', { error: reason?.message || reason });
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
});

// ─── Start ──────────────────────────────────────────────────
const PORT = config.port;

server.on('error', (err: any) => {
  logger.error('Server error', { error: err.message, code: err.code });
});

server.listen(PORT, async () => {
  logger.info(`Throwbox API running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  try {
    await runMigrations();
  } catch (err) {
    logger.error('Migration startup error', { error: (err as Error).message });
  }
  try {
    await startWorkers();
  } catch (err) {
    logger.error('Worker startup error', { error: (err as Error).message });
  }
});

export { app, server, io };
