import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';

import routes from './routes';
import { rateLimit } from './middleware/rateLimit';

// Express app, separated from server.ts so tests can import it without
// opening a Mongo connection or binding a port.
const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || '*' }));
app.use(compression());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (spec §6). Skipped under NODE_ENV=test so the suites can
// fire many requests; the middleware itself is covered by dedicated tests.
if (process.env.NODE_ENV !== 'test') {
  app.use(rateLimit({ windowMs: 60_000, max: 200 })); // global: 200 req/min per IP
  app.use('/api/v1/auth', rateLimit({ windowMs: 60_000, max: 20 })); // stricter on auth
}

// Serve locally stored creative uploads (see src/services/storage.service.ts).
app.use('/uploads', express.static('uploads'));

app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/', (_req, res) => {
  res.json({ message: 'AdPlatform API', version: '1.0.0' });
});

app.use('/api/v1', routes);

export default app;
