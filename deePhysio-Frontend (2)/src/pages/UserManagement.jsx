import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaUserEdit, FaTrashAlt, FaSearch, FaTimes, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { usePermissions } from '../context/PermissionContext';
import Button from '../components/ui/Button';
import { fetchApi } from '../config/api';
import { MODULES, ROLE_DEFAULTS, readAllowedModules } from '../config/modules';
import { HIGH_LEVEL_PERMISSIONS, ROLE_DEFAULT_PERMISSIONS, readAssignedPermissions, resolvePermissions, readAllowedActions, PERMISSION_DEPENDENCIES } from '../config/actions';
import { useNavigate } from 'react-router-dom';

const MODULE_PERMISSION_MAP = {
  Dashboard: [],
  Appointments: ['appointments.view', 'appointments.manage'],
  Patients: ['patient.basic', 'patient.read', 'patient.write', 'patient.delete'],
  'Clinical Notes': ['notes.view', 'notes.manage'],
  Communication: ['communication.use'],
  Billing: ['billing.view', 'billing.manage'],
  Forms: ['forms.view', 'forms.manage'],
  Analytics: ['analytics.view'],
  Settings: ['settings.manage', 'users.manage']
};

const PERMISSION_META = {
  'patient.basic': { label: 'Patient Basic' },
  'patient.read': { label: 'Patient Read' },
  'patient.write': { label: 'Patient Write' },
  'patient.delete': { label: 'Patient Delete' },
  'appointments.view': { label: 'Appointments Check-in', warn: 'Check-in only access.' },
  'appointments.manage': { label: 'Appointments Manage', warn: 'Requires basic patient access. Added automatically.' },
  'notes.view': { label: 'Clinical Notes View', warn: 'Requires full patient read access. Added automatically.' },
  'notes.manage': { label: 'Clinical Notes Manage', warn: 'Requires full patient read access. Added automatically.' },
  'communication.use': { label: 'Communication', warn: 'Requires basic patient access. Added automatically.' },
  'billing.view': { label: 'Billing View', warn: 'Requires basic patient access. Added automatically.' },
  'billing.manage': { label: 'Billing Manage', warn: 'Requires basic patient access. Added automatically.' },
  'forms.view': { label: 'Forms View' },
  'forms.manage': { label: 'Forms Manage' },
  'analytics.view': { label: 'Analytics View', warn: 'Read-only summary access is automatically expanded.' },
  'settings.manage': { label: 'Settings Manage' },
  'users.manage': { label: 'Users Manage' }
};

const uniq = (arr = []) => [...new Set(arr)];
const MODULE_BASE_PERMISSION_MAP = {
  Appointments: 'appointments.view',
  Patients: 'patient.basic',
  'Clinical Notes': 'notes.view',
  Communication: 'communication.use',
  Billing: 'billing.view',
  Forms: 'forms.view',
  Analytics: 'analytics.view',
  Settings: 'settings.manage'
};

const IMPLIED_PERMISSION_MAP = {
  'appointments.manage': ['appointments.view'],
  'notes.manage': ['notes.view'],
  'billing.manage': ['billing.view'],
  'forms.manage': ['forms.view'],
  'patient.read': ['patient.basic'],
  'patient.write': ['patient.read'],
  'patient.delete': ['patient.write'],
  'users.manage': ['settings.manage']
};

// Permissions restricted to specific roles only
const PERMISSION_ROLE_RESTRICTIONS = {
  'notes.view': ['admin', 'therapist'],
  'notes.manage': ['admin', 'therapist']
};

// When a base permission is removed, these dependent permissions must also be removed
const PERMISSION_DEPENDENTS = {
  'patient.basic': ['patient.read', 'patient.write', 'patient.delete', 'appointments.manage', 'billing.view', 'billing.manage', 'communication.use'],
  'patient.read': ['patient.write', 'patient.delete', 'notes.view', 'notes.manage'],
  'patient.write': ['patient.delete'],
  'appointments.view': ['appointments.manage'],
  'notes.view': ['notes.manage'],
  'billing.view': ['billing.manage'],
  'forms.view': ['forms.manage'],
  'settings.manage': ['users.manage']
};

