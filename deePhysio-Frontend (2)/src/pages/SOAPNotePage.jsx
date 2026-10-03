import React, { useState, useEffect } from 'react';
import { fetchApi } from '../config/api';
import {
  FaCheckCircle, FaSave, FaArrowLeft, FaHistory,
  FaEdit, FaPrint, FaTrashAlt, FaStethoscope, FaFlask, FaBrain,
  FaRunning, FaPlus, FaCloudUploadAlt, FaChevronRight, FaTimes,
  FaRulerCombined, FaWeightHanging, FaWalking, FaUser, FaExclamationTriangle
} from 'react-icons/fa';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { FaEnvelope } from 'react-icons/fa';
import EmailModal from '../components/ui/EmailModal';

const SOAPNotePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [patientInfo, setPatientInfo] = useState(null);

  const [soapData, setSoapData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    vitals: {
      bp: '',
      pulse: '',
      painLevel: 5
    },
    redFlagCheck: false,
    painPins: []
  });

  const [isLoading, setIsLoading] = useState(true);

  const handleBodyClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSoapData(prev => ({
      ...prev,
      painPins: [...(prev.painPins || []), { x, y, label: '' }]
    }));
  };

  const updatePinLabel = (index, value) => {
    setSoapData(prev => ({
      ...prev,
      painPins: prev.painPins.map((pin, i) => i === index ? { ...pin, label: value } : pin)
    }));
  };

  const removePin = (index) => {
    setSoapData(prev => ({
      ...prev,
      painPins: prev.painPins.filter((_, i) => i !== index)
    }));
  };

  React.useEffect(() => {
    const fetchNoteData = async () => {
      setIsLoading(true);
      try {
        const response = await fetchApi(`/clinical-notes/${id}`);
        if (response) {
          const resData = await response.json();
          if (resData.success && resData.data) {
            const n = resData.data;
            setSoapData({
              subjective: n.subjective || '',
              objective: n.objective || '',
              assessment: n.assessment || '',
              plan: n.plan || '',
              vitals: n.vitals || { bp: '', pulse: '', painLevel: 5 },
              redFlagCheck: n.redFlagCheck || false,
              painPins: n.painPins || []
            });
          }
        }
      } catch (error) {
        showToast('Failed to fetch clinical note data.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPatientData = async (patientId) => {
        try {
            const response = await fetchApi(`/patients/${patientId}`);
            if (response && response.ok) {
                const resData = await response.json();
                if (resData.success) {
                    setPatientInfo(resData.data);
                }
            }
        } catch (error) {
            console.error('Error fetching patient info:', error);
        }
    };

    if (id) fetchNoteData();
  }, [id, showToast]);

  useEffect(() => {
    // If we have id, we might need to fetch patient context from the note or from query params
    const searchParams = new URLSearchParams(window.location.search);
    const pId = searchParams.get('patientId');
    if (pId) {
        // Fetch patient info to have email/name for the modal
        const fetchP = async () => {
            const res = await fetchApi(`/patients/${pId}`);
            if (res && res.ok) {
                const result = await res.json();
                if (result.success) setPatientInfo(result.data);
            }
        };
        fetchP();
    }
  }, []);

  const handleChange = (section, value) => {
    setSoapData(prev => ({ ...prev, [section]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetchApi(`/clinical-notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(soapData)
      });
      if (response) {
        const resData = await response.json();
        if (resData.success) {
          showToast('Clinical Node Saved: SOAP assessment synchronized with patient archive.', 'success');
          navigate(-1);
        } else {
          showToast(resData.message || 'Failed to save clinical note.', 'error');
        }
      }
    } catch (error) {
      showToast('Error synchronizing clinical node.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10 animate-fade-in font-sans custom-scrollbar">
      <div className="flex items-center gap-6">
        <button onClick={() => navigate(-1)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-clinicPrimary hover:shadow-google transition-all active:scale-90 shadow-sm">
          <FaArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none flex items-center gap-3">
            <ClinicalNoteIcon className="text-amber-500" size={32} /> SOAP Documentation
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1.5">Structured Clinical Assessment Node</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-premium border border-slate-50 overflow-hidden">
        <div className="p-10 space-y-12">
          {/* Subjective Partition */}
          <div className="space-y-6">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <FaEdit className="text-clinicPrimary" /> Subjective Partition
            </label>
            <textarea
              className="w-full min-h-[140px] px-8 py-6 bg-slate-50 border border-slate-100 rounded-[32px] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
              placeholder="Enter patient narrative and reported progress..."
              value={soapData.subjective}
              onChange={(e) => handleChange('subjective', e.target.value)}
            />
          </div>

          {/* Objective Partition */}
          <div className="space-y-8 pt-10 border-t border-slate-50">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
              <FaStethoscope className="text-clinicPrimary" /> Objective Partition
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Range of Motion (ROM)</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Flexion', 'Extension', 'Lat Flex', 'Rotation'].map(move => (
                    <div key={move} className="px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">{move}</span>
                      <input type="text" className="w-10 bg-transparent text-right font-black text-clinicPrimary outline-none text-xs" placeholder="0°" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strength (MMT 0-5)</label>
                <div className="space-y-2">
                  {['Core Stability', 'Hip Flexors', 'Quadriceps'].map(muscle => (
                    <div key={muscle} className="px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">{muscle}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(s => <div key={s} className="w-5 h-5 rounded-md bg-white border border-slate-200 text-[8px] flex items-center justify-center font-black cursor-pointer hover:bg-clinicPrimary hover:text-white transition-all">{s}</div>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Body Chart */}
            <div className="space-y-4 pt-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Anatomical Pain Mapping</label>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/2 bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col items-center relative group">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Click area to place mapping pin</p>

                  <div className="relative w-44 h-80 bg-white/80 rounded-2xl border border-slate-100 flex items-center justify-center cursor-crosshair overflow-hidden group-hover:shadow-soft transition-all" onClick={handleBodyClick}>
                    <svg width="100%" height="100%" viewBox="0 0 100 200" className="text-slate-300 opacity-30">
                      <path d="M50 10 C55 10, 60 15, 60 20 C60 25, 55 30, 50 30 C45 30, 40 25, 40 20 C40 15, 45 10, 50 10" fill="currentColor" />
                      <path d="M40 30 L60 30 L65 70 L35 70 Z" fill="currentColor" />
                      <path d="M35 30 L20 65 L25 70 L38 35 Z" fill="currentColor" />
                      <path d="M65 30 L80 65 L75 70 L62 35 Z" fill="currentColor" />
                      <path d="M40 70 L43 140 L38 140 L35 70 Z" fill="currentColor" />
                      <path d="M60 70 L57 140 L62 140 L65 70 Z" fill="currentColor" />
                    </svg>

                    {(soapData.painPins || []).map((pin, index) => (
                      <div
                        key={index}
                        className="absolute w-4 h-4 rounded-full bg-rose-500 border-2 border-white shadow-sm flex items-center justify-center cursor-pointer group/pin"
                        style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -50%)' }}
                        onClick={(e) => { e.stopPropagation(); removePin(index); }}
                      >
                        <span className="text-[8px] font-black text-white">{index + 1}</span>
                        <div className="absolute left-6 top-0 bg-slate-900 shadow-premium p-2 rounded-lg text-[9px] font-bold text-white opacity-0 group-hover/pin:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
                          {pin.label || `Pain Node ${index + 1}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pin Annotation Records</p>
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {(soapData.painPins || []).length > 0 ? (soapData.painPins || []).map((pin, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="w-5 h-5 bg-rose-500 text-white rounded-md flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
                        <input
                          type="text"
                          placeholder="Add notation (e.g., Dull Pain)"
                          className="flex-1 bg-transparent border-none outline-none text-[12px] font-bold text-slate-700 placeholder:text-slate-300"
                          value={pin.label || ''}
                          onChange={(e) => updatePinLabel(i, e.target.value)}
                        />
                        <button className="text-slate-300 hover:text-rose-500 transition-colors" onClick={() => removePin(i)}><FaTrashAlt size={10} /></button>
                      </div>
                    )) : (
                      <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No pins plotted</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <textarea
              className="w-full min-h-[120px] px-8 py-6 bg-slate-50 border border-slate-100 rounded-[32px] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
              placeholder="Physical findings and clinical observations..."
              value={soapData.objective}
              onChange={(e) => handleChange('objective', e.target.value)}
            />
          </div>

          {/* Assessment & Plan Partition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-50">
            <div className="space-y-6">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <FaBrain className="text-clinicPrimary" /> Assessment Partition
              </label>
              <textarea
                className="w-full min-h-[160px] px-8 py-6 bg-slate-50 border border-slate-100 rounded-[32px] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
                placeholder="Clinical reasoning and impression..."
                value={soapData.assessment}
                onChange={(e) => handleChange('assessment', e.target.value)}
              />
            </div>
            <div className="space-y-6">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <FaRunning className="text-clinicPrimary" /> Plan Partition
              </label>
              <textarea
                className="w-full min-h-[160px] px-8 py-6 bg-slate-50 border border-slate-100 rounded-[32px] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
                placeholder="Treatment interventions and follow-up plan..."
                value={soapData.plan}
                onChange={(e) => handleChange('plan', e.target.value)}
              />
            </div>
          </div>

          {/* Vitals & Bio-Markers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-50">
            <div className="space-y-6">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <FaHistory className="text-clinicPrimary" /> Neural Pain Index & Vitals
              </label>
              <div className="p-8 bg-slate-900 rounded-[32px] space-y-6">
                <div className="flex justify-between items-end">
                  <span className="text-4xl font-black text-white">{soapData.vitals.painLevel}</span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1">VAS Score</span>
                </div>
                <input
                  type="range" min="0" max="10" step="1"
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-clinicPrimary"
                  value={soapData.vitals.painLevel}
                  onChange={(e) => setSoapData(prev => ({ ...prev, vitals: { ...prev.vitals, painLevel: e.target.value } }))}
                />
                <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> 120/80 BP</div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> 72 BPM</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                <FaExclamationTriangle className="text-rose-500" /> Safety Clearance Node
              </label>
              <div className="p-8 bg-rose-50/30 rounded-[32px] border border-rose-100 space-y-4">
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Are red flag danger nodes detected?</p>
                <div className="flex gap-3">
                  <button
                    className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${soapData.redFlagCheck ? 'bg-rose-500 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
                    onClick={() => setSoapData(prev => ({ ...prev, redFlagCheck: true }))}
                  >Critical</button>
                  <button
                    className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!soapData.redFlagCheck ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
                    onClick={() => setSoapData(prev => ({ ...prev, redFlagCheck: false }))}
                  >Cleared</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-10 py-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Protocol Synchronized</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Button
              variant="secondary"
              className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-premium hover:bg-white"
              onClick={() => navigate(-1)}
            >
              Abort
            </Button>
            <Button
              variant="accent"
              className="flex-1 md:px-6 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-google active:scale-95 transition-all bg-blue-600 hover:bg-blue-700"
              onClick={() => setEmailModalOpen(true)}
            >
              <FaEnvelope size={14} className="mr-2" /> Email
            </Button>
            <Button
              variant="accent"
              className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-google active:scale-95 transition-all"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Synchronizing...' : 'Commit Clinical Node'}
            </Button>
          </div>
        </div>
      </div>

      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        type="Note"
        data={soapData}
        patientId={patientInfo?.id}
        patientName={`${patientInfo?.firstName} ${patientInfo?.lastName}`}
        patientEmail={patientInfo?.email}
      />
    </div>
  );
};

// Helper component for Pulse icon since I used FaPulse which might not exist in standard react-icons
const FaPulse = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export default SOAPNotePage;
