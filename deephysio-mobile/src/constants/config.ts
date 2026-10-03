import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getDynamicApiUrl = (): string => {
  // Dynamically extract the Metro host IP if running under Expo
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).experienceUrl;

  if (hostUri && typeof hostUri === 'string') {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5000/api`;
    }
  }

  // Fallback to active LAN IP
  return 'http://192.168.43.83:5000/api';
};

// Base API URL pointing to backend (Dynamically adjusts to WiFi / Hotspot changes)
export const API_BASE_URL = getDynamicApiUrl();

export const APP_NAME = 'DeePhysio Healthcare';
export const APP_VERSION = '1.0.0';

