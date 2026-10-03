import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHospital, FaBuilding, FaStethoscope, FaPlus } from 'react-icons/fa';
import PatientIcon from '../components/ui/PatientIcon';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const AddReferral = () => {
    const navigate = useNavigate();
    const [referral, setReferral] = useState({
        patient: '',
        practitioner: '',
        clinic: '',
        type: 'GP Referral',
        reason: ''
    });

    const handleSave = () => {
        if (!referral.patient || !referral.practitioner) {
            alert('Clinical Registry Error: Patient and Practitioner details are required.');
            return;
        }

        const saved = JSON.parse(localStorage.getItem('deephysio_referrals') || '[]');
        const newReferral = {
            ...referral,
            id: Date.now()
        };

        const updated = [newReferral, ...saved];
        localStorage.setItem('deephysio_referrals', JSON.stringify(updated));
        
        alert('Referral Event Triggered: Data logged in centralized registry successfully!');
        navigate('/billing/referrals');
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-10 animate-fade-in font-sans custom-scrollbar">
            <div className="flex items-center gap-6">
                <button onClick={() => navigate('/billing/referrals')} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-clinicPrimary hover:shadow-google transition-all active:scale-90 shadow-sm">
                    <FaArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Register Referral</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1.5">External Intelligence Input</p>
                </div>
            </div>

            <Card className="bg-white rounded-[40px] shadow-premium border border-slate-50 overflow-hidden">
                <div className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <PatientIcon size={18} className="text-clinicPrimary" /> Target Patient
                            </label>
                            <input 
                                type="text" 
                                placeholder="Search verified patient database..." 
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
                                value={referral.patient}
                                onChange={e => setReferral({...referral, patient: e.target.value})}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FaHospital className="text-clinicPrimary" /> Originating Practitioner
                            </label>
                            <input 
                                type="text" 
                                placeholder="Referrer name (e.g. Dr. Smith)" 
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
                                value={referral.practitioner}
                                onChange={e => setReferral({...referral, practitioner: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FaBuilding className="text-clinicPrimary" /> Source Clinic/Trust
                            </label>
                            <input 
                                type="text" 
                                placeholder="Clinic or Hospital name..." 
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
                                value={referral.clinic}
                                onChange={e => setReferral({...referral, clinic: e.target.value})}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FaStethoscope className="text-clinicPrimary" /> Type Specification
                            </label>
                            <select 
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer appearance-none shadow-inner-soft"
                                value={referral.type}
                                onChange={e => setReferral({...referral, type: e.target.value})}
                            >
                                <option value="GP Referral">GP / Primary Care</option>
                                <option value="Private Consultant">Private Consultant</option>
                                <option value="Self-Referral">Direct / Self-Referral</option>
                                <option value="Insurance Directed">Insurance Provider</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            Clinical Indication / Reason
                        </label>
                        <textarea 
                            rows="4"
                            placeholder="Primary complaint or clinical necessity for referral..." 
                            className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[32px] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 resize-none shadow-inner-soft"
                            value={referral.reason}
                            onChange={e => setReferral({...referral, reason: e.target.value})}
                        ></textarea>
                    </div>
                </div>

                <div className="px-10 py-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-clinicPrimary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--clinic-primary-rgb),0.3)]"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting digital ingest</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Button 
                            variant="secondary" 
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-premium hover:bg-white" 
                            onClick={() => navigate('/billing/referrals')}
                        >
                            Abort
                        </Button>
                        <Button 
                            variant="accent" 
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-google active:scale-95 transition-all" 
                            onClick={handleSave} 
                            leftIcon={<FaPlus />}
                        >
                            Ingest Referral
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AddReferral;
