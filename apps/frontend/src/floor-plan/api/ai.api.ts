import type { AiEnhancedResponse, FloorPlanInput, GenerateResponse } from '../../types';

export async function postAiAnalysis(
  input: FloorPlanInput,
  layout: GenerateResponse,
  unit: 'm' | 'ft'
): Promise<AiEnhancedResponse> {
  const res = await fetch('/api/plan/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, ...layout, unit }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Server error ${res.status}`);
  }

  return (await res.json()) as AiEnhancedResponse;
}