const normalizePermissionsForRole = (permissions = [], role = 'therapist') => {
  const roleKey = String(role || 'therapist').toLowerCase();
  let nextPerms = uniq(permissions);
  nextPerms = nextPerms.filter((permKey) => {
    const restrictedRoles = PERMISSION_ROLE_RESTRICTIONS[permKey];
    return !restrictedRoles || restrictedRoles.includes(roleKey);
  });

  // Keep only direct/intentional UI dependencies here.
  // Do NOT use global resolvePermissions() because it auto-expands
  // analytics/settings/user perms and makes some modules impossible to unselect.
  let changed = true;
  while (changed) {
    changed = false;

    // Manage -> View and Patient Read -> Basic
    Object.entries(IMPLIED_PERMISSION_MAP).forEach(([source, deps]) => {
      if (!nextPerms.includes(source)) return;
      deps.forEach((dep) => {
        if (!nextPerms.includes(dep)) {
          nextPerms.push(dep);
          changed = true;
        }
      });
    });

    // Explicit cross-module dependencies (appointments/billing/communication -> patient.basic, notes -> patient.read)
    Object.entries(PERMISSION_DEPENDENCIES).forEach(([source, deps]) => {
      if (!nextPerms.includes(source)) return;
      deps.forEach((dep) => {
        if (!nextPerms.includes(dep)) {
          nextPerms.push(dep);
          changed = true;
        }
      });
    });
  }

  return uniq(nextPerms);
};

const deriveMenusFromPermissions = (permissions = [], existingMenus = []) => {
  const next = new Set();
  Object.entries(MODULE_PERMISSION_MAP).forEach(([moduleName, modulePerms]) => {
    if (!modulePerms.length) {
      // Permission-less modules (e.g. Dashboard) should follow explicit user selection only.
      if (existingMenus.includes(moduleName)) {
        next.add(moduleName);
      }
      return;
    }
    if (modulePerms.some((p) => permissions.includes(p))) {
      next.add(moduleName);
    }
  });
  return uniq([...next]);
};


