export const PERMISSIONS = [
  'patient.basic',
  'patient.read',
  'patient.write',
  'patient.delete',
  'user.basic',
  'user.read',
  'user.write',
  'appointments.view',
  'appointments.manage',
  'notes.view',
  'notes.manage',
  'billing.view',
  'billing.manage',
  'communication.use',
  'forms.view',
  'forms.manage',
  'users.manage',
  'settings.manage',
  'analytics.view'
];

export const HIGH_LEVEL_PERMISSIONS = [
  { key: 'appointments.view', label: 'Appointments Check-in', warn: 'Check-in only access.' },
  { key: 'appointments.manage', label: 'Appointments Manage', warn: 'Requires basic patient access. Added automatically.' },
  { key: 'notes.view', label: 'Clinical Notes View', warn: 'Requires full patient read access. Added automatically.' },
  { key: 'notes.manage', label: 'Clinical Notes Manage', warn: 'Requires full patient read access. Added automatically.' },
  { key: 'billing.view', label: 'Billing View', warn: 'Requires basic patient access. Added automatically.' },
  { key: 'billing.manage', label: 'Billing Manage', warn: 'Requires basic patient access. Added automatically.' },
  { key: 'communication.use', label: 'Communication', warn: 'Requires basic patient access. Added automatically.' },
  { key: 'forms.view', label: 'Forms View' },
  { key: 'forms.manage', label: 'Forms Manage' },
  { key: 'users.manage', label: 'Users Manage' },
  { key: 'settings.manage', label: 'Settings Manage' },
  { key: 'analytics.view', label: 'Analytics View', warn: 'Read-only summary access is automatically expanded.' }
];

export const ROLE_DEFAULT_PERMISSIONS = {
  superadmin: PERMISSIONS,
  admin: PERMISSIONS,
  therapist: ['patient.read', 'patient.write', 'appointments.manage', 'notes.manage', 'forms.view', 'analytics.view'],
  receptionist: ['patient.basic', 'patient.write', 'appointments.manage', 'billing.view', 'forms.manage', 'analytics.view'],
  billing: ['patient.basic', 'billing.manage', 'analytics.view']
};

export const PERMISSION_DEPENDENCIES = {
  'appointments.manage': ['patient.basic'],
  'notes.view': ['patient.read'],
  'notes.manage': ['patient.read'],
  'billing.view': ['patient.basic'],
  'billing.manage': ['patient.basic'],
  'communication.use': ['patient.basic']
};

export const LEGACY_ACTIONS = [
  'patients.view',
  'patients.create',
  'patients.edit',
  'patients.delete',
  'patients.view_notes',
  'appointments.view',
  'appointments.book',
  'appointments.reschedule',
  'appointments.checkin',
  'appointments.complete',
  'appointments.cancel',
  'notes.view',
  'notes.create',
  'notes.edit',
  'notes.delete',
  'users.view',
  'users.create',
  'users.edit',
  'users.delete',
  'users.assign_permissions'
];

export const PERMISSION_TO_LEGACY = {
  'patient.basic': ['patients.view'],
  'patient.read': ['patients.view', 'patients.view_notes'],
  'patient.write': ['patients.create', 'patients.edit'],
  'patient.delete': ['patients.delete'],
  'appointments.view': ['appointments.view'],
  'appointments.manage': ['appointments.book', 'appointments.reschedule', 'appointments.checkin', 'appointments.complete', 'appointments.cancel'],
  'notes.view': ['notes.view'],
  'notes.manage': ['notes.create', 'notes.edit', 'notes.delete'],
  'users.manage': ['users.view', 'users.create', 'users.edit', 'users.delete', 'users.assign_permissions'],
  'settings.manage': ['users.view'],
  'analytics.view': []
};

const LEGACY_TO_PERMISSION = Object.entries(PERMISSION_TO_LEGACY).reduce((acc, [perm, actions]) => {
  actions.forEach((a) => { acc[a] = perm; });
  return acc;
}, {});

