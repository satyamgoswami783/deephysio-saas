/**
 * Currency and Locale utility for DeePhysio SaaS
 * Supported Countries, Currencies and Languages:
 * 1. India - Indian Rupee (INR ₹) - Hindi, English
 * 2. USA - US Dollar (USD $) - English
 * 3. UK - Pound Sterling (GBP £) - English
 * 4. UAE - UAE Dirham (AED د.إ) - Arabic, English
 * 5. Germany - Euro (EUR €) - German
 * 6. Spain - Euro (EUR €) - Spanish
 */

export const CURRENCY_CONFIG = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', country: 'India' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', country: 'USA' },
  GBP: { code: 'GBP', symbol: '£', name: 'Pound Sterling', flag: '🇬🇧', country: 'UK' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', country: 'UAE' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', country: 'Europe' }
};

export const getActiveCurrencySymbol = () => {
  if (typeof window === 'undefined') return '₹';
  return localStorage.getItem('deephysio_currency_symbol') || '₹';
};

export const getActiveCurrencyCode = () => {
  if (typeof window === 'undefined') return 'INR';
  return localStorage.getItem('deephysio_currency') || 'INR';
};

export const getActiveCountry = () => {
  if (typeof window === 'undefined') return 'India';
  return localStorage.getItem('deephysio_country') || 'India';
};

export const formatCurrency = (val, customSymbol) => {
  const num = Number(val || 0);
  const symbol = customSymbol || getActiveCurrencySymbol();
  const formattedNumber = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const sign = num < 0 ? '-' : '';

  if (symbol === 'د.إ') {
    return `${sign}${formattedNumber} د.إ`;
  }
  return `${sign}${symbol}${formattedNumber}`;
};

export const fmtCompactCurrency = (val, customSymbol) => {
  const num = Number(val || 0);
  const symbol = customSymbol || getActiveCurrencySymbol();
  const abs = Math.abs(num);
  let str = '';
  if (abs >= 1_000_000) {
    str = (abs / 1_000_000).toFixed(1) + 'M';
  } else if (abs >= 1_000) {
    str = (abs / 1_000).toFixed(1) + 'k';
  } else {
    str = abs.toFixed(0);
  }
  const sign = num < 0 ? '-' : '';
  if (symbol === 'د.إ') {
    return `${sign}${str} د.إ`;
  }
  return `${sign}${symbol}${str}`;
};

export default {
  CURRENCY_CONFIG,
  getActiveCurrencySymbol,
  getActiveCurrencyCode,
  getActiveCountry,
  formatCurrency,
  fmtCompactCurrency
};
