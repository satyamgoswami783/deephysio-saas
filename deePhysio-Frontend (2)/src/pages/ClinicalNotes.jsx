import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaPlus, FaSearch, FaHistory, FaCalendarAlt, FaUser, FaChevronRight, 
  FaFilter, FaEllipsisV, FaEye, FaEdit, FaUserMd, FaTrash, FaEnvelope
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';

import Button from '../components/ui/Button';
import PageHeader from '../components/ui/PageHeader';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';
import { usePermissions } from '../context/PermissionContext';
import EmailModal from '../components/ui/EmailModal';

// INITIAL_NOTES removed. Data is now fetched representing a live clinical ledger from the backend.

const formatDOB = (dobString) => {
  if (!dobString) return 'N/A';
  const date = new Date(dobString);
  if (isNaN(date.getTime())) return dobString;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const NOTE_TYPES = ['All Types', 'Initial Assessment', 'Progress Report', 'Discharge Summary', 'Referral Note'];

const ClinicalNotes = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { canAction } = usePermissions();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, noteId: null, patientName: '' });
  const itemsPerPage = 8;

  const [notes, setNotes] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [emailModal, setEmailModal] = useState({ isOpen: false, note: null });

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const role = sessionStorage.getItem('deephysio_role');


      const isTherapist = role === 'therapist';
      const storedUser = sessionStorage.getItem('deephysio_user');
      const loggedInUser = storedUser ? JSON.parse(storedUser) : null;

      const [notesRes, patientsRes] = await Promise.all([
        fetchApi('/clinical-notes'),
        fetchApi('/patients')
      ]);

      const patientsById = {};
      if (patientsRes) {
        const pData = await patientsRes.json().catch(() => ({}));
        if (pData?.success && Array.isArray(pData.data)) {
          pData.data.forEach((p) => {
            const id = p.id;
            if (!id) return;
            patientsById[id] = p;
          });
        }
      }

      if (notesRes) {
        const data = await notesRes.json();
        if (data.success) {
          const mapped = data.data.map((n) => {
            const patientId = n.patientId || n.patient_id || n.patient?.id;
            const fallbackPatient = patientsById[patientId] || {};
            const rawDate = n.date ? new Date(n.date) : null;

            const firstName =
              n.patient?.firstName ||
              n.patient?.first_name ||
              fallbackPatient.firstName ||
              fallbackPatient.first_name ||
              '';
            const lastName =
              n.patient?.lastName ||
              n.patient?.last_name ||
              fallbackPatient.lastName ||
              fallbackPatient.last_name ||
              '';

            return {
              id: n.id,
              patientId,
              patientName: `${firstName} ${lastName}`.trim() || 'Unknown',
              dob:
                n.patient?.dateOfBirth ||
                n.patient?.date_of_birth ||
                fallbackPatient.dateOfBirth ||
                fallbackPatient.date_of_birth ||
                null,
              mobile:
                n.patient?.phone ||
                n.patient?.mobile ||
                fallbackPatient.phone ||
                fallbackPatient.mobile ||
                null,
              type: n.type,
              date: rawDate && !isNaN(rawDate.getTime()) ? rawDate.toLocaleDateString('en-GB') : 'N/A',
              dateRaw: rawDate && !isNaN(rawDate.getTime()) ? rawDate.toISOString() : '',
              time: rawDate && !isNaN(rawDate.getTime())
                ? rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '--',
              therapistName: n.therapist?.name || 'N/A',
              therapistId: n.therapist_id,
              status: n.status
            };
          });

          setNotes(
            mapped.sort(
              (a, b) => new Date(b.dateRaw || 0).getTime() - new Date(a.dateRaw || 0).getTime()
            )
          );
        }
      }
    } catch (e) {
      showToast('Failed to fetch clinical ledger.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const filteredNotes = notes.filter(note => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = note.patientName?.toLowerCase().includes(searchLower) || false;
    const dobMatch = note.dob?.includes(searchLower) || false || (note.dob && formatDOB(note.dob).toLowerCase().includes(searchLower));
    const mobileMatch = note.mobile?.includes(searchLower) || false;
    const matchesSearch = nameMatch || dobMatch || mobileMatch;

    const matchesType = typeFilter === 'All Types' || note.type === typeFilter;
    const matchesDate = !dateFilter || note.date === dateFilter;
    return matchesSearch && matchesType && matchesDate;
  });

  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  const currentNotes = filteredNotes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDeleteNote = (noteId, patientName) => {
    setDeleteModal({ isOpen: true, noteId, patientName });
  };

  const confirmDeleteNote = async () => {
    const { noteId, patientName } = deleteModal;
    if (!noteId) return;

    setIsLoading(true);
    try {
      const res = await fetchApi(`/clinical-notes/${noteId}`, {
        method: 'DELETE'
      });
      if (res) {
        showToast(`${patientName}'s clinical record has been permanently deleted.`, 'success');
        loadNotes();
      }
    } catch (e) {
      showToast('Error removing clinical record.', 'error');
    } finally {
      setIsLoading(false);
      setDeleteModal({ isOpen: false, noteId: null, patientName: '' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-10">
      <PageHeader
        title="All Clinical Notes"
        subtitle="Manage, view, and organize comprehensive patient treatment records."
        icon={<ClinicalNoteIcon />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="accent"
              className="h-9 px-6 text-[11px] font-bold shadow-sm"
              onClick={() => canAction('notes.create') && navigate('/notes/new')}
              disabled={!canAction('notes.create')}
              title={!canAction('notes.create') ? 'No access' : ''}
              leftIcon={<FaPlus size={10} />}
            >
              Initialize New Note
            </Button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col h-full">
        {/* Filters Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full lg:max-w-xs">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <input
              type="text"
              placeholder="Search by name, DOB, or mobile..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary transition-all placeholder:text-slate-400 placeholder:font-medium"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative group w-full sm:w-auto">
              <FaFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
              <select
                className="w-full sm:w-40 pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 outline-none focus:border-clinicPrimary appearance-none cursor-pointer"
                value={typeFilter}
                onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              >
                {NOTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="relative w-full sm:w-auto">
              <FaCalendarAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
              <input
                type="date"
                className="w-full sm:w-40 pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-600 outline-none focus:border-clinicPrimary cursor-pointer"
                value={dateFilter}
                onChange={e => { setDateFilter(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>

        {/* Data Table - Desktop Only */}
        <div className="hidden sm:block overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient Details</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">DOB</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Mobile</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:table-cell">Note Type</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date / Status</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Author</th>
                <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && notes.length === 0 ? (
                <tr><td colSpan="7" className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Clinical Ledger...</td></tr>
              ) : currentNotes.length > 0 ? currentNotes.map((note) => (
                <tr key={note.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-amber-500 flex items-center justify-center shrink-0">
                        <ClinicalNoteIcon size={24} />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-slate-800">{note.patientName}</p>
                        <div className="flex items-center gap-1.5 mt-1 lg:hidden">
                          <span className="text-[11px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{note.dob ? formatDOB(note.dob) : 'N/A'}</span>
                          <span className="text-[11px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{note.mobile || 'N/A'}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium sm:hidden mt-1">{note.type}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-[13px] font-semibold text-slate-600 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">{note.dob ? formatDOB(note.dob) : 'N/A'}</span>
                  </td>

                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-[13px] font-semibold text-slate-600 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">{note.mobile || 'N/A'}</span>
                  </td>

                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200">
                      {note.type}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-[12px] font-bold text-slate-700">{note.date}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${note.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{note.status || 'Completed'}</p>
                    </div>
                  </td>

                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <FaUserMd className="text-slate-300" size={12} />
                      <p className="text-[12px] font-medium text-slate-600">{note.therapistName}</p>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        className="px-2.5 py-1.5 h-auto text-[10px] uppercase font-bold text-slate-500 hover:text-clinicPrimary"
                        onClick={() => navigate(`/notes/view/${note.id}`)}
                        title="View Note"
                      >
                        <FaEye size={12} />
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-2.5 py-1.5 h-auto text-[10px] uppercase font-bold text-slate-500 hover:text-clinicPrimary"
                        onClick={() => canAction('notes.edit') && navigate(`/notes/edit/${note.id}`)}
                        disabled={!canAction('notes.edit')}
                        title={!canAction('notes.edit') ? 'No access' : 'Edit Note'}
                      >
                        <FaEdit size={12} />
                      </Button>
                      <Button
                        variant="secondary"
                        className="px-2.5 py-1.5 h-auto text-[10px] uppercase font-bold text-slate-500 hover:text-clinicPrimary"
                        onClick={() => setEmailModal({ isOpen: true, note })}
                        title="Email Note"
                      >
                        <FaEnvelope size={12} />
                      </Button>
                      <button
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!canAction('notes.delete') ? 'No access' : 'Delete Note'}
                        disabled={!canAction('notes.delete')}
                        onClick={(e) => { e.stopPropagation(); if (canAction('notes.delete')) handleDeleteNote(note.id, note.patientName); }}
                      >
                        <FaTrash size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="py-20 text-center">
                    <ClinicalNoteIcon className="mx-auto text-slate-200 mb-4" size={32} />
                    <p className="text-[14px] font-bold text-slate-600">No Clinical Notes Found</p>
                    <p className="text-[12px] text-slate-400 mt-1 max-w-sm mx-auto">Adjust your search parameters or initialize a new clinical note.</p>
                    <Button
                      variant="accent"
                      className="mt-4 px-6 h-9 text-[11px]"
                      onClick={() => canAction('notes.create') && navigate('/notes/new')}
                      disabled={!canAction('notes.create')}
                      title={!canAction('notes.create') ? 'No access' : ''}
                    >
                      Initialize New Note
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Card View - Mobile Only */}
        <div className="sm:hidden divide-y divide-slate-100">
          {currentNotes.length > 0 ? currentNotes.map((note) => (
            <div key={note.id} className="p-4 bg-white space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-amber-500 flex items-center justify-center shrink-0">
                    <ClinicalNoteIcon size={24} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-800 leading-tight">{note.patientName}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${note.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{note.status || 'Completed'}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-bold text-slate-700">{note.date}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{note.time || '10:30 AM'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Note Type</p>
                  <p className="text-[10px] font-bold text-slate-600 truncate">{note.type}</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Author</p>
                  <p className="text-[10px] font-bold text-slate-600 truncate">{note.therapistName}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <p className="text-[9px] text-slate-400 font-medium">DOB: {note.dob ? formatDOB(note.dob) : 'N/A'}</p>
                    <p className="text-[9px] text-slate-400 font-medium">Mob: {note.mobile || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="w-9 h-9 p-0 flex items-center justify-center text-slate-500"
                    onClick={() => navigate(`/notes/view/${note.id}`)}
                    title="View Note"
                  >
                    <FaEye size={14} />
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-9 h-9 p-0 flex items-center justify-center text-slate-500"
                    onClick={() => setEmailModal({ isOpen: true, note })}
                    title="Email Note"
                  >
                    <FaEnvelope size={14} />
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-9 h-9 p-0 flex items-center justify-center text-slate-500"
                    onClick={() => canAction('notes.edit') && navigate(`/notes/edit/${note.id}`)}
                    disabled={!canAction('notes.edit')}
                    title={!canAction('notes.edit') ? 'No access' : ''}
                  >
                    <FaEdit size={14} />
                  </Button>
                  <button
                    className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-400 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!canAction('notes.delete')}
                    title={!canAction('notes.delete') ? 'No access' : 'Delete Note'}
                    onClick={(e) => { e.stopPropagation(); if (canAction('notes.delete')) handleDeleteNote(note.id, note.patientName); }}
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="py-12 text-center p-4">
              <ClinicalNoteIcon className="mx-auto text-slate-200 mb-3" size={32} />
              <p className="text-[13px] font-bold text-slate-600">No Records Found</p>
            </div>
          )}
        </div>

        {/* Pagination Toolbar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-500">Showing {currentNotes.length} of {filteredNotes.length} records</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:text-clinicPrimary hover:bg-clinicPrimary/5 disabled:opacity-50 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-600 hover:text-clinicPrimary hover:bg-clinicPrimary/5 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
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
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-100">
                <FaTrash className="text-rose-500" size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Delete Note?</h3>
              <p className="text-[13px] font-bold text-slate-400 leading-relaxed px-2">
                Permanently delete <span className="text-slate-900">{deleteModal.patientName}</span>'s clinical note? This action cannot be undone.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <button 
                  onClick={confirmDeleteNote}
                  className="w-full py-3.5 bg-rose-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-rose-200/50 hover:bg-rose-600 active:scale-95 transition-all"
                >
                  Confirm Delete
                </button>
                <button 
                  onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                  className="w-full py-3 text-slate-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <EmailModal
        isOpen={emailModal.isOpen}
        onClose={() => setEmailModal({ isOpen: false, note: null })}
        type="Note"
        data={emailModal.note}
        patientId={emailModal.note?.patientId}
        patientName={emailModal.note?.patientName}
        patientEmail={emailModal.note?.patientEmail}
      />
    </div>
  );
};

export default ClinicalNotes;
