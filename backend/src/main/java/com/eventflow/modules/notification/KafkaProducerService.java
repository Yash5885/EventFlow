package com.eventflow.modules.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class KafkaProducerService {

    private final KafkaTemplate<Object, Object> kafkaTemplate;

    @Value("${app.kafka.booking-topic:booking.confirmed}")
    private String bookingTopic;

    @Value("${app.kafka.enabled:true}")
    private boolean enabled;

    public void publishBookingConfirmed(BookingConfirmedEvent event) {
        if (!enabled) return;
        kafkaTemplate.send(bookingTopic, event.bookingId().toString(), event);
    }
}
