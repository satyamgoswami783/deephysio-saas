import React, { useState } from 'react';
import { FaTrashAlt, FaExclamationTriangle, FaTimes, FaLock } from 'react-icons/fa';
import { fetchApi, clearAllTenantState } from '../../config/api';

export const DeleteAccountModal = ({ isOpen, onClose, userEmail }) => {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDelete = async (e) => {
    e.preventDefault();
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm.');
      return;
    }
    if (!password) {
      setError('Password is required to authenticate deletion.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetchApi('/auth/delete-account', {
        method: 'POST',
        body: JSON.stringify({
          password,
          email: userEmail
        })
      });

      if (!res) {
        setError('Network error: Could not reach the server.');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Deletion failed. Please verify your password.');
        setLoading(false);
        return;
      }

      // Success: clear all storage and redirect to public login
      clearAllTenantState();
      alert('Your account has been deleted successfully. You will now be redirected.');
      window.location.href = '/login';
    } catch (err) {
      setError('An unexpected error occurred during account deletion.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-slide-up relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg"
        >
          <FaTimes className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
          <FaTrashAlt className="w-5 h-5" />
        </div>

        <h3 className="text-lg font-black text-slate-900 mb-1">Permanently Delete Account?</h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          This action will permanently delete your user login, cancel active sessions, and remove notification tokens. 
          This cannot be undone.
        </p>

        {error && (
          <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <FaExclamationTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirm your Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
              />
              <FaLock className="absolute right-3.5 top-3 text-slate-400 w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Type <span className="font-mono text-rose-600 font-black">DELETE</span> to confirm
            </label>
            <input
              type="text"
              required
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 font-mono font-bold"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || confirmText !== 'DELETE'}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20"
            >
              {loading ? 'Deleting...' : 'Permanently Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
