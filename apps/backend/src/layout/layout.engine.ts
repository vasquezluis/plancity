import type { Door, Point, Wall } from '../floor-plan/floor-plan.schema.js';
import type { GenerateResponse, Outlet, Switch, Wire } from './layout.types.js';

// Pixels between outlets along a wall. At 40px grid cells, this = every 1.5 cells (~0.75m).
const OUTLET_SPACING = 60;
// Minimum distance from a door center to avoid placing an outlet.
const DOOR_CLEARANCE = 45;
// Pixels from the projected door position to place the switch along the wall.
const SWITCH_OFFSET = 25;
// A* routing grid step in pixels — fine enough to navigate between outlets and panel.
const ASTAR_STEP = 10;
// Cost multiplier for grid cells that lie on a wall segment.
// Walls are passable (wires run inside them) but the algorithm prefers open space.
const WALL_COST = 8;

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
 * Places one switch per door, positioned SWITCH_OFFSET pixels along the host
 * wall from the door's projected location.
 */
export function placeSwitches(walls: Wall[], doors: Door[]): Switch[] {
  const switches: Switch[] = [];

  for (const door of doors) {
    // Find the wall segment closest to this door
    let bestWall: Wall | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const wall of walls) {
      const dist = distPointToSegment(door, { x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
      if (dist < bestDist) {
        bestDist = dist;
        bestWall = wall;
      }
    }
    if (!bestWall) continue;

    const dx = bestWall.x2 - bestWall.x1;
    const dy = bestWall.y2 - bestWall.y1;
    const len = Math.hypot(dx, dy);
    if (len === 0) continue;

    const ux = dx / len;
    const uy = dy / len;

    // Parametric projection of the door point onto the wall line
    const t = ((door.x - bestWall.x1) * dx + (door.y - bestWall.y1) * dy) / (len * len);
    const tClamped = Math.max(0, Math.min(1, t));
    const projX = bestWall.x1 + tClamped * dx;
    const projY = bestWall.y1 + tClamped * dy;

    // Place switch SWITCH_OFFSET pixels further along the wall from the door projection
    switches.push({
      x: Math.round(projX + ux * SWITCH_OFFSET),
      y: Math.round(projY + uy * SWITCH_OFFSET),
    });
  }

  return switches;
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
 * Builds a cost grid for A* routing. Open space = cost 1.
 * Cells that lie on a wall segment get WALL_COST (passable but expensive).
 * Reason: wires run inside walls in real installations, but routing through
 * open floor space is modelled as the preferred path for clarity.
 */
function buildCostGrid(walls: Wall[], cols: number, rows: number): number[][] {
  const grid: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(1));

  for (const wall of walls) {
    const x0 = wall.x1 / ASTAR_STEP;
    const y0 = wall.y1 / ASTAR_STEP;
    const x1 = wall.x2 / ASTAR_STEP;
    const y1 = wall.y2 / ASTAR_STEP;

    // Sample the segment at twice the grid-space resolution for full coverage
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = Math.round(x0 + (x1 - x0) * t);
      const cy = Math.round(y0 + (y1 - y0) * t);
      if (cx >= 0 && cy >= 0 && cx < cols && cy < rows) {
        grid[cy][cx] = WALL_COST;
      }
    }
  }

  return grid;
}

/** Remove intermediate points that are collinear with their neighbours. */
function simplifyPath(path: Point[]): Point[] {
  if (path.length <= 2) return path;
  const result: Point[] = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const prev = result[result.length - 1];
    const cur = path[i];
    const next = path[i + 1];
    // Cross product ≠ 0 means direction changes → keep the point
    if ((cur.x - prev.x) * (next.y - prev.y) !== (next.x - prev.x) * (cur.y - prev.y)) {
      result.push(cur);
    }
  }
  result.push(path[path.length - 1]);
  return result;
}

/**
 * A* pathfinding on a weighted grid using 4-directional movement.
 * 4 directions only (no diagonals) produces clean right-angle wire bends.
 * Falls back to a two-point straight path when no route is found.
 */
