import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Shapes } from '@/theme';

interface SupportCardProps {
  onPressBookMeeting?: () => void;
  onPressEmail?: () => void;
  onPressTutorial?: () => void;
  onPressWhatsapp?: () => void;
  onPressChatAi?: () => void;
}

export const SupportCard: React.FC<SupportCardProps> = ({
  onPressBookMeeting,
  onPressEmail,
  onPressTutorial,
  onPressWhatsapp,
  onPressChatAi,
}) => {
  const handleDefaultEmail = () => {
    Linking.openURL('mailto:support@bthawk.com').catch(() => {
      Alert.alert('Email', 'Reach out to support@bthawk.com');
    });
  };

  const handleDefaultWhatsapp = () => {
    Linking.openURL('https://wa.me/919999999999').catch(() => {
      Alert.alert('WhatsApp', 'WhatsApp support connected.');
    });
  };

  return (
    <View style={styles.container}>
      {/* 2x2 GRID */}
      <View style={styles.grid}>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.gridBtn}
            onPress={onPressBookMeeting || (() => Alert.alert('Book Meeting', 'Schedule a consultation with our BTHAWK accounting expert.'))}
            activeOpacity={0.8}
            accessibilityLabel="Book meeting"
            accessibilityRole="button"
          >
            <Feather name="calendar" size={17} color={Colors.support.meetingIcon} />
            <Text style={styles.btnText}>Book meeting</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridBtn}
            onPress={onPressEmail || handleDefaultEmail}
            activeOpacity={0.8}
            accessibilityLabel="Email us"
            accessibilityRole="button"
          >
            <Feather name="mail" size={17} color={Colors.support.emailIcon} />
            <Text style={styles.btnText}>Email us</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.gridBtn}
            onPress={onPressTutorial || (() => Linking.openURL('https://youtube.com/@bthawk'))}
            activeOpacity={0.8}
            accessibilityLabel="Video tutorial"
            accessibilityRole="button"
          >
            <Feather name="video" size={17} color={Colors.support.videoIcon} />
            <Text style={styles.btnText}>Video tutorial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridBtn}
            onPress={onPressWhatsapp || handleDefaultWhatsapp}
            activeOpacity={0.8}
            accessibilityLabel="WhatsApp support"
            accessibilityRole="button"
          >
            <Feather name="message-circle" size={17} color={Colors.support.whatsappIcon} />
            <Text style={styles.btnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FULL WIDTH CHAT BUTTON */}
      <TouchableOpacity
        style={styles.chatBtn}
        onPress={onPressChatAi || (() => Alert.alert('BTHAWK+ Assistant', 'Connecting to your automated compliance and billing assistant...'))}
        activeOpacity={0.85}
        accessibilityLabel="Chat with BTHAWK+"
        accessibilityRole="button"
      >
        <Feather name="message-square" size={18} color={Colors.white} />
        <Text style={styles.chatBtnText}>Chat with BTHAWK+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Shapes.verticalGap,
  },
  grid: {
    gap: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  gridBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F4FF',
    borderRadius: 14,
    height: Shapes.buttonMinHeight,
    paddingHorizontal: 12,
  },
  btnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 13,
    color: Colors.text,
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 16,
  },
  chatBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: Colors.white,
  },
});
