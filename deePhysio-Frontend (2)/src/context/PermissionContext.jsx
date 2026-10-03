import React, { createContext, useContext, useMemo } from 'react';
import { normalizeModule, readAllowedModules } from '../config/modules';
import { readAllowedActions, readAssignedPermissions, readEffectivePermissions } from '../config/actions';

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const role = sessionStorage.getItem('deephysio_role') || 'therapist';
  let user = null;
  try {
    user = JSON.parse(sessionStorage.getItem('deephysio_user') || 'null');
  } catch (e) {
    user = null;
  }

  const allowedModules = useMemo(
    () => readAllowedModules(user, role).map(normalizeModule),
    [role, user]
  );
  const assignedPermissions = useMemo(
    () => readAssignedPermissions(user, role),
    [role, user]
  );
  const effectivePermissions = useMemo(
    () => readEffectivePermissions(user, role),
    [role, user]
  );
  const allowedActions = useMemo(
    () => readAllowedActions(user, role),
    [role, user]
  );

  const value = useMemo(() => ({
    allowedModules,
    assignedPermissions,
    effectivePermissions,
    allowedActions,
    canModule: (moduleName) => allowedModules.includes(normalizeModule(moduleName)),
    can: (permissionKey) => effectivePermissions.includes(permissionKey),
    canAction: (actionKey) => allowedActions.includes(actionKey),
    canAny: (permissionKeys = []) => permissionKeys.some((key) => effectivePermissions.includes(key)),
    denyReason: () => 'No access'
  }), [allowedModules, assignedPermissions, effectivePermissions, allowedActions]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) throw new Error('usePermissions must be used within PermissionProvider');
  return context;
};
