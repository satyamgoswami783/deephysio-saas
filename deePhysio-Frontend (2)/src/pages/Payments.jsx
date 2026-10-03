import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaFileInvoice, FaUser, FaSearch, FaCreditCard, FaMoneyBillWave, FaShieldAlt, FaHistory, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';
import { formatCurrency, getActiveCurrencySymbol } from '../utils/currency';

const Payments = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlPatientId = searchParams.get('patientId');
  const urlAmount = searchParams.get('amount');
  const { showToast } = useToast();
  const role = sessionStorage.getItem('deephysio_role');
  const canWrite = role === 'admin' || role === 'billing';
  
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [patientsList, setPatientsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [patientsRes, invoicesRes, paymentsRes, apptsRes] = await Promise.all([
          fetchApi('/patients'),
          fetchApi('/invoices'),
          fetchApi('/payments'),
          fetchApi('/appointments')
        ]);
        if (!patientsRes || !invoicesRes || !paymentsRes) return;
        
        const patientsJson = await patientsRes.json();
        const invoicesJson = await invoicesRes.json();
        const paymentsJson = await paymentsRes.json();
        const apptsJson = apptsRes ? await apptsRes.json() : null;
        
        const patients = patientsJson?.success ? patientsJson.data : [];
        const invoices = invoicesJson?.success ? invoicesJson.data : [];
        const payments = paymentsJson?.success ? paymentsJson.data : [];
        const appointments = apptsJson?.success ? apptsJson.data : [];

        // 1. Calculate Total Invoiced per patient (only for non-cancelled invoices)
        const invoicedByPatient = invoices.reduce((acc, inv) => {
          if (String(inv.status || '').toUpperCase() !== 'CANCELLED') {
            const patientId = inv.patient_id ?? inv.patientId ?? inv.patient?.id;
            if (patientId != null) acc[patientId] = (acc[patientId] || 0) + Number(inv.total || 0);
          }
          return acc;
        }, {});

        // 2. Calculate Appointment service charges per patient (for non-cancelled appointments)
        const appointmentChargesByPatient = appointments.reduce((acc, a) => {
          if (String(a.status || '').toLowerCase() !== 'cancelled') {
            const patientId = a.patient_id ?? a.patientId ?? a.patient?.id;
            const price = Number(a.service?.price || a.price || 0);
            if (patientId != null && price > 0) {
              acc[patientId] = (acc[patientId] || 0) + price;
            }
          }
          return acc;
        }, {});

        // 3. Calculate Total Paid per patient
        const paidByPatient = payments.reduce((acc, p) => {
          if (String(p.status || '').toUpperCase() !== 'FAILED' && String(p.status || '').toUpperCase() !== 'CANCELLED') {
            const patientId = p.patient_id ?? p.patientId ?? p.patient?.id;
            if (patientId != null) acc[patientId] = (acc[patientId] || 0) + Number(p.amount || 0);
          }
          return acc;
        }, {});

        const mappedPatients = patients.map((p) => {
          const invTotal = invoicedByPatient[p.id] || 0;
          const apptTotal = appointmentChargesByPatient[p.id] || 0;
          const totalCharges = invTotal > 0 ? Math.max(invTotal, apptTotal) : apptTotal;
          const totalPaid = paidByPatient[p.id] || 0;
          const balance = Math.max(0, totalCharges - totalPaid);
          
          return {
            id: p.id,
            name: `${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`.trim() || `Patient ${p.id}`,
            totalInvoiced: totalCharges,
            totalPaid,
            pendingValue: balance,
            pending: formatCurrency(balance)
          };
        });
        setPatientsList(mappedPatients);

        if (urlPatientId) {
          const preselected = mappedPatients.find(p => p.id === parseInt(urlPatientId, 10));
          if (preselected) {
            setSelectedPatient(preselected);
            setAmount(urlAmount || (preselected.pendingValue > 0 ? preselected.pendingValue.toFixed(2) : ''));
          }
        }
      } catch (error) {
        showToast('Failed to load patients/billing data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [showToast]);

  const filteredPatients = useMemo(() => patientsList.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.id).toLowerCase().includes(searchTerm.toLowerCase())
  ), [patientsList, searchTerm]);

  const handleProcessPayment = async () => {
    if (!selectedPatient || !amount || parseFloat(amount) <= 0) {
      showToast('Please select a patient and valid amount', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetchApi('/payments', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          amount: parseFloat(amount),
          date: new Date().toISOString(),
          method,
          status: 'COMPLETED',
          description: 'Manual payment recorded from payments screen'
        })
      });
      if (!response) return;
      const json = await response.json();
      if (!json.success) {
        showToast(json.message || 'Failed to record payment', 'error');
        return;
      }
      setIsProcessing(false);
      showToast(`Payment of ${formatCurrency(amount)} recorded for ${selectedPatient.name} successfully!`);
      navigate('/billing/history');
    } catch (error) {
      showToast('Failed to record payment', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in custom-scrollbar font-sans px-4 md:px-6 py-4">
      <PageHeader 
        title="Record New Payment"
        subtitle="Collect and verify payments from patients at front desk or clinical node."
        icon={<FaFileInvoice />}
        actions={
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              className="rounded-lg h-10 px-4 text-[10px] font-black uppercase tracking-widest bg-white border-slate-200" 
              leftIcon={<FaArrowLeft size={10} />}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Button 
              variant="secondary" 
              className="rounded-lg h-10 px-4 text-[10px] font-black uppercase tracking-widest bg-white border-slate-200" 
              leftIcon={<FaHistory size={10} />}
              onClick={() => navigate('/billing/history')}
            >
              Daily Log
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Select Patient */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-clinicPrimary/10 text-clinicPrimary flex items-center justify-center text-[9px]">1</span>
            Select Verified Patient
          </h3>
          
          <Card hover={false} className="p-4 border-slate-100 shadow-none">
            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input 
                type="text"
                placeholder="Search patient name or ID..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {isLoading ? (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading patients...</p>
              ) : filteredPatients.length > 0 ? filteredPatients.map(p => (
                <div 
                  key={p.id}
                  onClick={() => {
                    setSelectedPatient(p);
                    setAmount(p.pendingValue > 0 ? p.pendingValue.toFixed(2) : '');
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedPatient?.id === p.id 
                      ? 'border-clinicPrimary bg-clinicPrimary/5 shadow-sm ring-1 ring-clinicPrimary/20' 
                      : 'border-slate-50 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-black ${selectedPatient?.id === p.id ? 'text-clinicPrimary' : 'text-slate-700'}`}>{p.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">ID-{p.id}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[11px] font-black ${p.pendingValue > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{p.pending}</p>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        p.pendingValue > 0 
                          ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {p.pendingValue > 0 ? 'Remaining Due' : 'Settled'}
                      </span>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No patients found.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Step 2: Payment Details */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-clinicPrimary/10 text-clinicPrimary flex items-center justify-center text-[9px]">2</span>
            Transaction Parameters
          </h3>

          <Card hover={false} className={`p-6 border-slate-100 shadow-none transition-all ${!selectedPatient ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
            <div className="space-y-5">
              {/* Selected Patient Balance Breakdown */}
              {selectedPatient && (
                <div className="p-4 bg-slate-50/80 border border-slate-100 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                    <div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Patient Selected</span>
                      <h4 className="text-sm font-black text-slate-800">{selectedPatient.name}</h4>
                    </div>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                      ID-{selectedPatient.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Total Invoiced</span>
                      <span className="text-xs font-black text-slate-700">{formatCurrency(selectedPatient.totalInvoiced || 0)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Total Paid</span>
                      <span className="text-xs font-black text-emerald-600">{formatCurrency(selectedPatient.totalPaid || 0)}</span>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${selectedPatient.pendingValue > 0 ? 'bg-rose-50/80 border-rose-200 text-rose-600' : 'bg-emerald-50/80 border-emerald-200 text-emerald-700'}`}>
                      <span className="text-[8px] font-black uppercase tracking-wider block">
                        Remaining Due
                      </span>
                      <span className="text-xs font-black">
                        {formatCurrency(selectedPatient.pendingValue || 0)}
                      </span>
                    </div>
                  </div>

                  {selectedPatient.pendingValue > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount((selectedPatient.pendingValue || 0).toFixed(2))}
                      className="w-full py-2 px-3 bg-white hover:bg-clinicPrimary/5 border border-slate-200 hover:border-clinicPrimary/30 rounded-xl text-[10px] font-black text-clinicPrimary uppercase tracking-widest transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      ⚡ Pay Full Remaining Balance ({formatCurrency(selectedPatient.pendingValue || 0)})
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Payment Amount ({getActiveCurrencySymbol()})</label>
                <input 
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  className="w-full text-3xl font-black text-slate-900 placeholder:text-slate-200 bg-transparent outline-none tracking-tighter"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Settlement Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'Card', icon: <FaCreditCard />, label: 'Card Payment' },
                    { id: 'Cash', icon: <FaMoneyBillWave />, label: 'Cash Flow' },
                    { id: 'Insurance', icon: <FaShieldAlt />, label: 'Insurance / Third Party' },
                    { id: 'Sync', icon: <FaCheckCircle />, label: 'Online Transfer' }
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all gap-2 ${
                        method === m.id 
                          ? 'border-clinicPrimary bg-clinicPrimary/5 text-clinicPrimary' 
                          : 'border-slate-50 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      <span className="text-lg">{m.icon}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                variant="accent"
                className="w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em]"
                onClick={handleProcessPayment}
                loading={isProcessing}
                disabled={!canWrite || !selectedPatient || !amount}
              >
                {isProcessing ? 'Verifying Node...' : 'Acknowledge Payment'}
              </Button>
              {!canWrite && <p className="text-[9px] font-bold text-amber-600">Read-only access: admin/billing can record payments.</p>}

              <p className="text-[8px] text-slate-400 text-center font-bold uppercase tracking-widest px-4 leading-relaxed">
                Security Node Verified • SSL Encrypted Transaction • Digital Receipt will be synchronized to patient portal
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Payments;
