CREATE TYPE payment_status AS ENUM ('INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    gateway VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
    gateway_order_id VARCHAR(255),
    gateway_payment_id VARCHAR(255),
    gateway_signature VARCHAR(500),
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status payment_status NOT NULL DEFAULT 'INITIATED',
    failure_reason VARCHAR(500),
    refund_amount NUMERIC(10, 2),
    refunded_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_gateway_order_id ON payments(gateway_order_id);

