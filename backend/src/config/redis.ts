import Redis from 'ioredis';
import { config } from './index.js';
import { logger } from './logger.js';

function createRedis(): Redis | null {
  if (!process.env.REDIS_URL) {
    logger.warn('REDIS_URL not set – running without Redis');
    return null;
  }

  const client = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error('Redis error', err));

  return client;
}

export const redis = createRedis();
