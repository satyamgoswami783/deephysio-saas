import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import PageHeader from '../../components/ui/PageHeader';
import { useToast } from '../../context/ToastContext';
import { FaCheck } from 'react-icons/fa';

const PlansPricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const toastCtx = useToast();
  const showToast = toastCtx?.showToast || console.log;

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/saas/plans');
      const result = await res.json();
      if (result.success) {
        setPlans(result.data);
      } else {
        showToast(result.message || 'Failed to load plans', 'error');
      }
    } catch (error) {
      showToast('Error loading plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fadeIn">
      <PageHeader 
        title="Plans & Pricing" 
        subtitle="Manage subscription tiers and pricing options available to tenants."
      />

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-500">Loading plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col relative overflow-hidden transition-all hover:shadow-lg">
              {plan.badge && (
                <div className="absolute top-0 right-0 bg-clinicPrimary text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                  {plan.badge}
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
              <p className="text-slate-500 text-sm mt-1 mb-6">{plan.description}</p>
              
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-black text-slate-900">${plan.priceMonthly ?? plan.price_monthly ?? 0}</span>
                <span className="text-sm font-medium text-slate-500">/mo</span>
              </div>

              <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Features</p>
                <ul className="space-y-3">
                  {(plan.features || []).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <FaCheck className="text-clinicPrimary mt-0.5 shrink-0" size={12} />
                      <span>{feature}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2 text-sm text-slate-600">
                    <FaCheck className="text-clinicPrimary mt-0.5 shrink-0" size={12} />
                    <span>Up to {plan.maxUsers ?? plan.max_users ?? 'Unlimited'} Users</span>
                  </li>
                </ul>
              </div>

              <button className="w-full mt-8 py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                Edit Plan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlansPricing;
