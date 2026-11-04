import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { formatYmd, formatReadable } from '@/utils/dateUtils';

interface CalendarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string; // ISO or YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  maxDate?: Date; // e.g. new Date() to prevent future dates
  title?: string;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
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

export const CalendarPickerModal: React.FC<CalendarPickerModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  maxDate = new Date(),
  title = 'Select Date',
}) => {
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const validInitial = isNaN(initialDate.getTime()) ? new Date() : initialDate;

  const [currentYear, setCurrentYear] = useState(validInitial.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(validInitial.getMonth());
  const [tentativeDate, setTentativeDate] = useState<string>(formatYmd(validInitial));

  // Today in local YYYY-MM-DD
  const todayStr = formatYmd(new Date());

  // Navigate months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Build grid of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  const handleSelectDay = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    if (maxDate && d.getTime() > maxDate.getTime() + 86400000 - 1) {
      return;
    }
    const ymd = formatYmd(d);
    setTentativeDate(ymd);
  };

  const handleQuickPreset = (preset: 'today' | 'yesterday') => {
    const target = new Date();
    if (preset === 'yesterday') {
      target.setDate(target.getDate() - 1);
    }
    setCurrentYear(target.getFullYear());
    setCurrentMonth(target.getMonth());
    setTentativeDate(formatYmd(target));
  };

  const handleConfirm = () => {
    onSelectDate(tentativeDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.calendarIconCircle}>
                <Ionicons name="calendar" size={18} color="#0047AB" />
              </View>
              <View>
                <Text style={styles.headerTitle}>{title}</Text>
                <Text style={styles.selectedDisplay}>
                  {formatReadable(tentativeDate)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={18} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          {/* Quick Presets */}
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={[
                styles.presetChip,
                tentativeDate === todayStr && styles.presetChipActive,
              ]}
              onPress={() => handleQuickPreset('today')}
              activeOpacity={0.75}
            >
              <Feather
                name="zap"
                size={12}
                color={tentativeDate === todayStr ? '#FFFFFF' : '#0047AB'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.presetChipText,
                  tentativeDate === todayStr && styles.presetChipTextActive,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.presetChip,
                tentativeDate ===
                  formatYmd(new Date(Date.now() - 86400000)) &&
                  styles.presetChipActive,
              ]}
              onPress={() => handleQuickPreset('yesterday')}
              activeOpacity={0.75}
            >
              <Feather
                name="rotate-ccw"
                size={12}
                color={
                  tentativeDate === formatYmd(new Date(Date.now() - 86400000))
                    ? '#FFFFFF'
                    : '#0047AB'
                }
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.presetChipText,
                  tentativeDate ===
                    formatYmd(new Date(Date.now() - 86400000)) &&
                    styles.presetChipTextActive,
                ]}
              >
                Yesterday
              </Text>
            </TouchableOpacity>
          </View>

          {/* Month / Year Navigator */}
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.navArrow}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={18} color="#0047AB" />
            </TouchableOpacity>

            <Text style={styles.monthYearTitle}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.navArrow}
              activeOpacity={0.7}
            >
              <Feather name="chevron-right" size={18} color="#0047AB" />
            </TouchableOpacity>
          </View>

          {/* Day of Week Headers */}
          <View style={styles.dowRow}>
            {DAYS_OF_WEEK.map((dow, idx) => (
              <View key={dow} style={styles.dowCell}>
                <Text
                  style={[
                    styles.dowText,
                    (idx === 0 || idx === 6) && styles.dowWeekend,
                  ]}
                >
                  {dow}
                </Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.cellWrapper} />;
              }

              const cellDate = new Date(currentYear, currentMonth, day);
              const cellYmd = formatYmd(cellDate);
              const isSelected = cellYmd === tentativeDate;
              const isToday = cellYmd === todayStr;
              const isFuture =
                maxDate && cellDate.getTime() > maxDate.getTime() + 86400000 - 1;

              return (
                <View key={`day-${day}`} style={styles.cellWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      isSelected && styles.dayButtonSelected,
                      isToday && !isSelected && styles.dayButtonToday,
                      isFuture && styles.dayButtonDisabled,
                    ]}
                    onPress={() => handleSelectDay(day)}
                    disabled={isFuture}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        isToday && !isSelected && styles.dayTextToday,
                        isFuture && styles.dayTextDisabled,
                      ]}
                    >
                      {day}
                    </Text>
                    {isToday && !isSelected && <View style={styles.todayDot} />}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Bottom Actions */}
          <View style={styles.actionRow}>
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
              activeOpacity={0.85}
            >
              <Feather name="check" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={styles.confirmBtnText}>Apply Date</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 88, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA0B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedDisplay: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F4F8FD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  presetChipActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A6B87',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 6,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  monthYearTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0E204E',
  },
  dowRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dowCell: {
    flex: 1,
    alignItems: 'center',
  },
  dowText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8FA0B8',
  },
  dowWeekend: {
    color: '#DC2626',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  cellWrapper: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  dayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#0047AB',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  dayButtonToday: {
    borderWidth: 1.5,
    borderColor: '#FF6E00',
  },
  todayDot: {
    position: 'absolute',
    bottom: 2,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FF6E00',
  },
  dayButtonDisabled: {
    opacity: 0.35,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E204E',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  dayTextToday: {
    color: '#FF6E00',
    fontWeight: '800',
  },
  dayTextDisabled: {
    color: '#CBD5E1',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F4F8FD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A6B87',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0047AB',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
