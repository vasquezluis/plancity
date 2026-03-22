import type { Door, GenerateResponse, Label, Wall } from '../../types';

export type DrawMode = 'wall' | 'door' | 'text';

export type DrawingCanvasProps = {
  walls: Wall[];
  doors: Door[];
  labels: Label[];
  result: GenerateResponse | null;
  unit: import('../utils/floor-plan.utils').Unit;
  onWallsChange: (walls: Wall[]) => void;
  onDoorsChange: (doors: Door[]) => void;
  onLabelsChange: (labels: Label[]) => void;
};

export type RateLimitInfo = {
  limit: number;
  remaining: number;
  resetAt: number; // Unix seconds
};

export type PlanResponse = {
  data: GenerateResponse;
  rateLimit: RateLimitInfo;
};
