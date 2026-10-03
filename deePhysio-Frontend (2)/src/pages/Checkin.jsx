import React, { useState } from 'react';
import Toast from '../components/ui/Toast';
import { fetchApi } from '../config/api';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate, useSearchParams } from 'react-router-dom';

const getAuthHeaders = () => {
  const token = sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/* ──────────────────────────────────────────────────────────────────────── */
const Checkin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFullMode = searchParams.get('mode') === 'full';
  /* ── State ── */
  const [step, setStep] = useState('search'); // 'search' | 'result' | 'success'
  const [form, setForm] = useState({ initial: '', lastName: '', dob: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { addNotification } = useNotifications();

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  /* ── Handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    const val = name === 'initial' ? value.toUpperCase() : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!form.initial.trim() || !form.lastName.trim() || !form.dob) return;

    setLoading(true);
    try {
      const response = await fetchApi(`/checkin/search`, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!response) return; // intercepted

      const responseData = await response.json().catch(() => ({}));
      if (!responseData?.success) {
        showToast(responseData?.message || "Something went wrong");
        return;
      }

      const raw = responseData?.data;

      // Normalise Prisma response to frontend-friendly fields
      const result = Array.isArray(raw) ? raw[0] : raw;

      if (!response.ok || !result) {
        showToast('No appointment found for today');
        return;
      }

      // Map Prisma snake_case to display fields
      const startValue = result.startTime || result.start_time || null;
      const appointmentTime = startValue
        ? new Date(startValue).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '';
      setData({
        appointmentId: result.id,
        firstName: result.patient?.firstName || result.patient?.first_name || '',
        lastName: result.patient?.lastName || result.patient?.last_name || '',
        patientName: `${result.patient?.firstName || result.patient?.first_name || ''} ${result.patient?.lastName || result.patient?.last_name || ''}`.trim(),
        appointmentTime,
        therapistName: result.therapist?.name || 'Assigned Therapist',
        status: result.status,
        date: result.appointmentDate || result.appointment_date
      });
      setStep('result');
    } catch (error) {
      console.error('Search error:', error);
      showToast('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleArrive = async () => {
    if (!data?.appointmentId && !data?.id) return;

    // Business rule: block if already checked in
    if (data.status === 'checked_in') {
      showToast('Patient already checked in');
      return;
    }

    setLoading(true);
    try {
      const response = await fetchApi(`/checkin/arrive`, {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: data.appointmentId || data.id,
        }),
      });
      if (!response) return; // intercepted

      if (!response.ok) {
        showToast('Check-in failed');
        return;
      }

      setStep('success');

      // Push real notification
      if (addNotification) {
        addNotification({
          type: 'checkin',
          title: 'Patient Checked In',
          message: `${data.patientName || 'Patient'} has arrived for their appointment`,
          link: '/waitlist',
          roles: ['admin', 'receptionist', 'therapist']
        });
      }

      // Auto-reset after 3 seconds
      setTimeout(() => {
        setStep('search');
        setForm({ initial: '', lastName: '', dob: '' });
        setData(null);
      }, 3000);
    } catch (error) {
      console.error('Arrive error:', error);
      showToast('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  /* ── Spinner (reusable) ── */
  const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  /* ── Render ── */
  return (
    <div className="h-full min-h-[600px] flex items-center justify-center p-3 sm:p-5 bg-gradient-to-b from-slate-50 to-white">
      <div className="bg-white rounded-2xl shadow-[0_10px_35px_rgba(15,23,42,0.08)] border border-slate-200 p-5 sm:p-7 lg:p-8 w-full max-w-[880px] mx-auto">

        {/* STEP 1: SEARCH */}
        {step === 'search' && (
          <div className="animate-in fade-in zoom-in duration-300 space-y-6">
            {!isFullMode && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/appointments/checkin?mode=full')}
                  className="h-9 px-4 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:text-clinicPrimary hover:border-clinicPrimary/40 transition-all"
                >
                  Full Screen Mode
                </button>
              </div>
            )}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-clinicLight rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-clinicPrimary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-[30px] font-extrabold text-slate-800 tracking-tight">Patient Check-In</h1>
              <p className="text-slate-500 text-[15px]">Find your appointment for today</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4 sm:space-y-5 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
                <div className="sm:col-span-4">
                  <label className="block text-xs font-semibold text-slate-600 tracking-wide mb-1.5">First letter of your name</label>
                  <input
                    type="text"
                    name="initial"
                    value={form.initial}
                    onChange={handleChange}
                    maxLength={1}
                    className="w-full h-12 px-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-clinicPrimary/40 focus:border-clinicPrimary text-center text-[18px] font-semibold"
                    placeholder="J"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="sm:col-span-8">
                  <label className="block text-xs font-semibold text-slate-600 tracking-wide mb-1.5">Last name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-clinicPrimary/40 focus:border-clinicPrimary font-medium"
                    placeholder="e.g. Doe"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 tracking-wide mb-1.5">Date of birth</label>
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-clinicPrimary/40 focus:border-clinicPrimary font-medium text-slate-700"
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !form.initial.trim() || !form.lastName.trim() || !form.dob}
                className="w-full py-3.5 px-4 bg-clinicPrimary hover:bg-clinicPrimary/95 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-clinicPrimary mt-2 flex justify-center items-center h-12"
              >
                {loading ? <Spinner /> : 'Search'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: RESULT */}
        {step === 'result' && data && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800">Your Appointment</h2>
              <p className="text-slate-500 text-sm mt-1">Please verify your details</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-4 shadow-inner">
              <div className="flex border-b border-slate-200 pb-3">
                <div className="w-1/3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Patient</p>
                </div>
                <div className="w-2/3">
                  <p className="text-base font-semibold text-slate-800">
                    {(data.firstName && data.lastName
                      ? `${data.firstName} ${data.lastName}`
                      : data.patientName) || `${form.initial}. ${form.lastName}`}
                  </p>
                </div>
              </div>

              <div className="flex border-b border-slate-200 pb-3">
                <div className="w-1/3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</p>
                </div>
                <div className="w-2/3">
                  <p className="text-base font-semibold text-slate-800">
                    {data.appointmentTime || data.time || data.startTime || 'Scheduled Time'}
                  </p>
                </div>
              </div>

              <div className="flex pb-1">
                <div className="w-1/3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Therapist</p>
                </div>
                <div className="w-2/3">
                  <p className="text-base font-medium text-slate-700">
                    {data.therapistName || data.practitioner || 'Assigned Therapist'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('search')}
                disabled={loading}
                className="flex-[1] py-3.5 px-4 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-bold rounded-lg disabled:opacity-50 transition-colors h-12"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleArrive}
                disabled={loading}
                className="flex-[2] py-3.5 px-4 bg-clinicPrimary hover:bg-clinicPrimary/95 text-white font-bold rounded-lg disabled:opacity-50 transition-all shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-clinicPrimary flex justify-center items-center h-12 tracking-wide"
              >
                {loading ? <Spinner /> : 'ARRIVE'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="animate-in zoom-in duration-500 py-10 text-center space-y-5">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner ring-4 ring-green-50">
              <svg className="w-12 h-12 text-green-500 animate-[bounce_1s_ease-in-out_1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-600">Patient Checked-in Successfully</h2>
              <p className="text-slate-500 font-medium">Please take a seat.<br />We will be with you shortly.</p>
            </div>
          </div>
        )}
      </div>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};

export default Checkin;
