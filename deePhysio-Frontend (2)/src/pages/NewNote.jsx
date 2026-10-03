import React, { useState, useEffect, useRef } from 'react';
import {
    FaSave, FaTimes, FaPlus, FaCopy, FaHistory, FaInfoCircle, FaFileAlt, FaCheck,
    FaRegLightbulb, FaUserMd, FaChevronDown, FaGripVertical, FaTrashAlt, FaChevronUp,
    FaMagic, FaArrowLeft, FaSearch, FaHeading, FaMinus, FaCalendarAlt, FaPenNib, FaCaretDown, FaEnvelope
} from 'react-icons/fa';
import EmailModal from '../components/ui/EmailModal';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import PatientIcon from '../components/ui/PatientIcon';
import { useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';
import Modal from '../components/ui/Modal';

const BASE_NOTE_TYPES = ['Initial Assessment', 'Progress Report', 'Discharge Summary', 'Referral Note'];

const INITIAL_TEMPLATES = [
    {
        id: 1,
        name: 'Standard SOAP Note',
        category: 'Physiotherapy',
        sections: [
            { id: 101, title: 'Subjective', placeholder: 'Knee pain, onset, VAS 0-10...' },
            { id: 102, title: 'Objective', placeholder: 'ROM flexion/extension, palpation...' },
            { id: 103, title: 'Assessment', placeholder: 'Clinical diagnosis, progress...' },
            { id: 104, title: 'Plan', placeholder: 'Treatment, HEP, next visit...' }
        ]
    },
    {
        id: 2,
        name: 'Initial Assessment',
        category: 'Clinical',
        sections: [
            { id: 201, title: 'Medical History', placeholder: 'Past surgeries, conditions...' },
            { id: 202, title: 'Goal Setting', placeholder: 'Patient goals, expected outcomes...' },
            { id: 203, title: 'Physical Exam', placeholder: 'Specific clinical tests...' }
        ]
    },
    {
        id: 3,
        name: 'Post-Op Follow-up',
        category: 'Rehabilitation',
        sections: [
            { id: 301, title: 'Surgical Status', placeholder: 'Wound healing, protocol stage...' },
            { id: 302, title: 'Mobility', placeholder: 'Aids used, gait pattern...' }
        ]
    },
    { id: 4, name: 'Wellness Check', category: 'Prevention', sections: [{ id: 401, title: 'General Vitals', placeholder: 'HR, BP, etc.' }] },
    { id: 5, name: 'Sports Massage Report', category: 'Manual Therapy', sections: [{ id: 501, title: 'Soft Tissue State', placeholder: 'Tension, trigger points...' }] },
    { id: 6, name: 'Discharge Summary', category: 'Final', sections: [{ id: 601, title: 'Outcome Measures', placeholder: 'Final scores, recommendations...' }] },
];

const NewNote = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const patientParam = searchParams.get('patientId');
    const { showToast } = useToast();
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [patientInfo, setPatientInfo] = useState(null);

    const [patients, setPatients] = useState([]);
    const [isLoadingPatients, setIsLoadingPatients] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [noteType, setNoteType] = useState(BASE_NOTE_TYPES[0]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [allTemplates, setAllTemplates] = useState([]);
    const [currentTemplate, setCurrentTemplate] = useState(null);

    const [notes, setNotes] = useState({
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        extra: {}
    });
    const [dynamicResponses, setDynamicResponses] = useState({});

    const [customNoteTypes, setCustomNoteTypes] = useState([]);
    const [isAddingType, setIsAddingType] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [isNoteTypeOpen, setIsNoteTypeOpen] = useState(false);
    const noteTypeRef = useRef(null);

    const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const patientDropdownRef = useRef(null);

    const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase()));
    const toPrettyLabel = (raw = '') =>
        String(raw || '')
            .replace(/[_-]+/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .trim()
            .replace(/\b\w/g, (c) => c.toUpperCase());
    const getFieldLabel = (field, fallback = 'Untitled Section') =>
        field?.label ||
        field?.title ||
        field?.name ||
        field?.placeholder ||
        (field?.id ? toPrettyLabel(field.id) : fallback);

    const normalizeDynamicContent = (raw) => {
        if (!raw) return null;
        let parsed = raw;
        if (typeof parsed === 'string') {
            try {
                parsed = JSON.parse(parsed);
            } catch (e) {
                return null;
            }
        }
        if (!parsed || typeof parsed !== 'object') return null;
        const layouts = Array.isArray(parsed.layouts) ? parsed.layouts : [];
        const responseCandidates = [
            parsed.responses,
            parsed.values,
            parsed.dynamicResponses,
            parsed.response
        ];
        const picked = responseCandidates.find((item) => item && typeof item === 'object') || {};
        const responses =
            picked.values && typeof picked.values === 'object'
                ? picked.values
                : picked;
        if (!layouts.length) return null;
        return { layouts, responses };
    };

    const normalizeTemplateContent = (template) => {
        const raw = typeof template.content === 'string'
            ? (() => { try { return JSON.parse(template.content); } catch { return null; } })()
            : template.content;

        if (raw?.layouts && Array.isArray(raw.layouts)) {
            return {
                ...raw,
                layouts: raw.layouts.map((layout) => ({
                    ...layout,
                    fields: (layout.fields || []).map((field) => {
                        if (!field) return null;
                        if (field.type === 'signature') return null;
                        return field;
                    })
                }))
            };
        }

        const legacySections = Array.isArray(raw)
            ? raw
            : (Array.isArray(template.sections) ? template.sections : []);

        return {
            layouts: legacySections.map((section, index) => ({
                id: `legacy_layout_${template.id}_${index}`,
                type: 'full',
                fields: [{
                    id: `legacy_field_${template.id}_${index}`,
                    type: 'text',
                    label: section.title || `Section ${index + 1}`,
                    required: false,
                    placeholder: section.placeholder || '',
                    options: []
                }]
            }))
        };
    };



    const loadTemplates = async () => {
        try {
            const res = await fetchApi('/note-templates');
            if (res && res.ok) {
                const data = await res.json();
                if (data.success) {
                    const dbTemplates = data.data.map(t => {
                        const normalizedContent = normalizeTemplateContent(t);
                        return {
                            ...t,
                            name: t.title || t.name || 'Untitled Template',
                            content: normalizedContent,
                            __source: 'db',
                            __optionValue: `db-${t.id}`
                        };
                    });
                    const defaultTemplates = INITIAL_TEMPLATES.map((t) => ({
                        ...t,
                        content: normalizeTemplateContent(t),
                        __source: 'default',
                        __optionValue: `default-${t.id}`
                    }));
                    setAllTemplates([...defaultTemplates, ...dbTemplates]);
                }
            }

            const req = await fetchApi('/settings');
            if (req && req.ok) {
                const settingsData = await req.json();
                const customTypes =
                    settingsData?.data?.deephysio_custom_note_types ??
                    settingsData?.data?.deephysioCustomNoteTypes;
                if (settingsData.success && customTypes) {
                    setCustomNoteTypes(customTypes);
                }
            }
        } catch (err) {
            setAllTemplates(INITIAL_TEMPLATES);
        }
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    useEffect(() => {
        if (!allTemplates.length) return;
        const selectedTemplateId = location.state?.selectedTemplate;
        if (!selectedTemplateId) return;

        const matchedTemplate = allTemplates.find((t) => String(t.id) === String(selectedTemplateId));
        if (matchedTemplate) {
            handleApplyTemplate(matchedTemplate);
        }
    }, [allTemplates, location.state]);

    const [pendingLoadedNote, setPendingLoadedNote] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [isLoading, setIsLoading] = useState(id ? true : false);

    const fetchPatientDetails = async (pId) => {
        if (!pId) return;
        try {
            const res = await fetchApi(`/patients/${pId}`);
            if (res && res.ok) {
                const result = await res.json();
                if (result.success) setPatientInfo(result.data);
            }
        } catch (e) {
            console.error('Failed to fetch patient details:', e);
        }
    };

    const fetchPatientsData = async () => {
        setIsLoadingPatients(true);
        try {
            const response = await fetchApi('/patients');
            if (!response) return;
            const resData = await response.json();

            if (resData.success) {
                const uniquePatients = resData.data.map(p => ({
                    id: p.id,
                    name: `${p.firstName || p.first_name} ${p.lastName || p.last_name}`.trim()
                }));

                setPatients(uniquePatients);

                // Auto-select patient from URL if present
                if (patientParam) {
                    const current = uniquePatients.find(p => String(p.id) === String(patientParam));
                    if (current) {
                        setSelectedPatient(current.id);
                        fetchPatientDetails(current.id);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch patients:', error);
            showToast('Failed to load patient list.', 'error');
        } finally {
            setIsLoadingPatients(false);
        }
    };

    const fetchNoteData = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const response = await fetchApi(`/clinical-notes/${id}`);
            if (!response) return;
            const resData = await response.json();

            if (resData.success) {
                const note = resData.data;
                setPendingLoadedNote(note);
                showToast('Clinical record loaded successfully.', 'success');
            }
        } catch (error) {
            showToast('Failed to load clinical note.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize patients & Load Existing Note from Backend
    useEffect(() => {
        fetchPatientsData();
        fetchNoteData();
    }, [id, patientParam]);

    // Hydrate template after both note data and templates are available
    useEffect(() => {
        if (!pendingLoadedNote || allTemplates.length === 0) return;

        const note = pendingLoadedNote;
        const normalizedDynamic = normalizeDynamicContent(note.dynamicContent ?? note.dynamic_content);

        setNotes({
            subjective: note.subjective || '',
            objective: note.objective || '',
            assessment: note.assessment || '',
            plan: note.plan || '',
            extra: {}
        });
        setSelectedPatient(note.patientId || note.patient_id || '');
        setNoteType(note.type || BASE_NOTE_TYPES[0]);

        if (normalizedDynamic) {
            // Try to find the original template from the library by matching the name with note.type
            const matchedTemplate = allTemplates.find(t => t.name.toLowerCase() === (note.type || '').toLowerCase());

            if (matchedTemplate) {
                setCurrentTemplate(matchedTemplate);
                setSelectedTemplate(matchedTemplate.__optionValue);
            } else {
                const hydratedTemplate = {
                    id: `saved-${note.id}`,
                    name: note.type || 'Saved Template',
                    content: normalizedDynamic
                };
                setCurrentTemplate(hydratedTemplate);
                setSelectedTemplate('');
            }
            setDynamicResponses(normalizedDynamic.responses || {});
        } else {
            // Legacy notes (without dynamic content) should still remain editable in SOAP format.
            setCurrentTemplate(INITIAL_TEMPLATES[0]);
            setSelectedTemplate(INITIAL_TEMPLATES[0].__optionValue);
            setDynamicResponses({});
        }

        // Only run once
        setPendingLoadedNote(null);
    }, [pendingLoadedNote, allTemplates]);

    // Hydrated draft logic removed to align with "No localStorage logic" requirement
    // Only real backend data or fresh starts are allowed now.

    const handleApplyTemplate = (template) => {
        if (!template) return;
        setCurrentTemplate(template);
        setSelectedTemplate(template.__optionValue || String(template.id));

        // Map sections to SOAP state
        const newNotes = { subjective: '', objective: '', assessment: '', plan: '', extra: {} };
        const newDynamic = {};

        if (template.content?.layouts) {
            // Initialize dynamic responses for new format
            template.content.layouts.forEach(layout => {
                layout.fields.forEach(field => {
                    if (field) {
                        if (field.type === 'signature') return;
                        if (field.type === 'checkbox') newDynamic[field.id] = [];
                        else newDynamic[field.id] = '';
                    }
                });
            });
        } else if (template.sections) {
            template.sections.forEach((s, idx) => {
                const content = s.placeholder ? `(${s.title}): ` : '';
                if (idx === 0) newNotes.subjective = content;
                else if (idx === 1) newNotes.objective = content;
                else if (idx === 2) newNotes.assessment = content;
                else if (idx === 3) newNotes.plan = content;
                else newNotes.extra[s.id] = content;
            });
        }

        setNotes(newNotes);
        setDynamicResponses(newDynamic);
        showToast(`${template.name} template applied`, 'success');
    };

    const handleSave = async (status) => {
        if (!selectedPatient) {
            showToast('Please select a patient first.', 'error');
            return;
        }

        const isManual = false; // Feature removed as per user request

        const dynamicHasData = Object.values(dynamicResponses || {}).some((value) => {
            if (typeof value === 'string') return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            return value !== null && value !== undefined;
        });

        // Validation: For "Completed" notes, ensure at least some data exists
        if (status === 'Completed') {
            const hasData = [
                notes.subjective,
                notes.objective,
                notes.assessment,
                notes.plan,
                ...Object.values(notes.extra)
            ].some(v => typeof v === 'string' && v.trim().length > 0);

            if (!hasData && !dynamicHasData) {
                showToast('At least one clinical finding is required to complete the note.', 'error');
                return;
            }
        }

        setIsSaving(true);
        try {
            const storedUser = sessionStorage.getItem('deephysio_user');
            const loggedInUser = storedUser ? JSON.parse(storedUser) : null;
            const userRole = sessionStorage.getItem('deephysio_role');

            if (!loggedInUser) {
                showToast('Authentication error. Please login again.', 'error');
                return;
            }

            const dynamicPayload = currentTemplate?.content?.layouts ? {
                layouts: currentTemplate.content.layouts,
                responses: dynamicResponses
            } : dynamicResponses;

            const extraNotes = notes.extra || {};
            const basePayload = {
                type: noteType,
                date: new Date().toISOString(),
                status: status,
                subjective: notes.subjective,
                objective: isManual ? '' : notes.objective,
                assessment: isManual ? '' : notes.assessment,
                plan: isManual ? '' : (notes.plan + (Object.keys(extraNotes).length > 0 ? "\n\n" + Object.values(extraNotes).join("\n") : "")),
                dynamic_content: dynamicPayload
            };

            // Backend update validation blocks patientId/therapistId on PUT.
            // Keep those fields only for create payload.
            const pId = parseInt(selectedPatient, 10);
            const tId = parseInt(loggedInUser.id, 10);

            if (isNaN(pId) || isNaN(tId)) {
                showToast('Invalid session or patient data. Please refresh.', 'error');
                setIsSaving(false);
                return;
            }

            const payload = id
                ? basePayload
                : {
                    ...basePayload,
                    patientId: pId,
                    therapistId: tId
                };

            const url = id ? `/clinical-notes/${id}` : '/clinical-notes';
            const method = id ? 'PUT' : 'POST';

            let response = await fetchApi(url, {
                method,
                body: JSON.stringify(payload)
            });

            // Backward compatibility: some deployed backends validate camelCase key.
            if (response && response.status === 400) {
                const firstErr = await response.clone().json().catch(() => ({}));
                const msg = String(firstErr?.message || '');
                if (msg.includes('"dynamic_content" is not allowed')) {
                    const fallbackPayload = { ...payload, dynamicContent: dynamicPayload };
                    delete fallbackPayload.dynamic_content;
                    response = await fetchApi(url, {
                        method,
                        body: JSON.stringify(fallbackPayload)
                    });
                }
            }

            if (!response) return;
            const resData = await response.json();

            if (resData.success) {
                showToast(status === 'Completed' ? 'Clinical note finalized.' : 'Draft saved to database.', 'success');
                navigate(`/patients/profile/${selectedPatient}?tab=notes`);
            } else {
                showToast(resData.message || 'Failed to save note.', 'error');
            }
        } catch (error) {
            showToast('Server error while saving note.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNewType = async () => {
        const trimmed = newTypeName.trim();
        if (!trimmed) {
            showToast('Note type name cannot be empty', 'error');
            return;
        }
        if (BASE_NOTE_TYPES.includes(trimmed) || customNoteTypes.includes(trimmed)) {
            showToast('Type already exists', 'error');
            return;
        }

        const updated = [...customNoteTypes, trimmed];
        try {
            const res = await fetchApi('/settings', {
                method: 'POST',
                body: JSON.stringify({
                    settings: {
                        deephysio_custom_note_types: updated
                    }
                })
            });
            if (!res) return;
            const data = await res.json();
            if (!data.success) {
                showToast(data.message || 'Failed to save note type', 'error');
                return;
            }

            setCustomNoteTypes(updated);
            setNoteType(trimmed);
            setNewTypeName('');
            setIsAddingType(false);
            showToast(`New type "${trimmed}" created`, 'success');
        } catch (error) {
            showToast('Failed to save note type', 'error');
        }
    };

    const handleDeleteCustomType = async (typeToDelete) => {
        const updated = customNoteTypes.filter(t => t !== typeToDelete);
        try {
            const res = await fetchApi('/settings', {
                method: 'POST',
                body: JSON.stringify({
                    settings: {
                        deephysio_custom_note_types: updated
                    }
                })
            });
            if (!res) return;
            const data = await res.json();
            if (!data.success) {
                showToast(data.message || 'Failed to delete note type', 'error');
                return;
            }

            setCustomNoteTypes(updated);
            if (noteType === typeToDelete) setNoteType(BASE_NOTE_TYPES[0]);
            showToast(`Type "${typeToDelete}" deleted`, 'success');
        } catch (error) {
            showToast('Failed to delete note type', 'error');
        }
    };

    useEffect(() => {
        const onClickOutside = (e) => {
            if (noteTypeRef.current && !noteTypeRef.current.contains(e.target)) {
                setIsNoteTypeOpen(false);
            }
            if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target)) {
                setIsPatientDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);



    return (
        <div className="p-3 sm:p-4 max-w-5xl mx-auto space-y-4 animate-fade-in font-sans custom-scrollbar pb-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/notes')} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-clinicPrimary hover:bg-clinicPrimary/5 transition-all shadow-sm">
                        <FaArrowLeft size={12} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none uppercase">
                            {id ? 'Edit Clinical Note' : 'New Clinical Note'}
                        </h1>
                        {lastSaved && <p className="text-[9px] font-medium text-emerald-500 mt-1 flex items-center gap-1"><FaCheck size={8} /> Auto-saved: {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                    </div>
                </div>
            </div>

            {isLoading || pendingLoadedNote !== null ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 border-4 border-clinicPrimary/20 border-t-clinicPrimary rounded-full animate-spin mb-4" />
                    <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Loading Note Data...</p>
                </div>
            ) : (
                <>
                    {/* Top Control Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Card className="bg-white p-3 space-y-2 border-slate-100 shadow-sm">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <PatientIcon className="text-clinicPrimary" size={9} /> Patient
                            </label>
                            <div ref={patientDropdownRef} className="relative group">
                                <div
                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary transition-all cursor-pointer flex items-center justify-between min-h-[34px]"
                                    onClick={() => {
                                        if (!isLoadingPatients) setIsPatientDropdownOpen(!isPatientDropdownOpen);
                                    }}
                                >
                                    <span className={selectedPatient ? '' : 'text-slate-400 font-medium'}>
                                        {isLoadingPatients ? 'Loading patients...' :
                                            (selectedPatient ? (patients.find(p => p.id === selectedPatient)?.name || 'Unknown') : 'Select patient...')}
                                    </span>
                                    <FaChevronDown size={9} className={`text-slate-400 transition-transform ${isPatientDropdownOpen ? 'rotate-180' : ''} group-hover:text-clinicPrimary`} />
                                </div>

                                {isPatientDropdownOpen && (
                                    <div className="absolute z-40 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[250px] animate-fade-in">
                                        <div className="p-2 border-b border-slate-100 sticky top-0 bg-white">
                                            <div className="relative">
                                                <FaSearch size={10} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
                                                <input
                                                    type="text"
                                                    placeholder="Search patient..."
                                                    value={patientSearch}
                                                    onChange={(e) => setPatientSearch(e.target.value)}
                                                    className="w-full pl-7 pr-2 py-1.5 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-clinicPrimary focus:ring-1 focus:ring-clinicPrimary transition-all placeholder:font-medium"
                                                    onClick={e => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                        </div>
                                        <div className="overflow-y-auto custom-scrollbar flex-1 p-1">
                                            {filteredPatients.length > 0 ? filteredPatients.map(p => (
                                                <div
                                                    key={p.id}
                                                    className={`px-3 py-2 text-[12px] font-bold cursor-pointer rounded-md transition-all ${selectedPatient == p.id ? 'bg-clinicPrimary text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50 hover:text-clinicPrimary'
                                                        }`}
                                                    onClick={() => {
                                                        setSelectedPatient(p.id);
                                                        setIsPatientDropdownOpen(false);
                                                        setPatientSearch('');
                                                        // Fetch patient details for email modal
                                                        fetchPatientDetails(p.id);
                                                    }}
                                                >
                                                    {p.name}
                                                </div>
                                            )) : (
                                                <div className="px-3 py-4 text-center text-[10px] text-slate-400 italic">No patients found</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card className="bg-white p-3 space-y-2 border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ClinicalNoteIcon className="text-indigo-400" size={20} /> Note Type
                                </label>
                                <button
                                    onClick={() => setIsAddingType(true)}
                                    className="p-1 px-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-600 hover:text-white transition-all text-[8px] font-black uppercase tracking-tighter flex items-center gap-1"
                                >
                                    <FaPlus size={7} /> Add New
                                </button>
                            </div>
                            <div ref={noteTypeRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsNoteTypeOpen(prev => !prev)}
                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary transition-all cursor-pointer flex items-center justify-between"
                                >
                                    <span>{noteType}</span>
                                    <FaChevronDown size={9} className={`text-slate-400 transition-transform ${isNoteTypeOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isNoteTypeOpen && (
                                    <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                                        {[...BASE_NOTE_TYPES, ...customNoteTypes].map(type => (
                                            <div
                                                key={type}
                                                className={`flex items-center justify-between px-3 py-1.5 text-[12px] font-medium cursor-pointer ${noteType === type ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                onClick={() => {
                                                    setNoteType(type);
                                                    setIsNoteTypeOpen(false);
                                                }}
                                            >
                                                <span>{type}</span>
                                                {customNoteTypes.includes(type) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteCustomType(type);
                                                        }}
                                                        className={`w-5 h-5 rounded flex items-center justify-center ${noteType === type ? 'text-white hover:bg-white/20' : 'text-rose-500 hover:bg-rose-50'
                                                            }`}
                                                        title={`Delete ${type}`}
                                                    >
                                                        <FaTrashAlt size={9} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card className="bg-white p-3 space-y-2 border-slate-100 shadow-sm border-l-2 border-l-amber-400">
                            <div className="flex items-center justify-between">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FaMagic className="text-amber-400" size={9} /> Clinical Library ({allTemplates.length})
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative group flex-1">
                                    <select
                                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-800 outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary transition-all cursor-pointer appearance-none"
                                        value={selectedTemplate}
                                        onChange={(e) => {
                                            const template = allTemplates.find(
                                                (t) => (t.__optionValue || String(t.id)) === e.target.value
                                            );
                                            handleApplyTemplate(template);
                                        }}
                                    >
                                        <option value="" disabled>Select a structure...</option>
                                        {allTemplates.map(t => (
                                            <option
                                                key={`${t.__source || 'template'}-${t.id}`}
                                                value={t.__optionValue || String(t.id)}
                                            >
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                    <FaChevronDown size={9} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Data Entry Area - Dynamic Grid */}
                    <Card className="bg-white shadow-xl shadow-slate-200/40 border-slate-200/60 overflow-hidden">
                        <div className="divide-y divide-slate-100 italic">
                            <div className="p-3 bg-slate-50/50 flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <FaFileAlt size={12} className="text-clinicPrimary" /> Structure: {currentTemplate?.name || 'Select a structure'}
                                </p>
                            </div>

                            {!currentTemplate ? (
                                <div className="p-8 text-center bg-slate-50/30">
                                    <p className="text-[12px] font-bold text-slate-600">Please select a structure from Clinical Library to start note writing.</p>
                                </div>
                            ) : currentTemplate?.content?.layouts ? (
                                <div className="p-1 space-y-4 bg-slate-50/30">
                                    {currentTemplate.content.layouts.map((layout, lIdx) => (
                                        <div key={layout.id} className={`grid gap-4 p-4 ${layout.type === 'split' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} ${lIdx !== 0 ? 'border-t border-slate-100' : ''}`}>
                                            {layout.fields.map((field, fIdx) => {
                                                if (!field) return <div key={fIdx} />;
                                                if (field.type === 'signature') return <div key={fIdx} />;

                                                return (
                                                    <div key={field.id} className="space-y-2">
                                                        {field.type === 'heading' ? (
                                                            <h3 className="text-sm font-black text-slate-800 tracking-tight pt-2">{getFieldLabel(field)}</h3>
                                                        ) : field.type === 'helper_text' ? (
                                                            <p className="text-[11px] text-slate-500 italic font-medium leading-relaxed">{getFieldLabel(field, 'Note')}</p>
                                                        ) : field.type === 'horizontal_line' ? (
                                                            <hr className="border-slate-200" />
                                                        ) : (
                                                            <>
                                                                <label className="text-[10px] font-black text-slate-500 tracking-widest flex items-center gap-2">
                                                                    {getFieldLabel(field)} {field.required && <span className="text-rose-500 text-[12px]">*</span>}
                                                                </label>

                                                                {field.type === 'short' && (
                                                                    <input
                                                                        type="text"
                                                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-clinicPrimary focus:ring-4 focus:ring-clinicPrimary/5 transition-all"
                                                                        placeholder={field.placeholder}
                                                                        value={dynamicResponses[field.id] || ''}
                                                                        onChange={(e) => setDynamicResponses({ ...dynamicResponses, [field.id]: e.target.value })}
                                                                    />
                                                                )}

                                                                {field.type === 'text' && (
                                                                    <textarea
                                                                        className="w-full min-h-[100px] px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-clinicPrimary focus:ring-4 focus:ring-clinicPrimary/5 transition-all resize-y"
                                                                        placeholder={field.placeholder}
                                                                        value={dynamicResponses[field.id] || ''}
                                                                        onChange={(e) => setDynamicResponses({ ...dynamicResponses, [field.id]: e.target.value })}
                                                                    />
                                                                )}

                                                                {field.type === 'date' && (
                                                                    <div className="relative">
                                                                        <input
                                                                            type="date"
                                                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-clinicPrimary focus:ring-4 focus:ring-clinicPrimary/5 transition-all appearance-none"
                                                                            value={dynamicResponses[field.id] || ''}
                                                                            onChange={(e) => setDynamicResponses({ ...dynamicResponses, [field.id]: e.target.value })}
                                                                        />
                                                                        <FaCalendarAlt size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                                    </div>
                                                                )}

                                                                {field.type === 'single_choice' && (
                                                                    <div className="flex flex-wrap gap-3">
                                                                        {field.options.map((opt, i) => (
                                                                            <label key={i} className="flex items-center gap-2 group cursor-pointer">
                                                                                <div className="relative">
                                                                                    <input
                                                                                        type="radio"
                                                                                        name={field.id}
                                                                                        className="sr-only"
                                                                                        checked={dynamicResponses[field.id] === opt}
                                                                                        onChange={() => setDynamicResponses({ ...dynamicResponses, [field.id]: opt })}
                                                                                    />
                                                                                    <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${dynamicResponses[field.id] === opt ? 'border-clinicPrimary bg-clinicPrimary' : 'border-slate-200 bg-white group-hover:border-clinicPrimary/40'}`}>
                                                                                        {dynamicResponses[field.id] === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                                                                                    </div>
                                                                                </div>
                                                                                <span className={`text-xs font-bold transition-colors ${dynamicResponses[field.id] === opt ? 'text-clinicPrimary' : 'text-slate-500'}`}>{opt}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {field.type === 'checkbox' && (
                                                                    <div className="flex flex-wrap gap-3">
                                                                        {field.options.map((opt, i) => (
                                                                            <label key={i} className="flex items-center gap-2 group cursor-pointer">
                                                                                <div className="relative">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="sr-only"
                                                                                        checked={(dynamicResponses[field.id] || []).includes(opt)}
                                                                                        onChange={(e) => {
                                                                                            const current = dynamicResponses[field.id] || [];
                                                                                            const next = e.target.checked
                                                                                                ? [...current, opt]
                                                                                                : current.filter(o => o !== opt);
                                                                                            setDynamicResponses({ ...dynamicResponses, [field.id]: next });
                                                                                        }}
                                                                                    />
                                                                                    <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${(dynamicResponses[field.id] || []).includes(opt) ? 'border-clinicPrimary bg-clinicPrimary' : 'border-slate-200 bg-white group-hover:border-clinicPrimary/40'}`}>
                                                                                        {(dynamicResponses[field.id] || []).includes(opt) && <FaCheck size={10} className="text-white" />}
                                                                                    </div>
                                                                                </div>
                                                                                <span className={`text-xs font-bold transition-colors ${(dynamicResponses[field.id] || []).includes(opt) ? 'text-clinicPrimary' : 'text-slate-500'}`}>{opt}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {field.type === 'dropdown' && (
                                                                    <div className="relative">
                                                                        <select
                                                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-clinicPrimary focus:ring-4 focus:ring-clinicPrimary/5 transition-all appearance-none"
                                                                            value={dynamicResponses[field.id] || ''}
                                                                            onChange={(e) => setDynamicResponses({ ...dynamicResponses, [field.id]: e.target.value })}
                                                                        >
                                                                            <option value="">Select option...</option>
                                                                            {field.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                                                        </select>
                                                                        <FaCaretDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                                    </div>
                                                                )}

                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                currentTemplate?.sections.map((section, idx) => {
                                    // Map internal id to SOAP key or extra
                                    let key = 'subjective';
                                    if (idx === 1) key = 'objective';
                                    else if (idx === 2) key = 'assessment';
                                    else if (idx === 3) key = 'plan';

                                    const colors = [
                                        { border: 'border-emerald-100/50', bg: 'from-emerald-50/40', text: 'text-emerald-600', label: 'bg-emerald-100/50', h: 'text-emerald-800' },
                                        { border: 'border-blue-100/50', bg: 'from-blue-50/40', text: 'text-blue-600', label: 'bg-blue-100/50', h: 'text-blue-800' },
                                        { border: 'border-indigo-100/50', bg: 'from-indigo-50/40', text: 'text-indigo-600', label: 'bg-indigo-100/50', h: 'text-indigo-800' },
                                        { border: 'border-amber-100/50', bg: 'from-amber-50/40', text: 'text-amber-600', label: 'bg-amber-100/50', h: 'text-amber-800' },
                                    ];
                                    const c = colors[idx % 4];

                                    return (
                                        <div key={section.id} className={`p-4 sm:p-6 bg-gradient-to-br ${c.bg} to-white hover:bg-slate-50 transition-colors`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`w-6 h-6 rounded-md border ${c.border} ${c.label} ${c.text} font-black flex items-center justify-center text-[11px] shadow-sm`}>
                                                    {idx + 1}
                                                </span>
                                                <h2 className={`text-[12px] font-black ${c.h} uppercase tracking-widest`}>{section.title}</h2>
                                                <span className="text-[10px] text-slate-400 font-medium ml-2">- {section.placeholder || 'Clinical finding'}</span>
                                            </div>
                                            <textarea
                                                className={`w-full min-h-[120px] p-4 bg-white border ${c.border} rounded-xl text-[13px] leading-relaxed text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 resize-y shadow-sm`}
                                                placeholder={section.placeholder || `Enter ${section.title} here...`}
                                                value={idx < 4 ? notes[key] : (notes.extra[section.id] || '')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setNotes(prev => {
                                                        if (idx < 4) return { ...prev, [key]: val };
                                                        return { ...prev, extra: { ...prev.extra, [section.id]: val } };
                                                    });
                                                }}
                                            />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>

                    {/* Add New Type Modal */}
                    <Modal
                        isOpen={isAddingType}
                        onClose={() => setIsAddingType(false)}
                        title="Create Internal Note Type"
                        maxWidth="max-w-md"
                        footer={
                            <div className="flex gap-2 justify-end w-full">
                                <Button variant="secondary" onClick={() => setIsAddingType(false)}>Cancel</Button>
                                <Button
                                    variant="primary"
                                    className="bg-clinicPrimary text-white"
                                    onClick={handleSaveNewType}
                                >
                                    Add Note Type
                                </Button>
                            </div>
                        }
                    >
                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Type Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Acupuncture Session, Initial Scan"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-clinicPrimary transition-all"
                                    value={newTypeName}
                                    onChange={e => setNewTypeName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveNewType()}
                                    autoFocus
                                />
                                <p className="text-[9px] text-slate-400 font-medium italic">This type will be saved to the database for future clinical notes.</p>
                            </div>
                        </div>
                    </Modal>

                    {/* Bottom Actions - Non-Floating Bar */}
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block italic">
                            SOAP Clinical Compliance Mode Active
                        </p>
                        <div className="flex items-center gap-3 w-full sm:w-auto">

                            <Button
                                variant="accent"
                                className="flex-1 sm:flex-none px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-clinicPrimary/20 transition-all active:scale-95"
                                onClick={() => handleSave('Completed')}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Complete Note'}
                            </Button>
                        </div>
                    </div>

                    <EmailModal
                        isOpen={emailModalOpen}
                        onClose={() => setEmailModalOpen(false)}
                        type="Note"
                        data={{
                            ...notes,
                            type: noteType,
                            patientName: patientInfo ? `${patientInfo.firstName} ${patientInfo.lastName}` : '',
                            dynamicContent: { layouts: currentTemplate?.content?.layouts, responses: dynamicResponses }
                        }}
                        patientId={selectedPatient}
                        patientName={patientInfo ? `${patientInfo.firstName} ${patientInfo.lastName}` : ''}
                        patientEmail={patientInfo?.email}
                    />
                </>
            )}
        </div>
    );
};

export default NewNote;
