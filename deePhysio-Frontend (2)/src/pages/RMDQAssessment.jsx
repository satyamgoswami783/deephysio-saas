import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaCheckCircle, FaSave, FaArrowLeft, FaHistory, FaCalculator, 
  FaChartLine, FaExclamationTriangle, FaInfoCircle, FaEnvelope
} from 'react-icons/fa';
import EmailModal from '../components/ui/EmailModal';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

const RMDQAssessment = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showToast } = useToast();
    const [score, setScore] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);

    const questions = [
        "I stay at home most of the time because of my back.",
        "I change position get comfortable.",
        "I walk more slowly than usual because of my back.",
        "Because of my back, I am not doing any jobs that I usually do around the house.",
        "Because of my back, I use a handrail to get upstairs.",
        "Because of my back, I lie down to rest more often.",
        "Because of my back, I have to hold on to something to get out of an easy chair.",
        "Because of my back, I try to get other people to do things for me.",
        "I get dressed more slowly than usual because of my back.",
        "I only stand up for short periods of time because of my back.",
        "Because of my back, I try not to bend or kneel down.",
        "I find it difficult to get out of a chair because of my back.",
        "My back is painful almost all of the time.",
        "I find it difficult to turn over in bed because of my back.",
        "My appetite is not very good because of my back.",
        "I have trouble putting on my socks (or stockings) because of my back.",
        "I only walk short distances because of my back.",
        "I sleep less well because of my back.",
        "Because of my back, I get dressed with help from someone else.",
        "I sit down for most of the day because of my back.",
        "I avoid heavy jobs around the house because of my back.",
        "Because of my back, I am more irritable and bad tempered with people than usual.",
        "Because of my back, I go upstairs more slowly than usual.",
        "I stay in bed most of the day because of my back."
    ];

    const [checkedItems, setCheckedItems] = useState(new Array(questions.length).fill(false));

    useEffect(() => {
        const newScore = checkedItems.filter(Boolean).length;
        setScore(newScore);
    }, [checkedItems]);

    const handleToggle = (index) => {
        const updated = [...checkedItems];
        updated[index] = !updated[index];
        setCheckedItems(updated);
    };

    const getInterpretation = () => {
        if (score === 0) return { text: 'No Disability', color: 'emerald' };
        if (score <= 8) return { text: 'Mild Disability', color: 'blue' };
        if (score <= 16) return { text: 'Moderate Disability', color: 'amber' };
        return { text: 'Severe Disability', color: 'rose' };
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            showToast(`Assessment Committed: RMDQ Score ${score}/24 archived for clinical trend analysis.`);
            navigate(-1);
        }, 1500);
    };

    const interpretation = getInterpretation();

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-10 animate-fade-in font-sans custom-scrollbar">
            <div className="flex items-center gap-6">
                <button onClick={() => navigate(-1)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-clinicPrimary hover:shadow-google transition-all active:scale-90 shadow-sm">
                    <FaArrowLeft size={18} />
                </button>
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
                    <ClinicalNoteIcon className="text-amber-500" size={20} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">RMDQ Assessment</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1.5">Roland-Morris Disability Index Protocol</p>
                </div>
            </div>

            <Card className="bg-white rounded-[40px] shadow-premium border border-slate-50 overflow-hidden">
                <div className="p-10 space-y-10">
                    {/* Instructions & Score Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FaInfoCircle className="text-clinicPrimary" /> Clinical Instructions
                            </label>
                            <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest opacity-80">
                                Tick the sentences that describe you today. Every ticked box adds 1 point to your disability index.
                            </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Calculated Index</span>
                            <div className="flex items-end gap-2">
                                <span className={`text-4xl font-black tracking-tighter text-${interpretation.color}-500`}>{score}</span>
                                <span className="text-slate-300 font-bold text-lg mb-1">/24</span>
                            </div>
                        </div>
                    </div>

                    {/* Interpretation Chip */}
                    <div className="flex items-center gap-4">
                        <div className={`px-5 py-2 rounded-full border border-${interpretation.color}-100 bg-${interpretation.color}-50/50 flex items-center gap-3`}>
                            <div className={`w-2 h-2 rounded-full bg-${interpretation.color}-500 animate-pulse`}></div>
                            <span className={`text-[10px] font-black uppercase tracking-widest text-${interpretation.color}-600`}>{interpretation.text}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol validation active</p>
                    </div>

                    {/* Questions Grid - 2 columns for better vertical space usage in centered max-w-4xl */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {questions.map((q, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => handleToggle(idx)}
                                className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${
                                    checkedItems[idx] 
                                    ? 'bg-clinicPrimary/5 border-clinicPrimary/20 shadow-soft' 
                                    : 'bg-white border-slate-100 hover:border-clinicPrimary/10'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                                    checkedItems[idx] ? 'bg-clinicPrimary border-clinicPrimary text-white shadow-lg' : 'bg-transparent border-slate-100'
                                }`}>
                                    {checkedItems[idx] && <FaCheckCircle size={10}/>}
                                </div>
                                <span className={`text-[12px] font-bold leading-tight ${checkedItems[idx] ? 'text-slate-900' : 'text-slate-500'}`}>{q}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-10 py-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Index Calculation Synchronized</p>
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
                            {isSaving ? 'Synchronizing...' : 'Finalize RMDQ Node'}
                        </Button>
                    </div>
                </div>
            </Card>

            <EmailModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                type="Note"
                data={{
                    type: 'RMDQ Assessment',
                    score,
                    interpretation: interpretation.text,
                    responses: questions.map((q, i) => checkedItems[i] ? q : null).filter(Boolean)
                }}
            />
        </div>
    );
};

export default RMDQAssessment;
