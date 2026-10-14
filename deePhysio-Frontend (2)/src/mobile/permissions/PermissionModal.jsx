import React from 'react';
import { FaCamera, FaImages, FaBell, FaFolderOpen, FaTimes, FaShieldAlt } from 'react-icons/fa';

export const PermissionModal = ({
  isOpen,
  config,
  onConfirm,
  onCancel,
  isPermanentlyDenied = false
}) => {
  if (!isOpen || !config) return null;

  const renderIcon = () => {
    switch (config.icon) {
      case 'camera':
        return <FaCamera className="w-8 h-8 text-clinicPrimary" />;
      case 'photos':
        return <FaImages className="w-8 h-8 text-indigo-500" />;
      case 'bell':
        return <FaBell className="w-8 h-8 text-amber-500" />;
      case 'file':
        return <FaFolderOpen className="w-8 h-8 text-sky-500" />;
      default:
        return <FaShieldAlt className="w-8 h-8 text-clinicPrimary" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 transform transition-all animate-slide-up">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-slate-50 rounded-full border border-slate-100 shadow-inner">
          {renderIcon()}
        </div>

        <h3 className="text-lg font-bold text-center text-slate-800 mb-2">
          {config.title}
        </h3>

        <p className="text-xs text-center text-slate-500 leading-relaxed mb-6">
          {isPermanentlyDenied
            ? `${config.message} This permission is currently blocked in device settings. Tap below to open settings and enable it.`
            : config.message}
        </p>

        <div className="space-y-2.5">
          <button
            onClick={onConfirm}
            className="w-full py-3 px-4 bg-clinicPrimary text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-clinicPrimary-dark active:scale-[0.98] transition-all shadow-md shadow-clinicPrimary/20"
          >
            {isPermanentlyDenied ? 'Open Device Settings' : 'Continue & Allow'}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-2.5 px-4 bg-slate-100 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-200 active:scale-[0.98] transition-all"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionModal;
