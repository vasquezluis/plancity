import type { Request, Response, Router as RouterType } from 'express';
import { Router } from 'express';
import { AiAnalysisInputSchema } from './ai.schema.js';
import { analyzeLayout } from './ai.service.js';

const router: RouterType = Router();

router.post('/', async (req: Request, res: Response) => {
  const parsed = AiAnalysisInputSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await analyzeLayout(parsed.data);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI analysis failed';
    res.status(500).json({ error: message });
  }
});

export default router;
