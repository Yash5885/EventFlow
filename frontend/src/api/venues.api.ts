import api from './axios';
import type { ApiResponse, PageResponse, SeatType } from '../types';

export interface VenueResponse {
  id: string;
  name: string;
  managerId: string;
  city: string;
  state: string;
  totalCapacity: number;
}

export async function listVenues(params?: { city?: string; page?: number; size?: number }) {
  const response = await api.get<ApiResponse<PageResponse<VenueResponse>>>('/venues', { params });
  return response.data.data;
}


export async function listVenueSeats(venueId: string) {
  return (await api.get<ApiResponse<{ id: string; seatType: SeatType; isActive: boolean; rowLabel: string; seatNumber: number }[]>>(`/venues/${venueId}/seats`)).data.data;
}

export async function createVenue(input: { name: string; address: string; city: string; state: string; totalCapacity: number }) {
  return (await api.post<ApiResponse<VenueResponse>>('/venues', input)).data.data;
}
export async function addVenueSeats(id: string, seats: { rowLabel: string; seatNumber: number; seatType: SeatType; xPosition: number; yPosition: number }[]) {
  return (await api.post<ApiResponse<unknown[]>>(`/venues/${id}/seats/bulk`, { seats })).data.data;
}
