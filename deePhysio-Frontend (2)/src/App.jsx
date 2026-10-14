import React, { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { PermissionProvider } from './context/PermissionContext';
import { LanguageProvider } from './context/LanguageContext';
import { fetchApi } from './config/api';
import { normalizeModule, readAllowedModules } from './config/modules';
import { readAllowedActions, readEffectivePermissions } from './config/actions';
import ErrorBoundary from './components/ErrorBoundary';

// Mobile and PWA Components & Services
import OfflineBanner from './mobile/network/OfflineBanner';
import PwaUpdatePrompt from './pwa/PwaUpdatePrompt';
import PwaInstallPrompt from './pwa/PwaInstallPrompt';
import SplashManager from './mobile/splash/SplashManager';
import DeepLinkService from './mobile/deeplink/DeepLinkService';
import NotificationService from './mobile/notifications/NotificationService';
import AppLifecycleService from './mobile/lifecycle/AppLifecycleService';
import { PermissionModal } from './mobile/permissions/PermissionModal';
import { permissionManager } from './mobile/permissions/PermissionManager';

// Lazy load legal and compliance pages
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const AccountDeletionPage = lazy(() => import('./pages/legal/AccountDeletionPage'));
const TermsAndConditions = lazy(() => import('./pages/legal/TermsAndConditions'));

// Lazy load all protected pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Register = lazy(() => import('./pages/Register'));
// ================= SUPERADMIN (SAAS) MODULES =================
const SuperAdminDashboard = lazy(() => import('./pages/dashboards/SuperAdminDashboard'));
const TenantManagement = lazy(() => import('./pages/superadmin/TenantManagement'));
const PlansPricing = lazy(() => import('./pages/superadmin/PlansPricing'));
const RevenuePayments = lazy(() => import('./pages/superadmin/RevenuePayments'));
const SystemSettings = lazy(() => import('./pages/superadmin/SystemSettings'));
const SubscriptionPlansPage = lazy(() => import('./pages/SubscriptionPlansPage'));

// ================= TENANT ADMIN MODULES =================
const DashboardRouter = lazy(() => import('./pages/dashboards/DashboardRouter'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Checkin = lazy(() => import('./pages/Checkin'));
const BookAppointment = lazy(() => import('./pages/BookAppointment'));
const Waitlist = lazy(() => import('./pages/Waitlist'));
const Availability = lazy(() => import('./pages/Availability'));
const AddTimeBlock = lazy(() => import('./pages/AddTimeBlock'));
const BookingSettings = lazy(() => import('./pages/BookingSettings'));
const Patients = lazy(() => import('./pages/Patients'));
const AddPatient = lazy(() => import('./pages/AddPatient'));
const PatientProfile = lazy(() => import('./pages/PatientProfile'));
const VisitHistory = lazy(() => import('./pages/VisitHistory'));
const ClinicalNotes = lazy(() => import('./pages/ClinicalNotes'));
const NewNote = lazy(() => import('./pages/NewNote'));
const SOAPNotePage = lazy(() => import('./pages/SOAPNotePage'));
const RMDQAssessment = lazy(() => import('./pages/RMDQAssessment'));
const HomeExercises = lazy(() => import('./pages/HomeExercises'));
const TreatmentPlan = lazy(() => import('./pages/TreatmentPlan'));
const PatientSurvey = lazy(() => import('./pages/PatientSurvey'));
const DischargeSummary = lazy(() => import('./pages/DischargeSummary'));
const NoteTemplates = lazy(() => import('./pages/NoteTemplates'));
const Attachments = lazy(() => import('./pages/Attachments'));
const Communication = lazy(() => import('./pages/Communication'));
const SMSChat = lazy(() => import('./pages/SMSChat'));
const EmailMessages = lazy(() => import('./pages/EmailMessages'));
const BulkMessaging = lazy(() => import('./pages/BulkMessaging'));
const Telehealth = lazy(() => import('./pages/Telehealth'));
const Billing = lazy(() => import('./pages/Billing'));
const NewInvoice = lazy(() => import('./pages/NewInvoice'));
const Payments = lazy(() => import('./pages/Payments'));
const PaymentHistory = lazy(() => import('./pages/PaymentHistory'));
const BillingPatientDetail = lazy(() => import('./pages/BillingPatientDetail'));
const PaymentReminders = lazy(() => import('./pages/PaymentReminders'));
const PricingServices = lazy(() => import('./pages/PricingServices'));
const FormBuilder = lazy(() => import('./pages/FormBuilder'));
const FormsList = lazy(() => import('./pages/FormsList'));
const FormFill = lazy(() => import('./pages/FormFill'));
const Analytics = lazy(() => import('./pages/Analytics'));
const RoomIncomeAnalysis = lazy(() => import('./pages/RoomIncomeAnalysis'));
const StaffActivity = lazy(() => import('./pages/StaffActivity'));
const Marketing = lazy(() => import('./pages/Marketing'));
const MarketingSegments = lazy(() => import('./pages/MarketingSegments'));
const CommTemplates = lazy(() => import('./pages/CommTemplates'));
const Integrations = lazy(() => import('./pages/Integrations'));
const Settings = lazy(() => import('./pages/Settings'));
const Support = lazy(() => import('./pages/Support'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const AddUser = lazy(() => import('./pages/AddUser'));
const EditUser = lazy(() => import('./pages/EditUser'));
const UserAudit = lazy(() => import('./pages/UserAudit'));
const RolesPermissions = lazy(() => import('./pages/RolesPermissions'));
const AddRole = lazy(() => import('./pages/AddRole'));
const ClinicDetails = lazy(() => import('./pages/ClinicDetails'));
const WhatsAppSettings = lazy(() => import('./pages/WhatsAppSettings'));
const CurrencySettings = lazy(() => import('./pages/CurrencySettings'));
const SmtpSettings = lazy(() => import('./pages/SmtpSettings'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const SecuritySettings = lazy(() => import('./pages/SecuritySettings'));
const RoomSettings = lazy(() => import('./pages/RoomSettings'));
const DataBackup = lazy(() => import('./pages/DataBackup'));
const ViewNote = lazy(() => import('./pages/ViewNote'));
const CreateTemplate = lazy(() => import('./pages/CreateTemplate'));
const RecordPaymentPage = lazy(() => import('./pages/RecordPaymentPage'));
const InvoiceDetailPage = lazy(() => import('./pages/InvoiceDetailPage'));
const AddReminderRulePage = lazy(() => import('./pages/AddReminderRulePage'));
const AddServicePage = lazy(() => import('./pages/AddServicePage'));
const EditServicePage = lazy(() => import('./pages/EditServicePage'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AccessDenied = lazy(() => import('./pages/AccessDenied'));
const TrialExpired = lazy(() => import('./pages/TrialExpired'));
const HowToUse = lazy(() => import('./pages/HowToUse'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState(() => {
    const role = sessionStorage.getItem('deephysio_role') || localStorage.getItem('deephysio_role');
    return (role && role !== 'null' && role !== 'undefined') ? role : null;
  });
  const [userData, setUserData] = useState(() => {
    try {
      const user = sessionStorage.getItem('deephysio_user') || localStorage.getItem('deephysio_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  });

  const [permissionModalState, setPermissionModalState] = useState({
    isOpen: false,
    config: null,
    onConfirm: null,
    onCancel: null,
    isPermanentlyDenied: false
  });

  useEffect(() => {
    permissionManager.setModalHandler(({ config, onConfirm, onCancel, isPermanentlyDenied }) => {
      setPermissionModalState({
        isOpen: true,
        config,
        onConfirm: () => {
          setPermissionModalState(prev => ({ ...prev, isOpen: false }));
          if (onConfirm) onConfirm();
        },
        onCancel: () => {
          setPermissionModalState(prev => ({ ...prev, isOpen: false }));
          if (onCancel) onCancel();
        },
        isPermanentlyDenied: !!isPermanentlyDenied
      });
    });

    return () => {
      permissionManager.setModalHandler(null);
    };
  }, []);

  // Native Mobile Lifecycle & Splash Synchronization
  useEffect(() => {
    SplashManager.setupNativeUI();
    SplashManager.hideWhenReady(450);

    // Initialize Deep Link listener and push notification tap routing
    DeepLinkService.init((route) => {
      if (route) navigate(route);
    });

    NotificationService.init((route) => {
      if (route) navigate(route);
    });

    AppLifecycleService.init({
      onResume: () => {
        console.log('[App] Resumed from background. State preserved.');
      }
    });
  }, [navigate]);

  // RE-FETCH ON MOUNT for permission sync
  useEffect(() => {
    const syncPermissions = async () => {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (token && userData?.id) {
        try {
          const res = await fetchApi('/users/me');
          if (res && res.ok) {
            const result = await res.json();
            if (result.success && result.data) {
              const latestUser = result.data;
              // Update local storage and state with latest permissions
              sessionStorage.setItem('deephysio_user', JSON.stringify(latestUser));
              sessionStorage.setItem('deephysio_role', latestUser.role);
              localStorage.setItem('deephysio_user', JSON.stringify(latestUser));
              localStorage.setItem('deephysio_role', latestUser.role);
              setUserData(latestUser);
              setUserRole(latestUser.role);
            }
          }
        } catch (e) {
          console.error("Permission sync failed:", e);
        }
      }
    };
    syncPermissions();
  }, []);

  // Re-sync userRole whenever the route changes
  useEffect(() => {
    const role = sessionStorage.getItem('deephysio_role') || localStorage.getItem('deephysio_role');
    const isValidRole = role && role !== 'null' && role !== 'undefined';

    if (isValidRole && role !== userRole) {
      setUserRole(role);
    } else if (!isValidRole && userRole !== null) {
      setUserRole(null);
    }
  }, [location.pathname, userRole]);

  const handleLogout = () => {
    import('./config/api').then(({ clearAllTenantState }) => {
      clearAllTenantState();
      setUserRole(null);
      setUserData(null);
      window.location.href = '/login';
    });
  };

  const isTrialExpired = () => {
    const tenant = userData?.tenant;
    const isTrial = userData?.subscription_status === 'trial' || 
      tenant?.subscription_status === 'trial' || 
      (tenant?.plan && tenant.plan.toLowerCase().includes('trial')) ||
      (userData?.plan && userData.plan.toLowerCase().includes('trial'));
    
    if (!isTrial) return false;
    const createdAtStr = tenant?.created_at || userData?.created_at;
    if (createdAtStr) {
      const createdAt = new Date(createdAtStr);
      const now = new Date();
      const startOfCreated = new Date(createdAt.getFullYear(), createdAt.getMonth(), createdAt.getDate());
      const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.max(0, Math.floor((startOfNow.getTime() - startOfCreated.getTime()) / (1000 * 60 * 60 * 24)));
      if (diffDays >= 7) return true;
    }
    return false;
  };

  // Auto Logout Security (Session Timeout on Inactivity)
  useEffect(() => {
    let timeoutId;
    // 60 Minutes Inactivity Timeout
    const INACTIVITY_LIMIT_MS = 60 * 60 * 1000; 

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // If token exists, user is logged in, but inactive -> force logout
        if (sessionStorage.getItem('token') || localStorage.getItem('token')) {
          handleLogout();
        }
      }, INACTIVITY_LIMIT_MS);
    };

    // Listen to standard human interaction events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer, { passive: true }));

    // Init the timer
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer, { passive: true }));
    };
  }, []);

  const getStoredUser = () => {
    try {
      const userStr = sessionStorage.getItem('deephysio_user') || localStorage.getItem('deephysio_user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  };

  /**
   * STRICT ROLE MATRIX
   * Admin: Full access
   * Therapist: Patients, Clinical Notes, Appointments
   * Receptionist: Patients, Appointments, Forms
   * Billing: Invoices, Payments, Reports
   */
  const getAllowedModules = () => {
    const user = getStoredUser();
    return readAllowedModules(user, userRole);
  };

  const hasAccess = (menuName) => {
    if (!userRole) return false;
    return getAllowedModules().includes(normalizeModule(menuName));
  };
  const hasAction = (actionKey) => {
    const user = getStoredUser();
    return readAllowedActions(user, userRole).includes(actionKey);
  };
  const hasPermission = (permissionKey) => {
    const user = getStoredUser();
    return readEffectivePermissions(user, userRole).includes(permissionKey);
  };

  const isCheckinOnlyMode = () => {
    const user = getStoredUser();
    const menus = readAllowedModules(user, userRole).map(normalizeModule);
    const effectivePerms = readEffectivePermissions(user, userRole);
    // Strict rule: only users explicitly restricted to Appointments module
    // and lacking manage permission should be forced into check-in-only mode.
    return (
      menus.length === 1 &&
      menus.includes('Appointments') &&
      effectivePerms.includes('appointments.view') &&
      !effectivePerms.includes('appointments.manage')
    );
  };

  const getDefaultAuthorizedRoute = () => {
    if (isCheckinOnlyMode()) return '/appointments/checkin';
    if (hasAccess('Dashboard')) return '/dashboard';
    if (hasAccess('Appointments') && hasPermission('appointments.manage')) return '/appointments';
    if (hasAccess('Appointments') && hasPermission('appointments.view')) return '/appointments/checkin';
    if (hasAccess('Patients')) return '/patients';
    if (hasAccess('Clinical Notes')) return '/notes';
    if (hasAccess('Communication')) return '/communication/sms';
    if (hasAccess('Billing')) return '/billing';
    if (hasAccess('Forms') && hasPermission('forms.view')) return '/forms';
    if (hasAccess('Analytics')) return '/analytics';
    if (hasAccess('Settings')) return '/settings';
    return '/access-denied';
  };


  return (
    <LanguageProvider>
      <ToastProvider>
        <ErrorBoundary>
          <OfflineBanner />
          <PwaInstallPrompt />
          <PwaUpdatePrompt />
          <PermissionModal
            isOpen={permissionModalState.isOpen}
            config={permissionModalState.config}
            onConfirm={permissionModalState.onConfirm}
            onCancel={permissionModalState.onCancel}
            isPermanentlyDenied={permissionModalState.isPermanentlyDenied}
          />
          <Suspense fallback={
            <div className="h-screen w-screen flex items-center justify-center bg-clinicLight">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-clinicPrimary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-clinicPrimary font-bold animate-pulse text-lg">DeePhysio Syncing...</p>
              </div>
            </div>
          }>
            <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/account-deletion" element={<AccountDeletionPage />} />
          <Route
            element={
              <ProtectedRoute>
                {isTrialExpired() && !['/support', '/settings', '/profile', '/billing'].some(p => location.pathname.startsWith(p)) ? (
                  <TrialExpired onLogout={handleLogout} />
                ) : (
                  <PermissionProvider>
                    <NotificationProvider>
                      <MainLayout onLogout={handleLogout} userRole={userRole} setUserRole={setUserRole} userData={userData} allowedModules={getAllowedModules()} />
                    </NotificationProvider>
                  </PermissionProvider>
                )}
              </ProtectedRoute>
            }
          >
            <Route
              path="dashboard"
              element={isCheckinOnlyMode() ? <Navigate to="/appointments/checkin" replace /> : <DashboardRouter />}
            />


            {/* Appointments */}
            <Route path="appointments" element={hasAccess('Appointments') ? <Appointments /> : <AccessDenied />} />
            <Route path="appointments/book" element={hasAccess('Appointments') ? <BookAppointment /> : <AccessDenied />} />
            <Route path="appointments/checkin" element={hasAccess('Appointments') ? <Checkin /> : <AccessDenied />} />
            <Route path="appointments/waitlist" element={hasAccess('Appointments') ? <Waitlist /> : <AccessDenied />} />
            <Route path="appointments/availability" element={hasAccess('Appointments') ? <Availability /> : <AccessDenied />} />
            <Route path="appointments/availability/add" element={hasAccess('Appointments') ? <AddTimeBlock /> : <AccessDenied />} />

            {/* Patients */}
            <Route path="patients" element={hasAccess('Patients') ? <Patients /> : <AccessDenied />} />
            <Route path="patients/add" element={hasAccess('Patients') ? <AddPatient /> : <AccessDenied />} />
            <Route path="patients/edit/:id" element={hasAccess('Patients') ? <AddPatient /> : <AccessDenied />} />
            <Route path="patients/profile/:id" element={hasAccess('Patients') ? <PatientProfile /> : <AccessDenied />} />
            <Route path="patients/:id" element={hasAccess('Patients') ? <PatientProfile /> : <AccessDenied />} />
            <Route path="patients/history/:id" element={hasAccess('Patients') ? <VisitHistory /> : <AccessDenied />} />

            {/* Clinical Notes */}
            <Route path="notes" element={hasAccess('Clinical Notes') ? <ClinicalNotes /> : <AccessDenied />} />
            <Route path="notes/new" element={hasAccess('Clinical Notes') ? <NewNote /> : <AccessDenied />} />
            <Route path="notes/edit/:id" element={hasAccess('Clinical Notes') ? <NewNote /> : <AccessDenied />} />
            <Route path="notes/view/:id" element={hasAccess('Clinical Notes') ? <ViewNote /> : <AccessDenied />} />
            <Route path="notes/attachments" element={hasAccess('Clinical Notes') ? <Attachments /> : <AccessDenied />} />
            <Route path="notes/soap/:id" element={hasAccess('Clinical Notes') ? <SOAPNotePage /> : <AccessDenied />} />
            <Route path="notes/templates" element={hasAccess('Clinical Notes') ? <NoteTemplates /> : <AccessDenied />} />
            <Route path="notes/templates/new" element={hasAccess('Clinical Notes') ? <CreateTemplate /> : <AccessDenied />} />

            {/* Communication */}
            <Route path="communication" element={hasAccess('Communication') ? <Communication /> : <AccessDenied />} />
            <Route path="communication/whatsapp" element={hasAccess('Communication') ? <Communication /> : <AccessDenied />} />
            <Route path="communication/sms" element={hasAccess('Communication') ? <SMSChat /> : <AccessDenied />} />
            <Route path="communication/email" element={hasAccess('Communication') ? <EmailMessages /> : <AccessDenied />} />
            <Route path="communication/bulk" element={hasAccess('Communication') ? <BulkMessaging /> : <AccessDenied />} />
            <Route path="communication/telehealth" element={hasAccess('Communication') ? <Telehealth /> : <AccessDenied />} />
            <Route path="communication/templates" element={hasAccess('Communication') ? <CommTemplates /> : <AccessDenied />} />

            {/* Billing */}
            <Route path="billing" element={hasAccess('Billing') ? <Billing /> : <AccessDenied />} />
            <Route path="billing/new" element={hasAccess('Billing') ? <NewInvoice /> : <AccessDenied />} />
            <Route path="billing/payments" element={hasAccess('Billing') ? <Payments /> : <AccessDenied />} />
            <Route path="billing/history" element={hasAccess('Billing') ? <PaymentHistory /> : <AccessDenied />} />
            <Route path="billing/reminders" element={hasAccess('Billing') ? <PaymentReminders /> : <AccessDenied />} />
            <Route path="billing/reminders/add" element={hasAccess('Billing') ? <AddReminderRulePage /> : <AccessDenied />} />
            <Route path="billing/patient/:id" element={hasAccess('Billing') ? <BillingPatientDetail /> : <AccessDenied />} />
            <Route path="billing/pricing" element={hasAccess('Billing') ? <PricingServices /> : <AccessDenied />} />
            <Route path="billing/pricing/add" element={hasAccess('Billing') ? <AddServicePage /> : <AccessDenied />} />
            <Route path="billing/pricing/edit/:id" element={hasAccess('Billing') ? <EditServicePage /> : <AccessDenied />} />

            {/* Forms */}
            <Route path="forms" element={hasAccess('Forms') ? <FormsList /> : <AccessDenied />} />
            <Route path="forms/builder" element={hasAccess('Forms') ? <FormBuilder /> : <AccessDenied />} />
            <Route path="forms/:id/edit" element={hasAccess('Forms') ? <FormBuilder /> : <AccessDenied />} />
            <Route path="forms/:id/fill" element={hasAccess('Forms') ? <FormFill /> : <AccessDenied />} />

            {/* Analytics */}
            <Route path="analytics" element={hasAccess('Analytics') ? <Analytics /> : <AccessDenied />} />
            <Route path="analytics/staff" element={hasAccess('Analytics') ? <StaffActivity /> : <AccessDenied />} />
            <Route path="analytics/rooms" element={hasAccess('Analytics') ? <RoomIncomeAnalysis /> : <AccessDenied />} />

            {/* Settings & Support */}
            <Route path="settings" element={hasAccess('Settings') ? <Settings /> : <AccessDenied />} />
            <Route path="support" element={<Support />} />
            <Route path="guide" element={<HowToUse />} />
            <Route path="how-to-use" element={<HowToUse />} />
            <Route path="plans" element={<SubscriptionPlansPage />} />
            <Route path="subscription" element={<SubscriptionPlansPage />} />
            <Route path="backup" element={<DataBackup />} />
            
            {/* Super Admin specific routes */}
            <Route path="superadmin/tenants" element={<TenantManagement />} />
            <Route path="superadmin/plans" element={<PlansPricing />} />
            <Route path="superadmin/revenue" element={<RevenuePayments />} />
            <Route path="superadmin/settings" element={<SystemSettings />} />
            <Route path="superadmin/audit" element={<UserAudit />} />
            <Route path="superadmin/backup" element={<DataBackup />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="audit" element={<UserAudit />} />
            <Route path="billing/refunds" element={<ModulePlaceholder title="Refunds" />} />
            <Route path="settings/users" element={hasAccess('Settings') && hasPermission('users.manage') ? <UserManagement /> : <AccessDenied />} />
            <Route path="settings/users/add" element={hasAccess('Settings') && hasPermission('users.manage') ? <AddUser /> : <AccessDenied />} />
            <Route path="settings/users/edit/:id" element={hasAccess('Settings') && hasPermission('users.manage') ? <EditUser /> : <AccessDenied />} />
            <Route path="settings/clinic" element={hasAccess('Settings') ? <ClinicDetails /> : <AccessDenied />} />
            <Route path="settings/whatsapp" element={hasAccess('Settings') ? <WhatsAppSettings /> : <AccessDenied />} />
            <Route path="settings/currency" element={hasAccess('Settings') ? <CurrencySettings /> : <AccessDenied />} />
            <Route path="settings/smtp" element={hasAccess('Settings') ? <SmtpSettings /> : <AccessDenied />} />
            <Route path="settings/security" element={hasAccess('Settings') ? <SecuritySettings /> : <AccessDenied />} />
            <Route path="settings/backup" element={hasAccess('Settings') ? <DataBackup /> : <AccessDenied />} />
            <Route path="settings/audit" element={hasAccess('Settings') ? <UserAudit /> : <AccessDenied />} />
            <Route path="settings/roles" element={hasAccess('Settings') ? <RolesPermissions /> : <AccessDenied />} />
            <Route path="settings/roles/add" element={hasAccess('Settings') ? <AddRole /> : <AccessDenied />} />
            <Route path="settings/notifications" element={hasAccess('Settings') ? <NotificationSettings /> : <AccessDenied />} />
            <Route path="settings/integrations" element={hasAccess('Settings') ? <Integrations /> : <AccessDenied />} />
            <Route path="settings/rooms" element={hasAccess('Settings') ? <RoomSettings /> : <AccessDenied />} />

            <Route path="*" element={<Navigate to={getDefaultAuthorizedRoute()} replace />} />
          </Route>
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </ToastProvider>
    </LanguageProvider>
  );
}

const ModulePlaceholder = ({ title }) => (
  <div className="p-8 text-center text-slate-500">
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p>This module is part of the Enterprise SaaS architecture and is under construction.</p>
  </div>
);

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default App;
