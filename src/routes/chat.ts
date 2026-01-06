import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateId } from '../utils/auth';

const chat = new Hono<{ Bindings: Bindings; Variables: Variables }>();

chat.use('/*', authMiddleware);

// Get messages for a request
chat.get('/:request_id/messages', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const requestId = c.req.param('request_id');

  // Verify user is part of this conversation
  const request = await db!
    .prepare('SELECT * FROM delivery_requests WHERE id = ?')
    .bind(requestId)
    .first();

  if (!request) {
    return c.json({ error: 'Request not found' }, 404);
  }

  if (user.id !== request.sender_id && user.id !== request.matched_traveler_id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  const messages = await db!
    .prepare(
      `SELECT cm.*, u.full_name as sender_name
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.delivery_request_id = ?
       ORDER BY cm.created_at ASC`
    )
    .bind(requestId)
    .all();

  return c.json({
    messages: messages.results || []
  });
});

// Send message
chat.post('/:request_id/messages', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const requestId = c.req.param('request_id');
  const { message_text } = await c.req.json();

  if (!message_text) {
    return c.json({ error: 'Message text required' }, 400);
  }

  // Verify user is part of this conversation
  const request = await db!
    .prepare('SELECT * FROM delivery_requests WHERE id = ?')
    .bind(requestId)
    .first();

  if (!request) {
    return c.json({ error: 'Request not found' }, 404);
  }

  if (user.id !== request.sender_id && user.id !== request.matched_traveler_id) {
    return c.json({ error: 'Unauthorized' }, 403);
  }

  // Determine receiver
  const receiverId = user.id === request.sender_id 
    ? request.matched_traveler_id 
    : request.sender_id;

  const messageId = generateId('msg');

  await db!
    .prepare(
      `INSERT INTO chat_messages (id, delivery_request_id, sender_id, receiver_id, message_text)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(messageId, requestId, user.id, receiverId, message_text)
    .run();

  return c.json({
    id: messageId,
    message: 'Message sent successfully'
  }, 201);
});

// Mark messages as read
chat.put('/:request_id/read', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const requestId = c.req.param('request_id');

  await db!
    .prepare(
      `UPDATE chat_messages 
       SET read_at = CURRENT_TIMESTAMP
       WHERE delivery_request_id = ? AND receiver_id = ? AND read_at IS NULL`
    )
    .bind(requestId, user.id)
    .run();

  return c.json({ message: 'Messages marked as read' });
});

export default chat;
