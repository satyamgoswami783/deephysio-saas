import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, UserPlus, Filter } from 'lucide-react-native';
import { patientApi } from '../../../../src/api/patient.api';
import { usePermissions } from '../../../../src/hooks/usePermissions';
import { useDebounce } from '../../../../src/hooks/useDebounce';
import ScreenWrapper from '../../../../src/components/common/ScreenWrapper';
import Header from '../../../../src/components/common/Header';
import Input from '../../../../src/components/common/Input';
import PatientCard from '../../../../src/components/patients/PatientCard';
import EmptyState from '../../../../src/components/common/EmptyState';
import LoadingState from '../../../../src/components/common/LoadingState';
import Colors from '../../../../src/constants/colors';

const BEHAVIOUR_FILTERS = [
  { label: 'All Patients', value: 'all' },
  { label: 'Green Flag', value: 'green' },
  { label: 'Yellow Flag', value: 'yellow' },
  { label: 'Red Flag', value: 'red' },
];

export default function PatientsScreen() {
  const router = useRouter();
  const { can } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBehaviour, setSelectedBehaviour] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const {
    data: patients = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientApi.getAll(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Filter patients client side by debounced query and behaviour
  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.toLowerCase();
    const phone = (p.phone || '').toLowerCase();
    const query = debouncedSearch.toLowerCase().trim();

    const matchesQuery = !query || fullName.includes(query) || phone.includes(query);
    const matchesBehaviour =
      selectedBehaviour === 'all' || (p.behaviour || 'green') === selectedBehaviour;

    return matchesQuery && matchesBehaviour;
  });

  return (
    <ScreenWrapper>
      <Header
        title="Patients Directory"
        subtitle={`${patients.length} Registered Patients`}
        rightElement={
          can('patient.write') ? (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push('/(app)/patients/create')}
              activeOpacity={0.7}
            >
              <UserPlus size={18} color={Colors.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by name or mobile number..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={Colors.slate} />}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Behaviour Flag Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {BEHAVIOUR_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterChip, selectedBehaviour === f.value && styles.filterChipActive]}
              onPress={() => setSelectedBehaviour(f.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, selectedBehaviour === f.value && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Patients List */}
      {isLoading ? (
        <LoadingState message="Loading patients..." />
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PatientCard
              patient={item}
              onPress={() => router.push(`/(app)/patients/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Patients Found"
              description={
                debouncedSearch
                  ? `No patients match "${debouncedSearch}".`
                  : 'Your clinic does not have any patients registered yet.'
              }
              actionTitle={can('patient.write') ? 'Register Patient' : undefined}
              onActionPress={() => router.push('/(app)/patients/create')}
            />
          }
        />
      )}

      {/* FAB to Add Patient */}
      {can('patient.write') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(app)/patients/create')}
          activeOpacity={0.85}
        >
          <Plus size={24} color={Colors.surface} />
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.surface,
  },
  searchInput: {
    marginBottom: 8,
  },
  filterContainer: {
    backgroundColor: Colors.surface,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate,
  },
  filterTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
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
