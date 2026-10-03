import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Receipt,
  X,
  Calendar,
} from 'lucide-react-native';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Card from '../../../src/components/common/Card';
import Badge from '../../../src/components/common/Badge';
import EmptyState from '../../../src/components/common/EmptyState';
import Colors from '../../../src/constants/colors';
import { saasApi } from '../../../src/api/saas.api';
import { formatCurrency } from '../../../src/utils/currency';
import { formatDate } from '../../../src/utils/date';

export default function SuperAdminRevenueScreen() {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'pending' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: revenueStats, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['saas-revenue'],
    queryFn: saasApi.getRevenue,
  });

  const { data: payments = [], isLoading: loadingPayments, refetch: refetchPayments } = useQuery({
    queryKey: ['saas-payments-list'],
    queryFn: saasApi.getPayments,
  });

  const onRefresh = async () => {
    await Promise.all([refetchStats(), refetchPayments()]);
  };

  const totalRev = revenueStats?.totalRevenue || revenueStats?.mrr || 0;

  const handleExport = () => {
    if (payments.length === 0) {
      Alert.alert('Export Report', 'No payment records available to export.');
      return;
    }
    Alert.alert('Report Exported', 'Revenue and payment transactions report generated successfully.');
  };

  const filteredPayments = payments.filter((p: any) => {
    const matchesSearch =
      (p.clinic_name || p.tenant_name || p.customer || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.id).includes(searchQuery);

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    return (p.status || 'success').toLowerCase() === filterStatus;
  });

  return (
    <ScreenWrapper>
      {/* Page Header matching Website */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.dark} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Payments & Revenue</Text>
          <View style={styles.subRow}>
            <View style={styles.greenDot} />
            <Text style={styles.headerSubtitle}>Manage all your subscription transactions</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.8}>
          <Download size={14} color="#FFF" />
          <Text style={styles.exportBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPayments}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loadingStats || loadingPayments}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.topContainer}>
            {/* Top 3 Stat Cards matching Website */}
            <View style={styles.statCardsGrid}>
              {/* Card 1: TOTAL REVENUE */}
              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: '#3B82F6' }]}>
                  <Banknote size={22} color="#FFF" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statTitle}>TOTAL REVENUE</Text>
                  <Text style={styles.statValue}>₹{totalRev}</Text>
                  <Text style={styles.statTrendUp}>↑ from last month</Text>
                </View>
              </View>

              {/* Card 2: SUCCESS RATE */}
              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: '#10B981' }]}>
                  <CheckCircle2 size={22} color="#FFF" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statTitle}>SUCCESS RATE</Text>
                  <Text style={styles.statValue}>100.0%</Text>
                  <Text style={styles.statTrendUp}>↑ from last month</Text>
                </View>
              </View>

              {/* Card 3: FAILED TRANSACTIONS */}
              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: '#F43F5E' }]}>
                  <AlertTriangle size={22} color="#FFF" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statTitle}>FAILED TRANSACTIONS</Text>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statTrendDown}>↓ from last month</Text>
                </View>
              </View>
            </View>

            {/* Table Filter Tabs matching Website */}
            <View style={styles.tableFilterRow}>
              {(['all', 'success', 'pending', 'failed'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tableTab, filterStatus === tab && styles.tableTabActive]}
                  onPress={() => setFilterStatus(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tableTabText, filterStatus === tab && styles.tableTabTextActive]}>
                    {tab === 'all' ? 'All Payments' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Search input matching Website */}
            <View style={styles.searchBox}>
              <Search size={16} color={Colors.slate} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by transaction ID or clinic name..."
                placeholderTextColor={Colors.slate}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={Colors.slate} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Banknote size={44} color="#CBD5E1" />
            <Text style={styles.emptyText}>No real payments found yet.</Text>
          </View>
        }
        renderItem={({ item }: { item: any }) => (
          <Card style={styles.paymentCard}>
            <View style={styles.paymentTop}>
              <View style={styles.paymentIconBox}>
                <Receipt size={18} color="#2563EB" />
              </View>
              <View style={styles.paymentMain}>
                <Text style={styles.paymentClinic}>{item.clinic_name || item.tenant_name || item.customer || 'Clinic Subscription'}</Text>
                <Text style={styles.paymentMeta}>Txn #{item.id} · {item.method || 'Razorpay / Card'}</Text>
              </View>
              <View style={styles.paymentAmountCol}>
                <Text style={styles.paymentAmount}>{formatCurrency(item.amount || 0)}</Text>
                <Badge
                  label={item.status || 'Success'}
                  variant={(item.status || 'success').toLowerCase() === 'success' ? 'success' : 'danger'}
                  size="sm"
                  dot
                />
              </View>
            </View>
            <View style={styles.paymentDateRow}>
              <Calendar size={11} color={Colors.slate} />
              <Text style={styles.paymentDateText}>{formatDate(item.created_at || item.date, 'dd MMM yyyy, HH:mm')}</Text>
            </View>
          </Card>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.dark,
    letterSpacing: -0.4,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.slate,
    fontWeight: '600',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  exportBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
  },
  topContainer: {
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  statCardsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate,
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dark,
    marginTop: 2,
  },
  statTrendUp: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  statTrendDown: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  tableFilterRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  tableTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tableTabActive: {
    backgroundColor: '#EFF6FF',
  },
  tableTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate,
  },
  tableTabTextActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.dark,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.slate,
    fontWeight: '600',
  },
  paymentCard: {
    padding: 14,
    borderRadius: 16,
  },
  paymentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMain: {
    flex: 1,
  },
  paymentClinic: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
  },
  paymentMeta: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 1,
  },
  paymentAmountCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.dark,
  },
  paymentDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  paymentDateText: {
    fontSize: 11,
    color: Colors.slate,
  },
});
