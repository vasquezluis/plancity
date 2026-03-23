import { describe, expect, it } from 'vitest';
import {
  WALL_HEIGHT_M,
  to3DPosition,
  wallGeometry,
} from '../../src/floor-plan/utils/coordinates3d';
import { GRID } from '../../src/floor-plan/utils/floor-plan.utils';
import type { Wall } from '../../src/types';

describe('to3DPosition', () => {
  it('converts the 2D origin to the 3D origin at floor level', () => {
    const [x, y, z] = to3DPosition(0, 0);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);
  });

  it('maps SVG x directly to Three.js x in meters', () => {
    const [x] = to3DPosition(GRID * 3, 0);
    expect(x).toBeCloseTo(3);
  });

  it('negates SVG y axis into Three.js z (SVG y-down → Three.js z-forward)', () => {
    const [, , z] = to3DPosition(0, GRID * 2);
    expect(z).toBeCloseTo(-2);
  });

  it('applies elevation to the Three.js y axis', () => {
    const [, y] = to3DPosition(0, 0, 1.5);
    expect(y).toBeCloseTo(1.5);
  });
});

describe('wallGeometry', () => {
  const horizontal: Wall = { x1: 0, y1: 0, x2: GRID * 4, y2: 0 }; // 4m horizontal wall

  it('computes the center position at mid-height for a horizontal wall', () => {
    const { position } = wallGeometry(horizontal);
    expect(position[0]).toBeCloseTo(2); // cx = 2m
    expect(position[1]).toBeCloseTo(WALL_HEIGHT_M / 2);
    expect(position[2]).toBeCloseTo(0); // cy = 0 → z = 0
  });

  it('computes correct length in meters for a horizontal wall', () => {
    const { length } = wallGeometry(horizontal);
    expect(length).toBeCloseTo(4);
  });

  it('returns zero rotation for a horizontal wall', () => {
    const { rotationY } = wallGeometry(horizontal);
    expect(rotationY).toBeCloseTo(0);
  });

  it('returns π/2 rotation for a vertical wall', () => {
    const vertical: Wall = { x1: 0, y1: 0, x2: 0, y2: GRID * 3 };
    const { rotationY } = wallGeometry(vertical);
    expect(Math.abs(rotationY)).toBeCloseTo(Math.PI / 2);
  });

  it('handles a zero-length wall without producing NaN', () => {
    const degenerate: Wall = { x1: 40, y1: 40, x2: 40, y2: 40 };
    const { length, rotationY, position } = wallGeometry(degenerate);
    expect(Number.isNaN(length)).toBe(false);
    expect(Number.isNaN(rotationY)).toBe(false);
    expect(position.every((v) => !Number.isNaN(v))).toBe(true);
    expect(length).toBeGreaterThan(0); // clamped to 0.01
  });
});
