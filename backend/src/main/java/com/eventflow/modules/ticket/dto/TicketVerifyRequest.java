package com.eventflow.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record TicketVerifyRequest(
        @NotNull UUID eventId,
        @NotBlank @Size(max = 50) String ticketCode
) {
}
