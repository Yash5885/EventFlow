import api from './axios';
import type { ApiResponse } from '../types';

export interface RefundRequest {
  id: string;
  bookingId: string;
  eventTitle: string;
  amount: number;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  reason: string;
  note?: string;
  requestedAt: string;
  updatedAt: string;
  paymentReference?: string;
}
export async function listRefunds() {
  return (await api.get<ApiResponse<RefundRequest[]>>('/bookings/refunds')).data.data;
}
export async function requestRefund(id: string, reason: string) {
  return (await api.post<ApiResponse<RefundRequest>>(`/bookings/${id}/refund`, { reason })).data.data;
}
export async function listRefundQueue() {
  return (await api.get<ApiResponse<RefundRequest[]>>('/admin/refunds')).data.data;
}
export async function reviewRefund(id: string, approve: boolean, note: string) {
  return (await api.post<ApiResponse<RefundRequest>>(`/admin/refunds/${id}/review`, { approve, note })).data.data;
}
