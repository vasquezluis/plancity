import { useCallback, useRef, useState } from 'react';
import type { Point } from '../../types';
import { useLabelInput } from '../hooks/useLabelInput';
import { useZoomPan } from '../hooks/useZoomPan';
import type { DrawingCanvasProps } from '../types/floor-plan.types';
import { computeContentBounds, exportPng } from '../utils/export';
import { CANVAS_H, CANVAS_W, projectOntoWall, snap, svgPoint } from '../utils/floor-plan.utils';
import { CanvasFooter } from './CanvasFooter';
import { CanvasGrid } from './CanvasGrid';
import { DoorSymbol } from './DoorSymbol';
import { DrawingToolbar } from './DrawingToolbar';
import { LabelInput } from './LabelInput';
import { LayoutOverlay } from './LayoutOverlay';
import { ZoomControls } from './ZoomControls';

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
  const svgRef = useRef<SVGSVGElement>(null);

  const { zoom, viewBox, adjustZoom, resetView, panHandlers } = useZoomPan(svgRef);
  const { pendingLabel, labelText, setLabelText, startLabel, confirmLabel, cancelLabel } =
    useLabelInput(labels, onLabelsChange);

  // ── Mouse handlers ──────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => panHandlers.onMouseDown(e),
    [panHandlers]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (panHandlers.onMouseMove(e)) return; // pan consumed the event
      const p = svgPoint(e);
      setHover({ x: snap(p.x), y: snap(p.y) });
    },
    [panHandlers]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => panHandlers.onMouseUp(e),
    [panHandlers]
  );

  const handleMouseLeave = useCallback(() => {
    panHandlers.onMouseLeave();
    setHover(null);
  }, [panHandlers]);

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
        startLabel({ x: snap(raw.x), y: snap(raw.y) });
      }
    },
    [mode, wallStart, walls, doors, onWallsChange, onDoorsChange, startLabel]
  );

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

  function handleExport() {
    if (!svgRef.current) return;
    const bounds = computeContentBounds(walls, doors, labels, result);
    if (bounds) exportPng(svgRef.current, bounds);
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
        <ZoomControls
          zoom={zoom}
          exportDisabled={
            walls.length === 0 && doors.length === 0 && labels.length === 0 && !result
          }
          onZoomIn={() => adjustZoom(zoom * 1.25)}
          onZoomOut={() => adjustZoom(zoom * 0.8)}
          onReset={resetView}
          onExport={handleExport}
        />
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
        <CanvasGrid unit={unit} />

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
          <DoorSymbol key={`${d.x}-${d.y}`} door={d} />
        ))}

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

        {pendingLabel && (
          <LabelInput
            x={pendingLabel.x}
            y={pendingLabel.y}
            value={labelText}
            onChange={setLabelText}
            onConfirm={confirmLabel}
            onCancel={cancelLabel}
          />
        )}

        {result && <LayoutOverlay result={result} />}
      </svg>

      <CanvasFooter hover={hover} unit={unit} result={result} />
    </div>
  );
}
