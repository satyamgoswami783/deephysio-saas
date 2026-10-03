import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Phone, Calendar, ChevronRight, User } from 'lucide-react-native';
import { Patient } from '../../types/patient.types';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import Colors from '../../constants/colors';
import { formatDate } from '../../utils/date';

interface PatientCardProps {
  patient: Patient;
  onPress: () => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onPress }) => {
  const fullName = `${patient.first_name || patient.firstName || ''} ${patient.last_name || patient.lastName || ''}`.trim() || 'Unnamed Patient';
  const dob = patient.date_of_birth || patient.dateOfBirth || patient.dob;
  const behaviour = patient.behaviour || 'green';

  return (
    <Card onPress={onPress} elevated style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <User size={20} color={Colors.primary} />
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {fullName}
            </Text>
            <StatusBadge status={behaviour} type="behaviour" size="sm" />
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Phone size={13} color={Colors.slate} />
              <Text style={styles.metaText}>{patient.phone || 'No phone'}</Text>
            </View>

            {dob && (
              <View style={[styles.metaItem, styles.metaSpacing]}>
                <Calendar size={13} color={Colors.slate} />
                <Text style={styles.metaText}>{formatDate(dob, 'dd/MM/yyyy')}</Text>
              </View>
            )}
          </View>

          {patient.patient_type && (
            <View style={styles.typeTag}>
              <Text style={styles.typeText}>{patient.patient_type}</Text>
            </View>
          )}
        </View>

        <ChevronRight size={18} color={Colors.slate} />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    flex: 1,
    marginRight: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaSpacing: {
    marginLeft: 12,
  },
  metaText: {
    fontSize: 12,
    color: Colors.slate,
    marginLeft: 4,
  },
  typeTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.slate,
    textTransform: 'uppercase',
  },
});

export default PatientCard;
