export const MODULES = [
  'Dashboard',
  'Appointments',
  'Patients',
  'Clinical Notes',
  'Communication',
  'Billing',
  'Forms',
  'Analytics',
  'Data Backup',
  'How to Use',
  'Support Tickets',
  'Settings'
];

export const SUPERADMIN_MODULES = [
  'Dashboard',
  'Admins',
  'Payments',
  'Setting',
  'Audit Logs',
  'Data Backup',
  'How to Use',
  'Support Tickets'
];

export const ROLE_DEFAULTS = {
  superadmin: SUPERADMIN_MODULES,
  admin: MODULES,
  therapist: [
    'Dashboard',
    'Appointments',
    'Patients',
    'Clinical Notes',
    'Communication',
    'Forms',
    'Analytics'
  ],
  receptionist: [
    'Dashboard',
    'Appointments',
    'Patients',
    'Communication',
    'Forms',
    'Analytics'
  ],
  billing: ['Dashboard', 'Billing', 'Analytics', 'Communication']
};

export const MODULE_ALIASES = {
  'Billing & Payments': 'Billing'
};

export const normalizeModule = (name) => MODULE_ALIASES[name] || name;

export const readAllowedModules = (userLike, role = 'therapist') => {
  const normalizedRole = String(userLike?.role || role || 'therapist').toLowerCase();
  
  // SuperAdmins always get all modules, ignoring legacy DB limitations
  if (normalizedRole === 'superadmin') {
    return ROLE_DEFAULTS.superadmin || MODULES;
  }

  // Clinic Admins always get full admin modules including Data Backup
  if (normalizedRole === 'admin') {
    if (!userLike || typeof userLike !== 'object') {
      return ROLE_DEFAULTS.admin.map(normalizeModule);
    }
    const fromSnake = userLike.allowed_menus;
    const fromCamel = userLike.allowedMenus;
    const explicit = Array.isArray(fromSnake) ? fromSnake : (Array.isArray(fromCamel) ? fromCamel : null);
    if (Array.isArray(explicit) && explicit.length > 0) {
      const valid = explicit.map(normalizeModule).filter((m) => MODULES.includes(m));
      if (!valid.includes('Data Backup')) valid.push('Data Backup');
      return [...new Set(valid)];
    }
    return ROLE_DEFAULTS.admin.map(normalizeModule);
  }

  if (!userLike || typeof userLike !== 'object') {
    return (ROLE_DEFAULTS[normalizedRole] || ROLE_DEFAULTS.therapist || []).map(normalizeModule);
  }

  const fromSnake = userLike.allowed_menus;
  const fromCamel = userLike.allowedMenus;
  const explicit = Array.isArray(fromSnake) ? fromSnake : (Array.isArray(fromCamel) ? fromCamel : null);

  if (Array.isArray(explicit) && explicit.length > 0) {
    const valid = explicit.map(normalizeModule).filter((m) => MODULES.includes(m));
    if (valid.length > 0) {
      return [...new Set(valid)];
    }
  }

  return (ROLE_DEFAULTS[normalizedRole] || ROLE_DEFAULTS.therapist || []).map(normalizeModule);
};
