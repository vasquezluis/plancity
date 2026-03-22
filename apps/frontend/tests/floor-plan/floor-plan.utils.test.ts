import { describe, expect, it } from 'vitest';
import {
  GRID,
  projectOntoWall,
  snap,
  toDisplay,
} from '../../src/floor-plan/utils/floor-plan.utils';

describe('snap', () => {
  it('snaps to the nearest grid line', () => {
    expect(snap(25)).toBe(40); // closer to 40 than 0
    expect(snap(15)).toBe(0); // closer to 0
    expect(snap(GRID)).toBe(GRID); // exact grid line unchanged
  });

  it('snaps to the nearest grid line at midpoint (rounds up)', () => {
    // Math.round(20/40)*40 = Math.round(0.5)*40 = 1*40 = 40
    expect(snap(20)).toBe(40);
  });

  it('handles negative coordinates (left/above canvas origin)', () => {
    // Math.round(-15/40)*40 = Math.round(-0.375)*40 = 0*40 = -0 (JS float -0)
    expect(snap(-15)).toBeCloseTo(0);
    expect(snap(-25)).toBe(-40); // rounds away from 0
  });
});

describe('toDisplay', () => {
  it('converts pixels to meters (1 grid cell = 1 m)', () => {
    expect(toDisplay(GRID, 'm')).toBe('1'); // 40px = 1m
    expect(toDisplay(GRID * 2, 'm')).toBe('2');
    expect(toDisplay(GRID * 1.5, 'm')).toBe('1.5'); // keeps decimal when non-zero
  });

  it('converts pixels to feet', () => {
    // 40px = 1m = 3.281ft → toFixed(1) = "3.3"
    expect(toDisplay(GRID, 'ft')).toBe('3.3');
    expect(toDisplay(GRID * 2, 'ft')).toBe('6.6');
  });

  it('returns "0" for zero pixels', () => {
    expect(toDisplay(0, 'm')).toBe('0');
    expect(toDisplay(0, 'ft')).toBe('0.0');
  });
});

describe('projectOntoWall', () => {
  const horizontal: import('../../src/types').Wall = { x1: 0, y1: 0, x2: 100, y2: 0 };

  it('projects a point directly above a horizontal wall onto the wall', () => {
    const { proj, dist } = projectOntoWall({ x: 50, y: 30 }, horizontal);
    expect(proj).toEqual({ x: 50, y: 0 });
    expect(dist).toBeCloseTo(30);
  });

  it('clamps projection to the wall endpoints when point is beyond the segment', () => {
    // Point is past the end of the wall
    const { proj, dist } = projectOntoWall({ x: 150, y: 0 }, horizontal);
    expect(proj).toEqual({ x: 100, y: 0 }); // clamped to x2,y2
    expect(dist).toBeCloseTo(50);
  });

  it('handles a zero-length (degenerate) wall without dividing by zero', () => {
    const point = { x: 10, y: 20 };
    const degenerate: import('../../src/types').Wall = { x1: 5, y1: 5, x2: 5, y2: 5 };
    const { proj, dist } = projectOntoWall(point, degenerate);
    expect(proj).toEqual({ x: 5, y: 5 });
    expect(dist).toBeCloseTo(Math.hypot(5, 15));
  });
});
