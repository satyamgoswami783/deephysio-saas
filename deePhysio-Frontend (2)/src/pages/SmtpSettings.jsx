import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaEnvelope, FaServer, FaLock, FaKey, 
  FaUser, FaPaperPlane, FaSave, FaSyncAlt, FaCheckCircle, 
  FaExclamationTriangle, FaEye, FaEyeSlash, FaShieldAlt,
  FaGoogle, FaTrashAlt, FaInfoCircle, FaBolt, FaCheck,
  FaTimes, FaQuestionCircle, FaExternalLinkAlt, FaBuilding
} from 'react-icons/fa';
import { fetchApi } from '../config/api';
import { useToast } from '../context/ToastContext';

// 3 Provider Presets as required
const PROVIDERS = [
  {
    id: 'gmail',
    name: 'Gmail / Workspace',
    subTitle: 'Personal Gmail or Google Workspace',
    icon: <FaGoogle className="text-rose-500" size={18} />,
    host: 'smtp.gmail.com',
    port: '587',
    defaultUsername: '',
    usernamePlaceholder: 'e.g. hr@yourcompany.com or yourname@gmail.com',
    passwordPlaceholder: '16-character Google App Password',
    secure: false,
    keyLabel: 'App Password (16-Digit)',
    badgeColor: 'border-rose-200 bg-rose-50 text-rose-700'
  },
  {
    id: 'brevo',
    name: 'Brevo (Sendinblue)',
    subTitle: 'High-Volume Enterprise Email Relay',
    icon: <FaPaperPlane className="text-emerald-500" size={18} />,
    host: 'smtp-relay.brevo.com',
    port: '587',
    defaultUsername: '',
    usernamePlaceholder: 'Your Brevo account login email',
    passwordPlaceholder: 'Brevo SMTP Key (xsmtpib-...) or REST API Key (xkeysib-...)',
    secure: false,
    keyLabel: 'Brevo SMTP Key / API Key',
    badgeColor: 'border-emerald-200 bg-emerald-50 text-emerald-700'
  },
  {
    id: 'resend',
    name: 'Resend (API & SMTP)',
    subTitle: 'Modern Developer Email Relay',
    icon: <FaBolt className="text-amber-500" size={18} />,
    host: 'smtp.resend.com',
    port: '587',
    defaultUsername: 'resend',
    usernamePlaceholder: 'resend (pre-configured)',
    passwordPlaceholder: 'Resend API Key (re_...)',
    secure: false,
    keyLabel: 'Resend API Key (Master Key)',
    badgeColor: 'border-amber-200 bg-amber-50 text-amber-700'
  }
];

