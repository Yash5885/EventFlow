package com.eventflow.modules.notification;

import com.eventflow.modules.ticket.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class KafkaConsumerService {

    private final TicketService ticketService;
    private final EmailService emailService;

    @KafkaListener(topics = "${app.kafka.booking-topic:booking.confirmed}", groupId = "${spring.kafka.consumer.group-id}", autoStartup = "${app.kafka.enabled:true}")
    public void bookingConfirmed(BookingConfirmedEvent event) {
        ticketService.generateTicketsForBooking(event);
        emailService.sendTickets(event.bookingId());
    }
}
