import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import documentsRouter from './routes/documents';
import chatRouter from './routes/chat';
import voiceRouter from './routes/voice';
import coursesRouter from './routes/courses';
import publicRouter from './routes/public';

const app = express();
const PORT = process.env.PORT ?? 3001;

// Required behind Cloud Run / reverse proxies so rate limits use the client IP, not the proxy.
if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
const readMax = Number(process.env.RATE_LIMIT_READ_MAX ?? 600);
const writeMax = Number(process.env.RATE_LIMIT_WRITE_MAX ?? 80);
const skipRateLimit = process.env.NODE_ENV !== 'production' && process.env.RATE_LIMIT !== 'true';

const readLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: readMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => skipRateLimit || req.method !== 'GET',
  message: { error: 'Too many requests — please wait a moment and try again.' },
});

const writeLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: writeMax,
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => skipRateLimit || req.method === 'GET',
  message: { error: 'Too many requests — please wait a moment and try again.' },
});

app.use('/api/', readLimiter);
app.use('/api/', writeLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/documents', documentsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/public', publicRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
