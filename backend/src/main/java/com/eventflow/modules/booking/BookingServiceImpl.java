package com.eventflow.modules.booking;

import com.eventflow.common.PageResponse;
import com.eventflow.common.enums.BookingStatus;
import com.eventflow.common.enums.EventStatus;
import com.eventflow.common.enums.PaymentStatus;
import com.eventflow.common.enums.SeatStatus;
import com.eventflow.common.enums.UserRole;
import com.eventflow.common.exception.AppException;
import com.eventflow.common.exception.BookingExpiredException;
import com.eventflow.common.exception.PaymentVerificationException;
import com.eventflow.common.exception.ResourceNotFoundException;
import com.eventflow.common.exception.SeatAlreadyLockedException;
import com.eventflow.common.exception.SeatNotAvailableException;
import com.eventflow.common.exception.ValidationAppException;
import com.eventflow.modules.booking.dto.BookingResponse;
import com.eventflow.modules.booking.dto.ConfirmBookingRequest;
import com.eventflow.modules.booking.dto.LockSeatsRequest;
import com.eventflow.modules.booking.dto.LockStatusResponse;
import com.eventflow.modules.event.Event;
import com.eventflow.modules.event.EventRepository;
import com.eventflow.modules.event.EventSeat;
import com.eventflow.modules.event.EventSeatRepository;
import com.eventflow.modules.notification.BookingConfirmedEvent;
import com.eventflow.modules.notification.KafkaProducerService;
import com.eventflow.modules.payment.Payment;
import com.eventflow.modules.payment.PaymentRepository;
import com.eventflow.modules.payment.RazorpayGateway;
import com.eventflow.modules.ticket.TicketService;
import com.eventflow.modules.user.User;
import com.eventflow.modules.user.UserRepository;
import com.eventflow.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final int MAX_SEATS = 10;

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final EventSeatRepository eventSeatRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final SeatLockService seatLockService;
    private final KafkaProducerService kafkaProducerService;

    @Value("${app.seat-lock.ttl-minutes}")
    private long lockTtlMinutes;

    private final RazorpayGateway gateway;
    private final TicketService ticketService;
    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Override
    @Transactional
    public BookingResponse lockSeats(UserPrincipal principal, LockSeatsRequest request) {
        if (request.eventSeatIds().size() > MAX_SEATS) {
            throw new ValidationAppException("MAX_SEATS_EXCEEDED", "A booking can include at most 10 seats");
        }

        Event event = eventRepository.findById(request.eventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new ValidationAppException("EVENT_NOT_PUBLISHED", "Only published events can be booked");
        }

        User user = userRepository.findById(principal.id())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UUID lockToken = UUID.randomUUID();
        List<UUID> acquired = new ArrayList<>();
        List<EventSeat> seats = new ArrayList<>();

        try {
            for (UUID eventSeatId : request.eventSeatIds()) {
                EventSeat eventSeat = eventSeatRepository.findByIdAndEvent_Id(eventSeatId, event.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Event seat not found"));
                if (eventSeat.getStatus() != SeatStatus.AVAILABLE) {
                    throw new SeatNotAvailableException("Seat is not available");
                }
                if (!seatLockService.acquireLock(event.getId(), eventSeatId, lockToken)) {
                    throw new SeatAlreadyLockedException("Seat is already locked by another user");
                }
                acquired.add(eventSeatId);
                seats.add(eventSeat);
            }

            BigDecimal total = seats.stream()
                    .map(EventSeat::getPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            Booking booking = Booking.builder()
                    .user(user)
                    .lockToken(lockToken)
                    .event(event)
                    .status(BookingStatus.PENDING)
                    .totalAmount(total)
                    .platformFee(BigDecimal.ZERO)
                    .discountAmount(BigDecimal.ZERO)
                    .expiresAt(LocalDateTime.now().plusMinutes(lockTtlMinutes))
                    .build();
            seats.forEach(eventSeat -> booking.addItem(BookingItem.builder()
                    .eventSeat(eventSeat)
                    .priceAtBooking(eventSeat.getPrice())
                    .build()));
            return BookingResponse.from(bookingRepository.save(booking));
        } catch (RuntimeException exception) {
            acquired.forEach(eventSeatId -> seatLockService.releaseLock(event.getId(), eventSeatId, lockToken));
            throw exception;
        }
    }

    @Override
    @Transactional
    public BookingResponse confirm(UserPrincipal principal, UUID bookingId, ConfirmBookingRequest request) {
        Booking booking = findBooking(bookingId);
        assertOwnerOrAdmin(principal, booking);
        Payment payment = paymentRepository.findByGatewayOrderId(request.paymentGatewayOrderId())
                .filter(candidate -> candidate.getBooking().getId().equals(bookingId))
                .orElseThrow(() -> new ResourceNotFoundException("Payment order not found"));
        gateway.verifyCheckoutSignature(payment, request.paymentGatewayPaymentId(), request.paymentGatewaySignature());
        gateway.verifyCaptured(payment, request.paymentGatewayPaymentId());
        return settleCapture(bookingId, request.paymentGatewayOrderId(), request.paymentGatewayPaymentId());
    }

    @Override
    @Transactional
    public BookingResponse settleCapture(UUID bookingId, String orderId, String paymentId) {
        Booking booking = bookingRepository.lockById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        entityManager.refresh(booking);
        Payment payment = paymentRepository.findByGatewayOrderId(orderId)
                .filter(candidate -> candidate.getBooking().getId().equals(bookingId))
                .orElseThrow(() -> new ResourceNotFoundException("Payment order not found"));
        entityManager.refresh(payment);
        if (payment.getStatus() == PaymentStatus.SUCCESS || payment.getStatus() == PaymentStatus.REFUNDED) {
            if (!paymentId.equals(payment.getGatewayPaymentId())) {
                throw new PaymentVerificationException("The order already has a different captured payment");
            }
            return BookingResponse.from(booking);
        }

        payment.setGatewayPaymentId(paymentId);
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        if (booking.getStatus() != BookingStatus.PENDING || !booking.getExpiresAt().isAfter(LocalDateTime.now())
                || booking.getEvent().getStatus() != EventStatus.PUBLISHED) {
            return capturedWithoutSeats(booking, payment);
        }

        List<EventSeat> lockedSeats = new ArrayList<>();
        for (UUID seatId : booking.getItems().stream().map(item -> item.getEventSeat().getId()).sorted().toList()) {
            EventSeat seat = eventSeatRepository.lockById(seatId)
                    .orElseThrow(() -> new ResourceNotFoundException("Event seat not found"));
            if (seat.getStatus() != SeatStatus.AVAILABLE ||
                    !seatLockService.isLockedByUser(booking.getEvent().getId(), seatId, booking.activeLockToken())) {
                return capturedWithoutSeats(booking, payment);
            }
            lockedSeats.add(seat);
        }
        lockedSeats.forEach(seat -> seat.setStatus(SeatStatus.BOOKED));
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setBookedAt(LocalDateTime.now());
        var confirmed = toBookingConfirmedEvent(booking);
        ticketService.generateTicketsForBooking(confirmed);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                try {
                    releaseLocks(booking);
                } finally {
                    kafkaProducerService.publishBookingConfirmed(confirmed);
                }
            }
        });
        return BookingResponse.from(booking);
    }

    private BookingResponse capturedWithoutSeats(Booking booking, Payment payment) {
        payment.setFailureReason("Payment captured after the reservation became unavailable");
        if (booking.getStatus() == BookingStatus.PENDING) {
            booking.setStatus(BookingStatus.EXPIRED);
        }
        return BookingResponse.from(booking);
    }

    private void releaseLocks(Booking booking) {
        seatLockService.releaseAllLocksForBooking(booking.activeLockToken(),
                booking.getItems().stream().map(item -> item.getEventSeat().getId()).toList(), booking.getEvent().getId());
    }

    @Override
    @Transactional
    public void release(UserPrincipal principal, UUID bookingId) {
        Booking booking = bookingRepository.lockById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        assertOwnerOrAdmin(principal, booking);
        if (booking.getStatus() == BookingStatus.PENDING) {
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancelledAt(LocalDateTime.now());
            booking.setCancellationReason("Released by user");
            if (booking.getLockToken() != null || booking.getExpiresAt().isAfter(LocalDateTime.now())) releaseLocks(booking);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> myBookings(UserPrincipal principal, Pageable pageable) {
        return PageResponse.from(bookingRepository.findByUser_Id(principal.id(), pageable).map(BookingResponse::from));
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse detail(UserPrincipal principal, UUID bookingId) {
        Booking booking = findBooking(bookingId);
        assertOwnerOrAdmin(principal, booking);
        return BookingResponse.from(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public LockStatusResponse lockStatus(UserPrincipal principal, UUID bookingId) {
        Booking booking = findBooking(bookingId);
        assertOwnerOrAdmin(principal, booking);
        long remaining = Math.max(0, Duration.between(LocalDateTime.now(), booking.getExpiresAt()).toSeconds());
        boolean active = booking.getStatus() == BookingStatus.PENDING && booking.getExpiresAt().isAfter(LocalDateTime.now());
        return new LockStatusResponse(booking.getId(), booking.getExpiresAt(), active ? remaining : 0, !active,
                active && booking.getLockExtendedAt() == null && !bookingRepository.isWaitlistHold(bookingId));
    }

    @Override
    @Transactional
    public LockStatusResponse extendLock(UserPrincipal principal, UUID bookingId) {
        Booking booking = bookingRepository.lockById(bookingId).orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        assertOwnerOrAdmin(principal, booking);
        var now = LocalDateTime.now();
        if (booking.getStatus() != BookingStatus.PENDING || !booking.getExpiresAt().isAfter(now)) {
            throw new BookingExpiredException("Seat hold has expired");
        }
        if (booking.getLockExtendedAt() != null || bookingRepository.isWaitlistHold(bookingId)) {
            throw new AppException(HttpStatus.CONFLICT, "HOLD_FIXED", "This hold cannot be extended");
        }
        var seatIds = booking.getItems().stream().map(item -> item.getEventSeat().getId()).toList();
        if (!seatLockService.extendBookingLocks(booking.getEvent().getId(), seatIds, booking.activeLockToken())) {
            throw new BookingExpiredException("Seat hold has expired");
        }
        booking.setLockExtendedAt(now);
        booking.setExpiresAt(now.plusMinutes(lockTtlMinutes));
        return lockStatus(principal, bookingId);
    }

    private Booking findBooking(UUID bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
    }

    private void assertOwnerOrAdmin(UserPrincipal principal, Booking booking) {
        boolean admin = principal.role() == UserRole.ADMIN;
        boolean owner = booking.getUser().getId().equals(principal.id());
        if (!admin && !owner) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You cannot access this booking");
        }
    }

    private BookingConfirmedEvent toBookingConfirmedEvent(Booking booking) {
        return new BookingConfirmedEvent(
                booking.getId(),
                booking.getUser().getId(),
                booking.getEvent().getId(),
                booking.getItems().stream()
                        .map(item -> new BookingConfirmedEvent.SeatPayload(
                                item.getEventSeat().getId(),
                                item.getEventSeat().getSeat().getRowLabel(),
                                item.getEventSeat().getSeat().getSeatNumber(),
                                item.getPriceAtBooking()
                        ))
                        .toList(),
                booking.getUser().getEmail(),
                booking.getUser().getName(),
                booking.getEvent().getTitle(),
                booking.getEvent().getEventDate(),
                booking.getEvent().getVenue().getName()
        );
    }
}
