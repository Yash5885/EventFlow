package com.eventflow.common.exception;

import org.springframework.http.HttpStatus;

public class SeatNotAvailableException extends AppException {
    public SeatNotAvailableException(String message) {
        super(HttpStatus.CONFLICT, "SEAT_NOT_AVAILABLE", message);
    }
}

