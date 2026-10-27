import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_MODELS, LlmFatalError, createGeminiLlm, extractJson, parseModelList } from './llm';

const ok = (text: string, extra: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP', ...extra }] }), { status: 200 });
const fail = (status: number, message: string, details: unknown[] = []) => new Response(JSON.stringify({ error: { message, details } }), { status });

const REQ = { system: 'sys', prompt: 'hi' };
const KEY = 'AIzaSyDUMMY-KEY-1234567890';

function setup(responses: (() => Response)[], models = ['m1', 'm2']) {
  const queue = [...responses];
  const fetchImpl = vi.fn(async (...args: [string, RequestInit?]) => {
    void args;
    return (queue.shift() ?? (() => fail(500, 'no more')))();
  });
  const sleep = vi.fn(async () => undefined);
  const llm = createGeminiLlm({ apiKey: KEY, models, fetchImpl: fetchImpl as unknown as typeof fetch, sleep, retries: 1 });
  return { llm, fetchImpl, sleep };
}

describe('extractJson', () => {
  it('handles fences and chatter around the object', () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Sure! Here it is: {"a":{"b":2}} Hope that helps')).toEqual({ a: { b: 2 } });
  });
  it('throws when there is no object', () => {
    expect(() => extractJson('nothing here')).toThrow(/no JSON/);
  });
});

describe('parseModelList', () => {
  it('uses the default list when nothing valid is configured', () => {
    expect(parseModelList(undefined)).toEqual(DEFAULT_MODELS);
    expect(parseModelList('  ')).toEqual(DEFAULT_MODELS);
    expect(parseModelList('bad model!, ')).toEqual(DEFAULT_MODELS);
  });
  it('parses a comma list', () => {
    expect(parseModelList('gemini-3.8-flash, gemini-3.5-flash-lite')).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
  });
  it('defaults to models that are not the retired 2.5 generation', () => {
    expect(DEFAULT_MODELS.join()).not.toMatch(/2\.5/);
  });
});

describe('createGeminiLlm', () => {
  it('rejects an empty key up front', () => {
    expect(() => createGeminiLlm({ apiKey: '"" ' })).toThrow(LlmFatalError);
  });

  it('sends the key as a header (not in the URL), JSON mode, and the system prompt', async () => {
    const { llm, fetchImpl } = setup([() => ok('{"x":1}')]);
    await expect(llm.json({ ...REQ, temperature: 0.1 })).resolves.toEqual({ x: 1 });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/m1:generateContent');
    expect(url).not.toContain(KEY);
    expect((init!.headers as Record<string, string>)['x-goog-api-key']).toBe(KEY);
    const body = JSON.parse(init!.body as string);
    expect(body.generationConfig).toMatchObject({ temperature: 0.1, responseMimeType: 'application/json' });
    expect(body.systemInstruction.parts[0].text).toBe('sys');
  });

  it('ignores thinking parts', async () => {
    const res = new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'reasoning...', thought: true }, { text: '{"x":2}' }] }, finishReason: 'STOP' }] }), { status: 200 });
    const { llm } = setup([() => res]);
    await expect(llm.json(REQ)).resolves.toEqual({ x: 2 });
  });

  it('moves to the next model when one is gone (404)', async () => {
    const { llm, fetchImpl } = setup([() => fail(404, 'model not found'), () => ok('{"ok":true}')]);
    await expect(llm.json(REQ)).resolves.toEqual({ ok: true });
    expect(String(fetchImpl.mock.calls[1][0])).toContain('/models/m2:');
  });

  it('waits for the suggested time on 429 and retries the same model', async () => {
    const { llm, fetchImpl, sleep } = setup([() => fail(429, 'quota', [{ retryDelay: '12s' }]), () => ok('{"ok":true}')]);
    await expect(llm.json(REQ)).resolves.toEqual({ ok: true });
    expect(String(fetchImpl.mock.calls[1][0])).toContain('/models/m1:');
    expect(sleep).toHaveBeenCalledWith(12_500);
  });

  it('falls through to the next model after the retries on one are spent', async () => {
    const { llm, fetchImpl } = setup([() => fail(503, 'overloaded'), () => fail(503, 'overloaded'), () => ok('{"ok":true}')]);
    await expect(llm.json(REQ)).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(String(fetchImpl.mock.calls[2][0])).toContain('/models/m2:');
  });

  it('treats a cut-off answer as a reason to switch model, and bad JSON as a reason to retry', async () => {
    const cut = () => ok('{"half":', { finishReason: 'MAX_TOKENS' });
    const { llm, fetchImpl } = setup([cut, () => ok('not json at all'), () => ok('{"fine":true}')]);
    await expect(llm.json(REQ)).resolves.toEqual({ fine: true });
    expect(String(fetchImpl.mock.calls[1][0])).toContain('/models/m2:');
  });

  it('stops at once on a rejected key instead of burning every model', async () => {
    const { llm, fetchImpl } = setup([() => fail(400, 'API key not valid. Please pass a valid API key.')]);
    await expect(llm.json(REQ)).rejects.toBeInstanceOf(LlmFatalError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries after a network error, and reports everything if every model fails', async () => {
    const { llm } = setup([() => { throw new Error('socket hang up'); }, () => fail(500, 'x'), () => fail(500, 'x'), () => fail(500, 'x')]);
    await expect(llm.json(REQ)).rejects.toThrow(/Gemini failed on every model/);
  });
});
