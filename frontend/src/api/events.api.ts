import api from './axios';
import type { ApiResponse, EventDetailResponse, EventSummaryResponse, PageResponse, SeatMapResponse } from '../types';

export async function listEvents(params?: { city?: string; q?: string; category?: string; page?: number; size?: number }) {
  const response = await api.get<ApiResponse<PageResponse<EventSummaryResponse>>>('/events', { params });
  return response.data.data;
}

export async function getEvent(id: string) {
  const response = await api.get<ApiResponse<EventDetailResponse>>(`/events/${id}`);
  return response.data.data;
}

export async function getSeatMap(eventId: string) {
  const response = await api.get<ApiResponse<SeatMapResponse>>(`/events/${eventId}/seat-map`);
  return response.data.data;
}


type EventDraft = {
  title: string; category: string; description: string; bannerUrl: string; eventDate: string;
  seatPrices: { seatId: string; price: number }[];
};
type EventRecord = EventDetailResponse['event'];

export async function createEvent(draft: EventDraft & { venueId: string }) {
  return (await api.post<ApiResponse<EventRecord>>('/events', draft)).data.data;
}
export async function updateEvent(id: string, draft: EventDraft) {
  return (await api.put<ApiResponse<EventRecord>>(`/events/${id}`, draft)).data.data;
}
export async function submitEvent(id: string) {
  return (await api.post<ApiResponse<EventRecord>>(`/events/${id}/submit`)).data.data;
}
export async function getOrganizerEvents() {
  return (await api.get<ApiResponse<PageResponse<EventSummaryResponse>>>('/events/my', { params: { size: 100 } })).data.data;
}
export async function getEventsForReview() {
  return (await api.get<ApiResponse<PageResponse<EventRecord>>>('/admin/events', { params: { status: 'PENDING_APPROVAL', size: 100 } })).data.data;
}
export async function reviewEvent({ id, decision, note }: { id: string; decision: 'approve' | 'reject'; note: string }) {
  return (await api.post<ApiResponse<EventRecord>>(`/admin/events/${id}/${decision}`, decision === 'approve' ? { note } : { reason: note })).data.data;
}
