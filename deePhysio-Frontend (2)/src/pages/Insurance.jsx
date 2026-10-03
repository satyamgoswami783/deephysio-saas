import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaIdCard, FaBuilding, FaCheckCircle, FaPlus, FaSearch } from 'react-icons/fa';

const Insurance = () => {
  const navigate = useNavigate();
  const providers = [
    { id: 1, name: 'BUPA Global', policy: 'BP-100293-XP', type: 'Private', status: 'Verified' },
    { id: 2, name: 'AXA PPP Healthcare', policy: 'AX-9920-L', type: 'Company', status: 'Active' },
    { id: 3, name: 'Vitality Health', policy: 'VH-4482-9', type: 'Individual', status: 'Pending' },
  ];

  return (
    <div className="space-y-6 sm:space-y-10 p-6 md:p-10 animate-fade-in custom-scrollbar font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[32px] shadow-premium border border-slate-50 relative overflow-hidden group">
        <div className="relative z-10 w-full sm:w-auto text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Insurance & Billing</h1>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-3 uppercase tracking-widest opacity-80">Manage patient insurance policies and provider links.</p>
        </div>
        <button 
          onClick={() => navigate('/patients/insurance/link')}
          className="w-full md:w-auto bg-clinicPrimary text-white flex justify-center items-center gap-3 text-[11px] font-black uppercase tracking-widest shadow-google py-4 px-8 rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all active:scale-95 relative z-10"
        >
          <FaPlus size={12}/> Link Provider
        </button>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-clinicPrimary/5 rounded-full blur-[40px] group-hover:bg-clinicPrimary/10 transition-all duration-1000"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {providers.map(p => (
                <div key={p.id} className="bg-white rounded-[32px] border border-slate-100 shadow-premium p-8 group hover:shadow-google hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-clinicPrimary/5 rounded-full -mr-16 -mt-16 group-hover:bg-clinicPrimary/10 transition-all duration-500"></div>
                   <div className="flex items-center gap-5 mb-8 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100/50 text-clinicPrimary flex items-center justify-center shadow-soft group-hover:bg-clinicPrimary group-hover:text-white transition-all group-hover:scale-110 group-hover:rotate-6">
                         <FaBuilding size={20}/>
                      </div>
                      <div>
                         <h4 className="text-[14px] sm:text-[15px] font-black text-slate-900 leading-none tracking-tight">{p.name}</h4>
                         <p className="text-[10px] font-black text-clinicPrimary mt-2 uppercase tracking-widest">{p.type}</p>
                      </div>
                   </div>
                   <div className="space-y-6 relative z-10 mt-auto">
                      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">
                         <span>Policy Number</span>
                         <span className="text-[12px] sm:text-[13px] text-slate-900 tracking-tight">{p.policy}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-soft border flex items-center gap-2 ${p.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : p.status === 'Active' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {p.status}
                         </div>
                         <button className="text-[10px] font-black text-slate-400 hover:text-clinicPrimary transition-colors uppercase tracking-widest hover:underline px-4 py-2 hover:bg-slate-50 rounded-xl" onClick={(e) => { e.stopPropagation(); navigate('/patients/insurance/edit'); }}>Edit Details</button>
                      </div>
                   </div>
                </div>
              ))}
           </div>

           <div onClick={() => navigate('/patients/insurance/add')} className="bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-14 text-center group hover:border-clinicPrimary/30 hover:bg-clinicPrimary/5 transition-all cursor-pointer">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-premium group-hover:scale-110 group-hover:rotate-6 transition-transform">
                 <FaPlus className="text-clinicPrimary" size={20}/>
              </div>
              <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-900 mb-2">Add New Policy</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Instantly verify new insurance coverage for this patient.</p>
           </div>
        </div>

        <div className="space-y-10 flex flex-col h-full">
           <div className="bg-white p-8 sm:p-10 rounded-[40px] shadow-premium border border-slate-50 flex-1">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-3">
                 <FaShieldAlt className="text-clinicPrimary text-lg" />
                 Claim Summary
              </h3>
              <div className="space-y-6">
                 <div className="flex justify-between items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-inner-soft">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Claims</span>
                    <span className="text-[14px] font-black text-slate-900 tracking-tight">14</span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 shadow-inner-soft">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved</span>
                    <span className="text-[14px] font-black text-emerald-600 tracking-tight">86%</span>
                 </div>
                 <div className="pt-6 border-t border-slate-50">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Value</span>
                       <span className="text-[18px] font-black text-amber-500 tracking-tighter">₹12,420</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner flex">
                       <div className="bg-amber-400 h-full rounded-full" style={{ width: '65%' }}></div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-8 sm:p-10 bg-white border border-slate-50 shadow-premium rounded-[32px] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-2 h-full bg-clinicPrimary"></div>
              <p className="text-[11px] font-black text-clinicPrimary uppercase tracking-[0.25em] mb-4">Quick Fact</p>
              <p className="text-[12px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">92% of BUPA claims are processed within 48 hours for ACL physiotherapy treatments.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Insurance;
