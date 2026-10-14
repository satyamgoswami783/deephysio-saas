import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { FaHospital, FaUser, FaEnvelope, FaPhone, FaLock, FaCheckCircle, FaChevronLeft, FaStar, FaArrowRight } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { fetchApi, clearAllTenantState } from '../config/api';
import { motion } from 'framer-motion';
import LanguageSwitcher from '../components/LanguageSwitcher';

// Load Razorpay script dynamically
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Register = () => {
  const navigate = useNavigate();
  const toastCtx = useToast();
  const showToast = toastCtx?.showToast || console.log;
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const initialPlan = searchParams.get('plan') || 'Free Trial';
  
  const [formData, setFormData] = useState({
    businessName: '',
    adminName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    selectedPlan: initialPlan,
    acceptTerms: false
  });

  const [clinicProfile, setClinicProfile] = useState({ clinicName: 'ClinicPilot', logoDataUrl: '' });

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
      } catch (e) {}
    };
    fetchBranding();
  }, [navigate]);


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRegister = async () => {
    if (!formData.businessName || !formData.adminName || !formData.email || !formData.mobileNumber || !formData.password || !formData.confirmPassword) {
      showToast('Please fill all required fields.', 'error');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    if (!formData.acceptTerms) {
      showToast('You must accept the Terms and Conditions.', 'error');
      return;
    }

    setLoading(true);
    
    try {
      const isPaidPlan = formData.selectedPlan !== 'Free Trial' && formData.selectedPlan !== '7-Day Free Trial';
      
      let paymentData = {};
      
      if (isPaidPlan) {
        // 1. Load Razorpay script
        const isLoaded = await loadRazorpay();
        if (!isLoaded) {
          showToast('Razorpay SDK failed to load. Are you online?', 'error');
          setLoading(false);
          return;
        }

        // 2. Create Order on Backend
        const orderRes = await fetchApi('/auth/create-subscription-order', {
          method: 'POST',
          body: JSON.stringify({ planName: formData.selectedPlan })
        });
        
        const orderData = await orderRes.json();
        if (!orderRes.ok || !orderData.success) {
          showToast(orderData.message || 'Failed to initialize payment', 'error');
          setLoading(false);
          return;
        }

        // 3. Open Razorpay Checkout Modal
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_T2CGGz8NLUuopj', 
          amount: orderData.data.amount,
          currency: orderData.data.currency,
          name: clinicProfile.clinicName,
          description: `Subscription for ${formData.selectedPlan} Plan`,
          image: clinicProfile.logoDataUrl || "/logo.png",
          order_id: orderData.data.id,
          handler: async function (response) {
            // Callback when payment is successful
            paymentData = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            };
            // Proceed to register
            await completeRegistration(paymentData);
          },
          prefill: {
            name: formData.adminName,
            email: formData.email,
            contact: formData.mobileNumber
          },
          theme: {
            color: "#10b981" // emerald-500
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response){
          showToast(`Payment Failed: ${response.error.description}`, 'error');
          setLoading(false);
        });
        rzp.open();
      } else {
        // Free trial, proceed directly
        await completeRegistration({});
      }

    } catch (err) {
      showToast('Network error: Unable to reach the server.', 'error');
      setLoading(false);
    }
  };

  const completeRegistration = async (paymentData) => {
    try {
      setLoading(true);
      const res = await fetchApi(`/auth/register`, {
        method: "POST",
        body: JSON.stringify({ 
          name: formData.adminName,
          email: formData.email,
          password: formData.password,
          businessName: formData.businessName,
          mobileNumber: formData.mobileNumber,
          selectedPlan: formData.selectedPlan,
          ...paymentData
        })
      });
      if (!res) return; 
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || 'Registration failed.', 'error');
        return;
      }
      if (data.success && data.data?.token) {
        const { token, user } = data.data;

        // Clear any stale session & cache from prior user
        clearAllTenantState();

        sessionStorage.setItem("token", token);
        sessionStorage.setItem("deephysio_user", JSON.stringify(user));
        sessionStorage.setItem("deephysio_role", user.role);

        showToast('Registration successful! Welcome to ClinicPilot.', 'success');
        
        // Directly navigate to dashboard with full state reload
        window.location.href = "/dashboard";
      } else if (data.success || data.data) {
        showToast('Account created successfully! Redirecting...', 'success');
        window.location.href = "/dashboard";
      } else {
        showToast(data.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      showToast('Network error during registration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const planDetailsMap = {
    '7-Day Free Trial': { price: '₹0 for 7 Days', desc: 'Experience the full power of our SaaS risk-free.', features: ['7 Days full feature trial access', 'Duration: 7 Days'] },
    'Starter': { price: '₹999/mo', desc: 'Essential clinic management features.', features: ['Essential clinic management features', 'Duration: Monthly'] },
    'Standard': { price: '₹1,299/mo', desc: 'Complete features for growing clinics.', features: ['Complete features for growing clinics', 'Duration: Monthly'] },
    'Pro': { price: '₹1,499/mo', desc: 'Advanced AI features and priority support.', features: ['ClinicPilot AI Assistant & AI Features', 'Advanced features and priority support', 'Duration: Monthly'] },
    'Custom Plan': { price: 'Custom', desc: 'Tailored to your clinic.', features: ['SaaS with customization', 'Personal domain', 'Personal branding', 'AI and automation'] },
    'Free Trial': { price: '₹0 for 7 Days', desc: 'Experience the full power of our SaaS risk-free.', features: ['Full Premium Access', 'Unlimited Patients', 'Unlimited Staff', 'No Credit Card Required', 'Cancel Anytime'] }
  };
  const currentPlan = planDetailsMap[formData.selectedPlan] || planDetailsMap['Free Trial'];

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };
  const rightPanelVariants = {
    hidden: { opacity: 0, x: 50 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 20, delay: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden font-outfit">
      {/* Animated Background Elements */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} 
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-emerald-400/20 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }} 
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-teal-400/10 rounded-full blur-[140px] pointer-events-none"
      />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>

      {/* Back Button */}
      <motion.button 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05, x: -5 }}
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-slate-500 hover:text-emerald-600 bg-white/80 p-2 pr-4 rtl:pr-2 rtl:pl-4 rounded-full backdrop-blur-xl border border-white transition-all shadow-sm cursor-pointer"
      >
        <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-full"><FaChevronLeft size={10} className="rtl:rotate-180" /></div>
        <span className="text-[10px] font-black uppercase tracking-widest mt-px">Back</span>
      </motion.button>

      {/* Language Switcher Dropdown */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Main Glassmorphic Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
        className="w-full max-w-[1000px] flex flex-col lg:flex-row bg-white/60 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-emerald-900/10 border border-white/60 relative z-10 overflow-hidden"
      >
        
        {/* Left Side: Animated Form */}
        <div className="w-full lg:w-[55%] p-8 lg:p-10 flex flex-col justify-center relative">
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            
            <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-200/80 shadow-sm flex items-center justify-center flex-shrink-0">
                <img src={clinicProfile.logoDataUrl || "/logo.png"} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-[10px] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 tracking-[0.2em] uppercase leading-tight notranslate" translate="no">
                {clinicProfile.clinicName && clinicProfile.clinicName !== 'Healthcare Clinic' && clinicProfile.clinicName !== 'DeePhysio Clinic' ? clinicProfile.clinicName : 'ClinicPilot'}
              </h2>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-3xl lg:text-4xl font-black text-slate-900 tracking-[-0.05em] leading-tight mb-2">
              Get Started <span className="text-emerald-500">Free.</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-slate-500 font-medium text-xs mb-6">
              No credit card required. Setup takes less than 2 minutes.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { name: 'businessName', label: 'Clinic Name', type: 'text', icon: FaHospital, placeholder: 'Apollo Physio' },
                { name: 'adminName', label: 'Admin Name', type: 'text', icon: FaUser, placeholder: 'John Doe' },
                { name: 'email', label: 'Email Address', type: 'email', icon: FaEnvelope, placeholder: 'admin@clinic.com' },
                { name: 'mobileNumber', label: 'Mobile Number', type: 'tel', icon: FaPhone, placeholder: '+91 9876543210' },
                { name: 'password', label: 'Password', type: 'password', icon: FaLock, placeholder: '••••••••' },
                { name: 'confirmPassword', label: 'Confirm Password', type: 'password', icon: FaLock, placeholder: '••••••••' }
              ].map((field, idx) => (
                <motion.div variants={itemVariants} key={idx} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                  <div className="relative group">
                    <field.icon className="absolute ltr:left-3.5 rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={12}/>
                    <input 
                      type={field.type} name={field.name} value={formData[field.name]} onChange={handleChange} required
                      className="w-full ltr:pl-10 ltr:pr-3 rtl:pr-10 rtl:pl-3 py-2.5 bg-white/50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/40 transition-all shadow-sm hover:bg-white" 
                      placeholder={field.placeholder} 
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="flex items-start gap-3 mb-6 px-1">
              <input 
                type="checkbox" id="terms" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange}
                className="mt-0.5 w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer transition-all"
              />
              <label htmlFor="terms" className="text-[11px] font-medium text-slate-600 leading-snug cursor-pointer">
                I accept the <a href="#" className="text-emerald-600 font-bold hover:underline">Terms & Conditions</a>.
              </label>
            </motion.div>

            <motion.button 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button" 
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating Workspace...' : 'Create Account'} <FaArrowRight size={10} className="rtl:rotate-180" />
            </motion.button>
            
            {/* Prominent, Clearly Visible Sign In Action Button */}
            <motion.div variants={itemVariants} className="mt-5 pt-3 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-2.5 text-center">
              <span className="text-xs font-semibold text-slate-500">
                Already have an account?
              </span>
              <button 
                type="button" 
                onClick={() => navigate('/login')} 
                className="px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 text-emerald-700 hover:text-emerald-800 font-black text-xs rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Sign in</span>
                <FaArrowRight size={10} className="text-emerald-600 rtl:rotate-180" />
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Side: Animated Plan Details */}
        <motion.div 
          variants={rightPanelVariants}
          initial="hidden"
          animate="show"
          className="w-full lg:w-[45%] bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 p-8 lg:p-12 text-white flex flex-col justify-center relative overflow-hidden"
        >
          {/* Right Side Orbs & Mesh */}
          <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-emerald-400/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-cyan-400/20 rounded-full blur-[60px]"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/20 shadow-lg"
              >
                <FaStar className="text-yellow-300 text-[10px]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">{formData.selectedPlan} PLAN</span>
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="text-4xl lg:text-5xl font-black tracking-[-0.05em] leading-none mb-3 text-white"
              >
                {currentPlan.price.split(' ')[0]}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="text-emerald-100 font-bold text-sm mb-8 opacity-80"
              >
                {currentPlan.desc}
              </motion.p>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              
              <ul className="space-y-4 relative z-10">
                {currentPlan.features.map((feature, i) => (
                  <motion.li 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + (i * 0.1), type: "spring", stiffness: 200 }}
                    key={i} 
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <FaCheckCircle className="text-emerald-400 text-xs" />
                    </div>
                    <span className="text-sm font-bold text-white/90">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="mt-8 text-center"
            >
              <p className="text-[11px] font-medium text-emerald-200/60 tracking-wider uppercase">
                Trusted by 500+ clinics globally
              </p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;
