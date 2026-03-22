import { z } from 'zod';

export const PointSchema = z.object({ x: z.number(), y: z.number() });
export const WallSchema = z.object({
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
});
export const DoorSchema = z.object({ x: z.number(), y: z.number() });

export const FloorPlanInputSchema = z.object({
  walls: z.array(WallSchema),
  doors: z.array(DoorSchema),
});

export type Point = z.infer<typeof PointSchema>;
export type Wall = z.infer<typeof WallSchema>;
export type Door = z.infer<typeof DoorSchema>;
export type FloorPlanInput = z.infer<typeof FloorPlanInputSchema>;
