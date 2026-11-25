package com.eventflow.modules.ticket.dto;

import java.time.LocalDateTime;

public record TicketVerifyResponse(
        String ticketCode,
        String eventTitle,
        String seatInfo,
        String holderName,
        boolean isValid,
        boolean isUsed,
        LocalDateTime usedAt,
        String message,
        String result
) {
}
