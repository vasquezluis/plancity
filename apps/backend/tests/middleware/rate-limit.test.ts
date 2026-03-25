import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRateLimiter } from '../../src/middleware/rate-limit.js';

// express-rate-limit middleware is async — always await calls in tests.
// Each test uses createRateLimiter() to get a fresh MemoryStore so state
// does not leak between tests (no need for vi.resetModules()).

type Limiter = ReturnType<typeof createRateLimiter>;

function makeReq(ip = '127.0.0.1'): Request {
  // Reason: express-rate-limit v8 checks req.app.get('trust proxy fn') and
  // req.headers for proxy-related validation. Providing stubs avoids stderr warnings.
  return {
    ip,
    app: { get: () => undefined },
    headers: {},
  } as unknown as Request;
}

function makeRes() {
  const headers: Record<string, number | string> = {};
  let statusCode = 200;
  let body: unknown = null;

  return {
    // express-rate-limit calls res.setHeader() for legacy X-RateLimit-* headers
    // and res.append() for draft-8 RateLimit headers (which can have multiple values).
    setHeader: (name: string, value: string | number) => {
      headers[name] = value;
    },
    append: (name: string, value: string | number) => {
      headers[name] = value;
    },
    // express-rate-limit calls res.status() then res.json() separately (not chained)
    status: (code: number) => {
      statusCode = code;
    },
    json: (data: unknown) => {
      body = data;
    },
    send: (data: unknown) => {
      body = data;
    },
    getHeaders: () => headers,
    getStatus: () => statusCode,
    getBody: () => body,
  };
}

// Helper: call limiter and return res so assertions can read it
async function hit(limiter: Limiter, next: ReturnType<typeof vi.fn>, ip = '127.0.0.1') {
  const res = makeRes();
  await limiter(makeReq(ip), res as unknown as Response, next as unknown as NextFunction);
  return res;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('rateLimitMiddleware (express-rate-limit)', () => {
  it('allows requests under the limit and calls next', async () => {
    const limiter = createRateLimiter();
    const next = vi.fn();
    for (let i = 0; i < 5; i++) {
      await hit(limiter, next);
    }
    expect(next).toHaveBeenCalledTimes(5);
  });

  it('blocks the 6th request with 429 and remaining=0', async () => {
    const limiter = createRateLimiter();
    const next = vi.fn();
    for (let i = 0; i < 5; i++) {
      await hit(limiter, next);
    }
    const res = await hit(limiter, next);

    expect(next).toHaveBeenCalledTimes(5); // 6th was blocked
    expect(res.getStatus()).toBe(429);
    expect(Number(res.getHeaders()['X-RateLimit-Remaining'])).toBe(0);
    expect((res.getBody() as { error: string }).error).toBe('Rate limit exceeded');
  });

  it('allows requests again after the window expires', async () => {
    const limiter = createRateLimiter();
    const next = vi.fn();

    for (let i = 0; i < 5; i++) {
      await hit(limiter, next);
    }

    // Advance past the 1-minute fixed window
    vi.advanceTimersByTime(61_000);

    const res = await hit(limiter, next);
    expect(next).toHaveBeenCalledTimes(6);
    expect(res.getStatus()).toBe(200); // not overridden → still default
  });

  it('X-RateLimit-Reset is anchored to window start (fixed window)', async () => {
    const t0 = 1_000_000_000_000; // round ms
    vi.setSystemTime(t0);
    const limiter = createRateLimiter();
    const next = vi.fn();

    // First request opens the window at t0 → resetTime = t0 + 60s
    await hit(limiter, next);
    vi.advanceTimersByTime(10_000); // T = t0+10s
    await hit(limiter, next);
    vi.advanceTimersByTime(20_000); // T = t0+30s
    const lastAllowedRes = await hit(limiter, next);

    // Fixed window: reset is always at window-open + windowMs, regardless of when
    // subsequent requests arrive within the window.
    const expectedReset = (t0 + 60_000) / 1000;
    expect(Number(lastAllowedRes.getHeaders()['X-RateLimit-Reset'])).toBe(expectedReset);
  });

  it('X-RateLimit-Reset on 429 equals window-open + windowMs', async () => {
    const t0 = 1_000_000_000_000;
    vi.setSystemTime(t0);
    const limiter = createRateLimiter();
    const next = vi.fn();

    await hit(limiter, next); // t0 — opens window, resetTime = t0 + 60s
    vi.advanceTimersByTime(10_000);
    await hit(limiter, next);
    vi.advanceTimersByTime(10_000);
    await hit(limiter, next); // t0+20s
    vi.advanceTimersByTime(10_000);
    await hit(limiter, next); // t0+30s
    vi.advanceTimersByTime(10_000);
    await hit(limiter, next); // t0+40s — 5th (limit reached)

    const blockedRes = await hit(limiter, next); // 6th → 429
    expect(blockedRes.getStatus()).toBe(429);

    // Fixed window: reset anchored to t0+60s, not the latest request
    const expectedReset = (t0 + 60_000) / 1000;
    expect(Number(blockedRes.getHeaders()['X-RateLimit-Reset'])).toBe(expectedReset);
  });

  it('allows 5 full requests after the window expires', async () => {
    const t0 = 1_000_000_000_000;
    vi.setSystemTime(t0);
    const limiter = createRateLimiter();
    const next = vi.fn();

    // Exhaust limit: t0, t0+10s, t0+20s, t0+30s, t0+40s
    await hit(limiter, next);
    vi.advanceTimersByTime(10_000);
    await hit(limiter, next);
    vi.advanceTimersByTime(10_000);
    await hit(limiter, next);
    vi.advanceTimersByTime(10_000);
    await hit(limiter, next);
    vi.advanceTimersByTime(10_000);
    await hit(limiter, next);
    expect(next).toHaveBeenCalledTimes(5);

    // Advance past fixed window expiry (t0 + 60s → currently at t0+40s, advance 60001ms)
    vi.advanceTimersByTime(60_001); // now = t0+100.001s > t0+60s window expiry

    const r1 = await hit(limiter, next);
    const r2 = await hit(limiter, next);
    const r3 = await hit(limiter, next);

    expect(next).toHaveBeenCalledTimes(8);
    expect(Number(r1.getHeaders()['X-RateLimit-Remaining'])).toBe(4);
    expect(Number(r2.getHeaders()['X-RateLimit-Remaining'])).toBe(3);
    expect(Number(r3.getHeaders()['X-RateLimit-Remaining'])).toBe(2);
  });

  it('does not share rate limit state between different IPs', async () => {
    const limiter = createRateLimiter();
    const next = vi.fn();

    // Exhaust for IP A
    for (let i = 0; i < 5; i++) {
      await hit(limiter, next, '1.2.3.4');
    }
    // IP B should still have full quota
    const res = await hit(limiter, next, '9.9.9.9');

    expect(next).toHaveBeenCalledTimes(6);
    expect(Number(res.getHeaders()['X-RateLimit-Remaining'])).toBe(4);
  });
});
