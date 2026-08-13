package com.eventflow.modules.booking;

import com.eventflow.common.enums.BookingStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class BookingCleanupJob {

    private final BookingRepository bookingRepository;
    private final SeatLockService seatLockService;

    @Scheduled(fixedRate = 120000)
    @Transactional
    public void expirePendingBookings() {
        var expired = bookingRepository.findWithItemsByStatusAndExpiresAtBefore(BookingStatus.PENDING, LocalDateTime.now());
        expired.forEach(booking -> {
            booking.setStatus(BookingStatus.EXPIRED);
            seatLockService.releaseAllLocksForBooking(
                    booking.getId(),
                    booking.getItems().stream().map(item -> item.getEventSeat().getId()).toList(),
                    booking.getEvent().getId()
            );
        });
    }
}

