import React, { useState } from 'react';
import {
    FaRunning, FaDumbbell, FaClock, FaCheckCircle, FaPlus,
    FaArrowLeft, FaSave, FaTrash, FaInfoCircle, FaExclamationTriangle,
    FaCalendarCheck, FaPlayCircle, FaEnvelope
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import EmailModal from '../components/ui/EmailModal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

const HomeExercises = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [emailModalOpen, setEmailModalOpen] = useState(false);

    const [exercises, setExercises] = useState([
        { id: 1, name: 'Glute Bridges', sets: 3, reps: 15, frequency: '2x Daily', instructions: 'Lie on your back with knees bent and feet flat on the floor. Lift hips towards the ceiling.', safety: 'Avoid arching your lower back.' },
        { id: 2, name: 'Cat-Cow Stretch', sets: 2, reps: 10, frequency: 'Once Daily', instructions: 'On all fours, alternate between arching and rounding your back slowly.', safety: 'Move within a pain-free range.' }
    ]);

    const handleAddExercise = () => {
        const newEx = {
            id: Date.now(),
            name: '',
            sets: 3,
            reps: 10,
            frequency: 'Daily',
            instructions: '',
            safety: ''
        };
        setExercises([...exercises, newEx]);
    };

    const handleRemove = (id) => {
        setExercises(exercises.filter(ex => ex.id !== id));
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            showToast('HEP Protocol Dispatched: Home Exercise Program synced to patient node.');
            navigate(-1);
        }, 1500);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 p-6 md:p-10 animate-fade-in font-sans custom-scrollbar">
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
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Home Exercise Program</h1>
                        <p className="text-[11px] font-bold text-slate-500 mt-4 uppercase tracking-[0.2em] opacity-80">HEP ASSIGNMENT & REHABILITATION STEWARDSHIP</p>
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
                        leftIcon={<FaSave />}
                    >
                        {isSaving ? 'Dispatching...' : 'Dispatch Program'}
                    </Button>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-8">
                    {exercises.map((ex, idx) => (
                        <Card key={ex.id} className="p-10 border-none shadow-premium bg-white rounded-[32px] relative overflow-hidden group hover:shadow-google transition-all border-l-8 border-clinicPrimary">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-clinicPrimary/5 rounded-2xl flex items-center justify-center text-clinicPrimary">
                                        <FaRunning size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        className="text-xl font-black text-slate-900 outline-none bg-transparent placeholder:text-slate-200 border-b border-transparent focus:border-clinicPrimary/20 transition-all"
                                        placeholder="Exercise Name..."
                                        defaultValue={ex.name}
                                    />
                                </div>
                                <button onClick={() => handleRemove(ex.id)} className="text-slate-200 hover:text-rose-500 transition-colors p-2"><FaTrash size={14} /></button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
                                <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Sets</label>
                                    <input type="number" className="w-full bg-transparent text-[16px] font-black text-slate-800 outline-none" defaultValue={ex.sets} />
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Reps / Secs</label>
                                    <input type="number" className="w-full bg-transparent text-[16px] font-black text-slate-800 outline-none" defaultValue={ex.reps} />
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Frequency</label>
                                    <input type="text" className="w-full bg-transparent text-[13px] font-black text-slate-800 outline-none" defaultValue={ex.frequency} />
                                </div>
                                <div className="p-4 bg-clinicPrimary/5 rounded-2xl space-y-2 border border-clinicPrimary/10">
                                    <label className="text-[9px] font-black text-clinicPrimary uppercase tracking-widest block">Level</label>
                                    <span className="text-[12px] font-black text-clinicPrimary uppercase">Optimal</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <FaInfoCircle size={10} /> Instructions
                                    </label>
                                    <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-bold text-slate-600 outline-none min-h-[80px]" defaultValue={ex.instructions} placeholder="Step-by-step guidance..."></textarea>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                        <FaExclamationTriangle size={10} /> Safety Notes
                                    </label>
                                    <input type="text" className="w-full p-4 bg-amber-50 border border-amber-100 rounded-xl text-[12px] font-bold text-amber-700 outline-none" defaultValue={ex.safety} placeholder="Precautions and pain triggers..." />
                                </div>
                            </div>
                        </Card>
                    ))}

                    <button
                        onClick={handleAddExercise}
                        className="w-full py-8 border-4 border-dashed border-slate-100 rounded-[32px] text-slate-300 hover:border-clinicPrimary/20 hover:text-clinicPrimary transition-all flex flex-col items-center justify-center gap-4 group"
                    >
                        <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center group-hover:border-clinicPrimary/20 transition-all">
                            <FaPlus />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.25em]">Initialize New Exercise Node</span>
                    </button>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    <Card className="p-10 border-none shadow-premium bg-slate-900 text-white rounded-[40px] relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.25em] mb-10">Protocol Timeline</h4>
                            <div className="space-y-8">
                                <div className="flex gap-6 items-start">
                                    <div className="w-4 h-4 rounded-full bg-clinicPrimary mt-1 shadow-[0_0_10px_rgba(46,167,184,0.8)]"></div>
                                    <div>
                                        <p className="text-[13px] font-black tracking-tight leading-none mb-2 text-white">Program Assigned</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today at 17:48</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 items-start">
                                    <div className="w-4 h-4 rounded-full bg-slate-800 mt-1"></div>
                                    <div>
                                        <p className="text-[13px] font-black tracking-tight leading-none mb-2 text-slate-500">First Review Cycle</p>
                                        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Scheduled Node: +7 Days</p>
                                    </div>
                                </div>
                            </div>
                            <Button variant="secondary" className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest mt-12 hover:bg-white/10">Preview Patient View</Button>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-clinicPrimary/10 rounded-full blur-[60px]"></div>
                    </Card>

                    <Card className="p-10 border-none shadow-premium bg-white rounded-[40px]">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500"><FaCalendarCheck size={20} /></div>
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">Compliance Node</h4>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest mb-8">System tracking active. Notification alerts will be dispatched to patient daily at 09:00.</p>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Rate</p>
                                <p className="text-[16px] font-black text-slate-900 uppercase">95.2%</p>
                            </div>
                            <div className="w-12 h-12 flex items-center justify-center text-emerald-500">
                                <FaCheckCircle size={24} />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            <EmailModal
                isOpen={emailModalOpen}
                onClose={() => setEmailModalOpen(false)}
                type="Note"
                data={{
                    type: 'Home Exercise Program',
                    exercises: exercises
                }}
            />
        </div>
    );
};

export default HomeExercises;
