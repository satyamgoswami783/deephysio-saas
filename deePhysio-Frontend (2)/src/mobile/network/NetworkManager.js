import { Network } from '@capacitor/network';
import { isNative } from '../platform';

class NetworkManager {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.connectionType = 'unknown';
    this.listeners = new Set();
    this.init();
  }

  async init() {
    if (isNative) {
      try {
        const status = await Network.getStatus();
        this.isOnline = status.connected;
        this.connectionType = status.connectionType;

        Network.addListener('networkStatusChange', (status) => {
          this.handleStatusChange(status.connected, status.connectionType);
        });
      } catch (err) {
        console.warn('[NetworkManager] Native network check fallback to browser events', err);
        this.initBrowserEvents();
      }
    } else {
      this.initBrowserEvents();
    }
  }

  initBrowserEvents() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => {
      this.handleStatusChange(true, 'browser');
    });
    window.addEventListener('offline', () => {
      this.handleStatusChange(false, 'none');
    });
  }

  handleStatusChange(online, connectionType) {
    const changed = this.isOnline !== online;
    this.isOnline = online;
    this.connectionType = connectionType;

    if (changed) {
      console.log(`[NetworkManager] Network status changed: ${online ? 'ONLINE' : 'OFFLINE'} (${connectionType})`);
      this.notifyListeners();
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    for (const callback of this.listeners) {
      try {
        callback({
          isOnline: this.isOnline,
          connectionType: this.connectionType
        });
      } catch (e) {
        console.error('[NetworkManager] Listener error:', e);
      }
    }
  }

  async checkServerHealth(apiBaseUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${apiBaseUrl.replace(/\/api$/, '')}/`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (_) {
      return false;
    }
  }
}

export const networkManager = new NetworkManager();
export default networkManager;
