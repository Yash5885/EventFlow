CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10),
    total_capacity INT NOT NULL CHECK (total_capacity > 0),
    description TEXT,
    image_url VARCHAR(500),
    layout_config JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TYPE seat_type AS ENUM ('GENERAL', 'PREMIUM', 'VIP', 'WHEELCHAIR');

CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    row_label VARCHAR(5) NOT NULL,
    seat_number INT NOT NULL,
    seat_type seat_type NOT NULL DEFAULT 'GENERAL',
    x_position INT,
    y_position INT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(venue_id, row_label, seat_number)
);

CREATE INDEX idx_seats_venue_id ON seats(venue_id);

