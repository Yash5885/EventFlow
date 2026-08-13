package com.eventflow.modules.booking;

import com.eventflow.common.PageResponse;
import com.eventflow.modules.booking.dto.BookingResponse;
import com.eventflow.modules.booking.dto.ConfirmBookingRequest;
import com.eventflow.modules.booking.dto.LockSeatsRequest;
import com.eventflow.modules.booking.dto.LockStatusResponse;
import com.eventflow.security.UserPrincipal;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface BookingService {
    BookingResponse lockSeats(UserPrincipal principal, LockSeatsRequest request);

    BookingResponse confirm(UserPrincipal principal, UUID bookingId, ConfirmBookingRequest request);

    void release(UserPrincipal principal, UUID bookingId);

    PageResponse<BookingResponse> myBookings(UserPrincipal principal, Pageable pageable);

    BookingResponse detail(UserPrincipal principal, UUID bookingId);

    LockStatusResponse lockStatus(UserPrincipal principal, UUID bookingId);

    LockStatusResponse extendLock(UserPrincipal principal, UUID bookingId);
}

