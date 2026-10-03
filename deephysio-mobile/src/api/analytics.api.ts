import apiClient from './client';
import { ApiResponse } from '../types/auth.types';

export interface AnalyticsOverview {
  totalAppointments?: number;
  completedAppointments?: number;
  totalPatients?: number;
  totalRevenue?: number;
  pendingInvoices?: number;
  recentActivity?: Array<{ id: number; action: string; details: string; created_at: string }>;
  appointmentBreakdown?: Record<string, number>;
  revenueTrend?: Array<{ month: string; amount: number }>;
}

export const analyticsApi = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    try {
      const res = await apiClient.get<ApiResponse<AnalyticsOverview>>('/analytics/overview');
      return res.data.data || {};
    } catch {
      return {};
    }
  },

  getActivity: async (): Promise<any[]> => {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>('/analytics/activity');
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  getStaffOverview: async (): Promise<any[]> => {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>('/analytics/staff');
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  getRoomIncome: async (): Promise<any[]> => {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>('/analytics/room-income');
      return res.data.data || [];
    } catch {
      return [];
    }
  }
};
