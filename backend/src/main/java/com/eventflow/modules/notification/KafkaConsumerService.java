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
    private final NotificationService notificationService;

    @KafkaListener(topics = "booking.confirmed", groupId = "eventflow-group")
    public void bookingConfirmed(BookingConfirmedEvent event) {
        ticketService.generateTicketsForBooking(event);
        notificationService.bookingConfirmed(event);
    }
}

