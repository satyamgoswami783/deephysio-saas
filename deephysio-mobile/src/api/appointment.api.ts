import apiClient from './client';
import { ApiResponse } from '../types/auth.types';
import { Appointment, AppointmentStatus, Practitioner, WaitlistEntry, Service } from '../types/appointment.types';

export const appointmentApi = {
  getAll: async (params?: { therapistId?: number | string; date?: string; status?: string }): Promise<Appointment[]> => {
    const res = await apiClient.get<ApiResponse<Appointment[]>>('/appointments', { params });
    return res.data.data || [];
  },

  getById: async (id: number): Promise<Appointment> => {
    if (!id || isNaN(id) || id <= 0) {
      throw new Error('Invalid appointment ID');
    }
    const res = await apiClient.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Appointment not found');
    }
    return res.data.data;
  },

  create: async (data: {
    patientId: number;
    therapistId: number;
    appointmentDate: string;
    serviceId?: number;
    room?: string;
    notes?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<Appointment> => {
    const res = await apiClient.post<ApiResponse<Appointment>>('/appointments', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to book appointment');
    }
    return res.data.data;
  },

  update: async (id: number, data: Partial<Appointment> & { appointmentDate?: string; therapistId?: number; serviceId?: number }): Promise<Appointment> => {
    const res = await apiClient.put<ApiResponse<Appointment>>(`/appointments/${id}`, data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to update appointment');
    }
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    const res = await apiClient.delete<ApiResponse<any>>(`/appointments/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Failed to delete appointment');
    }
  },

  updateStatus: async (id: number, status: AppointmentStatus): Promise<Appointment> => {
    const res = await apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, { status });
    return res.data.data as Appointment;
  },

  getPractitioners: async (): Promise<Practitioner[]> => {
    try {
      const res = await apiClient.get<ApiResponse<Practitioner[]>>('/appointments/practitioners');
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  // Check-in workflows
  searchCheckin: async (query: string): Promise<Appointment[]> => {
    const res = await apiClient.post<ApiResponse<Appointment[]>>('/checkin/search', { query });
    return res.data.data || [];
  },

  markAsArrived: async (appointmentId: number): Promise<Appointment> => {
    const res = await apiClient.post<ApiResponse<Appointment>>('/checkin/arrive', { appointmentId });
    return res.data.data as Appointment;
  },

  // Waitlist workflows
  getWaitlist: async (): Promise<WaitlistEntry[]> => {
    try {
      const res = await apiClient.get<ApiResponse<WaitlistEntry[]>>('/waitlist');
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  createWaitlistEntry: async (data: {
    first_name: string;
    last_name: string;
    service: string;
    contact_number: string;
    patient_id?: number;
    preferred_date?: string;
    preferred_time?: string;
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  }): Promise<WaitlistEntry> => {
    const res = await apiClient.post<ApiResponse<WaitlistEntry>>('/waitlist', data);
    return res.data.data as WaitlistEntry;
  },

  deleteWaitlistEntry: async (id: number): Promise<void> => {
    await apiClient.delete(`/waitlist/${id}`);
  },

  convertToAppointment: async (id: number, data: { therapistId: number; appointmentDate: string; serviceId?: number; startTime?: string; endTime?: string }): Promise<Appointment> => {
    const res = await apiClient.post<ApiResponse<Appointment>>(`/waitlist/${id}/convert`, data);
    return res.data.data as Appointment;
  }
};
