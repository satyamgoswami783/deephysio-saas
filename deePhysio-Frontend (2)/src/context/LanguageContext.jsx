import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';
import { formatCurrency as formatCurrencyUtil, getActiveCurrencySymbol, getActiveCurrencyCode } from '../utils/currency';
import { fetchApi } from '../config/api';

const translations = {
  en: {
    dashboard: 'Dashboard',
    appointments: 'Appointments',
    patients: 'Patients',
    clinicalNotes: 'Clinical Notes',
    billing: 'Billing & Payments',
    invoices: 'Invoices',
    forms: 'Forms & Surveys',
    marketing: 'Marketing',
    analytics: 'Analytics',
    settings: 'Settings',
    systemSettings: 'System Settings',
    rolesPermissions: 'Roles & Permissions',
    integrations: 'Integrations',
    backup: 'Data Backup',
    security: 'Security & Access',
    auditLogs: 'Audit Logs',
    logout: 'Sign Out',
    search: 'Search...',
    notifications: 'Notifications',
    profile: 'Profile',
    helpSupport: 'Help & Support',
    save: 'Save Changes',
    cancel: 'Cancel',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    add: 'Add New',
    status: 'Status',
    action: 'Actions',

    // Language names
    english: 'English',
    hindi: 'हिन्दी (Hindi)',
    spanish: 'Spanish (Español)',
    arabic: 'العربية (Arabic)',
    german: 'Deutsch (German)'
  },
  hi: {
    dashboard: 'डैशबोर्ड',
    appointments: 'अपॉइंटमेंट्स',
    patients: 'मरीज (Patients)',
    clinicalNotes: 'क्लिनिकल नोट्स',
    billing: 'बिलिंग और भुगतान',
    invoices: 'चालान (Invoices)',
    forms: 'फॉर्म्स और सर्वे',
    marketing: 'मार्केटिंग',
    analytics: 'एनालिटिक्स',
    settings: 'सेटिंग्स',
    systemSettings: 'सिस्टम सेटिंग्स',
    rolesPermissions: 'भूमिका और अनुमतियाँ (Roles)',
    integrations: 'इंटीग्रेशन्स',
    backup: 'डेटा बैकअप',
    security: 'सुरक्षा और प्राइवेसी',
    auditLogs: 'ऑडिट लॉग्स',
    logout: 'लॉग आउट',
    search: 'खोजें (Search)...',
    notifications: 'सूचनाएं (Notifications)',
    profile: 'प्रोफाइल',
    helpSupport: 'सहायता और सपोर्ट',
    save: 'परिवर्तन सहेजें',
    cancel: 'रद्द करें',
    loading: 'लोड हो रहा है...',
    success: 'सफलता',
    error: 'त्रुटि',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    view: 'देखें',
    add: 'नया जोड़ें',
    status: 'स्थिति',
    action: 'कार्रवाई',

    // Language names
    english: 'English',
    hindi: 'हिन्दी (Hindi)',
    spanish: 'Spanish (Español)',
    arabic: 'العربية (Arabic)',
    german: 'Deutsch (German)'
  },
  es: {
    dashboard: 'Panel de Control',
    appointments: 'Citas',
    patients: 'Pacientes',
    clinicalNotes: 'Notas Clínicas',
    billing: 'Facturación y Pagos',
    invoices: 'Facturas',
    forms: 'Formularios y Encuestas',
    marketing: 'Marketing',
    analytics: 'Analítica',
    settings: 'Configuración',
    systemSettings: 'Ajustes del Sistema',
    rolesPermissions: 'Roles y Permisos',
    integrations: 'Integraciones',
    backup: 'Copia de Seguridad',
    security: 'Seguridad y Acceso',
    auditLogs: 'Registro de Auditoría',
    logout: 'Cerrar Sesión',
    search: 'Buscar...',
    notifications: 'Notificaciones',
    profile: 'Perfil',
    helpSupport: 'Ayuda y Soporte',
    save: 'Guardar Cambios',
    cancel: 'Cancelar',
    loading: 'Cargando...',
    success: 'Éxito',
    error: 'Error',
    delete: 'Eliminar',
    edit: 'Editar',
    view: 'Ver',
    add: 'Añadir Nuevo',
    status: 'Estado',
    action: 'Acciones',

    // Language names
    english: 'English',
    hindi: 'हिन्दी (Hindi)',
    spanish: 'Spanish (Español)',
    arabic: 'العربية (Arabic)',
    german: 'Deutsch (German)'
  },
  ar: {
    dashboard: 'لوحة التحكم',
    appointments: 'المواعيد',
    patients: 'المرضى',
    clinicalNotes: 'الملاحظات السريرية',
    billing: 'الفواتير والمدفوعات',
    invoices: 'الفواتير',
    forms: 'النماذج والاستبيانات',
    marketing: 'التسويق',
    analytics: 'التحليلات',
    settings: 'الإعدادات',
    systemSettings: 'إعدادات النظام',
    rolesPermissions: 'الأدوار والصلاحيات',
    integrations: 'عمليات التكامل',
    backup: 'النسخ الاحتياطي',
    security: 'الأمان والوصول',
    auditLogs: 'سجلات التدقيق',
    logout: 'تسجيل الخروج',
    search: 'بحث...',
    notifications: 'الإشعارات',
    profile: 'الملف الشخصي',
    helpSupport: 'المساعدة والدعم',
    save: 'حفظ التغييرات',
    cancel: 'إلغاء',
    loading: 'جار التحميل...',
    success: 'نجاح',
    error: 'خطأ',
    delete: 'حذف',
    edit: 'تعديل',
    view: 'عرض',
    add: 'إضافة جديد',
    status: 'الحالة',
    action: 'الإجراءات',

    // Language names
    english: 'English',
    hindi: 'हिन्दी (Hindi)',
    spanish: 'Spanish (Español)',
    arabic: 'العربية (Arabic)',
    german: 'Deutsch (German)'
  },
  de: {
    dashboard: 'Dashboard',
    appointments: 'Termine',
    patients: 'Patienten',
    clinicalNotes: 'Klinische Notizen',
    billing: 'Abrechnung & Zahlungen',
    invoices: 'Rechnungen',
    forms: 'Formulare & Umfragen',
    marketing: 'Marketing',
    analytics: 'Analysen',
    settings: 'Einstellungen',
    systemSettings: 'Systemeinstellungen',
    rolesPermissions: 'Rollen & Berechtigungen',
    integrations: 'Integrationen',
    backup: 'Datensicherung',
    security: 'Sicherheit & Zugriff',
    auditLogs: 'Audit-Protokolle',
    logout: 'Abmelden',
    search: 'Suchen...',
    notifications: 'Benachrichtigungen',
    profile: 'Profil',
    helpSupport: 'Hilfe & Support',
    save: 'Änderungen speichern',
    cancel: 'Abbrechen',
    loading: 'Wird geladen...',
    success: 'Erfolg',
    error: 'Fehler',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    view: 'Ansehen',
    add: 'Neu hinzufügen',
    status: 'Status',
    action: 'Aktionen',

    // Language names
    english: 'English',
    hindi: 'हिन्दी (Hindi)',
    spanish: 'Spanish (Español)',
    arabic: 'العربية (Arabic)',
    german: 'Deutsch (German)'
  }
};

