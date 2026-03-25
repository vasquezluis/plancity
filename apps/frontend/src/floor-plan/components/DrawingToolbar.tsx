import { Button } from '@/components/ui/button';
import { DoorOpen, Eraser, PenLine, Trash2, Type } from 'lucide-react';
import type { DrawMode } from '../types/floor-plan.types';

type Props = {
  mode: DrawMode;
  wallStarted: boolean;
  onModeChange: (mode: DrawMode) => void;
  onClear: () => void;
};

const HINTS: Record<DrawMode, { active: string; idle: string }> = {
  wall: { active: 'Click to finish wall', idle: 'Click to start a wall' },
  door: {
    active: 'Click near a wall to place door',
    idle: 'Click near a wall to place door',
  },
  text: { active: 'Type and press Enter to confirm', idle: 'Click to place a label' },
  pan: { active: 'Drag to pan — or hold Space', idle: 'Drag to pan — or hold Space' },
  delete: {
    active: 'Click a wall or door to delete it',
    idle: 'Click a wall or door to delete it',
  },
};

export function DrawingToolbar({ mode, wallStarted, onModeChange, onClear }: Props) {
  const hint = wallStarted ? HINTS[mode].active : HINTS[mode].idle;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Button
        size="sm"
        className="cursor-pointer gap-1.5 rounded-lg"
        variant={mode === 'wall' ? 'default' : 'outline'}
        onClick={() => onModeChange('wall')}
      >
        <PenLine className="w-3.5 h-3.5" />
        Wall
      </Button>

      <Button
        size="sm"
        className="cursor-pointer gap-1.5 rounded-lg"
        variant={mode === 'door' ? 'default' : 'outline'}
        onClick={() => onModeChange('door')}
      >
        <DoorOpen className="w-3.5 h-3.5" />
        Door
      </Button>

      <Button
        size="sm"
        className="cursor-pointer gap-1.5 rounded-lg"
        variant={mode === 'text' ? 'default' : 'outline'}
        onClick={() => onModeChange('text')}
      >
        <Type className="w-3.5 h-3.5" />
        Label
      </Button>

      <Button
        size="sm"
        className="cursor-pointer gap-1.5 rounded-lg"
        variant={mode === 'delete' ? 'destructive' : 'outline'}
        onClick={() => onModeChange('delete')}
      >
        <Eraser className="w-3.5 h-3.5" />
        Delete
      </Button>

      <Button
        size="sm"
        className="cursor-pointer gap-1.5 rounded-lg"
        variant="destructive"
        onClick={onClear}
      >
        <Trash2 className="w-3.5 h-3.5" />
        Clear
      </Button>

      {/* Hint */}
      <span className="ml-1 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
        {hint}
      </span>
    </div>
  );
}
