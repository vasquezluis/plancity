import { describe, expect, it } from 'vitest';
import {
  distPointToSegment,
  generateLayout,
  placeOutlets,
  placePanel,
  placeSwitches,
  routeWires,
} from '../../src/layout/layout.engine';

// ── placeOutlets ────────────────────────────────────────────────────────────

describe('placeOutlets', () => {
  it('places outlets along a horizontal wall at regular intervals', () => {
    // Wall from (0,0) to (300,0) — long enough for several outlets
    const outlets = placeOutlets([{ x1: 0, y1: 0, x2: 300, y2: 0 }], []);
    expect(outlets.length).toBeGreaterThan(0);
    // All outlets should lie on y=0
    for (const o of outlets) {
      expect(o.y).toBe(0);
      expect(o.x).toBeGreaterThan(0);
      expect(o.x).toBeLessThan(300);
    }
  });

  it('skips outlets near a door', () => {
    // Wall (0,0)→(300,0), door at x=60 — first outlet candidate is at x=60
    const withDoor = placeOutlets([{ x1: 0, y1: 0, x2: 300, y2: 0 }], [{ x: 60, y: 0 }]);
    const withoutDoor = placeOutlets([{ x1: 0, y1: 0, x2: 300, y2: 0 }], []);
    // Door should suppress at least one outlet
    expect(withDoor.length).toBeLessThan(withoutDoor.length);
    // No outlet should be at x=60
    expect(withDoor.find((o) => o.x === 60)).toBeUndefined();
  });

  it('returns empty array for a wall that is too short', () => {
    const outlets = placeOutlets([{ x1: 0, y1: 0, x2: 30, y2: 0 }], []);
    expect(outlets).toHaveLength(0);
  });
});

// ── placeSwitches ────────────────────────────────────────────────────────────

describe('placeSwitches', () => {
  it('places one switch per door offset along the nearest wall', () => {
    const walls = [{ x1: 0, y1: 0, x2: 300, y2: 0 }];
    const doors = [{ x: 100, y: 0 }];
    const switches = placeSwitches(walls, doors);
    expect(switches).toHaveLength(1);
    // Switch should be near y=0 (on the horizontal wall)
    expect(switches[0].y).toBeCloseTo(0, 0);
    // Switch should be offset from the door position (not exactly at x=100)
    expect(switches[0].x).not.toBe(100);
  });

  it('returns empty array when no doors are provided', () => {
    const walls = [{ x1: 0, y1: 0, x2: 300, y2: 0 }];
    expect(placeSwitches(walls, [])).toHaveLength(0);
  });

  it('returns empty array when no walls are provided', () => {
    expect(placeSwitches([], [{ x: 100, y: 0 }])).toHaveLength(0);
  });
});

// ── placePanel ──────────────────────────────────────────────────────────────

describe('placePanel', () => {
  it('uses the start of the first wall as panel location', () => {
    const panel = placePanel([{ x1: 100, y1: 200, x2: 400, y2: 200 }]);
    expect(panel).toEqual({ x: 100, y: 200 });
  });

  it('returns origin when no walls are provided', () => {
    expect(placePanel([])).toEqual({ x: 0, y: 0 });
  });
});

// ── routeWires ──────────────────────────────────────────────────────────────

describe('routeWires', () => {
  it('creates one wire per outlet connecting outlet to panel', () => {
    const outlets = [
      { x: 60, y: 40 },
      { x: 120, y: 40 },
    ];
    const panel = { x: 0, y: 0 };
    const wires = routeWires(outlets, [], panel, []);

    expect(wires).toHaveLength(2);
    // Each wire starts at its source
    expect(wires[0][0]).toEqual({ x: 60, y: 40 });
    // Each wire ends at the panel
    expect(wires[0][wires[0].length - 1]).toEqual(panel);
    expect(wires[1][0]).toEqual({ x: 120, y: 40 });
    expect(wires[1][wires[1].length - 1]).toEqual(panel);
  });

  it('includes one wire per switch in addition to outlet wires', () => {
    const outlets = [{ x: 60, y: 40 }];
    const switches = [{ x: 80, y: 0 }];
    const panel = { x: 0, y: 0 };
    const wires = routeWires(outlets, switches, panel, []);

    // outlets + switches = 2 wires total
    expect(wires).toHaveLength(2);
  });

  it('returns empty array when there are no outlets or switches', () => {
    expect(routeWires([], [], { x: 0, y: 0 }, [])).toHaveLength(0);
  });

  it('produces a polyline path (≥ 2 points) for each wire', () => {
    const wires = routeWires([{ x: 60, y: 40 }], [], { x: 0, y: 0 }, []);
    expect(wires[0].length).toBeGreaterThanOrEqual(2);
  });
});

// ── generateLayout ──────────────────────────────────────────────────────────

describe('generateLayout', () => {
  it('produces a full layout with panel, outlets, switches, and wires', () => {
    const walls = [{ x1: 0, y1: 0, x2: 300, y2: 0 }];
    const doors = [{ x: 100, y: 0 }];
    const result = generateLayout(walls, doors);

    expect(result.panel).toEqual({ x: 0, y: 0 });
    expect(result.outlets.length).toBeGreaterThan(0);
    expect(result.switches).toHaveLength(1); // one switch per door
    // Total wires = outlets + switches
    expect(result.wires).toHaveLength(result.outlets.length + result.switches.length);
  });

  it('handles empty input gracefully', () => {
    const result = generateLayout([], []);
    expect(result.panel).toEqual({ x: 0, y: 0 });
    expect(result.outlets).toHaveLength(0);
    expect(result.switches).toHaveLength(0);
    expect(result.wires).toHaveLength(0);
  });
});

// ── distPointToSegment ──────────────────────────────────────────────────────

describe('distPointToSegment', () => {
  it('returns 0 for a point on the segment', () => {
    const d = distPointToSegment({ x: 5, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 });
    expect(d).toBeCloseTo(0);
  });

  it('returns perpendicular distance for a point off the segment', () => {
    const d = distPointToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 });
    expect(d).toBeCloseTo(3);
  });
});
