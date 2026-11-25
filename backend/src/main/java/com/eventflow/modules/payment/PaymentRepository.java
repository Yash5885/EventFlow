package com.eventflow.modules.payment;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findTopByBooking_IdOrderByCreatedAtDesc(UUID bookingId);

    Optional<Payment> findTopByBooking_IdAndStatusOrderByCreatedAtDesc(UUID id, com.eventflow.common.enums.PaymentStatus status);
    Optional<Payment> findByGatewayOrderId(String gatewayOrderId);
}
