import type { CorsOptions } from 'cors';

/**
 * Where cross-origin requests are allowed from.
 *
 * One definition shared by the REST API and the Socket.io server. They used to
 * compute this separately and had drifted: the socket list trimmed whitespace
 * around each entry and the REST list did not, so `CORS_ORIGINS=a.com, b.com`
 * (with a space, which is how anyone would naturally write it) silently blocked
 * REST while sockets kept working.
 *
 * Rules:
 *
 *   - `CORS_ORIGINS` set  → exactly those origins, in every environment.
 *   - production, unset   → blocked, with a warning. Failing closed is right for
 *                           a deployment nobody configured.
 *   - development, unset  → any localhost or 127.0.0.1 origin, ANY PORT.
 *
 * That last rule matters more than it looks. Vite picks whatever port is free,
 * so a developer who already has something on 5173 gets 5174 and every request
 * fails CORS. Pinning a list of localhost ports means chasing them forever;
 * allowing the loopback interface in development ends the whole class of
 * problem without loosening production by a single byte.
 */

const LOOPBACK = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export function configuredOrigins(): string[] | undefined {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return undefined;

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length ? origins : undefined;
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * The `origin` value for both `cors()` and Socket.io.
 *
 * Returns a callback rather than a list in development so the port can vary.
 * A missing Origin header (curl, same-origin, server-to-server) is always
 * allowed — those requests are not subject to the browser's origin policy in
 * the first place, and rejecting them breaks health checks.
 *
 * A refused origin resolves with `false` rather than an Error. Passing an Error
 * makes `cors` throw, which Express turns into a 500 — so a correctly blocked
 * request would look like a server fault in the logs and in error monitoring.
 * Resolving false simply omits the Allow-Origin header and lets the browser
 * enforce the policy, which is what it is there for.
 */
export function corsOrigin(): CorsOptions['origin'] {
  const configured = configuredOrigins();

  if (configured) {
    return (origin, callback) => {
      if (!origin || configured.includes(origin)) return callback(null, true);
      // In development, still let the loopback through even when a list is set,
      // so an unexpected Vite port does not block local work.
      if (isDevelopment() && LOOPBACK.test(origin)) return callback(null, true);
      callback(null, false);
    };
  }

  if (!isDevelopment()) {
    console.warn(
      '[cors] CORS_ORIGINS is not set in production — cross-origin requests will be blocked'
    );
    return false;
  }

  return (origin, callback) => {
    if (!origin || LOOPBACK.test(origin)) return callback(null, true);
    callback(null, false);
  };
}
