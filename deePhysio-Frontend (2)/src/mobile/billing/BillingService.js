import { isNative, isAndroid } from '../platform';
import { FEATURE_FLAGS } from '../config/featureConfig';
import { fetchApi } from '../../config/api';

export class BillingService {
  /**
   * Check whether in-app billing UI is allowed
   */
  static isPurchaseAllowedInApp() {
    // If running in Android native app and mode is 'existing_customer_mode',
    // in-app purchases are suppressed to comply with Play Store companion/reader policies
    if (isNative && isAndroid && FEATURE_FLAGS.billingMode === 'existing_customer_mode') {
      return false;
    }
    return true;
  }

  /**
   * Check active subscription status from authenticated backend
   */
  static async verifyEntitlement() {
    try {
      const res = await fetchApi('/auth/active-sessions');
      if (!res || !res.ok) return { valid: false };
      const data = await res.json();
      return {
        valid: true,
        tenant: data?.data?.tenant,
        subscriptionStatus: data?.data?.user?.subscription_status
      };
    } catch (e) {
      return { valid: false, error: e };
    }
  }
}

export default BillingService;
