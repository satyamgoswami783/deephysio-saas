import React, { useState } from 'react';
import { FaUsers, FaFilter, FaPlus, FaBullhorn, FaEllipsisV } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const MarketingSegments = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [segments] = useState([
    { id: 1, name: 'Active Monthly Patients', count: 450, lastUsed: '2 days ago', filters: 'Status: Active, Visit: Last 30 Days' },
    { id: 2, name: 'Dormant (6+ Months)', count: 120, lastUsed: '1 week ago', filters: 'Status: Inactive, Visit: > 6 Months' },
    { id: 3, name: 'Post-Op Rehab Patients', count: 85, lastUsed: '3 weeks ago', filters: 'Service: Post-Op Rehab' },
    { id: 4, name: 'New Patients (This Month)', count: 45, lastUsed: 'Never', filters: 'Status: New, Joined: This Month' },
  ]);

  const handleCreateCampaign = (segmentName) => {
    showToast(`Starting campaign for: ${segmentName}`);
    navigate('/marketing');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-8 animate-fade-in custom-scrollbar">
      <PageHeader 
        title="Patient Segmentation"
        subtitle="Create target lists based on patient visit history, services, and demographics."
        icon={<FaUsers />}
        actions={
          <Button variant="accent" leftIcon={<FaPlus />} onClick={() => showToast('Opening Segment Builder...')}>
             Create Segment
          </Button>
        }
      />

      {/* Filter Section */}
      <Card className="p-6 border border-slate-200 shadow-sm bg-white">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-sm">
           <FaFilter className="text-clinicPrimary" /> Filter Patients By:
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Last Visit</label>
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none">
                 <option>Any Time</option>
                 <option>Last 30 Days</option>
                 <option>Last 3 Months</option>
                 <option>6+ Months Ago</option>
              </select>
           </div>
           <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Service Subscribed</label>
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none">
                 <option>All Services</option>
                 <option>Physiotherapy</option>
                 <option>Massage Therapy</option>
                 <option>Post-Op Rehab</option>
              </select>
           </div>
           <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Patient Status</label>
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none">
                 <option>Active & Inactive</option>
                 <option>Active Only</option>
                 <option>Inactive Only</option>
              </select>
           </div>
           <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Clinic Location</label>
              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none">
                 <option>All Locations</option>
                 <option>Downtown Clinic</option>
                 <option>Westside Branch</option>
              </select>
           </div>
        </div>
        <div className="mt-6 flex justify-end">
           <Button variant="secondary" className="mr-3">Reset</Button>
           <Button variant="primary">Apply Filters</Button>
        </div>
      </Card>

      {/* Saved Segments */}
      <Card className="p-0 border border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
           <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Saved Segments</h3>
           <span className="text-xs font-semibold text-slate-400">{segments.length} Segments</span>
        </div>
        <div className="divide-y divide-slate-100">
           {segments.map(segment => (
             <div key={segment.id} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
               <div className="flex-1">
                 <h4 className="text-lg font-bold text-slate-800">{segment.name}</h4>
                 <p className="text-sm text-slate-500 mt-1">{segment.filters}</p>
                 <p className="text-xs font-semibold text-slate-400 mt-3 inline-flex items-center px-2 py-1 bg-slate-100 rounded-md">Last used: {segment.lastUsed}</p>
               </div>
               
               <div className="flex items-center gap-6">
                 <div className="text-center px-6 border-r border-slate-200">
                    <p className="text-3xl font-black text-clinicPrimary">{segment.count}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Patients</p>
                 </div>
                 <div className="flex flex-col gap-2 min-w-[140px]">
                    <Button 
                      variant="primary" 
                      className="w-full justify-center text-xs py-2 shadow-sm" 
                      leftIcon={<FaBullhorn />}
                      onClick={() => handleCreateCampaign(segment.name)}
                    >
                      Use in Campaign
                    </Button>
                    <button className="text-xs font-bold text-slate-500 flex items-center justify-center gap-2 hover:text-slate-800 transition-colors py-1">
                       <FaEllipsisV /> More Options
                    </button>
                 </div>
               </div>
             </div>
           ))}
        </div>
      </Card>
    </div>
  );
};

export default MarketingSegments;
