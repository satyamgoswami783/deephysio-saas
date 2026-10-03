import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import { useToast } from '../../context/ToastContext';
import { FaMoneyBillWave, FaCheckCircle, FaExclamationTriangle, FaSearch, FaEye, FaFileInvoice, FaTrash, FaDownload } from 'react-icons/fa';
import { formatCurrency } from '../../utils/currency';

const StatCard = ({ title, value, icon, color, trendText, trendColor, iconBg }) => (
  <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 p-5 rounded-2xl flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${iconBg}`}>
      {icon}
    </div>
    <div>
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{title}</p>
      <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
      <p className={`text-[10px] font-bold mt-1.5 ${trendColor}`}>| {trendText}</p>
    </div>
  </div>
);

const RevenuePayments = () => {
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const toastCtx = useToast();
  const showToast = toastCtx?.showToast || console.log;

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true);
      try {
        const res = await fetchApi('/saas/revenue');
        const result = await res.json();
        if (result.success) {
          setStats(result.data);
        } else {
          showToast(result.message || 'Failed to load revenue data', 'error');
        }
      } catch (error) {
        showToast('Error loading revenue data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchPayments = async () => {
      setPaymentsLoading(true);
      try {
        const res = await fetchApi('/saas/payments');
        const result = await res.json();
        if (result.success) {
          setPayments(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch payments", error);
      } finally {
        setPaymentsLoading(false);
      }
    };

    fetchRevenue();
    fetchPayments();
  }, []);

  const handleExport = () => {
    if (!payments || payments.length === 0) {
      showToast('No data to export', 'info');
      return;
    }

    const headers = ['ID', 'Date', 'Clinic (Customer)', 'Method', 'Amount', 'Status'];
    const csvRows = [headers.join(',')];

    payments.forEach(p => {
      const row = [
        `"${p.id || ''}"`,
        `"${new Date(p.date).toLocaleDateString()}"`,
        `"${p.customer || ''}"`,
        `"${p.method || ''}"`,
        `"${p.amount || ''}"`,
        `"${p.status || 'Success'}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'revenue_payments.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Export successful!', 'success');
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50/50 min-h-screen space-y-8 font-sans animate-fade-in custom-scrollbar">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 tracking-tight">Payments & Revenue</h1>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Manage all your subscription transactions
          </p>
        </div>
        <button onClick={handleExport} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-2">
          <FaDownload /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard 
          title="Total Revenue" 
          value={loading || !stats ? "..." : formatCurrency(stats.mrr || 0)} 
          icon={<FaMoneyBillWave size={22} />} 
          iconBg="bg-gradient-to-br from-blue-400 to-blue-600"
          trendText="↑ from last month"
          trendColor="text-emerald-500"
        />
        <StatCard 
          title="Success Rate" 
          value="100.0%" 
          icon={<FaCheckCircle size={22} />} 
          iconBg="bg-gradient-to-br from-emerald-400 to-emerald-600"
          trendText="↑ from last month"
          trendColor="text-emerald-500"
        />
        <StatCard 
          title="Failed Transactions" 
          value="0" 
          icon={<FaExclamationTriangle size={22} />} 
          iconBg="bg-gradient-to-br from-rose-400 to-rose-600"
          trendText="↓ from last month"
          trendColor="text-emerald-500"
        />
      </div>

      <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden mt-8">
        <div className="flex overflow-x-auto border-b border-slate-100 bg-white/50 px-4 pt-4 gap-2 custom-scrollbar">
          <button onClick={() => setFilterStatus('all')} className={`whitespace-nowrap px-5 py-2.5 text-xs font-bold transition-colors ${filterStatus === 'all' ? 'bg-blue-50 text-blue-600 rounded-t-lg border border-blue-100 border-b-0 shadow-sm relative z-10' : 'text-slate-500 hover:text-slate-800'}`}>All Payments</button>
          <button onClick={() => setFilterStatus('success')} className={`whitespace-nowrap px-5 py-2.5 text-xs font-bold transition-colors ${filterStatus === 'success' ? 'bg-blue-50 text-blue-600 rounded-t-lg border border-blue-100 border-b-0 shadow-sm relative z-10' : 'text-slate-500 hover:text-slate-800'}`}>Success</button>
          <button onClick={() => setFilterStatus('pending')} className={`whitespace-nowrap px-5 py-2.5 text-xs font-bold transition-colors ${filterStatus === 'pending' ? 'bg-blue-50 text-blue-600 rounded-t-lg border border-blue-100 border-b-0 shadow-sm relative z-10' : 'text-slate-500 hover:text-slate-800'}`}>Pending</button>
          <button onClick={() => setFilterStatus('failed')} className={`whitespace-nowrap px-5 py-2.5 text-xs font-bold transition-colors ${filterStatus === 'failed' ? 'bg-blue-50 text-blue-600 rounded-t-lg border border-blue-100 border-b-0 shadow-sm relative z-10' : 'text-slate-500 hover:text-slate-800'}`}>Failed</button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-white/50">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by transaction ID or clinic name..." 
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600 shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">ID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Clinic (Customer)</th>
                <th className="p-4">Method</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="text-xs font-semibold text-slate-600 divide-y divide-slate-50">
              {paymentsLoading ? (
                 <tr>
                 <td colSpan="7" className="p-12 text-center text-slate-400">
                   <div className="flex flex-col items-center justify-center gap-3">
                     <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                     <p>Loading transactions...</p>
                   </div>
                 </td>
               </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FaMoneyBillWave className="text-4xl text-slate-200" />
                      <p>No real payments found yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.filter(p => {
                  if (filterStatus === 'all') return true;
                  if (filterStatus === 'success') return p.status?.toLowerCase() === 'success';
                  if (filterStatus === 'pending') return p.status?.toLowerCase() === 'pending';
                  if (filterStatus === 'failed') return p.status?.toLowerCase() === 'failed';
                  return true;
                }).map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 pl-6 whitespace-nowrap text-slate-500 font-bold text-[10px] uppercase tracking-wider">{p.id}</td>
                    <td className="p-4 whitespace-nowrap text-slate-700 font-bold">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="p-4 font-black text-slate-800 group-hover:text-blue-600 transition-colors">{p.customer}</td>
                    <td className="p-4 text-slate-500 font-bold text-[11px]">{p.method}</td>
                    <td className="p-4 text-emerald-600 font-black">{p.amount}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                        p.status?.toLowerCase() === 'failed' ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {p.status || 'Success'}
                      </span>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => showToast('View receipt coming soon', 'info')} className="w-7 h-7 bg-white border border-slate-200 shadow-sm text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-50 hover:text-blue-600 transition-colors" title="View"><FaEye size={12} /></button>
                        <button onClick={() => showToast('Download invoice coming soon', 'info')} className="w-7 h-7 bg-white border border-slate-200 shadow-sm text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-50 hover:text-indigo-600 transition-colors" title="Invoice"><FaFileInvoice size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenuePayments;
