import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import ErrorBoundary from '../components/ErrorBoundary';
import { cn } from '../components/ui/Button';
import { AnimatePresence, motion } from 'framer-motion';

const MainLayout = ({ onLogout, userRole, setUserRole, userData, allowedModules = [] }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const isCheckinFullMode =
    location.pathname === '/appointments/checkin' &&
    new URLSearchParams(location.search).get('mode') === 'full';

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const tenant = userData?.tenant;
  const isTrial = userData?.subscription_status === 'trial' || 
    tenant?.subscription_status === 'trial' || 
    (tenant?.plan && tenant.plan.toLowerCase().includes('trial')) ||
    (userData?.plan && userData.plan.toLowerCase().includes('trial'));

  const calculateRemainingDays = () => {
    if (!isTrial) return 0;
    const createdAtStr = tenant?.created_at || userData?.created_at;
    if (!createdAtStr) return 7;
    const createdAt = new Date(createdAtStr);
    const now = new Date();
    const startOfCreated = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
    const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.max(0, Math.floor((startOfNow.getTime() - startOfCreated.getTime()) / (1000 * 60 * 60 * 24)));
    return Math.max(0, 7 - diffDays);
  };

  const daysRemaining = calculateRemainingDays();
  const trialExpiryDate = (tenant?.created_at || userData?.created_at)
    ? new Date(new Date(tenant?.created_at || userData?.created_at).getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;
  
  // Determine if tenant is expired
  const isExpired = userData?.role !== 'superadmin' && (
    userData?.subscription_status === 'expired' || 
    userData?.subscription_status === 'canceled' || 
    (isTrial && daysRemaining <= 0)
  );

  // Allow essential paths even when expired
  const isAllowedPathWhenExpired = ['/settings', '/support', '/profile', '/billing'].some(p => location.pathname.startsWith(p));

  if (isCheckinFullMode) {
    return (
      <div className="h-[100dvh] bg-slate-50 overflow-hidden relative">
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/appointments/checkin');
              }
            }}
            className="h-9 px-4 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:text-clinicPrimary hover:border-clinicPrimary/40 transition-all"
          >
            Exit Full Mode
          </button>
        </div>
        <main className="h-full overflow-y-auto custom-scrollbar">
          <ErrorBoundary>
            <React.Suspense fallback={
              <div className="flex-1 flex items-center justify-center min-h-[300px]">
                <div className="w-7 h-7 border-2 border-clinicPrimary/20 border-t-clinicPrimary rounded-full animate-spin"></div>
              </div>
            }>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="min-h-full"
              >
                <Outlet />
              </motion.div>
            </React.Suspense>
          </ErrorBoundary>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden relative">
      {/* Mobile Sidebar Overlay - Only blocks if sidebar is open in mobile mode */}
      <div
        className={cn(
          "fixed inset-0 bg-slate-900/50 z-[5] md:hidden transition-all duration-300",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={toggleSidebar}
      />

      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} onLogout={onLogout} userRole={userRole} userData={userData} allowedModules={allowedModules} isExpired={isExpired} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-[1]">
        {isTrial && (
          <div className="bg-clinicPrimary text-white px-4 py-2 flex items-center justify-between shadow-md relative z-10 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <p className="text-xs font-bold">
                Free Trial: <span className="font-black">{daysRemaining} Days Remaining</span> 
                {trialExpiryDate && ` (Expires on ${trialExpiryDate.toLocaleDateString()})`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.location.href = '/#pricing'} className="text-[10px] font-black uppercase tracking-widest hover:text-slate-200 underline">View Plans</button>
              <button onClick={() => window.location.href = '/#pricing'} className="px-3 py-1 bg-white text-clinicPrimary rounded text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 shadow-sm">Buy Plan Now</button>
            </div>
          </div>
        )}
        <Navbar toggleSidebar={toggleSidebar} onLogout={onLogout} userRole={userRole} allowedModules={allowedModules} />

        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-[1] pb-6 md:pb-0">
          {isExpired && !isAllowedPathWhenExpired ? (
            <div className="flex items-center justify-center h-full p-6 text-center">
              <div className="max-w-md bg-white p-8 rounded-xl shadow-sm border border-rose-100">
                <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Dashboard Blocked</h2>
                <p className="text-slate-500 mb-6">Your {isTrial ? 'trial' : 'subscription'} has expired. Please upgrade or renew your plan to continue accessing clinical data.</p>
                <div className="space-y-3">
                  <button onClick={() => navigate('/settings')} className="w-full py-3 bg-clinicPrimary text-white rounded-lg font-bold">View Plans & Upgrade</button>
                  <button onClick={onLogout} className="w-full py-3 bg-slate-100 text-slate-600 rounded-lg font-bold">Logout</button>
                </div>
              </div>
            </div>
          ) : (
            <ErrorBoundary>
              <React.Suspense fallback={
                <div className="flex-1 flex items-center justify-center min-h-[300px]">
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="w-7 h-7 border-2 border-clinicPrimary/20 border-t-clinicPrimary rounded-full animate-spin"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading...</p>
                  </div>
                </div>
              }>
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="min-h-full"
                >
                  <Outlet />
                </motion.div>
              </React.Suspense>
            </ErrorBoundary>
          )}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
