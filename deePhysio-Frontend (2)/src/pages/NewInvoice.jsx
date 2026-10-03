import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaReceipt, FaFileInvoice, FaPlus, FaTrash, FaCalculator } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

import { fetchApi } from '../config/api';
import { getInvoiceDisplayNumber } from '../utils/invoiceDisplay';
import { formatCurrency, getActiveCurrencySymbol } from '../utils/currency';

const NewInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const patientParamId = searchParams.get('patientId') || location.state?.patientId || '';
  const serviceParamName = searchParams.get('serviceName') || location.state?.serviceName || '';
  const amountParam = searchParams.get('amount') || location.state?.amount || '';

  const [newInvoice, setNewInvoice] = useState({
    patient_id: patientParamId || '',
    date: new Date().toISOString().split('T')[0],
    terms: 'Due on Receipt',
    notes: ''
  });

  const [patientsList, setPatientsList] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [taxRate, setTaxRate] = useState(20);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchReferenceData = async () => {
      setIsLoadingPatients(true);
      try {
        const [patientsRes, servicesRes, settingsRes] = await Promise.all([
          fetchApi('/patients'),
          fetchApi('/services'),
          fetchApi('/settings?keys=clinicProfile')
        ]);

        if (patientsRes) {
          const resData = await patientsRes.json();
          if (resData.success) {
            const normalizedPatients = (resData.data || []).map((p) => {
              const firstName = (p.firstName || p.first_name || '').trim();
              const lastName = (p.lastName || p.last_name || '').trim();
              const fullName = `${firstName} ${lastName}`.trim();
              return {
                id: p.id,
                fullName: fullName || `Patient ${p.id}`,
                phone: p.phone || '',
                patientType: p.patientType || p.patient_type || ''
              };
            });
            setPatientsList(normalizedPatients);
          }
        }

        if (servicesRes) {
          const serviceData = await servicesRes.json();
          if (serviceData.success) {
            const normalizedServices = (serviceData.data || []).map((s) => ({
              id: s.id,
              name: s.name || '',
              price: Number(s.price || 0)
            }));
            setServicesList(normalizedServices);
          }
        }

        if (settingsRes) {
          const settingsData = await settingsRes.json();
          if (settingsData.success && settingsData.data?.clinicProfile) {
             const profile = settingsData.data.clinicProfile;
             if (profile.taxRate !== undefined) {
                setTaxRate(Number(profile.taxRate));
             }
          }
        }

      } catch (error) {
        showToast('Failed to load clinic reference data.', 'error');
      } finally {
        setIsLoadingPatients(false);
      }
    };
    fetchReferenceData();
  }, [showToast]);

  const getServiceRateByName = (serviceName) => {
    if (!serviceName) return null;
    const normalized = String(serviceName).trim().toLowerCase();
    if (!normalized) return null;
    const matched = servicesList.find((s) => String(s.name).trim().toLowerCase() === normalized);
    return matched ? Number(matched.price || 0) : null;
  };

  const createEmptyLineItem = () => ({ id: Date.now() + Math.floor(Math.random() * 1000), service: '', rate: 0, qty: 1 });
  const [lineItems, setLineItems] = useState(() => {
    if (serviceParamName) {
      return [{ id: Date.now(), service: serviceParamName, rate: amountParam ? Number(amountParam) : 0, qty: 1 }];
    }
    if (amountParam && Number(amountParam) > 0) {
      return [{ id: Date.now(), service: 'Completed Clinical Services', rate: Number(amountParam), qty: 1 }];
    }
    return [createEmptyLineItem()];
  });

  const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 });
  const selectedPatient = patientsList.find((p) => String(p.id) === String(newInvoice.patient_id));

  useEffect(() => {
    if (!serviceParamName) return;
    const matchedRate = getServiceRateByName(serviceParamName);
    setLineItems((prev) => {
      if (!prev.length) {
        return [{ id: Date.now(), service: serviceParamName, rate: matchedRate ?? 0, qty: 1 }];
      }
      return prev.map((item, index) => (
        index === 0
          ? { ...item, service: serviceParamName || item.service, rate: matchedRate ?? item.rate ?? 0 }
          : item
      ));
    });
  }, [serviceParamName, servicesList]);

  useEffect(() => {
    const fetchPatientServices = async () => {
      if (!newInvoice.patient_id) return;
      try {
        const res = await fetchApi(`/appointments?patientId=${newInvoice.patient_id}`);
        if (!res || !res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const completedAppts = data.data.filter(a => String(a.status || '').toLowerCase() === 'completed');
          if (completedAppts.length > 0) {
            const newItems = completedAppts.map((appt, i) => ({
              id: Date.now() + i + Math.random(),
              service: appt.service?.name || 'Completed Clinical Service',
              rate: Number(appt.service?.price || 0),
              qty: 1
            }));
            setLineItems(newItems);
          } else {
            setLineItems([createEmptyLineItem()]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch patient appointments', error);
      }
    };
    
    fetchPatientServices();
  }, [newInvoice.patient_id]);

  useEffect(() => {
    const subtotal = lineItems.reduce((acc, item) => acc + (item.rate * item.qty), 0);
    const tax = subtotal * (taxRate / 100);
    setTotals({
      subtotal,
      tax,
      total: subtotal + tax
    });
  }, [lineItems, taxRate]);

  const addItem = () => {
    setLineItems([...lineItems, createEmptyLineItem()]);
  };

  const updateItem = (id, field, value) => {
    setLineItems(lineItems.map(item => {
      if (item.id !== id) return item;
      if (field === 'service') {
        const matchedRate = getServiceRateByName(value);
        return {
          ...item,
          service: value,
          rate: matchedRate ?? item.rate
        };
      }
      return { ...item, [field]: value };
    }));
  };

  const removeItem = (id) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const handleCreate = async () => {
    if (!newInvoice.patient_id) {
       showToast('Please select a validated patient node.', 'error');
       return;
    }

    setIsSaving(true);
    try {
      const validItems = lineItems.filter(li => li.service && li.service.trim() !== '');
      
      if (validItems.length === 0) {
        showToast('Please add at least one valid service item.', 'error');
        setIsSaving(false);
        return;
      }

      const payload = {
        patientId: parseInt(newInvoice.patient_id, 10),
        date: newInvoice.date,
        notes: newInvoice.notes,
        items: validItems.map(li => ({
          service: li.service.trim(),
          rate: parseFloat(li.rate),
          qty: parseInt(li.qty, 10)
        }))
      };

      const response = await fetchApi('/invoices', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response) return;
      const resData = await response.json();

      if (resData.success) {
        const inv = resData.data;
        showToast(`${getInvoiceDisplayNumber(inv, inv?.id)} created successfully.`, 'success');
        navigate('/billing');
      } else {
        showToast(resData.message || 'Failed to issue invoice', 'error');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-3 md:p-4 max-w-6xl mx-auto space-y-3 md:space-y-4 animate-fade-in font-sans custom-scrollbar">
      <div className="flex items-center gap-2.5 md:gap-3">
        <button onClick={() => navigate('/billing')} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-clinicPrimary hover:shadow-sm transition-all active:scale-95">
          <FaArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="text-[20px] md:text-[24px] font-extrabold text-slate-900 tracking-tight leading-none whitespace-nowrap">Issue Invoice</h1>
          <p className="text-slate-500 font-semibold text-[11px] tracking-wide">Revenue documentation protocol</p>
        </div>
      </div>

      <Card className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-3 md:p-4 space-y-4">
          {/* Invoice Meta */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-3">
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-slate-600 ml-1">Account Subject</label>
                <select
                  className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer appearance-none"
                  value={newInvoice.patient_id}
                  onChange={(e) => setNewInvoice({ ...newInvoice, patient_id: e.target.value })}
                >
                  <option value="" disabled>{isLoadingPatients ? 'Hydrating subjects...' : 'Select Subject...'}</option>
                  {patientsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.id} - {p.fullName}
                    </option>
                  ))}
                </select>
                {selectedPatient ? (
                  <p className="text-[12px] font-medium text-slate-500 ml-1">
                    Selected: <span className="text-slate-700">#{selectedPatient.id} - {selectedPatient.fullName}</span>
                  </p>
                ) : null}
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-slate-600 ml-1">Protocol Date</label>
              <input
                type="date"
                className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all"
                value={newInvoice.date}
                onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-slate-600 ml-1">Payment Strategy</label>
              <select
                className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-[14px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer appearance-none"
                value={newInvoice.terms}
                onChange={(e) => setNewInvoice({ ...newInvoice, terms: e.target.value })}
              >
                <option value="Due on Receipt">Pay Now (Due on Receipt)</option>
                <option value="Net 15 Days">Pay within 15 Days</option>
                <option value="Net 30 Days">Pay within 30 Days</option>
                <option value="Advanced Retainer">Advance Payment (Retainer)</option>
              </select>
              <p className="text-[11px] text-slate-500 ml-1">Select when this invoice should be paid.</p>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2.5 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-clinicPrimary rounded-full"></div>
                <h3 className="text-[14px] font-bold text-slate-900">Line Items Partition</h3>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={addItem}
                className="h-8 px-3 rounded-lg text-[10px] font-semibold bg-slate-50 border-slate-200 hover:bg-clinicPrimary hover:text-white hover:border-clinicPrimary transition-all"
              >
                <FaPlus className="mr-2" /> Add Service Item
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {lineItems.map((item, index) => (
                <div key={item.id} className="group p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-white hover:shadow-sm transition-all flex flex-col lg:flex-row gap-2.5 relative overflow-hidden">
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Service Description (e.g., Physiotherapy)"
                      className="w-full bg-transparent border-none text-[14px] font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                      value={item.service}
                      onChange={(e) => updateItem(item.id, 'service', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-slate-500">{getActiveCurrencySymbol()}</span>
                      <input
                        type="number"
                        className="w-14 bg-transparent border-none text-[14px] font-semibold text-slate-900 outline-none focus:text-clinicPrimary"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                      <span className="text-[11px] font-bold text-slate-500">×</span>
                      <input
                        type="number"
                        className="w-9 bg-transparent border-none text-[14px] font-semibold text-slate-900 outline-none focus:text-clinicPrimary"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-9 h-9 rounded-lg bg-white border border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-100 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm active:scale-90"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Matrix */}
          <div className="flex justify-end pt-3 border-t border-slate-200">
            <div className="w-full md:w-1/2 p-4 bg-slate-900 rounded-xl text-white space-y-3 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <FaFileInvoice size={80} />
              </div>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-[11px] font-semibold tracking-wide">Subtotal</span>
                  <span className="text-lg font-black tracking-tighter">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-[11px] font-semibold tracking-wide flex items-center gap-1.5">
                    Tax Provision ({taxRate}%)
                  </span>
                  <span className="text-lg font-black tracking-tighter">{formatCurrency(totals.tax)}</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-[12px] font-semibold tracking-wide text-clinicPrimary">Final Valuation</span>
                  <span className="text-2xl font-black tracking-tighter drop-shadow-lg">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 md:px-4 py-2.5 bg-slate-50/80 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-clinicPrimary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--clinic-primary-rgb),0.3)]"></div>
            <p className="text-[10px] font-semibold text-slate-500 tracking-wide">Protocol state: Calculated</p>
          </div>
          <div className="flex gap-2.5 w-full md:w-auto">
            <Button
              variant="secondary"
              className="flex-1 md:px-6 h-9 rounded-xl text-[11px] font-semibold shadow-sm hover:bg-white text-slate-500"
              onClick={() => navigate('/billing')}
            >
              Abort
            </Button>
            <Button
              variant="accent"
              className="flex-1 md:px-6 h-9 rounded-xl text-[11px] font-semibold shadow-sm active:scale-95 transition-all"
              onClick={handleCreate}
              disabled={isSaving}
            >
              {isSaving ? 'Committing...' : 'Commit Invoice'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default NewInvoice;
