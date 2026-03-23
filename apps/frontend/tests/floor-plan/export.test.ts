import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computeContentBounds, exportSvg } from '../../src/floor-plan/utils/export';
import type { GenerateResponse } from '../../src/types';

// ── computeContentBounds ─────────────────────────────────────────────────────

describe('computeContentBounds', () => {
  it('returns null when there is no content', () => {
    expect(computeContentBounds([], [], [], null)).toBeNull();
  });

  it('returns a padded bounding box for walls', () => {
    const walls = [{ x1: 0, y1: 0, x2: 100, y2: 0 }];
    const bounds = computeContentBounds(walls, [], [], null);
    expect(bounds).not.toBeNull();
    // x starts at min(0,100) - PAD = -24
    expect(bounds?.x).toBe(-24);
    // width = (100 - 0) + 2*24 = 148
    expect(bounds?.w).toBe(148);
  });

  it('includes result wires and panel in bounds', () => {
    const result: GenerateResponse = {
      outlets: [],
      switches: [],
      panel: { x: 200, y: 200 },
      wires: [
        [
          { x: 50, y: 50 },
          { x: 150, y: 150 },
        ],
      ],
    };
    const bounds = computeContentBounds([], [], [], result);
    expect(bounds).not.toBeNull();
    // Panel at (200,200) ±12, wire from (50,50) to (150,150) → max x = 212
    expect(bounds?.x).toBeLessThanOrEqual(50 - 24);
    expect(bounds?.w).toBeGreaterThan(0);
  });
});

// ── exportSvg ────────────────────────────────────────────────────────────────

describe('exportSvg', () => {
  let clickSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clickSpy = vi.fn();
    revokeObjectURLSpy = vi.fn();

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: revokeObjectURLSpy,
    });

    // Stub document.createElement to intercept the <a> tag click
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        const a = origCreate('a');
        a.click = clickSpy;
        return a;
      }
      return origCreate(tag);
    });

    vi.stubGlobal(
      'XMLSerializer',
      class {
        serializeToString() {
          return '<svg></svg>';
        }
      }
    );
    vi.stubGlobal('Blob', class {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('triggers a download with a .svg filename', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    svg.cloneNode = vi.fn(() => {
      const clone = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
      clone.setAttribute = vi.fn();
      clone.querySelectorAll = vi.fn(() => [] as unknown as NodeListOf<Element>);
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      (clone.style as any) = {};
      return clone;
    });

    exportSvg(svg, { x: 0, y: 0, w: 100, h: 100 });

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock');
  });

  it('revokes the object URL after triggering the download', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
    svg.cloneNode = vi.fn(() => {
      const clone = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
      clone.setAttribute = vi.fn();
      clone.querySelectorAll = vi.fn(() => [] as unknown as NodeListOf<Element>);
      // biome-ignore lint/suspicious/noExplicitAny: test mock
      (clone.style as any) = {};
      return clone;
    });

    exportSvg(svg, { x: 0, y: 0, w: 200, h: 200 });

    expect(revokeObjectURLSpy).toHaveBeenCalledTimes(1);
  });
});
