package com.eventflow.modules.ticket;

import com.eventflow.common.ApiResponse;
import com.eventflow.common.PageResponse;
import com.eventflow.modules.ticket.dto.TicketResponse;
import com.eventflow.modules.ticket.dto.TicketVerifyRequest;
import com.eventflow.modules.ticket.dto.TicketVerifyResponse;
import com.eventflow.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping("/booking/{bookingId}")
    public ApiResponse<List<TicketResponse>> byBooking(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID bookingId) {
        return ApiResponse.ok(ticketService.byBooking(principal, bookingId));
    }

    @GetMapping("/{id}/download")
    public RedirectView download(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return new RedirectView(ticketService.downloadUrl(principal, id));
    }

    @PostMapping("/verify")
    public ApiResponse<TicketVerifyResponse> verify(@Valid @RequestBody TicketVerifyRequest request) {
        return ApiResponse.ok(ticketService.verify(request.ticketCode()));
    }

    @GetMapping("/my")
    public ApiResponse<PageResponse<TicketResponse>> myTickets(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return ApiResponse.ok(ticketService.myTickets(principal, pageable));
    }
}

