import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaHistory, FaPrint, FaEdit, FaCheck, FaHeading, FaCalendarAlt, FaEnvelope } from 'react-icons/fa';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import PatientIcon from '../components/ui/PatientIcon';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { fetchApi } from '../config/api';
import { useToast } from '../context/ToastContext';
import EmailModal from '../components/ui/EmailModal';

const ViewNote = () => {
   const navigate = useNavigate();
   const { id } = useParams();
   const [emailModalOpen, setEmailModalOpen] = useState(false);
   const [noteData, setNoteData] = useState(null);

   const [note, setNote] = useState(null);

   const [isLoading, setIsLoading] = useState(true);

   const hasMeaningfulText = (value) => typeof value === 'string' && value.trim().length > 0;
   const toPrettyLabel = (raw = '') =>
      String(raw || '')
         .replace(/[_-]+/g, ' ')
         .replace(/([a-z])([A-Z])/g, '$1 $2')
         .trim()
         .replace(/\b\w/g, (c) => c.toUpperCase());
   const normalizeKey = (raw = '') => String(raw || '').toLowerCase().replace(/[^a-z0-9]/g, '');
   const getFieldLabel = (field, fallback = 'Untitled Section') =>
      field?.label ||
      field?.title ||
      field?.name ||
      field?.placeholder ||
      (field?.id ? toPrettyLabel(field.id) : fallback);
   const getResponseValue = (responses = {}, field = {}) => {
      const id = field?.id;
      const label = getFieldLabel(field, '');
      const keyCandidates = [
         id,
         String(id || ''),
         label,
         field?.name,
         field?.title,
         field?.placeholder
      ].filter(Boolean);

      for (const candidate of keyCandidates) {
         if (Object.prototype.hasOwnProperty.call(responses, candidate)) {
            return responses[candidate];
         }
      }

      const normalizedCandidateKeys = keyCandidates.map(normalizeKey).filter(Boolean);
      if (!normalizedCandidateKeys.length) return null;

      for (const [k, v] of Object.entries(responses || {})) {
         const normalizedExisting = normalizeKey(k);
         if (normalizedCandidateKeys.includes(normalizedExisting)) {
            return v;
         }
      }

      return null;
   };

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

   const parseDynamicFromPlan = (planText) => {
      if (!planText || typeof planText !== 'string') return { cleanPlan: planText, entries: [] };
      const marker = 'Dynamic Template Data:';
      const markerIndex = planText.indexOf(marker);
      if (markerIndex === -1) return { cleanPlan: planText, entries: [] };

      const cleanPlan = planText.slice(0, markerIndex).trim();
      const dynamicBlock = planText.slice(markerIndex + marker.length).trim();
      const entries = dynamicBlock
         .split('\n')
         .map((line) => line.trim())
         .filter(Boolean)
         .map((line) => {
            const splitIndex = line.indexOf(':');
            if (splitIndex === -1) return { label: 'Field', value: line };
            return {
               label: line.slice(0, splitIndex).trim(),
               value: line.slice(splitIndex + 1).trim()
            };
         });

      return { cleanPlan, entries };
   };

   useEffect(() => {
      const fetchNote = async () => {
         setIsLoading(true);
         try {
            const res = await fetchApi(`/clinical-notes/${id}`);
            if (res) {
               const data = await res.json();
               if (data.success) {
                  const n = data.data;
                  const normalizedDynamic = normalizeDynamicContent(
                     n.dynamicContent ?? n.dynamic_content
                  );
                  setNoteData(n);
                  setNote({
                     ...n,
                     patientName: `${n.patient?.firstName || n.patient?.first_name || ''} ${n.patient?.lastName || n.patient?.last_name || ''}`.trim(),
                     therapistName: n.therapist?.name || 'N/A',
                     category: n.type,
                     date: new Date(n.date).toLocaleDateString('en-GB'),
                     time: new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                     dynamicContent: normalizedDynamic,
                     parsedContent: {
                        subjective: n.subjective,
                        objective: n.objective,
                        assessment: n.assessment,
                        plan: n.plan
                     },
                     parsedDynamicFromPlan: parseDynamicFromPlan(n.plan)
                  });
               } else {
                  navigate('/notes');
               }
            }
         } catch (e) {
            navigate('/notes');
         } finally {
            setIsLoading(false);
         }
      };

      if (id) fetchNote();
   }, [id, navigate]);

   if (isLoading || !note) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center">
               <div className="w-10 h-10 border-4 border-clinicPrimary/20 border-t-clinicPrimary rounded-full animate-spin"></div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Syncing Ledger...</p>
            </div>
         </div>
      );
   }

   const hasTemplateResponses = (note.parsedDynamicFromPlan?.entries?.length || 0) > 0;
   const treatmentText = hasMeaningfulText(note.parsedDynamicFromPlan?.cleanPlan)
      ? note.parsedDynamicFromPlan.cleanPlan
      : (hasTemplateResponses ? '' : (note.parsedContent.plan || ''));

   return (
      <div className="max-w-3xl mx-auto space-y-3 animate-fade-in p-4 sm:p-6 md:pt-4 font-sans custom-scrollbar">
         <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-4 sm:gap-5">
               <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-premium flex items-center justify-center text-slate-400 hover:text-clinicPrimary hover:shadow-google hover:-translate-x-1 transition-all active:scale-90 shrink-0"
               >
                  <FaArrowLeft size={14} />
               </button>
               <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
                  <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">Review Clinical Note</h1>
                  <div className="flex items-center gap-3">
                     <span className="px-2 py-0.5 bg-clinicPrimary/10 text-clinicPrimary rounded text-[8px] font-black uppercase tracking-widest border border-clinicPrimary/20">{note.category}</span>
                     <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">{note.date} • {note.time}</span>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-3 mt-2 sm:mt-0">
               <Button
                  onClick={() => setEmailModalOpen(true)}
                  variant="secondary"
                  className="h-10 px-4 rounded-xl text-[10px] uppercase tracking-widest font-black flex items-center gap-2 border-slate-100 shadow-premium hover:text-clinicPrimary transition-all"
                  leftIcon={<FaEnvelope size={12} />}
               >
                  Email Patient
               </Button>
            </div>
         </div>

         <Card className="p-4 sm:p-6 border-none shadow-premium bg-white space-y-6 group relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-clinicPrimary/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-clinicPrimary/10 transition-all duration-1000"></div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 sm:p-5 bg-slate-50/50 rounded-2xl border border-slate-100/50 gap-4 relative z-10">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-clinicPrimary shadow-sm shrink-0">
                     <PatientIcon size={24} />
                  </div>
                  <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Patient</p>
                     <p className="text-[13px] font-black text-slate-900 tracking-tight leading-none">{note.patientName}</p>
                  </div>
               </div>
               <div className="h-px w-full md:w-px md:h-10 bg-slate-200"></div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-500 shadow-sm shrink-0">
                     <ClinicalNoteIcon size={14} />
                  </div>
                  <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Attending Clinician</p>
                     <p className="text-[11px] font-extrabold text-slate-700 tracking-tight leading-none">{note.therapistName || note.author}</p>
                  </div>
               </div>
            </div>

            <div className="space-y-6 relative z-10 pt-2">
               {note.dynamicContent && note.dynamicContent.layouts ? (
                  <div className="space-y-4">
                     {note.dynamicContent.layouts.map((layout, lIdx) => (
                        <div key={lIdx} className={`grid gap-6 ${layout.type === 'split' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                           {layout.fields.map((field, fIdx) => {
                              if (!field) return <div key={fIdx} />;
                              if (field.type === 'signature') return <div key={fIdx} />;
                              const value = getResponseValue(note.dynamicContent.responses || {}, field);

                              if (field.type === 'heading') return <h3 key={field.id} className="text-sm font-black text-slate-800 tracking-tight pt-2 border-b border-slate-100 pb-1">{getFieldLabel(field)}</h3>;
                              if (field.type === 'helper_text') return <p key={field.id} className="text-[11px] text-slate-400 italic font-medium">{getFieldLabel(field, 'Note')}</p>;
                              if (field.type === 'horizontal_line') return <hr key={field.id} className="border-slate-100" />;

                              return (
                                 <div key={field.id} className="space-y-1.5 p-3 rounded-xl bg-slate-50/30 border border-slate-100/50">
                                    <h4 className="text-[9px] font-black text-slate-400 tracking-widest flex items-center gap-2">
                                       {getFieldLabel(field)}
                                    </h4>

                                    <p className="text-[13px] font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                                       {Array.isArray(value) ? value.join(', ') : (value || '-')}
                                    </p>
                                 </div>
                              );
                           })}
                        </div>
                     ))}
                  </div>
               ) : (
                  <>
                     {hasMeaningfulText(note.parsedContent.subjective) && (
                        <div className="space-y-2">
                           <h4 className="text-[9px] font-black text-clinicPrimary uppercase tracking-[0.25em] flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-clinicPrimary"></div> Subjective Findings
                           </h4>
                           <p className="text-[12px] font-medium text-slate-600 leading-relaxed bg-slate-50 p-3 sm:p-4 rounded-lg border border-slate-100 italic">
                              "{note.parsedContent.subjective}"
                           </p>
                        </div>
                     )}

                     {hasMeaningfulText(note.parsedContent.objective) && (
                        <div className="space-y-2">
                           <h4 className="text-[9px] font-black text-clinicPrimary uppercase tracking-[0.25em] flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-clinicPrimary"></div> Objective Assessment
                           </h4>
                           <p className="text-[12px] font-medium text-slate-700 leading-relaxed bg-white p-3 sm:p-4 rounded-lg border border-slate-100 shadow-sm">
                              {note.parsedContent.objective}
                           </p>
                        </div>
                     )}

                     {hasMeaningfulText(note.parsedContent.assessment) && (
                        <div className="space-y-2">
                           <h4 className="text-[9px] font-black text-clinicPrimary uppercase tracking-[0.25em] flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-clinicPrimary"></div> Clinical Assessment
                           </h4>
                           <p className="text-[12px] font-medium text-slate-700 leading-relaxed bg-white p-3 sm:p-4 rounded-lg border border-slate-100 shadow-sm">
                              {note.parsedContent.assessment}
                           </p>
                        </div>
                     )}

                     {hasMeaningfulText(treatmentText) && (
                        <div className="space-y-2">
                           <h4 className="text-[9px] font-black text-clinicPrimary uppercase tracking-[0.25em] flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-clinicPrimary"></div> Treatment Plan & Next Steps
                           </h4>
                           <p className="text-[12px] font-medium text-slate-700 leading-relaxed bg-white p-3 sm:p-4 rounded-lg border border-clinicPrimary/20 shadow-sm">
                              {treatmentText}
                           </p>
                        </div>
                     )}
                     {note.parsedDynamicFromPlan?.entries?.length > 0 && (
                        <div className="space-y-2">
                           <h4 className="text-[9px] font-black text-clinicPrimary uppercase tracking-[0.25em] flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-clinicPrimary"></div> Template Responses
                           </h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {note.parsedDynamicFromPlan.entries.map((entry, index) => {
                                 const normalizedLabel = !entry.label || entry.label.toLowerCase() === 'untitled section'
                                    ? `Section ${index + 1}`
                                    : entry.label;
                                 return (
                                    <div
                                       key={`${entry.label}-${index}`}
                                       className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm"
                                    >
                                       <p className="text-[9px] font-black text-clinicPrimary tracking-widest mb-2">
                                          {normalizedLabel}
                                       </p>
                                       <p className="text-[12px] font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                                          {entry.value || '-'}
                                       </p>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>
                     )}
                  </>
               )}
            </div>

            {/* Footer details removed per request */}
         </Card>

      <EmailModal
         isOpen={emailModalOpen}
         onClose={() => setEmailModalOpen(false)}
         type="Note"
         data={noteData}
         patientId={noteData?.patientId || noteData?.patient_id}
         patientName={note?.patientName}
         patientEmail={noteData?.patient?.email || noteData?.patient_email}
      />
   </div>
);
};
export default ViewNote;
