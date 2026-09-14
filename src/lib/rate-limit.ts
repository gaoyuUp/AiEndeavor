type Bucket = { count: number; resetAt: number };

const globalStore = globalThis as unknown as { rateLimitBuckets?: Map<string, Bucket> };
const buckets = globalStore.rateLimitBuckets ?? new Map<string, Bucket>();
if (process.env.NODE_ENV !== "production") globalStore.rateLimitBuckets = buckets;

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  current.count += 1;
  return { allowed: current.count <= limit, remaining: Math.max(0, limit - current.count) };
}

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
