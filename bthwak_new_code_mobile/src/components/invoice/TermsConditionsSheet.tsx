import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Shapes, Shadows } from '@/theme/tokens';

interface TermsConditionsSheetProps {
  visible: boolean;
  onClose: () => void;
  partyName: string;
}

export const TermsConditionsSheet: React.FC<TermsConditionsSheetProps> = ({
  visible,
  onClose,
  partyName,
}) => {
  const displayParty = partyName || 'the Customer';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Terms & Conditions</Text>
              <Text style={styles.subtitle}>Standard Sale & Invoicing Agreement</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.paragraph}>
              <Text style={styles.ruleNumber}>1.</Text>
              <Text style={styles.ruleText}>
                Goods once sold to <Text style={styles.highlight}>{displayParty}</Text> will not be taken back or exchanged unless approved by the management in writing.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.ruleNumber}>2.</Text>
              <Text style={styles.ruleText}>
                Interest @ 18% per annum will be charged if the bill is not paid within the agreed credit terms by <Text style={styles.highlight}>{displayParty}</Text>.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.ruleNumber}>3.</Text>
              <Text style={styles.ruleText}>
                All disputes are subject to local jurisdiction only.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.ruleNumber}>4.</Text>
              <Text style={styles.ruleText}>
                Our responsibility ceases the moment goods leave our premises or are handed over to the courier/transporter.
              </Text>
            </View>

            <View style={styles.paragraph}>
              <Text style={styles.ruleNumber}>5.</Text>
              <Text style={styles.ruleText}>
                Any discrepancy regarding invoice quantities or pricing must be notified within 24 hours of receipt.
              </Text>
            </View>

            <TouchableOpacity style={styles.agreeBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.agreeBtnText}>I Understand & Accept</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
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
    maxHeight: '75%',
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
  paragraph: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  ruleNumber: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    width: 24,
  },
  ruleText: {
    flex: 1,
    fontFamily: Typography.body.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textBody,
    lineHeight: 19,
  },
  highlight: {
    fontWeight: '800',
    color: Colors.primaryDeep,
  },
  agreeBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: Shapes.radiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  agreeBtnText: {
    fontFamily: Typography.sectionTitle.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
