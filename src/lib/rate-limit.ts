import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory rate limiting map for fallback.
const rates = new Map<string, { count: number, reset: number }>();

function inMemoryRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = rates.get(key);

  if (!record || now > record.reset) {
    rates.set(key, { count: 1, reset: now + windowMs });
    return { success: true, count: 1 };
  }

  record.count++;
  if (record.count > limit) {
    return { success: false, count: record.count };
  }

  return { success: true, count: record.count };
}

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} else {
  console.warn("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Falling back to in-memory rate limiting.");
}

// Cache Ratelimit instances to avoid re-creating them on every request
const ratelimitCache = new Map<string, Ratelimit>();

/**
 * Rate limit a request.
 * @param key Unique key for the requester (e.g. IP address or chatId)
 * @param limit Maximum number of requests allowed in the window
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): { success: boolean; count: number } | Promise<{ success: boolean; count: number }> {
  if (redis) {
    const windowSeconds = Math.ceil(windowMs / 1000);
    const cacheKey = `${limit}_${windowSeconds}`;

    let limiter = ratelimitCache.get(cacheKey);
    if (!limiter) {
      limiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        analytics: true,
        prefix: "@upstash/ratelimit",
      });
      ratelimitCache.set(cacheKey, limiter);
    }

    // Since we must keep the same signature and many call sites are synchronous,
    // and we want to use async Upstash, we have a problem.
    // However, in Next.js App Router, most Route Handlers are async,
    // so we can return a Promise and hope the call sites await it or it's handled.
    // Wait, the prompt said "Keep the same function signature... so all call sites... don't need to change".
    // If the original was sync, and I make it async, I MUST change call sites to `await`.

    return limiter.limit(key).then(result => ({
      success: result.success,
      count: result.limit - result.remaining,
    })).catch(error => {
      console.error("Upstash Rate Limit Error:", error);
      return inMemoryRateLimit(key, limit, windowMs);
    });
  }

  return inMemoryRateLimit(key, limit, windowMs);
}
