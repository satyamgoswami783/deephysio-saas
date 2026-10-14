import { App } from '@capacitor/app';
import { isNative } from '../platform';
import { isFeatureEnabled } from '../config/featureConfig';

export class DeepLinkService {
  static init(navigateCallback) {
    if (!isFeatureEnabled('deepLinks') || !isNative) {
      return;
    }

    try {
      App.addListener('appUrlOpen', (event) => {
        console.log('[DeepLinkService] App opened with URL:', event.url);
        
        try {
          const url = new URL(event.url);
          // Extract pathname and search query
          const targetPath = url.pathname + url.search;

          if (navigateCallback && targetPath) {
            navigateCallback(targetPath);
          }
        } catch (e) {
          // If custom scheme e.g. kiaan://appointments/123
          const match = event.url.match(/^[a-z]+:\/\/[^/]+(\/.*)$/i);
          if (match && match[1] && navigateCallback) {
            navigateCallback(match[1]);
          }
        }
      });
    } catch (err) {
      console.warn('[DeepLinkService] Deep link listener registration failed:', err);
    }
  }
}

export default DeepLinkService;
