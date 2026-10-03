import apiClient from './client';
import { ApiResponse } from '../types/auth.types';

export interface CommThread {
  id: number;
  patient_id: number;
  channel: string;
  title?: string;
  created_at: string;
  updated_at: string;
  patient?: { id: number; first_name: string; last_name: string; phone: string };
}

export interface CommMessage {
  id: string | number;
  thread_id: number;
  patient_id: number;
  channel: string;
  direction: 'INBOUND' | 'OUTBOUND';
  body: string;
  subject?: string | null;
  delivery_status?: string;
  created_at: string;
}

export const communicationApi = {
  getThreads: async (): Promise<CommThread[]> => {
    try {
      const res = await apiClient.get<ApiResponse<CommThread[]>>('/communication/threads');
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  getMessages: async (threadId: number): Promise<CommMessage[]> => {
    try {
      const res = await apiClient.get<ApiResponse<CommMessage[]>>(`/communication/threads/${threadId}/messages`);
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  sendMessage: async (threadId: number, data: { body: string; channel?: string; patientId?: number }): Promise<CommMessage> => {
    const res = await apiClient.post<ApiResponse<CommMessage>>(`/communication/threads/${threadId}/messages`, data);
    return res.data.data as CommMessage;
  },

  sendDirectEmail: async (data: { recipientEmail: string; subject: string; messageBody: string }): Promise<void> => {
    await apiClient.post('/communication/send-email', data);
  }
};
