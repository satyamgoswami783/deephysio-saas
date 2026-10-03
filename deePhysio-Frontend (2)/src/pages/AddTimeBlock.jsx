import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaLock, FaCalendarAlt, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const AddTimeBlock = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        time: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || !formData.date || !formData.time) {
            alert('Protocol Violation: All schedule restriction parameters are required.');
            return;
        }
        alert('Time Block Successfully Enforced!');
        navigate('/appointments/availability');
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-10 animate-fade-in font-sans custom-scrollbar">
            <div className="flex items-center gap-6">
                <button onClick={() => navigate('/appointments/availability')} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-clinicPrimary hover:shadow-google transition-all active:scale-90 shadow-sm">
                    <FaArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Schedule Lock</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1.5">Enforce clinical availability restrictions</p>
                </div>
            </div>

            <Card className="bg-white rounded-[40px] shadow-premium border border-slate-50 overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="p-10 space-y-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FaExclamationTriangle className="text-clinicPrimary" /> Restriction Motivation
                            </label>
                            <input 
                                required
                                type="text" 
                                placeholder="e.g. Mandatory Staff Drill / Deep Clinic Sanitation..." 
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <FaCalendarAlt className="text-clinicPrimary" /> Target Date
                                </label>
                                <input 
                                    required
                                    type="text" 
                                    placeholder="e.g. Nov 14, 2026" 
                                    className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <FaClock className="text-clinicPrimary" /> Temporal Envelope
                                </label>
                                <input 
                                    required
                                    type="text" 
                                    placeholder="e.g. 14:00 - 16:00" 
                                    className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
                                    value={formData.time}
                                    onChange={e => setFormData({...formData, time: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-10 py-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule Lockout Active</p>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <Button 
                                type="button"
                                variant="secondary" 
                                className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-premium hover:bg-white" 
                                onClick={() => navigate('/appointments/availability')}
                            >
                                Abort Request
                            </Button>
                            <Button 
                                type="submit" 
                                variant="accent" 
                                className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-google active:scale-95 transition-all" 
                                leftIcon={<FaLock />}
                            >
                                Enforce restriction
                            </Button>
                        </div>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default AddTimeBlock;
