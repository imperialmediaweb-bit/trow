import rateLimit, { type Store } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis.js';

function getStore(): Store | undefined {
  if (!redis) return undefined; // falls back to built-in memory store
  const r = redis;
  return new RedisStore({
    sendCommand: (...args: string[]) => r.call(args[0], ...args.slice(1)) as Promise<any>,
  });
}

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
      status: 429,
    },
  },
});

// Plan-specific rate limiters
export function createPlanLimiter(maxRequests: number) {
  return rateLimit({
    windowMs: 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore(),
  });
}

// Strict limiter for authentication endpoints to slow brute-force attacks.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many attempts, please try again later',
      status: 429,
    },
  },
});

// Limiter for expensive AI endpoints (each call hits a paid external API).
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMIT',
      message: 'AI request limit reached, please slow down',
      status: 429,
    },
  },
});
