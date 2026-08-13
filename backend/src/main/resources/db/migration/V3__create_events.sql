CREATE TYPE event_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'CANCELLED', 'COMPLETED');

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE RESTRICT,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    banner_url VARCHAR(500),
    event_date TIMESTAMP NOT NULL,
    doors_open_time TIMESTAMP,
    end_time TIMESTAMP,
    status event_status NOT NULL DEFAULT 'DRAFT',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    admin_note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'LOCKED', 'BOOKED', 'BLOCKED');

CREATE TABLE event_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    status seat_status NOT NULL DEFAULT 'AVAILABLE',
    UNIQUE(event_id, seat_id)
);

CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_event_seats_event_id ON event_seats(event_id);
CREATE INDEX idx_event_seats_status ON event_seats(status);