export const resolvePermissions = (assigned = [], role = '') => {
  const resolved = new Set(assigned.filter((p) => PERMISSIONS.includes(p)));
  const normalizedRole = String(role || '').toLowerCase();

  if (resolved.has('appointments.manage')) resolved.add('appointments.view');
  if (resolved.has('notes.manage')) resolved.add('notes.view');
  if (resolved.has('billing.manage')) resolved.add('billing.view');
  if (resolved.has('forms.manage')) resolved.add('forms.view');
  if (resolved.has('patient.read')) resolved.add('patient.basic');
  if (resolved.has('users.manage')) ['user.basic', 'user.read', 'user.write'].forEach((p) => resolved.add(p));
  if (resolved.has('settings.manage')) resolved.add('user.read');
  if (resolved.has('analytics.view')) ['appointments.view', 'notes.view', 'billing.view', 'patient.basic'].forEach((p) => resolved.add(p));

  // Role-aware dependency rules (matching backend DEPENDENCY_RULES)
  const ROLE_AWARE_DEPS = [
    { whenAny: ['appointments.manage'], add: ['patient.basic'] },
    { whenAny: ['notes.view', 'notes.manage'], add: ['patient.read'], allowedRoles: ['admin', 'therapist'] },
    { whenAny: ['billing.view', 'billing.manage'], add: ['patient.basic'] },
    { whenAny: ['communication.use'], add: ['patient.basic'] }
  ];

  ROLE_AWARE_DEPS.forEach((rule) => {
    if (Array.isArray(rule.allowedRoles) && !rule.allowedRoles.includes(normalizedRole)) return;
    if (rule.whenAny.some((perm) => resolved.has(perm))) {
      rule.add.forEach((dep) => resolved.add(dep));
    }
  });

  // Legacy PERMISSION_DEPENDENCIES (for backward compat; no role guard)
  Object.entries(PERMISSION_DEPENDENCIES).forEach(([perm, deps]) => {
    if (resolved.has(perm)) deps.forEach((d) => resolved.add(d));
  });
  return [...resolved];
};

export const inferPermissionsFromLegacy = (legacy = []) => {
  const set = new Set();
  legacy.forEach((a) => { if (LEGACY_TO_PERMISSION[a]) set.add(LEGACY_TO_PERMISSION[a]); });
  return [...set];
};

export const readAssignedPermissions = (userLike, role = 'therapist') => {
  const resolvedRole = String(userLike?.role || role || 'therapist').toLowerCase();
  if (!userLike || typeof userLike !== 'object') return ROLE_DEFAULT_PERMISSIONS[resolvedRole] || [];
  const explicit = Array.isArray(userLike.allowed_permissions)
    ? userLike.allowed_permissions
    : (Array.isArray(userLike.allowedPermissions) ? userLike.allowedPermissions : null);
  if (Array.isArray(explicit) && explicit.length > 0) return [...new Set(explicit.filter((p) => PERMISSIONS.includes(p)))];
  const legacy = Array.isArray(userLike.allowed_actions)
    ? userLike.allowed_actions
    : (Array.isArray(userLike.allowedActions) ? userLike.allowedActions : null);
  if (Array.isArray(legacy) && legacy.length > 0) return inferPermissionsFromLegacy(legacy);
  return ROLE_DEFAULT_PERMISSIONS[resolvedRole] || [];
};

export const readEffectivePermissions = (userLike, role = 'therapist') => {
  const resolvedRole = String(userLike?.role || role || 'therapist').toLowerCase();
  
  if (resolvedRole === 'superadmin') {
    return PERMISSIONS;
  }

  const explicitEffective = Array.isArray(userLike?.effective_permissions)
    ? userLike.effective_permissions
    : (Array.isArray(userLike?.effectivePermissions) ? userLike.effectivePermissions : null);
  if (Array.isArray(explicitEffective) && explicitEffective.length > 0) return [...new Set(explicitEffective.filter((p) => PERMISSIONS.includes(p)))];
  return resolvePermissions(readAssignedPermissions(userLike, resolvedRole), resolvedRole);
};

export const readAllowedActions = (userLike, role = 'therapist') => {
  const explicitLegacy = Array.isArray(userLike?.allowed_actions)
    ? userLike.allowed_actions
    : (Array.isArray(userLike?.allowedActions) ? userLike.allowedActions : null);
  if (Array.isArray(explicitLegacy)) return [...new Set(explicitLegacy.filter((a) => LEGACY_ACTIONS.includes(a)))];
  const effectivePermissions = readEffectivePermissions(userLike, role);
  const legacy = new Set();
  effectivePermissions.forEach((perm) => (PERMISSION_TO_LEGACY[perm] || []).forEach((a) => legacy.add(a)));
  return [...legacy];
};
