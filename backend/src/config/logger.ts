import winston from 'winston';

const { combine, timestamp, errors, json, colorize, simple } = winston.format;

const transports: winston.transport[] = [];

if (process.env.NODE_ENV === 'production') {
  // In production (Docker/Railway), log to stdout only
  transports.push(new winston.transports.Console({
    format: combine(timestamp(), errors({ stack: true }), json()),
  }));
} else {
  // In development, log to files + colorized console
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: combine(colorize(), simple()),
    }),
  );
}

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }),
    json(),
  ),
  defaultMeta: { service: 'throwbox-api' },
  transports,
});
