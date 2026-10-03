import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../config/api';
import { useToast } from '../../context/ToastContext';
import { FaEye, FaEdit, FaUserTie, FaClock, FaKey, FaBan, FaTrash, FaExclamationTriangle, FaSearch, FaFilter, FaPlus, FaFlask } from 'react-icons/fa';

const TenantManagement = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const toastCtx = useToast();
  const showToast = toastCtx?.showToast || console.log;

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/saas/tenants');
      const result = await res.json();
      if (result.success) {
        setTenants(result.data);
      } else {
        showToast(result.message || 'Failed to load tenants', 'error');
      }
    } catch (error) {
      showToast('Error loading tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleStatusChange = async (tenantId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change this tenant's status to ${newStatus}?`)) return;
    try {
      const res = await fetchApi(`/saas/tenants/${tenantId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      const result = await res.json();
      if (result.success) {
        showToast('Tenant status updated successfully', 'success');
        fetchTenants();
      } else {
        showToast(result.message || 'Failed to update status', 'error');
      }
    } catch (error) {
      showToast('Error updating tenant status', 'error');
    }
  };

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm('Are you sure you want to permanently delete this admin? This action cannot be undone.')) return;
    try {
      const res = await fetchApi(`/saas/tenants/${tenantId}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (result.success) {
        showToast('Tenant deleted successfully', 'success');
        fetchTenants();
      } else {
        showToast(result.message || 'Failed to delete tenant', 'error');
      }
    } catch (error) {
      showToast('Error deleting tenant', 'error');
    }
  };

  const handleSeedDemoData = async (tenantId) => {
    if (!window.confirm('Load demo test data (patients, appointments, invoices & SOAP notes) for this clinic?')) return;
    try {
      const res = await fetchApi('/saas/seed-demo-data', {
        method: 'POST',
        body: JSON.stringify({ tenantId })
      });
      const result = await res.json();
      if (result.success) {
        showToast('Demo clinical test data loaded successfully!', 'success');
      } else {
        showToast(result.message || 'Failed to seed demo data', 'error');
      }
    } catch (error) {
      showToast('Error seeding demo data', 'error');
    }
  };

  const handlePurgeDemoData = async (tenantId) => {
    if (!window.confirm('Purge all demo/sample test data for this clinic?')) return;
    try {
      const res = await fetchApi('/saas/purge-demo-data', {
        method: 'POST',
        body: JSON.stringify({ tenantId })
      });
      const result = await res.json();
      if (result.success) {
        showToast('Demo data purged successfully.', 'success');
      } else {
        showToast(result.message || 'Failed to purge demo data', 'error');
      }
    } catch (error) {
      showToast('Error purging demo data', 'error');
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50/50 min-h-screen space-y-6 font-sans animate-fade-in custom-scrollbar">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500 tracking-tight">Admin Management</h1>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Manage all clinic admins and their profile details
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search admins..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="p-4 pl-6">Profile</th>
                <th className="p-4">Admin Name</th>
                <th className="p-4">Subscription</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Clinic Name</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs font-semibold text-slate-600 divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p>Loading records...</p>
                    </div>
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FaUserTie className="text-4xl text-slate-200" />
                      <p>No admins found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-600 font-black shadow-sm group-hover:scale-110 transition-transform">
                        {t.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 font-bold text-sm group-hover:text-blue-600 transition-colors">{t.name || 'Unknown Admin'}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">{t.email || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-800 font-bold">{t.plan || 'None'}</div>
                    </td>
                    <td className="p-4">
                      {t.subscription_status === 'trial' ? (
                        <div>
                          <span className="px-2 py-1 rounded-md text-[9px] bg-amber-50 text-amber-600 font-black border border-amber-200/50 inline-flex items-center gap-1">
                            <FaExclamationTriangle /> Trial
                          </span>
                          <div className="text-[10px] text-slate-500 font-bold mt-1">{new Date(t.expiry_date).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-bold">{new Date(t.expiry_date).toLocaleDateString()}</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-700 font-bold">{t.clinic_name}</td>
                    <td className="p-4">
                      <div className="text-slate-700 font-medium">{t.phone || 'No Phone'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        t.subscription_status === 'active' || t.subscription_status === 'trial' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' 
                          : 'bg-rose-50 text-rose-600 border border-rose-200/50'
                      }`}>
                        {t.subscription_status || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex flex-wrap items-center justify-center gap-2 max-w-[180px] ml-auto">
                        <button onClick={() => setSelectedTenant(t)} className="w-8 h-8 bg-white border border-slate-200 shadow-sm text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer" title="View Details"><FaEye size={14} /></button>
                        
                        <button onClick={() => handleSeedDemoData(t.id)} className="w-8 h-8 bg-white border border-indigo-200 shadow-sm text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-50 transition-colors cursor-pointer" title="Load Demo/Sample Data (Testing)"><FaFlask size={13} /></button>

                        {t.subscription_status !== 'canceled' ? (
                          <button onClick={() => handleStatusChange(t.id, 'canceled')} className="w-8 h-8 bg-white border border-slate-200 shadow-sm text-slate-500 rounded-lg flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-colors cursor-pointer" title="Block Tenant"><FaBan size={14} /></button>
                        ) : (
                          <button onClick={() => handleStatusChange(t.id, 'active')} className="w-8 h-8 bg-white border border-slate-200 shadow-sm text-slate-500 rounded-lg flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-colors cursor-pointer" title="Unblock Tenant"><FaBan size={14} /></button>
                        )}
                        
                        <button onClick={() => handleDeleteTenant(t.id)} className="w-8 h-8 bg-white border border-rose-100 shadow-sm text-rose-400 rounded-lg flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer" title="Delete Tenant"><FaTrash size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Details Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-black text-slate-800">Admin Details</h3>
              <button onClick={() => setSelectedTenant(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-600 text-2xl font-black shadow-sm">
                  {selectedTenant.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">{selectedTenant.name || 'Unknown Admin'}</h4>
                  <p className="text-sm text-slate-500 font-medium">{selectedTenant.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Clinic Name</p>
                  <p className="text-sm font-bold text-slate-700">{selectedTenant.clinic_name}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Contact Phone</p>
                  <p className="text-sm font-bold text-slate-700">{selectedTenant.phone || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Current Plan</p>
                  <p className="text-sm font-bold text-slate-700">{selectedTenant.plan || 'Starter'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Account Status</p>
                  <p className="text-sm font-bold text-slate-700 capitalize">{selectedTenant.subscription_status || 'Active'}</p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedTenant(null)} className="px-5 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-700 transition-colors shadow-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
