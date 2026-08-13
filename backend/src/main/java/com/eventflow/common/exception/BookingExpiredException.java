package com.eventflow.common.exception;

import org.springframework.http.HttpStatus;

public class BookingExpiredException extends AppException {
    public BookingExpiredException(String message) {
        super(HttpStatus.GONE, "BOOKING_EXPIRED", message);
    }
}

