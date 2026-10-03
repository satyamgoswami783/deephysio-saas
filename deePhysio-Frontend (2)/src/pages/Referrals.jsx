import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserMd, FaPlus, FaSearch, FaFileInvoice, FaCheckCircle, FaExclamationCircle, FaUserInjured } from 'react-icons/fa';

const Referrals = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [referrals, setReferrals] = useState([
    { id: 1, doctor: 'Dr. Gregory House', clinic: 'Princeton Plainsboro', date: 'Mar 10, 2026', type: 'Incoming', status: 'Active' },
    { id: 2, doctor: 'Dr. Stephen Strange', clinic: 'Sanctum Medical', date: 'Feb 25, 2026', type: 'Outgoing', status: 'Completed' },
    { id: 3, doctor: 'Dr. Meredith Grey', clinic: 'Grey Sloan Memorial', date: 'Feb 15, 2026', type: 'Incoming', status: 'Pending' },
  ]);

  const filteredReferrals = referrals.filter(ref => 
    ref.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.clinic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 p-6 md:p-10 animate-fade-in custom-scrollbar font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[32px] shadow-premium border border-slate-50 relative overflow-hidden group">
        <div className="relative z-10 w-full sm:w-auto text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Referral Tracking</h1>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-3 uppercase tracking-widest opacity-80">Manage incoming and outgoing clinical referrals.</p>
        </div>
        <button 
          onClick={() => navigate('/patients/referrals/add')}
          className="w-full md:w-auto bg-clinicPrimary text-white flex justify-center items-center gap-3 text-[11px] font-black uppercase tracking-widest shadow-google py-4 px-8 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95 relative z-10"
        >
          <FaPlus size={12}/> Initialize Referral Node
        </button>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-clinicPrimary/5 rounded-full blur-[40px] group-hover:bg-clinicPrimary/10 transition-all duration-1000"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 bg-white rounded-[40px] shadow-premium border border-slate-50 overflow-hidden flex flex-col">
           <div className="p-6 sm:p-8 border-b border-slate-50 flex items-center gap-4 bg-slate-50/20">
              <div className="relative flex-1 group w-full">
                 <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-clinicPrimary transition-colors" size={14}/>
                 <input 
                    type="text" 
                    placeholder="Search referrals by Practitioner or Clinic..." 
                    className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[24px] text-[13px] font-bold text-slate-600 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary shadow-inner-soft transition-all" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
           </div>
           
           <div className="overflow-x-auto w-full relative custom-scrollbar">
              <table className="w-full text-left table-auto min-w-[800px]">
                 <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-50">
                    <tr>
                       <th className="px-6 sm:px-10 py-6 whitespace-nowrap">Practitioner / Clinic</th>
                       <th className="px-6 sm:px-10 py-6 whitespace-nowrap">Temporal Node</th>
                       <th className="px-6 sm:px-10 py-6">Type Node</th>
                       <th className="px-6 sm:px-10 py-6">Status Indicator</th>
                       <th className="px-6 sm:px-10 py-6 text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredReferrals.map(ref => (
                       <tr key={ref.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => navigate('/notes')}>
                          <td className="px-6 sm:px-10 py-8">
                             <div className="flex items-center gap-5">
                                <div className="w-12 h-12 shrink-0 rounded-2xl bg-white border border-slate-100 text-clinicPrimary flex items-center justify-center group-hover:bg-clinicPrimary group-hover:text-white transition-all duration-500 shadow-premium group-hover:scale-110 group-hover:rotate-6">
                                   <FaUserMd size={18}/>
                                </div>
                                <div className="min-w-[150px]">
                                   <p className="text-[13px] sm:text-[14px] font-black text-slate-900 leading-none group-hover:text-clinicPrimary transition-colors tracking-tight truncate">{ref.doctor}</p>
                                   <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest truncate">{ref.clinic}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 sm:px-10 py-8">
                             <span className="text-[11px] sm:text-[12px] font-bold text-slate-700 tracking-tight whitespace-nowrap">{ref.date}</span>
                          </td>
                          <td className="px-6 sm:px-10 py-8">
                             <span className={`px-4 py-1.5 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] shadow-soft border ${ref.type === 'Incoming' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                {ref.type}
                             </span>
                          </td>
                          <td className="px-6 sm:px-10 py-8">
                             <div className={`flex items-center gap-2 px-4 py-1.5 w-fit rounded-xl border shadow-soft text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap ${ref.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                {ref.status === 'Completed' ? <FaCheckCircle size={10}/> : <FaExclamationCircle size={10}/>}
                                {ref.status}
                             </div>
                          </td>
                          <td className="px-6 sm:px-10 py-8 text-right">
                             <button className="text-[9px] sm:text-[10px] font-black text-clinicPrimary uppercase tracking-widest hover:underline px-4 py-2 hover:bg-clinicPrimary/5 rounded-xl transition-all whitespace-nowrap" onClick={(e) => { e.stopPropagation(); navigate('/notes'); }}>View File</button>
                          </td>
                       </tr>
                    ))}
                    {filteredReferrals.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 sm:px-10 py-20 text-center">
                          <div className="flex flex-col items-center justify-center">
                              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner-soft text-slate-200">
                                <FaSearch size={32} />
                              </div>
                              <h3 className="text-sm font-black text-slate-300 uppercase tracking-[0.3em]">No Referrals Found</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">System was unable to locate matching referrals.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="space-y-6 flex flex-col h-full">
           <div className="p-8 sm:p-10 bg-[#0B1120] text-white rounded-[40px] shadow-2xl relative overflow-hidden text-center flex-1 flex flex-col justify-center items-center">
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-clinicPrimary/10 rounded-full blur-[60px] pointer-events-none"></div>
              
              <div className="text-clinicPrimary mb-8 flex justify-center relative z-10">
                 <FaUserInjured size={64} className="drop-shadow-[0_4px_24px_rgba(46,167,184,0.4)]"/>
              </div>
              
              <div className="relative z-10 w-full">
                 <h3 className="text-lg font-black uppercase tracking-[0.2em] mb-4 text-white leading-relaxed">Referral<br/>Analytics</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-10">This Month</p>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 py-8 px-2 rounded-[32px] border border-white/5 backdrop-blur-md flex flex-col items-center justify-center shadow-inner">
                       <p className="text-4xl font-black text-white leading-none tracking-tight mb-4 shadow-sm">14</p>
                       <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Incoming</p>
                    </div>
                    <div className="bg-white/5 py-8 px-2 rounded-[32px] border border-white/5 backdrop-blur-md flex flex-col items-center justify-center shadow-inner">
                       <p className="text-4xl font-black text-white leading-none tracking-tight mb-4 shadow-sm">08</p>
                       <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Outgoing</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Referrals;
