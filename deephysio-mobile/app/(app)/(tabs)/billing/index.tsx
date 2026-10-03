import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Plus,
  CreditCard,
  Search,
  Tag,
  ArrowUpRight,
  TrendingUp,
  Percent,
  Wallet,
  Calendar,
  ChevronRight,
  ShieldAlert,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react-native';
import { billingApi } from '../../../../src/api/billing.api';
import { usePermissions } from '../../../../src/hooks/usePermissions';
import ScreenWrapper from '../../../../src/components/common/ScreenWrapper';
import Card from '../../../../src/components/common/Card';
import EmptyState from '../../../../src/components/common/EmptyState';
import LoadingState from '../../../../src/components/common/LoadingState';
import Colors from '../../../../src/constants/colors';
import { formatCurrency } from '../../../../src/utils/currency';
import { formatDate } from '../../../../src/utils/date';
import { Invoice, Payment, Service } from '../../../../src/types/billing.types';

const STATUS_PILLS = [
  { label: 'All', value: 'all', color: '#64748B' },
  { label: 'Paid', value: 'PAID', color: '#10B981' },
  { label: 'Pending', value: 'PENDING', color: '#F59E0B' },
  { label: 'Overdue', value: 'OVERDUE', color: '#EF4444' },
  { label: 'Cancelled', value: 'CANCELLED', color: '#94A3B8' },
];

