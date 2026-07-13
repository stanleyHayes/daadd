// Loaded by jest before any test module (see jest.config.js setupFiles).
// Must run before app/middleware modules are imported so module-level
// env reads (JWT_SECRET, TOKEN_VALUE, ...) pick up the test values.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-ci';

// Redemption economy knobs (read at module load in routes/redemption.ts).
process.env.TOKEN_VALUE = process.env.TOKEN_VALUE || '0.05';
process.env.MAX_DISCOUNT_PCT = process.env.MAX_DISCOUNT_PCT || '0.15';
process.env.QR_EXPIRY_SECONDS = process.env.QR_EXPIRY_SECONDS || '120';

// app.ts runs dotenv/config at import time, and backend/.env points at a
// real Atlas cluster. Preserve an externally-provided MONGODB_URI (e.g. a
// CI service container) under TEST_MONGODB_URI, then remove MONGODB_URI so
// dotenv cannot silently make tests hit the real database. test-helpers.ts
// reads TEST_MONGODB_URI only.
if (process.env.MONGODB_URI) {
  process.env.TEST_MONGODB_URI = process.env.MONGODB_URI;
}
delete process.env.MONGODB_URI;

// Without a mail provider the auth routes return dev_reset_token / dev_code
// in non-production, which the tests rely on. (dotenv may re-add this from
// .env later; test-helpers.ts strips it again after importing the app.)
delete process.env.RESEND_API_KEY;
