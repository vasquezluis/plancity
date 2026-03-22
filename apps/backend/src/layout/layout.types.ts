import type { Point } from '../floor-plan/floor-plan.schema.js';

export type Outlet = Point;
export type Switch = Point;
// Wire is a polyline path (array of two or more points) — Phase 2 A* result
export type Wire = Point[];

export type GenerateResponse = {
  outlets: Outlet[];
  switches: Switch[];
  panel: Point;
  wires: Wire[];
};
