import React, { useEffect, useState } from 'react';
import AppointmentCard from './AppointmentCard';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 – 21:00

/* ─── Helpers ────────────────────────────────────────────────────────────────────── */
const toMinutes = (timeStr = '') => {
  if (!timeStr) return 0;
  // Handle legacy 12h AM/PM format
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    const [time, ampm] = timeStr.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (ampm?.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (ampm?.toUpperCase() === 'AM' && h === 12) h = 0;
    return (h - 8) * 60 + (m || 0);
  }
  // 24h HH:mm format
  const [h, m] = timeStr.split(':').map(Number);
  return (h - 8) * 60 + (m || 0); // relative to 08:00
};

const fmtSlotTime = (hour) =>
  `${hour.toString().padStart(2, '0')}:00`;

/* ─── Component ────────────────────────────────────────────────────────── */
const CalendarGrid = ({
  view, currentDate, appointments,
  onSlotClick, onAppointmentClick, onAppointmentDrop,
  practitioners = [], selectedPractitioner = 'all',
  userRole = 'admin', slotHeight = 100,
  onMarkCompleted, onAddNote, onViewPatient, onMarkArrived
}) => {
  const [selectedSlot, setSelectedSlot] = useState(null); // { cellId: string }
  const density = slotHeight <= 100 ? 'compact' : (slotHeight >= 160 ? 'expanded' : 'normal');

  /* Build week days array anchored to Monday */
  const getWeekDays = (base) => {
    const d = new Date(base);
    const dow = d.getDay();
    const diff = d.getDate() - dow + (dow === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((name, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        name,
        date: date.getDate(),
        month: date.getMonth() + 1,
        formatted: date.toISOString().split('T')[0],
        full: new Date(date),
      };
    });
  };

  const safeDate = currentDate instanceof Date && !isNaN(currentDate.getTime()) ? currentDate : new Date();
  const weekDays = getWeekDays(safeDate);
  const todayStr = safeDate.toISOString().split('T')[0];
  const displayDays =
    view === 'day'
      ? [weekDays.find(d => d.formatted === todayStr) || weekDays[0]]
      : weekDays;

  const apptsByDay = (dayFmt) =>
    appointments.filter(a => a.date === dayFmt);

  const getStackedStyle = (appt, dayAppts = []) => {
    const validDayAppts = (dayAppts || []).filter(Boolean);
    const sorted = [...validDayAppts].sort(
      (a, b) => toMinutes(a?.startTime || '') - toMinutes(b?.startTime || '') || String(a?.id || '').localeCompare(String(b?.id || ''))
    );

    const minHeight = 58; // compact but readable
    const myIdx = sorted.findIndex((a) => a?.id === appt?.id);

    let renderedTop = 0;
    let renderedHeight = 0;
    let prevRenderedBottom = 0;
    let prevEndMin = -1;

    for (let i = 0; i <= myIdx; i++) {
      const item = sorted[i];
      if (!item) continue;
      const startMin = toMinutes(item.startTime || '');
      const endMin = toMinutes(item.endTime || item.startTime || '');
      const durationMin = Math.max(endMin - startMin, minHeight);

      const actualTop = (startMin / 60) * slotHeight;
      const actualHeight = (durationMin / 60) * slotHeight;

      // If overlapping with previous timed block, stack immediately below with no extra gap.
      const itemTop = i > 0 && startMin < prevEndMin ? prevRenderedBottom : actualTop;
      const itemBottom = itemTop + actualHeight;

      prevRenderedBottom = itemBottom;
      prevEndMin = i > 0 && startMin < prevEndMin ? Math.max(prevEndMin, endMin) : endMin;

      if (i === myIdx) {
        renderedTop = itemTop;
        renderedHeight = actualHeight;
      }
    }

    return {
      top: `${renderedTop}px`,
      height: `${renderedHeight}px`,
      width: '100%',
      left: '0%',
      zIndex: 10 + myIdx,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  };

  const [dragOverCell, setDragOverCell] = useState(null);

  const handleDragStart = (e, appt) => {
    e.dataTransfer.setData('text/plain', appt.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      e.target.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDragOverCell(null);
  };

  const handleDragOver = (e, cellId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCell !== cellId) setDragOverCell(cellId);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e, targetDateFmt, targetHour, targetMin = 0) => {
    e.preventDefault();
    setDragOverCell(null);
    const apptId = e.dataTransfer.getData('text/plain');
    if (apptId && onAppointmentDrop) {
      onAppointmentDrop(apptId, targetDateFmt, targetHour, targetMin);
    }
  };

  const handleSlotClick = (d, h, m, cellId) => {
    setSelectedSlot(cellId);
    if (onSlotClick) onSlotClick(d, h, m);
  };

  /* ─── Month View ──────────────────────────────────────────────────────── */
  if (view === 'month') {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday = 0 start
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    // Build calendar cells
    const cells = [];
    // Leading days from previous month
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevMonthLast - i;
      const dt = new Date(year, month - 1, d);
      cells.push({ day: d, date: dt, currentMonth: false });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      cells.push({ day: d, date: dt, currentMonth: true });
    }
    // Trailing days from next month
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const dt = new Date(year, month + 1, d);
        cells.push({ day: d, date: dt, currentMonth: false });
      }
    }

    const realToday = new Date();
    const todayFmt = `${realToday.getFullYear()}-${String(realToday.getMonth() + 1).padStart(2, '0')}-${String(realToday.getDate()).padStart(2, '0')}`;

    const getDateFmt = (dt) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

    const statusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'confirmed': return 'bg-emerald-400';
        case 'pending': return 'bg-amber-400';
        case 'arrived': return 'bg-blue-400';
        case 'completed': return 'bg-slate-400';
        case 'cancelled': return 'bg-red-400';
        default: return 'bg-indigo-400';
      }
    };

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">

        {/* Month View Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 shrink-0">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="py-2.5 text-center border-r border-slate-100 last:border-0 truncate">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest">{d.slice(0, 3)}</span>
            </div>
          ))}
        </div>

        {/* Month grid */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden appointment-scrollbar">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-slate-100 last:border-0" style={{ minHeight: '90px' }}>
              {week.map((cell, ci) => {
                const dateFmt = getDateFmt(cell.date);
                const isToday = dateFmt === todayFmt;
                const dayAppts = appointments.filter(a => a.date === dateFmt);
                const hasAppts = dayAppts.length > 0;
                const isCurrentDate = dateFmt === getDateFmt(currentDate);

                return (
                  <div
                    key={ci}
                    onClick={() => {
                      if (hasAppts && dayAppts.length === 1) {
                        onAppointmentClick?.(dayAppts[0]);
                      } else if (onSlotClick) {
                        onSlotClick(cell.date, 9, 0);
                      }
                    }}
                    className={`
                      relative border-r border-slate-100 last:border-0 p-1.5 cursor-pointer transition-all group
                      ${!cell.currentMonth ? 'bg-slate-50/50' : 'bg-white'}
                      ${isToday ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-200' : ''}
                      ${isCurrentDate && !isToday ? 'bg-sky-50/40' : ''}
                      hover:bg-indigo-50/50
                    `}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-1">
                      <span className={`
                        inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-bold transition-colors
                        ${isToday
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : cell.currentMonth
                            ? 'text-slate-700 group-hover:bg-slate-100'
                            : 'text-slate-300'
                        }
                      `}>
                        {cell.day}
                      </span>
                      {hasAppts && (
                        <span className={`
                          text-[9px] font-bold px-1.5 py-0.5 rounded-full
                          ${isToday ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}
                        `}>
                          {dayAppts.length}
                        </span>
                      )}
                    </div>

                    {/* Appointment previews */}
                    {cell.currentMonth && dayAppts.slice(0, 3).map((appt, ai) => (
                      <div
                        key={appt.id}
                        onClick={(e) => { e.stopPropagation(); onAppointmentClick?.(appt); }}
                        className={`
                          flex items-center gap-1 mb-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium truncate cursor-pointer
                          transition-all hover:shadow-sm
                          ${appt.isEmergency
                            ? 'bg-red-50 text-red-700 border border-red-200/60 hover:bg-red-100'
                            : 'bg-white border border-slate-200/60 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                          }
                        `}
                        title={`${appt.patientName} • ${appt.startTime} - ${appt.endTime}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor(appt.status)}`} />
                        <span className="truncate">{appt.patientName}</span>
                      </div>
                    ))}

                    {/* "+N more" indicator */}
                    {cell.currentMonth && dayAppts.length > 3 && (
                      <div className="text-[9px] font-semibold text-indigo-500 pl-1 mt-0.5">
                        +{dayAppts.length - 3} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isDay = view === 'day';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative h-full">
      {/* ── Main Horizontal Scroll Container ── */}
      <div className="flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden appointment-scrollbar flex flex-col relative">
        <div className={`flex flex-col h-full ${isDay ? 'min-w-full' : 'min-w-[700px] md:min-w-full'}`}>

          {/* ── Day headers (Sticky top for vertical scroll) ── */}
          <div className="flex shrink-0 border-b border-slate-200 bg-slate-50/70 sticky top-0 z-20 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
            {/* Corner time gutter */}
            <div className="w-14 sm:w-20 shrink-0 border-r border-slate-200 bg-slate-50/30 sticky left-0 z-30" />
            <div className={`flex-1 grid ${isDay ? 'grid-cols-1' : 'grid-cols-7'}`}>
              {displayDays.map((d, i) => {
                const isToday = d.formatted === new Date().toISOString().split('T')[0];
                return (
                  <div
                    key={i}
                    className="py-2.5 px-1 text-center border-r border-slate-100 last:border-0 flex flex-col justify-center items-center"
                  >
                    <p className={`text-[11px] sm:text-[12px] font-black ${isToday ? 'text-indigo-600' : 'text-slate-900'}`}>
                      {d.name}
                    </p>
                    <p className={`text-[10px] sm:text-[11px] font-bold ${isToday ? 'text-indigo-400' : 'text-slate-500'}`}>
                      {d.date}/{d.month}
                    </p>
                    {isToday && <div className="mt-0.5 w-1 h-1 rounded-full bg-indigo-500" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Time grid (Scrollable vertically) ── */}
          <div className="flex-1 overflow-y-auto appointment-scrollbar relative">
            <div className="flex min-h-full pb-32">
              {/* Time column (Sticky left for horizontal scroll) */}
              <div className="w-14 sm:w-20 shrink-0 border-r border-slate-200 bg-slate-50/30 sticky left-0 z-10">
                {HOURS.flatMap(h => [h, h + 0.5]).map(timeValue => {
                  const h = Math.floor(timeValue);
                  const m = timeValue % 1 === 0.5 ? 30 : 0;
                  const isHalf = m === 30;
                  const label = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                  return (
                    <div
                      key={timeValue}
                      className="flex items-start justify-end pr-2 sm:pr-3"
                      style={{ height: slotHeight / 2 }}
                    >
                      <span className={`text-[9px] sm:text-[10px] font-black ${isHalf ? 'text-slate-500' : 'text-slate-900 pt-1'}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Day columns */}
              <div className={`flex-1 grid ${isDay ? 'grid-cols-1' : 'grid-cols-7'}`}>
                {displayDays.map((d, dayIdx) => (
                  <div key={dayIdx} className="relative border-r border-slate-100 last:border-0 bg-white">
                    {/* Empty 30-min slots */}
                    {HOURS.flatMap(h => [h, h + 0.5]).map(timeValue => {
                      const h = Math.floor(timeValue);
                      const m = timeValue % 1 === 0.5 ? 30 : 0;
                      const timeStr = `${h}:${m === 0 ? '00' : '30'}`;
                      const cellId = `${d.formatted}-${timeStr}`;
                      const isDragOver = dragOverCell === cellId;
                      const isSelected = selectedSlot === cellId;

                      const isBooked = apptsByDay(d.formatted).some(appt => {
                        if (!appt) return false;
                        const apptStart = toMinutes(appt.startTime || '');
                        const apptEnd = toMinutes(appt.endTime || appt.startTime || '');
                        const slotStart = (h - 8) * 60 + m;
                        const slotEnd = slotStart + 30;
                        
                        const therapistMatch = selectedPractitioner === 'all' || Number(appt.therapistId) === Number(selectedPractitioner);
                        return therapistMatch && (apptStart < slotEnd && apptEnd > slotStart);
                      });

                      return (
                        <div
                          key={timeValue}
                          onClick={() => !isBooked && handleSlotClick(d.full, h, m, cellId)}
                          onDragOver={(e) => !isBooked && handleDragOver(e, cellId)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => !isBooked && handleDrop(e, d.formatted, h, m)}
                          className={`
                            relative border-b transition-all group
                            ${m === 0 ? 'border-b-slate-200' : 'border-b-slate-100'} 
                            ${isBooked ? 'bg-red-50/40 cursor-not-allowed' : 'cursor-pointer hover:bg-indigo-50/40'}
                            ${isDragOver ? 'bg-indigo-50/80 border border-indigo-200 border-dashed z-20 shadow-inner' : ''}
                            ${isSelected ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-500/20 z-10' : ''}
                          `}
                          style={{ height: slotHeight / 2 }}
                        >
                          {isBooked && !apptsByDay(d.formatted).some(a => toMinutes(a?.startTime || '') === ((h-8)*60+m)) && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                              <span className="text-[8px] font-bold text-red-400 uppercase tracking-tighter">Busy</span>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Appointment cards */}
                    <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none z-10">
                      {apptsByDay(d.formatted).map(appt => (
                        <div
                          key={appt.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, appt)}
                          onDragEnd={handleDragEnd}
                          className="absolute inset-x-0 px-0.5 pointer-events-auto cursor-grab active:cursor-grabbing transition-opacity"
                          style={getStackedStyle(appt, apptsByDay(d.formatted))}
                        >
                          <AppointmentCard
                            appointment={appt}
                            onClick={(e) => { e.stopPropagation(); onAppointmentClick?.(appt); }}
                            onContextMenu={(e) => e.preventDefault()}
                            onMarkCompleted={onMarkCompleted}
                            onAddNote={onAddNote}
                            onViewPatient={onViewPatient}
                            onMarkArrived={onMarkArrived}
                            density={density}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarGrid;
