import api from './axios';
import type { ApiResponse, EventDetailResponse, EventSummaryResponse, PageResponse, SeatMapResponse } from '../types';

export async function listEvents(params?: { city?: string; category?: string; page?: number; size?: number }) {
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

