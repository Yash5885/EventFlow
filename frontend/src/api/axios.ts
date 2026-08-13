import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';
import type { ApiResponse, AuthResponse } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 10000
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalConfig = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const auth = useAuthStore.getState();

    if (error.response?.status === 401 && originalConfig && !originalConfig._retry && auth.refreshToken) {
      originalConfig._retry = true;
      try {
        const response = await axios.post<ApiResponse<AuthResponse>>('/api/v1/auth/refresh-token', {
          refreshToken: auth.refreshToken
        });
        useAuthStore.getState().setAuth(response.data.data);
        originalConfig.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
        return api(originalConfig);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
      }
    }

    return Promise.reject(error);
  }
);

export default api;

