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
import com.eventflow.modules.user.User;
import com.eventflow.modules.user.UserRepository;
import com.eventflow.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
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

    @Value("${app.razorpay.key-secret}")
    private String razorpaySecret;

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

        List<UUID> acquired = new ArrayList<>();
        List<EventSeat> seats = new ArrayList<>();

        try {
            for (UUID eventSeatId : request.eventSeatIds()) {
                EventSeat eventSeat = eventSeatRepository.findByIdAndEvent_Id(eventSeatId, event.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Event seat not found"));
                if (eventSeat.getStatus() != SeatStatus.AVAILABLE) {
                    throw new SeatNotAvailableException("Seat is not available");
                }
                if (!seatLockService.acquireLock(event.getId(), eventSeatId, user.getId())) {
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
            acquired.forEach(eventSeatId -> seatLockService.releaseLock(event.getId(), eventSeatId, user.getId()));
            throw exception;
        }
    }

    @Override
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public BookingResponse confirm(UserPrincipal principal, UUID bookingId, ConfirmBookingRequest request) {
        Booking booking = findBooking(bookingId);
        assertOwnerOrAdmin(principal, booking);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Only pending bookings can be confirmed");
        }
        if (booking.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BookingExpiredException("Booking has expired");
        }
        Payment payment = paymentRepository.findByGatewayOrderId(request.paymentGatewayOrderId())
                .filter(candidate -> candidate.getBooking().getId().equals(bookingId))
                .orElseThrow(() -> new ResourceNotFoundException("Payment order not found"));

        if (!verifyRazorpaySignature(request.paymentGatewayOrderId(), request.paymentGatewayPaymentId(), request.paymentGatewaySignature())) {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Signature verification failed");
            throw new PaymentVerificationException("Payment signature mismatch");
        }

        for (BookingItem item : booking.getItems()) {
            EventSeat lockedSeat = eventSeatRepository.lockById(item.getEventSeat().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Event seat not found"));
            if (lockedSeat.getStatus() != SeatStatus.AVAILABLE) {
                throw new SeatNotAvailableException("Seat is no longer available");
            }
            if (!seatLockService.isLockedByUser(booking.getEvent().getId(), lockedSeat.getId(), booking.getUser().getId())) {
                throw new BookingExpiredException("Seat lock has expired");
            }
            lockedSeat.setStatus(SeatStatus.BOOKED);
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setBookedAt(LocalDateTime.now());
        payment.setGatewayPaymentId(request.paymentGatewayPaymentId());
        payment.setGatewaySignature(request.paymentGatewaySignature());
        payment.setStatus(PaymentStatus.SUCCESS);
        payment.setPaidAt(LocalDateTime.now());
        seatLockService.releaseAllLocksForBooking(booking.getId(), booking.getItems().stream().map(item -> item.getEventSeat().getId()).toList(), booking.getEvent().getId());
        kafkaProducerService.publishBookingConfirmed(toBookingConfirmedEvent(booking));
        return BookingResponse.from(booking);
    }

    @Override
    @Transactional
    public void release(UserPrincipal principal, UUID bookingId) {
        Booking booking = findBooking(bookingId);
        assertOwnerOrAdmin(principal, booking);
        if (booking.getStatus() == BookingStatus.PENDING) {
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancelledAt(LocalDateTime.now());
            booking.setCancellationReason("Released by user");
            seatLockService.releaseAllLocksForBooking(booking.getId(), booking.getItems().stream().map(item -> item.getEventSeat().getId()).toList(), booking.getEvent().getId());
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
        return new LockStatusResponse(booking.getId(), booking.getExpiresAt(), remaining, remaining == 0);
    }

    @Override
    @Transactional
    public LockStatusResponse extendLock(UserPrincipal principal, UUID bookingId) {
        Booking booking = findBooking(bookingId);
        assertOwnerOrAdmin(principal, booking);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Only pending bookings can be extended");
        }
        for (BookingItem item : booking.getItems()) {
            UUID eventSeatId = item.getEventSeat().getId();
            if (!seatLockService.isLockedByUser(booking.getEvent().getId(), eventSeatId, principal.id())) {
                throw new BookingExpiredException("Seat lock has expired");
            }
            seatLockService.extendLock(booking.getEvent().getId(), eventSeatId, principal.id());
        }
        booking.setExpiresAt(LocalDateTime.now().plusMinutes(lockTtlMinutes));
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

    private boolean verifyRazorpaySignature(String orderId, String paymentId, String signature) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(razorpaySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String payload = orderId + "|" + paymentId;
            String expected = HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
            return expected.equals(signature);
        } catch (Exception exception) {
            throw new PaymentVerificationException("Unable to verify payment signature");
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
