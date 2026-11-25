ALTER TABLE bookings ADD COLUMN lock_token UUID;

CREATE TABLE event_waitlist (
  id UUID PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  joined_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL CHECK(status IN ('WAITING','OFFERED','CLAIMED','EXPIRED','CANCELLED')),
  booking_id UUID REFERENCES bookings(id),
  notified_at TIMESTAMP
);
CREATE UNIQUE INDEX event_waitlist_one_active ON event_waitlist(event_id, user_id)
  WHERE status IN ('WAITING','OFFERED');
CREATE INDEX event_waitlist_queue ON event_waitlist(status, joined_at);
