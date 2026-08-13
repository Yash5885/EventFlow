import type { EventDetailResponse, EventSummaryResponse, SeatMapResponse } from '../types';

export const sampleEvents: EventSummaryResponse[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Mumbai Indie Music Night',
    category: 'Concert',
    bannerUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    eventDate: new Date(Date.now() + 86400000 * 12).toISOString(),
    status: 'PUBLISHED',
    venueId: '21111111-1111-1111-1111-111111111111',
    venueName: 'Riverfront Arena',
    city: 'Mumbai'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Bengaluru Founders Summit',
    category: 'Conference',
    bannerUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
    eventDate: new Date(Date.now() + 86400000 * 21).toISOString(),
    status: 'PUBLISHED',
    venueId: '22222222-1111-1111-1111-111111111111',
    venueName: 'Civic Convention Hall',
    city: 'Bengaluru'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Delhi Championship Finals',
    category: 'Sports',
    bannerUrl: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80',
    eventDate: new Date(Date.now() + 86400000 * 32).toISOString(),
    status: 'PUBLISHED',
    venueId: '23333333-1111-1111-1111-111111111111',
    venueName: 'National Indoor Stadium',
    city: 'Delhi'
  }
];

export function sampleEventDetail(id = sampleEvents[0].id): EventDetailResponse {
  const event = sampleEvents.find(item => item.id === id) ?? sampleEvents[0];
  return {
    event: {
      id: event.id,
      organizerId: '99999999-9999-9999-9999-999999999999',
      venueId: event.venueId,
      title: event.title,
      description:
        'Reserved seating, live availability, and checkout protected by short-lived Redis locks. Tickets are generated after payment confirmation.',
      category: event.category,
      bannerUrl: event.bannerUrl,
      eventDate: event.eventDate,
      status: 'PUBLISHED',
      isPublic: true
    },
    venueName: event.venueName,
    venueAddress: 'Central district',
    city: event.city,
    state: 'India'
  };
}

export function sampleSeatMap(eventId = sampleEvents[0].id): SeatMapResponse {
  const rows = ['A', 'B', 'C', 'D', 'E'].map((rowLabel, rowIndex) => ({
    rowLabel,
    seats: Array.from({ length: 14 }).map((_, seatIndex) => {
      const status = seatIndex === 4 && rowIndex === 1 ? 'BOOKED' : seatIndex === 8 && rowIndex === 2 ? 'LOCKED' : seatIndex === 11 && rowIndex === 3 ? 'BLOCKED' : 'AVAILABLE';
      return {
        eventSeatId: `${eventId}-${rowLabel}-${seatIndex + 1}`,
        seatId: `${rowLabel}-${seatIndex + 1}`,
        rowLabel,
        seatNumber: seatIndex + 1,
        seatType: seatIndex === 0 ? 'WHEELCHAIR' : rowIndex < 2 ? 'PREMIUM' : 'GENERAL',
        price: rowIndex < 2 ? 1800 : 950,
        status,
        xPosition: 72 + seatIndex * 42,
        yPosition: 56 + rowIndex * 44
      };
    })
  }));

  return {
    eventId,
    venueId: '21111111-1111-1111-1111-111111111111',
    venueName: 'Riverfront Arena',
    rows
  } as SeatMapResponse;
}

