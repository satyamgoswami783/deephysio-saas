import React from 'react';
import { Link } from 'react-router-dom';
import { FaShieldAlt, FaArrowLeft, FaHospital, FaLock, FaUserCheck, FaFileAlt } from 'react-icons/fa';
import BRAND_CONFIG from '../../mobile/config/brandConfig';

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Header */}
      <header className="bg-slate-900 text-white py-8 px-4 sm:px-8 border-b border-slate-800 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-clinicPrimary flex items-center justify-center text-white shadow-lg shadow-clinicPrimary/30">
              <FaShieldAlt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{BRAND_CONFIG.productName}</h1>
              <p className="text-xs text-slate-400">Privacy Policy & Patient Data Governance</p>
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

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 space-y-8">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80">
          <div className="inline-block px-3 py-1 bg-clinicPrimary/10 text-clinicPrimary font-black text-xs rounded-full uppercase tracking-widest mb-3">
            Effective Date: October 2026
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Introduction & Commitment</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {BRAND_CONFIG.productName} ("ClinicPilot", "we", "our", or "us") provides specialized physical therapy, clinic management, and rehabilitation clinical workflow solutions. We are rigorously committed to protecting patient health information, practitioner credentials, and clinical practice confidentiality in compliance with applicable healthcare data protection standards.
          </p>
        </div>

        {/* Section 1: Data We Collect */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FaHospital className="text-clinicPrimary" /> 1. Information Collected & Processed
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Depending on how practitioners and clinical staff interact with the platform, we collect and process the following categories of information:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
            <li className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="block text-slate-900 font-bold mb-1">Practitioner & User Account Info:</strong>
              Name, clinical specialization, email address, contact telephone, hashed passwords, professional license/role.
            </li>
            <li className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="block text-slate-900 font-bold mb-1">Patient Clinical Records:</strong>
              Patient identifiers, contact numbers, emergency contacts, assessment notes (SOAP notes), body chart annotations, treatment plans, exercise prescriptions, and discharge summaries.
            </li>
            <li className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="block text-slate-900 font-bold mb-1">Clinical Documents & Media:</strong>
              Prescription scans, X-ray/MRI reports, and clinical posture photographs uploaded directly via practitioner camera or document picker.
            </li>
            <li className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="block text-slate-900 font-bold mb-1">Billing & Invoicing Records:</strong>
              Itemized clinic invoices, service fees, payment receipts, payment mode records (we do NOT store raw credit card numbers or banking passwords; these are processed securely via PCI-DSS compliant providers).
            </li>
            <li className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="block text-slate-900 font-bold mb-1">Device & Diagnostic Telemetry:</strong>
              Android OS version, app version, network connectivity status, crash reports, and system activity logs for clinical audit security.
            </li>
            <li className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="block text-slate-900 font-bold mb-1">Push Notification Tokens:</strong>
              Device registration tokens used strictly to deliver appointment reminders and clinical schedule updates.
            </li>
          </ul>
        </section>

        {/* Section 2: Why We Use Data */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FaLock className="text-clinicPrimary" /> 2. Purpose of Data Processing
          </h3>
          <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
            <p>• Delivering clinical appointment scheduling, automated patient check-in, and waitlist management.</p>
            <p>• Enabling physical therapists to document clinical progress, track rehabilitation milestones, and generate PDF discharge summaries.</p>
            <p>• Communicating appointment confirmations and receipts via SMS/WhatsApp/Email as configured by the clinic.</p>
            <p>• Maintaining audit logging for clinical accountability and unauthorized access prevention.</p>
          </div>
        </section>

        {/* Section 3: Third Parties */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FaUserCheck className="text-clinicPrimary" /> 3. Third-Party Integrations & Service Providers
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Data is shared only with verified cloud infrastructure and integration providers necessary to provide clinic services:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-800">Payment Gateways</strong>
              <p className="text-slate-500 mt-1">Razorpay / Stripe for processing clinic software subscriptions.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-800">Communication Gateways</strong>
              <p className="text-slate-500 mt-1">Twilio, WhatsApp Baileys, and clinic SMTP servers for appointment notifications.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-800">Secure Database Cloud</strong>
              <p className="text-slate-500 mt-1">Encrypted relational database hosting with automated encrypted backups.</p>
            </div>
          </div>
        </section>

        {/* Section 4: User Rights & Deletion */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FaFileAlt className="text-clinicPrimary" /> 4. Data Retention, Rights & Account Deletion
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Users have the absolute right to access, rectify, or request permanent deletion of their account and associated personal data. 
            You can initiate deletion directly inside the app via <strong>Settings → Account → Delete Account</strong> or by visiting our{' '}
            <Link to="/account-deletion" className="text-clinicPrimary font-bold hover:underline">
              Public Account Deletion Page
            </Link>.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            <em>Medical Record Retention Notice:</em> In jurisdictions where clinical regulatory laws require patient treatment charts and financial tax invoices to be retained for statutory periods (e.g. 5-7 years), personal identifying details are anonymized while statutory record integrity is preserved.
          </p>
        </section>

        {/* Section 5: Contact */}
        <section className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg space-y-3">
          <h3 className="text-base font-bold">Contact Privacy & Data Protection Officer</h3>
          <p className="text-xs text-slate-300">
            For inquiries regarding clinical data protection, privacy inquiries, or deletion requests:
          </p>
          <p className="text-xs font-mono text-clinicPrimary">
            Email: {BRAND_CONFIG.urls.privacyEmail} / {BRAND_CONFIG.urls.supportEmail}
          </p>
          <p className="text-xs text-slate-400">
            Website: <a href={BRAND_CONFIG.urls.websiteUrl} className="underline">{BRAND_CONFIG.urls.websiteUrl}</a>
          </p>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
