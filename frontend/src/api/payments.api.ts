import api from './axios';
import type { ApiResponse, PaymentInitResponse } from '../types';

export async function initiatePayment(bookingId: string) {
  const response = await api.post<ApiResponse<PaymentInitResponse>>('/payments/initiate', { bookingId });
  return response.data.data;
}

