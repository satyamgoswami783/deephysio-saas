import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ClinicalNoteIcon from '../ui/ClinicalNoteIcon';
import ArrivedIcon from '../ui/ArrivedIcon';
import AppCompleteIcon from '../ui/AppCompleteIcon';
import PatientIcon from '../ui/PatientIcon';

/* ── Status-driven color system ── */
const STATUS_STYLES = {
  scheduled:  { bg: 'bg-blue-50',    bar: 'bg-blue-500',    title: 'text-blue-900',   sub: 'text-blue-600',    badge: null },
  confirmed:  { bg: 'bg-blue-50',    bar: 'bg-blue-500',    title: 'text-blue-900',   sub: 'text-blue-600',    badge: null },
  checked_in: { bg: 'bg-amber-50',   bar: 'bg-amber-500',   title: 'text-amber-900',  sub: 'text-amber-600',   badge: null },
  completed:  { bg: 'bg-emerald-50', bar: 'bg-emerald-500', title: 'text-emerald-900', sub: 'text-emerald-600', badge: null },
  no_show:    { bg: 'bg-rose-50',    bar: 'bg-rose-500',    title: 'text-rose-900',    sub: 'text-rose-600',    badge: null },
  cancelled:  { bg: 'bg-rose-50',    bar: 'bg-rose-500',    title: 'text-rose-900',   sub: 'text-rose-700',    badge: null },
};

const getStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES.scheduled;

const AppointmentCard = ({
  appointment, onClick, onContextMenu,
  onMarkCompleted, onAddNote, onViewPatient, onMarkArrived,
  density = 'compact'
}) => {
  if (!appointment) return null;
  const { patientName = '', startTime = '', type = '', status = '' } = appointment;
  const s = getStyle(status);
  const isTerminal = status === 'completed' || status === 'no_show' || status === 'cancelled';

  const [showActions, setShowActions] = useState(false);
  const isMouse = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

  const stopAndRun = (e, fn) => {
    e.stopPropagation();
    e.preventDefault();
    fn?.();
  };

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (!isMouse && !showActions) {
      setShowActions(true);
      return;
    }
    onClick?.(e);
  };

  const densityMap = {
    compact: {
      radius: 'rounded-xl',
      contentPadding: 'px-2.5 pt-1 pb-0.5',
      title: 'text-[10px] sm:text-[11px]',
      sub: 'text-[9px]',
      actionBar: 'h-7',
      iconWrap: 'w-6 sm:w-7',
      iconSize: 13
    },
    normal: {
      radius: 'rounded-2xl',
      contentPadding: 'px-3 pt-1.5 pb-1',
      title: 'text-[11px] sm:text-[12px]',
      sub: 'text-[10px]',
      actionBar: 'h-8',
      iconWrap: 'w-7 sm:w-8',
      iconSize: 14
    },
    expanded: {
      radius: 'rounded-2xl',
      contentPadding: 'px-3.5 pt-2 pb-1.5',
      title: 'text-[12px] sm:text-[13px]',
      sub: 'text-[10px] sm:text-[11px]',
      actionBar: 'h-9',
      iconWrap: 'w-8 sm:w-9',
      iconSize: 15
    }
  };
  const d = densityMap[density] || densityMap.normal;

  return (
    <motion.div
      layoutId={`appt-${appointment.id}`}
      whileHover={{ y: -1, zIndex: 50 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleCardClick}
      onContextMenu={onContextMenu}
      className={`relative w-full h-full ${d.radius} ${s.bg} ${
        status === 'cancelled'
          ? 'border-2 border-dashed border-rose-300/80'
          : 'border border-slate-200/60'
      } shadow-[0_1px_3px_rgba(0,0,0,0.05)] cursor-pointer overflow-hidden flex flex-col transition-all duration-200 ${isTerminal ? 'opacity-90' : ''}`}
    >
      {/* Left accent bar */}
      <span className={`absolute left-0 inset-y-0 w-1.5 ${s.bar}`} />

      {/* Main Content */}
      <div className={`${d.contentPadding} flex flex-col overflow-hidden`}>
        <button
          type="button"
          title="Open appointment details"
          onClick={(e) => stopAndRun(e, () => onClick?.(e))}
          className={`text-left ${d.title} font-black leading-tight ${s.title} overflow-hidden break-words hover:underline underline-offset-2`}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {patientName}
        </button>
        <p className={`${d.sub} font-bold ${s.sub} truncate leading-tight mt-0.5`}>
          {startTime} • {type}
        </p>
      </div>

      {/* Action Bar — strictly status-driven */}
      <div className={`mt-auto bg-white/95 backdrop-blur-md ${d.actionBar} border-t border-slate-100 flex items-center justify-center gap-2 sm:gap-3 shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] px-1.5 sm:px-2`}>
        {/* Always: Profile */}
        <button
          onClick={(e) => stopAndRun(e, () => onViewPatient?.(appointment))}
          className={`relative ${d.iconWrap} h-full flex items-center justify-center text-indigo-600 hover:text-indigo-800 transition-all group/tip`}
        >
          <PatientIcon size={d.iconSize} className="stroke-[2.5]" />
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded shadow-xl opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-all duration-200 translate-y-1 group-hover/tip:translate-y-0 whitespace-nowrap z-50">
            Profile
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
          </div>
        </button>

        {/* Always: Notes */}
        <button
          onClick={(e) => stopAndRun(e, () => onAddNote?.(appointment))}
          className={`relative ${d.iconWrap} h-full flex items-center justify-center text-amber-500 hover:text-amber-700 transition-all group/tip`}
        >
          <ClinicalNoteIcon size={d.iconSize} className="stroke-[2.5]" />
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded shadow-xl opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-all duration-200 translate-y-1 group-hover/tip:translate-y-0 whitespace-nowrap z-50">
            Notes
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
          </div>
        </button>

        {/* scheduled/no_show -> show Arrived button (late-arrival recovery) */}
        {(status === 'scheduled' || status === 'no_show') && (
          <button
            onClick={(e) => stopAndRun(e, () => onMarkArrived?.(appointment.id))}
            className={`relative ${d.iconWrap} h-full flex items-center justify-center text-sky-500 hover:text-sky-700 transition-all group/tip`}
          >
            <ArrivedIcon size={d.iconSize} className="stroke-[2.5]" />
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded shadow-xl opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-all duration-200 translate-y-1 group-hover/tip:translate-y-0 whitespace-nowrap z-50">
              {status === 'no_show' ? 'Late Check In' : 'Check In'}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
            </div>
          </button>
        )}

        {/* checked_in → show Complete button */}
        {status === 'checked_in' && (
          <button
            onClick={(e) => stopAndRun(e, () => onMarkCompleted?.(appointment.id))}
            className={`relative ${d.iconWrap} h-full flex items-center justify-center text-emerald-500 hover:text-emerald-700 transition-all group/tip`}
          >
            <AppCompleteIcon size={d.iconSize} className="stroke-[2.5]" />
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded shadow-xl opacity-0 group-hover/tip:opacity-100 pointer-events-none transition-all duration-200 translate-y-1 group-hover/tip:translate-y-0 whitespace-nowrap z-50">
              Complete
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45" />
            </div>
          </button>
        )}

        {/* completed / no_show / cancelled → no action buttons */}
      </div>
    </motion.div>
  );
};

export default AppointmentCard;
