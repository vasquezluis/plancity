import { Button } from '@/components/ui/button';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
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

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

export function DrawingCanvas({
  walls,
  doors,
  labels,
  result,
  unit,
  onWallsChange,
  onDoorsChange,
  onLabelsChange,
}: DrawingCanvasProps) {
  const [mode, setMode] = useState<'wall' | 'door' | 'text'>('wall');
  const [wallStart, setWallStart] = useState<Point | null>(null);
  const [hover, setHover] = useState<Point | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  // Refs so the non-React wheel handler can read current state without re-registration
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;
  // Pending text label being typed by the user
  const [pendingLabel, setPendingLabel] = useState<{ x: number; y: number } | null>(null);
  const [labelText, setLabelText] = useState('');
  // Middle-mouse pan tracking
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ mouse: Point; pan: Point } | null>(null);

  // ── Zoom / pan helpers ──────────────────────────────────────────────────────
  const viewBox = `${pan.x} ${pan.y} ${CANVAS_W / zoom} ${CANVAS_H / zoom}`;

  /** Zoom toward the canvas center, clamped to [MIN_ZOOM, MAX_ZOOM]. */
  function adjustZoom(next: number) {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    // Keep the visible center stable when zooming with buttons
    const cx = pan.x + CANVAS_W / zoom / 2;
    const cy = pan.y + CANVAS_H / zoom / 2;
    const newW = CANVAS_W / clamped;
    const newH = CANVAS_H / clamped;
    setPan({ x: cx - newW / 2, y: cy - newH / 2 });
    setZoom(clamped);
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  // Reason: wheel event must be registered with { passive: false } so we can call
  // preventDefault() and prevent the page from scrolling while zooming the canvas.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function handleWheel(e: WheelEvent) {
      if (!svg) return; // Reason: TypeScript closure narrowing guard
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const curZoom = zoomRef.current;
      const curPan = panRef.current;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, curZoom * factor));

      // Convert cursor position to SVG logical coordinates
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPos = pt.matrixTransform(ctm.inverse());

      // Reason: keep the point under the cursor fixed in SVG space after zoom.
      // Derived from: svgPos.x = newPan.x + (svgPos.x - curPan.x) * (newZoom / curZoom)
      const newPanX = svgPos.x - (svgPos.x - curPan.x) * (curZoom / newZoom);
      const newPanY = svgPos.y - (svgPos.y - curPan.y) * (curZoom / newZoom);
      setPan({ x: newPanX, y: newPanY });
      setZoom(newZoom);
    }

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, []); // register once — reads zoom/pan via refs

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
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 1) return; // only middle mouse starts a pan
      e.preventDefault();
      isPanningRef.current = true;
      panStartRef.current = { mouse: { x: e.clientX, y: e.clientY }, pan: { ...pan } };
    },
    [pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isPanningRef.current && panStartRef.current) {
        // Reason: delta in SVG logical units = screen delta / current zoom
        const dx = (e.clientX - panStartRef.current.mouse.x) / zoom;
        const dy = (e.clientY - panStartRef.current.mouse.y) / zoom;
        setPan({ x: panStartRef.current.pan.x - dx, y: panStartRef.current.pan.y - dy });
        return;
      }
      const p = svgPoint(e);
      setHover({ x: snap(p.x), y: snap(p.y) });
    },
    [zoom]
  );

  const handleMouseUp = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1) {
      isPanningRef.current = false;
      panStartRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    isPanningRef.current = false;
    panStartRef.current = null;
    setHover(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0) return; // only left-click draws
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
      } else if (mode === 'text') {
        // Open the inline text input at the clicked SVG coordinate
        setPendingLabel({ x: snap(raw.x), y: snap(raw.y) });
        setLabelText('');
      }
    },
    [mode, wallStart, walls, doors, onWallsChange, onDoorsChange]
  );

  /** Confirm the pending label and add it to the list. */
  function confirmLabel() {
    if (pendingLabel && labelText.trim()) {
      onLabelsChange([...labels, { x: pendingLabel.x, y: pendingLabel.y, text: labelText.trim() }]);
    }
    setPendingLabel(null);
    setLabelText('');
  }

  function cancelLabel() {
    setPendingLabel(null);
    setLabelText('');
  }

  function handleModeChange(next: 'wall' | 'door' | 'text') {
    setMode(next);
    setWallStart(null);
    cancelLabel();
  }

  function handleClear() {
    onWallsChange([]);
    onDoorsChange([]);
    onLabelsChange([]);
    setWallStart(null);
    cancelLabel();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <DrawingToolbar
          mode={mode}
          wallStarted={wallStart !== null}
          onModeChange={handleModeChange}
          onClear={handleClear}
        />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer px-2"
            onClick={() => adjustZoom(zoom * 1.25)}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer px-2"
            onClick={() => adjustZoom(zoom * 0.8)}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" className="cursor-pointer px-2" onClick={resetView}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <svg
        ref={svgRef}
        width={CANVAS_W}
        height={CANVAS_H}
        viewBox={viewBox}
        className="rounded border border-border bg-white cursor-crosshair"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
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

        {/* Text labels */}
        {labels.map((label) => (
          <text
            key={`label-${label.x},${label.y}-${label.text}`}
            x={label.x}
            y={label.y}
            fontSize={13}
            fontWeight="600"
            fill="#6b21a8"
            stroke="white"
            strokeWidth={3}
            paintOrder="stroke"
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {label.text}
          </text>
        ))}

        {/* Inline text input while placing a new label */}
        {pendingLabel && (
          <foreignObject x={pendingLabel.x} y={pendingLabel.y - 22} width={200} height={28}>
            <div>
              <input
                // biome-ignore lint/a11y/noAutofocus: intentional — user just clicked to place a label
                autoFocus
                type="text"
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmLabel();
                  if (e.key === 'Escape') cancelLabel();
                }}
                onBlur={confirmLabel}
                placeholder="Room name…"
                style={{
                  width: '100%',
                  fontSize: '13px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  border: '1.5px solid #6b21a8',
                  borderRadius: '4px',
                  outline: 'none',
                  background: 'white',
                  color: '#6b21a8',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </foreignObject>
        )}

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
    </div>
  );
}
