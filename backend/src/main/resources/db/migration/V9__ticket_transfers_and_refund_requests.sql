ALTER TABLE tickets ADD COLUMN holder_id UUID REFERENCES users(id);
ALTER TABLE tickets ADD COLUMN transfer_hash VARCHAR(64);
ALTER TABLE tickets ADD COLUMN transfer_expires_at TIMESTAMP;
CREATE UNIQUE INDEX tickets_transfer_hash ON tickets(transfer_hash) WHERE transfer_hash IS NOT NULL;
CREATE INDEX tickets_holder ON tickets(holder_id) WHERE holder_id IS NOT NULL;

CREATE TABLE refund_requests (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id),
    payment_id UUID NOT NULL REFERENCES payments(id),
    reason VARCHAR(500) NOT NULL,
    note VARCHAR(500),
    status VARCHAR(20) NOT NULL CHECK (status IN ('REQUESTED','APPROVED','REJECTED','PROCESSED')),
    requested_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    gateway_refund_id VARCHAR(255) UNIQUE
);
CREATE UNIQUE INDEX refund_one_open ON refund_requests(booking_id)
    WHERE status IN ('REQUESTED','APPROVED','PROCESSED');
