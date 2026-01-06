import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

const bookings = new Hono<{ Bindings: Bindings; Variables: Variables }>();

bookings.use('/*', authMiddleware);

// Confirm pickup
bookings.post('/:request_id/confirm-pickup', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const requestId = c.req.param('request_id');

  const request = await db!
    .prepare('SELECT * FROM delivery_requests WHERE id = ? AND matched_traveler_id = ?')
    .bind(requestId, user.id)
    .first();

  if (!request) {
    return c.json({ error: 'Request not found or unauthorized' }, 404);
  }

  if (request.status !== 'matched') {
    return c.json({ error: 'Invalid status for pickup' }, 400);
  }

  await db!
    .prepare(
      `UPDATE delivery_requests 
       SET status = 'picked_up', picked_up_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(requestId)
    .run();

  return c.json({ message: 'Pickup confirmed successfully' });
});

// Update status (departed/landed)
bookings.post('/:request_id/update-status', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const requestId = c.req.param('request_id');
  const { status } = await c.req.json();

  if (!['in_transit'].includes(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  const request = await db!
    .prepare('SELECT * FROM delivery_requests WHERE id = ? AND matched_traveler_id = ?')
    .bind(requestId, user.id)
    .first();

  if (!request) {
    return c.json({ error: 'Request not found' }, 404);
  }

  await db!
    .prepare('UPDATE delivery_requests SET status = ? WHERE id = ?')
    .bind(status, requestId)
    .run();

  return c.json({ message: 'Status updated successfully' });
});

// Confirm delivery
bookings.post('/:request_id/confirm-delivery', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const requestId = c.req.param('request_id');
  const { tracking_code } = await c.req.json();

  const request = await db!
    .prepare('SELECT * FROM delivery_requests WHERE id = ? AND matched_traveler_id = ?')
    .bind(requestId, user.id)
    .first();

  if (!request) {
    return c.json({ error: 'Request not found' }, 404);
  }

  if (request.tracking_code !== tracking_code) {
    return c.json({ error: 'Invalid tracking code' }, 400);
  }

  // Update request
  await db!
    .prepare(
      `UPDATE delivery_requests 
       SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(requestId)
    .run();

  // Update payment escrow (release funds)
  await db!
    .prepare(
      `UPDATE payments 
       SET escrow_status = 'released', released_at = CURRENT_TIMESTAMP
       WHERE delivery_request_id = ?`
    )
    .bind(requestId)
    .run();

  // Update traveler stats
  await db!
    .prepare(
      `UPDATE users 
       SET total_deliveries = total_deliveries + 1,
           successful_deliveries = successful_deliveries + 1,
           trust_score = CASE WHEN trust_score < 95 THEN trust_score + 5 ELSE trust_score END
       WHERE id = ?`
    )
    .bind(user.id)
    .run();

  return c.json({ 
    message: 'Delivery confirmed! Payment will be released.',
    escrow_released: true
  });
});

// Refuse documents
bookings.post('/:request_id/refuse', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const requestId = c.req.param('request_id');
  const { reason } = await c.req.json();

  const request = await db!
    .prepare('SELECT * FROM delivery_requests WHERE id = ? AND matched_traveler_id = ?')
    .bind(requestId, user.id)
    .first();

  if (!request) {
    return c.json({ error: 'Request not found' }, 404);
  }

  // Cancel the request
  await db!
    .prepare('UPDATE delivery_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind('cancelled', requestId)
    .run();

  // Restore trip slot
  if (request.matched_trip_id) {
    await db!
      .prepare('UPDATE trips SET available_slots = available_slots + 1 WHERE id = ?')
      .bind(request.matched_trip_id)
      .run();
  }

  // Refund sender if payment was made
  await db!
    .prepare(
      `UPDATE payments 
       SET escrow_status = 'refunded'
       WHERE delivery_request_id = ?`
    )
    .bind(requestId)
    .run();

  return c.json({ 
    message: 'Documents refused. Sender has been refunded.',
    reason 
  });
});

export default bookings;
