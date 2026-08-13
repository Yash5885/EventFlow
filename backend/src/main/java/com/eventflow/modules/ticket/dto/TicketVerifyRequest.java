package com.eventflow.modules.ticket.dto;

import jakarta.validation.constraints.NotBlank;

public record TicketVerifyRequest(
        @NotBlank String ticketCode
) {
}

