/**
 * Central Feature Configuration & Toggle Flags
 * Controls which native mobile & PWA capabilities are enabled for this product.
 */

export const FEATURE_FLAGS = {
  // Mobile / Native Modules
  pushNotifications: true,
  camera: true,
  photoPicker: true,
  fileUpload: true,
  fileDownload: true,
  nativeShare: true,
  deepLinks: true,
  networkStatus: true,
  appLifecycle: true,
  
  // Advanced Modules
  biometricLogin: false, // Optional: enabled only when enterprise hardware/security requested
  haptics: true,
  
  // Store Billing Strategy (Section 29, 30, 31)
  // 'existing_customer_mode': SaaS companion app (no in-app digital sales; login only)
  // 'play_billing': Google Play Digital Subscription Billing
  billingMode: 'existing_customer_mode',
  allowAlternativeBillingIndia: false,

  // PWA Features
  pwaInstallPrompt: true,
  pwaAutoUpdate: true,
  offlineBanner: true
};

export const isFeatureEnabled = (featureKey) => {
  return Boolean(FEATURE_FLAGS[featureKey]);
};

export default FEATURE_FLAGS;
