package com.eventflow.common.exception;

import org.springframework.http.HttpStatus;

public class PaymentVerificationException extends AppException {
    public PaymentVerificationException(String message) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, "PAYMENT_VERIFICATION_FAILED", message);
    }
}

