import { useCallback, useEffect, useRef, useState } from 'react';
import type { Point } from '../../types';
import { useLabelInput } from '../hooks/useLabelInput';
import { useZoomPan } from '../hooks/useZoomPan';
import {
  DEFAULT_VISIBILITY,
  type DrawMode,
  type DrawingCanvasProps,
  type LayerVisibility,
} from '../types/floor-plan.types';
import { computeContentBounds, exportPng, exportSvg } from '../utils/export';
import { CANVAS_H, CANVAS_W, projectOntoWall, snap, svgPoint } from '../utils/floor-plan.utils';
import { CanvasFooter } from './CanvasFooter';
import { CanvasGrid } from './CanvasGrid';
import { DoorSymbol } from './DoorSymbol';
import { DrawingToolbar } from './DrawingToolbar';
import { LabelInput } from './LabelInput';
import { LayerToggles } from './LayerToggles';
import { LayoutOverlay } from './LayoutOverlay';
import { WallMeasurements } from './WallMeasurements';
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
  const [mode, setMode] = useState<DrawMode>('wall');
  const [wallStart, setWallStart] = useState<Point | null>(null);
  const [hover, setHover] = useState<Point | null>(null);
  // True while the Space key is held — temporarily activates pan regardless of mode
  const [tempPan, setTempPan] = useState(false);
  const [visibility, setVisibility] = useState<LayerVisibility>(DEFAULT_VISIBILITY);

  function toggleLayer(key: keyof LayerVisibility, value: boolean) {
    setVisibility((prev) => ({ ...prev, [key]: value }));
  }
  const svgRef = useRef<SVGSVGElement>(null);

  const activePan = mode === 'pan' || tempPan;
  const { zoom, viewBox, isPanning, adjustZoom, resetView, panHandlers } = useZoomPan(
    svgRef,
    activePan
  );
  const { pendingLabel, labelText, setLabelText, startLabel, confirmLabel, cancelLabel } =
    useLabelInput(labels, onLabelsChange);

  // Space key: hold to pan temporarily, release to restore previous mode
  useEffect(() => {
    function down(e: KeyboardEvent) {
      // Reason: don't hijack Space while the user is typing in a label input
      if (e.code === 'Space' && !e.repeat && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setTempPan(true);
      }
    }
    function up(e: KeyboardEvent) {
      if (e.code === 'Space') setTempPan(false);
    }
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

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
      if (activePan) return; // pan mode swallows clicks

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
    [mode, activePan, wallStart, walls, doors, onWallsChange, onDoorsChange, startLabel]
  );

  function handleModeChange(next: DrawMode) {
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

  function handleExportSvg() {
    if (!svgRef.current) return;
    const bounds = computeContentBounds(walls, doors, labels, result);
    if (bounds) exportSvg(svgRef.current, bounds);
  }

  const canvasCursor = isPanning
    ? 'cursor-grabbing'
    : activePan
      ? 'cursor-grab'
      : 'cursor-crosshair';

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
          panActive={mode === 'pan'}
          exportDisabled={
            walls.length === 0 && doors.length === 0 && labels.length === 0 && !result
          }
          onZoomIn={() => adjustZoom(zoom * 1.25)}
          onZoomOut={() => adjustZoom(zoom * 0.8)}
          onReset={resetView}
          onTogglePan={() => handleModeChange(mode === 'pan' ? 'wall' : 'pan')}
          onExport={handleExport}
          onExportSvg={handleExportSvg}
        />
      </div>

      <svg
        ref={svgRef}
        width={CANVAS_W}
        height={CANVAS_H}
        viewBox={viewBox}
        className={`rounded border border-border bg-white ${canvasCursor}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onKeyUp={() => {}}
      >
        <title>Interactive drawing canvas for floor plans</title>
        <CanvasGrid unit={unit} />

        {visibility.walls &&
          walls.map((w) => (
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

        {visibility.measurements && (
          <WallMeasurements
            walls={walls}
            unit={unit}
            preview={
              mode === 'wall' && !activePan && wallStart && hover
                ? { x1: wallStart.x, y1: wallStart.y, x2: hover.x, y2: hover.y }
                : null
            }
          />
        )}

        {wallStart && <circle cx={wallStart.x} cy={wallStart.y} r={4} fill="#3b82f6" />}

        {mode === 'wall' && !activePan && wallStart && hover && (
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

        {visibility.doors && doors.map((d) => <DoorSymbol key={`${d.x}-${d.y}`} door={d} />)}

        {visibility.labels &&
          labels.map((label) => (
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

        {result && (
          <LayoutOverlay
            result={result}
            showWires={visibility.wires}
            showOutlets={visibility.outlets}
            showSwitches={visibility.switches}
            showPanel={visibility.panel}
          />
        )}
      </svg>

      <LayerToggles visibility={visibility} hasResult={!!result} onChange={toggleLayer} />

      <CanvasFooter hover={hover} unit={unit} result={result} />
    </div>
  );
}
