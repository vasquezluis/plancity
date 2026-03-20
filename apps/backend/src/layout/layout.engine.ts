import type { Door, Point, Wall } from '../floor-plan/floor-plan.schema.js';
import type { GenerateResponse, Outlet, Wire } from './layout.types.js';

// Pixels between outlets along a wall. At 20px grid cells, this = every 3 cells (~1.5m).
const OUTLET_SPACING = 60;
// Minimum distance from a door center to avoid placing an outlet.
const DOOR_CLEARANCE = 45;

/**
 * Projects point P onto the line segment [A, B] and returns the distance.
 * Used to check whether an outlet candidate is too close to a door.
 */
export function distPointToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Places outlets every OUTLET_SPACING pixels along each wall.
 * Skips positions within DOOR_CLEARANCE of any door center.
 */
export function placeOutlets(walls: Wall[], doors: Door[]): Outlet[] {
  const outlets: Outlet[] = [];

  for (const wall of walls) {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const length = Math.hypot(dx, dy);

    if (length < OUTLET_SPACING) continue; // wall too short for any outlet

    // Unit vector along the wall
    const ux = dx / length;
    const uy = dy / length;

    // Start first outlet one spacing in from the wall start
    for (let d = OUTLET_SPACING; d <= length - OUTLET_SPACING / 2; d += OUTLET_SPACING) {
      const candidate: Point = {
        x: Math.round(wall.x1 + ux * d),
        y: Math.round(wall.y1 + uy * d),
      };

      // Reason: skip candidates that would overlap with a door opening
      const nearDoor = doors.some(
        (door) => Math.hypot(candidate.x - door.x, candidate.y - door.y) < DOOR_CLEARANCE
      );

      if (!nearDoor) {
        outlets.push(candidate);
      }
    }
  }

  return outlets;
}

/**
 * Places the panel at the start of the first wall.
 * Falls back to origin if no walls exist.
 */
export function placePanel(walls: Wall[]): Point {
  if (walls.length === 0) return { x: 0, y: 0 };
  return { x: walls[0].x1, y: walls[0].y1 };
}

/**
 * Phase 1: straight-line wires from each outlet to the panel.
 * Phase 2 will replace this with A* routing.
 */
export function routeWires(outlets: Outlet[], panel: Point): Wire[] {
  return outlets.map((outlet) => [
    { x: outlet.x, y: outlet.y },
    { x: panel.x, y: panel.y },
  ]);
}

/**
 * Main entry point: given walls and doors, produce the full electrical layout.
 */
export function generateLayout(walls: Wall[], doors: Door[]): GenerateResponse {
  const panel = placePanel(walls);
  const outlets = placeOutlets(walls, doors);
  const wires = routeWires(outlets, panel);
  return { panel, outlets, wires };
}
