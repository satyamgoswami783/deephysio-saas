import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Only supported languages for India, USA, UK, UAE, Germany, Spain
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: {} },
      hi: { translation: {} },
      ar: { translation: {} },
      de: { translation: {} },
      es: { translation: {} }
    },
    supportedLngs: ['en', 'hi', 'ar', 'de', 'es'],
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'cookie', 'navigator'],
      lookupLocalStorage: 'deephysio_language',
      caches: ['localStorage']
    }
  });

export default i18n;
