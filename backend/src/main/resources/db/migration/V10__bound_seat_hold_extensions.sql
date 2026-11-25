ALTER TABLE bookings ADD COLUMN lock_extended_at TIMESTAMP;
CREATE INDEX event_waitlist_offered_booking ON event_waitlist(booking_id) WHERE booking_id IS NOT NULL;
