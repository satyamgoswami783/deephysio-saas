import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';

/**
 * Usage:
 *   const [toast, setToast] = useState(null);
 *   setToast({ message: 'Saved!', type: 'success' });
 *   <Toast toast={toast} onDismiss={() => setToast(null)} />
 */
const Toast = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{    opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[999999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-white text-[14px] font-semibold sm:min-w-[280px] sm:max-w-md"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          <FaCheckCircle size={17} className="shrink-0 text-white/90" />
          <span className="flex-1">{toast.message}</span>
          <button onClick={onDismiss} className="text-white/70 hover:text-white transition-colors ml-1">
            <FaTimes size={13} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
