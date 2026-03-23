import type { Wall } from '../../types';
import { type Unit, toDisplay } from '../utils/floor-plan.utils';

type Props = {
  walls: Wall[];
  unit: Unit;
  /** Optional preview wall (while the user is actively drawing) */
  preview?: Wall | null;
};

const OFFSET = 14; // px — distance from wall midpoint to label, perpendicular to the wall

/**
 * Renders a dimension label at the midpoint of each wall, offset perpendicular
 * to the wall so it doesn't overlap the stroke.
 * The label is always pushed to the "upper-left" side for visual consistency.
 */
export function WallMeasurements({ walls, unit, preview }: Props) {
  const all = preview ? [...walls, preview] : walls;

  return (
    <>
      {all.map((w, i) => {
        const dx = w.x2 - w.x1;
        const dy = w.y2 - w.y1;
        const len = Math.hypot(dx, dy);
        if (len === 0) return null;

        const mid = { x: (w.x1 + w.x2) / 2, y: (w.y1 + w.y2) / 2 };

        // Perpendicular unit vector (rotate 90° counter-clockwise)
        let nx = -dy / len;
        let ny = dx / len;

        // Reason: always offset toward the "upper-left" so labels don't
        // collide with each other on opposite sides of a wall.
        if (ny > 0 || (ny === 0 && nx > 0)) {
          nx = -nx;
          ny = -ny;
        }

        const tx = mid.x + nx * OFFSET;
        const ty = mid.y + ny * OFFSET;
        const label = `${toDisplay(len, unit)} ${unit}`;
        const isPreview = preview && i === all.length - 1;

        return (
          <text
            // biome-ignore lint/suspicious/noArrayIndexKey: walls have no stable id; index is the best key here
            key={i}
            x={tx}
            y={ty}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fontWeight="500"
            fill={isPreview ? '#93c5fd' : '#6b7280'}
            stroke="white"
            strokeWidth={2.5}
            paintOrder="stroke"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {label}
          </text>
        );
      })}
    </>
  );
}
