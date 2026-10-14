import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { FaHeartbeat, FaChevronRight, FaShieldAlt, FaUser, FaFileInvoice, FaEnvelope, FaLock, FaArrowLeft } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { fetchApi, clearAllTenantState } from '../config/api';
import LanguageSwitcher from '../components/LanguageSwitcher';

/**
 * HIGH-FIDELITY MINIMALIST LOGIN GATEWAY
 * A centered, ultra-premium medical portal entry.
 */
const Login = () => {
  const navigate = useNavigate();
  const toastCtx = useToast();
  const showToast = toastCtx?.showToast || console.log;
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPassword, setForgotPassword] = useState('');
  const [forgotConfirm, setForgotConfirm] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [clinicProfile, setClinicProfile] = useState({ clinicName: 'ClinicPilot', logoDataUrl: '' });
  const [isBrandingLoaded, setIsBrandingLoaded] = useState(false);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const res = await fetchApi('/public/config');
        if (res && res.ok) {
          const json = await res.json();
          if (json.data && json.data.clinicProfile) {
            setClinicProfile(json.data.clinicProfile);
          }
        }
      } catch (e) {
        // silently fail and use defaults
      } finally {
        setIsBrandingLoaded(true);
      }
    };
    fetchBranding();
  }, [navigate]);

  // If already logged in, redirect away from login page
  useEffect(() => {
    const existingToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (existingToken && existingToken !== 'null' && existingToken !== 'undefined') {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const roleCredentials = {
    superadmin: { email: 'superadmin@deephysio.com', password: 'superadmin123' },
    admin: { email: 'admin@deephysio.com', password: 'admin123' },
    therapist: { email: 'therapist@deephysio.com', password: 'therapist123' },
    receptionist: { email: 'receptionist@deephysio.com', password: 'receptionist123' },
    billing: { email: 'billing@deephysio.com', password: 'billing123' }
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setEmail(roleCredentials[role].email);
    setPassword(roleCredentials[role].password);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetchApi(`/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      
      if (!res) return; 

      const data = await res.json();

      if (!res.ok) {
        showToast(data.message || 'Access Denied. Please check your credentials.', 'error');
        return;
      }

      if (data.success) {
        const token = data.data.token;
        const user = data.data.user;

        // Clear any stale data from a previous session first
        clearAllTenantState();

        sessionStorage.setItem("token", token);
        sessionStorage.setItem("deephysio_user", JSON.stringify(user));
        sessionStorage.setItem("deephysio_role", user.role);

        // Also persist to localStorage for native app & PWA restart continuity
        localStorage.setItem("token", token);
        localStorage.setItem("deephysio_user", JSON.stringify(user));
        localStorage.setItem("deephysio_role", user.role);

        showToast('Access Granted. Welcome to DeePhysio.', 'success');
        
        // Force full page reload instead of SPA navigate to ensure
        // all React state (userRole, userData, permissions) is freshly
        // initialized from the new user's sessionStorage data.
        // This prevents stale permission state from a previous user
        // causing "Access Denied" on fast logout→login switches.
        window.location.href = "/dashboard";

      } else {
        showToast(data.message || 'Authentication failed.', 'error');
      }

    } catch (err) {
      showToast('Network error: Unable to reach the server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      showToast('Please enter your email address.', 'error');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetchApi('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          email: forgotEmail
        })
      });

      if (!res) return;
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.message || 'Failed to send reset link.', 'error');
        return;
      }

      showToast(data.message || 'Reset link sent! Please check your inbox.', 'success');
      setShowForgotModal(false);
    } catch (err) {
      showToast('Network error while requesting reset link.', 'error');
    } finally {
      setForgotLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-6 relative overflow-hidden font-outfit">
      {/* Dynamic Background Orbs */}
      <div className="absolute top-[-15%] left-[-5%] w-[60vw] h-[60vw] bg-clinicPrimary/10 rounded-full blur-[140px] animate-float pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-clinicSecondary/5 rounded-full blur-[120px] pointer-events-none rotate-45"></div>
      
      {/* Ultra-Fine Particle Overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')]"></div>

      {/* Back to Landing Page Button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:shadow-md hover:scale-105 border border-slate-200 text-slate-500 hover:text-clinicPrimary transition-all duration-300"
      >
        <FaArrowLeft size={14} />
      </button>

      {/* Language Switcher Dropdown */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-[520px] relative z-10">
        {/* The Perfection Gateway Card */}
        <div className="bg-white/90 backdrop-blur-3xl p-8 sm:p-10 rounded-[2.5rem] shadow-premium border border-white/80 hover:border-clinicPrimary/30 transition-all duration-700 relative overflow-hidden group/card animate-slide-up">
          <div className="relative z-10">
            {/* Branding & Logo Header */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-lg shadow-slate-200/60 border border-slate-100 p-2.5 mb-3.5 flex items-center justify-center group hover:scale-105 transition-all duration-300">
                <img 
                  src={clinicProfile.logoDataUrl || "/logo.png"} 
                  alt="Clinic Logo" 
                  className="w-full h-full object-contain drop-shadow-sm transition-transform duration-500 group-hover:scale-105" 
                />
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none text-center notranslate" translate="no">
                {clinicProfile.clinicName && clinicProfile.clinicName !== 'Healthcare Clinic' && clinicProfile.clinicName !== 'DeePhysio Clinic' ? clinicProfile.clinicName : 'ClinicPilot'}
              </h1>
              <h2 className="text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase mt-2.5 text-center">
                Secure Clinical Portal
              </h2>
            </div>


            {/* ─── GUARANTEED LOGIN FORM ─── */}
            <div className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={12}/>
                      <input 
                        type="email" 
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-100/80 rounded-xl text-[12px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 transition-all placeholder:text-slate-200" 
                        placeholder="identity@clinicpilotdemo.store" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={12}/>
                      <input 
                        type="password" 
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-100/80 rounded-xl text-[12px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 transition-all placeholder:text-slate-200 disabled:opacity-50" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-3 bg-clinicPrimary text-white shadow-lg shadow-clinicPrimary/20 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-clinicPrimaryDark hover:scale-[1.01] active:scale-95 transition-all text-center cursor-pointer disabled:bg-slate-400 disabled:shadow-none"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
                <div className="text-center -mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email || '');
                      setShowForgotModal(true);
                    }}
                    className="text-[10px] font-bold text-clinicPrimary hover:text-clinicPrimaryDark underline-offset-2 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100/90 mt-2">
                  <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                    {[
                      { id: 'superadmin', label: 'Super Admin', icon: <FaShieldAlt size={15} />, color: 'from-purple-600 to-indigo-700' },
                      { id: 'admin', label: 'Admin', icon: <FaShieldAlt size={15} />, color: 'from-slate-800 to-slate-900' },
                      { id: 'therapist', label: 'Therapist', icon: <FaHeartbeat size={15} />, color: 'from-clinicPrimary to-clinicPrimary-dark' },
                      { id: 'receptionist', label: 'Receptionist', icon: <FaUser size={14} />, color: 'from-emerald-500 to-emerald-600' },
                      { id: 'billing', label: 'Billing', icon: <FaFileInvoice size={14} />, color: 'from-indigo-500 to-indigo-600' },
                    ].map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleSelectRole(role.id)}
                        className={`min-w-0 w-full px-1 py-2 sm:py-2.5 bg-white border ${
                          selectedRole === role.id 
                            ? 'border-clinicPrimary ring-2 ring-clinicPrimary/20 shadow-md bg-clinicPrimary/5' 
                            : 'border-slate-100/90 hover:border-clinicPrimary/40 hover:bg-slate-50/50 shadow-xs'
                        } rounded-2xl flex flex-col items-center justify-start gap-1.5 active:scale-95 transition-all duration-200 group cursor-pointer text-center overflow-hidden`}
                      >
                        <div className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl bg-gradient-to-br ${role.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                          {role.icon}
                        </div>
                        <span className="w-full text-[9px] font-bold text-slate-600 leading-tight group-hover:text-clinicPrimary transition-colors text-center break-words hyphens-auto line-clamp-2 px-0.5">
                          {role.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>



            </div>
          
          {/* Internal Decorative Blurs */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-clinicPrimary/5 rounded-full blur-[60px] group-hover/card:bg-clinicPrimary/10 transition-all duration-1000"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-clinicSecondary/5 rounded-full blur-[60px]"></div>
        </div>

        {/* Public Legal & Store Compliance Links */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400">
          <Link to="/privacy-policy" className="hover:text-clinicPrimary transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link to="/terms-and-conditions" className="hover:text-clinicPrimary transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link to="/account-deletion" className="hover:text-clinicPrimary transition-colors">Account Deletion</Link>
          <span>•</span>
          <Link to="/support" className="hover:text-clinicPrimary transition-colors">Support</Link>
        </div>

      </div>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Reset Password</h3>
              <p className="text-xs text-slate-500 mt-1">Enter your account email and set a new password.</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="identity@deephysio.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 transition-all"
              />
              <p className="text-[10px] text-slate-400 font-medium px-1 leading-relaxed">
                We will send a secure password reset link to this email address. Please follow the instructions in the email to regain access.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotPassword('');
                  setForgotConfirm('');
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="px-6 py-2.5 bg-clinicPrimary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-clinicPrimaryDark hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-clinicPrimary/20"
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
