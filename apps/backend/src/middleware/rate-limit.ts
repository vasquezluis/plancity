import type { NextFunction, Request, Response } from 'express';

const LIMIT = 3;
const WINDOW_MS = 60_000; // 1 minute

// Map<ip, array of request timestamps within the current window>
const requestLog = new Map<string, number[]>();

/**
 * In-memory sliding-window rate limiter: 3 requests per minute per IP.
 * Returns standard X-RateLimit-* headers on every response.
 * Returns 429 Too Many Requests when the limit is exceeded.
 *
 * Reason: resetAt is always "newest timestamp in window + WINDOW_MS".
 * This tells the client when ALL slots are free again, not just when the
 * oldest slot opens up. Using the oldest timestamp caused a bug where the
 * client re-enabled the button too early and got immediately rate-limited
 * on the very next request.
 */
export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Get existing timestamps, drop entries older than the window
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => t > windowStart);

  res.setHeader('X-RateLimit-Limit', LIMIT);

  if (timestamps.length >= LIMIT) {
    // Blocked: resetAt = when the newest existing entry expires (all slots free after that)
    const resetAt = timestamps[timestamps.length - 1] + WINDOW_MS;
    res.setHeader('X-RateLimit-Remaining', 0);
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((resetAt - now) / 1000),
    });
    return;
  }

  // Allowed: push this request — `now` becomes the newest timestamp in the window
  timestamps.push(now);
  requestLog.set(ip, timestamps);

  // resetAt = now + WINDOW_MS (current request is the newest, so reset when it expires)
  const resetAt = now + WINDOW_MS;
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetAt / 1000));
  res.setHeader('X-RateLimit-Remaining', LIMIT - timestamps.length);

  next();
}
