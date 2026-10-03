import React from 'react';
import SuperAdminDashboard from './SuperAdminDashboard';
import TenantAdminDashboard from './TenantAdminDashboard';
import TherapistDashboard from './TherapistDashboard';
import ReceptionDashboard from './ReceptionDashboard';
import BillingDashboard from './BillingDashboard';
import { Navigate } from 'react-router-dom';

const DashboardRouter = () => {
  const userStr = sessionStorage.getItem('deephysio_user');
  const roleStr = sessionStorage.getItem('deephysio_role');
  let userRole = roleStr?.toLowerCase() || 'therapist';
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.role) userRole = user.role.toLowerCase();
    } catch (e) {
      console.error('Error parsing user data in DashboardRouter', e);
    }
  }

  switch (userRole) {
    case 'superadmin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <TenantAdminDashboard />;
    case 'therapist':
      return <TherapistDashboard />;
    case 'receptionist':
      return <ReceptionDashboard />;
    case 'billing':
      return <BillingDashboard />;
    default:
      return <Navigate to="/access-denied" replace />;
  }
};

export default DashboardRouter;
