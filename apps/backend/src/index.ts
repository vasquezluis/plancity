import 'dotenv/config';
import express from 'express';
import aiRouter from './ai/ai.router.js';
import floorPlanRouter from './floor-plan/floor-plan.router.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// AI layout analysis — must be registered before /plan to avoid prefix collision
app.use('/plan/ai', rateLimitMiddleware, aiRouter);
// Electrical layout generation — rate limited to 3 req/min
app.use('/plan', rateLimitMiddleware, floorPlanRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
