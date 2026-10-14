/**
 * Reusable Centralized Brand Configuration
 * All product-specific identifiers, URLs, assets and defaults are defined here.
 * Future products (CRM, PetCare, Property, etc.) simply modify this file.
 */

export const BRAND_CONFIG = {
  // Product Identity
  productId: 'deephysio',
  productName: 'deePhysio Clinical SaaS',
  shortName: 'deePhysio',
  tagline: 'Physical Therapy, Rehabilitation & Clinic Management',
  appVersion: '1.0.0',
  buildNumber: 1,

  // Android & Native Identity
  androidPackageId: 'com.kiaan.deephysio',
  appleBundleId: 'com.kiaan.deephysio',
  
  // Color Tokens
  theme: {
    primary: '#2EA7B8',
    primaryDark: '#1E6C77',
    primaryLight: '#EAF6F8',
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
    favicon: '/favicon.svg',
    icon192: '/icons/icon-192.png',
    icon512: '/icons/icon-512.png',
    iconMaskable: '/icons/icon-maskable-512.png',
    appleTouchIcon: '/icons/apple-touch-icon.png'
  },

  // API Endpoints
  api: {
    baseUrl: (
      import.meta.env.VITE_API_BASE_URL ||
      'https://deephysioclinical-production.up.railway.app/api'
    ).replace(/\/$/, ''),
    timeoutMs: 15000
  },

  // URLs for Web, Support & Store Policies
  urls: {
    websiteUrl: 'https://deephysiosoftware.kiaansoftware.com',
    privacyPolicyUrl: '/privacy-policy',
    termsUrl: '/terms-and-conditions',
    accountDeletionUrl: '/account-deletion',
    supportUrl: '/support',
    supportEmail: 'support@kiaansoftware.com',
    privacyEmail: 'privacy@kiaansoftware.com',
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
