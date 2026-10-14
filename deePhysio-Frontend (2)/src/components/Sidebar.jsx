import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FaChartPie, FaCalendarAlt, FaUserFriends, FaComments,
  FaFileInvoice, FaWpforms, FaChartLine, FaBullhorn, FaPuzzlePiece,
  FaCog, FaChevronDown, FaChevronRight, FaPlusCircle, FaHistory, FaUserShield,
  FaSms, FaEnvelopeOpenText, FaVideo, FaTools, FaStripe, FaPaypal,
  FaFileSignature, FaShieldAlt, FaDatabase, FaBell, FaHeartbeat, FaUsers,
  FaThLarge, FaClinicMedical, FaUserCircle, FaClipboardCheck, FaCommentDots,
  FaCreditCard, FaChartBar, FaBars, FaTimes, FaSignOutAlt, FaUserPlus, FaCalendarCheck, FaHourglassHalf, FaSync,
  FaCogs, FaHeadset, FaMoneyCheck
} from 'react-icons/fa';
import ClinicalNoteIcon from './ui/ClinicalNoteIcon';
import { ROLE_DEFAULTS, normalizeModule } from '../config/modules';
import { usePermissions } from '../context/PermissionContext';
import { fetchApi } from '../config/api';

import { cn } from './ui/Button';

