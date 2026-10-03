import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  FaUser, FaCalendarAlt, FaWpforms, FaArrowLeft,
  FaShieldAlt, FaChevronDown, FaEdit, FaExclamationTriangle,
  FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaPlus, FaTimes, FaTag, FaListUl, FaBriefcase, FaIdCard,
  FaTasks, FaFileAlt, FaLayerGroup, FaUserCircle, FaLock, FaFileInvoice, FaDownload, FaCreditCard, FaHistory
} from 'react-icons/fa';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import MedicalHistoryIcon from '../components/ui/MedicalHistoryIcon';
import PatientIcon from '../components/ui/PatientIcon';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { FaPrint, FaRegClock } from 'react-icons/fa';

// UI Components
import EmailModal from '../components/ui/EmailModal';

// Tab Components
import TasksTab from '../components/patientProfile/tabs/TasksTab';
import FilesTab from '../components/patientProfile/tabs/FilesTab';
import MessagesTab from '../components/patientProfile/tabs/MessagesTab';
import EpisodesTab from '../components/patientProfile/tabs/EpisodesTab';
import AccountTab from '../components/patientProfile/tabs/AccountTab';
import PrivacyTab from '../components/patientProfile/tabs/PrivacyTab';
import BodyChartTab from '../components/patientProfile/tabs/BodyChartTab';
import ClinicalHistoryTab from '../components/patientProfile/tabs/ClinicalHistoryTab';
import { readEffectivePermissions } from '../config/actions';
import { useClinicProfile } from '../hooks/useClinicProfile';
import { getInvoiceDisplayNumber } from '../utils/invoiceDisplay';
import { formatCurrency, getActiveCurrencySymbol } from '../utils/currency';

const FIXED_HISTORY_SECTIONS = [
  { id: 'existingConditions', title: 'Existing Conditions', field: 'existingConditions', placeholder: 'Enter existing conditions...' },
  { id: 'allergies', title: 'Allergies', field: 'allergies', placeholder: 'Enter allergy details...' },
  { id: 'chronicDiseases', title: 'Chronic Diseases', field: 'chronicDiseases', placeholder: 'Enter chronic diseases...' },
  { id: 'surgeries', title: 'Surgeries / Procedures', field: 'surgeries', placeholder: 'Enter surgeries or procedures...' }
];

const parseCustomHistorySections = (longTermNotes) => {
  if (!longTermNotes) return [];
  try {
    const parsed = JSON.parse(longTermNotes);
    if (parsed && Array.isArray(parsed.customSections)) {
      return parsed.customSections
        .filter((s) => s && typeof s.title === 'string')
        .map((s, idx) => ({
          id: `custom-${Date.now()}-${idx}`,
          title: s.title,
          content: s.content || '',
          isCustom: true
        }));
    }
  } catch (e) {
    // old plain-text notes fallback
  }
  return [{
    id: `custom-${Date.now()}-legacy`,
    title: 'Important Clinical Notes',
    content: longTermNotes,
    isCustom: true
  }];
};

