import { useCallback, useEffect, useRef, useState } from 'react';
import type { Point } from '../../types';
import { CANVAS_H, CANVAS_W } from '../utils/floor-plan.utils';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

export type ZoomPanHandlers = {
  /** Call on SVG onMouseDown to start a middle-mouse or left-drag pan. */
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>) => void;
  /**
   * Call on SVG onMouseMove.
   * Returns true if a pan was in progress and was handled
   * (caller should skip hover update in that case).
   */
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => boolean;
  /** Call on SVG onMouseUp to end a pan. */
  onMouseUp: (e: React.MouseEvent<SVGSVGElement>) => void;
  /** Call on SVG onMouseLeave to cancel any active pan. */
  onMouseLeave: () => void;
};

export type UseZoomPanReturn = {
  zoom: number;
  pan: Point;
  viewBox: string;
  /** True while a drag-pan gesture is actively in progress (use for grabbing cursor). */
  isPanning: boolean;
  adjustZoom: (next: number) => void;
  resetView: () => void;
  panHandlers: ZoomPanHandlers;
};

/**
 * Manages zoom and pan state for an SVG canvas.
 * Attaches a non-passive wheel listener for scroll-to-zoom (cursor-anchored).
 * Middle-mouse-button drag always pans. Left-button drag pans when panModeActive is true.
 */
export function useZoomPan(
  svgRef: React.RefObject<SVGSVGElement | null>,
  /** When true, left-click drag also pans (e.g. hand tool or space key held). */
  panModeActive = false
): UseZoomPanReturn {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Refs let the wheel handler read current state without re-registering
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ mouse: Point; pan: Point } | null>(null);

  const viewBox = `${pan.x} ${pan.y} ${CANVAS_W / zoom} ${CANVAS_H / zoom}`;

  // Reset in-progress pan when pan mode is deactivated (e.g. Space released mid-drag)
  useEffect(() => {
    if (!panModeActive) {
      isPanningRef.current = false;
      panStartRef.current = null;
      setIsPanning(false);
    }
  }, [panModeActive]);

  /** Zoom toward the canvas center, clamped to [MIN_ZOOM, MAX_ZOOM]. */
  function adjustZoom(next: number) {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    // Keep the visible center stable when zooming with the buttons
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

  // Reason: wheel must be registered with { passive: false } so we can call
  // preventDefault() and stop the page from scrolling while zooming the canvas.
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

      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPos = pt.matrixTransform(ctm.inverse());

      // Reason: keep the point under the cursor fixed after zoom.
      // Derived from: svgPos.x = newPan.x + (svgPos.x - curPan.x) * (newZoom / curZoom)
      setPan({
        x: svgPos.x - (svgPos.x - curPan.x) * (curZoom / newZoom),
        y: svgPos.y - (svgPos.y - curPan.y) * (curZoom / newZoom),
      });
      setZoom(newZoom);
    }

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
    // Reason: svgRef is a stable object (useRef), so this dep never triggers a re-run.
    // The linter requires it because svgRef.current is read inside the effect.
  }, [svgRef]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const isMiddle = e.button === 1;
      const isLeftPan = e.button === 0 && panModeActive;
      if (!isMiddle && !isLeftPan) return;
      e.preventDefault();
      isPanningRef.current = true;
      setIsPanning(true);
      panStartRef.current = { mouse: { x: e.clientX, y: e.clientY }, pan: { ...pan } };
    },
    [pan, panModeActive]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>): boolean => {
      if (!isPanningRef.current || !panStartRef.current) return false;
      // Reason: delta in SVG logical units = screen delta / current zoom
      const dx = (e.clientX - panStartRef.current.mouse.x) / zoom;
      const dy = (e.clientY - panStartRef.current.mouse.y) / zoom;
      setPan({ x: panStartRef.current.pan.x - dx, y: panStartRef.current.pan.y - dy });
      return true;
    },
    [zoom]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const isMiddle = e.button === 1;
      const isLeftPan = e.button === 0 && panModeActive;
      if (isMiddle || isLeftPan) {
        isPanningRef.current = false;
        panStartRef.current = null;
        setIsPanning(false);
      }
    },
    [panModeActive]
  );

  const onMouseLeave = useCallback(() => {
    isPanningRef.current = false;
    panStartRef.current = null;
    setIsPanning(false);
  }, []);

  return {
    zoom,
    pan,
    viewBox,
    isPanning,
    adjustZoom,
    resetView,
    panHandlers: { onMouseDown, onMouseMove, onMouseUp, onMouseLeave },
  };
}
