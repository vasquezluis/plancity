import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DoorOpen, PenLine, Trash2 } from 'lucide-react';
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
};

export function DrawingToolbar({ mode, wallStarted, onModeChange, onClear }: Props) {
  const hint = wallStarted ? HINTS[mode].active : HINTS[mode].idle;

  return (
    <div className="flex items-center gap-2 mb-2">
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
