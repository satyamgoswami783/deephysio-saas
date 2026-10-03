import apiClient from './client';

export interface SupportTicket {
  id: number;
  subject: string;
  message?: string;
  status: 'Open' | 'Replied' | 'Resolved' | 'Closed' | string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent' | string;
  tenant_id?: number;
  tenant_name?: string;
  user_name?: string;
  user_email?: string;
  created_at: string;
  updated_at?: string;
  replies?: any[];
}

export const supportApi = {
  getTickets: async (isSuperAdmin: boolean = false): Promise<SupportTicket[]> => {
    try {
      const endpoint = isSuperAdmin ? '/support/saas' : '/support/tenant';
      const response = await apiClient.get<{ success: boolean; data: SupportTicket[] }>(endpoint);
      return response.data?.data || (Array.isArray(response.data) ? (response.data as any) : []);
    } catch (err: any) {
      // Fallback try saas route if 404
      try {
        const alt = isSuperAdmin ? '/saas/support' : '/support';
        const res = await apiClient.get<{ success: boolean; data: SupportTicket[] }>(alt);
        return res.data?.data || (Array.isArray(res.data) ? (res.data as any) : []);
      } catch {
        return [];
      }
    }
  },

  createTicket: async (ticket: { subject: string; message: string; priority: string }): Promise<any> => {
    const response = await apiClient.post('/support', ticket);
    return response.data;
  },

  replyTicket: async (id: number, message: string): Promise<any> => {
    const response = await apiClient.post(`/support/${id}/reply`, { message });
    return response.data;
  },

  getTicketById: async (id: number): Promise<SupportTicket | null> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: SupportTicket }>(`/support/${id}`);
      return response.data?.data || null;
    } catch {
      return null;
    }
  },

  updateStatus: async (id: number, status: string): Promise<any> => {
    const response = await apiClient.patch(`/support/${id}/status`, { status });
    return response.data;
  },
};
