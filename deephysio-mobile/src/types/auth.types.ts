export type UserRole = 'superadmin' | 'admin' | 'therapist' | 'receptionist' | 'billing';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  photo?: string;
  avatar?: string;
  tenant_id?: number | null;
  tenant?: {
    id: number;
    clinic_name: string;
    email: string;
    subscription_status: string;
    plan: string;
    created_at?: string;
    trialDaysLeft?: number;
  } | null;
  allowed_menus?: string[] | null;
  allowedMenus?: string[] | null;
  allowed_permissions?: string[] | null;
  allowedPermissions?: string[] | null;
  allowed_actions?: string[] | null;
  allowedActions?: string[] | null;
  effective_permissions?: string[];
  effectivePermissions?: string[];
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
