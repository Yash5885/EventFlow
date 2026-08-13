package com.eventflow.modules.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<Object, Object> kafkaTemplate;

    public void publishBookingConfirmed(BookingConfirmedEvent event) {
        kafkaTemplate.send("booking.confirmed", event.bookingId().toString(), event);
    }
}
