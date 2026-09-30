import type { Request, Response, NextFunction } from 'express';
import { SESSION_COOKIE, verifySessionToken } from '../lib/session.ts';

export interface AuthRequest extends Request {
  user?: {
    email: string;
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];

    if (!token || typeof token !== 'string') {
      return res.status(401).json({
        error: 'Non authentifié.',
      });
    }

    const session = await verifySessionToken(token);

    if (!session) {
      return res.status(401).json({
        error: 'Session invalide ou expirée.',
      });
    }

    req.user = session;

    next();
  } catch (err) {
    console.error('[Auth Middleware]', err);

    return res.status(401).json({
      error: 'Non authentifié.',
    });
  }
}
