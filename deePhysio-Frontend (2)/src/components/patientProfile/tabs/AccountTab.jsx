import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaSave, FaEnvelope, FaPhone, FaMapMarkerAlt, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { fetchApi } from '../../../config/api';
import { useToast } from '../../../context/ToastContext';
import Button from '../../ui/Button';

const AccountTab = ({ patientData, onUpdate }) => {
  const { id } = useParams();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    address: '',
    isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (patientData) {
      setFormData({
        email: patientData.email || '',
        phone: patientData.phone || '',
        address: patientData.address || '',
        isActive: patientData.isActive ?? true
      });
    }
  }, [patientData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleActive = () => {
    setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetchApi(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        showToast('Account details updated successfully', 'success');
        if (onUpdate) onUpdate();
      } else {
        showToast(data.message || 'Failed to update account', 'error');
      }
    } catch (error) {
      showToast('Error updating account details', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-[16px] lg:text-[18px] font-bold text-slate-800 flex items-center gap-2">
          <FaUserCircle className="text-clinicPrimary" size={16} /> Account Settings
        </h3>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-8">
        {/* Contact Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <FaEnvelope size={10} className="text-slate-300" /> Email Address
            </label>
            <input 
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="patient@example.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <FaPhone size={10} className="text-slate-300" /> Phone Number
            </label>
            <input 
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1 234 567 890"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary outline-none transition-all"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <FaMapMarkerAlt size={10} className="text-slate-300" /> Home Address
            </label>
            <textarea 
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="123 Health St, Wellness City"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 h-24 focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Account Status Section */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-[14px] font-black text-slate-800 tracking-tight flex items-center gap-2">
              Patient Account Status
            </h4>
            <p className="text-[12px] text-slate-500 font-medium">
              Toggle this to enable or disable patient access to the clinic portal.
            </p>
          </div>
          
          <button 
            type="button"
            onClick={handleToggleActive}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
              formData.isActive 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            {formData.isActive ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
            <span className="text-[11px] font-black uppercase tracking-widest">
              {formData.isActive ? 'Active' : 'Inactive'}
            </span>
          </button>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Button 
            type="submit" 
            variant="accent" 
            disabled={isSaving}
            className="px-8 h-12 uppercase tracking-widest text-[11px] font-black shadow-lg shadow-clinicPrimary/20"
            leftIcon={<FaSave size={14} />}
          >
            {isSaving ? 'Saving Changes...' : 'Save Account Details'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AccountTab;
