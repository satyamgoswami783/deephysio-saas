import React, { useMemo, useState, useEffect } from 'react';
import { 
  FaUsers, FaSms, FaEnvelope, FaPaperPlane, FaCheckCircle, 
  FaChevronRight, FaSearch, FaWhatsapp, FaHistory, FaCheckDouble,
  FaExclamationTriangle, FaMagic, FaSyncAlt
} from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { fetchApi } from '../config/api';

const BulkMessaging = () => {
  const role = (sessionStorage.getItem('deephysio_role') || 'admin').toLowerCase();
  const canWrite = ['admin', 'superadmin', 'billing', 'therapist', 'receptionist', 'administrator', 'staff'].includes(role);
  
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState('whatsapp'); // Default to WhatsApp
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const [patients, setPatients] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [visiblePatientsCount, setVisiblePatientsCount] = useState(9);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load Patients and Campaign History
  const loadData = async () => {
    try {
      const [pRes, cRes] = await Promise.allSettled([
        fetchApi('/patients?limit=500'),
        fetchApi('/communication/campaigns')
      ]);

      if (pRes.status === 'fulfilled' && pRes.value?.ok) {
        const json = await pRes.value.json();
        const pList = Array.isArray(json) ? json : (json?.data || []);
        const mapped = pList.map((p) => ({
          id: p.id,
          name: `${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`.trim() || `Patient #${p.id}`,
          phone: p.phone || p.contact_number || p.mobile || '',
          email: p.email || ''
        }));
        setPatients(mapped);
      }

      if (cRes.status === 'fulfilled' && cRes.value?.ok) {
        const cJson = await cRes.value.json();
        const cList = Array.isArray(cJson) ? cJson : (cJson?.data || []);
        setCampaigns(cList);
      }
    } catch (error) {
      console.error('Error loading bulk messaging data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectPatient = (id) => {
    if (selectedPatients.includes(id)) {
      setSelectedPatients(selectedPatients.filter((pId) => pId !== id));
    } else {
      setSelectedPatients([...selectedPatients, id]);
    }
  };

  const filteredPatients = useMemo(() => {
    const term = patientSearch.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((patient) => 
      patient.name.toLowerCase().includes(term) ||
      patient.phone.toLowerCase().includes(term) ||
      String(patient.id).includes(term)
    );
  }, [patients, patientSearch]);

  const visiblePatients = useMemo(
    () => filteredPatients.slice(0, visiblePatientsCount),
    [filteredPatients, visiblePatientsCount]
  );

  const canSeeMore = filteredPatients.length > visiblePatientsCount;

  const handleSelectAll = () => {
    const filteredIds = filteredPatients.map((p) => p.id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedPatients.includes(id));

    if (allFilteredSelected) {
      setSelectedPatients((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedPatients((prev) => {
        const merged = new Set([...prev, ...filteredIds]);
        return Array.from(merged);
      });
    }
  };

  const handleSearchChange = (value) => {
    setPatientSearch(value);
    setVisiblePatientsCount(9);
  };

  const insertVariable = (variable) => {
    setMessage((prev) => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + variable + ' ');
  };

  const setQuickTemplate = (tmpl) => {
    setMessage(tmpl);
  };

  const handleSendMessage = async () => {
    if (selectedPatients.length === 0 || !message.trim()) return;
    
    setIsSending(true);
    try {
      const response = await fetchApi('/communication/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          channel,
          message,
          recipients: selectedPatients
        })
      });

      if (!response) throw new Error('No server response');
      const json = await response.json();
      
      if (!response.ok || !json.success) {
        setToast({ 
          visible: true, 
          message: json.message || 'Campaign dispatch failed. Please check WhatsApp connection.', 
          type: 'error' 
        });
        setIsSending(false);
        setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
        return;
      }

      const resData = json.data || {};
      const sentCount = resData.sentCount !== undefined ? resData.sentCount : 0;
      const failedCount = resData.failedCount || 0;

      setIsSending(false);
      if (sentCount === 0 && failedCount > 0) {
        const firstReason = resData.logs?.find((l) => l.status === 'FAILED')?.reason || 'Please check WhatsApp connection in Settings and ensure recipient phone numbers are valid.';
        setToast({ 
          visible: true, 
          message: `Broadcast failed (${failedCount} failed): ${firstReason}`, 
          type: 'error' 
        });
      } else {
        setToast({ 
          visible: true, 
          message: `Dispatched to ${sentCount} patient(s) via ${channel.toUpperCase()}${failedCount > 0 ? ` (${failedCount} failed)` : ''}!`, 
          type: 'success' 
        });
        setSelectedPatients([]);
        setMessage('');
        loadData();
      }
      setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 5000);
    } catch (error) {
      setIsSending(false);
      setToast({ visible: true, message: error.message || 'Campaign dispatch failed', type: 'error' });
      setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 4000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 px-4 sm:px-5 py-4 animate-fade-in font-sans">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-2.5 rounded-xl shadow-xl flex items-center gap-3 border ${
            toast.type === 'error' 
              ? 'bg-rose-900 text-white border-rose-700' 
              : 'bg-slate-900 text-white border-white/10'
          }`}>
            {toast.type === 'error' ? (
              <FaExclamationTriangle className="text-rose-400 shrink-0" size={14} />
            ) : (
              <FaCheckCircle className="text-emerald-400 shrink-0" size={14} />
            )}
            <span className="text-xs font-black uppercase tracking-wider">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
            Bulk Messaging & Broadcast Hub
          </h1>
          <p className="text-slate-500 font-bold mt-1 uppercase tracking-wider text-[10px]">
            Send WhatsApp announcements, SMS alerts, and email updates to multiple patients simultaneously.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            title="Refresh patient list and campaigns"
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FaSyncAlt size={11} className={isSending ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Step 1: Select Patients */}
        <Card hover={false} className="p-4 border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <div className="flex justify-between items-center gap-2 mb-3">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <FaUsers className="text-clinicPrimary" size={12} /> 1. Select Target Patients
            </label>
            <button 
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-black text-clinicPrimary uppercase tracking-wider hover:opacity-75 transition-opacity"
            >
              {filteredPatients.length > 0 && filteredPatients.every((p) => selectedPatients.includes(p.id)) 
                ? 'Deselect All' 
                : 'Select All Filtered'}
            </button>
          </div>

          <div className="relative mb-3">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search patients by name, phone or MRN ID..."
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {visiblePatients.length > 0 ? (
              visiblePatients.map((patient) => {
                const isSelected = selectedPatients.includes(patient.id);
                return (
                  <button
                    type="button"
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient.id)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex justify-between items-center text-left ${
                      isSelected
                        ? 'bg-clinicPrimary-light border-clinicPrimary text-clinicPrimary-dark shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-black">{patient.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-medium truncate">
                        {patient.phone || 'No phone'} • MRN #{patient.id}
                      </div>
                    </div>
                    {isSelected ? (
                      <FaCheckCircle size={14} className="text-clinicPrimary shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0"></span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="sm:col-span-2 lg:col-span-3 py-8 text-center text-xs font-semibold text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                No patients found matching your search.
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center gap-2">
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
              Selected: <span className="text-clinicPrimary font-black text-sm">{selectedPatients.length}</span> / {patients.length} Patients
            </span>
            <div className="flex items-center gap-3">
              {canSeeMore && (
                <button
                  type="button"
                  onClick={() => setVisiblePatientsCount((prev) => prev + 9)}
                  className="text-xs font-black uppercase tracking-wider text-clinicPrimary hover:opacity-75 transition-opacity cursor-pointer"
                >
                  Show More (+9)
                </button>
              )}
              {visiblePatientsCount > 9 && (
                <button
                  type="button"
                  onClick={() => setVisiblePatientsCount(9)}
                  className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Show Less
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Step 2: Channel Selection */}
        <Card hover={false} className="p-4 border border-slate-200 shadow-sm bg-white rounded-2xl">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <FaChevronRight className="text-clinicPrimary rotate-90" size={10} /> 2. Delivery Channel
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button 
              type="button"
              onClick={() => setChannel('whatsapp')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                channel === 'whatsapp' 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 border-emerald-600 scale-[1.02]' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FaWhatsapp size={16} /> WhatsApp Broadcast
            </button>
            <button 
              type="button"
              onClick={() => setChannel('sms')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                channel === 'sms' 
                  ? 'bg-clinicPrimary text-white shadow-lg shadow-clinicPrimary/25 border-clinicPrimary scale-[1.02]' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FaSms size={16} /> SMS Text
            </button>
            <button 
              type="button"
              onClick={() => setChannel('email')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                channel === 'email' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 border-blue-600 scale-[1.02]' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FaEnvelope size={16} /> Email Message
            </button>
          </div>
        </Card>

        {/* Step 3: Message Content */}
        <Card hover={false} className="p-4 border border-slate-200 shadow-sm bg-white rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-2">
              <FaPaperPlane className="text-clinicPrimary" size={11} /> 3. Compose Broadcast Message
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Insert tag:</span>
              <button
                type="button"
                onClick={() => insertVariable('{{name}}')}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold transition-colors cursor-pointer"
              >
                {`{{name}}`}
              </button>
              <button
                type="button"
                onClick={() => insertVariable('{{first_name}}')}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold transition-colors cursor-pointer"
              >
                {`{{first_name}}`}
              </button>
              <button
                type="button"
                onClick={() => insertVariable('{{clinic}}')}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold transition-colors cursor-pointer"
              >
                {`{{clinic}}`}
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <FaMagic size={9} /> Presets:
            </span>
            <button
              type="button"
              onClick={() => setQuickTemplate('Hello {{first_name}}, please be informed that DeePhysio Clinic will have updated hours this week. For inquiries or rescheduling, reply directly to this message.')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 transition-colors cursor-pointer"
            >
              📢 Clinic Update
            </button>
            <button
              type="button"
              onClick={() => setQuickTemplate('Hello {{first_name}}, this is a friendly reminder to complete your prescribed home exercise routine today for optimal recovery.')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 transition-colors cursor-pointer"
            >
              🏋️ Exercise Reminder
            </button>
            <button
              type="button"
              onClick={() => setQuickTemplate('Hello {{name}}, thank you for choosing DeePhysio Clinic. How are your symptoms progressing after your latest session?')}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0 transition-colors cursor-pointer"
            >
              💙 Recovery Check-in
            </button>
          </div>

          <textarea 
            className="w-full h-28 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary resize-none transition-all placeholder:text-slate-400"
            placeholder="Type your message here... Use {{first_name}} or {{name}} to automatically personalize for each patient."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{message.length} characters</span>
            <span>Est. {selectedPatients.length} personalized messages will be sent</span>
          </div>
        </Card>

        {/* Action Button */}
        <div className="pt-2 flex flex-col items-center justify-center">
          <Button 
            variant="accent" 
            className={`w-full max-w-sm h-12 rounded-xl shadow-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 cursor-pointer ${
              channel === 'whatsapp' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : ''
            }`}
            onClick={handleSendMessage}
            disabled={!canWrite || isSending || selectedPatients.length === 0 || !message.trim()}
          >
            {isSending ? (
              <span className="flex items-center justify-center gap-2">
                <FaSyncAlt className="animate-spin" size={13} />
                Sending Broadcast to {selectedPatients.length} Patients...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <FaPaperPlane size={12} />
                Send Broadcast ({selectedPatients.length} Selected)
              </span>
            )}
          </Button>

          {!canWrite && (
            <p className="text-center text-xs font-bold text-amber-600 mt-2">
              Read-only access: staff permissions required to send broadcasts.
            </p>
          )}
        </div>

        {/* Recent Broadcast Campaigns History */}
        {campaigns.length > 0 && (
          <Card hover={false} className="p-4 border border-slate-200 shadow-sm bg-white rounded-2xl mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FaHistory className="text-clinicPrimary" /> Recent Broadcast Campaigns History
              </h3>
              <span className="text-[10px] font-bold text-slate-400">{campaigns.length} total</span>
            </div>

            <div className="overflow-x-auto divide-y divide-slate-100">
              {campaigns.slice(0, 6).map((camp) => {
                let recipientInfo = { total: 0, sentCount: 0 };
                try {
                  if (typeof camp.recipients_json === 'string') {
                    const parsed = JSON.parse(camp.recipients_json);
                    if (Array.isArray(parsed)) recipientInfo.total = parsed.length;
                    else if (parsed?.total) recipientInfo = parsed;
                  }
                } catch (_) {}

                return (
                  <div key={camp.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`px-2 py-0.2 rounded-md text-[9px] font-black uppercase ${
                          camp.channel === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' : 'bg-clinicPrimary/15 text-clinicPrimary-dark'
                        }`}>
                          {camp.channel}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">{camp.message}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {camp.created_at ? new Date(camp.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {recipientInfo.total || 1} recipients
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        camp.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {camp.status || 'SENT'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BulkMessaging;
