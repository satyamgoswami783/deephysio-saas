import { Share } from '@capacitor/share';
import { isNative } from '../platform';
import { isFeatureEnabled } from '../config/featureConfig';

export class ShareService {
  static async share({ title, text, url, dialogTitle }) {
    if (!isFeatureEnabled('nativeShare')) {
      return false;
    }

    if (isNative) {
      try {
        await Share.share({
          title: title || 'deePhysio Clinical Record',
          text: text || '',
          url: url || window.location.href,
          dialogTitle: dialogTitle || 'Share with...'
        });
        return true;
      } catch (err) {
        if (err?.message?.includes('canceled') || err?.message?.includes('cancelled')) {
          return false;
        }
        console.warn('[ShareService] Native share error:', err);
      }
    }

    // Web Share API fallback
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: title || 'deePhysio',
          text: text || '',
          url: url || window.location.href
        });
        return true;
      } catch (e) {
        if (e.name === 'AbortError') return false;
      }
    }

    // Clipboard fallback
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const shareText = [title, text, url].filter(Boolean).join('\n');
      await navigator.clipboard.writeText(shareText);
      return 'COPIED_TO_CLIPBOARD';
    }

    return false;
  }
}

export default ShareService;