const UserManagement = () => {
  const { showToast } = useToast();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem('deephysio_user'));
      return user?.role || 'therapist';
    } catch (e) {
      return 'therapist';
    }
  });

  // Modal states
  const [modalType, setModalType] = useState(null); // 'add', 'edit', 'delete'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'therapist', status: 'Active', allowed_menus: [], allowed_permissions: [], password: '' });

  const [isLoading, setIsLoading] = useState(true);
  const [passwordError, setPasswordError] = useState(false);
  const [inheritRoleDefaults, setInheritRoleDefaults] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deleteSafetyLoading, setDeleteSafetyLoading] = useState(false);
  const [blockingAppointments, setBlockingAppointments] = useState([]);
  const [reassignmentUserId, setReassignmentUserId] = useState('');
  const currentUserId = (() => {
    try {
      const raw = sessionStorage.getItem('deephysio_user');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.id ? Number(parsed.id) : null;
    } catch (e) {
      return null;
    }
  })();

  const loadUsers = async () => {
    if (!can('users.manage')) {
      setAccessDenied(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetchApi('/users');
      if (res) {
        if (res.status === 403) {
          setAccessDenied(true);
          setUsers([]);
          return;
        }
        const data = await res.json();
        if (data.success) {
          setAccessDenied(false);
          setUsers(data.data.map(u => ({
            ...u,
            role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
            status: 'Active',
            allowed_menus: readAllowedModules(u, u.role),
            allowed_permissions: readAssignedPermissions(u, u.role),
            effective_permissions: resolvePermissions(readAssignedPermissions(u, u.role), u.role),
            allowed_actions: readAllowedActions(u, u.role)
          })));
        }
      }
    } catch (e) {
      setAccessDenied(true);
      showToast('Failed to load users.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (accessDenied) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans relative">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-500 hover:text-clinicPrimary hover:border-clinicPrimary/30 hover:bg-clinicPrimary/5 transition-all outline-none shrink-0"
            title="Back to Settings"
          >
            <FaArrowLeft size={14} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Manage staff accounts, roles, and access.</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider">No Access</h2>
          <p className="mt-2 text-sm font-medium text-amber-800">
            You do not have permission to view user management. Ask admin to enable <strong>Users Manage</strong> access.
          </p>
        </div>
      </div>
    );
  }

  const openAddModal = () => {
    const defaultRole = 'therapist';
    const defaultPerms = normalizePermissionsForRole(
      ROLE_DEFAULT_PERMISSIONS[defaultRole] || [],
      defaultRole
    );
    setFormData({
      name: '',
      email: '',
      role: defaultRole,
      status: 'Active',
      allowed_permissions: defaultPerms,
      allowed_menus: deriveMenusFromPermissions(defaultPerms, ROLE_DEFAULTS[defaultRole] || []),
      password: ''
    });
    setInheritRoleDefaults(true);
    setModalType('add');
    setPasswordError(false);
  };

  const openEditModal = (user, e) => {
    if (e) e.stopPropagation();
    const roleKey = user.role?.toLowerCase?.() || 'therapist';
    const normalizedPerms = normalizePermissionsForRole(
      readAssignedPermissions(user, roleKey),
      roleKey
    );
    setFormData({
      ...user,
      allowed_menus: readAllowedModules(user, user.role?.toLowerCase?.() || 'therapist'),
      allowed_permissions: normalizedPerms,
      password: ''
    });
    setInheritRoleDefaults(false);
    setSelectedUser(user);
    setModalType('edit');
    setPasswordError(false);
  };

  const openDeleteModal = (user, e) => {
    if (e) e.stopPropagation();
    const userId = Number(user?.id);
    if (currentUserId && userId === currentUserId) {
      showToast('Safety lock: You cannot delete your own account while logged in.', 'error');
      return;
    }

    const isAdminUser = String(user?.role || '').toLowerCase() === 'admin';
    const adminCount = users.filter((u) => String(u.role || '').toLowerCase() === 'admin').length;
    if (isAdminUser && adminCount <= 1) {
      showToast('Safety lock: Last admin cannot be deleted.', 'error');
      return;
    }

    setSelectedUser(user);
    setBlockingAppointments([]);
    setReassignmentUserId('');
    setModalType('delete');
    prepareDeleteSafety(user);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
    setBlockingAppointments([]);
    setReassignmentUserId('');
    setDeleteSafetyLoading(false);
  };

  const isTherapistLike = (role = '') => ['therapist', 'admin'].includes(String(role).toLowerCase());

  const prepareDeleteSafety = async (user) => {
    if (!user || !isTherapistLike(user.role)) return;
    setDeleteSafetyLoading(true);
    try {
      const res = await fetchApi(`/appointments?therapistId=${user.id}`);
      if (!res) return;
      const data = await res.json().catch(() => ({}));
      const appts = Array.isArray(data?.data) ? data.data : [];
      setBlockingAppointments(appts);
    } catch (error) {
      setBlockingAppointments([]);
    } finally {
      setDeleteSafetyLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || (modalType === 'add' && !formData.password)) {
      showToast('Please fill all required fields (Name, Email, Password).', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const normalizedMenus = deriveMenusFromPermissions(
        formData.allowed_permissions || [],
        formData.allowed_menus || []
      );
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role.toLowerCase(),
        password: formData.password || null, // Password is now required for add
        allowed_menus: normalizedMenus,
        allowed_permissions: normalizePermissionsForRole(formData.allowed_permissions || [], formData.role)
      };

      let res;
      if (modalType === 'add') {
        res = await fetchApi('/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetchApi(`/users/${selectedUser.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role.toLowerCase(),
            allowed_menus: normalizedMenus,
            allowed_permissions: normalizePermissionsForRole(formData.allowed_permissions || [], formData.role),
            password: formData.password || undefined
          })
        });
      }

      if (res) {
        const data = await res.json();
        if (data.success) {
          showToast(modalType === 'add' ? 'User added successfully.' : 'User updated successfully.', 'success');
          loadUsers();
          closeModal();
        } else {
          showToast(data.message || 'Action failed.', 'error');
          if (data.message && data.message.toLowerCase().includes('password')) {
            setPasswordError(true);
          }
        }
      }
    } catch (e) {
      showToast('Error saving user.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      if (currentUserId && Number(selectedUser?.id) === currentUserId) {
        showToast('Safety lock: You cannot delete your own account while logged in.', 'error');
        return;
      }

      const selectedIsAdmin = String(selectedUser?.role || '').toLowerCase() === 'admin';
      const remainingAdmins = users.filter(
        (u) => String(u.role || '').toLowerCase() === 'admin' && Number(u.id) !== Number(selectedUser?.id)
      ).length;
      if (selectedIsAdmin && remainingAdmins <= 0) {
        showToast('Safety lock: Last admin cannot be deleted.', 'error');
        return;
      }

      const selectedRole = String(selectedUser?.role || '').toLowerCase();
      const requiresReassignment = isTherapistLike(selectedRole) && blockingAppointments.length > 0;
      if (requiresReassignment && !reassignmentUserId) {
        showToast('Please choose a replacement therapist before deleting this user.', 'error');
        return;
      }

      if (requiresReassignment) {
        for (const appt of blockingAppointments) {
          const transferRes = await fetchApi(`/appointments/${appt.id}`, {
            method: 'PUT',
            body: JSON.stringify({ therapistId: Number(reassignmentUserId) })
          });
          if (!transferRes) throw new Error('Reassignment failed');
          const transferData = await transferRes.json().catch(() => ({}));
          if (!transferData?.success) {
            throw new Error(transferData?.message || 'Failed to reassign appointments');
          }
        }
      }

      const res = await fetchApi(`/users/${selectedUser.id}`, {
        method: 'DELETE'
      });
      if (res) {
        showToast(
          requiresReassignment
            ? `User removed. ${blockingAppointments.length} appointments reassigned safely.`
            : 'User removed successfully.',
          'success'
        );
        loadUsers();
        closeModal();
      }
    } catch (e) {
      showToast('Error removing user.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const syncModuleFromPermission = (permissionKey, checked) => {
    setFormData((prev) => {
      const currentMenus = prev.allowed_menus || [];
      const currentPerms = prev.allowed_permissions || [];
      let nextPerms;

      if (checked) {
        // Add the permission + its implied lower-level permissions
        nextPerms = uniq([...currentPerms, permissionKey, ...(IMPLIED_PERMISSION_MAP[permissionKey] || [])]);
        // Also add cross-module dependencies (e.g. appointments.view needs patient.basic)
        (PERMISSION_DEPENDENCIES[permissionKey] || []).forEach((dep) => {
          nextPerms = uniq([...nextPerms, dep]);
        });
      } else {
        // Remove the permission itself
        nextPerms = currentPerms.filter((p) => p !== permissionKey);

        // Cascade: remove the higher-level permission that implies this one
        Object.entries(IMPLIED_PERMISSION_MAP).forEach(([source, deps]) => {
          if (deps.includes(permissionKey)) {
            nextPerms = nextPerms.filter((p) => p !== source);
          }
        });

        // Full cascade: remove all permissions that depend on this one (direct + transitive)
        const removeCascade = (basePerm) => {
          const dependents = PERMISSION_DEPENDENTS[basePerm] || [];
          dependents.forEach((dep) => {
            if (nextPerms.includes(dep)) {
              nextPerms = nextPerms.filter((p) => p !== dep);
              removeCascade(dep); // transitive removal
            }
          });
        };
        removeCascade(permissionKey);
      }

      const normalizedPerms = normalizePermissionsForRole(nextPerms, prev.role);
      const nextMenus = deriveMenusFromPermissions(normalizedPerms, currentMenus);

      return {
        ...prev,
        allowed_permissions: normalizedPerms,
        allowed_menus: nextMenus
      };
    });
  };

  const syncPermissionFromModule = (moduleName, checked) => {
    setFormData((prev) => {
      const currentMenus = prev.allowed_menus || [];
      const currentPerms = prev.allowed_permissions || [];
      const modulePerms = MODULE_PERMISSION_MAP[moduleName] || [];
      const basePerm = MODULE_BASE_PERMISSION_MAP[moduleName];

      const nextMenus = checked
        ? uniq([...currentMenus, moduleName])
        : currentMenus.filter((m) => m !== moduleName);

      let nextPerms = currentPerms;
      if (checked) {
        if (modulePerms.length === 0) {
          nextPerms = currentPerms;
        } else if (basePerm) {
          // Module ON grants minimum meaningful access; advanced perms can be opted-in manually.
          nextPerms = uniq([...currentPerms, basePerm]);
        } else {
          nextPerms = uniq([...currentPerms, ...modulePerms]);
        }
      } else if (modulePerms.length > 0) {
        nextPerms = currentPerms.filter((p) => !modulePerms.includes(p));
      }

      const normalizedPerms = normalizePermissionsForRole(nextPerms, prev.role);

      return {
        ...prev,
        allowed_menus: deriveMenusFromPermissions(normalizedPerms, nextMenus),
        allowed_permissions: normalizedPerms
      };
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-8 animate-fade-in font-sans relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-500 hover:text-clinicPrimary hover:border-clinicPrimary/30 hover:bg-clinicPrimary/5 transition-all outline-none shrink-0"
            title="Back to Settings"
          >
            <FaArrowLeft size={14} />
          </button>
          <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage staff accounts, roles, and access.</p>
          </div>
        </div>
        <Button
          variant="accent"
          onClick={openAddModal}
          leftIcon={<FaUserPlus />}
          className="shadow-sm"
        >
          Add New User
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && users.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400 font-medium">Loading staff records...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400 font-medium">No users found.</td></tr>
              ) : null}
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => openEditModal(user)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-[11px] shrink-0">
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{user.name}</p>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{user.role}</p>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className={`mx-auto w-fit px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${user.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                      }`}>
                      {user.status}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center"
                        onClick={(e) => openEditModal(user, e)}
                      >
                        <FaUserEdit size={14} />
                      </button>
                      <button
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center"
                        onClick={(e) => openDeleteModal(user, e)}
                      >
                        <FaTrashAlt size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOM MODALS FOR ADD, EDIT, DELETE */}
      {modalType && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-3 bg-slate-900/45 backdrop-blur-sm animate-fade-in overflow-y-auto" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[360px] sm:max-w-[380px] max-h-[88vh] overflow-hidden animate-slide-up my-auto" onClick={e => e.stopPropagation()}>

            {/* Delete Confirmation Modal */}
            {modalType === 'delete' ? (
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mx-auto mb-4">
                  <FaExclamationTriangle size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-800 text-center mb-2">Remove User?</h2>
                <p className="text-sm text-slate-500 text-center mb-6">
                  Are you sure you want to completely remove <strong>{selectedUser?.name}</strong> from the system? This action cannot be entirely undone.
                </p>

                {currentUserId && Number(selectedUser?.id) === currentUserId && (
                  <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
                    <p className="text-xs font-semibold text-rose-700">
                      Safety lock active: you cannot delete your own logged-in account.
                    </p>
                  </div>
                )}

                {String(selectedUser?.role || '').toLowerCase() === 'admin' &&
                  users.filter((u) => String(u.role || '').toLowerCase() === 'admin').length <= 1 && (
                  <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
                    <p className="text-xs font-semibold text-rose-700">
                      Safety lock active: last admin account cannot be deleted.
                    </p>
                  </div>
                )}

                {isTherapistLike(selectedUser?.role) && (
                  <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                    {deleteSafetyLoading ? (
                      <p className="text-xs font-semibold text-slate-500">Checking linked appointments...</p>
                    ) : blockingAppointments.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-amber-700">
                          This user has {blockingAppointments.length} appointment(s). Please reassign before delete.
                        </p>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Reassign To</label>
                          <select
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all cursor-pointer"
                            value={reassignmentUserId}
                            onChange={(e) => setReassignmentUserId(e.target.value)}
                          >
                            <option value="">Select therapist</option>
                            {users
                              .filter((u) => u.id !== selectedUser?.id && isTherapistLike(u.role))
                              .map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} ({u.role})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-emerald-700">No appointments linked. Safe to remove.</p>
                    )}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button variant="secondary" className="flex-1 rounded-xl" onClick={closeModal}>Cancel</Button>
                  <Button
                    variant="primary"
                    className="flex-1 rounded-xl !bg-rose-500 hover:!bg-rose-600 hover:!shadow-rose-500/30 !shadow-md border-none"
                    onClick={confirmDelete}
                    disabled={
                      deleteSafetyLoading ||
                      (currentUserId && Number(selectedUser?.id) === currentUserId) ||
                      (String(selectedUser?.role || '').toLowerCase() === 'admin' &&
                        users.filter((u) => String(u.role || '').toLowerCase() === 'admin').length <= 1) ||
                      (isTherapistLike(selectedUser?.role) && blockingAppointments.length > 0 && !reassignmentUserId)
                    }
                  >
                    Delete User
                  </Button>
                </div>
              </div>
            ) : (
              /* Add/Edit Form Modal */
              <div>
                <div className="p-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h2 className="text-base font-bold text-slate-800 tracking-tight">
                    {modalType === 'add' ? 'Add New User' : 'Edit User Profile'}
                  </h2>
                  <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <FaTimes />
                  </button>
                </div>
                <div className="p-3.5 space-y-2.5 overflow-y-auto max-h-[calc(88vh-124px)] custom-scrollbar">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Dr. John Doe"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@clinic.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      {modalType === 'add' ? 'Login Password (Required)' : 'New Password (Optional)'}
                    </label>
                    <div className="relative group">
                      <input
                        type="password"
                        className={`w-full px-3.5 py-2.5 bg-slate-50 border ${passwordError ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-200'} rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all`}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          setPasswordError(false);
                        }}
                        placeholder={modalType === 'add' ? 'Enter starting password' : 'Keep blank to stay same'}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Role</label>
                      <select
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all cursor-pointer"
                        value={formData.role.toLowerCase()}
                        onChange={(e) => {
                          const newRole = e.target.value;
                          setFormData(prev => {
                            if (inheritRoleDefaults) {
                              const roleDefaultPerms = normalizePermissionsForRole(
                                ROLE_DEFAULT_PERMISSIONS[newRole] || [],
                                newRole
                              );
                              return {
                                ...prev,
                                role: newRole,
                                allowed_permissions: roleDefaultPerms,
                                allowed_menus: deriveMenusFromPermissions(
                                  roleDefaultPerms,
                                  ROLE_DEFAULTS[newRole] || []
                                )
                              };
                            }
                            // Even without inheriting defaults, strip permissions that are role-restricted
                            let cleanedPerms = (prev.allowed_permissions || []).filter((p) => {
                              const restricted = PERMISSION_ROLE_RESTRICTIONS[p];
                              return !restricted || restricted.includes(newRole);
                            });
                            // Also clean up modules whose permissions are now empty
                            let cleanedMenus = (prev.allowed_menus || []).filter((m) => {
                              const mPerms = MODULE_PERMISSION_MAP[m] || [];
                              return !mPerms.length || mPerms.some((p) => cleanedPerms.includes(p));
                            });
                            return {
                              ...prev,
                              role: newRole,
                              allowed_permissions: normalizePermissionsForRole(cleanedPerms, newRole),
                              allowed_menus: deriveMenusFromPermissions(
                                normalizePermissionsForRole(cleanedPerms, newRole),
                                cleanedMenus
                              )
                            };
                          });
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="therapist">Therapist</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="billing">Billing Staff</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Status</label>
                      <select
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all cursor-pointer"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-clinicPrimary focus:ring-clinicPrimary/20"
                      checked={inheritRoleDefaults}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setInheritRoleDefaults(checked);
                        if (checked) {
                          setFormData((prev) => {
                            const roleKey = String(prev.role || 'therapist').toLowerCase();
                            const roleDefaultPerms = normalizePermissionsForRole(
                              ROLE_DEFAULT_PERMISSIONS[roleKey] || [],
                              roleKey
                            );
                            return {
                              ...prev,
                              allowed_permissions: roleDefaultPerms,
                              allowed_menus: deriveMenusFromPermissions(
                                roleDefaultPerms,
                                ROLE_DEFAULTS[roleKey] || []
                              )
                            };
                          });
                        }
                      }}
                    />
                    Auto-apply role defaults
                  </label>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Access Matrix (Modules + Permissions)</label>
                    <div className="max-h-64 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
                      {MODULES.map((moduleName) => {
                        const modulePerms = MODULE_PERMISSION_MAP[moduleName] || [];
                        return (
                          <div key={moduleName} className="bg-white border border-slate-200 rounded-lg p-2">
                            <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-wide">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300 text-clinicPrimary focus:ring-clinicPrimary/20"
                                  checked={
                                    modulePerms.length
                                      ? modulePerms.some((p) => (formData.allowed_permissions || []).includes(p))
                                      : formData.allowed_menus?.includes(moduleName)
                                  }
                                onChange={(e) => syncPermissionFromModule(moduleName, e.target.checked)}
                              />
                              <span>{moduleName}</span>
                            </label>
                            {modulePerms.length ? (
                              <div className="mt-2 pl-5 space-y-1.5">
                                {modulePerms.map((permKey) => {
                                  const meta = PERMISSION_META[permKey] || { label: permKey };
                                  const restrictedRoles = PERMISSION_ROLE_RESTRICTIONS[permKey];
                                  const currentRole = String(formData.role || 'therapist').toLowerCase();
                                  const isRoleBlocked = restrictedRoles && !restrictedRoles.includes(currentRole);
                                  return (
                                    <label key={permKey} className={`flex items-start gap-1.5 text-[10px] font-semibold ${isRoleBlocked ? 'text-slate-400 opacity-60' : 'text-slate-700'}`}>
                                      <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-clinicPrimary focus:ring-clinicPrimary/20 disabled:opacity-40"
                                        checked={!isRoleBlocked && formData.allowed_permissions?.includes(permKey)}
                                        disabled={isRoleBlocked}
                                        onChange={(e) => syncModuleFromPermission(permKey, e.target.checked)}
                                      />
                                      <span>
                                        {meta.label}
                                        {isRoleBlocked
                                          ? <span className="block text-[9px] text-rose-400 font-medium">Only for {restrictedRoles.join('/')} roles</span>
                                          : meta.warn ? <span className="block text-[9px] text-slate-400 font-medium">{meta.warn}</span> : null}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="mt-2 pl-5 text-[10px] text-slate-400 font-medium">No granular permissions under this module.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="p-3.5 border-t border-slate-100 flex gap-2 justify-end bg-slate-50/50">
                  <Button variant="secondary" className="px-5 rounded-xl !text-xs" onClick={closeModal}>Cancel</Button>
                  <Button variant="primary" className="px-6 rounded-xl !text-xs" onClick={handleSave}>
                    {modalType === 'add' ? 'Save User' : 'Update User'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
