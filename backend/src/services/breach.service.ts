import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

export interface BreachResult {
  available: boolean; // false when no provider is configured
  breaches: Array<{ name: string; domain?: string; breach_date?: string; data_classes?: string[] }>;
}

/**
 * Checks an email against Have I Been Pwned (HIBP).
 *
 * Requires HIBP_API_KEY. If not configured, returns { available: false } so the
 * caller can tell the user the feature isn't enabled — rather than reporting a
 * misleading "0 breaches found".
 */
export async function checkBreaches(email: string): Promise<BreachResult> {
  if (!config.hibpApiKey) {
    return { available: false, breaches: [] };
  }

  try {
    const resp = await fetch(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
      {
        headers: {
          'hibp-api-key': config.hibpApiKey,
          'user-agent': 'Throwbox-AI',
        },
      },
    );

    if (resp.status === 404) {
      // HIBP returns 404 when the account is not found in any breach.
      return { available: true, breaches: [] };
    }

    if (!resp.ok) {
      logger.warn('HIBP request failed', { status: resp.status });
      return { available: false, breaches: [] };
    }

    const data = (await resp.json()) as Array<{
      Name: string;
      Domain?: string;
      BreachDate?: string;
      DataClasses?: string[];
    }>;

    return {
      available: true,
      breaches: data.map((b) => ({
        name: b.Name,
        domain: b.Domain,
        breach_date: b.BreachDate,
        data_classes: b.DataClasses,
      })),
    };
  } catch (err) {
    logger.error('Breach check failed', { error: (err as Error).message });
    return { available: false, breaches: [] };
  }
}
