import apiClient from './client';
import { ApiResponse } from '../types/auth.types';

export interface FormTemplate {
  id: number;
  name: string;
  category: string;
  fields: string; // JSON string
  is_active?: boolean;
}

export interface FormSubmission {
  id: number;
  patient_id: number;
  form_template_id: number;
  responses: string; // JSON string
  created_at: string;
  form_template?: FormTemplate;
}

export const formsApi = {
  getTemplates: async (): Promise<FormTemplate[]> => {
    try {
      const res = await apiClient.get<ApiResponse<FormTemplate[]>>('/form-templates');
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  getSubmissions: async (patientId?: number): Promise<FormSubmission[]> => {
    try {
      const res = await apiClient.get<ApiResponse<FormSubmission[]>>('/form-submissions', {
        params: patientId ? { patientId } : undefined
      });
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  createSubmission: async (data: { patientId: number; formTemplateId: number; responses: any }): Promise<FormSubmission> => {
    const res = await apiClient.post<ApiResponse<FormSubmission>>('/form-submissions', {
      patient_id: data.patientId,
      form_template_id: data.formTemplateId,
      responses: typeof data.responses === 'string' ? data.responses : JSON.stringify(data.responses)
    });
    return res.data.data as FormSubmission;
  }
};
