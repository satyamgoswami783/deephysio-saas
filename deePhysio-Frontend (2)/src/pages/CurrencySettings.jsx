import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaCoins, FaGlobe, 
  FaSave, FaSyncAlt, FaExchangeAlt
} from 'react-icons/fa';
import { useLanguage, supportedCountries, supportedLocales } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';

const CurrencySettings = () => {
  const navigate = useNavigate();
  const { 
    currencyCode: activeCurrencyCode, 
    currencySymbol: activeCurrencySymbol, 
    currentCountry: activeCountry,
    currentLocale,
    setLocale,
    formatCurrency 
  } = useLanguage();
  const { showToast } = useToast();

  const [selectedCountryCode, setSelectedCountryCode] = useState(() => {
    const match = supportedCountries.find(c => c.name === activeCountry || c.currency.code === activeCurrencyCode);
    return match ? match.code : 'IN';
  });

  const [selectedLanguageCode, setSelectedLanguageCode] = useState(() => {
    const matchLocale = supportedLocales.find(l => l.id === currentLocale);
    return matchLocale ? matchLocale.code : 'en';
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load existing clinic currency from database if saved
  useEffect(() => {
    const loadDbSetting = async () => {
      try {
        const res = await fetchApi('/settings?keys=clinicCurrency');
        if (res && res.ok) {
          const json = await res.json();
          const cfg = json?.data?.clinicCurrency;
          if (cfg) {
            if (cfg.countryCode) setSelectedCountryCode(cfg.countryCode);
            if (cfg.languageCode) setSelectedLanguageCode(cfg.languageCode);
          }
        }
      } catch (_) {}
    };
    loadDbSetting();
  }, []);

  const selectedCountryObj = supportedCountries.find(c => c.code === selectedCountryCode) || supportedCountries[0];
  const targetCurrency = selectedCountryObj.currency;

  // Find candidate locales for the chosen country
  const countryLocales = supportedLocales.filter(l => l.countryCode === selectedCountryObj.code);

  const handleCountryChange = (countryCode) => {
    setSelectedCountryCode(countryCode);
    const country = supportedCountries.find(c => c.code === countryCode);
    if (country && country.languages.length > 0) {
      // Default to first language of that country
      setSelectedLanguageCode(country.languages[0].code);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Find matching localeId
      const targetLocale = supportedLocales.find(
        l => l.countryCode === selectedCountryObj.code && l.code === selectedLanguageCode
      ) || countryLocales[0] || supportedLocales[0];

      // 1. Persist to Backend Global/Tenant Settings
      const payload = {
        settings: {
          clinicCurrency: {
            countryCode: selectedCountryObj.code,
            countryName: selectedCountryObj.name,
            currencyCode: targetCurrency.code,
            currencySymbol: targetCurrency.symbol,
            currencyName: targetCurrency.name,
            languageCode: selectedLanguageCode,
            localeId: targetLocale.id,
            updatedAt: new Date().toISOString()
          }
        }
      };

      const res = await fetchApi('/settings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!res?.ok) {
        throw new Error('Failed to update currency settings in database.');
      }

      // 2. Update client context & local storage
      localStorage.setItem('deephysio_locale', targetLocale.id);
      localStorage.setItem('deephysio_language', selectedLanguageCode);
      localStorage.setItem('deephysio_currency', targetCurrency.code);
      localStorage.setItem('deephysio_currency_symbol', targetCurrency.symbol);
      localStorage.setItem('deephysio_country', selectedCountryObj.name);

      window.dispatchEvent(new CustomEvent('deephysio_currency_changed', { detail: { localeId: targetLocale.id } }));
      showToast(`Currency updated to ${targetCurrency.name} (${targetCurrency.code} ${targetCurrency.symbol})!`, 'success');
      setLocale(targetLocale.id);

    } catch (err) {
      showToast(err.message || 'Failed to save currency configuration.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in font-sans">
      {/* ── TOP BREADCRUMB & HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-clinicPrimary hover:border-clinicPrimary/40 flex items-center justify-center transition-all active:scale-95 shadow-xs"
            title="Back to Settings"
          >
            <FaArrowLeft size={13} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                <FaCoins size={10} /> Regional Settings
              </span>
              <span className="text-xs text-slate-400 font-semibold">• Multi-Currency Engine</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Currency & Regional Format
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Choose the primary currency symbol and regional formatting used across invoices, billing, services, and reports.
            </p>
          </div>
        </div>
      </div>

      {/* ── LIVE PREVIEW BANNER ── */}
      {/* ── COMPACT CURRENCY SELECTION CARD ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FaCoins className="text-amber-500" />
            <span>Select System Currency</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Choose your preferred currency from the dropdown below. This will format all bills, receipts, and service pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Currency Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Currency & Country</span>
              <span className="text-[11px] font-semibold text-slate-400 font-mono">
                {targetCurrency.code} ({targetCurrency.symbol})
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedCountryCode}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full h-11 pl-3.5 pr-10 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/15 outline-none transition-all cursor-pointer appearance-none"
              >
                {supportedCountries.map((c) => (
                  <option key={c.code} value={c.code} className="text-slate-800 py-1 font-medium">
                    {c.flag} {c.name} — {c.currency.code} ({c.currency.symbol}) • {c.currency.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                <FaExchangeAlt size={11} className="text-slate-400 rotate-90" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Country: <strong className="text-slate-600">{selectedCountryObj.name}</strong> • Unit: <strong className="text-slate-600">{targetCurrency.name}</strong>
            </p>
          </div>

          {/* Language Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Regional Language</span>
              <span className="text-[11px] font-semibold text-slate-400">
                {selectedCountryObj.languages.length} Available
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedLanguageCode}
                onChange={(e) => setSelectedLanguageCode(e.target.value)}
                disabled={selectedCountryObj.languages.length <= 1}
                className="w-full h-11 pl-3.5 pr-10 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/15 outline-none transition-all cursor-pointer appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {selectedCountryObj.languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-800 py-1 font-medium">
                    {lang.nativeName.includes(lang.name) ? lang.nativeName : `${lang.nativeName} (${lang.name})`}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500">
                <FaGlobe size={12} className="text-slate-400" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Language interface associated with this regional format.
            </p>
          </div>
        </div>

        {/* ── COMPACT PREVIEW BANNER ── */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
              {selectedCountryObj.flag}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">{targetCurrency.name}</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-800 text-xs font-black border border-amber-200">
                  {targetCurrency.code} ({targetCurrency.symbol})
                </span>
                {activeCurrencyCode === targetCurrency.code && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard format display across system: <strong className="text-slate-800">{targetCurrency.symbol === 'د.إ' ? `1,250.00 د.إ` : `${targetCurrency.symbol}1,250.00`}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Zero Total:</span>
            <span className="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-800">
              {targetCurrency.symbol === 'د.إ' ? `0.00 د.إ` : `${targetCurrency.symbol}0.00`}
            </span>
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-clinicPrimary hover:bg-clinicPrimary-dark text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <FaSyncAlt size={12} className="animate-spin" />
                <span>Updating System...</span>
              </>
            ) : (
              <>
                <FaSave size={12} />
                <span>Save & Apply Currency</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurrencySettings;
