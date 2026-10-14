import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaChevronLeft, FaCrown, FaBolt, FaRocket, FaBuilding, 
  FaCheckCircle, FaLock, FaShieldAlt, FaStar, FaCreditCard,
  FaCalendarCheck
} from 'react-icons/fa';
import { fetchApi } from '../config/api';
import { useToast } from '../context/ToastContext';

// Load Razorpay dynamically
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

const plans = [
  {
    id: 'Starter',
    name: 'Starter Plan',
    price: '₹999',
    period: '/month',
    badge: null,
    icon: <FaBolt className="text-blue-500" size={20} />,
    description: 'Essential clinic management features for solo physiotherapists.',
    features: [
      'Up to 3 Staff Members',
      'Unlimited Patient Records',
      'Appointment Scheduling & Calendar',
      'SOAP Clinical Notes & Templates',
      'Invoicing & Receipts Management',
      'Data Backup & Export (.zip/.gz)',
      'Standard Email Support'
    ],
    highlight: false,
    buttonClass: 'bg-slate-900 hover:bg-slate-800 text-white'
  },
  {
    id: 'Standard',
    name: 'Standard Plan',
    price: '₹1,299',
    period: '/month',
    badge: 'MOST POPULAR',
    icon: <FaCrown className="text-amber-500" size={20} />,
    description: 'Complete collaboration suite for growing multi-therapist clinics.',
    features: [
      'Up to 8 Staff Members',
      'Unlimited Patient Records',
      'Automated Appointment Reminders & SMS',
      'Visual Body Charts & Attachment Vault',
      'Multi-user Role Permissions & Audit Trail',
      'Financial & Revenue Analytics',
      'Priority Email & Chat Support'
    ],
    highlight: true,
    buttonClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20'
  },
  {
    id: 'Pro',
    name: 'Pro Plan',
    price: '₹1,499',
    period: '/month',
    badge: 'ADVANCED AI',
    icon: <FaRocket className="text-purple-500" size={20} />,
    description: 'Cutting-edge AI automation and intelligence for busy practices.',
    features: [
      'Up to 15 Staff Members',
      'ClinicPilot AI Clinical Notes Assistant',
      'Telehealth & Video Consultations',
      'Automated Patient Follow-ups',
      'Custom Intake Form Builder',
      'Advanced Audit & Activity Trails',
      '24/7 Dedicated Priority Support'
    ],
    highlight: false,
    buttonClass: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20'
  },
  {
    id: 'Custom Plan',
    name: 'Custom Enterprise',
    price: 'Contact Us',
    period: 'Tailored pricing',
    badge: 'HOSPITAL',
    icon: <FaBuilding className="text-indigo-500" size={20} />,
    description: 'Tailored enterprise deployments for multi-location hospital chains.',
    features: [
      'Unlimited Staff & Locations',
      'Personal Domain & White-labeling',
      'Dedicated Database & Backup Storage',
      'Custom API & EHR Integrations',
      'Custom SLA & Account Manager'
    ],
    highlight: false,
    buttonClass: 'bg-slate-100 hover:bg-slate-200 text-slate-800'
  }
];

