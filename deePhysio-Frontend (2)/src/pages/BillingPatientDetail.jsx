import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaPlus,
  FaReceipt,
  FaPhoneAlt,
  FaEnvelope,
  FaFileInvoice,
  FaRegClock,
  FaCheckCircle,
  FaEye,
  FaDownload,
  FaArrowLeft
} from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PatientIcon from '../components/ui/PatientIcon';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';
import { getInvoiceDisplayNumber } from '../utils/invoiceDisplay';
import { formatCurrency } from '../utils/currency';

const BillingPatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);
      try {
        const [pRes, invRes, payRes, apptRes] = await Promise.all([
          fetchApi(`/patients/${id}`),
          fetchApi(`/invoices?patientId=${id}`),
          fetchApi(`/payments?patientId=${id}`),
          fetchApi(`/appointments?patientId=${id}`)
        ]);

        if (!pRes) return;
        const pData = await pRes.json();
        if (!pData.success) {
          showToast('Patient not found.', 'error');
          navigate('/billing');
          return;
        }

        const p = pData.data;

        let invoices = [];
        if (invRes?.ok) {
          const invData = await invRes.json();
          if (invData.success && Array.isArray(invData.data)) {
            invoices = invData.data;
          }
        }

        let payments = [];
        if (payRes?.ok) {
          const payData = await payRes.json();
          if (payData.success && Array.isArray(payData.data)) {
            payments = payData.data;
          }
        }

        let appointments = [];
        if (apptRes?.ok) {
          const apptData = await apptRes.json();
          if (apptData.success && Array.isArray(apptData.data)) {
            appointments = apptData.data;
          }
        }

        const completedServiceTotal = appointments
          .filter((appt) => String(appt?.status || '').toLowerCase() === 'completed')
          .reduce((sum, appt) => sum + Number(appt?.service?.price || 0), 0);

        const invoiceTotal = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
        const totalInvoicesAmount = invoiceTotal > 0 ? invoiceTotal : completedServiceTotal;
        const totalPaidAmount = payments.reduce((sum, pmt) => sum + Number(pmt.amount || 0), 0);
        const pendingAmount = Math.max(totalInvoicesAmount - totalPaidAmount, 0);

        setPatient({
          id: p.id,
          name: `${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`.trim(),
          phone: p.phone,
          email: p.email,
          status: p.isActive === false ? 'Inactive' : 'Active',
          totalInvoices: invoices.length,
          completedServiceTotal: formatCurrency(completedServiceTotal),
          pendingAmountRaw: pendingAmount,
          pendingAmount: formatCurrency(pendingAmount),
          paidAmount: formatCurrency(totalPaidAmount),
          lastPaymentDate: payments[0]?.date ? new Date(payments[0].date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--',
          invoices: invoices.slice(0, 20).map((inv) => ({
            id: inv.id,
            invoiceLabel: getInvoiceDisplayNumber(inv, inv.id),
            service: inv.items?.[0]?.service || 'Clinical Service',
            amount: formatCurrency(inv.total),
            status: (inv.status || 'PENDING').toLowerCase() === 'paid' ? 'Paid' : ((inv.status || 'PENDING').toLowerCase() === 'partial' ? 'Partial' : 'Pending'),
            date: inv.date ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--',
            raw: inv
          })),
          payments: payments.slice(0, 20).map((pay) => ({
            id: pay.id,
            date: pay.date ? new Date(pay.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--',
            amount: formatCurrency(pay.amount),
            method: pay.method || 'Card',
            status: pay.status || 'Recorded'
          }))
        });
      } catch (error) {
        console.error('Error fetching patient billing data:', error);
        showToast('Failed to load billing data.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id, navigate, showToast]);

  const handleDownloadInvoice = (invoiceItem) => {
    const invoice = invoiceItem?.raw;
    if (!invoice) return;
    const blob = new Blob([JSON.stringify(invoice, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = getInvoiceDisplayNumber(invoice, invoice.id).replace(/[^a-zA-Z0-9-_]/g, '_');
    a.download = `invoice-${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    if (a.parentNode) {
      a.parentNode.removeChild(a);
    }
    URL.revokeObjectURL(url);
  };

  if (loading || !patient) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in font-sans">
      <PageHeader
        title={patient.name}
        subtitle={`Patient ID: ${patient.id} • ${patient.status || 'Active'}`}
        icon={<PatientIcon size={24} className="text-emerald-500" />}
        actions={
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate(-1)}
              variant="outline"
              className="bg-white text-[11px] font-black uppercase tracking-widest h-9 border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <FaArrowLeft size={10} className="mr-2" /> Back
            </Button>
            <Button 
              onClick={() => navigate(`/billing/new?patientId=${patient.id}&amount=${patient.pendingAmountRaw}`)}
              variant="outline"
              className="bg-white text-[11px] font-black uppercase tracking-widest h-9"
            >
              <FaPlus size={10} className="mr-2" /> Create Invoice
            </Button>
            <Button 
              onClick={() => navigate(`/billing/payments?patientId=${patient.id}&amount=${patient.pendingAmountRaw}`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest h-9 shadow-lg shadow-emerald-200"
            >
              <FaReceipt size={10} className="mr-2" /> Add Payment
            </Button>
          </div>
        }
      />

      {/* QUICK CONTACT */}
      <div className="flex flex-wrap gap-4 items-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <FaPhoneAlt size={12} className="text-emerald-500" />
          <span className="text-sm font-bold">{patient.phone || '--'}</span>
        </div>
        <div className="w-px h-4 bg-slate-200 hidden sm:block" />
        <div className="flex items-center gap-2 text-slate-600">
          <FaEnvelope size={12} className="text-emerald-500" />
          <span className="text-sm font-bold">{patient.email || '--'}</span>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Invoices</p>
            <h3 className="text-2xl font-black text-slate-900">{patient.totalInvoices}</h3>
            {patient.totalInvoices === 0 && patient.completedServiceTotal !== formatCurrency(0) && (
              <p className="text-[10px] font-bold text-amber-600 mt-1">Completed Services: {patient.completedServiceTotal}</p>
            )}
          </div>
          <FaFileInvoice className="absolute -bottom-2 -right-2 text-slate-50 text-5xl group-hover:text-slate-100 transition-colors" />
        </Card>
        
        <Card className="p-4 border-slate-100 shadow-sm relative overflow-hidden group border-l-4 border-l-amber-400">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Pending Balance</p>
            <h3 className="text-2xl font-black text-slate-900">{patient.pendingAmount}</h3>
          </div>
          <FaRegClock className="absolute -bottom-2 -right-2 text-amber-50 text-5xl group-hover:text-amber-100 transition-colors" />
        </Card>

        <Card className="p-4 border-slate-100 shadow-sm relative overflow-hidden group border-l-4 border-l-emerald-400">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Settled Amount</p>
            <h3 className="text-2xl font-black text-slate-900">{patient.paidAmount}</h3>
          </div>
          <FaCheckCircle className="absolute -bottom-2 -right-2 text-emerald-50 text-5xl group-hover:text-emerald-100 transition-colors" />
        </Card>

        <Card className="p-4 border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Payment</p>
            <h3 className="text-xl font-black text-slate-900 leading-tight mt-1">{patient.lastPaymentDate}</h3>
          </div>
          <FaReceipt className="absolute -bottom-2 -right-2 text-slate-50 text-5xl group-hover:text-slate-100 transition-colors" />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INVOICES TABLE */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <FaFileInvoice className="text-emerald-500" /> Recent Invoices
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patient.invoices.length > 0 ? patient.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4 text-[11px] font-bold text-slate-500">{inv.invoiceLabel}</td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-black text-slate-700">{inv.service}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{inv.date}</p>
                    </td>
                    <td className="px-5 py-4 text-[13px] font-black text-slate-900">{inv.amount}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                        inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        inv.status === 'Partial' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors" title="View" onClick={() => navigate(`/billing/history`)}>
                          <FaEye size={12} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-emerald-500 transition-colors" title="Download" onClick={() => handleDownloadInvoice(inv)}>
                          <FaDownload size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-5 py-6 text-[12px] text-slate-400 italic text-center">
                      No invoices available. Create invoice to finalize billing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAYMENTS TABLE */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <FaReceipt className="text-emerald-500" /> Payment History
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patient.payments.length > 0 ? patient.payments.map((pmt, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <p className="text-[13px] font-black text-slate-700">{pmt.date}</p>
                    </td>
                    <td className="px-5 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{pmt.method}</td>
                    <td className="px-5 py-4 text-[14px] font-black text-emerald-600">{pmt.amount}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                        {pmt.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="px-5 py-6 text-[12px] text-slate-400 italic text-center">
                      No payments recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPatientDetail;
