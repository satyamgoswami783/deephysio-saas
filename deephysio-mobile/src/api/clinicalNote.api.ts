import apiClient from './client';
import { ApiResponse } from '../types/auth.types';
import { ClinicalNote, NoteTemplate } from '../types/clinicalNote.types';

export const clinicalNoteApi = {
  getAll: async (params?: { patientId?: number; therapistId?: number; status?: string }): Promise<ClinicalNote[]> => {
    const res = await apiClient.get<ApiResponse<ClinicalNote[]>>('/clinical-notes', { params });
    return res.data.data || [];
  },

  getById: async (id: string): Promise<ClinicalNote> => {
    const res = await apiClient.get<ApiResponse<ClinicalNote>>(`/clinical-notes/${id}`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Clinical note not found');
    }
    return res.data.data;
  },

  create: async (data: {
    patientId: number;
    therapistId: number;
    type: string;
    date: string;
    status?: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    dynamicContent?: string;
  }): Promise<ClinicalNote> => {
    const res = await apiClient.post<ApiResponse<ClinicalNote>>('/clinical-notes', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to save clinical note');
    }
    return res.data.data;
  },

  update: async (id: string, data: Partial<ClinicalNote>): Promise<ClinicalNote> => {
    const res = await apiClient.put<ApiResponse<ClinicalNote>>(`/clinical-notes/${id}`, data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to update clinical note');
    }
    return res.data.data;
  },

  delete: async (id: string): Promise<void> => {
    const res = await apiClient.delete<ApiResponse<any>>(`/clinical-notes/${id}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Failed to delete clinical note');
    }
  },

  getTemplates: async (): Promise<NoteTemplate[]> => {
    try {
      const res = await apiClient.get<ApiResponse<NoteTemplate[]>>('/note-templates');
      return res.data.data || [];
    } catch {
      return [];
    }
  }
};
