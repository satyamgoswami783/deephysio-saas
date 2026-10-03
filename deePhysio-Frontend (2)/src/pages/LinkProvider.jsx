import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLink, FaBuilding, FaGlobe } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

const LinkProvider = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    providerName: '',
    category: 'Private',
    apiIdentifier: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    showToast('Master Provider Linked Successfully!');
    navigate('/patients/insurance');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in p-6 md:p-10 font-sans custom-scrollbar">
      <div className="flex items-center gap-8 mb-8">
        <button 
          type="button"
          onClick={() => navigate('/patients/insurance')}
          className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-premium flex items-center justify-center text-slate-300 hover:text-clinicPrimary hover:shadow-google hover:-translate-x-1 transition-all active:scale-90 shrink-0"
        >
          <FaArrowLeft size={16}/>
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">Link Master Provider</h1>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-3 uppercase tracking-[0.2em] opacity-80">Global Insurance API Connection</p>
        </div>
      </div>

      <Card className="p-6 sm:p-10 border-none shadow-premium bg-white space-y-10 group relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-clinicPrimary/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-clinicPrimary/10 transition-all duration-1000"></div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10 w-full max-w-2xl mx-auto">
          <div className="flex justify-center mb-10 text-clinicPrimary">
             <div className="w-24 h-24 rounded-full bg-slate-50 border-4 border-white shadow-soft flex items-center justify-center shadow-inner-soft">
                <FaGlobe size={40} className="animate-pulse opacity-80" />
             </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none ml-1">Provider Entity Name</label>
             <div className="relative group/input">
                <FaBuilding className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-clinicPrimary transition-colors"/>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. Blue Cross Blue Shield..."
                  className="w-full pl-12 pr-6 py-5 bg-slate-50/50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary shadow-inner-soft transition-all" 
                  value={formData.providerName}
                  onChange={e => setFormData({...formData, providerName: e.target.value})}
                />
             </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none ml-1">Provider Category</label>
             <select 
                className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary shadow-inner-soft transition-all cursor-pointer"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
             >
                <option value="Private">Private / Premium Segment</option>
                <option value="Company">Corporate Sponsored</option>
                <option value="State">State Health System</option>
             </select>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none ml-1">API Node/Corporate Key (Optional)</label>
             <div className="relative group/input">
                <FaLink className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-clinicPrimary transition-colors"/>
                <input 
                  type="text" 
                  placeholder="e.g. API-99120-XB..."
                  className="w-full pl-12 pr-6 py-5 bg-slate-50/50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary shadow-inner-soft transition-all font-mono" 
                  value={formData.apiIdentifier}
                  onChange={e => setFormData({...formData, apiIdentifier: e.target.value})}
                />
             </div>
          </div>

          <div className="pt-10 border-t border-slate-50 flex flex-col sm:flex-row justify-end gap-5 relative z-10 w-full mt-10">
             <Button type="button" variant="secondary" onClick={() => navigate('/patients/insurance')} className="w-full sm:w-auto px-10 h-14 rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] shadow-premium hover:shadow-soft flex-1 sm:flex-none">Abort Setup</Button>
             <Button type="submit" variant="accent" leftIcon={<FaLink />} className="w-full sm:w-auto px-10 h-14 rounded-[20px] text-[11px] font-black uppercase tracking-[0.2em] shadow-google active:scale-95 transition-all flex-1 sm:flex-none">Verify & Link System</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
export default LinkProvider;
