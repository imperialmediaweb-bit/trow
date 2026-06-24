import { config } from '../config/index.js';

const BASE = config.paypalEnv === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

export function isPaypalConfigured(): boolean {
  return Boolean(config.paypalClientId && config.paypalClientSecret);
}

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64');
  const resp = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!resp.ok) throw new Error(`PayPal auth failed: ${resp.status}`);
  const data = (await resp.json()) as { access_token: string };
  return data.access_token;
}

/**
 * Creates a one-time PayPal order for the given amount (USD). Returns the order
 * id and the approval URL the user must visit to approve the payment.
 */
export async function createPaypalOrder(params: {
  plan: string;
  planName: string;
  amountUsd: number;
}): Promise<{ orderId: string; approveUrl: string }> {
  const token = await getAccessToken();
  const resp = await fetch(`${BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: `Throwbox AI — ${params.planName} Plan`,
          custom_id: params.plan,
          amount: { currency_code: 'USD', value: params.amountUsd.toFixed(2) },
        },
      ],
      application_context: {
        brand_name: 'Throwbox AI',
        return_url: `${config.appUrl}/pricing?paypal=success`,
        cancel_url: `${config.appUrl}/pricing?paypal=cancelled`,
      },
    }),
  });
  if (!resp.ok) throw new Error(`PayPal order creation failed: ${resp.status}`);
  const data = (await resp.json()) as { id: string; links: Array<{ rel: string; href: string }> };
  const approve = data.links.find((l) => l.rel === 'approve');
  return { orderId: data.id, approveUrl: approve?.href || '' };
}

/**
 * Captures (finalizes) an approved PayPal order. Returns whether it completed
 * and the captured amount in cents.
 */
export async function capturePaypalOrder(orderId: string): Promise<{ completed: boolean; amountCents: number; captureId: string }> {
  const token = await getAccessToken();
  const resp = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!resp.ok) throw new Error(`PayPal capture failed: ${resp.status}`);
  const data = (await resp.json()) as any;
  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
  const amount = capture?.amount?.value ? Math.round(parseFloat(capture.amount.value) * 100) : 0;
  return {
    completed: data.status === 'COMPLETED',
    amountCents: amount,
    captureId: capture?.id || orderId,
  };
}
