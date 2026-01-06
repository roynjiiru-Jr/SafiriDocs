# SafiriDocs - Technical Architecture

## 📐 System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│          HTML + Vanilla JS + TailwindCSS                     │
│   Single Page with Dynamic Sections (Home, Login, Dashboard)│
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ HTTPS (JWT Bearer Token)
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                    BACKEND (Hono on CF Workers)              │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth API    │  │  Core API    │  │  Payments    │      │
│  │              │  │              │  │              │      │
│  │ - Signup     │  │ - Requests   │  │ - Flutterwave│      │
│  │ - Login      │  │ - Trips      │  │ - Escrow     │      │
│  │ - Verify     │  │ - Matching   │  │ - Payouts    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Bookings    │  │  Chat API    │  │  Reviews     │      │
│  │              │  │              │  │              │      │
│  │ - Pickup     │  │ - Messages   │  │ - Ratings    │      │
│  │ - Delivery   │  │ - Read       │  │ - Trust      │      │
│  │ - Tracking   │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────┬────────────┬──────────────┬───────────────┘
                  │            │              │
       ┌──────────▼───┐   ┌────▼─────┐   ┌───▼──────────┐
       │ D1 Database  │   │Flutterwave│   │ R2 Storage   │
       │  (SQLite)    │   │    API    │   │ (Future: IDs)│
       │              │   │           │   │              │
       │ - Users      │   │ - Payments│   │ - Documents  │
       │ - Requests   │   │ - Transfers│   │ - Photos     │
       │ - Trips      │   │ - Webhooks│   │              │
       │ - Payments   │   │           │   │              │
       └──────────────┘   └───────────┘   └──────────────┘
```

---

## 🏛️ Backend Architecture

### Routing Structure

**Base URL**: `https://safiridocs.pages.dev/api`

```
/api
├── /auth
│   ├── POST /signup
│   ├── POST /login
│   ├── POST /verify-otp
│   └── GET  /me
├── /requests
│   ├── POST   /
│   ├── GET    /
│   ├── GET    /:id
│   ├── GET    /:id/travelers
│   ├── POST   /:id/match
│   └── DELETE /:id
├── /trips
│   ├── POST /
│   ├── GET  /
│   ├── GET  /:id
│   ├── GET  /:id/requests
│   └── POST /:id/apply
├── /bookings
│   ├── POST /:request_id/confirm-pickup
│   ├── POST /:request_id/update-status
│   ├── POST /:request_id/confirm-delivery
│   └── POST /:request_id/refuse
├── /payments
│   ├── POST /initiate
│   ├── POST /webhook/flutterwave
│   ├── GET  /:payment_id/status
│   └── POST /payout/:payment_id
├── /reviews
│   ├── POST /
│   └── GET  /user/:user_id
└── /chat
    ├── GET  /:request_id/messages
    ├── POST /:request_id/messages
    └── PUT  /:request_id/read
```

### Middleware Stack

```typescript
Request
  ↓
CORS Middleware (for /api/*)
  ↓
Auth Middleware (JWT validation)
  ↓
Role Check Middleware (sender/traveler/both)
  ↓
Verification Check (approved users only)
  ↓
Route Handler
  ↓
Response
```

---

## 🗄️ Database Design

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                           USERS                              │
│  id, email, phone, full_name, role, verification_status     │
│  trust_score, total_deliveries, average_rating              │
└────┬──────────────────────────────────┬────────────────────┘
     │                                   │
     │ 1:M                               │ 1:M
     │                                   │
┌────▼────────────┐              ┌──────▼─────────────────────┐
│     TRIPS       │              │   DELIVERY_REQUESTS        │
│  traveler_id    │              │   sender_id                │
│  route, dates   │              │   route, addresses         │
│  available_slots│              │   matched_trip_id          │
└────┬────────────┘              │   matched_traveler_id      │
     │                           │   tracking_code            │
     │ 1:M                       └──────┬────────────────────┘
     │                                  │
     │                                  │ 1:1
     │                           ┌──────▼─────────────────────┐
     │                           │       PAYMENTS             │
     │                           │   delivery_request_id      │
     │                           │   escrow_status            │
     │                           │   flutterwave_tx_ref       │
     │                           └────────────────────────────┘
     │
     │ M:M (via delivery_requests)
     │
