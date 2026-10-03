import React, { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { fetchApi } from '../config/api';
import { useToast } from '../context/ToastContext';
import TicketChatModal from '../components/support/TicketChatModal';

const Support = () => {
  const { showToast } = useToast();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & States
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({ subject: '', priority: 'Medium', message: '' });

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');

  useEffect(() => {
    const userStr = sessionStorage.getItem('deephysio_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setIsSuperAdmin(user.role?.toLowerCase() === 'superadmin');
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    // wait for isSuperAdmin to be determined, though it's sync from session storage
    loadTickets();
    const interval = setInterval(() => {
      loadTickets(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [isSuperAdmin]);

  const loadTickets = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const endpoint = isSuperAdmin ? '/support/saas' : '/support/tenant';
      const res = await fetchApi(endpoint);
      if (res && res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setTickets(data.data);
        }
      }
    } catch (error) {
      if (!isBackground) showToast('Failed to load tickets', 'error');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newTicketForm.subject || !newTicketForm.message) {
      showToast('Subject and message are required', 'error');
      return;
    }
    try {
      let storedUser = null;
      try {
        const u = sessionStorage.getItem('deephysio_user');
        if (u) storedUser = JSON.parse(u);
      } catch (err) {}

      const res = await fetchApi('/support', {
        method: 'POST',
        body: JSON.stringify({
          ...newTicketForm,
          userName: storedUser?.name,
          userEmail: storedUser?.email,
          clinicName: storedUser?.tenant?.clinic_name || storedUser?.clinic_name
        })
      });
      if (res && res.ok) {
        showToast('Ticket created successfully', 'success');
        setShowNewTicketModal(false);
        setNewTicketForm({ subject: '', priority: 'Medium', message: '' });
        loadTickets();
      }
    } catch (e) {
      showToast('Failed to create ticket', 'error');
    }
  };

  const formatDate = (val, fallback) => {
    if (!val && !fallback) return 'Recently';
    const d = new Date(val || fallback);
    return isNaN(d.getTime()) ? 'Recently' : d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && t.priority !== priorityFilter) return false;
    return true;
  });

  const getStatusColor = (status) => {
    if (status === 'Open') return 'bg-blue-100 text-blue-700';
    if (status === 'Replied') return 'bg-purple-100 text-purple-700';
    return 'bg-emerald-100 text-emerald-700';
  };

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6 animate-fade-in custom-scrollbar p-2 sm:p-4 md:p-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <PageHeader title="Support Tickets" subtitle="Contact DeePhysio Support" />
          <Button variant="primary" onClick={() => setShowNewTicketModal(true)}>
            Create New Ticket
          </Button>
        </div>

        {/* Tenant Ticket Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Ticket ID</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Replies</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading...</td></tr>
                ) : filteredTickets.length > 0 ? (
                  filteredTickets.map(t => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">TKT-{String(t.id).slice(0,6).toUpperCase()}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{t.subject}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-bold">{t.replies?.length || t._count?.replies || 0}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(t.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="outline" size="sm" onClick={() => setSelectedTicketId(t.id)}>View</Button>
                      </td>
                    </tr>
                  ))
                ) : (
                   <tr><td colSpan="6" className="p-8 text-center text-slate-400">No tickets found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New Ticket Modal */}
        {showNewTicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Create Support Ticket</h2>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Subject</label>
                  <input required value={newTicketForm.subject} onChange={e => setNewTicketForm({...newTicketForm, subject: e.target.value})} type="text" className="w-full border border-slate-200 rounded-lg p-2.5 text-sm" placeholder="Brief description of the issue" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Priority</label>
                  <select value={newTicketForm.priority} onChange={e => setNewTicketForm({...newTicketForm, priority: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Message</label>
                  <textarea required value={newTicketForm.message} onChange={e => setNewTicketForm({...newTicketForm, message: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm h-32" placeholder="Please describe your issue in detail..."></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowNewTicketModal(false)}>Cancel</Button>
                  <Button type="submit" variant="primary">Submit Ticket</Button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Chat Modal */}
        <TicketChatModal 
          isOpen={!!selectedTicketId} 
          onClose={() => setSelectedTicketId(null)} 
          ticketId={selectedTicketId}
          isSuperAdmin={false}
          onStatusChange={loadTickets}
        />
      </div>
    );
  }

  // SUPER ADMIN VIEW
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'Open').length,
    replied: tickets.filter(t => t.status === 'Replied').length,
    closed: tickets.filter(t => t.status === 'Closed').length,
  };

  return (
    <div className="p-4 md:p-6 bg-slate-50/50 min-h-screen space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <span className="text-blue-500">🎫</span> Support Tickets
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Manage all clinic owner support requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-2xl font-black text-orange-600">{stats.total}</h3>
          <p className="text-xs font-bold text-slate-600 mt-1">Total</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-2xl font-black text-blue-500">{stats.open}</h3>
          <p className="text-xs font-bold text-slate-600 mt-1">Open</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-2xl font-black text-purple-500">{stats.replied}</h3>
          <p className="text-xs font-bold text-slate-600 mt-1">Replied</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-2xl font-black text-green-500">{stats.closed}</h3>
          <p className="text-xs font-bold text-slate-600 mt-1">Closed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-600 mb-1">Status</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 w-32 outline-none focus:border-orange-500">
            <option>All</option>
            <option>Open</option>
            <option>Replied</option>
            <option>Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-600 mb-1">Priority</label>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-700 w-32 outline-none focus:border-orange-500">
            <option>All</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>
        <button onClick={() => { setStatusFilter('All'); setPriorityFilter('All'); }} className="border border-[#d9531e] text-[#d9531e] px-4 py-2 rounded-md text-sm font-bold hover:bg-orange-50 transition-colors">
          Reset Filters
        </button>
        <button onClick={loadTickets} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-md text-sm font-bold hover:bg-slate-200 transition-colors ml-auto">
          Refresh
        </button>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">TICKET #</th>
                <th className="px-6 py-4">CLINIC / ADMIN</th>
                <th className="px-6 py-4">SUBJECT</th>
                <th className="px-6 py-4">PRIORITY</th>
                <th className="px-6 py-4">STATUS</th>
                <th className="px-6 py-4">UPDATED</th>
                <th className="px-6 py-4">ACTION</th>
              </tr>
            </thead>
            <tbody className="text-[11px] font-bold text-slate-600">
              {loading ? (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading...</td></tr>
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((t, i) => {
                  const adminName = t.user_name || t.tenant?.admin_name || t.tenant?.user_name || 'Admin';
                  const clinicName = t.tenant_name || t.clinic_name || t.tenant?.clinic_name || t.tenant?.business_name || 'Clinic';
                  const userEmail = t.user_email || t.tenant?.email;

                  return (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-extrabold text-slate-700">TKT-{String(t.id).slice(0,6).toUpperCase()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-xs">
                            {adminName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-slate-900 font-extrabold text-[12px] flex items-center gap-1.5 leading-tight">
                              <span>{adminName}</span>
                              <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-200/60 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Admin</span>
                            </div>
                            <div className="text-slate-500 text-[11px] font-semibold mt-0.5">
                              {clinicName}
                            </div>
                            {userEmail && (
                              <div className="text-slate-400 text-[10px] font-normal">
                                {userEmail}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-black text-[12px] text-slate-800">{t.subject}</td>
                      <td className="px-6 py-4">
                        <span className={t.priority === 'High' ? 'text-rose-500 bg-rose-50 px-2 py-1 rounded-md' : t.priority === 'Medium' ? 'text-amber-500 bg-amber-50 px-2 py-1 rounded-md' : 'text-slate-500 bg-slate-50 px-2 py-1 rounded-md'}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded uppercase tracking-wider text-[9px] ${
                          t.status === 'Open' ? 'bg-blue-50 text-blue-500' : 
                          t.status === 'Replied' ? 'bg-purple-50 text-purple-500' :
                          'bg-emerald-50 text-emerald-500'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-slate-400 font-medium whitespace-nowrap">{formatDate(t.updated_at, t.created_at)}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => setSelectedTicketId(t.id)} className="border border-orange-200 text-orange-500 px-3 py-1 rounded text-[10px] uppercase hover:bg-orange-50 flex items-center gap-1 font-bold">
                          Open &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="7" className="p-8 text-center text-slate-400">No tickets found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Chat Modal */}
      <TicketChatModal 
        isOpen={!!selectedTicketId} 
        onClose={() => setSelectedTicketId(null)} 
        ticketId={selectedTicketId}
        isSuperAdmin={true}
        onStatusChange={loadTickets}
      />
    </div>
  );
};

export default Support;
