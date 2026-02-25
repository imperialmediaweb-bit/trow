import dotenv from 'dotenv';

dotenv.config();

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || '';
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // Database
  databaseUrl: requireEnv('DATABASE_URL', 'postgresql://throwbox:throwbox@localhost:5432/throwbox'),

  // Redis
  redisUrl: requireEnv('REDIS_URL', 'redis://localhost:6379'),

  // JWT
  jwtSecret: requireEnv('JWT_SECRET', 'dev-jwt-secret-change-me'),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',

  // Encryption
  encryptionKey: requireEnv('ENCRYPTION_KEY', '0000000000000000000000000000000000000000000000000000000000000000'),

  // AI
  aiProvider: process.env.AI_PROVIDER || 'claude',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  googleAiKey: process.env.GOOGLE_AI_KEY || '',

  // CAPTCHA
  hcaptchaSiteKey: process.env.HCAPTCHA_SITE_KEY || '',
  hcaptchaSecret: process.env.HCAPTCHA_SECRET || '',

  // Stripe
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  // S3
  s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  s3Bucket: process.env.S3_BUCKET || 'throwbox-attachments',
  s3AccessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
  s3SecretKey: process.env.S3_SECRET_KEY || 'minioadmin',
  s3Region: process.env.S3_REGION || 'us-east-1',

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),

  // SMTP (outbound)
  smtpHost: process.env.SMTP_HOST || 'localhost',
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',

  // SMTP (inbound listener)
  smtpListenPort: parseInt(process.env.SMTP_LISTEN_PORT || '2525'),

  // Mail
  mailDomains: (process.env.MAIL_DOMAINS || 'throwbox.net').split(','),

  // App URLs
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:3000',
} as const;
