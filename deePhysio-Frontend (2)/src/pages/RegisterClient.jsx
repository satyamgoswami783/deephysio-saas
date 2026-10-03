import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHandshake, FaBuilding, FaKey, FaShieldAlt } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

const RegisterClient = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    companyName: '',
    adminEmail: '',
    permissions: {
      calendar: true,
      booking: true,
      patient: false,
      billing: false
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast('External Insurer Node Registered Successfully!');
    navigate('/clients');
  };

  const handleCheckbox = (key) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [key]: !formData.permissions[key]
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in p-6 md:p-10 font-sans custom-scrollbar">
      <div className="flex items-center gap-8 mb-8">
        <button 
          type="button"
          onClick={() => navigate('/clients')}
          className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-premium flex items-center justify-center text-slate-300 hover:text-clinicPrimary hover:shadow-google hover:-translate-x-1 transition-all active:scale-90 shrink-0"
        >
          <FaArrowLeft size={16}/>
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">Register Insurer Network</h1>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-3 uppercase tracking-[0.2em] opacity-80">Configure External Node & Access Matrix</p>
        </div>
      </div>

      <Card className="p-6 sm:p-10 border-none shadow-premium bg-white space-y-10 group relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-clinicPrimary/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-clinicPrimary/10 transition-all duration-1000"></div>

        <form onSubmit={handleSubmit} className="space-y-10 relative z-10 w-full mb-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none ml-1">Company Entity Name</label>
              <div className="relative group/input">
                <FaBuilding className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-clinicPrimary transition-colors"/>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Allianz Global..."
                  className="w-full pl-12 pr-6 py-5 bg-slate-50/50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary shadow-inner-soft transition-all" 
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none ml-1">Portal Admin Email</label>
              <div className="relative group/input">
                <FaShieldAlt className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-clinicPrimary transition-colors"/>
                <input 
                  required
                  type="email" 
                  placeholder="portal@company.com"
                  className="w-full pl-12 pr-6 py-5 bg-slate-50/50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary shadow-inner-soft transition-all" 
                  value={formData.adminEmail}
                  onChange={e => setFormData({...formData, adminEmail: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none ml-1">Account Secret Key (API/Auth)</label>
             <div className="relative">
                <FaKey className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="password" 
                  readOnly 
                  className="w-full pl-12 pr-6 py-5 bg-slate-100/50 border border-slate-200 rounded-2xl text-[13px] font-bold text-slate-400 outline-none cursor-not-allowed shadow-inner" 
                  value="** SYSTEM GENERATED TOKEN **" 
                />
             </div>
          </div>

          <div className="space-y-5 pt-4">
             <label className="text-[11px] font-black text-clinicPrimary uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
               <FaShieldAlt size={14} /> 
               Module Permission Matrix
             </label>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'calendar', label: 'View Calendar Data' },
                  { id: 'booking', label: 'Create Secure Bookings' },
                  { id: 'patient', label: 'Access Patient Records' },
                  { id: 'billing', label: 'Modify Billing Info' },
                ].map(perm => (
                  <div key={perm.id} 
                       className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${formData.permissions[perm.id] ? 'bg-clinicPrimary/5 border-clinicPrimary text-clinicPrimary' : 'bg-slate-50/50 border-slate-100 text-slate-500'}`}
                       onClick={() => handleCheckbox(perm.id)}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${formData.permissions[perm.id] ? 'bg-clinicPrimary border-clinicPrimary shadow-google' : 'bg-white border-slate-300'}`}>
                       {formData.permissions[perm.id] && <div className="w-2 h-2 rounded-sm bg-white"></div>}
                    </div>
                    <span className="text-[12px] font-black uppercase tracking-widest">{perm.label}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="pt-10 border-t border-slate-50 flex flex-col sm:flex-row justify-end gap-5 relative z-10 w-full mt-10">
             <Button type="button" variant="secondary" onClick={() => navigate('/clients')} className="w-full sm:w-auto px-10 h-14 rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] shadow-premium hover:shadow-soft flex-1 sm:flex-none">Cancel Registry</Button>
             <Button type="submit" variant="accent" leftIcon={<FaHandshake />} className="w-full sm:w-auto px-10 h-14 rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] shadow-google active:scale-95 transition-all flex-1 sm:flex-none">Create Node Account</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
export default RegisterClient;
