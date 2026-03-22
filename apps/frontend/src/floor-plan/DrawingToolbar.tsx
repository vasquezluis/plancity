import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DoorOpen, PenLine, Trash2, Type } from 'lucide-react';
import type { DrawMode } from './floor-plan.types';

type Props = {
  mode: DrawMode;
  wallStarted: boolean;
  onModeChange: (mode: DrawMode) => void;
  onClear: () => void;
};

const HINTS: Record<DrawMode, { active: string; idle: string }> = {
  wall: { active: '📍 Click to finish wall', idle: '🖊 Click to start a wall' },
  door: {
    active: '🚪 Click near a wall to place door',
    idle: '🚪 Click near a wall to place door',
  },
  text: { active: '✏️ Type and press Enter to confirm', idle: '🔤 Click to place a label' },
};

export function DrawingToolbar({ mode, wallStarted, onModeChange, onClear }: Props) {
  const hint = wallStarted ? HINTS[mode].active : HINTS[mode].idle;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        className="cursor-pointer"
        variant={mode === 'wall' ? 'default' : 'outline'}
        onClick={() => onModeChange('wall')}
      >
        <PenLine className="w-4 h-4" />
        Wall
      </Button>

      <Button
        size="sm"
        className="cursor-pointer"
        variant={mode === 'door' ? 'default' : 'outline'}
        onClick={() => onModeChange('door')}
      >
        <DoorOpen className="w-4 h-4" />
        Door
      </Button>

      <Button
        size="sm"
        className="cursor-pointer"
        variant={mode === 'text' ? 'default' : 'outline'}
        onClick={() => onModeChange('text')}
      >
        <Type className="w-4 h-4" />
        Label
      </Button>

      <Button className="cursor-pointer" size="sm" variant="destructive" onClick={onClear}>
        <Trash2 className="w-4 h-4" />
        Clear
      </Button>

      <Badge variant="secondary" className="ml-2 text-xs font-normal">
        {hint}
      </Badge>
    </div>
  );
}
