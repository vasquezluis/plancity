import type { GenerateResponse, Point } from '../../types';
import { FEET_PER_METER, METERS_PER_CELL, type Unit, toDisplay } from '../utils/floor-plan.utils';

type Props = {
  hover: Point | null;
  unit: Unit;
  result: GenerateResponse | null;
};

/** Coordinate readout, cell-size label, and drawing legend below the canvas. */
export function CanvasFooter({ hover, unit, result }: Props) {
  const unitLabel = unit === 'ft' ? 'ft' : 'm';
  const cellSize =
    unit === 'ft' ? `${(METERS_PER_CELL * FEET_PER_METER).toFixed(1)} ft` : `${METERS_PER_CELL} m`;

  return (
    <>
      <div className="flex items-center justify-between mt-1.5">
        <div className="text-[11px] text-muted-foreground font-mono">
          {hover
            ? `x: ${toDisplay(hover.x, unit)} ${unitLabel}, y: ${toDisplay(hover.y, unit)} ${unitLabel}`
            : '\u00a0'}
        </div>
        <div className="text-[11px] text-foreground">1 cell = {cellSize}</div>
      </div>

      <div className="flex gap-4 mt-1 text-[11px] text-muted-foreground">
        <span>━━ Wall</span>
        <span className="text-amber-600">⌒ Door</span>
        <span className="text-purple-800">T Label</span>
        {result && (
          <>
            <span className="text-blue-500">● Outlet</span>
            <span className="text-pink-500">■ Switch</span>
            <span className="text-emerald-500">■ Panel</span>
            <span className="text-amber-500">- - Wire</span>
          </>
        )}
      </div>
    </>
  );
}
