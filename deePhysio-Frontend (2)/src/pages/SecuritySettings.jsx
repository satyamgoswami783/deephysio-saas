import React, { useEffect, useState } from 'react';
import { FaShieldAlt, FaKey, FaClock, FaArrowLeft, FaTimes, FaLaptop, FaBan, FaCheckCircle, FaNetworkWired } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';

const SecuritySettings = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [settings, setSettings] = useState({
    isTwoFactorEnabled: false,
    singleSessionEnforced: true,
    ipWhitelistEnabled: false,
    allowedIps: '127.0.0.1, ::1',
    timeout: '30 minutes'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchApi('/settings/security');
        if (!res?.ok) return;
        const json = await res.json();
        if (json?.success && json?.data) {
          setSettings(prev => ({
            ...prev,
            ...json.data
          }));
        }
      } catch (e) {
        // keep defaults
      }
    };
    load();
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetchApi('/settings/security', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      if (!res?.ok) {
        showToast('Failed to save security policies.', 'error');
        return;
      }
      const json = await res.json();
      if (!json?.success) {
        showToast(json?.message || 'Failed to save security settings.', 'error');
        return;
      }
      showToast('Security policies & session controls updated successfully.', 'success');
    } catch (e) {
      showToast('Failed to save security settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTerminateOtherSessions = async () => {
    if (!window.confirm('Terminate all other device sessions logged into this account?')) return;
    setIsTerminating(true);
    try {
      const res = await fetchApi('/auth/terminate-sessions', { method: 'POST' });
      const json = await res.json();
      if (json?.success) {
        showToast('All other active sessions have been terminated. Single device mode active.');
      }
    } catch (e) {
      showToast('Failed to terminate sessions.', 'error');
    } finally {
      setIsTerminating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      showToast('Please fill all fields.', 'error');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (passwordForm.new.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    setIsPasswordSaving(true);
    try {
      const res = await fetchApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new
        })
      });
      if (!res?.ok) {
        const json = await res.json();
        showToast(json?.message || 'Failed to update password.', 'error');
        return;
      }
      const json = await res.json();
      if (!json?.success) {
        showToast(json?.message || 'Failed to update password.', 'error');
        return;
      }
      showToast('Password updated successfully.', 'success');
      setIsPasswordModalOpen(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (e) {
      showToast('Failed to update password.', 'error');
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-10 animate-fade-in font-sans relative">
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/settings')}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-500 hover:text-clinicPrimary hover:border-clinicPrimary/30 hover:bg-clinicPrimary/5 transition-all outline-none"
            >
              <FaArrowLeft size={14} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Security & License Protection</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Manage single-device policy, IP restrictions, and session authentications.</p>
            </div>
         </div>
      </div>

      <div className="space-y-4">
        
        {/* 1. Feature 10: Single IP & License Multiple Place Login Prevention */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-google transition-all">
          <div className="flex items-start gap-4">
             <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shrink-0">
               <FaLaptop size={20} />
             </div>
             <div>
               <div className="flex items-center gap-2">
                 <h3 className="text-base font-bold text-slate-800 tracking-tight">Single Device / IP Login Enforcement</h3>
                 <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase">License Guard</span>
               </div>
               <p className="text-sm text-slate-500 mt-1 max-w-lg">
                 Prevent multiple concurrent logins with the same license or account. When enabled, logging in from a new browser or location automatically revokes previous active sessions.
               </p>
             </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, singleSessionEnforced: !prev.singleSessionEnforced }))}
            className={`w-14 h-8 rounded-full relative transition-colors cursor-pointer shrink-0 ${settings.singleSessionEnforced ? 'bg-clinicPrimary' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${settings.singleSessionEnforced ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>

        {/* Remote Logout Button */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Active Session Control</p>
            <p className="text-xs text-slate-500">Terminate all other logged-in browsers/devices instantly.</p>
          </div>
          <button
            type="button"
            onClick={handleTerminateOtherSessions}
            disabled={isTerminating}
            className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isTerminating ? 'Terminating...' : 'Terminate Other Sessions'}
          </button>
        </div>

        {/* 2. Feature 7: IP Whitelist & Restriction */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4 hover:shadow-google transition-all">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                <FaNetworkWired size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">IP Address Whitelist Restriction</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-lg">Restrict clinic dashboard access to approved static clinic/office IP addresses only.</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setSettings(prev => ({ ...prev, ipWhitelistEnabled: !prev.ipWhitelistEnabled }))}
              className={`w-14 h-8 rounded-full relative transition-colors cursor-pointer shrink-0 ${settings.ipWhitelistEnabled ? 'bg-clinicPrimary' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${settings.ipWhitelistEnabled ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          {settings.ipWhitelistEnabled && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Allowed IP Addresses (Comma-separated)</label>
              <input 
                type="text"
                value={settings.allowedIps || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, allowedIps: e.target.value }))}
                placeholder="e.g. 192.168.1.1, 49.207.210.15, 127.0.0.1"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800"
              />
            </div>
          )}
        </div>

        {/* 3. Feature 7: 2FA Card */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-google transition-all">
          <div className="flex items-start gap-4">
             <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 shrink-0">
               <FaShieldAlt size={20} />
             </div>
             <div>
               <h3 className="text-base font-bold text-slate-800 tracking-tight">Two-Factor Authentication (2FA)</h3>
               <p className="text-sm text-slate-500 mt-1 max-w-sm">Require a 6-digit OTP code sent via SMS/Email for all staff login attempts.</p>
             </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, isTwoFactorEnabled: !prev.isTwoFactorEnabled }))}
            className={`w-14 h-8 rounded-full relative transition-colors cursor-pointer shrink-0 ${settings.isTwoFactorEnabled ? 'bg-clinicPrimary' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${settings.isTwoFactorEnabled ? 'left-7' : 'left-1'}`}></div>
          </button>
        </div>

        {/* Change Password Card */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-google transition-all">
          <div className="flex items-start gap-4">
             <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100 shrink-0">
               <FaKey size={20} />
             </div>
             <div>
               <h3 className="text-base font-bold text-slate-800 tracking-tight">Change Password</h3>
               <p className="text-sm text-slate-500 mt-1 max-w-sm">Update your account password to maintain security. We recommend changing it periodically.</p>
             </div>
          </div>
          <Button variant="secondary" className="px-6 py-2.5 rounded-xl font-bold bg-white text-slate-700 w-full sm:w-auto shadow-sm" onClick={() => setIsPasswordModalOpen(true)}>
             Update Password
          </Button>
        </div>

        {/* Auto Logout Card */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-google transition-all">
          <div className="flex items-start gap-4">
             <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shrink-0">
               <FaClock size={20} />
             </div>
             <div>
               <h3 className="text-base font-bold text-slate-800 tracking-tight">Auto Session Logout</h3>
               <p className="text-sm text-slate-500 mt-1 max-w-sm">Automatically log out of your session when inactive for a specific duration.</p>
             </div>
          </div>
          
          <select 
            className="w-full sm:w-auto px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 cursor-pointer shadow-sm"
            value={settings.timeout}
            onChange={(e) => setSettings(prev => ({ ...prev, timeout: e.target.value }))}
          >
            <option>15 minutes</option>
            <option>30 minutes</option>
            <option>1 hour</option>
            <option>2 hours</option>
            <option>Never</option>
          </select>
        </div>

      </div>

      <div className="mt-8 pt-4 flex justify-end">
         <Button variant="primary" className="px-8 rounded-xl font-bold shadow-sm" onClick={handleSaveSettings} disabled={isSaving}>
           {isSaving ? 'Saving...' : 'Save Security Policies'}
         </Button>
      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsPasswordModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Change Password</h2>
              <button onClick={() => setIsPasswordModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <FaTimes />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Current Password</label>
                  <input 
                      type="password" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all font-mono"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                      placeholder="••••••••"
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">New Password</label>
                  <input 
                      type="password" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all font-mono"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                      placeholder="••••••••"
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1.5 block">Confirm New Password</label>
                  <input 
                      type="password" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all font-mono"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                      placeholder="••••••••"
                  />
               </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex gap-3 justify-end bg-slate-50/50 rounded-b-2xl">
              <Button variant="secondary" className="px-6 rounded-xl font-bold" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
              <Button variant="primary" className="px-8 rounded-xl font-bold shadow-sm" onClick={handleChangePassword} disabled={isPasswordSaving}>
                {isPasswordSaving ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;
