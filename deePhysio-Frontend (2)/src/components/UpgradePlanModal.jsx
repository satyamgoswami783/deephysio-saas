import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaCheckCircle, FaTimes, FaCrown, FaBolt, FaRocket, 
  FaBuilding, FaCreditCard, FaLock, FaShieldAlt,
  FaCheck, FaHeadset, FaFileAlt, FaUsers, FaArrowRight
} from 'react-icons/fa';
import { fetchApi } from '../config/api';
import { useToast } from '../context/ToastContext';

// Load Razorpay SDK dynamically
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const plansData = [
  {
    id: 'Starter',
    name: 'Starter Plan',
    monthlyPrice: 999,
    annualPrice: 799,
    badge: null,
    icon: <FaBolt className="text-blue-500" size={18} />,
    iconBg: 'bg-blue-50 border-blue-200 text-blue-600',
    description: 'Essential clinic management features tailored for solo physiotherapists.',
    features: [
      'Up to 3 Staff Members',
      'Unlimited Patient Records',
      'Appointment Scheduling & Calendar',
      'SOAP Clinical Notes & Templates',
      'Invoicing & Digital Receipts',
      'Clinic Data Backup & Export',
      'Standard Email Support'
    ],
    highlight: false,
    buttonClass: 'bg-slate-900 hover:bg-slate-800 text-white'
  },
  {
    id: 'Standard',
    name: 'Standard Plan',
    monthlyPrice: 1299,
    annualPrice: 1039,
    badge: 'MOST POPULAR',
    icon: <FaCrown className="text-amber-500" size={18} />,
    iconBg: 'bg-amber-50 border-amber-200 text-amber-600',
    description: 'Complete collaboration suite built for growing multi-therapist clinics.',
    features: [
      'Up to 8 Staff Members',
      'Unlimited Patient Records',
      'Automated Reminders (SMS & Email)',
      'Visual Body Charts & Attachment Vault',
      'Multi-user Role Permissions & Audit',
      'Financial & Revenue Analytics',
      'Priority Email & Chat Support'
    ],
    highlight: true,
    buttonClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25'
  },
  {
    id: 'Pro',
    name: 'Pro Plan',
    monthlyPrice: 1499,
    annualPrice: 1199,
    badge: 'ADVANCED AI',
    icon: <FaRocket className="text-purple-500" size={18} />,
    iconBg: 'bg-purple-50 border-purple-200 text-purple-600',
    description: 'Cutting-edge AI automation, telehealth, and intelligence for busy clinics.',
    features: [
      'Up to 15 Staff Members',
      'Kiaan AI Clinical Notes Assistant',
      'Telehealth & Video Consultations',
      'Automated Patient Follow-ups',
      'Custom Intake Form Builder',
      'Advanced Audit & Activity Trails',
      '24/7 Dedicated Priority Support'
    ],
    highlight: false,
    buttonClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25'
  },
  {
    id: 'Custom Plan',
    name: 'Custom Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    badge: 'HOSPITAL',
    icon: <FaBuilding className="text-indigo-500" size={18} />,
    iconBg: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    description: 'Tailored enterprise deployments for multi-location hospital chains.',
    features: [
      'Unlimited Staff & Multi-locations',
      'Personal Domain & White-labeling',
      'Dedicated Database & Backup Vault',
      'Custom API & EHR Integrations',
      'Custom SLA & Dedicated Manager'
    ],
    highlight: false,
    buttonClass: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
  }
];

