import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../config/api';
import {
  FaUsers, FaUserMd, FaCalendarCheck, FaCalendarDay,
  FaArrowLeft, FaSearch, FaChevronDown, FaHeadset, FaCreditCard
} from 'react-icons/fa';
import { formatCurrency } from '../utils/currency';

/* ═══════════════════════════════════════════
 *  ROLE CONFIG
 * ═══════════════════════════════════════════ */
const ROLE_CONFIG = {
  admin: { label: 'Admin', color: 'bg-violet-500', light: 'bg-violet-50 text-violet-700 border-violet-100' },
  therapist: { label: 'Therapist', color: 'bg-teal-600', light: 'bg-teal-50 text-teal-700 border-teal-100' },
  receptionist: { label: 'Receptionist', color: 'bg-blue-500', light: 'bg-blue-50 text-blue-700 border-blue-100' },
  billing: { label: 'Billing', color: 'bg-amber-500', light: 'bg-amber-50 text-amber-700 border-amber-100' },
};

const ROLE_TABS = [
  { key: 'therapist', label: 'Therapist' },
  { key: 'receptionist', label: 'Receptionist' },
  { key: 'billing', label: 'Billing' },
];

/* ── Build month options (current + last 5 months) ── */
const buildMonthOptions = () => {
  const now = new Date();
  const options = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      month: d.getMonth(),
      year: d.getFullYear(),
      label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
      isCurrent: i === 0,
    });
  }
  return options;
};

/* ── Mini stat card (compact) ── */
const MiniCard = ({ icon, label, value, accent }) => (
  <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all hover:shadow-sm ${accent
      ? 'bg-gradient-to-r from-teal-600 to-teal-700 border-teal-500 text-white'
      : 'bg-white border-slate-200'
    }`}>
    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${accent ? 'bg-white/15' : 'bg-slate-50'
      }`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className={`text-[9px] font-bold uppercase tracking-widest leading-none ${accent ? 'text-teal-200' : 'text-slate-400'
        }`}>{label}</p>
      <p className={`text-base font-extrabold mt-0.5 leading-none ${accent ? 'text-white' : 'text-slate-800'
        }`}>{value}</p>
    </div>
  </div>
);

/* ═══════════════════════════════════════════
 *  MAIN COMPONENT
 * ═══════════════════════════════════════════ */
