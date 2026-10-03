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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Phone,
  FileText,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Trash2,
  MapPin,
} from 'lucide-react-native';
import { appointmentApi } from '../../../src/api/appointment.api';
import { usePermissions } from '../../../src/hooks/usePermissions';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import StatusBadge from '../../../src/components/common/StatusBadge';
import Button from '../../../src/components/common/Button';
import ConfirmationModal from '../../../src/components/common/ConfirmationModal';
import LoadingState from '../../../src/components/common/LoadingState';
import Colors from '../../../src/constants/colors';
import { formatDate, formatTime } from '../../../src/utils/date';
import { AppointmentStatus } from '../../../src/types/appointment.types';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const appointmentId = parseInt(id || '0', 10);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const {
    data: appointment,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['appointment-detail', appointmentId],
    queryFn: () => appointmentApi.getById(appointmentId),
    enabled: !!appointmentId,
  });

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    setUpdatingStatus(true);
    try {
      await appointmentApi.updateStatus(appointmentId, newStatus);
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] });
    } catch (err: any) {
      Alert.alert('Status Update Failed', err.response?.data?.message || err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    try {
      await appointmentApi.delete(appointmentId);
      setShowDeleteModal(false);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      router.back();
    } catch (err: any) {
      Alert.alert('Delete Failed', err.response?.data?.message || err.message);
    }
  };

  if (isLoading || !appointment) {
    return <LoadingState message="Loading appointment details..." />;
  }

  const patientName = appointment.patient
    ? `${appointment.patient.first_name || appointment.patient.firstName || ''} ${appointment.patient.last_name || appointment.patient.lastName || ''}`.trim() || 'Patient'
    : 'Patient';

  return (
    <ScreenWrapper>
      <Header
        title="Session Details"
        subtitle={`ID: #${appointment.id}`}
        showBack
        onBackPress={() => router.back()}
        rightElement={
          can('appointments.manage') ? (
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
        {/* Status Card */}
        <Card elevated style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.statusLabel}>Current Status</Text>
              <View style={styles.statusBadgeRow}>
                <StatusBadge status={appointment.status} type="appointment" size="md" />
              </View>
            </View>
            {appointment.room && (
              <View style={styles.roomBox}>
                <Text style={styles.roomLabel}>Room</Text>
                <Text style={styles.roomValue}>{appointment.room}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Patient Info Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Patient Information</Text>
          <View style={styles.patientRow}>
            <View style={styles.patientAvatar}>
              <User size={22} color={Colors.primary} />
            </View>
            <View style={styles.patientMeta}>
              <Text style={styles.patientName}>{patientName}</Text>
              <Text style={styles.patientPhone}>{appointment.patient?.phone || 'No phone'}</Text>
            </View>
            {(appointment.patient?.id || appointment.patient_id || (appointment as any).patientId) && (
              <Button
                title="Profile"
                size="sm"
                variant="outline"
                onPress={() => {
                  const targetPatientId = appointment.patient?.id || appointment.patient_id || (appointment as any).patientId;
                  if (targetPatientId) {
                    router.push(`/(app)/patients/${targetPatientId}`);
                  }
                }}
              />
            )}
          </View>
        </Card>

        {/* Schedule & Timing Card */}
        <Card style={styles.sectionCard}>
          <Text style={styles.cardHeaderTitle}>Schedule & Service</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Calendar size={16} color={Colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Date</Text>
                <Text style={styles.infoValue}>{formatDate(appointment.appointment_date, 'EEEE, dd MMM yyyy')}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Clock size={16} color={Colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Time</Text>
                <Text style={styles.infoValue}>
                  {formatTime(appointment.start_time || appointment.appointment_date)}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Stethoscope size={16} color={Colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Service</Text>
                <Text style={styles.infoValue}>{appointment.service?.name || 'Physiotherapy Consultation'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <User size={16} color={Colors.primary} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Therapist</Text>
                <Text style={styles.infoValue}>{appointment.therapist?.name || 'Assigned Therapist'}</Text>
              </View>
            </View>
          </View>

          {!!appointment.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesLabel}>Appointment Notes:</Text>
              <Text style={styles.notesContent}>{appointment.notes}</Text>
            </View>
          )}
        </Card>

        {/* Status Transition Controls */}
        {can('appointments.manage') && (
          <Card style={styles.sectionCard}>
            <Text style={styles.cardHeaderTitle}>Update Session Status</Text>

            <View style={styles.statusButtonsGrid}>
              {appointment.status !== 'checked_in' && appointment.status !== 'completed' && (
                <Button
                  title="Check-In Patient"
                  variant="primary"
                  size="md"
                  loading={updatingStatus}
                  onPress={() => handleStatusChange('checked_in')}
                  icon={<CheckCircle2 size={16} color={Colors.surface} />}
                />
              )}

              {appointment.status !== 'in_progress' && appointment.status !== 'completed' && (
                <Button
                  title="Start Session"
                  variant="secondary"
                  size="md"
                  loading={updatingStatus}
                  onPress={() => handleStatusChange('in_progress')}
                  icon={<PlayCircle size={16} color={Colors.surface} />}
                />
              )}

              {appointment.status !== 'completed' && (
                <Button
                  title="Mark Completed"
                  variant="outline"
                  size="md"
                  loading={updatingStatus}
                  onPress={() => handleStatusChange('completed')}
                  icon={<CheckCircle2 size={16} color={Colors.primary} />}
                />
              )}

              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                <Button
                  title="Cancel Session"
                  variant="ghost"
                  size="md"
                  loading={updatingStatus}
                  onPress={() => handleStatusChange('cancelled')}
                  textStyle={{ color: Colors.danger }}
                  icon={<XCircle size={16} color={Colors.danger} />}
                />
              )}
            </View>
          </Card>
        )}
      </ScrollView>

      <ConfirmationModal
        visible={showDeleteModal}
        title="Delete Appointment"
        message="Are you sure you want to permanently delete this appointment slot?"
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
    paddingBottom: 36,
  },
  deleteHeaderBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.dangerLight,
  },
  statusCard: {
    padding: 16,
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.slate,
    fontWeight: '600',
    marginBottom: 6,
  },
  statusBadgeRow: {
    flexDirection: 'row',
  },
  roomBox: {
    alignItems: 'flex-end',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roomLabel: {
    fontSize: 11,
    color: Colors.slate,
  },
  roomValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientMeta: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  patientPhone: {
    fontSize: 13,
    color: Colors.slate,
    marginTop: 2,
  },
  infoGrid: {
    gap: 14,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.slate,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
    marginTop: 1,
  },
  notesBox: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate,
    marginBottom: 4,
  },
  notesContent: {
    fontSize: 13,
    color: Colors.dark,
    lineHeight: 18,
  },
  statusButtonsGrid: {
    gap: 10,
  },
});
