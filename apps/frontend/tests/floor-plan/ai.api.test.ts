import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { postAiAnalysis } from '../../src/floor-plan/api/ai.api';
import type { FloorPlanInput, GenerateResponse } from '../../src/types';

const sampleInput: FloorPlanInput = {
  walls: [{ x1: 0, y1: 0, x2: 300, y2: 0 }],
  doors: [{ x: 50, y: 0 }],
};

const sampleLayout: GenerateResponse = {
  outlets: [
    { x: 100, y: 0 },
    { x: 200, y: 0 },
  ],
  switches: [{ x: 75, y: 0 }],
  panel: { x: 0, y: 0 },
  wires: [
    [
      { x: 100, y: 0 },
      { x: 0, y: 0 },
    ],
  ],
};

describe('postAiAnalysis', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an enhanced layout with changes on 200 response', async () => {
    const mockResponse = {
      outlets: [{ x: 120, y: 0 }],
      switches: [{ x: 75, y: 0 }],
      panel: { x: 0, y: 0 },
      wires: [
        [
          { x: 120, y: 0 },
          { x: 0, y: 0 },
        ],
      ],
      changes: ['Moved outlet to improve spacing'],
      explanation: 'Spacing is now more even across the wall.',
    };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await postAiAnalysis(sampleInput, sampleLayout, 'm');
    expect(result.outlets).toHaveLength(1);
    expect(result.wires).toBeDefined();
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toContain('outlet');
    expect(result.explanation).toBe('Spacing is now more even across the wall.');
  });

  it('sends merged walls + doors + layout + unit in the request body', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        outlets: [],
        switches: [],
        panel: { x: 0, y: 0 },
        wires: [],
        changes: [],
        explanation: '',
      }),
    });

    await postAiAnalysis(sampleInput, sampleLayout, 'ft');

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.walls).toBeDefined();
    expect(body.outlets).toBeDefined();
    expect(body.wires).toBeDefined();
    expect(body.unit).toBe('ft');
  });

  it('throws on non-ok response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'AI service not configured' }),
    });

    await expect(postAiAnalysis(sampleInput, sampleLayout, 'm')).rejects.toThrow(
      'AI service not configured'
    );
  });
});
