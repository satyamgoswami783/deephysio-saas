import React from 'react';
import {
  FaChevronLeft, FaChevronRight, FaPlus, FaCalendarAlt, FaDownload
} from 'react-icons/fa';

const CalendarHeader = ({
  view, setView, currentDate, onPrev, onNext, onToday,
  practitioners = [], selectedPractitioner, setSelectedPractitioner,
  onNewBooking, onExportAppointments, userRole = 'admin',
  slotHeight, setSlotHeight,
  statusFilter = 'all', setStatusFilter = () => {}
}) => {
  const isTherapist = userRole === 'therapist';

  const safeDate = currentDate instanceof Date && !isNaN(currentDate.getTime()) ? currentDate : new Date();
  let dateLabel = '';
  if (view === 'month') {
    dateLabel = safeDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  } else if (view === 'week') {
    const dow = safeDate.getDay();
    const diff = safeDate.getDate() - dow + (dow === 0 ? -6 : 1);
    const start = new Date(safeDate);
    start.setDate(diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    const startStr = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    dateLabel = `${startStr} - ${endStr}`;
  } else {
    dateLabel = safeDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Title + New Booking */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-clinicPrimary flex items-center justify-center text-white font-bold">
            <FaCalendarAlt size={12} />
          </div>
          <h1 className="text-sm font-bold text-slate-800 tracking-tight">
            {isTherapist ? 'My Schedule' : 'Schedule'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group/download">
            <button
              className="h-8 px-3 rounded text-[11px] border border-slate-200 bg-white text-slate-700 font-semibold flex items-center whitespace-nowrap hover:border-clinicPrimary/30 hover:text-clinicPrimary transition-colors"
              title="Download appointments"
            >
              <FaDownload size={9} className="mr-1.5" />
              Download
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 invisible group-hover/download:visible opacity-0 group-hover/download:opacity-100 transition-all origin-top-right transform scale-95 group-hover/download:scale-100">
              <button
                onClick={() => onExportAppointments('week')}
                className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-clinicPrimary transition-colors flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                Weekly Export
              </button>
              <button
                onClick={() => onExportAppointments('month')}
                className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-clinicPrimary transition-colors flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Monthly Export
              </button>
              <div className="h-px bg-slate-100 my-1 mx-2"></div>
              <button
                onClick={() => onExportAppointments('all')}
                className="w-full text-left px-4 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-clinicPrimary transition-colors flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                Export All
              </button>
            </div>
          </div>
          <button
            onClick={onNewBooking}
            className="btn-primary flex items-center whitespace-nowrap h-8 px-3 rounded text-[11px]"
          >
            <FaPlus size={8} className="mr-1" />
            Booking
          </button>
        </div>
      </div>

      {/* Row 2: Controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2 mt-1 shadow-sm">

        {/* Left: Date nav */}
        <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onToday}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-clinicPrimary hover:border-clinicPrimary/30 hover:shadow-md shadow-sm transition-all active:scale-95"
            >
              Today
            </button>
            <div className="flex bg-white border border-slate-200 rounded-lg shadow-sm">
              <button
                onClick={onPrev}
                className="px-3 py-2 text-slate-500 hover:text-clinicPrimary hover:bg-slate-50 border-r border-slate-200 transition-colors font-black flex items-center justify-center active:scale-95"
              >
                <FaChevronLeft size={11} />
              </button>
              <button
                onClick={onNext}
                className="px-3 py-2 text-slate-500 hover:text-clinicPrimary hover:bg-slate-50 transition-colors font-black flex items-center justify-center active:scale-95"
              >
                <FaChevronRight size={11} />
              </button>
            </div>
          </div>
          <span className="text-[15px] sm:text-[18px] font-black text-slate-800 tracking-tighter truncate max-w-[150px] sm:max-w-none ml-1">
            {dateLabel}
          </span>
        </div>

        {/* Right: View toggle + filters */}
        <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto px-1">
          {/* View Toggle */}
          <div className="flex shrink-0 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            {['Day', 'Week', 'Month'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v.toLowerCase())}
                className={`px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-[12px] font-semibold transition-all ${view === v.toLowerCase()
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Slot density view toggle (desktop & tablet) */}
          <div className="hidden sm:flex shrink-0 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
            {[
              { label: 'Compact', val: 100 },
              { label: 'Normal', val: 120 },
              { label: 'Expanded', val: 160 }
            ].map((d) => (
              <button
                key={d.label}
                onClick={() => setSlotHeight(d.val)}
                className={`px-2 sm:px-4 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all ${
                  slotHeight === d.val
                    ? 'bg-clinicPrimary text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
                title={`${d.label} View`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Practitioner filter — hidden for therapist role */}
          {!isTherapist && (
            <select
              value={selectedPractitioner}
              onChange={(e) => setSelectedPractitioner(e.target.value)}
              className="block shrink-0 h-8 pl-2 pr-7 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 bg-white outline-none focus:border-indigo-400 cursor-pointer"
            >
              <option value="all">All Practitioners</option>
              {practitioners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          {/* Therapist badge — show who's schedule this is */}
          {isTherapist && (
            <div className="flex shrink-0 h-8 px-3 border border-clinicPrimary/30 bg-clinicPrimary/5 rounded-lg items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-clinicPrimary"></span>
              <span className="text-[11px] font-semibold text-clinicPrimary">My Schedule</span>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Status Filters */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer shadow-sm hover:-translate-y-[1px] active:translate-y-0 transition-all ${
            statusFilter === 'all'
              ? 'bg-slate-200 border-slate-300 ring-1 ring-slate-300'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="text-[11px] font-bold text-slate-700">All</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer shadow-sm hover:-translate-y-[1px] active:translate-y-0 transition-all ${
            statusFilter === 'completed'
              ? 'bg-emerald-100 border-emerald-300 ring-1 ring-emerald-300'
              : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-bold text-emerald-700">Completed</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'no_show' ? 'all' : 'no_show')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer shadow-sm hover:-translate-y-[1px] active:translate-y-0 transition-all ${
            statusFilter === 'no_show'
              ? 'bg-rose-100 border-rose-300 ring-1 ring-rose-300'
              : 'bg-rose-50 border-rose-200 hover:bg-rose-100/70'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-[11px] font-bold text-rose-700">DNA</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'checked_in' ? 'all' : 'checked_in')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer shadow-sm hover:-translate-y-[1px] active:translate-y-0 transition-all ${
            statusFilter === 'checked_in'
              ? 'bg-amber-100 border-amber-300 ring-1 ring-amber-300'
              : 'bg-amber-50 border-amber-200 hover:bg-amber-100/70'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[11px] font-bold text-amber-700">Checked In</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'scheduled' ? 'all' : 'scheduled')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer shadow-sm hover:-translate-y-[1px] active:translate-y-0 transition-all ${
            statusFilter === 'scheduled'
              ? 'bg-blue-100 border-blue-300 ring-1 ring-blue-300'
              : 'bg-blue-50 border-blue-200 hover:bg-blue-100/70'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[11px] font-bold text-blue-700">Scheduled</span>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'cancelled' ? 'all' : 'cancelled')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer shadow-sm hover:-translate-y-[1px] active:translate-y-0 transition-all ${
            statusFilter === 'cancelled'
              ? 'bg-slate-300 border-slate-400 ring-1 ring-slate-400'
              : 'bg-slate-100 border-slate-200 hover:bg-slate-200/70'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="text-[11px] font-bold text-slate-700">Cancelled</span>
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;
