package com.eventflow.modules.event;

import com.eventflow.common.PageResponse;
import com.eventflow.common.enums.EventStatus;
import com.eventflow.common.enums.SeatStatus;
import com.eventflow.common.enums.UserRole;
import com.eventflow.common.exception.AppException;
import com.eventflow.common.exception.ValidationAppException;
import com.eventflow.common.exception.ResourceNotFoundException;
import com.eventflow.modules.booking.SeatLockService;
import com.eventflow.modules.event.dto.CreateEventRequest;
import com.eventflow.modules.event.dto.EventDetailResponse;
import com.eventflow.modules.event.dto.EventResponse;
import com.eventflow.modules.event.dto.EventSummaryResponse;
import com.eventflow.modules.event.dto.SeatMapResponse;
import com.eventflow.modules.event.dto.UpdateEventRequest;
import com.eventflow.modules.user.User;
import com.eventflow.modules.user.UserRepository;
import com.eventflow.modules.venue.Seat;
import com.eventflow.modules.venue.SeatRepository;
import com.eventflow.modules.venue.Venue;
import com.eventflow.modules.venue.VenueRepository;
import com.eventflow.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final EventSeatRepository eventSeatRepository;
    private final VenueRepository venueRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final SeatLockService seatLockService;

    @Override
    @Transactional
    public EventResponse create(UserPrincipal principal, CreateEventRequest request) {
        User organizer = userRepository.findById(principal.id())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Venue venue = venueRepository.findById(request.venueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found"));

        Event event = Event.builder()
                .organizer(organizer)
                .venue(venue)
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .bannerUrl(request.bannerUrl())
                .eventDate(request.eventDate())
                .doorsOpenTime(request.doorsOpenTime())
                .endTime(request.endTime())
                .status(EventStatus.DRAFT)
                .build();
        Event saved = eventRepository.save(event);

        Map<UUID, BigDecimal> prices = request.seatPrices() == null ? Map.of() : request.seatPrices().stream()
                .collect(Collectors.toMap(CreateEventRequest.EventSeatPriceRequest::seatId, CreateEventRequest.EventSeatPriceRequest::price));
        var eventSeats = seatRepository.findByVenue_IdAndActiveTrueOrderByRowLabelAscSeatNumberAsc(venue.getId()).stream()
                .filter(seat -> prices.isEmpty() || prices.containsKey(seat.getId()))
                .map(seat -> EventSeat.builder()
                        .event(saved)
                        .seat(seat)
                        .price(prices.getOrDefault(seat.getId(), BigDecimal.ZERO))
                        .status(SeatStatus.AVAILABLE)
                        .build())
                .toList();
        eventSeatRepository.saveAll(eventSeats);

        return EventResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EventSummaryResponse> listPublished(String city, String category, String q, Pageable pageable) {
        var page = eventRepository.searchPublished(EventStatus.PUBLISHED, searchTerm(city), searchTerm(category), searchTerm(q), pageable);
        return PageResponse.from(page.map(EventSummaryResponse::from));
    }

    private String searchTerm(String value) {
        return value == null ? "" : value.strip().toLowerCase(java.util.Locale.ROOT);
    }

    @Override
    @Transactional(readOnly = true)
    public EventDetailResponse detail(UserPrincipal principal, UUID id) {
        return EventDetailResponse.from(visibleEvent(principal, id));
    }

    @Override
    @Transactional
    public EventResponse update(UserPrincipal principal, UUID id, UpdateEventRequest request) {
        Event event = lockEvent(id);
        assertOwnerOrAdmin(principal, event);
        requireDraft(event);
        if (request.status() != null || request.publicEvent() != null) {
            throw new ValidationAppException("REVIEW_REQUIRED", "Use the review workflow to publish an event");
        }
        if (StringUtils.hasText(request.title())) event.setTitle(request.title());
        if (request.description() != null) event.setDescription(request.description());
        if (request.category() != null) event.setCategory(request.category());
        if (request.bannerUrl() != null) event.setBannerUrl(request.bannerUrl());
        if (request.eventDate() != null) event.setEventDate(request.eventDate());
        if (request.doorsOpenTime() != null) event.setDoorsOpenTime(request.doorsOpenTime());
        if (request.endTime() != null) event.setEndTime(request.endTime());
        if (request.seatPrices() != null) {
            var prices = new java.util.HashMap<UUID, BigDecimal>();
            for (var seat : request.seatPrices()) {
                if (prices.putIfAbsent(seat.seatId(), seat.price()) != null) {
                    throw new ValidationAppException("DUPLICATE_SEAT", "A seat was listed twice");
                }
            }
            var inventory = eventSeatRepository.findByEvent_Id(id);
            var ids = inventory.stream().map(seat -> seat.getSeat().getId()).collect(Collectors.toSet());
            if (!ids.equals(prices.keySet())) {
                throw new ValidationAppException("INVALID_INVENTORY", "Provide a price for each seat in the draft");
            }
            inventory.forEach(seat -> seat.setPrice(prices.get(seat.getSeat().getId())));
        }
        return EventResponse.from(event);
    }

    @Override
    @Transactional
    public void delete(UserPrincipal principal, UUID id) {
        Event event = lockEvent(id);
        assertOwnerOrAdmin(principal, event);
        requireDraft(event);
        eventRepository.delete(event);
    }

    @Override
    @Transactional
    public EventResponse submit(UserPrincipal principal, UUID id) {
        Event event = lockEvent(id);
        assertOwnerOrAdmin(principal, event);
        requireDraft(event);
        var inventory = eventSeatRepository.findByEvent_Id(id);
        if (!event.getEventDate().isAfter(java.time.LocalDateTime.now()) || inventory.isEmpty()
                || inventory.stream().anyMatch(seat -> seat.getPrice().signum() <= 0)) {
            throw new ValidationAppException("INCOMPLETE_EVENT", "Set a future event date and positive prices for all offered seats");
        }
        event.setStatus(EventStatus.PENDING_APPROVAL);
        return EventResponse.from(event);
    }

    @Override
    @Transactional
    public EventResponse cancel(UserPrincipal principal, UUID id, String reason) {
        Event event = findEvent(id);
        assertOwnerOrAdmin(principal, event);
        event.setStatus(EventStatus.CANCELLED);
        event.setAdminNote(reason);
        return EventResponse.from(event);
    }

    @Override
    @Transactional(readOnly = true)
    public SeatMapResponse seatMap(UserPrincipal principal, UUID eventId) {
        Event event = visibleEvent(principal, eventId);
        var rows = eventSeatRepository.findByEvent_Id(eventId).stream()
                .sorted(Comparator
                        .comparing((EventSeat eventSeat) -> eventSeat.getSeat().getRowLabel())
                        .thenComparing(eventSeat -> eventSeat.getSeat().getSeatNumber()))
                .map(eventSeat -> {
                    Seat seat = eventSeat.getSeat();
                    SeatStatus status = eventSeat.getStatus();
                    if (status == SeatStatus.AVAILABLE && seatLockService.isLocked(eventId, eventSeat.getId())) {
                        status = SeatStatus.LOCKED;
                    }
                    return new SeatMapResponse.Seat(
                            eventSeat.getId(),
                            seat.getId(),
                            seat.getRowLabel(),
                            seat.getSeatNumber(),
                            seat.getSeatType(),
                            eventSeat.getPrice(),
                            status,
                            seat.getXPosition(),
                            seat.getYPosition()
                    );
                })
                .collect(Collectors.groupingBy(SeatMapResponse.Seat::rowLabel))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new SeatMapResponse.Row(entry.getKey(), entry.getValue()))
                .toList();

        return new SeatMapResponse(event.getId(), event.getVenue().getId(), event.getVenue().getName(), rows);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EventSummaryResponse> myEvents(UserPrincipal principal, Pageable pageable) {
        return PageResponse.from(eventRepository.findByOrganizer_Id(principal.id(), pageable).map(EventSummaryResponse::from));
    }

    private void requireDraft(Event event) {
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new AppException(HttpStatus.CONFLICT, "EVENT_NOT_DRAFT", "Only a draft can be edited or submitted");
        }
    }

    private Event lockEvent(UUID id) {
        return eventRepository.lockById(id).orElseThrow(() -> new ResourceNotFoundException("Event not found"));
    }

    private Event visibleEvent(UserPrincipal principal, UUID id) {
        Event event = findEvent(id);
        if (event.getStatus() == EventStatus.PUBLISHED && Boolean.TRUE.equals(event.getPublicEvent())) return event;
        if (principal == null || (principal.role() != UserRole.ADMIN && !event.getOrganizer().getId().equals(principal.id()))) {
            throw new ResourceNotFoundException("Event not found");
        }
        return event;
    }

    private Event findEvent(UUID id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
    }

    private void assertOwnerOrAdmin(UserPrincipal principal, Event event) {
        boolean admin = principal.role() == UserRole.ADMIN;
        boolean owner = event.getOrganizer().getId().equals(principal.id());
        if (!admin && !owner) {
            throw new AppException(HttpStatus.FORBIDDEN, "FORBIDDEN", "You do not manage this event");
        }
    }
}
