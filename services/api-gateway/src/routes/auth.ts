import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';

export const authRouter = Router();

/**
 * Simple mock authentication for POC purposes.
 * In production, this would integrate with Scottish Government Identity Service
 * or similar SSO/OIDC provider.
 */

authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Email and password are required' },
    });
    return;
  }

  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

  // POC: accept any password for known users, or 'demo'/'demo' for public
  if (user || (email === 'demo@example.com' && password === 'demo')) {
    const userData = user || { id: 'USR-DEMO-001', email: 'demo@example.com', name: 'Demo User', role: 'applicant' };

    // Generate simple POC token (NOT production-safe)
    const token = Buffer.from(JSON.stringify({
      userId: userData.id,
      email: userData.email,
      role: userData.role,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })).toString('base64');

    res.json({
      success: true,
      data: {
        token,
        user: { id: userData.id, email: userData.email, name: userData.name, role: userData.role },
      },
    });
  } else {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
    });
  }
});

authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
    return;
  }

  try {
    const token = authHeader.slice(7);
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());

    if (payload.exp < Date.now()) {
      res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' } });
      return;
    }

    res.json({
      success: true,
      data: { userId: payload.userId, email: payload.email, role: payload.role },
    });
  } catch {
    res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid token' } });
  }
});
