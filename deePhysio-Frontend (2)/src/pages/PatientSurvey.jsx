import React, { useState } from 'react';
import {
    FaStar, FaHeart, FaSmile, FaMeh, FaFrown, FaArrowLeft,
    FaSave, FaUserCheck, FaThumbsUp, FaRegCommentDots, FaEnvelope
} from 'react-icons/fa';
import EmailModal from '../components/ui/EmailModal';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

const PatientSurvey = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [nps, setNps] = useState(10);
    const [satisfaction, setSatisfaction] = useState(5);
    const [emailModalOpen, setEmailModalOpen] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            showToast('Sentiment Node Committed: Patient feedback synchronized with performance analytics.');
            navigate(-1);
        }, 1500);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 p-6 md:p-10 animate-fade-in font-sans custom-scrollbar">
            {/* Header */}
            <Card className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 p-10 border-none shadow-premium bg-white relative overflow-hidden group rounded-[40px]">
                <div className="flex items-center gap-8 relative z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-premium flex items-center justify-center text-slate-300 hover:text-clinicPrimary hover:shadow-google transition-all active:scale-90"
                    >
                        <FaArrowLeft size={16} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Experience Survey</h1>
                        <p className="text-[11px] font-bold text-slate-500 mt-4 uppercase tracking-[0.2em] opacity-80">CLIENT SATISFACTION & FIDELITY AUDIT</p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <Button
                        variant="secondary"
                        size="lg"
                        className="rounded-[24px] h-14 px-8 shadow-premium text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-blue-50 hover:text-blue-600"
                        onClick={() => setEmailModalOpen(true)}
                    >
                        <FaEnvelope size={14} className="mr-2" /> Email
                    </Button>
                    <Button
                        variant="accent"
                        size="lg"
                        className="rounded-[24px] h-14 px-10 shadow-google text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Synching...' : 'Commit Feedback'}
                    </Button>
                </div>
            </Card>

            <div className="space-y-10">
                {/* Overall Satisfaction */}
                <Card className="p-10 border-none shadow-premium bg-white rounded-[32px] text-center space-y-10">
                    <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.2em]">How would you rate your overall treatment results?</h3>
                    <div className="flex items-center justify-center gap-6 sm:gap-10">
                        {[
                            { val: 1, icon: <FaFrown />, label: 'Poor', color: 'rose' },
                            { val: 2, icon: <FaMeh />, label: 'Fair', color: 'amber' },
                            { val: 3, icon: <FaSmile />, label: 'Good', color: 'blue' },
                            { val: 4, icon: <FaHeart />, label: 'Great', color: 'indigo' },
                            { val: 5, icon: <FaThumbsUp />, label: 'Optimal', color: 'emerald' }
                        ].map(item => (
                            <button
                                key={item.val}
                                onClick={() => setSatisfaction(item.val)}
                                className={`flex flex-col items-center gap-3 transition-all transform hover:scale-110 ${satisfaction === item.val ? `text-${item.color}-500 scale-125` : 'text-slate-200 opacity-40 hover:opacity-100'}`}
                            >
                                <div className="text-4xl sm:text-5xl">{item.icon}</div>
                                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* NPS Recommendation */}
                <Card className="p-10 border-none shadow-premium bg-slate-900 text-white rounded-[40px] relative overflow-hidden group">
                    <div className="relative z-10 space-y-10">
                        <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">How likely are you to recommend Deephysio to others?</h3>
                        <div className="flex justify-between gap-1 sm:gap-3">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setNps(num)}
                                    className={`flex-1 h-12 sm:h-14 rounded-xl text-[12px] font-black transition-all border ${nps === num
                                            ? 'bg-clinicPrimary text-white border-clinicPrimary shadow-google scale-110'
                                            : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest">
                            <span>Highly Unlikely</span>
                            <span>Extremely Likely</span>
                        </div>
                    </div>
                </Card>

                {/* Qualitative Feedback */}
                <Card className="p-10 border-none shadow-premium bg-white rounded-[32px] space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <FaUserCheck className="text-clinicPrimary" /> Staff Behavior & Professionalism
                            </label>
                            <textarea className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-[24px] text-[13px] font-bold outline-none" placeholder="Share your experience with our clinicians..."></textarea>
                        </div>
                        <div className="space-y-6">
                            <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <FaRegCommentDots className="text-amber-500" /> Open Feedback / Suggestions
                            </label>
                            <textarea className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-[24px] text-[13px] font-bold outline-none" placeholder="Anything else you'd like us to know?"></textarea>
                        </div>
                    </div>
                </Card>

                <div className="flex flex-col items-center justify-center p-10 bg-emerald-50 rounded-[40px] border border-emerald-100 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-premium flex items-center justify-center text-emerald-500 mb-6"><FaHeart size={24} /></div>
                    <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4">Patient Fidelty Node Active</h4>
                    <p className="text-[13px] font-bold text-slate-500 leading-relaxed max-w-sm">Thank you for contributing to the DeepPhysio clinical evolution. Your feedback optimizes our treatment matrix.</p>
                </div>
            </div>

            <EmailModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                type="Note"
                data={{
                    type: 'Experience Survey',
                    satisfaction,
                    nps
                }}
            />
        </div>
    );
};

export default PatientSurvey;
