import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcrypt';

import { createSessionToken, SESSION_COOKIE } from '../lib/session.ts';
import {
  requireAuth,
  type AuthRequest,
} from '../middleware/auth.middleware.ts';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    const email =
      typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    const password = typeof body?.password === 'string' ? body.password : '';

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || !adminPasswordHash) {
      console.error('ADMIN_EMAIL / ADMIN_PASSWORD_HASH are not set.');

      return res.status(500).json({
        error: 'Authentification non configurée.',
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        error: 'E-mail et mot de passe requis.',
      });
    }

    const emailMatches = email === adminEmail;

    // Always run bcrypt.compare, even if the email is incorrect.
    const passwordMatches = await bcrypt.compare(password, adminPasswordHash);

    if (!emailMatches || !passwordMatches) {
      return res.status(401).json({
        error: 'E-mail ou mot de passe incorrect.',
      });
    }

    const token = await createSessionToken({ email });

    res.cookie('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.status(200).json({ email });
  } catch (err) {
    console.error('[POST /api/auth/login]', err);

    return res.status(500).json({
      error: 'Erreur lors de la connexion.',
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return res.status(200).json({
    message: 'Déconnexion réussie.',
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  return res.status(200).json({
    email: req.user!.email,
  });
});

router.get('/dashboard', requireAuth, (req: AuthRequest, res: Response) => {
  return res.json({
    message: 'Authenticated',
    user: req.user,
  });
});

export default router;
