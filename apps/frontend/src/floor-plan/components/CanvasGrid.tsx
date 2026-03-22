import { CANVAS_H, CANVAS_W, GRID, type Unit, toDisplay } from '../utils/floor-plan.utils';

type Props = { unit: Unit };

/** Renders the background grid lines and coordinate labels. */
export function CanvasGrid({ unit }: Props) {
  const lines: React.ReactNode[] = [];

  for (let x = 0; x <= CANVAS_W; x += GRID) {
    lines.push(
      <line key={`v${x}`} x1={x} y1={0} x2={x} y2={CANVAS_H} stroke="#e5e7eb" strokeWidth={0.5} />
    );
    lines.push(
      <text
        key={`lx${x}`}
        x={x}
        y={9}
        fontSize={9}
        fill="#9ca3af"
        textAnchor="middle"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {toDisplay(x, unit)}
      </text>
    );
  }

  for (let y = 0; y <= CANVAS_H; y += GRID) {
    lines.push(
      <line key={`h${y}`} x1={0} y1={y} x2={CANVAS_W} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />
    );
    lines.push(
      <text
        key={`ly${y}`}
        x={3}
        y={y === 0 ? 9 : y + 3}
        fontSize={9}
        fill="#9ca3af"
        textAnchor="start"
        style={{ userSelect: 'none', pointerEvents: 'none' }}
      >
        {toDisplay(y, unit)}
      </text>
    );
  }

  return <g>{lines}</g>;
}
