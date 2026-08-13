CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    event_seat_id UUID NOT NULL REFERENCES event_seats(id) ON DELETE RESTRICT,
    ticket_code VARCHAR(50) NOT NULL UNIQUE,
    qr_code_url VARCHAR(500),
    pdf_url VARCHAR(500),
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(booking_id, event_seat_id)
);

CREATE INDEX idx_tickets_booking_id ON tickets(booking_id);
CREATE INDEX idx_tickets_ticket_code ON tickets(ticket_code);

