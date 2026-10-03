import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaPlus, FaTrash, FaCogs, FaCheckCircle,
  FaExclamationTriangle, FaHeading, FaInfoCircle, FaMinus,
  FaFont, FaAlignLeft, FaCalendarAlt, FaRegDotCircle, FaCheckSquare,
  FaCaretDown, FaPenNib, FaFileImport, FaLayerGroup, FaColumns,
  FaArrowsAlt
} from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { fetchApi } from '../config/api';

const CreateTemplate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editingTemplate = location.state?.template;

  const [formData, setFormData] = useState({
    name: editingTemplate?.name || '',
    category: editingTemplate?.category || 'Physiotherapy'
  });

  const FIELD_TYPES = [
    { value: 'heading', label: 'Heading', icon: <FaHeading />, category: 'Static' },
    { value: 'helper_text', label: 'Helper Text', icon: <FaInfoCircle />, category: 'Static' },
    { value: 'horizontal_line', label: 'Horizontal Line', icon: <FaMinus />, category: 'Static' },
    { value: 'short', label: 'Short Text', icon: <FaFont />, category: 'Input' },
    { value: 'text', label: 'Paragraph', icon: <FaAlignLeft />, category: 'Input' },
    { value: 'date', label: 'Date Picker', icon: <FaCalendarAlt />, category: 'Input' },
    { value: 'single_choice', label: 'Single Choice', icon: <FaRegDotCircle />, category: 'Selection' },
    { value: 'checkbox', label: 'Multiple Choice', icon: <FaCheckSquare />, category: 'Selection' },
    { value: 'dropdown', label: 'Options List', icon: <FaCaretDown />, category: 'Selection' }
  ];

  const normalizeLayouts = (template) => {
    if (!template) return [];
    if (template.content?.layouts && Array.isArray(template.content.layouts)) {
      return template.content.layouts.map((layout) => ({
        ...layout,
        fields: (layout.fields || []).map((field) => {
          if (!field) return null;
          if (field.type === 'signature') return null;
          return field;
        })
      }));
    }
    if (Array.isArray(template.sections)) {
      return template.sections.map((sec, idx) => ({
        id: `l_legacy_${idx}_${Math.random().toString(36).substr(2, 6)}`,
        type: 'full',
        fields: [{
          id: `f_legacy_${idx}_${Math.random().toString(36).substr(2, 6)}`,
          type: 'text',
          label: sec.title || 'Untitled Section',
          placeholder: sec.placeholder || '',
          required: false,
          options: []
        }]
      }));
    }
    return [];
  };

  const [layouts, setLayouts] = useState(() => normalizeLayouts(editingTemplate));

  const [pickerState, setPickerState] = useState({ isOpen: false, layoutId: null, slotIndex: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [toast, setToast] = useState({ message: '', visible: false });

  const [customCategories, setCustomCategories] = useState([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryRef = useRef(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchApi(`/settings?keys=deephysio_custom_template_categories&t=${Date.now()}`);
        if (res && res.ok) {
          const data = await res.json();
          const raw =
            data?.data?.deephysio_custom_template_categories ??
            data?.data?.deephysioCustomTemplateCategories;
          if (data.success && raw !== undefined) {
            if (Array.isArray(raw)) {
              setCustomCategories(raw);
            } else if (typeof raw === 'string') {
              try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                  setCustomCategories(parsed);
                } else if (parsed && typeof parsed === 'object') {
                  setCustomCategories(Object.values(parsed).filter((v) => typeof v === 'string'));
                } else {
                  setCustomCategories([]);
                }
              } catch {
                setCustomCategories([]);
              }
            } else if (raw && typeof raw === 'object') {
              setCustomCategories(Object.values(raw).filter((v) => typeof v === 'string'));
            } else {
              setCustomCategories([]);
            }
          }
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const categories = ['Physiotherapy', 'Clinical', 'Rehabilitation', 'Prevention', 'Manual Therapy', 'Final'];

  const showToast = (msg) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2500);
  };

  const addLayout = (type) => {
    const newLayout = {
      id: `l_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type, // 'full' or 'split'
      fields: type === 'full' ? [null] : [null, null]
    };
    setLayouts([...layouts, newLayout]);
  };

  const removeLayout = (layoutId) => {
    setLayouts(layouts.filter(l => l.id !== layoutId));
  };

  const openFieldPicker = (layoutId, slotIndex) => {
    setPickerState({ isOpen: true, layoutId, slotIndex });
  };

  const handleSelectFieldType = (type) => {
    const { layoutId, slotIndex } = pickerState;
    const newField = {
      id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      label: type === 'horizontal_line' ? '' : 'Untitled Section',
      required: false,
      placeholder: '',
      options: ['Option 1', 'Option 2']
    };

    setLayouts(layouts.map(l => {
      if (l.id === layoutId) {
        const newFields = [...l.fields];
        newFields[slotIndex] = newField;
        return { ...l, fields: newFields };
      }
      return l;
    }));
    setPickerState({ isOpen: false, layoutId: null, slotIndex: 0 });
  };

  const updateField = (layoutId, slotIndex, key, value) => {
    setLayouts(layouts.map(l => {
      if (l.id === layoutId) {
        const newFields = [...l.fields];
        newFields[slotIndex] = { ...newFields[slotIndex], [key]: value };
        return { ...l, fields: newFields };
      }
      return l;
    }));
  };

  const handleRemoveField = (layoutId, slotIndex) => {
    setLayouts(layouts.map(l => {
      if (l.id === layoutId) {
        const newFields = [...l.fields];
        newFields[slotIndex] = null;
        return { ...l, fields: newFields };
      }
      return l;
    }));
  };

  const moveLayout = (index, direction) => {
    const newLayouts = [...layouts];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newLayouts.length) return;
    [newLayouts[index], newLayouts[targetIndex]] = [newLayouts[targetIndex], newLayouts[index]];
    setLayouts(newLayouts);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setNameError('Template Name is required.');
      return;
    }
    if (layouts.length === 0) {
      showToast('Please add at least one section to the template.');
      return;
    }
    setNameError('');
    setIsSaving(true);

    try {
      const payload = {
        title: formData.name,
        category: formData.category,
        content: { layouts }
      };
      const method = editingTemplate ? 'PUT' : 'POST';
      const endpoint = editingTemplate ? `/note-templates/${editingTemplate.id}` : '/note-templates';

      const res = await fetchApi(endpoint, { method, body: JSON.stringify(payload) });
      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          showToast(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!');
          setTimeout(() => navigate('/notes/templates'), 1400);
        } else {
          showToast(data.message || 'Error saving template.');
        }
      } else {
        const errData = res ? await res.json().catch(() => ({})) : {};
        showToast(errData.message || 'Error syncing template.');
      }
    } catch (err) {
      console.error('Save template error:', err);
      showToast('Server error syncing template.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderFieldEditor = (layoutId, slotIndex, field) => {
    if (!field) {
      return (
        <button
          onClick={() => openFieldPicker(layoutId, slotIndex)}
          className="w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-clinicPrimary hover:bg-clinicPrimary/5 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-clinicPrimary group-hover:text-white flex items-center justify-center transition-all">
            <FaPlus size={12} />
          </div>
          <span className="text-[10px] font-black text-slate-400 group-hover:text-clinicPrimary uppercase tracking-widest">Add Field</span>
        </button>
      );
    }

    const typeInfo = FIELD_TYPES.find(t => t.value === field.type);

    return (
      <div className="relative p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group/field">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-50 text-clinicPrimary rounded-lg">
              {typeInfo?.icon}
            </span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {typeInfo?.label}
            </span>
          </div>
          <button
            onClick={() => handleRemoveField(layoutId, slotIndex)}
            className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover/field:opacity-100"
          >
            <FaTrash size={10} />
          </button>
        </div>

        {field.type !== 'horizontal_line' && (
          <input
            type="text"
            value={field.label}
            onChange={(e) => updateField(layoutId, slotIndex, 'label', e.target.value)}
            placeholder="Field Label / Section Name..."
            className="w-full text-sm font-bold text-slate-800 border-none bg-transparent outline-none mb-2 focus:text-clinicPrimary"
          />
        )}

        {['dropdown', 'checkbox', 'single_choice'].includes(field.type) && (
          <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-slate-100">
            {field.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${field.type === 'single_choice' ? 'border border-slate-300' : 'bg-slate-200'}`} />
                <input
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...field.options];
                    newOpts[i] = e.target.value;
                    updateField(layoutId, slotIndex, 'options', newOpts);
                  }}
                  className="bg-transparent border-none text-[11px] font-medium text-slate-600 outline-none w-full"
                />
              </div>
            ))}
            <button
              onClick={() => updateField(layoutId, slotIndex, 'options', [...field.options, `Option ${field.options.length + 1}`])}
              className="text-[9px] font-black text-clinicPrimary uppercase mt-2 flex items-center gap-1"
            >
              <FaPlus size={7} /> Add Option
            </button>
          </div>
        )}

        {field.type === 'heading' && <div className="h-px bg-slate-100 mt-1" />}
        {field.type === 'horizontal_line' && <div className="h-0.5 bg-slate-200 my-4" />}
        {field.type === 'short' || field.type === 'text' || field.type === 'date' ? (
          <input
            type="text"
            value={field.placeholder}
            onChange={(e) => updateField(layoutId, slotIndex, 'placeholder', e.target.value)}
            placeholder="Placeholder text..."
            className="w-full text-[11px] font-medium text-slate-400 border-none bg-transparent outline-none italic"
          />
        ) : null}
      </div>
    );
  };

  const handleSaveCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      showToast('Category name cannot be empty');
      return;
    }
    if (categories.includes(trimmed) || customCategories.includes(trimmed)) {
      showToast('Category already exists');
      return;
    }

    try {
      const updated = [...customCategories, trimmed];
      const res = await fetchApi('/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: { deephysio_custom_template_categories: updated } })
      });
      if (!res) {
        showToast('Failed to save category');
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Failed to save category');
        return;
      }

      // Update UI only after DB save succeeds
      setCustomCategories(updated);
      setFormData({ ...formData, category: trimmed });
      setNewCategoryName('');
      setIsAddingCategory(false);
      showToast(`Category "${trimmed}" saved`);
    } catch (err) {
      console.error('Error saving category:', err);
      showToast('Failed to save category');
    }
  };

  const handleDeleteCategory = async (categoryToDelete) => {
    const updated = customCategories.filter((c) => c !== categoryToDelete);
    try {
      const res = await fetchApi('/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: { deephysio_custom_template_categories: updated } })
      });
      if (!res) {
        showToast('Failed to delete category');
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Failed to delete category');
        return;
      }

      setCustomCategories(updated);
      if (formData.category === categoryToDelete) {
        setFormData({ ...formData, category: categories[0] });
      }
      showToast(`Category "${categoryToDelete}" deleted`);
    } catch (err) {
      console.error('Error deleting category:', err);
      showToast('Failed to delete category');
    }
  };

  return (
    <div className="px-4 sm:px-10 max-w-7xl mx-auto py-4 space-y-4 animate-fade-in font-sans custom-scrollbar">
      {/* Toast */}
      {toast.visible && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[9999]">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-8 py-4 rounded-[24px] shadow-2xl border border-white/10 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="w-8 h-8 rounded-full bg-clinicPrimary/20 flex items-center justify-center">
              <FaCheckCircle className="text-clinicPrimary" size={14} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/notes/templates')} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-clinicPrimary hover:shadow-google transition-all active:scale-95 shadow-sm">
          <FaArrowLeft size={14} />
        </button>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">
            {editingTemplate ? 'Edit Template' : 'Create Template'}
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.15em] mt-1 opacity-80">
            {editingTemplate ? 'Update your clinical template structure' : 'Build a reusable clinical note template'}
          </p>
        </div>
      </div>

      <Card className="bg-white rounded-xl shadow-premium border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-5 md:p-6 space-y-5">
          {/* Basic Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-4 bg-clinicPrimary rounded-full"></div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Template Details</h3>
              </div>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Template name (e.g., Standard SOAP Note)"
                  className={`w-full p-3.5 bg-slate-50 border rounded-xl text-[13px] font-black text-slate-900 outline-none focus:ring-4 focus:ring-clinicPrimary/5 transition-all placeholder:text-slate-300 ${nameError ? 'border-rose-200 bg-rose-50' : 'border-slate-100 focus:border-clinicPrimary'}`}
                  value={formData.name}
                  onChange={e => { setFormData({ ...formData, name: e.target.value }); setNameError(''); }}
                />
                {nameError && (
                  <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <FaExclamationTriangle size={8} /> {nameError}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Template Category</h3>
                </div>
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="p-1 px-2 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-600 hover:text-white transition-all text-[8px] font-black uppercase tracking-tighter flex items-center gap-1"
                >
                  <FaPlus size={7} /> Add Category
                </button>
              </div>
              <div ref={categoryRef} className="relative group">
                <button
                  type="button"
                  className="w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-black text-slate-800 outline-none cursor-pointer focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all font-sans text-left flex items-center justify-between"
                  onClick={() => setIsCategoryOpen(prev => !prev)}
                >
                  <span>{formData.category}</span>
                  <FaCogs size={12} className="text-slate-300" />
                </button>
                {isCategoryOpen && (
                  <div className="absolute z-40 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                    {[...categories, ...customCategories].map((cat) => {
                      const isCustom = customCategories.includes(cat);
                      return (
                        <div
                          key={`category-${cat}`}
                          className={`flex items-center justify-between px-3 py-1.5 text-[12px] font-bold cursor-pointer ${formData.category === cat ? 'bg-amber-50 text-amber-700' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          onClick={() => {
                            setFormData({ ...formData, category: cat });
                            setIsCategoryOpen(false);
                          }}
                        >
                          <span>{cat}</span>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCategory(cat);
                              }}
                              className="w-5 h-5 rounded flex items-center justify-center text-rose-500 hover:bg-rose-100"
                              title={`Delete ${cat}`}
                            >
                              <FaTrash size={9} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          {/* Documentation Blocks */}
          <div className="space-y-4 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Template Canvas</h3>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 font-medium italic">
              Construct your clinical protocol using layouts and dynamic fields.
            </p>

            <div className="space-y-4">
              {layouts.map((layout, index) => (
                <div key={layout.id} className="group relative">
                  <div className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveLayout(index, -1)} className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-clinicPrimary shadow-sm"><FaArrowLeft className="rotate-90" size={8} /></button>
                    <button onClick={() => removeLayout(layout.id)} className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-rose-500 shadow-sm"><FaTrash size={8} /></button>
                    <button onClick={() => moveLayout(index, 1)} className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-clinicPrimary shadow-sm"><FaArrowLeft className="-rotate-90" size={8} /></button>
                  </div>
                  <Card className="p-4 border-slate-100 bg-slate-50/30 rounded-2xl">
                    <div className={`grid gap-4 ${layout.type === 'split' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                      {layout.fields.map((field, sIdx) => (
                        <div key={sIdx}>{renderFieldEditor(layout.id, sIdx, field)}</div>
                      ))}
                    </div>
                  </Card>
                </div>
              ))}

              {/* Layout Selection */}
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-center space-y-4 mt-6">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => addLayout('full')}
                    className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-clinicPrimary hover:shadow-lg transition-all text-center space-y-2 w-32"
                  >
                    <FaLayerGroup size={24} className="mx-auto text-slate-300" />
                    <span className="block text-[10px] font-black text-slate-500 uppercase">Single Row</span>
                  </button>
                  <button
                    onClick={() => addLayout('split')}
                    className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-clinicPrimary hover:shadow-lg transition-all text-center space-y-2 w-32"
                  >
                    <div className="flex gap-1 items-center justify-center">
                      <div className="w-3 h-5 bg-slate-100 rounded-sm" />
                      <div className="w-3 h-5 bg-slate-100 rounded-sm" />
                    </div>
                    <span className="block text-[10px] font-black text-slate-500 uppercase">Split View</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Add New Section Layout</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-4 mt-auto">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-clinicPrimary rounded-full animate-pulse"></div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">engine: ready</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant="secondary"
              className="flex-1 sm:px-6 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm"
              onClick={() => navigate('/notes/templates')}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              className="flex-1 sm:px-6 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-clinicPrimary/10 active:scale-95 transition-all"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Save Template'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddingCategory}
        onClose={() => setIsAddingCategory(false)}
        title="Create Template Category"
        maxWidth="max-w-md"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setIsAddingCategory(false)}>Cancel</Button>
            <Button
              variant="primary"
              className="bg-amber-600 text-white"
              onClick={handleSaveCategory}
            >
              Add Category
            </Button>
          </div>
        }
      >
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Category Name</label>
            <input
              type="text"
              placeholder="e.g. Sports Rehab, Neuro, Pediatric"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-amber-500 transition-all font-sans"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveCategory()}
              autoFocus
            />
            <p className="text-[9px] text-slate-400 font-medium italic">This category will be available in the template category list.</p>
          </div>
        </div>
      </Modal>

      {/* Field Picker Modal */}
      <Modal
        isOpen={pickerState.isOpen}
        onClose={() => setPickerState({ isOpen: false, layoutId: null, slotIndex: 0 })}
        title="Select Field Type"
        maxWidth="max-w-xl"
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['Input', 'Selection', 'Static'].map(cat => (
              <div key={cat} className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">{cat} Components</h4>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPES.filter(t => t.category === cat).map(type => (
                    <button
                      key={type.value}
                      onClick={() => handleSelectFieldType(type.value)}
                      className="p-3 flex flex-col items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl hover:border-clinicPrimary hover:bg-clinicPrimary/5 transition-all group"
                    >
                      <span className="text-clinicPrimary group-hover:scale-110 transition-transform">
                        {type.icon}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CreateTemplate;
