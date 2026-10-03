import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FaCalendarAlt, FaClock, FaCheckCircle, FaArrowLeft, FaChevronDown,
  FaUserMd, FaStethoscope, FaDoorOpen
} from 'react-icons/fa';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import PatientIcon from '../components/ui/PatientIcon';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';
import { readAllowedModules } from '../config/modules';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { showToast } = useToast();

  const userRole = sessionStorage.getItem('deephysio_role');
  const storedUser = sessionStorage.getItem('deephysio_user');
  let currentUser = null;
  try {
    currentUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    currentUser = null;
  }
  const allowedModules = readAllowedModules(currentUser, userRole);
  const hasSettingsAccess = allowedModules.includes('Settings');

  const isTherapist = userRole === 'therapist';
  const isReceptionist = userRole === 'receptionist';
  const loggedUser = currentUser || { id: 'T-101', name: 'Therapist' };

  const [formData, setFormData] = useState({
    patient: '',
    patientId: searchParams.get('patientId') || '',
    service: '',
    practitioner: '',
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
    room: '',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const [filteredPractitioners, setFilteredPractitioners] = useState([]);

  const [rooms, setRooms] = useState(['Room 1 (Consult)', 'Room 2 (Rehab)', 'Room 3 (Assessment)', 'Studio A', 'Main Gym']);

  const [isLoading, setIsLoading] = useState(true);
  const [allPatients, setAllPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [practitioners, setPractitioners] = useState([]);
  const [bookedSlots, setBookedSlots] = useState(new Set());

  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchedRef = useRef(null);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [pRes, sRes, uRes, settingsRes] = await Promise.all([
        fetchApi('/patients'),
        fetchApi('/services'),
        fetchApi('/appointments/practitioners'),
        hasSettingsAccess ? fetchApi('/settings?keys=bookingRooms') : Promise.resolve(null)
      ]);

      if (pRes) {
        const pData = await pRes.json();
        if (pData.success) {
          const mapped = pData.data.map(p => ({
            id: p.id,
            name: `${p.firstName} ${p.lastName}`
          }));
          setAllPatients(mapped);
          
          // --- Prioritize selection from Waitlist State or Search Params ---
          const pid = location.state?.patientId || searchParams.get('patientId');
          if (pid) {
            const found = mapped.find(x => x.id.toString() === pid.toString());
            if (found) {
              setFormData(prev => ({ ...prev, patient: found.name, patientId: pid }));
              setPatientSearchTerm(found.name);
            }
          }
        }

      }

      if (sRes) {
        const sData = await sRes.json();
        if (sData.success) {
          setServices(sData.data.map(s => ({
            ...s,
            duration: `${s.duration} min`,
            price: `₹${Number(s.price).toFixed(2)}`
          })));
        }
      }

      if (uRes) {
        const uData = await uRes.json();
        if (uData.success) {
          setPractitioners(uData.data.filter(u => u.role === 'therapist'));
        }
      }

      if (settingsRes && settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.success) {
          const roomList = settingsData?.data?.bookingRooms;
          if (Array.isArray(roomList) && roomList.length > 0) {
            setRooms(roomList);
          }
        }
      }
    } catch (e) {
      showToast('Error syncing scheduler data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Initial Data Load - Run only ONCE on mount
  useEffect(() => {
    loadInitialData();
  }, []); // Empty dependency array means it runs once on mount

  // 2. Pre-fill from Waitlist/Location State
  useEffect(() => {
    if (location.state?.waitlistId) {
      const { waitlistId, patientId, patientName, service, contactNumber, preferredDate, preferredTime } = location.state;
      
      const safePatientName = patientName || '';
      const safeService = service || '';

      // Find service ID match (if possible)
      let matchedServiceId = '';
      if (safeService) {
        // Simple string matching for service name
        const foundService = services.find(s => 
          s.name.toLowerCase().includes(safeService.toLowerCase()) || 
          safeService.toLowerCase().includes(s.name.toLowerCase())
        );
        if (foundService) matchedServiceId = foundService.id;
      }

      // Prefill patient data
      setFormData(prev => ({
        ...prev,
        patient: safePatientName,
        patientId: patientId || '', 
        service: matchedServiceId || prev.service,
        date: preferredDate ? new Date(preferredDate).toISOString().split('T')[0] : prev.date,
        time: preferredTime || prev.time,
        notes: `Waitlist request for: ${safeService}`
      }));
      
      if (safePatientName) setPatientSearchTerm(safePatientName);
      
      showToast(`Waitlist data loaded for ${safePatientName}`, 'success');
    }
  }, [searchParams, location.state, services]); // Added services to dependency for matching

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsPatientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (formData.service && practitioners.length > 0) {
      // Simplified: showing all therapists for now
      setFilteredPractitioners(practitioners);

      if (isTherapist && loggedUser?.id) {
        const myPractitioner = practitioners.find(p => p.id === loggedUser.id || String(p.id) === String(loggedUser.id));
        if (myPractitioner) {
           setFormData(prev => ({ ...prev, practitioner: myPractitioner.id }));
        }
      }
    } else {
      setFilteredPractitioners(practitioners);
    }
  }, [formData.service, practitioners, isTherapist, loggedUser?.id]);

  const dropdownSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 21; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 21 && m > 30) break;
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  }, []);

  const quickSelectSlots = useMemo(() => {
    const slots = [];
    let currentMins = 8 * 60; // 08:00
    const endMins = (21 * 60) + 30; // 21:30
    while (currentMins <= endMins) {
      const h = Math.floor(currentMins / 60);
      const m = currentMins % 60;
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      currentMins += 30;
    }
    return slots;
  }, []);

  const normalizeTimeLabel = (isoOrTime) => {
    if (!isoOrTime) return '';
    if (/^\d{2}:\d{2}$/.test(isoOrTime)) return isoOrTime;
    const parsed = new Date(isoOrTime);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toTimeString().slice(0, 5);
  };

  useEffect(() => {
    const loadBookedSlots = async () => {
      // Need both date and practitioner to determine blocked slots
      if (!formData.date || !formData.practitioner) {
        setBookedSlots(new Set());
        return;
      }

      try {
        const res = await fetchApi(
          `/appointments?date=${encodeURIComponent(formData.date)}&therapistId=${encodeURIComponent(formData.practitioner)}`
        );
        if (!res || !res.ok) {
          setBookedSlots(new Set());
          return;
        }

        const payload = await res.json();
        if (!payload.success || !Array.isArray(payload.data)) {
          setBookedSlots(new Set());
          return;
        }

        const occupiedSlots = [];
        payload.data
          .filter((appt) => String(appt?.status || '').toLowerCase() !== 'cancelled')
          .forEach((appt) => {
             const startStr = normalizeTimeLabel(appt.startTime || appt.appointmentDate);
             const endStr = normalizeTimeLabel(appt.endTime);
             
             if (startStr && endStr) {
               const [sh, sm] = startStr.split(':').map(Number);
               const [eh, em] = endStr.split(':').map(Number);
               let currentMins = sh * 60 + sm;
               const endMins = eh * 60 + em;
               
               while (currentMins < endMins) {
                 const h = Math.floor(currentMins / 60);
                 const m = currentMins % 60;
                 occupiedSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                 currentMins += 30;
               }
             } else if (startStr) {
               occupiedSlots.push(startStr);
             }
          });

        setBookedSlots(new Set(occupiedSlots));
      } catch (e) {
        // Non-blocking for UX; fallback to manual server-side clash validation on save
        setBookedSlots(new Set());
      }
    };

    loadBookedSlots();
  }, [formData.date, formData.practitioner]);

  useEffect(() => {
    // If selection becomes unavailable after changing date/practitioner, clear it.
    if (formData.time && bookedSlots.has(formData.time)) {
      setFormData((prev) => ({ ...prev, time: '' }));
      showToast('Selected slot is already booked. Please choose another time.', 'warning');
    }
  }, [bookedSlots]);

  /* ── Time helpers for save ── */
  const to12Hour = (time24) => {
    if (!time24) return '';
    // Already in 12h format
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || '0', 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const addMinutes = (time12, mins) => {
    if (!time12) return '';
    const [time, ampm] = time12.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    const total = h * 60 + m + mins;
    let endH = Math.floor(total / 60) % 24;
    const endM = total % 60;
    const endAmpm = endH >= 12 ? 'PM' : 'AM';
    if (endH > 12) endH -= 12;
    if (endH === 0) endH = 12;
    return `${endH}:${endM.toString().padStart(2, '0')} ${endAmpm}`;
  };

  const handleSave = async () => {
    if (!formData.patient || !formData.service || !formData.practitioner || !formData.date || !formData.time || !formData.room) {
      showToast('Error: Please fill all required fields.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // Create valid ISO timestamp for appointmentDate
      const [h, m] = formData.time.split(':');
      const appointmentDate = new Date(formData.date);
      appointmentDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

      // Duration for endTime calculation
      const selectedService = services.find(s => s.id === formData.service);
      const durationMins = selectedService ? parseInt(selectedService.duration, 10) : 60;
      const endDate = new Date(appointmentDate.getTime() + durationMins * 60000);

      const payload = {
        patientId: parseInt(formData.patientId, 10),
        therapistId: parseInt(formData.practitioner, 10),
        appointmentDate: appointmentDate.toISOString(),
        serviceId: parseInt(formData.service, 10),
        room: formData.room,
        notes: formData.notes,
        startTime: appointmentDate.toISOString(),
        endTime: endDate.toISOString()
      };

      const isConversion = location.state?.waitlistId;
      const apiUrl = isConversion 
        ? `/waitlist/${location.state.waitlistId}/convert` 
        : '/appointments';

      const res = await fetchApi(apiUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      });


      if (res) {
        const data = await res.json();
        if (data.success) {
          showToast('Appointment booked successfully.', 'success');
          navigate('/appointments');
        } else {
          showToast(data.message || 'Booking failed.', 'error');
        }
      }
    } catch (e) {
      showToast('Error communicating with server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f0fafb] to-slate-100 flex flex-col font-sans">
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm animate-fade-in">
           <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-clinicPrimary/20 border-t-clinicPrimary rounded-full animate-spin"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Syncing Scheduler...</p>
           </div>
        </div>
      )}

      {/* ─── HEADER (sticky, teal) ─── */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-[#2EA7B8] to-[#1a8fa0] shadow-md shadow-[#2EA7B8]/20">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 border border-white/20 rounded-lg transition-all"
          >
            <FaArrowLeft size={11} />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-white leading-none">Book Appointment</h1>
            <p className="text-[9px] font-semibold text-white/60 uppercase tracking-widest mt-0.5">Clinic Management System</p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            {[
              { label: 'Patient', done: !!formData.patient },
              { label: 'Service', done: !!formData.service },
              { label: 'Practitioner', done: !!formData.practitioner },
              { label: 'Schedule', done: !!(formData.date && formData.time) },
            ].map(step => (
              <div key={step.label} className="flex items-center gap-1.5">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black border-2 transition-all ${step.done ? 'bg-white border-white text-[#2EA7B8]' : 'border-white/40 text-white/40'}`}>
                  {step.done ? '✓' : '·'}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wide ${step.done ? 'text-white' : 'text-white/50'}`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </header>



      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-5 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Patient Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm relative z-10">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#2EA7B8]/10 flex items-center justify-center">
                    <PatientIcon size={18} className="text-[#2EA7B8]" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Patient</span>
                </div>
                <button
                  onClick={() => navigate('/patients/add')}
                  className="text-[9px] font-bold text-[#2EA7B8] hover:text-[#1a8fa0] uppercase tracking-widest px-2.5 py-1 bg-[#2EA7B8]/10 rounded-md hover:bg-[#2EA7B8]/20 transition-all"
                >
                  + New Patient
                </button>
              </div>
              <div className="p-4">
                <div className="relative" ref={dropdownRef}>
                  <input
                    type="text"
                    className="w-full h-10 pl-4 pr-9 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-[#2EA7B8] focus:ring-2 focus:ring-[#2EA7B8]/10 transition-all font-medium placeholder:text-slate-400"
                    placeholder="Search patient by name..."
                    value={patientSearchTerm}
                    onChange={e => {
                      setPatientSearchTerm(e.target.value);
                      setIsPatientDropdownOpen(true);
                      if (formData.patientId) {
                        setFormData(prev => ({ ...prev, patientId: '', patient: '' }));
                      }
                    }}
                    onFocus={() => setIsPatientDropdownOpen(true)}
                  />
                  <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform duration-200 ${isPatientDropdownOpen ? 'rotate-180' : ''}`}>
                    <FaChevronDown size={10} />
                  </div>
                  
                  {isPatientDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg shadow-black/5 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                      {(() => {
                        const filtered = allPatients.filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()));
                        if (filtered.length === 0) {
                          return <div className="p-4 text-sm font-medium text-slate-400 text-center flex flex-col items-center justify-center gap-2"><PatientIcon size={24} className="text-slate-200" /> No patients found matching "{patientSearchTerm}"</div>;
                        }
                        return (
                          <div className="p-1">
                            {filtered.map(p => (
                              <div
                                key={p.id}
                                className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer rounded-lg flex flex-col mb-1 last:mb-0 group"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, patientId: p.id, patient: p.name }));
                                  setPatientSearchTerm(p.name);
                                  setIsPatientDropdownOpen(false);
                                }}
                              >
                                <span className="text-sm font-bold text-slate-700 group-hover:text-[#2EA7B8] transition-colors">{p.name}</span>
                                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 mt-0.5">{p.id}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Service Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                  <FaStethoscope size={11} className="text-purple-500" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Service</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {services.map(service => (
                    <div
                      key={service.id}
                      onClick={() => setFormData({ ...formData, service: service.id })}
                      className={`relative p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.service === service.id
                          ? 'border-[#2EA7B8] bg-gradient-to-br from-[#2EA7B8]/5 to-[#2EA7B8]/10 shadow-sm'
                          : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                        }`}
                    >
                      {formData.service === service.id && (
                        <FaCheckCircle className="absolute top-2.5 right-2.5 text-[#2EA7B8]" size={11} />
                      )}
                      <h4 className={`text-[11px] font-bold leading-tight pr-4 ${formData.service === service.id ? 'text-[#2EA7B8]' : 'text-slate-700'}`}>
                        {service.name}
                      </h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">{service.duration}</span>
                        <span className={`text-[12px] font-black ${formData.service === service.id ? 'text-[#2EA7B8]' : 'text-slate-700'}`}>{service.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <ClinicalNoteIcon size={18} className="text-amber-500" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Clinical Notes</span>
                <span className="ml-auto text-[9px] font-medium text-slate-400">Optional</span>
              </div>
              <div className="p-4">
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:border-[#2EA7B8] focus:ring-2 focus:ring-[#2EA7B8]/10 focus:bg-white transition-all text-sm font-medium resize-none placeholder:text-slate-300 text-slate-700"
                  placeholder={isReceptionist ? 'Add general notes for this appointment...' : 'Enter clinical requirements or patient-specific instructions for the therapist...'}
                />
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">

            {/* Practitioner Section */}
            {!isTherapist && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <FaUserMd size={11} className="text-emerald-500" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Practitioner</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-2.5">
                    {filteredPractitioners.length > 0 ? (
                      filteredPractitioners.map(p => (
                        <div
                          key={p.id}
                          onClick={() => setFormData({ ...formData, practitioner: p.id })}
                          className={`flex items-center gap-3.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${formData.practitioner === p.id
                              ? 'border-[#2EA7B8] bg-gradient-to-r from-[#2EA7B8]/5 to-transparent shadow-sm'
                              : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all ${formData.practitioner === p.id
                              ? 'bg-[#2EA7B8] text-white shadow-md shadow-[#2EA7B8]/30'
                              : 'bg-slate-100 text-slate-500'
                            }`}>
                            {p.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[12px] font-bold leading-none ${formData.practitioner === p.id ? 'text-slate-800' : 'text-slate-600'}`}>{p.name}</p>
                            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mt-1">{p.role}</p>
                          </div>
                          {formData.practitioner === p.id && (
                            <FaCheckCircle className="text-[#2EA7B8] shrink-0" size={14} />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                          <FaUserMd size={14} className="text-slate-300" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select a service first</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FaCalendarAlt size={11} className="text-blue-500" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Schedule Details</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FaCalendarAlt size={8} />
                      Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-[#2EA7B8] focus:ring-2 focus:ring-[#2EA7B8]/10 transition-all font-medium"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FaClock size={8} />
                      Time Slot
                    </label>
                    <select
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-[#2EA7B8] focus:ring-2 focus:ring-[#2EA7B8]/10 transition-all"
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                    >
                      <option value="">Select Time...</option>
                      {dropdownSlots.map((t) => {
                        const isBooked = bookedSlots.has(t);
                        return (
                          <option key={t} value={t} disabled={isBooked}>
                            {isBooked ? `${t} (Booked)` : t}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FaDoorOpen size={8} />
                      Room Number
                    </label>
                    <div className="relative">
                      <select
                        className="w-full h-10 pl-3 pr-9 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-[#2EA7B8] focus:ring-2 focus:ring-[#2EA7B8]/10 transition-all appearance-none"
                        value={formData.room}
                        onChange={e => setFormData({ ...formData, room: e.target.value })}
                      >
                        <option value="">Select Room...</option>
                        {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <FaChevronDown size={10} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Quick Select Slots</label>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {quickSelectSlots.map(time => (
                      (() => {
                        const isBooked = bookedSlots.has(time);
                        return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => !isBooked && setFormData({ ...formData, time })}
                        disabled={isBooked}
                        title={isBooked ? 'Already booked' : `Select ${time}`}
                        className={`h-10 rounded-lg text-xs font-bold transition-all border-2 flex items-center justify-center ${isBooked
                            ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-60'
                            : formData.time === time
                            ? 'bg-[#2EA7B8] text-white border-[#2EA7B8] shadow-md shadow-[#2EA7B8]/25 scale-[1.02]'
                            : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-[#2EA7B8]/40 hover:text-[#2EA7B8] hover:bg-[#2EA7B8]/5'
                          }`}
                      >
                        {time}
                      </button>
                        );
                      })()
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    Grey slots are already booked
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Card */}
            {(formData.patient || formData.service || formData.date) && (
              <div className="bg-gradient-to-br from-[#2EA7B8] to-[#1a8fa0] rounded-xl p-4 text-white shadow-lg shadow-[#2EA7B8]/20">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-2">Booking Summary</p>
                <div className="space-y-1.5">
                  {formData.patient && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70 text-[10px]">Patient</span>
                      <span className="font-bold text-[11px]">{formData.patient}</span>
                    </div>
                  )}
                  {formData.service && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-[10px]">Service</span>
                      <span className="font-bold text-[11px]">{services.find(s => s.id === formData.service)?.name}</span>
                    </div>
                  )}
                  {formData.date && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-[10px]">Date & Time</span>
                      <span className="font-bold text-[11px]">{formData.date}{formData.time ? ` · ${formData.time}` : ''}</span>
                    </div>
                  )}
                  {formData.room && (
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-[10px]">Room</span>
                      <span className="font-bold text-[11px]">{formData.room}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="mt-6 flex items-center justify-between bg-white/80 backdrop-blur rounded-xl border border-slate-200 shadow-sm px-4 sm:px-5 py-3 sm:py-3.5">
          <p className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finalize Clinical Entry</p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 sm:flex-none h-10 px-6 bg-white text-slate-600 border border-slate-200 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none h-10 px-8 bg-gradient-to-r from-[#2EA7B8] to-[#1a8fa0] text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-[#2EA7B8]/30 transition-all active:scale-95"
            >
              Book Appointment
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookAppointment;
