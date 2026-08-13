import api from './axios';
import type { ApiResponse, PageResponse } from '../types';

export interface VenueResponse {
  id: string;
  name: string;
  city: string;
  state: string;
  totalCapacity: number;
}

export async function listVenues(params?: { city?: string; page?: number; size?: number }) {
  const response = await api.get<ApiResponse<PageResponse<VenueResponse>>>('/venues', { params });
  return response.data.data;
}

