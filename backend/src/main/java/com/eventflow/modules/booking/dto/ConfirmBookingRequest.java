package com.eventflow.modules.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmBookingRequest(
        @NotBlank String paymentGatewayOrderId,
        @NotBlank String paymentGatewayPaymentId,
        @NotBlank String paymentGatewaySignature
) {
}

