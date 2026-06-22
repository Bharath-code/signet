import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

// GET /api/health — pings each provider so key/quota problems are obvious.
export async function GET() {
  const firecrawl = process.env.FIRECRAWL_API_KEY ? 'key-set' : 'no-key';
  let gemini: string;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    gemini = 'no-key';
  } else {
    try {
      await generateText({
        model: google('gemini-2.0-flash'),
        prompt: 'ping',
        maxOutputTokens: 1,
      });
      gemini = 'ok';
    } catch (err) {
      // the SDK wraps retries: real status is on .lastError, not the outer error.
      const e = err as { statusCode?: number; lastError?: { statusCode?: number } };
      const code = e.statusCode ?? e.lastError?.statusCode;
      const msg = (err as Error).message ?? '';
      gemini =
        code === 429 || /quota|exceeded|rate.?limit/i.test(msg)
          ? 'quota-exceeded (limit 0 = no free tier; use an AIza… key or enable billing)'
        : code === 401 || code === 403 || /api[_ ]?key|unauthor|forbidden|invalid/i.test(msg)
          ? 'bad-key (rejected by Google)'
        : `error: ${msg.slice(0, 120)}`;
    }
  }

  const ok = firecrawl === 'key-set' && gemini === 'ok';
  return NextResponse.json({ ok, firecrawl, gemini }, { status: ok ? 200 : 503 });
}
