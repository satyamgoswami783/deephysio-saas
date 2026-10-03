import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaEdit, FaTrash, FaPlus, FaSearch, FaCopy,
    FaCheckCircle, FaExclamationTriangle, FaChevronRight, FaEye,
    FaHeartbeat, FaRunning, FaCheck, FaEnvelope
} from 'react-icons/fa';
import EmailModal from '../components/ui/EmailModal';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { fetchApi } from '../config/api';

const normalizeTemplateContent = (template) => {
    const raw = typeof template.content === 'string'
        ? (() => { try { return JSON.parse(template.content); } catch { return null; } })()
        : template.content;

    if (raw?.layouts && Array.isArray(raw.layouts)) return raw;

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

const contentToSections = (content) => {
    if (!content?.layouts || !Array.isArray(content.layouts)) return [];
    return content.layouts
        .flatMap((layout) => layout.fields || [])
        .filter((field) => field && field.type !== 'horizontal_line')
        .map((field, idx) => ({
            id: field.id || `section_${idx}`,
            title: field.label || `Section ${idx + 1}`,
            placeholder: field.placeholder || ''
        }));
};

const NoteTemplates = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedPreview, setSelectedPreview] = useState(null);
    const [emailModal, setEmailModal] = useState({ isOpen: false, template: null });
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [toast, setToast] = useState({ message: '', visible: false });

    const categories = ['All', 'Physiotherapy', 'Clinical', 'Rehabilitation', 'Final'];

    const showToast = (msg) => {
        setToast({ message: msg, visible: true });
        setTimeout(() => setToast({ message: '', visible: false }), 3000);
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
                            sections: contentToSections(normalizedContent)
                        };
                    });
                    setTemplates(dbTemplates);
                }
            }
        } catch (err) {
            console.error('Error fetching templates:', err);
        }
    };

    useEffect(() => {
        loadTemplates();
        window.addEventListener('focus', loadTemplates);
        return () => window.removeEventListener('focus', loadTemplates);
    }, []);

    const handleCopyTemplate = async (template) => {
        try {
            const body = {
                title: `${template.name} (Copy)`,
                category: template.category,
                content: template.content
            };
            const res = await fetchApi('/note-templates', {
                method: 'POST',
                body: JSON.stringify(body)
            });
            if (res && res.ok) {
                loadTemplates();
                showToast(`"${template.name}" copied successfully!`);
            }
        } catch (err) {
            console.error('Error copying template:', err);
            showToast('Failed to copy template.');
        }
    };

    const handleDeleteTemplate = async (template) => {
        if (!template?.id) return;

        try {
            const res = await fetchApi(`/note-templates/${template.id}`, { method: 'DELETE' });
            if (res && res.ok) {
                loadTemplates();
                setDeleteConfirm(null);
                showToast('Template deleted successfully.');
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            showToast('Failed to delete template.');
        }
    };

    const handleUseTemplate = (template) => {
        navigate('/notes/new', { state: { selectedTemplate: template.id } });
    };

    const handleEditTemplate = (template) => {
        navigate('/notes/templates/new', { state: { template } });
    };

    const filteredTemplates = templates.filter(t => {
        const name = (t.name || '').toLowerCase();
        const query = searchTerm.toLowerCase();
        const matchesSearch = name.includes(query);
        const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="px-4 sm:px-10 max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-500 relative pb-10">
            {/* Toast */}
            {toast.visible && (
                <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[9999]">
                    <div className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg border border-white/10 flex items-center gap-3">
                        <FaCheckCircle className="text-clinicPrimary shrink-0" size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Email Modal */}
            <EmailModal
                isOpen={emailModal.isOpen}
                onClose={() => setEmailModal({ isOpen: false, template: null })}
                template={emailModal.template}
            />

            {/* Preview Modal */}
            <Modal
                isOpen={!!selectedPreview}
                onClose={() => setSelectedPreview(null)}
                title="Template Preview"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex gap-3 justify-end w-full">
                        <Button
                            variant="secondary"
                            className="text-[11px] font-black uppercase tracking-widest"
                            onClick={() => {
                                setEmailModal({ isOpen: true, template: selectedPreview });
                            }}
                        >
                            Email Template
                        </Button>
                        <Button
                            variant="secondary"
                            className="text-[11px] font-black uppercase tracking-widest"
                            onClick={() => handleEditTemplate(selectedPreview)}
                        >
                            Edit Template
                        </Button>
                        <Button
                            variant="primary"
                            className="bg-clinicPrimary text-white text-[11px] font-black uppercase tracking-widest"
                            onClick={() => handleUseTemplate(selectedPreview)}
                        >
                            Use Template
                        </Button>
                    </div>
                }
            >
                {selectedPreview && (
                    <div className="p-1 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-clinicPrimary/10 rounded text-[9px] font-black text-clinicPrimary uppercase tracking-widest">
                                    {selectedPreview.category}
                                </span>
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-2">
                                {selectedPreview.name}
                            </h2>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-100 pb-2">
                                <ClinicalNoteIcon className="text-clinicPrimary" size={22} /> Template Sections
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {selectedPreview.sections.map((s, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                        <p className="text-[10px] font-black text-clinicPrimary tracking-widest mb-1">{s.title}</p>
                                        <p className="text-[12px] italic text-slate-400">{s.placeholder}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Template"
                footer={
                    <div className="flex gap-2 justify-end w-full px-2">
                        <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                        <Button variant="danger" onClick={() => handleDeleteTemplate(deleteConfirm)} leftIcon={<FaTrash size={10} />}>Delete</Button>
                    </div>
                }
            >
                <div className="p-5 text-center font-sans">
                    <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FaExclamationTriangle className="text-rose-400 text-xl" />
                    </div>
                    <p className="text-[14px] font-black text-slate-900 tracking-tight">Delete "{deleteConfirm?.name}"?</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">This action cannot be undone.</p>
                </div>
            </Modal>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Clinical Templates</h1>
                    <p className="text-[11px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Build, manage, and standardize your SOAP documentation.</p>
                </div>
                <button
                    onClick={() => navigate('/notes/templates/new')}
                    className="bg-clinicPrimary text-white rounded-lg h-10 px-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-clinicPrimary/90 transition-all shadow-sm active:scale-95"
                >
                    <FaPlus size={10} /> Create New Template
                </button>
            </div>

            {/* Navigation & Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-clinicPrimary text-white shadow-md shadow-clinicPrimary/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative min-w-[300px]">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={11} />
                    <input
                        type="text"
                        placeholder="Quick search templates..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold outline-none focus:border-clinicPrimary focus:ring-1 focus:ring-clinicPrimary/10 transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredTemplates.length === 0 ? (
                    <div className="col-span-full py-24 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            <ClinicalNoteIcon className="text-slate-200" size={44} />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">No templates found</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Try adjusting your filters or search term.</p>
                        <Button
                            variant="primary"
                            className="text-[10px] font-black uppercase tracking-widest px-8"
                            onClick={() => navigate('/notes/templates/new')}
                        >
                            Create Your First Template
                        </Button>
                    </div>
                ) : (
                    filteredTemplates.map(template => (
                        <Card
                            key={`${template.__source || 'template'}-${template.id}`}
                            className="group relative bg-white border-slate-200 hover:border-clinicPrimary hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col min-h-[220px]"
                            onClick={() => setSelectedPreview(template)}
                        >
                            {/* Card Content */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-400 group-hover:bg-clinicPrimary/10 group-hover:text-clinicPrimary uppercase tracking-widest transition-colors">
                                        {template.category}
                                    </span>

                                    {/* Action Icons - Always Visible */}
                                    <div className="flex items-center gap-1 bg-white/90 p-1 rounded-lg border border-slate-100">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEmailModal({ isOpen: true, template }); }}
                                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all"
                                            title="Email Template"
                                        >
                                            <FaEnvelope size={11} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditTemplate(template); }}
                                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-all"
                                            title="Edit"
                                        >
                                            <FaEdit size={11} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleCopyTemplate(template); }}
                                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-all"
                                            title="Duplicate"
                                        >
                                            <FaCopy size={11} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setDeleteConfirm(template);
                                            }}
                                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                                            title="Delete"
                                        >
                                            <FaTrash size={11} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-[14px] font-black text-slate-900 tracking-tight mb-1 group-hover:text-clinicPrimary transition-colors">
                                        {template.name}
                                    </h3>
                                </div>

                                <div className="mt-auto flex items-center justify-between gap-3">
                                    <div className="flex -space-x-1">
                                        {(template.sections || []).slice(0, 3).map((s, idx) => (
                                            <div key={idx} className="w-6 h-6 rounded bg-slate-50 border border-white flex items-center justify-center text-[10px] font-black text-slate-300" title={s.title}>
                                                {s.title.charAt(0)}
                                            </div>
                                        ))}
                                        {template.sections?.length > 3 && (
                                            <div className="w-6 h-6 rounded bg-slate-50 border border-white flex items-center justify-center text-[8px] font-black text-slate-300">
                                                +{template.sections.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleUseTemplate(template); }}
                                        className="h-8 px-4 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-clinicPrimary transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        <FaCheck size={9} /> Use Template
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

        </div>
    );
};

export default NoteTemplates;
