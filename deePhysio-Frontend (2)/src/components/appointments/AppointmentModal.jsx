import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FaCalendarPlus, FaUserAlt, FaStethoscope, FaClock, FaDoorOpen } from 'react-icons/fa';

const AppointmentModal = ({ isOpen, onClose, onSave, appointment = null, initialData = {} }) => {
  const isEditing = !!appointment;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={isEditing ? "Edit Appointment Details" : "Schedule New Appointment"}
      footer={
        <div className="flex flex-col sm:flex-row gap-3 justify-end w-full">
          <Button variant="secondary" className="w-full sm:w-auto" onClick={onClose}>Abort Change</Button>
          <Button variant="accent" className="w-full sm:w-auto" onClick={() => onSave(appointment)} icon={<FaCalendarPlus />}>
            {isEditing ? "Update Schedule" : "Confirm Booking"}
          </Button>
        </div>
      }
    >
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Patient Selection */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Patient Identity</label>
          <div className="relative group">
            <div className="absolute left-4 top-11 -translate-y-1/2 text-clinicPrimary">
              <FaUserAlt size={14} />
            </div>
            <select className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer appearance-none shadow-inner-soft">
              <option>Alice Johnson (PID-102)</option>
              <option>Bob Smith (PID-205)</option>
              <option>John Smith (PID-301)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Service Type */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Clinical Service</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-clinicPrimary">
                <FaStethoscope size={14} />
              </div>
              <select className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer appearance-none shadow-inner-soft">
                <option>Physiotherapy Session</option>
                <option>Initial Assessment</option>
                <option>Sports Massage</option>
                <option>Rehab Consultation</option>
              </select>
            </div>
          </div>

          {/* Room */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Assigned Station</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-clinicPrimary">
                <FaDoorOpen size={14} />
              </div>
              <select className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer appearance-none shadow-inner-soft">
                <option>Consultation Room A</option>
                <option>Therapy Suite 1</option>
                <option>Main Rehab Area</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Date/Time */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Schedule Window</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-clinicPrimary">
                <FaClock size={14} />
              </div>
              <input 
                type="datetime-local" 
                defaultValue={initialData.dateTime || "2026-03-18T10:00"}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all shadow-inner-soft dark:color-scheme-light" 
              />
            </div>
          </div>

          {/* Practitioner */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Allocated Practitioner</label>
            <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[13px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer shadow-inner-soft">
              <option>Dr. Sarah Wilson</option>
              <option>Dr. Michael Chen</option>
              <option>Emily Rose</option>
            </select>
          </div>
        </div>

        {/* Booking Source */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Engagement Source</label>
          <div className="flex flex-col sm:flex-row gap-4">
             {['Internal', 'Insurer Portal', 'Widget'].map(opt => (
               <label key={opt} className="flex-1 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center gap-4 cursor-pointer hover:bg-white hover:shadow-soft transition-all">
                 <input type="radio" name="bookedBy" defaultChecked={opt === 'Internal'} className="w-5 h-5 text-clinicPrimary focus:ring-clinicPrimary/20" />
                 <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{opt}</span>
               </label>
             ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AppointmentModal;
