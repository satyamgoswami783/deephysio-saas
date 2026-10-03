import React, { useState, useEffect } from 'react';
import { FaSearch, FaExclamationTriangle, FaTrash, FaPause, FaPlay, FaPoundSign, FaFileInvoice, FaClock, FaCheckCircle, FaPaperPlane, FaTimes, FaGoogle } from 'react-icons/fa';
import { fetchApi } from '../config/api';
import { useToast } from '../context/ToastContext';
import { getInvoiceDisplayNumber } from '../utils/invoiceDisplay';
import { formatCurrency } from '../utils/currency';

/**
 * ========================================================
 *  PAYMENT REMINDERS — PERFECT FLOW
 * ========================================================
 * 
 *  DATA SOURCE:  GET /api/invoices  (Real database)
 *  
 *  WHAT IT SHOWS:
 *    - All invoices with status !== 'PAID'
 *    - Each row = 1 unpaid invoice from the database
 *    - Patient Name, Amount, Overdue Age = all from real invoice data
 *
 *  STATS CARDS (all real-time):
 *    1. Total Overdue    = SUM of all pending invoice totals
 *    2. Collected (MTD)  = SUM of all PAID invoices created this month
 *    3. Pending Invoices = COUNT of unpaid invoices
 *    4. Oldest Overdue   = Age of the oldest unpaid invoice
 *
 *  ACTIONS:
 *    - Pause/Resume = Temporarily mute a reminder (local state only)
 *    - Dismiss      = Remove from this view (stored in localStorage)
 *    - Search       = Filter by patient name
 *    - Stage Filter = Filter by urgency level
 * ========================================================
 */

