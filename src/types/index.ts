// Type definitions for SafiriDocs

export type Bindings = {
  DB?: D1Database;
  FLUTTERWAVE_SECRET_KEY?: string;
  JWT_SECRET?: string;
}

export type Variables = {
  user?: User;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  role: 'sender' | 'traveler' | 'both';
  verification_status: 'pending' | 'approved' | 'rejected';
  trust_score: number;
  account_status: 'active' | 'suspended' | 'banned';
}

export interface Trip {
  id: string;
  traveler_id: string;
  departure_city: string;
  destination_city: string;
  departure_date: string;
  arrival_date: string;
  flight_number?: string;
  airline?: string;
  max_documents: number;
  available_slots: number;
  status: 'active' | 'in_progress' | 'completed' | 'cancelled';
}

export interface DeliveryRequest {
  id: string;
  sender_id: string;
  departure_city: string;
  destination_city: string;
  pickup_address: string;
  delivery_address: string;
  document_description: string;
  document_type?: string;
  offered_amount: number;
  urgency: 'within_3_days' | 'within_7_days' | 'flexible';
  status: 'open' | 'matched' | 'picked_up' | 'in_transit' | 'delivered' | 'disputed' | 'cancelled';
  tracking_code?: string;
  matched_traveler_id?: string;
  matched_trip_id?: string;
}

export interface Payment {
  id: string;
  delivery_request_id: string;
  sender_id: string;
  traveler_id: string;
  total_amount: number;
  platform_fee: number;
  traveler_payout: number;
  payment_method: 'mpesa' | 'card' | 'bank_transfer';
  escrow_status: 'pending' | 'held' | 'released' | 'refunded' | 'disputed';
  flutterwave_tx_ref?: string;
}

export interface Review {
  id: string;
  delivery_request_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  review_text?: string;
  review_type: 'sender_to_traveler' | 'traveler_to_sender';
}

export interface ChatMessage {
  id: string;
  delivery_request_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  read_at?: string;
}
