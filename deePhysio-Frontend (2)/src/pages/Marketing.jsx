import React, { useState } from 'react';
import { FaBullhorn, FaEnvelope, FaSms, FaHistory, FaPlus, FaChevronRight } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';

const Marketing = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');

  const handleCreate = () => {
    showToast('Opening Campaign Builder...');
  };

  const campaigns = {
    active: [
      { id: 1, name: 'Spring Wellness Newsletter', type: 'Email', date: '15 Mar 2026', sent: 850, opened: '45%' },
      { id: 2, name: 'Senior Mobility Promo', type: 'SMS', date: '10 Mar 2026', sent: 420, opened: '82%' },
    ],
    scheduled: [
      { id: 3, name: 'Summer Recovery Follow-up', type: 'Email', date: '01 Jun 2026', sent: '-', opened: '-' },
    ],
    archived: [
      { id: 4, name: 'Winter Health Drive', type: 'Email', date: '05 Jan 2026', sent: 1200, opened: '38%' },
    ]
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8 animate-fade-in custom-scrollbar">
      <PageHeader
        title="Marketing Campaigns"
        subtitle="Send and manage email and SMS campaigns for your patients."
        icon={<FaBullhorn />}
        actions={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/marketing/templates')}>Manage Templates</Button>
            <Button variant="accent" leftIcon={<FaPlus />} onClick={handleCreate}>New Campaign</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border border-slate-200 shadow-sm bg-white hover:border-clinicPrimary/30 transition-colors cursor-pointer" onClick={handleCreate}>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
            <FaEnvelope size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2">Email Campaign</h3>
          <p className="text-sm text-slate-500 font-medium">Send newsletters, updates, and promotions via email.</p>
        </Card>

        <Card className="p-6 border border-slate-200 shadow-sm bg-white hover:border-clinicPrimary/30 transition-colors cursor-pointer" onClick={handleCreate}>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
            <FaSms size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2">SMS Campaign</h3>
          <p className="text-sm text-slate-500 font-medium">Send quick reminders and high-priority messages via SMS.</p>
        </Card>
      </div>

      <Card className="p-8 border border-slate-200 shadow-sm bg-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <FaHistory className="text-clinicPrimary" /> Campaign History
          </h3>
          <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200 shadow-sm">
            {['active', 'scheduled', 'archived'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${activeTab === tab ? 'bg-white shadow-sm text-clinicPrimary' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {campaigns[activeTab].map(item => (
            <div
              key={item.id}
              className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white hover:shadow-sm hover:border-slate-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'Email' ? 'bg-blue-100 text-blue-500' : 'bg-emerald-100 text-emerald-500'}`}>
                  {item.type === 'Email' ? <FaEnvelope /> : <FaSms />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{item.name}</h4>
                  <p className="text-xs font-semibold text-slate-400 mt-1">{item.type} • {item.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{item.sent}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Sent</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${activeTab === 'archived' ? 'text-slate-500' : 'text-emerald-500'}`}>{item.opened}</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">Opened</p>
                </div>
                <FaChevronRight className="text-slate-300" />
              </div>
            </div>
          ))}
          {campaigns[activeTab].length === 0 && (
            <div className="p-10 text-center text-slate-400 font-bold text-sm">No campaigns in this category.</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Marketing;
