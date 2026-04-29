const buckets = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function checkLoginRateLimit(email: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(email);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(email, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (bucket.count >= MAX_ATTEMPTS) return false;
  bucket.count += 1;
  return true;
}

export function resetLoginRateLimit(email: string): void {
  buckets.delete(email);
}
