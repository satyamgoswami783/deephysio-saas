import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Calendar,
  Users,
  Receipt,
  DollarSign,
  Activity,
  Award,
} from 'lucide-react-native';
import { analyticsApi } from '../../../src/api/analytics.api';
import { usePermissions } from '../../../src/hooks/usePermissions';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import LoadingState from '../../../src/components/common/LoadingState';
import Colors from '../../../src/constants/colors';
import { formatCurrency } from '../../../src/utils/currency';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { isAdmin } = usePermissions();

  const {
    data: overview,
    isLoading: loadingOverview,
    refetch: refetchOverview,
    isRefetching,
  } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: analyticsApi.getOverview,
  });

  const { data: staffData = [], refetch: refetchStaff } = useQuery({
    queryKey: ['analytics-staff'],
    queryFn: analyticsApi.getStaffOverview,
    enabled: isAdmin,
  });

  const onRefresh = async () => {
    await Promise.all([refetchOverview(), refetchStaff()]);
  };

  if (loadingOverview && !overview) {
    return <LoadingState message="Loading clinic analytics..." />;
  }

  return (
    <ScreenWrapper>
      <Header
        title="Analytics & Reports"
        subtitle="Practice Performance Metrics"
        showBack
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: Colors.primaryLight }]}>
              <Receipt size={18} color={Colors.primaryDark} />
            </View>
            <Text style={styles.kpiValue}>
              {overview?.totalRevenue ? formatCurrency(overview.totalRevenue) : '₹0'}
            </Text>
            <Text style={styles.kpiLabel}>Total Revenue</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: Colors.secondaryLight }]}>
              <Calendar size={18} color={Colors.secondaryDark} />
            </View>
            <Text style={styles.kpiValue}>{overview?.totalAppointments || 0}</Text>
            <Text style={styles.kpiLabel}>Total Sessions</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: Colors.successLight }]}>
              <Award size={18} color="#065F46" />
            </View>
            <Text style={styles.kpiValue}>{overview?.completedAppointments || 0}</Text>
            <Text style={styles.kpiLabel}>Completed</Text>
          </Card>

          <Card style={styles.kpiCard}>
            <View style={[styles.kpiIcon, { backgroundColor: Colors.infoLight }]}>
              <Users size={18} color="#1E40AF" />
            </View>
            <Text style={styles.kpiValue}>{overview?.totalPatients || 0}</Text>
            <Text style={styles.kpiLabel}>Active Patients</Text>
          </Card>
        </View>

        {/* Appointment Status Breakdown */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Session Status Distribution</Text>

          <View style={styles.breakdownContainer}>
            <View style={styles.barItem}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barLabel}>Completed</Text>
                <Text style={styles.barValue}>{overview?.completedAppointments || 0}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.min(
                        100,
                        ((overview?.completedAppointments || 0) /
                          Math.max(1, overview?.totalAppointments || 1)) *
                          100
                      )}%`,
                      backgroundColor: Colors.success,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.barItem}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barLabel}>Total Scheduled</Text>
                <Text style={styles.barValue}>{overview?.totalAppointments || 0}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: '100%', backgroundColor: Colors.primary }]} />
              </View>
            </View>
          </View>
        </Card>

        {/* Staff Performance Overview (Admin view) */}
        {isAdmin && staffData.length > 0 && (
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Practitioner Productivity</Text>
            {staffData.map((st: any, idx: number) => (
              <View key={idx} style={styles.staffRow}>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>Dr. {st.name || st.user?.name}</Text>
                  <Text style={styles.staffSessions}>
                    {st.completedCount || st.appointmentsCount || 0} sessions completed
                  </Text>
                </View>
                <Text style={styles.staffRevenue}>
                  {formatCurrency(st.totalRevenue || 0)}
                </Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    width: '48%',
    padding: 14,
    marginBottom: 0,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },
  kpiLabel: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionCard: {
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  breakdownContainer: {
    gap: 12,
  },
  barItem: {
    gap: 4,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontSize: 13,
    color: Colors.slate,
    fontWeight: '500',
  },
  barValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  staffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  staffSessions: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
  staffRevenue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});
