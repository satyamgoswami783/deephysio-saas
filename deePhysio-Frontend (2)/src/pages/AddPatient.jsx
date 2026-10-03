import React, { useState, useEffect } from 'react';
import {
  FaPhone, FaMapMarkerAlt, FaShieldAlt,
  FaArrowLeft, FaHeartbeat
} from 'react-icons/fa';
import PatientIcon from '../components/ui/PatientIcon';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import MedicalHistoryIcon from '../components/ui/MedicalHistoryIcon';
import { useNavigate, useParams } from 'react-router-dom';
import Toast from '../components/ui/Toast';
import { fetchApi } from '../config/api';

const AddPatient = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const role = sessionStorage.getItem('deephysio_role') || 'admin';
  const isReceptionist = role === 'receptionist';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    patientType: 'Normal',
    behaviour: 'green',
    therapistId: null,
    medicalHistory: {
      existingConditions: '',
      allergies: '',
      surgeries: '',
      chronicDiseases: '',
      longTermNotes: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (id) {
      const fetchPatient = async () => {
        console.log(`API CALL TRIGGERED: GET /api/patients/${id}`);
        try {
          const response = await fetchApi(`/patients/${id}`);
          if (!response) return; // intercepted
          const resData = await response.json();
          if (resData.success) {
            const existing = resData.data;
            setFormData({
              firstName: existing.firstName || '',
              lastName: existing.lastName || '',
              dob: existing.dateOfBirth ? new Date(existing.dateOfBirth).toISOString().split('T')[0] : '',
              gender: existing.gender ? (existing.gender.charAt(0).toUpperCase() + existing.gender.slice(1)) : 'Male',
              phone: existing.phone || '',
              email: existing.email || '',
              address: existing.address || '',
              patientType: existing.patientType || 'Normal',
              behaviour: existing.behaviour || 'green',
              therapistId: existing.therapistId || null,
              medicalHistory: existing.medicalHistory || {
                existingConditions: '',
                allergies: '',
                surgeries: '',
                chronicDiseases: '',
                longTermNotes: ''
              },
              emergencyContact: (existing.emergencyContacts && existing.emergencyContacts.length > 0) ? {
                name: existing.emergencyContacts[0].name || '',
                phone: existing.emergencyContacts[0].phone || '',
                relation: existing.emergencyContacts[0].relation || ''
              } : {
                name: '',
                phone: '',
                relation: ''
              }
            });
          } else {
            setToast({ message: resData.message || 'Failed to fetch patient', type: 'error' });
          }
        } catch (error) {
          setToast({ message: error.message, type: 'error' });
        }
      };

      fetchPatient();
    }
  }, [id]);

  const BEHAVIOUR_OPTIONS = [
    { value: 'red', label: 'Red (High Risk)', colorClass: 'bg-rose-500 shadow-rose-500/30' },
    { value: 'orange', label: 'Orange (Moderate Risk)', colorClass: 'bg-amber-500 shadow-amber-500/30' },
    { value: 'yellow', label: 'Yellow (Caution)', colorClass: 'bg-yellow-400 shadow-yellow-400/30' },
    { value: 'green', label: 'Green (Low Risk)', colorClass: 'bg-emerald-500 shadow-emerald-500/30' }
  ];

  // Email is optional. If entered, validate basic email format.
  const isValidEmail = (email) => {
    if (!email || !email.trim()) return true;
    const value = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('emergency.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [field]: value }
      }));
    } else if (name.includes('medical.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        medicalHistory: { ...prev.medicalHistory, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (name === 'email') {
        if (errors.email) setErrors((p) => ({ ...p, email: null }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'email' && value) {
      if (!isValidEmail(value)) {
        setErrors((p) => ({ ...p, email: 'Invalid email format' }));
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // ── RIGOROUS FRONTEND VALIDATION ──
    const newErrors = {};
    
    // Name validation
    if (!formData.firstName || formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    if (!formData.lastName || formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    
    // Phone validation (matches backend Joi min 10, max 15)
    const phoneClean = formData.phone.replace(/\s+/g, '');
    if (!phoneClean || phoneClean.length < 10 || phoneClean.length > 15) {
      newErrors.phone = 'Phone must be between 10-15 digits';
    }

    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    }
    
    if (formData.email && formData.email.trim() !== '' && !isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({ message: '⚠️ Verification Failed: Please fix the errors highlighted in red.', type: 'error' });
      return; // ⛔ STOP: Prevent the 400 error in Network Tab
    }

    // Clear errors if all pass
    setErrors({});
    setIsSaving(true);

    const storedUser = sessionStorage.getItem('deephysio_user');
    let loggedInUser = null;
    try {
      loggedInUser = storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      loggedInUser = null;
    }
    const userRole = sessionStorage.getItem('deephysio_role');

    // Logic: Use existing ID if editing, or current user ID only if they are a therapist
    let assignedTherapistId = formData.therapistId;
    if (!assignedTherapistId && userRole === 'therapist' && loggedInUser?.id) {
      assignedTherapistId = Number(loggedInUser.id);
    }

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dob || null,
      gender: formData.gender.toLowerCase(),
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      patientType: formData.patientType,
      behaviour: formData.behaviour,
      therapistId: assignedTherapistId ? Number(assignedTherapistId) : null,
      emergencyContact: {
        name: formData.emergencyContact.name || '',
        phone: formData.emergencyContact.phone || '',
        relation: formData.emergencyContact.relation || ''
      }
    };

    try {
      const url = id ? `/patients/${id}` : `/patients`;
      const method = id ? 'PUT' : 'POST';

      console.log(`API CALL TRIGGERED: ${method} ${url}`, payload);

      const response = await fetchApi(url, {
        method,
        body: JSON.stringify(payload)
      });
      if (!response) return; // intercepted

      const resData = await response.json();

      if (resData.success) {
        const savedPatientId = Number(resData?.data?.id || id);

        // Persist medical history to dedicated table so it appears in Patient Profile -> History tab
        const medicalPayload = {
          existingConditions: formData.medicalHistory.existingConditions || '',
          allergies: formData.medicalHistory.allergies || '',
          chronicDiseases: formData.medicalHistory.chronicDiseases || '',
          surgeries: formData.medicalHistory.surgeries || '',
          longTermNotes: formData.medicalHistory.longTermNotes || ''
        };

        const hasMedicalData = Object.values(medicalPayload).some(
          (v) => typeof v === 'string' && v.trim().length > 0
        );

        if (!Number.isNaN(savedPatientId) && savedPatientId > 0 && hasMedicalData) {
          try {
            const historyRes = await fetchApi(`/patients/${savedPatientId}/medical-history`, {
              method: 'PUT',
              body: JSON.stringify(medicalPayload)
            });
            if (!historyRes) {
              setToast({ message: 'Patient saved. Medical history sync pending.', type: 'warning' });
            } else {
              const historyData = await historyRes.json();
              if (!historyData.success) {
                setToast({ message: historyData.message || 'Patient saved. Medical history sync pending.', type: 'warning' });
              }
            }
          } catch (historyError) {
            setToast({ message: 'Patient saved. Medical history sync pending.', type: 'warning' });
          }
        }

        setToast({ message: id ? 'Patient profile updated successfully!' : 'Patient registered successfully!', type: 'success' });
        setIsSaving(false);
        setFormData({
          firstName: '', lastName: '', dob: '', gender: 'Male', phone: '', email: '',
          address: '', patientType: 'Normal', behaviour: 'green',
          medicalHistory: { existingConditions: '', allergies: '', surgeries: '', chronicDiseases: '', longTermNotes: '' },
          emergencyContact: { name: '', phone: '', relation: '' }
        });
        navigate('/patients');
      } else {
        setIsSaving(false);
        let errorMsg = resData.message || 'Failed to save patient';
        const lowerMsg = errorMsg.toLowerCase();
        const fieldErrors = {};

        if (lowerMsg.includes('phone') || lowerMsg.includes('number already exists')) {
          fieldErrors.phone = errorMsg;
        }
        if (lowerMsg.includes('email')) {
          fieldErrors.email = errorMsg;
        }
        if (lowerMsg.includes('date') || lowerMsg.includes('birth') || lowerMsg.includes('dob')) {
          fieldErrors.dob = errorMsg;
        }

        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }
        setToast({ message: errorMsg, type: 'error' });
      }
    } catch (error) {
      setIsSaving(false);
      setToast({ message: error.message, type: 'error' });
    }
  };

  const calculateProgress = () => {
    let completed = 0;
    let total = 6;
    if (formData.firstName) completed++;
    if (formData.lastName) completed++;
    if (formData.phone) completed++;
    if (formData.address) completed++;
    if (formData.emergencyContact.name) completed++;
    if (formData.emergencyContact.phone) completed++;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f0fafb] to-slate-100 flex flex-col font-sans">

      <header className="sticky top-0 z-20 bg-gradient-to-r from-[#2EA7B8] to-[#1a8fa0] shadow-md shadow-[#2EA7B8]/20">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate('/patients')}
            className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 border border-white/20 rounded-lg transition-all"
          >
            <FaArrowLeft size={11} />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-white leading-none">{id ? "Edit Patient Profile" : "New Patient Registration"}</h1>
            <p className="text-[9px] font-semibold text-white/60 uppercase tracking-widest mt-0.5">Clinic Management System</p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest leading-none">Profile Completion</p>
              <div className="w-24 h-1.5 bg-black/10 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-black text-white">{calculateProgress()}%</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-5 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <div className="space-y-5">

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-center">
              <div className="p-4 flex gap-4 bg-slate-50/50 justify-center">
                <label className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.patientType === 'Normal' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white'}`}>
                  <input type="radio" name="patientType" value="Normal" className="hidden" checked={formData.patientType === 'Normal'} onChange={handleChange} />
                  <span className="font-black text-[11px] uppercase tracking-wider">Normal Patient</span>
                </label>
                <label className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.patientType === 'Emergency' ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-white'}`}>
                  <input type="radio" name="patientType" value="Emergency" className="hidden" checked={formData.patientType === 'Emergency'} onChange={handleChange} />
                  <span className="font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5"><FaShieldAlt /> Emergency Patient</span>
                </label>
              </div>
              {formData.patientType === 'Emergency' && (
                <div className="bg-rose-500 text-white text-[10px] font-bold py-2 px-4 flex items-center justify-center uppercase tracking-widest animate-pulse">
                  ⚠️ EMERGENCY PATIENT: Ensure critical details & contact are verified
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#2EA7B8]/10 flex items-center justify-center">
                  <PatientIcon size={24} className="text-[#2EA7B8]" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Personal Details</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${errors.firstName ? 'text-rose-500' : 'text-slate-400'}`}>First Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text" name="firstName"
                      className={`w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm transition-all font-medium outline-none ${
                        errors.firstName ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/10' : 'border-slate-200 focus:border-[#2EA7B8] focus:ring-2 focus:ring-[#2EA7B8]/10'
                      }`}
                      value={formData.firstName} onChange={(e) => { handleChange(e); if(errors.firstName) setErrors(p=>({...p, firstName: null})); }} placeholder="John"
                    />
                    {errors.firstName && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter ml-1">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${errors.lastName ? 'text-rose-500' : 'text-slate-400'}`}>Last Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text" name="lastName"
                      className={`w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm transition-all font-medium outline-none ${
                        errors.lastName ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/10' : 'border-slate-200 focus:border-[#2EA7B8] focus:ring-2 focus:ring-[#2EA7B8]/10'
                      }`}
                      value={formData.lastName} onChange={(e) => { handleChange(e); if(errors.lastName) setErrors(p=>({...p, lastName: null})); }} placeholder="Wilson"
                    />
                    {errors.lastName && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter ml-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${errors.dob ? 'text-rose-500' : 'text-slate-400'}`}>
                      Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date" name="dob"
                      className={`w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm text-slate-700 outline-none transition-all ${
                        errors.dob
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/10'
                          : 'border-slate-200 focus:border-[#2EA7B8] focus:ring-2 focus:ring-[#2EA7B8]/10'
                      }`}
                      value={formData.dob}
                      onChange={(e) => { handleChange(e); if (errors.dob) setErrors((p) => ({ ...p, dob: null })); }}
                    />
                    {errors.dob && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter ml-1">{errors.dob}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Gender</label>
                    <select
                      name="gender"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-[#2EA7B8] focus:ring-2 focus:ring-[#2EA7B8]/10 transition-all"
                      value={formData.gender} onChange={handleChange}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Behaviour */}
            {!isReceptionist && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <FaHeartbeat size={11} className="text-indigo-500" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Patient Behaviour Flag</span>
                </div>
                <div className="p-4 flex items-center gap-4">
                  {BEHAVIOUR_OPTIONS.map((opt) => {
                    const isSelected = formData.behaviour === opt.value;
                    return (
                      <button
                        key={opt.value} type="button" title={opt.label} aria-label={opt.label}
                        onClick={() => setFormData(prev => ({ ...prev, behaviour: opt.value }))}
                        className={`w-10 h-10 rounded-full transition-all duration-300 flex-shrink-0 ${opt.colorClass} ${isSelected
                          ? 'ring-4 ring-offset-2 ring-[#2EA7B8]/20 scale-110 shadow-lg'
                          : 'opacity-40 hover:opacity-80 hover:scale-105'
                          }`}
                      />
                    );
                  })}
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-auto">
                    {BEHAVIOUR_OPTIONS.find(o => o.value === formData.behaviour)?.label || 'Normal'}
                  </span>
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FaPhone size={11} className="text-blue-500" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Contact Information</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${errors.phone ? 'text-rose-500' : 'text-slate-400'}`}>Phone Number <span className="text-rose-500">*</span></label>
                    <input
                      type="tel" name="phone"
                      className={`w-full h-10 px-3 bg-slate-50 border rounded-lg text-sm transition-all font-medium outline-none ${
                        errors.phone ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/10' : 'border-slate-200 focus:border-[#2EA7B8] focus:ring-2 focus:ring-[#2EA7B8]/10'
                      }`}
                      value={formData.phone} onChange={(e) => { handleChange(e); if(errors.phone) setErrors(p=>({...p, phone: null})); }} placeholder="+44 7000 000000"
                    />
                    {errors.phone && <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tighter ml-1">{errors.phone}</p>}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className={`text-[9px] font-bold uppercase tracking-widest ${errors.email ? 'text-rose-500' : 'text-slate-400'}`}>Email Address</label>
                    <input
                      type="email" name="email"
                      className={`w-full h-10 px-3 bg-slate-50 border ${errors.email ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 focus:border-[#2EA7B8] focus:ring-2 focus:ring-[#2EA7B8]/10'} rounded-lg text-sm text-slate-700 outline-none transition-all font-medium`}
                      value={formData.email} 
                      onChange={(e) => {
                        handleChange(e);
                        if (errors.email) setErrors(prev => ({ ...prev, email: null }));
                      }} 
                      placeholder="patient@email.com"
                    />
                    {errors.email && <p className="text-[9px] font-bold text-rose-500 tracking-tight ml-1">{errors.email}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FaMapMarkerAlt size={8} className="text-slate-300" /> Address
                  </label>
                  <textarea
                    name="address"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-[#2EA7B8] focus:ring-2 focus:ring-[#2EA7B8]/10 transition-all resize-none min-h-[60px]"
                    value={formData.address} onChange={handleChange} placeholder="Street, City, Postcode"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">

            {/* Emergency Contact */}
            <div className="bg-white rounded-xl border-2 border-rose-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-gradient-to-r from-rose-50 to-white border-b border-rose-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center shadow-sm shadow-rose-200">
                  <FaShieldAlt size={11} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[11px] font-bold text-rose-600 uppercase tracking-widest leading-none">Emergency Contact</h3>
                  <p className="text-[8px] font-semibold text-rose-400 uppercase tracking-widest mt-1">
                    {formData.patientType === 'Emergency' ? '⚠️ REQUIRED FOR EMERGENCY PATIENT' : 'Required for high risk patients'}
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-4 bg-rose-50/10">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Contact Name</label>
                  <input
                    type="text" name="emergency.name"
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all bg-white font-medium"
                    value={formData.emergencyContact.name} onChange={handleChange} placeholder="E.g. Jane Wilson"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Phone</label>
                    <input
                      type="tel" name="emergency.phone"
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all bg-white font-medium"
                      value={formData.emergencyContact.phone} onChange={handleChange} placeholder="Emergency number"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Relationship</label>
                    <input
                      type="text" name="emergency.relation"
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 transition-all bg-white font-medium"
                      value={formData.emergencyContact.relation} onChange={handleChange} placeholder="E.g. Spouse, Parent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Notes */}
            {!isReceptionist && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                    <MedicalHistoryIcon size={18} className="text-teal-500" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Medical History</span>
                  <span className="ml-auto text-[9px] font-medium text-slate-400">Optional</span>
                </div>
                <div className="p-4 space-y-4 bg-teal-50/10">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Existing Conditions</label>
                    <input
                      type="text" name="medical.existingConditions"
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition-all bg-white font-medium"
                      value={formData.medicalHistory.existingConditions} onChange={handleChange} placeholder="e.g. Hypertension, Diabetes"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Allergies</label>
                      <input
                        type="text" name="medical.allergies"
                        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition-all bg-white font-medium"
                        value={formData.medicalHistory.allergies} onChange={handleChange} placeholder="e.g. Penicillin, Latex"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Chronic Diseases</label>
                      <input
                        type="text" name="medical.chronicDiseases"
                        className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition-all bg-white font-medium"
                        value={formData.medicalHistory.chronicDiseases} onChange={handleChange} placeholder="e.g. Asthma, Arthritis"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Previous Surgeries</label>
                    <input
                      type="text" name="medical.surgeries"
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition-all bg-white font-medium"
                      value={formData.medicalHistory.surgeries} onChange={handleChange} placeholder="e.g. ACL Recon 2021"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">Important Clinicial Notes</label>
                    <textarea
                      name="medical.longTermNotes"
                      className="w-full p-3 bg-amber-50/30 border border-slate-200 rounded-lg outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition-all text-sm font-medium resize-none placeholder:text-slate-300 text-slate-700 min-h-[60px]"
                      placeholder="Add long-term critical history points..."
                      value={formData.medicalHistory.longTermNotes} onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Summary Card */}
            {(formData.firstName || formData.lastName) && (
              <div className="bg-gradient-to-br from-[#2EA7B8] to-[#1a8fa0] rounded-xl p-4 text-white shadow-lg shadow-[#2EA7B8]/20 animate-fadeIn fade-in">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/60 mb-2">Patient Profile Summary</p>
                <div className="space-y-1.5">
                  <div className="text-lg font-black">{formData.firstName} {formData.lastName}</div>
                  {formData.phone && (
                    <div className="text-sm text-white/90 flex items-center gap-2">
                      {formData.phone}
                    </div>
                  )}
                  {formData.emergencyContact.name && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-1">Emergency Contact</p>
                      <div className="text-xs font-bold">{formData.emergencyContact.name} - {formData.emergencyContact.relation}</div>
                      <div className="text-xs text-white/80">{formData.emergencyContact.phone}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="mt-6 flex items-center justify-between bg-white/80 backdrop-blur rounded-xl border border-slate-200 shadow-sm px-5 py-3.5">
          <p className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Active</p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => navigate('/patients')}
              className="flex-1 sm:flex-none h-10 px-6 bg-white text-slate-600 border border-slate-200 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-all active:scale-95"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.firstName || !formData.lastName || !formData.phone || !formData.dob}
              className={`flex-1 sm:flex-none h-10 px-8 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                'bg-gradient-to-r from-[#2EA7B8] to-[#1a8fa0] text-white hover:shadow-lg hover:shadow-[#2EA7B8]/30'
              }`}
            >
              {isSaving ? 'Verification...' : (id ? 'Save Changes' : 'Register Patient')}
            </button>
          </div>
        </div>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AddPatient;
