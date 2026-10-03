import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FaSave, FaTimes, FaPlus, FaAlignLeft, FaCheckSquare, 
  FaCalendarAlt, FaCaretDown, FaPenNib, FaFont, FaTrash,
  FaHeading, FaInfoCircle, FaMinus, FaLayerGroup, FaColumns,
  FaArrowsAltV, FaEye, FaWrench, FaClone, FaRegDotCircle,
  FaFileImport, FaImage, FaMagic, FaArrowsAlt
} from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import SignaturePad from '../components/ui/SignaturePad';
import AnnotationCanvas from '../components/ui/AnnotationCanvas';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';

const FIELD_TYPES = [
  { value: 'heading', label: 'Heading', icon: <FaHeading />, category: 'Static' },
  { value: 'helper_text', label: 'Helper Text', icon: <FaInfoCircle />, category: 'Static' },
  { value: 'horizontal_line', label: 'Horizontal Line', icon: <FaMinus />, category: 'Static' },
  
  { value: 'short', label: 'Short Text', icon: <FaFont />, category: 'Input' },
  { value: 'text', label: 'Paragraph', icon: <FaAlignLeft />, category: 'Input' },
  { value: 'date', label: 'Date Picker', icon: <FaCalendarAlt />, category: 'Input' },
  
  { value: 'single_choice', label: 'Single Choice', icon: <FaRegDotCircle />, category: 'Selection' },
  { value: 'checkbox', label: 'Multiple Choice', icon: <FaCheckSquare />, category: 'Selection' },
  { value: 'dropdown', label: 'Options List', icon: <FaCaretDown />, category: 'Selection' },
  
  { value: 'signature', label: 'Signature', icon: <FaPenNib />, category: 'Advanced' },
];

const CATEGORIES = [
  'Patient Intake', 
  'Medical History', 
  'Consent', 
  'Assessment', 
  'Treatment Plan', 
  'Home Exercises'
];

const FormBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formName, setFormName] = useState('');
  const [category, setCategory] = useState('Patient Intake');
  const [layouts, setLayouts] = useState([]);
  const [activeTab, setActiveTab] = useState('build'); // 'build' or 'preview'
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Field Picker Modal state
  const [pickerState, setPickerState] = useState({ isOpen: false, layoutId: null, slotIndex: 0 });

  useEffect(() => {
    if (id) {
      const fetchTemplate = async () => {
        setIsLoading(true);
        try {
          const response = await fetchApi(`/form-templates/${id}`);
          if (!response) return;
          const resData = await response.json();
          if (resData.success) {
            setFormName(resData.data.name);
            setCategory(resData.data.category);
            
            // MIGRATION LOGIC: Convert flat fields to layouts if needed
            if (resData.data.layouts) {
              setLayouts(resData.data.layouts);
            } else if (resData.data.fields) {
              const migratedLayouts = resData.data.fields.map(field => ({
                 id: `l_${Math.random().toString(36).substr(2, 9)}`,
                 type: 'full',
                 fields: [field]
              }));
              setLayouts(migratedLayouts);
            }
          } else {
            showToast('Template not found in clinical database.', 'error');
            navigate('/forms');
          }
        } catch (error) {
          showToast('Failed to hydrate template.', 'error');
        } finally {
          setIsLoading(false);
        }
      };
      fetchTemplate();
    }
  }, [id, navigate, showToast]);

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
      label: type === 'horizontal_line' ? '' : 'Untitled Field',
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

  const moveRow = (index, direction) => {
    const newLayouts = [...layouts];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newLayouts.length) return;
    [newLayouts[index], newLayouts[targetIndex]] = [newLayouts[targetIndex], newLayouts[index]];
    setLayouts(newLayouts);
  };

  const handleSaveForm = async () => {
    if (!formName.trim()) {
      showToast('Please enter a Form Name.', 'warning');
      return;
    }
    if (layouts.length === 0) {
      showToast('Please add at least one layout.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      // Flatten for legacy safety if needed, but we'll save layouts
      const payload = {
        name: formName.trim(),
        category: category,
        layouts: layouts,
        // Legacy support: collect all non-null fields
        fields: layouts.flatMap(l => l.fields.filter(f => f !== null))
      };

      const endpoint = id ? `/form-templates/${id}` : '/form-templates';
      const response = await fetchApi(endpoint, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });

      if (response) {
        showToast('Clinical Protocol saved successfully.', 'success');
        navigate('/forms');
      }
    } catch (error) {
      showToast('Database synchronization failed.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderFieldEditor = (layoutId, slotIndex, field) => {
    if (!field) {
      return (
        <button 
          onClick={() => openFieldPicker(layoutId, slotIndex)}
          className="w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 group hover:border-[#2EA7B8] hover:bg-emerald-50 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-[#2EA7B8] group-hover:text-white flex items-center justify-center transition-all">
            <FaPlus size={12} />
          </div>
          <span className="text-[10px] font-black text-slate-400 group-hover:text-[#2EA7B8] uppercase tracking-widest">Add Field</span>
        </button>
      );
    }

    const typeInfo = FIELD_TYPES.find(t => t.value === field.type);

    return (
      <div className="relative p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group/field">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-50 text-[#2EA7B8] rounded-lg">
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

        {/* Unified Label Input */}
        {field.type !== 'horizontal_line' && (
          <input 
            type="text"
            value={field.label}
            onChange={(e) => updateField(layoutId, slotIndex, 'label', e.target.value)}
            placeholder="Field Label / Question..."
            className="w-full text-sm font-bold text-slate-800 border-none bg-transparent outline-none mb-2 focus:text-[#2EA7B8]"
          />
        )}

        {/* Specific Configuration Views */}
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
                    className="text-[9px] font-black text-[#2EA7B8] uppercase mt-2 flex items-center gap-1"
                >
                    <FaPlus size={7} /> Add Option
                </button>
            </div>
        )}

        {field.type === 'heading' && <div className="h-px bg-slate-100 mt-1" />}
        {field.type === 'horizontal_line' && <div className="h-0.5 bg-slate-200 my-4" />}
        {field.type === 'signature' && <div className="h-12 border border-slate-100 bg-slate-50/50 rounded-xl flex items-center px-4 text-[10px] text-slate-300 font-black italic tracking-widest">Digital Signature Secure Pad</div>}
      </div>
    );
  };

  const renderPreviewField = (field) => {
      // Basic preview component as per FormFill logic
      return (
        <div key={field?.id} className="space-y-2">
            <label className="text-[11px] font-black text-slate-500 tracking-widest">{field?.label}</label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-300 text-xs italic">
                {field?.type} input will appear here...
            </div>
        </div>
      );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div className="w-16 h-16 border-4 border-clinicPrimary/30 border-t-clinicPrimary rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Hydrating Protocol Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 sm:px-10 max-w-7xl mx-auto py-4 animate-fade-in font-sans pb-24">
      {/* Dynamic Header */}
      <div className="relative bg-gradient-to-r from-[#2EA7B8] to-[#1a8fa0] rounded-2xl shadow-lg p-4 md:p-6 mb-4 overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/forms')} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/20 transition-all">
                <FaTimes />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none mb-1">{id ? 'Update Protocol' : 'Create Clinical Form'}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-white/60 font-bold text-[10px] uppercase tracking-widest">Protocol Builder v2.0</span>
                <div className="flex bg-black/10 rounded-lg p-0.5">
                    <button 
                        onClick={() => setActiveTab('build')}
                        className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${activeTab === 'build' ? 'bg-white text-[#2EA7B8] shadow-sm' : 'text-white/70 hover:text-white'}`}
                    >
                        <FaWrench className="inline mr-1" /> Build
                    </button>
                    <button 
                        onClick={() => setActiveTab('preview')}
                        className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${activeTab === 'preview' ? 'bg-white text-[#2EA7B8] shadow-sm' : 'text-white/70 hover:text-white'}`}
                    >
                        <FaEye className="inline mr-1" /> Preview
                    </button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSaveForm} 
              className="bg-white text-[#2EA7B8] px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2 border-none transition-all hover:bg-white hover:text-[#1a8fa0] hover:scale-[1.02] active:scale-95"
            >
              <FaSave size={12} /> {isSaving ? 'Synchronizing...' : 'Save Protocol'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Canvas */}
          <div className="lg:col-span-2 space-y-4">
            {activeTab === 'build' ? (
                <>
                {layouts.map((layout, index) => (
                    <div key={layout.id} className="group relative">
                        {/* Row Controls (Side) */}
                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moveRow(index, -1)} className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-[#2EA7B8] shadow-sm"><FaPlus className="rotate-180" size={8} style={{ transform: 'rotate(180deg)' }} /></button>
                            <button onClick={() => removeLayout(layout.id)} className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-rose-500 shadow-sm"><FaTrash size={8} /></button>
                            <button onClick={() => moveRow(index, 1)} className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-[#2EA7B8] shadow-sm"><FaPlus size={8} /></button>
                        </div>

                        <Card className="p-4 border-slate-200/60 bg-white/50 backdrop-blur-sm rounded-2xl">
                            <div className={`grid gap-4 ${layout.type === 'split' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                                {layout.fields.map((field, sIdx) => (
                                    <div key={sIdx}>{renderFieldEditor(layout.id, sIdx, field)}</div>
                                ))}
                            </div>
                        </Card>
                    </div>
                ))}

                {/* Add New Layout Section */}
                <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-center space-y-4">
                    <div>
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Add New Section Layout</h4>
                        <p className="text-[10px] text-slate-400 italic">Select the column structure for your next protocol row</p>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <button 
                            onClick={() => addLayout('full')}
                            className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-[#2EA7B8] hover:shadow-lg transition-all text-center space-y-2 w-32"
                        >
                            <FaLayerGroup size={24} className="mx-auto text-slate-300" />
                            <span className="block text-[10px] font-black text-slate-500 uppercase">Single Column</span>
                        </button>
                        <button 
                            onClick={() => addLayout('split')}
                            className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-[#2EA7B8] hover:shadow-lg transition-all text-center space-y-2 w-32"
                        >
                            <div className="flex gap-1 items-center justify-center">
                                <div className="w-3 h-5 bg-slate-100 rounded-sm" />
                                <div className="w-3 h-5 bg-slate-100 rounded-sm" />
                            </div>
                            <span className="block text-[10px] font-black text-slate-500 uppercase">Split View</span>
                        </button>
                    </div>
                </div>
                </>
            ) : (
                <Card className="p-10 space-y-8 bg-white min-h-[500px]">
                    <div className="border-b-2 border-slate-50 pb-6 text-center">
                        <h2 className="text-2xl font-black text-slate-800">{formName || 'Untitled Clinical Form'}</h2>
                        <span className="text-[10px] font-black text-white bg-clinicPrimary px-3 py-1 rounded-full uppercase tracking-widest mt-2 inline-block">{category}</span>
                    </div>
                    {layouts.map(l => (
                        <div key={l.id} className={`grid gap-6 ${l.type === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {l.fields.filter(f => f !== null).map(f => (
                                <div key={f.id}>{renderPreviewField(f)}</div>
                            ))}
                        </div>
                    ))}
                </Card>
            )}
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-4">
            <Card className="p-5 space-y-4 rounded-2xl border-slate-100">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                   <FaColumns className="text-[#2EA7B8]" /> Protocol Meta
                </h3>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Display Name</label>
                        <input 
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            placeholder="e.g. Shoulder Assessment"
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Classification</label>
                        <select 
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold appearance-none"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            <Card className="p-5 space-y-4 rounded-2xl border-slate-100 bg-emerald-50/30">
                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                   <FaMagic className="text-emerald-500" /> Stats
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 text-center">
                        <span className="block text-xl font-black text-emerald-600">{layouts.length}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase">Rows</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-emerald-100 text-center">
                        <span className="block text-xl font-black text-emerald-600">{layouts.reduce((acc, l) => acc + l.fields.filter(f => f !== null).length, 0)}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase">Fields</span>
                    </div>
                </div>
            </Card>
          </div>
      </div>

      {/* Field Picker Modal */}
      <Modal
        isOpen={pickerState.isOpen}
        onClose={() => setPickerState({ isOpen: false, layoutId: null, slotIndex: 0 })}
        title="Select Field Type"
        maxWidth="max-w-2xl"
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {['Input', 'Selection', 'Advanced', 'Static'].map(cat => (
              <div key={cat} className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">{cat} Components</h4>
                <div className="grid grid-cols-2 gap-2">
                    {FIELD_TYPES.filter(t => t.category === cat).map(type => (
                        <button
                            key={type.value}
                            onClick={() => handleSelectFieldType(type.value)}
                            className="p-3 flex flex-col items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#2EA7B8] hover:bg-emerald-50 transition-all group"
                        >
                            <span className="text-[#2EA7B8] group-hover:scale-110 transition-transform">
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

export default FormBuilder;