/**
 * Supported Countries with their Currencies and Languages
 * 1. India - Indian Rupee (INR ₹) - Hindi, English
 * 2. USA - US Dollar (USD $) - English
 * 3. UK - Pound Sterling (GBP £) - English
 * 4. UAE - UAE Dirham (AED د.إ) - Arabic, English
 * 5. Germany - Euro (EUR €) - German
 * 6. Spain - Euro (EUR €) - Spanish
 */
export const supportedCountries = [
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    languages: [
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी (Hindi)' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'US',
    name: 'USA',
    flag: '🇺🇸',
    currency: { code: 'USD', symbol: '$', name: 'US Dollar' },
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'GB',
    name: 'UK',
    flag: '🇬🇧',
    currency: { code: 'GBP', symbol: '£', name: 'Pound Sterling' },
    languages: [
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'AE',
    name: 'UAE',
    flag: '🇦🇪',
    currency: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    languages: [
      { code: 'ar', name: 'Arabic', nativeName: 'العربية (Arabic)', dir: 'rtl' },
      { code: 'en', name: 'English', nativeName: 'English' }
    ]
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: { code: 'EUR', symbol: '€', name: 'Euro' },
    languages: [
      { code: 'de', name: 'German', nativeName: 'Deutsch (German)' }
    ]
  },
  {
    code: 'ES',
    name: 'Spain',
    flag: '🇪🇸',
    currency: { code: 'EUR', symbol: '€', name: 'Euro' },
    languages: [
      { code: 'es', name: 'Spanish (Español)', nativeName: 'Spanish (Español)' }
    ]
  }
];

export const supportedLocales = [
  {
    id: 'hi-IN',
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी (Hindi)',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    currencyCode: 'INR',
    currencySymbol: '₹',
    currencyName: 'Indian Rupee',
    dir: 'ltr'
  },
  {
    id: 'en-IN',
    code: 'en',
    name: 'English (India)',
    nativeName: 'English',
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    currencyCode: 'INR',
    currencySymbol: '₹',
    currencyName: 'Indian Rupee',
    dir: 'ltr'
  },
  {
    id: 'en-US',
    code: 'en',
    name: 'English (USA)',
    nativeName: 'English',
    country: 'USA',
    countryCode: 'US',
    flag: '🇺🇸',
    currencyCode: 'USD',
    currencySymbol: '$',
    currencyName: 'US Dollar',
    dir: 'ltr'
  },
  {
    id: 'en-GB',
    code: 'en',
    name: 'English (UK)',
    nativeName: 'English',
    country: 'UK',
    countryCode: 'GB',
    flag: '🇬🇧',
    currencyCode: 'GBP',
    currencySymbol: '£',
    currencyName: 'Pound Sterling',
    dir: 'ltr'
  },
  {
    id: 'ar-AE',
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية (Arabic)',
    country: 'UAE',
    countryCode: 'AE',
    flag: '🇦🇪',
    currencyCode: 'AED',
    currencySymbol: 'د.إ',
    currencyName: 'UAE Dirham',
    dir: 'rtl'
  },
  {
    id: 'en-AE',
    code: 'en',
    name: 'English (UAE)',
    nativeName: 'English',
    country: 'UAE',
    countryCode: 'AE',
    flag: '🇦🇪',
    currencyCode: 'AED',
    currencySymbol: 'د.إ',
    currencyName: 'UAE Dirham',
    dir: 'ltr'
  },
  {
    id: 'de-DE',
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch (German)',
    country: 'Germany',
    countryCode: 'DE',
    flag: '🇩🇪',
    currencyCode: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
    dir: 'ltr'
  },
  {
    id: 'es-ES',
    code: 'es',
    name: 'Spanish (Español)',
    nativeName: 'Spanish (Español)',
    country: 'Spain',
    countryCode: 'ES',
    flag: '🇪🇸',
    currencyCode: 'EUR',
    currencySymbol: '€',
    currencyName: 'Euro',
    dir: 'ltr'
  }
];

// Languages list compatible with components expecting { code, name, nativeName, flag, dir }
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी (Hindi)', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية (Arabic)', flag: '🇦🇪', dir: 'rtl' },
  { code: 'de', name: 'German', nativeName: 'Deutsch (German)', flag: '🇩🇪', dir: 'ltr' },
  { code: 'es', name: 'Spanish (Español)', nativeName: 'Spanish (Español)', flag: '🇪🇸', dir: 'ltr' }
];

