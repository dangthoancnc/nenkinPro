interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store. In production, consider using Redis.
const rateLimiter = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip: string, identifier: string): boolean {
  const now = Date.now();
  const key = `${ip}:${identifier}`;
  
  const record = rateLimiter.get(key);
  
  if (record) {
    if (now > record.resetAt) {
      rateLimiter.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return true;
    }
    
    if (record.count >= MAX_ATTEMPTS) {
      return false; // Rate limited
    }
    
    record.count += 1;
    rateLimiter.set(key, record);
    return true;
  }
  
  rateLimiter.set(key, { count: 1, resetAt: now + WINDOW_MS });
  return true;
}

export function resetRateLimit(ip: string, identifier: string) {
  const key = `${ip}:${identifier}`;
  rateLimiter.delete(key);
}
