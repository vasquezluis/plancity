import { useCallback, useRef, useState } from 'react';
import type { Point } from '../types';
import { DrawingToolbar } from './DrawingToolbar';
import { LayoutOverlay } from './LayoutOverlay';
import type { DrawingCanvasProps } from './floor-plan.types';
import { CANVAS_H, CANVAS_W, GRID, projectOntoWall, snap, svgPoint } from './floor-plan.utils';

export function DrawingCanvas({
  walls,
  doors,
  result,
  onWallsChange,
  onDoorsChange,
}: DrawingCanvasProps) {
  const [mode, setMode] = useState<'wall' | 'door'>('wall');
  const [wallStart, setWallStart] = useState<Point | null>(null);
  const [hover, setHover] = useState<Point | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Grid lines ─────────────────────────────────────────────────────────────
  const gridLines: React.ReactNode[] = [];
  for (let x = 0; x <= CANVAS_W; x += GRID) {
    gridLines.push(
      <line key={`v${x}`} x1={x} y1={0} x2={x} y2={CANVAS_H} stroke="#e5e7eb" strokeWidth={0.5} />
    );
  }
  for (let y = 0; y <= CANVAS_H; y += GRID) {
    gridLines.push(
      <line key={`h${y}`} x1={0} y1={y} x2={CANVAS_W} y2={y} stroke="#e5e7eb" strokeWidth={0.5} />
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
          <g key={`${d.x}-${d.y}`}>
            <circle
              cx={d.x}
              cy={d.y}
              r={8}
              fill="#fbbf24"
              stroke="#92400e"
              strokeWidth={1.5}
              opacity={0.85}
            />
            <text x={d.x - 5} y={d.y + 4} fontSize={10}>
              🚪
            </text>
          </g>
        ))}

        {result && <LayoutOverlay result={result} />}
      </svg>

      <div className="flex gap-4 mt-1.5 text-[11px] text-muted-foreground">
        <span>━━ Wall</span>
        <span className="text-amber-400">● Door</span>
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
