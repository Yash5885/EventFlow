package com.eventflow.modules.booking.dto;

import com.eventflow.common.enums.SeatType;
import com.eventflow.modules.booking.BookingItem;

import java.math.BigDecimal;
import java.util.UUID;

public record BookingSeatResponse(
        UUID eventSeatId,
        UUID seatId,
        String rowLabel,
        Integer seatNumber,
        SeatType seatType,
        BigDecimal price
) {
    public static BookingSeatResponse from(BookingItem item) {
        var eventSeat = item.getEventSeat();
        var seat = eventSeat.getSeat();
        return new BookingSeatResponse(
                eventSeat.getId(),
                seat.getId(),
                seat.getRowLabel(),
                seat.getSeatNumber(),
                seat.getSeatType(),
                item.getPriceAtBooking()
        );
    }
}

