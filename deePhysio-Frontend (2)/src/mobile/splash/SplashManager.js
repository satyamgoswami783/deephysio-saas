import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isNative, isAndroid } from '../platform';
import { BRAND_CONFIG } from '../config/brandConfig';

export class SplashManager {
  static hidden = false;

  static async setupNativeUI() {
    if (!isNative) return;

    try {
      if (isAndroid) {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: BRAND_CONFIG.theme.statusBarColor });
      }
    } catch (e) {
      console.warn('[SplashManager] StatusBar configuration skipped:', e);
    }
  }

  static async hideWhenReady(minDelayMs = 400) {
    if (!isNative || this.hidden) return;
    this.hidden = true;

    // Small delay ensures DOM paint and fonts are completely rendered behind splash
    setTimeout(async () => {
      try {
        await SplashScreen.hide({
          fadeOutDuration: 350
        });
        console.log('[SplashManager] Native splash screen smoothly transitioned to React UI');
      } catch (err) {
        console.warn('[SplashManager] Failed to hide native splash:', err);
      }
    }, minDelayMs);
  }
}

export default SplashManager;
