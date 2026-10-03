import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheck, FaUserCircle, FaMoneyBillWave, FaClock, FaPaperPlane, FaShieldAlt } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const AddReminderRulePage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [rule, setRule] = useState({
        patient: '',
        amount: '',
        age: '7 Days',
        method: 'Email',
        status: 'First Warning'
    });

    const handleSave = () => {
        if (!rule.patient || !rule.amount) return;

        const saved = JSON.parse(localStorage.getItem('deephysio_reminders') || '[]');
        const newRule = {
            ...rule,
            id: Date.now(),
            isPaused: false,
            amount: `₹${parseFloat(rule.amount).toFixed(2)}`
        };

        const updated = [newRule, ...saved];
        localStorage.setItem('deephysio_reminders', JSON.stringify(updated));
        navigate('/billing/reminders');
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 3));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const renderProgress = () => (
        <div className="flex items-center justify-between mb-12 relative px-10">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
            <div className={`absolute top-1/2 left-0 h-1 bg-clinicPrimary -translate-y-1/2 z-0 transition-all duration-500`} style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
            {[1, 2, 3].map(num => (
                <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-black z-10 transition-all duration-500 ${step >= num ? 'bg-clinicPrimary text-white shadow-google scale-110' : 'bg-white text-slate-300 border-4 border-slate-100'}`}>
                    {step > num ? <FaCheck size={14} /> : num}
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto animate-fade-in font-sans pb-20">
            {/* Header */}
            <div className="flex items-center gap-6 mb-12">
                <button onClick={() => navigate('/billing/reminders')} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-clinicPrimary shadow-sm transition-all active:scale-90">
                    <FaArrowLeft size={16} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">New Reminder</h1>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">Setup a new payment notification rule</p>
                </div>
            </div>

            {renderProgress()}

            <Card className="bg-white rounded-[32px] shadow-premium border border-slate-50 overflow-hidden min-h-[400px] flex flex-col">
                <div className="p-8 md:p-12 flex-1">
                    {step === 1 && (
                        <div className="space-y-8 animate-slide-up">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                                    <FaUserCircle size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 leading-none">Who is this for?</h2>
                                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Select the patient and amount</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="Type patient name..." 
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all"
                                        value={rule.patient}
                                        onChange={e => setRule({...rule, patient: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Outstanding Balance (₹)</label>
                                    <input 
                                        type="number" 
                                        placeholder="0.00" 
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all"
                                        value={rule.amount}
                                        onChange={e => setRule({...rule, amount: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-slide-up">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-sm">
                                    <FaClock size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 leading-none">When to remind?</h2>
                                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Set the overdue thresholds</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Send after how many days?</label>
                                    <select 
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer"
                                        value={rule.age}
                                        onChange={e => setRule({...rule, age: e.target.value})}
                                    >
                                        <option value="7 Days">7 Days Overdue (Gentle Reminder)</option>
                                        <option value="14 Days">14 Days Overdue (Follow-up)</option>
                                        <option value="30 Days">30 Days Overdue (Overdue Notice)</option>
                                        <option value="60+ Days">60+ Days Overdue (Final Notice)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tone of message</label>
                                    <select 
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer"
                                        value={rule.status}
                                        onChange={e => setRule({...rule, status: e.target.value})}
                                    >
                                        <option value="First Warning">Courteous & Friendly</option>
                                        <option value="Third Warning">Professional & Direct</option>
                                        <option value="Final Notice">Urgent & Final</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-slide-up">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-sm">
                                    <FaPaperPlane size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 leading-none">How to send?</h2>
                                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Select the communication channel</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { id: 'Email', label: 'Email Primary', desc: 'Sends a professional PDF invoice via email.', icon: <FaShieldAlt /> },
                                    { id: 'SMS', label: 'SMS Primary', desc: 'Sends a quick text reminder with payment link.', icon: <FaPaperPlane /> },
                                    { id: 'Dual', label: 'Email & SMS', desc: 'Best for critical overdue balances.', icon: <FaCheck /> }
                                ].map(opt => (
                                    <button 
                                        key={opt.id}
                                        onClick={() => setRule({...rule, method: opt.id})}
                                        className={`w-full p-5 flex items-center gap-5 rounded-2xl border-2 transition-all text-left ${rule.method === opt.id ? 'border-clinicPrimary bg-clinicPrimary/5' : 'border-slate-50 bg-slate-50/50 hover:border-slate-100'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${rule.method === opt.id ? 'bg-clinicPrimary text-white' : 'bg-white text-slate-300'}`}>
                                            {opt.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-black uppercase tracking-tight ${rule.method === opt.id ? 'text-clinicPrimary' : 'text-slate-600'}`}>{opt.label}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{opt.desc}</p>
                                        </div>
                                        {rule.method === opt.id && <FaCheck className="text-clinicPrimary" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <Button 
                        variant="secondary" 
                        className={`px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                        onClick={prevStep}
                    >
                        Back
                    </Button>
                    <div className="flex gap-3">
                        {step < 3 ? (
                            <Button 
                                variant="primary" 
                                className="px-10 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-clinicDark shadow-lg active:scale-95"
                                onClick={nextStep}
                                disabled={step === 1 && (!rule.patient || !rule.amount)}
                            >
                                Continue
                            </Button>
                        ) : (
                            <Button 
                                variant="accent" 
                                className="px-10 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest bg-clinicPrimary shadow-google active:scale-95"
                                onClick={handleSave}
                            >
                                Save & Activate
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AddReminderRulePage;
