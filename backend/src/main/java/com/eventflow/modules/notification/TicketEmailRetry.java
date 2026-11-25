package com.eventflow.modules.notification;

import com.eventflow.modules.booking.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.ticket-mail.enabled", havingValue = "true")
public class TicketEmailRetry {
    private final BookingRepository bookings;
    private final EmailService email;

    @Scheduled(fixedDelay = 120000)
    public void retry() {
        for (var id : bookings.findTicketEmailQueue(com.eventflow.common.enums.BookingStatus.CONFIRMED, LocalDateTime.now().minusDays(1), PageRequest.of(0, 20))) {
            try {
                email.sendTickets(id);
            } catch (RuntimeException exception) {
                log.warn("Ticket email delivery will retry for booking {}", id);
            }
        }
    }
}
