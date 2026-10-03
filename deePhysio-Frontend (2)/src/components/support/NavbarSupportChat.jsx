import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHeadset, FaTimes, FaPaperPlane, FaPlus, FaChevronLeft, 
  FaCircle, FaExternalLinkAlt, FaExclamationCircle, FaComments, FaListAlt 
} from 'react-icons/fa';
import { fetchApi } from '../../config/api';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const NavbarSupportChat = ({ isOpen, onClose, userRole }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'new' | 'list'
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  
  // New ticket state
  const [newSubject, setNewSubject] = useState('');
  const [newPriority, setNewPriority] = useState('High');
  const [newMessage, setNewMessage] = useState('');

  const messagesEndRef = useRef(null);
  const isSuperAdmin = userRole?.toLowerCase() === 'superadmin';

  const currentUser = (() => {
    try {
      const u = sessionStorage.getItem('deephysio_user');
      return u ? JSON.parse(u) : null;
    } catch (_) {
      return null;
    }
  })();

  // Load tickets when opened
  useEffect(() => {
    if (isOpen) {
      loadTickets();
    }
  }, [isOpen]);

  // Polling for live replies
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      if (selectedTicket?.id) {
        fetchApi(`/support/${selectedTicket.id}`)
          .then(res => res && res.ok ? res.json() : null)
          .then(data => {
            if (data?.success && data?.data) {
              setSelectedTicket(data.data);
            }
          })
          .catch(() => {});
      } else {
        const endpoint = isSuperAdmin ? '/support/saas' : '/support/tenant';
        fetchApi(endpoint)
          .then(res => res && res.ok ? res.json() : null)
          .then(data => {
            if (data?.success && Array.isArray(data?.data)) {
              setTickets(data.data);
            }
          })
          .catch(() => {});
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, selectedTicket?.id]);

  useEffect(() => {
    if (activeTab === 'chat' && selectedTicket) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.replies?.length, activeTab]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const endpoint = isSuperAdmin ? '/support/saas' : '/support/tenant';
      const res = await fetchApi(endpoint);
      if (res && res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTickets(data.data);
          if (data.data.length > 0) {
            // Find active non-closed ticket or latest
            const active = data.data.find(t => t.status !== 'Closed') || data.data[0];
            setSelectedTicket(active);
            setActiveTab('chat');
          } else {
            setActiveTab('new');
          }
        }
      }
    } catch (e) {
      console.error('Failed to load tickets', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setActiveTab('chat');
    try {
      const res = await fetchApi(`/support/${ticket.id}`);
      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          setSelectedTicket(data.data);
        }
      }
    } catch (_) {}
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      showToast('Subject and message are required', 'error');
      return;
    }
    setSending(true);
    try {
      const res = await fetchApi('/support', {
        method: 'POST',
        body: JSON.stringify({
          subject: newSubject.trim(),
          priority: newPriority,
          message: newMessage.trim(),
          userName: currentUser?.name,
          userEmail: currentUser?.email,
          clinicName: currentUser?.tenant?.clinic_name || currentUser?.clinic_name
        })
      });
      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          showToast('Problem sent to SuperAdmin! Chat initiated.', 'success');
          setNewSubject('');
          setNewMessage('');
          setSelectedTicket(data.data);
          setActiveTab('chat');
          loadTickets();
        }
      }
    } catch (e) {
      showToast('Failed to create ticket', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket?.id) return;
    setSending(true);
    try {
      const res = await fetchApi(`/support/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ 
          message: replyText.trim(),
          userName: currentUser?.name
        })
      });
      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          setReplyText('');
          setSelectedTicket(data.data);
          loadTickets();
        }
      }
    } catch (e) {
      showToast('Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99998] pointer-events-auto">
        {/* Fullscreen Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        />

        {/* Support Chat Slide-in Drawer - Fixed to right with high z-index */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] max-w-full bg-white h-screen shadow-2xl flex flex-col z-[99999] border-l border-slate-200 overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-clinicPrimary text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                <FaHeadset className="text-emerald-400" size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black tracking-tight">SuperAdmin Support</h2>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                    <FaCircle className="text-emerald-400 animate-pulse" size={6} />
                    Live Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">Direct Helpdesk & Technical Support for Clinics</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Close Chat"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs font-bold shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-white text-clinicPrimary shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FaComments size={12} />
                <span>Active Chat</span>
              </button>

              <button
                onClick={() => setActiveTab('new')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'new'
                    ? 'bg-clinicPrimary text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FaPlus size={10} />
                <span>Report Issue</span>
              </button>

              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'list'
                    ? 'bg-white text-clinicPrimary shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <FaListAlt size={11} />
                <span>All ({tickets.length})</span>
              </button>
            </div>

            <button
              onClick={() => {
                onClose();
                navigate('/support');
              }}
              title="Open full page Support Portal"
              className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-clinicPrimary px-2 py-1 rounded-md hover:bg-white/60 transition-colors cursor-pointer"
            >
              <span>Full Page</span>
              <FaExternalLinkAlt size={10} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
            {/* TAB 1: REPORT NEW ISSUE FORM */}
            {activeTab === 'new' && (
              <form onSubmit={handleCreateTicket} className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-white">
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FaHeadset size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950">SuperAdmin Ko Problem Batayein</h4>
                    <p className="text-[11px] text-emerald-900/80 mt-0.5 leading-relaxed font-medium">
                      Koi bhi dikkat ya issue aaye toh yahan message likhein. SuperAdmin se seedha connect hokar chat shuru ho jayegi.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Problem / Issue Title *
                  </label>
                  <input
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    type="text"
                    placeholder="e.g., Billing export error / WhatsApp reminder setup"
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/20 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Urgency Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Low', 'Medium', 'High'].map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setNewPriority(p)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          newPriority === p
                            ? (p === 'High' ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-200' :
                               p === 'Medium' ? 'bg-amber-50 border-amber-300 text-amber-700 ring-2 ring-amber-200' :
                               'bg-blue-50 border-blue-300 text-blue-700 ring-2 ring-blue-200')
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {p === 'High' ? '🔥 Urgent' : p === 'Medium' ? '⚡ Normal' : '💬 Query'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Issue Details / Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Aapko kya dikkat aa rahi hai detail mein likhein..."
                    className="w-full border border-slate-300 rounded-xl p-3.5 text-xs text-slate-800 outline-none focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/20 resize-none custom-scrollbar shadow-xs leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  {tickets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-6 py-2.5 bg-gradient-to-r from-clinicPrimary to-clinicPrimary-dark hover:from-clinicPrimary-dark hover:to-clinicPrimary text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    <FaPaperPlane size={11} />
                    <span>{sending ? 'Sending...' : 'SuperAdmin Ko Send Karein'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: ACTIVE LIVE CHAT */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {selectedTicket ? (
                  <>
                    {/* Active Issue Subheader */}
                    <div className="px-4 py-3 bg-white border-b border-slate-200 shrink-0 shadow-2xs flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-black text-slate-800 truncate">{selectedTicket.subject}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                            selectedTicket.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                            selectedTicket.status === 'Replied' ? 'bg-purple-100 text-purple-700 font-extrabold animate-pulse' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {selectedTicket.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                          TKT-#{String(selectedTicket.id).slice(0, 6).toUpperCase()} • Priority: {selectedTicket.priority}
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveTab('list')}
                        className="text-[11px] font-bold text-clinicPrimary hover:underline shrink-0 cursor-pointer"
                      >
                        Change Ticket
                      </button>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/70">
                      {/* Initial Question Message */}
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-[9px]">
                            C
                          </span>
                          <span className="text-[11px] font-bold text-slate-700">You (Initial Issue)</span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            {new Date(selectedTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="bg-white border border-slate-200/90 text-slate-800 p-3.5 rounded-2xl rounded-tl-xs shadow-xs text-xs whitespace-pre-wrap max-w-[90%] leading-relaxed font-medium">
                          {selectedTicket.message}
                        </div>
                      </div>

                      {/* Replies */}
                      {(selectedTicket.replies || []).map((reply, i) => {
                        const replyIsSuperAdmin = reply.is_superadmin === true ||
                          String(reply.sender || '').toLowerCase().includes('superadmin');
                        const isMine = isSuperAdmin ? replyIsSuperAdmin : !replyIsSuperAdmin;

                        return (
                          <div key={reply.id || i} className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-center gap-1.5 mb-0.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${
                                replyIsSuperAdmin
                                  ? 'bg-orange-100 text-orange-600 ring-1 ring-orange-300'
                                  : 'bg-clinicPrimary/15 text-clinicPrimary ring-1 ring-clinicPrimary/30'
                              }`}>
                                {replyIsSuperAdmin ? 'SA' : 'C'}
                              </span>
                              <span className="text-[11px] font-bold text-slate-700">
                                {replyIsSuperAdmin 
                                  ? 'SuperAdmin Support' 
                                  : (isMine 
                                      ? `${currentUser?.name || 'You'} (Admin)` 
                                      : (reply.user?.name || reply.sender || selectedTicket.user_name || 'Clinic Admin'))}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {reply.created_at && !isNaN(new Date(reply.created_at).getTime()) 
                                  ? new Date(reply.created_at || reply.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : 'Just now'}
                              </span>
                            </div>
                            <div className={`p-3.5 rounded-2xl shadow-xs text-xs whitespace-pre-wrap max-w-[90%] leading-relaxed ${
                              isMine
                                ? 'bg-clinicPrimary text-white rounded-tr-xs font-medium shadow-sm'
                                : (replyIsSuperAdmin
                                    ? 'bg-amber-50/95 border border-amber-200 text-slate-800 rounded-tl-xs shadow-xs font-medium'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs font-medium')
                            }`}>
                              {reply.message}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Area */}
                    {selectedTicket.status !== 'Closed' ? (
                      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-2xl px-3.5 py-2 focus-within:border-clinicPrimary focus-within:ring-2 focus-within:ring-clinicPrimary/20 transition-all shadow-xs">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type reply to SuperAdmin..."
                            rows={2}
                            className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none resize-none max-h-24 custom-scrollbar py-0.5 leading-relaxed"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply();
                              }
                            }}
                          />
                          <button
                            onClick={handleSendReply}
                            disabled={!replyText.trim() || sending}
                            className="px-4 py-2.5 rounded-xl bg-clinicPrimary hover:bg-clinicPrimary-dark text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5"
                          >
                            <FaPaperPlane size={11} />
                            <span>{sending ? 'Sending' : 'Send'}</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 text-right mt-1.5 font-medium">Press Enter to send, Shift+Enter for new line</p>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-100 border-t border-slate-200 text-center text-xs font-bold text-slate-500 shrink-0">
                        This issue is closed. Start a new query for additional help.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                    <div className="w-14 h-14 rounded-2xl bg-clinicPrimary/10 text-clinicPrimary flex items-center justify-center mb-3">
                      <FaHeadset size={24} />
                    </div>
                    <h3 className="text-sm font-black text-slate-800">Koi Active Chat Nahi Hai</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">SuperAdmin se connect karne ke liye naya query bhejein.</p>
                    <button
                      onClick={() => setActiveTab('new')}
                      className="mt-4 px-5 py-2.5 bg-clinicPrimary text-white rounded-xl text-xs font-bold shadow-md cursor-pointer active:scale-95"
                    >
                      + Naya Issue Batayein
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ALL ISSUES LIST */}
            {activeTab === 'list' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-3 border-clinicPrimary/30 border-t-clinicPrimary rounded-full animate-spin"></div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <FaHeadset size={20} />
                    </div>
                    <p className="text-sm font-bold text-slate-700">No support requests yet</p>
                    <p className="text-xs text-slate-400 mt-1 mb-4">Have an issue? Start a chat with SuperAdmin.</p>
                    <button
                      onClick={() => setActiveTab('new')}
                      className="px-4 py-2 bg-clinicPrimary text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      Start Support Chat
                    </button>
                  </div>
                ) : (
                  tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTicket(t)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedTicket?.id === t.id
                          ? 'bg-clinicPrimary/5 border-clinicPrimary/50 shadow-xs ring-1 ring-clinicPrimary/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-xs font-black text-slate-800 line-clamp-1">{t.subject}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                          t.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                          t.status === 'Replied' ? 'bg-purple-100 text-purple-700 font-extrabold animate-pulse' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {t.replies?.length > 0 ? t.replies[t.replies.length - 1].message : t.message}
                      </p>
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
                        <span>{t.replies?.length || 0} {t.replies?.length === 1 ? 'reply' : 'replies'}</span>
                        <span>{new Date(t.updated_at || t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default NavbarSupportChat;
