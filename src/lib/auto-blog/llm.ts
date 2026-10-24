/**
 * Minimal Gemini client for the auto-blog (REST, no SDK).
 *
 * Why not the SDK client in src/lib/gemini.ts: that one is pinned to one model, and Google retires models
 * on a schedule (gemini-2.5-flash was due to shut down on 2026-10-16). Here the model is a LIST: when one
 * is gone (404), rate-limited for the day (429) or overloaded (503), the next one is tried.
 *
 * Override the list with AUTO_BLOG_MODELS="model-a,model-b". The default is the free-tier models Google
 * names for new projects.
 */

export const DEFAULT_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];

export interface JsonRequest {
  system: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface Llm {
  json<T = unknown>(req: JsonRequest): Promise<T>;
}

export interface GeminiOptions {
  apiKey: string;
  models?: string[];
  fetchImpl?: typeof fetch;
  /** Per request. Generous: a long article from a "thinking" model can take a minute. */
  timeoutMs?: number;
  /** Extra tries per model for 429/5xx/network errors. */
  retries?: number;
  sleep?: (ms: number) => Promise<void>;
  log?: (message: string) => void;
}

export class LlmFatalError extends Error {}

export function parseModelList(value: string | undefined): string[] {
  const list = (value ?? '').split(',').map((s) => s.trim()).filter((s) => /^[a-z0-9][a-z0-9._-]*$/i.test(s));
  return list.length > 0 ? list : DEFAULT_MODELS;
}

/** Pulls the JSON object out of a model answer, tolerating code fences and a line of chatter around it. */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('no JSON object in the model answer');
  return JSON.parse(cleaned.slice(start, end + 1));
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  error?: { message?: string; details?: { retryDelay?: string }[] };
}

/** "retryDelay": "12s" from a 429 body, capped so a run never sleeps for minutes. */
function retryDelayMs(body: GeminiResponse | null, fallbackMs: number): number {
  const raw = body?.error?.details?.find((d) => d.retryDelay)?.retryDelay;
  const seconds = raw ? Number.parseFloat(raw) : NaN;
  return Number.isFinite(seconds) ? Math.min(Math.ceil(seconds * 1000) + 500, 60_000) : fallbackMs;
}

export function createGeminiLlm(opts: GeminiOptions): Llm {
  const apiKey = opts.apiKey.replace(/["']/g, '').trim();
  if (apiKey.length < 10) throw new LlmFatalError('GOOGLE_AI_KEY is empty or invalid');
  const models = opts.models?.length ? opts.models : DEFAULT_MODELS;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 180_000;
  const retries = opts.retries ?? 2;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const log = opts.log ?? (() => undefined);

  async function call(model: string, req: JsonRequest): Promise<{ ok: true; value: unknown } | { ok: false; status: number; waitMs: number; reason: string; nextModel: boolean }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: req.system }] },
          contents: [{ role: 'user', parts: [{ text: req.prompt }] }],
          generationConfig: {
            temperature: req.temperature ?? 0.2,
            maxOutputTokens: req.maxOutputTokens ?? 16_000,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      const body = (await res.json().catch(() => null)) as GeminiResponse | null;

      if (!res.ok) {
        const reason = body?.error?.message ?? `HTTP ${res.status}`;
        if (res.status === 401 || res.status === 403 || (res.status === 400 && /api key/i.test(reason))) {
          throw new LlmFatalError(`Gemini rejected the key: ${reason}`);
        }
        // 404: model retired. 429: its quota is used up. Both: another model may still work.
        return { ok: false, status: res.status, waitMs: retryDelayMs(body, 5000), reason, nextModel: res.status === 404 || res.status === 400 };
      }

      const candidate = body?.candidates?.[0];
      const text = (candidate?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? '').join('');
      if (!text.trim()) return { ok: false, status: 200, waitMs: 1000, reason: `empty answer (finishReason=${candidate?.finishReason ?? '?'})`, nextModel: false };
      if (candidate?.finishReason === 'MAX_TOKENS') return { ok: false, status: 200, waitMs: 0, reason: 'answer cut off (MAX_TOKENS)', nextModel: true };

      try {
        return { ok: true, value: extractJson(text) };
      } catch (e) {
        return { ok: false, status: 200, waitMs: 1000, reason: `invalid JSON: ${(e as Error).message}`, nextModel: false };
      }
    } catch (e) {
      if (e instanceof LlmFatalError) throw e;
      const aborted = (e as Error).name === 'AbortError';
      return { ok: false, status: 0, waitMs: 3000, reason: aborted ? `timeout after ${timeoutMs / 1000}s` : String(e), nextModel: false };
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    async json<T>(req: JsonRequest): Promise<T> {
      const failures: string[] = [];
      for (const model of models) {
        for (let attempt = 0; attempt <= retries; attempt++) {
          const result = await call(model, req);
          if (result.ok) return result.value as T;
          failures.push(`${model}#${attempt + 1}: ${result.reason}`);
          log(`Gemini ${model} attempt ${attempt + 1} failed: ${result.reason}`);
          if (result.nextModel || attempt === retries) break;
          await sleep(result.waitMs * (attempt + 1));
        }
      }
      throw new Error(`Gemini failed on every model. ${failures.slice(-4).join(' | ')}`);
    },
  };
}
