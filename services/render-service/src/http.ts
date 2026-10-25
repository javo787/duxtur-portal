import type { NextFunction, Request, Response } from 'express';

/** Origins that may call the service from a browser. The site is canonical on www; the bare domain redirects to it. */
export const DEFAULT_ORIGINS = ['https://www.duxtur.org', 'https://duxtur.org', 'http://localhost:3000'];

export function parseOrigins(value: string | undefined): string[] {
  const list = (value ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return list.length > 0 ? list : DEFAULT_ORIGINS;
}

/** CORS for GET endpoints: only the listed origins get the header, so the renderer is not an open service for other sites. */
export function corsMiddleware(allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    res.setHeader('Vary', 'Origin');
    if (origin && allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  };
}

export interface RateLimiter {
  /** true = allowed. */
  hit(key: string): boolean;
  size(): number;
}

/** Fixed-window limiter in memory. Expired windows are dropped, so a stream of new addresses cannot grow it forever. */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now): RateLimiter {
  const hits = new Map<string, { count: number; reset: number }>();
  return {
    hit(key) {
      const t = now();
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (t > v.reset) hits.delete(k);
      }
      let entry = hits.get(key);
      if (!entry || t > entry.reset) {
        entry = { count: 0, reset: t + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      return entry.count <= limit;
    },
    size: () => hits.size,
  };
}

export class BusyError extends Error {
  constructor() {
    super('renderer is busy');
  }
}

export interface Gate {
  run<T>(task: () => Promise<T>): Promise<T>;
  stats(): { running: number; waiting: number };
}

/**
 * Lets `maxConcurrent` tasks run at once and queues up to `maxWaiting` more; beyond that it throws BusyError at once.
 * The renderer runs one page at a time: on a 512 MB instance a second Chromium page is how the process gets killed.
 */
export function createGate(maxConcurrent: number, maxWaiting: number): Gate {
  let running = 0;
  const waiting: (() => void)[] = [];

  const release = () => {
    running -= 1;
    const next = waiting.shift();
    if (next) next();
  };

  return {
    async run<T>(task: () => Promise<T>): Promise<T> {
      if (running >= maxConcurrent) {
        if (waiting.length >= maxWaiting) throw new BusyError();
        await new Promise<void>((resolve) => waiting.push(resolve));
      }
      running += 1;
      try {
        return await task();
      } finally {
        release();
      }
    },
    stats: () => ({ running, waiting: waiting.length }),
  };
}
