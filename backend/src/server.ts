import 'dotenv/config';
import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

import app from './app';
import { JWT_SECRET } from './middleware/auth';
import { seedDatabase } from './seed';
import { scanAllActiveCampaigns } from './services/anomaly-detection.service';

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/daadd';

// Show the target host (never the credentials) so deploy logs make the
// misconfiguration obvious — e.g. "localhost:27017" means MONGODB_URI is unset.
function mongoHost(uri: string): string {
  const withCreds = uri.match(/@([^/?]+)/);
  if (withCreds) return withCreds[1];
  const noCreds = uri.match(/\/\/([^/?]+)/);
  return noCreds ? noCreds[1] : 'unknown';
}

async function startServer(): Promise<void> {
  try {
    // Fail fast rather than signing tokens with the public dev fallback.
    if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET must be set when NODE_ENV=production');
      process.exit(1);
    }

    // In production there is no local Mongo — the localhost fallback can never
    // work, so fail fast with an actionable message instead of ECONNREFUSED.
    if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
      console.error(
        'FATAL: MONGODB_URI must be set when NODE_ENV=production. ' +
          'Set it in your host\'s environment (e.g. a MongoDB Atlas connection string).'
      );
      process.exit(1);
    }

    console.log(`[startup] connecting to MongoDB host: ${mongoHost(MONGODB_URI)}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Never seed in production unless explicitly opted in.
    if (process.env.NODE_ENV !== 'production' || process.env.SEED_DATABASE === 'true') {
      await seedDatabase();
    }

    // Share one HTTP server between Express and Socket.io (real-time chat).
    const httpServer = http.createServer(app);

    const trimmedOrigins = process.env.CORS_ORIGINS?.split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    const socketOrigins =
      trimmedOrigins && trimmedOrigins.length
        ? trimmedOrigins
        : process.env.NODE_ENV === 'production'
          ? false
          : ['http://localhost:3000'];
    const io = new Server(httpServer, {
      cors: { origin: socketOrigins, credentials: true },
    });
    // Authenticate every socket with the same JWT as the REST API; reject
    // missing / expired / refresh tokens. Each socket joins its personal room
    // so message handlers can push to `user:<id>`.
    io.use((socket, next) => {
      const headerToken = (socket.handshake.headers.authorization || '').replace(/^Bearer /, '');
      const token = (socket.handshake.auth?.token as string | undefined) || headerToken;
      if (!token) return next(new Error('Unauthorized'));
      try {
        const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as {
          userId?: string;
          type?: string;
        };
        if (!decoded.userId || decoded.type === 'refresh') return next(new Error('Unauthorized'));
        socket.data.userId = decoded.userId;
        next();
      } catch {
        next(new Error('Unauthorized'));
      }
    });
    io.on('connection', (socket) => {
      socket.join(`user:${socket.data.userId}`);
    });
    // Message routes emit real-time events via req.app.get('io').
    app.set('io', io);

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Scheduled anomaly scan (spec §4.7): every 5 minutes, guarded so it
    // only runs while the DB is connected and never overlaps itself.
    let scanRunning = false;
    const scanInterval = setInterval(async () => {
      if (scanRunning || mongoose.connection.readyState !== 1) return;
      scanRunning = true;
      try {
        const result = await scanAllActiveCampaigns();
        if (result.created > 0) {
          console.log(`[anomaly-scan] scanned=${result.scanned} created=${result.created}`);
        }
      } catch (err) {
        console.warn('[anomaly-scan] failed (swallowed):', err);
      } finally {
        scanRunning = false;
      }
    }, 5 * 60 * 1000);
    scanInterval.unref();
  } catch (err: any) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
