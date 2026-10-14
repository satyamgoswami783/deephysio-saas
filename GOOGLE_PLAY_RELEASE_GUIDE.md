# Google Play Store Release & Submission Guide

This guide details the release package, reviewer access, and Play Console submission metadata for **deePhysio Clinical SaaS**.

---

## 1. Release Artifacts & Signing

| Property | Value |
| :--- | :--- |
| **Package ID / Application ID** | `com.kiaan.deephysio` |
| **Target SDK** | **Android 16 (API Level 36)** |
| **Minimum SDK** | Android 7.0 (API Level 24) |
| **Version Code** | `1` |
| **Version Name** | `1.0` |
| **Release Bundle (.aab)** | `deePhysio-Frontend (2)/android/app/build/outputs/bundle/release/app-release.aab` |
| **Debug Test APK (.apk)** | `deePhysio-Frontend (2)/android/app/build/outputs/apk/debug/app-debug.apk` |
| **Release Keystore** | `deePhysio-Frontend (2)/android/app/release.keystore` |
| **Key Alias** | `deephysio` |
| **Keystore Password** | `KiaanPhysio2026!` |
| **Key Password** | `KiaanPhysio2026!` |

---

## 2. Google Play Reviewer Test Credentials (Section 23)

To ensure the Google Play review team can thoroughly evaluate all clinical features without landing on an empty state or entering real patient data:

- **Login URL:** In-app splash screen transitions directly to login.
- **Reviewer Role:** Demo Clinic Administrator
- **Email:** `reviewer@kiaan.demo`
- **Password:** `DemoPhysioSecure2026!`
- **Demo Data Pre-populated:**
  - 10+ Realistic demo patient profiles (orthopedic & neurological physical therapy cases)
  - Pre-scheduled clinic appointments across Calendar and Check-in views
  - Clinical SOAP assessment notes with pain scales and posture charts
  - Sample billing records, itemized invoices, and payment receipts
  - Treatment exercise plans and discharge summaries

---

## 3. Play Store Listing Metadata (Section 36)

### App Title (Max 30 chars)
`deePhysio: Clinic Management`

### Short Description (Max 80 chars)
`Physical therapy, clinical appointments, patient charts & rehabilitation SaaS.`

### Full Description
```markdown
deePhysio is an advanced clinical management and physical therapy practice management system built specifically for physiotherapists, rehabilitation specialists, and multidisciplinary healthcare clinics.

Key Clinical & Management Capabilities:
• Comprehensive Appointment Scheduling: Calendar view, automated patient check-in counter, and smart waitlist management.
• Electronic Medical Records (EMR): Detailed SOAP clinical notes, pain diagrams, posture assessments, and exercise prescriptions.
• Patient Profiles: Longitudinal episode tracking, medical attachments, X-ray/MRI reports, and treatment milestones.
• Billing & Invoicing: Itemized therapy session invoicing, receipts, payment recording, and financial revenue reports.
• Patient Engagement: Automated appointment notifications and exercise follow-ups.
• Secure Cloud & Offline Reliability: High-availability cloud infrastructure with offline state preservation for uninterrupted clinical workflow.

Designed with enterprise data privacy standards, role-based access control, and intuitive mobile ergonomics for clinical practitioners on the move.
```

### URLs for Store Console
- **Privacy Policy URL:** `https://deephysiosoftware.kiaansoftware.com/privacy-policy`
- **Account Deletion URL:** `https://deephysiosoftware.kiaansoftware.com/account-deletion`
- **Support URL:** `https://deephysiosoftware.kiaansoftware.com/support`
- **Support Contact Email:** `support@kiaansoftware.com`

---

## 4. Play Console Policy Declarations

| Policy Item | Declaration | Reason |
| :--- | :--- | :--- |
| **App Access** | Some functionality restricted | Provide reviewer credentials: `reviewer@kiaan.demo` / `DemoPhysioSecure2026!` |
| **Ads** | No | The app contains zero third-party advertisements |
| **Content Rating** | Everyone / Medical | Professional healthcare and clinical productivity utility |
| **Target Audience** | 18 and older | Clinical practitioners and medical staff |
| **News / Financial App** | No | Clinical productivity software |
| **Government App** | No | Private SaaS product |
| **Data Safety** | See `GOOGLE_PLAY_DATA_SAFETY.md` | Medical records, push tokens, and account info declared |

---

## 5. Verification & Test Matrix (Section 34)

| Test Category | Test Case | Status | Verified Behavior |
| :--- | :--- | :--- | :--- |
| **Android Launch** | Native Splash Screen | **PASSED** | Branded `#2EA7B8` background with centered logo; seamless fade into React UI; zero white/black flash. |
| **Android Build** | API 36 Compilation | **PASSED** | Compiled against Android 16 (API 36) with Gradle 8.14 and Java 21; signed AAB produced. |
| **PWA Install** | Manifest & Icons | **PASSED** | Valid `manifest.json`, standalone mode, 192/512/maskable icons generated and verified. |
| **PWA Service Worker**| Caching & Updates | **PASSED** | Static shell precached; sensitive medical APIs bypass cache (network controlled); `skipWaiting` update prompt active. |
| **Offline Resilience**| Network Failure | **PASSED** | Centralized `OfflineBanner` alerts user; token & session preserved without logout loop. |
| **Mobile Layout** | Bottom Nav & Drawers | **PASSED** | Touch bottom nav on mobile/tablet viewports; full slide-in drawer with backdrop dismiss. |
| **Compliance** | Account Deletion | **PASSED** | Direct in-app deletion under Security Settings + public deletion page at `/account-deletion`. |
| **Compliance** | Privacy Policy | **PASSED** | Comprehensive public page at `/privacy-policy` linked on login and settings. |
