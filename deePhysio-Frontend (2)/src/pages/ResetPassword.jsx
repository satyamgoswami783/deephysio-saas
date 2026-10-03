import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaHeartbeat, FaLock, FaCheckCircle, FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const emailFromUrl = searchParams.get('email');
  const { showToast } = useToast();

  const [email, setEmail] = useState(emailFromUrl || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!tokenFromUrl && (!email || !otp)) {
      showToast('Please enter your email and 6-digit OTP code or use the reset link.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = tokenFromUrl
        ? { token: tokenFromUrl, newPassword: password }
        : { email: email.trim(), otp: otp.trim(), newPassword: password };

      const res = await fetchApi('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Failed to reset password.', 'error');
        return;
      }

      setIsSuccess(true);
      showToast('Password reset successful! You can now login.', 'success');
      
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      showToast('Network error while resetting password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-6 font-outfit">
        <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-premium border border-slate-100 text-center animate-slide-up">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
            <FaCheckCircle className="text-emerald-500" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Password Reset!</h1>
          <p className="text-[13px] font-bold text-slate-400 mt-3 leading-relaxed">
            Your clinic password has been updated securely. Redirecting to login...
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-8 w-full py-3.5 bg-clinicPrimary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-clinicPrimaryDark transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6 font-outfit">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-premium border border-slate-100 animate-slide-up space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-clinicPrimary/10 rounded-2xl flex items-center justify-center mx-auto text-clinicPrimary">
            <FaLock size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Set New Password</h1>
          <p className="text-xs text-slate-400 font-medium">
            {tokenFromUrl ? 'Enter your new clinic account password below.' : 'Enter your registered email, 6-digit OTP code and new password.'}
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          {!tokenFromUrl && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="doctor@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-clinicPrimary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">6-Digit OTP Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 684291"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-clinicPrimary"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-clinicPrimary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-clinicPrimary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-clinicPrimary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-clinicPrimaryDark transition-all disabled:opacity-50 shadow-lg"
          >
            {loading ? 'Updating Password...' : 'Reset & Save Password'}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
