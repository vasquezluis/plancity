import { Button } from '@/components/ui/button';
import { FileImage, Hand, ImageDown, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

type Props = {
  zoom: number;
  panActive: boolean;
  exportDisabled: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onTogglePan: () => void;
  onExport: () => void;
  onExportSvg: () => void;
};

/** Zoom in/out/reset, pan toggle, and PNG/SVG export buttons. */
export function ZoomControls({
  zoom,
  panActive,
  exportDisabled,
  onZoomIn,
  onZoomOut,
  onReset,
  onTogglePan,
  onExport,
  onExportSvg,
}: Props) {
  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="outline"
        className="cursor-pointer px-2 rounded-lg"
        onClick={onZoomOut}
        title="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>

      <span className="text-xs text-muted-foreground w-11 text-center tabular-nums font-medium select-none">
        {Math.round(zoom * 100)}%
      </span>

      <Button
        size="sm"
        variant="outline"
        className="cursor-pointer px-2 rounded-lg"
        onClick={onZoomIn}
        title="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="cursor-pointer px-2 rounded-lg"
        onClick={onReset}
        title="Reset view"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>

      <Button
        size="sm"
        variant={panActive ? 'default' : 'outline'}
        className="cursor-pointer px-2 rounded-lg"
        title="Pan (or hold Space)"
        onClick={onTogglePan}
      >
        <Hand className="w-4 h-4" />
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      <Button
        size="sm"
        variant="outline"
        className="cursor-pointer px-2 rounded-lg"
        title="Export as PNG"
        disabled={exportDisabled}
        onClick={onExport}
      >
        <ImageDown className="w-4 h-4" />
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="cursor-pointer px-2 rounded-lg"
        title="Export as SVG"
        disabled={exportDisabled}
        onClick={onExportSvg}
      >
        <FileImage className="w-4 h-4" />
      </Button>
    </div>
  );
}
