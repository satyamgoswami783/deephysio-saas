import { PushNotifications } from '@capacitor/push-notifications';
import { isNative } from '../platform';
import { isFeatureEnabled } from '../config/featureConfig';
import { permissionManager } from '../permissions/PermissionManager';
import { fetchApi } from '../../config/api';

export class NotificationService {
  static initialized = false;

  static async init(navigateCallback) {
    if (!isFeatureEnabled('pushNotifications') || !isNative) {
      return;
    }

    if (this.initialized) return;
    this.initialized = true;

    try {
      await permissionManager.requestWithRationale('notifications', async () => {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('[NotificationService] Push permission not granted');
          return { granted: false };
        }

        await PushNotifications.register();
        return { granted: true };
      });

      // On registration, receive FCM token
      PushNotifications.addListener('registration', async (token) => {
        console.log('[NotificationService] Push registration success, token:', token.value);
        await this.syncTokenWithBackend(token.value);
      });

      // On registration error
      PushNotifications.addListener('registrationError', (err) => {
        console.warn('[NotificationService] Registration error:', err);
      });

      // Notification received while app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[NotificationService] Foreground notification:', notification);
      });

      // User tapped on notification
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[NotificationService] Notification action performed:', action);
        const data = action.notification.data;
        if (data && data.route && navigateCallback) {
          navigateCallback(data.route);
        }
      });
    } catch (e) {
      console.warn('[NotificationService] Failed to initialize push notifications:', e);
    }
  }

  static async syncTokenWithBackend(token) {
    try {
      const authToken = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!authToken) return;

      await fetchApi('/notifications/register-device', {
        method: 'POST',
        body: JSON.stringify({
          deviceToken: token,
          platform: 'android'
        })
      });
    } catch (err) {
      console.warn('[NotificationService] Failed to sync push token with server:', err);
    }
  }

  static async unregister() {
    if (!isNative) return;
    try {
      await PushNotifications.removeAllListeners();
    } catch (_) {}
  }
}

export default NotificationService;
