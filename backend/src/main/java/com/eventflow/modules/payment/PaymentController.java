package com.eventflow.modules.payment;

import com.eventflow.common.ApiResponse;
import com.eventflow.modules.booking.dto.BookingResponse;
import org.springframework.web.bind.annotation.RequestHeader;
import com.eventflow.modules.payment.dto.InitiatePaymentRequest;
import com.eventflow.modules.payment.dto.PaymentInitResponse;
import com.eventflow.modules.payment.dto.PaymentResponse;
import com.eventflow.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentServiceImpl paymentService;

    @GetMapping("/config")
    public ApiResponse<Map<String, Boolean>> config() {
        return ApiResponse.ok(paymentService.config());
    }

    @PostMapping("/initiate")
    public ApiResponse<PaymentInitResponse> initiate(@AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody InitiatePaymentRequest request) {
        return ApiResponse.ok("Payment initiated", paymentService.initiate(principal, request));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(@RequestBody byte[] rawBody,
                                        @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        paymentService.webhook(rawBody, signature);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/complete-demo")
    public ApiResponse<BookingResponse> completeDemo(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ApiResponse.ok(paymentService.completeDemo(principal, id));
    }

    @GetMapping("/{id}")
    public ApiResponse<PaymentResponse> detail(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
        return ApiResponse.ok(paymentService.detail(principal, id));
    }
}
