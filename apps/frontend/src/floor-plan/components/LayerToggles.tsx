import { Eye, EyeOff, Layers } from 'lucide-react';
import type { LayerVisibility } from '../types/floor-plan.types';

type Props = {
  visibility: LayerVisibility;
  hasResult: boolean;
  onChange: (key: keyof LayerVisibility, value: boolean) => void;
};

type ToggleDef = {
  key: keyof LayerVisibility;
  label: string;
  /** Tailwind bg class for the colored swatch when the layer is on */
  color: string;
  electricalOnly?: boolean;
};

const TOGGLES: ToggleDef[] = [
  { key: 'walls', label: 'Walls', color: 'bg-gray-700' },
  { key: 'measurements', label: 'Dimensions', color: 'bg-gray-400' },
  { key: 'doors', label: 'Doors', color: 'bg-amber-500' },
  { key: 'labels', label: 'Labels', color: 'bg-purple-600' },
  { key: 'wires', label: 'Wires', color: 'bg-amber-400', electricalOnly: true },
  {
    key: 'outlets',
    label: 'Outlets',
    color: 'bg-blue-500',
    electricalOnly: true,
  },
  {
    key: 'switches',
    label: 'Switches',
    color: 'bg-pink-500',
    electricalOnly: true,
  },
  {
    key: 'panel',
    label: 'Panel',
    color: 'bg-emerald-500',
    electricalOnly: true,
  },
];

/** Row of layer-visibility toggle buttons shown below the canvas. */
export function LayerToggles({ visibility, hasResult, onChange }: Props) {
  const shown = TOGGLES.filter((t) => !t.electricalOnly || hasResult);

  return (
    <div className="flex items-center gap-2 mt-2 flex-wrap">
      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Layers className="w-3.5 h-3.5" />
        <span>Layers</span>
      </div>

      <div className="w-px h-4 bg-border" />

      {shown.map(({ key, label, color }) => {
        const on = visibility[key];
        return (
          <button
            key={key}
            type="button"
            title={on ? `Hide ${label}` : `Show ${label}`}
            onClick={() => onChange(key, !on)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
              border transition-all cursor-pointer select-none
              ${
                on
                  ? 'border-border bg-background text-foreground shadow-sm hover:bg-muted/50'
                  : 'border-dashed border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/60'
              }
            `}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 transition-colors ${on ? color : 'bg-border'}`}
            />
            {label}
            {on ? (
              <Eye className="w-3 h-3 ml-0.5 text-foreground" />
            ) : (
              <EyeOff className="w-3 h-3 ml-0.5 text-muted-foreground/50" />
            )}
          </button>
        );
      })}
    </div>
  );
}
