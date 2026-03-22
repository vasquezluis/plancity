import { useCallback, useRef, useState } from 'react';
import type { Point } from '../types';
import { DrawingToolbar } from './DrawingToolbar';
import { LayoutOverlay } from './LayoutOverlay';
import type { DrawingCanvasProps } from './floor-plan.types';
import {
  CANVAS_H,
  CANVAS_W,
  GRID,
  METERS_PER_CELL,
  type Unit,
  projectOntoWall,
  snap,
  svgPoint,
  toDisplay,
} from './floor-plan.utils';

export function DrawingCanvas({
  walls,
  doors,
  result,
  unit,
  onWallsChange,
  onDoorsChange,
}: DrawingCanvasProps) {
  const [mode, setMode] = useState<'wall' | 'door'>('wall');
  const [wallStart, setWallStart] = useState<Point | null>(null);
  const [hover, setHover] = useState<Point | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Grid lines & coordinate labels ─────────────────────────────────────────
  // Each grid cell = METERS_PER_CELL meters. Labels appear on every cell line.
  // Reason: GRID is now 40px so every-cell labeling is readable without clutter.
  const unitLabel = unit === 'ft' ? 'ft' : 'm';
  const cellSize =
    unit === 'ft' ? `${(METERS_PER_CELL * 3.281).toFixed(1)} ft` : `${METERS_PER_CELL} m`;
  const gridLines: React.ReactNode[] = [];
  for (let x = 0; x <= CANVAS_W; x += GRID) {
    gridLines.push(
      <line key={`v${x}`} x1={x} y1={0} x2={x} y2={CANVAS_H} stroke="#e5e7eb" strokeWidth={0.5} />
    );
    gridLines.push(
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
    gridLines.push(
      <line key={`h${y}`} x1={0} y1={y} x2={CANVAS_W} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />
    );
    gridLines.push(
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

  // ── Mouse handlers ─────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const p = svgPoint(e);
    setHover({ x: snap(p.x), y: snap(p.y) });
  }, []);

  const handleMouseLeave = useCallback(() => setHover(null), []);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const raw = svgPoint(e);
      const p = { x: snap(raw.x), y: snap(raw.y) };

      if (mode === 'wall') {
        if (!wallStart) {
          setWallStart(p);
        } else {
          if (p.x !== wallStart.x || p.y !== wallStart.y) {
            onWallsChange([...walls, { x1: wallStart.x, y1: wallStart.y, x2: p.x, y2: p.y }]);
          }
          setWallStart(null);
        }
      } else if (mode === 'door') {
        if (walls.length === 0) return;
        let best: { proj: Point; dist: number } | null = null;
        for (const wall of walls) {
          const candidate = projectOntoWall(raw, wall);
          if (!best || candidate.dist < best.dist) best = candidate;
        }
        if (best && best.dist < 40) {
          onDoorsChange([...doors, { x: Math.round(best.proj.x), y: Math.round(best.proj.y) }]);
        }
      }
    },
    [mode, wallStart, walls, doors, onWallsChange, onDoorsChange]
  );

  function handleModeChange(next: 'wall' | 'door') {
    setMode(next);
    setWallStart(null);
  }

  function handleClear() {
    onWallsChange([]);
    onDoorsChange([]);
    setWallStart(null);
  }

  return (
    <div>
      <DrawingToolbar
        mode={mode}
        wallStarted={wallStart !== null}
        onModeChange={handleModeChange}
        onClear={handleClear}
      />

      <svg
        ref={svgRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded border border-border bg-white cursor-crosshair"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onKeyUp={() => {}}
      >
        <title>Interactive drawing canvas for floor plans</title>
        <g>{gridLines}</g>

        {walls.map((w) => (
          <line
            key={`${w.x1}-${w.y1}-${w.x2}-${w.y2}`}
            x1={w.x1}
            y1={w.y1}
            x2={w.x2}
            y2={w.y2}
            stroke="#1f2937"
            strokeWidth={3}
            strokeLinecap="round"
          />
        ))}

        {wallStart && <circle cx={wallStart.x} cy={wallStart.y} r={4} fill="#3b82f6" />}

        {mode === 'wall' && wallStart && hover && (
          <line
            x1={wallStart.x}
            y1={wallStart.y}
            x2={hover.x}
            y2={hover.y}
            stroke="#93c5fd"
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        )}

        {doors.map((d) => (
          // Architectural top-down door symbol centered at placement point.
          // Hinge at (-10, 0), panel swings 90° upward, arc shows the sweep.
          <g key={`${d.x}-${d.y}`} transform={`translate(${d.x}, ${d.y})`}>
            {/* Swing area fill */}
            <path d="M -10 0 L -10 -20 A 20 20 0 0 1 10 0 Z" fill="#fef3c7" opacity={0.55} />
            {/* Swing arc (dashed) */}
            <path
              d="M -10 -20 A 20 20 0 0 1 10 0"
              fill="none"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 2"
            />
            {/* Door panel */}
            <line
              x1={-10}
              y1={0}
              x2={-10}
              y2={-20}
              stroke="#b45309"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            {/* Door frame baseline */}
            <line
              x1={-13}
              y1={0}
              x2={13}
              y2={0}
              stroke="#b45309"
              strokeWidth={2}
              strokeLinecap="round"
            />
            {/* Hinge dot */}
            <circle cx={-10} cy={0} r={2.5} fill="#b45309" />
          </g>
        ))}

        {result && <LayoutOverlay result={result} />}
      </svg>

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
        {result && (
          <>
            <span className="text-blue-500">● Outlet</span>
            <span className="text-emerald-500">■ Panel</span>
            <span className="text-amber-500">- - Wire</span>
          </>
        )}
      </div>
    </div>
  );
}
