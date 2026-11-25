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
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final TicketTransferService transfers;

    @GetMapping("/booking/{bookingId}")
    public ApiResponse<List<TicketResponse>> byBooking(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID bookingId) {
        return ApiResponse.ok(ticketService.byBooking(principal, bookingId));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_PDF).cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("eventflow-" + id + ".pdf").build().toString())
                .body(ticketService.download(principal, id));
    }

    @GetMapping("/gate/events")
    public ApiResponse<List<com.eventflow.modules.event.dto.EventSummaryResponse>> gateEvents(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(ticketService.gateEvents(principal));
    }

    @GetMapping("/gate/events/{id}")
    public ApiResponse<TicketService.Attendance> attendance(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ApiResponse.ok(ticketService.attendance(principal, id));
    }

    @PostMapping("/verify")
    public ApiResponse<TicketVerifyResponse> verify(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody TicketVerifyRequest request) {
        return ApiResponse.ok(ticketService.verify(principal, request.eventId(), request.ticketCode()));
    }

    @PostMapping("/{id}/transfer")
    public ApiResponse<TicketTransferService.Offer> offer(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ApiResponse.ok(transfers.offer(principal, id));
    }

    @PostMapping("/claim")
    public ApiResponse<TicketResponse> claim(@AuthenticationPrincipal UserPrincipal principal,
                                             @Valid @RequestBody TicketTransferService.Claim request) {
        return ApiResponse.ok(transfers.claim(principal, request.token()));
    }

    @GetMapping("/my")
    public ApiResponse<PageResponse<TicketResponse>> myTickets(@AuthenticationPrincipal UserPrincipal principal, Pageable pageable) {
        return ApiResponse.ok(ticketService.myTickets(principal, pageable));
    }
}
