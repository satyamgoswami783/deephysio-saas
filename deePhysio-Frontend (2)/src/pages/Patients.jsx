import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';
import { FaUserPlus, FaSearch, FaUser, FaChevronLeft, FaChevronRight, FaCalendarAlt, FaIdCard, FaHistory, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import MedicalHistoryIcon from '../components/ui/MedicalHistoryIcon';
import PatientIcon from '../components/ui/PatientIcon';
import { usePermissions } from '../context/PermissionContext';

// Legacy mock data removed. All patients are now fetched from the backend.

const formatDOB = (dobString) => {
  if (!dobString) return 'N/A';
  const date = new Date(dobString);
  if (isNaN(date.getTime())) return dobString;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Patients = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileSearch, setMobileSearch] = useState('');
  const [dobSearch, setDobSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, patientId: null, patientName: '' });
  
  const location = useLocation();
  const [refreshKey, setRefreshKey] = useState(0);
  const fetchedRef = useRef(null);
  const { canAction } = usePermissions();

  const role = sessionStorage.getItem('deephysio_role');


  const isTherapist = role === 'therapist';
  const isReceptionist = role === 'receptionist';
  const isBilling = role === 'billing';
  const storedUser = sessionStorage.getItem('deephysio_user');
  let loggedInUser = null;
  try {
    loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    loggedInUser = null;
  }

  useEffect(() => {
    const triggerKey = `${location.key}-${refreshKey}`;
    if (fetchedRef.current === triggerKey) return;
    fetchedRef.current = triggerKey;

    const fetchPatients = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetchApi('/patients');
        if (!response) return; // 401 handled by interceptor
        const resData = await response.json();

        if (resData.success) {
          const mappedPatients = resData.data.map(p => ({
            ...p,
            id: p.id,
            name: `${p.firstName || p.first_name} ${p.lastName || p.last_name}`,
            dob: p.dateOfBirth || p.date_of_birth,
            mobile: p.phone,
            therapistId: p.therapistId || p.therapist_id,
            status: p.isActive === false ? 'Inactive' : 'Active'
          }));
          setPatients(mappedPatients);
        } else {
          showToast(resData.message || 'Failed to fetch patients', 'error');
        }
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [showToast, location.key, refreshKey]);

  const handleDeletePatient = (patientId, patientName) => {
    setDeleteModal({ isOpen: true, patientId, patientName });
  };

  const confirmDelete = async () => {
    const { patientId, patientName } = deleteModal;
    if (!patientId) return;

    try {
      const response = await fetchApi(`/patients/${patientId}`, { method: 'DELETE' });
      if (!response) return; // intercepted
      
      const resData = await response.json();

      if (resData.success) {
        // Filter patients state immediately
        const updatedPatients = patients.filter(p => p.id !== patientId);
        setPatients(updatedPatients);
        setRefreshKey(prev => prev + 1);
        setDeleteModal({ isOpen: false, patientId: null, patientName: '' });
        showToast(`${patientName} has been permanently deleted.`);
      } else {
        showToast(resData.message || 'Failed to delete patient', 'error');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const filteredPatients = patients.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(searchLower) || false;
    const idMatch = String(p.id).toLowerCase().includes(searchLower);
    const matchesSearch = nameMatch || idMatch;

    const matchesMobile = !mobileSearch || (p.mobile && p.mobile.includes(mobileSearch));
    const matchesDob = !dobSearch || (p.dob === dobSearch);

    return matchesSearch && matchesMobile && matchesDob;
  });

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const currentPatients = filteredPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFB] p-4 sm:p-6 lg:p-8 font-sans">

      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-500 border border-teal-100 shadow-sm">
            <MedicalHistoryIcon size={24} />
          </div>
          <div>
            <h1 className="text-[22px] md:text-3xl font-bold text-slate-900 tracking-tight">Patient History</h1>
            <p className="text-[12px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Manage clinical records and access profiles</p>
          </div>
        </div>
        {!isBilling && (
          <button
            onClick={() => canAction('patients.create') && navigate('/patients/add')}
            disabled={!canAction('patients.create')}
            title={!canAction('patients.create') ? 'No access' : ''}
            className="bg-clinicPrimary disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-sm hover:bg-clinicPrimary/90 active:scale-95 transition-all flex items-center gap-2 disabled:cursor-not-allowed"
          >
            <FaUserPlus size={14} /> New Patient
          </button>
        )}
      </div>

      {/* ─── FILTERS ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 mb-6">
        <div className="relative w-full md:flex-1">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search patients by name or ID..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-[14px] text-slate-800 focus:outline-none focus:border-clinicPrimary focus:ring-1 focus:ring-clinicPrimary/20 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="13" width="13" xmlns="http://www.w3.org/2000/svg"><path d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z"></path></svg>
            </span>
            <input
              type="text"
              placeholder="Mobile Number..."
              className="w-full sm:w-44 pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-clinicPrimary focus:ring-1 focus:ring-clinicPrimary/20 transition-all font-medium"
              value={mobileSearch}
              onChange={(e) => { setMobileSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="relative w-full sm:w-auto">
            <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
            <input
              type="date"
              className="w-full sm:w-44 pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] text-slate-800 focus:outline-none focus:border-clinicPrimary focus:ring-1 focus:ring-clinicPrimary/20 transition-all font-medium cursor-pointer"
              value={dobSearch}
              onChange={(e) => { setDobSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* ─── PATIENT LIST ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">

        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-12 gap-x-4 gap-y-2 px-4 sm:px-6 py-4 bg-slate-50/50 border-b border-slate-100 items-center">
          <div className="col-span-4 lg:col-span-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Patient Details</div>
          <div className="hidden lg:block lg:col-span-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">DOB</div>
          <div className="hidden lg:block lg:col-span-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">Mobile</div>
          <div className="col-span-3 lg:col-span-1 text-[11px] font-black text-slate-400 uppercase tracking-widest sm:text-center lg:text-left">Status</div>
          <div className="col-span-2 lg:col-span-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">Last Visit</div>
          <div className="col-span-3 lg:col-span-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Target Actions</div>
        </div>

        {/* List Body */}
        <div className="divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-clinicPrimary/30 border-t-clinicPrimary rounded-full animate-spin mb-4"></div>
              <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">Loading Patients...</p>
            </div>
          ) : currentPatients.length > 0 ? currentPatients.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(isBilling ? `/billing/patient/${p.id}` : `/patients/profile/${p.id}`)}
              className={`grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-3 px-4 sm:px-6 py-4 sm:py-5 items-center hover:bg-slate-50/50 transition-colors group cursor-pointer ${p.patientType === 'Emergency' ? 'border-l-4 border-l-rose-500 bg-rose-50/10 hover:bg-rose-50/30' : ''
                }`}
            >

              {/* Patient Detail */}
              <div className="sm:col-span-4 lg:col-span-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-clinicPrimary/10 text-clinicPrimary flex items-center justify-center font-bold text-[13px] uppercase border border-clinicPrimary/20 shrink-0">
                  <PatientIcon size={20} />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-[14px] font-bold transition-colors leading-tight truncate ${p.patientType === 'Emergency' ? 'text-rose-600 group-hover:text-rose-700' : 'text-slate-800 group-hover:text-clinicPrimary'}`}>{p.name}</h3>
                    {p.patientType === 'Emergency' && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500 text-white uppercase tracking-wider shrink-0 shadow-sm animate-pulse">
                        Emergency
                      </span>
                    )}
                    {p.behaviour && p.patientType !== 'Emergency' && (
                      <div
                        title={p.behaviour.charAt(0).toUpperCase() + p.behaviour.slice(1).toLowerCase()}
                        className={`w-2 h-2 rounded-full shadow-sm shrink-0 ${{
                          'red': 'bg-rose-500',
                          'orange': 'bg-amber-400',
                          'yellow': 'bg-orange-500',
                          'green': 'bg-emerald-500',
                          'aggressive': 'bg-rose-500',
                          'irregular': 'bg-amber-400',
                          'normal': 'bg-orange-500',
                          'cooperative': 'bg-emerald-500',
                        }[p.behaviour.toLowerCase()] || 'bg-slate-300'
                          }`}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <div className="flex items-center gap-1.5">
                      <FaIdCard className="text-slate-300" size={9} />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.id}</span>
                    </div>
                    {/* DOB and Mobile for mobile/tablet view only */}
                    <div className="flex items-center gap-1.5 lg:hidden">
                      <span className="text-[11px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{p.dob ? formatDOB(p.dob) : 'N/A'}</span>
                      <span className="text-[11px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{p.mobile || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DOB - Desktop only */}
              <div className="hidden lg:flex lg:col-span-2 items-center">
                <span className="text-[13px] font-semibold text-slate-600 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">{p.dob ? formatDOB(p.dob) : 'N/A'}</span>
              </div>

              {/* Mobile - Desktop only */}
              <div className="hidden lg:flex lg:col-span-2 items-center">
                <span className="text-[13px] font-semibold text-slate-600 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">{p.mobile || 'N/A'}</span>
              </div>

              {/* Status */}
              <div className="sm:col-span-3 lg:col-span-1 flex items-center sm:justify-center lg:justify-start mt-2 sm:mt-0">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${(!p.status || p.status === 'Active') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                  {p.status || 'Active'}
                </span>
              </div>

              {/* Last Appointment */}
              <div className="sm:col-span-2 lg:col-span-2 flex items-center gap-2 justify-start mt-2 sm:mt-0">
                <div className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100 shrink-0 sm:hidden">
                  <FaCalendarAlt size={10} />
                </div>
                <div className="min-w-0">
                  <span className="text-[12px] font-bold text-slate-600 block leading-tight truncate">{p.lastVisit || 'No Prior Visits'}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{p.lastVisitType || 'General'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sm:col-span-3 lg:col-span-2 flex justify-center gap-1.5 mt-2 sm:mt-0">
                {(!isReceptionist && !isBilling) && ( // Hide clinical actions from receptionists and billing
                  <button
                    onClick={(e) => { e.stopPropagation(); if (canAction('patients.view_notes')) navigate(`/notes/new?patientId=${p.id}`); }}
                    disabled={!canAction('patients.view_notes')}
                    title={!canAction('patients.view_notes') ? 'No access' : 'Add Clinical Note'}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-rose-500 hover:border-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-500 disabled:hover:border-slate-200 disabled:hover:bg-white"
                  >
                    <ClinicalNoteIcon size={20} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); if (canAction('patients.delete')) handleDeletePatient(p.id, p.name); }}
                  disabled={!canAction('patients.delete')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-rose-500 hover:border-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-500 disabled:hover:border-slate-200 disabled:hover:bg-white"
                  title={!canAction('patients.delete') ? 'No access' : 'Delete Patient Record'}
                >
                  <FaTrash size={14} />
                </button>
              </div>

            </div>
          )) : (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
                <FaSearch size={24} />
              </div>
              <h3 className="text-[16px] font-bold text-slate-700">No Patients Found</h3>
              <p className="text-[13px] text-slate-400 mt-1 max-w-sm">We couldn't find any patients matching your current search criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-clinicPrimary hover:border-clinicPrimary transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <FaChevronLeft size={12} />
            </button>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Page {currentPage} of {totalPages}</p>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-clinicPrimary hover:border-clinicPrimary transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Simplified High-Reliability Delete Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
              onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-100 p-8 text-center"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-100 transition-transform duration-500 scale-110">
                <FaTrash className="text-rose-500" size={36} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Delete Patient?</h3>
              <p className="text-[14px] font-bold text-slate-400 leading-relaxed px-2">
                Action is permanent. Confirming removal of <span className="text-slate-900">{deleteModal.patientName}</span>'s record from clinical history.
              </p>
              <div className="mt-10 flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  className="w-full py-4.5 bg-rose-500 text-white rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-2xl shadow-rose-200/50 hover:bg-rose-600 active:scale-95 transition-all"
                >
                  Confirm Permanent Delete
                </button>
                <button
                  onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                  className="w-full py-4 text-slate-400 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel / Keep Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Patients;
