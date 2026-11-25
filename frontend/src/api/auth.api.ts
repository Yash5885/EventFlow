import api from './axios';
import type { ApiResponse, AuthResponse, UserResponse } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload) {
  const response = await api.post<ApiResponse<UserResponse>>('/auth/register', payload);
  return unwrapApiData(response.data);
}

export async function login(payload: LoginPayload) {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload);
  return unwrapApiData(response.data);
}

export async function getMe() {
  const response = await api.get<ApiResponse<UserResponse>>('/users/me');
  return unwrapApiData(response.data);
}

function unwrapApiData<T>(response: ApiResponse<T> | string): T {
  if (typeof response === 'string') {
    throw new Error('The frontend received HTML instead of JSON. Rebuild the frontend container so /api is proxied to the backend.');
  }

  if (!response?.data) {
    throw new Error(response?.message ?? 'The API response did not include data.');
  }

  return response.data;
}

export async function getRegistrationOptions() {
  return (await api.get<ApiResponse<{ staffRoles: boolean }>>('/auth/registration-options')).data.data;
}
