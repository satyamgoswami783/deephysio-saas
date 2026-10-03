import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaFilter, FaSearch, FaDownload, FaClinicMedical, FaClock,
  FaCheckCircle, FaTimesCircle, FaTrashAlt, FaChartLine, FaStethoscope
} from 'react-icons/fa';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import MedicalHistoryIcon from '../components/ui/MedicalHistoryIcon';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const VisitHistory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const [visits, setVisits] = useState([
    { id: 'VH-901', date: '15 Mar 2026', time: '10:30 AM', practitioner: 'Dr. Sarah Wilson', service: 'SOAP Assessment', category: 'SOAP', clinic: 'Main Clinic Node', status: 'Verified' },
    { id: 'VH-842', date: '12 Mar 2026', time: '02:00 PM', practitioner: 'Dr. Michael Chen', service: 'RMDQ Disability Scan', category: 'RMDQ', clinic: 'Main Clinic Node', status: 'Verified' },
    { id: 'VH-711', date: '10 Feb 2026', time: '11:15 AM', practitioner: 'Dr. Sarah Wilson', service: 'Initial Physical Intake', category: 'Initial', clinic: 'North Partition', status: 'Verified' },
    { id: 'VH-605', date: '20 Jan 2026', time: '09:00 AM', practitioner: 'Dr. John Miller', service: 'Neural Rehab Evolution', category: 'Treatment', clinic: 'West Branch Node', status: 'Revoked' },
  ]);

  const filteredVisits = visits.filter(v =>
    v.practitioner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,ID,Date,Time,Practitioner,Service,Clinic,Status\n"
      + visits.map(v => `${v.id},${v.date},${v.time},${v.practitioner},${v.service},${v.clinic},${v.status}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "visit_chronology.csv");
    document.body.appendChild(link);
    link.click();
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
  };

  const handleViewClinicalNode = (visit) => {
    if (visit.category === 'SOAP') navigate(`/notes/soap/${visit.id}`);
    else if (visit.category === 'RMDQ') navigate(`/notes/rmdq/${visit.id}`);
    else navigate('/notes');
  };

  const handleDeleteVisit = (id) => {
    if (window.confirm(`Are you sure you want to delete the temporal node ${id}?`)) {
      setVisits(visits.filter(v => v.id !== id));
    }
  };

  const getVisitIcon = (category) => {
    switch (category) {
      case 'SOAP': return <ClinicalNoteIcon size={18} />;
      case 'RMDQ': return <FaChartLine size={18} />;
      case 'Initial': return <FaStethoscope size={18} />;
      default: return <FaCalendarAlt size={18} />;
    }
  };

  return (
    <div className="space-y-10 p-6 md:p-10 animate-fade-in custom-scrollbar font-sans">
      <Card className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 p-10 border-none shadow-premium bg-white relative overflow-hidden group rounded-[40px]">
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 rounded-[24px] bg-teal-50 flex items-center justify-center text-teal-500 shadow-inner-soft border border-teal-100/50">
            <MedicalHistoryIcon size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Visit Chronology</h1>
            <p className="text-slate-500 font-bold mt-4 uppercase tracking-widest text-[11px] opacity-70">Log of longitudinal patient consultations and treatment nodes.</p>
          </div>
        </div>
        <div className="flex gap-4 relative z-10 w-full lg:w-auto">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1 lg:flex-none rounded-[20px] h-14 px-10 border-none shadow-premium hover:shadow-google transition-all text-[11px] font-black uppercase tracking-widest"
            leftIcon={<FaDownload size={14} />}
            onClick={handleExport}
          >
            Export XL Ledger
          </Button>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-clinicPrimary/5 rounded-full blur-[40px] group-hover:bg-clinicPrimary/10 transition-all duration-1000"></div>
      </Card>

      <div className="bg-white rounded-[40px] shadow-premium overflow-hidden border border-slate-50">
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-50/10">
          <div className="relative group w-full md:max-w-2xl">
            <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-clinicPrimary transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search chronology by practitioner, ID or clinical protocol..."
              className="w-full pl-16 pr-6 py-5 bg-white border border-slate-100 rounded-[24px] text-[13px] font-bold text-slate-600 outline-none focus:ring-4 focus:ring-clinicPrimary/5 transition-all shadow-inner-soft placeholder:text-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Filter Nodes:</span>
            <button className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-clinicPrimary transition-all flex items-center justify-center"><FaFilter size={12} /></button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left table-fixed min-w-[1100px]">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-50">
              <tr>
                <th className="px-10 py-6 w-[22%]">Temporal Node</th>
                <th className="px-10 py-6 w-[18%]">Practitioner Node</th>
                <th className="px-10 py-6 w-[20%]">Clinical Protocol</th>
                <th className="px-10 py-6 w-[15%]">Clinic Hub</th>
                <th className="px-10 py-6 w-[12%] text-center">Status</th>
                <th className="px-10 py-6 w-[13%] text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredVisits.length > 0 ? filteredVisits.map(visit => (
                <tr key={visit.id} className="hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => handleViewClinicalNode(visit)}>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-[20px] shadow-premium bg-white border border-slate-50 flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 group-hover:bg-clinicPrimary group-hover:text-white transition-all duration-500 ${visit.category === 'SOAP' ? 'text-amber-500' :
                          visit.category === 'RMDQ' ? 'text-blue-500' :
                            'text-clinicPrimary'
                        }`}>
                        {getVisitIcon(visit.category)}
                      </div>
                      <div>
                        <p className="text-[15px] font-black text-slate-900 group-hover:text-clinicPrimary transition-colors leading-none tracking-tight">{visit.date}</p>
                        <div className="flex items-center gap-3 mt-2.5">
                          <FaClock size={8} className="text-slate-300" />
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{visit.time} <span className="text-slate-200 ml-1">/</span> {visit.id}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-[13px] font-black text-slate-700 uppercase tracking-tight group-hover:text-slate-900 transition-colors">{visit.practitioner}</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1.5 leading-none">Verified Provider</p>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight leading-none">{visit.service}</span>
                      <div className="flex gap-2">
                        <span className="px-2 py-0.5 bg-slate-50 text-[8px] font-black text-slate-400 rounded-md border border-slate-100 uppercase tracking-widest">{visit.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3">
                      <FaClinicMedical size={10} className="text-clinicPrimary opacity-30" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{visit.clinic}</p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className={`mx-auto w-fit px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-soft flex items-center gap-2 ${visit.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'
                      }`}>
                      {visit.status === 'Verified' ? <FaCheckCircle size={8} /> : <FaTimesCircle size={8} />}
                      {visit.status}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all">
                      <button className="w-11 h-11 rounded-xl bg-white border border-slate-100 text-slate-300 hover:text-amber-500 hover:shadow-google transition-all flex items-center justify-center active:scale-95" title="Audit Clinical Note" onClick={(e) => { e.stopPropagation(); handleViewClinicalNode(visit); }}>
                        <ClinicalNoteIcon size={14} />
                      </button>
                      <button className="w-11 h-11 rounded-xl bg-white border border-rose-50 text-rose-300 hover:text-rose-500 hover:bg-rose-50 hover:shadow-google transition-all flex items-center justify-center active:scale-95" title="Dissolve Visit Node" onClick={(e) => { e.stopPropagation(); handleDeleteVisit(visit.id); }}>
                        <FaTrashAlt size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-10 py-40 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mb-8 shadow-inner-soft text-slate-200 border border-slate-100">
                        <MedicalHistoryIcon size={48} className="opacity-20" />
                      </div>
                      <h3 className="text-xl font-black text-slate-300 uppercase tracking-[0.3em]">No Temporal Nodes Found</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-6 max-w-sm leading-relaxed">System was unable to locate matching clinical chronology in this partition.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-10 bg-slate-50/40 border-t border-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Listing Chronology Page 1 of 1</p>
          <div className="flex gap-6">
            <button className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-clinicPrimary transition-colors disabled:opacity-20" disabled>Previous Ledger Node</button>
            <button className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-clinicPrimary transition-colors disabled:opacity-20" disabled>Next Ledger Node</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitHistory;
