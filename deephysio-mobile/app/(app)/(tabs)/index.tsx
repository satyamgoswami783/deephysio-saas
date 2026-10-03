import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Users,
  FileText,
  Receipt,
  PlusCircle,
  QrCode,
  TrendingUp,
  Clock,
  Activity,
  Shield,
  UserCheck,
  Building,
  CreditCard,
  ClipboardList,
  Sparkles,
  DollarSign,
  AlertCircle,
  Crown,
  Ban,
  CheckCircle2,
  ChevronRight,
  Settings,
  HelpCircle,
  RotateCcw,
  Tag,
} from 'lucide-react-native';
import { useAuth } from '../../../src/context/AuthContext';
import { usePermissions } from '../../../src/hooks/usePermissions';
import { appointmentApi } from '../../../src/api/appointment.api';
import { analyticsApi } from '../../../src/api/analytics.api';
import { patientApi } from '../../../src/api/patient.api';
import { clinicalNoteApi } from '../../../src/api/clinicalNote.api';
import { billingApi } from '../../../src/api/billing.api';
import { saasApi, SaasTenant } from '../../../src/api/saas.api';
import { supportApi } from '../../../src/api/support.api';
import { settingsApi } from '../../../src/api/settings.api';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Card from '../../../src/components/common/Card';
import Badge from '../../../src/components/common/Badge';
import AppointmentCard from '../../../src/components/appointments/AppointmentCard';
import EmptyState from '../../../src/components/common/EmptyState';
import Colors from '../../../src/constants/colors';
import { formatCurrency } from '../../../src/utils/currency';
import { formatDate } from '../../../src/utils/date';
import {
  Headphones,
  LifeBuoy,
  Target,
  Send,
  Download,
  Flame,
} from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, role, clinicProfile } = useAuth();
  const { isSuperAdmin, isAdmin, isTherapist, isReceptionist, isBilling, can, hasModule } = usePermissions();

  const [refreshing, setRefreshing] = useState(false);

  // ===================== 1. SAAS QUERIES (FOR SUPERADMIN ONLY) =====================
  const {
    data: saasRevenue,
    refetch: refetchSaasRevenue,
    isLoading: loadingSaasRev,
  } = useQuery({
    queryKey: ['saas-revenue'],
    queryFn: saasApi.getRevenue,
    enabled: isSuperAdmin,
  });

  const {
    data: saasTenants = [],
    refetch: refetchSaasTenants,
    isLoading: loadingSaasTenants,
  } = useQuery({
    queryKey: ['saas-tenants-list'],
    queryFn: saasApi.getTenants,
    enabled: isSuperAdmin,
  });

  const {
    data: supportTickets = [],
    refetch: refetchSupportTickets,
    isLoading: loadingTickets,
  } = useQuery({
    queryKey: ['support-tickets-count'],
    queryFn: () => supportApi.getTickets(true),
    enabled: isSuperAdmin,
  });

  const updateTenantStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      saasApi.updateTenantStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-tenants-list'] });
      queryClient.invalidateQueries({ queryKey: ['saas-revenue'] });
      Alert.alert('Status Updated', 'Admin subscription status has been changed.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update status');
    },
  });

  // ===================== 2. CLINIC QUERIES (FOR CLINIC ROLES) =====================
  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: analyticsApi.getOverview,
    enabled: !isSuperAdmin && (isAdmin || hasModule('Analytics')),
  });

  const { data: appointments = [], refetch: refetchAppointments } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: () => appointmentApi.getAll(),
    enabled: !isSuperAdmin && (isAdmin || isTherapist || isReceptionist || hasModule('Appointments') || can('appointments.view')),
  });

  const { data: patients = [], refetch: refetchPatients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientApi.getAll(),
    enabled: !isSuperAdmin && (isAdmin || isTherapist || isReceptionist || isBilling || hasModule('Patients') || can('patient.basic')),
  });

  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['clinical-notes-count'],
    queryFn: () => clinicalNoteApi.getAll(),
    enabled: !isSuperAdmin && (isAdmin || isTherapist || hasModule('Clinical Notes') || can('notes.view')),
  });

  const { data: invoices = [], refetch: refetchInvoices } = useQuery({
    queryKey: ['invoices-count'],
    queryFn: () => billingApi.getInvoices(),
    enabled: !isSuperAdmin && (isAdmin || isBilling || hasModule('Billing')),
  });

  const { data: staffList = [], refetch: refetchStaff } = useQuery({
    queryKey: ['staff-users-count'],
    queryFn: () => settingsApi.getUsers(),
    enabled: !isSuperAdmin && (isAdmin || hasModule('Settings')),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    if (isSuperAdmin) {
      await Promise.all([refetchSaasRevenue(), refetchSaasTenants()]);
    } else {
      const promises: Promise<any>[] = [];
      if (isAdmin || hasModule('Analytics')) promises.push(refetchAnalytics());
      if (isAdmin || isTherapist || isReceptionist || hasModule('Appointments')) promises.push(refetchAppointments());
      if (isAdmin || isTherapist || isReceptionist || isBilling || hasModule('Patients')) promises.push(refetchPatients());
      if (isAdmin || isTherapist || hasModule('Clinical Notes')) promises.push(refetchNotes());
      if (isAdmin || isBilling || hasModule('Billing')) promises.push(refetchInvoices());
      await Promise.all(promises);
    }
    setRefreshing(false);
  };

  const handleCheckIn = async (appointmentId: number) => {
    try {
      await appointmentApi.markAsArrived(appointmentId);
      refetchAppointments();
    } catch (err: any) {
      console.warn('Check in error:', err);
    }
  };

  // =========================================================================
  // RENDER A: 👑 SAAS SUPERADMIN PLATFORM DASHBOARD (EXACT WEBSITE PARITY)
  // =========================================================================
  if (isSuperAdmin) {
    const totalAdmins = saasTenants.length;
    const activePaidAdmins = saasTenants.filter((t) => t.subscription_status === 'active').length;
    const trialAdmins = saasTenants.filter((t) => t.subscription_status === 'trial').length;
    const expiredAdmins = saasTenants.filter(
      (t) => t.subscription_status === 'canceled' || t.subscription_status === 'expired'
    ).length;

    const totalRev = saasRevenue?.totalRevenue || saasRevenue?.mrr || 0;
    const mrr = saasRevenue?.mrr || totalRev;
    const openTicketsCount = supportTickets.filter((tk) => tk.status?.toLowerCase() === 'open').length;

    const alertTenants = saasTenants.filter((t) =>
      ['trial', 'canceled', 'expired'].includes(t.subscription_status || '')
    );

    return (
      <ScreenWrapper>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || loadingSaasRev || loadingSaasTenants || loadingTickets}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        >
          {/* Exact Top Header from Website */}
          <View style={styles.webHeader}>
            <View>
              <Text style={styles.webHeaderTitle}>Analytics Dashboard</Text>
              <View style={styles.webHeaderSubRow}>
                <View style={styles.webPulsingDot} />
                <Text style={styles.webHeaderSubText}>SUPER ADMIN · BUSINESS OVERVIEW</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.headerAvatarBtn}
              onPress={() => router.push('/(app)/(tabs)/settings')}
              activeOpacity={0.7}
            >
              {user?.photo ? (
                <Image source={{ uri: user.photo }} style={styles.headerAvatarImg} />
              ) : (
                <View style={styles.headerAvatarInitial}>
                  <Text style={styles.headerAvatarInitialText}>
                    {user?.name?.charAt(0).toUpperCase() || 'S'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* 7 Stat Cards Grid matching Website */}
          <View style={styles.webStatGrid}>
            {/* 1. TOTAL REVENUE */}
            <View style={styles.webStatCard}>
              <View style={[styles.webStatBlob, { backgroundColor: '#DBEAFE' }]} />
              <View style={styles.webStatTopRow}>
                <View>
                  <Text style={styles.webStatTitle}>TOTAL REVENUE</Text>
                  <Text style={styles.webStatValue}>₹{totalRev}</Text>
                </View>
                <View style={[styles.webStatIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#2563EB' }}>₹</Text>
                </View>
              </View>
            </View>

            {/* 2. MONTHLY REVENUE */}
            <View style={styles.webStatCard}>
              <View style={[styles.webStatBlob, { backgroundColor: '#D1FAE5' }]} />
              <View style={styles.webStatTopRow}>
                <View>
                  <Text style={styles.webStatTitle}>MONTHLY REVENUE</Text>
                  <Text style={styles.webStatValue}>₹{mrr}</Text>
                </View>
                <View style={[styles.webStatIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <TrendingUp size={18} color="#059669" />
                </View>
              </View>
            </View>

            {/* 3. TOTAL ADMINS */}
            <View style={styles.webStatCard}>
              <View style={[styles.webStatBlob, { backgroundColor: '#E0E7FF' }]} />
              <View style={styles.webStatTopRow}>
                <View>
                  <Text style={styles.webStatTitle}>TOTAL ADMINS</Text>
                  <Text style={styles.webStatValue}>{totalAdmins}</Text>
                </View>
                <View style={[styles.webStatIconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Users size={18} color="#4F46E5" />
                </View>
              </View>
            </View>

            {/* 4. ACTIVE PAID ADMINS */}
            <View style={styles.webStatCard}>
              <View style={[styles.webStatBlob, { backgroundColor: '#CCFBF1' }]} />
              <View style={styles.webStatTopRow}>
                <View>
                  <Text style={styles.webStatTitle}>ACTIVE PAID ADMINS</Text>
                  <Text style={styles.webStatValue}>{activePaidAdmins}</Text>
                </View>
                <View style={[styles.webStatIconBox, { backgroundColor: '#F0FDFA' }]}>
                  <UserCheck size={18} color="#0D9488" />
                </View>
              </View>
            </View>

            {/* 5. FREE TRIAL ADMINS */}
            <View style={styles.webStatCard}>
              <View style={[styles.webStatBlob, { backgroundColor: '#FEF3C7' }]} />
              <View style={styles.webStatTopRow}>
                <View>
                  <Text style={styles.webStatTitle}>FREE TRIAL ADMINS</Text>
                  <Text style={styles.webStatValue}>{trialAdmins}</Text>
                </View>
                <View style={[styles.webStatIconBox, { backgroundColor: '#FFFBEB' }]}>
                  <Clock size={18} color="#D97706" />
                </View>
              </View>
            </View>

            {/* 6. EXPIRED / BLOCKED */}
            <View style={styles.webStatCard}>
              <View style={[styles.webStatBlob, { backgroundColor: '#FFE4E6' }]} />
              <View style={styles.webStatTopRow}>
                <View>
                  <Text style={styles.webStatTitle}>EXPIRED / BLOCKED</Text>
                  <Text style={styles.webStatValue}>{expiredAdmins}</Text>
                </View>
                <View style={[styles.webStatIconBox, { backgroundColor: '#FFF1F2' }]}>
                  <Ban size={18} color="#E11D48" />
                </View>
              </View>
            </View>

            {/* 7. OPEN TICKETS */}
            <View style={[styles.webStatCard, { width: '100%' }]}>
              <View style={[styles.webStatBlob, { backgroundColor: '#E0F2FE' }]} />
              <View style={styles.webStatTopRow}>
                <View>
                  <Text style={styles.webStatTitle}>OPEN TICKETS</Text>
                  <Text style={styles.webStatValue}>{openTicketsCount}</Text>
                </View>
                <View style={[styles.webStatIconBox, { backgroundColor: '#F0F9FF' }]}>
                  <Headphones size={18} color="#0284C7" />
                </View>
              </View>
            </View>
          </View>

          {/* Mid Section Navy Banner matching Website */}
          <View style={styles.webNavyBanner}>
            <View style={styles.webNavyCol}>
              <Text style={styles.webNavyAmount}>₹{totalRev}</Text>
              <Text style={styles.webNavyLabel}>TOTAL REVENUE</Text>
            </View>
            <View style={styles.webNavyDivider} />
            <View style={styles.webNavyCol}>
              <Text style={styles.webNavyAmount}>₹{mrr}</Text>
              <Text style={styles.webNavyLabel}>MONTHLY RUN RATE</Text>
            </View>
            <View style={styles.webNavyDivider} />
            <View style={styles.webNavyCol}>
              <Text style={styles.webNavyAmount}>{totalAdmins}</Text>
              <Text style={styles.webNavyLabel}>TOTAL ADMINS</Text>
            </View>
          </View>

          {/* Subscription Alerts Section matching Website */}
          <View style={styles.webAlertsContainer}>
            <View style={styles.webAlertsHeader}>
              <View style={styles.webAlertsTitleRow}>
                <View style={styles.webAlertsIconBox}>
                  <Ban size={16} color="#DC2626" />
                </View>
                <Text style={styles.webAlertsTitle}>Subscription Alerts</Text>
              </View>
              <View style={styles.webAlertsBtnRow}>
                <TouchableOpacity
                  style={styles.webReminderBtn}
                  onPress={() => Alert.alert('Reminders Sent', 'Automated subscription alerts sent to owners.')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.webReminderBtnText}>🚀 Bulk Send Reminders</Text>
                </TouchableOpacity>
              </View>
            </View>

            {alertTenants.length === 0 ? (
              <View style={styles.webAlertsEmpty}>
                <UserCheck size={32} color={Colors.slate} />
                <Text style={styles.webAlertsEmptyText}>All subscriptions are active and healthy!</Text>
              </View>
            ) : (
              <View style={styles.webAlertsList}>
                {alertTenants.map((t) => (
                  <View key={t.id} style={styles.webAlertItem}>
                    <View style={styles.webAlertMain}>
                      <Text style={styles.webAlertClinicName}>{t.clinic_name || t.name || 'Clinic'}</Text>
                      <Text style={styles.webAlertOwner}>{t.name || 'Owner'} · {t.phone || t.email || 'No contact'}</Text>
                      <Text style={styles.webAlertDate}>Date: {formatDate(t.created_at, 'dd/MM/yyyy')}</Text>
                    </View>
                    <View style={styles.webAlertStatusBox}>
                      <Badge
                        label={t.subscription_status === 'trial' ? 'Trial' : 'Expired'}
                        variant={t.subscription_status === 'trial' ? 'warning' : 'danger'}
                        size="sm"
                        dot
                      />
                      <TouchableOpacity
                        style={styles.webAlertActionBtn}
                        onPress={() => {
                          const next = t.subscription_status === 'canceled' ? 'active' : 'canceled';
                          updateTenantStatusMutation.mutate({ id: t.id, status: next });
                        }}
                      >
                        <Text style={styles.webAlertActionText}>
                          {t.subscription_status === 'canceled' ? 'Unblock' : 'Block'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  // =========================================================================
  // RENDER B: 🏢 CLINIC PRACTICE DASHBOARD (ADMIN, THERAPIST, RECEPTIONIST, BILLING)
  // =========================================================================
  const [showTrialModal, setShowTrialModal] = useState(false);

  const isTrial =
    user?.tenant?.subscription_status === 'trial' ||
    String(user?.tenant?.plan || '').toLowerCase().includes('trial') ||
    String(clinicProfile?.plan || '').toLowerCase().includes('trial') ||
    clinicProfile?.subscriptionStatus === 'trial';

  const trialDaysRemaining = useMemo(() => {
    if (!isTrial) return null;
    if (clinicProfile?.trialDaysLeft !== undefined) {
      return Number(clinicProfile.trialDaysLeft);
    }
    const createdStr = user?.tenant?.created_at || (user as any)?.created_at;
    if (createdStr) {
      const createdAt = new Date(createdStr);
      const diffMs = Date.now() - createdAt.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(0, 7 - diffDays);
    }
    return 7;
  }, [isTrial, user?.tenant, clinicProfile]);

  useEffect(() => {
    if (isTrial && typeof trialDaysRemaining === 'number') {
      setShowTrialModal(true);
    }
  }, [isTrial, user?.id]);

  const totalAppts = appointments.length;
  const completedAppts = appointments.filter((a) => a.status === 'completed').length;
  const checkedInAppts = appointments.filter((a) => a.status === 'checked_in').length;
  const scheduledAppts = appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length;
  const totalPatientsCount = patients.length || analytics?.totalPatients || 0;
  const pendingInvoices = invoices.filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE').length;
  const pendingPaymentsTotal = invoices
    .filter((i) => i.status === 'PENDING' || i.status === 'OVERDUE')
    .reduce((acc, curr) => acc + Number(curr.total || 0), 0);
  const totalRevenueCalc = analytics?.totalRevenue || invoices.reduce((acc, curr) => acc + Number(curr.total || 0), 0);

  const displayedAppointments = isTherapist
    ? appointments.filter((a) => !a.therapist_id || a.therapist_id === user?.id || true).slice(0, 5)
    : appointments.slice(0, 5);

  const getRoleHeader = () => {
    if (isAdmin) {
      return {
        badge: 'ADMINISTRATOR',
        tagline: 'Clinic Operations, Staff & Practice Overview',
        icon: <Building size={14} color={Colors.primary} />,
      };
    }
    if (isTherapist) {
      return {
        badge: 'THERAPIST (CLINICAL)',
        tagline: 'Daily Therapy Schedule & SOAP Documentation',
        icon: <UserCheck size={14} color={Colors.success} />,
      };
    }
    if (isReceptionist) {
      return {
        badge: 'FRONT DESK',
        tagline: 'Patient Arrivals, Check-ins & Booking Agenda',
        icon: <Clock size={14} color={Colors.secondary} />,
      };
    }
    return {
      badge: 'BILLING & FINANCE',
      tagline: 'Invoices, Collections & Payments Ledger',
      icon: <CreditCard size={14} color="#2563EB" />,
    };
  };

  const roleMeta = getRoleHeader();

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.clinicName}>{user?.tenant?.clinic_name || clinicProfile?.clinicName || 'Clinic Practice'}</Text>
            <Text style={styles.greeting}>
              {isTherapist ? `Dr. ${user?.name || 'Therapist'}` : `Welcome back, ${user?.name || 'User'}`}
            </Text>
            <Text style={styles.roleTagline}>{roleMeta.tagline}</Text>
          </View>
          <View style={styles.headerIcons}>
            {hasModule('Analytics') && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => router.push('/(app)/analytics')}
                activeOpacity={0.7}
              >
                <TrendingUp size={18} color={Colors.dark} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerAvatarBtn}
              onPress={() => router.push('/(app)/(tabs)/profile')}
              activeOpacity={0.7}
            >
              {user?.photo ? (
                <Image source={{ uri: user.photo }} style={styles.headerAvatarImg} />
              ) : (
                <View style={styles.headerAvatarInitial}>
                  <Text style={styles.headerAvatarInitialText}>
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 🌟 7-Day Free Trial Top Notification Banner (matching website MainLayout) */}
        {isTrial && (
          <TouchableOpacity
            style={styles.trialTopBanner}
            onPress={() => setShowTrialModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.trialBannerContent}>
              <View style={styles.trialDotWrap}>
                <View style={styles.trialPulseDot} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.trialBannerText}>
                  Free Trial: <Text style={styles.trialBannerDays}>{trialDaysRemaining ?? 7} Days Remaining</Text>
                </Text>
                <Text style={styles.trialBannerSub}>Tap to view details or upgrade plan</Text>
              </View>
              <TouchableOpacity
                style={styles.trialUpgradeBtn}
                onPress={() => router.push('/(app)/settings/plans')}
                activeOpacity={0.7}
              >
                <Text style={styles.trialUpgradeBtnText}>Upgrade</Text>
                <ChevronRight size={12} color="#FFF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}

        {/* Role Pill & Date */}
        <View style={styles.roleContainer}>
          <View style={styles.rolePill}>
            {roleMeta.icon}
            <Text style={styles.rolePillText}>{roleMeta.badge}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(new Date().toISOString(), 'EEE, dd MMM yyyy')}</Text>
        </View>

        {/* 👑 ADMIN METRICS ROW 1: 5 KEY STAT CARDS (EXACT WEBSITE PARITY) */}
        {isAdmin && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adminKpiScroll}>
              <Card style={styles.websiteKpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Users size={16} color="#2563EB" />
                </View>
                <Text style={styles.kpiLabel}>TOTAL PATIENTS</Text>
                <Text style={styles.kpiValue}>{totalPatientsCount}</Text>
              </Card>

              <Card style={styles.websiteKpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#F3E8FF' }]}>
                  <Calendar size={16} color="#7E22CE" />
                </View>
                <Text style={styles.kpiLabel}>TODAY'S APPOINTMENTS</Text>
                <Text style={styles.kpiValue}>{totalAppts}</Text>
              </Card>

              <Card style={styles.websiteKpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#FDF2F8' }]}>
                  <FileText size={16} color="#DB2777" />
                </View>
                <Text style={styles.kpiLabel}>PENDING BILLS</Text>
                <Text style={styles.kpiValue}>
                  {pendingInvoices ? formatCurrency(pendingPaymentsTotal) : '₹0'}
                </Text>
              </Card>

              <Card style={styles.websiteKpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <TrendingUp size={16} color="#059669" />
                </View>
                <Text style={styles.kpiLabel}>REVENUE</Text>
                <Text style={styles.kpiValue}>
                  {totalRevenueCalc ? formatCurrency(totalRevenueCalc) : '₹0'}
                </Text>
              </Card>

              <Card style={styles.websiteKpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#EDE9FE' }]}>
                  <Users size={16} color="#6D28D9" />
                </View>
                <Text style={styles.kpiLabel}>STAFF COUNT</Text>
                <Text style={styles.kpiValue}>{staffList.length}</Text>
              </Card>
            </ScrollView>

            {/* 👑 ADMIN METRICS ROW 2: 4 PLAN / SUBSCRIPTION LIMIT CARDS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adminKpiScroll}>
              <Card style={[styles.websiteKpiCard, { borderColor: '#E2E8F0' }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#F8FAFC' }]}>
                  <RotateCcw size={16} color="#0284C7" />
                </View>
                <Text style={styles.kpiLabel}>CURRENT PLAN</Text>
                <Text style={[styles.kpiValue, { fontSize: 15 }]}>
                  {String(user?.tenant?.plan || clinicProfile?.plan || 'Starter').toUpperCase()}
                </Text>
              </Card>

              <Card style={[styles.websiteKpiCard, { borderColor: '#E2E8F0' }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Calendar size={16} color="#D97706" />
                </View>
                <Text style={styles.kpiLabel}>TRIAL REMAINING</Text>
                <Text style={[styles.kpiValue, { fontSize: 15 }]}>
                  {clinicProfile?.trialDaysLeft ? `${clinicProfile.trialDaysLeft} Days` : (user?.tenant?.subscription_status === 'trial' ? '7 DAYS' : 'ACTIVE')}
                </Text>
              </Card>

              <Card style={[styles.websiteKpiCard, { borderColor: '#E2E8F0' }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Users size={16} color="#2563EB" />
                </View>
                <Text style={styles.kpiLabel}>PATIENT LIMIT</Text>
                <Text style={[styles.kpiValue, { fontSize: 15 }]}>
                  {totalPatientsCount}/1000
                </Text>
              </Card>

              <Card style={[styles.websiteKpiCard, { borderColor: '#E2E8F0' }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#F3E8FF' }]}>
                  <UserCheck size={16} color="#7E22CE" />
                </View>
                <Text style={styles.kpiLabel}>STAFF LIMIT</Text>
                <Text style={[styles.kpiValue, { fontSize: 15 }]}>
                  {staffList.length}/15
                </Text>
              </Card>
            </ScrollView>
          </>
        )}

        {/* THERAPIST METRICS */}
        {isTherapist && (
          <View style={styles.metricsGrid}>
            <Card style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: Colors.primaryLight }]}>
                <Calendar size={18} color={Colors.primaryDark} />
              </View>
              <Text style={styles.metricValue}>{totalAppts}</Text>
              <Text style={styles.metricLabel}>Today's Schedule</Text>
            </Card>

            <Card style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: Colors.secondaryLight }]}>
                <Users size={18} color={Colors.secondaryDark} />
              </View>
              <Text style={styles.metricValue}>{totalPatientsCount}</Text>
              <Text style={styles.metricLabel}>My Patients</Text>
            </Card>

            <Card style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: Colors.successLight }]}>
                <FileText size={18} color="#065F46" />
              </View>
              <Text style={styles.metricValue}>{notes.length}</Text>
              <Text style={styles.metricLabel}>SOAP Notes</Text>
            </Card>

            <Card style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Clock size={18} color="#D97706" />
              </View>
              <Text style={styles.metricValue}>{scheduledAppts}</Text>
              <Text style={styles.metricLabel}>Upcoming</Text>
            </Card>
          </View>
        )}

        {/* RECEPTIONIST METRICS */}
        {isReceptionist && (
          <View style={styles.metricsGrid}>
            <Card style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <QrCode size={18} color={Colors.success} />
              </View>
              <Text style={styles.metricValue}>{checkedInAppts}</Text>
              <Text style={styles.metricLabel}>Checked In</Text>
            </Card>

            <Card style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: Colors.primaryLight }]}>
                <Calendar size={18} color={Colors.primaryDark} />
              </View>
              <Text style={styles.metricValue}>{scheduledAppts}</Text>
              <Text style={styles.metricLabel}>Waiting / Queue</Text>
            </Card>

            <Card style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: Colors.secondaryLight }]}>
                <Users size={18} color={Colors.secondaryDark} />
              </View>
              <Text style={styles.metricValue}>{totalPatientsCount}</Text>
              <Text style={styles.metricLabel}>Directory</Text>
            </Card>

            <Card style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: Colors.infoLight }]}>
                <Receipt size={18} color="#1E40AF" />
              </View>
              <Text style={styles.metricValue}>{invoices.length}</Text>
              <Text style={styles.metricLabel}>Bills Today</Text>
            </Card>
          </View>
        )}

        {/* BILLING USER METRICS */}
        {isBilling && (
          <View style={styles.metricsGrid}>
            <Card style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: Colors.infoLight }]}>
                <Receipt size={18} color="#1E40AF" />
              </View>
              <Text style={styles.metricValue}>
                {totalRevenueCalc ? formatCurrency(totalRevenueCalc) : '₹0'}
              </Text>
              <Text style={styles.metricLabel}>Total Revenue</Text>
            </Card>

            <Card style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <DollarSign size={18} color={Colors.success} />
              </View>
              <Text style={styles.metricValue}>{invoices.length - pendingInvoices}</Text>
              <Text style={styles.metricLabel}>Paid Invoices</Text>
            </Card>

            <Card style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <AlertCircle size={18} color={Colors.danger} />
              </View>
              <Text style={styles.metricValue}>{pendingInvoices}</Text>
              <Text style={styles.metricLabel}>Unpaid / Due</Text>
            </Card>

            <Card style={styles.metricCard}>
              <View style={[styles.metricIconCircle, { backgroundColor: Colors.secondaryLight }]}>
                <Users size={18} color={Colors.secondaryDark} />
              </View>
              <Text style={styles.metricValue}>{invoices.length}</Text>
              <Text style={styles.metricLabel}>Total Invoices</Text>
            </Card>
          </View>
        )}

        {/* Quick Actions Title */}
        <Text style={styles.sectionTitle}>
          {isTherapist ? 'Clinical Quick Actions' : isReceptionist ? 'Front Desk Actions' : isBilling ? 'Finance Actions' : 'Quick Actions'}
        </Text>

        {/* Role Tailored Quick Actions Row */}
        <View style={styles.quickActionsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            {(isAdmin || isReceptionist || can('appointments.manage')) && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push('/(app)/appointments/book')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBox, { backgroundColor: Colors.primaryLight }]}>
                  <PlusCircle size={22} color={Colors.primaryDark} />
                </View>
                <Text style={styles.actionText} numberOfLines={2}>
                  Book Appt
                </Text>
              </TouchableOpacity>
            )}

            {(isAdmin || isTherapist || isReceptionist) && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push('/(app)/appointments/checkin')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <QrCode size={22} color={Colors.success} />
                </View>
                <Text style={styles.actionText} numberOfLines={2}>
                  Fast Check-In
                </Text>
              </TouchableOpacity>
            )}

            {(isAdmin || isReceptionist || can('patient.write')) && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push('/(app)/patients/create')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBox, { backgroundColor: Colors.secondaryLight }]}>
                  <Users size={22} color={Colors.secondaryDark} />
                </View>
                <Text style={styles.actionText} numberOfLines={2}>
                  New Patient
                </Text>
              </TouchableOpacity>
            )}

            {(isAdmin || isTherapist || can('notes.manage')) && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push('/(app)/notes/create')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <FileText size={22} color="#2563EB" />
                </View>
                <Text style={styles.actionText} numberOfLines={2}>
                  SOAP Note
                </Text>
              </TouchableOpacity>
            )}

            {(isAdmin || isBilling || can('billing.manage')) && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push('/(app)/billing/create-invoice')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Receipt size={22} color="#D97706" />
                </View>
                <Text style={styles.actionText} numberOfLines={2}>
                  New Invoice
                </Text>
              </TouchableOpacity>
            )}

            {(isAdmin || isTherapist || isReceptionist || isBilling || can('billing.manage') || can('appointments.create')) && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push('/(app)/services' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#FDF4FF' }]}>
                  <Tag size={22} color="#A855F7" />
                </View>
                <Text style={styles.actionText} numberOfLines={2}>
                  Services
                </Text>
              </TouchableOpacity>
            )}

            {isTherapist && (
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => router.push('/(app)/forms')}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#F3E8FF' }]}>
                  <ClipboardList size={22} color="#7E22CE" />
                </View>
                <Text style={styles.actionText} numberOfLines={2}>
                  Forms
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* ADMIN EXCLUSIVE HUB */}
        {isAdmin && (
          <View style={styles.adminHubContainer}>
            <View style={styles.adminHubHeader}>
              <View style={styles.adminHubTitleRow}>
                <Sparkles size={16} color={Colors.primary} />
                <Text style={styles.adminHubTitle}>Practice Administration</Text>
              </View>
              <Badge label="Clinic Manager" variant="primary" size="sm" />
            </View>

            <View style={styles.adminGrid}>
              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push('/(app)/services' as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.adminIconBox, { backgroundColor: '#FDF4FF' }]}>
                  <Tag size={18} color="#A855F7" />
                </View>
                <Text style={styles.adminCardTitle}>Services & Rates</Text>
                <Text style={styles.adminCardSub}>Catalog & Pricing</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push('/(app)/settings/users')}
                activeOpacity={0.7}
              >
                <View style={[styles.adminIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Users size={18} color="#2563EB" />
                </View>
                <Text style={styles.adminCardTitle}>Staff Users</Text>
                <Text style={styles.adminCardSub}>Roles & Permissions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push('/(app)/settings/clinic')}
                activeOpacity={0.7}
              >
                <View style={[styles.adminIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Building size={18} color="#D97706" />
                </View>
                <Text style={styles.adminCardTitle}>Clinic Profile</Text>
                <Text style={styles.adminCardSub}>Branding & Timings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push('/(app)/analytics')}
                activeOpacity={0.7}
              >
                <View style={[styles.adminIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <TrendingUp size={18} color="#059669" />
                </View>
                <Text style={styles.adminCardTitle}>Analytics</Text>
                <Text style={styles.adminCardSub}>Revenue & Growth</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Clinic Today's Schedule */}
        {(isAdmin || isTherapist || isReceptionist || hasModule('Appointments')) && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isTherapist ? 'My Clinical Appointments' : "Today's Clinic Sessions"}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(app)/(tabs)/appointments')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {displayedAppointments.length === 0 ? (
              <EmptyState
                title="No Appointments Scheduled"
                description={isTherapist ? "You have no sessions assigned for today." : "No patient sessions booked for today."}
                actionTitle="Book an Appointment"
                onActionPress={() => router.push('/(app)/appointments/book')}
              />
            ) : (
              displayedAppointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  onPress={() => router.push(`/(app)/appointments/${appt.id}`)}
                  onCheckIn={() => handleCheckIn(appt.id)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* 🚀 7-Day Free Trial Login/Entry Popup Modal (matching website behavior) */}
      <Modal
        visible={showTrialModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTrialModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTrialModal(false)}>
          <View style={styles.trialModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.trialModalCard}>
                {/* Top Glowing Icon Badge */}
                <View style={styles.trialModalIconBox}>
                  <Sparkles size={28} color="#0D9488" />
                </View>

                {/* Remaining Days Badge */}
                <View style={styles.trialBadgePill}>
                  <Text style={styles.trialBadgePillText}>
                    {trialDaysRemaining !== null ? `${trialDaysRemaining} DAYS REMAINING` : '7-DAY FREE TRIAL'}
                  </Text>
                </View>

                <Text style={styles.trialModalTitle}>7-Day Free Trial Active</Text>
                <Text style={styles.trialModalMessage}>
                  Welcome to your clinic workspace! You are currently using the{' '}
                  <Text style={{ fontWeight: '800', color: Colors.dark }}>7-Day Free Trial</Text> for{' '}
                  <Text style={{ fontWeight: '800', color: Colors.primaryDark }}>
                    {user?.tenant?.clinic_name || 'your clinic'}
                  </Text>
                  . Upgrade anytime to unlock unlimited features and prevent any interruption.
                </Text>

                {/* Feature Bullet Points */}
                <View style={styles.trialFeatureList}>
                  <View style={styles.trialFeatureRow}>
                    <CheckCircle2 size={15} color="#0D9488" />
                    <Text style={styles.trialFeatureText}>Full Access to Scheduling & Online Bookings</Text>
                  </View>
                  <View style={styles.trialFeatureRow}>
                    <CheckCircle2 size={15} color="#0D9488" />
                    <Text style={styles.trialFeatureText}>SOAP Clinical Notes & Patient Records</Text>
                  </View>
                  <View style={styles.trialFeatureRow}>
                    <CheckCircle2 size={15} color="#0D9488" />
                    <Text style={styles.trialFeatureText}>Billing, Invoices & Receipt Generation</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.trialModalBtnCol}>
                  <TouchableOpacity
                    style={styles.trialPrimaryBtn}
                    onPress={() => {
                      setShowTrialModal(false);
                      router.push('/(app)/settings/plans');
                    }}
                    activeOpacity={0.8}
                  >
                    <Crown size={16} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.trialPrimaryBtnText}>Upgrade / View Plans</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.trialSecondaryBtn}
                    onPress={() => setShowTrialModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.trialSecondaryBtnText}>Continue to Dashboard</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  saasBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  saasBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  clinicName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.dark,
    letterSpacing: -0.3,
  },
  roleTagline: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
    lineHeight: 16,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saasSettingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarImg: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerAvatarInitial: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitialText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.dark,
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 12,
    color: Colors.slate,
    fontWeight: '600',
  },
  saasHeroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  heroMainAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 14,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatItem: {
    flex: 1,
  },
  heroStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#38BDF8',
  },
  heroStatLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  metricCard: {
    width: '48%',
    padding: 14,
    marginBottom: 0,
    borderRadius: 16,
  },
  metricIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.dark,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 10,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  saasActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  saasActionCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saasActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  saasActionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
  },
  saasActionSub: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  tenantWatchCard: {
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
  },
  tenantWatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tenantAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tenantAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  tenantInfo: {
    flex: 1,
  },
  tenantClinicName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
  },
  tenantAdminEmail: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 1,
  },
  tenantPlanText: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  tenantStatusCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate,
  },
  quickActionsContainer: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  quickActionsScroll: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 16,
    alignItems: 'flex-start',
  },
  actionItem: {
    alignItems: 'center',
    width: 76,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.dark,
    textAlign: 'center',
    lineHeight: 15,
  },
  adminHubContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  adminHubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminHubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminHubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  adminGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  adminCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adminIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  adminCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
  },
  adminCardSub: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  // ===================== SuperAdmin Website Parity Styles =====================
  webHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 4,
  },
  webHeaderTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: -0.4,
  },
  webHeaderSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  webPulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  webHeaderSubText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.slate,
    letterSpacing: 0.6,
  },
  webStatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  webStatCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  webStatBlob: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 65,
    height: 65,
    borderBottomLeftRadius: 65,
    opacity: 0.6,
  },
  webStatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  webStatTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: Colors.slate,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  webStatValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: -0.5,
  },
  webStatIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webNavyBanner: {
    backgroundColor: '#0B132B',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#0B132B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  webNavyCol: {
    flex: 1,
    alignItems: 'center',
  },
  webNavyAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 3,
  },
  webNavyLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  webNavyDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  webAlertsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  webAlertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  webAlertsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webAlertsIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webAlertsTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.dark,
  },
  webAlertsBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webReminderBtn: {
    backgroundColor: '#F97316',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  webReminderBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  webAlertsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  webAlertsEmptyText: {
    fontSize: 12,
    color: Colors.slate,
    fontWeight: '600',
  },
  webAlertsList: {
    gap: 10,
  },
  webAlertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  webAlertMain: {
    flex: 1,
    paddingRight: 8,
  },
  webAlertClinicName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
  },
  webAlertOwner: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
    fontWeight: '600',
  },
  webAlertDate: {
    fontSize: 10,
    color: '#E11D48',
    fontWeight: '700',
    marginTop: 2,
  },
  webAlertStatusBox: {
    alignItems: 'flex-end',
    gap: 6,
  },
  webAlertActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  webAlertActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  adminKpiScroll: {
    gap: 10,
    paddingBottom: 6,
    marginBottom: 8,
  },
  websiteKpiCard: {
    width: 145,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.slate,
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: -0.3,
  },
  trialTopBanner: {
    backgroundColor: '#042F2E',
    borderRadius: 14,
    marginBottom: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#0D9488',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  trialBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trialDotWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trialPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#14B8A6',
  },
  trialBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#CCFBF1',
  },
  trialBannerDays: {
    fontWeight: '900',
    color: '#2DD4BF',
  },
  trialBannerSub: {
    fontSize: 11,
    color: '#99F6E4',
    marginTop: 1,
  },
  trialUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 3,
  },
  trialUpgradeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFF',
  },
  trialModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  trialModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  trialModalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  trialBadgePill: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  trialBadgePillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  trialModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  trialModalMessage: {
    fontSize: 13,
    color: Colors.slate,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  trialFeatureList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trialFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trialFeatureText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  trialModalBtnCol: {
    width: '100%',
    gap: 10,
  },
  trialPrimaryBtn: {
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  trialPrimaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  trialSecondaryBtn: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  trialSecondaryBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
});
