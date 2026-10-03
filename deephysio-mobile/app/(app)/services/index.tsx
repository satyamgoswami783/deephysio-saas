import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Tag,
  Plus,
  Search,
  Clock,
  DollarSign,
  Edit3,
  Trash2,
  Check,
  X,
  Layers,
  Calendar,
  Sparkles,
  AlertCircle,
  TrendingUp,
} from 'lucide-react-native';
import { serviceApi, CreateServiceInput, UpdateServiceInput } from '../../../src/api/service.api';
import { Service } from '../../../src/types/billing.types';
import { usePermissions } from '../../../src/hooks/usePermissions';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import Button from '../../../src/components/common/Button';
import Badge from '../../../src/components/common/Badge';
import Input from '../../../src/components/common/Input';
import LoadingState from '../../../src/components/common/LoadingState';
import EmptyState from '../../../src/components/common/EmptyState';
import Colors from '../../../src/constants/colors';
import { formatCurrency } from '../../../src/utils/currency';

const CATEGORY_OPTIONS = [
  'Physiotherapy',
  'Rehabilitation',
  'Consultation',
  'Assessment',
  'Manual Therapy',
  'Sports Rehab',
  'Chiropractic',
  'Other',
];

const DURATION_CHIPS = [15, 30, 45, 60, 90];

