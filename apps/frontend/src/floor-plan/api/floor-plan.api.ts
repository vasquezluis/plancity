import type { FloorPlanInput, GenerateResponse } from '../../types';

export type RateLimitedError = Error & { retryAfter: number };

export async function postPlan(input: FloorPlanInput): Promise<GenerateResponse> {
  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (res.status === 429) {
    // defined on the backend. This avoids parsing the complex draft-8 RateLimit headers.
    const retryAfter = Number(res.headers.get('Retry-After') ?? 60);
    const err = new Error('Rate limit exceeded') as RateLimitedError;
    err.retryAfter = retryAfter;
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Server error ${res.status}`);
  }

  return res.json() as Promise<GenerateResponse>;
}
