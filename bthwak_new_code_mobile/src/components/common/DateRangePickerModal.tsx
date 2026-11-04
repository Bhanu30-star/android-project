import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';

export type DatePresetKey =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'this_month'
  | 'last_30_days'
  | 'this_year'
  | 'custom';

export interface DateRangePickerModalProps {
  visible: boolean;
  onClose: () => void;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  activePreset?: DatePresetKey;
  onApply: (fromDate: string, toDate: string, preset: DatePresetKey) => void;
  title?: string;
}

export const formatDateToIso = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatReadableDate = (isoStr: string): string => {
  try {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthNum = parseInt(parts[1], 10) - 1;
      const day = parts[2];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[monthNum] || ''} ${year}`;
    }
  } catch {}
  return isoStr;
};

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

export const DateRangePickerModal: React.FC<DateRangePickerModalProps> = ({
  visible,
  onClose,
  fromDate,
  toDate,
  activePreset = 'last_7_days',
  onApply,
  title = 'Choose Date Range',
}) => {
  const [tentativeFrom, setTentativeFrom] = useState(fromDate);
  const [tentativeTo, setTentativeTo] = useState(toDate);
  const [tentativePreset, setTentativePreset] = useState<DatePresetKey>(activePreset);
  const [selectionStep, setSelectionStep] = useState<'from' | 'to'>('from');

  const initialDate = toDate ? new Date(toDate) : new Date();
  const validInitial = isNaN(initialDate.getTime()) ? new Date() : initialDate;

  const [viewYear, setViewYear] = useState(validInitial.getFullYear());
  const [viewMonth, setViewMonth] = useState(validInitial.getMonth());

  const todayStr = useMemo(() => formatDateToIso(new Date()), []);

  // Synchronize when opening
  useEffect(() => {
    if (visible) {
      setTentativeFrom(fromDate);
      setTentativeTo(toDate);
      setTentativePreset(activePreset);
      setSelectionStep('from');
      const d = toDate ? new Date(toDate) : new Date();
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [visible, fromDate, toDate, activePreset]);

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build calendar cells
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Handle day click
  const handleDayPress = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    const dateStr = formatDateToIso(d);

    if (selectionStep === 'from') {
      setTentativeFrom(dateStr);
      setTentativeTo(dateStr);
      setSelectionStep('to');
      setTentativePreset('custom');
    } else {
      // Step is 'to'
      if (dateStr >= tentativeFrom) {
        setTentativeTo(dateStr);
        setSelectionStep('from');
      } else {
        setTentativeFrom(dateStr);
        setTentativeTo(dateStr);
        setSelectionStep('to');
      }
      setTentativePreset('custom');
    }
  };

  // Handle Preset selection
  const handleSelectPreset = (preset: DatePresetKey) => {
    setTentativePreset(preset);
    setSelectionStep('from');
    const now = new Date();

    if (preset === 'today') {
      const str = formatDateToIso(now);
      setTentativeFrom(str);
      setTentativeTo(str);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const str = formatDateToIso(y);
      setTentativeFrom(str);
      setTentativeTo(str);
    } else if (preset === 'last_7_days') {
      const w = new Date();
      w.setDate(w.getDate() - 7);
      setTentativeFrom(formatDateToIso(w));
      setTentativeTo(formatDateToIso(now));
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setTentativeFrom(formatDateToIso(firstDay));
      setTentativeTo(formatDateToIso(now));
    } else if (preset === 'last_30_days') {
      const m = new Date();
      m.setDate(m.getDate() - 30);
      setTentativeFrom(formatDateToIso(m));
      setTentativeTo(formatDateToIso(now));
    } else if (preset === 'this_year') {
      const currYear = now.getFullYear();
      const fyStartYear = now.getMonth() >= 3 ? currYear : currYear - 1;
      const fyStart = new Date(fyStartYear, 3, 1);
      setTentativeFrom(formatDateToIso(fyStart));
      setTentativeTo(formatDateToIso(now));
    }

    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  // Calculate day difference
  const daysCount = useMemo(() => {
    try {
      const f = new Date(tentativeFrom).getTime();
      const t = new Date(tentativeTo).getTime();
      const diff = Math.round(Math.abs(t - f) / (1000 * 60 * 60 * 24)) + 1;
      return diff;
    } catch {
      return 1;
    }
  }, [tentativeFrom, tentativeTo]);

  const handleApply = () => {
    onApply(tentativeFrom, tentativeTo, tentativePreset);
    onClose();
  };

  const presetsList: { key: DatePresetKey; label: string; icon: string }[] = [
    { key: 'today', label: 'Today', icon: 'zap' },
    { key: 'yesterday', label: 'Yesterday', icon: 'rotate-ccw' },
    { key: 'last_7_days', label: 'Last 7 Days', icon: 'calendar' },
    { key: 'this_month', label: 'This Month', icon: 'grid' },
    { key: 'last_30_days', label: 'Last 30 Days', icon: 'clock' },
    { key: 'this_year', label: 'Financial Year', icon: 'briefcase' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <TouchableOpacity
          style={styles.modalDismissArea}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />

          {/* 1. Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.calendarIconCircle}>
                <Ionicons name="calendar" size={18} color="#0047AB" />
              </View>
              <View>
                <Text style={styles.sheetTitle}>{title}</Text>
                <Text style={styles.sheetSubtitle}>
                  {selectionStep === 'from'
                    ? 'Tap start date on calendar'
                    : 'Tap end date to complete range'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtnCircle}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={18} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* 2. Active Range Banner */}
            <View style={styles.rangeBanner}>
              <View style={styles.rangeBannerCol}>
                <Text style={styles.rangeBannerLabel}>FROM</Text>
                <Text style={styles.rangeBannerValue} numberOfLines={1}>
                  {formatReadableDate(tentativeFrom)}
                </Text>
              </View>

              <View style={styles.rangeCenterBadge}>
                <Feather name="arrow-right" size={13} color="#0047AB" />
                <Text style={styles.rangeDaysText}>{daysCount} {daysCount === 1 ? 'Day' : 'Days'}</Text>
              </View>

              <View style={[styles.rangeBannerCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.rangeBannerLabel}>TO</Text>
                <Text style={styles.rangeBannerValue} numberOfLines={1}>
                  {formatReadableDate(tentativeTo)}
                </Text>
              </View>
            </View>

            {/* 3. Quick Presets Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsStrip}
            >
              {presetsList.map((p) => {
                const isSelected = tentativePreset === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                    onPress={() => handleSelectPreset(p.key)}
                    activeOpacity={0.75}
                  >
                    <Feather
                      name={p.icon as any}
                      size={12}
                      color={isSelected ? '#FFFFFF' : '#0047AB'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 4. VISUAL MONTH CALENDAR */}
            <View style={styles.calendarCard}>
              {/* Month Navigator */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={styles.navArrowBtn}
                  activeOpacity={0.7}
                >
                  <Feather name="chevron-left" size={18} color="#0047AB" />
                </TouchableOpacity>

                <View style={styles.monthTitleWrap}>
                  <Text style={styles.monthTitleText}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={styles.navArrowBtn}
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

                  const cellDate = new Date(viewYear, viewMonth, day);
                  const cellYmd = formatDateToIso(cellDate);
                  const isStart = cellYmd === tentativeFrom;
                  const isEnd = cellYmd === tentativeTo;
                  const isInRange = cellYmd > tentativeFrom && cellYmd < tentativeTo;
                  const isToday = cellYmd === todayStr;

                  return (
                    <View
                      key={`day-${day}`}
                      style={[
                        styles.cellWrapper,
                        isInRange && styles.cellInRange,
                        isStart && !isEnd && styles.cellRangeStart,
                        isEnd && !isStart && styles.cellRangeEnd,
                        isStart && isEnd && styles.cellRangeSingle,
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.dayButton,
                          (isStart || isEnd) && styles.dayButtonSelected,
                          isToday && !(isStart || isEnd) && styles.dayButtonToday,
                        ]}
                        onPress={() => handleDayPress(day)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            (isStart || isEnd) && styles.dayTextSelected,
                            isInRange && styles.dayTextInRange,
                            isToday && !(isStart || isEnd) && styles.dayTextToday,
                          ]}
                        >
                          {day}
                        </Text>
                        {isToday && !(isStart || isEnd) && (
                          <View style={styles.todayDot} />
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* 5. Bottom Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => handleSelectPreset('today')}
              activeOpacity={0.7}
            >
              <Feather name="rotate-ccw" size={14} color="#5A6B87" style={{ marginRight: 5 }} />
              <Text style={styles.resetBtnText}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApply}
              activeOpacity={0.85}
            >
              <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.applyBtnText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 37, 88, 0.55)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '92%',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  headerTitleWrap: {
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
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
  },
  sheetSubtitle: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 1,
  },
  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },

  // Range Banner
  rangeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFD',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    marginBottom: 10,
  },
  rangeBannerCol: {
    flex: 1,
  },
  rangeBannerLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8FA0B8',
    letterSpacing: 0.5,
  },
  rangeBannerValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E204E',
    marginTop: 2,
  },
  rangeCenterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  rangeDaysText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
  },

  // Presets Strip
  presetsStrip: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
    marginBottom: 10,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F4F8FD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  presetChipActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5A6B87',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },

  // Visual Calendar Card
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  monthTitleWrap: {
    alignItems: 'center',
  },
  monthTitleText: {
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
  },
  cellWrapper: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  cellInRange: {
    backgroundColor: '#EFF6FF',
  },
  cellRangeStart: {
    backgroundColor: '#EFF6FF',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  cellRangeEnd: {
    backgroundColor: '#EFF6FF',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  cellRangeSingle: {},

  dayButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#0047AB',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
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

  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E204E',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  dayTextInRange: {
    color: '#0047AB',
    fontWeight: '700',
  },
  dayTextToday: {
    color: '#FF6E00',
    fontWeight: '800',
  },

  // Footer Buttons
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F4F8FD',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5A6B87',
  },
  applyBtn: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#0047AB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