export default function ServicesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can, isAdmin, isSuperAdmin } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Modal State for Add / Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Physiotherapy');
  const [formDuration, setFormDuration] = useState<number>(45);
  const [formPrice, setFormPrice] = useState<string>('800');
  const [formActive, setFormActive] = useState<boolean>(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch Services
  const {
    data: services = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['services-catalog'],
    queryFn: () => serviceApi.getAll(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Extract dynamic category list from existing services
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ['All', ...Array.from(set)];
  }, [services]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'All' ||
        (s.category && s.category.toLowerCase() === selectedCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = services.length;
    const totalRevenueSum = services.reduce((acc, s) => acc + (parseFloat(String(s.price)) || 0), 0);
    const avgPrice = total > 0 ? (totalRevenueSum / total).toFixed(0) : '0';
    const activeCount = services.filter((s) => s.is_active !== false).length;
    return { total, avgPrice, activeCount };
  }, [services]);

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingService(null);
    setFormName('');
    setFormCategory('Physiotherapy');
    setFormDuration(45);
    setFormPrice('800');
    setFormActive(true);
    setFormError('');
    setModalVisible(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setFormName(service.name);
    setFormCategory(service.category || 'Physiotherapy');
    setFormDuration(parseInt(String(service.duration), 10) || 45);
    setFormPrice(String(service.price || '0'));
    setFormActive(service.is_active !== false);
    setFormError('');
    setModalVisible(true);
  };

  // Delete Service
  const handleDelete = (service: Service) => {
    Alert.alert(
      'Delete Service',
      `Are you sure you want to remove "${service.name}" from your clinic catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await serviceApi.delete(service.id);
              queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
              queryClient.invalidateQueries({ queryKey: ['services-list'] });
              Alert.alert('Deleted', 'Service removed successfully.');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  // Save Service (Create or Update)
  const handleSaveService = async () => {
    if (!formName.trim()) {
      setFormError('Service Name is required.');
      return;
    }
    const numPrice = parseFloat(formPrice.trim());
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError('Please enter a valid price / rate.');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      if (editingService) {
        // Update
        await serviceApi.update(editingService.id, {
          name: formName.trim(),
          category: formCategory.trim() || undefined,
          duration: formDuration,
          price: numPrice,
          is_active: formActive,
        });
        Alert.alert('Updated', 'Service catalog updated successfully.');
      } else {
        // Create
        await serviceApi.create({
          name: formName.trim(),
          category: formCategory.trim() || undefined,
          duration: formDuration,
          price: numPrice,
          is_active: formActive,
        });
        Alert.alert('Created', 'New service added to catalog successfully.');
      }

      queryClient.invalidateQueries({ queryKey: ['services-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['services-list'] });
      setModalVisible(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save service.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header
        title="Services & Pricing"
        subtitle="Manage Clinic Treatment Catalog & Rates"
        showBack
        onBackPress={() => router.back()}
        rightElement={
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={handleOpenCreate}
            activeOpacity={0.7}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addHeaderBtnText}>Add</Text>
          </TouchableOpacity>
        }
      />

      {/* ── Top Stat Cards ── */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: Colors.primaryLight }]}>
            <Tag size={16} color={Colors.primaryDark} />
          </View>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Services</Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
            <TrendingUp size={16} color={Colors.success} />
          </View>
          <Text style={styles.statValue}>{formatCurrency(stats.avgPrice)}</Text>
          <Text style={styles.statLabel}>Avg Rate</Text>
        </Card>

        <Card style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Check size={16} color="#2563EB" />
          </View>
          <Text style={styles.statValue}>{stats.activeCount}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </Card>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchInputBox}>
          <Search size={16} color={Colors.slate} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search treatments or categories..."
            placeholderTextColor={Colors.slate}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <X size={16} color={Colors.slate} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Category Filter Pills ── */}
      <View style={styles.categoryScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Services List ── */}
      {isLoading ? (
        <LoadingState message="Loading treatment catalog..." />
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Services Found"
              description={
                searchQuery
                  ? `No services matching "${searchQuery}".`
                  : 'Start by adding your clinic treatments and consultation rates.'
              }
              actionTitle="Add New Service"
              onActionPress={handleOpenCreate}
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.serviceCard} elevated>
              <View style={styles.serviceHeaderRow}>
                <View style={styles.serviceTitleBox}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  {item.category && (
                    <View style={styles.categoryBadgePill}>
                      <Text style={styles.categoryBadgeText}>{item.category.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.servicePrice}>{formatCurrency(item.price)}</Text>
              </View>

              {/* Service Meta Chips */}
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Clock size={13} color={Colors.slate} />
                  <Text style={styles.metaChipText}>{item.duration || 45} mins</Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    item.is_active === false ? styles.statusPillInactive : styles.statusPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      item.is_active === false
                        ? styles.statusPillTextInactive
                        : styles.statusPillTextActive,
                    ]}
                  >
                    {item.is_active === false ? 'Inactive' : 'Available'}
                  </Text>
                </View>

                {/* Direct Book Appointment Shortcut */}
                <TouchableOpacity
                  style={styles.bookShortcutBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/(app)/appointments/book',
                      params: { serviceId: String(item.id) },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Calendar size={12} color={Colors.primaryDark} />
                  <Text style={styles.bookShortcutText}>Book</Text>
                </TouchableOpacity>

                {/* Edit Action Button */}
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={() => handleOpenEdit(item)}
                  activeOpacity={0.7}
                >
                  <Edit3 size={15} color={Colors.primary} />
                </TouchableOpacity>

                {/* Delete Action Button */}
                <TouchableOpacity
                  style={styles.actionIconBtn}
                  onPress={() => handleDelete(item)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={15} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}

      {/* ── Floating Action Button ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleOpenCreate}
        activeOpacity={0.85}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ── ADD / EDIT SERVICE MODAL ── */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.modalCard}
              >
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleRow}>
                    <Tag size={20} color={Colors.primary} />
                    <Text style={styles.modalTitle}>
                      {editingService ? 'Edit Service' : 'Add New Service'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <X size={20} color={Colors.dark} />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
                  {!!formError && (
                    <View style={styles.formErrorBanner}>
                      <AlertCircle size={15} color={Colors.danger} />
                      <Text style={styles.formErrorText}>{formError}</Text>
                    </View>
                  )}

                  {/* 1. Service Name */}
                  <Input
                    label="Service / Treatment Name *"
                    placeholder="e.g. Dry Needling Therapy"
                    value={formName}
                    onChangeText={setFormName}
                    required
                  />

                  {/* 2. Category Selector */}
                  <Text style={styles.formLabel}>Treatment Category:</Text>
                  <View style={styles.formChipGrid}>
                    {CATEGORY_OPTIONS.map((cat) => {
                      const isSelected = formCategory.toLowerCase() === cat.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.formCatChip, isSelected && styles.formCatChipActive]}
                          onPress={() => setFormCategory(cat)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.formCatChipText,
                              isSelected && styles.formCatChipTextActive,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {formCategory === 'Other' && (
                    <Input
                      label="Custom Category Name"
                      placeholder="e.g. Hydrotherapy, Acupressure"
                      value={formCategory === 'Other' ? '' : formCategory}
                      onChangeText={(val) => setFormCategory(val || 'Other')}
                      containerStyle={{ marginTop: -6, marginBottom: 12 }}
                    />
                  )}

                  {/* 3. Duration Selector */}
                  <Text style={styles.formLabel}>Duration (Minutes):</Text>
                  <View style={styles.durationRow}>
                    {DURATION_CHIPS.map((dur) => {
                      const isSelected = formDuration === dur;
                      return (
                        <TouchableOpacity
                          key={dur}
                          style={[styles.durChip, isSelected && styles.durChipActive]}
                          onPress={() => setFormDuration(dur)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[styles.durChipText, isSelected && styles.durChipTextActive]}
                          >
                            {dur}m
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Input
                    label="Custom Duration (in minutes)"
                    placeholder="e.g. 45"
                    value={String(formDuration || '')}
                    onChangeText={(val) => {
                      const n = parseInt(val, 10);
                      setFormDuration(isNaN(n) ? 0 : n);
                    }}
                    keyboardType="number-pad"
                    containerStyle={{ marginTop: -6, marginBottom: 12 }}
                  />

                  {/* 4. Price / Rate */}
                  <Input
                    label="Price / Rate (₹) *"
                    placeholder="e.g. 800"
                    value={formPrice}
                    onChangeText={setFormPrice}
                    keyboardType="numeric"
                    required
                  />

                  {/* 5. Status Toggle */}
                  <View style={styles.statusToggleRow}>
                    <Text style={styles.statusToggleLabel}>Available for Booking:</Text>
                    <TouchableOpacity
                      style={[styles.togglePill, formActive && styles.togglePillActive]}
                      onPress={() => setFormActive(!formActive)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.toggleCircle, formActive && styles.toggleCircleActive]} />
                      <Text style={[styles.toggleText, formActive && styles.toggleTextActive]}>
                        {formActive ? 'Active' : 'Hidden'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelModalBtn}
                      onPress={() => setModalVisible(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelModalText}>Cancel</Text>
                    </TouchableOpacity>

                    <Button
                      title={editingService ? 'Save Changes' : 'Create Service'}
                      onPress={handleSaveService}
                      loading={formSubmitting}
                      style={{ flex: 2 }}
                    />
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addHeaderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  statIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.slate,
    marginTop: 1,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark,
  },
  categoryScrollContainer: {
    marginBottom: 10,
  },
  categoryRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  serviceCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  serviceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  serviceTitleBox: {
    flex: 1,
    paddingRight: 10,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
    lineHeight: 20,
  },
  categoryBadgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate,
    letterSpacing: 0.5,
  },
  servicePrice: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillActive: {
    backgroundColor: '#ECFDF5',
  },
  statusPillInactive: {
    backgroundColor: '#FEF2F2',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPillTextActive: {
    color: '#059669',
  },
  statusPillTextInactive: {
    color: Colors.danger,
  },
  bookShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  bookShortcutText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.dark,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  modalScroll: {
    padding: 16,
  },
  formErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  formErrorText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
    flex: 1,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 8,
  },
  formChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  formCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formCatChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  formCatChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate,
  },
  formCatChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  durChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  durChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  durChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate,
  },
  durChipTextActive: {
    color: Colors.primaryDark,
  },
  statusToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
  },
  statusToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  togglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  togglePillActive: {
    backgroundColor: '#ECFDF5',
  },
  toggleCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.slate,
  },
  toggleCircleActive: {
    backgroundColor: '#059669',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate,
  },
  toggleTextActive: {
    color: '#059669',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate,
  },
});