const UpgradePlanModal = ({ isOpen, onClose, currentPlan, onPlanUpdated }) => {
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [upgradingPlan, setUpgradingPlan] = useState(null);
  const toastCtx = useToast();
  const showToast = toastCtx?.showToast || console.log;

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCurrentPlan = (planId, planName) => {
    const cur = String(currentPlan || '').toLowerCase();
    return cur.includes(planId.toLowerCase()) || cur.includes(planName.toLowerCase());
  };

  const handleUpgrade = async (plan) => {
    if (plan.id === 'Custom Plan') {
      window.location.href = 'mailto:support@deephysio.com?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    if (isCurrentPlan(plan.id, plan.name)) {
      showToast(`You are already subscribed to the ${plan.name}.`, 'info');
      return;
    }

    setUpgradingPlan(plan.id);

    try {
      // 1. Try Razorpay checkout
      const isLoaded = await loadRazorpay();
      let paymentData = {};

      if (isLoaded && window.Razorpay) {
        try {
          const orderRes = await fetchApi('/auth/create-subscription-order', {
            method: 'POST',
            body: JSON.stringify({ 
              planName: plan.id,
              billingCycle 
            })
          });

          const orderData = await orderRes.json();
          if (orderRes.ok && orderData?.success && orderData.data?.id) {
            await new Promise((resolve, reject) => {
              const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_T2CGGz8NLUuopj',
                amount: orderData.data.amount,
                currency: orderData.data.currency || 'INR',
                name: 'DeePhysio Healthcare Platform',
                description: `Subscription Upgrade to ${plan.name} (${billingCycle})`,
                order_id: orderData.data.id,
                handler: async function (response) {
                  paymentData = {
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpaySignature: response.razorpay_signature
                  };
                  resolve();
                },
                modal: {
                  ondismiss: function () {
                    reject(new Error('Payment window closed.'));
                  }
                },
                theme: { color: '#0d9488' }
              };

              const rzp = new window.Razorpay(options);
              rzp.on('payment.failed', function (resp) {
                reject(new Error(resp.error?.description || 'Payment Failed'));
              });
              rzp.open();
            });
          }
        } catch (rzpErr) {
          if (rzpErr?.message?.includes('closed')) {
            setUpgradingPlan(null);
            return;
          }
          console.warn('Razorpay checkout bypassed/failed:', rzpErr);
        }
      }

      // 2. Call backend to update tenant plan
      const res = await fetchApi('/saas/upgrade-plan', {
        method: 'POST',
        body: JSON.stringify({
          planName: plan.id,
          billingCycle,
          ...paymentData
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`🎉 Success! Your clinic plan has been upgraded to ${plan.name}.`, 'success');

        try {
          const curUser = JSON.parse(sessionStorage.getItem('deephysio_user') || '{}');
          if (curUser) {
            const updatedUser = {
              ...curUser,
              tenant: {
                ...(curUser.tenant || {}),
                plan: plan.id,
                subscription_status: 'active'
              }
            };
            sessionStorage.setItem('deephysio_user', JSON.stringify(updatedUser));
          }
        } catch (_) {}

        if (onPlanUpdated) {
          onPlanUpdated(data.data || { plan: plan.id, subscription_status: 'active' });
        }
        onClose();
      } else {
        showToast(data.message || 'Failed to upgrade plan. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Plan upgrade error:', err);
      showToast('Network error during plan upgrade.', 'error');
    } finally {
      setUpgradingPlan(null);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6 animate-fade-in custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── TOP HEADER ── */}
        <div className="relative px-6 py-6 sm:px-10 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shrink-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer z-10 border border-white/10 shadow-sm"
            title="Close (Esc)"
          >
            <FaTimes size={15} />
          </button>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black tracking-widest uppercase mb-2 border border-emerald-500/30">
              <FaShieldAlt size={11} />
              <span>Clinic Subscription Plans</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Choose the Perfect Plan for Your Clinic
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 font-normal leading-relaxed">
              Seamlessly upgrade from Free Trial to unlock unlimited patients, automated appointment reminders, and Kiaan AI clinical automation.
            </p>

            {/* Monthly / Annual Billing Toggle */}
            <div className="mt-4 inline-flex items-center gap-2 p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  billingCycle === 'annual'
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500 text-white shadow-xs">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── PRICING CARDS GRID ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 md:p-8 bg-slate-50/70">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
            {plansData.map((plan) => {
              const isCurrent = isCurrentPlan(plan.id, plan.name);
              const isProcessing = upgradingPlan === plan.id;
              const displayPrice = plan.monthlyPrice !== null
                ? (billingCycle === 'annual' ? `₹${plan.annualPrice.toLocaleString('en-IN')}` : `₹${plan.monthlyPrice.toLocaleString('en-IN')}`)
                : 'Contact Us';

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 ${
                    plan.highlight
                      ? 'bg-white border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-4 ring-emerald-500/10'
                      : 'bg-white border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
                      <span>{plan.badge}</span>
                    </div>
                  )}

                  <div>
                    {/* Header: Icon + Plan Name */}
                    <div className="flex items-center gap-2.5 mb-3 pt-1">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${plan.iconBg}`}>
                        {plan.icon}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-sm tracking-tight">{plan.name}</h3>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {plan.monthlyPrice ? (billingCycle === 'annual' ? 'Billed annually' : 'Billed monthly') : 'Custom enterprise'}
                        </span>
                      </div>
                    </div>

                    {/* Price Section */}
                    <div className="my-3 pb-3 border-b border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                          {displayPrice}
                        </span>
                        {plan.monthlyPrice !== null && (
                          <span className="text-xs font-bold text-slate-400">/mo</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug min-h-[32px]">
                        {plan.description}
                      </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 mb-6">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Features Included:
                      </p>
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <FaCheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={12} />
                          <span className="leading-tight font-medium text-[11px] text-slate-700">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {isCurrent ? (
                      <div className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-500 text-center border border-slate-200">
                        Current Plan
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpgrade(plan)}
                        disabled={isProcessing}
                        className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${plan.buttonClass}`}
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <span>{plan.id === 'Custom Plan' ? 'Contact Sales' : `Upgrade to ${plan.id}`}</span>
                            <FaArrowRight size={10} />
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MODAL FOOTER ── */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 shrink-0">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <FaLock className="text-emerald-500" size={11} />
              <span>256-Bit SSL Encrypted Checkout via Razorpay</span>
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <FaCreditCard className="text-indigo-500" size={11} />
              <span>Supports UPI, Cards & NetBanking</span>
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span className="text-slate-500 font-medium">
              Instant activation & zero downtime
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 font-bold transition-colors cursor-pointer text-xs ml-auto"
          >
            Close & Keep Trial
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UpgradePlanModal;
