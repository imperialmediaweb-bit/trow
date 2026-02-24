import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';

// ─── AI Provider Clients ────────────────────────────────────
const anthropic = config.anthropicApiKey
  ? new Anthropic({ apiKey: config.anthropicApiKey })
  : null;

const openai = config.openaiApiKey
  ? new OpenAI({ apiKey: config.openaiApiKey })
  : null;

// ─── Types ──────────────────────────────────────────────────
interface SummaryResult {
  summary: string;
  otp_codes: Array<{ code: string; type: string; expires_hint?: string }>;
  phishing_score: number;
  phishing_indicators: Array<{ type: string; detail: string }>;
  priority: 'high' | 'medium' | 'low' | 'spam';
  categories: string[];
  sentiment: string;
  language: string;
}

interface ComposeResult {
  text: string;
  html: string;
  tokens_used: number;
}

// ─── Core AI Functions ──────────────────────────────────────

export async function analyzeEmail(
  subject: string,
  body: string,
  fromAddress: string,
  headers: Record<string, string>,
): Promise<SummaryResult> {
  const prompt = `Analyze this email and return a JSON object with these fields:
- summary: 1-2 sentence summary
- otp_codes: array of {code, type, expires_hint} for any verification/OTP codes found
- phishing_score: 0-100 (0=safe, 100=definitely phishing)
- phishing_indicators: array of {type, detail} for suspicious elements
- priority: "high", "medium", "low", or "spam"
- categories: array of category tags (e.g., "verification", "newsletter", "personal", "marketing")
- sentiment: "positive", "neutral", or "negative"
- language: ISO 639-1 code

Email:
From: ${fromAddress}
Subject: ${subject}
Headers: Reply-To: ${headers['reply-to'] || 'same as from'}
Body:
${body.slice(0, 4000)}

Return ONLY valid JSON, no markdown.`;

  const result = await callAI(prompt);

  try {
    return JSON.parse(result) as SummaryResult;
  } catch {
    logger.error('Failed to parse AI analysis result', { result });
    return {
      summary: 'Unable to analyze this email.',
      otp_codes: [],
      phishing_score: 0,
      phishing_indicators: [],
      priority: 'medium',
      categories: [],
      sentiment: 'neutral',
      language: 'en',
    };
  }
}

export async function composeEmail(
  prompt: string,
  tone: string,
  language: string,
  maxLength: number,
  context?: string,
): Promise<ComposeResult> {
  const systemPrompt = `You are an email writing assistant. Write in ${tone} tone, in ${language} language. Max ${maxLength} characters.${context ? ` Context from previous email:\n${context}` : ''}`;

  const result = await callAI(`${systemPrompt}\n\nUser request: ${prompt}\n\nReturn JSON with fields: text (plain text version), html (HTML formatted version)`);

  try {
    const parsed = JSON.parse(result);
    return {
      text: parsed.text || result,
      html: parsed.html || `<p>${result}</p>`,
      tokens_used: result.length, // approximate
    };
  } catch {
    return {
      text: result,
      html: `<p>${result}</p>`,
      tokens_used: result.length,
    };
  }
}

export async function checkSpamRisk(
  subject: string,
  body: string,
  toAddresses: string[],
): Promise<{ risk_score: number; issues: string[] }> {
  const prompt = `Analyze this outgoing email for spam risk. Return JSON with risk_score (0-100) and issues array.

To: ${toAddresses.join(', ')}
Subject: ${subject}
Body: ${body.slice(0, 2000)}

Return ONLY valid JSON.`;

  const result = await callAI(prompt);
  try {
    return JSON.parse(result);
  } catch {
    return { risk_score: 0, issues: [] };
  }
}

export async function adjustTone(
  text: string,
  targetTone: string,
): Promise<string> {
  const prompt = `Rewrite this email text in a ${targetTone} tone. Keep the same meaning. Return only the rewritten text, no JSON.

${text}`;

  return callAI(prompt);
}

export async function correctGrammar(text: string): Promise<string> {
  const prompt = `Fix grammar and spelling errors in this email text. Keep the same tone and meaning. Return only the corrected text.

${text}`;

  return callAI(prompt);
}

// ─── Provider Abstraction ───────────────────────────────────

async function callAI(prompt: string): Promise<string> {
  const provider = config.aiProvider;
  const start = Date.now();

  try {
    let result: string;

    if (provider === 'claude' && anthropic) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });
      result = response.content[0].type === 'text' ? response.content[0].text : '';
    } else if (provider === 'openai' && openai) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
      });
      result = response.choices[0]?.message?.content || '';
    } else {
      throw new Error(`AI provider ${provider} not configured`);
    }

    const duration = Date.now() - start;
    logger.debug('AI call completed', { provider, duration_ms: duration });
    return result;
  } catch (error) {
    logger.error('AI call failed', { provider, error });
    throw error;
  }
}
