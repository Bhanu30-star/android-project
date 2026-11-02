import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { InvoiceRecord } from '@/api/invoiceList';

interface FseLocationModalProps {
  visible: boolean;
  invoice: InvoiceRecord | null;
  onClose: () => void;
}

export const FseLocationModal: React.FC<FseLocationModalProps> = ({
  visible,
  invoice,
  onClose,
}) => {
  if (!invoice) return null;

  const lat = invoice.latitude ? String(invoice.latitude) : null;
  const lng = invoice.longitude ? String(invoice.longitude) : null;
  const hasLocation = Boolean(lat && lng && lat !== '0' && lng !== '0');

  const openInMaps = () => {
    if (!hasLocation) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
      default: `https://maps.google.com/?q=${lat},${lng}`,
    });
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Feather name="map-pin" size={24} color="#0047AB" />
            </View>
            <Text style={styles.title}>FSE Mapping Location</Text>
            <Text style={styles.billNo}>
              {invoice.transaction_bill_number || `INV-${invoice.transaction_id}`}
            </Text>
          </View>

          <View style={styles.body}>
            <View style={styles.row}>
              <Text style={styles.label}>Sales Executive</Text>
              <Text style={styles.value}>{invoice.user_name || 'Admin / Self'}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Retailer</Text>
              <Text style={styles.value}>{invoice.party_name}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Date Time</Text>
              <Text style={styles.value}>
                {invoice.bill_date_time || invoice.bill_date || 'Recent'}
              </Text>
            </View>

            <View style={styles.divider} />

            {hasLocation ? (
              <View style={styles.coordsBox}>
                <Text style={styles.coordsLabel}>Recorded GPS Coordinates</Text>
                <Text style={styles.coordsText}>
                  {lat}, {lng}
                </Text>
                <TouchableOpacity style={styles.mapsBtn} onPress={openInMaps} activeOpacity={0.8}>
                  <Feather name="external-link" size={15} color="#FFFFFF" />
                  <Text style={styles.mapsBtnText}>Open in Google Maps</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noLocationBox}>
                <Feather name="navigation" size={20} color="#5A6B87" />
                <Text style={styles.noLocationText}>
                  No GPS coordinates were captured at the time of invoice creation.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 32, 78, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 20,
    elevation: 8,
    shadowColor: '#0047AB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0E204E',
  },
  billNo: {
    fontSize: 13,
    color: '#0047AB',
    fontWeight: '700',
    marginTop: 2,
  },
  body: {
    gap: 10,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    color: '#5A6B87',
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E204E',
  },
  divider: {
    height: 1,
    backgroundColor: '#DFE7F2',
    marginVertical: 4,
  },
  coordsBox: {
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  coordsLabel: {
    fontSize: 11,
    color: '#5A6B87',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  coordsText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0047AB',
  },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0047AB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  mapsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noLocationBox: {
    padding: 14,
    backgroundColor: '#F8FAFD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE7F2',
    alignItems: 'center',
    gap: 8,
  },
  noLocationText: {
    fontSize: 12,
    color: '#5A6B87',
    textAlign: 'center',
    lineHeight: 18,
  },
  closeBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#DFE7F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5A6B87',
  },
});
