import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
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

  // Synchronize when opening
  useEffect(() => {
    if (visible) {
      setTentativeFrom(fromDate);
      setTentativeTo(toDate);
      setTentativePreset(activePreset);
    }
  }, [visible, fromDate, toDate, activePreset]);

  // Handle Preset selection
  const handleSelectPreset = (preset: DatePresetKey) => {
    setTentativePreset(preset);
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
      // Indian Financial Year: April 1 of current or previous year
      const fyStartYear = now.getMonth() >= 3 ? currYear : currYear - 1;
      const fyStart = new Date(fyStartYear, 3, 1);
      setTentativeFrom(formatDateToIso(fyStart));
      setTentativeTo(formatDateToIso(now));
    }
  };

  // Adjust date by +/- days
  const adjustDate = (target: 'from' | 'to', deltaDays: number) => {
    try {
      const baseStr = target === 'from' ? tentativeFrom : tentativeTo;
      const parts = baseStr.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + deltaDays);
      const newStr = formatDateToIso(d);
      if (target === 'from') {
        setTentativeFrom(newStr);
      } else {
        setTentativeTo(newStr);
      }
      setTentativePreset('custom');
    } catch {}
  };

  const handleApply = () => {
    onApply(tentativeFrom, tentativeTo, tentativePreset);
    onClose();
  };

  const presetsList: { key: DatePresetKey; label: string; icon: string }[] = [
    { key: 'today', label: 'Today', icon: 'zap' },
    { key: 'yesterday', label: 'Yesterday', icon: 'rewind' },
    { key: 'last_7_days', label: 'Last 7 Days', icon: 'calendar' },
    { key: 'this_month', label: 'This Month', icon: 'calendar' },
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
                <Feather name="calendar" size={17} color="#0047AB" />
              </View>
              <View>
                <Text style={styles.sheetTitle}>{title}</Text>
                <Text style={styles.sheetSubtitle}>Filter report records by date</Text>
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
                <Text style={styles.rangeBannerLabel}>FROM DATE</Text>
                <Text style={styles.rangeBannerValue}>{formatReadableDate(tentativeFrom)}</Text>
                <Text style={styles.rangeBannerIso}>{tentativeFrom}</Text>
              </View>
              <View style={styles.rangeArrow}>
                <Feather name="arrow-right" size={16} color="#0047AB" />
              </View>
              <View style={[styles.rangeBannerCol, { alignItems: 'flex-end' }]}>
                <Text style={styles.rangeBannerLabel}>TO DATE</Text>
                <Text style={styles.rangeBannerValue}>{formatReadableDate(tentativeTo)}</Text>
                <Text style={styles.rangeBannerIso}>{tentativeTo}</Text>
              </View>
            </View>

            {/* 3. Quick Presets Section */}
            <Text style={styles.sectionHeading}>QUICK PRESETS</Text>
            <View style={styles.presetsGrid}>
              {presetsList.map((p) => {
                const isSelected = tentativePreset === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.presetCard, isSelected && styles.presetCardActive]}
                    onPress={() => handleSelectPreset(p.key)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.presetCardHeader}>
                      <Feather
                        name={p.icon as any}
                        size={13}
                        color={isSelected ? '#FFFFFF' : '#0047AB'}
                      />
                      {isSelected ? (
                        <Feather name="check-circle" size={13} color="#FFFFFF" />
                      ) : null}
                    </View>
                    <Text
                      style={[styles.presetCardText, isSelected && styles.presetCardTextActive]}
                      numberOfLines={1}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. Custom Date Range Inputs */}
            <Text style={styles.sectionHeading}>CUSTOM DATE RANGE (YYYY-MM-DD)</Text>
            <View style={styles.customDateBox}>
              <View style={styles.customDateRow}>
                {/* From Date Box */}
                <View style={styles.customDateCol}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.dateTextInput}
                      value={tentativeFrom}
                      onChangeText={(val) => {
                        setTentativeFrom(val);
                        setTentativePreset('custom');
                      }}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#8FA0B8"
                    />
                  </View>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => adjustDate('from', -1)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperBtnText}>-1 Day</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => adjustDate('from', 1)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperBtnText}>+1 Day</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* To Date Box */}
                <View style={styles.customDateCol}>
                  <Text style={styles.inputLabel}>End Date</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.dateTextInput}
                      value={tentativeTo}
                      onChangeText={(val) => {
                        setTentativeTo(val);
                        setTentativePreset('custom');
                      }}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#8FA0B8"
                    />
                  </View>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => adjustDate('to', -1)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperBtnText}>-1 Day</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => adjustDate('to', 1)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperBtnText}>+1 Day</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
              <Text style={styles.resetBtnText}>Today</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApply}
              activeOpacity={0.8}
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '90%',
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
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
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    marginBottom: 14,
  },
  rangeBannerCol: {
    flex: 1,
  },
  rangeBannerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8FA0B8',
    letterSpacing: 0.5,
  },
  rangeBannerValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E204E',
    marginTop: 2,
  },
  rangeBannerIso: {
    fontSize: 10,
    color: '#5A6B87',
    marginTop: 1,
  },
  rangeArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },

  // Section Heading
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8FA0B8',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },

  // Presets Grid
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetCard: {
    width: '31%',
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  presetCardActive: {
    backgroundColor: '#0047AB',
    borderColor: '#0047AB',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  presetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  presetCardText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E204E',
  },
  presetCardTextActive: {
    color: '#FFFFFF',
  },

  // Custom Date
  customDateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 12,
    marginBottom: 14,
  },
  customDateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  customDateCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '600',
    marginBottom: 4,
  },
  inputWrap: {
    height: 40,
    backgroundColor: '#F8FAFD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  dateTextInput: {
    fontSize: 13,
    color: '#0E204E',
    fontWeight: '600',
    paddingVertical: 0,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  stepperBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  stepperBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0047AB',
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
    backgroundColor: '#F4F8FD',
    paddingVertical: 12,
    borderRadius: 10,
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
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
