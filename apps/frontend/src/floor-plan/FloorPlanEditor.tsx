import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Box, Sparkles, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';
import type { GenerateResponse, Label } from '../types';
import { postAiAnalysis } from './api/ai.api';
import { AiPanel } from './components/AiPanel';
import { DrawingCanvas } from './components/DrawingCanvas';
import { RateLimitBanner } from './components/RateLimitBanner';
import { useFloorPlan } from './hooks/useFloorPlan';
import { type Unit, computeWireLength } from './utils/floor-plan.utils';

export function FloorPlanEditor() {
  const {
    walls,
    doors,
    result,
    isPending,
    error,
    isRateLimited,
    handleGenerate: _handleGenerate,
    handleClear: _handleClear,
    handleWallsChange,
    handleDoorsChange,
  } = useFloorPlan();

  const [unit, setUnit] = useState<Unit>('m');
  const [labels, setLabels] = useState<Label[]>([]);
  const [show3D, setShow3D] = useState(false);

  const [aiResult, setAiResult] = useState<GenerateResponse | null>(null);
  const [aiChanges, setAiChanges] = useState<string[] | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiPending, setAiPending] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  function clearAi() {
    setAiResult(null);
    setAiChanges(null);
    setAiExplanation(null);
    setAiError(null);
  }

  function handleGenerate() {
    clearAi();
    _handleGenerate();
  }

  function handleClear() {
    clearAi();
    _handleClear();
  }

  async function handleAiAnalyze() {
    const layout = aiResult ?? result;
    if (!layout) return;
    setAiPending(true);
    setAiError(null);
    setAiChanges(null);
    try {
      const { changes, explanation, ...enhanced } = await postAiAnalysis(
        { walls, doors },
        layout,
        unit
      );
      setAiResult(enhanced);
      setAiChanges(changes);
      setAiExplanation(explanation);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI analysis failed');
    } finally {
      setAiPending(false);
    }
  }

  const displayResult = aiResult ?? result;

  return (
    <div className="space-y-4">
      {/* Toolbar header row */}
      <div className="flex items-center justify-between">
        {/* Unit toggle */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs font-semibold bg-muted/40">
          <button
            type="button"
            className={`px-3 py-1.5 cursor-pointer transition-colors ${
              unit === 'm'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            onClick={() => setUnit('m')}
          >
            Meters
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 cursor-pointer transition-colors ${
              unit === 'ft'
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            onClick={() => setUnit('ft')}
          >
            Feet
          </button>
        </div>

        <span className="text-xs text-muted-foreground">5 requests / min</span>
      </div>

      <DrawingCanvas
        walls={walls}
        doors={doors}
        labels={labels}
        result={displayResult}
        unit={unit}
        show3D={show3D}
        onWallsChange={handleWallsChange}
        onDoorsChange={handleDoorsChange}
        onLabelsChange={setLabels}
      />

      {/* Stats row */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="text-xs rounded-full">
          {walls.length} wall{walls.length !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline" className="text-xs rounded-full">
          {doors.length} door{doors.length !== 1 ? 's' : ''}
        </Badge>
        {displayResult && (
          <>
            <Badge className="text-xs rounded-full bg-blue-500 text-white border-0">
              {displayResult.outlets.length} outlet{displayResult.outlets.length !== 1 ? 's' : ''}
            </Badge>
            <Badge
              className="text-xs rounded-full border-0 text-white"
              style={{ backgroundColor: 'var(--brand)' }}
            >
              {displayResult.wires.length} wire{displayResult.wires.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline" className="text-xs rounded-full">
              {computeWireLength(displayResult.wires, unit)} {unit} wire total
            </Badge>
            {aiResult && (
              <Badge className="text-xs rounded-full bg-violet-500 text-white border-0">
                AI optimized
              </Badge>
            )}
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          className="cursor-pointer gap-2 rounded-lg text-sm font-semibold"
          onClick={handleGenerate}
          disabled={walls.length === 0 || isPending || isRateLimited}
        >
          <Zap className="w-4 h-4" />
          {isPending ? 'Generating…' : 'Generate'}
        </Button>

        <Button
          className="cursor-pointer gap-2 rounded-lg text-sm"
          variant="outline"
          onClick={handleClear}
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </Button>

        {result && (
          <Button
            className="cursor-pointer gap-2 rounded-lg text-sm"
            variant="outline"
            onClick={handleAiAnalyze}
            disabled={aiPending || isRateLimited}
          >
            <Sparkles className="w-4 h-4" />
            {aiPending ? 'Optimizing…' : 'Optimize with AI'}
          </Button>
        )}

        {walls.length > 0 && (
          <Button
            className="cursor-pointer gap-2 rounded-lg text-sm"
            variant={show3D ? 'default' : 'outline'}
            onClick={() => setShow3D((v) => !v)}
          >
            <Box className="w-4 h-4" />
            {show3D ? '2D View' : '3D View'}
          </Button>
        )}
      </div>

      {isRateLimited && <RateLimitBanner />}

      {error && !isRateLimited && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-destructive">Generation failed</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error.message}</p>
          </div>
        </div>
      )}

      <AiPanel
        changes={aiChanges}
        explanation={aiExplanation}
        isPending={aiPending}
        error={aiError}
      />
    </div>
  );
}
