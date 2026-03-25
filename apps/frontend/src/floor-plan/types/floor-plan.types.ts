import type { Door, GenerateResponse, Label, Wall } from '../../types';

export type DrawMode = 'wall' | 'door' | 'text' | 'pan' | 'delete';

export type LayerVisibility = {
  walls: boolean;
  measurements: boolean;
  doors: boolean;
  labels: boolean;
  outlets: boolean;
  switches: boolean;
  wires: boolean;
  panel: boolean;
};

export const DEFAULT_VISIBILITY: LayerVisibility = {
  walls: true,
  measurements: true,
  doors: true,
  labels: true,
  outlets: true,
  switches: true,
  wires: true,
  panel: true,
};

export type DrawingCanvasProps = {
  walls: Wall[];
  doors: Door[];
  labels: Label[];
  result: GenerateResponse | null;
  unit: import('../utils/floor-plan.utils').Unit;
  show3D?: boolean;
  onWallsChange: (walls: Wall[]) => void;
  onDoorsChange: (doors: Door[]) => void;
  onLabelsChange: (labels: Label[]) => void;
};
