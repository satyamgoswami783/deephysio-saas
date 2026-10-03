import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUser, FaEnvelope, FaPhone, FaShieldAlt, FaKey, 
  FaClinicMedical, FaCheckCircle, FaLock, FaEye, FaEyeSlash,
  FaSave, FaArrowLeft, FaIdBadge, FaCalendarAlt, FaLayerGroup,
  FaCheck
} from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';

const UserProfile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'security' | 'permissions'
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // User Data State
  const [user, setUser] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    role: '',
    status: 'Active',
    created_at: '',
    allowed_permissions: [],
    allowed_menus: []
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Clinic Profile State
  const [clinicName, setClinicName] = useState('Healthcare Clinic');

  // Load User Data & Clinic Info
  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      setLoading(true);
      try {
        // 1. Check local session storage first
        let sessionUser = null;
        try {
          const raw = sessionStorage.getItem('deephysio_user');
          if (raw) sessionUser = JSON.parse(raw);
        } catch (_) {}

        if (sessionUser && isMounted) {
          setUser(prev => ({ ...prev, ...sessionUser }));
          setProfileForm({
            name: sessionUser.name || '',
            email: sessionUser.email || '',
            phone: sessionUser.phone || sessionUser.mobile || ''
          });
        }

        // 2. Fetch fresh user data from API /users/me
        const res = await fetchApi('/users/me');
        if (res && res.ok) {
          const json = await res.json();
          if (json?.success && json?.data && isMounted) {
            const data = json.data;
            setUser(data);
            setProfileForm({
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || data.mobile || ''
            });

            // Update session storage with latest info
            try {
              sessionStorage.setItem('deephysio_user', JSON.stringify({
                ...(sessionUser || {}),
                ...data
              }));
            } catch (_) {}
          }
        }

        // 3. Fetch Clinic Profile branding
        const cfgRes = await fetchApi('/public/config');
        if (cfgRes && cfgRes.ok) {
          const cfgJson = await cfgRes.json();
          if (cfgJson?.data?.clinicProfile?.clinicName && isMounted) {
            setClinicName(cfgJson.data.clinicProfile.clinicName);
          }
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showToast('Name is required.', 'error');
      return;
    }
    if (!profileForm.email.trim()) {
      showToast('Email is required.', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      const payload = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim()
      };

      // Call update endpoint
      if (user.id) {
        const res = await fetchApi(`/users/${user.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        if (res && res.ok) {
          const json = await res.json();
          if (json?.success) {
            const updatedUser = {
              ...user,
              ...payload
            };
            setUser(updatedUser);
            sessionStorage.setItem('deephysio_user', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('storage'));
            showToast('Profile updated successfully!', 'success');
            return;
          }
        }
      }

      // Fallback: update local session
      const updatedUser = {
        ...user,
        ...payload
      };
      setUser(updatedUser);
      sessionStorage.setItem('deephysio_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));
      showToast('Profile updated successfully!', 'success');

    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      showToast('Please enter your current password.', 'error');
      return;
    }
    if (!passwordForm.newPassword) {
      showToast('Please enter a new password.', 'error');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetchApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (!res) {
        showToast('Network error while changing password.', 'error');
        return;
      }

      const json = await res.json();
      if (!res.ok || !json?.success) {
        showToast(json?.message || 'Failed to change password. Please check your current password.', 'error');
        return;
      }

      showToast('Password updated successfully! Please keep it secure.', 'success');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      showToast(err.message || 'Failed to change password.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  // Role display configuration
  const roleDisplay = {
    superadmin: { label: 'Super Admin', color: 'from-purple-600 to-indigo-800', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
    admin: { label: 'Clinic Administrator', color: 'from-slate-800 to-slate-900', badge: 'bg-slate-100 text-slate-800 border-slate-200' },
    therapist: { label: 'Physical Therapist', color: 'from-clinicPrimary to-clinicPrimary-dark', badge: 'bg-teal-50 text-teal-800 border-teal-200' },
    receptionist: { label: 'Front Desk Receptionist', color: 'from-emerald-500 to-emerald-600', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    billing: { label: 'Billing & Finance Officer', color: 'from-indigo-500 to-indigo-600', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200' }
  };

  const normalizedRole = (user.role || '').toLowerCase();
  const currentRoleCfg = roleDisplay[normalizedRole] || {
    label: user.role || 'Administrator',
    color: 'from-slate-800 to-slate-900',
    badge: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  const initials = (user.name || 'User')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || 'U';

  const memberSinceFormatted = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '2026';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans animate-fade-in">
      
      {/* ── TOP BREADCRUMB & HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-clinicPrimary hover:border-clinicPrimary/40 flex items-center justify-center transition-all active:scale-95 shadow-xs"
            title="Back to Dashboard"
          >
            <FaArrowLeft size={13} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-clinicPrimary/10 text-clinicPrimary border border-clinicPrimary/20">
                <FaIdBadge size={10} /> Account Profile
              </span>
              <span className="text-xs text-slate-400 font-semibold">• User Details</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              My Profile & Credentials
            </h1>
          </div>
        </div>

        {/* Clinic Affiliation Badge */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-soft">
          <FaClinicMedical className="text-clinicPrimary" size={14} />
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">Organization</p>
            <p className="text-xs font-black text-slate-800 leading-tight mt-0.5 notranslate" translate="no">
              {clinicName}
            </p>
          </div>
        </div>
      </div>

      {/* ── PROFILE HERO CARD ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-clinicPrimary/5 to-transparent pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar Badge */}
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${currentRoleCfg.color} flex items-center justify-center font-black text-white text-2xl shadow-lg ring-4 ring-white shrink-0`}>
            {initials}
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {user.name || 'User Profile'}
              </h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border self-center sm:self-auto ${currentRoleCfg.badge}`}>
                {currentRoleCfg.label}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-center sm:self-auto">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Account
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <FaEnvelope className="text-slate-400" size={12} />
                {user.email || 'No email attached'}
              </span>
              {user.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <FaPhone className="text-slate-400" size={12} />
                  {user.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <FaCalendarAlt className="text-slate-400" size={12} />
                Member since {memberSinceFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'general'
                ? 'bg-clinicPrimary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FaUser size={11} /> Personal Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'bg-clinicPrimary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FaShieldAlt size={11} /> Password & Security
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-clinicPrimary text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FaLayerGroup size={11} /> Role Privileges
          </button>
        </div>
      </div>

      {/* ── TAB 1: PERSONAL INFORMATION ── */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Edit Personal Details</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Update your contact details and identity information visible to patients and clinic staff.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                      type="text"
                      required
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary transition-all"
                      placeholder="e.g. Dr. John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary transition-all"
                      placeholder="user@healthcareclinic.com"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    Phone / Mobile Number
                  </label>
                  <div className="relative">
                    <FaPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary transition-all"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    Assigned Role <span className="text-slate-400 font-normal">(System Controlled)</span>
                  </label>
                  <div className="relative">
                    <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                      type="text"
                      disabled
                      value={currentRoleCfg.label}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-clinicPrimary hover:bg-clinicPrimary-dark text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-soft hover:shadow-google active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  <FaSave size={12} />
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Account Overview Sidebar Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FaClinicMedical className="text-clinicPrimary" size={13} />
                Clinic Information
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Clinic Name</p>
                  <p className="font-bold text-slate-800 notranslate" translate="no">{clinicName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Account Status</p>
                  <p className="font-bold text-emerald-600 flex items-center gap-1.5">
                    <FaCheckCircle size={11} /> Verified & Active
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tenant ID</p>
                  <p className="font-mono text-[11px] text-slate-600">
                    {user.tenant_id ? `TENANT-#${user.tenant_id}` : 'Global Master Admin'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 space-y-3 shadow-lg">
              <div className="flex items-center gap-2 text-teal-400 text-xs font-black uppercase tracking-wider">
                <FaShieldAlt size={13} /> Secure Enterprise Cloud
              </div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                Your account is protected under strict role-based access control and encrypted token authentication.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: SECURITY & PASSWORD ── */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Change Password</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Ensure your account is using a long, random password to stay secure.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FaKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary transition-all"
                    placeholder="Enter existing password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPass ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary transition-all"
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary transition-all"
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPass ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-soft hover:shadow-google active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  <FaKey size={12} />
                  {changingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FaShieldAlt className="text-emerald-500" size={13} /> Security Recommendations
              </h4>
              <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside font-medium">
                <li>Use at least 8 characters with a mix of letters and numbers.</li>
                <li>Do not reuse passwords across multiple clinic platforms.</li>
                <li>Never share your credentials with unauthorized personnel.</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-5 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FaLock className="text-clinicPrimary" size={13} /> Session Policy
              </h4>
              <p className="text-xs text-slate-500 font-medium">
                Session idle timeout is configured to 60 minutes for high patient confidentiality and medical compliance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: ROLE PRIVILEGES ── */}
      {activeTab === 'permissions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-soft p-6 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Active Role Capabilities</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Below is the matrix of modules and administrative permissions granted to your role ({currentRoleCfg.label}).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { name: 'Dashboard & Business Overview', enabled: true },
              { name: 'Patient Medical Records', enabled: ['superadmin', 'admin', 'therapist', 'receptionist'].includes(normalizedRole) },
              { name: 'Appointment Scheduling & Calendar', enabled: ['superadmin', 'admin', 'therapist', 'receptionist'].includes(normalizedRole) },
              { name: 'Clinical SOAP Notes & Care Plans', enabled: ['superadmin', 'admin', 'therapist'].includes(normalizedRole) },
              { name: 'Billing, Invoices & Payments', enabled: ['superadmin', 'admin', 'billing'].includes(normalizedRole) },
              { name: 'Clinic Management Settings', enabled: ['superadmin', 'admin'].includes(normalizedRole) },
              { name: 'Analytics & Financial Reporting', enabled: ['superadmin', 'admin', 'billing'].includes(normalizedRole) },
              { name: 'Audit Logs & Security Controls', enabled: ['superadmin', 'admin'].includes(normalizedRole) },
              { name: 'Data Backup & System Recovery', enabled: ['superadmin', 'admin'].includes(normalizedRole) }
            ].map((perm, idx) => (
              <div 
                key={idx}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  perm.enabled 
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <span>{perm.name}</span>
                {perm.enabled ? (
                  <span className="flex items-center gap-1 text-emerald-600 shrink-0 font-extrabold text-[11px]">
                    <FaCheck size={10} /> Authorized
                  </span>
                ) : (
                  <span className="text-slate-400 text-[10px] shrink-0">
                    Restricted
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default UserProfile;
