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
        var now = LocalDateTime.now();
        var expired = bookingRepository.findPendingExpiryIds(BookingStatus.PENDING, now, org.springframework.data.domain.PageRequest.of(0, 100));
        for (var id : expired) {
            var booking = bookingRepository.lockById(id).orElse(null);
            if (booking == null || booking.getStatus() != BookingStatus.PENDING || booking.getExpiresAt().isAfter(now)) continue;
            booking.setStatus(BookingStatus.EXPIRED);
            if (booking.getLockToken() == null) continue;
            seatLockService.releaseAllLocksForBooking(
                    booking.getLockToken(),
                    booking.getItems().stream().map(item -> item.getEventSeat().getId()).toList(),
                    booking.getEvent().getId()
            );
        }
    }
}
