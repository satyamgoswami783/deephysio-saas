import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import { FaHistory, FaSearch, FaDownload, FaArrowRight, FaFilter, FaPrint, FaRegClock, FaCreditCard, FaMoneyBillWave, FaShieldAlt, FaCalendarAlt, FaReceipt, FaTimes, FaUserAlt } from 'react-icons/fa';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';
import { useClinicProfile } from '../hooks/useClinicProfile';
import InvoiceClinicHeader from '../components/invoice/InvoiceClinicHeader';
import { getInvoiceDisplayNumber } from '../utils/invoiceDisplay';
import { formatCurrency } from '../utils/currency';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const clinicProfile = useClinicProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isExporting, setIsExporting] = useState(false);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const receiptRef = useRef(null);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const response = await fetchApi('/payments');
      if (!response) return;

      const resData = await response.json();
      if (resData.success) {
        const mapped = resData.data.map(p => {
          // Normalize DB statuses for UI consistency
          let displayStatus = p.status || 'Paid';
          if (displayStatus === 'COMPLETED') displayStatus = 'Paid';
          if (displayStatus === 'PENDING') displayStatus = 'Pending';
          if (displayStatus === 'FAILED') displayStatus = 'Failed';

          return {
            id: p.id.split('-').pop().toUpperCase(),
            rawId: p.id,
            patient: p.patient
              ? `${p.patient.firstName || p.patient.first_name || ''} ${p.patient.lastName || p.patient.last_name || ''}`.trim() || 'Unknown Patient'
              : 'Unknown Patient',
            patientId: p.patient?.id ? `PID-${p.patient.id}` : 'N/A',
            date: new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            rawDate: p.date,
            amount: parseFloat(p.amount),
            formattedAmount: formatCurrency(p.amount),
            status: displayStatus,
            method: p.method || 'Digital Sync',
            description: p.description || 'Clinical Service',
            receiptReference: p.invoice
              ? getInvoiceDisplayNumber(p.invoice, p.invoice.id)
              : `PAY-${p.id.split('-').pop()?.toUpperCase()}`
          };
        });
        setTransactions(mapped);
      }
    } catch (error) {
      showToast('Failed to sync financial ledger.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAuditLog = async () => {
    setIsExporting(true);
    showToast('Preparing financial audit ledger...');

    try {
      const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
      const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

      const response = await fetchApi(`/payments?startDate=${startDate}&endDate=${endDate}`);
      if (!response) return;
      const resData = await response.json();

      if (resData.success && resData.data.length > 0) {
        const headers = ['Transaction ID', 'Patient Name', 'Patient ID', 'Audit Date', 'Amount', 'Payment Method', 'Status', 'Description'];
        const rows = resData.data.map(p => [
          p.id.split('-').pop().toUpperCase(),
          `${p.patient?.firstName || p.patient?.first_name || ''} ${p.patient?.lastName || p.patient?.last_name || ''}`.trim() || 'Unknown',
          p.patient?.id ? `PID-${p.patient.id}` : 'N/A',
          ` ${new Date(p.date).toLocaleDateString('en-GB')}`,
          formatCurrency(p.amount),
          p.method || 'Digital Sync',
          p.status || 'Paid',
          p.description || 'Clinical Service'
        ]);

        const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        const monthName = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' }).toLowerCase();

        link.setAttribute("href", url);
        link.setAttribute("download", `payment-audit-${monthName}-${selectedYear}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Audit Log exported successfully.', 'success');
        setIsExportModalOpen(false);
      } else {
        showToast('No records found for specified period.', 'warning');
      }
    } catch (error) {
      showToast('Export failed. Ledger connectivity error.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintReceipt = (tx) => {
    setSelectedTx(tx);
    setIsReceiptModalOpen(true);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchPayments();
  }, []);

  const stats = {
    total: transactions.length,
    online: transactions.filter(t => t.method.includes('Visa') || t.method.includes('Mastercard') || t.method.includes('Digital')).length,
    cash: transactions.filter(t => t.method.toLowerCase().includes('cash')).length,
    other: transactions.filter(t => !t.method.includes('Visa') && !t.method.includes('Mastercard') && !t.method.includes('Digital') && !t.method.toLowerCase().includes('cash')).length
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.receiptReference || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = methodFilter === 'All' || 
      (methodFilter === 'Online' ? (t.method.includes('Visa') || t.method.includes('Mastercard') || t.method.includes('Digital') || t.method.includes('CARD')) : t.method.includes(methodFilter));
    return matchesSearch && matchesMethod;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm';
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm';
      case 'Failed': return 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const [scaleFactor, setScaleFactor] = useState(1);
  const invoiceRef = useRef(null);

  // Dynamic Scale-to-Fit like Billing.jsx
  useEffect(() => {
    const handleScale = () => {
      if (!selectedTx || !invoiceRef.current) return;
      const viewportHeight = window.innerHeight;
      const targetHeight = viewportHeight - 180;
      const naturalHeight = invoiceRef.current.scrollHeight || 1000;
      const newScale = Math.min(1, targetHeight / naturalHeight);
      setScaleFactor(newScale);
    };

    if (selectedTx) {
      window.addEventListener('resize', handleScale);
      handleScale();
      setTimeout(handleScale, 50);
    }
    return () => window.removeEventListener('resize', handleScale);
  }, [selectedTx]);



  const handlePrint = async () => {
    if (!invoiceRef.current || !selectedTx) return;

    try {
      showToast('Preparing clinical document...', 'success');

      const element = invoiceRef.current;
      
      // Reset scale temporarily for high-res capture like Billing.jsx
      const scaledWrapper = element.parentElement;
      const originalTransform = scaledWrapper?.style.transform;
      if (scaledWrapper) {
        scaledWrapper.style.transform = 'scale(1)';
      }

      // Wait for layout to settle
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
      });

      // Restore scale
      if (scaledWrapper) {
        scaledWrapper.style.transform = originalTransform || '';
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      const printWindow = window.open('', '_blank', 'width=800,height=1131');
      
      if (!printWindow) {
        showToast('Please allow pop-ups to print.', 'error');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt ${selectedTx.receiptReference}</title>
          <style>
            @page { size: A4 portrait; margin: 0; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { width: 210mm; height: 297mm; background: white; }
            img { width: 210mm; max-height: 297mm; object-fit: contain; display: block; }
          </style>
        </head>
        <body>
          <img src="${imgData}" />
        </body>
        </html>
      `);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 300);
      };

    } catch (error) {
      console.error('Error printing:', error);
      showToast('Failed to generate document.', 'error');
    }
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in custom-scrollbar font-sans px-4 md:px-6 py-4">
        <PageHeader
          title="Payment History"
          subtitle="Complete audit trail of all financial transactions and payment reconciliations."
          icon={<FaHistory />}
          actions={
            <Button
              variant="secondary"
              className="rounded-lg h-10 px-4 text-[10px] font-black uppercase tracking-widest bg-white border-slate-200"
              leftIcon={<FaDownload size={10} />}
              onClick={() => setIsExportModalOpen(true)}
            >
              Export Audit Log
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Verified', value: stats.total, icon: <FaShieldAlt className="text-emerald-500" /> },
            { label: 'Online Payments', value: stats.online, icon: <FaCreditCard className="text-blue-500" /> },
            { label: 'Cash Receipts', value: stats.cash, icon: <FaMoneyBillWave className="text-amber-500" /> },
            { label: 'Insurance / Other', value: stats.other, icon: <FaRegClock className="text-indigo-500" /> }
          ].map((stat, i) => (
            <Card key={i} hover={false} className="p-4 border border-slate-100 shadow-none bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                {stat.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900">{stat.value}</h3>
            </Card>
          ))}
        </div>

        <Card hover={false} className="p-0 overflow-hidden border border-slate-100 shadow-none bg-white mt-6">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between bg-slate-50/50 gap-4">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative group/search w-full lg:min-w-[320px]">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <FaSearch size={12} />
                </span>
                <input
                  type="text"
                  placeholder="Search by invoice, payment ref, or patient..."
                  className="block w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest outline-none focus:ring-2 focus:ring-clinicPrimary/10 cursor-pointer"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="Online">Online / Card</option>
                <option value="Sync">Digital Sync</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30 text-slate-500 font-bold text-[9px] uppercase tracking-widest border-b border-slate-100">
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Audit Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-clinicPrimary/30 border-t-clinicPrimary rounded-full animate-spin mb-4"></div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Hydrating Ledger...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[12px] font-black text-clinicPrimary">{t.receiptReference}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-bold text-slate-700">{t.patient}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-widest">{t.description}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[11px] font-bold text-slate-500">{t.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[13px] font-black text-slate-900">{t.formattedAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.method}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-transparent ${getStatusStyle(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handlePrintReceipt(t)}
                        className="p-2 text-slate-300 hover:text-clinicPrimary hover:bg-clinicPrimary/5 rounded-lg transition-all"
                      >
                        <FaPrint size={12} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest">Null return for specified audit query</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-50 bg-slate-50/30 text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Verified Transaction Immutable Record</p>
          </div>
        </Card>
      </div>

      {/* Export Audit Log Modal */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Audit Ledger"
        maxWidth="max-w-md"
        footer={
          <div className="flex gap-3 w-full">
            <Button variant="secondary" className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest h-12" onClick={() => setIsExportModalOpen(false)}>Cancel</Button>
            <Button
              className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest h-12 bg-clinicPrimary shadow-google"
              onClick={handleExportAuditLog}
              isLoading={isExporting}
            >
              Export Ledger
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-emerald-500 shadow-sm">
              <FaShieldAlt size={20} />
            </div>
            <div>
              <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-tight">Verified Audit Export</h4>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest leading-tight">Generate a synchronized CSV ledger for financial reconciliation.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Select Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[11px] font-black text-slate-700 uppercase tracking-widest focus:ring-2 focus:ring-clinicPrimary/10 outline-none cursor-pointer appearance-none"
              >
                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Select Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[11px] font-black text-slate-700 uppercase tracking-widest focus:ring-2 focus:ring-clinicPrimary/10 outline-none cursor-pointer appearance-none"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Document Archive Preview"
        maxWidth="max-w-5xl"
      >
        {selectedTx && (
          <div className="flex flex-col h-full max-h-[calc(100vh-120px)] overflow-hidden">
            {/* Action Bar (Pinned) like Billing.jsx */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 bg-white z-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">DP</div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Digital Ledger</p>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{selectedTx.receiptReference}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" className="h-10 px-6 rounded-xl text-[10px] uppercase tracking-widest font-black flex items-center gap-2 border-slate-200" onClick={handlePrint} leftIcon={<FaPrint size={12} />}>Print</Button>
              </div>
            </div>

            {/* Scaleable Preview Area */}
            <div className="flex-1 flex justify-center items-start pt-6 overflow-hidden bg-slate-50/50 rounded-b-3xl">
              <div 
                style={{ 
                  transform: `scale(${scaleFactor})`, 
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                className="w-[800px] shrink-0 mx-auto"
              >
                <div 
                  ref={invoiceRef}
                  className="bg-white p-10 md:p-14 shadow-lg border border-slate-100 rounded-2xl w-full min-h-[1131px] flex flex-col mx-auto relative overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between gap-8 pb-10 border-b border-slate-100">
                    <InvoiceClinicHeader profile={clinicProfile} />
                    <div className="text-right">
                      <div className={`inline-block px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm mb-8 ${getStatusStyle(selectedTx.status)}`}>
                        {selectedTx.status} Status
                      </div>
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2 leading-none">Temporal Node</div>
                      <div className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{selectedTx.date}</div>
                      <div className="text-[11px] font-black text-clinicPrimary uppercase tracking-widest mt-2 leading-none">{selectedTx.receiptReference}</div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-12 py-10">
                    <div className="space-y-4">
                      <p className="text-[11px] font-black text-clinicPrimary uppercase tracking-[0.5em] leading-none">Billed subject</p>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-3">{selectedTx.patient}</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                          Verified Medical Client<br />
                          Method: {selectedTx.method}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-hidden rounded-2xl border border-slate-50 mt-4 mb-10">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100/80 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-3">Description of Medical Service</th>
                          <th className="px-8 py-3 text-center">Unit</th>
                          <th className="px-8 py-3 text-right">Valuation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-700">
                        <tr>
                          <td className="px-8 py-1.5">
                            <h5 className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-tight">{selectedTx.description}</h5>
                          </td>
                          <td className="px-8 py-1.5 text-center text-[12px] font-black text-slate-500">1.00</td>
                          <td className="px-8 py-1.5 text-right text-[13px] font-black text-slate-900">{selectedTx.formattedAmount}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="flex justify-end pt-10 border-t border-slate-100">
                    <div className="w-full md:w-80 space-y-4">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Net Provision</span>
                        <span className="text-[14px] font-bold text-slate-600">{formatCurrency(selectedTx.amount * 0.8)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">VAT (20%)</span>
                        <span className="text-[14px] font-bold text-slate-600">{formatCurrency(selectedTx.amount * 0.2)}</span>
                      </div>
                      <div className="flex justify-between items-center py-6 px-10 bg-slate-900 text-white rounded-2xl -mx-4 shadow-xl">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">Total Bill</span>
                        <span className="text-3xl font-black tracking-tighter leading-none">{selectedTx.formattedAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PaymentHistory;
