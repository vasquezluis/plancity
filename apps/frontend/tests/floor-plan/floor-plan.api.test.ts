import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { postPlan } from '../../src/floor-plan/api/floor-plan.api';

const INPUT = { walls: [{ x1: 0, y1: 0, x2: 40, y2: 0 }], doors: [] };
const PLAN_DATA = { outlets: [], switches: [], panel: { x: 0, y: 0 }, wires: [] };

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('postPlan', () => {
  it('returns parsed plan data on a 200 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(PLAN_DATA), { status: 200 })
    );

    const result = await postPlan(INPUT);
    expect(result).toEqual(PLAN_DATA);
  });

  it('throws a RateLimitedError with retryAfter on a 429 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { 'Retry-After': '42' },
      })
    );

    const err = await postPlan(INPUT).catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Rate limit exceeded');
    expect(err.retryAfter).toBe(42);
  });

  it('uses default retryAfter of 60 when Retry-After header is absent on 429', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: new Headers(),
      })
    );

    const err = await postPlan(INPUT).catch((e) => e);

    expect(err).toBeInstanceOf(Error);
    expect(err.retryAfter).toBe(60);
  });

  it('throws a generic error message on non-429 server errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
      })
    );

    await expect(postPlan(INPUT)).rejects.toThrow('Internal server error');
  });
});
