import { Context, Next } from 'hono';
import { Bindings, Variables } from '../types';
import { verifyJWT } from '../utils/auth';

export async function authMiddleware(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const jwtSecret = c.env.JWT_SECRET || 'fallback-secret';

  try {
    const payload = await verifyJWT(token, jwtSecret);
    
    // Fetch user from database
    const db = c.env.DB;
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500);
    }

    const result = await db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(payload.user_id)
      .first();

    if (!result) {
      return c.json({ error: 'User not found' }, 401);
    }

    // Check if account is active
    if (result.account_status !== 'active') {
      return c.json({ error: 'Account suspended or banned' }, 403);
    }

    c.set('user', {
      id: result.id as string,
      email: result.email as string,
      phone: result.phone as string,
      full_name: result.full_name as string,
      role: result.role as 'sender' | 'traveler' | 'both',
      verification_status: result.verification_status as 'pending' | 'approved' | 'rejected',
      trust_score: result.trust_score as number,
      account_status: result.account_status as 'active' | 'suspended' | 'banned'
    });

    await next();
  } catch (error) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}

export function requireRole(allowedRoles: ('sender' | 'traveler' | 'both')[]) {
  return async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    if (user.role === 'both' || allowedRoles.includes(user.role)) {
      await next();
    } else {
      return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
    }
  };
}

export function requireVerified(
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
  next: Next
) {
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (user.verification_status !== 'approved') {
    return c.json({ error: 'Please complete ID verification first' }, 403);
  }

  return next();
}
