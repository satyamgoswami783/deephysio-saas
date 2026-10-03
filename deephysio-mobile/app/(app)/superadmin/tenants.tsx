import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Building,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Ban,
  CheckCircle,
  Trash2,
  ArrowLeft,
  X,
  Eye,
  AlertTriangle,
} from 'lucide-react-native';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Card from '../../../src/components/common/Card';
import Badge from '../../../src/components/common/Badge';
import Button from '../../../src/components/common/Button';
import EmptyState from '../../../src/components/common/EmptyState';
import Colors from '../../../src/constants/colors';
import { saasApi, SaasTenant } from '../../../src/api/saas.api';
import { formatDate } from '../../../src/utils/date';

export default function SuperAdminTenantsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<SaasTenant | null>(null);

  const { data: tenants = [], isLoading, refetch } = useQuery({
    queryKey: ['saas-tenants-list'],
    queryFn: saasApi.getTenants,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      saasApi.updateTenantStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-tenants-list'] });
      queryClient.invalidateQueries({ queryKey: ['saas-revenue'] });
      if (selectedTenant) {
        setSelectedTenant(null);
      }
      Alert.alert('Success', 'Admin subscription status updated.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to update status');
    },
  });

  const deleteTenantMutation = useMutation({
    mutationFn: (id: number) => saasApi.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saas-tenants-list'] });
      queryClient.invalidateQueries({ queryKey: ['saas-revenue'] });
      setSelectedTenant(null);
      Alert.alert('Deleted', 'Admin and clinic account deleted permanently.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to delete tenant');
    },
  });

  const handleToggleBlock = (tenant: SaasTenant) => {
    const isCurrentlyBlocked =
      tenant.subscription_status === 'canceled' ||
      tenant.subscription_status === 'expired' ||
      (tenant as any).subscriptionStatus === 'canceled';

    const newStatus = isCurrentlyBlocked ? 'active' : 'canceled';
    const actionName = isCurrentlyBlocked ? 'Unblock' : 'Block';

    Alert.alert(
      `${actionName} Admin?`,
      `Are you sure you want to ${actionName.toLowerCase()} ${tenant.name || tenant.clinic_name}'s clinic account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `${actionName} Account`,
          style: isCurrentlyBlocked ? 'default' : 'destructive',
          onPress: () => updateStatusMutation.mutate({ id: tenant.id, status: newStatus }),
        },
      ]
    );
  };

  const handleDelete = (tenant: SaasTenant) => {
    Alert.alert(
      'Delete Admin & Clinic?',
      `Are you sure you want to delete ${tenant.clinic_name || tenant.name}? This will delete all clinic data and cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => deleteTenantMutation.mutate(tenant.id),
        },
      ]
    );
  };

  // Filtered List
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.clinic_name || t.clinicName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;

    const st = String(t.subscription_status || t.subscriptionStatus || '').toLowerCase();
    if (filterStatus === 'canceled') {
      return st === 'canceled' || st === 'expired' || st === 'blocked';
    }
    return st === filterStatus;
  });

  const getStatusBadge = (status?: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'active') return <Badge label="ACTIVE" variant="success" size="sm" dot />;
    if (s === 'trial') return <Badge label="TRIAL" variant="warning" size="sm" dot />;
    if (s === 'canceled' || s === 'expired' || s === 'blocked') {
      return <Badge label="BLOCKED" variant="danger" size="sm" dot />;
    }
    return <Badge label="ACTIVE" variant="success" size="sm" dot />;
  };

  return (
    <ScreenWrapper>
      {/* Top Header matching Website */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.dark} />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Admin Management</Text>
          <View style={styles.subRow}>
            <View style={styles.blueDot} />
            <Text style={styles.headerSubtitle}>Manage all clinic admins and their profile details</Text>
          </View>
        </View>
      </View>

      {/* Search Bar matching Website */}
      <View style={styles.searchBar}>
        <Search size={16} color={Colors.slate} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search admins..."
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

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['all', 'active', 'trial', 'canceled'].map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.filterChip, filterStatus === st && styles.filterChipActive]}
            onPress={() => setFilterStatus(st)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filterStatus === st && styles.filterChipTextActive]}>
              {st === 'all' ? 'All Admins' : st === 'canceled' ? 'Expired / Blocked' : st === 'trial' ? 'Free Trial' : 'Active'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Admins List matching Website columns */}
      <FlatList
        data={filteredTenants}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            title="No Admins Found"
            description="No clinic admin accounts match your current filter."
          />
        }
        renderItem={({ item }) => (
          <Card style={styles.tenantCard}>
            <View style={styles.cardHeader}>
              {/* Profile Avatar */}
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {(item.name || item.clinic_name || 'A').charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Admin & Clinic Info */}
              <View style={styles.adminMainInfo}>
                <Text style={styles.adminNameText}>{item.name || 'Admin User'}</Text>
                <Text style={styles.adminEmailText}>{item.email || 'N/A'}</Text>
                <Text style={styles.clinicNameText}>
                  Clinic: <Text style={{ fontWeight: '800', color: Colors.dark }}>{item.clinic_name || 'DeePhysio Clinic'}</Text>
                </Text>
              </View>

              {/* Status Badge */}
              <View style={styles.statusCol}>
                {getStatusBadge(item.subscription_status)}
              </View>
            </View>

            {/* Plan & Expiry Row */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <CreditCard size={12} color={Colors.primary} />
                <Text style={styles.metaLabel}>Plan: <Text style={styles.metaValue}>{item.plan || (item.subscription_status === 'trial' ? '7-Day Free Trial' : 'Starter')}</Text></Text>
              </View>
              <View style={styles.metaItem}>
                <Calendar size={12} color={Colors.slate} />
                <Text style={styles.metaLabel}>Expiry: <Text style={styles.metaValue}>{formatDate(item.expiry_date, 'dd MMM yyyy')}</Text></Text>
              </View>
            </View>

            {/* Actions Bar matching Website (Eye, Block, Delete) */}
            <View style={styles.actionsBar}>
              <TouchableOpacity
                style={styles.actionCircleBtn}
                onPress={() => setSelectedTenant(item)}
                activeOpacity={0.7}
              >
                <Eye size={16} color={Colors.primary} />
                <Text style={[styles.actionBtnText, { color: Colors.primary }]}>View</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCircleBtn}
                onPress={() => handleToggleBlock(item)}
                activeOpacity={0.7}
              >
                <Ban size={16} color={item.subscription_status === 'canceled' ? '#059669' : '#DC2626'} />
                <Text style={[styles.actionBtnText, { color: item.subscription_status === 'canceled' ? '#059669' : '#DC2626' }]}>
                  {item.subscription_status === 'canceled' ? 'Unblock' : 'Block'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCircleBtn}
                onPress={() => handleDelete(item)}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color="#E11D48" />
                <Text style={[styles.actionBtnText, { color: '#E11D48' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      {/* ADMIN DETAILS MODAL */}
      {selectedTenant && (
        <Modal
          visible={!!selectedTenant}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedTenant(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Admin Profile Details</Text>
                  <Text style={styles.modalSubtitle}>SaaS Multi-Tenant Tenant Record</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTenant(null)}>
                  <X size={20} color={Colors.slate} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.modalAvatarBox}>
                  <Text style={styles.modalAvatarText}>
                    {(selectedTenant.name || selectedTenant.clinic_name || 'A').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.modalAdminName}>{selectedTenant.name || 'Admin User'}</Text>
                <Text style={styles.modalEmail}>{selectedTenant.email || ''}</Text>

                <View style={styles.modalDetailGrid}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Clinic Name</Text>
                    <Text style={styles.detailValue}>{selectedTenant.clinic_name || 'DeePhysio Clinic'}</Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Subscription Plan</Text>
                    <Text style={styles.detailValue}>{selectedTenant.plan || 'Starter'}</Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Subscription Status</Text>
                    <Text style={styles.detailValue}>{selectedTenant.subscription_status || 'Active'}</Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Expiry Date</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedTenant.expiry_date, 'dd MMM yyyy')}</Text>
                  </View>
                </View>

                {/* Modal Actions */}
                <View style={styles.modalActionsRow}>
                  <Button
                    title={selectedTenant.subscription_status === 'canceled' ? 'Unblock Account' : 'Block Account'}
                    variant={selectedTenant.subscription_status === 'canceled' ? 'primary' : 'outline'}
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => handleToggleBlock(selectedTenant)}
                  />
                  <Button
                    title="Delete Account"
                    variant="danger"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => handleDelete(selectedTenant)}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563EB',
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.slate,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate,
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  tenantCard: {
    padding: 16,
    borderRadius: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1D4ED8',
  },
  adminMainInfo: {
    flex: 1,
  },
  adminNameText: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.dark,
  },
  adminEmailText: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 1,
  },
  clinicNameText: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 3,
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.slate,
  },
  metaValue: {
    fontWeight: '800',
    color: Colors.dark,
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionCircleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
  },
  modalSubtitle: {
    fontSize: 11,
    color: Colors.slate,
    marginTop: 2,
  },
  modalBody: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalAvatarBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalAvatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1D4ED8',
  },
  modalAdminName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.dark,
  },
  modalEmail: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
    marginBottom: 16,
  },
  modalDetailGrid: {
    width: '100%',
    gap: 8,
  },
  detailBox: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
    marginTop: 2,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    width: '100%',
  },
});