const PatientProfile = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const clinicProfile = useClinicProfile();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'patient';

  const [selectedPatient, setSelectedPatient] = useState('Patient Details');
  const currentRole = sessionStorage.getItem('deephysio_role');
  const storedUser = sessionStorage.getItem('deephysio_user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const effectivePermissions = readEffectivePermissions(currentUser, currentRole || 'therapist');
  const can = (permission) => effectivePermissions.includes(permission);
  const canAny = (permissions = []) => permissions.some((p) => can(p));

  const canAccessBodyChart = currentRole === 'admin' || currentRole === 'therapist';
  const canViewBillingPanel = currentRole === 'admin' || currentRole === 'billing';

  const hasTabAccess = (tabId) => {
    switch (tabId) {
      case 'patient':
        return can('patient.basic');
      case 'appointments':
        return canAny(['appointments.view', 'appointments.manage']);
      case 'notes':
        return canAny(['notes.view', 'notes.manage']);
      case 'forms':
        return can('forms.view');
      case 'history':
      case 'clinicalHistory':
      case 'tasks':
      case 'files':
      case 'messages':
      case 'episodes':
      case 'account':
      case 'privacy':
        return can('patient.read');
      case 'paymentDetails':
        return canAny(['billing.view', 'billing.manage']);
      case 'bodyChart':
        return canAccessBodyChart && can('patient.read');
      default:
        return false;
    }
  };

  const allTabs = [
    { id: 'patient', name: 'Patient', icon: <PatientIcon size={24} /> },
    { id: 'notes', name: 'Notes', icon: <ClinicalNoteIcon size={24} /> },
    { id: 'forms', name: 'Forms/Assessments', icon: <FaWpforms /> },
    { id: 'appointments', name: 'Appointments', icon: <FaCalendarAlt /> },
    { id: 'history', name: 'Medical History', icon: <MedicalHistoryIcon size={24} /> },
    { id: 'clinicalHistory', name: 'Clinical History', icon: <FaHistory /> },
    ...(canViewBillingPanel ? [{ id: 'paymentDetails', name: 'Payment Details', icon: <FaFileInvoice /> }] : []),
    { id: 'tasks', name: 'Tasks', icon: <FaTasks /> },
    { id: 'files', name: 'Files', icon: <FaFileAlt /> },
    { id: 'messages', name: 'Messages', icon: <FaEnvelope /> },
    { id: 'episodes', name: 'Episodes', icon: <FaLayerGroup /> },
    { id: 'account', name: 'Account', icon: <FaUserCircle /> },
    { id: 'privacy', name: 'Privacy', icon: <FaLock /> }
  ];

  if (canAccessBodyChart) {
    allTabs.splice(5, 0, { id: 'bodyChart', name: 'Body Chart', icon: <FaIdCard /> });
  }
  const tabs = allTabs.filter((tab) => hasTabAccess(tab.id));

  const [patientData, setPatientData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelTargetAppt, setCancelTargetAppt] = useState(null);
  const [selectedFormSubmission, setSelectedFormSubmission] = useState(null);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [historySections, setHistorySections] = useState([]);
  const [newHistorySectionTitle, setNewHistorySectionTitle] = useState('');
  const [tabAccessDenied, setTabAccessDenied] = useState({});
  const [isExporting, setIsExporting] = useState(false);
  const [currentExport, setCurrentExport] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalConfig, setEmailModalConfig] = useState({ type: '', data: null });

  const fetchFullProfile = async () => {
    setIsLoading(true);
    try {
      const role = sessionStorage.getItem('deephysio_role');


      const isTherapist = role === 'therapist';
      const loggedInUser = currentUser;
      const userRole = sessionStorage.getItem('deephysio_role');

      const pRes = await fetchApi(`/patients/${id}`);
      if (!pRes) {
          navigate('/patients');
          return;
      }
      const pData = await pRes.json();
      
      if (!pData.success || !pData.data) {
          showToast('Patient record not found.', 'error');
          navigate('/patients');
          return;
      }

      const p = pData.data;
      const emergencyContacts = Array.isArray(p.emergencyContacts)
        ? p.emergencyContacts
        : Array.isArray(p.emergency_contacts)
          ? p.emergency_contacts
          : [];

      if (isTherapist && loggedInUser && p.therapistId && p.therapistId !== loggedInUser.id) {
          showToast('Access Denied: You are not the assigned therapist for this patient.', 'error');
          navigate('/patients');
          return;
      }

      const [nRes, aRes, fRes, templatesRes, invoicesRes, paymentsRes] = await Promise.all([
          fetchApi(`/clinical-notes?patientId=${id}`),
          fetchApi(`/appointments?patientId=${id}`),
          fetchApi(`/form-submissions?patientId=${id}`),
          fetchApi('/form-templates'),
          canViewBillingPanel ? fetchApi(`/invoices?patientId=${id}`) : Promise.resolve(null),
          canViewBillingPanel ? fetchApi(`/payments?patientId=${id}`) : Promise.resolve(null)
      ]);

      const deniedTabs = {};

      let notes = [];
      if (nRes) {
          if (nRes.ok) {
            const nData = await nRes.json();
            if (nData.success) {
              notes = nData.data.map(n => {
                let dynamicContent = null;
                try {
                  const rawDyn = n.dynamicContent ?? n.dynamic_content;
                  if (rawDyn) {
                    dynamicContent = typeof rawDyn === 'string' ? JSON.parse(rawDyn) : rawDyn;
                    // Normalize the common dynamic content structure
                    if (dynamicContent && dynamicContent.layouts && !dynamicContent.responses) {
                       dynamicContent.responses = dynamicContent.values || {};
                    }
                  }
                } catch (e) {}

                return {
                  id: n.id,
                  date: new Date(n.date).toLocaleDateString('en-IN'),
                  createdAt: n.date,
                  type: n.type,
                  status: n.status,
                  author: n.therapist?.name || 'N/A',
                  subjective: n.subjective,
                  objective: n.objective,
                  assessment: n.assessment,
                  plan: n.plan,
                  dynamicContent
                };
              });
            }
          } else {
            const errJson = await nRes.json().catch(() => ({}));
            const msg = String(errJson?.message || '');
            if (msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('access denied')) {
              deniedTabs.notes = true;
            }
          }
      }

      let appts = [];
      if (aRes) {
          const aData = await aRes.json();
          if (aData.success) {
              appts = aData.data.map(a => ({
                  id: a.id,
                  date: new Date(a.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                  time: new Date(a.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  service: a.service?.name || 'Physio Session',
                  servicePrice: Number(a.service?.price || 0),
                  status: String(a.status || 'scheduled').toLowerCase()
              }));
          }
      }

      let templateCatalogById = {};
      if (templatesRes) {
          const templatesData = await templatesRes.json();
          if (templatesData.success && Array.isArray(templatesData.data)) {
              templateCatalogById = templatesData.data.reduce((acc, t) => {
                if (!t?.id) return acc;
                acc[String(t.id)] = t;
                return acc;
              }, {});
          }
      }

      let forms = [];
      if (fRes) {
          const fData = await fRes.json();
          if (fData.success) {
              forms = fData.data.map(f => {
                  const dateObj = new Date(f.created_at || f.createdAt || f.date || Date.now());
                  const templateRefId = String(
                    f.form_template_id ||
                    f.formTemplateId ||
                    f.template_id ||
                    f.templateId ||
                    f.formTemplate?.id ||
                    f.form_template?.id ||
                    ''
                  );
                  const catalogTemplate = templateCatalogById[templateRefId];
                  const effectiveTemplate = f.form_template || f.formTemplate || catalogTemplate || {};
                  const templateLayouts = effectiveTemplate?.layouts || [];
                  const templateFields = Array.isArray(effectiveTemplate?.fields) ? effectiveTemplate.fields : [];
                  const allTemplateFields = templateLayouts.length > 0
                    ? templateLayouts.flatMap((layout) => layout.fields || []).filter(Boolean)
                    : templateFields.filter(Boolean);
                  const fallbackLabels = allTemplateFields.map((field, index) => field?.label || `Field ${index + 1}`);
                  const templateFieldLabelMap = allTemplateFields.reduce((acc, field) => {
                    if (field?.id) acc[field.id] = field.label || field.id;
                    return acc;
                  }, {});
                  const storedResponses = f.responses && typeof f.responses === 'object' ? f.responses : {};
                  const isStructured = storedResponses.values && typeof storedResponses.values === 'object';
                  const parsedResponses = isStructured ? storedResponses.values : storedResponses;
                  const storedFieldMeta = isStructured && storedResponses.fieldMeta && typeof storedResponses.fieldMeta === 'object'
                    ? storedResponses.fieldMeta
                    : {};
                  const fieldLabelMap = Object.keys(parsedResponses || {}).reduce((acc, key) => {
                    const storedLabel = storedFieldMeta[key]?.label;
                    const templateLabel = templateFieldLabelMap[key];
                    // Never persist raw generated IDs (f_...) as display labels.
                    if (storedLabel && storedLabel !== key) {
                      acc[key] = storedLabel;
                    } else if (templateLabel && templateLabel !== key) {
                      acc[key] = templateLabel;
                    }
                    return acc;
                  }, {});
                  return {
                      id: f.id,
                      templateName:
                        effectiveTemplate?.name ||
                        effectiveTemplate?.title ||
                        f.template_name ||
                        f.name ||
                        'Form Submission',
                      category: effectiveTemplate?.category || f.category || 'Form',
                      date: isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString('en-IN'),
                      time: isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      responses: parsedResponses,
                      fieldLabelMap,
                      fallbackLabels
                  };
              });
          }
      }

      let invoices = [];
      if (invoicesRes && invoicesRes.ok) {
        const invoiceData = await invoicesRes.json();
        if (invoiceData.success && Array.isArray(invoiceData.data)) {
          invoices = invoiceData.data;
        }
      }

      let payments = [];
      if (paymentsRes && paymentsRes.ok) {
        const paymentData = await paymentsRes.json();
        if (paymentData.success && Array.isArray(paymentData.data)) {
          payments = paymentData.data;
        }
      }

      const completedServiceTotal = appts
        .filter((a) => String(a.status || '').toLowerCase() === 'completed')
        .reduce((sum, a) => sum + Number(a.servicePrice || 0), 0);

      const invoiceTotal = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
      const totalPaid = payments.reduce((sum, pmt) => sum + Number(pmt.amount || 0), 0);
      // Fallback: if no invoices exist yet, use completed-services total as expected amount.
      const totalInvoiced = invoiceTotal > 0 ? invoiceTotal : completedServiceTotal;
      const pendingAmount = Math.max(totalInvoiced - totalPaid, 0);

      setPatientData({
          ...p,
          name: `${p.firstName} ${p.lastName}`,
          preferredName: p.firstName,
          dob: p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
          gender: p.gender || 'Not specified',
          pronouns: '--',
          address: p.address || null,
          phone: p.phone,
          mobile: p.phone,
          workPhone: '--',
          email: p.email || null,
          behaviour: p.behaviour || 'green',
          status: p.isActive === false ? 'Inactive' : 'Active',
          appointments: appts,
          notes: notes,
          forms: forms,
          medicalHistory: p.medicalHistory || {},
          emergencyContacts,
          billing: {
            totalInvoiced,
            totalPaid,
            pendingAmount,
            completedServiceTotal,
            invoices: invoices.slice(0, 5),
            payments: payments.slice(0, 5)
          }
      });
      setTabAccessDenied(deniedTabs);
      const baseSections = FIXED_HISTORY_SECTIONS.map((s) => ({
        id: s.id,
        title: s.title,
        field: s.field,
        content: p.medicalHistory?.[s.field] || '',
        placeholder: s.placeholder,
        isCustom: false
      }));
      const customSections = parseCustomHistorySections(p.medicalHistory?.longTermNotes);
      setHistorySections([...baseSections, ...customSections]);
      setSelectedPatient(`${p.firstName} ${p.lastName}`);

    } catch (error) {
      showToast('Error syncing patient data.', 'error');
      navigate('/patients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchFullProfile();
  }, [id]);

  if (isLoading || !patientData) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-clinicPrimary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  const handleCancelAppointment = async (apptId) => {
    try {
      const res = await fetchApi(`/appointments/${apptId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' })
      });
      
      if (res) {
        const data = await res.json();
        if (data.success) {
          showToast('Appointment cancelled successfully', 'success');
          // Optimistic UI update for smooth flow; keep refresh in background for sync.
          setPatientData((prev) => {
            if (!prev || !Array.isArray(prev.appointments)) return prev;
            return {
              ...prev,
              appointments: prev.appointments.map((a) =>
                Number(a.id) === Number(apptId) ? { ...a, status: 'cancelled' } : a
              )
            };
          });
          fetchFullProfile();
        } else {
          showToast(data.message || 'Cancellation failed', 'error');
        }
      }
    } catch (e) {
      showToast('Error communicating with server', 'error');
    }
  };

  const requestCancelAppointment = (appointment) => {
    setCancelTargetAppt(appointment);
  };

  const handleDownloadInvoice = (invoice) => {
    // Normalize invoice data for export
    const normalizedInvoice = {
      ...invoice,
      displayId: getInvoiceDisplayNumber(invoice, invoice.id),
      date: new Date(invoice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      amount: formatCurrency(invoice.total || 0),
      patient: patientData.name,
      method: invoice.payments?.[0]?.method || 'Digital Sync'
    };
    setCurrentExport({ type: 'Invoice', data: normalizedInvoice });
    handleExport('Invoice');
  };

  const handleSaveMedicalHistory = async () => {
    try {
      setIsSavingHistory(true);
      const payload = {
        existingConditions: '',
        allergies: '',
        chronicDiseases: '',
        surgeries: '',
        longTermNotes: ''
      };

      const customSections = [];
      historySections.forEach((section) => {
        if (section.field) {
          payload[section.field] = section.content || '';
        } else {
          customSections.push({
            title: section.title,
            content: section.content || ''
          });
        }
      });
      payload.longTermNotes = customSections.length ? JSON.stringify({ customSections }) : '';

      const res = await fetchApi(`/patients/${id}/medical-history`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (!res) return;
      const data = await res.json();
      if (data.success) {
        const updatedHistory = data.data || {};
        setPatientData(prev => ({ ...prev, medicalHistory: updatedHistory }));
        const baseSections = FIXED_HISTORY_SECTIONS.map((s) => ({
          id: s.id,
          title: s.title,
          field: s.field,
          content: updatedHistory[s.field] || '',
          placeholder: s.placeholder,
          isCustom: false
        }));
        const custom = parseCustomHistorySections(updatedHistory.longTermNotes);
        setHistorySections([...baseSections, ...custom]);
        setNewHistorySectionTitle('');
        showToast('Medical history updated successfully.', 'success');
      } else {
        showToast(data.message || 'Failed to update medical history.', 'error');
      }
    } catch (error) {
      showToast('Error while updating medical history.', 'error');
    } finally {
      setIsSavingHistory(false);
    }
  };

  const handleExport = async (type) => {
    try {
      setIsExporting(true);
      showToast(`Generating clinical ${type} ledger...`, 'success');
      
      // Allow DOM to render the hidden export template
      await new Promise(r => setTimeout(r, 500));
      
      const element = document.getElementById('clinical-export-template');
      if (!element) throw new Error('Export template not found');

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800,
        windowWidth: 800
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / pdfWidth;
      const imgHeight = canvasHeight / ratio;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`DeePhysio_${type}_${patientData.id}_${new Date().getTime()}.pdf`);
      
      showToast('Clinical ledger downloaded successfully.', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to generate document.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmail = (type, data) => {
    const targetData = data || currentExport?.data;
    if (!targetData) {
      showToast('No document selected to email.', 'warning');
      return;
    }
    setEmailModalConfig({ type, data: targetData });
    setEmailModalOpen(true);
  };

  const renderPatientTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-4 items-start animate-in fade-in duration-300">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-[16px] lg:text-[18px] font-bold text-slate-800 flex items-center gap-2">
              <PatientIcon className="text-slate-400" size={18} /> Patient Summary
            </h3>
            <button 
              onClick={() => navigate(`/patients/edit/${patientData.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-wider"
            >
              <FaEdit size={12} /> Edit Details
            </button>
          </div>

          <div className="px-4 py-4 sm:px-5 sm:py-5 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Full Name</label>
              <p className="text-[14px] font-bold text-slate-800">{patientData.name}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Preferred Name</label>
              <p className="text-[14px] font-bold text-slate-800">{patientData.preferredName || '--'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Date of Birth</label>
              <p className="text-[14px] font-bold text-slate-800">{patientData.dob}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Gender</label>
              <p className="text-[14px] font-bold text-slate-800">{patientData.gender}</p>
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Home Address</label>
              <div className="flex items-start gap-2 pt-1">
                <FaMapMarkerAlt className="text-slate-300 mt-0.5 shrink-0" size={12} />
                <p className="text-[14px] font-semibold text-slate-700 leading-snug">{patientData.address || 'No address provided'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[16px] lg:text-[18px] font-bold text-slate-800">Contact Info</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <FaPhoneAlt size={12} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                <p className="text-[14px] font-bold text-slate-700">{patientData.phone || '--'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <FaEnvelope size={12} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                <p className="text-[14px] font-bold text-slate-700">{patientData.email || '--'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-rose-50/50 rounded-xl border border-rose-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-100/60 bg-rose-50/80">
            <h3 className="text-[16px] lg:text-[18px] font-bold text-rose-800 flex items-center gap-2">
              <FaShieldAlt className="text-rose-400" size={14} /> Emergency
            </h3>
          </div>
          <div className="p-5 space-y-4">
            {Array.isArray(patientData.emergencyContacts) && patientData.emergencyContacts.length > 0 ? (
              patientData.emergencyContacts.map((contact) => (
                <div key={contact.id || `${contact.name}-${contact.phone}`} className="space-y-1">
                  <p className="text-[13px] font-bold text-slate-800">
                    {contact.name || '--'} {contact.relation ? `(${contact.relation})` : ''}
                  </p>
                  <p className="text-[13px] font-medium text-rose-600">{contact.phone || '--'}</p>
                </div>
              ))
            ) : (
              <p className="text-[13px] font-medium text-slate-500">No emergency contact added</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  const renderAppointmentsTab = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
     <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-[16px] lg:text-[18px] font-bold text-slate-800 flex items-center gap-2">
          <FaCalendarAlt className="text-slate-400" size={14} /> Appointment History
        </h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setCurrentExport({ type: 'Appointments', data: patientData.appointments });
              handleExport('Appointments');
            }} 
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg text-[12px] font-bold shadow-sm hover:bg-slate-50 transition-all"
          >
            <FaDownload size={10} /> Download History
          </button>
          <button onClick={() => navigate(`/appointments/book?patientId=${patientData.id}`)} className="flex items-center gap-1.5 px-4 py-2 bg-clinicPrimary text-white rounded-lg text-[12px] font-bold shadow-sm hover:bg-clinicPrimary/90 transition-all">
            <FaPlus size={10} /> Book Appointment
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patientData.appointments && patientData.appointments.length > 0 ? patientData.appointments.map(apt => {
              const st = String(apt.status || '').toLowerCase();
              const isTerminal = st === 'completed' || st === 'no_show' || st === 'cancelled';

              return (
                <tr key={apt.id} className={`hover:bg-slate-50/50 transition-colors ${st === 'no_show' ? 'bg-rose-50/20' : ''}`}>
                  <td className="px-5 py-4">
                    <div>
                      <div className="font-bold text-slate-800 text-[14px]">{apt.date}</div>
                      <div className="text-[12px] text-slate-500 font-medium">{apt.time}</div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-700 text-[13px]">{apt.service}</div>
                  </td>
                <td className="px-5 py-4 text-center">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest border ${
                      st === 'scheduled'  ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      st === 'checked_in' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      st === 'completed'  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      st === 'no_show'    ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      st === 'cancelled'  ? 'bg-slate-100 text-slate-500 border-slate-200' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                    {st === 'checked_in' ? 'CHECKED IN' : st === 'no_show' ? 'DNA' : st.toUpperCase()}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  {!isTerminal && (
                    <button 
                      onClick={() => requestCancelAppointment(apt)}
                      className="text-[10px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest px-2 py-1 bg-rose-50 rounded border border-rose-100 hover:bg-rose-100 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            );
          }) : (
              <tr>
                <td colSpan="4" className="px-5 py-12 text-center text-slate-400 italic">No appointments found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderNotesTab = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-[16px] lg:text-[18px] font-bold text-slate-800 flex items-center gap-2">
          <ClinicalNoteIcon className="text-slate-400" size={24} /> Clinical Notes
        </h3>
        <button onClick={() => navigate(`/notes/new?patientId=${patientData.id}`)} className="flex items-center gap-1.5 px-4 py-2 bg-clinicPrimary text-white rounded-lg text-[12px] font-bold shadow-sm hover:bg-clinicPrimary/90 transition-all">
          <FaPlus size={10} /> New Note
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {patientData.notes && patientData.notes.length > 0 ? patientData.notes.map(note => (
          <div key={note.id} className="p-5 hover:bg-slate-50/50 transition-colors group cursor-pointer flex items-center justify-between" onClick={() => navigate(`/notes/view/${note.id}`)}>
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center border border-pink-100 shrink-0">
                <ClinicalNoteIcon size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="text-[14px] sm:text-[15px] font-bold text-slate-800 group-hover:text-clinicPrimary transition-colors truncate">{note.type}</h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border shrink-0 ${note.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {note.status}
                    </span>
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{note.date} &bull; {note.author}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentExport({ type: 'Note', data: note });
                  handleExport('Note');
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-clinicPrimary px-3 py-1.5 border border-slate-200 hover:border-clinicPrimary rounded-lg transition-colors"
                title="Download PDF"
              >
                <FaDownload size={10} />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentExport({ type: 'Note', data: note });
                  handleEmail('Note');
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-clinicPrimary px-3 py-1.5 border border-slate-200 hover:border-clinicPrimary rounded-lg transition-colors"
                title="Email PDF"
              >
                <FaEnvelope size={10} />
              </button>
              <button 
                className="text-[11px] font-bold text-slate-400 hover:text-clinicPrimary px-3 py-1.5 border border-slate-200 hover:border-clinicPrimary rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/notes/view/${note.id}`);
                }}
              >
                View
              </button>
            </div>
          </div>
        )) : (
          <div className="p-12 text-center text-slate-400 italic">No clinical notes recorded</div>
        )}
      </div>
    </div>
  );

  const renderAccessDeniedTab = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-[16px] lg:text-[18px] font-bold text-slate-800">Access Restricted</h3>
      </div>
      <div className="p-8 text-center">
        <p className="text-[15px] font-bold text-slate-700">You do not have access to this section.</p>
        <p className="text-[12px] text-slate-500 mt-2">
          Contact your admin to grant the required permission.
        </p>
      </div>
    </div>
  );

  const renderHistoryTab = () => {
    const canEditHistory = currentRole === 'admin' || currentRole === 'therapist';

    const handleUpdateSectionContent = (sectionId, value) => {
      setHistorySections((prev) =>
        prev.map((section) =>
          section.id === sectionId ? { ...section, content: value } : section
        )
      );
    };

    const handleDeleteSection = (sectionId) => {
      setHistorySections((prev) => prev.filter((section) => section.id !== sectionId));
    };

    const handleAddSection = () => {
      const title = newHistorySectionTitle.trim();
      if (!title) {
        showToast('Section heading is required.', 'error');
        return;
      }
      setHistorySections((prev) => [
        ...prev,
        {
          id: `custom-${Date.now()}`,
          title,
          content: '',
          isCustom: true
        }
      ]);
      setNewHistorySectionTitle('');
    };

    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-teal-50/10">
          <h3 className="text-[15px] sm:text-[17px] font-bold text-slate-800 flex items-center gap-2">
            <MedicalHistoryIcon className="text-teal-500" size={24} /> Medical History
          </h3>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
              <button 
                onClick={() => {
                  setCurrentExport({ type: 'Medical History', data: historySections });
                  handleExport('Medical History');
                }}
                className="h-9 px-3.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[11px] font-bold hover:bg-slate-50 transition-all whitespace-nowrap flex items-center gap-2"
              >
                <FaDownload size={10} /> Download History
              </button>
              <button 
                onClick={() => {
                  setCurrentExport({ type: 'Medical History', data: historySections });
                  handleEmail('Medical History');
                }}
                className="h-9 px-3.5 bg-white border border-slate-200 text-slate-500 rounded-lg text-[12px] font-bold hover:bg-slate-50 transition-all whitespace-nowrap flex items-center gap-2"
              >
                <FaEnvelope size={10} /> Email History
              </button>
            </div>
            {canEditHistory && (
              <div className="flex w-full sm:w-auto items-center gap-2 pt-1 sm:pt-0">
                <input
                  type="text"
                  value={newHistorySectionTitle}
                  onChange={(e) => setNewHistorySectionTitle(e.target.value)}
                  className="h-9 flex-1 sm:w-48 px-3 border border-slate-200 rounded-lg text-[12px] font-medium text-slate-700 outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400"
                  placeholder="Add heading..."
                />
                <button
                  onClick={handleAddSection}
                  className="h-9 px-3.5 bg-slate-100 text-slate-700 rounded-lg text-[12px] font-bold hover:bg-slate-200 transition-all whitespace-nowrap"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {historySections.length > 0 ? historySections.map((section) => (
            <div key={section.id} className="px-4 sm:px-5 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[13px] sm:text-[14px] font-bold text-slate-700 tracking-tight">{section.title}</h4>
                {canEditHistory && (
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1 bg-rose-50 rounded border border-rose-100 hover:bg-rose-100 transition-all"
                  >
                    Delete
                  </button>
                )}
              </div>
              <textarea
                rows={1}
                value={section.content || ''}
                onChange={(e) => handleUpdateSectionContent(section.id, e.target.value)}
                disabled={!canEditHistory}
                className={`w-full p-2.5 border rounded-lg text-[13px] leading-5 font-medium text-slate-700 whitespace-pre-wrap outline-none resize-none overflow-hidden ${
                  canEditHistory
                    ? 'bg-white border-slate-200 focus:ring-2 focus:ring-teal-100 focus:border-teal-400'
                    : 'bg-slate-50 border-slate-100'
                }`}
                placeholder={section.placeholder || `Enter ${section.title.toLowerCase()}...`}
                style={{ height: 'auto', minHeight: '40px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />
            </div>
          )) : (
            <div className="p-10 text-center text-slate-400 italic">No medical history sections. Add a section to start.</div>
          )}
        </div>
        {canEditHistory && (
          <div className="px-4 sm:px-5 py-3.5 border-t border-slate-100 bg-white flex justify-end">
            <button
              onClick={handleSaveMedicalHistory}
              disabled={isSavingHistory}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg text-[12px] font-bold shadow-sm hover:bg-teal-600 transition-all disabled:opacity-60"
            >
              {isSavingHistory ? 'Saving...' : 'Save Form'}
            </button>
          </div>
        )}
        {!canEditHistory && (
          <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 text-[12px] text-slate-500">
            You have read-only access to medical history.
          </div>
        )}
      </div>
    );
  };

  const renderFormsTab = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="text-[16px] lg:text-[18px] font-bold text-slate-800 flex items-center gap-2">
          <FaWpforms size={18} className="text-slate-400" /> Assessment History ({patientData.forms.length})
        </h3>
        <button onClick={() => navigate(`/forms?patientId=${patientData.id}`)} className="flex items-center gap-1.5 px-4 py-2 bg-clinicPrimary text-white rounded-lg text-[12px] font-bold shadow-sm hover:bg-clinicPrimary/90 transition-all">
          <FaPlus size={10} /> New Assessment
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {patientData.forms && patientData.forms.length > 0 ? patientData.forms.map(form => (
          <div key={form.id} className="p-5 hover:bg-slate-50/50 transition-colors group cursor-pointer flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100">
                <FaWpforms size={20} />
              </div>
              <div>
                <h4 className="text-[14px] sm:text-[15px] font-bold text-slate-800 group-hover:text-clinicPrimary transition-colors">{form.templateName}</h4>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{form.category} &bull; {form.date} &bull; {form.time}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest border border-emerald-100">Synchronized</span>
              <button
                onClick={() => {
                  setCurrentExport({ type: 'Form', data: form });
                  handleExport('Form');
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-clinicPrimary px-3 py-1.5 border border-slate-200 hover:border-clinicPrimary rounded-lg transition-colors ml-2"
                title="Download PDF"
              >
                <FaDownload size={10} />
              </button>
              <button
                onClick={() => {
                  setCurrentExport({ type: 'Form', data: form });
                  handleEmail('Form');
                }}
                className="text-[11px] font-bold text-slate-400 hover:text-clinicPrimary px-3 py-1.5 border border-slate-200 hover:border-clinicPrimary rounded-lg transition-colors"
                title="Email PDF"
              >
                <FaEnvelope size={10} />
              </button>
              <button
                onClick={() => setSelectedFormSubmission(form)}
                className="text-[11px] font-bold text-slate-400 hover:text-clinicPrimary px-3 py-1.5 border border-slate-200 hover:border-clinicPrimary rounded-lg transition-colors"
              >
                View Protocol
              </button>
            </div>
          </div>
        )) : (
          <div className="p-12 text-center text-slate-400 italic">No assessment protocols submitted yet</div>
        )}
      </div>
    </div>
  );

  const renderPaymentDetailsTab = () => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-[16px] lg:text-[18px] font-bold text-slate-800 flex items-center gap-2">
          <FaFileInvoice className="text-emerald-500" size={14} /> Payment Details
        </h3>
        <button
          onClick={() => navigate(`/billing/patient/${patientData.id}`)}
          className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-2 py-1 bg-emerald-50 rounded border border-emerald-100 hover:bg-emerald-100 transition-all"
        >
          Open Billing
        </button>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoiced</p>
            <p className="text-[14px] font-black text-slate-800 mt-1">{formatCurrency(patientData.billing?.totalInvoiced)}</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Paid</p>
            <p className="text-[14px] font-black text-emerald-700 mt-1">{formatCurrency(patientData.billing?.totalPaid)}</p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Pending</p>
            <p className="text-[14px] font-black text-amber-700 mt-1">{formatCurrency(patientData.billing?.pendingAmount)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recent Invoices</p>
            {patientData.billing?.invoices?.length ? (
              <div className="space-y-2">
                {patientData.billing.invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/60">
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-slate-800 truncate">#{String(inv.id).slice(0, 8)}</p>
                      <p className="text-[10px] font-semibold text-slate-400">{new Date(inv.date).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-black text-slate-800">{formatCurrency(inv.total)}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleDownloadInvoice(inv)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all shadow-sm"
                        >
                          <FaDownload size={11} /> Bill
                        </button>
                        <button
                          onClick={() => {
                            const normalizedInvoice = {
                              ...inv,
                              displayId: getInvoiceDisplayNumber(inv, inv.id),
                              date: new Date(inv.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
                              amount: formatCurrency(inv.total || 0),
                              patient: patientData.name,
                              method: inv.payments?.[0]?.method || 'Digital Sync'
                            };
                            handleEmail('Invoice', normalizedInvoice);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all shadow-sm"
                        >
                          <FaEnvelope size={11} /> Email
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[12px] text-slate-400 italic">No invoices available.</p>
                {Number(patientData.billing?.completedServiceTotal || 0) > 0 && (
                  <div className="p-3 rounded-lg border border-amber-100 bg-amber-50/70">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Completed Services Total</p>
                    <p className="text-[13px] font-black text-amber-800 mt-1">
                      {formatCurrency(patientData.billing?.completedServiceTotal)}
                    </p>
                    <p className="text-[10px] font-semibold text-amber-700 mt-1">
                      Create invoice in Billing to finalize payment records.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Recent Payments</p>
            {patientData.billing?.payments?.length ? (
              <div className="space-y-2">
                {patientData.billing.payments.map((pmt) => (
                  <div key={pmt.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <FaCreditCard className="text-slate-300 shrink-0" size={12} />
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-slate-700 truncate">{pmt.method || 'Payment'}</p>
                        <p className="text-[10px] font-semibold text-slate-400">{new Date(pmt.date).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <p className="text-[12px] font-black text-emerald-600 shrink-0">{formatCurrency(pmt.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-slate-400 italic">No payments recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans">
      {/* HEADER */}
      <div className="relative bg-gradient-to-r from-[#2EA7B8] to-[#1a8fa0] rounded-2xl shadow-lg p-6 mb-6 overflow-hidden">
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-5 text-white">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/patients')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/10 shrink-0">
              <FaArrowLeft size={14} />
            </button>
            <div className="w-[60px] h-[60px] rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <PatientIcon size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span
                  className={`px-2 py-0.5 text-[10px] uppercase font-black tracking-widest rounded-md ${
                    String(patientData.status || 'Active').toLowerCase() === 'inactive'
                      ? 'bg-slate-300 text-slate-700'
                      : 'bg-emerald-400 text-emerald-950'
                  }`}
                >
                  {String(patientData.status || 'Active')}
                </span>
                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest bg-black/10 px-2 py-0.5 rounded-md border border-white/10">ID: {patientData.id}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight leading-none">{patientData.name}</h1>
            </div>
          </div>
           <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative group flex-1 md:flex-none">
              <button
                 onClick={() => navigate(`/notes/new?patientId=${patientData.id}`)}
                 disabled={!canAny(['notes.view', 'notes.manage'])}
                 className={`w-full flex items-center justify-center gap-1.5 px-4 py-2.5 border border-white/20 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all ${
                   canAny(['notes.view', 'notes.manage'])
                     ? 'bg-white/10 hover:bg-white/20 cursor-pointer'
                     : 'bg-white/5 opacity-50 cursor-not-allowed'
                 }`}
              >
                {!canAny(['notes.view', 'notes.manage']) && <FaLock size={9} className="mr-0.5" />}
                Add Note
              </button>
              {!canAny(['notes.view', 'notes.manage']) && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                  No Access
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-slate-900"></div>
                </div>
              )}
            </div>
            <div className="relative group flex-1 md:flex-none">
              <button
                onClick={() => navigate(`/appointments/book?patientId=${patientData.id}`)}
                disabled={!canAny(['appointments.view', 'appointments.manage'])}
                className={`w-full flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${
                  canAny(['appointments.view', 'appointments.manage'])
                    ? 'bg-white text-[#2EA7B8] hover:bg-slate-50 cursor-pointer'
                    : 'bg-white/60 text-[#2EA7B8]/50 opacity-50 cursor-not-allowed'
                }`}
              >
                {!canAny(['appointments.view', 'appointments.manage']) && <FaLock size={9} className="mr-0.5" />}
                Book Apt
              </button>
              {!canAny(['appointments.view', 'appointments.manage']) && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                  No Access
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-slate-900"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 mb-6 border-b border-slate-200 sticky top-0 bg-slate-50 z-10 w-full overflow-x-auto scrollbar-hide py-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold transition-all rounded-t-lg relative whitespace-nowrap ${activeTabParam === tab.id
              ? 'text-clinicPrimary bg-clinicPrimary/5'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
          >
            {tab.icon && React.cloneElement(tab.icon, { size: 14, className: activeTabParam === tab.id ? 'text-clinicPrimary' : 'text-slate-400' })}
             <span>{tab.name}</span>
            {activeTabParam === tab.id && (
              <div className="absolute bottom-0 inset-x-0 h-[3px] bg-clinicPrimary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* TABS CONTENT */}
      <div className="max-w-[1400px]">
        {!hasTabAccess(activeTabParam) || tabAccessDenied[activeTabParam] ? renderAccessDeniedTab() :
        activeTabParam === 'patient' ? renderPatientTab() :
          activeTabParam === 'appointments' ? renderAppointmentsTab() :
            activeTabParam === 'history' ? renderHistoryTab() :
              activeTabParam === 'notes' ? renderNotesTab() :
                activeTabParam === 'forms' ? renderFormsTab() :
                  activeTabParam === 'paymentDetails' ? renderPaymentDetailsTab() :
                  activeTabParam === 'clinicalHistory' ? <ClinicalHistoryTab /> :
                  activeTabParam === 'bodyChart' ? <BodyChartTab patientId={patientData.id} /> :
                  activeTabParam === 'tasks' ? <TasksTab /> :
                    activeTabParam === 'files' ? <FilesTab /> :
                      activeTabParam === 'messages' ? <MessagesTab /> :
                        activeTabParam === 'episodes' ? <EpisodesTab /> :
                          activeTabParam === 'account' ? <AccountTab patientData={patientData} onUpdate={fetchFullProfile} /> :
                            activeTabParam === 'privacy' ? <PrivacyTab patientData={patientData} onUpdate={fetchFullProfile} /> :
                              null}
      </div>

      {cancelTargetAppt && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-[16px] font-bold text-slate-800">Cancel Appointment</h3>
            </div>
            <div className="px-5 py-5">
              <p className="text-[14px] text-slate-700 font-medium">
                Do you want to cancel this appointment?
              </p>
              <p className="text-[12px] text-slate-500 mt-2">
                {cancelTargetAppt.date} {cancelTargetAppt.time ? `• ${cancelTargetAppt.time}` : ''} {cancelTargetAppt.service ? `• ${cancelTargetAppt.service}` : ''}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-white">
              <button
                onClick={() => setCancelTargetAppt(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-bold hover:bg-slate-50 transition-all"
              >
                No
              </button>
              <button
                onClick={async () => {
                  const targetId = cancelTargetAppt.id;
                  setCancelTargetAppt(null);
                  await handleCancelAppointment(targetId);
                }}
                className="px-4 py-2 rounded-lg bg-rose-500 text-white text-[12px] font-bold hover:bg-rose-600 transition-all"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedFormSubmission && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[10000] bg-slate-900/40 backdrop-blur-sm p-2 sm:p-4">
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full max-w-3xl max-h-[92vh] bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col">
              <div className="px-3 py-3 sm:px-5 sm:py-4 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[14px] sm:text-[16px] font-bold text-slate-800 truncate">{selectedFormSubmission.templateName}</h3>
                  <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 break-words">
                  {selectedFormSubmission.category} • {selectedFormSubmission.date} • {selectedFormSubmission.time}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFormSubmission(null)}
                  className="w-8 h-8 shrink-0 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all flex items-center justify-center"
                >
                  <FaTimes size={12} />
                </button>
              </div>
              <div className="p-3 sm:p-5 overflow-y-auto space-y-3 flex-1">
                {selectedFormSubmission.responses && Object.keys(selectedFormSubmission.responses).length > 0 ? (
                  Object.entries(selectedFormSubmission.responses).map(([fieldId, value], index) => (
                    <div key={fieldId} className="p-3 rounded-lg border border-slate-100 bg-slate-50/40">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 break-words">
                        {selectedFormSubmission.fieldLabelMap?.[fieldId] || selectedFormSubmission.fallbackLabels?.[index] || `Field ${index + 1}`}
                      </p>
                      {typeof value === 'string' && value.startsWith('data:image') ? (
                        <div className="bg-white border border-slate-200 rounded-lg p-2 inline-block max-w-full">
                          <img src={value} alt="Captured" className="max-h-32 sm:max-h-40 rounded max-w-full" />
                        </div>
                      ) : (
                        <p className="text-[12px] sm:text-[13px] font-semibold text-slate-700 whitespace-pre-wrap break-words">
                          {Array.isArray(value) ? value.join(', ') : (value || '-')}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[12px] text-slate-500 italic">No captured responses in this submission.</p>
                )}
              </div>
              <div className="px-3 py-3 sm:px-5 sm:py-4 border-t border-slate-100 bg-white flex justify-end gap-2">
                <button
                  onClick={() => {
                    setCurrentExport({ type: 'Form', data: selectedFormSubmission });
                    handleExport('Form');
                  }}
                  className="px-4 py-2 rounded-lg bg-clinicPrimary text-white text-[12px] font-bold hover:bg-clinicPrimary/90 transition-all flex items-center gap-2"
                >
                  <FaDownload size={10} /> Download
                </button>
                <button
                  onClick={() => {
                    setCurrentExport({ type: 'Form', data: selectedFormSubmission });
                    handleEmail('Form');
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <FaEnvelope size={10} /> Email
                </button>
                <button
                  onClick={() => setSelectedFormSubmission(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[12px] font-bold hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* HIDDEN EXPORT TEMPLATES - REBUILT TO MATCH REAL PAGES */}
      <div className="fixed -left-[5000px] top-0 pointer-events-none">
        {currentExport && (
          <div id="clinical-export-template" className="w-[800px] bg-white p-12 pt-16 font-sans text-slate-800">
            {currentExport.type === 'Note' ? (
              /* EXACT REPLICATION OF ViewNote.jsx */
              <div className="space-y-6">
                <div className="flex flex-col gap-4 mb-6">
                  <h1 className="text-[26px] font-black text-slate-900 tracking-tight leading-none uppercase">Review Clinical Note</h1>
                  <div className="flex items-center gap-3 h-6">
                    <span className="inline-flex items-center justify-center px-2 py-1 bg-clinicPrimary/10 text-clinicPrimary rounded text-[9px] font-black uppercase tracking-widest border border-clinicPrimary/20 leading-none">
                      {currentExport.data.type}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase leading-none">
                      {currentExport.data.date} • {new Date(currentExport.data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="p-8 border border-slate-100 rounded-3xl shadow-sm bg-white space-y-8 relative overflow-hidden">
                  <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100/50 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-clinicPrimary shadow-sm shrink-0">
                        <PatientIcon size={24} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Patient</p>
                        <p className="text-[14px] font-black text-slate-900 tracking-tight leading-none">{patientData.name}</p>
                      </div>
                    </div>
                    <div className="w-px h-10 bg-slate-200"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                        <ClinicalNoteIcon size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Attending Clinician</p>
                        <p className="text-[11px] font-extrabold text-slate-700 tracking-tight leading-none">{currentExport.data.author}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 pt-2">
                    {/* DYNAMIC CONTENT RENDERING - AS SEEN IN ViewNote.jsx */}
                    {currentExport.data.dynamicContent && currentExport.data.dynamicContent.layouts ? (
                      <div className="space-y-6">
                        {currentExport.data.dynamicContent.layouts.map((layout, lIdx) => (
                          <div key={lIdx} className="space-y-4">
                            <div className={`grid gap-6 ${layout.type === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                              {layout.fields.map((field, fIdx) => {
                                if (!field) return null;
                                
                                // Helper function to get field label
                                const getLabel = (f) => f.label || f.title || f.name || f.placeholder || (f.id ? String(f.id).replace(/[_-]+/g, ' ').toUpperCase() : 'Untitled Section');
                                
                                // Helper to get value
                                const getVal = (responses, f) => {
                                  if (!responses) return '-';
                                  return responses[f.id] || responses[f.label] || responses[f.name] || '-';
                                };

                                if (field.type === 'heading') return <h3 key={field.id} className="text-sm font-black text-slate-800 tracking-tight pt-2 border-b border-slate-100 pb-1 w-full col-span-full">{getLabel(field)}</h3>;
                                if (field.type === 'helper_text') return <p key={field.id} className="text-[11px] text-slate-400 italic font-medium col-span-full">{getLabel(field)}</p>;
                                if (field.type === 'horizontal_line') return <hr key={field.id} className="border-slate-100 col-span-full" />;

                                const value = getVal(currentExport.data.dynamicContent.responses, field);

                                return (
                                  <div key={field.id} className="space-y-1.5 p-4 rounded-2xl bg-slate-50/30 border border-slate-100/50">
                                    <h4 className="text-[9px] font-black text-slate-400 tracking-widest flex items-center gap-2">
                                      {getLabel(field)}
                                    </h4>
                                    {field.type === 'signature' || (typeof value === 'string' && value.startsWith('data:image')) ? (
                                      <div className="bg-white border border-slate-100 rounded-xl p-2 mt-2 inline-block">
                                        <img src={value} alt="Signature" className="max-h-32 object-contain" />
                                      </div>
                                    ) : (
                                      <p className="text-[13px] font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {Array.isArray(value) ? value.join(', ') : (value || '-')}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* SOAP NOTE FALLBACK */
                      <div className="space-y-8">
                        {[
                          { label: 'Subjective Findings', value: currentExport.data.subjective },
                          { label: 'Objective Assessment', value: currentExport.data.objective },
                          { label: 'Clinical Assessment', value: currentExport.data.assessment },
                          { label: 'Treatment Plan & Next Steps', value: currentExport.data.plan }
                        ].map((section, idx) => section.value && (
                          <div key={idx} className="space-y-3">
                            <h4 className="text-[9px] font-black text-clinicPrimary uppercase tracking-[0.25em] flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-clinicPrimary"></div> {section.label}
                            </h4>
                            <p className={`text-[12px] font-medium leading-relaxed p-4 rounded-lg border border-slate-100 ${idx === 0 ? 'bg-slate-50 italic text-slate-600' : 'bg-white text-slate-700 shadow-sm'}`}>
                              {idx === 0 ? `"${section.value}"` : section.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : currentExport.type === 'Form' ? (
              /* EXACT REPLICATION OF FORM MODAL */
              <div className="w-full bg-white flex flex-col">
                <div className="px-5 py-8 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between gap-3 rounded-t-2xl">
                  <div className="min-w-0">
                    <h3 className="text-[24px] font-black text-slate-800 truncate leading-tight">{currentExport.data.templateName}</h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2 break-words">
                      {currentExport.data.category} • {currentExport.data.date} • {currentExport.data.time}
                    </p>
                  </div>
                </div>
                <div className="p-8 space-y-4">
                   {/* Patient Info Context for Form */}
                   <div className="mb-6 p-4 bg-clinicPrimary/5 rounded-xl border border-clinicPrimary/10">
                      <p className="text-[9px] font-black text-clinicPrimary uppercase tracking-widest mb-1">Patient Name</p>
                      <p className="text-[14px] font-bold text-slate-800">{patientData.name}</p>
                   </div>
                   
                  {currentExport.data.responses && Object.keys(currentExport.data.responses).length > 0 ? (
                    Object.entries(currentExport.data.responses).map(([fieldId, value], index) => (
                      <div key={fieldId} className="p-4 rounded-xl border border-slate-100 bg-slate-50/40">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 break-words">
                          {currentExport.data.fieldLabelMap?.[fieldId] || currentExport.data.fallbackLabels?.[index] || `Field ${index + 1}`}
                        </p>
                        {typeof value === 'string' && value.startsWith('data:image') ? (
                          <div className="bg-white border border-slate-200 rounded-lg p-2 inline-block max-w-full">
                            <img src={value} alt="Captured" className="max-h-40 rounded max-w-full" />
                          </div>
                        ) : (
                          <p className="text-[13px] font-semibold text-slate-700 whitespace-pre-wrap break-words">
                            {Array.isArray(value) ? value.join(', ') : (value || '-')}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[12px] text-slate-500 italic">No captured responses in this submission.</p>
                  )}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-slate-400 px-2">
                  <p className="text-[9px] font-black uppercase tracking-widest">Verified Digital Assessment • DeePhysio</p>
                  <p className="text-[9px] font-bold uppercase">{new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ) : currentExport.type === 'Invoice' ? (
               /* EXACT REPLICATION OF Billing.jsx INVOICE */
               <div className="bg-white p-14 w-full min-h-[1131px] flex flex-col relative overflow-hidden font-sans">
                  {/* Invoice Header */}
                  <div className="flex justify-between gap-8 pb-10 border-b border-slate-100">
                    <InvoiceClinicHeader profile={clinicProfile} />
                    <div className="text-right">
                      <div className={`inline-block px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm mb-8 ${
                        currentExport.data.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        currentExport.data.status === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {currentExport.data.status} Status
                      </div>
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2 leading-none uppercase">Temporal Node</div>
                      <div className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{currentExport.data.date}</div>
                      <div className="text-[11px] font-black text-clinicPrimary uppercase tracking-widest mt-2 leading-none">{currentExport.data.displayId}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 py-10">
                    <div className="space-y-4">
                      <p className="text-[11px] font-black text-clinicPrimary uppercase tracking-[0.5em] leading-none">Billed subject</p>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-3">{currentExport.data.patient}</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                          Verified Medical Client<br />
                          Method: {currentExport.data.method}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-50 mt-4 mb-10">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-3">Description of Medical Service</th>
                          <th className="px-8 py-3 text-center">Unit</th>
                          <th className="px-8 py-3 text-right">Valuation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-700">
                        {currentExport.data.items && currentExport.data.items.length > 0 ? currentExport.data.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-8 py-1.5">
                              <h5 className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-tight">{item.service}</h5>
                            </td>
                            <td className="px-8 py-1.5 text-center text-[12px] font-black text-slate-500">{item.qty}.00</td>
                            <td className="px-8 py-1.5 text-right text-[13px] font-black text-slate-900">{formatCurrency(item.rate * item.qty)}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td className="px-8 py-1.5">
                              <h5 className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-tight">Physiotherapy Specialist Assessment</h5>
                            </td>
                            <td className="px-8 py-1.5 text-center text-[12px] font-black text-slate-500">1.00</td>
                            <td className="px-8 py-1.5 text-right text-[13px] font-black text-slate-900">{currentExport.data.amount}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-10 border-t border-slate-100">
                    <div className="w-full md:w-80 space-y-4">
                      {(() => {
                        const totalNum = parseFloat(String(currentExport.data.amount || 0).replace(/[^0-9.-]+/g, '')) || 0;
                        return (
                          <>
                            <div className="flex justify-between items-center text-slate-400">
                              <span className="text-[10px] font-black uppercase tracking-widest">Net Provision</span>
                              <span className="text-[14px] font-bold text-slate-600">{formatCurrency(totalNum * 0.8)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span className="text-[10px] font-black uppercase tracking-widest">VAT (20%)</span>
                              <span className="text-[14px] font-bold text-slate-600">{formatCurrency(totalNum * 0.2)}</span>
                            </div>
                          </>
                        );
                      })()}
                      <div className="flex justify-between items-center py-6 px-10 bg-slate-900 text-white rounded-2xl -mx-4 shadow-xl">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">Total Bill</span>
                        <span className="text-3xl font-black tracking-tighter leading-none">{currentExport.data.amount}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-10 text-center border-t border-slate-50">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Verified Clinical Transaction • DeePhysio Ledger</p>
                  </div>
               </div>
            ) : currentExport.type === 'Appointments' ? (
              <div className="space-y-6">
                 {/* Re-use simplified ledger for tabular data if it fits the theme, but keep it clean */}
                  <div className="flex items-center gap-3 border-b-2 border-clinicPrimary pb-6 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-clinicPrimary text-white flex items-center justify-center font-black text-xl">DP</div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Appointment History</h2>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                        <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Provision</th>
                        <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentExport.data.map((apt, idx) => (
                        <tr key={idx}>
                          <td className="px-5 py-5 text-[13px] font-bold text-slate-800">{apt.date} <span className="text-slate-400 font-medium ml-2">{apt.time}</span></td>
                          <td className="px-5 py-5 text-[13px] font-bold text-slate-700">{apt.service}</td>
                          <td className="px-5 py-5 text-center text-[10px] font-black uppercase text-slate-500">{apt.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            ) : currentExport.type === 'Medical History' ? (
              <div className="space-y-8">
                  <div className="flex items-center gap-3 border-b-2 border-teal-500 pb-6 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center font-black text-xl"><MedicalHistoryIcon size={24} /></div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Medical History Record</h2>
                  </div>
                  <div className="space-y-6">
                    {currentExport.data.map((section, idx) => (
                      <div key={idx} className="space-y-2">
                        <h4 className="text-[10px] font-black text-teal-600 uppercase tracking-widest">{section.title}</h4>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[13px] font-medium text-slate-700 whitespace-pre-wrap min-h-[40px]">
                          {section.content || 'No records found.'}
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {isExporting && (
        <div className="fixed inset-0 z-[20000] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-xs w-full animate-in zoom-in duration-300">
            <div className="w-12 h-12 border-4 border-clinicPrimary border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-tight mb-1">Generating Ledger</h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Please wait while we synchronize clinical data into a professional record.</p>
            </div>
          </div>
        </div>
      )}
      {/* EMAIL MODAL */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        type={emailModalConfig.type}
        data={emailModalConfig.data}
        patientId={patientData.id}
        patientName={patientData.name}
        patientEmail={patientData.email}
      />
    </div>
  );
};

export default PatientProfile;
