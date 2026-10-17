import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Shapes } from '@/theme';

export interface ImageUploadTileProps {
  label: string;
  dimensions: string;
  iconName: keyof typeof Feather.glyphMap;
  imageUri?: string | null;
  onImageSelected: (uri: string | null) => void;
  disabled?: boolean;
}

export const ImageUploadTile: React.FC<ImageUploadTileProps> = ({
  label,
  dimensions,
  iconName,
  imageUri,
  onImageSelected,
  disabled = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handlePickImage = async () => {
    if (disabled) return;
    setUploadError(null);

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Camera roll access is required to upload images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square crop as required
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];

        // Simulate multipart upload progress
        setIsUploading(true);
        setUploadProgress(25);

        await new Promise((r) => setTimeout(r, 200));
        setUploadProgress(65);

        await new Promise((r) => setTimeout(r, 250));
        setUploadProgress(100);

        setIsUploading(false);
        onImageSelected(selectedAsset.uri);
      }
    } catch (err: unknown) {
      setIsUploading(false);
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const handleRemoveImage = () => {
    if (disabled) return;
    Alert.alert(
      'Remove Image',
      `Are you sure you want to remove the ${label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onImageSelected(null),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Upload Tile Box */}
      <View style={styles.tileWrapper}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />

            {/* Overlay Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handlePickImage}
                disabled={disabled || isUploading}
                accessibilityLabel={`Replace ${label}`}
                accessibilityRole="button"
              >
                <Feather name="refresh-cw" size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Replace</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.removeBtn]}
                onPress={handleRemoveImage}
                disabled={disabled || isUploading}
                accessibilityLabel={`Remove ${label}`}
                accessibilityRole="button"
              >
                <Feather name="trash-2" size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.dashedBox,
              uploadError ? styles.dashedBoxError : null,
              disabled && styles.dashedBoxDisabled,
            ]}
            onPress={handlePickImage}
            activeOpacity={0.7}
            disabled={disabled || isUploading}
            accessibilityLabel={`Upload ${label}`}
            accessibilityRole="button"
          >
            {isUploading ? (
              <View style={styles.uploadingBox}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.progressText}>Uploading {uploadProgress}%</Text>
              </View>
            ) : uploadError ? (
              <View style={styles.errorBox}>
                <Feather name="alert-triangle" size={24} color={Colors.error} />
                <Text style={styles.errorText}>Failed</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={handlePickImage}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.placeholderBox}>
                <View style={styles.iconChip}>
                  <Feather name={iconName} size={22} color={Colors.primary} />
                </View>
                <Text style={styles.tapText}>Tap to upload</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Label and Dimension footer */}
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.dimensions}>{dimensions}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  tileWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  dashedBox: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.inputBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.uploadBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  dashedBoxError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorBg,
  },
  dashedBoxDisabled: {
    opacity: 0.6,
  },
  placeholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EEEDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tapText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primary,
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  actionRow: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(42, 36, 112, 0.85)',
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeBtn: {
    backgroundColor: 'rgba(176, 30, 37, 0.85)',
  },
  actionBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  uploadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  progressText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 11,
    color: Colors.primary,
  },
  errorBox: {
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 11,
    color: Colors.error,
  },
  retryBtn: {
    marginTop: 2,
    backgroundColor: Colors.error,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  retryText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'center',
  },
  dimensions: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
