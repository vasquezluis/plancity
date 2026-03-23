import type { Wall } from '../../types';
import { GRID } from './floor-plan.utils';

export const WALL_HEIGHT_M = 2.4;
export const WALL_THICKNESS_M = 0.1;

/**
 * Convert a 2D SVG pixel coordinate to a Three.js world position.
 * Reason: SVG y-down maps to Three.js +z (not -z). With the camera positioned at
 * [cx, 12, cz+15] looking toward -z, SVG-top (small y → small z) is far from the
 * camera and appears at screen-top; SVG-bottom (large y → large z) is near the
 * camera and appears at screen-bottom. Negating z would invert this and also mirror
 * the layout left-right.
 * Result: [x_meters, elevation_meters, z_meters]
 */
export function to3DPosition(px: number, py: number, elevationM = 0): [number, number, number] {
  return [px / GRID, elevationM, py / GRID];
}

/**
 * Compute the 3D geometry needed to render a wall as a BoxGeometry.
 * Returns the center position (at half wall height), y-axis rotation, and length in meters.
 */
export function wallGeometry(wall: Wall): {
  position: [number, number, number];
  rotationY: number;
  length: number;
} {
  const cx = (wall.x1 + wall.x2) / 2;
  const cy = (wall.y1 + wall.y2) / 2;
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const length = Math.hypot(dx, dy) / GRID;
  // Reason: SVG y maps to +z directly (no negation), so the xz angle is atan2(dy, dx) unchanged.
  const rotationY = Math.atan2(dy, dx);
  return {
    position: [cx / GRID, WALL_HEIGHT_M / 2, cy / GRID],
    rotationY,
    length: Math.max(length, 0.01), // Prevent zero-length BoxGeometry
  };
}
