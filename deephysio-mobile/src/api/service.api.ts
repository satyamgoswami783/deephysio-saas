import apiClient from './client';
import { ApiResponse } from '../types/auth.types';
import { Service } from '../types/billing.types';

export interface CreateServiceInput {
  name: string;
  category?: string;
  duration: number;
  price: number;
  is_active?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  category?: string;
  duration?: number;
  price?: number;
  is_active?: boolean;
}

export const serviceApi = {
  getAll: async (params?: { activeOnly?: boolean }): Promise<Service[]> => {
    try {
      const res = await apiClient.get<ApiResponse<Service[]>>('/services', { params });
      return res.data.data || [];
    } catch (err) {
      console.warn('Failed to fetch services', err);
      return [];
    }
  },

  getById: async (id: number | string): Promise<Service> => {
    const res = await apiClient.get<ApiResponse<Service>>(`/services/${id}`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Service not found');
    }
    return res.data.data;
  },

  create: async (data: CreateServiceInput): Promise<Service> => {
    const res = await apiClient.post<ApiResponse<Service>>('/services', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to create service');
    }
    return res.data.data;
  },

  update: async (id: number | string, data: UpdateServiceInput): Promise<Service> => {
    const res = await apiClient.put<ApiResponse<Service>>(`/services/${id}`, data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to update service');
    }
    return res.data.data;
  },

  delete: async (id: number | string): Promise<void> => {
    const res = await apiClient.delete<ApiResponse<any>>(`/services/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Failed to delete service');
    }
  },
};
