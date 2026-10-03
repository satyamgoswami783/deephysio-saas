import React from 'react';
import { FaCalendarCheck, FaUserPlus, FaUsers, FaCreditCard, FaComments, FaCheckCircle, FaSignOutAlt } from 'react-icons/fa';
import PageHeader from '../../components/ui/PageHeader';

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

const ReceptionDashboard = () => {
  return (
    <div className="space-y-5 animate-fade-in custom-scrollbar p-1 sm:p-2 md:p-1">
      <PageHeader
        title="Reception Dashboard"
        subtitle="Manage check-ins, registrations, and today's flow."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Appointments" value="24" icon={<FaCalendarCheck />} color="bg-clinicPrimary" trend="Today" />
        <StatCard title="Patient Registration" value="3" icon={<FaUserPlus />} color="bg-indigo-500" trend="New" />
        <StatCard title="Check-in" value="8" icon={<FaCheckCircle />} color="bg-emerald-500" trend="Arrived" />
        <StatCard title="Check-out" value="12" icon={<FaSignOutAlt />} color="bg-teal-500" trend="Done" />
        <StatCard title="Waiting Queue" value="4" icon={<FaUsers />} color="bg-amber-500" trend="Live" />
        <StatCard title="Communication" value="14" icon={<FaComments />} color="bg-sky-500" trend="Messages" />
        <StatCard title="Payments" value="5" icon={<FaCreditCard />} color="bg-rose-500" trend="Action Req" />
      </div>
    </div>
  );
};

export default ReceptionDashboard;
