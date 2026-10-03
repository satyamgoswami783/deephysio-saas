import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaBuilding, FaLock, FaBullhorn, FaCreditCard, FaEnvelope, FaSms, FaCheckCircle, FaSyncAlt, FaBell, FaHdd, FaShieldAlt, FaRobot, FaCloud, FaGlobe, FaDatabase, FaClock } from 'react-icons/fa';
import { fetchApi } from '../../config/api';
import { useToast } from '../../context/ToastContext';

const Toggle = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" className="sr-only peer" checked={checked || false} onChange={onChange} />
    <div className={`w-8 h-4 rounded-full peer ${checked ? 'bg-blue-500' : 'bg-slate-200'} after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-3 after:w-3 after:transition-all ${checked ? 'after:translate-x-4' : ''}`}></div>
  </label>
);

const notificationItems = [
  { title: 'Welcome Note', sub: 'Sent automatically to new members on registration.' },
  { title: 'Invoice Bills', sub: 'Sent automatically to members when recording a plan payment.' },
  { title: 'Marketing Campaigns', sub: 'Sent for scheduled marketing campaigns or blasts.' },
  { title: 'Free Trial Registration Alerts', sub: 'Sent automatically to the Super Admin when a new Clinic registers for a free trial.' },
  { title: 'Paid Subscription Expiry / Renewal Alerts', sub: 'Sent automatically to Clinic Admins (Owners) when their SaaS plan is expiring.' },
  { title: 'Paid Payment Invoice / Receipt', sub: 'Sent automatically to Clinic Owners with PDF Tax Invoice link when subscription payment is received.' }
];