const PaymentReminders = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emailDraft, setEmailDraft] = useState(null);

  // Stats computed from real data
  const [stats, setStats] = useState({
    totalOverdue: 0,
    collectedMTD: 0,
    pendingCount: 0,
    oldestDays: 0
  });

  // Dismissed invoice IDs (persisted so they don't reappear on refresh)
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('deephysio_dismissed_reminders') || '[]'); }
    catch { return []; }
  });

  // Paused invoice IDs (persisted)
  const [paused, setPaused] = useState(() => {
    try { return JSON.parse(localStorage.getItem('deephysio_paused_reminders') || '[]'); }
    catch { return []; }
  });

  // ── Fetch all invoices from the real database ──
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await fetchApi('/invoices');
        if (!response) return;
        const json = await response.json();
        const invoices = json?.success ? json.data : [];

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // ── Separate PAID vs PENDING (Self-Correcting Logic) ──
        const pending = invoices.filter(inv => {
          const totalPaid = Array.isArray(inv.payments) ? inv.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) : 0;
          const isFullyPaid = String(inv.status || '').toUpperCase() === 'PAID' || totalPaid >= Number(inv.total || 0) - 0.01;
          const remainingAmount = Number(inv.total || 0) - totalPaid;
          return !isFullyPaid && remainingAmount > 0.01;
        });

        const paidThisMonth = invoices.filter(inv => {
          const totalPaid = Array.isArray(inv.payments) ? inv.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) : 0;
          const isFullyPaid = String(inv.status || '').toUpperCase() === 'PAID' || totalPaid >= Number(inv.total || 0) - 0.01;
          return isFullyPaid && new Date(inv.date || inv.createdAt || inv.created_at) >= startOfMonth;
        });

        // ── Calculate real stats ──
        const totalOverdue = pending.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
        const collectedMTD = paidThisMonth.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

        // ── Map pending invoices to reminder rows ──
        let oldestDays = 0;
        const mapped = pending
          .filter(inv => !dismissed.includes(inv.id))  // hide dismissed
          .map(inv => {
            const createdAt = new Date(inv.created_at || inv.createdAt || inv.date).getTime();
            const ageDays = Math.max(0, Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));
            if (ageDays > oldestDays) oldestDays = ageDays;

            const firstName = inv.patient?.firstName || inv.patient?.first_name || '';
            const lastName = inv.patient?.lastName || inv.patient?.last_name || '';
            const totalPaid = Array.isArray(inv.payments) ? inv.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) : 0;
            const amount = Math.max(0, Number(inv.total || 0) - totalPaid);

            // Determine urgency stage based on overdue age
            let stage = 'New';
            if (ageDays >= 30) stage = 'Final Notice';
            else if (ageDays >= 14) stage = 'Overdue';
            else if (ageDays >= 7) stage = 'Follow-up';
            else stage = 'New';

            return {
              id: inv.id,
              invoiceNumber: getInvoiceDisplayNumber(inv, inv.id),
              patient: `${firstName} ${lastName}`.trim() || 'Unknown Patient',
              email: inv.patient?.email || `${(firstName || 'patient').toLowerCase().replace(/\s+/g, '')}@example.com`,
              amount,
              formattedAmount: formatCurrency(amount),
              ageDays,
              ageLabel: ageDays === 0 ? 'Today' : ageDays === 1 ? '1 Day' : `${ageDays} Days`,
              stage,
              isPaused: paused.includes(inv.id)
            };
          });

        setReminders(mapped);
        setStats({
          totalOverdue,
          collectedMTD,
          pendingCount: mapped.length,
          oldestDays
        });
      } catch (error) {
        console.error('Failed to load reminders:', error);
        showToast('Failed to load reminder data.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [dismissed]);

  // ── Pause / Resume a reminder ──
  const handleTogglePause = (id) => {
    const newPaused = paused.includes(id) 
      ? paused.filter(p => p !== id) 
      : [...paused, id];
    setPaused(newPaused);
    localStorage.setItem('deephysio_paused_reminders', JSON.stringify(newPaused));
    setReminders(prev => prev.map(r => r.id === id ? { ...r, isPaused: !r.isPaused } : r));
    showToast(paused.includes(id) ? 'Reminder resumed.' : 'Reminder paused.', 'success');
  };

  // ── Dismiss (remove from view) ──
  const handleDismiss = (id) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    localStorage.setItem('deephysio_dismissed_reminders', JSON.stringify(newDismissed));
    showToast('Reminder dismissed.', 'success');
  };

  // ── Send Reminder (Open Preview Modal) ──
  const handleSendReminder = (reminder) => {
    const { patient, email, formattedAmount, id, stage, invoiceNumber } = reminder;
    const invoiceRef = invoiceNumber || id.split('-').pop()?.toUpperCase() || id;
    
    let subject = `Invoice Payment Reminder - DeePhysio (${invoiceRef})`;
    let body = `Dear ${patient},\n\nThis is a friendly reminder that your invoice ${invoiceRef} for the amount of ${formattedAmount} is currently ${stage.toLowerCase()}.\n\nPlease arrange for payment at your earliest convenience.\n\nThank you,\nDeePhysio Team`;

    if (stage === 'Final Notice') {
        subject = `URGENT: Final Notice for Invoice ${invoiceRef}`;
        body = `Dear ${patient},\n\nThis is a final notice regarding your overdue invoice ${invoiceRef} for the amount of ${formattedAmount}.\n\nPlease ensure immediate payment to avoid further action.\n\nThank you,\nDeePhysio Team`;
    }

    setEmailDraft({
      patientName: patient,
      email: email || '',
      subject,
      body
    });
  };

  const handleConfirmSendEmail = () => {
    if (!emailDraft) return;
    // Specific Gmail Web Compose URL
    const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailDraft.email}&su=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`;
    window.open(gmailLink, '_blank');
    showToast(`Redirecting to Gmail for ${emailDraft.patientName}...`, 'success');
    setEmailDraft(null);
  };

  // ── Filter logic ──
  const filteredReminders = reminders.filter(r => {
    const matchesSearch = r.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.invoiceNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'All' || r.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  // ── Stage styling ──
  const getStageStyle = (stage) => {
    switch (stage) {
      case 'Final Notice': return { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', bar: 'bg-rose-500', width: '100%' };
      case 'Overdue': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', bar: 'bg-amber-500', width: '65%' };
      case 'Follow-up': return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', bar: 'bg-blue-500', width: '40%' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-100', bar: 'bg-clinicPrimary', width: '15%' };
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-8 animate-fade-in custom-scrollbar font-sans">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Payment Reminders</h1>
          <p className="text-slate-400 font-bold mt-2 text-sm">Track overdue invoices and manage payment follow-ups.</p>
        </div>
      </div>

      {/* ── Stats Cards (100% Real-Time) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Overdue */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-colors">
          <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-125"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center"><FaExclamationTriangle size={14} /></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Overdue</span>
            </div>
            <h3 className="text-2xl font-black text-slate-900">{formatCurrency(stats.totalOverdue)}</h3>
            <p className="text-[9px] font-bold text-rose-500 mt-2 uppercase tracking-widest">From {stats.pendingCount} unpaid invoices</p>
          </div>
        </div>

        {/* Card 2: Collected This Month */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center"><FaPoundSign size={14} /></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Collected This Month</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{formatCurrency(stats.collectedMTD)}</h3>
          <p className="text-[9px] font-bold text-emerald-500 mt-2 uppercase tracking-widest">From paid invoices this month</p>
        </div>

        {/* Card 3: Pending Invoices */}
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><FaFileInvoice size={14} /></div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Invoices</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{stats.pendingCount}</h3>
          <p className="text-[9px] font-bold text-blue-500 mt-2 uppercase tracking-widest">Awaiting payment</p>
        </div>

        {/* Card 4: Oldest Overdue */}
        <div className="p-6 bg-clinicDark rounded-2xl shadow-sm text-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-clinicPrimary flex items-center justify-center"><FaClock size={14} /></div>
            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Oldest Overdue</span>
          </div>
          <h3 className="text-2xl font-black text-white">{stats.oldestDays} Days</h3>
          <p className="text-[9px] font-bold text-clinicPrimary mt-2 uppercase tracking-widest">Longest unpaid invoice</p>
        </div>
      </div>

      {/* ── Search & Filters ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row items-center gap-4 bg-slate-50/30">
          <div className="relative flex-1 group w-full">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-300 group-focus-within:text-clinicPrimary transition-colors">
              <FaSearch size={13} />
            </span>
            <input
              type="text"
              placeholder="Search patient name..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-sm font-bold text-slate-600 outline-none placeholder:text-slate-300 focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full md:w-auto bg-white border border-slate-100 rounded-xl px-4 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest outline-none cursor-pointer"
          >
            <option value="All">All Stages</option>
            <option value="New">New (0–6 days)</option>
            <option value="Follow-up">Follow-up (7–13 days)</option>
            <option value="Overdue">Overdue (14–29 days)</option>
            <option value="Final Notice">Final Notice (30+ days)</option>
          </select>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
              <tr>
                <th className="px-6 py-4 w-[30%]">Patient</th>
                <th className="px-6 py-4 w-[12%] text-center">Overdue</th>
                <th className="px-6 py-4 w-[15%] text-center">Amount</th>
                <th className="px-6 py-4 w-[23%]">Urgency Stage</th>
                <th className="px-6 py-4 w-[20%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-clinicPrimary/30 border-t-clinicPrimary rounded-full animate-spin mb-3"></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading invoices...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredReminders.length > 0 ? filteredReminders.map(rem => {
                const style = getStageStyle(rem.stage);
                return (
                  <tr key={rem.id} className={`hover:bg-slate-50/50 transition-all group ${rem.isPaused ? 'opacity-40' : ''}`}>
                    {/* Patient */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border shadow-sm transition-all ${rem.isPaused ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-clinicPrimary group-hover:text-white group-hover:border-clinicPrimary'}`}>
                          {rem.patient[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 group-hover:text-clinicPrimary transition-colors">{rem.patient}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            {rem.isPaused && <span className="text-amber-500 mr-1">⏸ PAUSED ·</span>}
                            Invoice {rem.invoiceNumber}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Overdue Age */}
                    <td className="px-6 py-5 text-center">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${style.bg} ${style.text} ${style.border}`}>
                        {rem.ageLabel}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-5 text-center">
                      <p className="text-lg font-black text-slate-900 tracking-tight">{rem.formattedAmount}</p>
                    </td>

                    {/* Stage */}
                    <td className="px-6 py-5">
                      <div className="space-y-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${style.text}`}>
                          {rem.stage}
                        </p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${style.bar}`} style={{ width: style.width }}></div>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSendReminder(rem)}
                          title="Send Email Reminder"
                          disabled={rem.isPaused}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${rem.isPaused ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-clinicPrimary text-white shadow-google hover:-translate-y-0.5'}`}
                        >
                          <FaPaperPlane size={10} /> Email
                        </button>
                        <button
                          onClick={() => handleTogglePause(rem.id)}
                          title={rem.isPaused ? 'Resume' : 'Pause'}
                          className={`p-2.5 rounded-lg border text-[10px] font-black transition-all active:scale-90 ${rem.isPaused ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'}`}
                        >
                          {rem.isPaused ? <FaPlay size={11} /> : <FaPause size={11} />}
                        </button>
                        <button
                          onClick={() => handleDismiss(rem.id)}
                          title="Dismiss"
                          className="p-2.5 rounded-lg border bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100 transition-all active:scale-90"
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FaCheckCircle size={32} className="text-emerald-300" />
                      <p className="text-sm font-bold text-slate-400">All clear! No pending reminders.</p>
                      <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">All invoices are paid or dismissed</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-50 flex items-center justify-between">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            Showing {filteredReminders.length} of {reminders.length} reminders
          </p>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
            Data Source: Live Invoice Database
          </p>
        </div>
      </div>

      {/* ── Email Preview Modal ── */}
      {emailDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[32px] shadow-premium w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-clinicPrimary/10 text-clinicPrimary flex items-center justify-center">
                  <FaPaperPlane size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Draft Email</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review before sending</p>
                </div>
              </div>
              <button 
                onClick={() => setEmailDraft(null)}
                className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 transition-all active:scale-90 shadow-sm"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">To (Patient Email)</label>
                <input 
                  type="email" 
                  value={emailDraft.email} 
                  onChange={(e) => setEmailDraft({...emailDraft, email: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-clinicPrimary transition-colors"
                  placeholder="patient@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                <input 
                  type="text" 
                  value={emailDraft.subject} 
                  onChange={(e) => setEmailDraft({...emailDraft, subject: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-clinicPrimary transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Body</label>
                <textarea 
                  value={emailDraft.body} 
                  onChange={(e) => setEmailDraft({...emailDraft, body: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-600 outline-none focus:border-clinicPrimary transition-colors min-h-[200px] resize-y"
                ></textarea>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/50 flex justify-end gap-4">
              <button 
                onClick={() => setEmailDraft(null)}
                className="px-8 py-3.5 rounded-xl border border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-white transition-all shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSendEmail}
                className="px-8 py-3.5 rounded-xl bg-clinicPrimary text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:shadow-google hover:-translate-y-0.5 transition-all active:scale-95 shadow-md"
              >
                <FaGoogle size={12} /> Send via Gmail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentReminders;
