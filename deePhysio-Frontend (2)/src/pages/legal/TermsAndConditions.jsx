import React from 'react';
import { Link } from 'react-router-dom';
import { FaFileContract, FaArrowLeft } from 'react-icons/fa';
import BRAND_CONFIG from '../../mobile/config/brandConfig';

export const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      <header className="bg-slate-900 text-white py-8 px-4 sm:px-8 border-b border-slate-800 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-clinicPrimary flex items-center justify-center text-white shadow-lg shadow-clinicPrimary/30">
              <FaFileContract className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{BRAND_CONFIG.productName}</h1>
              <p className="text-xs text-slate-400">Terms of Service & SaaS Agreement</p>
            </div>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all"
          >
            <FaArrowLeft className="w-3 h-3" /> Back to App
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">1. SaaS Subscription Agreement</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            By accessing or subscribing to {BRAND_CONFIG.productName}, physical therapy clinics, practitioners, and clinical staff agree to be bound by these service terms. The service is provided on a software-as-a-service basis for professional physical therapy and healthcare clinical operations.
          </p>

          <h2 className="text-xl font-bold text-slate-900 pt-4">2. Clinical Responsibility & Independence</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {BRAND_CONFIG.productName} is an administrative, documentation, and scheduling clinical productivity tool. It does not provide medical diagnoses, treatment decisions, or substitute for the clinical judgment of qualified physical therapy practitioners. The licensed healthcare provider retains full and sole responsibility for patient care.
          </p>

          <h2 className="text-xl font-bold text-slate-900 pt-4">3. Security & Access Credentials</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Clinic administrators are responsible for ensuring that staff roles and permission assignments accurately reflect institutional policies. Sharing passwords or unauthorized export of patient charts is strictly prohibited.
          </p>

          <h2 className="text-xl font-bold text-slate-900 pt-4">4. Governing Law & Support</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            For questions or technical support, contact our clinic operations team at{' '}
            <span className="font-mono text-clinicPrimary">{BRAND_CONFIG.urls.supportEmail}</span>.
          </p>
        </div>
      </main>
    </div>
  );
};

export default TermsAndConditions;
