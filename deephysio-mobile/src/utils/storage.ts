import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const Storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      console.warn('Storage.getItem error:', e);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (e) {
      console.warn('Storage.setItem error:', e);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {
      console.warn('Storage.removeItem error:', e);
    }
  },

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const val = await this.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  async setJson(key: string, value: any): Promise<void> {
    try {
      let toStore = value;
      if (key === 'deephysio_user' && value && typeof value === 'object') {
        // Omit huge base64 photos from SecureStore to stay under the 2048 byte Android limit
        if (typeof value.photo === 'string' && value.photo.length > 500) {
          toStore = { ...value, photo: undefined };
        }
      }
      await this.setItem(key, JSON.stringify(toStore));
    } catch (e) {
      console.warn('Storage.setJson error:', e);
    }
  },

  async clear(): Promise<void> {
    await this.removeItem('token');
    await this.removeItem('deephysio_user');
    await this.removeItem('deephysio_role');
  }
};
