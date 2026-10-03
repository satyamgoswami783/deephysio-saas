import apiClient from './client';
import { ApiResponse } from '../types/auth.types';
import { Invoice, Payment, Service } from '../types/billing.types';

export const billingApi = {
  // Invoices
  getInvoices: async (params?: { patientId?: number; status?: string }): Promise<Invoice[]> => {
    try {
      const res = await apiClient.get<ApiResponse<Invoice[]>>('/invoices', { params });
      return res.data.data || [];
    } catch (err: any) {
      if (err?.response?.status === 403) {
        console.warn('🔒 [Billing API] Access restricted (403 Forbidden). Returning empty list.');
        return [];
      }
      throw err;
    }
  },

  getInvoiceById: async (id: string): Promise<Invoice | null> => {
    try {
      const res = await apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`);
      if (!res.data.success || !res.data.data) {
        return null;
      }
      return res.data.data;
    } catch (err: any) {
      if (err?.response?.status === 403) {
        console.warn('🔒 [Billing API] Access restricted (403 Forbidden).');
        return null;
      }
      throw err;
    }
  },

  createInvoice: async (data: {
    patientId: number;
    date: string;
    subtotal?: number;
    tax?: number;
    total?: number;
    notes?: string;
    items: Array<{ service: string; rate: number; qty: number }>;
  }): Promise<Invoice> => {
    const res = await apiClient.post<ApiResponse<Invoice>>('/invoices', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to create invoice');
    }
    return res.data.data;
  },

  deleteInvoice: async (id: string): Promise<void> => {
    await apiClient.delete(`/invoices/${id}`);
  },

  // Payments
  getPayments: async (params?: { patientId?: number; invoiceId?: string }): Promise<Payment[]> => {
    try {
      const res = await apiClient.get<ApiResponse<Payment[]>>('/payments', { params });
      return res.data.data || [];
    } catch (err: any) {
      if (err?.response?.status === 403) {
        console.warn('🔒 [Billing API] Payments access restricted (403 Forbidden). Returning empty list.');
        return [];
      }
      throw err;
    }
  },

  createPayment: async (data: {
    patientId: number;
    invoiceId?: string;
    amount: number;
    date: string;
    method: string;
    description?: string;
  }): Promise<Payment> => {
    const payload = {
      patient_id: data.patientId,
      patientId: data.patientId,
      invoice_id: data.invoiceId || undefined,
      invoiceId: data.invoiceId || undefined,
      amount: data.amount,
      date: data.date,
      method: data.method,
      description: data.description,
    };
    const res = await apiClient.post<ApiResponse<Payment>>('/payments', payload);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to record payment');
    }
    return res.data.data;
  },

  // Services
  getServices: async (): Promise<Service[]> => {
    try {
      const res = await apiClient.get<ApiResponse<Service[]>>('/services');
      return res.data.data || [];
    } catch (err: any) {
      if (err?.response?.status === 403) {
        return [];
      }
      return [];
    }
  },

  createService: async (data: { name: string; category?: string; duration: number; price: number }): Promise<Service> => {
    const res = await apiClient.post<ApiResponse<Service>>('/services', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to create service');
    }
    return res.data.data;
  },

  deleteService: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/services/${id}`);
  }
};
