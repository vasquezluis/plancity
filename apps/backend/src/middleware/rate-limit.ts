import { rateLimit } from 'express-rate-limit';

const LIMIT = 5;
const WINDOW_MS = 60_000; // 1 minute

/**
 * Factory that creates a fresh limiter with its own MemoryStore.
 * Reason: each rateLimit() call creates an independent store, so tests can
 * call this instead of vi.resetModules() to get isolated request counters.
 */
export function createRateLimiter() {
  return rateLimit({
    windowMs: WINDOW_MS,
    limit: LIMIT,
    legacyHeaders: true, // X-RateLimit-Limit / X-RateLimit-Remaining / X-RateLimit-Reset
    standardHeaders: 'draft-8',
    message: { error: 'Rate limit exceeded' },
    statusCode: 429,
  });
}

export const rateLimitMiddleware = createRateLimiter();
