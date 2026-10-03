import apiClient from './client';
import { ApiResponse, AuthResponse, User, LoginCredentials } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Login failed');
    }
    return res.data.data;
  },

  register: async (data: {
    businessName: string;
    adminName: string;
    email: string;
    mobileNumber: string;
    password: string;
    selectedPlan?: string;
  }): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', {
      name: data.adminName,
      email: data.email,
      password: data.password,
      role: 'admin',
      clinicName: data.businessName,
      phone: data.mobileNumber,
      plan: data.selectedPlan || '7-Day Free Trial',
    });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Registration failed');
    }
    return res.data.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>('/users/me');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch user profile');
    }
    return res.data.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string; otp?: string }> => {
    const res = await apiClient.post<ApiResponse<any>>('/auth/forgot-password', { email });
    return { message: res.data.message || 'Password reset code sent', otp: (res.data.data as any)?.otp };
  },

  verifyOtp: async (email: string, otp: string): Promise<boolean> => {
    const res = await apiClient.post<ApiResponse<any>>('/auth/verify-otp', { email, otp });
    return !!res.data.success;
  },

  resetPassword: async (data: { email?: string; token?: string; otp?: string; newPassword?: string; password?: string }): Promise<string> => {
    const res = await apiClient.post<ApiResponse<any>>('/auth/reset-password', data);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Password reset failed');
    }
    return res.data.message || 'Password reset successfully';
  },

  changePassword: async (data: { currentPassword?: string; oldPassword?: string; newPassword: string }): Promise<void> => {
    const res = await apiClient.post<ApiResponse<any>>('/auth/change-password', data);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Failed to change password');
    }
  },

  getPublicConfig: async (): Promise<{ clinicProfile?: any }> => {
    try {
      const res = await apiClient.get<ApiResponse<{ clinicProfile: any }>>('/public/config');
      return res.data.data || {};
    } catch {
      return {};
    }
  }
};
