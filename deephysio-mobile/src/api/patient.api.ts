import apiClient from './client';
import { ApiResponse } from '../types/auth.types';
import { Patient, MedicalHistory, PatientTask, PatientFile, PatientEpisode } from '../types/patient.types';

export const patientApi = {
  getAll: async (params?: { search?: string; status?: string }): Promise<Patient[]> => {
    const res = await apiClient.get<ApiResponse<Patient[]>>('/patients', { params });
    return res.data.data || [];
  },

  getById: async (id: number): Promise<Patient> => {
    if (!id || isNaN(id) || id <= 0) {
      throw new Error('Invalid patient ID');
    }
    const res = await apiClient.get<ApiResponse<Patient>>(`/patients/${id}`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Patient not found');
    }
    return res.data.data;
  },

  create: async (data: Partial<Patient>): Promise<Patient> => {
    const res = await apiClient.post<ApiResponse<Patient>>('/patients', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to create patient');
    }
    return res.data.data;
  },

  update: async (id: number, data: Partial<Patient>): Promise<Patient> => {
    const res = await apiClient.put<ApiResponse<Patient>>(`/patients/${id}`, data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to update patient');
    }
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    const res = await apiClient.delete<ApiResponse<any>>(`/patients/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Failed to delete patient');
    }
  },

  getMedicalHistory: async (patientId: number): Promise<MedicalHistory | null> => {
    try {
      const res = await apiClient.get<ApiResponse<MedicalHistory>>(`/patients/${patientId}/medical-history`);
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  upsertMedicalHistory: async (patientId: number, data: Partial<MedicalHistory>): Promise<MedicalHistory> => {
    const res = await apiClient.put<ApiResponse<MedicalHistory>>(`/patients/${patientId}/medical-history`, data);
    return res.data.data as MedicalHistory;
  },

  // Tasks
  getTasks: async (patientId: number): Promise<PatientTask[]> => {
    try {
      const res = await apiClient.get<ApiResponse<PatientTask[]>>(`/tasks`, { params: { patientId } });
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  createTask: async (data: { patientId: number; title: string; description?: string; due_date?: string }): Promise<PatientTask> => {
    const res = await apiClient.post<ApiResponse<PatientTask>>('/tasks', data);
    return res.data.data as PatientTask;
  },

  updateTaskStatus: async (taskId: number, status: 'pending' | 'completed'): Promise<void> => {
    await apiClient.put(`/tasks/${taskId}`, { status });
  },

  deleteTask: async (taskId: number): Promise<void> => {
    await apiClient.delete(`/tasks/${taskId}`);
  },

  // Files
  getFiles: async (patientId: number): Promise<PatientFile[]> => {
    try {
      const res = await apiClient.get<ApiResponse<PatientFile[]>>(`/files`, { params: { patientId } });
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  createFile: async (data: { patientId: number; file_name: string; file_url: string; file_type: string }): Promise<PatientFile> => {
    const res = await apiClient.post<ApiResponse<PatientFile>>('/files', data);
    return res.data.data as PatientFile;
  },

  deleteFile: async (fileId: number): Promise<void> => {
    await apiClient.delete(`/files/${fileId}`);
  },

  // Episodes
  getEpisodes: async (patientId: number): Promise<PatientEpisode[]> => {
    try {
      const res = await apiClient.get<ApiResponse<PatientEpisode[]>>(`/episodes`, { params: { patientId } });
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  createEpisode: async (data: { patientId: number; title: string; description?: string; start_date?: string }): Promise<PatientEpisode> => {
    const res = await apiClient.post<ApiResponse<PatientEpisode>>('/episodes', data);
    return res.data.data as PatientEpisode;
  }
};
