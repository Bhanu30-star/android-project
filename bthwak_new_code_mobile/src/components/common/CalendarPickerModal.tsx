import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/theme/tokens';
import { formatYmd, formatReadable } from '@/utils/dateUtils';

interface CalendarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string; // ISO or YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  maxDate?: Date; // e.g. new Date() to prevent future dates
  title?: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
  title = 'Select Invoice Date',
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

  // Days array: leading empty cells + day numbers
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
      // Future date beyond allowed
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
            <View>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.selectedDisplay}>
                {formatReadable(tentativeDate)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quick presets */}
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={[
                styles.presetChip,
                tentativeDate === todayStr && styles.presetChipActive,
              ]}
              onPress={() => handleQuickPreset('today')}
            >
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
            >
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="chevron-left" size={20} color={Colors.text} />
            </TouchableOpacity>

            <Text style={styles.monthYearTitle}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.navArrow}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="chevron-right" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Day of Week Headers */}
          <View style={styles.dowRow}>
            {DAYS_OF_WEEK.map((dow, idx) => (
              <Text
                key={dow}
                style={[
                  styles.dowText,
                  (idx === 0 || idx === 6) && styles.dowWeekend,
                ]}
              >
                {dow}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }

              const cellDate = new Date(currentYear, currentMonth, day);
              const cellYmd = formatYmd(cellDate);
              const isSelected = cellYmd === tentativeDate;
              const isToday = cellYmd === todayStr;
              const isFuture =
                maxDate && cellDate.getTime() > maxDate.getTime() + 86400000 - 1;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => handleSelectDay(day)}
                  disabled={isFuture}
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
                </TouchableOpacity>
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
              activeOpacity={0.8}
            >
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedDisplay: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  presetChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#3730A3',
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  presetChipTextActive: {
    color: '#3730A3',
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginBottom: 8,
  },
  navArrow: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  monthYearTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  dowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dowText: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  dowWeekend: {
    color: '#9CA3AF',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayCell: {
    width: 40,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#3730A3',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#3730A3',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayTextToday: {
    color: '#3730A3',
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: '#D1D5DB',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#3730A3',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
