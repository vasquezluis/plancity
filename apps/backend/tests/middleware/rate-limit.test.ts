import type { NextFunction, Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// We re-import the module fresh each test so the in-memory map resets
// by mocking Date.now to control time.

let rateLimitMiddleware: (req: Request, res: Response, next: NextFunction) => void;

function makeReq(ip = '127.0.0.1'): Request {
  return { ip } as unknown as Request;
}

function makeRes() {
  const headers: Record<string, number | string> = {};
  let statusCode = 200;
  let body: unknown = null;

  return {
    setHeader: (name: string, value: string | number) => {
      headers[name] = value;
    },
    status: (code: number) => {
      statusCode = code;
      return {
        json: (data: unknown) => {
          body = data;
        },
      };
    },
    getHeaders: () => headers,
    getStatus: () => statusCode,
    getBody: () => body,
  };
}

beforeEach(async () => {
  // Isolate module so the requestLog Map starts empty each test
  vi.resetModules();
  const mod = await import('../../src/middleware/rate-limit.js');
  rateLimitMiddleware = mod.rateLimitMiddleware;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('rateLimitMiddleware', () => {
  it('allows requests under the limit and sets correct headers', () => {
    const next = vi.fn();
    for (let i = 0; i < 3; i++) {
      const res = makeRes();
      rateLimitMiddleware(makeReq(), res as unknown as Response, next);
    }
    expect(next).toHaveBeenCalledTimes(3);
  });

  it('blocks the 4th request with 429 and remaining=0', () => {
    const next = vi.fn();
    // Use up all 3 slots
    for (let i = 0; i < 3; i++) {
      rateLimitMiddleware(makeReq(), makeRes() as unknown as Response, next);
    }
    // 4th request should be blocked
    const res = makeRes();
    rateLimitMiddleware(makeReq(), res as unknown as Response, next);

    expect(next).toHaveBeenCalledTimes(3); // still 3, 4th was blocked
    expect(res.getStatus()).toBe(429);
    expect(res.getHeaders()['X-RateLimit-Remaining']).toBe(0);
    expect((res.getBody() as { error: string }).error).toBe('Rate limit exceeded');
  });

  it('allows requests again after the window expires', async () => {
    vi.useFakeTimers();
    const next = vi.fn();

    // Exhaust limit
    for (let i = 0; i < 3; i++) {
      rateLimitMiddleware(makeReq(), makeRes() as unknown as Response, next);
    }

    // Advance time beyond 1-minute window
    vi.advanceTimersByTime(61_000);

    const res = makeRes();
    rateLimitMiddleware(makeReq(), res as unknown as Response, next);

    expect(next).toHaveBeenCalledTimes(4);
    expect(res.getStatus()).toBe(200); // not overridden → still default
  });

  it('X-RateLimit-Reset on last allowed request equals now+window (newest timestamp)', () => {
    vi.useFakeTimers();
    // Use a round number so Math.ceil is predictable
    const t0 = 1_000_000_000_000; // round ms
    vi.setSystemTime(t0);
    const next = vi.fn();

    rateLimitMiddleware(makeReq(), makeRes() as unknown as Response, next); // T=t0
    vi.advanceTimersByTime(10_000); // T=t0+10s
    rateLimitMiddleware(makeReq(), makeRes() as unknown as Response, next);
    vi.advanceTimersByTime(20_000); // T=t0+30s
    const lastAllowedRes = makeRes();
    rateLimitMiddleware(makeReq(), lastAllowedRes as unknown as Response, next); // T=t0+30s

    // resetAt = now (t0+30s) + 60s = t0+90s — when this (newest) entry expires
    const expectedReset = (t0 + 30_000 + 60_000) / 1000; // already a round number
    expect(lastAllowedRes.getHeaders()['X-RateLimit-Reset']).toBe(expectedReset);
  });

  it('X-RateLimit-Reset on 429 equals newest_in_window + window (regression: was using oldest)', () => {
    vi.useFakeTimers();
    const t0 = 1_000_000_000_000;
    vi.setSystemTime(t0);
    const next = vi.fn();

    // 3 requests spread over 20s: T=t0, T=t0+10s, T=t0+20s
    rateLimitMiddleware(makeReq(), makeRes() as unknown as Response, next);
    vi.advanceTimersByTime(10_000);
    rateLimitMiddleware(makeReq(), makeRes() as unknown as Response, next);
    vi.advanceTimersByTime(10_000);
    rateLimitMiddleware(makeReq(), makeRes() as unknown as Response, next); // t0+20s (3rd, remaining=0)

    // 4th request → 429
    const blockedRes = makeRes();
    rateLimitMiddleware(makeReq(), blockedRes as unknown as Response, next);
    expect(blockedRes.getStatus()).toBe(429);

    // Old bug: resetAt = t0+60s (oldest). Frontend re-enables at t0+60s but
    // t0+10s and t0+20s entries still in window → immediately rate-limited after 1 request.
    // Fix: resetAt = t0+20s+60s = t0+80s (newest). Window is fully clear at t0+80s.
    const expectedReset = (t0 + 20_000 + 60_000) / 1000;
    expect(blockedRes.getHeaders()['X-RateLimit-Reset']).toBe(expectedReset);
  });

  it('allows 3 full requests after window fully clears at newest+window', () => {
    vi.useFakeTimers();
    const t0 = 1_000_000_000_000;
    vi.setSystemTime(t0);
    const next = vi.fn();

    // Exhaust limit: t0, t0+10s, t0+20s
    rateLimitMiddleware(makeReq(), makeRes() as unknown as Response, next);
    vi.advanceTimersByTime(10_000);
    rateLimitMiddleware(makeReq(), makeRes() as unknown as Response, next);
    vi.advanceTimersByTime(10_000);
    rateLimitMiddleware(makeReq(), makeRes() as unknown as Response, next);
    expect(next).toHaveBeenCalledTimes(3);

    // Advance just past t0+20s+60s = t0+80s → window fully empty
    vi.advanceTimersByTime(60_001); // now = t0+80.001s

    // All 3 slots should be available again
    const r1 = makeRes();
    const r2 = makeRes();
    const r3 = makeRes();
    rateLimitMiddleware(makeReq(), r1 as unknown as Response, next);
    rateLimitMiddleware(makeReq(), r2 as unknown as Response, next);
    rateLimitMiddleware(makeReq(), r3 as unknown as Response, next);

    expect(next).toHaveBeenCalledTimes(6); // 3 original + 3 new
    expect(r1.getHeaders()['X-RateLimit-Remaining']).toBe(2);
    expect(r2.getHeaders()['X-RateLimit-Remaining']).toBe(1);
    expect(r3.getHeaders()['X-RateLimit-Remaining']).toBe(0);
  });

  it('does not share rate limit state between different IPs', () => {
    const next = vi.fn();
    // Exhaust for IP A
    for (let i = 0; i < 3; i++) {
      rateLimitMiddleware(makeReq('1.2.3.4'), makeRes() as unknown as Response, next);
    }
    // IP B should still have full quota
    const res = makeRes();
    rateLimitMiddleware(makeReq('9.9.9.9'), res as unknown as Response, next);

    expect(next).toHaveBeenCalledTimes(4);
    expect(res.getHeaders()['X-RateLimit-Remaining']).toBe(2);
  });
});