const SubscriptionPlansPage = () => {
  const navigate = useNavigate();
  const toastCtx = useToast();
  const showToast = toastCtx?.showToast || console.log;

  const [tenantInfo, setTenantInfo] = useState(() => {
    try {
      const user = JSON.parse(sessionStorage.getItem('deephysio_user') || '{}');
      return user?.tenant || null;
    } catch (_) {
      return null;
    }
  });

  const [upgradingPlan, setUpgradingPlan] = useState(null);

  useEffect(() => {
    const fetchLatestTenant = async () => {
      try {
        const res = await fetchApi('/users/me');
        if (res && res.ok) {
          const data = await res.json();
          if (data?.data?.tenant) {
            setTenantInfo(data.data.tenant);
          }
        }
      } catch (_) {}
    };
    fetchLatestTenant();
  }, []);

  const currentPlan = tenantInfo?.plan || 'Free Trial';
  const isTrial = 
    tenantInfo?.subscription_status === 'trial' || 
    currentPlan.toLowerCase().includes('trial');

  const isCurrent = (planId, planName) => {
    const cur = String(currentPlan || '').toLowerCase();
    return cur.includes(planId.toLowerCase()) || cur.includes(planName.toLowerCase());
  };

  const handleUpgrade = async (plan) => {
    if (plan.id === 'Custom Plan') {
      window.location.href = 'mailto:support@deephysio.com?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    if (isCurrent(plan.id, plan.name)) {
      showToast(`You are already on the ${plan.name}.`, 'info');
      return;
    }

    setUpgradingPlan(plan.id);

    try {
      const isLoaded = await loadRazorpay();
      let paymentData = {};

      if (isLoaded && window.Razorpay) {
        try {
          const orderRes = await fetchApi('/auth/create-subscription-order', {
            method: 'POST',
            body: JSON.stringify({ planName: plan.id })
          });

          const orderData = await orderRes.json();
          if (orderRes.ok && orderData?.success && orderData.data?.id) {
            await new Promise((resolve, reject) => {
              const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_T2CGGz8NLUuopj',
                amount: orderData.data.amount,
                currency: orderData.data.currency || 'INR',
                name: 'DeePhysio Healthcare Platform',
                description: `Subscription Upgrade to ${plan.name}`,
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
          console.warn('Razorpay checkout skipped or failed:', rzpErr);
        }
      }

      const res = await fetchApi('/saas/upgrade-plan', {
        method: 'POST',
        body: JSON.stringify({
          planName: plan.id,
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

        setTenantInfo(data.data || { plan: plan.id, subscription_status: 'active' });
        setTimeout(() => navigate('/dashboard'), 1000);
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 py-8 animate-fade-in font-outfit">
      {/* Header */}
      <div className="space-y-2">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-clinicPrimary transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer"
        >
          <FaChevronLeft size={10} /> Back to Dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-2 border border-emerald-200/80">
              <FaShieldAlt size={12} /> Flexible Clinic Subscription Plans
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Subscription & Upgrade Plans
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">
              Select the best tier for your clinic. Upgrade anytime to get higher staff capacity, ClinicPilot AI automation, and priority support.
            </p>
          </div>

          <div className="p-3.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <FaCalendarCheck size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Clinic Plan</div>
              <div className="text-sm font-black text-slate-800">{currentPlan} {isTrial && '(Trial)'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrentActive = isCurrent(plan.id, plan.name);
          const isProcessing = upgradingPlan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                plan.highlight
                  ? 'border-2 border-emerald-500 shadow-xl ring-4 ring-emerald-500/10 md:-translate-y-2'
                  : 'border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-slate-300'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-2xs">
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">{plan.name}</h3>
                    <span className="text-[11px] text-slate-400 font-semibold">{plan.period}</span>
                  </div>
                </div>

                <div className="my-4 pb-4 border-b border-slate-100">
                  <div className="text-3xl font-black text-slate-900 tracking-tight">
                    {plan.price}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Included Features:
                  </p>
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <FaCheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={13} />
                      <span className="leading-snug font-medium text-xs">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                {isCurrentActive ? (
                  <div className="w-full py-3 rounded-2xl font-bold text-xs bg-slate-100 text-slate-500 text-center border border-slate-200">
                    Active Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={isProcessing}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${plan.buttonClass}`}
                  >
                    {isProcessing ? (
                      <span>Processing...</span>
                    ) : (
                      <span>{plan.id === 'Custom Plan' ? 'Contact Enterprise Team' : `Upgrade to ${plan.id}`}</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Banner */}
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <FaLock />
          </div>
          <div>
            <div className="font-bold text-slate-900">Enterprise Security & Compliance</div>
            <div>All payments are encrypted via Razorpay PCI-DSS Level 1 compliance. Cancel or upgrade anytime.</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <FaCreditCard size={14} />
          <span>Supports UPI, Cards, NetBanking & Wallets</span>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;
