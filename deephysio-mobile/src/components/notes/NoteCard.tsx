import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FileText, Calendar, User, ChevronRight, Lock } from 'lucide-react-native';
import { ClinicalNote } from '../../types/clinicalNote.types';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Colors from '../../constants/colors';
import { formatDate } from '../../utils/date';

interface NoteCardProps {
  note: ClinicalNote;
  onPress: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onPress }) => {
  const patientName = note.patient
    ? `${note.patient.first_name || note.patient.firstName || ''} ${note.patient.last_name || note.patient.lastName || ''}`.trim() || 'Patient'
    : 'Patient';

  const therapistName = note.therapist?.name || 'Therapist';
  const isLocked = note.status === 'Locked' || note.status === 'Finalized';

  return (
    <Card onPress={onPress} elevated style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.typeBadge}>
          <FileText size={14} color={Colors.primaryDark} />
          <Text style={styles.typeText}>{note.type || 'Clinical Note'}</Text>
        </View>

        <Badge
          label={note.status || 'Draft'}
          variant={isLocked ? 'success' : 'warning'}
          size="sm"
          dot
        />
      </View>

      <Text style={styles.patientName}>{patientName}</Text>

      {/* Summary preview */}
      {note.subjective || note.assessment ? (
        <Text style={styles.preview} numberOfLines={2}>
          {note.subjective ? `S: ${note.subjective} ` : ''}
          {note.assessment ? `A: ${note.assessment}` : ''}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <View style={styles.metaItem}>
          <Calendar size={13} color={Colors.slate} />
          <Text style={styles.metaText}>{formatDate(note.date)}</Text>
        </View>

        <View style={styles.metaItem}>
          <User size={13} color={Colors.slate} />
          <Text style={styles.metaText}>{therapistName}</Text>
        </View>

        {isLocked && <Lock size={13} color={Colors.success} />}
        <ChevronRight size={16} color={Colors.slate} />
      </View>
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
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginLeft: 5,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    color: Colors.slate,
    lineHeight: 18,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: Colors.slate,
    marginLeft: 4,
  },
});

export default NoteCard;
