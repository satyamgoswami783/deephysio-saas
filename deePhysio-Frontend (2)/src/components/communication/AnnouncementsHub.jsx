import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FaBullhorn, FaUser, FaUsers, FaSearch, FaTimes, FaCheck, FaSyncAlt,
  FaCalendarCheck, FaCreditCard, FaDumbbell, FaHeartbeat, FaChartLine,
  FaPaperPlane, FaWhatsapp, FaHospitalUser, FaFileMedical, FaMobileAlt,
  FaCheckCircle, FaExclamationTriangle, FaUserCheck, FaChevronDown
} from 'react-icons/fa';
import { fetchApi } from '../../config/api';

// Helper to reliably extract patient full name across all DB formats & camelCase/snake_case
export const getPatientFullName = (p) => {
  if (!p) return 'Patient';
  const first = p.firstName || p.first_name || '';
  const last = p.lastName || p.last_name || '';
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (p.name && String(p.name).trim()) return String(p.name).trim();
  return `Patient #${p.id || ''}`.trim();
};

// Clean phone display
const formatPhoneDisplay = (raw) => {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  if (digits.length > 10) return `+${digits}`;
  return raw;
};

// 7 Clean, Clear Physiotherapy Clinic Categories
export const CLINIC_CATEGORIES = [
  {
    id: 'appointment',
    name: 'Appointment Reminder',
    icon: FaCalendarCheck,
    colorClass: 'text-cyan-600',
    bgClass: 'bg-cyan-50 border-cyan-200',
    template: (name) => `Hello ${name}, this is a reminder for your upcoming physiotherapy session at DeePhysio Clinic. Please arrive 5 minutes before your slot.`
  },
  {
    id: 'exercise',
    name: 'Home Exercises (HEP)',
    icon: FaDumbbell,
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50 border-emerald-200',
    template: (name) => `Hello ${name}, your therapist has prescribed a home exercise routine. Complete 2 sets daily as demonstrated for your recovery.`
  },
  {
    id: 'payment',
    name: 'Payment & Billing Reminder',
    icon: FaCreditCard,
    colorClass: 'text-rose-600',
    bgClass: 'bg-rose-50 border-rose-200',
    template: (name) => `Hello ${name}, this is a gentle reminder regarding your pending clinic invoice. Please contact the front desk for receipt details.`
  },
  {
    id: 'progress',
    name: 'Recovery & Mobility Progress',
    icon: FaChartLine,
    colorClass: 'text-indigo-600',
    bgClass: 'bg-indigo-50 border-indigo-200',
    template: (name) => `Hello ${name}, excellent improvement on your mobility and range of motion! Keep maintaining your regular physiotherapy sessions.`
  },
  {
    id: 'checkin',
    name: 'Visit Check-In & Welcome',
    icon: FaHospitalUser,
    colorClass: 'text-teal-600',
    bgClass: 'bg-teal-50 border-teal-200',
    template: (name) => `Hello ${name}, your clinic visit attendance has been recorded. Thank you for choosing DeePhysio Clinic!`
  },
  {
    id: 'careplan',
    name: 'Care & Treatment Plan',
    icon: FaFileMedical,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50 border-amber-200',
    template: (name) => `Hello ${name}, here is your updated posture and rehabilitation care advisory. Please follow all ergonomic instructions.`
  },
  {
    id: 'custom',
    name: 'Custom / General Message',
    icon: FaBullhorn,
    colorClass: 'text-slate-600',
    bgClass: 'bg-slate-50 border-slate-200',
    template: (name) => `Hello ${name}, greeting from DeePhysio Clinic. Please let us know if you have any questions regarding your treatment.`
  }
];

