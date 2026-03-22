import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Timer, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';
import type { Label } from '../types';
import { DrawingCanvas } from './components/DrawingCanvas';
import { useFloorPlan } from './hooks/useFloorPlan';
import type { Unit } from './utils/floor-plan.utils';

export function FloorPlanEditor() {
  const {
    walls,
    doors,
    result,
    isPending,
    error,
    rateLimit,
    retryIn,
    handleGenerate,
    handleClear,
    handleWallsChange,
    handleDoorsChange,
  } = useFloorPlan();

  const [unit, setUnit] = useState<Unit>('m');
  const [labels, setLabels] = useState<Label[]>([]);

  const isRateLimited = rateLimit.remaining === 0 && retryIn > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        {/* Unit toggle */}
        <div className="flex items-center rounded-md border border-border overflow-hidden text-xs font-medium">
          <button
            type="button"
            className={`px-3 py-1 cursor-pointer transition-colors ${unit === 'm' ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
            onClick={() => setUnit('m')}
          >
            m
          </button>
          <button
            type="button"
            className={`px-3 py-1 cursor-pointer transition-colors ${unit === 'ft' ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
            onClick={() => setUnit('ft')}
          >
            ft
          </button>
        </div>

        {/* Rate limit indicator */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>
            {rateLimit.remaining}/{rateLimit.limit} requests left
          </span>
          {/* Dots visualising remaining uses */}
          <div className="flex gap-0.5 ml-1">
            {Array.from({ length: rateLimit.limit }).map((_, i) => (
              <span
                // Reason: index is stable here — limit is a fixed constant (3)
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length constant array
                key={i}
                className={`w-2 h-2 rounded-full ${i < rateLimit.remaining ? 'bg-green-500' : 'bg-muted'}`}
              />
            ))}
          </div>
        </div>
      </div>

      <DrawingCanvas
        walls={walls}
        doors={doors}
        labels={labels}
        result={result}
        unit={unit}
        onWallsChange={handleWallsChange}
        onDoorsChange={handleDoorsChange}
        onLabelsChange={setLabels}
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
          disabled={walls.length === 0 || isPending || isRateLimited}
        >
          <Zap className="w-4 h-4" />
          {isPending ? 'Generating…' : 'Generate'}
        </Button>
        <Button className="cursor-pointer" variant="outline" onClick={handleClear}>
          <Trash2 className="w-4 h-4" />
          Clear All
        </Button>
      </div>

      {/* Rate limit warning */}
      {isRateLimited && (
        <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
          <Timer className="w-4 h-4" />
          Rate limit reached. Try again in {retryIn}s.
        </p>
      )}

      {error && !isRateLimited && (
        <p className="mt-2 text-sm text-destructive">Error: {error.message}</p>
      )}
    </div>
  );
}
