import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaCaretDown, FaUser } from 'react-icons/fa';
import ClinicalNoteIcon from '../ui/ClinicalNoteIcon';
import AppCompleteIcon from '../ui/AppCompleteIcon';
import SendMessageModal from './SendMessageModal';
import {
  LuBell, LuPencil, LuMail
} from 'react-icons/lu';
import { useToast } from '../../context/ToastContext';
import { readAllowedModules } from '../../config/modules';
import { getInvoiceDisplayNumber } from '../../utils/invoiceDisplay';

/** All statuses the API accepts — full manual control from the dropdown */
const APPOINTMENT_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'checked_in', label: 'Checked in / Arrived' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'DNA' }
];

const to24h = (time12h = '') => {
  if (!time12h || !time12h.includes(' ')) return time12h;
  const [time, ampm] = time12h.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (ampm.toLowerCase() === 'pm' && h !== 12) h += 12;
  if (ampm.toLowerCase() === 'am' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const to12h = (time24h = '') => {
  if (!time24h || !time24h.includes(':')) return time24h;
  let [h, m] = time24h.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const formatApptDateTime = (appt) => {
  const dateRaw = appt?.appointmentDate || appt?.date;
  const startRaw = appt?.startTime || appt?.start_time;
  if (!dateRaw || !startRaw) return '-';

  const dateObj = new Date(dateRaw);
  if (Number.isNaN(dateObj.getTime())) return '-';

  const startObj = new Date(startRaw);
  const hasIsoStart = !Number.isNaN(startObj.getTime()) && String(startRaw).includes('T');

  const dt = hasIsoStart
    ? startObj
    : new Date(`${dateObj.toISOString().split('T')[0]}T${to24h(String(startRaw).replace('.', ':'))}:00`);

  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const toMoney = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
};

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="relative w-8 h-4 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
    style={{ background: checked ? '#2ea7b8' : '#cbd5e1' }}
  >
    <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
  </button>
);

const RightSidebar = ({ isOpen, appointment, onClose, onSave, onUpdateStatus, userRole = 'admin', width = 420, setWidth }) => {
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !e || typeof e.clientX !== 'number') return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setWidth]);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isTherapist = userRole === 'therapist';
  const isReceptionist = userRole === 'receptionist';
  const isBilling = userRole === 'billing';
  const isAdmin = userRole === 'admin';
  const storedUser = sessionStorage.getItem('deephysio_user');
  let sessionUser = null;
  try {
    sessionUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    sessionUser = null;
  }
  const allowedModules = readAllowedModules(sessionUser, userRole);
  const hasSettingsAccess = allowedModules.includes('Settings');
  const s = appointment?.status || '';
  const [form, setForm] = useState({
    status: 'scheduled',
    notes: '',
    reminder: true,
    telehealth: true,
    appType: 'Initial Appointment',
    location: 'DeePhysio Clinic',
    practitioner: '',
    room: 'Room 1',
    date: '',
    startTime: '',
    endTime: ''
  });

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [patientContact, setPatientContact] = useState({ name: '', mobile: '', email: '' });
  const [roomOptions, setRoomOptions] = useState(['Room 1 (Consult)', 'Room 2 (Rehab)', 'Room 3 (Assessment)', 'Studio A', 'Main Gym']);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [therapistOptions, setTherapistOptions] = useState([]);
  const [previousApptText, setPreviousApptText] = useState('-');
  const [nextApptText, setNextApptText] = useState('-');
  const [invoiceSummary, setInvoiceSummary] = useState({
    id: null,
    label: '-',
    itemLabel: 'No services linked',
    methodLabel: 'No payment',
    amountLabel: '0.00'
  });

  const openInvoiceEditor = () => {
    const params = new URLSearchParams();
    const patientId = appointment?.patientId || appointment?.patient?.id;
    const appointmentId = appointment?.id;
    const serviceId = appointment?.serviceId || form?.appType;
    const serviceName = appointment?.type || serviceOptions.find((s) => String(s.id) === String(form?.appType))?.name;

    if (patientId) params.set('patientId', String(patientId));
    if (appointmentId) params.set('appointmentId', String(appointmentId));
    if (serviceId && !Number.isNaN(Number(serviceId))) params.set('serviceId', String(serviceId));
    if (serviceName) params.set('serviceName', String(serviceName));

    navigate(`/billing/new${params.toString() ? `?${params.toString()}` : ''}`);
  };

  useEffect(() => {
    if (appointment) {
      const loadPatient = async () => {
        let patient = {};
        const activePatientId = appointment.patientId || appointment.patient?.id;
        const appointmentServiceLabel = appointment.type || 'Appointment Service';
        if (activePatientId) {
          try {
            const res = await fetchApi(`/patients/${activePatientId}`);
            if (res?.ok) {
              const data = await res.json();
              if (data.success) {
                patient = data.data;
              }
            }
          } catch(e) { console.error(e); }
        } else if (appointment.patient) {
          patient = appointment.patient;
        }

        setPatientContact({
          name: appointment.patientName || (patient.firstName || patient.first_name ? `${patient.firstName || patient.first_name} ${patient.lastName || patient.last_name}` : ''),
          mobile: patient.phone || patient.mobile || '+1 555-000-0000',
          email: patient.email || `${(appointment.patientName || 'patient').toLowerCase().replace(' ', '.')}@email.com`
        });

        if (!activePatientId) {
          setPreviousApptText('-');
          setNextApptText('-');
          setInvoiceSummary({
            id: null,
            label: 'Invoice - Pending',
            itemLabel: appointmentServiceLabel,
            methodLabel: 'Pending',
            amountLabel: '0.00'
          });
          return;
        }

        try {
          const historyRes = await fetchApi(`/appointments?patientId=${activePatientId}`);
          if (historyRes?.ok) {
            const historyJson = await historyRes.json();
            const rows = Array.isArray(historyJson?.data) ? historyJson.data : [];
            const ordered = rows
              .map((row) => {
                const dateRaw = row.appointmentDate || row.date;
                const startRaw = row.startTime || row.start_time;
                const dateObj = dateRaw ? new Date(dateRaw) : null;
                const startObj = startRaw ? new Date(startRaw) : null;
                const hasIsoStart = startRaw && !Number.isNaN(startObj?.getTime()) && String(startRaw).includes('T');
                const dateTime = hasIsoStart
                  ? startObj
                  : (dateObj && startRaw
                      ? new Date(`${dateObj.toISOString().split('T')[0]}T${to24h(String(startRaw).replace('.', ':'))}:00`)
                      : null);
                return {
                  raw: row,
                  time: dateTime && !Number.isNaN(dateTime.getTime()) ? dateTime : null
                };
              })
              .filter((x) => x.time)
              .sort((a, b) => a.time - b.time);

            const current = appointment.startTime && appointment.date
              ? new Date(`${appointment.date}T${to24h(String(appointment.startTime).replace('.', ':'))}:00`)
              : null;
            const currentTime = current && !Number.isNaN(current.getTime()) ? current : null;

            const previous = ordered.filter((x) => x.time < (currentTime || new Date(0))).at(-1);
            const next = ordered.find((x) => x.time > (currentTime || new Date(8640000000000000)));

            setPreviousApptText(previous ? formatApptDateTime(previous.raw) : '-');
            setNextApptText(next ? formatApptDateTime(next.raw) : '-');
          }
        } catch (e) {
          console.error(e);
        }

        try {
          setInvoiceSummary({
            id: null,
            label: 'Invoice - Pending',
            itemLabel: appointmentServiceLabel,
            methodLabel: 'Pending',
            amountLabel: '0.00'
          });
          const invoiceRes = await fetchApi(`/invoices?patientId=${activePatientId}`);
          if (invoiceRes?.ok) {
            const invoiceJson = await invoiceRes.json();
            const invoices = Array.isArray(invoiceJson?.data) ? invoiceJson.data : [];
            const latest = invoices[0];
            if (latest) {
              const invoiceId = latest.id;
              const firstItem = Array.isArray(latest.items) && latest.items.length > 0 ? latest.items[0] : null;
              const payments = Array.isArray(latest.payments) ? latest.payments : [];
              const paid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
              const due = Math.max(0, Number(latest.total || 0) - paid);
              const lastPayment = payments[0];

              setInvoiceSummary({
                id: invoiceId,
                label: invoiceId ? getInvoiceDisplayNumber(latest, latest.id) : 'Invoice',
                itemLabel: firstItem?.service || appointmentServiceLabel,
                methodLabel: lastPayment?.method || 'Pending',
                amountLabel: toMoney(due)
              });
            } else {
              setInvoiceSummary({
                id: null,
                label: 'Invoice - Pending',
                itemLabel: appointmentServiceLabel,
                methodLabel: 'Pending',
                amountLabel: '0.00'
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      };
      
      loadPatient();

      const rawSt = appointment.status === 'confirmed' ? 'scheduled' : (appointment.status || 'scheduled');
      const normalizedStatus = APPOINTMENT_STATUS_OPTIONS.some((o) => o.value === rawSt)
        ? rawSt
        : 'scheduled';

      setForm({
        status: normalizedStatus,
        notes: appointment.notes || '',
        reminder: true,
        telehealth: true,
        appType: appointment.serviceId ? String(appointment.serviceId) : '',
        location: 'DeePhysio Clinic',
        therapistId: appointment.therapistId ? String(appointment.therapistId) : '',
        practitioner: appointment.practitioner || '',
        room: appointment.room || 'Room 1',
        date: appointment.date || '',
        startTime: to24h(appointment.startTime),
        endTime: to24h(appointment.endTime || appointment.startTime)
      });
    }
  }, [appointment]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [roomRes, serviceRes, usersRes] = await Promise.all([
          fetchApi('/settings?keys=bookingRooms'),
          fetchApi('/services'),
          fetchApi('/appointments/practitioners')
        ]);

        if (roomRes?.ok) {
          const data = await roomRes.json();
          const roomValue = data?.data?.bookingRooms || data?.bookingRooms || (data?.data && Array.isArray(data.data) ? data.data.find(s => s.key === 'bookingRooms')?.value : null);
          if (Array.isArray(roomValue)) {
            setRoomOptions(roomValue.filter((r) => typeof r === 'string' && r.trim()));
          }
        }

        if (serviceRes?.ok) {
          const serviceData = await serviceRes.json();
          const rows = Array.isArray(serviceData?.data) ? serviceData.data : [];
          setServiceOptions(rows.map((s) => ({ id: s.id, name: s.name })));
        }

        if (usersRes?.ok) {
          const usersData = await usersRes.json();
          const allUsers = Array.isArray(usersData?.data) ? usersData.data : [];
          const therapists = allUsers
            .filter((u) => String(u.role || '').toLowerCase() === 'therapist')
            .map((u) => ({ id: u.id, name: u.name || `User ${u.id}` }));
          setTherapistOptions(therapists);
        }
      } catch (e) {
        // keep current fallback values
      }
    };
    loadOptions();
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const setDraftStatus = (nextStatus) => {
    set('status', nextStatus);
    showToast('Status selected. Click Save Changes to apply.', 'info');
  };

  const handleSave = () => {
    onSave({ 
      ...appointment, 
      ...form, 
      serviceId: form.appType ? Number(form.appType) : appointment.serviceId,
      therapistId: form.therapistId ? Number(form.therapistId) : appointment.therapistId,
      startTime: form.startTime,
      endTime: form.endTime
    });
  };

  const handleMarkCompleted = () => {
    if (s !== 'checked_in') {
      showToast('⚠️ Patient must be checked in first', 'error');
      return;
    }
    setDraftStatus('completed');
  };

  const handleCheckIn = () => {
    if (!['scheduled', 'no_show'].includes(s)) {
      showToast('⚠️ Can only check-in a scheduled or no-show appointment', 'error');
      return;
    }
    setDraftStatus('checked_in');
  };

  const handleCancelAppointment = () => {
    if (s === 'cancelled') {
      showToast('⚠️ This appointment is already cancelled', 'error');
      return;
    }
    setIsCancelConfirmOpen(true);
  };

  const confirmCancelAppointment = () => {
    setIsCancelConfirmOpen(false);
    setDraftStatus('cancelled');
  };

  const handleAddNote = () => {
    showToast(`Opening clinical notes for ${appointment.patientName}...`, 'info');
    setTimeout(() => navigate(`/notes/new?patientId=${appointment.patientId}&appointmentId=${appointment.id}`), 600);
  };

  const handleViewPatient = () => {
    navigate(`/patients/profile/${appointment.patientId}`);
  };

  const handleAction = (action) => {
    if (action === 'chat') {
      setIsMessageModalOpen(true);
    } else if (action === 'video') {
      showToast(`Initializing telehealth session for ${appointment.patientName}...`, 'info');
      setTimeout(() => navigate('/communication/telehealth'), 1000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && appointment && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/20 z-30 backdrop-blur-[1px]"
          />

          {/* Panel */}
          <motion.aside
            key="panel"
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 35, stiffness: 400 }}
            className="fixed right-0 z-40 flex flex-col bg-white border-l border-slate-200 shadow-2xl overflow-visible font-sans"
            style={{
              width: `${width}px`,
              maxWidth: '100vw',
              top: '72px',
              bottom: 0,
              height: 'auto'
            }}
          >
            {/* Resize Handle */}
            <div
              onMouseDown={() => setIsResizing(true)}
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-clinicPrimary/30 transition-colors z-50 group"
            >
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-slate-300 rounded-full group-hover:bg-clinicPrimary/50" />
            </div>

            {/* Header (Blue/ClinicPrimary) - Drag Handle */}
            <div className="flex items-center justify-between px-4 py-3 bg-clinicPrimary text-white shrink-0 cursor-move" title="Drag to move">
              <div
                className="flex items-center gap-2 cursor-pointer hover:text-white/80 transition-colors group"
                onClick={() => navigate(`/patients/profile/${appointment.patientId}`)}
              >
                <h2 className="text-[15px] font-bold tracking-tight">
                  {appointment.patientName}
                </h2>
                <FaCaretDown className="opacity-80 group-hover:opacity-100" size={14} />
              </div>

              <div className="flex items-center gap-3">
                <button onClick={onClose} className="hover:text-white/80 transition-colors">
                  <FaTimes size={16} />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto appointment-scrollbar bg-slate-50 relative pb-20">

              {/* SECTION: WHEN & WHERE */}
              <div className="bg-white border-b border-t border-slate-200 shadow-sm mt-3 mx-2 rounded-lg">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/50 rounded-t-lg">
                  <h3 className="text-[13px] font-bold text-clinicPrimary">When & Where</h3>
                </div>
                <div className="p-3 space-y-2.5">
                  <div className="flex items-center text-[12px]">
                    <span className="w-20 shrink-0 font-bold text-slate-800">When</span>
                    <input 
                      type="date" 
                      value={form.date} 
                      onChange={e => set('date', e.target.value)}
                      className="flex-1 border border-slate-200 rounded p-1 pl-2 text-[12px] bg-white text-clinicPrimary font-semibold outline-none focus:border-clinicPrimary appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center text-[12px]">
                    <span className="w-20 shrink-0 font-bold text-slate-800">Time</span>
                    <div className="flex-1 flex gap-2 items-center">
                      <input 
                        type="time" 
                        value={form.startTime} 
                        onChange={e => set('startTime', e.target.value)}
                        className="flex-1 border border-slate-200 rounded p-1 pl-2 text-[12px] bg-white text-slate-600 outline-none focus:border-clinicPrimary appearance-none cursor-pointer"
                      />
                      <span className="text-slate-400">to</span>
                      <input 
                        type="time" 
                        value={form.endTime} 
                        onChange={e => set('endTime', e.target.value)}
                        className="flex-1 border border-slate-200 rounded p-1 pl-2 text-[12px] bg-white text-slate-600 outline-none focus:border-clinicPrimary appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex items-center text-[12px]">
                    <span className="w-20 shrink-0 font-bold text-slate-800">Location</span>
                    <input
                      value={form.location}
                      readOnly
                      className="flex-1 border border-slate-200 rounded p-1 pl-2 text-[12px] bg-slate-100 text-slate-600 outline-none cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-center text-[12px]">
                    <span className="w-20 shrink-0 font-bold text-slate-800">With</span>
                    <div className="flex-1 relative">
                      <select
                        value={form.therapistId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const selectedTherapist = therapistOptions.find((t) => String(t.id) === String(selectedId));
                          set('therapistId', selectedId);
                          set('practitioner', selectedTherapist?.name || '');
                        }}
                        className="w-full border border-slate-200 rounded p-1 pl-2 text-[12px] bg-white text-slate-600 focus:border-clinicPrimary outline-none appearance-none cursor-pointer"
                      >
                        <option value="">Select Therapist...</option>
                        {therapistOptions.map((t) => (
                          <option key={t.id} value={String(t.id)}>{t.name}</option>
                        ))}
                      </select>
                      <FaCaretDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                    </div>
                  </div>
                  <div className="flex items-start text-[12px]">
                    <span className="w-20 shrink-0 font-bold text-slate-800">Previous</span>
                    <div className="flex-1 flex justify-between items-center text-slate-600">
                      <span className="font-medium truncate">{previousApptText}</span>
                    </div>
                  </div>
                  <div className="flex items-start text-[12px] pt-1 border-t border-slate-50">
                    <span className="w-20 shrink-0 font-bold text-slate-800">Next</span>
                    <div className="flex-1 flex justify-between items-center text-slate-600">
                      <span className="font-medium truncate">{nextApptText}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: APPOINTMENT DETAILS */}
              <div className="bg-white border focus-within:border-clinicPrimary/40 border-slate-200 shadow-sm mt-3 mx-2 rounded-lg transition-colors overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-[13px] font-bold text-clinicPrimary">Appointment Details</h3>
                </div>
                <div className="p-3 space-y-3">
                  <div className="flex items-center text-[12px]">
                    <span className="w-20 shrink-0 font-bold text-slate-800">Reminder</span>
                    <div className="flex-1 flex justify-between items-center">
                      <Toggle checked={form.reminder} onChange={v => set('reminder', v)} />
                      <span className="text-slate-500 font-medium flex items-center gap-1.5 opacity-80">Will be sent <LuBell className="text-slate-800" size={12} /></span>
                    </div>
                  </div>
                  <div className="flex items-center text-[12px]">
                    <span className="w-20 shrink-0 font-bold text-slate-800">Status</span>
                    <div className="flex-1 relative">
                      <select
                        value={
                          APPOINTMENT_STATUS_OPTIONS.some((o) => o.value === form.status)
                            ? form.status
                            : s || 'scheduled'
                        }
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (newStatus === 'cancelled') {
                            setIsCancelConfirmOpen(true);
                            return;
                          }
                          setDraftStatus(newStatus);
                        }}
                        className={`w-full border rounded p-1.5 pl-3 text-[11px] font-black uppercase tracking-wider outline-none appearance-none shadow-sm transition-colors border-slate-200 bg-white text-slate-700 focus:border-clinicPrimary cursor-pointer hover:border-slate-300 ${
                          s === 'completed' ? '!bg-emerald-50 !text-emerald-700 !border-emerald-200' : ''
                        } ${s === 'cancelled' ? '!bg-rose-50 !text-rose-800 !border-rose-200' : ''}`}
                      >
                        {APPOINTMENT_STATUS_OPTIONS.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <FaCaretDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={10} />
                    </div>
                  </div>
                  <div className="flex items-center text-[12px]">
                    <span className="w-20 shrink-0 font-bold text-slate-800">App Type</span>
                    <div className="flex-1 relative">
                      <select
                        value={form.appType}
                        onChange={(e) => {
                          const val = e.target.value;
                          set('appType', val);
                          const s = serviceOptions.find(x => String(x.id) === String(val));
                          if (s) setInvoiceSummary(prev => ({ ...prev, itemLabel: s.name }));
                        }}
                        className="w-full border border-slate-200 rounded p-1.5 pl-2.5 pr-8 text-[12px] bg-white text-slate-600 font-semibold outline-none focus:border-clinicPrimary appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                      >
                        <option value="">{appointment?.type || 'Select App Type...'}</option>
                        {serviceOptions.map((s) => (
                          <option key={s.id} value={String(s.id)}>{s.name}</option>
                        ))}
                      </select>
                      <FaCaretDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                    </div>
                  </div>
                  <div className="flex items-center text-[12px]">
                    <span className="w-20 shrink-0 font-bold text-slate-800">Room</span>
                    <div className="flex-1 relative">
                      <select
                        value={form.room}
                        onChange={(e) => set('room', e.target.value)}
                        className="w-full border border-slate-200 rounded p-1.5 pl-2.5 pr-8 text-[12px] bg-white text-slate-600 font-semibold outline-none focus:border-clinicPrimary appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                      >
                        <option value="">{form.room || 'Select Room...'}</option>
                        {roomOptions.map((r, idx) => (
                          <option key={idx} value={r}>{r}</option>
                        ))}
                      </select>
                      <FaCaretDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                    </div>
                  </div>
                  <div className="pt-1">
                    <textarea
                      value={form.notes} onChange={e => set('notes', e.target.value)}
                      rows={2}
                      className="w-full border border-slate-200 rounded p-2 text-[12px] text-slate-600 focus:border-clinicPrimary outline-none resize-none placeholder-slate-300"
                      placeholder="Initial Appt..."
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: INVOICE — hidden for therapist and receptionist roles */}
              {(!isTherapist && !isReceptionist) && (
                <div className="bg-white border border-slate-200 shadow-sm mt-3 mx-2 rounded-lg mb-4 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-[13px] font-bold text-clinicPrimary">{invoiceSummary.label}</h3>
                    <div className="flex gap-3 text-clinicPrimary/80 items-center">
                      <LuPencil size={14} className="cursor-pointer hover:text-indigo-500 transition-all duration-200" title="Edit / View Invoice" onClick={openInvoiceEditor} />
                      {/* Message/Chat feature commented out
                      <LuMail size={14} className="cursor-pointer hover:text-indigo-500 transition-all duration-200" onClick={() => handleAction('chat')} />
                      */}
                    </div>
                  </div>
                  <div className="p-3 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-800">
                        <span>Services & Products</span>
                        <span className="text-clinicPrimary cursor-pointer hover:underline" onClick={openInvoiceEditor}>+ Add Item</span>
                      </div>
                      <div className="flex gap-1.5 relative">
                        <select
                          value={serviceOptions.find(s => s.name === invoiceSummary.itemLabel)?.id || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const selected = serviceOptions.find(x => String(x.id) === String(val));
                            if (selected) {
                              setInvoiceSummary(prev => ({ ...prev, itemLabel: selected.name }));
                              set('appType', val); // Sync with appointment details
                              showToast(`Service updated to ${selected.name}`, 'info');
                            }
                          }}
                          className="flex-1 w-full border border-slate-200 rounded p-1.5 pl-2.5 pr-8 text-[11px] bg-white text-slate-600 font-medium outline-none focus:border-clinicPrimary appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                        >
                          <option value="" disabled>{invoiceSummary.itemLabel || 'Select Service'}</option>
                          {serviceOptions.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <FaCaretDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-800">
                        <span>Payments</span>
                        <span className="text-clinicPrimary cursor-pointer hover:underline" onClick={() => navigate('/billing/payments')}>+ Add Payment</span>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="w-28 shrink-0 border border-slate-200 rounded p-1.5 px-2.5 text-[11px] bg-slate-50 text-slate-600 font-medium cursor-default">
                          {invoiceSummary.methodLabel}
                        </div>
                        <input type="text" value={invoiceSummary.amountLabel} readOnly className="flex-1 border border-slate-200 rounded p-1.5 text-[11px] font-black text-right text-slate-700 bg-slate-50 cursor-default outline-none" placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions — strictly status-driven */}
              {(isTherapist || isAdmin || isReceptionist) && (
                <div className="mt-3 mx-2 mb-4 space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Quick Actions</p>
                  
                  {/* scheduled/no_show → Check In + Cancel */}
                  {(s === 'scheduled' || s === 'no_show') && (
                    <>
                      <button
                        onClick={handleCheckIn}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-200 text-[12px] font-bold transition-all active:scale-[0.98]"
                      >
                        <FaUser size={13} className="text-blue-500" />
                        {s === 'no_show' ? 'Mark Late Arrival' : 'Mark Patient Arrived'}
                      </button>
                      <button
                        onClick={handleCancelAppointment}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-200 text-[12px] font-bold transition-all active:scale-[0.98]"
                      >
                        <FaTimes size={13} className="text-rose-500" />
                        Cancel Appointment
                      </button>
                    </>
                  )}

                  {/* checked_in → Complete + Add Note + Cancel */}
                  {s === 'checked_in' && (
                    <>
                      <button
                        onClick={handleMarkCompleted}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-200 text-[12px] font-bold transition-all active:scale-[0.98]"
                      >
                        <AppCompleteIcon size={13} className="text-emerald-500" />
                        Mark as Completed
                      </button>
                      <button
                        onClick={handleAddNote}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-200 text-[12px] font-bold transition-all active:scale-[0.98]"
                      >
                        <ClinicalNoteIcon size={13} className="text-amber-500" />
                        Add Clinical Note
                      </button>
                      <button
                        onClick={handleCancelAppointment}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-100 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-200 text-[12px] font-bold transition-all active:scale-[0.98]"
                      >
                        <FaTimes size={13} className="text-rose-500" />
                        Cancel Appointment
                      </button>
                    </>
                  )}

                  {/* completed → View Patient + Add Note */}
                  {s === 'completed' && (
                    <>
                      <button
                        onClick={handleViewPatient}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-violet-100 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-200 text-[12px] font-bold transition-all active:scale-[0.98]"
                      >
                        <FaUser size={13} className="text-violet-500" />
                        View Patient Details
                      </button>
                      <button
                        onClick={handleAddNote}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-200 text-[12px] font-bold transition-all active:scale-[0.98]"
                      >
                        <ClinicalNoteIcon size={13} className="text-amber-500" />
                        Add Clinical Note
                      </button>
                    </>
                  )}

                  {/* cancelled → View Patient only */}
                  {s === 'cancelled' && (
                    <button
                      onClick={handleViewPatient}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-violet-100 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-200 text-[12px] font-bold transition-all active:scale-[0.98]"
                    >
                      <FaUser size={13} className="text-violet-500" />
                      View Patient Details
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* Fixed Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-200 z-10 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.05)]">
              <button
                onClick={handleSave}
                className="w-full h-11 bg-clinicPrimary hover:brightness-110 text-white rounded text-[13px] font-bold uppercase tracking-wider shadow-sm active:scale-[0.98] transition-all"
              >
                Save Changes
              </button>
            </div>

          </motion.aside>

          {/* Messaging Modal commented out
          <SendMessageModal 
            isOpen={isMessageModalOpen}
            onClose={() => setIsMessageModalOpen(false)}
            patient={patientContact}
          />
          */}

          {/* In-app cancel confirmation (replaces browser window.confirm) */}
          {isCancelConfirmOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/50"
                onClick={() => setIsCancelConfirmOpen(false)}
                aria-label="Close cancel confirmation"
              />
              <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                <h3 className="text-[15px] font-black text-slate-900">Cancel appointment?</h3>
                <p className="mt-2 text-[13px] text-slate-600">
                  Do you want to cancel this appointment?
                </p>
                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCancelConfirmOpen(false)}
                    className="h-9 rounded-lg border border-slate-200 px-4 text-[12px] font-bold text-slate-600 hover:bg-slate-50"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={confirmCancelAppointment}
                    className="h-9 rounded-lg bg-rose-600 px-4 text-[12px] font-bold text-white hover:bg-rose-700"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default RightSidebar;
