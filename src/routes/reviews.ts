import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateId } from '../utils/auth';

const reviews = new Hono<{ Bindings: Bindings; Variables: Variables }>();

reviews.use('/*', authMiddleware);

// Submit review
reviews.post('/', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;

  const { delivery_request_id, rating, review_text } = await c.req.json();

  if (!delivery_request_id || !rating) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  if (rating < 1 || rating > 5) {
    return c.json({ error: 'Rating must be between 1 and 5' }, 400);
  }

  // Get request details
  const request = await db!
    .prepare('SELECT * FROM delivery_requests WHERE id = ?')
    .bind(delivery_request_id)
    .first();

  if (!request) {
    return c.json({ error: 'Request not found' }, 404);
  }

  if (request.status !== 'delivered') {
    return c.json({ error: 'Can only review completed deliveries' }, 400);
  }

  // Determine review type and reviewee
  let reviewType: string;
  let revieweeId: string;

  if (user.id === request.sender_id) {
    reviewType = 'sender_to_traveler';
    revieweeId = request.matched_traveler_id as string;
  } else if (user.id === request.matched_traveler_id) {
    reviewType = 'traveler_to_sender';
    revieweeId = request.sender_id as string;
  } else {
    return c.json({ error: 'Unauthorized to review this delivery' }, 403);
  }

  // Check if already reviewed
  const existingReview = await db!
    .prepare(
      'SELECT * FROM reviews WHERE delivery_request_id = ? AND reviewer_id = ?'
    )
    .bind(delivery_request_id, user.id)
    .first();

  if (existingReview) {
    return c.json({ error: 'You have already reviewed this delivery' }, 400);
  }

  const reviewId = generateId('review');

  // Create review
  await db!
    .prepare(
      `INSERT INTO reviews (id, delivery_request_id, reviewer_id, reviewee_id, rating, review_text, review_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(reviewId, delivery_request_id, user.id, revieweeId, rating, review_text || null, reviewType)
    .run();

  // Update reviewee's average rating
  const avgResult = await db!
    .prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE reviewee_id = ?')
    .bind(revieweeId)
    .first();

  await db!
    .prepare('UPDATE users SET average_rating = ? WHERE id = ?')
    .bind(avgResult?.avg_rating || 0, revieweeId)
    .run();

  return c.json({
    id: reviewId,
    message: 'Review submitted successfully'
  }, 201);
});

// Get reviews for a user
reviews.get('/user/:user_id', async (c) => {
  const db = c.env.DB;
  const userId = c.req.param('user_id');

  const result = await db!
    .prepare(
      `SELECT r.*, u.full_name as reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = ?
       ORDER BY r.created_at DESC`
    )
    .bind(userId)
    .all();

  return c.json({
    reviews: result.results || []
  });
});

export default reviews;
