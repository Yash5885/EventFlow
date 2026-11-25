import api from './axios';
import type { ApiResponse, BookingResponse, LockStatusResponse, PageResponse } from '../types';

export async function lockSeats(eventId: string, eventSeatIds: string[]) {
  const response = await api.post<ApiResponse<BookingResponse>>('/bookings/lock', { eventId, eventSeatIds });
  return response.data.data;
}

export async function confirmBooking(bookingId: string, payload: { paymentGatewayOrderId: string; paymentGatewayPaymentId: string; paymentGatewaySignature: string }) {
  const response = await api.post<ApiResponse<BookingResponse>>(`/bookings/${bookingId}/confirm`, payload);
  return response.data.data;
}

export async function getLockStatus(bookingId: string) {
  const response = await api.get<ApiResponse<LockStatusResponse>>(`/bookings/${bookingId}/lock-status`);
  return response.data.data;
}

export async function extendLock(bookingId: string) {
  const response = await api.post<ApiResponse<LockStatusResponse>>(`/bookings/${bookingId}/extend-lock`);
  return response.data.data;
}

export async function myBookings() {
  const response = await api.get<ApiResponse<PageResponse<BookingResponse>>>('/bookings/my');
  return response.data.data;
}


export async function getBooking(bookingId: string) {
  const response = await api.get<ApiResponse<BookingResponse>>(`/bookings/${bookingId}`);
  return response.data.data;
}

export async function releaseBooking(bookingId: string) {
  await api.delete(`/bookings/${bookingId}/release`);
}
