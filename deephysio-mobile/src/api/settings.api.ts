import apiClient from './client';
import { ApiResponse, User } from '../types/auth.types';

export const settingsApi = {
  getSettings: async (keys?: string[]): Promise<Record<string, any>> => {
    try {
      const res = await apiClient.get<ApiResponse<Record<string, any>>>('/settings', {
        params: keys ? { keys: keys.join(',') } : undefined
      });
      return res.data.data || {};
    } catch {
      return {};
    }
  },

  updateSettings: async (settings: Record<string, any>): Promise<void> => {
    await apiClient.post('/settings', { settings });
  },

  // Users management for Admins
  getUsers: async (): Promise<User[]> => {
    try {
      const res = await apiClient.get<ApiResponse<User[]>>('/users');
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  createUser: async (data: any): Promise<User> => {
    const res = await apiClient.post<ApiResponse<User>>('/users', data);
    return res.data.data as User;
  },

  updateUser: async (id: number, data: any): Promise<User> => {
    const res = await apiClient.put<ApiResponse<User>>(`/users/${id}`, data);
    return res.data.data as User;
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  }
};
