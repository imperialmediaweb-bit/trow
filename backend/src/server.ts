import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
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

const app = express();
const server = createServer(app);

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
app.use(helmet());
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

// ─── Error Handling ─────────────────────────────────────────
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────────
const PORT = config.port;

server.listen(PORT, () => {
  logger.info(`Throwbox API running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

export { app, server, io };
