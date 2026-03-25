import 'dotenv/config';
import express from 'express';
import aiRouter from './ai/ai.router.js';
import floorPlanRouter from './floor-plan/floor-plan.router.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.set('trust proxy', 1); // To work with real client IP behind a proxy (nginx or cloudflare)
app.use(rateLimitMiddleware);
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// AI layout analysis — must be registered before /plan to avoid prefix collision
app.use('/plan/ai', aiRouter);
// Electrical layout generation — rate limited to 3 req/min
app.use('/plan', floorPlanRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
