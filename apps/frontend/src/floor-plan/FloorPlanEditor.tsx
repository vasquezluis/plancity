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

  // AI-optimized layout — replaces `result` on the canvas when set
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

  // Show AI-optimized layout when available, otherwise show the generated one
  const displayResult = aiResult ?? result;

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

        <span className="text-xs text-foreground">5 req / min</span>
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

      {/* Stats */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <Badge variant="outline">
          {walls.length} wall{walls.length !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline">
          {doors.length} door{doors.length !== 1 ? 's' : ''}
        </Badge>
        {displayResult && (
          <>
            <Badge className="bg-blue-500 text-white">
              {displayResult.outlets.length} outlet
              {displayResult.outlets.length !== 1 ? 's' : ''}
            </Badge>
            <Badge className="bg-amber-500 text-white">
              {displayResult.wires.length} wire{displayResult.wires.length !== 1 ? 's' : ''}
            </Badge>
            <Badge variant="outline">
              {computeWireLength(displayResult.wires, unit)} {unit} total wire
            </Badge>
            {aiResult && <Badge className="bg-purple-500 text-white">AI optimized</Badge>}
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
        {result && (
          <Button
            className="cursor-pointer"
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
            className="cursor-pointer"
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
        <div className="mt-3 p-3 rounded-md border border-destructive/30 bg-destructive/5 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-destructive">Generation failed</p>
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
