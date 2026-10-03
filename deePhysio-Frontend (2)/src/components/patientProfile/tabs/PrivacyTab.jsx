import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaSave, FaSms, FaEnvelope, FaBell, FaToggleOn, FaToggleOff, FaInfoCircle } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { fetchApi } from '../../../config/api';
import { useToast } from '../../../context/ToastContext';
import Button from '../../ui/Button';

const PrivacyTab = ({ patientData, onUpdate }) => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [privacySettings, setPrivacySettings] = useState({
    allowSms: true,
    allowEmail: true,
    allowNotifications: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (patientData) {
      setPrivacySettings({
        allowSms: patientData.allowSms ?? true,
        allowEmail: patientData.allowEmail ?? true,
        allowNotifications: patientData.allowNotifications ?? true
      });
    }
  }, [patientData]);

  const toggleSetting = (key) => {
    setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetchApi(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(privacySettings)
      });
      const data = await response.json();
      if (data.success) {
        showToast('Privacy settings updated successfully', 'success');
        if (onUpdate) onUpdate();
      } else {
        showToast(data.message || 'Failed to update privacy settings', 'error');
      }
    } catch (error) {
      showToast('Error updating privacy settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const settingsItems = [
    {
      key: 'allowSms',
      icon: <FaSms size={16} className="text-blue-500" />,
      title: 'SMS Communications',
      description: 'Send appointment reminders and clinical updates via SMS text message.'
    },
    {
      key: 'allowEmail',
      icon: <FaEnvelope size={16} className="text-purple-500" />,
      title: 'Email Communications',
      description: 'Send invoices, exercise plans, and newsletters to the patient\'s email address.'
    },
    {
      key: 'allowNotifications',
      icon: <FaBell size={16} className="text-amber-500" />,
      title: 'System Notifications',
      description: 'Push notifications for real-time updates and task reminders.'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[16px] lg:text-[18px] font-bold text-slate-800 flex items-center gap-2">
            <FaShieldAlt className="text-clinicPrimary" size={16} /> Privacy & Communication
          </h3>
        </div>

        <div className="p-0">
          <div className="divide-y divide-slate-100">
            {settingsItems.map((item) => (
              <div key={item.key} className="p-6 flex items-center justify-between transition-colors hover:bg-slate-50/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[14px] font-black text-slate-800 tracking-tight">{item.title}</h4>
                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed max-w-md">
                      {item.description}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => toggleSetting(item.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 ${
                    privacySettings[item.key] 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  {privacySettings[item.key] ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {privacySettings[item.key] ? 'Enabled' : 'Disabled'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
          <Button 
            onClick={handleSave} 
            variant="accent" 
            disabled={isSaving}
            className="px-8 h-12 uppercase tracking-widest text-[11px] font-black shadow-lg shadow-clinicPrimary/10"
            leftIcon={<FaSave size={14} />}
          >
            {isSaving ? 'Processing...' : 'Save Privacy Settings'}
          </Button>
        </div>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
        <FaInfoCircle className="text-amber-500 mt-0.5 shrink-0" size={14} />
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-amber-900 uppercase tracking-tight">GDPR & Data Protection Compliance</p>
          <p className="text-[11px] font-medium text-amber-700 leading-relaxed">
            Changing these settings will immediately affect how our system communicates with this patient. Ensure you have verbal or written consent before enabling electronic communications.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyTab;
