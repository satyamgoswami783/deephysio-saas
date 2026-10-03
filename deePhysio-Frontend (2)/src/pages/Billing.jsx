import React, { useState, useRef, useEffect } from 'react';
import { FaPlus, FaSearch, FaDownload, FaFileInvoice, FaPrint, FaTrashAlt, FaWallet, FaChartLine, FaPercentage, FaReceipt, FaRegClock, FaEnvelope } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

import PageHeader from '../components/ui/PageHeader';
import { fetchApi } from '../config/api';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import EmailModal from '../components/ui/EmailModal';
import { usePermissions } from '../context/PermissionContext';
import { useClinicProfile } from '../hooks/useClinicProfile';
import InvoiceClinicHeader from '../components/invoice/InvoiceClinicHeader';
import { getInvoiceDisplayNumber } from '../utils/invoiceDisplay';
import { formatCurrency } from '../utils/currency';

const Billing = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { can } = usePermissions();
  const clinicProfile = useClinicProfile();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [invoiceForEmail, setInvoiceForEmail] = useState(null);
  const invoiceRef = useRef(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Dynamic Scale-to-Fit for One-Screen Preview
  useEffect(() => {
    const handleScale = () => {
      if (!selectedInvoice || !invoiceRef.current) return;

      const viewportHeight = window.innerHeight;
      const targetHeight = viewportHeight - 180; // Margin for toolbar + padding
      const naturalHeight = invoiceRef.current.scrollHeight || 1000;

      const newScale = Math.min(1, targetHeight / naturalHeight);
      setScaleFactor(newScale);
    };

    if (selectedInvoice) {
      window.addEventListener('resize', handleScale);
      handleScale();
      // Delay to ensure DOM is rendered
      setTimeout(handleScale, 50);
    }

    return () => window.removeEventListener('resize', handleScale);
  }, [selectedInvoice]);

  // Helper: capture the invoice element as a high-res canvas (temporarily resets scale)
  const captureInvoice = async () => {
    const element = invoiceRef.current;
    if (!element) return null;

    // Find the scaled wrapper (parent) and temporarily reset transform so we capture full resolution
    const scaledWrapper = element.parentElement;
    const originalTransform = scaledWrapper?.style.transform;
    const originalTransition = scaledWrapper?.style.transition;
    if (scaledWrapper) {
      scaledWrapper.style.transition = 'none';
      scaledWrapper.style.transform = 'scale(1)';
    }

    // Wait a frame for layout to settle
    await new Promise(r => setTimeout(r, 50));

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
    });

    // Restore the scale
    if (scaledWrapper) {
      scaledWrapper.style.transform = originalTransform || '';
      scaledWrapper.style.transition = originalTransition || '';
    }

    return canvas;
  };

  const handleDownloadPDF = async () => {
    if (!selectedInvoice) return;

    try {
      showToast('Generating PDF...', 'success');
      const canvas = await captureInvoice();
      if (!canvas) {
        showToast('Failed to capture invoice for PDF.', 'error');
        return;
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${getInvoiceDisplayNumber(selectedInvoice, selectedInvoice.id)}.pdf`);

      showToast('Invoice PDF downloaded successfully.', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to download PDF.', 'error');
    }
  };


  const handlePrint = async () => {
    if (!invoiceRef.current || !selectedInvoice) return;

    try {
      showToast('Preparing print preview...', 'success');

      const canvas = await captureInvoice();
      if (!canvas) return;

      const imgData = canvas.toDataURL('image/png', 1.0);

      // Open a new window with just the invoice image, sized exactly to A4
      const printWindow = window.open('', '_blank', 'width=800,height=1131');
      if (!printWindow) {
        showToast('Please allow pop-ups to print.', 'error');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice ${getInvoiceDisplayNumber(selectedInvoice, selectedInvoice.id)}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              width: 210mm;
              height: 297mm;
              background: white;
            }
            img {
              width: 210mm;
              max-height: 297mm;
              object-fit: contain;
              display: block;
            }
          </style>
        </head>
        <body>
          <img src="${imgData}" />
        </body>
        </html>
      `);
      printWindow.document.close();

      // Wait for image to load then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 300);
      };

    } catch (error) {
      console.error('Error printing:', error);
      showToast('Failed to print invoice.', 'error');
    }
  };

  const [invoicesList, setInvoicesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const responseRaw = await fetchApi('/invoices');
      if (!responseRaw) return;
      const response = await responseRaw.json();
      if (response.success) {
        const mapped = response.data.map(inv => {
          const totalPaid = Array.isArray(inv.payments) ? inv.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) : 0;
          const isFullyPaid = String(inv.status || '').toUpperCase() === 'PAID' || totalPaid >= Number(inv.total || 0) - 0.01;
          
          // Determine realistic status
          let realStatus = isFullyPaid ? 'Paid' : (inv.status || 'Pending');
          if (!isFullyPaid && String(realStatus).toUpperCase() === 'PAID') {
            realStatus = 'Pending';
          }
          
          // Capitalize first letter properly for UI
          realStatus = String(realStatus).charAt(0).toUpperCase() + String(realStatus).slice(1).toLowerCase();

          const parsedTotal = parseFloat(inv.total || 0) || 0;
          return {
            id: inv.id,
            invoice_number: inv.invoice_number,
            displayId: getInvoiceDisplayNumber(inv),
            patientId: inv.patientId || inv.patient_id || inv.patient?.id,
            patientEmail: inv.patient?.email || '',
            patient: `${inv.patient?.firstName || inv.patient?.first_name || ''} ${inv.patient?.lastName || inv.patient?.last_name || ''}`.trim() || 'Unknown Patient',
            date: new Date(inv.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            rawTotal: parsedTotal,
            amount: formatCurrency(parsedTotal),
            status: realStatus,
            method: inv.payments?.[0]?.method || 'Digital Sync',
            items: inv.items || []
          };
        });
        setInvoicesList(mapped);
      } else {
        showToast(response.message || 'Failed to load invoices', 'error');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showToast('Failed to load transaction ledger.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-500/10';
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-500/10';
      case 'Overdue': return 'bg-rose-50 text-rose-600 border-rose-100 shadow-rose-500/10';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const filteredInvoices = invoicesList.filter(inv =>
    inv.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.displayId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalsSummary = filteredInvoices.reduce((acc, inv) => {
    const amt = typeof inv.rawTotal === 'number' ? inv.rawTotal : (parseFloat(String(inv.amount).replace(/[^0-9.-]+/g, '')) || 0);
    if (inv.status === 'Paid') acc.paid += amt;
    else acc.outstanding += amt;
    acc.total += amt;
    return acc;
  }, { total: 0, paid: 0, outstanding: 0 });

  const efficiencyRate = totalsSummary.total > 0 ? (totalsSummary.paid / totalsSummary.total) * 100 : 100;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-pulse">
        <div className="w-16 h-16 border-4 border-clinicPrimary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Clinical Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in custom-scrollbar font-sans px-4 md:px-6 py-4">
      <PageHeader
        title="Invoice Registry"
        subtitle="Generate professional invoices, track payment status, and reconcile patient accounts."
        icon={<FaFileInvoice />}
        actions={
          <>
            {can('billing.manage') && (
              <Button
                variant="accent"
                size="md"
                className="flex-1 lg:flex-none rounded-lg h-12 px-8 sm:px-10 shadow-md text-[11px] font-black uppercase tracking-widest lg:mr-4 transition-all hover:scale-[1.02]"
                onClick={() => navigate('/billing/new')}
                leftIcon={<FaFileInvoice size={14} />}
              >
                Issue New Invoice
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card hover={false} className="bg-slate-900 border border-slate-800 p-5 sm:p-6 relative overflow-hidden group shadow-sm">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <FaWallet className="text-clinicPrimary" size={12} /> Outstanding Asset
            </p>
            <div className="flex items-baseline gap-3">
              <h3 className="text-2xl lg:text-3xl font-black text-white tracking-tighter">{formatCurrency(totalsSummary.outstanding)}</h3>
              <span className="text-rose-400 text-[9px] font-bold uppercase tracking-widest bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/20">+12% Var</span>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-clinicPrimary/10 rounded-full blur-2xl group-hover:bg-clinicPrimary/20 transition-colors duration-1000"></div>
        </Card>

        <Card hover={false} className="p-5 sm:p-6 border border-slate-100 shadow-none bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <FaChartLine className="text-emerald-500" size={12} /> Monthly Yield (MTD)
          </p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(totalsSummary.paid)}</h3>
            <span className="text-emerald-600 text-[9px] font-bold uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">+8.2%</span>
          </div>
          <div className="mt-4 flex gap-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
            <div className="bg-emerald-500 w-3/4 rounded-full"></div>
            <div className="bg-emerald-200 w-1/4 rounded-full"></div>
          </div>
        </Card>

        <Card hover={false} className="p-5 sm:p-6 border border-slate-100 shadow-none bg-white group overflow-hidden relative">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <FaPercentage className="text-blue-500" size={12} /> Efficiency Rate
          </p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">{efficiencyRate.toFixed(1)}%</h3>
            <span className="text-blue-600 text-[9px] font-bold uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">Optimum</span>
          </div>
          <div className="absolute top-5 right-5 opacity-10 pointer-events-none">
            <FaPercentage size={24} className="text-slate-400" />
          </div>
        </Card>
      </div>

      <Card hover={false} className="p-0 overflow-hidden border border-slate-100 shadow-none bg-white mt-4 sm:mt-6">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between bg-slate-50/50 gap-4">
          <div>
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <FaReceipt size={12} className="text-clinicPrimary" /> Verified Invoices
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">Synchronized Real-time Tracking</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <div className="relative group/search w-full lg:min-w-[280px]">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 group-focus-within/search:text-clinicPrimary transition-colors">
                <FaSearch size={12} />
              </span>
              <input
                type="text"
                placeholder="Filter transactions..."
                className="block w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-colors placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-bold text-[9px] uppercase tracking-widest border-b border-slate-100">
                <th className="px-4 py-3 whitespace-nowrap">Transaction ID</th>
                <th className="px-4 py-3 whitespace-nowrap">Account Subject</th>
                <th className="px-4 py-3 whitespace-nowrap">Temporal Node</th>
                <th className="px-4 py-3 whitespace-nowrap">Audit Amount</th>
                <th className="px-4 py-3 whitespace-nowrap">Status Node</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-clinicPrimary"
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm text-clinicPrimary flex items-center justify-center border border-slate-100 shrink-0 transition-colors group-hover:bg-clinicPrimary group-hover:text-white">
                        <FaFileInvoice size={14} />
                      </div>
                      <div>
                        <span className="text-[12px] font-black text-slate-900 tracking-tight transition-colors group-hover:text-clinicPrimary">{inv.displayId}</span>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 opacity-80 flex items-center gap-1.5">
                          {inv.method}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <p className="text-[13px] font-black text-slate-800 tracking-tight transition-colors group-hover:text-slate-900">{inv.patient}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verified Client</p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <FaRegClock size={10} className="text-slate-400" />
                      <span className="text-[11px] font-bold text-slate-600 leading-none mt-[1px]">{inv.date}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-[14px] font-black text-slate-900 tracking-tighter">{inv.amount}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-transparent shadow-sm ${getStatusStyle(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Button onClick={(e) => {
                        e.stopPropagation();
                        setInvoiceForEmail(inv);
                        setEmailModalOpen(true);
                      }} variant="secondary" size="icon" className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 text-clinicPrimary hover:bg-clinicPrimary/10 hover:text-clinicPrimary hover:border-clinicPrimary/30 transition-all duration-200 shrink-0 shadow-sm">
                        <FaEnvelope size={12} />
                      </Button>
                      <Button onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInvoice(inv);
                      }} variant="secondary" size="icon" className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:bg-clinicPrimary/10 hover:text-clinicPrimary hover:border-clinicPrimary/30 transition-all duration-200 shrink-0 shadow-sm">
                        <FaPrint size={12} />
                      </Button>
                      {can('billing.manage') && (
                        <Button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(inv.id); }} variant="secondary" size="icon" className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all duration-200 shrink-0 shadow-sm">
                          <FaTrashAlt size={12} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-80">Audit Archive: {filteredInvoices.length} Validated</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="text-[9px] font-black h-8 px-4 rounded-lg bg-white border-slate-200 shadow-sm hover:text-clinicPrimary" onClick={() => showToast('No previous records.')}>Previous</Button>
            <Button variant="secondary" className="text-[9px] font-black h-8 px-4 rounded-lg bg-white border-slate-200 shadow-sm hover:text-clinicPrimary" onClick={() => showToast('No more records.')}>Next</Button>
          </div>
        </div>
      </Card>

      <Modal
        key="delete-modal"
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Deletion"
      >
        <div className="p-1">
          <p className="text-sm text-slate-600 mb-6">Are you sure you want to permanently delete invoice <span className="font-bold text-slate-900">{deleteConfirm}</span>? This action cannot be undone.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="accent" className="bg-rose-500 hover:bg-rose-600 border-rose-500" onClick={async () => {
              try {
                const response = await fetchApi(`/invoices/${deleteConfirm}`, { method: 'DELETE' });
                const resData = await response.json();
                if (resData.success) {
                  setInvoicesList(prev => prev.filter(i => i.id !== deleteConfirm));
                  showToast('Invoice purged from clinical ledger.', 'success');
                }
              } catch (error) {
                showToast('Failed to delete invoice.', 'error');
              } finally {
                setDeleteConfirm(null);
              }
            }}>Delete Permanently</Button>
          </div>
        </div>
      </Modal>

      <Modal
        key="invoice-modal"
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title="Document Archive Preview"
        maxWidth="max-w-5xl"
      >
        {selectedInvoice && (
          <div className="flex flex-col h-full max-h-[calc(100vh-120px)] overflow-hidden">
            {/* Action Bar (Pinned) */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 no-print bg-white z-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">DP</div>
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Digital Ledger</p>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{getInvoiceDisplayNumber(selectedInvoice, selectedInvoice.id)}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" className="h-10 px-6 rounded-xl text-[10px] uppercase tracking-widest font-black flex items-center gap-2 border-slate-200" onClick={handleDownloadPDF} leftIcon={<FaDownload size={12} />}>Download PDF</Button>
                <Button variant="secondary" className="h-10 px-6 rounded-xl text-[10px] uppercase tracking-widest font-black flex items-center gap-2 border-slate-200" onClick={handlePrint} leftIcon={<FaPrint size={12} />}>Print</Button>
                {can('billing.manage') && (
                  <Button variant="secondary" className="h-10 px-6 rounded-xl text-[10px] uppercase tracking-widest font-black flex items-center gap-2 border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-500" onClick={() => { const invId = selectedInvoice.id; setSelectedInvoice(null); setDeleteConfirm(invId); }} leftIcon={<FaTrashAlt size={12} />}>Purge Record</Button>
                )}
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
                className="w-[800px] shrink-0 mx-auto print:transform-none"
              >
                <div
                  ref={invoiceRef}
                  id="printable-invoice"
                  className="bg-white p-10 md:p-14 shadow-lg border border-slate-100 rounded-2xl w-full min-h-[1131px] flex flex-col mx-auto relative overflow-hidden"
                  style={{
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact"
                  }}
                >
                  {/* Invoice Header */}
                  <div className="flex flex-col md:flex-row justify-between gap-8 pb-10 border-b border-slate-100">
                    <InvoiceClinicHeader profile={clinicProfile} />
                    <div className="text-right">
                      <div className={`inline-block px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm mb-8 ${selectedInvoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          selectedInvoice.status === 'Overdue' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                        {selectedInvoice.status} Status
                      </div>
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2 leading-none uppercase">Temporal Node</div>
                      <div className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{selectedInvoice.date}</div>
                      <div className="text-[11px] font-black text-clinicPrimary uppercase tracking-widest mt-2 leading-none">{getInvoiceDisplayNumber(selectedInvoice, selectedInvoice.id)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 py-10">
                    <div className="space-y-4">
                      <p className="text-[11px] font-black text-clinicPrimary uppercase tracking-[0.5em] leading-none">Billed subject</p>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-3">{selectedInvoice.patient}</h4>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                          Verified Medical Client<br />
                          Method: {selectedInvoice.method}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-slate-50 mt-4 mb-10">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                          <th className="px-8 py-3">Description of Medical Service</th>
                          <th className="px-8 py-3 text-center">Unit</th>
                          <th className="px-8 py-3 text-right">Valuation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-700">
                        {selectedInvoice.items && selectedInvoice.items.length > 0 ? selectedInvoice.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-8 py-1.5">
                              <h5 className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-tight">{item.service}</h5>
                            </td>
                            <td className="px-8 py-1.5 text-center text-[12px] font-black text-slate-500">{item.qty}.00</td>
                            <td className="px-8 py-1.5 text-right text-[13px] font-black text-slate-900">{formatCurrency(item.rate * item.qty)}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td className="px-8 py-1.5">
                              <h5 className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-tight">Physiotherapy Specialist Assessment</h5>
                            </td>
                            <td className="px-8 py-1.5 text-center text-[12px] font-black text-slate-500">1.00</td>
                            <td className="px-8 py-1.5 text-right text-[13px] font-black text-slate-900">{selectedInvoice.amount}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-10 border-t border-slate-100">
                    <div className="w-full md:w-80 space-y-4">
                      {(() => {
                        const numericTotal = typeof selectedInvoice.rawTotal === 'number'
                          ? selectedInvoice.rawTotal
                          : (parseFloat(String(selectedInvoice.amount).replace(/[^0-9.-]+/g, '')) || 0);
                        return (
                          <>
                            <div className="flex justify-between items-center text-slate-400">
                              <span className="text-[10px] font-black uppercase tracking-widest">Net Provision</span>
                              <span className="text-[14px] font-bold text-slate-600">{formatCurrency(numericTotal * 0.8)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span className="text-[10px] font-black uppercase tracking-widest">VAT (20%)</span>
                              <span className="text-[14px] font-bold text-slate-600">{formatCurrency(numericTotal * 0.2)}</span>
                            </div>
                          </>
                        );
                      })()}
                      <div className="flex justify-between items-center py-6 px-10 bg-slate-900 text-white rounded-2xl -mx-4 shadow-xl">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-60">Total Bill</span>
                        <span className="text-3xl font-black tracking-tighter leading-none">{selectedInvoice.amount}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>


          </div>
        )}
      </Modal>

      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        type="Invoice"
        data={invoiceForEmail}
        patientId={invoiceForEmail?.patientId}
        patientName={invoiceForEmail?.patient}
        patientEmail={invoiceForEmail?.patientEmail}
      />

    </div>
  );
};

export default Billing;