function astar(start: Point, end: Point, grid: number[][], cols: number, rows: number): Point[] {
  const sc = Math.round(start.x / ASTAR_STEP);
  const sr = Math.round(start.y / ASTAR_STEP);
  const ec = Math.round(end.x / ASTAR_STEP);
  const er = Math.round(end.y / ASTAR_STEP);

  if (sc === ec && sr === er) return [start];

  const key = (c: number, r: number) => `${c},${r}`;
  // Manhattan distance — admissible heuristic for 4-directional uniform cost movement
  const h = (c: number, r: number) => Math.abs(c - ec) + Math.abs(r - er);

  type Node = { c: number; r: number; g: number; f: number; parent: string | null };

  const nodeMap = new Map<string, Node>();
  const open = new Map<string, Node>();
  const closed = new Set<string>();

  const startNode: Node = { c: sc, r: sr, g: 0, f: h(sc, sr), parent: null };
  open.set(key(sc, sr), startNode);
  nodeMap.set(key(sc, sr), startNode);

  const dirs: [number, number][] = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];

  while (open.size > 0) {
    // Pick node with lowest f from the open set
    let bestKey = '';
    let bestF = Number.POSITIVE_INFINITY;
    for (const [k, n] of open) {
      if (n.f < bestF) {
        bestF = n.f;
        bestKey = k;
      }
    }

    const cur = open.get(bestKey) as Node;
    open.delete(bestKey);
    closed.add(bestKey);

    if (cur.c === ec && cur.r === er) {
      // Reconstruct path by following parent pointers back to start
      const path: Point[] = [];
      let node: Node | null = cur;
      while (node) {
        path.unshift({ x: node.c * ASTAR_STEP, y: node.r * ASTAR_STEP });
        node = node.parent ? (nodeMap.get(node.parent) ?? null) : null;
      }
      return simplifyPath(path);
    }

    for (const [dc, dr] of dirs) {
      const nc = cur.c + dc;
      const nr = cur.r + dr;
      const nk = key(nc, nr);

      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      if (closed.has(nk)) continue;

      const moveCost = grid[nr]?.[nc] ?? 1;
      const ng = cur.g + moveCost;
      const nf = ng + h(nc, nr);

      const existing = nodeMap.get(nk);
      if (!existing || ng < existing.g) {
        const node: Node = { c: nc, r: nr, g: ng, f: nf, parent: bestKey };
        open.set(nk, node);
        nodeMap.set(nk, node);
      }
    }
  }

  // No path found — straight fallback keeps the pipeline working
  return [start, end];
}

/**
 * Routes wires from all outlets and switches to the panel using A*.
 * Builds the cost grid once and reuses it for every wire.
 */
export function routeWires(
  outlets: Outlet[],
  switches: Switch[],
  panel: Point,
  walls: Wall[]
): Wire[] {
  const sources: Point[] = [...outlets, ...switches];
  if (sources.length === 0) return [];

  // Compute grid dimensions from the bounding box of all geometry
  let maxX = panel.x;
  let maxY = panel.y;
  for (const s of sources) {
    if (s.x > maxX) maxX = s.x;
    if (s.y > maxY) maxY = s.y;
  }
  for (const w of walls) {
    maxX = Math.max(maxX, w.x1, w.x2);
    maxY = Math.max(maxY, w.y1, w.y2);
  }
  const cols = Math.ceil((maxX + ASTAR_STEP * 2) / ASTAR_STEP);
  const rows = Math.ceil((maxY + ASTAR_STEP * 2) / ASTAR_STEP);

  // Reason: build the cost grid once — shared across all A* calls for this request
  const grid = buildCostGrid(walls, cols, rows);

  return sources.map((source) => astar(source, panel, grid, cols, rows));
}

/**
 * Main entry point: given walls and doors, produce the full electrical layout.
 */
export function generateLayout(walls: Wall[], doors: Door[]): GenerateResponse {
  const panel = placePanel(walls);
  const outlets = placeOutlets(walls, doors);
  const switches = placeSwitches(walls, doors);
  const wires = routeWires(outlets, switches, panel, walls);
  return { panel, outlets, switches, wires };
}