export default function BillingScreen() {
  const router = useRouter();
  const { hasModule, can, isAdmin, isBilling } = usePermissions();

  const hasBillingAccess = isAdmin || isBilling || hasModule('Billing');

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'history' | 'services'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const {
    data: invoices = [],
    isLoading: loadingInvoices,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: ['invoices-list', selectedStatus],
    queryFn: () =>
      billingApi.getInvoices(
        selectedStatus !== 'all' ? { status: selectedStatus } : undefined
      ),
    enabled: hasBillingAccess,
  });

  const {
    data: payments = [],
    isLoading: loadingPayments,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ['payments-list'],
    queryFn: () => billingApi.getPayments(),
    enabled: hasBillingAccess,
  });

  const {
    data: services = [],
    isLoading: loadingServices,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ['services-list'],
    queryFn: () => billingApi.getServices(),
    enabled: hasBillingAccess,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchInvoices(), refetchPayments(), refetchServices()]);
    setRefreshing(false);
  };

  // KPI Calculations
  const totalBilled = useMemo(
    () => invoices.reduce((acc, inv) => acc + Number(inv.total || 0), 0),
    [invoices]
  );
  const totalCollected = useMemo(
    () => payments.reduce((acc, pay) => acc + Number(pay.amount || 0), 0),
    [payments]
  );
  const outstandingAsset = Math.max(0, totalBilled - totalCollected);
  const efficiencyRate = totalBilled > 0 ? Math.min(100, Math.round((totalCollected / totalBilled) * 100)) : 100;

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const patientName = inv.patient
        ? `${inv.patient.first_name || inv.patient.firstName || ''} ${inv.patient.last_name || inv.patient.lastName || ''}`.toLowerCase()
        : '';
      const invNum = (inv.invoice_number || String(inv.id)).toLowerCase();
      const q = searchTerm.toLowerCase();

      const matchesSearch = !searchTerm || patientName.includes(q) || invNum.includes(q);
      const matchesStatus =
        selectedStatus === 'all' ||
        inv.status?.toUpperCase() === selectedStatus.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, selectedStatus]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      const patientName = pay.patient
        ? `${pay.patient.first_name || pay.patient.firstName || ''} ${pay.patient.last_name || pay.patient.lastName || ''}`.toLowerCase()
        : '';
      const method = (pay.method || '').toLowerCase();
      const q = searchTerm.toLowerCase();
      return !searchTerm || patientName.includes(q) || method.includes(q);
    });
  }, [payments, searchTerm]);

  // If user has no access to billing
  if (!hasBillingAccess) {
    return (
      <ScreenWrapper>
        <View style={styles.restrictedContainer}>
          <ShieldAlert size={54} color={Colors.warning} />
          <Text style={styles.restrictedTitle}>Access Restricted</Text>
          <Text style={styles.restrictedDesc}>
            You do not have permission to access the Billing module. Please contact your clinic administrator for access.
          </Text>
          <TouchableOpacity
            style={styles.restrictedBtn}
            onPress={() => router.replace('/(app)/(tabs)')}
            activeOpacity={0.8}
          >
            <Text style={styles.restrictedBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* ── 1. Header (Matching Web Header Flow) ── */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <FileSpreadsheet size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>INVOICE REGISTRY</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              BILLING & FINANCIAL LEDGER
            </Text>
          </View>
        </View>

        {can('billing.manage') && (
          <TouchableOpacity
            style={styles.issueBtn}
            onPress={() => router.push('/(app)/billing/create-invoice')}
            activeOpacity={0.8}
          >
            <Plus size={13} color={Colors.surface} />
            <Text style={styles.issueBtnText}>ISSUE INVOICE</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── 2. Top KPI Cards (Matching Web Outstanding Asset, Monthly Yield, Efficiency) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiContainer}
        >
          {/* Card 1: Outstanding Asset (Dark) */}
          <View style={[styles.kpiCard, styles.kpiCardDark]}>
            <View style={styles.kpiTop}>
              <View style={styles.kpiLabelRow}>
                <Wallet size={12} color="#38BDF8" />
                <Text style={styles.kpiLabelDark} numberOfLines={1}>
                  OUTSTANDING ASSET
                </Text>
              </View>
              <View style={styles.kpiBadgeDark}>
                <Text style={styles.kpiBadgeDarkText}>+12% VAR</Text>
              </View>
            </View>
            <Text style={styles.kpiValueDark}>{formatCurrency(outstandingAsset)}</Text>
          </View>

          {/* Card 2: Monthly Yield (MTD) */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <View style={styles.kpiLabelRow}>
                <TrendingUp size={12} color="#10B981" />
                <Text style={styles.kpiLabel} numberOfLines={1}>
                  MONTHLY YIELD (MTD)
                </Text>
              </View>
              <View style={styles.kpiBadgeSuccess}>
                <Text style={styles.kpiBadgeSuccessText}>+8.2%</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>{formatCurrency(totalCollected)}</Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.max(15, efficiencyRate))}%` },
                ]}
              />
            </View>
          </View>

          {/* Card 3: Efficiency Rate */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <View style={styles.kpiLabelRow}>
                <Percent size={12} color="#6366F1" />
                <Text style={styles.kpiLabel} numberOfLines={1}>
                  EFFICIENCY RATE
                </Text>
              </View>
              <View style={styles.kpiBadgeBlue}>
                <Text style={styles.kpiBadgeBlueText}>OPTIMUM</Text>
              </View>
            </View>
            <Text style={styles.kpiValue}>{efficiencyRate}.0%</Text>
          </View>
        </ScrollView>

        {/* ── 3. Sub-Navigation Tabs (Matching Web Sidebar) ── */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'invoices' && styles.tabItemActive]}
            onPress={() => setActiveTab('invoices')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'invoices' && styles.tabTextActive]}>
              Invoices ({invoices.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'payments' && styles.tabItemActive]}
            onPress={() => setActiveTab('payments')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
              Payments ({payments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'history' && styles.tabItemActive]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'services' && styles.tabItemActive]}
            onPress={() => setActiveTab('services')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
              Pricing / Services
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 4. Search & Filter Bar ── */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Search size={15} color={Colors.slate} />
            <TextInput
              style={styles.searchInput}
              placeholder={
                activeTab === 'services'
                  ? 'Filter clinic services...'
                  : 'Filter transactions by patient, invoice #...'
              }
              placeholderTextColor={Colors.slate}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Text style={styles.clearSearch}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Status Pills for Invoices */}
          {activeTab === 'invoices' && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statusPillsRow}
            >
              {STATUS_PILLS.map((p) => {
                const isActive = selectedStatus === p.value;
                return (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.statusPill, isActive && styles.statusPillActive]}
                    onPress={() => setSelectedStatus(p.value)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.statusDot, { backgroundColor: p.color }]} />
                    <Text
                      style={[styles.statusPillText, isActive && styles.statusPillTextActive]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── 5. Main Content Area ── */}
        {activeTab === 'invoices' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>VERIFIED INVOICES</Text>
                <Text style={styles.sectionSubtitle}>SYNCHRONIZED REAL-TIME TRACKING</Text>
              </View>
              <Text style={styles.countBadge}>{filteredInvoices.length} Total</Text>
            </View>

            {loadingInvoices ? (
              <LoadingState message="Loading invoices..." />
            ) : filteredInvoices.length === 0 ? (
              <EmptyState
                title="No Invoices Found"
                description="No billing invoices match your current search or filter."
                actionTitle={can('billing.manage') ? 'Issue New Invoice' : undefined}
                onActionPress={() => router.push('/(app)/billing/create-invoice')}
              />
            ) : (
              filteredInvoices.map((inv) => (
                <InvoiceRegistryCard
                  key={inv.id}
                  invoice={inv}
                  onPress={() => router.push(`/(app)/billing/invoices/${inv.id}`)}
                  onRecordPayment={() => {
                    const pId = inv.patient_id || (inv as any).patientId || inv.patient?.id;
                    router.push({
                      pathname: '/(app)/billing/record-payment',
                      params: {
                        invoiceId: inv.id,
                        patientId: pId ? String(pId) : '',
                        amount: inv.total ? String(inv.total) : '',
                      },
                    });
                  }}
                />
              ))
            )}
          </View>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>RECORDED PAYMENTS</Text>
                <Text style={styles.sectionSubtitle}>RECEIPT AUDIT & RECONCILIATION</Text>
              </View>
              <Text style={styles.countBadge}>{filteredPayments.length} Receipts</Text>
            </View>

            {loadingPayments ? (
              <LoadingState message="Loading payments..." />
            ) : filteredPayments.length === 0 ? (
              <EmptyState
                title="No Payments Recorded"
                description="Record payments received from patients to balance ledgers."
                actionTitle={can('billing.manage') ? 'Record Payment' : undefined}
                onActionPress={() => router.push('/(app)/billing/record-payment')}
              />
            ) : (
              filteredPayments.map((pay) => (
                <Card key={pay.id} style={styles.paymentCard}>
                  <View style={styles.paymentRow}>
                    <View style={styles.paymentIconWrap}>
                      <CreditCard size={18} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentPatientName}>
                        {pay.patient
                          ? `${pay.patient.first_name || pay.patient.firstName || ''} ${pay.patient.last_name || pay.patient.lastName || ''}`.trim()
                          : 'Patient'}
                      </Text>
                      <View style={styles.paymentMetaRow}>
                        <Calendar size={11} color={Colors.slate} />
                        <Text style={styles.paymentMetaText}>{formatDate(pay.date)}</Text>
                        <Text style={styles.paymentDot}>•</Text>
                        <Text style={styles.paymentMetaText}>{pay.method || 'Cash'}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.paymentAmount}>{formatCurrency(pay.amount)}</Text>
                      <View style={styles.statusPillPaid}>
                        <CheckCircle2 size={10} color="#10B981" />
                        <Text style={styles.statusPillPaidText}>Received</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>PAYMENT HISTORY & LEDGER</Text>
                <Text style={styles.sectionSubtitle}>TIMELINE OF REVENUE TRANSACTIONS</Text>
              </View>
            </View>
            <Card style={styles.historyCard}>
              <View style={styles.historyRow}>
                <Text style={styles.historyKey}>Total Lifetime Invoiced</Text>
                <Text style={styles.historyVal}>{formatCurrency(totalBilled)}</Text>
              </View>
              <View style={styles.historyDivider} />
              <View style={styles.historyRow}>
                <Text style={styles.historyKey}>Total Collected Revenue</Text>
                <Text style={[styles.historyVal, { color: Colors.success }]}>
                  {formatCurrency(totalCollected)}
                </Text>
              </View>
              <View style={styles.historyDivider} />
              <View style={styles.historyRow}>
                <Text style={styles.historyKey}>Outstanding Patient Balance</Text>
                <Text style={[styles.historyVal, { color: Colors.danger }]}>
                  {formatCurrency(outstandingAsset)}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Pricing / Services Tab */}
        {activeTab === 'services' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>CLINIC SERVICES & PRICING</Text>
                <Text style={styles.sectionSubtitle}>STANDARD CHARGES & TREATMENT FEES</Text>
              </View>
              <TouchableOpacity
                style={[styles.addServiceBtn, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}
                onPress={() => router.push('/(app)/services' as any)}
              >
                <Plus size={14} color={Colors.surface} />
                <Text style={styles.addServiceText}>Add Service</Text>
              </TouchableOpacity>
            </View>

            {loadingServices ? (
              <LoadingState message="Loading services..." />
            ) : services.length === 0 ? (
              <EmptyState
                title="No Services Configured"
                description="Configure treatment services and price list for quick appointment booking and invoicing."
                actionTitle="Add First Service"
                onActionPress={() => router.push('/(app)/services' as any)}
              />
            ) : (
              services.map((s) => (
                <Card
                  key={s.id}
                  style={styles.serviceCard}
                  onPress={() => router.push('/(app)/services' as any)}
                >
                  <View style={styles.serviceRow}>
                    <View style={styles.serviceIconWrap}>
                      <Tag size={16} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName}>{s.name}</Text>
                      <Text style={styles.serviceDuration}>
                        {s.duration || 30} mins • {s.category || 'General Consultation'}
                      </Text>
                    </View>
                    <Text style={styles.servicePrice}>{formatCurrency(s.price)}</Text>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {(can('billing.manage') || activeTab === 'services') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (activeTab === 'services') {
              router.push('/(app)/services' as any);
            } else if (activeTab === 'payments') {
              router.push('/(app)/billing/record-payment');
            } else {
              router.push('/(app)/billing/create-invoice');
            }
          }}
          activeOpacity={0.85}
        >
          <Plus size={24} color={Colors.surface} />
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
}

// Sub-component: Invoice Registry Card
function InvoiceRegistryCard({
  invoice,
  onPress,
  onRecordPayment,
}: {
  invoice: Invoice;
  onPress: () => void;
  onRecordPayment: () => void;
}) {
  const patientName = invoice.patient
    ? `${invoice.patient.first_name || invoice.patient.firstName || ''} ${invoice.patient.last_name || invoice.patient.lastName || ''}`.trim() || 'Patient'
    : 'Patient';

  const isPaid = invoice.status?.toUpperCase() === 'PAID';
  const isOverdue = invoice.status?.toUpperCase() === 'OVERDUE';
  const isPending = invoice.status?.toUpperCase() === 'PENDING' || !invoice.status;

  return (
    <Card onPress={onPress} elevated style={styles.invCard}>
      {/* Top Meta: Transaction ID + Status */}
      <View style={styles.invHeader}>
        <View style={styles.txIdBadge}>
          <FileSpreadsheet size={12} color={Colors.primaryDark} />
          <Text style={styles.txIdText}>
            {invoice.invoice_number || `#INV-${invoice.id}`}
          </Text>
        </View>

        <View
          style={[
            styles.statusNode,
            isPaid && styles.statusNodePaid,
            isOverdue && styles.statusNodeOverdue,
            isPending && styles.statusNodePending,
          ]}
        >
          {isPaid && <CheckCircle2 size={11} color="#059669" />}
          {isOverdue && <AlertCircle size={11} color="#DC2626" />}
          {isPending && <Clock size={11} color="#D97706" />}
          <Text
            style={[
              styles.statusNodeText,
              isPaid && { color: '#059669' },
              isOverdue && { color: '#DC2626' },
              isPending && { color: '#D97706' },
            ]}
          >
            {invoice.status || 'PENDING'}
          </Text>
        </View>
      </View>

      {/* Center Details: Patient & Temporal Node */}
      <View style={styles.invBody}>
        <View style={{ flex: 1 }}>
          <Text style={styles.invPatientName}>{patientName}</Text>
          <View style={styles.temporalRow}>
            <Calendar size={12} color={Colors.slate} />
            <Text style={styles.temporalText}>Date: {formatDate(invoice.date)}</Text>
          </View>
        </View>

        {/* Amount Audit */}
        <View style={styles.auditAmountWrap}>
          <Text style={styles.auditAmountVal}>{formatCurrency(invoice.total)}</Text>
          <Text style={styles.itemsCount}>
            {invoice.items?.length || 1} {invoice.items?.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      {/* Footer Actions */}
      <View style={styles.invFooter}>
        <TouchableOpacity
          style={styles.actionBtnSec}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Eye size={12} color={Colors.slate} />
          <Text style={styles.actionBtnSecText}>View</Text>
        </TouchableOpacity>

        {!isPaid && (
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={onRecordPayment}
            activeOpacity={0.7}
          >
            <CreditCard size={12} color={Colors.surface} />
            <Text style={styles.actionBtnPrimaryText}>Pay</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: Colors.slate,
    fontWeight: '600',
    marginTop: 1,
  },
  issueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  issueBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.surface,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  kpiContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  kpiCard: {
    width: 195,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kpiCardDark: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  kpiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: 4,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.slate,
    letterSpacing: 0.2,
    flex: 1,
  },
  kpiLabelDark: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.2,
    flex: 1,
  },
  kpiBadgeDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  kpiBadgeDarkText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#F87171',
  },
  kpiBadgeSuccess: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  kpiBadgeSuccessText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#15803D',
  },
  kpiBadgeBlue: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  kpiBadgeBlueText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#4F46E5',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },
  kpiValueDark: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 7,
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate,
  },
  tabTextActive: {
    color: Colors.surface,
    fontWeight: '700',
  },
  filterSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.dark,
  },
  clearSearch: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  statusPillsRow: {
    paddingVertical: 10,
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  statusPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate,
  },
  statusPillTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.slate,
    letterSpacing: 0.4,
  },
  countBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  invCard: {
    padding: 12,
    marginBottom: 10,
  },
  invHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  txIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  statusNode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    backgroundColor: Colors.background,
  },
  statusNodePaid: {
    backgroundColor: '#ECFDF5',
  },
  statusNodePending: {
    backgroundColor: '#FFFBEB',
  },
  statusNodeOverdue: {
    backgroundColor: '#FEF2F2',
  },
  statusNodeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  invBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invPatientName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 3,
  },
  temporalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  temporalText: {
    fontSize: 11,
    color: Colors.slate,
  },
  auditAmountWrap: {
    alignItems: 'flex-end',
  },
  auditAmountVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.dark,
  },
  itemsCount: {
    fontSize: 10,
    color: Colors.slate,
  },
  invFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionBtnSec: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: Colors.background,
    gap: 4,
  },
  actionBtnSecText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    gap: 4,
  },
  actionBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.surface,
  },
  paymentCard: {
    padding: 12,
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  paymentPatientName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 2,
  },
  paymentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMetaText: {
    fontSize: 11,
    color: Colors.slate,
  },
  paymentDot: {
    fontSize: 11,
    color: Colors.slate,
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
  },
  statusPillPaid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
    marginTop: 3,
  },
  statusPillPaidText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  historyCard: {
    padding: 14,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  historyKey: {
    fontSize: 12,
    color: Colors.slate,
    fontWeight: '600',
  },
  historyVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
  },
  historyDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  serviceCard: {
    padding: 12,
    marginBottom: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
  },
  serviceDuration: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 1,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  addServiceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.primaryLight,
  },
  addServiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  restrictedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  restrictedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  restrictedDesc: {
    fontSize: 13,
    color: Colors.slate,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  restrictedBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  restrictedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.surface,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
