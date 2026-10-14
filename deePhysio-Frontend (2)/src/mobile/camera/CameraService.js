import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from '../platform';
import { permissionManager } from '../permissions/PermissionManager';
import { isFeatureEnabled } from '../config/featureConfig';

export class CameraService {
  /**
   * Capture photo with camera
   */
  static async takePhoto(options = {}) {
    if (!isFeatureEnabled('camera')) {
      throw new Error('Camera feature is disabled for this product.');
    }

    if (isNative) {
      return await permissionManager.requestWithRationale('camera', async () => {
        try {
          const image = await Camera.getPhoto({
            quality: options.quality || 85,
            allowEditing: options.allowEditing !== false,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Camera,
            saveToGallery: false,
            width: options.maxWidth || 1600,
            correctOrientation: true
          });

          return {
            success: true,
            dataUrl: image.dataUrl,
            format: image.format
          };
        } catch (err) {
          if (err?.message?.includes('User cancelled')) {
            return { success: false, cancelled: true };
          }
          throw err;
        }
      });
    } else {
      // Web / PWA fallback using hidden file input
      return await this.pickFileFromWeb('image/*', true);
    }
  }

  /**
   * Pick photo from device gallery
   */
  static async pickImage(options = {}) {
    if (!isFeatureEnabled('photoPicker')) {
      throw new Error('Photo picker feature is disabled.');
    }

    if (isNative) {
      return await permissionManager.requestWithRationale('photos', async () => {
        try {
          const image = await Camera.getPhoto({
            quality: options.quality || 85,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Photos,
            width: options.maxWidth || 1600
          });

          return {
            success: true,
            dataUrl: image.dataUrl,
            format: image.format
          };
        } catch (err) {
          if (err?.message?.includes('User cancelled')) {
            return { success: false, cancelled: true };
          }
          throw err;
        }
      });
    } else {
      return await this.pickFileFromWeb('image/*', false);
    }
  }

  static pickFileFromWeb(accept = 'image/*', capture = false) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      if (capture) input.capture = 'environment';

      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (!file) {
          resolve({ success: false, cancelled: true });
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            success: true,
            dataUrl: reader.result,
            file
          });
        };
        reader.onerror = () => resolve({ success: false, error: 'Read error' });
        reader.readAsDataURL(file);
      };

      input.oncancel = () => resolve({ success: false, cancelled: true });
      input.click();
    });
  }
}

export default CameraService;
