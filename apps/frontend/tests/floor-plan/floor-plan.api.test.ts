import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { postPlan } from '../../src/floor-plan/api/floor-plan.api';

const INPUT = { walls: [{ x1: 0, y1: 0, x2: 40, y2: 0 }], doors: [] };
const PLAN_DATA = { outlets: [], switches: [], panel: { x: 0, y: 0 }, wires: [] };

function makeHeaders(overrides: Record<string, string> = {}): Headers {
  return new Headers({
    'X-RateLimit-Limit': '3',
    'X-RateLimit-Remaining': '2',
    'X-RateLimit-Reset': '9999999',
    ...overrides,
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('postPlan', () => {
  it('returns parsed data and rate limit info on a 200 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(PLAN_DATA), { status: 200, headers: makeHeaders() })
    );

    const result = await postPlan(INPUT);

    expect(result.data).toEqual(PLAN_DATA);
    expect(result.rateLimit).toEqual({ limit: 3, remaining: 2, resetAt: 9999999 });
  });

  it('uses default rate limit values when headers are absent', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(PLAN_DATA), { status: 200, headers: new Headers() })
    );

    const result = await postPlan(INPUT);

    // Defaults: limit=3, remaining=0, resetAt=0
    expect(result.rateLimit.limit).toBe(3);
    expect(result.rateLimit.remaining).toBe(0);
    expect(result.rateLimit.resetAt).toBe(0);
  });

  it('throws an error with rateLimit attached on a 429 response', async () => {
    const body = { error: 'Rate limit exceeded', retryAfter: 42 };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(body), {
        status: 429,
        headers: makeHeaders({ 'X-RateLimit-Remaining': '0' }),
      })
    );

    const err = await postPlan(INPUT).catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Rate limit exceeded');
    expect(err.rateLimit).toMatchObject({ remaining: 0 });
  });

  it('throws a generic error message on non-429 server errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: makeHeaders(),
      })
    );

    await expect(postPlan(INPUT)).rejects.toThrow('Internal server error');
  });
});
