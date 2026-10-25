import { describe, expect, it } from 'vitest';
import { BusyError, DEFAULT_ORIGINS, createGate, createRateLimiter, parseOrigins } from './http';

describe('parseOrigins', () => {
  it('defaults to the canonical www site, the bare domain and local development', () => {
    expect(parseOrigins(undefined)).toEqual(DEFAULT_ORIGINS);
    expect(parseOrigins('  ,, ')).toEqual(DEFAULT_ORIGINS);
    expect(DEFAULT_ORIGINS).toContain('https://www.duxtur.org');
  });

  it('parses a comma list, trimming spaces and trailing slashes', () => {
    expect(parseOrigins('https://a.example/, https://b.example')).toEqual(['https://a.example', 'https://b.example']);
  });
});

describe('createRateLimiter', () => {
  it('allows `limit` hits per window per key, then blocks until the window ends', () => {
    let now = 1000;
    const limiter = createRateLimiter(3, 60_000, () => now);
    expect([1, 2, 3, 4].map(() => limiter.hit('ip'))).toEqual([true, true, true, false]);
    expect(limiter.hit('other')).toBe(true);
    now += 60_001;
    expect(limiter.hit('ip')).toBe(true);
  });

  it('drops expired windows, so new addresses cannot grow it without bound', () => {
    let now = 0;
    const limiter = createRateLimiter(1, 1000, () => now);
    for (let i = 0; i < 5001; i++) limiter.hit(`ip${i}`);
    expect(limiter.size()).toBe(5001);
    now = 5000;
    limiter.hit('fresh');
    expect(limiter.size()).toBe(1);
  });
});

describe('createGate', () => {
  const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => (resolve = r));
    return { promise, resolve };
  };

  it('runs tasks one at a time, in order', async () => {
    const gate = createGate(1, 5);
    const order: string[] = [];
    const first = deferred();
    const a = gate.run(async () => {
      order.push('a:start');
      await first.promise;
      order.push('a:end');
    });
    const b = gate.run(async () => void order.push('b'));
    await Promise.resolve();
    expect(gate.stats()).toEqual({ running: 1, waiting: 1 });
    first.resolve();
    await Promise.all([a, b]);
    expect(order).toEqual(['a:start', 'a:end', 'b']);
  });

  it('refuses at once when the queue is full instead of piling work onto a small instance', async () => {
    const gate = createGate(1, 1);
    const hold = deferred();
    const running = gate.run(() => hold.promise);
    const queued = gate.run(async () => 'queued');
    await expect(gate.run(async () => 'too many')).rejects.toBeInstanceOf(BusyError);
    hold.resolve();
    await running;
    await expect(queued).resolves.toBe('queued');
  });

  it('releases its place when a task fails', async () => {
    const gate = createGate(1, 1);
    await expect(gate.run(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await expect(gate.run(async () => 'next')).resolves.toBe('next');
    expect(gate.stats()).toEqual({ running: 0, waiting: 0 });
  });
});
