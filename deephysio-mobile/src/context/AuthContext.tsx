import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, UserRole } from '../types/auth.types';
import { authApi } from '../api/auth.api';
import { Storage } from '../utils/storage';
import { setOnUnauthorizedCallback } from '../api/client';
import { ROLE_DEFAULT_PERMISSIONS, ROLE_DEFAULT_MODULES } from '../constants/permissions';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  clinicProfile: any;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserPhoto: (photo: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [clinicProfile, setClinicProfile] = useState<any>({ clinicName: 'Healthcare Clinic' });

  const logout = useCallback(async () => {
    await Storage.clear();
    setToken(null);
    setUser(null);
    setRole(null);
  }, []);

  const updateUserPhoto = useCallback(async (photo: string) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, photo };
      Storage.setJson('deephysio_user', updated);
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const storedToken = await Storage.getItem('token');
      if (!storedToken) return;

      const me = await authApi.getMe();
      if (me) {
        setUser((prev) => {
          const merged = { ...me, photo: prev?.photo || me.photo };
          Storage.setJson('deephysio_user', merged);
          return merged;
        });
        setRole(me.role);
        await Storage.setItem('deephysio_role', me.role);
      }
    } catch (e) {
      console.warn('Failed to refresh user profile:', e);
    }
  }, []);

  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      logout();
    });

    const initAuth = async () => {
      try {
        // Fast local restoration without network blocking
        const [savedToken, savedUser, savedRole] = await Promise.all([
          Storage.getItem('token'),
          Storage.getJson<User>('deephysio_user'),
          Storage.getItem('deephysio_role') as Promise<UserRole | null>,
        ]);

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
          setRole(savedRole || savedUser.role);
          if (savedUser.tenant?.clinic_name) {
            setClinicProfile((prev: any) => ({
              ...prev,
              clinicName: savedUser.tenant?.clinic_name,
              plan: savedUser.tenant?.plan,
              subscriptionStatus: savedUser.tenant?.subscription_status,
            }));
          }
          // Background sync
          refreshUser();
        }
      } catch (err) {
        console.warn('Error restoring auth session:', err);
      } finally {
        // Unblock immediately so Login / Dashboard renders instantly
        setIsLoading(false);
      }

      // Non-blocking public config fetch in background
      authApi.getPublicConfig().then((publicConfig) => {
        if (publicConfig?.clinicProfile) {
          setClinicProfile((prev: any) => ({
            ...publicConfig.clinicProfile,
            clinicName: user?.tenant?.clinic_name || publicConfig.clinicProfile.clinicName,
            plan: user?.tenant?.plan || publicConfig.clinicProfile.plan,
          }));
        }
      }).catch(() => {});
    };

    initAuth();
  }, [logout, refreshUser]);

  useEffect(() => {
    if (user?.tenant?.clinic_name) {
      setClinicProfile((prev: any) => ({
        ...prev,
        clinicName: user.tenant?.clinic_name,
        plan: user.tenant?.plan,
        subscriptionStatus: user.tenant?.subscription_status,
      }));
    }
  }, [user]);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      await Storage.setItem('token', res.token);
      await Storage.setJson('deephysio_user', res.user);
      await Storage.setItem('deephysio_role', res.user.role);

      setToken(res.token);
      setUser(res.user);
      setRole(res.user.role);
      if (res.user?.tenant?.clinic_name) {
        setClinicProfile((prev: any) => ({
          ...prev,
          clinicName: res.user.tenant?.clinic_name,
          plan: res.user.tenant?.plan,
          subscriptionStatus: res.user.tenant?.subscription_status,
        }));
      }
    } catch (err) {
      setIsLoading(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        clinicProfile,
        login,
        logout,
        refreshUser,
        updateUserPhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
