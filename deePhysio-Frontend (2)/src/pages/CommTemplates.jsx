import React, { useEffect, useMemo, useState } from 'react';
import {
  FaPlus, FaSearch, FaSms, FaEnvelope, FaTrash, FaEdit,
  FaExclamationTriangle, FaCopy, FaSync, FaFileAlt
} from 'react-icons/fa';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import { fetchApi } from '../config/api';
import {
  MESSAGE_TEMPLATE_SETTINGS_KEY,
  DEFAULT_MESSAGE_TEMPLATES,
  normalizeTemplates
} from '../config/messageTemplates';

const CommTemplates = () => {
  const [activeType, setActiveType] = useState('SMS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templates, setTemplates] = useState(DEFAULT_MESSAGE_TEMPLATES);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ name: '', content: '' });

  const persistTemplates = async (nextTemplates) => {
    const res = await fetchApi('/settings', {
      method: 'POST',
      body: JSON.stringify({
        settings: { [MESSAGE_TEMPLATE_SETTINGS_KEY]: nextTemplates }
      })
    });
    if (!res?.ok) {
      const err = await res?.json().catch(() => ({}));
      throw new Error(err?.message || 'Failed to save templates');
    }
  };

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await fetchApi(`/settings?keys=${encodeURIComponent(MESSAGE_TEMPLATE_SETTINGS_KEY)}`);
      if (res?.ok) {
        const json = await res.json();
        const fromDb = json?.data?.[MESSAGE_TEMPLATE_SETTINGS_KEY];
        const normalized = normalizeTemplates(fromDb);
        setTemplates(normalized);
        // First run bootstrap: persist defaults if key is missing.
        if (!Array.isArray(fromDb)) {
          await persistTemplates(normalized);
        }
      } else {
        setTemplates(DEFAULT_MESSAGE_TEMPLATES);
      }
    } catch (e) {
      setTemplates(DEFAULT_MESSAGE_TEMPLATES);
      setToast({ message: 'Failed to load templates from server.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const openEditor = (template = null) => {
    setEditingTemplate(template);
    setFormData(template
      ? { name: template.name, content: template.content }
      : { name: '', content: '' }
    );
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      setToast({ message: 'Title and Content are required.', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      let nextTemplates;
      if (editingTemplate) {
        nextTemplates = templates.map((t) =>
          t.id === editingTemplate.id
            ? { ...t, name: formData.name, content: formData.content, updatedAt: new Date().toISOString() }
            : t
        );
      } else {
        const newTemplate = {
          id: `tpl_${Date.now()}`,
          name: formData.name,
          content: formData.content,
          category: 'General',
          type: activeType,
          system: false,
          updatedAt: new Date().toISOString()
        };
        nextTemplates = [newTemplate, ...templates];
      }
      await persistTemplates(nextTemplates);
      setTemplates(nextTemplates);
      setToast({ message: editingTemplate ? 'Template updated successfully!' : 'Template created successfully!', type: 'success' });
      setIsSaving(false);
      setIsEditorOpen(false);
    } catch (e) {
      setIsSaving(false);
      setToast({ message: e.message || 'Failed to save template.', type: 'error' });
    }
  };

  const handleDelete = async (id) => {
    const nextTemplates = templates.filter((t) => t.id !== id);
    try {
      await persistTemplates(nextTemplates);
      setTemplates(nextTemplates);
      setDeleteConfirm(null);
      setToast({ message: 'Template deleted.', type: 'success' });
    } catch (e) {
      setToast({ message: e.message || 'Failed to delete template.', type: 'error' });
    }
  };

  const handleClone = async (template) => {
    const clone = {
      ...template,
      id: `tpl_${Date.now()}`,
      name: `${template.name} (Copy)`,
      system: false,
      updatedAt: new Date().toISOString()
    };
    const nextTemplates = [clone, ...templates];
    try {
      await persistTemplates(nextTemplates);
      setTemplates(nextTemplates);
      setToast({ message: 'Template cloned.', type: 'success' });
    } catch (e) {
      setToast({ message: e.message || 'Failed to clone template.', type: 'error' });
    }
  };

  const filtered = useMemo(() => templates.filter(t =>
    t.type === activeType &&
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.content.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [templates, activeType, searchTerm]);

  return (
    <div className="h-screen h-[100dvh] bg-[#F8FAFB] flex flex-col font-sans overflow-hidden transition-all duration-300">

      {/* HEADER */}
      <header className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-20">
        <div>
          <h1 className="text-base font-bold text-slate-800 tracking-tight leading-none">Communication Templates</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Clinical Outreach Protocols</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="h-9 px-4 text-[11px] font-bold uppercase tracking-widest bg-white border border-slate-200"
            onClick={async () => {
              setIsSyncing(true);
              await loadTemplates();
              setIsSyncing(false);
              setToast({ message: 'Templates synchronized from server.', type: 'success' });
            }}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing...' : 'Sync All'}
          </Button>
          <Button
            variant="accent"
            className="h-9 px-4 text-[11px] font-bold uppercase tracking-widest"
            onClick={() => openEditor()}
          >
            New Template
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex">
        {/* SIDEBAR: Channels */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-50">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Channels</h3>
            <nav className="space-y-1">
              {[
                { id: 'SMS', icon: <FaSms />, label: 'SMS Messages' },
                { id: 'Email', icon: <FaEnvelope />, label: 'Email Protocols' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveType(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-all text-left ${activeType === item.id
                    ? 'bg-clinicPrimary/10 text-clinicPrimary'
                    : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-[11px] font-bold uppercase tracking-tight">{item.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${activeType === item.id ? 'bg-clinicPrimary/20' : 'bg-slate-100 text-slate-400'
                    }`}>
                    {templates.filter(t => t.type === item.id).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 mt-auto border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="text-[10px] font-bold text-slate-700 uppercase mb-1">Dynamic Tokens</p>
              <p className="text-[9px] text-slate-400 leading-relaxed uppercase tracking-widest font-bold">Use tags like {`{firstname}`} to personalize clinical outreach.</p>
            </div>
          </div>
        </aside>

        {/* LIST AREA */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Search Header */}
          <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/30">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                type="text"
                placeholder={`Search ${activeType} templates...`}
                className="input-clinic pl-9 h-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-2 border-clinicPrimary/20 border-t-clinicPrimary rounded-full animate-spin" />
                <p className="text-[11px] font-bold uppercase tracking-widest">Loading templates...</p>
              </div>
            ) : filtered.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {filtered.map(template => (
                  <div
                    key={template.id}
                    className="p-5 hover:bg-slate-50 transition-all cursor-pointer group"
                    onClick={() => openEditor(template)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-slate-800">{template.name}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditor(template); }}
                          className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-white border border-slate-200 rounded hover:text-clinicPrimary hover:border-clinicPrimary hover:bg-clinicPrimary/5 transition-all flex items-center gap-1"
                        >
                          <FaEdit size={10} /> View/Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleClone(template); }}
                          className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-white border border-slate-200 rounded hover:text-clinicPrimary hover:border-clinicPrimary hover:bg-clinicPrimary/5 transition-all flex items-center gap-1"
                        >
                          <FaCopy size={10} /> Copy
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(template); }}
                          className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-white border border-slate-200 rounded hover:text-rose-500 hover:border-rose-500 hover:bg-rose-50 transition-all flex items-center gap-1"
                        >
                          <FaTrash size={10} /> Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-[12px] text-slate-500 italic line-clamp-2 leading-relaxed">
                      "{template.content}"
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {['firstname', 'practitioner', 'time'].map(tag => (
                          <span key={tag} className="text-[8px] font-bold text-slate-300 uppercase tracking-widest px-2 py-1 border border-slate-100 rounded-full">
                            {`{${tag}}`}
                          </span>
                        ))}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        Updated {template.updatedAt === 'system' ? 'System' : new Date(template.updatedAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <FaFileAlt size={32} className="opacity-20" />
                <p className="text-[11px] font-bold uppercase tracking-widest">Zero matching protocols found</p>
                <Button variant="secondary" className="h-9 text-[10px]" onClick={() => openEditor()}>Create Template</Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Editor Modal */}
      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingTemplate ? 'Edit Template' : 'New Template'}
        footer={
          <div className="flex gap-3 justify-end w-full px-2">
            <button
              onClick={() => setIsEditorOpen(false)}
              className="px-4 h-9 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600"
            >
              Cancel
            </button>
            <Button
              variant="accent"
              className="h-9 px-6 text-[11px] font-bold uppercase tracking-widest"
              onClick={handleSave}
              isLoading={isSaving}
            >
              Save Template
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Title</label>
            <input
              type="text"
              placeholder="e.g. Invoice Reminder"
              className="input-clinic h-9"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Message</label>
            <textarea
              className="input-clinic min-h-[150px] py-3 resize-none"
              placeholder="Type message..."
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Template"
        footer={
          <div className="flex gap-3 justify-end w-full px-2">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary h-9 px-4 text-[11px]">Cancel</button>
            <button onClick={() => handleDelete(deleteConfirm.id)} className="bg-rose-500 text-white rounded-md h-9 px-6 text-[11px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-colors">Delete</button>
          </div>
        }
      >
        <div className="p-6 text-center">
          <FaExclamationTriangle className="text-rose-500 text-2xl mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-800">Delete "{deleteConfirm?.name}"?</p>
          <p className="text-xs text-slate-400 mt-2">This clinical protocol will be permanently removed.</p>
        </div>
      </Modal>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};

export default CommTemplates;