const AnnouncementsHub = ({ isEmbedded = false }) => {
  // Tabs: 'PERSONAL' | 'BROADCAST'
  const [activeTab, setActiveTab] = useState('PERSONAL');

  // WhatsApp Status
  const [waStatus, setWaStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Patients & Staff data
  const [patients, setPatients] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Personal message state
  const [recipientMode, setRecipientMode] = useState('PATIENT'); // 'PATIENT' | 'STAFF' | 'DIRECT'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CLINIC_CATEGORIES[0]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);
  const [errorBanner, setErrorBanner] = useState(null);

  // Direct custom phone inputs
  const [directPhone, setDirectPhone] = useState('');
  const [directName, setDirectName] = useState('');

  // Group broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState('ALL'); // 'ALL' | 'SELECTED' | 'STAFF'
  const [selectedPatientIds, setSelectedPatientIds] = useState(new Set());
  const [broadcastCategory, setBroadcastCategory] = useState(CLINIC_CATEGORIES[0]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(null);
  const [broadcastSuccess, setBroadcastSuccess] = useState(null);

  const pickerRef = useRef(null);

  // Close picker on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch Patients & Status
  const loadData = async () => {
    try {
      const [statusRes, patientsRes, staffRes] = await Promise.allSettled([
        fetchApi('/settings/whatsapp/status'),
        fetchApi('/patients?limit=300'),
        fetchApi('/users')
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value?.ok) {
        const sJson = await statusRes.value.json();
        if (sJson?.success) setWaStatus(sJson.data);
      }

      let loadedPatients = [];
      if (patientsRes.status === 'fulfilled' && patientsRes.value?.ok) {
        const pJson = await patientsRes.value.json();
        const pList = Array.isArray(pJson) ? pJson : (pJson?.data || []);
        if (Array.isArray(pList)) {
          loadedPatients = pList;
          setPatients(pList);
        }
      }

      if (staffRes.status === 'fulfilled' && staffRes.value?.ok) {
        const uJson = await staffRes.value.json();
        const uList = Array.isArray(uJson) ? uJson : (uJson?.data || []);
        if (Array.isArray(uList)) {
          setStaffUsers(uList);
        }
      }

      // Auto-select first real patient by name
      if (loadedPatients.length > 0 && !selectedPatient) {
        const firstP = loadedPatients[0];
        const pFullName = getPatientFullName(firstP);
        setSelectedPatient(firstP);
        setMessageText(CLINIC_CATEGORIES[0].template(pFullName));
      }
    } catch (e) {
      console.error('Failed to load announcements hub data:', e);
    } finally {
      setLoadingData(false);
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Search filtered patients list
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase().trim();
    return patients.filter((p) => {
      const fullName = getPatientFullName(p).toLowerCase();
      const phone = String(p.phone || p.contact_number || p.mobile || '');
      const id = String(p.id || '');
      return fullName.includes(q) || phone.includes(q) || id.includes(q);
    });
  }, [patients, searchQuery]);

  // Handle selecting a patient
  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    setIsPickerOpen(false);
    setSearchQuery('');
    setErrorBanner(null);
    setSuccessBanner(null);
    const pFullName = getPatientFullName(p);
    setMessageText(selectedCategory.template(pFullName));
  };

  // Handle Category Click
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    const recipientName = recipientMode === 'DIRECT' 
      ? (directName.trim() || 'Patient') 
      : getPatientFullName(selectedPatient);
    setMessageText(cat.template(recipientName));
  };

  // Send Single WhatsApp Message
  const handleSendPersonalMessage = async (e) => {
    if (e) e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);

    let targetPhone = '';
    let targetName = '';

    if (recipientMode === 'DIRECT') {
      targetPhone = String(directPhone).replace(/\D/g, '');
      targetName = directName.trim() || 'Contact';
      if (!targetPhone || targetPhone.length < 9) {
        setErrorBanner('Please enter a valid WhatsApp mobile number.');
        return;
      }
    } else {
      if (!selectedPatient) {
        setErrorBanner('Please select a patient from the list.');
        return;
      }
      targetPhone = String(selectedPatient.phone || selectedPatient.contact_number || selectedPatient.mobile || '').replace(/\D/g, '');
      targetName = getPatientFullName(selectedPatient);

      if (!targetPhone || targetPhone.length < 9) {
        setErrorBanner(`Patient "${targetName}" does not have a valid mobile number registered.`);
        return;
      }
    }

    if (!messageText.trim()) {
      setErrorBanner('Please enter a message to send.');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetchApi('/settings/whatsapp/test', {
        method: 'POST',
        body: JSON.stringify({
          recipientPhone: targetPhone,
          recipientName: targetName,
          recipientType: 'PATIENT',
          eventType: selectedCategory.id.toUpperCase(),
          message: messageText.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data?.success) {
        setSuccessBanner(`WhatsApp message sent successfully to ${targetName}!`);
      } else {
        setErrorBanner(data?.message || 'Failed to send WhatsApp message. Please check WhatsApp connection.');
      }
    } catch (_) {
      setErrorBanner('Network communication error while sending message.');
    } finally {
      setIsSending(false);
    }
  };

  // Toggle selection for group broadcast
  const togglePatientSelection = (patientId) => {
    const next = new Set(selectedPatientIds);
    if (next.has(patientId)) {
      next.delete(patientId);
    } else {
      next.add(patientId);
    }
    setSelectedPatientIds(next);
  };

  const selectAllPatients = () => {
    if (selectedPatientIds.size === patients.length) {
      setSelectedPatientIds(new Set());
    } else {
      setSelectedPatientIds(new Set(patients.map(p => p.id)));
    }
  };

  // Send Group Broadcast
  const handleSendBroadcast = async () => {
    let targetPatients = [];
    if (broadcastTarget === 'ALL') {
      targetPatients = patients;
    } else if (broadcastTarget === 'SELECTED') {
      targetPatients = patients.filter(p => selectedPatientIds.has(p.id));
    } else if (broadcastTarget === 'STAFF') {
      targetPatients = staffUsers.map(u => ({
        id: u.id,
        name: u.name,
        phone: u.phone || ''
      }));
    }

    if (targetPatients.length === 0) {
      alert('Please select at least one recipient for the broadcast.');
      return;
    }

    if (!broadcastMessage.trim()) {
      alert('Please enter a broadcast message.');
      return;
    }

    setIsSendingBroadcast(true);
    setBroadcastProgress({ current: 0, total: targetPatients.length });

    let sentCount = 0;
    for (let i = 0; i < targetPatients.length; i++) {
      const p = targetPatients[i];
      const pName = getPatientFullName(p);
      const cleanPhone = String(p.phone || p.contact_number || p.mobile || '').replace(/\D/g, '');

      setBroadcastProgress({ current: i + 1, total: targetPatients.length });

      if (cleanPhone && cleanPhone.length >= 9) {
        try {
          await fetchApi('/settings/whatsapp/test', {
            method: 'POST',
            body: JSON.stringify({
              recipientPhone: cleanPhone,
              recipientName: pName,
              recipientType: 'BROADCAST',
              eventType: broadcastCategory.id.toUpperCase(),
              message: broadcastMessage.trim().replace(/\{name\}/g, pName)
            })
          });
          sentCount++;
        } catch (_) {}
      }
    }

    setIsSendingBroadcast(false);
    setBroadcastProgress(null);
    setBroadcastSuccess(`Broadcast message successfully delivered to ${sentCount} recipients!`);
  };

  const isConnected = waStatus?.status === 'CONNECTED';
  const currentPatientName = selectedPatient ? getPatientFullName(selectedPatient) : '';

  return (
    <div className={`space-y-6 ${isEmbedded ? '' : 'p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto'}`}>
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-clinicPrimary text-white flex items-center justify-center text-xl shadow-md shadow-clinicPrimary/20 shrink-0">
            <FaWhatsapp size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Patient WhatsApp Messaging</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Select any patient to send appointment alerts, exercise routines, or broadcast bulk messages.
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <FaWhatsapp className="text-emerald-600 text-sm" />
              <span>WhatsApp Live: {waStatus?.phoneNumber ? `+${waStatus.phoneNumber}` : 'Connected'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <FaExclamationTriangle className="text-amber-500" />
              <span>WhatsApp Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* ── NAVIGATION TABS: Personal Message vs Group Broadcast ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('PERSONAL')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'PERSONAL'
              ? 'bg-clinicPrimary text-white shadow-md shadow-clinicPrimary/25'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FaUser />
          <span>Send Message to Patient</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BROADCAST')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'BROADCAST'
              ? 'bg-clinicPrimary text-white shadow-md shadow-clinicPrimary/25'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FaBullhorn />
          <span>Group Broadcast (Bulk WhatsApp)</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════════════
          MODE 1: SEND MESSAGE TO PATIENT (SUPER CLEAN & EASY TO UNDERSTAND)
      ══════════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'PERSONAL' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Success Banner */}
          {successBanner && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shrink-0">
                  <FaCheck />
                </div>
                <span>{successBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessBanner(null)}
                className="text-emerald-600 hover:text-emerald-900 p-1 cursor-pointer"
              >
                <FaTimes size={13} />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorBanner && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FaExclamationTriangle className="text-rose-600 shrink-0 text-base" />
                <span>{errorBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorBanner(null)}
                className="text-rose-600 hover:text-rose-900 p-1 cursor-pointer"
              >
                <FaTimes size={13} />
              </button>
            </div>
          )}

          {/* ── STEP 1: SELECT PATIENT ── */}
          <div className="space-y-3" ref={pickerRef}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-clinicPrimary text-white flex items-center justify-center text-xs font-black">
                  1
                </span>
                <span>Select Patient:</span>
              </label>

              {/* Mode switch: Registered Patients vs Direct Number */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setRecipientMode('PATIENT')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    recipientMode === 'PATIENT' ? 'bg-white text-clinicPrimary font-black shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Patients ({patients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode('DIRECT')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    recipientMode === 'DIRECT' ? 'bg-white text-clinicPrimary font-black shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Direct Mobile Number
                </button>
              </div>
            </div>

            {/* Direct Number Input */}
            {recipientMode === 'DIRECT' ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Contact / Patient Name
                  </label>
                  <input
                    type="text"
                    value={directName}
                    onChange={(e) => {
                      setDirectName(e.target.value);
                      setMessageText(selectedCategory.template(e.target.value.trim() || 'Patient'));
                    }}
                    placeholder="e.g. John Doe"
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-clinicPrimary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    WhatsApp Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={directPhone}
                    onChange={(e) => setDirectPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-medium text-slate-800 outline-none focus:border-clinicPrimary"
                  />
                </div>
              </div>
            ) : (
              /* Patient Selector Capsule & Dropdown */
              <div className="relative">
                {selectedPatient ? (
                  <div className="p-3.5 sm:p-4 bg-clinicPrimary-light border border-clinicPrimary/30 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-clinicPrimary text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                        <FaUser />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 text-sm sm:text-base truncate">
                            {currentPatientName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-clinicPrimary/15 text-clinicPrimary-dark">
                            Patient #{selectedPatient.id}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-600 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 text-emerald-700 font-bold">
                            <FaWhatsapp className="text-emerald-600" />
                            {selectedPatient.phone ? formatPhoneDisplay(selectedPatient.phone) : 'No mobile registered'}
                          </span>
                          {selectedPatient.gender && (
                            <>
                              <span>•</span>
                              <span className="text-slate-400 capitalize">{selectedPatient.gender}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(!isPickerOpen)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
                    >
                      <span>Change Patient</span>
                      <FaChevronDown size={10} className={`transition-transform ${isPickerOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(true)}
                    className="w-full h-12 px-4 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-600 flex items-center justify-between cursor-pointer"
                  >
                    <span>Click here to select a patient...</span>
                    <FaChevronDown size={12} />
                  </button>
                )}

                {/* Dropdown list of all patients with search */}
                {isPickerOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-40 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 space-y-2 animate-fadeIn max-h-80 flex flex-col">
                    {/* Search inside picker */}
                    <div className="relative shrink-0">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <FaSearch size={12} />
                      </div>
                      <input
                        type="text"
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search patient by name or phone..."
                        className="w-full h-10 pl-9 pr-3 bg-slate-50 focus:bg-white text-xs sm:text-sm font-medium rounded-xl border border-slate-200 focus:border-clinicPrimary outline-none"
                      />
                    </div>

                    {/* Patient options */}
                    <div className="overflow-y-auto divide-y divide-slate-100 pr-1 flex-1">
                      {filteredPatients.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 font-medium">
                          No patients found matching "{searchQuery}".
                        </div>
                      ) : (
                        filteredPatients.map((p) => {
                          const pFullName = getPatientFullName(p);
                          const isSelected = selectedPatient?.id === p.id;
                          return (
                            <div
                              key={p.id}
                              onClick={() => handleSelectPatient(p)}
                              className={`p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                                isSelected ? 'bg-clinicPrimary-light/80 font-bold' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                                  <FaUser />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                                    {pFullName}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 font-mono">
                                    <span>{p.phone ? formatPhoneDisplay(p.phone) : 'No phone linked'}</span>
                                    <span>•</span>
                                    <span>MRN #{p.id}</span>
                                  </div>
                                </div>
                              </div>
                              {isSelected && (
                                <span className="w-5 h-5 rounded-full bg-clinicPrimary text-white flex items-center justify-center text-[10px] shrink-0">
                                  <FaCheck />
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── STEP 2: NOTIFICATION CATEGORY (PRESETS) ── */}
          <div className="space-y-3">
            <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-clinicPrimary text-white flex items-center justify-center text-xs font-black">
                2
              </span>
              <span>Choose Message Preset:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {CLINIC_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory.id === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-clinicPrimary-light border-clinicPrimary text-slate-900 ring-2 ring-clinicPrimary/20 shadow-2xs font-extrabold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                      isSelected ? 'bg-clinicPrimary text-white' : 'bg-slate-100 ' + cat.colorClass
                    }`}>
                      <Icon />
                    </div>
                    <span className="text-xs font-bold truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── STEP 3: MESSAGE BODY ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-clinicPrimary text-white flex items-center justify-center text-xs font-black">
                  3
                </span>
                <span>Message Text:</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {messageText.length} characters
              </span>
            </div>

            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Write WhatsApp message here..."
              className="w-full p-4 bg-slate-50 focus:bg-white text-slate-800 text-sm font-medium rounded-xl border border-slate-200 focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/15 outline-none transition-all resize-none shadow-inner leading-relaxed"
            />
          </div>

          {/* ── STEP 4: SEND CTA BUTTON ── */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <FaWhatsapp className="text-emerald-600 text-sm shrink-0" />
              <span>
                Sending to: <strong className="text-slate-900">{recipientMode === 'DIRECT' ? (directName || directPhone || 'Direct Phone') : currentPatientName}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={handleSendPersonalMessage}
              disabled={isSending || (!selectedPatient && !directPhone) || !messageText.trim()}
              className="px-8 py-3 bg-clinicPrimary hover:bg-clinicPrimary-dark disabled:opacity-40 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              {isSending ? (
                <>
                  <FaSyncAlt size={14} className="animate-spin" />
                  <span>Sending via WhatsApp...</span>
                </>
              ) : (
                <>
                  <FaPaperPlane size={13} />
                  <span>Send WhatsApp Message</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════════════
          MODE 2: GROUP BROADCAST (BULK WHATSAPP)
      ══════════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'BROADCAST' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-clinicPrimary-light text-clinicPrimary flex items-center justify-center text-lg font-bold">
              <FaBullhorn />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Send Bulk WhatsApp Broadcast
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Broadcast an announcement or alert to all registered patients at once.
              </p>
            </div>
          </div>

          {/* Success Banner */}
          {broadcastSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-emerald-600 text-base" />
                <span>{broadcastSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastSuccess(null)}
                className="text-emerald-600 hover:text-emerald-900 p-1 cursor-pointer"
              >
                <FaTimes size={13} />
              </button>
            </div>
          )}

          {/* Step 1: Select Recipients */}
          <div className="space-y-3">
            <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-clinicPrimary text-white flex items-center justify-center text-xs font-black">
                1
              </span>
              <span>Target Audience:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setBroadcastTarget('ALL')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  broadcastTarget === 'ALL'
                    ? 'bg-clinicPrimary-light border-clinicPrimary ring-2 ring-clinicPrimary/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-extrabold text-sm text-slate-900">All Registered Patients</div>
                  <div className="text-xs text-slate-500">Sends to all {patients.length} active patients in database</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-clinicPrimary/15 text-clinicPrimary-dark">
                  {patients.length} Patients
                </span>
              </div>

              <div
                onClick={() => setBroadcastTarget('SELECTED')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  broadcastTarget === 'SELECTED'
                    ? 'bg-clinicPrimary-light border-clinicPrimary ring-2 ring-clinicPrimary/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-extrabold text-sm text-slate-900">Pick Specific Patients</div>
                  <div className="text-xs text-slate-500">Choose custom recipients using checkboxes</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-teal-100 text-teal-800">
                  {selectedPatientIds.size} Selected
                </span>
              </div>
            </div>

            {/* Checkbox list when specific patients selected */}
            {broadcastTarget === 'SELECTED' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-700">
                    Selected Patients: {selectedPatientIds.size} of {patients.length}
                  </span>
                  <button
                    type="button"
                    onClick={selectAllPatients}
                    className="text-xs font-extrabold text-clinicPrimary hover:underline cursor-pointer"
                  >
                    {selectedPatientIds.size === patients.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-52 overflow-y-auto divide-y divide-slate-200/70 pr-1">
                  {patients.map((p) => {
                    const isChecked = selectedPatientIds.has(p.id);
                    const pFullName = getPatientFullName(p);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center justify-between p-2.5 hover:bg-white rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePatientSelection(p.id)}
                            className="rounded text-clinicPrimary focus:ring-clinicPrimary"
                          />
                          <div>
                            <div className="font-extrabold text-xs text-slate-900">{pFullName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {p.phone ? formatPhoneDisplay(p.phone) : 'No phone linked'}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-slate-400">MRN #{p.id}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Category */}
          <div className="space-y-3">
            <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-clinicPrimary text-white flex items-center justify-center text-xs font-black">
                2
              </span>
              <span>Broadcast Category:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CLINIC_CATEGORIES.map((cat) => {
                const isSelected = broadcastCategory.id === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setBroadcastCategory(cat);
                      setBroadcastMessage(cat.template('{name}'));
                    }}
                    className={`h-11 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 truncate cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-clinicPrimary-light border-clinicPrimary text-slate-900 ring-2 ring-clinicPrimary/20 font-extrabold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={cat.colorClass} />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Message Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-clinicPrimary text-white flex items-center justify-center text-xs font-black">
                3
              </span>
              <span>Broadcast Message:</span>
            </label>
            <textarea
              rows={4}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Write broadcast message... Note: {name} will be automatically replaced with each patient's actual name."
              className="w-full p-4 bg-slate-50 focus:bg-white text-slate-800 text-sm font-medium rounded-xl border border-slate-200 focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/15 outline-none transition-all resize-none shadow-inner"
            />
            <p className="text-[11px] text-slate-400">
              💡 Tip: Use <strong className="text-slate-600">&#123;name&#125;</strong> in your text to automatically insert the recipient's name.
            </p>
          </div>

          {/* Broadcast Progress Bar */}
          {isSendingBroadcast && broadcastProgress && (
            <div className="p-4 bg-clinicPrimary-light border border-clinicPrimary/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-clinicPrimary-dark">
                <span>Dispatching WhatsApp Messages...</span>
                <span>{broadcastProgress.current} / {broadcastProgress.total}</span>
              </div>
              <div className="w-full bg-teal-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-clinicPrimary h-2.5 transition-all duration-300 rounded-full"
                  style={{ width: `${(broadcastProgress.current / broadcastProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Broadcast Send Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={isSendingBroadcast || !broadcastMessage.trim()}
              className="px-8 py-3 bg-clinicPrimary hover:bg-clinicPrimary-dark disabled:opacity-40 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <FaBullhorn />
              <span>
                {broadcastTarget === 'ALL'
                  ? `Send Broadcast to All (${patients.length})`
                  : `Send Broadcast to (${selectedPatientIds.size}) Patients`}
              </span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};

export default AnnouncementsHub;