┌────▼────────────────────────────────────────────────────────┐
│                         REVIEWS                              │
│  reviewer_id, reviewee_id, rating, delivery_request_id      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      CHAT_MESSAGES                           │
│  delivery_request_id, sender_id, receiver_id, message_text  │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        DISPUTES                              │
│  delivery_request_id, filed_by, against, reason, resolution │
└──────────────────────────────────────────────────────────────┘
```

### Database Indexes

Optimized for common queries:

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_verification ON users(verification_status);

-- Trips (find by route)
CREATE INDEX idx_trips_route ON trips(departure_city, destination_city, departure_date);
CREATE INDEX idx_trips_traveler ON trips(traveler_id);

-- Requests (find by route and status)
CREATE INDEX idx_requests_route ON delivery_requests(departure_city, destination_city);
CREATE INDEX idx_requests_status ON delivery_requests(status);
CREATE INDEX idx_requests_sender ON delivery_requests(sender_id);

-- Payments (lookup by request)
CREATE INDEX idx_payments_request ON payments(delivery_request_id);
CREATE INDEX idx_payments_escrow ON payments(escrow_status);

-- Chat (load conversations)
CREATE INDEX idx_chat_request ON chat_messages(delivery_request_id);
```

---

## 🔐 Authentication & Authorization

### JWT Token Structure

```json
{
  "user_id": "user-1234567890",
  "role": "sender|traveler|both",
  "iat": 1704672000,
  "exp": 1705276800
}
```

**Token Lifetime**: 7 days  
**Storage**: `localStorage` (client-side)  
**Transport**: `Authorization: Bearer <token>` header

### Authorization Levels

| Route | Public | Authenticated | Verified | Role Specific |
|-------|--------|--------------|----------|---------------|
| `/auth/signup` | ✅ | - | - | - |
| `/auth/login` | ✅ | - | - | - |
| `/requests` (GET) | - | ✅ | - | - |
| `/requests` (POST) | - | ✅ | ✅ | sender/both |
| `/trips` (POST) | - | ✅ | ✅ | traveler/both |
| `/bookings/*` | - | ✅ | ✅ | matched users only |
| `/payments/*` | - | ✅ | ✅ | request participants |

### Verification Flow

```
1. User signs up → verification_status = 'pending'
2. User uploads ID → Admin reviews
3. Admin approves → verification_status = 'approved'
4. User can now create requests/trips
```

---

## 💳 Payment Flow (Flutterwave)

### Escrow Architecture

```
┌──────────────┐
│    SENDER    │
└──────┬───────┘
       │ 1. Initiates payment ($20)
       │
       ▼
┌──────────────────────────────────────────┐
│         FLUTTERWAVE PAYMENT              │
│  ┌────────────────────────────────────┐  │
│  │  MPesa / Card Payment Gateway      │  │
│  └────────────┬───────────────────────┘  │
│               │ 2. Payment successful    │
│               ▼                          │
│  ┌────────────────────────────────────┐  │
│  │    Platform Account (Escrow)       │  │
│  │    Balance: $20                    │  │
│  └────────────┬───────────────────────┘  │
└───────────────┼──────────────────────────┘
                │ 3. Webhook confirms
                │
         ┌──────▼──────┐
         │  SAFIRIDOCS │
         │   DATABASE  │
         │  Payment:   │
         │  status=held│
         └──────┬──────┘
                │ 4. Delivery confirmed
                │
         ┌──────▼──────────────────────────┐
         │  FLUTTERWAVE TRANSFER API       │
         │  Transfer $17 to traveler       │
         └──────┬──────────────────────────┘
                │ 5. Payout complete
                ▼
         ┌──────────────┐
         │   TRAVELER   │
         │  MPesa: +$17 │
         └──────────────┘
```

### Payment States

```
pending → held → released → completed
   ↓        ↓        ↓
cancelled  refunded disputed
```

