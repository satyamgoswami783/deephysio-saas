import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaComment, FaEnvelope, FaChevronRight, FaRegPaperPlane } from 'react-icons/fa';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../../config/api';
import {
  MESSAGE_TEMPLATE_SETTINGS_KEY,
  DEFAULT_MESSAGE_TEMPLATES,
  normalizeTemplates,
  renderTemplate
} from '../../config/messageTemplates';

const SendMessageModal = ({ isOpen, onClose, patient }) => {
  // Messaging feature commented out
  if (!isOpen) return null;
  return null;

  useEffect(() => {
    if (!isOpen) return;
    const loadTemplates = async () => {
      try {
        const res = await fetchApi(`/settings?keys=${encodeURIComponent(MESSAGE_TEMPLATE_SETTINGS_KEY)}`);
        if (res?.ok) {
          const json = await res.json();
          const fromDb = json?.data?.[MESSAGE_TEMPLATE_SETTINGS_KEY];
          setTemplates(normalizeTemplates(fromDb));
        } else {
          setTemplates(DEFAULT_MESSAGE_TEMPLATES);
        }
      } catch (_) {
        setTemplates(DEFAULT_MESSAGE_TEMPLATES);
      }
    };
    loadTemplates();
  }, [isOpen]);

  const templateContext = {
    name: patient?.name || '',
    firstname: String(patient?.name || '').split(' ')[0] || '',
    lastname: String(patient?.name || '').split(' ').slice(1).join(' ') || '',
    clinic: 'DeePhysio'
  };

  const quickTemplates = templates.filter((tpl) =>
    activeTab === 'sms' ? tpl.type === 'SMS' : tpl.type === 'Email'
  );

  const handleSend = () => {
    if (!message.trim()) {
      showToast('Please enter a message', 'error');
      return;
    }

    setIsSending(true);
    // Simulate API call
    setTimeout(() => {
      setIsSending(false);
      showToast(`${activeTab.toUpperCase()} sent successfully to ${patient?.name}`, 'success');
      onClose();
      setMessage('');
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-slate-200"
          >
            {/* Header */}
            <div className="bg-clinicPrimary px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FaComment className="text-white/80" />
                <h2 className="font-bold text-lg">Send Message</h2>
              </div>
              <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
                <FaTimes />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setActiveTab('sms')}
                className={`flex-1 py-3 text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'sms' ? 'text-clinicPrimary border-b-2 border-clinicPrimary bg-clinicPrimary/5' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <FaComment size={12} /> SMS
              </button>
              <button
                onClick={() => setActiveTab('email')}
                className={`flex-1 py-3 text-[13px] font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'email' ? 'text-clinicPrimary border-b-2 border-clinicPrimary bg-clinicPrimary/5' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <FaEnvelope size={12} /> Email
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Patient Info */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To Patient</p>
                  <p className="text-[14px] font-bold text-slate-800">{patient?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeTab === 'sms' ? 'Phone' : 'Email'}</p>
                  <p className="text-[12px] font-medium text-slate-600">{activeTab === 'sms' ? (patient?.mobile || 'N/A') : (patient?.email || 'N/A')}</p>
                </div>
              </div>

              {/* Quick Templates */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Templates</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/communication/templates');
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-clinicPrimary hover:underline"
                  >
                    Manage
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickTemplates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => setMessage(renderTemplate(tpl.content, templateContext))}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:border-clinicPrimary hover:text-clinicPrimary transition-all active:scale-95 shadow-sm"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Your Message</p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder={`Type your ${activeTab} here...`}
                  className="w-full rounded-xl border border-slate-200 p-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary transition-all resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-[13px] font-bold text-slate-500 hover:bg-slate-100 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="flex-[2] py-3 rounded-xl bg-clinicPrimary text-white text-[13px] font-bold shadow-lg shadow-clinicPrimary/20 flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FaRegPaperPlane />
                      Send {activeTab.toUpperCase()}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SendMessageModal;
