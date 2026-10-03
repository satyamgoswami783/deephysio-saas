import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  User,
  Calendar,
  Lock,
  Trash2,
  CheckCircle2,
  Share2,
} from 'lucide-react-native';
import { clinicalNoteApi } from '../../../src/api/clinicalNote.api';
import { usePermissions } from '../../../src/hooks/usePermissions';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import Badge from '../../../src/components/common/Badge';
import Button from '../../../src/components/common/Button';
import ConfirmationModal from '../../../src/components/common/ConfirmationModal';
import LoadingState from '../../../src/components/common/LoadingState';
import Colors from '../../../src/constants/colors';
import { formatDate } from '../../../src/utils/date';

export default function ViewNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteId = id || '';
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [locking, setLocking] = useState(false);

  const {
    data: note,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['clinical-note-detail', noteId],
    queryFn: () => clinicalNoteApi.getById(noteId),
    enabled: !!noteId,
  });

  const handleLockNote = async () => {
    setLocking(true);
    try {
      await clinicalNoteApi.update(noteId, { status: 'Locked' });
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
      Alert.alert('Note Finalized', 'Clinical note is now locked and protected.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setLocking(false);
    }
  };

  const handleDelete = async () => {
    try {
      await clinicalNoteApi.delete(noteId);
      setShowDeleteModal(false);
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
      router.back();
    } catch (err: any) {
      Alert.alert('Delete Failed', err.response?.data?.message || err.message);
    }
  };

  if (isLoading || !note) {
    return <LoadingState message="Loading clinical note..." />;
  }

  const patientName = note.patient
    ? `${note.patient.first_name || note.patient.firstName || ''} ${note.patient.last_name || note.patient.lastName || ''}`.trim() || 'Patient'
    : 'Patient';

  const isLocked = note.status === 'Locked' || note.status === 'Finalized';

  return (
    <ScreenWrapper>
      <Header
        title={note.type || 'Clinical Note'}
        subtitle={formatDate(note.date)}
        showBack
        onBackPress={() => router.back()}
        rightElement={
          can('notes.manage') && !isLocked ? (
            <TouchableOpacity
              style={styles.deleteHeaderBtn}
              onPress={() => setShowDeleteModal(true)}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color={Colors.danger} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Note Metadata Header */}
        <Card elevated style={styles.metaCard}>
          <View style={styles.metaRow}>
            <View style={styles.patientMeta}>
              <Text style={styles.patientName}>{patientName}</Text>
              <Text style={styles.therapistName}>Author: Dr. {note.therapist?.name || 'Practitioner'}</Text>
            </View>

            <Badge
              label={note.status || 'Draft'}
              variant={isLocked ? 'success' : 'warning'}
              size="md"
              dot
            />
          </View>
        </Card>

        {/* Structured SOAP Sections */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.soapPill, { backgroundColor: '#E0F2FE' }]}>
              <Text style={[styles.soapPillText, { color: '#0369A1' }]}>S</Text>
            </View>
            <Text style={styles.soapTitle}>Subjective</Text>
          </View>
          <Text style={styles.soapContent}>
            {note.subjective || 'No subjective complaints recorded.'}
          </Text>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.soapPill, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.soapPillText, { color: '#15803D' }]}>O</Text>
            </View>
            <Text style={styles.soapTitle}>Objective (Physical Findings & ROM)</Text>
          </View>
          <Text style={styles.soapContent}>
            {note.objective || 'No objective findings recorded.'}
          </Text>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.soapPill, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.soapPillText, { color: '#B45309' }]}>A</Text>
            </View>
            <Text style={styles.soapTitle}>Assessment & Diagnosis</Text>
          </View>
          <Text style={styles.soapContent}>
            {note.assessment || 'No clinical assessment recorded.'}
          </Text>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={[styles.soapPill, { backgroundColor: '#F3E8FF' }]}>
              <Text style={[styles.soapPillText, { color: '#7E22CE' }]}>P</Text>
            </View>
            <Text style={styles.soapTitle}>Plan of Care & Exercises</Text>
          </View>
          <Text style={styles.soapContent}>
            {note.plan || 'No plan recorded.'}
          </Text>
        </Card>

        {/* Lock note action */}
        {can('notes.manage') && !isLocked && (
          <Button
            title="Finalize & Lock Note"
            variant="primary"
            size="lg"
            loading={locking}
            onPress={handleLockNote}
            icon={<Lock size={18} color={Colors.surface} />}
            style={styles.lockBtn}
          />
        )}
      </ScrollView>

      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Clinical Note"
        message="Are you sure you want to delete this clinical record?"
        confirmTitle="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  deleteHeaderBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.dangerLight,
  },
  metaCard: {
    padding: 16,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientMeta: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
  },
  therapistName: {
    fontSize: 13,
    color: Colors.slate,
    marginTop: 2,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  soapPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soapPillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  soapTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  soapContent: {
    fontSize: 14,
    color: Colors.dark,
    lineHeight: 22,
  },
  lockBtn: {
    marginTop: 10,
  },
});
