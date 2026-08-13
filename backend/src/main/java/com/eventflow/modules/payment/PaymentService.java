package com.eventflow.modules.payment;

import com.eventflow.modules.payment.dto.InitiatePaymentRequest;
import com.eventflow.modules.payment.dto.PaymentInitResponse;
import com.eventflow.modules.payment.dto.PaymentResponse;
import com.eventflow.security.UserPrincipal;

import java.util.UUID;

public interface PaymentService {
    PaymentInitResponse initiate(UserPrincipal principal, InitiatePaymentRequest request);

    PaymentResponse detail(UserPrincipal principal, UUID paymentId);
}

