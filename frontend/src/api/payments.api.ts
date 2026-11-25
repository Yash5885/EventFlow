import api from './axios';
import type { ApiResponse, BookingResponse, PaymentInitResponse } from '../types';

export async function initiatePayment(bookingId: string) {
  const response = await api.post<ApiResponse<PaymentInitResponse>>('/payments/initiate', { bookingId });
  return response.data.data;
}


export async function getPaymentConfig() {
  const response = await api.get<ApiResponse<{ enabled: boolean; demo: boolean }>>('/payments/config');
  return response.data.data;
}

export async function completeDemoPayment(id: string) {
  const response = await api.post<ApiResponse<BookingResponse>>(`/payments/${id}/complete-demo`);
  return response.data.data;
}

type RazorpayConstructor = new (options: Record<string, unknown>) => {
  open: () => void;
  on?: (event: string, listener: () => void) => void;
};

let loader: Promise<RazorpayConstructor> | undefined;
export function loadRazorpay() {
  const host = window as Window & { Razorpay?: RazorpayConstructor };
  if (host.Razorpay) return Promise.resolve(host.Razorpay);
  loader ??= new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    const timeout = window.setTimeout(fail, 8000);
    function fail() {
      window.clearTimeout(timeout);
      script.remove();
      reject(new Error('Razorpay checkout could not load'));
    }
    script.onload = () => {
      window.clearTimeout(timeout);
      if (host.Razorpay) resolve(host.Razorpay);
      else fail();
    };
    script.onerror = fail;
    document.head.append(script);
  }).catch(error => {
    loader = undefined;
    throw error;
  });
  return loader;
}
