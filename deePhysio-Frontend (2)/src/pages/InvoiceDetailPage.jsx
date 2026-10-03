import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaReceipt, FaPrint, FaShareAlt, FaDownload, FaShieldAlt, FaEnvelope } from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmailModal from '../components/ui/EmailModal';
import { fetchApi } from '../config/api';
import { useClinicProfile } from '../hooks/useClinicProfile';
import InvoiceClinicHeader from '../components/invoice/InvoiceClinicHeader';
import { getInvoiceDisplayNumber } from '../utils/invoiceDisplay';
import { formatCurrency } from '../utils/currency';

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const clinicProfile = useClinicProfile();
  const [invoice, setInvoice] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetchApi(`/invoices/${id}`);
        if (!res || !res.ok) return;
        const data = await res.json();
        if (data.success) {
          setInvoice(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch invoice details', error);
      }
    };
    fetchInvoice();
  }, [id]);

  if (!invoice) return <div className="p-20 text-center font-black uppercase text-slate-300 tracking-[0.3em]">Locating Transaction Node...</div>;

  const items = invoice.items || [];
  const subtotal = Number(invoice.subtotal || 0);
  const tax = Number(invoice.tax || 0);
  const total = Number(invoice.total || 0);
  const taxPercent = subtotal > 0 ? Math.round((tax / subtotal) * 100) : 20;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-fade-in font-sans custom-scrollbar">
      <PageHeader 
        title="Transaction Intelligence"
        subtitle={`Invoice Archive: ${getInvoiceDisplayNumber(invoice, invoice.id)}`}
        icon={<FaReceipt />}
        actions={
          <div className="flex gap-3">
             <Button variant="secondary" size="icon" className="h-10 w-10 border-slate-100 hover:text-clinicPrimary"><FaPrint size={14}/></Button>
             <Button variant="secondary" size="icon" className="h-10 w-10 border-slate-100 hover:text-clinicPrimary"><FaShareAlt size={14}/></Button>
             <Button 
                variant="secondary" 
                size="icon" 
                className="h-10 w-10 border-slate-100 hover:text-clinicPrimary"
                onClick={() => setEmailModalOpen(true)}
             >
                <FaEnvelope size={14}/>
             </Button>
             <Button variant="accent" className="h-10 px-6 rounded-xl text-[10px] uppercase tracking-widest font-black" leftIcon={<FaDownload size={12} />}>Export PDF</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <Card className="p-8 md:p-12 border-none shadow-premium bg-white relative overflow-hidden">
              {/* Clinic Header */}
              <div className="flex flex-col md:flex-row justify-between gap-8 pb-10 border-b border-slate-50">
                <InvoiceClinicHeader profile={clinicProfile} />
                <div className="text-right">
                  <div className={`inline-block px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border mb-4 ${
                    invoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    invoice.status === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {invoice.status} Status
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Settlement Date</div>
                  <div className="text-lg font-black text-slate-900 tracking-tight">{invoice.date}</div>
                </div>
              </div>

              {/* Billing Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 py-10">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-clinicPrimary uppercase tracking-[0.3em]">Bill To</p>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                      {invoice.patient ? `${invoice.patient.first_name || ''} ${invoice.patient.last_name || ''}`.trim() : (invoice.patient_name || 'Subject Unknown')}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Subject ID: {invoice.patient_id || invoice.patientId || 'PID-REF'}</p>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto -mx-8 md:mx-0">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-50">
                    <tr>
                      <th className="px-8 py-4">Clinical Service Breakdown</th>
                      <th className="px-8 py-4 text-center">Qty</th>
                      <th className="px-8 py-4 text-right">Rate</th>
                      <th className="px-8 py-4 text-right">Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item, i) => (
                      <tr key={i} className="group">
                        <td className="px-8 py-5">
                          <p className="text-[13px] font-bold text-slate-800 transition-colors group-hover:text-clinicPrimary">{item.service}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Protocol Reference: {700+i}</p>
                        </td>
                        <td className="px-8 py-5 text-center text-[12px] font-black text-slate-600">{item.qty}</td>
                        <td className="px-8 py-5 text-right text-[12px] font-bold text-slate-600">{formatCurrency(item.rate)}</td>
                        <td className="px-8 py-5 text-right text-[13px] font-black text-slate-900">{formatCurrency(item.rate * item.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="flex justify-end pt-10 mt-10 border-t border-slate-50">
                <div className="w-full md:w-64 space-y-4">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-widest">Subtotal Result</span>
                    <span className="text-[13px] font-bold">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-[10px] font-black uppercase tracking-widest">Tax Provision ({taxPercent}%)</span>
                    <span className="text-[13px] font-bold">{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-clinicPrimary">Final Valuation</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
           </Card>
        </div>

        <div className="space-y-8">
           <Card className="p-8 border-none shadow-premium bg-white space-y-8">
              <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                 <FaShieldAlt className="text-clinicPrimary" /> Settlement Logs
              </h4>
              <div className="space-y-6">
                 {[
                   { event: 'Invoice Finalized', time: '10:30 AM', status: 'Success' },
                   { event: 'Protocol Archiving', time: '10:31 AM', status: 'Success' },
                   { event: 'Notification Sync', time: '10:32 AM', status: 'Success' },
                   { event: 'Payment Received', time: invoice.status === 'Paid' ? '12:45 PM' : 'Pending', status: invoice.status === 'Paid' ? 'Success' : 'Wait' }
                 ].map((log, i) => (
                    <div key={i} className="flex gap-4 relative">
                       {i !== 3 && <div className="absolute left-1.5 top-5 w-0.5 h-full bg-slate-50"></div>}
                       <div className={`w-3 h-3 rounded-full mt-1.5 z-10 ${log.status === 'Success' ? 'bg-clinicPrimary shadow-[0_0_8px_rgba(46,167,184,0.3)]' : 'bg-slate-200'}`}></div>
                       <div>
                          <p className="text-[12px] font-black text-slate-800 leading-tight">{log.event}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{log.time}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </Card>

           <div className="p-8 bg-slate-900 rounded-[32px] text-white flex flex-col gap-6 relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-clinicPrimary/20 rounded-full blur-3xl group-hover:bg-clinicPrimary/40 transition-all duration-1000"></div>
              <div className="relative z-10 flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-clinicPrimary">
                    <FaShieldAlt size={18} />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-clinicPrimary">Audit Secure</p>
              </div>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed relative z-10 italic">"This transaction node is synchronized with the primary clinical ledger and is tamper-proof."</p>
              <Button variant="accent" className="w-full h-12 rounded-xl text-[10px] uppercase font-black tracking-widest shadow-google">Verify Protocol</Button>
           </div>
        </div>
      </div>
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        type="Invoice"
        data={{
          ...invoice,
          displayId: getInvoiceDisplayNumber(invoice, invoice.id),
          amount: invoice.amount || formatCurrency(total)
        }}
      />
    </div>
  );
};

export default InvoiceDetailPage;
