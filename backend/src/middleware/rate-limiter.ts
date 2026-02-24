import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis.js';

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args) as Promise<any>,
  }),
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
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args) as Promise<any>,
    }),
  });
}
