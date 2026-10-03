import React from 'react';
import { FaFileInvoiceDollar, FaRegCreditCard, FaChartLine, FaExclamationCircle, FaChartBar, FaUndo } from 'react-icons/fa';
import PageHeader from '../../components/ui/PageHeader';
import { formatCurrency } from '../../utils/currency';

const StatCard = ({ title, value, icon, color, trend }) => (
  <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col items-start">
    <div className="flex items-center justify-between w-full mb-3">
      <div className={`w-8 h-8 flex items-center justify-center rounded bg-opacity-10 ${color}`}>
        <span className={`text-sm ${color.replace('bg-', 'text-')}`}>{icon}</span>
      </div>
      <div className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100">
        {trend}
      </div>
    </div>
    <div>
      <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none">{value}</h3>
    </div>
  </div>
);

const BillingDashboard = () => {
  return (
    <div className="space-y-5 animate-fade-in custom-scrollbar p-1 sm:p-2 md:p-1">
      <PageHeader
        title="Billing Dashboard"
        subtitle="Manage invoices, revenue, and pending collections."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard title="Invoices" value="45" icon={<FaFileInvoiceDollar />} color="bg-clinicPrimary" trend="Pending" />
        <StatCard title="Payments" value="12" icon={<FaRegCreditCard />} color="bg-emerald-500" trend="Today" />
        <StatCard title="Refunds" value="2" icon={<FaUndo />} color="bg-amber-500" trend="Action Req" />
        <StatCard title="Revenue" value={formatCurrency(1240)} icon={<FaChartLine />} color="bg-indigo-500" trend="Today" />
        <StatCard title="Payment Reports" value="5" icon={<FaChartBar />} color="bg-rose-500" trend="Ready" />
      </div>
    </div>
  );
};

export default BillingDashboard;
