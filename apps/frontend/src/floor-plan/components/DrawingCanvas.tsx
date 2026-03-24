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
import { ThreeDViewer } from './viewer3d/ThreeDViewer';

export function DrawingCanvas({
  walls,
  doors,
  labels,
  result,
  unit,
  show3D = false,
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
  // Index of the wall/door/label closest to the cursor while in delete mode
  const [deleteHoverWall, setDeleteHoverWall] = useState<number | null>(null);
  const [deleteHoverDoor, setDeleteHoverDoor] = useState<number | null>(null);
  const [deleteHoverLabel, setDeleteHoverLabel] = useState<number | null>(null);

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

      if (mode === 'delete') {
        // Find the wall closest to the cursor
        const DELETE_THRESHOLD = 12;
        let closestWall: number | null = null;
        let closestWallDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < walls.length; i++) {
          const { dist } = projectOntoWall(p, walls[i]);
          if (dist < closestWallDist) {
            closestWallDist = dist;
            closestWall = i;
          }
        }
        setDeleteHoverWall(
          closestWall !== null && closestWallDist <= DELETE_THRESHOLD ? closestWall : null
        );

        // Find the door closest to the cursor
        let closestDoor: number | null = null;
        let closestDoorDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < doors.length; i++) {
          const dist = Math.hypot(p.x - doors[i].x, p.y - doors[i].y);
          if (dist < closestDoorDist) {
            closestDoorDist = dist;
            closestDoor = i;
          }
        }
        setDeleteHoverDoor(
          closestDoor !== null && closestDoorDist <= DELETE_THRESHOLD * 3 ? closestDoor : null
        );

        // Find the label closest to the cursor
        let closestLabel: number | null = null;
        let closestLabelDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < labels.length; i++) {
          const dist = Math.hypot(p.x - labels[i].x, p.y - labels[i].y);
          if (dist < closestLabelDist) {
            closestLabelDist = dist;
            closestLabel = i;
          }
        }
        setDeleteHoverLabel(
          closestLabel !== null && closestLabelDist <= DELETE_THRESHOLD * 3 ? closestLabel : null
        );
      } else {
        setDeleteHoverWall(null);
        setDeleteHoverDoor(null);
        setDeleteHoverLabel(null);
      }
    },
    [panHandlers, mode, walls, doors, labels]
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

      if (mode === 'delete') {
        // Reason: check labels first (pure text points), then doors (sit on walls), then walls
        const DELETE_THRESHOLD = 12;

        let closestLabel: number | null = null;
        let closestLabelDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < labels.length; i++) {
          const dist = Math.hypot(raw.x - labels[i].x, raw.y - labels[i].y);
          if (dist < closestLabelDist) {
            closestLabelDist = dist;
            closestLabel = i;
          }
        }
        if (closestLabel !== null && closestLabelDist <= DELETE_THRESHOLD * 3) {
          onLabelsChange(labels.filter((_, i) => i !== closestLabel));
          return;
        }

        let closestDoor: number | null = null;
        let closestDoorDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < doors.length; i++) {
          const dist = Math.hypot(raw.x - doors[i].x, raw.y - doors[i].y);
          if (dist < closestDoorDist) {
            closestDoorDist = dist;
            closestDoor = i;
          }
        }
        if (closestDoor !== null && closestDoorDist <= DELETE_THRESHOLD * 3) {
          onDoorsChange(doors.filter((_, i) => i !== closestDoor));
          return;
        }

        let closestWall: number | null = null;
        let closestWallDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < walls.length; i++) {
          const { dist } = projectOntoWall(raw, walls[i]);
          if (dist < closestWallDist) {
            closestWallDist = dist;
            closestWall = i;
          }
        }
        if (closestWall !== null && closestWallDist <= DELETE_THRESHOLD) {
          onWallsChange(walls.filter((_, i) => i !== closestWall));
        }
        return;
      }

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
    [
      mode,
      activePan,
      wallStart,
      walls,
      doors,
      labels,
      onWallsChange,
      onDoorsChange,
      onLabelsChange,
      startLabel,
    ]
  );

  function handleModeChange(next: DrawMode) {
    setMode(next);
    setWallStart(null);
    cancelLabel();
    setDeleteHoverWall(null);
    setDeleteHoverDoor(null);
    setDeleteHoverLabel(null);
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
      : mode === 'delete'
        ? 'cursor-pointer'
        : 'cursor-crosshair';

  return (
    <div>
      {show3D ? (
        <ThreeDViewer
          walls={walls}
          doors={doors}
          result={result}
          width={CANVAS_W}
          height={CANVAS_H}
        />
      ) : (
        <>
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
              walls.map((w, i) => (
                <line
                  key={`${w.x1}-${w.y1}-${w.x2}-${w.y2}`}
                  x1={w.x1}
                  y1={w.y1}
                  x2={w.x2}
                  y2={w.y2}
                  stroke={mode === 'delete' && deleteHoverWall === i ? '#ef4444' : '#1f2937'}
                  strokeWidth={mode === 'delete' && deleteHoverWall === i ? 5 : 3}
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

            {visibility.doors &&
              doors.map((d, i) => (
                <DoorSymbol
                  key={`${d.x}-${d.y}`}
                  door={d}
                  highlight={mode === 'delete' && deleteHoverDoor === i}
                />
              ))}

            {visibility.labels &&
              labels.map((label, i) => (
                <text
                  key={`label-${label.x},${label.y}-${label.text}`}
                  x={label.x}
                  y={label.y}
                  fontSize={13}
                  fontWeight="600"
                  fill={mode === 'delete' && deleteHoverLabel === i ? '#ef4444' : '#6b21a8'}
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
        </>
      )}
    </div>
  );
}
