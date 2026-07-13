import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';

import routes from './routes';
import { seedDatabase } from './seed';
import { rateLimit } from './middleware/rateLimit';
import { scanAllActiveCampaigns } from './services/anomaly-detection.service';

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adplatform';

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || '*' }));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (spec §6). In-memory sliding window — swap the store for
// Redis in production (see src/middleware/rateLimit.ts).
app.use(rateLimit({ windowMs: 60_000, max: 200 })); // global: 200 req/min per IP
app.use('/api/v1/auth', rateLimit({ windowMs: 60_000, max: 20 })); // stricter on auth

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

async function startServer(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await seedDatabase();

    app.listen(PORT, () => {
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
