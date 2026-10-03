import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTag, FaPlus, FaCheckCircle, FaClock } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

import { fetchApi } from '../config/api';

const AddServicePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [service, setService] = useState({
    name: '',
    category: 'Physiotherapy',
    price: '',
    duration: '45',
    status: 'Active'
  });

  const handleSave = async () => {
    if (!service.name || !service.price) {
      showToast('Clinical Protocol Error: Name and Rate are required fields.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: service.name,
        duration: parseInt(service.duration, 10),
        price: parseFloat(service.price)
      };

      const response = await fetchApi('/services', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response) return; // intercepted

      const resData = await response.json();

      if (resData.success) {
        showToast('New Service Node Deployed to Clinic Database.', 'success');
        navigate('/billing/pricing');
      } else {
        showToast(resData.message || 'Failed to deploy service', 'error');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-fade-in font-sans custom-scrollbar">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/billing/pricing')} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-clinicPrimary shadow-sm transition-all">
                    <FaArrowLeft size={14} />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Initialize Service</h1>
                    <p className="text-slate-500 font-bold uppercase text-[9px] md:text-[10px] tracking-widest mt-1">Catalog Expansion Protocol</p>
                </div>
            </div>

            <Card className="bg-white rounded-2xl md:rounded-[32px] shadow-premium border border-slate-50 overflow-hidden">
                <div className="p-6 md:p-8 space-y-8">
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <FaTag className="text-clinicPrimary" /> Service Name
                        </label>
                        <input 
                            type="text" 
                            placeholder="Enter clinical service name..." 
                            className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
                            value={service.name}
                            onChange={e => setService({...service, name: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FaTag className="text-clinicPrimary" /> Category
                            </label>
                            <select 
                                className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:border-clinicPrimary appearance-none shadow-inner-soft"
                                value={service.category}
                                onChange={e => setService({...service, category: e.target.value})}
                            >
                                <option value="Physiotherapy">Physiotherapy</option>
                                <option value="Massage">Massage Therapy</option>
                                <option value="Specialist">Specialist Consultation</option>
                                <option value="Diagnostics">Diagnostics / Rehab</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FaClock className="text-clinicPrimary" /> Duration
                            </label>
                            <select 
                                className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:border-clinicPrimary appearance-none shadow-inner-soft"
                                value={service.duration}
                                onChange={e => setService({...service, duration: e.target.value})}
                            >
                                <option value="15">15 Minutes</option>
                                <option value="30">30 Minutes</option>
                                <option value="45">45 Minutes</option>
                                <option value="60">60 Minutes</option>
                                <option value="90">90 Minutes</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <span className="text-clinicPrimary font-black">₹</span> Valuation Rate
                            </label>
                            <input 
                                type="number" 
                                placeholder="0.00" 
                                className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
                                value={service.price}
                                onChange={e => setService({...service, price: e.target.value})}
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FaCheckCircle className="text-clinicPrimary" /> Initial Status
                            </label>
                            <select 
                                className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 outline-none focus:border-clinicPrimary appearance-none shadow-inner-soft"
                                value={service.status}
                                onChange={e => setService({...service, status: e.target.value})}
                            >
                                <option value="Active">Active / Public</option>
                                <option value="Inactive">Inactive / Internal</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="px-6 md:px-8 py-6 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-clinicPrimary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--clinic-primary-rgb),0.3)]"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Catalog Sync active</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Button 
                            variant="secondary" 
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-premium hover:bg-white" 
                            onClick={() => navigate('/billing/pricing')}
                        >
                            Abort
                        </Button>
                        <Button 
                            variant="accent" 
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-google active:scale-95 transition-all" 
                            onClick={handleSave} 
                            disabled={isSaving}
                            leftIcon={<FaPlus />}
                        >
                            {isSaving ? 'Committing...' : 'Commit Service'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AddServicePage;
