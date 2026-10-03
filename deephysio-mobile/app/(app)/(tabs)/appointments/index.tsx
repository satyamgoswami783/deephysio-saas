import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  QrCode,
  ListOrdered,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  UserCheck,
} from 'lucide-react-native';
import {
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  format,
  isToday,
  isSameDay,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { appointmentApi } from '../../../../src/api/appointment.api';
import { useAuth } from '../../../../src/context/AuthContext';
import { usePermissions } from '../../../../src/hooks/usePermissions';
import ScreenWrapper from '../../../../src/components/common/ScreenWrapper';
import AppointmentCard from '../../../../src/components/appointments/AppointmentCard';
import EmptyState from '../../../../src/components/common/EmptyState';
import LoadingState from '../../../../src/components/common/LoadingState';
import Colors from '../../../../src/constants/colors';
import { Appointment } from '../../../../src/types/appointment.types';

const STATUS_FILTERS = [
  { label: 'All', value: 'all', color: '#64748B' },
  { label: 'Completed', value: 'completed', color: '#10B981' },
  { label: 'DNA', value: 'no_show', color: '#EF4444' },
  { label: 'Checked In', value: 'checked_in', color: '#F59E0B' },
  { label: 'Scheduled', value: 'scheduled', color: '#3B82F6' },
  { label: 'Cancelled', value: 'cancelled', color: '#94A3B8' },
];

const TIME_HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 to 21:00

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { can, isTherapist } = usePermissions();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [selectedPractitioner, setSelectedPractitioner] = useState<string | number>(
    isTherapist && user?.id ? user.id : 'all'
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Practitioners
  const { data: practitioners = [] } = useQuery({
    queryKey: ['practitioners'],
    queryFn: appointmentApi.getPractitioners,
  });

  // Calculate formatted range for API and UI
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const formattedDateParam = format(currentDate, 'yyyy-MM-dd');

  // Load Appointments
  const {
    data: appointments = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['appointments', 'schedule', selectedPractitioner, selectedStatus],
    queryFn: async () => {
      const data = await appointmentApi.getAll({
        therapistId: selectedPractitioner !== 'all' ? selectedPractitioner : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      });
      console.log('📌 [APPOINTMENTS LOADED]: Raw list =', JSON.stringify(data));
      return data;
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Automatically refetch latest appointments when screen gains focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Date Header Label (Matching Web exact format)
  const headerDateLabel = useMemo(() => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    }
    if (viewMode === 'week') {
      return `${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy')}`;
    }
    return format(currentDate, 'EEEE, d MMMM yyyy');
  }, [currentDate, viewMode, weekStart, weekEnd]);

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    const startStr = format(weekStart, 'yyyy-MM-dd');
    const endStr = format(weekEnd, 'yyyy-MM-dd');

    const res = appointments.filter((appt) => {
      // Practitioner filter if any
      const pId = appt.therapist_id || (appt as any).therapistId || appt.therapist?.id;
      if (selectedPractitioner !== 'all' && pId && String(pId) !== String(selectedPractitioner)) {
        console.log(`❌ Appt ${appt.id} rejected by practitioner filter: ${pId} !== ${selectedPractitioner}`);
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        const apptStatus = appt.status?.toLowerCase();
        if (selectedStatus === 'no_show' && apptStatus !== 'no_show') {
          console.log(`❌ Appt ${appt.id} rejected by status filter (no_show)`);
          return false;
        }
        if (selectedStatus !== 'no_show' && apptStatus !== selectedStatus) {
          console.log(`❌ Appt ${appt.id} rejected by status filter: ${apptStatus} !== ${selectedStatus}`);
          return false;
        }
      }

      // Date match depending on view
      const rawDate = appt.appointment_date || (appt as any).appointmentDate || appt.start_time || (appt as any).startTime || (appt as any).date;
      if (!rawDate) {
        console.log(`❌ Appt ${appt.id} rejected: no valid date field in appt:`, JSON.stringify(appt));
        return false;
      }

      const parsedD = new Date(rawDate);
      if (isNaN(parsedD.getTime())) {
        console.log(`❌ Appt ${appt.id} rejected: invalid date string "${rawDate}"`);
        return false;
      }

      const apptDateStr = format(parsedD, 'yyyy-MM-dd');

      if (viewMode === 'day') {
        const currDayStr = format(currentDate, 'yyyy-MM-dd');
        const match = apptDateStr === currDayStr;
        if (!match) console.log(`❌ Appt ${appt.id} (${apptDateStr}) not matching Day ${currDayStr}`);
        return match;
      }
      if (viewMode === 'week') {
        const match = apptDateStr >= startStr && apptDateStr <= endStr;
        if (!match) console.log(`❌ Appt ${appt.id} (${apptDateStr}) not in Week [${startStr} to ${endStr}]`);
        return match;
      }
      if (viewMode === 'month') {
        const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');
        const match = apptDateStr >= monthStart && apptDateStr <= monthEnd;
        if (!match) console.log(`❌ Appt ${appt.id} (${apptDateStr}) not in Month [${monthStart} to ${monthEnd}]`);
        return match;
      }
      return true;
    });

    console.log('📊 [FILTERED APPOINTMENTS]:', res.length, 'of', appointments.length, 'passed filter. ViewMode:', viewMode, 'Week:', startStr, 'to', endStr);
    return res;
  }, [appointments, selectedPractitioner, selectedStatus, viewMode, currentDate, weekStart, weekEnd]);

  // Appointments grouped by hour for Day View
  const dayHourlyAppointments = useMemo(() => {
    const map: { [hour: number]: Appointment[] } = {};
    TIME_HOURS.forEach((h) => (map[h] = []));

    filteredAppointments.forEach((appt) => {
      let hour = 9;
      const timeVal = appt.start_time || appt.appointment_date;
      if (timeVal) {
        if (typeof timeVal === 'string' && timeVal.includes('T')) {
          hour = new Date(timeVal).getHours();
        } else if (typeof timeVal === 'string' && /^\d{1,2}:\d{2}/.test(timeVal)) {
          hour = parseInt(timeVal.split(':')[0], 10);
        }
      }

      if (map[hour]) {
        map[hour].push(appt);
      } else if (hour >= 8 && hour <= 21) {
        map[hour] = [appt];
      }
    });
    return map;
  }, [filteredAppointments]);

  return (
    <ScreenWrapper>
      {/* ── 1. Header (Matching Web Title + Booking + Sub-Actions) ── */}
      <View style={styles.topHeader}>
        <View style={styles.titleRow}>
          <View style={styles.titleIconWrap}>
            <CalendarIcon size={18} color={Colors.surface} />
          </View>
          <Text style={styles.headerTitle}>
            {isTherapist ? 'My Schedule' : 'Schedule'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.subActionBtn}
            onPress={() => router.push('/(app)/appointments/waitlist')}
            activeOpacity={0.7}
          >
            <ListOrdered size={16} color={Colors.dark} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.subActionBtn}
            onPress={() => router.push('/(app)/appointments/checkin')}
            activeOpacity={0.7}
          >
            <QrCode size={16} color={Colors.dark} />
          </TouchableOpacity>

          {can('appointments.manage') && (
            <TouchableOpacity
              style={styles.bookingBtn}
              onPress={() => router.push('/(app)/appointments/book')}
              activeOpacity={0.8}
            >
              <Plus size={14} color={Colors.surface} />
              <Text style={styles.bookingBtnText}>+ BOOKING</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── 2. Controls Toolbar (TODAY, < >, Date Range, Day/Week/Month Toggle) ── */}
      <View style={styles.controlsBar}>
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.todayBtn} onPress={handleToday} activeOpacity={0.7}>
            <Text style={styles.todayBtnText}>TODAY</Text>
          </TouchableOpacity>

          <View style={styles.arrowsGroup}>
            <TouchableOpacity style={styles.arrowBtn} onPress={handlePrev} activeOpacity={0.7}>
              <ChevronLeft size={16} color={Colors.dark} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.arrowBtn} onPress={handleNext} activeOpacity={0.7}>
              <ChevronRight size={16} color={Colors.dark} />
            </TouchableOpacity>
          </View>

          <Text style={styles.rangeLabel} numberOfLines={1}>
            {headerDateLabel}
          </Text>
        </View>

        {/* View Mode Toggle: Day | Week | Month */}
        <View style={styles.viewToggleGroup}>
          {(['day', 'week', 'month'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[styles.viewToggleBtn, viewMode === mode && styles.viewToggleBtnActive]}
              onPress={() => setViewMode(mode)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.viewToggleText, viewMode === mode && styles.viewToggleTextActive]}
              >
                {mode.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── 3. Status Filter Pills (Matching Web Exact Colors) ── */}
      <View style={styles.statusFiltersBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusScroll}>
          {STATUS_FILTERS.map((f) => {
            const isActive = selectedStatus === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                style={[styles.statusPill, isActive && styles.statusPillActive]}
                onPress={() => setSelectedStatus(f.value)}
                activeOpacity={0.7}
              >
                <View style={[styles.statusDot, { backgroundColor: f.color }]} />
                <Text style={[styles.statusPillText, isActive && styles.statusPillTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── 4. Practitioners Dropdown / Scroll Filter ── */}
      {practitioners.length > 0 && !isTherapist && (
        <View style={styles.practitionerBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.practitionerScroll}>
            <TouchableOpacity
              style={[styles.practChip, selectedPractitioner === 'all' && styles.practChipActive]}
              onPress={() => setSelectedPractitioner('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.practText, selectedPractitioner === 'all' && styles.practTextActive]}>
                All Practitioners
              </Text>
            </TouchableOpacity>

            {practitioners.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.practChip, selectedPractitioner === p.id && styles.practChipActive]}
                onPress={() => setSelectedPractitioner(p.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.practText, selectedPractitioner === p.id && styles.practTextActive]}>
                  Dr. {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── 5. Week Day Strip (When in Week or Day view) ── */}
      {viewMode === 'week' && (
        <View style={styles.weekStrip}>
          {weekDays.map((d) => {
            const isSelected = isSameDay(d, currentDate);
            const isCurrToday = isToday(d);
            const dayAppts = appointments.filter((a) => {
              const rawDate = a.appointment_date || a.start_time;
              if (!rawDate) return false;
              return format(new Date(rawDate), 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd');
            });

            return (
              <TouchableOpacity
                key={d.toISOString()}
                style={[styles.weekDayCell, isSelected && styles.weekDayCellActive]}
                onPress={() => setCurrentDate(d)}
                activeOpacity={0.7}
              >
                <Text style={[styles.weekDayName, isSelected && styles.weekDayNameActive]}>
                  {format(d, 'EEE')}
                </Text>
                <Text style={[styles.weekDayNum, isSelected && styles.weekDayNumActive]}>
                  {format(d, 'd/M')}
                </Text>
                {isCurrToday && <View style={styles.todayIndicatorDot} />}
                {dayAppts.length > 0 && (
                  <View style={styles.apptCountBadge}>
                    <Text style={styles.apptCountText}>{dayAppts.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* ── 6. Schedule Content Views ── */}
      {isLoading ? (
        <LoadingState message="Loading clinic schedule..." />
      ) : viewMode === 'day' ? (
        /* Hourly Timetable Grid (Day View) */
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          contentContainerStyle={styles.timetableContent}
        >
          {TIME_HOURS.map((hour) => {
            const hourStr = `${String(hour).padStart(2, '0')}:00`;
            const apptsAtHour = dayHourlyAppointments[hour] || [];

            return (
              <View key={hour} style={styles.timeSlotRow}>
                {/* Time Label */}
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabelText}>{hourStr}</Text>
                </View>

                {/* Slot Content */}
                <View style={styles.slotGridCol}>
                  {apptsAtHour.length > 0 ? (
                    apptsAtHour.map((appt) => (
                      <TouchableOpacity
                        key={appt.id}
                        style={styles.gridApptCard}
                        onPress={() => router.push(`/(app)/appointments/${appt.id}`)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.gridApptTop}>
                          <Text style={styles.gridPatientName}>
                            {appt.patient
                              ? `${appt.patient.first_name || ''} ${appt.patient.last_name || ''}`.trim()
                              : 'Patient'}
                          </Text>
                          <Text style={styles.gridStatusPill}>
                            {appt.status?.toUpperCase() || 'SCHEDULED'}
                          </Text>
                        </View>
                        <Text style={styles.gridServiceText}>
                          {appt.service?.name || 'Physiotherapy Consultation'} • {appt.start_time || hourStr}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <TouchableOpacity
                      style={styles.emptySlotArea}
                      onPress={() => router.push('/(app)/appointments/book')}
                      activeOpacity={0.5}
                    >
                      <Text style={styles.emptySlotPlaceholder}>+ Available Slot</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        /* List / Week / Month Sessions View */
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onPress={() => router.push(`/(app)/appointments/${item.id}`)}
              onCheckIn={() => router.push(`/(app)/appointments/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Appointments Found"
              description={`No sessions scheduled for ${headerDateLabel}.`}
              actionTitle={can('appointments.manage') ? 'Book Appointment' : undefined}
              onActionPress={() => router.push('/(app)/appointments/book')}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      {can('appointments.manage') && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/(app)/appointments/book')}
          activeOpacity={0.85}
        >
          <Plus size={24} color={Colors.surface} />
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.dark,
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subActionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  bookingBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.surface,
    letterSpacing: 0.5,
  },
  controlsBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  todayBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  todayBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate,
  },
  arrowsGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  arrowBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  rangeLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark,
    marginLeft: 4,
    flex: 1,
  },
  viewToggleGroup: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewToggleBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  viewToggleText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.slate,
  },
  viewToggleTextActive: {
    color: Colors.dark,
    fontWeight: '800',
  },
  statusFiltersBar: {
    backgroundColor: Colors.surface,
    paddingVertical: 6,
  },
  statusScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  statusPillActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate,
  },
  statusPillTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  practitionerBar: {
    backgroundColor: Colors.surface,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  practitionerScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  practChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  practChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  practText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.slate,
  },
  practTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  weekStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    justifyContent: 'space-between',
  },
  weekDayCell: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    minWidth: 44,
  },
  weekDayCellActive: {
    backgroundColor: Colors.primaryLight,
  },
  weekDayName: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.slate,
  },
  weekDayNameActive: {
    color: Colors.primaryDark,
  },
  weekDayNum: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.dark,
    marginTop: 2,
  },
  weekDayNumActive: {
    color: Colors.primaryDark,
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6',
    marginTop: 3,
  },
  apptCountBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#10B981',
    borderRadius: 6,
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apptCountText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.surface,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  timetableContent: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  timeSlotRow: {
    flexDirection: 'row',
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingHorizontal: 12,
  },
  timeCol: {
    width: 50,
    paddingTop: 8,
  },
  timeLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.slate,
  },
  slotGridCol: {
    flex: 1,
    paddingVertical: 4,
    gap: 4,
  },
  gridApptCard: {
    backgroundColor: '#F0FDFA',
    borderLeftWidth: 3,
    borderLeftColor: '#0D9488',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  gridApptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridPatientName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark,
  },
  gridStatusPill: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0D9488',
  },
  gridServiceText: {
    fontSize: 10,
    color: Colors.slate,
    marginTop: 2,
  },
  emptySlotArea: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  emptySlotPlaceholder: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '600',
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
