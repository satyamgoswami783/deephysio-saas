import React, { useState, useEffect, useRef } from 'react';
import { FaEnvelope, FaUser, FaTimes, FaCheck, FaSpinner, FaPaperPlane } from 'react-icons/fa';
import Modal from './Modal';
import Button from './Button';
import API_BASE_URL, { fetchApi } from '../../config/api';
import { useToast } from '../../context/ToastContext';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { getInvoiceDisplayNumber } from '../../utils/invoiceDisplay';

const EmailModal = ({ 
  isOpen, 
  onClose, 
  data, 
  type, // 'Note', 'Form', 'Template', 'FormTemplate'
  patientId: initialPatientId,
  patientEmail: initialPatientEmail,
  patientName: initialPatientName
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(initialPatientId ? 'compose' : 'select-patient');
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [emailData, setEmailData] = useState({
    recipient: initialPatientEmail || '',
    subject: `Clinical Document: ${type || 'Record'}`,
    message: `Please find the attached ${type ? type.toLowerCase() : 'document'} from DeePhysio Clinic.`
  });
  
  const [isSending, setIsSending] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialPatientId) {
        setStep('compose');
        setEmailData(prev => ({
          ...prev,
          recipient: initialPatientEmail || '',
          subject: `Clinical Document: ${type || 'Record'}`
        }));
        setSelectedPatient({
            id: initialPatientId,
            name: initialPatientName,
            email: initialPatientEmail
        });
      } else {
        setStep('select-patient');
        fetchPatients();
        setEmailData(prev => ({
          ...prev,
          subject: `Clinical Document: ${type || 'Record'}`
        }));
      }
    }
  }, [isOpen, initialPatientId, initialPatientEmail, initialPatientName, type]);

  const fetchPatients = async () => {
    try {
      const res = await fetchApi('/patients');
      if (res && res.ok) {
        const result = await res.json();
        if (result.success) {
          setPatients(result.data.map(p => ({
            ...p,
            name: `${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`.trim()
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setEmailData(prev => ({
      ...prev,
      recipient: patient.email || ''
    }));
    setStep('compose');
  };

  const generatePdfBlob = async () => {
    if (!exportRef.current) return null;
    
    try {
      // Ensure hidden renderer is visible for a moment to capture
      const el = exportRef.current;
      el.style.display = 'block';
      
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const ratio = canvasWidth / pdfWidth;
      const imgHeight = canvas.height / ratio;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      
      el.style.display = 'none';
      return pdf.output('blob');
    } catch (error) {
      console.error('PDF generation error:', error);
      return null;
    }
  };

  const handleSend = async () => {
    if (!emailData.recipient) {
      showToast('Recipient email is required.', 'warning');
      return;
    }

    setIsSending(true);
    try {
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) {
        showToast('Failed to generate document attachment.', 'error');
        setIsSending(false);
        return;
      }

      const formData = new FormData();
      formData.append('patientId', selectedPatient.id);
      formData.append('subject', emailData.subject);
      formData.append('body', emailData.message);
      formData.append('recipientEmail', emailData.recipient); 
      const docTypeStr = type ? type.toLowerCase() : 'document';
      const documentId = type === 'Invoice'
        ? getInvoiceDisplayNumber(data, data?.id)
        : (data?.id || data?.displayId || Date.now());
      const fileName = `${docTypeStr}-${documentId}.pdf`;

      formData.append('pdfDocument', pdfBlob, fileName);

      const token = sessionStorage.getItem('token') || sessionStorage.getItem('deephysio_token');
      const response = await fetch(`${API_BASE_URL}/communication/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        showToast(result.data?.message || 'Email sent successfully!', result.data?.isSimulation ? 'info' : 'success');
        onClose();
      } else {
        showToast(result.message || 'Failed to send email.', 'error');
      }
    } catch (error) {
      console.error('Send error:', error);
      showToast('Connection error. Could not send email.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'select-patient' ? 'Select Patient Recipient' : 'Compose Email'}
      maxWidth="max-w-xl"
    >
      <div className="p-1">
        {step === 'select-patient' ? (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search patient by name or email..."
                className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            
            <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {filteredPatients.length > 0 ? (
                filteredPatients.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => handlePatientSelect(p)}
                    className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-clinicPrimary hover:bg-clinicPrimary/5 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-clinicPrimary group-hover:bg-white transition-colors">
                        <FaUser size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{p.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.email || 'No email saved'}</p>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-slate-50 text-slate-400 group-hover:bg-clinicPrimary group-hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                      Select
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400 italic text-sm font-bold uppercase tracking-widest">No patients found</div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-clinicPrimary">
                    <FaUser size={12} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Recipient</p>
                    <p className="text-[13px] font-black text-slate-800">{selectedPatient?.name}</p>
                  </div>
               </div>
               {!initialPatientId && (
                 <button 
                  onClick={() => setStep('select-patient')}
                  className="text-[10px] font-bold text-clinicPrimary hover:underline uppercase tracking-widest"
                 >
                   Change
                 </button>
               )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary"
                  value={emailData.recipient}
                  onChange={(e) => setEmailData({...emailData, recipient: e.target.value})}
                  placeholder="patient@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Message Body</label>
                <textarea
                  className="w-full min-h-[100px] px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary resize-none"
                  value={emailData.message}
                  onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button 
                variant="secondary" 
                className="flex-1 py-3 h-auto text-[11px] font-black uppercase tracking-widest rounded-xl"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                className="flex-[2] py-3 h-auto text-[11px] font-black uppercase tracking-widest rounded-xl bg-clinicPrimary text-white shadow-lg shadow-clinicPrimary/20"
                onClick={handleSend}
                disabled={isSending}
                leftIcon={isSending ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
              >
                {isSending ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          </div>
        )}

        {/* HIDDEN RENDERER FOR PDF GENERATION */}
        <div className="fixed -left-[9999px] top-0 pointer-events-none">
          <div ref={exportRef} style={{ display: 'none' }} className="w-[800px] bg-white p-12 text-slate-800 font-sans">
            {renderPreview(type, data, selectedPatient)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Internal function to render the document for the PDF
const renderPreview = (type, data, patient) => {
  if (!data) return <div>No data to render</div>;

  return (
    <div className="space-y-8">
      {/* Clinic Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#2EA7B8] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">CP</div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">ClinicPilot</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Clinical Documentation Node</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Type</p>
          <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{type}</p>
          <p className="text-[11px] font-bold text-slate-500 mt-1">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Patient Info */}
      <div className="grid grid-cols-2 gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="space-y-1">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Patient Name</p>
          <p className="text-[14px] font-black text-slate-800">{patient?.name || 'N/A'}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Patient ID</p>
          <p className="text-[14px] font-black text-slate-800">#{patient?.id || 'N/A'}</p>
        </div>
      </div>

      {/* Content Rendering based on type */}
      <div className="space-y-6">
        {type === 'Note' && (
          <div className="space-y-6">
            {['Subjective', 'Objective', 'Assessment', 'Plan'].map(section => (
              data[section.toLowerCase()] && (
                <div key={section} className="space-y-2">
                  <h3 className="text-[11px] font-black text-[#2EA7B8] uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-[#2EA7B8] rounded-full"></div> {section} Findings
                  </h3>
                  <div className="p-4 bg-white border border-slate-100 rounded-xl text-sm font-medium text-slate-700 leading-relaxed shadow-sm">
                    {data[section.toLowerCase()]}
                  </div>
                </div>
              )
            ))}
            
            {data.dynamicContent && data.dynamicContent.layouts && (
                <div className="space-y-4 mt-6">
                    {data.dynamicContent.layouts.map((layout, lIdx) => (
                        <div key={lIdx} className={`grid gap-4 ${layout.type === 'split' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {layout.fields.map((field, fIdx) => {
                                if (!field || ['heading', 'helper_text', 'horizontal_line', 'signature'].includes(field.type)) return null;
                                const val = (data.dynamicContent.responses?.[field.id] || data.dynamicContent.values?.[field.id] || '-');
                                return (
                                    <div key={field.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{field.label || field.id}</p>
                                        <p className="text-[13px] font-bold text-slate-700">{Array.isArray(val) ? val.join(', ') : val}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
          </div>
        )}

        {(type === 'Form' || type === 'Assessment') && (
          <div className="space-y-4">
             <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-2">{data.templateName || 'Form Submission'}</h2>
             <div className="grid grid-cols-1 gap-4">
                {Object.entries(data.responses || {}).map(([key, value], idx) => {
                    const label = data.fieldLabelMap?.[key] || data.fallbackLabels?.[idx] || key;
                    if (typeof value === 'string' && value.startsWith('data:image')) {
                        return (
                            <div key={key} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                                <img src={value} alt="Attachment" className="max-h-40 rounded" />
                            </div>
                        );
                    }
                    return (
                        <div key={key} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                            <p className="text-[13px] font-bold text-slate-700">{Array.isArray(value) ? value.join(', ') : (value || '-')}</p>
                        </div>
                    );
                })}
             </div>
          </div>
        )}

        {type === 'Template' && (
          <div className="space-y-6">
             <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-2">{data.name || 'Note Template'}</h2>
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">Note: This is a blank template for reference.</p>
             <div className="grid grid-cols-1 gap-3">
                {(data.sections || []).map((s, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-[10px] font-black text-[#2EA7B8] uppercase tracking-widest mb-1">{s.title}</p>
                        <p className="text-[12px] italic text-slate-300">_________________________________________________________</p>
                    </div>
                ))}
             </div>
          </div>
        )}
        
        {type === 'FormTemplate' && (
            <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-2">{data.name || 'Form Template'}</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">Note: This is a blank form template for reference.</p>
                <div className="grid grid-cols-1 gap-4">
                    {(Array.isArray(data.fields) ? data.fields : []).map((field, idx) => {
                        if (['heading', 'helper_text', 'horizontal_line'].includes(field.type)) return null;
                        return (
                            <div key={idx} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{field.label} {field.required ? '*' : ''}</p>
                                <div className="h-8 w-full border border-slate-100 bg-slate-50 rounded italic px-3 flex items-center text-[11px] text-slate-300">
                                    {field.placeholder || 'Type here...'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {type === 'Invoice' && (
            <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Invoice {getInvoiceDisplayNumber(data, data?.id)}</h2>
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100">{data.status || 'Paid'}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                        <p className="text-[14px] font-bold text-slate-800">{data.date}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
                        <p className="text-[20px] font-black text-slate-900">{data.amount}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-[#2EA7B8] uppercase tracking-widest">Service Details</p>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[13px] font-bold text-slate-700">{data.description || 'Physiotherapy Services'}</p>
                        {data.method && <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Payment Method: {data.method}</p>}
                    </div>
                </div>
            </div>
        )}

        {type === 'Medical History' && (
            <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-2">Complete Medical History</h2>
                <div className="space-y-4">
                    {(Array.isArray(data) ? data : []).map((section, idx) => (
                        <div key={idx} className="space-y-2">
                            <h3 className="text-[10px] font-black text-[#2EA7B8] uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-[#2EA7B8] rounded-full"></div> {section.title}
                            </h3>
                            <div className="p-4 bg-white border border-slate-100 rounded-xl text-[13px] font-medium text-slate-700 whitespace-pre-wrap">
                                {section.content || 'None recorded'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-10 border-t border-slate-100 flex justify-between items-center opacity-50">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Digitally Generated via DeePhysio Clinical OS</p>
        <p className="text-[9px] font-bold text-slate-400">Page 1 of 1</p>
      </div>
    </div>
  );
};

export default EmailModal;
