import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { FaSearch, FaBell, FaChevronDown, FaBars, FaEnvelopeOpenText, FaCog, FaSignOutAlt, FaGlobe, FaBookOpen, FaHeadset } from 'react-icons/fa';
import LanguageSwitcher from './LanguageSwitcher';
import NavbarSupportChat from './support/NavbarSupportChat';
import { fetchApi } from '../config/api';

const Navbar = ({ toggleSidebar, onLogout, userRole, allowedModules = [] }) => {
  const navigate = useNavigate();
  const { language } = useLanguage ? useLanguage() : { language: 'en' };
  const [activePanel, setActivePanel] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);
  const { 
    notifications, 
    messages, 
    unreadNotificationsCount, 
    unreadMessagesCount, 
    markNotificationAsRead, 
    markMessageAsRead, 
    markAllNotificationsAsRead, 
    markAllMessagesAsRead 
  } = useNotifications();

  // Periodic polling for SuperAdmin replies or pending support status
  useEffect(() => {
    const checkSupportUpdates = async () => {
      try {
        const isSuper = userRole?.toLowerCase() === 'superadmin';
        const endpoint = isSuper ? '/support/saas' : '/support/tenant';
        const res = await fetchApi(endpoint);
        if (res && res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const hasPending = isSuper
              ? data.data.some(t => t.status === 'Open')
              : data.data.some(t => t.status === 'Replied');
            setHasUnreadSupport(hasPending);
          }
        }
      } catch (_) {}
    };

    checkSupportUpdates();
    const interval = setInterval(checkSupportUpdates, 15000);
    return () => clearInterval(interval);
  }, [userRole]);

  const panelRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setActivePanel(null);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    if (activePanel || isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePanel, isProfileMenuOpen]);


  const [userData, setUserData] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('deephysio_user')) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem('deephysio_user'));
      if (user && user.id !== userData?.id) {
        setUserData(user);
      }
    } catch (e) {}
  }, [userRole, location]);

  const roleDisplay = {
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

  const togglePanel = (panel) => {
    setActivePanel(activePanel === panel ? null : panel);
    setIsProfileMenuOpen(false);
  };

  return (
    <header className="h-14 bg-slate-50/80 backdrop-blur-md px-2.5 sm:px-4 md:px-10 flex items-center justify-between sticky top-0 z-50 transition-all duration-300 border-b border-slate-200/50">
      <div className="flex items-center gap-2 sm:gap-6">
        <button 
          onClick={toggleSidebar}
          className="p-2 sm:p-2.5 text-slate-500 hover:text-clinicPrimary bg-white rounded-xl shadow-soft active:scale-95 transition-all border border-slate-100 hover:border-clinicPrimary/30 hover:shadow-google lg:hidden"
        >
          <FaBars size={17} />
        </button>
      </div>

      {/* Profile / Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 md:gap-6">
        {/* Multi-Language Dropdown Switcher */}
        <LanguageSwitcher />

        {/* How to Use Software / Guide Quick Link */}
        <button
          onClick={() => navigate('/guide')}
          title="How to Use Software (Manual & Guide)"
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <FaBookOpen className="text-amber-600" size={12} />
          <span className="hidden sm:inline">
            {language === 'hi' ? 'उपयोग गाइड' : 'How to Use'}
          </span>
        </button>

        {/* SuperAdmin Live Chat Support */}
        <button
          onClick={() => {
            setIsSupportChatOpen(true);
            setHasUnreadSupport(false);
          }}
          title={userRole === 'superadmin' ? "Support Desk (Tenant Queries)" : "Live SuperAdmin Chat Support"}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 group relative"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <FaHeadset className="text-emerald-600 group-hover:scale-110 transition-transform" size={12} />
          <span className="hidden sm:inline font-black">
            {userRole === 'superadmin'
              ? (language === 'hi' ? 'सपोर्ट डेस्क' : 'Support Desk')
              : (language === 'hi' ? 'सपोर्ट चैट' : 'Chat Support')}
          </span>
          {hasUnreadSupport && (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute -top-1 -right-1 ring-2 ring-white animate-bounce shadow-xs"></span>
          )}
        </button>

        <div ref={panelRef} className="flex items-center gap-1 md:gap-2 pr-1.5 sm:pr-3 md:pr-6 border-r border-slate-200 relative">
          <button 
            onClick={() => togglePanel('notifications')}
            className={`relative p-2 rounded-xl transition-all active:scale-90 shadow-soft border border-transparent ${activePanel === 'notifications' ? 'bg-white text-clinicPrimary border-slate-100' : 'text-slate-400 hover:text-clinicPrimary hover:bg-white hover:border-slate-100'}`}
          >
            <FaBell size={18} />
            {unreadNotificationsCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>}
          </button>

          {/* Activity Panels */}
          {activePanel && (
            <div className="absolute top-16 right-0 w-[calc(100vw-2.5rem)] max-w-sm sm:w-80 bg-white rounded-2xl shadow-google border border-slate-100 p-5 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-300 z-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest leading-none">{activePanel}</h3>
                <button 
                  onClick={() => {
                    activePanel === 'notifications' ? markAllNotificationsAsRead() : markAllMessagesAsRead();
                  }} 
                  className="text-[9px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
                >
                  Mark All Read
                </button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {(activePanel === 'notifications' ? notifications : messages).length === 0 ? (
                  <p className="text-[11px] text-slate-400 font-bold text-center py-4">No new {activePanel}</p>
                ) : (
                  (activePanel === 'notifications' ? notifications : messages).map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        if (activePanel === 'notifications') {
                          markNotificationAsRead(item.id);
                          setActivePanel(null);
                          navigate(item.link || '/');
                        } else {
                          markMessageAsRead(item.id);
                          setActivePanel(null);
                          
                          // Role-based routing logic for messages
                          let messageRoute = item.link || '/communication/sms';
                          if (userRole === 'therapist') {
                              messageRoute = '/communication/sms?filter=myPatients';
                          }
                          navigate(messageRoute);
                        }
                      }}
                      className={`flex gap-4 p-3 rounded-xl transition-all cursor-pointer group border ${item.read ? 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100' : 'bg-slate-50/80 border-slate-100 hover:bg-slate-100'}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-clinicPrimary/10 group-hover:scale-110 transition-all">
                        <div className={`w-2 h-2 rounded-full ${!item.read ? (activePanel === 'notifications' ? 'bg-clinicPrimary' : 'bg-amber-500') : 'bg-slate-200'}`}></div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] leading-tight truncate ${item.read ? 'font-semibold text-slate-600' : 'font-black text-slate-800'}`}>
                           {activePanel === 'notifications' ? item.title : item.sender}
                        </p>
                        <p className={`text-[10px] truncate mt-0.5 ${item.read ? 'text-slate-400 font-medium' : 'text-slate-600 font-bold'}`}>
                           {activePanel === 'notifications' ? item.message : item.text}
                        </p>
                        <p className="text-[9px] font-black text-slate-400 mt-1.5 uppercase tracking-widest">{item.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsProfileMenuOpen((prev) => !prev);
              setActivePanel(null);
            }}
            className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-2xl hover:bg-white hover:shadow-premium transition-all"
          >
            <div className="text-right hidden md:block">
              <p className="text-[12px] font-black text-slate-800 leading-none tracking-tight">{displayName}</p>
              <p className="text-[8px] font-extrabold text-clinicPrimary uppercase tracking-[0.15em] mt-1">{displayRole}</p>
            </div>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${displayColor} flex items-center justify-center font-black text-white text-[11px] shadow-md group-hover:rotate-3 transition-all ring-2 ring-white ring-offset-1 ring-offset-slate-50`}>
              {displayInitial}
            </div>
          </button>

          {/* Profile Dropdown */}
          <div className={`absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-google border border-slate-100 p-3 transition-all duration-200 origin-top-right ${isProfileMenuOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}`}>
            <div className="space-y-1">
              <button 
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  navigate(userRole === 'superadmin' ? '/superadmin/settings' : '/settings');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 hover:text-clinicPrimary transition-all"
              >
                <FaCog size={14} className="opacity-50" /> Account Settings
              </button>
              <div className="h-px bg-slate-50 my-2 mx-2"></div>
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-bold text-rose-500 hover:bg-rose-50 transition-all"
              >
                <FaSignOutAlt size={14} /> Logout Application
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SuperAdmin Live Support Chat Drawer */}
      <NavbarSupportChat
        isOpen={isSupportChatOpen}
        onClose={() => {
          setIsSupportChatOpen(false);
          setHasUnreadSupport(false);
        }}
        userRole={userRole}
      />
    </header>
  );
};

export default Navbar;
