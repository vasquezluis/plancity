import type { FloorPlanInput, GenerateResponse } from '../../types';
import type { PlanResponse, RateLimitInfo } from '../types/floor-plan.types';

function parseRateLimit(headers: Headers): RateLimitInfo {
  return {
    limit: Number(headers.get('X-RateLimit-Limit') ?? 3),
    remaining: Number(headers.get('X-RateLimit-Remaining') ?? 0),
    resetAt: Number(headers.get('X-RateLimit-Reset') ?? 0),
  };
}

export async function postPlan(input: FloorPlanInput): Promise<PlanResponse> {
  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const rateLimit = parseRateLimit(res.headers);

  if (res.status === 429) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; retryAfter?: number };
    const err = new Error(body.error ?? 'Rate limit exceeded') as Error & {
      rateLimit: RateLimitInfo;
    };
    err.rateLimit = rateLimit;
    throw err;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Server error ${res.status}`);
  }

  const data = (await res.json()) as GenerateResponse;
  return { data, rateLimit };
}
