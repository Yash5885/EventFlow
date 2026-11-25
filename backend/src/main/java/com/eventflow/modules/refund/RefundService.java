package com.eventflow.modules.refund;

import com.eventflow.common.enums.BookingStatus;
import com.eventflow.common.enums.EventStatus;
import com.eventflow.common.enums.PaymentStatus;
import com.eventflow.common.enums.SeatStatus;
import com.eventflow.common.exception.AppException;
import com.eventflow.common.exception.ResourceNotFoundException;
import com.eventflow.modules.booking.Booking;
import com.eventflow.modules.booking.BookingRepository;
import com.eventflow.modules.payment.PaymentRepository;
import com.eventflow.modules.payment.RazorpayGateway;
import com.eventflow.modules.ticket.TicketRepository;
import com.eventflow.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefundService {
    public record View(UUID id, UUID bookingId, String eventTitle, BigDecimal amount, RefundRequest.Status status,
                       String reason, String note, LocalDateTime requestedAt, LocalDateTime updatedAt, String paymentReference) { }

    private final RefundRepository requests;
    private final BookingRepository bookings;
    private final PaymentRepository payments;
    private final TicketRepository tickets;
    private final RazorpayGateway gateway;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Transactional(readOnly = true)
    public List<View> history(UserPrincipal principal) {
        return requests.findByBooking_User_IdOrderByRequestedAtDesc(principal.id(), PageRequest.of(0, 100))
                .stream().map(request -> view(request, false)).toList();
    }

    @Transactional(readOnly = true)
    public List<View> queue() {
        return requests.findByStatusInOrderByRequestedAtAsc(List.of(RefundRequest.Status.REQUESTED, RefundRequest.Status.APPROVED),
                PageRequest.of(0, 100)).stream().map(request -> view(request, true)).toList();
    }

    @Transactional
    public View request(UserPrincipal principal, UUID bookingId, String reason) {
        var booking = lockBooking(bookingId);
        if (!booking.getUser().getId().equals(principal.id())) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Only the purchaser can request a refund");
        }
        var payment = payments.findTopByBooking_IdAndStatusOrderByCreatedAtDesc(bookingId, PaymentStatus.SUCCESS)
                .orElseThrow(() -> conflict("This reservation has no captured payment"));
        if (requests.existsByBooking_IdAndStatusIn(bookingId, List.of(RefundRequest.Status.REQUESTED, RefundRequest.Status.APPROVED, RefundRequest.Status.PROCESSED))) {
            throw conflict("A refund already exists for this booking");
        }
        requireEligible(booking);
        var request = new RefundRequest();
        request.setBooking(booking);
        request.setPayment(payment);
        request.setStatus(RefundRequest.Status.REQUESTED);
        request.setRequestedAt(LocalDateTime.now());
        request.setUpdatedAt(request.getRequestedAt());
        request.setReason(reason.trim());
        return view(requests.save(request), false);
    }

    @Transactional
    public View review(UUID id, boolean approve, String note) {
        var request = requests.findById(id).orElseThrow(() -> new ResourceNotFoundException("Refund request not found"));
        var booking = lockBooking(request.getBooking().getId());
        entityManager.refresh(request);
        if (request.getStatus() != RefundRequest.Status.REQUESTED) throw conflict("Refund request was already reviewed");
        if (approve) requireEligible(booking);
        request.setNote(note == null ? null : note.trim());
        request.setStatus(approve ? RefundRequest.Status.APPROVED : RefundRequest.Status.REJECTED);
        request.setUpdatedAt(LocalDateTime.now());
        if (approve && gateway.demo() && RazorpayGateway.DEMO_GATEWAY.equals(request.getPayment().getGateway())) {
            settle(request, "demo_" + id);
        }
        return view(request, true);
    }

    @Transactional
    public void acceptProcessedRefund(String paymentId, long amount, String refundId) {
        requests.findByPayment_GatewayPaymentIdAndStatus(paymentId, RefundRequest.Status.APPROVED).ifPresent(request -> {
            lockBooking(request.getBooking().getId());
            entityManager.refresh(request);
            if (request.getStatus() == RefundRequest.Status.APPROVED && refundId.startsWith("rfnd_") && request.getPayment().getAmount().movePointRight(2).longValueExact() == amount) {
                settle(request, refundId);
            }
        });
    }

    private void settle(RefundRequest request, String reference) {
        if (request.getStatus() == RefundRequest.Status.PROCESSED) return;
        Booking booking = request.getBooking();
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            booking.getItems().forEach(item -> item.getEventSeat().setStatus(SeatStatus.AVAILABLE));
        }
        booking.setStatus(BookingStatus.REFUNDED);
        var now = LocalDateTime.now();
        request.getPayment().setStatus(PaymentStatus.REFUNDED);
        request.getPayment().setRefundAmount(request.getPayment().getAmount());
        request.getPayment().setRefundedAt(now);
        request.setStatus(RefundRequest.Status.PROCESSED);
        request.setUpdatedAt(now);
        request.setGatewayRefundId(reference);
    }

    private void requireEligible(Booking booking) {
        if (booking.getStatus() == BookingStatus.REFUNDED || booking.getStatus() == BookingStatus.PENDING) throw conflict("This booking is not eligible");
        var event = booking.getEvent();
        if (booking.getStatus() == BookingStatus.CONFIRMED && event.getStatus() != EventStatus.CANCELLED
                && !event.getEventDate().isAfter(LocalDateTime.now())) throw conflict("The event has already started");
        if (tickets.lockForBooking(booking.getId()).stream().anyMatch(ticket -> Boolean.TRUE.equals(ticket.getUsed()) || ticket.getHolder() != null)) {
            throw conflict("Used or transferred tickets cannot be refunded");
        }
    }

    private Booking lockBooking(UUID id) {
        return bookings.lockById(id).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    }

    private View view(RefundRequest request, boolean staff) {
        return new View(request.getId(), request.getBooking().getId(), request.getBooking().getEvent().getTitle(), request.getPayment().getAmount(),
                request.getStatus(), request.getReason(), request.getNote(), request.getRequestedAt(), request.getUpdatedAt(),
                staff ? request.getPayment().getGatewayPaymentId() : null);
    }

    private AppException conflict(String message) {
        return new AppException(HttpStatus.CONFLICT, "REFUND_UNAVAILABLE", message);
    }
}
