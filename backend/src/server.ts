import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoose from 'mongoose';

import routes from './routes';
import { seedDatabase } from './seed';

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adplatform';

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || '*' }));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  } catch (err: any) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
