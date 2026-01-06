# SafiriDocs - Document Delivery Marketplace

**Connect senders with verified travelers for trusted peer-to-peer document delivery**

SafiriDocs is a marketplace platform that connects people who need to send documents internationally with verified travelers already going to the same destination. Save up to 80% on courier costs with fast, secure, peer-to-peer delivery.

---

## 🚀 Project Overview

### The Problem
- International courier services (DHL, FedEx) cost $50-150 for a single document
- Slow delivery times (3-7 days)
- Overkill infrastructure for lightweight documents

### The Solution
SafiriDocs connects:
- **Senders**: People who need documents delivered internationally
- **Travelers**: Verified travelers who can earn $10-50 by carrying documents on their existing trips

### Key Features
- 📄 **Documents Only**: Safe, legal, low-risk deliveries
- 🔒 **Escrow Payments**: Funds held until delivery confirmed
- ✅ **ID Verification**: All users verified before transactions
- 💳 **Flutterwave Integration**: MPesa + Card payments
- ⭐ **Trust System**: Ratings and trust scores
- 📱 **Real-time Chat**: Sender ↔ Traveler communication
- 📍 **Order Tracking**: Pickup → In-transit → Delivered

---

## 🏗️ Tech Stack

### Backend
- **Hono**: Fast, lightweight web framework
- **Cloudflare Workers**: Edge runtime (sub-50ms globally)
- **Cloudflare D1**: Globally distributed SQLite database
- **TypeScript**: Type-safe backend development

### Payments
- **Flutterwave**: Complete payment solution
  - MPesa (Kenya, Tanzania, Uganda, Rwanda)
  - Card payments (Visa, Mastercard globally)
  - Bank transfers
  - Built-in escrow via subaccounts

### Frontend
- **Vanilla JS + TailwindCSS**: Fast, responsive UI
- **No build step for frontend**: Pure HTML/CSS/JS
- **Mobile-first design**: PWA-ready

### Deployment
- **Cloudflare Pages**: Global CDN, instant deploys
- **Cost**: ~$5/month for MVP (100K requests/day free tier)

---

## 📁 Project Structure

```
safiridocs/
├── src/
│   ├── index.tsx              # Main Hono app + Frontend HTML
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── utils/
│   │   └── auth.ts            # Auth utilities (JWT, hashing)
│   ├── middleware/
│   │   └── auth.ts            # Authentication middleware
│   └── routes/
│       ├── auth.ts            # Signup, login, verify
│       ├── requests.ts        # Delivery requests CRUD
│       ├── trips.ts           # Traveler trips CRUD
│       ├── bookings.ts        # Pickup, delivery, tracking
│       ├── payments.ts        # Flutterwave integration
│       ├── reviews.ts         # Post-delivery ratings
│       └── chat.ts            # In-app messaging
├── migrations/
│   └── 0001_initial_schema.sql # Database schema
├── public/                    # Static assets
├── seed.sql                   # Test data
├── wrangler.jsonc             # Cloudflare config
├── package.json
└── README.md
```

---

## 🗄️ Database Schema

### Tables
- **users**: User accounts, verification, trust scores
- **trips**: Traveler journeys
- **delivery_requests**: Document delivery requests
- **payments**: Escrow payments via Flutterwave
- **reviews**: Post-delivery ratings
- **disputes**: Dispute resolution
- **chat_messages**: Sender ↔ Traveler chat
- **notifications**: SMS/push notifications

### Key Relationships
```
USERS (1) ──────── (M) TRIPS
  │                      │
  │                      └──── (1) DELIVERY_REQUESTS (M) ──── (1) PAYMENTS
  │                                      │
  └────────────────────────────────────┘
```

---

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account (free tier)
- Flutterwave account

### 1. Clone & Install

```bash
git clone <repository-url>
cd safiridocs
npm install
```

### 2. Configure Environment

Create `.dev.vars` file (local development only):

```bash
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
JWT_SECRET=your_jwt_secret_key
```

**⚠️ Never commit `.dev.vars` to git!**

### 3. Run Database Migrations

```bash
# Apply migrations to local D1 database
npm run db:migrate:local

# Seed with test data
npm run db:seed
```

### 4. Start Development Server

```bash
# Build first
npm run build

# Start local dev server
npm run dev:sandbox
```

Or using PM2 (recommended for sandbox):

```bash
# Clean port
npm run clean-port

# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs

# Check logs
pm2 logs --nostream
```

