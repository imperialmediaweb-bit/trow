import dotenv from 'dotenv';

dotenv.config();

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

// Weak default values that must never be used in production.
const WEAK_DEFAULTS = new Set([
  'dev-jwt-secret-change-me',
  'dev-refresh-secret-change-me',
  '0000000000000000000000000000000000000000000000000000000000000000',
  'minioadmin',
]);

const missing: string[] = [];
const weak: string[] = [];

/**
 * Returns the env var value, or a fallback for local development.
 * In production, a missing value (or one left at a known-weak default)
 * is collected so we can fail fast at startup instead of silently
 * booting with insecure secrets.
 */
function requireEnv(key: string, fallback: string, opts: { secret?: boolean } = {}): string {
  const value = process.env[key];
  if (!value) {
    if (isProduction && opts.secret) missing.push(key);
    return fallback;
  }
  if (isProduction && opts.secret && WEAK_DEFAULTS.has(value)) weak.push(key);
  return value;
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  isProduction,

  // Database
  databaseUrl: requireEnv('DATABASE_URL', 'postgresql://throwbox:throwbox@localhost:5432/throwbox', { secret: true }),

  // Redis
  redisUrl: requireEnv('REDIS_URL', 'redis://localhost:6379'),

  // JWT
  jwtSecret: requireEnv('JWT_SECRET', 'dev-jwt-secret-change-me', { secret: true }),
  jwtRefreshSecret: requireEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me', { secret: true }),
  jwtExpiresIn: '15m',
  jwtRefreshExpiresIn: '7d',

  // Encryption (must be 32 bytes / 64 hex chars)
  encryptionKey: requireEnv('ENCRYPTION_KEY', '0000000000000000000000000000000000000000000000000000000000000000', { secret: true }),

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
  stripePublicKey: process.env.STRIPE_PUBLIC_KEY || '',

  // PayPal
  paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  paypalEnv: process.env.PAYPAL_ENV || 'sandbox', // 'sandbox' or 'live'

  // Breach checking (Have I Been Pwned)
  hibpApiKey: process.env.HIBP_API_KEY || '',

  // First-boot admin bootstrap
  adminEmail: process.env.ADMIN_EMAIL || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',

  // S3
  s3Endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  s3Bucket: process.env.S3_BUCKET || 'throwbox-attachments',
  s3AccessKey: process.env.S3_ACCESS_KEY || 'minioadmin',
  s3SecretKey: process.env.S3_SECRET_KEY || 'minioadmin',
  s3Region: process.env.S3_REGION || 'us-east-1',

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'https://www.throwbox.net,https://throwbox.net,http://localhost:5173').split(','),

  // Email sending
  emailProvider: process.env.EMAIL_PROVIDER || 'resend', // 'resend' or 'smtp'
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET || '',

  // SMTP (outbound fallback)
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

/**
 * Validates that critical secrets are present and strong in production.
 * Call this once at startup. Throws (fail-fast) rather than booting with
 * insecure defaults that would compromise all users.
 */
export function validateConfig(): void {
  if (!isProduction) {
    // Validate encryption key length even in dev so failures surface early.
    if (config.encryptionKey.length !== 64) {
      console.warn('Warning: ENCRYPTION_KEY should be 64 hex characters (32 bytes).');
    }
    return;
  }

  if (config.encryptionKey.length !== 64) {
    weak.push('ENCRYPTION_KEY (must be 64 hex chars / 32 bytes)');
  }

  const problems: string[] = [];
  if (missing.length) problems.push(`missing required secrets: ${missing.join(', ')}`);
  if (weak.length) problems.push(`secrets left at insecure default: ${weak.join(', ')}`);

  if (problems.length) {
    throw new Error(
      `Refusing to start in production with insecure configuration — ${problems.join('; ')}. ` +
        `Set strong values via environment variables.`,
    );
  }
}
