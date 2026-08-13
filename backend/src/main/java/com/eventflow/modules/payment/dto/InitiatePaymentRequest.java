package com.eventflow.modules.payment.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InitiatePaymentRequest(
        @NotNull UUID bookingId
) {
}

