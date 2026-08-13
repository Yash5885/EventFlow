package com.eventflow.common.exception;

import org.springframework.http.HttpStatus;

public class SeatAlreadyLockedException extends AppException {
    public SeatAlreadyLockedException(String message) {
        super(HttpStatus.CONFLICT, "SEAT_ALREADY_LOCKED", message);
    }
}

