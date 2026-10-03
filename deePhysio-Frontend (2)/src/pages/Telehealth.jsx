import React, { useState } from 'react';
import { FaUser, FaPhoneAlt, FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaLink, FaTimes, FaCheckCircle, FaChevronDown } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { fetchApi } from '../config/api';

const Telehealth = () => {
  const [selectedPatient, setSelectedPatient] = useState('');
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const [patients, setPatients] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  React.useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await fetchApi('/patients');
        if (!response) return;
        const json = await response.json();
        const mapped = (json?.data || []).map((p) => ({
          id: p.id,
          name: `${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`.trim() || `Patient ${p.id}`,
          status: 'Ready'
        }));
        setPatients(mapped);
      } catch (error) {
        setPatients([]);
      }
    };
    loadPatients();
  }, []);

  const showToast = (msg) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  };

  const handleStartCall = () => {
    if (!selectedPatient) return;
    const selected = patients.find((p) => p.name === selectedPatient);
    if (!selected) return;
    (async () => {
      const response = await fetchApi('/communication/telehealth/sessions', {
        method: 'POST',
        body: JSON.stringify({ patientId: selected.id, startsAt: new Date().toISOString() })
      });
      if (!response) return;
      const json = await response.json();
      if (!json.success) return showToast(json.message || 'Failed to create session');
      setActiveSession(json.data);
      setIsInCall(true);
      showToast(`Starting consultation with ${selectedPatient}...`);
    })();
  };

  const handleSendLink = () => {
    if (!selectedPatient) return;
    showToast(activeSession?.join_url ? `Meeting link ready: ${activeSession.join_url}` : `Meeting link sent to ${selectedPatient}`);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    showToast('Consultation ended');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 px-4 sm:px-6 py-4 animate-fade-in font-sans">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-2 bg-slate-900 text-white rounded-xl shadow-xl flex items-center gap-3 border border-white/10">
            <FaCheckCircle className="text-clinicPrimary" size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Telehealth</h1>
        <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-[9px] opacity-80">Simple and secure video consultations with your patients.</p>
      </div>

      {!isInCall ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Patient Selection & Actions */}
          <div className="md:col-span-5 space-y-4">
            <Card hover={false} className="p-4 sm:p-5 border border-slate-100 shadow-sm bg-white rounded-2xl">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                <FaUser className="text-clinicPrimary" size={10} /> 1. Select Patient
              </label>
              <div className="relative group mb-4">
                <select 
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary appearance-none cursor-pointer transition-all"
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                >
                  <option value="">Choose a patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.name}>{p.name} ({p.status})</option>
                  ))}
                </select>
                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
              </div>

              <div className="space-y-2">
                <Button 
                  variant="accent" 
                  className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  onClick={handleStartCall}
                  disabled={!selectedPatient}
                >
                  <FaVideo size={14} /> Start Call
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="secondary" 
                    className="h-10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-slate-50 border-slate-200"
                    onClick={() => setIsInCall(true)}
                    disabled={!selectedPatient}
                  >
                    <FaPhoneAlt size={12} /> Join Call
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="h-10 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-slate-50 border-slate-200"
                    onClick={handleSendLink}
                    disabled={!selectedPatient}
                  >
                    <FaLink size={12} /> Send Link
                  </Button>
                </div>
              </div>
            </Card>

            <Card hover={false} className="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="text-[9px] font-bold text-blue-700 leading-relaxed italic opacity-80">
                Tip: Ensure your patient is "Online" before starting the call for the best experience.
              </p>
            </Card>
          </div>

          {/* Quick Preview */}
          <div className="md:col-span-7">
            <Card hover={false} className="h-full min-h-[250px] border border-slate-100 shadow-sm bg-slate-900 rounded-3xl relative overflow-hidden flex items-center justify-center group">
               <div className="absolute top-4 left-4 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 z-10 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[8px] font-black text-white uppercase tracking-widest">Camera Preview Active</span>
               </div>
               <div className="text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-clinicPrimary mb-3 mx-auto group-hover:scale-110 transition-transform">
                     <FaVideo size={20} />
                  </div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Your video will appear here</p>
               </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Video Consultation Interface */
        <div className="space-y-4 animate-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[400px]">
            {/* Patient View */}
            <Card hover={false} className="bg-slate-800 rounded-3xl relative overflow-hidden border border-slate-700 flex items-center justify-center">
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 z-10">
                <span className="text-[9px] font-black text-white uppercase tracking-widest">{selectedPatient} (Patient)</span>
              </div>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-clinicPrimary/10 border border-clinicPrimary/20 flex items-center justify-center text-clinicPrimary mx-auto mb-1">
                  <FaUser size={24} />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Waiting for patient to join...</p>
              </div>
            </Card>

            {/* Doctor View (Me) */}
            <Card hover={false} className="bg-slate-900 rounded-3xl relative overflow-hidden border border-slate-800 flex items-center justify-center">
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 z-10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-white uppercase tracking-widest">You (Practitioner)</span>
              </div>
              {isCameraOff ? (
                <div className="text-center">
                   <FaVideoSlash className="text-slate-600 mb-2 mx-auto" size={30} />
                   <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Camera is off</p>
                </div>
              ) : (
                <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-700 font-black uppercase text-[10px] tracking-widest italic">
                   Video Feed Active
                </div>
              )}
            </Card>
          </div>

          {/* Call Controls */}
          <div className="flex justify-center items-center gap-6 py-4 bg-white border border-slate-100 rounded-3xl shadow-lg max-w-sm mx-auto">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
            >
              {isMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
            </button>
            <button 
              onClick={() => setIsCameraOff(!isCameraOff)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCameraOff ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
            >
              {isCameraOff ? <FaVideoSlash size={18} /> : <FaVideo size={18} />}
            </button>
            <button 
              onClick={handleEndCall}
              className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-90"
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Telehealth;
