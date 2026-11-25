package com.eventflow.modules.payment;

import com.eventflow.common.enums.BookingStatus;
import com.eventflow.common.enums.PaymentStatus;
import com.eventflow.modules.booking.BookingService;
import com.eventflow.modules.booking.dto.BookingResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    private final RazorpayGateway gateway;
    private final BookingService bookings;
    private final ObjectMapper mapper;
    private final com.eventflow.modules.refund.RefundService refunds;

    public Map<String, Boolean> config() {
        return Map.of("enabled", gateway.configured(), "demo", gateway.demo());
    }

    @Override
    @Transactional
    public PaymentInitResponse initiate(UserPrincipal principal, InitiatePaymentRequest request) {
        Booking booking = bookingRepository.lockById(request.bookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        assertOwnerOrAdmin(principal, booking);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new AppException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Only pending bookings can be paid");
        }
        if (booking.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BookingExpiredException("Booking has expired");
        }

        String provider = gateway.demo() ? RazorpayGateway.DEMO_GATEWAY : "RAZORPAY";
        Payment saved = paymentRepository.findTopByBooking_IdOrderByCreatedAtDesc(booking.getId())
                .filter(payment -> payment.getStatus() == PaymentStatus.INITIATED && provider.equals(payment.getGateway())
                        && (gateway.demo() || !payment.getGatewayOrderId().matches("order_[0-9a-f]{32}")))
                .orElseGet(() -> {
                    var amount = booking.amountDue();
                    if (amount.signum() <= 0 && !gateway.demo()) {
                        throw new AppException(HttpStatus.BAD_REQUEST, "PAYMENT_AMOUNT", "A positive order amount is required");
                    }
                    return paymentRepository.save(Payment.builder().booking(booking).gateway(provider)
                            .amount(amount).gatewayOrderId(gateway.createOrder(booking.getId(), amount, "INR")).build());
                });
        return new PaymentInitResponse(saved.getId(), saved.getGatewayOrderId(), saved.getAmount(), saved.getCurrency(), gateway.keyId(), gateway.demo());
    }

    @Transactional
    public BookingResponse completeDemo(UserPrincipal principal, UUID paymentId) {
        if (!gateway.demo()) throw new ResourceNotFoundException("Payment route not found");
        Payment payment = paymentRepository.findById(paymentId)
                .filter(candidate -> RazorpayGateway.DEMO_GATEWAY.equals(candidate.getGateway()))
                .orElseThrow(() -> new ResourceNotFoundException("Test payment not found"));
        assertOwnerOrAdmin(principal, payment.getBooking());
        return bookings.settleCapture(payment.getBooking().getId(), payment.getGatewayOrderId(), "demo_" + paymentId);
    }

    @Transactional
    public void webhook(byte[] body, String signature) {
        if (!gateway.verifyWebhook(body, signature)) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "INVALID_WEBHOOK", "Invalid webhook signature");
        }
        try {
            var event = mapper.readTree(body);
            String type = event.path("event").asText();
            if ("refund.processed".equals(type)) {
                var refund = event.path("payload").path("refund").path("entity");
                if ("processed".equals(refund.path("status").asText())) {
                    refunds.acceptProcessedRefund(refund.path("payment_id").asText(), refund.path("amount").asLong(-1), refund.path("id").asText());
                }
                return;
            }
            if (!"payment.captured".equals(type)) return;
            var entity = event.path("payload").path("payment").path("entity");
            String paymentId = entity.path("id").asText();
            paymentRepository.findByGatewayOrderId(entity.path("order_id").asText())
                    .filter(payment -> "RAZORPAY".equals(payment.getGateway()) && paymentId.matches("pay_[A-Za-z0-9]+")
                            && gateway.matchesCapture(payment, entity))
                    .ifPresent(payment -> bookings.settleCapture(payment.getBooking().getId(), payment.getGatewayOrderId(), paymentId));
        } catch (IOException exception) {
            throw new AppException(HttpStatus.BAD_REQUEST, "INVALID_WEBHOOK", "Malformed webhook");
        }
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
