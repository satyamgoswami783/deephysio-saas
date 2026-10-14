import { isNative } from '../platform';
import { PERMISSIONS_CONFIG } from '../config/permissionsConfig';

class PermissionManager {
  constructor() {
    this.modalHandler = null;
  }

  setModalHandler(handler) {
    this.modalHandler = handler;
  }

  async requestWithRationale(permissionType, nativeRequestCallback) {
    const config = PERMISSIONS_CONFIG[permissionType];
    if (!config) {
      return await nativeRequestCallback();
    }

    // If on native platform and modal handler is registered, show pre-permission rationale
    if (isNative && this.modalHandler) {
      const userAgreed = await new Promise((resolve) => {
        this.modalHandler({
          config,
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false)
        });
      });

      if (!userAgreed) {
        return { granted: false, reason: 'USER_CANCELLED_RATIONALE' };
      }
    }

    try {
      const result = await nativeRequestCallback();
      return result;
    } catch (err) {
      console.warn(`[PermissionManager] Error requesting ${permissionType}:`, err);
      return { granted: false, error: err };
    }
  }
}

export const permissionManager = new PermissionManager();
export default permissionManager;
