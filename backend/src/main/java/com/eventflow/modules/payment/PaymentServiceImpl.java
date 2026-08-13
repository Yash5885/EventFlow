package com.eventflow.modules.payment;

import com.eventflow.common.enums.BookingStatus;
import com.eventflow.common.enums.UserRole;
import com.eventflow.common.exception.AppException;
import com.eventflow.common.exception.BookingExpiredException;
import com.eventflow.common.exception.ResourceNotFoundException;
import com.eventflow.modules.booking.Booking;
import com.eventflow.modules.booking.BookingRepository;
import com.eventflow.modules.payment.dto.InitiatePaymentRequest;
import com.eventflow.modules.payment.dto.PaymentInitResponse;
import com.eventflow.modules.payment.dto.PaymentResponse;
import com.eventflow.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    @Value("${app.razorpay.key-id}")
    private String razorpayKeyId;

    @Override
    @Transactional
    public PaymentInitResponse initiate(UserPrincipal principal, InitiatePaymentRequest request) {
        Booking booking = bookingRepository.findById(request.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        assertOwnerOrAdmin(principal, booking);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Only pending bookings can be paid");
        }
        if (booking.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BookingExpiredException("Booking has expired");
        }

        Payment payment = Payment.builder()
                .booking(booking)
                .amount(booking.getTotalAmount().add(booking.getPlatformFee()).subtract(booking.getDiscountAmount()))
                .gatewayOrderId("order_" + UUID.randomUUID().toString().replace("-", ""))
                .currency("INR")
                .build();
        Payment saved = paymentRepository.save(payment);
        return new PaymentInitResponse(saved.getId(), saved.getGatewayOrderId(), saved.getAmount(), saved.getCurrency(), razorpayKeyId);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse detail(UserPrincipal principal, UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        assertOwnerOrAdmin(principal, payment.getBooking());
        return PaymentResponse.from(payment);
    }

    private void assertOwnerOrAdmin(UserPrincipal principal, Booking booking) {
        boolean admin = principal.role() == UserRole.ADMIN;
        boolean owner = booking.getUser().getId().equals(principal.id());
        if (!admin && !owner) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You cannot access this payment");
        }
    }
}

