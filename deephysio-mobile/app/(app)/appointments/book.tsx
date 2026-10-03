import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  MapPin,
  Check,
  Search,
  Plus,
  ArrowLeft,
  Sun,
  Sunrise,
  Sunset,
  FileText,
  DollarSign,
  AlertCircle,
  Building,
  UserPlus,
} from 'lucide-react-native';
import { format, addDays, isSameDay } from 'date-fns';
import { appointmentApi } from '../../../src/api/appointment.api';
import { Appointment } from '../../../src/types/appointment.types';
import { patientApi } from '../../../src/api/patient.api';
import { billingApi } from '../../../src/api/billing.api';
import { useAuth } from '../../../src/context/AuthContext';
import ScreenWrapper from '../../../src/components/common/ScreenWrapper';
import Card from '../../../src/components/common/Card';
import Colors from '../../../src/constants/colors';
import { formatCurrency } from '../../../src/utils/currency';

const MORNING_SLOTS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const AFTERNOON_SLOTS = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'];
const EVENING_SLOTS = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];

const ROOM_OPTIONS = [
  'Room 1 (Consult)',
  'Room 2 (Rehab)',
  'Room 3 (Assessment)',
  'Studio A',
  'Main Gym',
];

export default function BookAppointmentScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ patientId?: string; therapistId?: string; date?: string; time?: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(() => {
    return searchParams.patientId ? parseInt(searchParams.patientId, 10) : null;
  });
  const [selectedTherapistId, setSelectedTherapistId] = useState<number | null>(() => {
    return searchParams.therapistId ? parseInt(searchParams.therapistId, 10) : null;
  });
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    return searchParams.date ? new Date(searchParams.date) : new Date();
  });
  const [selectedTime, setSelectedTime] = useState<string>(searchParams.time || '10:00');
  const [selectedRoom, setSelectedRoom] = useState<string>('Room 1 (Consult)');
  const [notes, setNotes] = useState('');
  const [timePeriod, setTimePeriod] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch Patients
  const { data: patients = [] } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientApi.getAll(),
  });

  // 2. Fetch Practitioners
  const { data: practitioners = [] } = useQuery({
    queryKey: ['practitioners'],
    queryFn: appointmentApi.getPractitioners,
  });

  // 3. Fetch Services
  const { data: services = [] } = useQuery({
    queryKey: ['services-list'],
    queryFn: billingApi.getServices,
  });

  // 4. Fetch Booked Appointments for slot clash checking
  const dateFormattedStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: existingAppts = [] } = useQuery({
    queryKey: ['appointments-clash', dateFormattedStr, selectedTherapistId],
    queryFn: () =>
      appointmentApi.getAll({
        date: dateFormattedStr,
        therapistId: selectedTherapistId || undefined,
      }),
    enabled: !!selectedTherapistId,
  });

  // Compute Occupied Slots Set
  const bookedSlots = useMemo(() => {
    const set = new Set<string>();
    existingAppts.forEach((appt: Appointment) => {
      if (appt.status !== 'cancelled' && (appt.start_time || appt.appointment_date)) {
        const dateVal = appt.start_time || appt.appointment_date;
        if (dateVal) {
          const timeStr = format(new Date(dateVal), 'HH:mm');
          set.add(timeStr);
        }
      }
    });
    return set;
  }, [existingAppts]);

  // Set default practitioner on load
  useEffect(() => {
    if (!selectedTherapistId && practitioners.length > 0) {
      if (user?.role === 'therapist') {
        const matched = practitioners.find((p) => p.id === user.id || String(p.id) === String(user.id));
        if (matched) {
          setSelectedTherapistId(matched.id);
          return;
        }
      }
      setSelectedTherapistId(practitioners[0].id);
    }
  }, [practitioners, selectedTherapistId, user]);

  // Set default service
  useEffect(() => {
    if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Filtered Patients by search
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter((p) => {
      const name = `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [patients, patientSearch]);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const selectedPractitioner = practitioners.find((pr) => pr.id === selectedTherapistId);
  const selectedService = services.find((s) => s.id === selectedServiceId);

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      setErrorMessage('Please select a patient.');
      return;
    }
    if (!selectedTherapistId && practitioners.length > 0) {
      setErrorMessage('Please assign a practitioner / therapist.');
      return;
    }
    if (!selectedTime) {
      setErrorMessage('Please select an appointment time slot.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const isoDateTime = new Date(`${dateStr}T${selectedTime}:00`).toISOString();

      const durationMins = selectedService ? parseInt(String(selectedService.duration), 10) || 45 : 45;
      const endDateTime = new Date(new Date(isoDateTime).getTime() + durationMins * 60000).toISOString();

      await appointmentApi.create({
        patientId: selectedPatientId,
        therapistId: selectedTherapistId || practitioners[0]?.id || 1,
        appointmentDate: isoDateTime,
        serviceId: selectedServiceId || undefined,
        room: selectedRoom,
        notes: notes.trim() || undefined,
        startTime: isoDateTime,
        endTime: endDateTime,
      });

      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.refetchQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['recent-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });

      Alert.alert('Booking Confirmed', 'Appointment scheduled successfully!', [
        { text: 'View Agenda', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to book appointment.');
    } finally {
      setLoading(false);
    }
  };

  const slotsToDisplay =
    timePeriod === 'morning'
      ? MORNING_SLOTS
      : timePeriod === 'afternoon'
      ? AFTERNOON_SLOTS
      : EVENING_SLOTS;

  return (
    <ScreenWrapper>
      {/* ── Top Header ── */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <Text style={styles.headerSub}>Clinic Management Scheduler</Text>
        </View>
        <View style={styles.stepsBadge}>
          <Text style={styles.stepsBadgeText}>
            {selectedPatientId && selectedTherapistId && selectedServiceId ? 'Ready' : 'Step by Step'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color={Colors.danger} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        )}

        {/* ── STEP 1: SELECT PATIENT ── */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeaderRow}>
            <View style={styles.stepNumberCircle}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepHeaderText}>Select Patient *</Text>
            <TouchableOpacity
              style={styles.addPatientBtn}
              onPress={() => router.push('/(app)/patients/create')}
              activeOpacity={0.7}
            >
              <UserPlus size={12} color={Colors.primary} />
              <Text style={styles.addPatientBtnText}>+ New Patient</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={14} color={Colors.slate} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by patient name or phone..."
              placeholderTextColor={Colors.slate}
              value={patientSearch}
              onChangeText={setPatientSearch}
            />
            {!!patientSearch && (
              <TouchableOpacity onPress={() => setPatientSearch('')}>
                <Text style={{ fontSize: 12, color: Colors.slate, fontWeight: '700' }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
            {filteredPatients.length === 0 ? (
              <View style={styles.emptyPatientsBox}>
                <Text style={styles.emptyPatientsText}>No patients match '{patientSearch}'</Text>
              </View>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = selectedPatientId === p.id;
                const name = `${p.first_name || p.firstName || ''} ${p.last_name || p.lastName || ''}`.trim() || 'Patient';
                const initial = name.charAt(0).toUpperCase();

                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.patientCard, isSelected && styles.patientCardActive]}
                    onPress={() => setSelectedPatientId(p.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.avatarCircle, isSelected && styles.avatarCircleActive]}>
                      {isSelected ? (
                        <Check size={16} color="#FFF" />
                      ) : (
                        <Text style={styles.avatarInitial}>{initial}</Text>
                      )}
                    </View>
                    <Text style={[styles.patientName, isSelected && styles.patientNameActive]} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={styles.patientPhone} numberOfLines={1}>
                      {p.phone || 'No phone'}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* ── STEP 2: ASSIGN PRACTITIONER ── */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeaderRow}>
            <View style={[styles.stepNumberCircle, { backgroundColor: '#F3E8FF' }]}>
              <Text style={[styles.stepNumberText, { color: '#7E22CE' }]}>2</Text>
            </View>
            <Text style={styles.stepHeaderText}>Assign Practitioner / Doctor *</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
            {practitioners.map((pr) => {
              const isSelected = selectedTherapistId === pr.id;
              const initial = pr.name ? pr.name.charAt(0).toUpperCase() : 'D';

              return (
                <TouchableOpacity
                  key={pr.id}
                  style={[styles.docCard, isSelected && styles.docCardActive]}
                  onPress={() => setSelectedTherapistId(pr.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.docAvatar, isSelected && styles.docAvatarActive]}>
                    <Text style={[styles.docAvatarText, isSelected && { color: '#FFF' }]}>{initial}</Text>
                  </View>
                  <Text style={[styles.docName, isSelected && styles.docNameActive]} numberOfLines={1}>
                    Dr. {pr.name}
                  </Text>
                  <Text style={styles.docRole}>Physiotherapist</Text>
                  {isSelected && (
                    <View style={styles.selectedPill}>
                      <Check size={10} color="#059669" />
                      <Text style={styles.selectedPillText}>Assigned</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── STEP 3: TREATMENT & SERVICE ── */}
        <View style={styles.stepCard}>
          <View style={[styles.stepHeaderRow, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.stepNumberCircle, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.stepNumberText, { color: '#059669' }]}>3</Text>
              </View>
              <Text style={styles.stepHeaderText}>Treatment & Service</Text>
            </View>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
              onPress={() => router.push('/(app)/services' as any)}
              activeOpacity={0.7}
            >
              <Plus size={12} color={Colors.primaryDark} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primaryDark }}>Add Service</Text>
            </TouchableOpacity>
          </View>

          {services.length === 0 ? (
            <View style={{ padding: 14, backgroundColor: '#F8FAFC', borderRadius: 10, alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 13, color: Colors.slate, marginBottom: 8 }}>No services found in catalog</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                onPress={() => router.push('/(app)/services' as any)}
              >
                <Plus size={14} color="#FFF" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>Create First Service</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
              {services.map((srv) => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <TouchableOpacity
                    key={srv.id}
                    style={[styles.serviceCard, isSelected && styles.serviceCardActive]}
                    onPress={() => setSelectedServiceId(srv.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.serviceTopRow}>
                      <Text style={[styles.serviceName, isSelected && styles.serviceNameActive]} numberOfLines={1}>
                        {srv.name}
                      </Text>
                      {isSelected && <Check size={14} color={Colors.primaryDark} />}
                    </View>
                    <Text style={styles.servicePrice}>{formatCurrency(srv.price)}</Text>
                    <View style={styles.durationPill}>
                      <Clock size={10} color={Colors.slate} />
                      <Text style={styles.durationText}>{srv.duration} mins</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={[styles.serviceCard, { borderStyle: 'dashed', borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' }]}
                onPress={() => router.push('/(app)/services' as any)}
                activeOpacity={0.7}
              >
                <Plus size={20} color={Colors.primary} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.primary, marginTop: 4 }}>+ New Service</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* ── STEP 4: DATE & TIME SLOTS ── */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeaderRow}>
            <View style={[styles.stepNumberCircle, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.stepNumberText, { color: '#D97706' }]}>4</Text>
            </View>
            <Text style={styles.stepHeaderText}>Appointment Date & Slot *</Text>
          </View>

          {/* 14-Day Horizontal Date Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((offset) => {
              const dateObj = addDays(new Date(), offset);
              const isSelected = isSameDay(selectedDate, dateObj);
              const dayLabel = offset === 0 ? 'Today' : offset === 1 ? 'Tmrw' : format(dateObj, 'EEE');

              return (
                <TouchableOpacity
                  key={offset}
                  style={[styles.dateBox, isSelected && styles.dateBoxActive]}
                  onPress={() => setSelectedDate(dateObj)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dateDay, isSelected && styles.dateDayActive]}>{dayLabel}</Text>
                  <Text style={[styles.dateNum, isSelected && styles.dateNumActive]}>{format(dateObj, 'dd')}</Text>
                  <Text style={[styles.dateMonth, isSelected && styles.dateMonthActive]}>
                    {format(dateObj, 'MMM')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Time Period Filter Tabs */}
          <View style={styles.timePeriodRow}>
            <TouchableOpacity
              style={[styles.periodTab, timePeriod === 'morning' && styles.periodTabActive]}
              onPress={() => setTimePeriod('morning')}
            >
              <Sunrise size={13} color={timePeriod === 'morning' ? Colors.primary : Colors.slate} />
              <Text style={[styles.periodTabText, timePeriod === 'morning' && styles.periodTabTextActive]}>
                Morning
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.periodTab, timePeriod === 'afternoon' && styles.periodTabActive]}
              onPress={() => setTimePeriod('afternoon')}
            >
              <Sun size={13} color={timePeriod === 'afternoon' ? Colors.primary : Colors.slate} />
              <Text style={[styles.periodTabText, timePeriod === 'afternoon' && styles.periodTabTextActive]}>
                Afternoon
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.periodTab, timePeriod === 'evening' && styles.periodTabActive]}
              onPress={() => setTimePeriod('evening')}
            >
              <Sunset size={13} color={timePeriod === 'evening' ? Colors.primary : Colors.slate} />
              <Text style={[styles.periodTabText, timePeriod === 'evening' && styles.periodTabTextActive]}>
                Evening
              </Text>
            </TouchableOpacity>
          </View>

          {/* Time Slots Grid with booked state */}
          <View style={styles.slotGrid}>
            {slotsToDisplay.map((slot) => {
              const isSelected = selectedTime === slot;
              const isBooked = bookedSlots.has(slot);

              return (
                <TouchableOpacity
                  key={slot}
                  disabled={isBooked}
                  style={[
                    styles.slotBtn,
                    isSelected && styles.slotBtnActive,
                    isBooked && styles.slotBtnDisabled,
                  ]}
                  onPress={() => setSelectedTime(slot)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.slotText,
                      isSelected && styles.slotTextActive,
                      isBooked && styles.slotTextDisabled,
                    ]}
                  >
                    {slot}
                  </Text>
                  {isBooked && <Text style={styles.bookedTag}>Booked</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── STEP 5: ROOM / CLINICAL SPACE ── */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeaderRow}>
            <View style={[styles.stepNumberCircle, { backgroundColor: '#EDE9FE' }]}>
              <Text style={[styles.stepNumberText, { color: '#6D28D9' }]}>5</Text>
            </View>
            <Text style={styles.stepHeaderText}>Room / Space Assignment</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsRow}>
            {ROOM_OPTIONS.map((room) => {
              const isSelected = selectedRoom === room;
              return (
                <TouchableOpacity
                  key={room}
                  style={[styles.roomPill, isSelected && styles.roomPillActive]}
                  onPress={() => setSelectedRoom(room)}
                  activeOpacity={0.7}
                >
                  <Building size={14} color={isSelected ? Colors.primaryDark : Colors.slate} />
                  <Text style={[styles.roomPillText, isSelected && styles.roomPillTextActive]}>{room}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── STEP 6: NOTES & INSTRUCTIONS ── */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeaderRow}>
            <View style={[styles.stepNumberCircle, { backgroundColor: '#F1F5F9' }]}>
              <Text style={[styles.stepNumberText, { color: Colors.slate }]}>6</Text>
            </View>
            <Text style={styles.stepHeaderText}>Clinical / Booking Notes</Text>
          </View>

          <TextInput
            style={styles.notesTextInput}
            placeholder="Chief complaint, therapy goals, or special instructions..."
            placeholderTextColor={Colors.slate}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* ── LIVE BOOKING SUMMARY CARD ── */}
        {selectedPatient && selectedPractitioner && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Patient:</Text>
              <Text style={styles.summaryVal}>
                {`${selectedPatient.first_name || selectedPatient.firstName || ''} ${selectedPatient.last_name || selectedPatient.lastName || ''}`.trim()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Practitioner:</Text>
              <Text style={styles.summaryVal}>Dr. {selectedPractitioner.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Date & Time:</Text>
              <Text style={styles.summaryVal}>
                {format(selectedDate, 'dd MMM yyyy')} at {selectedTime}
              </Text>
            </View>
            {selectedService && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Service:</Text>
                <Text style={styles.summaryVal}>
                  {selectedService.name} ({formatCurrency(selectedService.price)})
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Room:</Text>
              <Text style={styles.summaryVal}>{selectedRoom}</Text>
            </View>
          </View>
        )}

        {/* ── CONFIRM BUTTON ── */}
        <TouchableOpacity
          style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Check size={18} color="#FFF" />
              <Text style={styles.confirmBtnText}>Confirm & Schedule Appointment</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  stepsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorBannerText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '700',
    flex: 1,
  },
  stepCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stepNumberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.primary,
  },
  stepHeaderText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.dark,
    flex: 1,
  },
  addPatientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.primaryLight,
  },
  addPatientBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: Colors.dark,
    padding: 0,
  },
  cardsRow: {
    gap: 10,
    paddingBottom: 4,
  },
  emptyPatientsBox: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyPatientsText: {
    fontSize: 12,
    color: Colors.slate,
    fontStyle: 'italic',
  },
  patientCard: {
    width: 130,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  patientCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarCircleActive: {
    backgroundColor: Colors.primary,
  },
  avatarInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.dark,
  },
  patientName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark,
    textAlign: 'center',
  },
  patientNameActive: {
    color: Colors.primaryDark,
  },
  patientPhone: {
    fontSize: 10,
    color: Colors.slate,
    marginTop: 2,
  },
  docCard: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  docCardActive: {
    borderColor: '#7E22CE',
    backgroundColor: '#FAF5FF',
  },
  docAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  docAvatarActive: {
    backgroundColor: '#7E22CE',
  },
  docAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7E22CE',
  },
  docName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark,
    textAlign: 'center',
  },
  docNameActive: {
    color: '#6B21A8',
  },
  docRole: {
    fontSize: 10,
    color: Colors.slate,
    marginTop: 2,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  selectedPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
  },
  serviceCard: {
    width: 150,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  serviceCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  serviceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark,
    flex: 1,
  },
  serviceNameActive: {
    color: Colors.primaryDark,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
    marginBottom: 6,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  durationText: {
    fontSize: 10,
    color: Colors.slate,
    fontWeight: '600',
  },
  dateScroll: {
    gap: 8,
    paddingBottom: 10,
  },
  dateBox: {
    width: 60,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  dateBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  dateDay: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate,
  },
  dateDayActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  dateNum: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.dark,
    marginVertical: 1,
  },
  dateNumActive: {
    color: '#FFF',
  },
  dateMonth: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.slate,
  },
  dateMonthActive: {
    color: 'rgba(255,255,255,0.85)',
  },
  timePeriodRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
  },
  periodTabActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  periodTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate,
  },
  periodTabTextActive: {
    color: Colors.dark,
    fontWeight: '800',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    width: '23%',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  slotBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  slotText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark,
  },
  slotTextActive: {
    color: Colors.primaryDark,
    fontWeight: '900',
  },
  slotTextDisabled: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  bookedTag: {
    fontSize: 7,
    fontWeight: '800',
    color: '#E11D48',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  roomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  roomPillActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  roomPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark,
  },
  roomPillTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },
  notesTextInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    color: Colors.dark,
    textAlignVertical: 'top',
    height: 70,
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryKey: {
    fontSize: 11,
    color: Colors.slate,
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F172A',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
});