const SystemSettings = () => {
  const navigate = useNavigate();
  const toastCtx = useToast();
  const showToast = toastCtx?.showToast || console.log;

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({ name: '', email: '', photo: '' });
  const [business, setBusiness] = useState({ businessName: '', gstNumber: '', mobileNumber: '', businessAddress: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [notifications, setNotifications] = useState({});

  // Feature 2: Gateway Configuration
  const [gatewayConfig, setGatewayConfig] = useState({
    provider: 'razorpay',
    mode: 'test',
    razorpayKeyId: '',
    razorpayKeySecret: '',
    stripePublishableKey: '',
    stripeSecretKey: '',
    upiId: ''
  });
  const [testingGateway, setTestingGateway] = useState(false);

  // Feature 3: Email & SMS Gateway Configuration
  const [emailConfig, setEmailConfig] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    fromEmail: '',
    fromName: 'DeePhysio SaaS'
  });
  const [smsConfig, setSmsConfig] = useState({
    provider: 'twilio',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '',
    msg91AuthKey: '',
    msg91SenderId: ''
  });
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);

  // Feature 15: Push Notifications
  const [pushConfig, setPushConfig] = useState({
    provider: 'fcm',
    fcmServerKey: '',
    fcmProjectId: '',
    webPushPublicKey: '',
    webPushPrivateKey: '',
    oneSignalAppId: '',
    oneSignalApiKey: '',
    isPushActive: true
  });
  const [testingPush, setTestingPush] = useState(false);

  // Feature 16: Cloud Storage Settings
  const [storageConfig, setStorageConfig] = useState({
    provider: 'local',
    s3Bucket: '',
    s3Region: 'ap-south-1',
    s3AccessKey: '',
    s3SecretKey: '',
    gcsBucket: '',
    gcsProjectId: '',
    cloudinaryCloudName: '',
    cloudinaryApiKey: '',
    cloudinaryApiSecret: '',
    customEndpoint: '',
    maxUploadSizeMb: 25
  });
  const [testingStorage, setTestingStorage] = useState(false);

  // Feature 17: Google reCAPTCHA
  const [recaptchaConfig, setRecaptchaConfig] = useState({
    isEnabled: false,
    version: 'v3',
    siteKey: '',
    secretKey: '',
    scoreThreshold: 0.5,
    protectLogin: true,
    protectRegister: true,
    protectForgotPassword: true
  });

  // Feature: Automated 7-Day Admin Email Backup
  const [autoBackupConfig, setAutoBackupConfig] = useState({
    enabled: true,
    frequency: 'EVERY_7_DAYS',
    executionTime: '02:00',
    nextRunAt: null
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetchApi('/saas/settings');
      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setProfile(resJson.data.profile || { name: '', email: '', photo: '' });
        setBusiness(resJson.data.business || { businessName: '', gstNumber: '', mobileNumber: '', businessAddress: '' });
        
        let notifs = resJson.data.notifications || {};
        if (Object.keys(notifs).length === 0) {
          notificationItems.forEach(item => {
            notifs[item.title] = { email: true, whatsapp: true, push: true };
          });
        }
        setNotifications(notifs);
      }

      // Load Gateway
      const gRes = await fetchApi('/settings/gateway');
      const gJson = await gRes.json();
      if (gJson.success && gJson.data) {
        setGatewayConfig(prev => ({ ...prev, ...gJson.data }));
      }

      // Load Email & SMS
      const esRes = await fetchApi('/settings/email-sms');
      const esJson = await esRes.json();
      if (esJson.success && esJson.data) {
        if (esJson.data.email) setEmailConfig(prev => ({ ...prev, ...esJson.data.email }));
        if (esJson.data.sms) setSmsConfig(prev => ({ ...prev, ...esJson.data.sms }));
      }

      // Load Push Notifications
      const pRes = await fetchApi('/settings/push-notification');
      const pJson = await pRes.json();
      if (pJson.success && pJson.data) {
        setPushConfig(prev => ({ ...prev, ...pJson.data }));
      }

      // Load Storage
      const sRes = await fetchApi('/settings/storage');
      const sJson = await sRes.json();
      if (sJson.success && sJson.data) {
        setStorageConfig(prev => ({ ...prev, ...sJson.data }));
      }

      // Load reCAPTCHA
      const rRes = await fetchApi('/settings/recaptcha');
      const rJson = await rRes.json();
      if (rJson.success && rJson.data) {
        setRecaptchaConfig(prev => ({ ...prev, ...rJson.data }));
      }

      // Load Auto-Backup Schedule
      try {
        const bRes = await fetchApi('/backup/schedule');
        const bJson = await bRes.json();
        if (bJson.success && bJson.data) {
          setAutoBackupConfig(bJson.data);
        }
      } catch (e) {}
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoBackup = async (newVal) => {
    try {
      const updated = { ...autoBackupConfig, enabled: newVal };
      setAutoBackupConfig(updated);
      const res = await fetchApi('/backup/schedule', {
        method: 'POST',
        body: JSON.stringify({ enabled: newVal })
      });
      const data = await res.json();
      if (data?.success) {
        showToast(newVal ? 'Automatic 7-Day Email Backup enabled!' : 'Automatic 7-Day Email Backup paused.', 'success');
        if (data.data) setAutoBackupConfig(data.data);
      } else {
        showToast('Failed to update backup scheduler.', 'error');
      }
    } catch (err) {
      showToast('Error updating backup schedule.', 'error');
    }
  };

  const handleSaveGateway = async () => {
    try {
      const res = await fetchApi('/settings/gateway', {
        method: 'POST',
        body: JSON.stringify(gatewayConfig)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Payment Gateway settings saved successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to save gateway settings', 'error');
      }
    } catch (e) {
      showToast('Error saving gateway settings', 'error');
    }
  };

  const handleTestGateway = async () => {
    setTestingGateway(true);
    try {
      const res = await fetchApi('/settings/gateway/test', {
        method: 'POST',
        body: JSON.stringify({
          provider: gatewayConfig.provider,
          keyId: gatewayConfig.razorpayKeyId,
          keySecret: gatewayConfig.razorpayKeySecret
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Gateway connection test passed!', 'success');
      } else {
        showToast(data.message || 'Gateway test failed', 'error');
      }
    } catch (e) {
      showToast('Gateway connection error', 'error');
    } finally {
      setTestingGateway(false);
    }
  };

  const handleSaveEmailSms = async () => {
    try {
      const res = await fetchApi('/settings/email-sms', {
        method: 'POST',
        body: JSON.stringify({ email: emailConfig, sms: smsConfig })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Email & SMS Gateway settings saved!', 'success');
      } else {
        showToast(data.message || 'Failed to save settings', 'error');
      }
    } catch (e) {
      showToast('Error saving email/sms settings', 'error');
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await fetchApi('/settings/test-email', {
        method: 'POST',
        body: JSON.stringify({ recipientEmail: testEmailAddress })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Test email dispatched successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to send test email', 'error');
      }
    } catch (e) {
      showToast('Test email dispatch failed', 'error');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSms = async () => {
    setTestingSms(true);
    try {
      const res = await fetchApi('/settings/test-sms', {
        method: 'POST',
        body: JSON.stringify({ recipientPhone: testPhoneNumber })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Test SMS dispatched successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to send test SMS', 'error');
      }
    } catch (e) {
      showToast('Test SMS dispatch failed', 'error');
    } finally {
      setTestingSms(false);
    }
  };

  // Push Handlers
  const handleSavePush = async () => {
    try {
      const res = await fetchApi('/settings/push-notification', {
        method: 'POST',
        body: JSON.stringify(pushConfig)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Push notification settings saved!', 'success');
      } else {
        showToast(data.message || 'Failed to save push settings', 'error');
      }
    } catch (e) {
      showToast('Error saving push notification settings', 'error');
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      const res = await fetchApi('/settings/test-push', {
        method: 'POST',
        body: JSON.stringify({ title: 'DeePhysio SaaS Test', body: 'Test push notification fired successfully.' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Push notification sent successfully!', 'success');
      } else {
        showToast(data.message || 'Push test failed', 'error');
      }
    } catch (e) {
      showToast('Push notification test failed', 'error');
    } finally {
      setTestingPush(false);
    }
  };

  // Storage Handlers
  const handleSaveStorage = async () => {
    try {
      const res = await fetchApi('/settings/storage', {
        method: 'POST',
        body: JSON.stringify(storageConfig)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Storage settings updated successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to save storage settings', 'error');
      }
    } catch (e) {
      showToast('Error saving storage configuration', 'error');
    }
  };

  const handleTestStorage = async () => {
    setTestingStorage(true);
    try {
      const res = await fetchApi('/settings/storage/test', {
        method: 'POST',
        body: JSON.stringify({ provider: storageConfig.provider })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Storage connection test passed!', 'success');
      } else {
        showToast(data.message || 'Storage test failed', 'error');
      }
    } catch (e) {
      showToast('Storage test error', 'error');
    } finally {
      setTestingStorage(false);
    }
  };

  // reCAPTCHA Handlers
  const handleSaveRecaptcha = async () => {
    try {
      const res = await fetchApi('/settings/recaptcha', {
        method: 'POST',
        body: JSON.stringify(recaptchaConfig)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Google reCAPTCHA settings saved successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to save reCAPTCHA settings', 'error');
      }
    } catch (e) {
      showToast('Error saving reCAPTCHA settings', 'error');
    }
  };

  const handleSaveProfileBusiness = async () => {
    try {
      const response = await fetchApi('/saas/settings', {
        method: 'PUT',
        body: JSON.stringify({ profile, business })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Profile and Business details updated!', 'success');
      } else {
        showToast(data.message || 'Failed to update settings', 'error');
      }
    } catch (error) {
      showToast('An error occurred while saving.', 'error');
    }
  };

  const handleSavePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      showToast('Please fill all password fields.', 'error');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    try {
      const response = await fetchApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Password updated successfully!', 'success');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.message || 'Failed to update password', 'error');
      }
    } catch (e) {
      showToast('Error updating password', 'error');
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50/50 min-h-screen space-y-6 font-sans animate-fade-in custom-scrollbar max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 tracking-tight">SaaS System & Gateway Hub</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Configure Payment Gateways, Email/SMS Dispatchers, Security, and Global Profile.</p>
      </div>

      {/* 🌍 0. SUPPORTED COUNTRIES, CURRENCIES & LANGUAGES MATRIX */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaGlobe className="text-teal-600" />
            <h2 className="font-bold text-slate-800 text-sm">Supported Countries, Currencies & Languages (Localization Matrix)</h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase">6 Regions Active</span>
        </div>
        <div className="p-6">
          <p className="text-xs text-slate-500 mb-4 font-medium">
            Strict configuration active: Only the following countries, currencies, and languages are enabled across the SaaS platform. All extraneous languages have been removed.
          </p>
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4">Country</th>
                  <th className="py-2.5 px-4">Currency Code & Symbol</th>
                  <th className="py-2.5 px-4">Supported Languages</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-bold">1</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇮🇳</span>
                      <span className="font-bold text-slate-900">India</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-black border border-emerald-200/60">
                      INR (₹)
                    </span>
                    <span className="text-slate-500 ml-2 font-medium">Indian Rupee</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex gap-1.5">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">हिन्दी (Hindi)</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">English</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Active</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-bold">2</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇺🇸</span>
                      <span className="font-bold text-slate-900">USA</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-black border border-blue-200/60">
                      USD ($)
                    </span>
                    <span className="text-slate-500 ml-2 font-medium">US Dollar</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">English</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Active</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-bold">3</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇬🇧</span>
                      <span className="font-bold text-slate-900">UK</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-black border border-indigo-200/60">
                      GBP (£)
                    </span>
                    <span className="text-slate-500 ml-2 font-medium">Pound Sterling</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">English</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Active</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-bold">4</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇦🇪</span>
                      <span className="font-bold text-slate-900">UAE</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-black border border-amber-200/60">
                      AED (د.إ)
                    </span>
                    <span className="text-slate-500 ml-2 font-medium">UAE Dirham</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex gap-1.5">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">العربية (Arabic)</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">English</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Active</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-bold">5</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇩🇪</span>
                      <span className="font-bold text-slate-900">Germany</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-black border border-purple-200/60">
                      EUR (€)
                    </span>
                    <span className="text-slate-500 ml-2 font-medium">Euro</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">Deutsch (German)</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Active</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-center text-slate-400 font-bold">6</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🇪🇸</span>
                      <span className="font-bold text-slate-900">Spain</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-black border border-purple-200/60">
                      EUR (€)
                    </span>
                    <span className="text-slate-500 ml-2 font-medium">Euro</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold">Spanish (Español)</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Active</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 💳 1. PAYMENT GATEWAY CONFIGURATION */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCreditCard className="text-blue-600" />
            <h2 className="font-bold text-slate-800 text-sm">Payment Gateway Management (Razorpay / Stripe / UPI)</h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">Gateway Suite</span>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Active Gateway Provider</label>
              <select
                value={gatewayConfig.provider}
                onChange={e => setGatewayConfig({ ...gatewayConfig, provider: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 bg-slate-50 outline-none"
              >
                <option value="razorpay">Razorpay Live / Test</option>
                <option value="stripe">Stripe Payments</option>
                <option value="upi">Direct UPI QR Gateway</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Environment Mode</label>
              <select
                value={gatewayConfig.mode}
                onChange={e => setGatewayConfig({ ...gatewayConfig, mode: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 bg-slate-50 outline-none"
              >
                <option value="live">Live Production Mode</option>
                <option value="test">Sandbox / Test Mode</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Razorpay Key ID</label>
              <input
                type="text"
                value={gatewayConfig.razorpayKeyId || ''}
                onChange={e => setGatewayConfig({ ...gatewayConfig, razorpayKeyId: e.target.value })}
                placeholder="rzp_live_..."
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 bg-slate-50 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Razorpay Key Secret</label>
              <input
                type="password"
                value={gatewayConfig.razorpayKeySecret || ''}
                onChange={e => setGatewayConfig({ ...gatewayConfig, razorpayKeySecret: e.target.value })}
                placeholder="••••••••••••••••"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono text-slate-800 bg-slate-50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Clinic UPI ID (for QR receipts)</label>
              <input
                type="text"
                value={gatewayConfig.upiId || ''}
                onChange={e => setGatewayConfig({ ...gatewayConfig, upiId: e.target.value })}
                placeholder="clinic@okaxis"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 bg-slate-50 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <button
              onClick={handleTestGateway}
              disabled={testingGateway}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
            >
              {testingGateway ? 'Verifying Gateway...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSaveGateway}
              className="btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
            >
              Save Gateway Config
            </button>
          </div>
        </div>
      </div>

      {/* ✉️ 2. EMAIL & SMS GATEWAY CONFIGURATION */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaEnvelope className="text-emerald-600" />
            <h2 className="font-bold text-slate-800 text-sm">Email & SMS Gateways (SMTP / Twilio / MSG91)</h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">Messaging Node</span>
        </div>
        <div className="p-6 space-y-6">
          {/* SMTP */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FaEnvelope size={12} className="text-clinicPrimary" /> SMTP Email Server Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={emailConfig.smtpHost}
                  onChange={e => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">SMTP Port</label>
                <input
                  type="text"
                  value={emailConfig.smtpPort}
                  onChange={e => setEmailConfig({ ...emailConfig, smtpPort: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">SMTP Username</label>
                <input
                  type="text"
                  value={emailConfig.smtpUser}
                  onChange={e => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">SMTP Password</label>
                <input
                  type="password"
                  value={emailConfig.smtpPass}
                  onChange={e => setEmailConfig({ ...emailConfig, smtpPass: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-mono"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="email"
                placeholder="Test recipient email address..."
                value={testEmailAddress}
                onChange={e => setTestEmailAddress(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50"
              />
              <button
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                {testingEmail ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>

          {/* SMS */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FaSms size={14} className="text-blue-500" /> SMS Dispatcher (Twilio / MSG91)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Twilio Account SID</label>
                <input
                  type="text"
                  value={smsConfig.twilioAccountSid}
                  onChange={e => setSmsConfig({ ...smsConfig, twilioAccountSid: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Twilio Auth Token</label>
                <input
                  type="password"
                  value={smsConfig.twilioAuthToken}
                  onChange={e => setSmsConfig({ ...smsConfig, twilioAuthToken: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Twilio Phone Number</label>
                <input
                  type="text"
                  value={smsConfig.twilioPhoneNumber}
                  onChange={e => setSmsConfig({ ...smsConfig, twilioPhoneNumber: e.target.value })}
                  placeholder="+1234567890"
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="tel"
                placeholder="Test phone number (+91...)..."
                value={testPhoneNumber}
                onChange={e => setTestPhoneNumber(e.target.value)}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-slate-50"
              />
              <button
                onClick={handleTestSms}
                disabled={testingSms}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                {testingSms ? 'Sending...' : 'Send Test SMS'}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handleSaveEmailSms}
              className="btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
            >
              Save Email & SMS Settings
            </button>
          </div>
        </div>
      </div>

      {/* 🔔 3. PUSH NOTIFICATION GATEWAY (FEATURE 15) */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaBell className="text-purple-600" />
            <h2 className="font-bold text-slate-800 text-sm">Push Notification Suite (FCM / Web Push / OneSignal / Expo)</h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">Push Dispatcher</span>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Push Provider</label>
              <select
                value={pushConfig.provider}
                onChange={e => setPushConfig({ ...pushConfig, provider: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none font-bold"
              >
                <option value="fcm">Firebase Cloud Messaging (FCM)</option>
                <option value="webpush">Standard Web Push (VAPID)</option>
                <option value="onesignal">OneSignal Push API</option>
                <option value="expo">Expo Mobile Push Gateway</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Push Service Status</label>
              <div className="flex items-center gap-3 pt-2">
                <Toggle
                  checked={pushConfig.isPushActive}
                  onChange={e => setPushConfig({ ...pushConfig, isPushActive: e.target.checked })}
                />
                <span className="text-xs font-bold text-slate-700">{pushConfig.isPushActive ? 'Active (Dispatching Enabled)' : 'Disabled'}</span>
              </div>
            </div>
          </div>

          {pushConfig.provider === 'fcm' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">FCM Project ID</label>
                <input
                  type="text"
                  placeholder="deephysio-app-prod"
                  value={pushConfig.fcmProjectId}
                  onChange={e => setPushConfig({ ...pushConfig, fcmProjectId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">FCM Server Key / Service Token</label>
                <input
                  type="password"
                  placeholder="AAAA..."
                  value={pushConfig.fcmServerKey}
                  onChange={e => setPushConfig({ ...pushConfig, fcmServerKey: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
                />
              </div>
            </div>
          )}

          {pushConfig.provider === 'webpush' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">VAPID Public Key</label>
                <input
                  type="text"
                  placeholder="BEl6..."
                  value={pushConfig.webPushPublicKey}
                  onChange={e => setPushConfig({ ...pushConfig, webPushPublicKey: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">VAPID Private Key</label>
                <input
                  type="password"
                  value={pushConfig.webPushPrivateKey}
                  onChange={e => setPushConfig({ ...pushConfig, webPushPrivateKey: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
                />
              </div>
            </div>
          )}

          {pushConfig.provider === 'onesignal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">OneSignal App ID</label>
                <input
                  type="text"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={pushConfig.oneSignalAppId}
                  onChange={e => setPushConfig({ ...pushConfig, oneSignalAppId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">REST API Key</label>
                <input
                  type="password"
                  value={pushConfig.oneSignalApiKey}
                  onChange={e => setPushConfig({ ...pushConfig, oneSignalApiKey: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={handleTestPush}
              disabled={testingPush}
              className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 transition-colors"
            >
              {testingPush ? 'Dispatching...' : 'Simulate Test Push Notification'}
            </button>
            <button
              onClick={handleSavePush}
              className="btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
            >
              Save Push Settings
            </button>
          </div>
        </div>
      </div>

      {/* 💾 4. STORAGE CONFIGURATION (FEATURE 16) */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaCloud className="text-emerald-600" />
            <h2 className="font-bold text-slate-800 text-sm">Cloud Storage Settings (AWS S3 / GCS / Cloudinary / Local)</h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">File Node</span>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Storage Provider</label>
              <select
                value={storageConfig.provider}
                onChange={e => setStorageConfig({ ...storageConfig, provider: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none font-bold"
              >
                <option value="local">Local Server Storage (/uploads)</option>
                <option value="s3">Amazon Web Services (AWS S3)</option>
                <option value="gcs">Google Cloud Storage (GCS)</option>
                <option value="cloudinary">Cloudinary Media Hub</option>
                <option value="digitalocean">DigitalOcean Spaces</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Max Upload Limit (MB)</label>
              <input
                type="number"
                value={storageConfig.maxUploadSizeMb}
                onChange={e => setStorageConfig({ ...storageConfig, maxUploadSizeMb: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Custom CDN / Base URL</label>
              <input
                type="text"
                placeholder="https://cdn.deephysio.com"
                value={storageConfig.customEndpoint}
                onChange={e => setStorageConfig({ ...storageConfig, customEndpoint: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
              />
            </div>
          </div>

          {(storageConfig.provider === 's3' || storageConfig.provider === 'digitalocean') && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Bucket Name</label>
                <input
                  type="text"
                  placeholder="deephysio-patient-records"
                  value={storageConfig.s3Bucket}
                  onChange={e => setStorageConfig({ ...storageConfig, s3Bucket: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Region</label>
                <input
                  type="text"
                  placeholder="ap-south-1"
                  value={storageConfig.s3Region}
                  onChange={e => setStorageConfig({ ...storageConfig, s3Region: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Access Key ID</label>
                <input
                  type="text"
                  placeholder="AKIA..."
                  value={storageConfig.s3AccessKey}
                  onChange={e => setStorageConfig({ ...storageConfig, s3AccessKey: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Secret Access Key</label>
                <input
                  type="password"
                  value={storageConfig.s3SecretKey}
                  onChange={e => setStorageConfig({ ...storageConfig, s3SecretKey: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
                />
              </div>
            </div>
          )}

          {storageConfig.provider === 'cloudinary' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Cloud Name</label>
                <input
                  type="text"
                  placeholder="deephysio"
                  value={storageConfig.cloudinaryCloudName}
                  onChange={e => setStorageConfig({ ...storageConfig, cloudinaryCloudName: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">API Key</label>
                <input
                  type="text"
                  value={storageConfig.cloudinaryApiKey}
                  onChange={e => setStorageConfig({ ...storageConfig, cloudinaryApiKey: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">API Secret</label>
                <input
                  type="password"
                  value={storageConfig.cloudinaryApiSecret}
                  onChange={e => setStorageConfig({ ...storageConfig, cloudinaryApiSecret: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={handleTestStorage}
              disabled={testingStorage}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors"
            >
              {testingStorage ? 'Verifying Bucket...' : 'Test Storage Connectivity'}
            </button>
            <button
              onClick={handleSaveStorage}
              className="btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
            >
              Save Storage Settings
            </button>
          </div>
        </div>
      </div>

      {/* 🤖 5. GOOGLE reCAPTCHA (FEATURE 17) */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaRobot className="text-rose-600" />
            <h2 className="font-bold text-slate-800 text-sm">Google reCAPTCHA v2 / v3 Bot Protection</h2>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">Bot Shield</span>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">reCAPTCHA Status</label>
              <div className="flex items-center gap-3 pt-2">
                <Toggle
                  checked={recaptchaConfig.isEnabled}
                  onChange={e => setRecaptchaConfig({ ...recaptchaConfig, isEnabled: e.target.checked })}
                />
                <span className="text-xs font-bold text-slate-700">{recaptchaConfig.isEnabled ? 'Protection Active' : 'Disabled'}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">reCAPTCHA Version</label>
              <select
                value={recaptchaConfig.version}
                onChange={e => setRecaptchaConfig({ ...recaptchaConfig, version: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none font-bold"
              >
                <option value="v3">reCAPTCHA v3 (Invisible Score Based)</option>
                <option value="v2_checkbox">reCAPTCHA v2 ("I'm not a robot" Checkbox)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">v3 Bot Score Threshold</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="1.0"
                value={recaptchaConfig.scoreThreshold}
                onChange={e => setRecaptchaConfig({ ...recaptchaConfig, scoreThreshold: Number(e.target.value) })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Site Key (Public)</label>
              <input
                type="text"
                placeholder="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                value={recaptchaConfig.siteKey}
                onChange={e => setRecaptchaConfig({ ...recaptchaConfig, siteKey: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Secret Key (Private)</label>
              <input
                type="password"
                placeholder="6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"
                value={recaptchaConfig.secretKey}
                onChange={e => setRecaptchaConfig({ ...recaptchaConfig, secretKey: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Protected Authentication Forms</label>
            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recaptchaConfig.protectLogin}
                  onChange={e => setRecaptchaConfig({ ...recaptchaConfig, protectLogin: e.target.checked })}
                  className="rounded text-rose-600"
                />
                Login Portal
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recaptchaConfig.protectRegister}
                  onChange={e => setRecaptchaConfig({ ...recaptchaConfig, protectRegister: e.target.checked })}
                  className="rounded text-rose-600"
                />
                Registration & Onboarding
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recaptchaConfig.protectForgotPassword}
                  onChange={e => setRecaptchaConfig({ ...recaptchaConfig, protectForgotPassword: e.target.checked })}
                  className="rounded text-rose-600"
                />
                Password Recovery / OTP
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              onClick={handleSaveRecaptcha}
              className="btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-sm"
            >
              Save reCAPTCHA Settings
            </button>
          </div>
        </div>
      </div>

      {/* 5B. AUTOMATED 7-DAY ADMIN EMAIL BACKUP */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FaDatabase size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800 text-sm">
                  Automated 7-Day Admin Email Backup
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  autoBackupConfig.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${autoBackupConfig.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  {autoBackupConfig.enabled ? 'Active Every 7 Days' : 'Paused'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically packages all MySQL database tables (patients, appointments, invoices, SOAP notes, records) and sends them to Admin email(s) every 7 days.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <Toggle
              checked={autoBackupConfig.enabled}
              onChange={(e) => handleToggleAutoBackup(e.target.checked)}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 text-xs">
          <div className="text-slate-600 space-y-0.5">
            <p className="font-semibold">
              Schedule Frequency: <strong className="text-slate-800">Every 7 Days (Weekly) at {autoBackupConfig.executionTime || '02:00 AM'}</strong>
            </p>
            {autoBackupConfig.nextRunAt && (
              <p className="text-slate-400 text-[11px]">
                Next Scheduled Delivery: <strong className="text-indigo-600">{new Date(autoBackupConfig.nextRunAt).toLocaleString()}</strong>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/superadmin/backup')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <FaClock size={12} />
            <span>Open Backup & Restore Console ➔</span>
          </button>
        </div>
      </div>

      {/* 6. BUSINESS HQ & PROFILE DETAILS */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-6 space-y-4">
        <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <FaBuilding className="text-amber-500" /> Global Platform Profile & GST Info
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Business Name</label>
            <input type="text" value={business.businessName} onChange={e => setBusiness({...business, businessName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">GST Number</label>
            <input type="text" value={business.gstNumber} onChange={e => setBusiness({...business, gstNumber: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">HQ Mobile Number</label>
            <input type="text" value={business.mobileNumber} onChange={e => setBusiness({...business, mobileNumber: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">HQ Business Address</label>
            <input type="text" value={business.businessAddress} onChange={e => setBusiness({...business, businessAddress: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 outline-none" />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={handleSaveProfileBusiness} className="btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-sm">
            Save Platform Info
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
