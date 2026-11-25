package com.eventflow.modules.ticket;

import com.eventflow.common.enums.BookingStatus;
import com.eventflow.common.enums.EventStatus;
import com.eventflow.common.enums.UserRole;
import com.eventflow.common.exception.AppException;
import com.eventflow.common.exception.ResourceNotFoundException;
import com.eventflow.modules.refund.RefundRepository;
import com.eventflow.modules.refund.RefundRequest;
import com.eventflow.modules.ticket.dto.TicketResponse;
import com.eventflow.modules.user.UserRepository;
import com.eventflow.security.UserPrincipal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TicketTransferService {
    public record Offer(String token, LocalDateTime expiresAt) { }
    public record Claim(@NotBlank @Size(max = 80) String token) { }

    private final TicketRepository tickets;
    private final UserRepository users;
    private final RefundRepository refunds;

    @Transactional
    public Offer offer(UserPrincipal principal, UUID ticketId) {
        Ticket ticket = tickets.lockById(ticketId).orElseThrow(() -> new ResourceNotFoundException("Ticket not found"));
        if (principal.role() != UserRole.CUSTOMER || !ticket.currentHolder().getId().equals(principal.id())) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only the current holder can transfer this ticket");
        }
        requireEligible(ticket);
        String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        var expiresAt = LocalDateTime.now().plusHours(24);
        if (ticket.getBooking().getEvent().getEventDate().isBefore(expiresAt)) expiresAt = ticket.getBooking().getEvent().getEventDate();
        ticket.setTransferHash(hash(token));
        ticket.setTransferExpiresAt(expiresAt);
        return new Offer(token, expiresAt);
    }

    @Transactional
    public TicketResponse claim(UserPrincipal principal, String token) {
        if (principal.role() != UserRole.CUSTOMER) throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Use a customer account to claim a ticket");
        var ticket = tickets.lockByTransferHash(hash(token))
                .filter(candidate -> candidate.getTransferExpiresAt() != null && candidate.getTransferExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new ResourceNotFoundException("Transfer link is invalid or expired"));
        if (ticket.currentHolder().getId().equals(principal.id())) {
            throw new AppException(HttpStatus.CONFLICT, "ALREADY_OWNED", "Share the transfer link with the recipient");
        }
        requireEligible(ticket);
        ticket.setHolder(users.findById(principal.id()).orElseThrow());
        ticket.setTicketCode("EF-" + UUID.randomUUID().toString().replace("-", "").toUpperCase(java.util.Locale.ROOT));
        ticket.setTransferHash(null);
        ticket.setTransferExpiresAt(null);
        return TicketResponse.from(ticket);
    }

    private void requireEligible(Ticket ticket) {
        var booking = ticket.getBooking();
        if (Boolean.TRUE.equals(ticket.getUsed()) || booking.getStatus() != BookingStatus.CONFIRMED
                || booking.getEvent().getStatus() != EventStatus.PUBLISHED || !booking.getEvent().getEventDate().isAfter(LocalDateTime.now())
                || refunds.existsByBooking_IdAndStatusIn(booking.getId(), List.of(RefundRequest.Status.APPROVED))) {
            throw new AppException(HttpStatus.CONFLICT, "TICKET_INELIGIBLE", "Ticket is ineligible for transfer");
        }
    }

    private String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