---

## 🚀 Deployment Architecture

### Cloudflare Pages + Workers

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE NETWORK                   │
│                  (200+ locations globally)                   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              CLOUDFLARE PAGES                         │   │
│  │  - Serves static assets (HTML, CSS, JS)              │   │
│  │  - Global CDN caching                                 │   │
│  │  - Automatic HTTPS                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              CLOUDFLARE WORKERS                       │   │
│  │  - Hono API backend                                   │   │
│  │  - Edge runtime (V8 isolates)                         │   │
│  │  - Sub-50ms response time                             │   │
│  │  - Auto-scales to millions of requests                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
            ┌───────▼─────┐   ┌──────▼────────┐
            │ D1 Database │   │  R2 Storage   │
            │  (SQLite)   │   │  (S3-like)    │
            └─────────────┘   └───────────────┘
```

### Build Pipeline

```
Code Change
  ↓
Git Push
  ↓
Cloudflare Pages Webhook
  ↓
Build Process (vite build)
  ↓
Deploy to Edge (< 30 seconds)
  ↓
Live on https://safiridocs.pages.dev
```

---

## 📊 Performance Optimizations

### Database Query Optimization

```typescript
// ❌ BAD: Multiple queries
const request = await db.prepare('SELECT * FROM delivery_requests WHERE id = ?').bind(id).first();
const sender = await db.prepare('SELECT * FROM users WHERE id = ?').bind(request.sender_id).first();
const traveler = await db.prepare('SELECT * FROM users WHERE id = ?').bind(request.matched_traveler_id).first();

// ✅ GOOD: Single JOIN query
const request = await db.prepare(`
  SELECT dr.*, 
         sender.full_name as sender_name,
         traveler.full_name as traveler_name
  FROM delivery_requests dr
  JOIN users sender ON dr.sender_id = sender.id
  LEFT JOIN users traveler ON dr.matched_traveler_id = traveler.id
  WHERE dr.id = ?
`).bind(id).first();
```

### Frontend Optimizations

- **No React bundle**: Pure vanilla JS (saves 100KB+)
- **CDN assets**: TailwindCSS, FontAwesome via CDN
- **Lazy loading**: Sections shown only when needed
- **LocalStorage caching**: JWT token + user data cached

---

## 🔒 Security Measures

### Input Validation

```typescript
// All user inputs sanitized and validated
if (!email || !email.includes('@')) {
  return c.json({ error: 'Invalid email' }, 400);
}

// SQL injection prevention (parameterized queries)
db.prepare('SELECT * FROM users WHERE email = ?').bind(email); // ✅ Safe
```

### Rate Limiting (Future)

```typescript
// TODO: Add Cloudflare Workers KV for rate limiting
// 100 requests per IP per minute
```

### CORS Policy

```typescript
// Only API routes have CORS enabled
app.use('/api/*', cors());
```

---

## 📈 Scalability Plan

### Current Capacity (MVP)

- **Users**: 10,000 concurrent
- **Requests/day**: 100,000 (Cloudflare free tier)
- **Database**: 5GB (D1 free tier)
- **Cost**: ~$5/month

### Scale Triggers

| Metric | Action |
|--------|--------|
| >100K requests/day | Upgrade to Cloudflare paid ($5/month) |
| >5GB database | Migrate to D1 paid or Postgres |
| >10K users | Add caching layer (KV) |
| >$10K GMV/month | Add fraud detection |

### Horizontal Scaling

Cloudflare Workers auto-scale globally. No manual intervention needed.

---

## 🛠️ Development Workflow

```
1. Local Development
   ├── npm run dev (Vite dev server)
   └── wrangler pages dev (with D1 database)

2. Testing
   ├── Manual testing with seed data
   └── Test Flutterwave payments (sandbox)

3. Staging (optional)
   └── Deploy to staging branch

4. Production
   ├── npm run build
   ├── npm run deploy:prod
   └── Monitor logs (wrangler pages deployment tail)
```

---

**Last Updated**: 2026-01-06  
**Version**: MVP 1.0
