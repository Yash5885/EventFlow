package com.eventflow.common;

import java.time.LocalDateTime;
import java.util.Map;

public record ErrorResponse(
        boolean success,
        String message,
        String errorCode,
        Map<String, String> errors,
        LocalDateTime timestamp
) {
    public static ErrorResponse of(String message, String errorCode) {
        return new ErrorResponse(false, message, errorCode, Map.of(), LocalDateTime.now());
    }

    public static ErrorResponse of(String message, String errorCode, Map<String, String> errors) {
        return new ErrorResponse(false, message, errorCode, errors, LocalDateTime.now());
    }
}

