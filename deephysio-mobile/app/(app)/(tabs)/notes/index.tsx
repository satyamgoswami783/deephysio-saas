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
  FileText,
  Plus,
  Search,
  Calendar,
  User,
  Phone,
  Eye,
  Edit3,
  Mail,
  Trash2,
  Lock,
  FileCheck,
} from 'lucide-react-native';
import { clinicalNoteApi } from '../../../../src/api/clinicalNote.api';
import { usePermissions } from '../../../../src/hooks/usePermissions';
import ScreenWrapper from '../../../../src/components/common/ScreenWrapper';
import Card from '../../../../src/components/common/Card';
import EmptyState from '../../../../src/components/common/EmptyState';
import LoadingState from '../../../../src/components/common/LoadingState';
import Colors from '../../../../src/constants/colors';
import { formatDate } from '../../../../src/utils/date';
import { ClinicalNote } from '../../../../src/types/clinicalNote.types';

const NOTE_TYPES = [
  'All Types',
  'SOAP Note',
  'Progress Report',
  'Initial Assessment',
  'Discharge Summary',
];

const STATUS_TABS = [
  { label: 'All Notes', value: 'all' },
  { label: 'Drafts', value: 'Draft' },
  { label: 'Completed', value: 'Finalized' },
];

export default function ClinicalNotesScreen() {
  const router = useRouter();
  const { can } = usePermissions();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedType, setSelectedType] = useState('All Types');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: notes = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['clinical-notes-registry', activeTab],
    queryFn: () =>
      clinicalNoteApi.getAll(
        activeTab !== 'all' ? { status: activeTab } : undefined
      ),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const patient = note.patient;
      const patientName = patient
        ? `${patient.first_name || patient.firstName || ''} ${patient.last_name || patient.lastName || ''}`.toLowerCase()
        : '';
      const mobile = (patient?.phone || '').toLowerCase();
      const dob = (patient?.dob || patient?.date_of_birth || '').toLowerCase();
      const q = searchTerm.toLowerCase();

      const matchesSearch =
        !searchTerm ||
        patientName.includes(q) ||
        mobile.includes(q) ||
        dob.includes(q);

      const matchesType =
        selectedType === 'All Types' ||
        (note.type || '').toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [notes, searchTerm, selectedType]);

  return (
    <ScreenWrapper>
      {/* ── 1. Top Header (Matching Web Header) ── */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconWrap}>
            <FileText size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>ALL CLINICAL NOTES</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              MANAGE, VIEW, AND ORGANIZE PATIENT RECORDS
            </Text>
          </View>
        </View>

        {can('notes.manage') && (
          <TouchableOpacity
            style={styles.initBtn}
            onPress={() => router.push('/(app)/notes/create')}
            activeOpacity={0.8}
          >
            <Plus size={14} color={Colors.surface} />
            <Text style={styles.initBtnText}>INITIALIZE NOTE</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── 2. Search & Filter Bar ── */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={15} color={Colors.slate} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, DOB, or mobile..."
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

        {/* Note Type Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeScroll}
        >
          {NOTE_TYPES.map((t) => {
            const isActive = selectedType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, isActive && styles.typeChipActive]}
                onPress={() => setSelectedType(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.typeText, isActive && styles.typeTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 3. Status Tabs (All Notes, Drafts, Completed) ── */}
      <View style={styles.tabBar}>
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── 4. Clinical Notes List ── */}
      {isLoading ? (
        <LoadingState message="Loading clinical records..." />
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ClinicalNoteRecordCard
              note={item}
              onPress={() => router.push(`/(app)/notes/${item.id}`)}
              onEdit={() => router.push(`/(app)/notes/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Clinical Notes Found"
              description="No clinical treatment records match your search or filter."
              actionTitle={can('notes.manage') ? 'Create Note' : undefined}
              onActionPress={() => router.push('/(app)/notes/create')}
            />
          }
        />
      )}

      {/* FAB */}
      {can('notes.manage') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(app)/notes/create')}
          activeOpacity={0.85}
        >
          <Plus size={24} color={Colors.surface} />
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
}

// Sub-component: Note Record Card (Matching Web Columns: Patient Details, DOB, Mobile, Note Type, Date/Status, Author, Actions)
function ClinicalNoteRecordCard({
  note,
  onPress,
  onEdit,
}: {
  note: ClinicalNote;
  onPress: () => void;
  onEdit: () => void;
}) {
  const patient = note.patient;
  const patientName = patient
    ? `${patient.first_name || patient.firstName || ''} ${patient.last_name || patient.lastName || ''}`.trim() || 'Patient'
    : 'Patient';

  const dob = patient?.dob || patient?.date_of_birth || 'N/A';
  const mobile = patient?.phone || 'N/A';
  const authorName = note.therapist?.name || 'Admin User';
  const isDraft = note.status?.toLowerCase() === 'draft' || !note.status;
  const isFinalized = note.status?.toLowerCase() === 'finalized' || note.status?.toLowerCase() === 'completed';

  return (
    <Card onPress={onPress} elevated style={styles.noteCard}>
      {/* Top: Note Type Badge + Date / Status */}
      <View style={styles.cardHeader}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>
            {(note.type || 'SOAP NOTE').toUpperCase()}
          </Text>
        </View>

        <View style={styles.dateStatusRow}>
          <Text style={styles.dateText}>{formatDate(note.date)}</Text>
          <View
            style={[
              styles.statusPill,
              isDraft && styles.statusPillDraft,
              isFinalized && styles.statusPillCompleted,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isDraft ? '#F59E0B' : '#10B981' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: isDraft ? '#D97706' : '#059669' },
              ]}
            >
              {isDraft ? 'DRAFT' : 'COMPLETED'}
            </Text>
          </View>
        </View>
      </View>

      {/* Patient Details */}
      <View style={styles.patientInfoRow}>
        <View style={styles.avatarCircle}>
          <User size={16} color="#D97706" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>{patientName}</Text>
          <View style={styles.patientSubMeta}>
            <Text style={styles.subMetaText}>DOB: {dob}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.subMetaText}>Mobile: {mobile}</Text>
          </View>
        </View>
      </View>

      {/* Author & Actions Footer */}
      <View style={styles.cardFooter}>
        <View style={styles.authorRow}>
          <User size={12} color={Colors.slate} />
          <Text style={styles.authorText}>{authorName}</Text>
        </View>

        <View style={styles.actionIconsRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onPress} activeOpacity={0.7}>
            <Eye size={14} color={Colors.slate} />
          </TouchableOpacity>
          {isDraft && (
            <TouchableOpacity style={styles.iconBtn} onPress={onEdit} activeOpacity={0.7}>
              <Edit3 size={14} color={Colors.slate} />
            </TouchableOpacity>
          )}
        </View>
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
  headerIconWrap: {
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
  initBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  initBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.surface,
    letterSpacing: 0.5,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Colors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
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
  typeScroll: {
    paddingVertical: 8,
    gap: 6,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate,
  },
  typeTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  tabItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.background,
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  noteCard: {
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.dark,
    letterSpacing: 0.4,
  },
  dateStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 11,
    color: Colors.slate,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  statusPillDraft: {
    backgroundColor: '#FFFBEB',
  },
  statusPillCompleted: {
    backgroundColor: '#ECFDF5',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  patientSubMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  subMetaText: {
    fontSize: 10,
    color: Colors.slate,
  },
  metaDot: {
    fontSize: 10,
    color: Colors.slate,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorText: {
    fontSize: 11,
    color: Colors.slate,
  },
  actionIconsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: Colors.background,
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
