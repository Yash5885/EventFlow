package com.eventflow.modules.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationService {

    public void bookingConfirmed(BookingConfirmedEvent event) {
        log.info("Booking confirmation notification queued for {}", event.userEmail());
    }
}

