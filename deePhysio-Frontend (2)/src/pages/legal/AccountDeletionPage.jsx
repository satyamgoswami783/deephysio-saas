import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTrashAlt, FaShieldAlt, FaArrowLeft, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import BRAND_CONFIG from '../../mobile/config/brandConfig';

export const AccountDeletionPage = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Header */}
      <header className="bg-slate-900 text-white py-8 px-4 sm:px-8 border-b border-slate-800 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <FaTrashAlt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{BRAND_CONFIG.productName}</h1>
              <p className="text-xs text-slate-400">Account & Personal Data Deletion Request</p>
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

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80">
          <h2 className="text-2xl font-black text-slate-900 mb-3">Google Play Compliant Data Deletion Request</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            In accordance with Google Play User Data policies and international privacy rights, users and clinic administrators may request the permanent deletion of their account, credentials, and associated personal information.
          </p>
        </div>

        {/* How to Delete in App vs Public */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-lg bg-clinicPrimary/10 text-clinicPrimary flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">Direct In-App Deletion (Instant)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If you have access to your account:
            </p>
            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1.5 pl-1">
              <li>Log in to your <strong>deePhysio</strong> app or web portal.</li>
              <li>Navigate to <strong>Settings → Account Security</strong>.</li>
              <li>Scroll down to the <strong>Danger Zone</strong>.</li>
              <li>Click <strong>Delete Account</strong> and confirm your password.</li>
              <li>Your sessions are instantly invalidated and personal details queued for erasure.</li>
            </ol>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">Public Request Form (If Lost Access)</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If you cannot log in or have uninstalled the application, submit your registered clinic email below:
            </p>

            {submitted ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <FaCheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800">
                  <p className="font-bold">Deletion Request Received</p>
                  <p className="mt-1">
                    A confirmation link has been transmitted to <strong>{email}</strong>. Once confirmed, deletion processing will finalize within 48 hours.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 pt-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter registered account email"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20"
                >
                  Submit Deletion Verification
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">What Information is Deleted vs Retained?</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-100">
              <span className="font-bold text-rose-800 block mb-2">Permanently Deleted:</span>
              <ul className="space-y-1.5 text-rose-900 list-disc list-inside">
                <li>User account credentials (hashed passwords, active tokens).</li>
                <li>Device notification tokens (FCM tokens).</li>
                <li>Personal user profiles & contact preferences.</li>
                <li>Session activity cookies and cached offline tokens.</li>
              </ul>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-100">
              <span className="font-bold text-amber-800 block mb-2">Statutory Retained / Anonymized Data:</span>
              <ul className="space-y-1.5 text-amber-900 list-disc list-inside">
                <li>
                  <strong>Medical Treatment Records:</strong> Subject to mandatory healthcare statutory retention periods (e.g. 5–7 years depending on local medical jurisdiction), clinical notes and charts are pseudonymized.
                </li>
                <li>
                  <strong>Tax & Invoicing Records:</strong> Completed financial invoices must be retained for tax compliance and audit obligations.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Support Contact */}
        <div className="p-6 bg-slate-100 rounded-2xl text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-800">Need Assistance with Data Deletion?</p>
            <p>Our dedicated Data Protection team processes verified identity requests promptly.</p>
          </div>
          <a
            href={`mailto:${BRAND_CONFIG.urls.privacyEmail}?subject=Account%20Deletion%20Request`}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shrink-0"
          >
            Email Support ({BRAND_CONFIG.urls.privacyEmail})
          </a>
        </div>
      </main>
    </div>
  );
};

export default AccountDeletionPage;
