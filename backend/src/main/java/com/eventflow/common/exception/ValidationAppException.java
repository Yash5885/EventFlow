package com.eventflow.common.exception;

import org.springframework.http.HttpStatus;

public class ValidationAppException extends AppException {
    public ValidationAppException(String errorCode, String message) {
        super(HttpStatus.BAD_REQUEST, errorCode, message);
    }
}

