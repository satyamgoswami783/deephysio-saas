import React from 'react';
import { createPortal } from 'react-dom';
import {
  FaFileInvoice, FaPrint, FaEnvelope, FaSms, FaTrashAlt,
  FaExclamationTriangle, FaRedo, FaCalendarPlus, FaEdit,
  FaCheckCircle, FaClock, FaTimesCircle, FaUserCheck
} from 'react-icons/fa';
import ClinicalNoteIcon from '../ui/ClinicalNoteIcon';
import ArrivedIcon from '../ui/ArrivedIcon';
import AppCompleteIcon from '../ui/AppCompleteIcon';
import PatientIcon from '../ui/PatientIcon';
import { motion, AnimatePresence } from 'framer-motion';

const ActionButton = ({ icon, label, onClick, variant = 'default', primary = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all rounded-lg ${variant === 'danger'
        ? 'text-rose-500 hover:bg-rose-50'
        : primary
          ? 'text-clinicPrimary hover:bg-clinicPrimary/10 border border-clinicPrimary/20 bg-clinicPrimary/5'
          : 'text-slate-600 hover:bg-slate-50 hover:text-clinicPrimary'
      }`}
  >
    <span className="opacity-70">{icon}</span>
    {label}
  </button>
);

const AppointmentActionPopup = ({ isOpen, onClose, position, onAction, appointment, userRole = 'admin' }) => {
  if (!isOpen) return null;

  const { x, y } = position;
  const isTherapist = userRole === 'therapist';
  const isCompleted = appointment?.status === 'Completed';

  return (
    <AnimatePresence>
      {createPortal(
        <div
          className="fixed inset-0 z-[1000]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{
              top: y,
              left: x,
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            }}
            className="absolute min-w-[240px] bg-white rounded-[2rem] border border-slate-100 p-4 shadow-2xl z-[101] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-50 mb-3 bg-slate-50/50 -mx-4 -mt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Appointment Actions</p>
              <h3 className="text-sm font-black text-slate-900 leading-tight truncate">{appointment?.patientName}</h3>
            </div>

            <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">

              {/* ── Therapist Primary Actions (shown prominently for therapist role) ── */}
              {isTherapist && (
                <div className="space-y-1 pb-3 border-b border-slate-100 mb-3">
                  <p className="px-4 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Actions</p>
                  <ActionButton
                    icon={<AppCompleteIcon size={20} className="text-emerald-500" />}
                    label={isCompleted ? 'Already Completed' : 'Mark as Completed'}
                    onClick={() => onAction('complete')}
                    primary={!isCompleted}
                  />
                  <ActionButton
                  icon={<ClinicalNoteIcon className="text-amber-500" size={24} />}
                  label="Add Clinical Note"
                  onClick={() => onAction('add-note')}
                  primary
                />
                  <ActionButton
                    icon={<PatientIcon size={20} className="text-violet-500" />}
                    label="View Patient Details"
                    onClick={() => onAction('profile')}
                    primary
                  />
                </div>
              )}

              {/* Status Section */}
              <div className="space-y-1 pb-3 border-b border-slate-50 mb-3">
                <p className="px-4 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Update Status</p>
                <div className="grid grid-cols-4 gap-1 px-2">
                  {[
                    { id: 'Pending', icon: <FaClock />, color: 'text-amber-500' },
                    { id: 'Scheduled', icon: <AppCompleteIcon size={18} />, color: 'text-emerald-500' },
                    { id: 'Arrived', icon: <ArrivedIcon size={18} />, color: 'text-info' },
                    { id: 'Cancelled', icon: <FaTimesCircle />, color: 'text-rose-500' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => onAction('status', s.id)}
                      className={`p-2 rounded-xl border border-transparent hover:border-slate-100 flex flex-col items-center gap-1 transition-all ${appointment?.status === s.id ? 'bg-slate-50 border-slate-100' : ''}`}
                      title={s.id}
                    >
                      <span className={s.color}>{s.icon}</span>
                      <span className="text-[7px] font-black uppercase">{s.id.slice(0, 3)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Actions */}
              <ActionButton icon={<FaExclamationTriangle />} label="Toggle Warning" onClick={() => onAction('warning')} />
              <ActionButton icon={<FaRedo />} label="Make Recurring" onClick={() => onAction('recurring')} />
              <ActionButton icon={<FaCalendarPlus />} label="Next Appointment" onClick={() => onAction('next')} />

              <div className="h-px bg-slate-50 my-2"></div>

              {/* Non-therapist roles: full profile & invoice actions */}
              {!isTherapist && (
                <>
                  <ActionButton icon={<PatientIcon size={20} />} label="Client Details" onClick={() => onAction('profile')} />
                  <ActionButton icon={<FaFileInvoice />} label="View Invoices" onClick={() => onAction('invoices')} />
                  <ActionButton icon={<FaEdit />} label="Edit Invoice" onClick={() => onAction('edit-invoice')} />
                  <ActionButton icon={<FaPrint />} label="Print Invoice" onClick={() => onAction('print')} />

                  <div className="h-px bg-slate-50 my-2"></div>

                  <ActionButton icon={<FaEnvelope />} label="Email Invoice" onClick={() => onAction('email-invoice')} />
                </>
              )}

              {/* Message / Reminder features commented out
              <ActionButton icon={<FaEnvelope />} label="Email Reminder" onClick={() => onAction('email-remind')} />
              <ActionButton icon={<FaSms />} label="SMS Reminder" onClick={() => onAction('sms')} />
              */}

              <div className="h-px bg-slate-50 my-2"></div>

              <ActionButton icon={<FaTrashAlt />} label="Delete Appointment" variant="danger" onClick={() => onAction('delete')} />
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 text-center">
              <button onClick={onClose} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Close Menu</button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </AnimatePresence>
  );
};

export default AppointmentActionPopup;
