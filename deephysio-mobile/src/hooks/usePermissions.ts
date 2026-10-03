import { useAuth } from '../context/AuthContext';
import { ROLE_DEFAULT_PERMISSIONS, ROLE_DEFAULT_MODULES, PermissionKey, ModuleKey } from '../constants/permissions';

export const usePermissions = () => {
  const { user, role } = useAuth();
  const currentRole = role || user?.role || 'therapist';

  const effectivePermissions: string[] = React_useMemo_Permissions(user, currentRole);
  const allowedModules: string[] = React_useMemo_Modules(user, currentRole);

  const can = (permission: PermissionKey | string): boolean => {
    if (currentRole === 'admin') return true;
    if (currentRole === 'superadmin') {
      return ['users.manage', 'settings.manage', 'analytics.view'].includes(permission);
    }
    return effectivePermissions.includes(permission);
  };

  const canAny = (permissions: (PermissionKey | string)[]): boolean => {
    if (currentRole === 'admin') return true;
    return permissions.some((p) => can(p));
  };

  const canAll = (permissions: (PermissionKey | string)[]): boolean => {
    if (currentRole === 'admin') return true;
    return permissions.every((p) => can(p));
  };

  const hasModule = (moduleName: ModuleKey | string): boolean => {
    if (currentRole === 'admin') return true;
    return allowedModules.includes(moduleName);
  };

  return {
    role: currentRole,
    effectivePermissions,
    allowedModules,
    can,
    canAny,
    canAll,
    hasModule,
    isSuperAdmin: currentRole === 'superadmin',
    isAdmin: currentRole === 'admin',
    isTherapist: currentRole === 'therapist',
    isReceptionist: currentRole === 'receptionist',
    isBilling: currentRole === 'billing',
  };
};

function React_useMemo_Permissions(user: any, role: string): string[] {
  if (role === 'admin') {
    return [...ROLE_DEFAULT_PERMISSIONS.admin];
  }
  if (role === 'superadmin') {
    return [...ROLE_DEFAULT_PERMISSIONS.superadmin];
  }
  if (user?.effective_permissions && Array.isArray(user.effective_permissions)) {
    return user.effective_permissions;
  }
  if (user?.effectivePermissions && Array.isArray(user.effectivePermissions)) {
    return user.effectivePermissions;
  }
  if (user?.allowed_permissions && Array.isArray(user.allowed_permissions)) {
    return user.allowed_permissions;
  }
  return ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS.therapist;
}

function React_useMemo_Modules(user: any, role: string): string[] {
  if (role === 'admin') {
    return [...ROLE_DEFAULT_MODULES.admin];
  }
  if (role === 'superadmin') {
    return [...ROLE_DEFAULT_MODULES.superadmin];
  }
  if (user?.allowed_menus && Array.isArray(user.allowed_menus)) {
    return user.allowed_menus;
  }
  if (user?.allowedMenus && Array.isArray(user.allowedMenus)) {
    return user.allowedMenus;
  }
  return ROLE_DEFAULT_MODULES[role] || ROLE_DEFAULT_MODULES.therapist;
}
