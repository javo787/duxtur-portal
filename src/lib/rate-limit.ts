// In-memory rate limiting map.
// Note: This resets on serverless cold starts, which is acceptable for basic abuse prevention.
const rates = new Map<string, { count: number, reset: number }>();

export function rateLimit(ip: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = rates.get(ip);

  if (!record || now > record.reset) {
    rates.set(ip, { count: 1, reset: now + windowMs });
    return { success: true, count: 1 };
  }

  record.count++;
  if (record.count > limit) {
    return { success: false, count: record.count };
  }

  return { success: true, count: record.count };
}
