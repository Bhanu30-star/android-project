import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '@/theme';

interface SectionLabelProps {
  label: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ label }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{label.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 18,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  text: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: 11,
    letterSpacing: 1,
    color: '#5E5B85',
  },
});
