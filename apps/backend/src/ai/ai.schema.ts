import { z } from 'zod';
import { DoorSchema, PointSchema, WallSchema } from '../floor-plan/floor-plan.schema.js';

export const AiAnalysisInputSchema = z.object({
  walls: z.array(WallSchema),
  doors: z.array(DoorSchema),
  outlets: z.array(PointSchema),
  switches: z.array(PointSchema),
  panel: PointSchema,
  wires: z.array(z.array(PointSchema)),
  unit: z.enum(['m', 'ft']).default('m'),
});

// Coordinates the LLM works with — always in meters for readability
const MeterPointSchema = z.object({ x: z.number(), y: z.number() });

// Reason: LLM returns meter-space coordinates; service converts to pixels before routing
export const AiOptimizedLayoutSchema = z.object({
  outlets: z.array(MeterPointSchema),
  switches: z.array(MeterPointSchema),
  panel: MeterPointSchema,
  changes: z.array(z.string()),
  explanation: z.string(),
});

// Full response sent to the frontend — pixel coordinates + re-routed wires + change log + explanation
export const AiEnhancedResponseSchema = z.object({
  outlets: z.array(PointSchema),
  switches: z.array(PointSchema),
  panel: PointSchema,
  wires: z.array(z.array(PointSchema)),
  changes: z.array(z.string()),
  explanation: z.string(),
});

export type AiAnalysisInput = z.infer<typeof AiAnalysisInputSchema>;
export type AiOptimizedLayout = z.infer<typeof AiOptimizedLayoutSchema>;
export type AiEnhancedResponse = z.infer<typeof AiEnhancedResponseSchema>;
