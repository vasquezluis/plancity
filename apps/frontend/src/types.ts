export type Point = { x: number; y: number };
export type Wall = { x1: number; y1: number; x2: number; y2: number };
export type Door = { x: number; y: number };
export type Outlet = { x: number; y: number };
// Wire = pair of points [from, to] — Phase 1 uses straight lines
export type Wire = [Point, Point];

export type FloorPlanInput = {
  walls: Wall[];
  doors: Door[];
};

export type GenerateResponse = {
  outlets: Outlet[];
  panel: Point;
  wires: Wire[];
};
