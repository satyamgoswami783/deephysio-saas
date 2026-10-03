import React, { useEffect, useState } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [settings, setSettings] = useState({
    appointments_new: true,
    appointments_change: true,
    patient_reminder: true,
    billing_received: true,
    billing_due: false,
    system_login: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchApi('/settings?keys=notificationSettings');
        if (!res?.ok) return;
        const json = await res.json();
        if (!json?.success) return;
        const value = json?.data?.notificationSettings;
        if (value && typeof value === 'object') {
          setSettings((prev) => ({ ...prev, ...value }));
        }
      } catch (e) {
        // keep defaults
      }
    };
    load();
  }, []);

  const handleToggle = (id) => {
    setSettings(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetchApi('/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: { notificationSettings: settings } })
      });
      if (!res?.ok) {
        showToast('Failed to save notification settings.', 'error');
        return;
      }
      const json = await res.json();
      if (!json?.success) {
        showToast(json?.message || 'Failed to save notification settings.', 'error');
        return;
      }
      showToast('Notification settings saved successfully.', 'success');
    } catch (e) {
      showToast('Failed to save notification settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const NotificationToggleRow = ({ id, label }) => (
    <div 
      className="flex items-center justify-between p-3 bg-slate-50/80 rounded-lg mb-2 last:mb-0 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100" 
      onClick={() => handleToggle(id)}
    >
      <span className="text-[13px] font-bold text-slate-700">{label}</span>
      <button 
        onClick={(e) => { e.stopPropagation(); handleToggle(id); }}
        className={`w-11 h-6 rounded-full relative transition-colors ${settings[id] ? 'bg-clinicPrimary' : 'bg-slate-300'}`}
      >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${settings[id] ? 'left-6' : 'left-1'}`}></div>
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4 px-4 py-5 animate-fade-in font-sans">
      <div className="flex items-center justify-between mb-1">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/settings')}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-500 hover:text-clinicPrimary hover:border-clinicPrimary/30 hover:bg-clinicPrimary/5 transition-all outline-none"
            >
              <FaArrowLeft size={14} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Notifications</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manage essential clinic alerts and notifications.</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Section 1: Appointment Notifications */}
        <div className="p-4 md:p-5 border-b border-slate-100">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.16em] mb-3.5 flex items-center gap-2.5">
             <div className="w-2 h-2 rounded-full bg-blue-500"></div> Appointment Notifications
          </h3>
          <NotificationToggleRow id="appointments_new" label="New Booking" />
          <NotificationToggleRow id="appointments_change" label="Schedule Change" />
        </div>

        {/* Section 2: Patient Notifications */}
        <div className="p-4 md:p-5 border-b border-slate-100">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.16em] mb-3.5 flex items-center gap-2.5">
             <div className="w-2 h-2 rounded-full bg-amber-500"></div> Patient Notifications
          </h3>
          <NotificationToggleRow id="patient_reminder" label="Appointment Reminder" />
        </div>

        {/* Section 3: Billing Notifications */}
        <div className="p-4 md:p-5 border-b border-slate-100">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.16em] mb-3.5 flex items-center gap-2.5">
             <div className="w-2 h-2 rounded-full bg-purple-500"></div> Billing Notifications
          </h3>
          <NotificationToggleRow id="billing_received" label="Payment Received" />
          <NotificationToggleRow id="billing_due" label="Payment Due" />
        </div>

        {/* Section 4: System Notifications */}
        <div className="p-4 md:p-5">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.16em] mb-3.5 flex items-center gap-2.5">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div> System Notifications
          </h3>
          <NotificationToggleRow id="system_login" label="Login Alert" />
        </div>

        {/* Action Footer */}
        <div className="p-4 md:px-5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-end gap-2.5 rounded-b-2xl">
          <Button variant="secondary" className="w-full sm:w-auto px-8 rounded-xl font-bold" onClick={() => navigate('/settings')}>Cancel</Button>
          <Button variant="primary" className="w-full sm:w-auto px-10 rounded-xl font-bold shadow-sm hover:shadow-md" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

      </div>
    </div>
  );
};

export default NotificationSettings;
