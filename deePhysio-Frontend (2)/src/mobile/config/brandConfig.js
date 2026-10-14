/**
 * Reusable Centralized Brand Configuration
 * All product-specific identifiers, URLs, assets and defaults are defined here.
 * Future products (CRM, PetCare, Property, etc.) simply modify this file.
 */

export const BRAND_CONFIG = {
  // Product Identity
  productId: 'clinicpilotdemo',
  productName: 'ClinicPilot',
  displayName: 'ClinicPilot',
  shortName: 'ClinicPilot',
  tagline: 'Modern Clinical Management Software',
  appVersion: '1.0.0',
  buildNumber: 1,

  // Android & Native Identity (Package ID preserved per Rule 5)
  androidPackageId: 'com.kiaan.deephysio',
  appleBundleId: 'com.kiaan.deephysio',
  
  // Color Tokens
  theme: {
    primary: '#2EA7B8',
    primaryDark: '#1E8291',
    primaryLight: '#E8F7F8',
    secondary: '#F59E0B',
    background: '#0F172A',
    surface: '#FFFFFF',
    textDark: '#0F172A',
    statusBarColor: '#2EA7B8',
    statusBarStyle: 'DARK'
  },

  // Assets
  assets: {
    logo: '/logo.png',
    logoHorizontal: '/logo-horizontal.png',
    logoWhite: '/logo-white.svg',
    favicon: '/favicon.svg',
    icon192: '/icons/icon-192.png',
    icon512: '/icons/icon-512.png',
    iconMaskable: '/icons/icon-maskable-512.png',
    appleTouchIcon: '/icons/apple-touch-icon.png'
  },

  // API Endpoints (Preserved per Rule 2 & 3)
  api: {
    baseUrl: (
      import.meta.env.VITE_API_BASE_URL ||
      'https://api-saas.clinicpilotdemo.store/api'
    ).replace(/\/$/, ''),
    timeoutMs: 15000
  },

  // URLs for Web, Support & Store Policies
  urls: {
    websiteUrl: 'https://clinicpilotdemo.store',
    privacyPolicyUrl: '/privacy-policy',
    termsUrl: '/terms-and-conditions',
    accountDeletionUrl: '/account-deletion',
    supportUrl: '/support',
    supportEmail: 'support@clinicpilotdemo.store',
    privacyEmail: 'privacy@clinicpilotdemo.store',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.kiaan.deephysio'
  },

  // Google Play Review Test Credentials
  reviewAccount: {
    role: 'Demo Clinic Administrator',
    email: 'reviewer@kiaan.demo',
    password: 'DemoPhysioSecure2026!',
    notes: 'Pre-populated with realistic demo patients, appointments, SOAP notes and invoices.'
  }
};

export default BRAND_CONFIG;
