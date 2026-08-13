package com.eventflow.modules.payment.dto;

import com.eventflow.common.enums.PaymentStatus;
import com.eventflow.modules.payment.Payment;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID bookingId,
        String gateway,
        BigDecimal amount,
        PaymentStatus status,
        LocalDateTime paidAt,
        BigDecimal refundAmount,
        LocalDateTime refundedAt
) {
    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getBooking().getId(),
                payment.getGateway(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getPaidAt(),
                payment.getRefundAmount(),
                payment.getRefundedAt()
        );
    }
}