const Sidebar = ({ isOpen, toggleSidebar, onLogout, userRole, userData: propUserData, allowedModules = [], isExpired }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { can, canAction } = usePermissions();

  // ── Clinic Branding from Settings ──
  const userTenantClinicName = propUserData?.tenant?.clinic_name || propUserData?.tenant?.clinicName || propUserData?.clinic_name || '';
  const [clinicLogo, setClinicLogo] = useState('');
  const [clinicName, setClinicName] = useState(userTenantClinicName || 'Healthcare Clinic');

  useEffect(() => {
    if (userTenantClinicName) {
      setClinicName(userTenantClinicName);
    }
  }, [userTenantClinicName]);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token || token === 'null') return;
        const res = await fetchApi('/public/config');
        if (!res?.ok) return;
        const json = await res.json();
        const profile = json?.data?.clinicProfile;
        if (profile?.logoDataUrl) setClinicLogo(profile.logoDataUrl);
        if (profile?.clinicName) {
          setClinicName(profile.clinicName);
        } else if (userTenantClinicName) {
          setClinicName(userTenantClinicName);
        }
      } catch (_) { /* silently fail */ }
    };
    loadBranding();
  }, [userTenantClinicName]);

  const actionByPath = {
    '/appointments': 'appointments.view',
    '/appointments/book': 'appointments.manage',
    '/appointments/checkin': 'appointments.view',
    '/appointments/waitlist': 'appointments.manage',
    '/patients': 'patient.basic',
    '/patients/add': 'patient.write',
    '/notes': 'notes.view',
    '/notes/new': 'notes.manage',
    '/notes/templates': 'notes.manage',
    '/billing': 'billing.view',
    '/billing/payments': 'billing.manage',
    '/billing/history': 'billing.view',
    '/billing/reminders': 'billing.manage',
    '/billing/pricing': 'settings.manage',
    '/settings/clinic': 'settings.manage',
    '/settings/whatsapp': 'settings.manage',
    '/settings/users': 'users.manage',
    '/settings/security': 'user.write',
    '/settings/backup': 'settings.manage',
    '/settings/notifications': 'settings.manage',
    '/settings/rooms': 'settings.manage',
    '/forms': 'forms.view',
    '/forms/builder': 'forms.manage',
    '/analytics': 'analytics.view'
  };

  const menuItems = [
    { name: 'Dashboard', icon: <FaThLarge className="text-sky-400" />, path: '/dashboard' },
    {
      name: 'Appointments',
      icon: <FaClinicMedical className="text-blue-400" />,
      path: '/appointments',
      subItems: [
        { name: 'Calendar View', path: '/appointments' },
        { name: 'Book Appointment', path: '/appointments/book' },
        { name: 'Check-in', path: '/appointments/checkin' },
        { name: 'Waitlist', path: '/appointments/waitlist' },
        // { name: 'Availability Blocks', path: '/appointments/availability' },
        // { name: 'Booking Settings', path: '/appointments/settings' },
      ]
    },
    {
      name: 'Patients',
      icon: <FaUserCircle className="text-indigo-400" />,
      path: '/patients',
      subItems: [
        { name: 'Patient List', path: '/patients' },
        { name: 'Add Patient', path: '/patients/add' },
      ]
    },
    {
      name: 'Clinical Notes',
      icon: <ClinicalNoteIcon className="text-cyan-500" size={28} />,
      path: '/notes',
      subItems: [
        { name: 'New Note', path: '/notes/new' },
        { name: 'All Notes', path: '/notes' },
        { name: 'Templates', path: '/notes/templates' },
      ]
    },
    {
      name: 'Communication',
      icon: <FaCommentDots className="text-emerald-500" />,
      path: '/communication',
      subItems: [
        { name: 'Announcements & Messages', path: '/communication' },
        { name: 'SMS Chat', path: '/communication/sms' },
        { name: 'Email Messages', path: '/communication/email' },
        { name: 'Bulk Messaging', path: '/communication/bulk' },
      ]
    },
    {
      name: 'Billing',
      icon: <FaCreditCard className="text-blue-600" />,
      path: '/billing',
      subItems: [
        { name: 'Invoices', path: '/billing' },
        { name: 'Payments', path: '/billing/payments' },
        { name: 'Payment History', path: '/billing/history' },
        // { name: 'Payment Reminders', path: '/billing/reminders' },
        { name: 'Pricing / Services', path: '/billing/pricing' },
        { name: 'Subscription Plans', path: '/plans' },
      ]
    },
    {
      name: 'Forms',
      icon: <ClinicalNoteIcon className="text-teal-500" size={28} />,
      path: '/forms',
      subItems: [
        { name: 'All Forms', path: '/forms' },
        { name: 'Create Form', path: '/forms/builder' },
      ]
    },
    {
      name: 'Analytics',
      icon: <FaChartBar className="text-indigo-500" />,
      path: '/analytics'
    },
    {
      name: 'Data Backup',
      icon: <FaDatabase className="text-cyan-500" />,
      path: '/backup'
    },
    // Super Admin Specific Menus
    { name: 'Admins', icon: <FaUserShield className="text-orange-500" />, path: '/superadmin/tenants' },
    { name: 'Payments', icon: <FaMoneyCheck className="text-blue-500" />, path: '/superadmin/revenue' },
    { name: 'Setting', icon: <FaCogs className="text-indigo-400" />, path: '/superadmin/settings' },
    { name: 'Audit Logs', icon: <FaHistory className="text-rose-500" />, path: '/audit' },
    { name: 'Support Tickets', icon: <FaHeadset className="text-slate-300" />, path: '/support' },

    // Therapist / Staff specific top-level menus
    { name: "Today's Appointments", icon: <FaCalendarAlt className="text-blue-400" />, path: '/appointments' },
    { name: 'My Patients', icon: <FaUserCircle className="text-indigo-400" />, path: '/patients' },
    { name: 'SOAP Notes', icon: <ClinicalNoteIcon className="text-cyan-500" size={28} />, path: '/notes' },
    { name: 'Treatment Plans', icon: <FaHeartbeat className="text-rose-400" />, path: '/notes' },
    { name: 'Exercise Plans', icon: <FaHeartbeat className="text-rose-500" />, path: '/notes' },
    { name: 'Messages', icon: <FaCommentDots className="text-sky-400" />, path: '/communication/sms' },
    { name: 'Patient Registration', icon: <FaUserPlus className="text-emerald-500" />, path: '/patients/add' },
    { name: 'Check-in', icon: <FaCalendarCheck className="text-blue-500" />, path: '/appointments/checkin' },
    { name: 'Check-out', icon: <FaCalendarCheck className="text-indigo-500" />, path: '/appointments/checkout' },
    { name: 'Waiting Queue', icon: <FaUsers className="text-amber-500" />, path: '/appointments/waitlist' },
    { name: 'Refunds', icon: <FaCreditCard className="text-rose-500" />, path: '/billing/refunds' },
    { name: 'Revenue', icon: <FaChartPie className="text-emerald-500" />, path: '/analytics' },
    { name: 'Payment Reports', icon: <FaChartBar className="text-indigo-500" />, path: '/analytics' },
    {
      name: 'Settings',
      icon: <FaCog className="text-slate-500" />,
      path: '/settings',
      subItems: [
        { name: 'General Settings', path: '/settings/clinic' },
        { name: 'WhatsApp Connectivity', path: '/settings/whatsapp' },
        { name: 'Currency & Regional', path: '/settings/currency' },
        { name: 'Email SMTP', path: '/settings/smtp' },
        { name: 'User Management', path: '/settings/users' },
        { name: 'Roles & Permissions', path: '/settings/roles' },
        { name: 'Security & Access', path: '/settings/security' },
        { name: 'Data Backup', path: '/settings/backup' },
        { name: 'Audit Logs', path: '/settings/audit' },
        { name: 'Notifications', path: '/settings/notifications' },
        { name: 'Room Settings', path: '/settings/rooms' },
      ]
    },
    { name: 'Profile', icon: <FaUserCircle className="text-slate-400" />, path: '/profile' }
  ];

  const normalizedRole = (userRole || 'therapist').toLowerCase();

  // For superadmin, always use full ROLE_DEFAULTS to avoid legacy DB limitations
  const menuAccess = normalizedRole === 'superadmin'
    ? (ROLE_DEFAULTS['superadmin'] || []).map(normalizeModule)
    : (normalizedRole === 'admin'
        ? [...new Set([...(allowedModules.length ? allowedModules : (ROLE_DEFAULTS.admin || [])), 'Data Backup', 'How to Use', 'Audit Logs'])].map(normalizeModule)
        : (allowedModules.length ? allowedModules : (ROLE_DEFAULTS[normalizedRole] || [])).map(normalizeModule));

  const filteredMenuItems = menuItems
    .filter(item => {
      // If expired, only allow essential SaaS pages
      if (isExpired) {
        const allowedExpiredMenus = ['Settings', 'Profile', 'Support', 'Support Tickets', 'Payments', 'Subscription Management', 'Plans & Pricing', 'How to Use', 'Audit Logs'];
        if (!allowedExpiredMenus.includes(item.name)) {
          return false;
        }
      }
      if (['How to Use', 'Support', 'Support Tickets', 'Profile', 'Audit Logs'].includes(item.name)) {
        return true;
      }
      return menuAccess.includes(normalizeModule(item.name));
    })
    .map((item) => {
      if (!item.subItems) return item;
      const subItems = item.subItems.filter((sub) => {
        const requiredPermission = actionByPath[sub.path];
        // If it's a legacy action (contains dot but not in modern list? no, let's just check)
        return !requiredPermission || can(requiredPermission) || canAction(requiredPermission);
      });
      return { ...item, subItems };
    })
    .filter((item) => !item.subItems || item.subItems.length > 0);

  const userData = useMemo(() => {
    if (propUserData) return propUserData;
    try {
      const user = sessionStorage.getItem('deephysio_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  }, [propUserData]);

  const roleDisplay = {
    superadmin: { label: 'Super Admin', color: 'from-purple-600 to-indigo-900' },
    admin: { label: 'Administrator', color: 'from-slate-800 to-slate-900' },
    therapist: { label: 'Therapist', color: 'from-clinicPrimary to-clinicPrimary-dark' },
    receptionist: { label: 'Receptionist', color: 'from-emerald-500 to-emerald-600' },
    billing: { label: 'Billing Staff', color: 'from-indigo-500 to-indigo-600' }
  };

  const currentConfig = roleDisplay[userRole] || roleDisplay.admin;

  const displayName = userData?.name || 'User';
  const displayRole = currentConfig.label;
  const displayInitial = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  const displayColor = currentConfig.color;

  const activeMenuName = (() => {
    const currentPath = location.pathname;
    const directMatch = filteredMenuItems.find((item) => item.path === currentPath && item.subItems);
    if (directMatch) return directMatch.name;
    const subMatch = filteredMenuItems.find((item) => item.subItems?.some((sub) => sub.path === currentPath));
    return subMatch?.name || null;
  })();

  const [manuallyCollapsed, setManuallyCollapsed] = useState(null);

  const closeSidebarOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && isOpen) {
      toggleSidebar();
    }
  };

  const handleToggleMenu = (menuName, path) => {
    if (activeMenuName === menuName && manuallyCollapsed !== menuName) {
      // Same menu clicked again → collapse it
      setManuallyCollapsed(menuName);
    } else {
      // Different menu or re-expanding → navigate and clear collapse
      setManuallyCollapsed(null);
      if (path) navigate(path);
    }
    closeSidebarOnMobile();
  };

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0 transition-all duration-500 ease-in-out bg-[#0f172a] text-slate-300 overflow-hidden flex flex-col shadow-2xl border-r border-slate-800/50",
      isOpen ? "translate-x-0 w-64 md:w-60" : "-translate-x-full md:w-16"
    )}>
      {/* Header / Logo Section - Vertical Layout */}
      <div className={cn(
        "relative flex px-4 py-5 border-b border-slate-800/50 bg-gradient-to-b from-slate-900/50 to-transparent shrink-0 transition-all overflow-hidden",
        isOpen ? "flex-col items-center pt-8 pb-6" : "items-center justify-center"
      )}>

        {/* Desktop Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={cn(
            "z-20 hidden lg:flex items-center justify-center text-slate-400 hover:text-white bg-slate-900/40 hover:bg-slate-800 transition-all active:scale-95",
            isOpen ? "absolute top-3 right-3 w-8 h-8 rounded-lg border border-slate-700/40" : "w-10 h-10 rounded-xl border border-slate-700/40 relative"
          )}
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          type="button"
        >
          {isOpen ? <FaChevronRight className="w-3.5 h-3.5 rotate-180" /> : <FaBars className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button (when drawer is open on mobile/tablet) */}
        {isOpen && (
          <button
            onClick={toggleSidebar}
            className="lg:hidden absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/80 rounded-lg border border-slate-700/60 active:scale-95 transition-all z-20"
            title="Close menu"
            type="button"
          >
            <FaTimes className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Branding Components */}
        <div className={cn(
          "flex flex-col items-center gap-3 transition-all duration-300",
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-90 w-0 h-0 hidden md:flex absolute"
        )}>
          {/* Flexible Master Logo */}
          <div className={cn(
            "flex items-center justify-center transition-all duration-300",
            "w-16 h-16 rounded-full overflow-hidden border-2 border-slate-700/70 bg-slate-900/90 p-2.5 shadow-[0_0_15px_rgba(45,212,191,0.2)] hover:border-teal-400/50"
          )}>
            <img
              src={clinicLogo || "/logo.png"}
              alt="Logo"
              className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Clinic Name Heading */}
          <h1 className="text-[11px] font-black tracking-wider uppercase text-center w-48 leading-tight px-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 drop-shadow-sm mt-2 notranslate" translate="no">
            {clinicName && clinicName !== 'DeePhysio Clinic' ? clinicName : 'Healthcare Clinic'}
          </h1>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        {filteredMenuItems.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = activeMenuName === item.name && manuallyCollapsed !== item.name;
          const isActive = location.pathname === item.path || (hasSubItems && item.subItems.some(sub => sub.path === location.pathname));

          return (
            <div key={item.name} className="space-y-1">
              {hasSubItems ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggleMenu(item.name, item.path);
                  }}
                  className={cn(
                    "w-full flex items-center px-3 py-2 rounded-lg transition-colors duration-200 group relative",
                    isActive
                      ? "bg-clinicPrimary/10 text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}
                >
                  <span className={cn(
                    "text-lg transition-transform duration-300",
                    isOpen ? "mr-3" : "mx-auto scale-110",
                    isActive ? "text-clinicPrimary" : "group-hover:text-clinicPrimary"
                  )}>
                    {item.icon}
                  </span>
                  <span className={cn(
                    "font-medium whitespace-nowrap transition-all duration-300 flex-1 text-left text-xs",
                    isOpen ? "opacity-100 translate-x-0" : "opacity-0 w-0 absolute -translate-x-4"
                  )}>
                    {item.name}
                  </span>
                  {isOpen && (
                    <FaChevronDown className={cn("w-3 h-3 text-slate-600 transition-transform duration-300", isExpanded ? "rotate-180 text-clinicPrimary" : "")} />
                  )}
                  {isActive && !isOpen && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-clinicPrimary rounded-r-full shadow-[0_0_10px_rgba(46,167,184,0.5)]" />
                  )}
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  onClick={closeSidebarOnMobile}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2 rounded-lg transition-colors duration-200 group relative",
                      isActive
                        ? "bg-slate-800 text-white shadow-none"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    )
                  }
                >
                  <span className={cn(
                    "text-lg transition-transform duration-300",
                    isOpen ? "mr-3" : "mx-auto scale-110",
                    isActive ? "text-clinicPrimary" : "group-hover:text-clinicPrimary"
                  )}>
                    {item.icon}
                  </span>
                  <span className={cn(
                    "font-medium whitespace-nowrap transition-all duration-300 text-xs",
                    isOpen ? "opacity-100 translate-x-0" : "opacity-0 w-0 absolute -translate-x-4"
                  )}>
                    {item.name}
                  </span>
                  {isActive && !isOpen && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                  )}
                </NavLink>
              )}

              {/* Submenu Items */}
              {hasSubItems && isExpanded && isOpen && (
                <div className="ml-8 space-y-0.5 mt-1 mb-2 border-l-2 border-slate-800/50 pl-2 animate-in slide-in-from-top-2 duration-300 text-[11px]">
                  {item.subItems.map((sub) => {
                    const requiredPermission = actionByPath[sub.path];
                    const isAllowed = !requiredPermission || can(requiredPermission) || canAction(requiredPermission);
                    if (!isAllowed) {
                      return (
                        <div
                          key={sub.name}
                          className="block px-3 py-1.5 rounded-md font-medium text-slate-600/60 cursor-not-allowed"
                          title="No access"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-700/60" />
                            {sub.name}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <NavLink
                        key={sub.name}
                        to={sub.path}
                        end
                        onClick={closeSidebarOnMobile}
                        className={({ isActive }) =>
                          cn(
                            "block px-3 py-1.5 rounded-md font-medium transition-colors duration-200 relative group/sub",
                            isActive
                              ? "text-clinicPrimary bg-clinicPrimary/5"
                              : "text-white hover:text-white hover:bg-slate-800/30"
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                            location.pathname === sub.path ? "bg-clinicPrimary scale-110" : "bg-slate-500 group-hover/sub:bg-slate-200"
                          )} />
                          {sub.name}
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer / Profile Section */}
      <div className={cn(
        "p-4 border-t border-slate-800/50 bg-gradient-to-t from-slate-900/50 to-transparent transition-all duration-500 shrink-0",
        isOpen ? "h-auto opacity-100" : "h-0 opacity-0 overflow-hidden"
      )}>
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${displayColor} flex items-center justify-center font-bold text-white shadow-lg group-hover:scale-110 transition-all duration-300`}>
            {displayInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold truncate text-white uppercase tracking-tight">{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]"></span>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Collapsed logout quick action */}
      {!isOpen && (
        <div className="hidden md:flex justify-center pb-3">
          <button
            onClick={onLogout}
            className="mt-3 w-10 h-10 rounded-xl text-slate-300 hover:text-red-300 hover:bg-red-400/15 transition-all flex items-center justify-center"
            title="Logout"
          >
            <FaSignOutAlt size={18} />
          </button>
        </div>
      )}
    </aside>

  );
};

export default Sidebar;
