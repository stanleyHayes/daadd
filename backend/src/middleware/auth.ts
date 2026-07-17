import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  role: string;
}

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Access tokens are short-lived (spec: 1 hour); clients renew them through
// POST /auth/refresh using the refresh token below.
export function generateToken(payload: JwtPayload): string {
  const expiresIn = (process.env.JWT_EXPIRATION || '1h') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// The jti makes every refresh token unique so rotation always yields a
// different token (and gives a future revocation list something to key on).
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(
    { ...payload, type: 'refresh', jti: crypto.randomUUID() },
    JWT_SECRET,
    { expiresIn: (process.env.JWT_REFRESH_EXPIRATION || '7d') as jwt.SignOptions['expiresIn'] }
  );
}

// Returns null for garbage, expired tokens, and non-refresh (e.g. access)
// tokens alike — callers should treat them all as a plain 401.
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as RefreshTokenPayload & { type?: string };
    if (decoded.type !== 'refresh') return null;
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized: missing token' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { type?: string };
    if (decoded.type === 'refresh') {
      // Refresh tokens must not double as access tokens.
      res.status(401).json({ success: false, message: 'Unauthorized: invalid token' });
      return;
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Unauthorized: invalid token' });
  }
}
