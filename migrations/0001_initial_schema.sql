-- SafiriDocs Database Schema

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK(role IN ('sender', 'traveler', 'both')) DEFAULT 'sender',
  
  -- Identity Verification
  id_number TEXT,
  id_type TEXT CHECK(id_type IN ('national_id', 'passport')),
  id_photo_url TEXT,
  selfie_photo_url TEXT,
  verification_status TEXT CHECK(verification_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  verified_at DATETIME,
  
  -- Trust Score
  trust_score INTEGER DEFAULT 50,
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  average_rating REAL DEFAULT 0,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  account_status TEXT CHECK(account_status IN ('active', 'suspended', 'banned')) DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_verification ON users(verification_status);

-- TRIPS TABLE (Traveler's Journeys)
CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  traveler_id TEXT NOT NULL,
  
  -- Route
  departure_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  departure_date DATE NOT NULL,
  arrival_date DATE NOT NULL,
  
  -- Flight Details
  flight_number TEXT,
  airline TEXT,
  
  -- Capacity
  max_documents INTEGER DEFAULT 3,
  available_slots INTEGER DEFAULT 3,
  
  -- Status
  status TEXT CHECK(status IN ('active', 'in_progress', 'completed', 'cancelled')) DEFAULT 'active',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (traveler_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_trips_traveler ON trips(traveler_id);
CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(departure_city, destination_city, departure_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- DELIVERY_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS delivery_requests (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  
  -- Route
  departure_city TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  
  -- Pickup & Delivery
  pickup_address TEXT NOT NULL,
  pickup_lat REAL,
  pickup_lng REAL,
  delivery_address TEXT NOT NULL,
  delivery_lat REAL,
  delivery_lng REAL,
  
  -- Document Details
  document_description TEXT NOT NULL,
  document_type TEXT,
  document_photo_url TEXT,
  weight_kg REAL,
  
  -- Pricing & Urgency
  offered_amount REAL NOT NULL,
  urgency TEXT CHECK(urgency IN ('within_3_days', 'within_7_days', 'flexible')) DEFAULT 'within_7_days',
  
  -- Matching
  matched_trip_id TEXT,
  matched_traveler_id TEXT,
  
  -- Status
  status TEXT CHECK(status IN ('open', 'matched', 'picked_up', 'in_transit', 'delivered', 'disputed', 'cancelled')) DEFAULT 'open',
  
  -- Tracking
  tracking_code TEXT UNIQUE,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  matched_at DATETIME,
  picked_up_at DATETIME,
  delivered_at DATETIME,
  
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (matched_trip_id) REFERENCES trips(id),
  FOREIGN KEY (matched_traveler_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_requests_sender ON delivery_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_requests_route ON delivery_requests(departure_city, destination_city);
CREATE INDEX IF NOT EXISTS idx_requests_status ON delivery_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_traveler ON delivery_requests(matched_traveler_id);

-- PAYMENTS TABLE (Escrow)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  delivery_request_id TEXT NOT NULL UNIQUE,
  sender_id TEXT NOT NULL,
  traveler_id TEXT NOT NULL,
  
  -- Amounts
  total_amount REAL NOT NULL,
  platform_fee REAL NOT NULL,
  traveler_payout REAL NOT NULL,
  
  -- Payment Method
  payment_method TEXT CHECK(payment_method IN ('mpesa', 'card', 'bank_transfer')),
  payment_provider TEXT DEFAULT 'flutterwave',
  payment_provider_id TEXT,
  flutterwave_tx_ref TEXT,
  
  -- Escrow Status
  escrow_status TEXT CHECK(escrow_status IN ('pending', 'held', 'released', 'refunded', 'disputed')) DEFAULT 'pending',
  
  -- Payout
  payout_method TEXT,
  payout_provider_id TEXT,
  payout_status TEXT CHECK(payout_status IN ('pending', 'processing', 'completed', 'failed')),
  payout_completed_at DATETIME,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME,
  released_at DATETIME,
  
  FOREIGN KEY (delivery_request_id) REFERENCES delivery_requests(id),
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (traveler_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_payments_request ON payments(delivery_request_id);
CREATE INDEX IF NOT EXISTS idx_payments_sender ON payments(sender_id);
CREATE INDEX IF NOT EXISTS idx_payments_traveler ON payments(traveler_id);
CREATE INDEX IF NOT EXISTS idx_payments_escrow ON payments(escrow_status);

-- REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  delivery_request_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  reviewee_id TEXT NOT NULL,
  
  -- Rating
  rating INTEGER CHECK(rating BETWEEN 1 AND 5) NOT NULL,
  review_text TEXT,
  
  -- Type
  review_type TEXT CHECK(review_type IN ('sender_to_traveler', 'traveler_to_sender')) NOT NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (delivery_request_id) REFERENCES delivery_requests(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (reviewee_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_request ON reviews(delivery_request_id);

-- DISPUTES TABLE
CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  delivery_request_id TEXT NOT NULL,
  filed_by_user_id TEXT NOT NULL,
  against_user_id TEXT NOT NULL,
  
  -- Dispute Details
  reason TEXT CHECK(reason IN ('no_delivery', 'no_pickup', 'damaged_documents', 'incorrect_documents', 'no_show_sender', 'no_show_receiver')) NOT NULL,
  description TEXT NOT NULL,
  evidence_urls TEXT,
  
  -- Resolution
  status TEXT CHECK(status IN ('open', 'under_review', 'resolved')) DEFAULT 'open',
  resolution TEXT CHECK(resolution IN ('refund_sender', 'pay_traveler', 'split_50_50', 'no_fault')),
  resolution_notes TEXT,
  resolved_by_admin_id TEXT,
  resolved_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (delivery_request_id) REFERENCES delivery_requests(id),
  FOREIGN KEY (filed_by_user_id) REFERENCES users(id),
  FOREIGN KEY (against_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_disputes_request ON disputes(delivery_request_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);

-- CHAT_MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  delivery_request_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  
  message_text TEXT NOT NULL,
  read_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (delivery_request_id) REFERENCES delivery_requests(id),
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_chat_request ON chat_messages(delivery_request_id);
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_receiver ON chat_messages(receiver_id);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  
  -- Related Entities
  related_request_id TEXT,
  related_trip_id TEXT,
  
  -- Delivery
  sent_via TEXT,
  sent_at DATETIME,
  read_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read_at);
