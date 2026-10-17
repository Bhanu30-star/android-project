import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Shapes, Shadows } from '@/theme';
import { FaqItem } from '@/api/dashboard';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FaqAccordionProps {
  faqs?: FaqItem[];
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 1,
    question: 'How is your data secure with BTHAWK?',
    answer_detail:
      'All your financial records, distributor invoices, and ledger information are encrypted in transit (TLS 1.3) and at rest (AES-256) on cloud infrastructure compliant with Indian data localization norms.',
  },
  {
    id: 2,
    question: 'What is the use of E-Invoice?',
    answer_detail:
      'E-Invoicing ensures automated validation and generation of Invoice Reference Numbers (IRN) directly from the GST Portal, eliminating mismatches and expediting input tax credit verification.',
  },
  {
    id: 3,
    question: 'Is E-Way bill possible in BTHAWK?',
    answer_detail:
      'Yes! BTHAWK provides one-tap automated E-Way bill generation linked directly with your outbound tax invoices for consignment values exceeding statutory thresholds.',
  },
];

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ faqs }) => {
  const items = faqs && faqs.length > 0 ? faqs : DEFAULT_FAQS;
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={styles.card}>
      {items.map((item, index) => {
        const isExpanded = expandedId === item.id;
        const isLast = index === items.length - 1;

        return (
          <View key={item.id}>
            <TouchableOpacity
              style={styles.headerRow}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.7}
              accessibilityLabel={`FAQ: ${item.question}`}
              accessibilityRole="button"
            >
              <Text style={styles.questionText}>{item.question}</Text>
              <Feather
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.answerContainer}>
                <Text style={styles.answerText}>{item.answer_detail}</Text>
              </View>
            )}

            {!isLast && <View style={styles.divider} />}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Shapes.cardRadius,
    paddingHorizontal: Shapes.cardPadding,
    paddingVertical: 6,
    marginBottom: Shapes.verticalGap,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    minHeight: Shapes.buttonMinHeight,
  },
  questionText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    paddingRight: 12,
  },
  answerContainer: {
    paddingBottom: 14,
    paddingTop: 2,
  },
  answerText: {
    ...Typography.bodySemiBold,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
});
