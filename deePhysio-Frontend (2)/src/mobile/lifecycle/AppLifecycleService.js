import { App } from '@capacitor/app';
import { isNative } from '../platform';

export class AppLifecycleService {
  static init({ onResume, onPause, onBackButton }) {
    if (!isNative) return;

    try {
      App.addListener('appStateChange', (state) => {
        console.log('[AppLifecycleService] App state changed:', state.isActive ? 'ACTIVE' : 'BACKGROUND');
        if (state.isActive && onResume) {
          onResume();
        } else if (!state.isActive && onPause) {
          onPause();
        }
      });

      App.addListener('backButton', (data) => {
        if (onBackButton) {
          onBackButton(data);
        } else {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            App.exitApp();
          }
        }
      });
    } catch (err) {
      console.warn('[AppLifecycleService] Lifecycle listener error:', err);
    }
  }
}

export default AppLifecycleService;
