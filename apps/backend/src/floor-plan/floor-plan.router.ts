import type { Request, Response, Router as RouterType } from 'express';
import { Router } from 'express';
import { generateLayout } from '../layout/layout.engine.js';
import { FloorPlanInputSchema } from './floor-plan.schema.js';

const router: RouterType = Router();

router.post('/', (req: Request, res: Response) => {
  const parsed = FloorPlanInputSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  const { walls, doors } = parsed.data;
  const result = generateLayout(walls, doors);
  res.json(result);
});

export default router;