const SmtpSettings = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Active provider from DB
  const [activeSavedProvider, setActiveSavedProvider] = useState(null);
  const [hasSavedConfig, setHasSavedConfig] = useState(false);

  // Selected tab in UI
  const [selectedProvider, setSelectedProvider] = useState('gmail');

  // Form Fields
  const [form, setForm] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    fromEmail: '',
    fromName: '',
    isSmtpActive: true,
    secure: false
  });

  const [showPassword, setShowPassword] = useState(false);

  // Modals
  const [showTestModal, setShowTestModal] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testStatus, setTestStatus] = useState(null); // { success: boolean, message: string }
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const currentUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('deephysio_user') || localStorage.getItem('deephysio_user') || '{}');
    } catch (_) {
      return {};
    }
  })();

  // 1. Fetch current clinic SMTP configuration
  const fetchSmtpConfig = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/email-settings');
      if (res && res.ok) {
        const json = await res.json();
        if (json?.success && json?.data) {
          const d = json.data;
          const prov = d.provider || 'gmail';
          
          if (d.hasCustomConfig && d.isSmtpActive) {
            setActiveSavedProvider(prov);
            setHasSavedConfig(true);
          } else if (d.hasCustomConfig) {
            setHasSavedConfig(true);
            setActiveSavedProvider(null);
          } else {
            setHasSavedConfig(false);
            setActiveSavedProvider(null);
          }

          setSelectedProvider(prov);
          setForm({
            smtpHost: d.smtpHost || (PROVIDERS.find(p => p.id === prov)?.host || 'smtp.gmail.com'),
            smtpPort: String(d.smtpPort || '587'),
            smtpUser: d.smtpUser || (PROVIDERS.find(p => p.id === prov)?.defaultUsername || ''),
            smtpPass: d.smtpPass || '',
            fromEmail: d.fromEmail || currentUser?.email || '',
            fromName: d.fromName || currentUser?.tenant?.clinic_name || currentUser?.clinicName || 'HR Department',
            isSmtpActive: d.isSmtpActive !== false,
            secure: Boolean(d.secure || String(d.smtpPort) === '465')
          });

          if (!testRecipient) {
            setTestRecipient(currentUser?.email || d.fromEmail || '');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load SMTP config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmtpConfig();
  }, []);

  // 2. Tab Switch Handler
  const handleSelectTab = (providerId) => {
    setSelectedProvider(providerId);
    const preset = PROVIDERS.find(p => p.id === providerId);
    if (!preset) return;

    setForm(prev => ({
      ...prev,
      smtpHost: preset.host,
      smtpPort: preset.port,
      secure: preset.secure,
      smtpUser: preset.defaultUsername || (prev.smtpUser === 'resend' ? '' : prev.smtpUser)
    }));
  };

  // 3. Field updater
  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // 4. Save Settings Handler (Button 3)
  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!form.smtpHost && form.isSmtpActive) {
      showToast('Please specify SMTP Server Host.', 'error');
      return;
    }
    if (!form.smtpUser && selectedProvider !== 'brevo') {
      showToast('Please specify SMTP Username.', 'error');
      return;
    }
    if (!form.smtpPass) {
      showToast('Please enter your SMTP Password or API Key.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        provider: selectedProvider,
        ...form
      };

      const res = await fetchApi('/email-settings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        showToast(data.message || 'Email SMTP settings saved and activated!', 'success');
        if (form.isSmtpActive) {
          setActiveSavedProvider(selectedProvider);
        } else {
          setActiveSavedProvider(null);
        }
        setHasSavedConfig(true);
      } else {
        showToast(data?.message || 'Failed to save SMTP settings.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Network error while saving settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 5. Test Connection Handler (Button 1)
  const handleExecuteTest = async () => {
    const targetEmail = testRecipient.trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      showToast('Please enter a valid recipient email address for testing.', 'error');
      return;
    }

    setTesting(true);
    setTestStatus(null);

    try {
      const payload = {
        provider: selectedProvider,
        ...form,
        recipientEmail: targetEmail
      };

      const res = await fetchApi('/email-settings/test', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        setTestStatus({
          success: true,
          message: data.message || `Test verification email sent successfully to ${targetEmail}!`
        });
        showToast('SMTP Test Passed! Verification email dispatched.', 'success');
      } else {
        setTestStatus({
          success: false,
          message: data?.message || 'SMTP Authentication Failed. Please check Host, Port, Username, and Password.'
        });
        showToast(data?.message || 'SMTP Connection Test Failed', 'error');
      }
    } catch (err) {
      setTestStatus({
        success: false,
        message: err.message || 'Could not connect to SMTP server. Verify network access and firewall rules.'
      });
      showToast('Connection error during SMTP test.', 'error');
    } finally {
      setTesting(false);
    }
  };

  // 6. Remove SMTP Handler (Button 4)
  const handleRemoveSmtp = async () => {
    setRemoving(true);
    try {
      const res = await fetchApi('/email-settings/remove', {
        method: 'POST'
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        showToast(data.message || 'Custom SMTP removed. Shifted to system default mailer.', 'success');
        setActiveSavedProvider(null);
        setHasSavedConfig(false);
        setShowRemoveModal(false);
        
        // Reset form to clean default
        setSelectedProvider('gmail');
        setForm({
          smtpHost: 'smtp.gmail.com',
          smtpPort: '587',
          smtpUser: '',
          smtpPass: '',
          fromEmail: currentUser?.email || '',
          fromName: currentUser?.tenant?.clinic_name || 'HR Department',
          isSmtpActive: true,
          secure: false
        });
      } else {
        showToast(data?.message || 'Failed to remove custom SMTP.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Network error while removing credentials.', 'error');
    } finally {
      setRemoving(false);
    }
  };

  const currentPreset = PROVIDERS.find(p => p.id === selectedProvider) || PROVIDERS[0];

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-slate-400">
        <FaSyncAlt size={24} className="animate-spin text-clinicPrimary" />
        <span className="text-xs font-bold text-slate-600">Loading Email SMTP Gateway...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-sans">
      
      {/* ── TOP HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-clinicPrimary hover:border-clinicPrimary/40 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
            title="Return to Settings"
          >
            <FaArrowLeft size={13} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                <FaEnvelope size={10} /> Outbound Mail Gateway
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <FaShieldAlt size={9} /> AES-256 Encrypted
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Email SMTP Settings
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Connect your company's official email address for automatic E-payslips, announcements, leave alerts, and system database backups.
            </p>
          </div>
        </div>

        {/* Top Action Buttons (Button 1: Test Connection & Button 2: Toggle & Button 4: Remove) */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Button 2: SMTP Delivery Status Toggle Switch */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-700">Delivery Status:</span>
            <button
              type="button"
              onClick={() => setField('isSmtpActive', !form.isSmtpActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                form.isSmtpActive ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
              title={form.isSmtpActive ? 'Emails Active (Click to pause)' : 'Emails Paused (Click to activate)'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  form.isSmtpActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-[11px] font-black tracking-wide ${form.isSmtpActive ? 'text-emerald-700' : 'text-slate-400'}`}>
              {form.isSmtpActive ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>

          {/* Button 1: Test Connection (Top Right) */}
          <button
            type="button"
            onClick={() => {
              setShowTestModal(true);
              setTestStatus(null);
            }}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-clinicPrimary hover:border-clinicPrimary/40 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <FaPaperPlane size={11} className="text-clinicPrimary" />
            <span>Test Connection</span>
          </button>

          {/* Button 4: Remove SMTP (Red Trash Icon) */}
          {hasSavedConfig && (
            <button
              type="button"
              onClick={() => setShowRemoveModal(true)}
              className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Remove Custom SMTP & Revert to System Mailer"
            >
              <FaTrashAlt size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── 2. PROVIDER SELECTION TABS (3 OPTIONS) ── */}
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-700 tracking-wider uppercase block">
          Select Email Service Provider
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROVIDERS.map((provider) => {
            const isSelected = selectedProvider === provider.id;
            const isActiveSaved = activeSavedProvider === provider.id;

            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => handleSelectTab(provider.id)}
                className={`relative text-left p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected 
                    ? 'border-clinicPrimary bg-indigo-50/40 shadow-sm ring-2 ring-clinicPrimary/15'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                {/* Active Status Badge if currently saved and running in DB */}
                {isActiveSaved && (
                  <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs animate-pulse">
                    <FaCheck size={8} /> ACTIVE
                  </span>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                    {provider.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      {provider.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {provider.subTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span className="font-mono text-slate-600 font-semibold">{provider.host}</span>
                  <span className="font-mono font-bold text-slate-400">Port {provider.port}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. INPUT FIELDS & CONFIGURATION CARD ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{currentPreset.name} Configuration</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in your account credentials. All secrets are stored with AES-256 encryption.
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${currentPreset.badgeColor}`}>
            {currentPreset.name} Preset
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Field 1: SMTP Host */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FaServer size={11} className="text-slate-400" />
                <span>SMTP Host</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.smtpHost}
                onChange={(e) => setField('smtpHost', e.target.value)}
                placeholder="e.g. smtp.gmail.com"
                className="w-full h-11 px-3.5 bg-slate-50 focus:bg-white text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/15 outline-none font-mono transition-all"
              />
              <p className="text-[11px] text-slate-400">
                Server address for outgoing mail protocol.
              </p>
            </div>

            {/* Field 2: SMTP Port */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FaLock size={11} className="text-slate-400" />
                <span>SMTP Port</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  required
                  value={form.smtpPort}
                  onChange={(e) => {
                    const port = e.target.value;
                    setField('smtpPort', port);
                    setField('secure', port === '465');
                  }}
                  placeholder="587"
                  className="w-28 h-11 px-3.5 bg-slate-50 focus:bg-white text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/15 outline-none font-mono transition-all"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setField('smtpPort', '587');
                      setField('secure', false);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      form.smtpPort === '587'
                        ? 'bg-clinicPrimary/10 border-clinicPrimary text-clinicPrimary'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    587 (TLS / STARTTLS)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setField('smtpPort', '465');
                      setField('secure', true);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      form.smtpPort === '465'
                        ? 'bg-clinicPrimary/10 border-clinicPrimary text-clinicPrimary'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    465 (SSL)
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Recommended: <strong>587</strong> for STARTTLS, <strong>465</strong> for SSL.
              </p>
            </div>

            {/* Field 3: SMTP Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FaUser size={11} className="text-slate-400" />
                <span>SMTP Username / Account ID</span>
                {selectedProvider !== 'brevo' && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="text"
                value={form.smtpUser}
                onChange={(e) => setField('smtpUser', e.target.value)}
                placeholder={currentPreset.usernamePlaceholder}
                className="w-full h-11 px-3.5 bg-slate-50 focus:bg-white text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/15 outline-none transition-all"
              />
              <p className="text-[11px] text-slate-400">
                {selectedProvider === 'resend' 
                  ? 'Resend requires username to be literally "resend".' 
                  : 'Your account login email or SMTP identity.'}
              </p>
            </div>

            {/* Field 4: SMTP Password / Master Key with Eye Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FaKey size={11} className="text-slate-400" />
                  <span>{currentPreset.keyLabel}</span>
                  <span className="text-rose-500">*</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-500 hover:text-clinicPrimary font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {showPassword ? <><FaEyeSlash size={12} /> Hide</> : <><FaEye size={12} /> Show</>}
                </button>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.smtpPass}
                  onChange={(e) => setField('smtpPass', e.target.value)}
                  placeholder={currentPreset.passwordPlaceholder}
                  className="w-full h-11 pl-3.5 pr-10 bg-slate-50 focus:bg-white text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/15 outline-none font-mono transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Mask Password' : 'Unmask Password'}
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Never use your regular account password. Use an App Password or API Key.
              </p>
            </div>

            {/* Field 5: Sender Email (From: Header) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FaEnvelope size={11} className="text-slate-400" />
                <span>Sender Email (From:)</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.fromEmail}
                onChange={(e) => setField('fromEmail', e.target.value)}
                placeholder="e.g. hr@yourcompany.com"
                className="w-full h-11 px-3.5 bg-slate-50 focus:bg-white text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/15 outline-none transition-all"
              />
              <p className="text-[11px] text-slate-400">
                Email address recipients will see in the "From" header.
              </p>
            </div>

            {/* Field 6: Sender Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FaBuilding size={11} className="text-slate-400" />
                <span>Sender Display Name</span>
              </label>
              <input
                type="text"
                value={form.fromName}
                onChange={(e) => setField('fromName', e.target.value)}
                placeholder="e.g. HR Department - Sonu & Sons"
                className="w-full h-11 px-3.5 bg-slate-50 focus:bg-white text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/15 outline-none transition-all"
              />
              <p className="text-[11px] text-slate-400">
                Friendly sender name shown in inbox (e.g. your Clinic or HR team).
              </p>
            </div>

          </div>

          {/* Bottom Bar: Button 3 Save Settings */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FaShieldAlt className="text-emerald-600" size={13} />
              <span>Passwords are securely encrypted using <strong>AES-256</strong> before being stored.</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-clinicPrimary hover:bg-clinicPrimary-dark text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <FaSyncAlt size={12} className="animate-spin" />
                  <span>Saving & Encrypting...</span>
                </>
              ) : (
                <>
                  <FaSave size={13} />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── 5. SETUP GUIDE BOX (DYNAMIC ACCORDION / STEP-BY-STEP) ── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-7 shadow-md space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-700/60">
          <div className="w-8 h-8 rounded-lg bg-clinicPrimary/20 text-clinicPrimary flex items-center justify-center">
            <FaQuestionCircle size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              <span>Setup Guide for {currentPreset.name}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Follow these simple steps to obtain your credentials in under 2 minutes.
            </p>
          </div>
        </div>

        {/* Dynamic Guide Content based on Selected Tab */}
        {selectedProvider === 'gmail' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs pt-1">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-[10px]">1</span>
              <h4 className="font-bold text-slate-200">Google Security</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Open <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-sky-400 underline inline-flex items-center gap-1">Google Security <FaExternalLinkAlt size={8} /></a> for your account.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-[10px]">2</span>
              <h4 className="font-bold text-slate-200">2-Step Verification</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Ensure <strong>2-Step Verification</strong> is switched ON under "How you sign in to Google".
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-[10px]">3</span>
              <h4 className="font-bold text-slate-200">App Passwords</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Search <strong>App Passwords</strong> in the search bar. Create an entry named "HRM / Clinic Mailer".
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-[10px]">4</span>
              <h4 className="font-bold text-slate-200">Paste 16-Digit Code</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Copy the generated 16-character code (without spaces) and paste it into the <strong>Password</strong> field above.
              </p>
            </div>
          </div>
        )}

        {selectedProvider === 'brevo' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs pt-1">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">1</span>
              <h4 className="font-bold text-slate-200">Brevo Dashboard</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Login to your account at <a href="https://app.brevo.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline inline-flex items-center gap-1">app.brevo.com <FaExternalLinkAlt size={8} /></a>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">2</span>
              <h4 className="font-bold text-slate-200">Verify Sender Domain</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Go to <strong>Senders, Domains & Dedicated IPs</strong> to verify your official From: email address.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">3</span>
              <h4 className="font-bold text-slate-200">SMTP & API Keys</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Click your profile icon on the top right and select <strong>SMTP & API Keys</strong>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">4</span>
              <h4 className="font-bold text-slate-200">Generate Master Key</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Generate an SMTP Key (starting with <code className="text-emerald-300">xsmtpib-</code>) or API Key (<code className="text-emerald-300">xkeysib-</code>) and paste above.
              </p>
            </div>
          </div>
        )}

        {selectedProvider === 'resend' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs pt-1">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">1</span>
              <h4 className="font-bold text-slate-200">Resend Dashboard</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Sign in to <a href="https://resend.com/overview" target="_blank" rel="noreferrer" className="text-amber-400 underline inline-flex items-center gap-1">resend.com <FaExternalLinkAlt size={8} /></a>.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">2</span>
              <h4 className="font-bold text-slate-200">Add Sending Domain</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                In <strong>Domains</strong>, add your company domain and verify DNS records (SPF, DKIM, DMARC).
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">3</span>
              <h4 className="font-bold text-slate-200">Create API Key</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Go to <strong>API Keys</strong> tab and click <strong>"Create API Key"</strong> with "Full Access".
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px]">4</span>
              <h4 className="font-bold text-slate-200">Paste Key</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Copy the generated key (starts with <code className="text-amber-300">re_</code>) and paste it into the Master Key field.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── TEST CONNECTION MODAL ── */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-clinicPrimary flex items-center justify-center">
                  <FaPaperPlane size={13} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Test SMTP Connection</h3>
                  <p className="text-[11px] text-slate-500">Dispatch an instant live verification email</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Send Test Email To:
                </label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="Enter recipient email address"
                  className="w-full h-11 px-3.5 bg-slate-50 focus:bg-white text-slate-800 text-sm font-semibold rounded-xl border border-slate-200 focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/15 outline-none transition-all"
                />
                <p className="text-[11px] text-slate-400">
                  A verification email will be dispatched from <strong>{form.fromEmail || form.smtpUser || 'your SMTP'}</strong>.
                </p>
              </div>

              {testStatus && (
                <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
                  testStatus.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {testStatus.success ? (
                    <FaCheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                  ) : (
                    <FaExclamationTriangle className="text-rose-500 shrink-0 mt-0.5" size={14} />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold">{testStatus.success ? 'Verification Passed!' : 'Connection Failed'}</p>
                    <p className="text-[11px] leading-relaxed opacity-90">{testStatus.message}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteTest}
                disabled={testing || !testRecipient}
                className="px-5 py-2.5 bg-clinicPrimary hover:bg-clinicPrimary-dark text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {testing ? (
                  <>
                    <FaSyncAlt size={12} className="animate-spin" />
                    <span>Verifying SMTP...</span>
                  </>
                ) : (
                  <>
                    <FaPaperPlane size={11} />
                    <span>Send Verification Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REMOVE SMTP CONFIRMATION MODAL ── */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scale-up border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
              <FaTrashAlt size={20} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">Remove Custom SMTP?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove your custom SMTP credentials? Your organization will revert to the <strong>system default mailer</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRemoveModal(false)}
                disabled={removing}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveSmtp}
                disabled={removing}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                {removing ? <FaSyncAlt size={12} className="animate-spin" /> : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SmtpSettings;
