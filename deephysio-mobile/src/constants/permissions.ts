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
] as const;

export type PermissionKey = typeof PERMISSIONS[number];

export const MODULES = [
  'Dashboard',
  'Appointments',
  'Patients',
  'Clinical Notes',
  'Communication',
  'Billing',
  'Forms',
  'Analytics',
  'Settings'
] as const;

export type ModuleKey = typeof MODULES[number];

export const SUPERADMIN_MODULES = [
  'Dashboard',
  'Admins',
  'Payments',
  'Setting',
  'Support Tickets'
] as const;

export const ROLE_DEFAULT_PERMISSIONS: Record<string, string[]> = {
  superadmin: ['users.manage', 'settings.manage', 'analytics.view'],
  admin: [...PERMISSIONS],
  therapist: ['patient.read', 'patient.write', 'appointments.manage', 'notes.manage', 'forms.view', 'analytics.view'],
  receptionist: ['patient.basic', 'patient.write', 'appointments.manage', 'billing.view', 'forms.manage', 'analytics.view'],
  billing: ['patient.basic', 'billing.manage', 'analytics.view']
};

export const ROLE_DEFAULT_MODULES: Record<string, string[]> = {
  superadmin: ['Dashboard', 'Admins', 'Payments', 'Setting', 'Support Tickets'],
  admin: ['Dashboard', 'Appointments', 'Patients', 'Clinical Notes', 'Communication', 'Billing', 'Forms', 'Analytics', 'Settings'],
  therapist: ['Dashboard', 'Appointments', 'Patients', 'Clinical Notes', 'Communication', 'Forms', 'Analytics'],
  receptionist: ['Dashboard', 'Appointments', 'Patients', 'Communication', 'Forms', 'Analytics'],
  billing: ['Dashboard', 'Billing', 'Analytics', 'Communication']
};
