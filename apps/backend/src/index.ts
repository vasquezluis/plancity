import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import aiRouter from './ai/ai.router.js';
import floorPlanRouter from './floor-plan/floor-plan.router.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

const isDev = process.env.NODE_ENV !== 'production';
const corsOrigin = process.env.CORS_ORIGIN;

if (!isDev && !corsOrigin) {
  throw new Error('CORS_ORIGIN env variable must be set in production');
}

app.use(
  cors({
    origin: corsOrigin ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});
