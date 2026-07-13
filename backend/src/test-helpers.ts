import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest from 'supertest';

import app from './app';

// Importing app above executed dotenv/config, which may have re-injected
// RESEND_API_KEY / MONGODB_URI from backend/.env. Strip them so auth routes
// return dev tokens and tests never touch external services. An externally
// provided URI survives as TEST_MONGODB_URI (see test-setup.ts).
delete process.env.RESEND_API_KEY;
delete process.env.MONGODB_URI;

let memoryServer: MongoMemoryServer | null = null;

/**
 * Connect mongoose to a test database. Uses TEST_MONGODB_URI (captured
 * from MONGODB_URI before dotenv loaded backend/.env) when provided,
 * otherwise starts an in-memory MongoDB instance (singleton across test
 * files in the same worker).
 */
export async function connectTestDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  let uri = process.env.TEST_MONGODB_URI;
  if (!uri) {
    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create();
    }
    uri = memoryServer.getUri();
  }
  await mongoose.connect(uri);
}

/** Drop the whole test database. */
export async function resetTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return;
  await mongoose.connection.db.dropDatabase();
}

/** Disconnect mongoose and stop the in-memory server if one was started. */
export async function closeTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

/** Supertest agent bound to the express app (no port is opened). */
export const request = supertest(app);
