import axios, { isAxiosError } from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/auth.store';
import type { ApiResponse, AuthResponse } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 10000
});

type SessionRequest = InternalAxiosRequestConfig & { accountId?: string; retried?: boolean };
let refreshInFlight: { token: string; result: Promise<string | null> } | undefined;

function refreshSession(token: string) {
  if (refreshInFlight?.token === token) return refreshInFlight.result;

  const result = axios.post<ApiResponse<AuthResponse>>('/auth/refresh-token', { refreshToken: token }, {
    baseURL: api.defaults.baseURL,
    timeout: api.defaults.timeout
  }).then(response => {
    const session = useAuthStore.getState();
    if (session.refreshToken !== token) return null;
    session.setAuth(response.data.data);
    return response.data.data.accessToken;
  }).catch(error => {
    const session = useAuthStore.getState();
    if (session.refreshToken === token && isAxiosError(error) && error.response?.status === 401) {
      session.clearAuth();
    }
    return null;
  }).finally(() => {
    if (refreshInFlight?.result === result) refreshInFlight = undefined;
  });
  refreshInFlight = { token, result };
  return result;
}

api.interceptors.request.use((config: SessionRequest) => {
  const { user, accessToken } = useAuthStore.getState();
  config.accountId = user?.id;
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const request = error.config as SessionRequest | undefined;
    if (error.response?.status !== 401 || !request || request.url?.startsWith('/auth/')) throw error;

    const session = useAuthStore.getState();
    if (!session.user || request.accountId !== session.user.id) throw error;

    const sentToken = request.headers.Authorization;
    const currentToken = session.accessToken;
    if (request.retried || !session.refreshToken) {
      if (sentToken === `Bearer ${currentToken}` || !currentToken) session.clearAuth();
      throw error;
    }

    request.retried = true;
    const token = currentToken && sentToken !== `Bearer ${currentToken}`
      ? currentToken
      : await refreshSession(session.refreshToken);
    if (!token || useAuthStore.getState().accessToken !== token) throw error;

    request.headers.Authorization = `Bearer ${token}`;
    return api(request);
  }
);

export default api;
