import 'dotenv/config';
import mongoose from 'mongoose';

import app from './app';
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
