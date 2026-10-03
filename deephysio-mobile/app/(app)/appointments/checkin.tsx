import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Search, QrCode, CheckCircle2, User, Clock } from 'lucide-react-native';
import { appointmentApi } from '../../../src/api/appointment.api';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Input from '../../../src/components/common/Input';
import Card from '../../../src/components/common/Card';
import Button from '../../../src/components/common/Button';
import StatusBadge from '../../../src/components/common/StatusBadge';
import EmptyState from '../../../src/components/common/EmptyState';
import Colors from '../../../src/constants/colors';
import { formatTime } from '../../../src/utils/date';
import { Appointment } from '../../../src/types/appointment.types';

export default function CheckinScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Appointment[]>([]);
  const [checkingInId, setCheckingInId] = useState<number | null>(null);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await appointmentApi.searchCheckin(text.trim());
      setResults(data);
    } catch (err) {
      console.warn('Check-in search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkArrived = async (appointmentId: number) => {
    setCheckingInId(appointmentId);
    try {
      await appointmentApi.markAsArrived(appointmentId);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] });

      Alert.alert('Patient Checked In', 'Patient marked as Arrived in waiting room.');
      if (query.trim()) {
        handleSearch(query);
      }
    } catch (err: any) {
      Alert.alert('Check-in Error', err.response?.data?.message || err.message);
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Patient Check-In" subtitle="Waiting Room Reception Desk" showBack onBackPress={() => router.back()} />

      <View style={styles.container}>
        <Input
          placeholder="Search by patient name, phone or ID..."
          value={query}
          onChangeText={handleSearch}
          leftIcon={<Search size={18} color={Colors.slate} />}
          containerStyle={styles.searchInput}
        />

        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const patientName = item.patient
              ? `${item.patient.first_name || item.patient.firstName || ''} ${item.patient.last_name || item.patient.lastName || ''}`.trim()
              : 'Patient';

            const isAlreadyArrived = item.status === 'checked_in';

            return (
              <Card elevated style={styles.resultCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <User size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{patientName}</Text>
                    <Text style={styles.patientPhone}>{item.patient?.phone || 'No phone'}</Text>
                  </View>
                  <StatusBadge status={item.status} type="appointment" size="sm" />
                </View>

                <View style={styles.timeRow}>
                  <Clock size={14} color={Colors.slate} />
                  <Text style={styles.timeText}>
                    Slot: {formatTime(item.start_time || item.appointment_date)} • Dr. {item.therapist?.name || 'Therapist'}
                  </Text>
                </View>

                <Button
                  title={isAlreadyArrived ? 'Arrived (Checked In)' : 'Mark as Arrived'}
                  variant={isAlreadyArrived ? 'outline' : 'primary'}
                  size="md"
                  disabled={isAlreadyArrived}
                  loading={checkingInId === item.id}
                  onPress={() => handleMarkArrived(item.id)}
                  icon={<CheckCircle2 size={16} color={isAlreadyArrived ? Colors.success : Colors.surface} />}
                  style={styles.arriveBtn}
                />
              </Card>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title={query.trim() ? 'No Matching Appointments' : 'Find Arriving Patient'}
              description={
                query.trim()
                  ? 'No scheduled sessions found for this search.'
                  : 'Type patient name or mobile number above to register arrival.'
              }
              icon={<QrCode size={36} color={Colors.primary} />}
            />
          }
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  resultCard: {
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryLight,
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    color: Colors.slate,
    fontWeight: '500',
  },
  arriveBtn: {
    marginTop: 10,
  },
});
