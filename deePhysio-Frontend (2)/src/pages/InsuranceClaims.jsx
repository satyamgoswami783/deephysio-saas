import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileInvoice, FaSearch, FaHistory, FaPlus, FaCloudUploadAlt } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';

const InsuranceClaims = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const INITIAL_CLAIMS = [
    { id: 1, patient: 'Alice Johnson', provider: 'BUPA', code: 'C-20093', date: 'Mar 15, 2026', amount: '₹450.00', status: 'Submitted', notes: ['Initial electronic submission successful.'] },
    { id: 2, patient: 'Bob Smith', provider: 'AXA', code: 'C-20094', date: 'Mar 14, 2026', amount: '₹120.00', status: 'Approved', notes: ['Reimbursement verified by provider portal.'] },
    { id: 3, patient: 'Charlie Brown', provider: 'Vitality', code: 'C-20095', date: 'Mar 12, 2026', amount: '₹300.00', status: 'Rejected', notes: ['Missing primary practitioner ID.', 'Sent for manual review.'] },
    { id: 4, patient: 'Diana Prince', provider: 'BUPA', code: 'C-20096', date: 'Mar 10, 2026', amount: '₹85.00', status: 'Approved', notes: [] },
  ];

  const [claims, setClaims] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('deephysio_claims') || '[]');
    if (saved.length > 0) {
      setClaims(saved);
    } else {
      setClaims(INITIAL_CLAIMS);
      localStorage.setItem('deephysio_claims', JSON.stringify(INITIAL_CLAIMS));
    }
  }, []);

  const stats = {
    submitted: claims.filter(c => c.status === 'Submitted').length,
    approved: claims.filter(c => c.status === 'Approved').reduce((acc, c) => acc + parseFloat(c.amount.replace('₹', '')), 0).toLocaleString(),
    rejected: claims.filter(c => c.status === 'Rejected').length
  };

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.patient.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          claim.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          claim.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportXL = () => {
    const csvRows = [
      ['ID', 'Patient', 'Provider', 'Claim ID', 'Date', 'Amount', 'Status'],
      ...filteredClaims.map(c => [c.id, c.patient, c.provider, c.code, c.date, c.amount, c.status])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `insurance_claims_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  };

  const handleResetClaims = () => {
    localStorage.removeItem('deephysio_claims');
    setClaims(INITIAL_CLAIMS);
    showToast('Insurance database factory reset successful.');
  };

  return (
    <div className="space-y-10 p-6 md:p-8 animate-fade-in custom-scrollbar font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Insurance Claims</h1>
          <p className="text-slate-500 font-medium mt-1">Track and manage reimbursement claims with secondary clinical providers.</p>
          <button onClick={handleResetClaims} className="text-[9px] font-black text-clinicPrimary uppercase tracking-tighter mt-2 opacity-30 hover:opacity-100 transition-opacity">Reset Claims Database</button>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={handleExportXL}
            className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-100 rounded-2xl text-[11px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-premium active:scale-95"
          >
            Export XL
          </button>
          <button 
            onClick={() => navigate('/billing/claims/new')}
            className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 rounded-2xl text-[11px] font-black text-clinicPrimary uppercase tracking-widest hover:bg-clinicPrimary/5 hover:border-clinicPrimary hover:shadow-google transition-all active:scale-95 shadow-lg"
          >
            <FaPlus size={14}/> Add Claim
          </button>
          <button 
            onClick={() => navigate('/billing/claims/batch')}
            className="flex items-center gap-3 px-8 py-4 bg-clinicPrimary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:shadow-google hover:-translate-y-1 transition-all active:scale-95 shadow-lg"
          >
            <FaCloudUploadAlt size={16}/> Submit Batch
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Submitted This Period', value: stats.submitted, color: '#3b82f6' },
          { label: 'Approved (MTD)', value: `₹${stats.approved}`, color: '#10b981' },
          { label: 'Rejections / Disputes', value: stats.rejected.toString().padStart(2, '0'), color: '#f43f5e' }
        ].map((stat, i) => (
          <div key={i} className={`p-8 bg-white rounded-3xl shadow-premium border-b-4 hover:-translate-y-1 transition-all`} style={{ borderBottomColor: stat.color }}>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
             <p className="text-3xl font-bold text-slate-900 mt-4 tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-premium overflow-hidden border border-slate-50">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/20">
          <div className="relative flex-1 w-full bg-white rounded-2xl shadow-inner-soft border border-slate-50 overflow-hidden group">
            <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-clinicPrimary transition-colors" size={14}/>
            <input 
              type="text" 
              placeholder="Search claims by patient, provider or ID..." 
              className="w-full pl-14 pr-6 py-4 bg-transparent text-[13px] font-bold text-slate-600 outline-none placeholder:text-slate-300 transition-all" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="w-full md:w-auto px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[11px] font-black text-slate-500 hover:text-clinicPrimary transition-all shadow-sm uppercase tracking-widest outline-none cursor-pointer active:scale-95"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Protocol Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left table-fixed min-w-[1000px]">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6 w-[30%]">Patient & Provider</th>
                <th className="px-8 py-6 w-[20%] text-center">Protocol ID</th>
                <th className="px-8 py-6 w-[15%] text-center">Deployment</th>
                <th className="px-8 py-6 w-[15%] text-center">Valuation</th>
                <th className="px-8 py-6 w-[15%] text-center">Status</th>
                <th className="px-8 py-6 w-[5%] text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredClaims.length > 0 ? filteredClaims.map(claim => (
                <tr key={claim.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => navigate(`/billing/claims/view/${claim.id}`)}>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <p className="text-[15px] font-bold text-slate-900 leading-none tracking-tight group-hover:text-clinicPrimary transition-colors">{claim.patient}</p>
                       <p className="text-[10px] font-black text-clinicPrimary uppercase tracking-[0.15em] mt-3 bg-clinicPrimary/5 px-2 py-1 rounded inline-block w-fit">{claim.provider}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center text-[13px] font-bold text-slate-500 uppercase tracking-tight">{claim.code}</td>
                  <td className="px-8 py-6 text-center text-[13px] font-bold text-slate-500 uppercase tracking-tight">{claim.date}</td>
                  <td className="px-8 py-6 text-center text-[15px] font-black text-slate-900 tracking-tighter">{claim.amount}</td>
                  <td className="px-8 py-6">
                    <div className={`mx-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      claim.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 
                      claim.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm' : 
                      'bg-blue-50 text-blue-600 border-blue-100 shadow-sm'
                    }`}>
                       <span className={`w-1.5 h-1.5 rounded-full ${claim.status === 'Approved' ? 'bg-emerald-500' : claim.status === 'Rejected' ? 'bg-rose-500' : 'bg-blue-500'}`}></span>
                       {claim.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/billing/claims/view/${claim.id}`); }}
                      className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-300 group-hover:text-clinicPrimary group-hover:border-clinicPrimary hover:shadow-google transition-all flex items-center justify-center ml-auto"
                    >
                       <FaPlus size={12}/>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest">No matching insurance claims found in database</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InsuranceClaims;
