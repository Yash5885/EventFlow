package com.eventflow.modules.booking.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record LockStatusResponse(
        UUID bookingId,
        LocalDateTime expiresAt,
        long remainingSeconds,
        boolean isExpired
) {
}

