import apiClient from './client';
import { ApiResponse } from '../types/auth.types';

export interface SaasTenant {
  id: number;
  name: string;
  email: string;
  plan: string;
  expiry_date?: string;
  expiryDate?: string;
  clinic_name?: string;
  clinicName?: string;
  subscription_status?: 'active' | 'trial' | 'expired' | 'canceled';
  subscriptionStatus?: 'active' | 'trial' | 'expired' | 'canceled';
  phone?: string;
  created_at?: string;
  createdAt?: string;
}

export interface SaasRevenueStats {
  mrr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  plansBreakdown?: Record<string, number>;
}

export interface SaasPayment {
  id: string | number;
  tenant_name?: string;
  clinic_name?: string;
  plan: string;
  amount: number;
  currency?: string;
  status: string;
  created_at: string;
  payment_method?: string;
}

export interface SaasSettings {
  profile: {
    name: string;
    email: string;
    photo?: string;
  };
  business: {
    businessName: string;
    gstNumber: string;
    mobileNumber: string;
    businessAddress: string;
  };
  notifications?: Record<string, boolean>;
}

export const saasApi = {
  getTenants: async (): Promise<SaasTenant[]> => {
    try {
      const res = await apiClient.get<ApiResponse<any[]>>('/saas/tenants');
      const list = res.data.data || [];
      return list.map((t: any) => {
        const rawStatus = String(t.subscriptionStatus || t.subscription_status || 'active').toLowerCase();
        const subStatus = (['active', 'trial', 'canceled', 'expired', 'blocked'].includes(rawStatus)
          ? (rawStatus === 'blocked' ? 'canceled' : rawStatus)
          : 'active') as 'active' | 'trial' | 'expired' | 'canceled';
        const clinicName = t.clinicName || t.clinic_name || 'DeePhysio Clinic';
        const expDate = t.expiryDate || t.expiry_date || '';
        const createdDate = t.createdAt || t.created_at || '';
        const name = t.name || clinicName || 'Admin User';
        const email = t.email || '';
        const plan = t.plan || (subStatus === 'trial' ? '7-Day Free Trial' : 'Starter');

        return {
          ...t,
          name,
          email,
          plan,
          subscription_status: subStatus,
          subscriptionStatus: subStatus,
          clinic_name: clinicName,
          clinicName: clinicName,
          expiry_date: expDate,
          expiryDate: expDate,
          created_at: createdDate,
          createdAt: createdDate,
        };
      });
    } catch {
      return [];
    }
  },

  getRevenue: async (): Promise<SaasRevenueStats> => {
    try {
      const res = await apiClient.get<ApiResponse<SaasRevenueStats>>('/saas/revenue');
      return res.data.data || { mrr: 0, totalRevenue: 0, activeSubscriptions: 0 };
    } catch {
      return { mrr: 0, totalRevenue: 0, activeSubscriptions: 0 };
    }
  },

  getPayments: async (): Promise<SaasPayment[]> => {
    try {
      const res = await apiClient.get<ApiResponse<SaasPayment[]>>('/saas/payments');
      return res.data.data || [];
    } catch {
      return [];
    }
  },

  updateTenantStatus: async (tenantId: number, status: string): Promise<void> => {
    await apiClient.patch(`/saas/tenants/${tenantId}/status`, { status });
  },

  deleteTenant: async (tenantId: number): Promise<void> => {
    await apiClient.delete(`/saas/tenants/${tenantId}`);
  },

  getSettings: async (): Promise<SaasSettings | null> => {
    try {
      const res = await apiClient.get<ApiResponse<SaasSettings>>('/saas/settings');
      return res.data.data || null;
    } catch {
      return null;
    }
  },

  updateSettings: async (settings: Partial<SaasSettings>): Promise<void> => {
    await apiClient.put('/saas/settings', settings);
  },

  updatePassword: async (passwords: { currentPassword?: string; newPassword?: string }): Promise<void> => {
    await apiClient.put('/saas/settings/password', passwords);
  },
};

export default saasApi;
