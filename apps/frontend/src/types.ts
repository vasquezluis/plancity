export type Point = { x: number; y: number };
export type Wall = { x1: number; y1: number; x2: number; y2: number };
export type Door = { x: number; y: number };
export type Outlet = { x: number; y: number };
export type Switch = { x: number; y: number };
// Wire is a polyline path (A* result from Phase 2+) — two or more points
export type Wire = Point[];

export type FloorPlanInput = {
  walls: Wall[];
  doors: Door[];
};

export type GenerateResponse = {
  outlets: Outlet[];
  switches: Switch[];
  panel: Point;
  wires: Wire[];
};
