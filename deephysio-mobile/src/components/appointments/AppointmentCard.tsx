import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, User, Stethoscope, ChevronRight } from 'lucide-react-native';
import { Appointment } from '../../types/appointment.types';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import Colors from '../../constants/colors';
import { formatDate, formatTime } from '../../utils/date';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
  onCheckIn?: () => void;
  showActions?: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onPress,
  onCheckIn,
  showActions = true,
}) => {
  const patientName = appointment.patient
    ? `${appointment.patient.first_name || appointment.patient.firstName || ''} ${appointment.patient.last_name || appointment.patient.lastName || ''}`.trim() || 'Unnamed Patient'
    : 'Unknown Patient';

  const therapistName = appointment.therapist?.name || 'Assigned Therapist';
  const serviceName = appointment.service?.name || 'Physiotherapy Consultation';

  const isCheckinEligible =
    appointment.status === 'scheduled' || appointment.status === 'confirmed';

  return (
    <Card onPress={onPress} elevated style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.timeContainer}>
          <Clock size={14} color={Colors.primaryDark} />
          <Text style={styles.timeText}>
            {formatDate(appointment.appointment_date || appointment.start_time, 'EEE, d MMM')} • {formatTime(appointment.start_time || appointment.appointment_date)}
          </Text>
        </View>
        <StatusBadge status={appointment.status} type="appointment" size="sm" />
      </View>

      <View style={styles.patientRow}>
        <View style={styles.avatar}>
          <User size={18} color={Colors.primary} />
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{patientName}</Text>
          <Text style={styles.patientPhone}>
            {appointment.patient?.phone || 'No contact number'}
          </Text>
        </View>
        <ChevronRight size={18} color={Colors.slate} />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.metaItem}>
          <Stethoscope size={13} color={Colors.slate} />
          <Text style={styles.metaText} numberOfLines={1}>
            {serviceName}
          </Text>
        </View>
        {appointment.room && (
          <Text style={styles.roomText}>Room: {appointment.room}</Text>
        )}
      </View>

      {showActions && isCheckinEligible && onCheckIn && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.checkinBtn}
            onPress={onCheckIn}
            activeOpacity={0.8}
          >
            <Text style={styles.checkinBtnText}>Check In Patient</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginLeft: 5,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
  },
  patientPhone: {
    fontSize: 12,
    color: Colors.slate,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  metaText: {
    fontSize: 12,
    color: Colors.slate,
    marginLeft: 4,
  },
  roomText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryDark,
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  checkinBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkinBtnText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default AppointmentCard;
