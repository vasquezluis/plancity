import type { FloorPlanInput, GenerateResponse } from '../types';

export async function postPlan(input: FloorPlanInput): Promise<GenerateResponse> {
  const res = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Server error ${res.status}`);
  }
  return res.json() as Promise<GenerateResponse>;
}
