import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BuyerSellerItem,
  StateOption,
  fetchStateListApi,
  fetchGstDataApi,
  fetchAllFosApi,
  addBuyerSellerApi,
  editBuyerSellerApi,
} from '@/api/buyerSeller';

interface AddEditBuyerSellerModalProps {
  visible: boolean;
  item: BuyerSellerItem | null; // null => Add mode, object => Edit mode
  initialType?: 'Buyer' | 'Seller';
  onClose: () => void;
  onSuccess: () => void;
}

export const AddEditBuyerSellerModal: React.FC<AddEditBuyerSellerModalProps> = ({
  visible,
  item,
  initialType = 'Buyer',
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const isEdit = Boolean(item);

  // Form Fields
  const [recordType, setRecordType] = useState<'Buyer' | 'Seller'>(initialType);
  const [gstNumber, setGstNumber] = useState('');
  const [partyName, setPartyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('08 - Rajasthan');
  const [address, setAddress] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('');
  const [partyType, setPartyType] = useState<'Retailer' | 'Dealer'>('Retailer');
  const [outstandingType, setOutstandingType] = useState<'To Pay' | 'To Receive'>('To Receive');
  const [outstandingAmount, setOutstandingAmount] = useState('');
  const [selectedFosIds, setSelectedFosIds] = useState<number[]>([]);

  // Remote data
  const [states, setStates] = useState<StateOption[]>([]);
  const [fosList, setFosList] = useState<Array<{ userId: number; userName: string }>>([]);
  const [isFetchingGst, setIsFetchingGst] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pickers modal states
  const [isStatePickerOpen, setIsStatePickerOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [isFosPickerOpen, setIsFosPickerOpen] = useState(false);
  const [fosSearch, setFosSearch] = useState('');

  // Load initial dropdowns
  useEffect(() => {
    if (!visible) return;

    fetchStateListApi().then((data) => {
      if (data && data.length > 0) {
        setStates(data);
      }
    });

    fetchAllFosApi().then((data) => {
      if (data && data.length > 0) {
        setFosList(data);
      }
    });
  }, [visible]);

  // Sync state on open
  useEffect(() => {
    if (!visible) return;

    if (item) {
      const type = (item.record_type === 'Seller' ? 'Seller' : 'Buyer') as 'Buyer' | 'Seller';
      setRecordType(type);
      setGstNumber(item.gstin_no || '');
      setPartyName(item.party_name || '');
      setPhone(item.party_phone || '');
      setEmail(item.email || '');
      setPlaceOfSupply(item.place_of_supply || '08 - Rajasthan');
      setAddress(item.party_address || '');
      const ship = item.shipping_address || item.party_address || '';
      setShippingAddress(ship);
      setSameAsBilling(ship === item.party_address);
      setPartyType((item.party_type === 'Dealer' ? 'Dealer' : 'Retailer') as 'Retailer' | 'Dealer');
      setOutstandingType('To Receive');
      setOutstandingAmount(item.outstanding_amount ? String(item.outstanding_amount) : '');

      const fosIds = (item.fos_data || [])
        .filter((f) => f.is_checked)
        .map((f) => f.userId);
      setSelectedFosIds(fosIds);
    } else {
      setRecordType(initialType);
      setGstNumber('');
      setPartyName('');
      setPhone('');
      setEmail('');
      setPlaceOfSupply('08 - Rajasthan');
      setAddress('');
      setSameAsBilling(true);
      setShippingAddress('');
      setPartyType('Retailer');
      setOutstandingType(initialType === 'Seller' ? 'To Pay' : 'To Receive');
      setOutstandingAmount('');
      setSelectedFosIds([]);
    }
  }, [visible, item, initialType]);

  // Handle GST auto-fill
  const handleFetchGst = async () => {
    const cleanGst = gstNumber.trim().toUpperCase();
    if (!cleanGst || cleanGst.length !== 15) {
      Alert.alert('Invalid GST', 'Please enter a valid 15-digit GST number first.');
      return;
    }

    try {
      setIsFetchingGst(true);
      const data = await fetchGstDataApi(cleanGst);
      if (data) {
        if (data.legal_name || data.trade_name || data.name) {
          setPartyName(data.trade_name || data.legal_name || data.name);
        }
        if (data.address || data.principal_address) {
          const addr = data.address || data.principal_address;
          setAddress(addr);
          if (sameAsBilling) setShippingAddress(addr);
        }
        if (data.state_code || data.state) {
          const found = states.find(
            (s) =>
              s.state_code === data.state_code ||
              s.state_name?.toLowerCase().includes((data.state || '').toLowerCase())
          );
          if (found) {
            setPlaceOfSupply(found.state_name);
          }
        }
        Alert.alert('GST Verified', 'Party details auto-populated from GST successfully.');
      } else {
        Alert.alert('Notice', 'No GST record found for this number.');
      }
    } catch (err: any) {
      Alert.alert('GST Lookup Error', err?.message || 'Could not verify GST at this time.');
    } finally {
      setIsFetchingGst(false);
    }
  };

  // Sync shipping address with billing if checkbox is checked
  const handleAddressChange = (text: string) => {
    setAddress(text);
    if (sameAsBilling) {
      setShippingAddress(text);
    }
  };

  const handleSameAsBillingToggle = () => {
    const nextVal = !sameAsBilling;
    setSameAsBilling(nextVal);
    if (nextVal) {
      setShippingAddress(address);
    }
  };

  // Filtered states for state picker
  const filteredStates = useMemo(() => {
    if (!stateSearch.trim()) return states;
    const q = stateSearch.trim().toLowerCase();
    return states.filter((s) => s.state_name.toLowerCase().includes(q));
  }, [states, stateSearch]);

  // Filtered FOS for FOS picker
  const filteredFos = useMemo(() => {
    if (!fosSearch.trim()) return fosList;
    const q = fosSearch.trim().toLowerCase();
    return fosList.filter((f) => f.userName.toLowerCase().includes(q));
  }, [fosList, fosSearch]);

  // Submit Handler
  const handleSubmit = async () => {
    if (!partyName.trim()) {
      Alert.alert('Validation Error', 'Party Name is required.');
      return;
    }

    if (!placeOfSupply.trim()) {
      Alert.alert('Validation Error', 'Place of supply is required.');
      return;
    }

    if (phone.trim() && phone.trim().length < 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      setIsSubmitting(true);
      const parsedAmount = parseFloat(outstandingAmount.trim()) || 0;

      if (isEdit && item) {
        await editBuyerSellerApi({
          party_id: item.party_id,
          record_type: recordType,
          name: partyName.trim(),
          phone_number: phone.trim(),
          email: email.trim(),
          gst_number: gstNumber.trim().toUpperCase(),
          state: placeOfSupply,
          address: address.trim(),
          shipping_address: sameAsBilling ? address.trim() : shippingAddress.trim(),
          party_type: recordType === 'Seller' ? partyType : undefined,
          opening_balance: parsedAmount,
          opening_balance_type: outstandingType,
          fos_ids: recordType === 'Seller' ? selectedFosIds : undefined,
        });
        Alert.alert('Success', `${recordType} updated successfully!`);
      } else {
        await addBuyerSellerApi({
          record_type: recordType,
          name: partyName.trim(),
          phone_number: phone.trim(),
          email: email.trim(),
          gst_number: gstNumber.trim().toUpperCase(),
          state: placeOfSupply,
          address: address.trim(),
          shipping_address: sameAsBilling ? address.trim() : shippingAddress.trim(),
          party_type: recordType === 'Seller' ? partyType : undefined,
          opening_balance: parsedAmount,
          opening_balance_type: outstandingType,
          fos_ids: recordType === 'Seller' ? selectedFosIds : undefined,
        });
        Alert.alert('Success', `${recordType} created successfully!`);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save party details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Top Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Sheet Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>
              {isEdit ? `Edit ${recordType}` : `Add ${recordType}`}
            </Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Feather name="x" size={20} color="#5A6B87" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Toggle Switch: Buyer vs Seller */}
            {!isEdit && (
              <View style={styles.typeToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeToggleBtn,
                    recordType === 'Buyer' && styles.typeToggleBtnActive,
                  ]}
                  onPress={() => {
                    setRecordType('Buyer');
                    setOutstandingType('To Receive');
                  }}
                  activeOpacity={0.8}
                >
                  {recordType === 'Buyer' && (
                    <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  )}
                  <Text
                    style={[
                      styles.typeToggleText,
                      recordType === 'Buyer' && styles.typeToggleTextActive,
                    ]}
                  >
                    Buyer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeToggleBtn,
                    recordType === 'Seller' && styles.typeToggleBtnActive,
                  ]}
                  onPress={() => {
                    setRecordType('Seller');
                    setOutstandingType('To Pay');
                  }}
                  activeOpacity={0.8}
                >
                  {recordType === 'Seller' && (
                    <Feather name="check" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  )}
                  <Text
                    style={[
                      styles.typeToggleText,
                      recordType === 'Seller' && styles.typeToggleTextActive,
                    ]}
                  >
                    Seller
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* GST Number Field with Auto-verify */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.label}>GST Number</Text>
                {gstNumber.trim().length === 15 && (
                  <TouchableOpacity
                    style={styles.verifyBadge}
                    onPress={handleFetchGst}
                    disabled={isFetchingGst}
                  >
                    {isFetchingGst ? (
                      <ActivityIndicator size="small" color="#0047AB" />
                    ) : (
                      <>
                        <Feather name="zap" size={12} color="#0047AB" />
                        <Text style={styles.verifyBadgeText}>Auto-Fill</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter 15-digit GST number"
                placeholderTextColor="#94A3B8"
                value={gstNumber}
                onChangeText={(t) => setGstNumber(t.toUpperCase())}
                maxLength={15}
                autoCapitalize="characters"
              />
            </View>

            {/* Party Name Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Party Name <Text style={styles.reqStar}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Enter party name"
                placeholderTextColor="#94A3B8"
                value={partyName}
                onChangeText={setPartyName}
              />
            </View>

            {/* Phone & Email Row */}
            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit number"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Place of Supply Dropdown */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Place Of Supply <Text style={styles.reqStar}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectorInput}
                onPress={() => setIsStatePickerOpen(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.selectorText}>{placeOfSupply || 'Select state'}</Text>
                <Feather name="chevron-down" size={18} color="#5A6B87" />
              </TouchableOpacity>
            </View>

            {/* Billing Address Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {recordType === 'Seller' ? 'Billing Address' : 'Address'}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={recordType === 'Seller' ? 'Enter billing address' : 'Enter address'}
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={handleAddressChange}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Same as billing address checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={handleSameAsBillingToggle}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, sameAsBilling && styles.checkboxBoxChecked]}>
                {sameAsBilling && <Feather name="check" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxLabel}>Same as billing address</Text>
            </TouchableOpacity>

            {/* Shipping Address */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Shipping Address <Text style={styles.reqStar}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  sameAsBilling && styles.inputDisabled,
                ]}
                placeholder="Enter shipping address"
                placeholderTextColor="#94A3B8"
                value={sameAsBilling ? address : shippingAddress}
                onChangeText={setShippingAddress}
                editable={!sameAsBilling}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Party Type Radio (Retailer vs Dealer) for Seller */}
            {recordType === 'Seller' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Party Type <Text style={styles.reqStar}>*</Text>
                </Text>
                <View style={styles.radioRow}>
                  <TouchableOpacity
                    style={[
                      styles.radioPill,
                      partyType === 'Retailer' && styles.radioPillActive,
                    ]}
                    onPress={() => setPartyType('Retailer')}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.radioDotOuter,
                        partyType === 'Retailer' && styles.radioDotOuterActive,
                      ]}
                    >
                      {partyType === 'Retailer' && <View style={styles.radioDotInner} />}
                    </View>
                    <Text
                      style={[
                        styles.radioPillText,
                        partyType === 'Retailer' && styles.radioPillTextActive,
                      ]}
                    >
                      Retailer
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.radioPill,
                      partyType === 'Dealer' && styles.radioPillActive,
                    ]}
                    onPress={() => setPartyType('Dealer')}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.radioDotOuter,
                        partyType === 'Dealer' && styles.radioDotOuterActive,
                      ]}
                    >
                      {partyType === 'Dealer' && <View style={styles.radioDotInner} />}
                    </View>
                    <Text
                      style={[
                        styles.radioPillText,
                        partyType === 'Dealer' && styles.radioPillTextActive,
                      ]}
                    >
                      Dealer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Outstanding Type (To Pay vs To Receive) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Outstanding Type</Text>
              <View style={styles.radioRow}>
                <TouchableOpacity
                  style={[
                    styles.radioPill,
                    outstandingType === 'To Pay' && styles.radioPillActive,
                  ]}
                  onPress={() => setOutstandingType('To Pay')}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.radioDotOuter,
                      outstandingType === 'To Pay' && styles.radioDotOuterActive,
                    ]}
                  >
                    {outstandingType === 'To Pay' && <View style={styles.radioDotInner} />}
                  </View>
                  <Text
                    style={[
                      styles.radioPillText,
                      outstandingType === 'To Pay' && styles.radioPillTextActive,
                    ]}
                  >
                    To Pay
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.radioPill,
                    outstandingType === 'To Receive' && styles.radioPillActive,
                  ]}
                  onPress={() => setOutstandingType('To Receive')}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.radioDotOuter,
                      outstandingType === 'To Receive' && styles.radioDotOuterActive,
                    ]}
                  >
                    {outstandingType === 'To Receive' && <View style={styles.radioDotInner} />}
                  </View>
                  <Text
                    style={[
                      styles.radioPillText,
                      outstandingType === 'To Receive' && styles.radioPillTextActive,
                    ]}
                  >
                    To Receive
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Outstanding Amount */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Outstanding Amount</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount"
                placeholderTextColor="#94A3B8"
                value={outstandingAmount}
                onChangeText={(t) => setOutstandingAmount(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
              />
            </View>

            {/* Select Sales Executive (For Seller) */}
            {recordType === 'Seller' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Select Sales Executive</Text>
                <TouchableOpacity
                  style={styles.selectorInput}
                  onPress={() => setIsFosPickerOpen(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.chipsWrap}>
                    {selectedFosIds.length === 0 ? (
                      <Text style={styles.selectorPlaceholder}>Select sales executive</Text>
                    ) : (
                      selectedFosIds.map((id) => {
                        const fos = fosList.find((f) => f.userId === id);
                        return (
                          <View key={id} style={styles.fosChip}>
                            <Text style={styles.fosChipText}>{fos?.userName || `FOS #${id}`}</Text>
                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                setSelectedFosIds((prev) => prev.filter((i) => i !== id));
                              }}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Feather name="x" size={12} color="#0047AB" />
                            </TouchableOpacity>
                          </View>
                        );
                      })
                    )}
                  </View>
                  <Feather name="chevron-down" size={18} color="#5A6B87" />
                </TouchableOpacity>
              </View>
            )}

            {/* Bottom Buttons: Cancel & Submit */}
            <View style={styles.bottomBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* State Picker Modal */}
        <Modal
          visible={isStatePickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsStatePickerOpen(false)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Place Of Supply</Text>
                <TouchableOpacity
                  onPress={() => setIsStatePickerOpen(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={20} color="#5A6B87" />
                </TouchableOpacity>
              </View>

              <View style={styles.pickerSearchBox}>
                <Feather name="search" size={16} color="#94A3B8" />
                <TextInput
                  style={styles.pickerSearchInput}
                  placeholder="Search state..."
                  placeholderTextColor="#94A3B8"
                  value={stateSearch}
                  onChangeText={setStateSearch}
                />
              </View>

              <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
                {filteredStates.map((s) => {
                  const isSelected = placeOfSupply === s.state_name;
                  return (
                    <TouchableOpacity
                      key={s.state_id}
                      style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                      onPress={() => {
                        setPlaceOfSupply(s.state_name);
                        setIsStatePickerOpen(false);
                        setStateSearch('');
                      }}
                    >
                      <Text
                        style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}
                      >
                        {s.state_name}
                      </Text>
                      {isSelected && <Feather name="check" size={16} color="#0047AB" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* FOS Multi-Picker Modal */}
        <Modal
          visible={isFosPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsFosPickerOpen(false)}
        >
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerCard}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Sales Executives</Text>
                <TouchableOpacity
                  onPress={() => setIsFosPickerOpen(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="x" size={20} color="#5A6B87" />
                </TouchableOpacity>
              </View>

              <View style={styles.pickerSearchBox}>
                <Feather name="search" size={16} color="#94A3B8" />
                <TextInput
                  style={styles.pickerSearchInput}
                  placeholder="Search executive..."
                  placeholderTextColor="#94A3B8"
                  value={fosSearch}
                  onChangeText={setFosSearch}
                />
              </View>

              <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
                {filteredFos.length === 0 ? (
                  <View style={{ padding: 24, alignItems: 'center' }}>
                    <Text style={{ color: '#94A3B8', fontSize: 14 }}>No sales executives found</Text>
                  </View>
                ) : (
                  filteredFos.map((f) => {
                    const isSelected = selectedFosIds.includes(f.userId);
                    return (
                      <TouchableOpacity
                        key={f.userId}
                        style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedFosIds((prev) => prev.filter((id) => id !== f.userId));
                          } else {
                            setSelectedFosIds((prev) => [...prev, f.userId]);
                          }
                        }}
                      >
                        <Text
                          style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}
                        >
                          {f.userName}
                        </Text>
                        <View
                          style={[
                            styles.checkboxBox,
                            isSelected && styles.checkboxBoxChecked,
                            { width: 20, height: 20, borderRadius: 6 },
                          ]}
                        >
                          {isSelected && <Feather name="check" size={12} color="#FFFFFF" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              <TouchableOpacity
                style={[styles.submitBtn, { marginTop: 14 }]}
                onPress={() => setIsFosPickerOpen(false)}
              >
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '90%',
    paddingTop: 10,
    elevation: 24,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#DFE7F2',
  },
  typeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeToggleBtnActive: {
    backgroundColor: '#0047AB',
    elevation: 2,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  typeToggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5A6B87',
  },
  typeToggleTextActive: {
    color: '#FFFFFF',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  reqStar: {
    color: '#DC2626',
    fontWeight: '800',
  },
  verifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  verifyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0047AB',
  },
  input: {
    height: 46,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '500',
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  textArea: {
    height: 74,
    paddingTop: 10,
    paddingBottom: 10,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  selectorInput: {
    minHeight: 46,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 14,
    color: '#0E204E',
    fontWeight: '600',
    flex: 1,
  },
  selectorPlaceholder: {
    fontSize: 14,
    color: '#94A3B8',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  fosChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  fosChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0047AB',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    borderColor: '#0047AB',
    backgroundColor: '#0047AB',
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0E204E',
  },
  radioRow: {
    flexDirection: 'row',
    gap: 12,
  },
  radioPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  radioPillActive: {
    borderColor: '#0047AB',
    backgroundColor: '#EFF6FF',
  },
  radioDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDotOuterActive: {
    borderColor: '#0047AB',
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0047AB',
  },
  radioPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5A6B87',
  },
  radioPillTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
  bottomBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5A6B87',
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#0047AB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    elevation: 16,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0E204E',
  },
  pickerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFD',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  pickerSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0E204E',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerItemActive: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0E204E',
  },
  pickerItemTextActive: {
    color: '#0047AB',
    fontWeight: '700',
  },
});
