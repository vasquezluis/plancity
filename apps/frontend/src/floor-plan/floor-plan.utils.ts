import type { Point, Wall } from '../types';

export const CANVAS_W = 800;
export const CANVAS_H = 560;
export const GRID = 20; // px per grid cell

/** Snap a raw coordinate to the nearest grid point. */
export function snap(v: number): number {
  return Math.round(v / GRID) * GRID;
}

/** Convert a mouse event to SVG-local coordinates. */
export function svgPoint(e: React.MouseEvent<SVGSVGElement>): Point {
  const rect = e.currentTarget.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
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