Access at: `http://localhost:3000`

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/signup          # Create account
POST   /api/auth/login           # Login
POST   /api/auth/verify-otp      # Verify phone (mock)
GET    /api/auth/me              # Get current user
```

### Delivery Requests (Sender)
```
POST   /api/requests             # Create request
GET    /api/requests             # List requests
GET    /api/requests/:id         # Get request details
GET    /api/requests/:id/travelers # Find travelers
POST   /api/requests/:id/match   # Match with traveler
DELETE /api/requests/:id         # Cancel request
```

### Trips (Traveler)
```
POST   /api/trips                # Create trip
GET    /api/trips                # List trips
GET    /api/trips/:id            # Get trip details
GET    /api/trips/:id/requests   # Find matching requests
POST   /api/trips/:id/apply      # Apply to request
```

### Bookings & Tracking
```
POST   /api/bookings/:id/confirm-pickup    # Traveler confirms pickup
POST   /api/bookings/:id/update-status     # Update status
POST   /api/bookings/:id/confirm-delivery  # Confirm delivery
POST   /api/bookings/:id/refuse            # Refuse documents
```

### Payments (Flutterwave)
```
POST   /api/payments/initiate              # Initiate payment
POST   /api/payments/webhook/flutterwave   # Webhook handler
GET    /api/payments/:id/status            # Check payment status
POST   /api/payouts/:id                    # Request payout
```

### Reviews
```
POST   /api/reviews              # Submit review
GET    /api/reviews/user/:id     # Get user reviews
```

### Chat
```
GET    /api/chat/:request_id/messages  # Load messages
POST   /api/chat/:request_id/messages  # Send message
PUT    /api/chat/:request_id/read      # Mark as read
```

---

## 💳 Flutterwave Integration

### Payment Flow

1. **Sender Initiates Payment**
   ```
   POST /api/payments/initiate
   {
     "delivery_request_id": "req-123",
     "payment_method": "mpesa"
   }
   ```

2. **Flutterwave Returns Payment Link**
   - Sender completes payment via MPesa/Card
   - Funds held in platform account (escrow)

3. **Webhook Confirms Payment**
   - Flutterwave sends webhook to `/api/payments/webhook/flutterwave`
   - Payment status updated to "held"

4. **Delivery Confirmed**
   - Traveler enters tracking code
   - Escrow status updated to "released"

5. **Traveler Requests Payout**
   ```
   POST /api/payouts/:payment_id
   ```
   - Flutterwave transfers funds to traveler's MPesa/Bank

### Test Credentials (Flutterwave Sandbox)

Use Flutterwave test mode for development:
- Test card: 4242 4242 4242 4242
- Expiry: 12/30
- CVV: 123

---

## 🚢 Deployment

### Deploy to Cloudflare Pages

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy**
   ```bash
   npm run deploy:prod
   ```

3. **Set production secrets**
   ```bash
   # Add Flutterwave secret key
   wrangler pages secret put FLUTTERWAVE_SECRET_KEY --project-name safiridocs

   # Add JWT secret
   wrangler pages secret put JWT_SECRET --project-name safiridocs
   ```

4. **Run production migrations**
   ```bash
   npm run db:migrate:prod
   ```

### Production URLs
- Production: `https://safiridocs.pages.dev`
- API: `https://safiridocs.pages.dev/api`

---

## 📊 Database Management

### Local Development

```bash
# Reset local database
npm run db:reset

# Run migrations
npm run db:migrate:local

# Seed test data
npm run db:seed

# Query database
npm run db:console:local
```

### Production

```bash
# Run migrations
npm run db:migrate:prod

# Query database
npm run db:console:prod
```

---

## 🧪 Testing

### Test User Accounts (from seed.sql)

1. **Sender**: alice@example.com / password123
2. **Traveler**: bob@example.com / password123
3. **Both**: carol@example.com / password123
4. **Admin**: admin@safiridocs.com / password123

### Test Workflow

1. Login as Alice (sender)
2. Create delivery request (Nairobi → Dubai)
3. Login as Bob (traveler)
4. Create trip (Nairobi → Dubai)
5. Apply to Alice's request
6. Alice initiates payment (test mode)
7. Bob confirms pickup
8. Bob confirms delivery (with tracking code)
9. Payment released to Bob

---

## 🔒 Security Features

### Authentication
- JWT tokens (7-day expiry)
- Password hashing (SHA-256)
- SMS OTP verification (mocked in MVP)

### Authorization
- Role-based access control (sender/traveler/both)
- Verification status checks (approved users only)
- User-specific data access

### Payment Security
- Escrow system (funds held until delivery)
- Flutterwave PCI-compliant
- Webhook signature verification
- Transaction verification before payout

### Data Protection
- Environment variables for secrets
- No sensitive data in client-side code
- CORS enabled for API routes

---

## 📈 MVP Metrics (Track from Day 1)

| Metric | Target (Week 1) | Target (Month 1) |
|--------|----------------|------------------|
| Signups | 50 | 500 |
| Requests Posted | 10 | 100 |
| Trips Posted | 5 | 50 |
| Completed Deliveries | 2 | 20 |
| GMV | $50 | $500 |
| Completion Rate | >80% | >90% |

---

## 🛣️ Roadmap

### ✅ MVP Features (Current)
- User signup/login
- Delivery requests & trips
- Matching system
- Flutterwave payments
- Tracking & confirmation
- Reviews & ratings
- In-app chat

### 🔜 Coming Soon (V2)
- [ ] Real SMS OTP (Africa's Talking)
- [ ] Push notifications (OneSignal)
- [ ] Admin panel (user verification, disputes)
- [ ] Mobile apps (React Native)
- [ ] More routes (Lagos → London, Accra → NYC)
- [ ] Automated ID verification (Smile Identity)
- [ ] Document insurance

### 🌟 Future (V3+)
- [ ] Real-time GPS tracking
- [ ] Background checks for travelers
- [ ] Business accounts & API access
- [ ] Bulk document delivery
- [ ] Partnership with airlines

---

## 🤝 Contributing

This is an MVP project. Contributions welcome!

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🆘 Support

- **Email**: support@safiridocs.com
- **Documentation**: [Coming Soon]
- **GitHub Issues**: [Report bugs here]

---

## 🎯 Key Differentiators

| Feature | SafiriDocs | Traditional Courier |
|---------|-----------|-------------------|
| Cost | $10-30 | $50-150 |
| Speed | 24-48 hours | 3-7 days |
| Trust | Verified travelers + escrow | Corporate brand |
| Flexibility | Peer-to-peer | Fixed schedules |
| Africa-first | MPesa, local routes | Western-centric |

---

**Built with ❤️ for Africa's diaspora and global travelers**

*SafiriDocs - Your documents, their journey, our trust.*
