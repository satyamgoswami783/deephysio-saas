import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();
export const isAndroid = getPlatform() === 'android';
export const isIos = getPlatform() === 'ios';
export const isWeb = getPlatform() === 'web';

export const isPwa = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const getEnvironmentDescription = () => {
  if (isAndroid) return 'Capacitor Android Shell';
  if (isIos) return 'Capacitor iOS Shell';
  if (isPwa()) return 'PWA Standalone';
  return 'Web Browser';
};
