// Rate limiting for the Next.js auth endpoints (login, register,
// forgot/reset password, verify). These are the brute-force targets,
// so they get small fixed budgets per client IP.
//
// Store: in-memory sliding window, per server process. Right for a
// single Node instance (this app today); if the frontend ever runs
// serverless/multi-instance, swap `hit` for a Redis/Upstash-backed
// implementation — the call sites don't change.

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

// Periodic sweep so abandoned buckets don't accumulate forever.
const SWEEP_EVERY_MS = 10 * 60_000;
let lastSweep = Date.now();

function sweep(now: number, windowMs: number) {
  if (now - lastSweep < SWEEP_EVERY_MS) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (!b.timestamps.some((t) => now - t < windowMs)) buckets.delete(key);
  }
}

export type LimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/** Records a hit for `key` and reports whether it is within budget. */
export function hit(key: string, limit: number, windowMs: number): LimitResult {
  const now = Date.now();
  sweep(now, windowMs);
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    const oldest = bucket.timestamps[0];
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return {
    ok: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/** Client IP from proxy headers; falls back to a shared "unknown" key. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** 429 JSON response with Retry-After, shaped like the Express API. */
export function tooMany(result: LimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "too_many_requests",
      retryAfterSeconds: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}

// Budgets per endpoint (per IP). Genuine users: a real person retries a
// password a handful of times, registers once, forgets a password
// rarely — none of these will ever see a 429.
export const LIMITS = {
  // Credentials sign-in attempts (Auth.js callback).
  login: { limit: 10, windowMs: 5 * 60_000 },
  // Account creation.
  register: { limit: 5, windowMs: 15 * 60_000 },
  // Password-reset requests (also stops email-spam via our mailer).
  forgot: { limit: 5, windowMs: 15 * 60_000 },
  // Reset-token consumption attempts (token guessing).
  reset: { limit: 10, windowMs: 15 * 60_000 },
  // Email-verification link attempts (token guessing).
  verify: { limit: 20, windowMs: 15 * 60_000 },
} as const;

/** One-line guard for route handlers: returns a 429 Response or null. */
export function guard(
  req: Request,
  name: keyof typeof LIMITS
): Response | null {
  const { limit, windowMs } = LIMITS[name];
  const result = hit(`${name}:${clientIp(req)}`, limit, windowMs);
  return result.ok ? null : tooMany(result);
}

/** Test hook. */
export function resetAllBuckets() {
  buckets.clear();
}
