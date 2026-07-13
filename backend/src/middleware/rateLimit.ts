/**
 * In-memory sliding-window rate limiter (spec §6).
 *
 * PRODUCTION NOTE: this store is per-process and does not survive restarts
 * or scale across instances. Swap the Map for a Redis-backed store (e.g.
 * rate-limit-redis with the ioredis client already in this project) before
 * deploying to multiple replicas.
 */
import { Request, Response, NextFunction } from 'express';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimit({ windowMs, max }: RateLimitOptions) {
  const hits = new Map<string, number[]>();

  // Periodic pruning so the map does not grow unbounded with stale IPs.
  const prune = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of hits) {
      const fresh = timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) hits.delete(key);
      else hits.set(key, fresh);
    }
  }, windowMs);
  prune.unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const cutoff = now - windowMs;
    const timestamps = (hits.get(key) || []).filter((t) => t > cutoff);

    if (timestamps.length >= max) {
      const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(retryAfter, 1)));
      res.status(429).json({ success: false, message: 'Too many requests, please try again later' });
      return;
    }

    timestamps.push(now);
    hits.set(key, timestamps);
    next();
  };
}
