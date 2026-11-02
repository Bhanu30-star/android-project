import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { InvoiceFilters, FseUser, fetchFseListApi } from '@/api/invoiceList';
import { CalendarPickerModal } from '@/components/common/CalendarPickerModal';

interface InvoiceFiltersModalProps {
  visible: boolean;
  filters: InvoiceFilters;
  onClose: () => void;
  onApply: (newFilters: InvoiceFilters) => void;
  onReset: () => void;
}

export const InvoiceFiltersModal: React.FC<InvoiceFiltersModalProps> = ({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}) => {
  const insets = useSafeAreaInsets();

  // Local draft state
  const [type, setType] = useState<'get_bill_book_data' | 'get_challan_book_data'>(
    filters.type
  );
  const [party, setParty] = useState<string>(filters.party || '');
  const [billNo, setBillNo] = useState<string>(filters.bill_no || '');
  const [fosUserId, setFosUserId] = useState<string>(filters.fos_user_id || '');
  const [startDate, setStartDate] = useState<string>(filters.start_date);
  const [endDate, setEndDate] = useState<string>(filters.end_date);

  // FSE Picker State
  const [fseList, setFseList] = useState<FseUser[]>([]);
  const [isFsePickerOpen, setIsFsePickerOpen] = useState(false);
  const [fseSearch, setFseSearch] = useState('');

  // Calendar states
  const [calendarTarget, setCalendarTarget] = useState<'start' | 'end' | null>(null);

  // Sync when visible
  useEffect(() => {
    if (visible) {
      setType(filters.type);
      setParty(filters.party || '');
      setBillNo(filters.bill_no || '');
      setFosUserId(filters.fos_user_id || '');
      setStartDate(filters.start_date);
      setEndDate(filters.end_date);
    }
  }, [visible, filters]);

  // Load FSE list
  useEffect(() => {
    if (visible && fseList.length === 0) {
      fetchFseListApi().then((list) => setFseList(list));
    }
  }, [visible, fseList.length]);

  const handleApply = () => {
    onApply({
      type,
      party: party.trim(),
      bill_no: billNo.trim(),
      fos_user_id: fosUserId,
      start_date: startDate,
      end_date: endDate,
      page: 1,
    });
    onClose();
  };

  const handleClearAll = () => {
    const today = new Date().toISOString().split('T')[0];
    setType('get_bill_book_data');
    setParty('');
    setBillNo('');
    setFosUserId('');
    setStartDate(today);
    setEndDate(today);
    onReset();
    onClose();
  };

  const selectedFseName =
    fseList.find((u) => String(u.userId) === fosUserId)?.userName || '';

  const filteredFse = fseList.filter(
    (u) =>
      u.userName.toLowerCase().includes(fseSearch.toLowerCase()) ||
      u.userPhone.includes(fseSearch)
  );

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Select Date';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Type Tabs: Invoices vs Challan */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  type === 'get_bill_book_data' && styles.tabButtonActive,
                ]}
                onPress={() => setType('get_bill_book_data')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    type === 'get_bill_book_data' && styles.tabButtonTextActive,
                  ]}
                >
                  Invoices
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  type === 'get_challan_book_data' && styles.tabButtonActive,
                ]}
                onPress={() => setType('get_challan_book_data')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    type === 'get_challan_book_data' && styles.tabButtonTextActive,
                  ]}
                >
                  Challan
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. Retailer Input */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Retailer / Party</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Select Retailer / Party Name"
                  placeholderTextColor="#64748B"
                  value={party}
                  onChangeText={setParty}
                />
                {party.length > 0 && (
                  <TouchableOpacity onPress={() => setParty('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="x" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 3. Sales Executive Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Sales Executive</Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setIsFsePickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    selectedFseName ? styles.dropdownTextSelected : null,
                  ]}
                  numberOfLines={1}
                >
                  {selectedFseName || 'Search Sales Executive...'}
                </Text>
                <Feather name="chevron-down" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* 4. Bill Number Filter */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Invoice / Bill No</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Invoice No (e.g. H00001)"
                  placeholderTextColor="#64748B"
                  value={billNo}
                  onChangeText={setBillNo}
                  autoCapitalize="characters"
                />
                {billNo.length > 0 && (
                  <TouchableOpacity onPress={() => setBillNo('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Feather name="x" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* 5. Date Range */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Date Range</Text>
              <View style={styles.dateRow}>
                {/* Start Date */}
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => setCalendarTarget('start')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dateText}>{formatDateDisplay(startDate)}</Text>
                  <Feather name="calendar" size={16} color="#0047AB" />
                </TouchableOpacity>

                {/* End Date */}
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => setCalendarTarget('end')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dateText}>{formatDateDisplay(endDate)}</Text>
                  <Feather name="calendar" size={16} color="#0047AB" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Button: Apply Filters */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FSE Selection Modal */}
        <Modal
          visible={isFsePickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsFsePickerOpen(false)}
        >
          <View style={styles.subModalOverlay}>
            <View style={styles.subModalCard}>
              <View style={styles.subModalHeader}>
                <Text style={styles.subModalTitle}>Select Sales Executive</Text>
                <TouchableOpacity onPress={() => setIsFsePickerOpen(false)}>
                  <Feather name="x" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View style={styles.subModalSearch}>
                <Feather name="search" size={16} color="#94A3B8" />
                <TextInput
                  style={styles.subModalInput}
                  placeholder="Search executive..."
                  placeholderTextColor="#64748B"
                  value={fseSearch}
                  onChangeText={setFseSearch}
                />
              </View>

              <ScrollView style={{ maxHeight: 300 }}>
                <TouchableOpacity
                  style={[styles.fseItem, !fosUserId && styles.fseItemSelected]}
                  onPress={() => {
                    setFosUserId('');
                    setIsFsePickerOpen(false);
                  }}
                >
                  <Text style={[styles.fseItemText, !fosUserId && styles.fseItemTextSelected]}>
                    All Executives
                  </Text>
                </TouchableOpacity>

                {filteredFse.map((u) => {
                  const isSelected = String(u.userId) === fosUserId;
                  return (
                    <TouchableOpacity
                      key={u.userId}
                      style={[styles.fseItem, isSelected && styles.fseItemSelected]}
                      onPress={() => {
                        setFosUserId(String(u.userId));
                        setIsFsePickerOpen(false);
                      }}
                    >
                      <View>
                        <Text style={[styles.fseItemText, isSelected && styles.fseItemTextSelected]}>
                          {u.userName}
                        </Text>
                        <Text style={styles.fseItemPhone}>{u.userPhone}</Text>
                      </View>
                      {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Calendar Picker Modal */}
        <CalendarPickerModal
          visible={Boolean(calendarTarget)}
          onClose={() => setCalendarTarget(null)}
          onSelectDate={(d: string) => {
            const str = d.includes('T') ? d.split('T')[0] : d;
            if (calendarTarget === 'start') {
              setStartDate(str);
              if (endDate < str) setEndDate(str);
            } else if (calendarTarget === 'end') {
              setEndDate(str);
            }
            setCalendarTarget(null);
          }}
          selectedDate={calendarTarget === 'start' ? startDate : endDate}
          title={calendarTarget === 'start' ? 'Select Start Date' : 'Select End Date'}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE7F2',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0E204E',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0047AB',
  },
  scrollArea: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#0047AB',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A6B87',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  formGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A6B87',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 14,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0E204E',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: '#5A6B87',
  },
  dropdownTextSelected: {
    color: '#0E204E',
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  datePickerBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  footerRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#DFE7F2',
  },
  applyBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 16,
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
  },
  subModalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  subModalInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
  },
  fseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fseItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  fseItemText: {
    fontSize: 14,
    color: '#5A6B87',
    fontWeight: '600',
  },
  fseItemTextSelected: {
    color: '#0047AB',
    fontWeight: '700',
  },
  fseItemPhone: {
    fontSize: 11,
    color: '#5A6B87',
    marginTop: 2,
  },
});
