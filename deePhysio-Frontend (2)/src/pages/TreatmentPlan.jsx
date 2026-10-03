import React, { useState } from 'react';
import {
    FaBullseye, FaCalendarCheck, FaChartLine, FaClipboardCheck,
    FaArrowLeft, FaSave, FaPlus, FaTrash, FaInfoCircle, FaStethoscope, FaEnvelope
} from 'react-icons/fa';
import EmailModal from '../components/ui/EmailModal';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

const TreatmentPlan = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);

    const [plan, setPlan] = useState({
        goals: [
            { id: 1, type: 'Short-term', description: 'Reduce VAS pain score from 8/10 to 4/10 within 2 weeks.', targetDate: '2026-04-02' },
            { id: 2, type: 'Long-term', description: 'Return to full-time work and gym activities (Squats @ 60kg).', targetDate: '2026-05-15' }
        ],
        modalities: ['Manual Therapy', 'Dry Needling', 'Therapeutic Exercise', 'Education'],
        frequency: '2 sessions / week',
        duration: '6 weeks',
        prognosis: 'Good - Patient highly motivated for rehabilitation.'
    });

    const handleAddGoal = () => {
        const newGoal = {
            id: Date.now(),
            type: 'Short-term',
            description: '',
            targetDate: ''
        };
        setPlan({ ...plan, goals: [...plan.goals, newGoal] });
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            showToast('Clinical Strategy Optimized: Treatment plan synchronized with patient trajectory.');
            navigate(-1);
        }, 1500);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-10 animate-fade-in font-sans custom-scrollbar">
            <div className="flex items-center gap-6">
                <button onClick={() => navigate(-1)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-clinicPrimary hover:shadow-google transition-all active:scale-90 shadow-sm">
                    <FaArrowLeft size={18} />
                </button>
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm shrink-0 mr-4">
                    <ClinicalNoteIcon className="text-amber-500" size={20} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Treatment Plan</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1.5">Strategic Goal Setting & Rehabilitation Matrix</p>
                </div>
            </div>

            <Card className="bg-white rounded-[40px] shadow-premium border border-slate-50 overflow-hidden flex flex-col">
                <div className="p-10 space-y-12">
                    {/* Goals Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-clinicPrimary rounded-full"></div>
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Therapeutic Targets</h3>
                            </div>
                            <button onClick={handleAddGoal} className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-clinicPrimary uppercase tracking-widest hover:bg-clinicPrimary hover:text-white transition-all shadow-sm flex items-center gap-2">
                                <FaPlus size={8} /> Add Objective
                            </button>
                        </div>

                        <div className="space-y-4">
                            {plan.goals.map((goal, idx) => (
                                <div key={goal.id} className="p-7 bg-slate-50 rounded-[32px] border border-slate-100 group hover:bg-white hover:shadow-google transition-all flex flex-col md:flex-row gap-6 relative overflow-hidden">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${goal.type === 'Short-term' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>{goal.type} Node</span>
                                            </div>
                                            <textarea className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 outline-none resize-none p-0 h-12 placeholder:opacity-40" placeholder="Define clinical objective..." defaultValue={goal.description}></textarea>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-48 space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Exceeding Date</label>
                                        <input type="date" className="w-full p-4 bg-white border border-slate-100 rounded-xl text-[12px] font-bold outline-none shadow-sm" defaultValue={goal.targetDate} />
                                    </div>
                                    <button className="self-center p-3 text-slate-200 hover:text-rose-500 transition-colors bg-white rounded-xl shadow-sm border border-slate-50"><FaTrash size={10} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Modalities Grid */}
                    <div className="space-y-6 pt-8 border-t border-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Intervention Modalities</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['Manual Therapy', 'Exercise Node', 'Dry Needling', 'Shockwave', 'Taping', 'Education Matrix', 'Soft Tissue', 'Hydro Protocol'].map(m => (
                                <div key={m} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-google transition-all cursor-pointer flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-md border-2 border-slate-200 group-hover:border-clinicPrimary shrink-0"></div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dosage & Frequency */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Dosage Matrix</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Frequency</span>
                                        <p className="text-sm font-black text-slate-800 uppercase">{plan.frequency}</p>
                                    </div>
                                    <FaCalendarCheck className="text-clinicPrimary" size={18} />
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Planned Duration</span>
                                        <p className="text-sm font-black text-slate-800 uppercase">{plan.duration}</p>
                                    </div>
                                    <FaClipboardCheck className="text-amber-500" size={18} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Clinical Prognosis</h3>
                            </div>
                            <textarea className="w-full min-h-[148px] p-6 bg-slate-900 rounded-[32px] text-white text-[13px] font-bold outline-none shadow-premium placeholder:text-slate-500" defaultValue={plan.prognosis} placeholder="Summarize expected outcomes..."></textarea>
                        </div>
                    </div>
                </div>

                <div className="px-10 py-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 mt-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-clinicPrimary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--clinic-primary-rgb),0.3)]"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rehabilitation node verified</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Button
                            variant="secondary"
                            className="flex-1 md:px-6 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-premium hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => setEmailModalOpen(true)}
                        >
                            <FaEnvelope size={12} className="mr-2" /> Email
                        </Button>
                        <Button
                            variant="accent"
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-google active:scale-95 transition-all"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Synchronizing...' : 'Commit Strategy'}
                        </Button>
                    </div>
                </div>
            </Card>

            <EmailModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                type="Note"
                data={{
                    type: 'Treatment Plan',
                    plan: plan
                }}
            />
        </div>
    );
};

export default TreatmentPlan;
