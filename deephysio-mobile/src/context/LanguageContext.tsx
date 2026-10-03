import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { translations, LANGUAGES } from '../locales/translations';

interface LanguageContextType {
  currentLang: string;
  setLanguage: (langCode: string) => Promise<void>;
  t: (key: string) => string;
  languages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLang: 'en',
  setLanguage: async () => {},
  t: (key: string) => key,
  languages: LANGUAGES,
});

const LANG_STORAGE_KEY = 'deephysio_mobile_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLangState] = useState<string>('en');

  useEffect(() => {
    const loadStoredLang = async () => {
      try {
        const stored = await SecureStore.getItemAsync(LANG_STORAGE_KEY);
        if (stored && translations[stored]) {
          setCurrentLangState(stored);
        }
      } catch (err) {
        // Fallback to default
      }
    };
    loadStoredLang();
  }, []);

  const setLanguage = async (langCode: string) => {
    if (translations[langCode]) {
      setCurrentLangState(langCode);
      try {
        await SecureStore.setItemAsync(LANG_STORAGE_KEY, langCode);
      } catch (err) {
        // SecureStore write error
      }
    }
  };

  const t = (key: string): string => {
    const dict = translations[currentLang] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;
