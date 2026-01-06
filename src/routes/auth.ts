import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { hashPassword, verifyPassword, generateJWT, generateId, generateOTP } from '../utils/auth';

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Signup
auth.post('/signup', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: 'Database not configured' }, 500);
  }

  const { email, phone, password, full_name, role } = await c.req.json();

  // Validate input
  if (!email || !phone || !password || !full_name || !role) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  if (!['sender', 'traveler', 'both'].includes(role)) {
    return c.json({ error: 'Invalid role' }, 400);
  }

  // Check if user exists
  const existing = await db
    .prepare('SELECT id FROM users WHERE email = ? OR phone = ?')
    .bind(email, phone)
    .first();

  if (existing) {
    return c.json({ error: 'User already exists' }, 409);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate OTP (mock for MVP)
  const otp = generateOTP();
  console.log(`OTP for ${phone}: ${otp}`); // In production, send via SMS

  // Create user
  const userId = generateId('user');
  
  await db
    .prepare(
      `INSERT INTO users (id, email, phone, password_hash, full_name, role)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(userId, email, phone, passwordHash, full_name, role)
    .run();

  return c.json({
    message: 'User created successfully',
    user_id: userId,
    otp_sent: true,
    otp: otp // Remove in production
  }, 201);
});

// Login
auth.post('/login', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: 'Database not configured' }, 500);
  }

  const { email, password } = await c.req.json();

  if (!email || !password) {
    return c.json({ error: 'Email and password required' }, 400);
  }

  // Find user
  const user = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first();

  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash as string);
  
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Check account status
  if (user.account_status !== 'active') {
    return c.json({ error: 'Account suspended or banned' }, 403);
  }

  // Update last login
  await db
    .prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind(user.id)
    .run();

  // Generate JWT
  const jwtSecret = c.env.JWT_SECRET || 'fallback-secret';
  const token = await generateJWT(
    {
      user_id: user.id,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    },
    jwtSecret
  );

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role,
      verification_status: user.verification_status,
      trust_score: user.trust_score
    }
  });
});

// Verify OTP (mock for MVP)
auth.post('/verify-otp', async (c) => {
  const { phone, otp } = await c.req.json();

  // Mock verification - always succeed
  console.log(`Verifying OTP ${otp} for ${phone}`);

  return c.json({
    message: 'OTP verified successfully',
    verified: true
  });
});

// Get current user
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);
  const jwtSecret = c.env.JWT_SECRET || 'fallback-secret';
  const db = c.env.DB;

  if (!db) {
    return c.json({ error: 'Database not configured' }, 500);
  }

  try {
    const { verifyJWT } = await import('../utils/auth');
    const payload = await verifyJWT(token, jwtSecret);
    
    const user = await db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(payload.user_id)
      .first();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role,
      verification_status: user.verification_status,
      trust_score: user.trust_score,
      total_deliveries: user.total_deliveries,
      successful_deliveries: user.successful_deliveries,
      average_rating: user.average_rating
    });
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
});

export default auth;
