import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHistory, FaUserCircle, FaMoneyCheckAlt, FaCheckCircle, FaExclamationTriangle, FaDownload } from 'react-icons/fa';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import Button from '../components/ui/Button';

const ClaimDetailPage = () => {
   const { id } = useParams();
   const navigate = useNavigate();
   const [claim, setClaim] = useState(null);
   const [noteText, setNoteText] = useState('');

   useEffect(() => {
      const saved = JSON.parse(localStorage.getItem('deephysio_claims') || '[]');
      const found = saved.find(c => c.id === parseInt(id));
      if (found) {
         setClaim(found);
      } else {
         // Fallback for hardcoded if needed
         const INITIAL_CLAIMS = [
            { id: 1, patient: 'Alice Johnson', provider: 'BUPA', code: 'C-20093', date: 'Mar 15, 2026', amount: '₹450.00', status: 'Submitted', notes: ['Initial electronic submission successful.'] },
            { id: 2, patient: 'Bob Smith', provider: 'AXA', code: 'C-20094', date: 'Mar 14, 2026', amount: '₹120.00', status: 'Approved', notes: ['Reimbursement verified by provider portal.'] },
            { id: 3, patient: 'Charlie Brown', provider: 'Vitality', code: 'C-20095', date: 'Mar 12, 2026', amount: '₹300.00', status: 'Rejected', notes: ['Missing primary practitioner ID.', 'Sent for manual review.'] },
            { id: 4, patient: 'Diana Prince', provider: 'BUPA', code: 'C-20096', date: 'Mar 10, 2026', amount: '₹85.00', status: 'Approved', notes: [] },
         ];
         setClaim(INITIAL_CLAIMS.find(c => c.id === parseInt(id)));
      }
   }, [id]);

   const addNoteToClaim = () => {
      if (!noteText.trim()) return;
      const saved = JSON.parse(localStorage.getItem('deephysio_claims') || '[]');
      const updatedClaims = saved.map(c =>
         c.id === claim.id ? { ...c, notes: [...(c.notes || []), noteText] } : c
      );
      localStorage.setItem('deephysio_claims', JSON.stringify(updatedClaims));
      setClaim({ ...claim, notes: [...(claim.notes || []), noteText] });
      setNoteText('');
   };

   if (!claim) return <div className="p-20 text-center font-black uppercase text-slate-300 tracking-[0.3em]">Decoding Claim Node...</div>;

   return (
      <div className="p-8 max-w-5xl mx-auto space-y-10 animate-fade-in font-sans">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <button onClick={() => navigate('/billing/claims')} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-clinicPrimary hover:shadow-google transition-all active:scale-90 shadow-sm">
                  <FaArrowLeft size={18} />
               </button>
               <div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Claim Intelligence</h1>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Provider Node: {claim.provider} • ID: {claim.code}</p>
               </div>
            </div>
            <div className="flex gap-3">
               <Button variant="secondary" className="rounded-2xl px-8" onClick={() => navigate('/billing/claims')}>Back to Ledger</Button>
               <Button variant="accent" className="rounded-2xl px-8" leftIcon={<FaDownload />}>Export Protocol</Button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
               <div className="bg-white rounded-[40px] shadow-premium border border-slate-50 p-12 space-y-10">
                  <div className="flex items-center gap-8">
                     <div className="w-20 h-20 rounded-[28px] bg-clinicPrimary/10 text-clinicPrimary flex items-center justify-center shadow-inner">
                        <FaUserCircle size={40} />
                     </div>
                     <div>
                        <p className="text-[11px] font-black text-clinicPrimary uppercase tracking-[0.3em] mb-2 leading-none">Primary Payer Subject</p>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{claim.patient}</h2>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Valuation: {claim.amount}</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Transmission Status</p>
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border inline-block ${claim.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              claim.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                           }`}>
                           {claim.status}
                        </div>
                     </div>
                     <div className="p-8 bg-slate-50 border border-slate-100 rounded-[32px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Deployment Date</p>
                        <p className="text-xl font-black text-slate-900 tracking-tight">{claim.date}</p>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                        <FaHistory className="text-clinicPrimary" /> Clinical Audit Timeline
                     </h4>
                     <div className="space-y-4">
                        {claim.notes?.map((note, i) => (
                           <div key={i} className="p-6 bg-white border border-slate-100 rounded-[32px] group hover:bg-slate-50 transition-all shadow-sm">
                              <p className="text-[14px] font-medium text-slate-600 leading-relaxed italic">"{note}"</p>
                           </div>
                        ))}
                        {(!claim.notes || claim.notes.length === 0) && (
                           <div className="p-10 border-2 border-dashed border-slate-100 rounded-[32px] text-center">
                              <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">No audit trails detected for this node</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-10">
               <div className="bg-white rounded-[40px] shadow-premium border border-slate-50 p-8 space-y-8">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                     <ClinicalNoteIcon className="text-clinicPrimary" size={24} /> Append Intelligence
                  </h4>
                  <div className="space-y-4">
                     <textarea
                        rows="4"
                        placeholder="Enter internal audit note..."
                        className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 resize-none"
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                     ></textarea>
                     <Button variant="accent" className="w-full py-5 rounded-2xl" onClick={addNoteToClaim} leftIcon={<FaCheckCircle />}>Commit Note</Button>
                  </div>
               </div>

               <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[40px] flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-500 shadow-sm border border-blue-50">
                     <FaExclamationTriangle size={20} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 leading-tight tracking-tight uppercase">Audit notes are final and synced with global clinical blockchain.</p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default ClaimDetailPage;
