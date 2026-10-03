import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  Check,
} from 'lucide-react-native';
import {
  format,
  getDaysInMonth,
  setYear,
  setMonth,
  setDate,
  getYear,
  getMonth,
  getDate,
  subYears,
  differenceInYears,
} from 'date-fns';
import Colors from '../../constants/colors';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateString: string, displayDate: string) => void;
  initialDate?: string | Date;
  title?: string;
  maxDate?: Date;
  minDate?: Date;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePickerModal({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  title = 'Select Date of Birth',
  maxDate = new Date(),
  minDate = subYears(new Date(), 100),
}: DatePickerModalProps) {
  const currentYear = new Date().getFullYear();

  // Parse initial date
  const parsedInitial = useMemo(() => {
    if (!initialDate) return subYears(new Date(), 25);
    if (initialDate instanceof Date && !isNaN(initialDate.getTime())) return initialDate;
    if (typeof initialDate === 'string') {
      const trimmed = initialDate.trim();
      if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(trimmed)) {
        const parts = trimmed.split(/[\/\-]/);
        const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        if (!isNaN(d.getTime())) return d;
      }
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return d;
    }
    return subYears(new Date(), 25);
  }, [initialDate]);

  const [selectedDate, setSelectedDate] = useState<Date>(parsedInitial);
  const [viewMode, setViewMode] = useState<'calendar' | 'years' | 'months'>('calendar');

  const selectedYearVal = getYear(selectedDate);
  const selectedMonthVal = getMonth(selectedDate);
  const selectedDayVal = getDate(selectedDate);

  // Generate Year list from maxDate year down to minDate year
  const yearsList = useMemo(() => {
    const list: number[] = [];
    const maxYear = getYear(maxDate);
    const minYear = getYear(minDate);
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [maxDate, minDate]);

  // Days in selected Month
  const daysInMonth = useMemo(() => {
    return getDaysInMonth(selectedDate);
  }, [selectedDate]);

  // First day of current month offset
  const firstDayOffset = useMemo(() => {
    const firstDay = new Date(selectedYearVal, selectedMonthVal, 1);
    return firstDay.getDay(); // 0 is Sunday
  }, [selectedYearVal, selectedMonthVal]);

  const handlePrevMonth = () => {
    const newMonth = selectedMonthVal === 0 ? 11 : selectedMonthVal - 1;
    const newYear = selectedMonthVal === 0 ? selectedYearVal - 1 : selectedYearVal;
    const maxDay = getDaysInMonth(new Date(newYear, newMonth, 1));
    const day = Math.min(selectedDayVal, maxDay);
    setSelectedDate(new Date(newYear, newMonth, day));
  };

  const handleNextMonth = () => {
    const newMonth = selectedMonthVal === 11 ? 0 : selectedMonthVal + 1;
    const newYear = selectedMonthVal === 11 ? selectedYearVal + 1 : selectedYearVal;
    const maxDay = getDaysInMonth(new Date(newYear, newMonth, 1));
    const day = Math.min(selectedDayVal, maxDay);
    setSelectedDate(new Date(newYear, newMonth, day));
  };

  const handleSelectDay = (day: number) => {
    const updated = new Date(selectedYearVal, selectedMonthVal, day);
    setSelectedDate(updated);
  };

  const handleConfirm = () => {
    const yyyyMmDd = format(selectedDate, 'yyyy-MM-dd');
    const ddMmYyyy = format(selectedDate, 'dd/MM/yyyy');
    onSelectDate(yyyyMmDd, ddMmYyyy);
    onClose();
  };

  const age = useMemo(() => {
    try {
      return differenceInYears(new Date(), selectedDate);
    } catch {
      return null;
    }
  }, [selectedDate]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleBox}>
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.formattedDateText}>
                    {format(selectedDate, 'dd MMMM yyyy')}{' '}
                    {age !== null && age >= 0 && (
                      <Text style={styles.ageBadgeText}>({age} yrs old)</Text>
                    )}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                  <X size={20} color={Colors.dark} />
                </TouchableOpacity>
              </View>

              {/* Navigation Header (Month & Year Selector buttons) */}
              <View style={styles.navRow}>
                <TouchableOpacity
                  style={[styles.selectorBtn, viewMode === 'months' && styles.selectorBtnActive]}
                  onPress={() => setViewMode(viewMode === 'months' ? 'calendar' : 'months')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectorBtnText,
                      viewMode === 'months' && styles.selectorBtnTextActive,
                    ]}
                  >
                    {MONTHS[selectedMonthVal]} ▾
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.selectorBtn, viewMode === 'years' && styles.selectorBtnActive]}
                  onPress={() => setViewMode(viewMode === 'years' ? 'calendar' : 'years')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectorBtnText,
                      viewMode === 'years' && styles.selectorBtnTextActive,
                    ]}
                  >
                    {selectedYearVal} ▾
                  </Text>
                </TouchableOpacity>

                {viewMode === 'calendar' && (
                  <View style={styles.arrowGroup}>
                    <TouchableOpacity style={styles.arrowBtn} onPress={handlePrevMonth}>
                      <ChevronLeft size={20} color={Colors.dark} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.arrowBtn} onPress={handleNextMonth}>
                      <ChevronRight size={20} color={Colors.dark} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* View 1: Year Selector */}
              {viewMode === 'years' && (
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerHeading}>Select Birth Year</Text>
                  <ScrollView style={styles.yearsScroll} showsVerticalScrollIndicator={true}>
                    <View style={styles.yearsGrid}>
                      {yearsList.map((yr) => {
                        const isSelected = yr === selectedYearVal;
                        return (
                          <TouchableOpacity
                            key={yr}
                            style={[styles.yearChip, isSelected && styles.yearChipActive]}
                            onPress={() => {
                              setSelectedDate(setYear(selectedDate, yr));
                              setViewMode('calendar');
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.yearChipText,
                                isSelected && styles.yearChipTextActive,
                              ]}
                            >
                              {yr}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* View 2: Month Selector */}
              {viewMode === 'months' && (
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerHeading}>Select Month</Text>
                  <View style={styles.monthsGrid}>
                    {MONTHS.map((m, idx) => {
                      const isSelected = idx === selectedMonthVal;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[styles.monthChip, isSelected && styles.monthChipActive]}
                          onPress={() => {
                            setSelectedDate(setMonth(selectedDate, idx));
                            setViewMode('calendar');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.monthChipText,
                              isSelected && styles.monthChipTextActive,
                            ]}
                          >
                            {m.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* View 3: Standard Calendar View */}
              {viewMode === 'calendar' && (
                <View style={styles.calendarContainer}>
                  {/* Weekday headers */}
                  <View style={styles.weekdaysRow}>
                    {WEEKDAYS.map((wd) => (
                      <Text key={wd} style={styles.weekdayText}>
                        {wd}
                      </Text>
                    ))}
                  </View>

                  {/* Days grid */}
                  <View style={styles.daysGrid}>
                    {/* Empty slots for offset */}
                    {Array.from({ length: firstDayOffset }).map((_, idx) => (
                      <View key={`empty-${idx}`} style={styles.dayCellEmpty} />
                    ))}

                    {/* Day numbers */}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const isSelected = dayNum === selectedDayVal;
                      return (
                        <TouchableOpacity
                          key={`day-${dayNum}`}
                          style={[styles.dayCell, isSelected && styles.dayCellActive]}
                          onPress={() => handleSelectDay(dayNum)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[styles.dayText, isSelected && styles.dayTextActive]}
                          >
                            {dayNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                >
                  <Check size={18} color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>Confirm Date</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 14,
    marginBottom: 14,
  },
  headerTitleBox: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formattedDateText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  ageBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  selectorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectorBtnActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  selectorBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  selectorBtnTextActive: {
    color: Colors.primaryDark,
  },
  arrowGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 4,
  },
  arrowBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calendarContainer: {
    marginBottom: 16,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.slate,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  dayCellActive: {
    backgroundColor: Colors.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
  dayTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.slate,
    marginBottom: 10,
  },
  yearsScroll: {
    maxHeight: 220,
  },
  yearsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 10,
  },
  yearChip: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  yearChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  yearChipTextActive: {
    color: '#FFFFFF',
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthChip: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  monthChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dark,
  },
  monthChipTextActive: {
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.slate,
  },
  confirmBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
