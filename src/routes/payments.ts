import { Hono } from 'hono';
import { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { generateId } from '../utils/auth';

const payments = new Hono<{ Bindings: Bindings; Variables: Variables }>();

payments.use('/*', authMiddleware);

// Initiate payment
payments.post('/initiate', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const flutterwaveKey = c.env.FLUTTERWAVE_SECRET_KEY;

  const { delivery_request_id, payment_method } = await c.req.json();

  // Get request details
  const request = await db!
    .prepare('SELECT * FROM delivery_requests WHERE id = ? AND sender_id = ?')
    .bind(delivery_request_id, user.id)
    .first();

  if (!request) {
    return c.json({ error: 'Request not found' }, 404);
  }

  if (request.status !== 'matched') {
    return c.json({ error: 'Request must be matched before payment' }, 400);
  }

  // Check if payment already exists
  const existingPayment = await db!
    .prepare('SELECT * FROM payments WHERE delivery_request_id = ?')
    .bind(delivery_request_id)
    .first();

  if (existingPayment) {
    return c.json({ error: 'Payment already initiated' }, 400);
  }

  // Calculate fees
  const totalAmount = request.offered_amount as number;
  const platformFee = totalAmount * 0.15; // 15% platform fee
  const travelerPayout = totalAmount - platformFee;

  // Generate payment reference
  const txRef = `SAFIRI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const paymentId = generateId('pay');

  // Create payment record
  await db!
    .prepare(
      `INSERT INTO payments 
       (id, delivery_request_id, sender_id, traveler_id, total_amount, platform_fee, 
        traveler_payout, payment_method, flutterwave_tx_ref)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      paymentId, delivery_request_id, user.id, request.matched_traveler_id,
      totalAmount, platformFee, travelerPayout, payment_method, txRef
    )
    .run();

  // Flutterwave payment initialization
  const flutterwavePayload = {
    tx_ref: txRef,
    amount: totalAmount,
    currency: 'USD',
    redirect_url: `${c.req.url.split('/api')[0]}/payment-callback`,
    customer: {
      email: user.email,
      phonenumber: user.phone,
      name: user.full_name
    },
    customizations: {
      title: 'SafiriDocs Payment',
      description: `Payment for document delivery (Request: ${delivery_request_id})`,
      logo: 'https://safiridocs.com/logo.png'
    },
    meta: {
      delivery_request_id,
      payment_id: paymentId
    }
  };

  try {
    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(flutterwavePayload)
    });

    const data = await response.json();

    if (data.status === 'success') {
      return c.json({
        payment_id: paymentId,
        payment_link: data.data.link,
        tx_ref: txRef,
        amount: totalAmount,
        message: 'Payment initiated successfully'
      });
    } else {
      return c.json({ error: 'Failed to initiate payment', details: data }, 500);
    }
  } catch (error) {
    return c.json({ error: 'Payment service unavailable', details: String(error) }, 500);
  }
});

// Flutterwave webhook
payments.post('/webhook/flutterwave', async (c) => {
  const db = c.env.DB;
  const flutterwaveKey = c.env.FLUTTERWAVE_SECRET_KEY;
  
  const signature = c.req.header('verif-hash');
  const payload = await c.req.json();

  // Verify webhook (in production, check signature)
  // const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  // if (signature !== secretHash) {
  //   return c.json({ error: 'Invalid signature' }, 401);
  // }

  if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
    const txRef = payload.data.tx_ref;

    // Verify transaction with Flutterwave
    const verifyResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${payload.data.id}/verify`,
      {
        headers: {
          'Authorization': `Bearer ${flutterwaveKey}`
        }
      }
    );

    const verifyData = await verifyResponse.json();

    if (verifyData.status === 'success' && verifyData.data.status === 'successful') {
      // Update payment status
      await db!
        .prepare(
          `UPDATE payments 
           SET escrow_status = 'held', paid_at = CURRENT_TIMESTAMP, payment_provider_id = ?
           WHERE flutterwave_tx_ref = ?`
        )
        .bind(String(payload.data.id), txRef)
        .run();

      console.log(`Payment confirmed for tx_ref: ${txRef}`);
    }
  }

  return c.json({ status: 'received' });
});

// Get payment status
payments.get('/:payment_id/status', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const paymentId = c.req.param('payment_id');

  const payment = await db!
    .prepare(
      `SELECT p.*, dr.status as request_status
       FROM payments p
       JOIN delivery_requests dr ON p.delivery_request_id = dr.id
       WHERE p.id = ? AND (p.sender_id = ? OR p.traveler_id = ?)`
    )
    .bind(paymentId, user.id, user.id)
    .first();

  if (!payment) {
    return c.json({ error: 'Payment not found' }, 404);
  }

  return c.json(payment);
});

// Request payout (traveler)
payments.post('/payout/:payment_id', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const paymentId = c.req.param('payment_id');
  const flutterwaveKey = c.env.FLUTTERWAVE_SECRET_KEY;

  const payment = await db!
    .prepare('SELECT * FROM payments WHERE id = ? AND traveler_id = ?')
    .bind(paymentId, user.id)
    .first();

  if (!payment) {
    return c.json({ error: 'Payment not found' }, 404);
  }

  if (payment.escrow_status !== 'released') {
    return c.json({ error: 'Payment not released yet' }, 400);
  }

  if (payment.payout_status === 'completed') {
    return c.json({ error: 'Payout already completed' }, 400);
  }

  // Initiate Flutterwave transfer
  const transferPayload = {
    account_bank: 'MPS', // MPesa
    account_number: user.phone,
    amount: payment.traveler_payout,
    currency: 'KES', // Kenya Shillings
    narration: `SafiriDocs payout for delivery`,
    reference: `PAYOUT-${paymentId}-${Date.now()}`,
    callback_url: `${c.req.url.split('/api')[0]}/payout-callback`,
    debit_currency: 'USD'
  };

  try {
    const response = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transferPayload)
    });

    const data = await response.json();

    if (data.status === 'success') {
      await db!
        .prepare(
          `UPDATE payments 
           SET payout_status = 'processing', payout_provider_id = ?
           WHERE id = ?`
        )
        .bind(String(data.data.id), paymentId)
        .run();

      return c.json({
        message: 'Payout initiated successfully',
        payout_id: data.data.id
      });
    } else {
      return c.json({ error: 'Failed to initiate payout', details: data }, 500);
    }
  } catch (error) {
    return c.json({ error: 'Payout service unavailable', details: String(error) }, 500);
  }
});

export default payments;