export const languages = supportedLanguages;

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const getActiveGoogleTransLang = () => {
    if (typeof document === 'undefined') return null;
    // Check cookie: googtrans=/en/es or /auto/es or %2Fen%2Fes
    const match = document.cookie.match(/googtrans=(?:%2F|\/)[^/;\s%]+(?:%2F|\/)([a-zA-Z]{2})/i);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
    // Also check document.documentElement.lang
    const docLang = document.documentElement?.getAttribute('lang')?.toLowerCase()?.slice(0, 2);
    if (docLang && ['hi', 'ar', 'de', 'es'].includes(docLang)) {
      return docLang;
    }
    return null;
  };

  // Determine initial language (UI language)
  const [currentLang, setCurrentLang] = useState(() => {
    const cookieLang = getActiveGoogleTransLang();
    const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('deephysio_language')?.toLowerCase() : null;

    if (cookieLang && ['en', 'hi', 'ar', 'de', 'es'].includes(cookieLang)) {
      return cookieLang;
    }
    if (savedLang && ['en', 'hi', 'ar', 'de', 'es'].includes(savedLang)) {
      return savedLang;
    }
    return 'en';
  });

  // Determine initial locale and currency settings
  const [currentLocale, setCurrentLocale] = useState(() => {
    const savedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem('deephysio_locale') : null;
    if (savedLocale && supportedLocales.some(l => l.id === savedLocale)) {
      return savedLocale;
    }
    return 'en-IN';
  });

  const [currencyCode, setCurrencyCode] = useState(() => {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('deephysio_currency')) || 'INR';
  });

  const [currencySymbol, setCurrencySymbol] = useState(() => {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('deephysio_currency_symbol')) || '₹';
  });

  const [currentCountry, setCurrentCountry] = useState(() => {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('deephysio_country')) || 'India';
  });

  const activeLocaleObj = supportedLocales.find(l => l.id === currentLocale) || supportedLocales[0];

  const killGoogleTranslate = () => {
    if (typeof document === 'undefined') return;
    const host = window.location.hostname;
    const paths = ['/', '', window.location.pathname];
    const domains = ['', host, `.${host}`];
    
    paths.forEach((p) => {
      domains.forEach((d) => {
        const domainStr = d && d !== 'localhost' && d !== '127.0.0.1' ? `; domain=${d}` : '';
        const pathStr = p ? `; path=${p}` : '; path=/';
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT${pathStr}${domainStr}`;
        document.cookie = `googtrans=; Max-Age=0${pathStr}${domainStr}`;
      });
    });
    try {
      sessionStorage.removeItem('googtrans');
      localStorage.removeItem('googtrans');
    } catch (_) {}
  };

  const setLocale = (localeId) => {
    const target = supportedLocales.find(l => l.id === localeId);
    if (!target) return;

    setCurrentLocale(target.id);
    setCurrencyCode(target.currencyCode);
    setCurrencySymbol(target.currencySymbol);
    setCurrentCountry(target.country);

    localStorage.setItem('deephysio_locale', target.id);
    localStorage.setItem('deephysio_currency', target.currencyCode);
    localStorage.setItem('deephysio_currency_symbol', target.currencySymbol);
    localStorage.setItem('deephysio_country', target.country);
  };

  const setLanguage = (langCodeOrLocaleId) => {
    if (!langCodeOrLocaleId) return;

    // Normalize to 2-letter language code (e.g. 'es-ES' -> 'es', 'es' -> 'es')
    const code = (langCodeOrLocaleId.includes('-') 
      ? (supportedLocales.find(l => l.id === langCodeOrLocaleId)?.code || langCodeOrLocaleId.split('-')[0])
      : langCodeOrLocaleId
    ).toLowerCase();

    const targetLang = supportedLanguages.find(l => l.code === code) || supportedLanguages[0];
    const targetCode = targetLang.code;

    // Immediately update local and React state so dropdown checkmark & navbar button update at once
    setCurrentLang(targetCode);
    localStorage.setItem('deephysio_language', targetCode);

    if (typeof document !== 'undefined') {
      document.body.classList.add('language-transitioning');
      document.documentElement.dir = targetLang.dir || 'ltr';
      document.documentElement.lang = targetCode;
    }

    try {
      i18n.changeLanguage(targetCode);
    } catch (_) {}

    if (targetCode === 'en') {
      killGoogleTranslate();
      const select = document.querySelector("#google_translate_master_container select.goog-te-combo") || 
                     document.querySelector("select.goog-te-combo");
      if (select) {
        try {
          select.value = '';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (_) {}
      }
      setTimeout(() => {
        window.location.reload();
      }, 150);
      return;
    }

    // For non-English target languages:
    killGoogleTranslate();
    document.cookie = `googtrans=/en/${targetCode}; path=/;`;
    if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      document.cookie = `googtrans=/en/${targetCode}; path=/; domain=.${window.location.hostname};`;
    }

    // Trigger Google Translate select combo for live in-place translation
    const select = document.querySelector("#google_translate_master_container select.goog-te-combo") || 
                   document.querySelector("select.goog-te-combo");
    if (select) {
      try {
        select.value = targetCode;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof select.onchange === 'function') {
          select.onchange();
        }
      } catch (err) {
        console.warn('Google Translate combo error:', err);
      }
    }

    setTimeout(() => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('language-transitioning');
      }
    }, 450);

    // If Google Translate hasn't switched live within 400ms, reload cleanly to apply
    setTimeout(() => {
      const activeCookie = document.cookie;
      if (!activeCookie.includes(`/en/${targetCode}`)) {
        window.location.reload();
      }
    }, 400);
  };

  // Sync language dir & Google Translate on mount and when currentLang changes
  useEffect(() => {
    const activeLangObj = supportedLanguages.find(l => l.code === currentLang) || supportedLanguages[0];
    if (typeof document !== 'undefined') {
      document.documentElement.dir = activeLangObj.dir || 'ltr';
      document.documentElement.lang = currentLang;
    }

    if (currentLang !== 'en') {
      document.cookie = `googtrans=/en/${currentLang}; path=/;`;
    }

    const timer = setTimeout(() => {
      const select = document.querySelector("#google_translate_master_container select.goog-te-combo") || 
                     document.querySelector("select.goog-te-combo");
      if (select && select.value !== currentLang && currentLang !== 'en') {
        select.value = currentLang;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [currentLang]);

  // Periodic check to keep currentLang in sync if Google Translate is changed externally
  useEffect(() => {
    const checkGoogleTranslateSync = () => {
      const detected = getActiveGoogleTransLang();
      if (detected && ['en', 'hi', 'ar', 'de', 'es'].includes(detected)) {
        if (detected !== currentLang) {
          setCurrentLang(detected);
          localStorage.setItem('deephysio_language', detected);
        }
      }
    };

    const interval = setInterval(checkGoogleTranslateSync, 800);
    return () => clearInterval(interval);
  }, [currentLang]);

  // Fetch clinicCurrency from backend database config to ensure currency matches clinic settings
  useEffect(() => {
    let isMounted = true;
    const syncClinicCurrency = async () => {
      try {
        const res = await fetchApi('/public/config');
        if (!res?.ok) return;
        const json = await res.json();
        const cfg = json?.data?.clinicCurrency;
        if (cfg && isMounted) {
          const targetLocale = supportedLocales.find(l => 
            l.id === cfg.localeId || 
            (l.currencyCode === cfg.currencyCode && l.code === (cfg.languageCode || 'en')) ||
            l.currencyCode === cfg.currencyCode
          );
          if (targetLocale) {
            localStorage.setItem('deephysio_locale', targetLocale.id);
            localStorage.setItem('deephysio_currency', targetLocale.currencyCode);
            localStorage.setItem('deephysio_currency_symbol', targetLocale.currencySymbol);
            localStorage.setItem('deephysio_country', targetLocale.country);
            setCurrentLocale(targetLocale.id);
            setCurrencyCode(targetLocale.currencyCode);
            setCurrencySymbol(targetLocale.currencySymbol);
            setCurrentCountry(targetLocale.country);
          }
        }
      } catch (_) {}
    };
    syncClinicCurrency();

    const handleCurrencyEvent = (e) => {
      if (e?.detail?.localeId) {
        setLocale(e.detail.localeId);
      }
    };

    window.addEventListener('deephysio_currency_changed', handleCurrencyEvent);
    return () => {
      isMounted = false;
      window.removeEventListener('deephysio_currency_changed', handleCurrencyEvent);
    };
  }, []);

  const t = (key) => {
    const langDict = translations[currentLang] || translations.en;
    return langDict[key] || translations.en[key] || key;
  };

  const formatCurrency = (val, customSymbol) => {
    return formatCurrencyUtil(val, customSymbol || currencySymbol);
  };

  return (
    <LanguageContext.Provider value={{ 
      currentLang,
      currentLocale,
      currentCountry,
      currencySymbol,
      currencyCode,
      currency: { code: currencyCode, symbol: currencySymbol, name: activeLocaleObj.currencyName },
      activeLocale: activeLocaleObj,
      supportedLocales,
      supportedCountries,
      languages: supportedLanguages,
      setLanguage,
      setLocale,
      formatCurrency,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;
