-- Test data for SafiriDocs

-- Insert test users (password is 'password123' - SHA-256 hashed)
INSERT OR IGNORE INTO users (id, email, phone, password_hash, full_name, role, verification_status, trust_score) VALUES 
  ('user-1', 'alice@example.com', '+254712345678', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Alice Wanjiru', 'sender', 'approved', 60),
  ('user-2', 'bob@example.com', '+254723456789', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Bob Omondi', 'traveler', 'approved', 75),
  ('user-3', 'carol@example.com', '+254734567890', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Carol Muthoni', 'both', 'approved', 85),
  ('admin-1', 'admin@safiridocs.com', '+254700000000', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Admin User', 'both', 'approved', 100);

-- Insert test trips
INSERT OR IGNORE INTO trips (id, traveler_id, departure_city, destination_city, departure_date, arrival_date, flight_number, airline, status) VALUES 
  ('trip-1', 'user-2', 'Nairobi', 'Dubai', '2026-01-15', '2026-01-15', 'KQ310', 'Kenya Airways', 'active'),
  ('trip-2', 'user-3', 'Nairobi', 'Dubai', '2026-01-20', '2026-01-20', 'EK721', 'Emirates', 'active');

-- Insert test delivery requests
INSERT OR IGNORE INTO delivery_requests (id, sender_id, departure_city, destination_city, pickup_address, delivery_address, document_description, document_type, offered_amount, status) VALUES 
  ('req-1', 'user-1', 'Nairobi', 'Dubai', 'JKIA Terminal 1A', 'Dubai Marina, Address Tower', 'Visa application documents for UAE', 'legal', 25.00, 'open'),
  ('req-2', 'user-3', 'Nairobi', 'Dubai', 'Westlands, ABC Place', 'Business Bay, Bay Square', 'Business contract - 3 copies', 'contract', 30.00, 'open');
