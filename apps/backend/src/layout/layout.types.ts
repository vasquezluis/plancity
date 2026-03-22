import type { Point } from '../floor-plan/floor-plan.schema.js';

export type Outlet = Point;
// Wire = straight line segment [from, to] — Phase 2 replaces with A* paths
export type Wire = [Point, Point];

export type GenerateResponse = {
  outlets: Outlet[];
  panel: Point;
  wires: Wire[];
};
