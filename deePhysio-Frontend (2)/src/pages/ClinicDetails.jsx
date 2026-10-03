import React, { useEffect, useState, useRef } from 'react';
import { FaClinicMedical, FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaCamera, FaArrowLeft, FaTimes, FaCheck, FaUpload, FaImage, FaCoins } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';
import { useLanguage, supportedCountries, supportedLocales } from '../context/LanguageContext';

const DEFAULT_PROFILE = {
  clinicName: 'Healthcare Clinic',
  phone: '+44 7123 456789',
  email: 'contact@healthcareclinic.com',
  address: '12 Clinical Way, Medical District',
  city: 'London',
  postCode: 'W1G 6AQ',
  logoDataUrl: '',
  taxRate: 20,
  currencyCode: 'INR',
  countryCode: 'IN'
};

const ClinicDetails = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currencyCode, setLocale } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_PROFILE);
  const [showLogoPanel, setShowLogoPanel] = useState(false);
  const fileInputRef = useRef(null);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetchApi('/settings?keys=clinicProfile,clinicCurrency');
        if (!res?.ok) return;
        const json = await res.json();
        if (!json?.success) return;

        const profile = json?.data?.clinicProfile;
        const curr = json?.data?.clinicCurrency;
        if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
          setForm({
            clinicName: profile.clinicName || DEFAULT_PROFILE.clinicName,
            phone: profile.phone || DEFAULT_PROFILE.phone,
            email: profile.email || DEFAULT_PROFILE.email,
            address: profile.address || DEFAULT_PROFILE.address,
            city: profile.city || DEFAULT_PROFILE.city,
            postCode: profile.postCode || DEFAULT_PROFILE.postCode,
            logoDataUrl: profile.logoDataUrl || '',
            taxRate: profile.taxRate !== undefined ? profile.taxRate : DEFAULT_PROFILE.taxRate,
            currencyCode: curr?.currencyCode || profile.currencyCode || DEFAULT_PROFILE.currencyCode,
            countryCode: curr?.countryCode || profile.countryCode || DEFAULT_PROFILE.countryCode
          });
        }
      } catch (e) {
        // Keep defaults on fetch failure.
      }
    };
    loadProfile();
  }, []);



  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file (PNG, JPG, SVG).', 'error');
      return;
    }

    // Validate file size (max 10MB)
    // 10MB in base64 is ~13.3MB, safely under the 15MB express payload limit
    if (file.size > 10 * 1024 * 1024) {
      showToast('Logo must be under 10MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setField('logoDataUrl', event.target.result);
      setShowLogoPanel(false);
      showToast('Custom logo uploaded successfully.', 'success');
    };
    reader.onerror = () => {
      showToast('Failed to read file.', 'error');
    };
    reader.readAsDataURL(file);

    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    setField('logoDataUrl', '');
    showToast('Logo removed.', 'success');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const matchedCountry = supportedCountries.find(c => c.currency.code === form.currencyCode) || supportedCountries[0];
      const matchedLocale = supportedLocales.find(l => l.countryCode === matchedCountry.code) || supportedLocales[0];

      const res = await fetchApi('/settings', {
        method: 'POST',
        body: JSON.stringify({ 
          settings: { 
            clinicProfile: form,
            clinicCurrency: {
              countryCode: matchedCountry.code,
              countryName: matchedCountry.name,
              currencyCode: matchedCountry.currency.code,
              currencySymbol: matchedCountry.currency.symbol,
              currencyName: matchedCountry.currency.name,
              localeId: matchedLocale.id,
              updatedAt: new Date().toISOString()
            }
          } 
        })
      });

      if (!res?.ok) {
        showToast('Failed to save clinic profile.', 'error');
        return;
      }
      const json = await res.json();
      if (!json?.success) {
        showToast(json?.message || 'Failed to save clinic profile.', 'error');
        return;
      }

      setLocale(matchedLocale.id);
      showToast('Clinic profile & currency updated successfully.', 'success');
    } catch (e) {
      showToast('Failed to save clinic profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-3 max-w-4xl mx-auto space-y-4 animate-fade-in font-sans custom-scrollbar select-none">
      {/* Page Header - Ultra Compact */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-clinicPrimary hover:border-clinicPrimary/30 transition-all active:scale-95 flex items-center justify-center group"
            title="Return to Settings"
          >
            <FaArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Clinic Profile</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.15em]">Synced</span>
          </div>
        </div>
      </div>

      {/* Main Content Area - Flat & Compact */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 space-y-6">
          {/* Section 1: Identity & Name Grid */}
          <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6 items-start">
            {/* Logo Upload - Clinical Style */}
            <div className="space-y-2">
              <div 
                className="relative group w-full aspect-square rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-clinicPrimary/40 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden"
                onClick={() => setShowLogoPanel(!showLogoPanel)}
              >
                {form.logoDataUrl ? (
                  <>
                    <img 
                      src={form.logoDataUrl} 
                      alt="Clinic Logo" 
                      className="w-full h-full object-contain p-2 rounded-xl"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                      <FaCamera className="text-white" size={18} />
                      <span className="text-[8px] font-black text-white/90 uppercase tracking-widest">Change</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-clinicPrimary shadow-sm group-hover:scale-110 transition-transform">
                      <FaClinicMedical size={22} />
                    </div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-tight text-center px-2">Master Logo</p>
                    <p className="text-[7px] font-bold text-slate-400 uppercase tracking-wider">Click to add</p>
                  </>
                )}
              </div>

              {/* Remove logo button */}
              {form.logoDataUrl && (
                <button
                  onClick={handleRemoveLogo}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 rounded-lg border border-rose-100 hover:bg-rose-100 transition-all"
                >
                  <FaTimes size={7} /> Remove Logo
                </button>
              )}
            </div>

            {/* Clinic Name Field */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Official Clinic Designation</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-clinicPrimary pointer-events-none transition-colors">
                    <FaClinicMedical size={12}/>
                  </div>
                  <input 
                    type="text" 
                    value={form.clinicName}
                    onChange={(e) => setField('clinicName', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:ring-0 focus:border-clinicPrimary focus:bg-white transition-all" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Communication (Phone)</label>
                  <div className="relative group">
                    <FaPhoneAlt size={11} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-clinicPrimary transition-colors"/>
                    <input 
                      type="text" 
                      value={form.phone}
                      onChange={(e) => setField('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:ring-0 focus:border-clinicPrimary focus:bg-white transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Electronic Node (Email)</label>
                  <div className="relative group">
                    <FaEnvelope size={11} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-clinicPrimary transition-colors"/>
                    <input 
                      type="email" 
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:ring-0 focus:border-clinicPrimary focus:bg-white transition-all" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Logo Selection Panel ── */}
          {showLogoPanel && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <FaImage size={12} className="text-clinicPrimary" /> Select Clinic Logo
                </h3>
                <button 
                  onClick={() => setShowLogoPanel(false)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all"
                >
                  <FaTimes size={10} />
                </button>
              </div>



              {/* Custom Upload Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-clinicPrimary hover:border-clinicPrimary hover:bg-clinicPrimary/5 transition-all group"
                >
                  <FaUpload size={12} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Upload Custom Logo</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <p className="text-[8px] text-slate-400 font-medium text-center">
                Accepted: PNG, JPG, SVG, WebP &bull; Max 10MB &bull; Square logos look best
              </p>
            </div>
          )}

          {/* Section 2: Geographic Vectors */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Central Hub Address</label>
              <div className="relative group">
                <FaMapMarkerAlt size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-clinicPrimary transition-colors"/>
                <input 
                  type="text" 
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:ring-0 focus:border-clinicPrimary focus:bg-white transition-all" 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Metropolis</label>
                <input 
                  type="text" 
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:ring-0 focus:border-clinicPrimary focus:bg-white transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Institutional Post-Code</label>
                <input 
                  type="text" 
                  value={form.postCode}
                  onChange={(e) => setField('postCode', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:ring-0 focus:border-clinicPrimary focus:bg-white transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financial & Currency Settings */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Clinic Currency</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-clinicPrimary transition-colors">
                    <FaCoins size={12} />
                  </div>
                  <select
                    value={form.currencyCode || currencyCode || 'INR'}
                    onChange={(e) => {
                      const code = e.target.value;
                      const matched = supportedCountries.find(c => c.currency.code === code);
                      setField('currencyCode', code);
                      if (matched) {
                        setField('countryCode', matched.code);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:ring-0 focus:border-clinicPrimary focus:bg-white transition-all cursor-pointer"
                  >
                    {supportedCountries.map(c => (
                      <option key={c.code} value={c.currency.code}>
                        {c.flag} {c.name} — {c.currency.name} ({c.currency.code} {c.currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Used across Invoices, Billing & Pricing</span>
                  <button
                    type="button"
                    onClick={() => navigate('/settings/currency')}
                    className="text-clinicPrimary font-bold hover:underline cursor-pointer"
                  >
                    Full Regional Settings &rarr;
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Default Tax Provision (%)</label>
                <input 
                  type="number" 
                  value={form.taxRate}
                  onChange={(e) => setField('taxRate', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:ring-0 focus:border-clinicPrimary focus:bg-white transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Header - Compact Footer Bar */}
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 bg-white hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            Abort
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2.5 bg-clinicPrimary text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm hover:translate-y-[-1px] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Commit Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetails;
