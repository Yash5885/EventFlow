import api from './axios';
import type { ApiResponse, TicketResponse } from '../types';

export async function getTicketsForBooking(bookingId: string) {
  const response = await api.get<ApiResponse<TicketResponse[]>>(`/tickets/booking/${bookingId}`);
  return response.data.data;
}

