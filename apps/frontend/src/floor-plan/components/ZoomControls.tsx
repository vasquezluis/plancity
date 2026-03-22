import { Button } from '@/components/ui/button';
import { ImageDown, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

type Props = {
  zoom: number;
  exportDisabled: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onExport: () => void;
};

/** Zoom in/out/reset buttons and the PNG export button. */
export function ZoomControls({
  zoom,
  exportDisabled,
  onZoomIn,
  onZoomOut,
  onReset,
  onExport,
}: Props) {
  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant="outline" className="cursor-pointer px-2" onClick={onZoomIn}>
        <ZoomIn className="w-4 h-4" />
      </Button>
      <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">
        {Math.round(zoom * 100)}%
      </span>
      <Button size="sm" variant="outline" className="cursor-pointer px-2" onClick={onZoomOut}>
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="outline" className="cursor-pointer px-2" onClick={onReset}>
        <RotateCcw className="w-4 h-4" />
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      <Button
        size="sm"
        variant="outline"
        className="cursor-pointer px-2"
        title="Export as PNG"
        disabled={exportDisabled}
        onClick={onExport}
      >
        <ImageDown className="w-4 h-4" />
      </Button>
    </div>
  );
}
