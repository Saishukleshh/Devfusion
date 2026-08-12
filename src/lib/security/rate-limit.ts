import { NextRequest } from 'next/server';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const ipMap = new Map<string, RateLimitStore>();

// Clean up expired IP keys periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, store] of ipMap.entries()) {
    if (now > store.resetTime) {
      ipMap.delete(ip);
    }
  }
}, 60000);

export function checkRateLimit(
  request: NextRequest,
  limit: number = 20,
  windowMs: number = 60000
): { success: boolean; remaining: number; reset: number } {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';
  const now = Date.now();

  const record = ipMap.get(ip);

  if (!record || now > record.resetTime) {
    ipMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, reset: record.resetTime };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count, reset: record.resetTime };
}
