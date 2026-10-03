import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ListOrdered, Plus, Phone, Calendar, Clock, Trash2, ArrowRight } from 'lucide-react-native';
import { appointmentApi } from '../../../src/api/appointment.api';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Header from '../../../src/components/common/Header';
import Card from '../../../src/components/common/Card';
import Badge from '../../../src/components/common/Badge';
import Button from '../../../src/components/common/Button';
import Input from '../../../src/components/common/Input';
import EmptyState from '../../../src/components/common/EmptyState';
import LoadingState from '../../../src/components/common/LoadingState';
import Colors from '../../../src/constants/colors';
import { formatDate } from '../../../src/utils/date';
import { WaitlistEntry } from '../../../src/types/appointment.types';

export default function WaitlistScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [service, setService] = useState('Physiotherapy Assessment');
  const [priority, setPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [submitting, setSubmitting] = useState(false);

  const {
    data: waitlist = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['waitlist'],
    queryFn: appointmentApi.getWaitlist,
  });

  const handleAddWaitlist = async () => {
    if (!firstName.trim() || !contactNumber.trim()) {
      Alert.alert('Validation', 'Please enter first name and phone number.');
      return;
    }

    setSubmitting(true);
    try {
      await appointmentApi.createWaitlistEntry({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        contact_number: contactNumber.trim(),
        service: service.trim() || 'Physiotherapy Assessment',
        priority,
      });

      setShowAddModal(false);
      setFirstName('');
      setLastName('');
      setContactNumber('');
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await appointmentApi.deleteWaitlistEntry(id);
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || err.message);
    }
  };

  const handleConvertToBooking = (item: WaitlistEntry) => {
    router.push({
      pathname: '/(app)/appointments/book',
      params: {
        prefillName: `${item.first_name} ${item.last_name}`,
        prefillPhone: item.contact_number,
      },
    });
  };

  return (
    <ScreenWrapper>
      <Header
        title="Waiting List"
        subtitle={`${waitlist.length} Patients Waiting`}
        showBack
        onBackPress={() => router.back()}
        rightElement={
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.7}
          >
            <Plus size={18} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading waitlist..." />
      ) : (
        <FlatList
          data={waitlist}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const priorityVariant =
              item.priority === 'HIGH' ? 'danger' : item.priority === 'MEDIUM' ? 'warning' : 'neutral';

            return (
              <Card elevated style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{`${item.first_name} ${item.last_name}`.trim()}</Text>
                    <View style={styles.phoneRow}>
                      <Phone size={12} color={Colors.slate} />
                      <Text style={styles.phoneText}>{item.contact_number}</Text>
                    </View>
                  </View>

                  <Badge label={`${item.priority} Priority`} variant={priorityVariant} size="sm" dot />
                </View>

                <View style={styles.serviceRow}>
                  <Text style={styles.serviceText}>Requested: {item.service}</Text>
                  {item.preferred_date && (
                    <Text style={styles.dateText}>{formatDate(item.preferred_date)}</Text>
                  )}
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>

                  <Button
                    title="Convert to Booking"
                    size="sm"
                    variant="primary"
                    onPress={() => handleConvertToBooking(item)}
                    icon={<ArrowRight size={14} color={Colors.surface} />}
                    iconPosition="right"
                  />
                </View>
              </Card>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              title="Waitlist is Empty"
              description="No patients currently waiting for appointment cancellations."
              actionTitle="Add to Waitlist"
              onActionPress={() => setShowAddModal(true)}
              icon={<ListOrdered size={36} color={Colors.primary} />}
            />
          }
        />
      )}

      {/* Add Waitlist Entry Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add to Waitlist</Text>

            <Input
              label="First Name *"
              placeholder="e.g. Rahul"
              value={firstName}
              onChangeText={setFirstName}
              required
            />

            <Input
              label="Last Name"
              placeholder="e.g. Sharma"
              value={lastName}
              onChangeText={setLastName}
            />

            <Input
              label="Contact Number *"
              placeholder="e.g. +91 9876543210"
              value={contactNumber}
              onChangeText={setContactNumber}
              keyboardType="phone-pad"
              required
            />

            <Input
              label="Service Required"
              placeholder="e.g. Knee Assessment"
              value={service}
              onChangeText={setService}
            />

            {/* Priority Picker */}
            <Text style={styles.priorityLabel}>Priority Level:</Text>
            <View style={styles.priorityRow}>
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.priorityChip, priority === p && styles.priorityChipActive]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.priorityChipText, priority === p && styles.priorityChipTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setShowAddModal(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Save Entry"
                variant="primary"
                loading={submitting}
                onPress={handleAddWaitlist}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  phoneText: {
    fontSize: 12,
    color: Colors.slate,
  },
  serviceRow: {
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceText: {
    fontSize: 12,
    color: Colors.dark,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: Colors.slate,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.dangerLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark,
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priorityChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  priorityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.slate,
  },
  priorityChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
  },
});
