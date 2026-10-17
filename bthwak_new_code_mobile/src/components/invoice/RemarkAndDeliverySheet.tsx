import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Shapes, Shadows } from '@/theme/tokens';

interface RemarkAndDeliverySheetProps {
  visible: boolean;
  onClose: () => void;
  shippingAddress: string;
  purchaseOrderNo: string;
  brokerNo: string;
  docketNo: string;
  courierAgency: string;
  courierDate: string;
  remark: string;
  onSave: (data: {
    shippingAddress: string;
    purchaseOrderNo: string;
    brokerNo: string;
    docketNo: string;
    courierAgency: string;
    courierDate: string;
    remark: string;
  }) => void;
}

export const RemarkAndDeliverySheet: React.FC<RemarkAndDeliverySheetProps> = ({
  visible,
  onClose,
  shippingAddress: initialShipping,
  purchaseOrderNo: initialPO,
  brokerNo: initialBroker,
  docketNo: initialDocket,
  courierAgency: initialCourier,
  courierDate: initialCourierDate,
  remark: initialRemark,
  onSave,
}) => {
  const [shippingAddress, setShippingAddress] = useState(initialShipping);
  const [purchaseOrderNo, setPurchaseOrderNo] = useState(initialPO);
  const [brokerNo, setBrokerNo] = useState(initialBroker);
  const [docketNo, setDocketNo] = useState(initialDocket);
  const [courierAgency, setCourierAgency] = useState(initialCourier);
  const [courierDate, setCourierDate] = useState(initialCourierDate);
  const [remark, setRemark] = useState(initialRemark);

  const handleSave = () => {
    onSave({
      shippingAddress,
      purchaseOrderNo,
      brokerNo,
      docketNo,
      courierAgency,
      courierDate,
      remark,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Delivery & Additional Info</Text>
              <Text style={styles.subtitle}>Shipping details, PO and remark</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Shipping Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter destination delivery address"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={2}
                value={shippingAddress}
                onChangeText={setShippingAddress}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>PO Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="PO #"
                  placeholderTextColor={Colors.textSecondary}
                  value={purchaseOrderNo}
                  onChangeText={setPurchaseOrderNo}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Broker / Agent No</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Broker #"
                  placeholderTextColor={Colors.textSecondary}
                  value={brokerNo}
                  onChangeText={setBrokerNo}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Docket No</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Docket #"
                  placeholderTextColor={Colors.textSecondary}
                  value={docketNo}
                  onChangeText={setDocketNo}
                />
              </View>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Courier Agency</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Agency name"
                  placeholderTextColor={Colors.textSecondary}
                  value={courierAgency}
                  onChangeText={setCourierAgency}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Courier Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textSecondary}
                value={courierDate}
                onChangeText={setCourierDate}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Invoice Remark</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes or instructions for this invoice"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
                value={remark}
                onChangeText={setRemark}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Save Details</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 24, 64, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 28,
    ...Shadows.card,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.tabBorder,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Typography.small.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  halfCol: {
    flex: 1,
  },
  label: {
    fontFamily: Typography.statLabel.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Shapes.radiusMedium,
    height: 46,
    paddingHorizontal: 12,
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.tabBorder,
  },
  textArea: {
    height: 64,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: Shapes.radiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    ...Shadows.card,
  },
  saveBtnText: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
