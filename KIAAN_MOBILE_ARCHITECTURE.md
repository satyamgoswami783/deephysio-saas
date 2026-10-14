# KIAAN Reusable Mobile & PWA Architecture

## Overview
This codebase establishes a single, production-grade codebase architecture that transforms an existing React.js + Node.js software suite into a:
1. **Responsive Web App** (Desktop, Tablet, Mobile)
2. **Progressive Web App (PWA)** (Installable on iOS, Android, and Desktop)
3. **Capacitor Android Native Shell**
4. **Google Play Store Release Bundle (`.aab`)**

There is **zero rewrite**, **zero React Native**, and **zero secondary codebase**.

```
                           Existing React.js
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
          Web App / PWA                      Capacitor Android Native
        (Desktop / Mobile)                     (Android 16 / API 36)
               │                                       │
               └───────────────────┬───────────────────┘
                                   │ HTTPS REST APIs
                                   ▼
                         Existing Node.js Backend
                                   │
                                   ▼
                            MySQL Database
```

---

## 1. Directory Structure

```
src/
├── mobile/
│   ├── config/
│   │   ├── brandConfig.js        # Central product branding, IDs, API base URL & legal URLs
│   │   ├── featureConfig.js      # Feature toggle flags (push, camera, share, billing mode)
│   │   ├── permissionsConfig.js  # Minimum-permission explanations & prompts
│   │   └── legalConfig.js        # Contact details & compliance policies
│   ├── network/
│   │   ├── NetworkManager.js     # Online/offline detection (Capacitor Network + browser)
│   │   ├── useNetworkStatus.js   # React hook for network state
│   │   ├── OfflineBanner.jsx     # Non-intrusive offline alert with session preservation
│   │   └── ApiErrorHandler.js   # Human-friendly API & HTTP error translation
│   ├── camera/
│   │   └── CameraService.js      # Camera & gallery picker with HTML5 web fallback
│   ├── files/
│   │   └── FileService.js        # WebView-safe downloads & PDF viewer/share
│   ├── share/
│   │   └── ShareService.js       # Native Android share with Web Share & clipboard fallback
│   ├── notifications/
│   │   └── NotificationService.js# Push notification token sync, foreground alerts & tap routing
│   ├── deeplink/
│   │   └── DeepLinkService.js    # Custom scheme (`com.kiaan.deephysio://`) & App Links routing
│   ├── permissions/
│   │   ├── PermissionManager.js  # Pre-permission UX coordination
│   │   └── PermissionModal.jsx   # Rationale dialog shown before native prompt
│   ├── lifecycle/
│   │   └── AppLifecycleService.js# Android foreground/background transitions & back button
│   ├── splash/
│   │   └── SplashManager.js      # Controls native splash dismissal only after React is ready
│   ├── billing/
│   │   └── BillingService.js     # In-app purchase vs Existing Paid Customer mode
│   └── platform.js               # isNative, isAndroid, isIos, isPwa, isWeb
│
├── pwa/
│   ├── PwaManager.js             # Service worker lifecycle & beforeinstallprompt handler
│   ├── usePwaUpdate.js           # Update detection hook
│   ├── PwaUpdatePrompt.jsx       # Floating update alert with skipWaiting action
│   └── PwaInstallPrompt.jsx      # Install to home screen banner
│
├── pages/legal/
│   ├── PrivacyPolicy.jsx         # In-app & public privacy policy
│   ├── AccountDeletionPage.jsx   # Google Play compliant data deletion request
│   └── TermsAndConditions.jsx   # Terms of service
│
public/
├── manifest.json                 # Web App Manifest (standalone, theme colors, shortcuts)
├── sw.js                         # Versioned SW with sensitive-API bypass
└── icons/                        # 192x192, 512x512, maskable icons, apple-touch-icon
```

---

## 2. Reusing for Future KIAAN Products

To deploy this exact mobile architecture to a new SaaS product (e.g. `com.kiaan.crm`, `com.kiaan.petcare`, `com.kiaan.property`):

### Step 1: Update `src/mobile/config/brandConfig.js`
Modify product identity and IDs:
```javascript
export const BRAND_CONFIG = {
  productId: 'crm',
  productName: 'Kiaan CRM Pro',
  shortName: 'KiaanCRM',
  androidPackageId: 'com.kiaan.crm',
  theme: {
    primary: '#4F46E5', // New brand color
    statusBarColor: '#4F46E5'
  },
  api: {
    baseUrl: 'https://api.crm.example.com/api'
  }
};
```

### Step 2: Toggle Features in `src/mobile/config/featureConfig.js`
Turn on/off native modules:
```javascript
export const FEATURE_FLAGS = {
  pushNotifications: true,
  camera: false,         // Disable if not needed
  photoPicker: true,
  billingMode: 'existing_customer_mode'
};
```

### Step 3: Update `capacitor.config.json`
```json
{
  "appId": "com.kiaan.crm",
  "appName": "KiaanCRM",
  "webDir": "dist"
}
```

### Step 4: Run the Build Pipeline
```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```
The new signed `.aab` is immediately generated in `android/app/build/outputs/bundle/release/app-release.aab`.
