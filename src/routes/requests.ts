import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, requireRole, requireVerified } from '../middleware/auth';
import { generateId } from '../utils/auth';

const requests = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all routes
requests.use('/*', authMiddleware);

// Create delivery request
requests.post('/', requireVerified, async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;

  const {
    departure_city,
    destination_city,
    pickup_address,
    delivery_address,
    document_description,
    document_type,
    offered_amount,
    urgency
  } = await c.req.json();

  // Validate
  if (!departure_city || !destination_city || !pickup_address || !delivery_address || 
      !document_description || !offered_amount) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  if (offered_amount < 10 || offered_amount > 100) {
    return c.json({ error: 'Amount must be between $10 and $100' }, 400);
  }

  const requestId = generateId('req');

  await db!
    .prepare(
      `INSERT INTO delivery_requests 
       (id, sender_id, departure_city, destination_city, pickup_address, delivery_address,
        document_description, document_type, offered_amount, urgency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      requestId, user.id, departure_city, destination_city, pickup_address, delivery_address,
      document_description, document_type || null, offered_amount, urgency || 'within_7_days'
    )
    .run();

  return c.json({
    id: requestId,
    message: 'Delivery request created successfully'
  }, 201);
});

// Get all delivery requests (filtered by user role)
requests.get('/', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const status = c.req.query('status') || 'open';

  let query;
  if (user.role === 'sender' || (user.role === 'both' && c.req.query('view') === 'sender')) {
    // Show user's own requests
    query = db!
      .prepare('SELECT * FROM delivery_requests WHERE sender_id = ? ORDER BY created_at DESC')
      .bind(user.id);
  } else {
    // Show open requests for travelers
    query = db!
      .prepare(
        `SELECT dr.*, u.full_name as sender_name, u.trust_score as sender_trust_score
         FROM delivery_requests dr
         JOIN users u ON dr.sender_id = u.id
         WHERE dr.status = ?
         ORDER BY dr.created_at DESC`
      )
      .bind(status);
  }

  const result = await query.all();

  return c.json({
    requests: result.results || []
  });
});

// Get specific request
requests.get('/:id', async (c) => {
  const db = c.env.DB;
  const requestId = c.req.param('id');

  const request = await db!
    .prepare(
      `SELECT dr.*, 
              sender.full_name as sender_name, sender.phone as sender_phone,
              traveler.full_name as traveler_name, traveler.phone as traveler_phone
       FROM delivery_requests dr
       JOIN users sender ON dr.sender_id = sender.id
       LEFT JOIN users traveler ON dr.matched_traveler_id = traveler.id
       WHERE dr.id = ?`
    )
    .bind(requestId)
    .first();

  if (!request) {
    return c.json({ error: 'Request not found' }, 404);
  }

  return c.json(request);
});

// Get available travelers for a request
requests.get('/:id/travelers', async (c) => {
  const db = c.env.DB;
  const requestId = c.req.param('id');

  // Get request details
  const request = await db!
    .prepare('SELECT * FROM delivery_requests WHERE id = ?')
    .bind(requestId)
    .first();

  if (!request) {
    return c.json({ error: 'Request not found' }, 404);
  }

  // Find matching trips
  const trips = await db!
    .prepare(
      `SELECT t.*, u.full_name, u.trust_score, u.average_rating, u.total_deliveries
       FROM trips t
       JOIN users u ON t.traveler_id = u.id
       WHERE t.departure_city = ? 
         AND t.destination_city = ?
         AND t.status = 'active'
         AND t.available_slots > 0
         AND u.verification_status = 'approved'
       ORDER BY u.trust_score DESC, u.average_rating DESC`
    )
    .bind(request.departure_city, request.destination_city)
    .all();

  return c.json({
    travelers: trips.results || []
  });
});

// Match with traveler
requests.post('/:id/match', requireVerified, async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const requestId = c.req.param('id');
  const { trip_id, traveler_id } = await c.req.json();

  // Verify request belongs to user
  const request = await db!
    .prepare('SELECT * FROM delivery_requests WHERE id = ? AND sender_id = ?')
    .bind(requestId, user.id)
    .first();

  if (!request) {
    return c.json({ error: 'Request not found or unauthorized' }, 404);
  }

  if (request.status !== 'open') {
    return c.json({ error: 'Request already matched' }, 400);
  }

  // Verify trip exists and has capacity
  const trip = await db!
    .prepare('SELECT * FROM trips WHERE id = ? AND traveler_id = ? AND available_slots > 0')
    .bind(trip_id, traveler_id)
    .first();

  if (!trip) {
    return c.json({ error: 'Trip not available' }, 404);
  }

  // Generate tracking code
  const trackingCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Update request
  await db!
    .prepare(
      `UPDATE delivery_requests 
       SET matched_trip_id = ?, matched_traveler_id = ?, tracking_code = ?,
           status = 'matched', matched_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(trip_id, traveler_id, trackingCode, requestId)
    .run();

  // Update trip availability
  await db!
    .prepare('UPDATE trips SET available_slots = available_slots - 1 WHERE id = ?')
    .bind(trip_id)
    .run();

  return c.json({
    message: 'Successfully matched with traveler',
    tracking_code: trackingCode
  });
});

// Cancel request
requests.delete('/:id', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const requestId = c.req.param('id');

  const request = await db!
    .prepare('SELECT * FROM delivery_requests WHERE id = ? AND sender_id = ?')
    .bind(requestId, user.id)
    .first();

  if (!request) {
    return c.json({ error: 'Request not found' }, 404);
  }

  if (['picked_up', 'in_transit', 'delivered'].includes(request.status as string)) {
    return c.json({ error: 'Cannot cancel request in this status' }, 400);
  }

  await db!
    .prepare('UPDATE delivery_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .bind('cancelled', requestId)
    .run();

  // If matched, restore trip slot
  if (request.matched_trip_id) {
    await db!
      .prepare('UPDATE trips SET available_slots = available_slots + 1 WHERE id = ?')
      .bind(request.matched_trip_id)
      .run();
  }

  return c.json({ message: 'Request cancelled successfully' });
});

export default requests;
