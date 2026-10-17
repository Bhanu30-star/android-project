import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { invoiceService } from '@/api/invoiceService';
import { Colors, Typography, Shapes, Shadows } from '@/theme/tokens';

interface SoldBySelectSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (user: { id: string; name: string }) => void;
  selectedId: string;
}

export const SoldBySelectSheet: React.FC<SoldBySelectSheetProps> = ({
  visible,
  onClose,
  onSelect,
  selectedId,
}) => {
  const { data: fscUsers = [] } = useQuery({
    queryKey: ['fsc-users'],
    queryFn: () => invoiceService.fetchFscList(),
    enabled: visible,
  });

  const options: { id: string; name: string }[] = [
    { id: 'admin', name: 'Admin' },
    ...fscUsers.map((u) => ({
      id: String(u.fsc_id),
      name: u.fsc_name,
    })),
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Sold by</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;
              return (
                <TouchableOpacity
                  style={[styles.item, isSelected && styles.selectedItem]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.left}>
                    <View style={styles.userIcon}>
                      <Feather name="user" size={16} color={Colors.primary} />
                    </View>
                    <Text style={styles.name}>{item.name}</Text>
                  </View>
                  {isSelected && <Feather name="check" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              );
            }}
          />
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
    paddingBottom: 30,
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  selectedItem: {
    backgroundColor: '#EEEDFF',
    borderRadius: Shapes.radiusMedium,
    paddingHorizontal: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8E6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  name: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
});
