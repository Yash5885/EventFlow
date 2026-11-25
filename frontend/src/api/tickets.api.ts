import api from './axios';
import type { ApiResponse, EventSummaryResponse, PageResponse, TicketResponse } from '../types';

export async function getTicketsForBooking(bookingId: string) {
  const response = await api.get<ApiResponse<TicketResponse[]>>(`/tickets/booking/${bookingId}`);
  return response.data.data;
}


export async function downloadTicket(id: string) {
  const { data } = await api.get<Blob>(`/tickets/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const download = document.createElement('a');
  download.href = url;
  download.download = `eventflow-${id}.pdf`;
  download.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function getGateEvents() {
  return (await api.get<ApiResponse<EventSummaryResponse[]>>('/tickets/gate/events')).data.data;
}

export async function getGateAttendance(eventId: string) {
  return (await api.get<ApiResponse<{ issued: number; checkedIn: number }>>(`/tickets/gate/events/${eventId}`)).data.data;
}

export async function verifyTicket(eventId: string, ticketCode: string) {
  return (await api.post<ApiResponse<{
    result: 'ACCEPTED' | 'ALREADY_USED' | 'WRONG_EVENT' | 'INVALID';
    message: string;
    ticketCode: string;
    holderName?: string;
    seatInfo?: string;
  }>>('/tickets/verify', { eventId, ticketCode })).data.data;
}

export async function getMyTickets() {
  return (await api.get<ApiResponse<PageResponse<TicketResponse>>>('/tickets/my')).data.data;
}
export async function createTransfer(id: string) {
  return (await api.post<ApiResponse<{ token: string; expiresAt: string }>>(`/tickets/${id}/transfer`)).data.data;
}
export async function claimTicket(token: string) {
  return (await api.post<ApiResponse<TicketResponse>>('/tickets/claim', { token })).data.data;
}
