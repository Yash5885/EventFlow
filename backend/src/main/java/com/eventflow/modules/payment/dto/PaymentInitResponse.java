package com.eventflow.modules.payment.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PaymentInitResponse(
        UUID paymentId,
        String gatewayOrderId,
        BigDecimal amount,
        String currency,
        String gatewayKey
) {
}

