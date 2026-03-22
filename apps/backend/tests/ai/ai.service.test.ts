import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AiAnalysisInput } from '../../src/ai/ai.schema';

const mockGenerateObject = vi.hoisted(() => vi.fn());

vi.mock('ai', () => ({
  generateObject: mockGenerateObject,
}));

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'mocked-model'),
}));

// routeWires is pure — let it run for real to verify wires are produced
vi.mock('../../src/layout/layout.engine.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/layout/layout.engine.js')>();
  return { routeWires: real.routeWires };
});

const sampleInput: AiAnalysisInput = {
  walls: [
    { x1: 0, y1: 0, x2: 400, y2: 0 },
    { x1: 400, y1: 0, x2: 400, y2: 300 },
    { x1: 400, y1: 300, x2: 0, y2: 300 },
    { x1: 0, y1: 300, x2: 0, y2: 0 },
  ],
  doors: [{ x: 50, y: 0 }],
  outlets: [
    { x: 100, y: 0 },
    { x: 200, y: 0 },
    { x: 300, y: 0 },
  ],
  switches: [{ x: 75, y: 0 }],
  panel: { x: 0, y: 0 },
  wires: [
    [
      { x: 100, y: 0 },
      { x: 0, y: 0 },
    ],
  ],
  unit: 'm',
};

describe('analyzeLayout', () => {
  beforeEach(() => {
    mockGenerateObject.mockReset();
    vi.resetModules();
  });

  it('returns an enhanced layout with re-routed wires and changes on success', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        outlets: [
          { x: 2.5, y: 0 },
          { x: 5.0, y: 0 },
          { x: 7.5, y: 0 },
        ],
        switches: [{ x: 1.5, y: 0 }],
        panel: { x: 0, y: 0 },
        changes: ['Moved outlet from (2.50m, 0.00m) to (2.50m, 0.00m) for even spacing'],
        explanation: 'Outlets are now evenly spaced, reducing wire length.',
      },
    });

    const { analyzeLayout } = await import('../../src/ai/ai.service');
    const result = await analyzeLayout(sampleInput);

    expect(result.outlets).toHaveLength(3);
    expect(result.switches).toHaveLength(1);
    expect(result.panel).toEqual({ x: 0, y: 0 });
    // Wires should be re-routed by the layout engine (one per outlet + switch)
    expect(result.wires.length).toBeGreaterThan(0);
    expect(result.changes).toHaveLength(1);
    expect(result.explanation).toBe('Outlets are now evenly spaced, reducing wire length.');
  });

  it('converts meter coordinates to pixel coordinates', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        outlets: [{ x: 2.5, y: 0 }], // 2.5m * 40 = 100px
        switches: [],
        panel: { x: 0, y: 0 },
        changes: [],
        explanation: 'No changes needed.',
      },
    });

    const { analyzeLayout } = await import('../../src/ai/ai.service');
    const result = await analyzeLayout(sampleInput);

    expect(result.outlets[0]).toEqual({ x: 100, y: 0 });
  });

  it('converts feet coordinates to pixel coordinates when unit is ft', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        outlets: [{ x: 8.2, y: 0 }], // 8.2ft * 0.3048 * 40 ≈ 100px
        switches: [],
        panel: { x: 0, y: 0 },
        changes: [],
        explanation: 'No changes needed.',
      },
    });

    const { analyzeLayout } = await import('../../src/ai/ai.service');
    const result = await analyzeLayout({ ...sampleInput, unit: 'ft' });

    // 8.2ft * 0.3048m/ft * 40px/m ≈ 99.97 → rounds to 100
    expect(result.outlets[0].x).toBeCloseTo(100, 0);
  });

  it('includes the unit system in the prompt', async () => {
    mockGenerateObject.mockResolvedValueOnce({
      object: { outlets: [], switches: [], panel: { x: 0, y: 0 }, changes: [], explanation: 'ok' },
    });

    const { analyzeLayout } = await import('../../src/ai/ai.service');
    await analyzeLayout({ ...sampleInput, unit: 'ft' });

    const { prompt } = mockGenerateObject.mock.calls[0][0] as { prompt: string };
    expect(prompt).toContain('feet');
    expect(prompt).toContain('~10ft');
  });

  it('propagates errors from generateObject to the caller', async () => {
    mockGenerateObject.mockRejectedValueOnce(new Error('API connection failed'));

    const { analyzeLayout } = await import('../../src/ai/ai.service');
    await expect(analyzeLayout(sampleInput)).rejects.toThrow('API connection failed');
  });
});
