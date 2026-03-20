import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas';
import { useFloorPlan } from './useFloorPlan';

export function FloorPlanEditor() {
  const {
    walls,
    doors,
    result,
    isPending,
    error,
    handleGenerate,
    handleClear,
    handleWallsChange,
    handleDoorsChange,
  } = useFloorPlan();

  return (
    <div>
      <DrawingCanvas
        walls={walls}
        doors={doors}
        result={result}
        onWallsChange={handleWallsChange}
        onDoorsChange={handleDoorsChange}
      />

      {/* Stats */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <Badge variant="outline">
          {walls.length} wall{walls.length !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline">
          {doors.length} door{doors.length !== 1 ? 's' : ''}
        </Badge>
        {result && (
          <>
            <Badge className="bg-blue-500 text-white">
              {result.outlets.length} outlet
              {result.outlets.length !== 1 ? 's' : ''}
            </Badge>
            <Badge className="bg-amber-500 text-white">
              {result.wires.length} wire{result.wires.length !== 1 ? 's' : ''}
            </Badge>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <Button
          className="cursor-pointer"
          onClick={handleGenerate}
          disabled={walls.length === 0 || isPending}
        >
          <Zap className="w-4 h-4" />
          {isPending ? 'Generating…' : 'Generate'}
        </Button>
        <Button className="cursor-pointer" variant="outline" onClick={handleClear}>
          Clear All
        </Button>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">Error: {error.message}</p>}
    </div>
  );
}
