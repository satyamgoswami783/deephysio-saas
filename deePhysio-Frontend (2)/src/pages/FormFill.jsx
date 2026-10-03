import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FaCheck, FaTimes, FaUserAlt, FaWpforms, FaLock, FaRegDotCircle,
  FaMagic, FaHeading, FaInfoCircle, FaMinus, FaCaretDown, FaEnvelope, FaSave
} from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import SignaturePad from '../components/ui/SignaturePad';
import AnnotationCanvas from '../components/ui/AnnotationCanvas';
import EmailModal from '../components/ui/EmailModal';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';

const FormFill = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [patientData, setPatientData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');

  const [template, setTemplate] = useState(null);
  const [responses, setResponses] = useState({});

  useEffect(() => {
    if (patientId) {
        const fetchP = async () => {
            const res = await fetchApi(`/patients/${patientId}`);
            if (res && res.ok) {
                const result = await res.json();
                if (result.success) setPatientData(result.data);
            }
        };
        fetchP();
    }
  }, [patientId]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      showToast('No patient context selected.', 'error');
      navigate('/forms');
      return;
    }

    const fetchTemplate = async () => {
      setIsLoading(true);
      try {
        const response = await fetchApi(`/form-templates/${id}`);
        if (!response) return;
        const resData = await response.json();

        if (resData.success) {
          const formTemplate = resData.data;

          // MIGRATION: Ensure layouts exist
          if (!formTemplate.layouts && formTemplate.fields) {
            formTemplate.layouts = formTemplate.fields.map(f => ({
              id: `l_${Math.random()}`,
              type: 'full',
              fields: [f]
            }));
          }

          setTemplate(formTemplate);

          // Initialize responses
          const initialResponses = {};
          const allFields = formTemplate.layouts.flatMap(l => l.fields).filter(f => f !== null && f.type !== 'import');

          allFields.forEach(field => {
            if (['heading', 'helper_text', 'horizontal_line'].includes(field.type)) return;

            if (field.type === 'checkbox') {
              initialResponses[field.id] = [];
            } else {
              initialResponses[field.id] = '';
            }
          });
          setResponses(initialResponses);
        } else {
          showToast('Clinical Protocol not found.', 'error');
          navigate('/forms');
        }
      } catch (error) {
        showToast('Hydration failed.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplate();
  }, [id, patientId, navigate, showToast]);

  const handleInputChange = (fieldId, value) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleCheckboxChange = (fieldId, option, isChecked) => {
    setResponses(prev => {
      const currentList = prev[fieldId] || [];
      if (isChecked) {
        return { ...prev, [fieldId]: [...currentList, option] };
      } else {
        return { ...prev, [fieldId]: currentList.filter(item => item !== option) };
      }
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Validation
    const allFields = template.layouts.flatMap(l => l.fields).filter(f => f !== null && f.type !== 'import');
    const missingRequired = allFields.find(f => {
      if (!f.required) return false;
      const val = responses[f.id];
      if (f.type === 'checkbox') return !val || val.length === 0;
      return !val || String(val).trim() === '';
    });

    if (missingRequired) {
      showToast(`Required answer missing: "${missingRequired.label}"`, 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const cleanPatientId = String(patientId).replace('PID-', '');
      const allFields = template.layouts.flatMap(l => l.fields).filter(f => f !== null && f.type !== 'import');
      const fieldMeta = allFields.reduce((acc, field) => {
        acc[field.id] = {
          label: field.label || field.id,
          type: field.type || 'text'
        };
        return acc;
      }, {});
      const payload = {
        templateId: template.id,
        patientId: parseInt(cleanPatientId, 10),
        responses: {
          values: responses,
          fieldMeta
        }
      };

      const response = await fetchApi('/form-submissions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response) return;
      const resData = await response.json();

      if (resData.success) {
        showToast('Assessment protocol synchronized successfully.', 'success');
        navigate(`/patients/profile/${cleanPatientId}?tab=forms`);
      } else {
        showToast(resData.message || 'Synchronization failed.', 'error');
      }
    } catch (error) {
       showToast('Server connection failed.', 'error');
    } finally {
       setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    if (!field) return null;
    if (field.type === 'import') return null;

    switch (field.type) {
      case 'heading':
        return <h3 className="text-[11px] font-black text-slate-800 border-b border-slate-100 pb-1 mb-2 mt-2 tracking-wider">{field.label}</h3>;

      case 'helper_text':
        return (
          <div className="flex gap-2 p-2 bg-blue-50/50 rounded-lg border border-blue-100/50 text-blue-600/80 mb-1">
            <FaInfoCircle className="mt-0.5 shrink-0" size={10} />
            <p className="text-[10px] font-medium leading-relaxed">{field.label || 'Informative clinical note.'}</p>
          </div>
        );

      case 'horizontal_line':
        return <hr className="border-t-2 border-slate-100 my-8 shadow-sm" />;

      default:
        return (
          <div className="space-y-4">
            <label className="block pl-1">
              <span className="text-[10px] font-bold text-slate-700 flex flex-wrap items-baseline gap-2 tracking-wide">
                {field.label} {field.required && <span className="text-rose-500 font-black text-[8px]">* REQUIRED</span>}
              </span>
              {field.placeholder && <p className="text-[8px] text-slate-400 font-medium uppercase mt-0.5 tracking-wider">{field.placeholder}</p>}
            </label>

            {field.type === 'short' && (
              <input
                type="text"
                required={field.required}
                value={responses[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#2EA7B8]/20 focus:border-[#2EA7B8] transition-all text-[11px] font-bold text-slate-700"
              />
            )}

            {field.type === 'text' && (
              <textarea
                required={field.required}
                value={responses[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                placeholder="Provide detailed description..."
                className="w-full min-h-[80px] p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#2EA7B8]/20 focus:border-[#2EA7B8] transition-all text-[11px] font-bold text-slate-700 resize-y"
              />
            )}

            {field.type === 'date' && (
              <input
                type="date"
                required={field.required}
                value={responses[field.id] || ''}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#2EA7B8]/20 focus:border-[#2EA7B8] transition-all text-[11px] font-bold text-slate-700 appearance-none"
              />
            )}

            {field.type === 'dropdown' && (
              <div className="relative">
                <select
                  required={field.required}
                  value={responses[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full h-8 px-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#2EA7B8]/20 focus:border-[#2EA7B8] transition-all text-[11px] font-bold text-slate-700 appearance-none"
                >
                  <option value="" disabled>Choose one...</option>
                  {field.options && field.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                </select>
                <FaCaretDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            {field.type === 'single_choice' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {field.options && field.options.map((opt, i) => (
                  <label key={i} className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${responses[field.id] === opt ? 'bg-emerald-50 border-[#2EA7B8] shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <input
                      type="radio"
                      name={field.id}
                      className="sr-only"
                      checked={responses[field.id] === opt}
                      onChange={() => handleInputChange(field.id, opt)}
                    />
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${responses[field.id] === opt ? 'border-[#2EA7B8]' : 'border-slate-300'}`}>
                      {responses[field.id] === opt && <div className="w-1.5 h-1.5 rounded-full bg-[#2EA7B8]" />}
                    </div>
                    <span className={`text-[10px] font-bold ${responses[field.id] === opt ? 'text-[#2EA7B8]' : 'text-slate-600'}`}>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {field.type === 'checkbox' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {field.options && field.options.map((opt, i) => (
                  <label key={i} className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${(responses[field.id] || []).includes(opt) ? 'bg-emerald-50 border-[#2EA7B8] shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={(responses[field.id] || []).includes(opt)}
                      onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)}
                    />
                    <div className={`w-3.5 h-3.5 rounded-md border-2 flex items-center justify-center transition-all ${(responses[field.id] || []).includes(opt) ? 'bg-[#2EA7B8] border-[#2EA7B8]' : 'border-slate-300 bg-white'}`}>
                      <FaCheck size={7} className="text-white" />
                    </div>
                    <span className={`text-[10px] font-bold ${(responses[field.id] || []).includes(opt) ? 'text-[#2EA7B8]' : 'text-slate-600'}`}>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {field.type === 'signature' && (
              <div className="space-y-4">
                <SignaturePad
                  value={responses[field.id] || ''}
                  onChange={(val) => handleInputChange(field.id, val)}
                  required={field.required}
                  className="h-48 shadow-inner bg-slate-50 border-2 border-dashed border-slate-200"
                  placeholder="Provide your digital signature..."
                />
                <p className="text-[7px] text-slate-400 text-center font-black uppercase tracking-widest leading-relaxed px-4">
                  By signing above, I verify that the information provided is accurate and my digital mark acts as my legal signature.
                </p>
              </div>
            )}

          </div>
        );
    }
  };

  if (isLoading || !template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse font-sans">
        <div className="w-16 h-16 border-4 border-clinicPrimary/30 border-t-clinicPrimary rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Protocol Sync in progress...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/50 font-sans py-4 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-3 animate-fade-in pb-20">

        {/* Navigation */}
        <div className="flex justify-between items-center mb-1">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-slate-400 hover:text-[#2EA7B8] transition-colors text-[9px] font-black uppercase tracking-widest"
          >
            <FaTimes size={9} /> Exit Assessment
          </button>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/80 border border-slate-200 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest">
            <FaLock className="text-emerald-500" size={8} /> HIPAA Compliant Session
          </div>
        </div>

        {/* Protocol Header */}
        <Card className="p-4 bg-white border-none shadow-md rounded-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#2EA7B8] to-[#1a8fa0]" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
            <div className="space-y-1">
              <span className="px-2 py-0.5 bg-[#2EA7B8]/10 text-[#2EA7B8] rounded text-[8px] font-black uppercase tracking-widest border border-[#2EA7B8]/20">
                {template.category}
              </span>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight">
                {template.name}
              </h1>
              <p className="text-slate-400 font-bold text-[9px] flex items-center gap-1.5 uppercase tracking-widest">
                <FaWpforms size={9} /> Patient Assessment Protocol
              </p>
            </div>
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-[#2EA7B8] text-white flex items-center justify-center shadow">
                <FaUserAlt size={12} />
              </div>
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Active Patient ID</p>
                <p className="text-[11px] font-black text-slate-800">{patientId || 'GUEST-SESSION'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Protocol Engine */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {template.layouts.map((layout, lIdx) => (
            <div key={layout.id || lIdx} className={`grid gap-2.5 ${layout.type === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {layout.fields.filter(f => f !== null).map((field, fIdx) => (
                <Card key={field.id} className="p-3 bg-white border shadow-sm rounded-xl transition-all hover:shadow focus-within:ring-2 focus-within:ring-[#2EA7B8]/10 focus-within:border-[#2EA7B8]/40 border-slate-100 group">
                  {renderField(field)}
                </Card>
              ))}
            </div>
          ))}

          {/* Submission Layer */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
             <button
                type="button"
                onClick={() => setEmailModalOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-100"
              >
                <FaEnvelope size={12} /> Email Protocol
              </button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[#2EA7B8] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[#2EA7B8]/20 flex items-center justify-center gap-2 border-none transition-all hover:-translate-y-0.5 active:scale-95 text-[11px]"
            >
              {isSubmitting ? 'Synchronizing...' : (
                <>
                  <FaCheck size={11} /> Finalize Protocol
                </>
              )}
            </Button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[7px] text-slate-400 font-bold uppercase tracking-[0.2em]">Secure Data Synchronization to Clinical Database</p>
          </div>
        </form>

      </div>

      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        type="Form"
        data={{
            templateName: template?.name,
            responses: responses,
            fieldLabelMap: template?.layouts?.flatMap(l => l.fields).reduce((acc, f) => {
                if (f) acc[f.id] = f.label;
                return acc;
            }, {})
        }}
        patientId={patientId}
        patientName={patientData ? `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim() : ''}
        patientEmail={patientData?.email}
      />
    </div>
  );
};

export default FormFill;
