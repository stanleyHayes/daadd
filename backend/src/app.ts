import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { corsOrigin } from './utils/cors';
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
// See utils/cors.ts — one definition, shared with the Socket.io server.
app.use(cors({ origin: corsOrigin(), credentials: true }));
app.use(compression());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}
// Stash the raw request bytes so the PSP webhook can verify its HMAC signature
// against the exact payload (a re-serialized object would mismatch on key order
// or whitespace). Cheap: just keeps a reference to the buffer express already read.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as unknown as { rawBody?: Buffer }).rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Rate limiting (spec §6). Skipped under NODE_ENV=test so the suites can
// fire many requests; the middleware itself is covered by dedicated tests.
if (process.env.NODE_ENV !== 'test') {
  app.use(rateLimit({ windowMs: 60_000, max: 200 })); // global: 200 req/min per IP
  app.use('/api/v1/auth', rateLimit({ windowMs: 60_000, max: 20 })); // stricter on auth
}

// Serve locally stored creative uploads (see src/services/storage.service.ts).
app.use('/uploads', express.static('uploads'));

// Liveness: the process is up. Always 200 (used by simple uptime checks).
app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbState === 1 ? 'connected' : 'disconnected',
  });
});

// Readiness (Phase 7): actually pings the database, so a load balancer can pull
// the instance out of rotation when its dependencies are unhealthy. 503 = not ready.
app.get('/health/ready', async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      throw new Error('database not connected');
    }
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ ready: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(503).json({ ready: false, reason: err?.message || 'not ready' });
  }
});

app.get('/', (_req, res) => {
  res.json({ message: 'SmartAdDeals API', version: '1.0.0' });
});

app.use('/api/v1', routes);

// JSON 404 for unmatched API routes (must come after all routers).
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Final JSON error handler — Express 5's default handler leaks HTML/stacks.
// Exported so tests can exercise the status mapping directly.
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  if (err.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid identifier' });
    return;
  }
  if (err.name === 'ValidationError') {
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Unauthorized: invalid token' });
    return;
  }
  if (err.name === 'MongoServerError' && err.code === 11000) {
    res.status(409).json({ success: false, message: 'Resource already exists' });
    return;
  }
  const status = typeof err.status === 'number' ? err.status : 500;
  res.status(status).json({
    success: false,
    message:
      status === 500 && process.env.NODE_ENV !== 'development'
        ? 'Internal server error'
        : err.message || 'Internal server error',
  });
}
app.use(errorHandler);

export default app;
