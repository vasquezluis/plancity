import type { Door, GenerateResponse, Wall } from '../types';

export type DrawMode = 'wall' | 'door';

export type DrawingCanvasProps = {
  walls: Wall[];
  doors: Door[];
  result: GenerateResponse | null;
  unit: import('./floor-plan.utils').Unit;
  onWallsChange: (walls: Wall[]) => void;
  onDoorsChange: (doors: Door[]) => void;
};