const StaffActivity = () => {
  const navigate = useNavigate();
  const monthOptions = useMemo(() => buildMonthOptions(), []);

  const [allStaff, setAllStaff] = useState([]);     // raw from API (all appointments)
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('therapist');
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);
  const [monthOpen, setMonthOpen] = useState(false);
  const [expandedTherapist, setExpandedTherapist] = useState(null);

  /* ── Fetch all staff data once ── */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Send month/year params (backend will use if deployed, else returns all)
        const url = `/analytics/staff?month=${selectedMonth.month}&year=${selectedMonth.year}`;
        const res = await fetchApi(url);
        if (res?.ok) {
          const payload = await res.json();
          if (payload.success) {
            setAllStaff(payload.data?.staff || []);
          }
        }
      } catch (e) {
        console.error('Staff activity fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth]);

  /* ── Compute role counts from live data ── */
  const roleCounts = useMemo(() => {
    const counts = { therapist: 0, receptionist: 0, billing: 0, admin: 0 };
    allStaff.forEach(s => { if (counts[s.role] !== undefined) counts[s.role]++; });
    return counts;
  }, [allStaff]);

  /* ── Filter by search + role ── */
  const filtered = useMemo(() => {
    return allStaff.filter(s => {
      const matchesSearch =
        !search ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = s.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [allStaff, search, roleFilter]);

  /* ── Helpers ── */
  const fmtCurrency = (val) => formatCurrency(val);
  const getInitials = (name) =>
    (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  /* ═══════════════════════════════════════
   *  LOADING SKELETON
   * ═══════════════════════════════════════ */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5 animate-fade-in">
        {/* Header + cards skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="w-36 h-5 bg-slate-100 rounded animate-pulse" />
              <div className="w-24 h-3 bg-slate-50 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-[140px] h-[58px] bg-white border border-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        {/* Filter skeleton */}
        <div className="flex gap-3">
          <div className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl animate-pulse" />
          <div className="w-44 h-10 bg-slate-50 border border-slate-200 rounded-xl animate-pulse" />
          <div className="flex gap-1.5">
            {[1, 2, 3].map(i => <div key={i} className="w-24 h-10 bg-slate-50 border border-slate-200 rounded-xl animate-pulse" />)}
          </div>
        </div>
        {/* Table skeleton */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="h-11 bg-slate-50 border-b border-slate-100" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50">
              <div className="w-9 h-9 rounded-lg bg-slate-100 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="w-28 h-3 bg-slate-100 rounded animate-pulse" />
                <div className="w-40 h-2 bg-slate-50 rounded animate-pulse" />
              </div>
              <div className="w-10 h-4 bg-slate-100 rounded animate-pulse" />
              <div className="w-16 h-4 bg-slate-100 rounded animate-pulse" />
              <div className="w-10 h-4 bg-slate-100 rounded animate-pulse" />
              <div className="w-14 h-5 bg-slate-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5 animate-fade-in custom-scrollbar">

      {/* ═══════════════════════════════════════
       *  HEADER ROW + 4 MINI CARDS (same line)
       * ═══════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 w-full">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/analytics')}
            className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all duration-200 shadow-sm"
          >
            <FaArrowLeft size={12} />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 tracking-tight uppercase leading-none">Staff Activity</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {selectedMonth.label} · {allStaff.length} Members
            </p>
          </div>
        </div>

        {/* Right: 4 Mini Cards (Stretched Full Width) */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          <MiniCard
            icon={<FaUsers size={14} className="text-indigo-500" />}
            label="Total Staff"
            value={allStaff.length}
          />
          <MiniCard
            icon={<FaUserMd size={14} className="text-teal-600" />}
            label="Therapist"
            value={roleCounts.therapist}
          />
          <MiniCard
            icon={<FaHeadset size={14} className="text-blue-500" />}
            label="Receptionist"
            value={roleCounts.receptionist}
          />
          <MiniCard
            icon={<FaCreditCard size={14} className="text-amber-500" />}
            label="Billing"
            value={roleCounts.billing}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════
       *  SEARCH + MONTH FILTER + ROLE TABS
       * ═══════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all bg-white"
          />
        </div>

        {/* Month Dropdown */}
        <div className="relative">
          <button
            onClick={() => setMonthOpen(!monthOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-slate-300 transition-all min-w-[180px]"
          >
            <FaCalendarDay size={12} className="text-slate-400" />
            <span className="flex-1 text-left text-[12px]">{selectedMonth.label}</span>
            <FaChevronDown size={9} className={`text-slate-400 transition-transform duration-200 ${monthOpen ? 'rotate-180' : ''}`} />
          </button>
          {monthOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMonthOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-xl py-1 min-w-[210px] animate-fade-in">
                {monthOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setSelectedMonth(opt); setMonthOpen(false); }}
                    className={`w-full px-4 py-2.5 text-left text-[12px] font-medium transition-colors flex items-center justify-between ${selectedMonth.month === opt.month && selectedMonth.year === opt.year
                        ? 'bg-teal-50 text-teal-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                    <span>{opt.label}</span>
                    {opt.isCurrent && (
                      <span className="text-[8px] bg-teal-100 text-teal-600 px-1.5 py-0.5 rounded font-bold uppercase">Current</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Role Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ROLE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${roleFilter === tab.key
                  ? 'bg-slate-800 text-white shadow-md shadow-slate-800/20'
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════
       *  MAIN TABLE
       * ═══════════════════════════════════════ */}
      <div className={`rounded-xl overflow-hidden border transition-colors ${roleFilter === 'therapist'
          ? 'border-teal-100 bg-gradient-to-b from-teal-50/30 to-white'
          : 'border-slate-200 bg-white'
        }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`border-b ${roleFilter === 'therapist'
                  ? 'border-teal-100 bg-teal-50/50'
                  : 'border-slate-100 bg-slate-50'
                }`}>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {ROLE_CONFIG[roleFilter]?.label || 'Name'}
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  {roleFilter === 'therapist' ? 'Total Appointments' : 'System Role'}
                </th>
                {roleFilter === 'therapist' && (
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Service Income
                  </th>
                )}
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  {roleFilter === 'therapist' ? 'Today' : 'Joined Date'}
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Status
                </th>
                {roleFilter === 'therapist' && (
                  <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length > 0 ? filtered.map(member => {
                const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.admin;
                const initials = getInitials(member.name);
                const isActive = Boolean(member.isActive);
                const metrics = member.metrics || { total: 0, completed: 0, todayAppts: 0, earnings: 0 };

                const isExpanded = expandedTherapist === member.id;
                return (
                  <React.Fragment key={member.id}>
                    <tr
                      className={`transition-colors group ${roleFilter === 'therapist' ? 'hover:bg-teal-50/40' : 'hover:bg-slate-50/60'
                        }`}
                    >
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${rc.color} text-white flex items-center justify-center font-black text-[10px] shadow-sm group-hover:scale-110 transition-transform`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-slate-800 truncate group-hover:text-teal-700 transition-colors">
                              {member.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium truncate">{member.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Total Appointments OR Role */}
                      <td className="px-5 py-3.5 text-center">
                        {roleFilter === 'therapist' ? (
                          <>
                            <span className="text-sm font-extrabold text-slate-800">{metrics.total}</span>
                            {metrics.completed > 0 && (
                              <span className="text-[10px] text-emerald-500 font-bold ml-1.5">
                                ({metrics.completed} completed)
                              </span>
                            )}
                          </>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${rc.light}`}>
                            {rc.label}
                          </span>
                        )}
                      </td>

                      {/* Service Income (therapist only) */}
                      {roleFilter === 'therapist' && (
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-sm font-extrabold text-teal-700">
                            {fmtCurrency(metrics.earnings)}
                          </span>
                        </td>
                      )}

                      {/* Today OR Joined Date */}
                      <td className="px-5 py-3.5 text-center">
                        {roleFilter === 'therapist' ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${metrics.todayAppts > 0
                              ? 'bg-blue-50 text-blue-600 border border-blue-100'
                              : 'bg-slate-50 text-slate-400'
                            }`}>
                            <FaCalendarDay size={8} />
                            {metrics.todayAppts}
                          </span>
                        ) : (
                          <span className="text-[12px] font-bold text-slate-500">
                            {member.joinedDate ? new Date(member.joinedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-right">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${isActive
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-slate-50 text-slate-400 border border-slate-100'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          {isActive ? 'Active' : 'Idle'}
                        </span>
                      </td>

                      {/* View More Action */}
                      {roleFilter === 'therapist' && (
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => setExpandedTherapist(isExpanded ? null : member.id)}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${isExpanded ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-white text-teal-600 border-teal-200 hover:bg-teal-50'
                              }`}
                          >
                            {isExpanded ? 'Close' : 'View More'}
                          </button>
                        </td>
                      )}
                    </tr>

                    {/* Expanded Row showing Appointments */}
                    {roleFilter === 'therapist' && isExpanded && (
                      <tr className="bg-slate-50/50 relative">
                        <td colSpan="6" className="p-0">
                          <div className="border-b border-t border-teal-100 bg-teal-50/20 px-8 py-5 animate-fade-in">
                            <p className="text-[11px] font-extrabold text-teal-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                              Appointments & Services ({metrics.appointmentsList?.length || 0})
                            </p>
                            {metrics.appointmentsList?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {metrics.appointmentsList.map((appt, idx) => (
                                  <div key={idx} className="bg-white border border-teal-100 rounded-lg p-3 shadow-sm flex flex-col gap-1.5 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                      <span className="text-[12px] font-bold text-slate-800">{appt.patientName}</span>
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                          appt.status === 'scheduled' ? 'bg-blue-50 text-blue-600' :
                                            appt.status === 'no_show' ? 'bg-red-50 text-red-600' :
                                              'bg-slate-100 text-slate-500'
                                        }`}>
                                        {appt.status.replace('_', ' ')}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-end mt-1">
                                      <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-500 uppercase font-semibold">{appt.serviceName}</span>
                                        <span className="text-[10px] text-slate-400 font-medium pt-0.5">
                                          {new Date(appt.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                      </div>
                                      <span className="text-[13px] font-extrabold text-teal-700">{fmtCurrency(appt.price)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] font-semibold text-slate-400 italic">No appointments assigned to this therapist for this period.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }) : (
                <tr>
                  <td colSpan={roleFilter === 'therapist' ? 6 : 4} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center">
                        <FaUsers size={16} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">No {ROLE_CONFIG[roleFilter]?.label || 'staff'} members found</p>
                      <p className="text-[10px] text-slate-300 font-medium">Try adjusting your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer totals (therapist only) */}
        {roleFilter === 'therapist' && filtered.length > 0 && (
          <div className="border-t border-teal-100 bg-teal-50/30 px-5 py-2.5 flex flex-wrap items-center gap-6 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Therapists:</span>
              <span className="font-extrabold text-slate-800">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Total Appts:</span>
              <span className="font-extrabold text-slate-800">
                {filtered.reduce((s, m) => s + (m.metrics?.total || 0), 0)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Total Income:</span>
              <span className="font-extrabold text-teal-700">
                {fmtCurrency(filtered.reduce((s, m) => s + (m.metrics?.earnings || 0), 0))}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffActivity;
