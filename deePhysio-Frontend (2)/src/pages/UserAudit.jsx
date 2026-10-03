import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaChevronLeft, FaShieldAlt, FaHistory, FaDownload, FaSearch, 
  FaSyncAlt, FaUserShield, FaCheckCircle, 
  FaCalendarAlt, FaFileInvoiceDollar, FaUserCheck, FaFileAlt, 
  FaLock, FaCopy, FaCreditCard, FaUserPlus, FaCalendarPlus,
  FaKey, FaGlobeAmericas, FaSlidersH, FaHospital, FaBuilding,
  FaUserTie, FaUserMd, FaUsers, FaSignInAlt, FaDesktop, FaFilter,
  FaArrowRight
} from 'react-icons/fa';
import API_BASE_URL, { fetchApi } from '../config/api';

const UserAudit = () => {
  const navigate = useNavigate();
  
  // Current user & tenant context
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('deephysio_user') || localStorage.getItem('deephysio_user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const userRole = String(sessionStorage.getItem('deephysio_role') || currentUser?.role || '').toLowerCase();
  const isSuperAdmin = userRole === 'superadmin';
  const currentClinicName = currentUser?.tenant?.clinic_name || currentUser?.clinic_name || 'Healthcare Clinic';

  // State
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    totalLogins: 0,
    admin: { total: 0, logins: 0 },
    therapist: { total: 0, logins: 0 },
    receptionist: { total: 0, logins: 0 },
    billing: { total: 0, logins: 0 },
    superadmin: { total: 0, logins: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  
  // Active Role Tab: 'ALL', 'admin', 'therapist', 'receptionist', 'billing', 'superadmin'
  const [activeRoleTab, setActiveRoleTab] = useState('ALL');
  
  // Action Sub-Filter: 'ALL' or 'LOGIN'
  const [activeActionTab, setActiveActionTab] = useState('ALL');

  // Filters
  const [actionFilter, setActionFilter] = useState('ALL');
  const [tenantFilter, setTenantFilter] = useState('ALL'); // For superadmin
  const [tenantsList, setTenantsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Debounce search query so user typing automatically filters with no button needed
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch list of tenants if superadmin
  useEffect(() => {
    if (isSuperAdmin) {
      const fetchTenants = async () => {
        try {
          const res = await fetchApi('/audit-logs/tenants');
          const data = await res.json();
          if (data?.success && Array.isArray(data.data)) {
            setTenantsList(data.data);
          }
        } catch (err) {
          console.error('Failed to fetch tenants:', err);
        }
      };
      fetchTenants();
    }
  }, [isSuperAdmin]);

  // Fetch global/tenant stats
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const params = new URLSearchParams({
        ...(tenantFilter !== 'ALL' && isSuperAdmin ? { tenantId: tenantFilter } : {})
      });
      const res = await fetchApi(`/audit-logs/stats?${params.toString()}`);
      const data = await res.json();
      if (data?.success && data.data) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [tenantFilter]);

  // Main fetch logs function
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const effectiveAction = activeActionTab === 'LOGIN' ? 'LOGIN' : actionFilter;
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(effectiveAction !== 'ALL' ? { action: effectiveAction } : {}),
        ...(activeRoleTab !== 'ALL' ? { role: activeRoleTab } : {}),
        ...(tenantFilter !== 'ALL' && isSuperAdmin ? { tenantId: tenantFilter } : {}),
        ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {})
      });
      const res = await fetchApi(`/audit-logs?${queryParams.toString()}`);
      const data = await res.json();
      if (data?.success) {
        setLogs(data.data?.logs || []);
        setTotal(data.data?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, limit, activeRoleTab, activeActionTab, actionFilter, tenantFilter, debouncedSearch, startDate, endDate]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setActiveRoleTab('ALL');
    setActiveActionTab('ALL');
    setActionFilter('ALL');
    setTenantFilter('ALL');
    setSearchQuery('');
    setDebouncedSearch('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExportCsv = () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const effectiveAction = activeActionTab === 'LOGIN' ? 'LOGIN' : (actionFilter !== 'ALL' ? actionFilter : '');
    const params = new URLSearchParams({
      action: effectiveAction,
      role: activeRoleTab !== 'ALL' ? activeRoleTab : '',
      tenantId: tenantFilter !== 'ALL' && isSuperAdmin ? tenantFilter : '',
      search: searchQuery,
      startDate,
      endDate,
      token: token || ''
    });
    window.open(`${API_BASE_URL}/audit-logs/export?${params.toString()}`, '_blank');
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Format date readable
  const formatDateTime = (raw) => {
    if (!raw) return { date: '—', time: '' };
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return { date: String(raw), time: '' };
      
      const date = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      
      const time = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return { date, time };
    } catch (_) {
      return { date: String(raw), time: '' };
    }
  };

  // Role Badge Component with distinct styling
  const getRoleBadge = (role) => {
    const r = String(role || '').toLowerCase();
    switch (r) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
            <FaUserShield size={11} className="text-purple-600" />
            <span>Super Admin</span>
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <FaBuilding size={11} className="text-blue-600" />
            <span>Clinic Admin</span>
          </span>
        );
      case 'therapist':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200">
            <FaUserMd size={11} className="text-teal-600" />
            <span>Therapist</span>
          </span>
        );
      case 'billing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
            <FaCreditCard size={11} className="text-emerald-600" />
            <span>Billing Staff</span>
          </span>
        );
      case 'receptionist':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
            <FaUserTie size={11} className="text-amber-600" />
            <span>Receptionist</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
            <span>{role || 'System'}</span>
          </span>
        );
    }
  };

  const getActionBadge = (action, role) => {
    switch (action) {
      case 'LOGIN': {
        const r = String(role || '').toLowerCase();
        if (r === 'therapist') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-100/90 text-teal-800 border border-teal-300 text-xs font-bold shadow-2xs">
              <FaSignInAlt size={11} className="text-teal-600" />
              <span>Therapist Login</span>
            </span>
          );
        }
        if (r === 'receptionist') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/90 text-amber-800 border border-amber-300 text-xs font-bold shadow-2xs">
              <FaSignInAlt size={11} className="text-amber-600" />
              <span>Receptionist Login</span>
            </span>
          );
        }
        if (r === 'billing') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-2xs">
              <FaSignInAlt size={11} className="text-emerald-600" />
              <span>Billing Login</span>
            </span>
          );
        }
        if (r === 'superadmin') {
          return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100/90 text-purple-800 border border-purple-300 text-xs font-bold shadow-2xs">
              <FaSignInAlt size={11} className="text-purple-600" />
              <span>Super Admin Login</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100/90 text-blue-800 border border-blue-300 text-xs font-bold shadow-2xs">
            <FaSignInAlt size={11} className="text-blue-600" />
            <span>Admin Login</span>
          </span>
        );
      }
      case 'CREATE_PATIENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold">
            <FaUserPlus size={10} className="text-emerald-500" />
            <span>Add Patient</span>
          </span>
        );
      case 'UPDATE_PATIENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/70 text-xs font-semibold">
            <FaUserCheck size={10} className="text-teal-500" />
            <span>Update Patient</span>
          </span>
        );
      case 'CREATE_APPOINTMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/70 text-xs font-semibold">
            <FaCalendarPlus size={10} className="text-indigo-500" />
            <span>Book Appt</span>
          </span>
        );
      case 'UPDATE_APPOINTMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200/70 text-xs font-semibold">
            <FaCalendarAlt size={10} className="text-sky-500" />
            <span>Update Appt</span>
          </span>
        );
      case 'CREATE_INVOICE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/70 text-xs font-semibold">
            <FaFileInvoiceDollar size={10} className="text-amber-500" />
            <span>Create Invoice</span>
          </span>
        );
      case 'PAY_INVOICE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300/70 text-xs font-semibold">
            <FaCreditCard size={10} className="text-emerald-600" />
            <span>Payment</span>
          </span>
        );
      case 'CREATE_NOTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200/70 text-xs font-semibold">
            <FaFileAlt size={10} className="text-violet-500" />
            <span>Clinical Note</span>
          </span>
        );
      case 'UPDATE_SETTINGS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/70 text-xs font-semibold">
            <FaLock size={10} className="text-purple-500" />
            <span>Settings Change</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80 text-xs font-semibold">
            <span>{action}</span>
          </span>
        );
    }
  };

  const getTargetInfo = (log) => {
    if (log.target_type) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
          <span>{log.target_type}</span>
          {log.target_id && <span className="text-slate-400 font-mono">#{log.target_id}</span>}
        </span>
      );
    }

    const action = String(log.action || '');
    if (action === 'LOGIN') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 text-[11px] font-medium border border-blue-100">
          Auth Session
        </span>
      );
    }
    if (action.includes('APPOINTMENT')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50/80 text-indigo-600 text-[11px] font-medium border border-indigo-100">
          Appointment
        </span>
      );
    }
    if (action.includes('INVOICE') || action.includes('PAY')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50/80 text-emerald-600 text-[11px] font-medium border border-emerald-100">
          Billing Record
        </span>
      );
    }
    if (action.includes('PATIENT')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-50/80 text-teal-600 text-[11px] font-medium border border-teal-100">
          Patient File
        </span>
      );
    }
    if (action.includes('SETTINGS')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50/80 text-purple-600 text-[11px] font-medium border border-purple-100">
          System Config
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium">
        System
      </span>
    );
  };

  // Primary Role Tabs
  const roleTabs = [
    { 
      id: 'ALL', 
      label: 'All Staff Activity', 
      icon: FaUsers, 
      count: stats?.total || 0, 
      loginCount: stats?.totalLogins || 0,
      badgeColor: 'bg-slate-100 text-slate-700'
    },
    ...(isSuperAdmin ? [{ 
      id: 'admin', 
      label: 'Clinic Admin', 
      icon: FaBuilding, 
      count: stats?.admin?.total || 0, 
      loginCount: stats?.admin?.logins || 0,
      badgeColor: 'bg-blue-100 text-blue-700'
    }] : []),
    { 
      id: 'therapist', 
      label: 'Therapist', 
      icon: FaUserMd, 
      count: stats?.therapist?.total || 0, 
      loginCount: stats?.therapist?.logins || 0,
      badgeColor: 'bg-teal-100 text-teal-700'
    },
    { 
      id: 'receptionist', 
      label: 'Receptionist', 
      icon: FaUserTie, 
      count: stats?.receptionist?.total || 0, 
      loginCount: stats?.receptionist?.logins || 0,
      badgeColor: 'bg-amber-100 text-amber-700'
    },
    { 
      id: 'billing', 
      label: 'Billing Staff', 
      icon: FaCreditCard, 
      count: stats?.billing?.total || 0, 
      loginCount: stats?.billing?.logins || 0,
      badgeColor: 'bg-emerald-100 text-emerald-700'
    },
    ...(isSuperAdmin ? [{ 
      id: 'superadmin', 
      label: 'Super Admin', 
      icon: FaUserShield, 
      count: stats?.superadmin?.total || 0, 
      loginCount: stats?.superadmin?.logins || 0,
      badgeColor: 'bg-purple-100 text-purple-700'
    }] : [])
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 py-8 animate-fade-in">
      {/* ── TOP BREADCRUMB & HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-clinicPrimary transition-colors font-bold text-xs uppercase tracking-wider"
          >
            <FaChevronLeft size={10} /> Back
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-clinicPrimary/10 text-clinicPrimary flex items-center justify-center font-bold shadow-xs">
              <FaShieldAlt size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Audit Logs & Role Activity
                </h1>
                {isSuperAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold text-[11px] border border-purple-200">
                    👑 Super Admin Console
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold text-[11px] border border-blue-200 flex items-center gap-1">
                    <FaLock size={9} /> Scoped Clinic Admin
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-500">
                Separate activity logs and login sessions for Admin, Therapist, Receptionist, and Billing staff.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => { fetchLogs(); fetchStats(); }}
            disabled={loading}
            className="px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95"
            title="Refresh logs from server"
          >
            <FaSyncAlt size={12} className={loading ? 'animate-spin text-clinicPrimary' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            title="Export filtered logs to CSV spreadsheet"
          >
            <FaDownload size={12} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── CLINIC / TENANT ISOLATION BAR ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#175C66] via-[#1E7480] to-clinicPrimary text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-teal-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg shrink-0 border border-white/20 shadow-xs">
            <FaHospital size={18} className="text-white" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-teal-100 flex items-center gap-1.5">
              <span>Tenant Clinic Isolation</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="text-base font-black text-white">
              {isSuperAdmin ? (
                <span>Global Multi-Clinic Network Access</span>
              ) : (
                <span>{currentClinicName} (Your Clinic)</span>
              )}
            </div>
            <div className="text-xs text-teal-100/90 font-medium">
              {isSuperAdmin ? (
                'Filter audit logs by specific clinic below or inspect company-wide staff authentications.'
              ) : (
                'Separate & Secure: Showing only this clinic\'s Therapist, Receptionist, and Billing staff.'
              )}
            </div>
          </div>
        </div>

        {/* Superadmin Tenant Dropdown Selector */}
        {isSuperAdmin && (
          <div className="flex items-center gap-2 bg-white/15 p-2 rounded-xl backdrop-blur-sm border border-white/20">
            <span className="text-xs font-bold text-white whitespace-nowrap pl-1">
              Select Clinic:
            </span>
            <select
              value={tenantFilter}
              onChange={(e) => {
                setTenantFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-teal-900/80 text-white border border-teal-400/40 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-white"
            >
              <option value="ALL">🌐 All Clinics / Admins</option>
              {tenantsList.map((t) => (
                <option key={t.id} value={t.id}>
                  🏥 {t.clinic_name} (ID: {t.id})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── 4 SEPARATE ROLE METRIC STAT CARDS (REAL DATABASE COUNTS) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. All Staff / Clinic Admin Card */}
        {isSuperAdmin ? (
          <div 
            onClick={() => { setActiveRoleTab('admin'); setPage(1); }}
            className={`p-4 rounded-2xl cursor-pointer transition-all border ${
              activeRoleTab === 'admin'
                ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-400/40 shadow-sm'
                : 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <FaBuilding size={18} />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[11px]">
                {stats?.admin?.logins || 0} Logins
              </span>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Clinic Admin</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{stats?.admin?.total || 0}</span>
              <span className="text-xs text-slate-500 font-medium">total events</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-600 font-bold flex items-center gap-1">
              <span>View Admin Logs</span>
              <FaArrowRight size={9} />
            </div>
          </div>
        ) : (
          <div 
            onClick={() => { setActiveRoleTab('ALL'); setPage(1); }}
            className={`p-4 rounded-2xl cursor-pointer transition-all border ${
              activeRoleTab === 'ALL'
                ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-400/40 shadow-sm'
                : 'bg-white border-slate-200/80 hover:border-blue-300 hover:shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <FaUsers size={18} />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[11px]">
                {stats?.totalLogins || 0} Logins
              </span>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">All Staff Activity</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-black text-slate-900">{stats?.total || 0}</span>
              <span className="text-xs text-slate-500 font-medium">total events</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-600 font-bold flex items-center gap-1">
              <span>View All Staff Logs</span>
              <FaArrowRight size={9} />
            </div>
          </div>
        )}

        {/* 2. Therapist Card */}
        <div 
          onClick={() => { setActiveRoleTab('therapist'); setPage(1); }}
          className={`p-4 rounded-2xl cursor-pointer transition-all border ${
            activeRoleTab === 'therapist'
              ? 'bg-teal-50/90 border-teal-400 ring-2 ring-teal-400/40 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-teal-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <FaUserMd size={18} />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-extrabold text-[11px]">
              {stats?.therapist?.logins || 0} Logins
            </span>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Therapist Staff</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-900">{stats?.therapist?.total || 0}</span>
            <span className="text-xs text-slate-500 font-medium">total events</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-600 font-bold flex items-center gap-1">
            <span>View Therapist Logs</span>
            <FaArrowRight size={9} />
          </div>
        </div>

        {/* 3. Receptionist Card */}
        <div 
          onClick={() => { setActiveRoleTab('receptionist'); setPage(1); }}
          className={`p-4 rounded-2xl cursor-pointer transition-all border ${
            activeRoleTab === 'receptionist'
              ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-amber-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <FaUserTie size={18} />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[11px]">
              {stats?.receptionist?.logins || 0} Logins
            </span>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Receptionist Staff</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-900">{stats?.receptionist?.total || 0}</span>
            <span className="text-xs text-slate-500 font-medium">total events</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-600 font-bold flex items-center gap-1">
            <span>View Receptionist Logs</span>
            <FaArrowRight size={9} />
          </div>
        </div>

        {/* 4. Billing Staff Card */}
        <div 
          onClick={() => { setActiveRoleTab('billing'); setPage(1); }}
          className={`p-4 rounded-2xl cursor-pointer transition-all border ${
            activeRoleTab === 'billing'
              ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-400/40 shadow-sm'
              : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FaCreditCard size={18} />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
              {stats?.billing?.logins || 0} Logins
            </span>
          </div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Billing Staff</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-slate-900">{stats?.billing?.total || 0}</span>
            <span className="text-xs text-slate-500 font-medium">total events</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <span>View Billing Logs</span>
            <FaArrowRight size={9} />
          </div>
        </div>
      </div>

      {/* ── SEPARATE ROLE NAVIGATION TABS (ADMIN, THERAPIST, RECEPTIONIST, BILLING) ── */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Main Role Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {roleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeRoleTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveRoleTab(tab.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-clinicPrimary text-white shadow-sm ring-2 ring-clinicPrimary/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Icon size={13} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/20 text-white' : tab.badgeColor
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sub-View Toggle: All Events vs Logins Only */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              onClick={() => {
                setActiveActionTab('ALL');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeActionTab === 'ALL'
                  ? 'bg-clinicPrimary text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FaHistory size={11} />
              <span>All Activity</span>
            </button>
            <button
              onClick={() => {
                setActiveActionTab('LOGIN');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeActionTab === 'LOGIN'
                  ? 'bg-clinicPrimary text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FaSignInAlt size={11} />
              <span>🔑 Logins Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── ACTIVE ROLE CONTEXT BANNER ── */}
      {activeRoleTab !== 'ALL' && (
        <div className="p-3 px-4 rounded-xl bg-clinicPrimary-light/60 border border-clinicPrimary/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-clinicPrimary-dark uppercase tracking-wide">Active Role View:</span>
            {getRoleBadge(activeRoleTab)}
            <span className="text-slate-600 font-medium">
              — Displaying logs strictly for <span className="font-bold text-slate-800 capitalize">{activeRoleTab}</span> staff members
            </span>
          </div>
          <button
            onClick={() => {
              setActiveRoleTab('ALL');
              setPage(1);
            }}
            className="text-clinicPrimary hover:underline font-bold text-xs flex items-center gap-1"
          >
            Show All Roles <FaArrowRight size={10} />
          </button>
        </div>
      )}

      {/* ── FILTER & SEARCH BAR (AUTO-APPLYING, NO OVERLAPPING BUTTONS) ── */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <FaSearch className="absolute left-3.5 top-3.5 text-slate-400" size={13} />
            <input 
              type="text"
              placeholder="Search staff, email, details, IP address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-clinicPrimary/40 focus:border-clinicPrimary focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-1 text-xs"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div className="w-full sm:w-56">
            <select
              value={actionFilter}
              disabled={activeActionTab === 'LOGIN'}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-clinicPrimary/40 focus:border-clinicPrimary focus:bg-white transition-all disabled:opacity-50"
            >
              <option value="ALL">All Event Actions</option>
              <option value="LOGIN">Staff Logins / Auth</option>
              <option value="CREATE_PATIENT">Add Patient</option>
              <option value="UPDATE_PATIENT">Update Patient</option>
              <option value="CREATE_APPOINTMENT">Book Appointment</option>
              <option value="UPDATE_APPOINTMENT">Update Appointment</option>
              <option value="CREATE_NOTE">Clinical Notes</option>
              <option value="CREATE_INVOICE">Invoices</option>
              <option value="PAY_INVOICE">Payments Recorded</option>
              <option value="UPDATE_SETTINGS">Settings Changes</option>
            </select>
          </div>

          {/* Date Range Pickers */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date:</span>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              title="Start Date"
              className="bg-transparent border-0 text-xs font-medium text-slate-700 focus:outline-none py-1"
            />
            <span className="text-slate-400 text-xs font-semibold">to</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              title="End Date"
              className="bg-transparent border-0 text-xs font-medium text-slate-700 focus:outline-none py-1"
            />
          </div>

          {/* Clean Reset Button (Only shows when filters are active) */}
          {(searchQuery || actionFilter !== 'ALL' || startDate || endDate) && (
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset all search & date filters"
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
            >
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── AUDIT LOG TABLE ── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
              {activeActionTab === 'LOGIN' ? 'Staff Login Sessions' : 'Audit Trail Records'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-mono text-[11px] font-bold">
              {total} Total
            </span>
            {activeRoleTab !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                Role: {activeRoleTab}
              </span>
            )}
            {tenantFilter !== 'ALL' && isSuperAdmin && (
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold text-[10px]">
                Clinic ID: {tenantFilter}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <span className="font-semibold text-slate-600">
              Page {page} of {Math.max(1, Math.ceil(total / limit))}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 text-[11px]">
              <tr>
                <th className="px-4 py-3.5 w-16 text-center">ID</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Timestamp</th>
                <th className="px-5 py-3.5">Staff & Email</th>
                <th className="px-4 py-3.5 text-center">Role</th>
                {isSuperAdmin && <th className="px-4 py-3.5">Clinic</th>}
                <th className="px-5 py-3.5">Action Event</th>
                <th className="px-4 py-3.5">Target</th>
                <th className="px-6 py-3.5">Details</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 9 : 8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-7 h-7 border-2 border-clinicPrimary/20 border-t-clinicPrimary rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Loading audit trail...</p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 9 : 8} className="px-6 py-16 text-center text-slate-400 font-medium">
                    <div className="max-w-xs mx-auto space-y-2">
                      <FaHistory size={24} className="mx-auto text-slate-300" />
                      <p className="font-bold text-slate-600">No event records found</p>
                      <p className="text-[11px] text-slate-400">
                        {activeRoleTab !== 'ALL' 
                          ? `No activity logs found for ${activeRoleTab} role.` 
                          : 'Try adjusting your search query, action filter, or date range.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const rawDate = log.createdAt || log.created_at || log.timestamp;
                  const { date: dateStr, time: timeStr } = formatDateTime(rawDate);
                  const userName = log.user?.name || 'System';
                  const userEmail = log.user?.email || '—';
                  const userRole = log.user?.role || log.meta?.role || 'system';
                  const isLogin = log.action === 'LOGIN';
                  const clinicName = log.tenant?.clinic_name || (log.user?.tenant_id ? `Clinic #${log.user.tenant_id}` : 'Global / Admin');

                  return (
                    <tr 
                      key={log.id} 
                      className={`group hover:bg-slate-50/80 transition-colors ${
                        isLogin ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* ID Column */}
                      <td className="px-4 py-3.5 text-center font-mono text-[11px] font-semibold text-slate-400">
                        #{log.id}
                      </td>

                      {/* Timestamp Column */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 text-xs">{dateStr}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{timeStr}</div>
                      </td>

                      {/* Staff & Email Column */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 uppercase shadow-2xs ${
                            userRole === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                            userRole === 'therapist' ? 'bg-teal-100 text-teal-700 border-teal-200' :
                            userRole === 'receptionist' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            userRole === 'billing' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            userRole === 'superadmin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {userName.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate max-w-[150px]">
                              {userName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal truncate max-w-[170px]" title={userEmail}>
                              {userEmail}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {getRoleBadge(userRole)}
                      </td>

                      {/* Clinic / Tenant Column (For Super Admin) */}
                      {isSuperAdmin && (
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 max-w-[130px] truncate" title={clinicName}>
                            <FaHospital size={10} className="text-slate-400 shrink-0" />
                            <span className="truncate">{clinicName}</span>
                          </span>
                        </td>
                      )}

                      {/* Action Event Column */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {getActionBadge(log.action, userRole)}
                      </td>

                      {/* Target Column */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getTargetInfo(log)}
                      </td>

                      {/* Details Column */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-between gap-2 max-w-md">
                          <span className="font-normal text-slate-700 break-words leading-relaxed text-xs">
                            {log.details || '—'}
                          </span>
                          {log.details && (
                            <button
                              onClick={() => handleCopy(log.details, log.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 transition-all shrink-0"
                              title="Copy details"
                            >
                              {copiedId === log.id ? (
                                <FaCheckCircle size={12} className="text-emerald-500" />
                              ) : (
                                <FaCopy size={12} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* IP Address Column */}
                      <td className="px-5 py-3.5 text-right font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100/90 text-slate-600 font-mono text-[11px] border border-slate-200/70 inline-block font-medium">
                          {log.ip_address || '127.0.0.1'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION CONTROLS ── */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3 text-xs">
          <div className="text-slate-500 text-[11px]">
            Showing <span className="font-bold text-slate-800">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-slate-800">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-bold text-slate-800">{total}</span> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1 || loading}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              First
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 bg-clinicPrimary/10 text-clinicPrimary font-bold rounded-lg text-xs">
              {page} / {Math.max(1, Math.ceil(total / limit))}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / limit) || loading}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
            <button
              onClick={() => setPage(Math.ceil(total / limit))}
              disabled={page >= Math.ceil(total / limit) || loading}
              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAudit;
