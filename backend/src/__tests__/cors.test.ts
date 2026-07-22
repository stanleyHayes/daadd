import { corsOrigin, configuredOrigins, isDevelopment } from '../utils/cors';

/**
 * CORS is a security control, so the production lockdown is asserted as
 * carefully as the development convenience.
 */

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

/** Runs the origin callback and reports whether it allowed the request. */
function allows(origin: string | undefined): boolean {
  const result = corsOrigin();
  if (result === false) return false;
  if (result === true) return true;
  if (typeof result !== 'function') return false;

  let allowed = false;
  (result as (o: string | undefined, cb: (e: Error | null, ok?: boolean) => void) => void)(
    origin,
    (error, ok) => {
      allowed = !error && !!ok;
    }
  );
  return allowed;
}

describe('parsing CORS_ORIGINS', () => {
  it('trims whitespace around each entry', () => {
    // The REST config used to split without trimming while the socket config
    // trimmed, so "a.com, b.com" blocked REST and allowed sockets.
    process.env.CORS_ORIGINS = 'https://a.com, https://b.com ,https://c.com';
    expect(configuredOrigins()).toEqual(['https://a.com', 'https://b.com', 'https://c.com']);
  });

  it('treats an empty or blank value as unset', () => {
    process.env.CORS_ORIGINS = '';
    expect(configuredOrigins()).toBeUndefined();
    process.env.CORS_ORIGINS = '  , ,';
    expect(configuredOrigins()).toBeUndefined();
  });

  it('is undefined when the variable is absent', () => {
    delete process.env.CORS_ORIGINS;
    expect(configuredOrigins()).toBeUndefined();
  });
});

describe('production', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  it('blocks everything when CORS_ORIGINS is unset', () => {
    delete process.env.CORS_ORIGINS;
    expect(corsOrigin()).toBe(false);
  });

  it('allows only the configured origins', () => {
    process.env.CORS_ORIGINS = 'https://daadd.vercel.app';
    expect(allows('https://daadd.vercel.app')).toBe(true);
    expect(allows('https://evil.example')).toBe(false);
  });

  it('does NOT open the loopback in production', () => {
    // The development convenience must not follow the code into production.
    process.env.CORS_ORIGINS = 'https://daadd.vercel.app';
    expect(allows('http://localhost:5174')).toBe(false);
    expect(allows('http://127.0.0.1:3000')).toBe(false);
  });

  it('is not fooled by an origin that merely contains an allowed one', () => {
    process.env.CORS_ORIGINS = 'https://daadd.vercel.app';
    expect(allows('https://daadd.vercel.app.evil.example')).toBe(false);
    expect(allows('https://evil.example/https://daadd.vercel.app')).toBe(false);
  });
});

describe('development', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    delete process.env.CORS_ORIGINS;
  });

  it('allows localhost on any port', () => {
    // Vite takes whatever port is free, so pinning a list means chasing them.
    expect(allows('http://localhost:5173')).toBe(true);
    expect(allows('http://localhost:5174')).toBe(true);
    expect(allows('http://localhost:3000')).toBe(true);
    expect(allows('http://127.0.0.1:8080')).toBe(true);
  });

  it('allows the loopback even when an explicit list is set', () => {
    process.env.CORS_ORIGINS = 'https://staging.example';
    expect(allows('https://staging.example')).toBe(true);
    expect(allows('http://localhost:5174')).toBe(true);
  });

  it('still rejects a non-loopback origin', () => {
    expect(allows('https://evil.example')).toBe(false);
  });

  it('is not fooled by a hostname that merely starts with localhost', () => {
    expect(allows('http://localhost.evil.example')).toBe(false);
    expect(allows('http://127.0.0.1.evil.example')).toBe(false);
  });

  it('reports itself as development', () => {
    expect(isDevelopment()).toBe(true);
  });
});

describe('requests with no Origin header', () => {
  it('are allowed in both environments', () => {
    // curl, same-origin and server-to-server calls send no Origin and are not
    // subject to the browser policy. Rejecting them breaks health checks.
    process.env.NODE_ENV = 'development';
    delete process.env.CORS_ORIGINS;
    expect(allows(undefined)).toBe(true);

    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://daadd.vercel.app';
    expect(allows(undefined)).toBe(true);
  });
});
