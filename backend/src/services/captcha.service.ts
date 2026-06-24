import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

/**
 * Verifies an hCaptcha token server-side.
 *
 * If no hCaptcha secret is configured (e.g. local development), verification
 * is skipped and returns true so the app remains usable. In production you
 * should set HCAPTCHA_SECRET so this actually enforces bot protection.
 */
export async function verifyCaptcha(token: string | undefined, remoteIp?: string): Promise<boolean> {
  if (!config.hcaptchaSecret) {
    // No secret configured — cannot verify; allow but warn (dev mode).
    if (config.isProduction) {
      logger.warn('CAPTCHA secret not configured in production; skipping verification');
    }
    return true;
  }

  if (!token) return false;

  try {
    const body = new URLSearchParams({
      secret: config.hcaptchaSecret,
      response: token,
    });
    if (remoteIp) body.append('remoteip', remoteIp);

    const resp = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const result = (await resp.json()) as { success: boolean };
    return result.success === true;
  } catch (err) {
    logger.error('CAPTCHA verification request failed', { error: (err as Error).message });
    return false;
  }
}
