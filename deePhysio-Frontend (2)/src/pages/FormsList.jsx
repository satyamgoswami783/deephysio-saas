import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaWpforms, FaPlus, FaSearch, FaChevronRight, FaFileAlt, FaEdit, FaTrash, FaEnvelope, FaCheckCircle, FaExclamationTriangle, FaTimes, FaUser } from 'react-icons/fa';
import EmailModal from '../components/ui/EmailModal';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import PatientIcon from '../components/ui/PatientIcon';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { usePermissions } from '../context/PermissionContext';
import { fetchApi } from '../config/api';

const FormsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlPatientId = searchParams.get('patientId');
  const { showToast } = useToast();
  const { can } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [forms, setForms] = useState([]);
  const [userRole, setUserRole] = useState('admin');

  // Custom Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);

  // Patient Selection for Form Fill
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [selectedFormIdToFill, setSelectedFormIdToFill] = useState(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientsOptions, setPatientsOptions] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [emailModal, setEmailModal] = useState({ isOpen: false, template: null });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [templatesResRaw, patientsResRaw] = await Promise.all([
        fetchApi('/form-templates'),
        fetchApi('/patients')
      ]);

      if (!templatesResRaw || !patientsResRaw) return;

      const templatesRes = await templatesResRaw.json();
      const patientsRes = await patientsResRaw.json();

      if (templatesRes.success) {
        setForms(templatesRes.data.map(f => {
          let parsedFields = [];
          if (Array.isArray(f.fields)) parsedFields = f.fields;
          else if (typeof f.fields === 'string') {
            try { parsedFields = JSON.parse(f.fields); } catch(e) {}
          }
          return {
            id: f.id,
            name: f.name,
            category: f.category,
            lastUpdated: (f.lastUpdated || f.last_updated) ? new Date(f.lastUpdated || f.last_updated).toLocaleDateString() : 'N/A',
            fields: parsedFields
          };
        }));
      }

      if (patientsRes.success) {
        setPatientsOptions(patientsRes.data.map(p => ({
          id: p.id,
          name: `${p.firstName || p.first_name} ${p.lastName || p.last_name}`
        })));
      }
    } catch (error) {
      console.error('Error fetching forms data:', error);
      showToast('Failed to synchronize form library.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const role = sessionStorage.getItem('deephysio_role');

    setUserRole(role);
    fetchData();
  }, []);

  const confirmDelete = async () => {
    if (!formToDelete) return;
    try {
       const responseRaw = await fetchApi(`/form-templates/${formToDelete.id}`, { method: 'DELETE' });
       if (!responseRaw) return;
       const response = await responseRaw.json();
       if (response.success) {
          setForms(forms.filter(f => f.id !== formToDelete.id));
          showToast(`Form "${formToDelete.name}" deleted successfully.`, 'success');
       }
    } catch (error) {
       showToast('Failed to delete form template.', 'error');
    } finally {
       setDeleteModalOpen(false);
       setFormToDelete(null);
    }
  };

  const filteredPatients = patientsOptions.filter(p => 
    p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()) || 
    String(p.id).toLowerCase().includes(patientSearchTerm.toLowerCase())
  );

  const handlePatientSelect = (patientId) => {
    setIsPatientModalOpen(false);
    navigate(`/forms/${selectedFormIdToFill}/fill?patientId=${patientId}`);
  };

  const filteredForms = forms.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-pulse">
        <div className="w-16 h-16 border-4 border-clinicPrimary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Form Library...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 sm:px-10 max-w-7xl mx-auto py-4 animate-fade-in font-sans pb-20">
      {/* Compact Premium Header */}
      <div className="relative bg-gradient-to-r from-[#2EA7B8] to-[#1a8fa0] rounded-2xl shadow-md p-4 mb-4 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0">
              <FaWpforms size={20} className="text-white drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-none mb-1">Form Library</h1>
              <p className="text-white/80 font-medium text-[10px] tracking-wide">Manage patient intake, consent, and assessment forms.</p>
            </div>
          </div>

          {can('forms.manage') && (
            <div className="relative z-10">
              <Button
                onClick={() => navigate('/forms/builder')}
                className="bg-white text-[#2EA7B8] px-5 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-slate-50 transition-all border-none"
              >
                <FaPlus size={10} /> Create New Form
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm bg-white rounded-2xl">
        <div className="p-3.5 px-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <ClinicalNoteIcon className="text-[#2EA7B8]" size={14} /> All Forms <span className="text-slate-400 font-bold bg-slate-200/50 px-1.5 py-0.5 rounded text-[9px] ml-1">{filteredForms.length}</span>
          </h3>
          <div className="relative w-full sm:w-[280px]">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
            <input
              type="text"
              placeholder="Search forms..."
              className="block w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[12px] font-medium text-slate-700 outline-none focus:border-[#2EA7B8] focus:ring-2 focus:ring-[#2EA7B8]/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f8fafc] text-slate-500 font-bold text-[9px] uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-5 py-3 whitespace-nowrap">Form Name</th>
                <th className="px-5 py-3 whitespace-nowrap flex items-center gap-1.5"><FaCheckCircle size={9} className="text-slate-400" /> Category</th>
                <th className="px-5 py-3 whitespace-nowrap">Fields</th>
                <th className="px-5 py-3 whitespace-nowrap">Updated</th>
                <th className="px-5 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {filteredForms.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center bg-white">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-5 shadow-sm">
                        <FaWpforms size={32} className="text-slate-300" />
                      </div>
                      <p className="text-base font-bold text-slate-700 mb-1">No forms found</p>
                      <p className="text-sm text-slate-500 max-w-sm">There are no forms matching your search, or you haven't created any templates yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredForms.map(form => (
                  <tr key={form.id} className="bg-white hover:bg-slate-50/50 transition-all duration-200 group relative cursor-pointer">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3 w-fit">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 text-[#2EA7B8] flex items-center justify-center shrink-0 group-hover:bg-[#2EA7B8] group-hover:text-white group-hover:border-[#2EA7B8] transition-all duration-300">
                          <ClinicalNoteIcon size={12} />
                        </div>
                        <span className="text-[13px] font-bold text-slate-700 group-hover:text-[#2EA7B8] transition-colors">{form.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="px-2 py-0.5 bg-slate-100/80 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest border border-slate-200/50">{form.category}</span>
                    </td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[12px] font-bold text-slate-600">{form.fields ? form.fields.length : 0}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">fields</span>
                      </div>
                    </td>
                    <td className="px-5 py-2.5 text-[12px] font-bold text-slate-400">{form.lastUpdated}</td>
                    <td className="px-5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (urlPatientId) {
                                navigate(`/forms/${form.id}/fill?patientId=${urlPatientId}`);
                            } else {
                                setSelectedFormIdToFill(form.id);
                                setIsPatientModalOpen(true);
                                setPatientSearchTerm('');
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1"
                        >
                          Fill
                        </button>
                        {can('forms.manage') && (
                          <div className="flex items-center gap-1.5 ml-1 border-l border-slate-100 pl-2">
                            <button 
                              onClick={() => navigate(`/forms/${form.id}/edit`)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-amber-500 hover:border-amber-200 transition-colors"
                              title="Edit Form"
                            >
                              <FaEdit size={11} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormToDelete(form);
                                setDeleteModalOpen(true);
                              }}
                              title="Delete"
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-300 flex items-center justify-center transition-all"
                            >
                              <FaTrash size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Custom Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <Card className="bg-white rounded-3xl p-0 w-full max-w-md shadow-2xl overflow-hidden animate-slide-up border-none">
            {/* Modal Header */}
            <div className="bg-rose-50 border-b border-rose-100 p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-rose-100 flex items-center justify-center text-rose-500 shrink-0 shadow-sm">
                <FaExclamationTriangle size={24} />
              </div>
              <div className="pt-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Delete Form?</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">This action cannot be undone. Are you sure you want to delete <span className="font-bold text-slate-700">"{formToDelete?.name}"</span>?</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-white flex items-center justify-end gap-3">
              <Button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setFormToDelete(null);
                }}
                className="bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-rose-500 hover:bg-rose-600 text-white border-none px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all shadow-md shadow-rose-500/20"
              >
                Delete Form
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Patient Selection Modal */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <Card className="bg-white rounded-3xl p-0 w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up border-none flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-clinicPrimary/10 text-clinicPrimary flex items-center justify-center border border-clinicPrimary/20">
                  <FaUser size={16} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Select Patient</h3>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Who is this form for?</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPatientModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 transition-colors"
              >
                <FaTimes size={14} />
              </button>
            </div>
            
            <div className="p-5 border-b border-slate-100 shrink-0">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Search patient by name or ID..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-clinicPrimary focus:ring-1 focus:ring-clinicPrimary/20 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="p-2 overflow-y-auto flex-1 min-h-[300px]">
              {filteredPatients.length > 0 ? (
                <div className="space-y-1">
                  {filteredPatients.map(patient => (
                    <div 
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient.id)}
                      className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl cursor-pointer group transition-colors border border-transparent hover:border-slate-100"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-clinicPrimary/10 group-hover:text-clinicPrimary transition-colors shrink-0">
                        <PatientIcon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-clinicPrimary transition-colors truncate">{patient.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PID-{patient.id}</span>
                        </div>
                      </div>
                      <button className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-bold uppercase tracking-widest group-hover:bg-clinicPrimary group-hover:text-white transition-all shadow-sm">
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
                    <FaSearch size={20} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">No patients found</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Try adjusting your search to find the correct patient.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      <EmailModal
        isOpen={emailModal.isOpen}
        onClose={() => setEmailModal({ isOpen: false, template: null })}
        type="FormTemplate"
        data={emailModal.template}
      />
    </div>
  );
};

export default FormsList;
