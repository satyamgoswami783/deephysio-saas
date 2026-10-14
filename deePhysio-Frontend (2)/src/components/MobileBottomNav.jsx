import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaThLarge, FaCalendarAlt, FaUserFriends, FaFileInvoice, FaBars } from 'react-icons/fa';

export const MobileBottomNav = ({ toggleSidebar, allowedModules = [] }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FaThLarge },
    { name: 'Schedule', path: '/appointments', icon: FaCalendarAlt },
    { name: 'Patients', path: '/patients', icon: FaUserFriends },
    { name: 'Billing', path: '/billing', icon: FaFileInvoice }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${
                isActive
                  ? 'text-clinicPrimary font-black scale-105'
                  : 'text-slate-400 font-semibold hover:text-slate-600'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-clinicPrimary' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight">{item.name}</span>
            </NavLink>
          );
        })}

        {/* Menu / Drawer Toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 font-semibold hover:text-slate-700 active:scale-95 transition-all"
        >
          <FaBars className="w-4 h-4 mb-0.5 text-slate-500" />
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
