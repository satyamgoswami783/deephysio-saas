import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

const Modal = ({ isOpen, onClose, title, children, footer, maxWidth = 'max-w-2xl' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) {
    // We still want AnimatePresence to handle the exit animation, 
    // but if it's the very first render and it's closed, we can return null.
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6">
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            key="modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full ${maxWidth} bg-white rounded-2xl sm:rounded-3xl shadow-premium overflow-hidden border border-slate-100 flex flex-col max-h-[95vh]`}
          >
            {/* Header */}
            <div className="px-4 py-3.5 sm:px-6 sm:py-4 md:px-8 md:py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-20">
              <h2 className="text-base sm:text-xl font-bold text-slate-900 truncate pr-2">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-clinicPrimary hover:bg-slate-50 rounded-xl transition-all active:scale-90"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Scrollable Content Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
              <div className="p-4 sm:p-6 md:p-8 text-slate-600 font-medium leading-relaxed">
                {children}
              </div>
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 sm:gap-3 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
