import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export interface MobileDeviceInfo {
  latitude: string;
  longitude: string;
  carrier_name: string;
  ip_address: string;
  imei_no: string;
  device_id: string;
  app_version: string;
  version_code: string;
  phone_model: string;
  phone_manufacturer: string;
  sdk_phone_version: string;
}

let cachedIp: string | null = null;

export async function fetchUserIp(): Promise<string> {
  if (cachedIp) return cachedIp;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    if (data?.ip && typeof data.ip === 'string') {
      cachedIp = data.ip;
      return data.ip;
    }
  } catch {
    // Silently fall back to loopback IP to satisfy backend class-validator @IsIP()
  }
  return '127.0.0.1';
}

export async function getMobileDeviceInfo(): Promise<MobileDeviceInfo> {
  const ipAddress = await fetchUserIp();

  const appVersion =
    Constants.expoConfig?.version ||
    Constants.manifest2?.extra?.expoClient?.version ||
    '1.0.0';

  const phoneModel = Device.modelName || Platform.OS;
  const phoneManufacturer = Device.manufacturer || 'Expo';
  const sdkPhoneVersion = Device.osVersion || `${Platform.Version}`;
  const deviceId = Device.osInternalBuildId || `${Platform.OS}-${Device.deviceYearClass || '2026'}`;

  return {
    latitude: '',
    longitude: '',
    carrier_name: '',
    ip_address: ipAddress || '127.0.0.1',
    imei_no: '',
    device_id: deviceId,
    app_version: appVersion,
    version_code: '1',
    phone_model: phoneModel,
    phone_manufacturer: phoneManufacturer,
    sdk_phone_version: sdkPhoneVersion,
  };
}
