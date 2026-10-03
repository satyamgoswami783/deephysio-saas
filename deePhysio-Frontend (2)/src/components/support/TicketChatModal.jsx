import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchApi } from '../../config/api';
import { useToast } from '../../context/ToastContext';

const TicketChatModal = ({ isOpen, onClose, ticketId, isSuperAdmin, onStatusChange }) => {
  const { showToast } = useToast();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && ticketId) {
      loadTicketDetails();
      const interval = setInterval(() => {
        // Silent background polling
        fetchApi(`/support/${ticketId}`)
          .then(res => res && res.ok ? res.json() : null)
          .then(data => {
            if (data?.success && data?.data) {
              setTicket(data.data);
            }
          })
          .catch(() => {});
      }, 3500);

      return () => clearInterval(interval);
    }
  }, [isOpen, ticketId]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.replies?.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTicketDetails = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetchApi(`/support/${ticketId}`);
      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          setTicket(data.data);
        }
      }
    } catch (e) {
      if (!isBackground) showToast('Failed to load ticket details', 'error');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetchApi(`/support/${ticketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: replyText.trim() })
      });
      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          showToast('Reply sent', 'success');
          setReplyText('');
          loadTicketDetails(true);
          if (onStatusChange) onStatusChange(); // trigger parent refresh
        }
      }
    } catch (error) {
      showToast('Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await fetchApi(`/support/${ticketId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res && res.ok) {
        showToast(`Ticket marked as ${newStatus}`, 'success');
        loadTicketDetails(true);
        if (onStatusChange) onStatusChange();
      }
    } catch (e) {
      showToast('Failed to update status', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-10"
        >
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-clinicPrimary rounded-full animate-spin"></div>
            </div>
          ) : ticket ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-black text-slate-800">{ticket.subject}</h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ticket.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                      ticket.status === 'Replied' ? 'bg-purple-100 text-purple-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {ticket.status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ticket.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {ticket.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    Ticket #{String(ticket.id).slice(0,8).toUpperCase()} • <span className="font-bold text-slate-800">{ticket.user_name || ticket.tenant?.admin_name || 'Admin'}</span> ({ticket.tenant_name || ticket.tenant?.clinic_name || ticket.tenant?.business_name || 'Clinic'})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isSuperAdmin && ticket.status !== 'Closed' && (
                    <button 
                      onClick={() => handleUpdateStatus('Closed')}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                    >
                      Mark as Closed
                    </button>
                  )}
                  <button 
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/40 custom-scrollbar">
                {/* Original Query Message */}
                <div className="flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                      C
                    </div>
                    <span className="text-xs font-bold text-slate-700">{ticket.user_name || 'Clinic Admin'} (Initial Query)</span>
                    <span className="text-[10px] font-medium text-slate-400">{ticket.created_at && !isNaN(new Date(ticket.created_at).getTime()) ? new Date(ticket.created_at).toLocaleString() : 'Recently'}</span>
                  </div>
                  <div className="bg-white border border-slate-200 text-slate-800 p-4 rounded-2xl rounded-tl-sm shadow-xs max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed">
                    {ticket.message}
                  </div>
                </div>

                {/* Conversation Replies */}
                {(ticket.replies || []).map((reply, index) => {
                  const replyIsSuperAdmin = reply.is_superadmin === true || 
                    String(reply.sender || '').toLowerCase().includes('superadmin');
                  const isMine = isSuperAdmin ? replyIsSuperAdmin : !replyIsSuperAdmin;

                  return (
                    <div key={reply.id || index} className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-center gap-2 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          replyIsSuperAdmin ? 'bg-orange-100 text-orange-600 ring-1 ring-orange-200' : 'bg-clinicPrimary/15 text-clinicPrimary ring-1 ring-clinicPrimary/30'
                        }`}>
                          {replyIsSuperAdmin ? 'SA' : 'C'}
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          {replyIsSuperAdmin ? 'SuperAdmin Support' : (reply.user?.name || reply.sender || 'Clinic Admin')}
                          {isMine && ' (You)'}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {new Date(reply.created_at || reply.date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`p-4 rounded-2xl shadow-xs max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed ${
                        isMine 
                          ? (isSuperAdmin 
                              ? 'bg-[#d9531e] text-white rounded-tr-sm font-medium shadow-sm' 
                              : 'bg-clinicPrimary text-white rounded-tr-sm font-medium shadow-sm')
                          : (replyIsSuperAdmin 
                              ? 'bg-amber-50/90 border border-amber-200 text-slate-800 rounded-tl-sm' 
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm')
                      }`}>
                        {reply.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Area */}
              {ticket.status !== 'Closed' ? (
                <div className="px-6 py-4 bg-white border-t border-slate-100">
                  <div className="flex gap-3 items-end">
                    <textarea 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={isSuperAdmin ? "Reply as SuperAdmin Support to help clinic admin..." : "Reply to SuperAdmin support team..."}
                      className="flex-1 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/20 resize-none h-14 custom-scrollbar"
                      rows={2}
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
                      className={`px-6 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] ${
                        isSuperAdmin ? 'bg-[#d9531e] hover:bg-[#c04313]' : 'bg-clinicPrimary hover:bg-clinicPrimary-dark'
                      }`}
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">Press Enter to send, Shift+Enter for new line.</p>
                </div>
              ) : (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
                  <p className="text-sm font-bold text-slate-500">This ticket has been closed. Replies are disabled.</p>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 font-bold">Ticket not found.</div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TicketChatModal;
