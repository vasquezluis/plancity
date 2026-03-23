import type { Point, Wall, Wire } from '../../types';

export const CANVAS_W = 1000;
export const CANVAS_H = 600;
export const GRID = 40; // px per grid cell — 1 cell = 1 meter
export const METERS_PER_CELL = 1; // scale: each grid cell represents 1 m
export const FEET_PER_METER = 3.281;

export type Unit = 'm' | 'ft';

/** Convert a pixel value to a human-readable distance string in the chosen unit. */
export function toDisplay(px: number, unit: Unit): string {
  const meters = (px / GRID) * METERS_PER_CELL;
  if (unit === 'ft') {
    return (meters * FEET_PER_METER).toFixed(1);
  }
  return meters.toFixed(1).replace(/\.0$/, '');
}

/** Snap a raw coordinate to the nearest grid point. */
export function snap(v: number): number {
  return Math.round(v / GRID) * GRID;
}

/**
 * Convert a mouse event to SVG-local coordinates.
 * Reason: uses getScreenCTM().inverse() so the result is correct even when
 * a viewBox transform (zoom/pan) is applied to the SVG element.
 */
export function svgPoint(e: React.MouseEvent<SVGSVGElement>): Point {
  const svg = e.currentTarget;
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = svg.getScreenCTM();
  if (ctm) {
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  }
  // Reason: fallback for environments where getScreenCTM is unavailable (e.g. tests)
  const rect = svg.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

/**
 * Sums the Euclidean length of all wire polylines and returns a formatted distance string.
 * Reason: wires are A* paths with right-angle segments, so summing consecutive-point distances is exact.
 */
export function computeWireLength(wires: Wire[], unit: Unit): string {
  let totalPx = 0;
  for (const wire of wires) {
    for (let i = 1; i < wire.length; i++) {
      const dx = wire[i].x - wire[i - 1].x;
      const dy = wire[i].y - wire[i - 1].y;
      totalPx += Math.hypot(dx, dy);
    }
  }
  return toDisplay(totalPx, unit);
}

/** Project point P onto wall segment AB; return projected point and distance to P. */
export function projectOntoWall(p: Point, wall: Wall): { proj: Point; dist: number } {
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return { proj: { x: wall.x1, y: wall.y1 }, dist: Math.hypot(p.x - wall.x1, p.y - wall.y1) };
  }
  const t = Math.max(0, Math.min(1, ((p.x - wall.x1) * dx + (p.y - wall.y1) * dy) / lenSq));
  const proj = { x: wall.x1 + t * dx, y: wall.y1 + t * dy };
  return { proj, dist: Math.hypot(p.x - proj.x, p.y - proj.y) };
}
