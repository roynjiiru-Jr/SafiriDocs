import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware, requireRole, requireVerified } from '../middleware/auth';
import { generateId } from '../utils/auth';

const trips = new Hono<{ Bindings: Bindings; Variables: Variables }>();

trips.use('/*', authMiddleware);

// Create trip
trips.post('/', requireVerified, async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;

  if (user.role === 'sender') {
    return c.json({ error: 'Only travelers can create trips' }, 403);
  }

  const {
    departure_city,
    destination_city,
    departure_date,
    arrival_date,
    flight_number,
    airline,
    max_documents
  } = await c.req.json();

  if (!departure_city || !destination_city || !departure_date || !arrival_date) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  const tripId = generateId('trip');

  await db!
    .prepare(
      `INSERT INTO trips 
       (id, traveler_id, departure_city, destination_city, departure_date, arrival_date,
        flight_number, airline, max_documents, available_slots)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      tripId, user.id, departure_city, destination_city, departure_date, arrival_date,
      flight_number || null, airline || null, max_documents || 3, max_documents || 3
    )
    .run();

  return c.json({
    id: tripId,
    message: 'Trip created successfully'
  }, 201);
});

// Get trips
trips.get('/', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;

  // Get user's own trips
  const result = await db!
    .prepare('SELECT * FROM trips WHERE traveler_id = ? ORDER BY departure_date DESC')
    .bind(user.id)
    .all();

  return c.json({
    trips: result.results || []
  });
});

// Get specific trip
trips.get('/:id', async (c) => {
  const db = c.env.DB;
  const tripId = c.req.param('id');

  const trip = await db!
    .prepare(
      `SELECT t.*, u.full_name, u.trust_score, u.average_rating
       FROM trips t
       JOIN users u ON t.traveler_id = u.id
       WHERE t.id = ?`
    )
    .bind(tripId)
    .first();

  if (!trip) {
    return c.json({ error: 'Trip not found' }, 404);
  }

  return c.json(trip);
});

// Get matching requests for a trip
trips.get('/:id/requests', async (c) => {
  const db = c.env.DB;
  const tripId = c.req.param('id');

  const trip = await db!
    .prepare('SELECT * FROM trips WHERE id = ?')
    .bind(tripId)
    .first();

  if (!trip) {
    return c.json({ error: 'Trip not found' }, 404);
  }

  const requests = await db!
    .prepare(
      `SELECT dr.*, u.full_name, u.trust_score
       FROM delivery_requests dr
       JOIN users u ON dr.sender_id = u.id
       WHERE dr.departure_city = ?
         AND dr.destination_city = ?
         AND dr.status = 'open'
       ORDER BY dr.offered_amount DESC, dr.created_at DESC`
    )
    .bind(trip.departure_city, trip.destination_city)
    .all();

  return c.json({
    requests: requests.results || []
  });
});

// Apply to a request
trips.post('/:id/apply', requireVerified, async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const tripId = c.req.param('id');
  const { request_id } = await c.req.json();

  // Verify trip belongs to user
  const trip = await db!
    .prepare('SELECT * FROM trips WHERE id = ? AND traveler_id = ?')
    .bind(tripId, user.id)
    .first();

  if (!trip) {
    return c.json({ error: 'Trip not found' }, 404);
  }

  if (trip.available_slots === 0) {
    return c.json({ error: 'No available slots' }, 400);
  }

  // Check if request is open
  const request = await db!
    .prepare('SELECT * FROM delivery_requests WHERE id = ? AND status = ?')
    .bind(request_id, 'open')
    .first();

  if (!request) {
    return c.json({ error: 'Request not available' }, 404);
  }

  // In MVP, auto-match (skip approval step)
  const trackingCode = Math.floor(100000 + Math.random() * 900000).toString();

  await db!
    .prepare(
      `UPDATE delivery_requests 
       SET matched_trip_id = ?, matched_traveler_id = ?, tracking_code = ?,
           status = 'matched', matched_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(tripId, user.id, trackingCode, request_id)
    .run();

  await db!
    .prepare('UPDATE trips SET available_slots = available_slots - 1 WHERE id = ?')
    .bind(tripId)
    .run();

  return c.json({
    message: 'Successfully matched with sender',
    tracking_code: trackingCode
  });
});

export default trips;
