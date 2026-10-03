import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaPlus, FaTrash, FaCheckCircle, FaLock, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import Button from '../components/ui/Button';

const Availability = () => {
  const navigate = useNavigate();

  // Role detection
  const userRole = sessionStorage.getItem('deephysio_role');


  const isTherapist = userRole === 'therapist';

  const [selectedDay, setSelectedDay] = useState('Monday');
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const [schedule, setSchedule] = useState({
    Monday: [{ id: 1, start: '09:00', end: '12:30' }, { id: 2, start: '13:30', end: '17:00' }],
    Tuesday: [{ id: 3, start: '09:00', end: '17:00' }],
    Wednesday: [{ id: 4, start: '09:00', end: '12:30' }, { id: 5, start: '13:30', end: '17:00' }],
    Thursday: [{ id: 6, start: '09:00', end: '17:00' }],
    Friday: [{ id: 7, start: '09:00', end: '15:00' }],
    Saturday: [],
    Sunday: []
  });

  const [blocks, setBlocks] = useState([
    { id: 1, title: 'Staff Meeting', date: 'Every Wednesday', time: '12:30 PM - 01:30 PM' },
    { id: 2, title: 'Clinic Cleaning', date: 'Mar 25, 2026', time: '08:00 AM - 09:00 AM' },
  ]);

  const [acceptBookings, setAcceptBookings] = useState(true);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('2 min ago');

  const handleAddSlot = () => {
    const newSlot = { id: Date.now(), start: '09:00', end: '17:00' };
    setSchedule({ ...schedule, [selectedDay]: [...(schedule[selectedDay] || []), newSlot] });
  };

  const handleDeleteSlot = (id) => {
    setSchedule({ ...schedule, [selectedDay]: schedule[selectedDay].filter(s => s.id !== id) });
  };

  const handleSlotChange = (id, field, value) => {
    const updatedSlots = schedule[selectedDay].map(s => s.id === id ? { ...s, [field]: value } : s);
    setSchedule({ ...schedule, [selectedDay]: updatedSlots });
  };

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSync('Just now');
    }, 1500);
  };

  return (
    <div className="max-w-[1300px] w-full mx-auto space-y-4 sm:space-y-6 px-4 sm:px-5 lg:px-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            {isTherapist ? 'My Availability' : 'Schedule & Availability'}
          </h1>
          <p className="text-slate-500 font-bold mt-1.5 uppercase tracking-widest text-[9px] sm:text-[10px] opacity-80">
            {isTherapist ? 'Configure your personal working hours and time blocks.' : 'Configure your working hours and block out time.'}
          </p>
        </div>
        <button onClick={() => navigate('/appointments/availability/add')} className="rounded-lg h-9 sm:h-10 px-4 sm:px-5 shadow-sm border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all text-[9px] sm:text-[10px] font-black uppercase tracking-widest w-full sm:w-auto relative bg-white text-slate-700 flex items-center justify-center gap-2">
          <FaLock size={10}/> ADD TIME BLOCK
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Day Selector Sidebar */}
        <div className="lg:col-span-1">
           <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Choose Day</h3>
           <div className="flex flex-col md:flex-row lg:flex-col gap-1.5 md:overflow-x-auto lg:overflow-visible custom-scrollbar pb-2 lg:pb-0">
             {days.map(day => (
               <button 
                 key={day}
                 onClick={() => setSelectedDay(day)}
                 className={`w-full md:w-auto md:min-w-[140px] lg:w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all border ${selectedDay === day ? 'bg-clinicPrimary border-clinicPrimary text-white shadow-sm' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50 shadow-none'}`}
               >
                 <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">{day.slice(0,3)}</span>
                 {selectedDay === day ? <FaCheckCircle size={10} className="text-white/80"/> : <span className={`text-[8px] sm:text-[9px] font-bold uppercase ${schedule[day]?.length > 0 ? 'text-clinicPrimary' : 'text-slate-300'}`}>{schedule[day]?.length > 0 ? 'Active' : 'Off'}</span>}
               </button>
             ))}
           </div>
        </div>

        {/* Working Hours Area */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 border border-slate-100 shadow-sm bg-white rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-3 gap-3">
              <div className="flex items-center gap-2">
                <FaClock className="text-clinicPrimary" size={12}/>
                <h3 className="text-[12px] sm:text-[13px] font-black uppercase tracking-widest text-slate-900">{selectedDay} Hours</h3>
              </div>
              <button onClick={handleAddSlot} className="w-full sm:w-auto text-[9px] font-black text-clinicPrimary hover:bg-clinicPrimary/10 transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5 bg-clinicPrimary/5 border border-clinicPrimary/10 px-3 py-1.5 rounded-lg text-center cursor-pointer">
                 <FaPlus size={8}/> ADD SLOT
              </button>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {schedule[selectedDay]?.length > 0 ? schedule[selectedDay].map(slot => (
                <div key={slot.id} className="flex flex-col sm:flex-row items-center gap-3 p-3 sm:p-4 bg-slate-50/50 rounded-lg border border-slate-100 transition-none">
                  <div className="w-full sm:flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Start Time</label>
                      <input type="time" value={slot.start} onChange={(e) => handleSlotChange(slot.id, 'start', e.target.value)} className="w-full bg-white border border-slate-200 rounded-md p-2 text-[11px] sm:text-[12px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 transition-colors cursor-pointer shadow-sm" />
                    </div>
                    <div>
                      <label className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">End Time</label>
                      <input type="time" value={slot.end} onChange={(e) => handleSlotChange(slot.id, 'end', e.target.value)} className="w-full bg-white border border-slate-200 rounded-md p-2 text-[11px] sm:text-[12px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 transition-colors cursor-pointer shadow-sm" />
                    </div>
                  </div>
                  <button onClick={() => handleDeleteSlot(slot.id)} className="w-full sm:w-9 h-9 sm:mt-4 flex items-center justify-center rounded-md bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-colors shadow-sm shrink-0">
                    <FaTrash size={10}/>
                  </button>
                </div>
              )) : (
                 <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">No working slots configured for {selectedDay}.</p>
                 </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-3 border-t border-slate-50 mt-4">
               <label className="flex items-center gap-2 cursor-pointer group mt-2">
                  <div className="relative inline-block w-8 sm:w-9 h-4 sm:h-5 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" name="toggle" checked={acceptBookings} onChange={(e) => setAcceptBookings(e.target.checked)} className={`toggle-checkbox absolute block w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white border-2 appearance-none cursor-pointer transition-transform duration-300 z-10 ${acceptBookings ? 'border-clinicPrimary translate-x-4 sm:translate-x-4' : 'border-slate-200 translate-x-0'}`}/>
                    <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-4 sm:h-5 rounded-full cursor-pointer transition-colors duration-300 ${acceptBookings ? 'bg-clinicPrimary' : 'bg-slate-200'}`}></label>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-black text-slate-600 group-hover:text-clinicPrimary transition-colors uppercase tracking-widest pl-1">Accept Online Bookings</span>
               </label>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
           {/* Active Blocks — visible to everyone */}
           <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 border border-slate-100 shadow-sm bg-white rounded-xl">
             <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2 mb-1">
                <FaExclamationTriangle className="text-clinicSecondary" size={10}/>
                {isTherapist ? 'My Time Blocks' : 'Active Blocks'}
             </h3>
             <div className="space-y-2.5 sm:space-y-3">
               {blocks.map(block => (
                 <div key={block.id} className="p-3 sm:p-3.5 bg-slate-50/50 rounded-lg border-l-4 border-clinicSecondary">
                   <p className="text-[11px] sm:text-[12px] font-black text-slate-900 leading-none mb-1.5">{block.title}</p>
                   <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest">{block.date}</p>
                   <p className="text-[8px] sm:text-[9px] font-black text-clinicSecondary mt-1 uppercase">{block.time}</p>
                 </div>
               ))}
             </div>
           </div>

           {/* Google Calendar Sync — admin only */}
           {!isTherapist && (
             <div className="p-0 overflow-hidden bg-clinicPrimary text-white shadow-sm rounded-xl border border-clinicPrimary-dark/20">
               <div className="p-3.5 sm:p-4 bg-white/10 flex items-center justify-between border-b border-white/10">
                  <div className="flex items-center gap-2">
                     <FaCalendarAlt size={12} className="opacity-70"/>
                     <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Public Calendar</span>
                  </div>
                  <button onClick={() => navigate('/integrations/google')} className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 border border-white/20">Config</button>
               </div>
               <div className="p-3.5 sm:p-4">
                  <div className="flex items-center justify-between mb-3.5 sm:mb-4">
                     <h4 className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest opacity-80">Sync Status</h4>
                     <button onClick={handleSync} disabled={isSyncing} className="p-1 sm:p-1.5 bg-white/10 border border-white/20 rounded-md hover:bg-white/20 transition-all text-white disabled:opacity-50">
                        <FaSync className={isSyncing ? 'animate-spin' : ''} size={8}/>
                     </button>
                  </div>
                  <div className="flex items-center gap-3 bg-black/10 p-3 rounded-lg border border-white/10">
                     <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-[13px] sm:text-[14px] shadow-sm">G</div>
                     <div>
                        <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest">Google Calendar</p>
                        <p className="text-[8px] font-bold text-white/70 uppercase tracking-widest mt-0.5">Last sync: {lastSync}</p>
                     </div>
                  </div>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Availability;
