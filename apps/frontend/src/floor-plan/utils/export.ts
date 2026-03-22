import type { Door, GenerateResponse, Label, Wall } from '../../types';

type Bounds = { x: number; y: number; w: number; h: number };

/**
 * Computes the bounding box of all drawn content with padding.
 * Returns null when the canvas is empty.
 */
export function computeContentBounds(
  walls: Wall[],
  doors: Door[],
  labels: Label[],
  result: GenerateResponse | null
): Bounds | null {
  const xs: number[] = [];
  const ys: number[] = [];

  for (const w of walls) {
    xs.push(w.x1, w.x2);
    ys.push(w.y1, w.y2);
  }
  for (const d of doors) {
    xs.push(d.x - 20, d.x + 20);
    ys.push(d.y - 20, d.y + 20);
  }
  for (const l of labels) {
    // Reason: text width is unknown at render time — over-estimate to avoid clipping
    xs.push(l.x, l.x + l.text.length * 9);
    ys.push(l.y - 16, l.y + 4);
  }
  if (result) {
    for (const o of result.outlets) {
      xs.push(o.x - 10, o.x + 10);
      ys.push(o.y - 10, o.y + 10);
    }
    for (const s of result.switches) {
      xs.push(s.x - 10, s.x + 10);
      ys.push(s.y - 10, s.y + 10);
    }
    xs.push(result.panel.x - 12, result.panel.x + 12);
    ys.push(result.panel.y - 12, result.panel.y + 12);
    for (const wire of result.wires) {
      for (const p of wire) {
        xs.push(p.x);
        ys.push(p.y);
      }
    }
  }

  if (xs.length === 0) return null;

  const PAD = 24;
  return {
    x: Math.min(...xs) - PAD,
    y: Math.min(...ys) - PAD,
    w: Math.max(...xs) - Math.min(...xs) + PAD * 2,
    h: Math.max(...ys) - Math.min(...ys) + PAD * 2,
  };
}

/**
 * Renders the content bounding box as a 2× PNG and triggers a file download.
 * Any in-progress foreignObject inputs are stripped from the clone before export.
 */
export function exportPng(svg: SVGSVGElement, bounds: Bounds): void {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`);
  clone.setAttribute('width', String(bounds.w));
  clone.setAttribute('height', String(bounds.h));
  clone.style.background = 'white';
  for (const fo of Array.from(clone.querySelectorAll('foreignObject'))) fo.remove();

  const svgStr = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Reason: render SVG through an Image onto a 2× canvas to get a crisp PNG
  const SCALE = 2;
  const canvas = document.createElement('canvas');
  canvas.width = bounds.w * SCALE;
  canvas.height = bounds.h * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    URL.revokeObjectURL(url);
    return;
  }
  ctx.scale(SCALE, SCALE);

  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, bounds.w, bounds.h);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'floor-plan.png';
    a.click();
  };
  img.src = url;
}
