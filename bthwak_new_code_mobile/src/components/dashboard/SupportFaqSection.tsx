import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Theme } from '@/theme';
import { FaqItem } from '@/api/dashboard';

interface SupportFaqSectionProps {
  faqs: FaqItem[];
  isLoadingFaqs: boolean;
}

export const SupportFaqSection: React.FC<SupportFaqSectionProps> = ({
  faqs,
  isLoadingFaqs,
}) => {
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);

  const toggleFaq = (id: number) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <View style={styles.container}>
      {/* SUPPORT BUTTONS */}
      <View style={styles.card}>
        <View style={styles.header}>
          <Feather name="headphones" size={18} color={Theme.colors.primary} />
          <Text style={styles.title}>Support & Assistance</Text>
        </View>

        <View style={styles.supportGrid}>
          {/* WhatsApp */}
          <TouchableOpacity
            style={[styles.supportBtn, { backgroundColor: '#ECFDF5' }]}
            onPress={() => handleOpenLink('https://api.whatsapp.com/send?phone=7627041256')}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#10B981" />
            <Text style={[styles.supportBtnText, { color: '#047857' }]}>WhatsApp</Text>
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={[styles.supportBtn, { backgroundColor: '#EFF6FF' }]}
            onPress={() => handleOpenLink('mailto:dinesh.gautam@bthawk.com')}
            activeOpacity={0.8}
          >
            <Feather name="mail" size={18} color="#2563EB" />
            <Text style={[styles.supportBtnText, { color: '#1D4ED8' }]}>Email Us</Text>
          </TouchableOpacity>

          {/* Video Tutorial */}
          <TouchableOpacity
            style={[styles.supportBtn, { backgroundColor: '#FEF2F2' }]}
            onPress={() =>
              handleOpenLink('https://youtube.com/@bthawk?si=UARy2rda68-r3mmy')
            }
            activeOpacity={0.8}
          >
            <Feather name="youtube" size={18} color="#DC2626" />
            <Text style={[styles.supportBtnText, { color: '#B91C1C' }]}>Tutorials</Text>
          </TouchableOpacity>

          {/* Call Support */}
          <TouchableOpacity
            style={[styles.supportBtn, { backgroundColor: '#F5F3FF' }]}
            onPress={() => handleOpenLink('tel:+917627041256')}
            activeOpacity={0.8}
          >
            <Feather name="phone-call" size={18} color="#7C3AED" />
            <Text style={[styles.supportBtnText, { color: '#6D28D9' }]}>Call Us</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FAQs ACCORDION */}
      <View style={styles.card}>
        <View style={styles.header}>
          <Feather name="help-circle" size={18} color={Theme.colors.primary} />
          <Text style={styles.title}>Frequently Asked Questions</Text>
        </View>

        {isLoadingFaqs ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="small" color={Theme.colors.primary} />
            <Text style={styles.loaderText}>Loading FAQs...</Text>
          </View>
        ) : faqs.length === 0 ? (
          <Text style={styles.emptyFaqText}>No FAQs available at the moment.</Text>
        ) : (
          <View style={styles.faqList}>
            {faqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <View key={faq.id} style={styles.faqItem}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() => toggleFaq(faq.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Feather
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={Theme.colors.textSecondary}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <Text style={styles.faqAnswer}>{faq.answer_detail}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: Theme.spacing.xl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.typography.sizes.sm + 1,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  supportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  supportBtn: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Theme.borderRadius.md,
  },
  supportBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loaderText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  emptyFaqText: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  faqList: {
    gap: 8,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    lineHeight: 18,
  },
  faqAnswer: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
});
