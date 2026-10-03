import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTag, FaPlus, FaSearch, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import Button from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';
import { formatCurrency } from '../utils/currency';

const PricingServices = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const response = await fetchApi('/services');
      if (!response) return;

      const resData = await response.json();
      if (resData.success) {
        setServices(resData.data);
      } else {
        showToast(resData.message || 'Failed to fetch services', 'error');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async (id, name, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const response = await fetchApi(`/services/${id}`, { method: 'DELETE' });
      if (!response) return;

      const resData = await response.json();
      if (resData.success) {
        showToast(`${name} deleted successfully from catalog.`, 'success');
        fetchServices();
      } else {
        showToast(resData.message || 'Deletion failed', 'error');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.category && s.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: services.length,
    avg: (services.reduce((acc, s) => acc + parseFloat(s.price || 0), 0) / (services.length || 1)).toFixed(2)
  };

  return (
    <div className="space-y-4 p-3 md:p-4 animate-fade-in custom-scrollbar font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Services & Pricing</h1>
          <p className="text-slate-500 font-medium mt-0.5 text-[11px] md:text-xs">Manage your clinic service catalog and rates.</p>
        </div>
        <button 
          onClick={() => navigate('/billing/pricing/add')}
          className="flex items-center gap-2 px-4 py-2.5 bg-clinicDark text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:shadow-google transition-all active:scale-95 shadow-sm"
        >
          <FaPlus size={10}/> Add Service
        </button>
      </div>

      <div className="card-clinic px-0 py-0 overflow-hidden border border-slate-200 shadow-sm bg-white rounded-xl">
         <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-2.5 bg-slate-50/30">
            <div className="relative w-full sm:flex-1 group bg-white rounded-lg border border-slate-200">
               <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-clinicPrimary transition-colors" size={12}/>
               <input 
                 type="text" 
                 placeholder="Search services..." 
                 className="w-full pl-10 pr-4 py-2.5 bg-transparent text-[12px] font-semibold text-slate-600 outline-none placeholder:text-slate-300 transition-all" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-white px-2.5 py-1.5 rounded-md border border-slate-200">
               Count: <span className="text-clinicPrimary">{filteredServices.length}</span>
            </div>
         </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left table-auto">
               <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  <tr>
                     <th className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap">Service</th>
                     <th className="px-4 md:px-5 py-2.5 md:py-3 text-center whitespace-nowrap">Category</th>
                     <th className="px-4 md:px-5 py-2.5 md:py-3 text-center whitespace-nowrap">Rate</th>
                     <th className="px-4 md:px-5 py-2.5 md:py-3 text-center whitespace-nowrap">Duration</th>
                     <th className="px-4 md:px-5 py-2.5 md:py-3 text-center whitespace-nowrap">Status</th>
                     <th className="px-4 md:px-5 py-2.5 md:py-3 text-right whitespace-nowrap pr-6">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                     <tr>
                        <td colSpan="6" className="px-6 py-10 text-center">
                           <div className="flex flex-col items-center justify-center">
                              <div className="w-8 h-8 border-4 border-clinicPrimary/30 border-t-clinicPrimary rounded-full animate-spin mb-4"></div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Loading Catalog...</p>
                           </div>
                        </td>
                     </tr>
                  ) : filteredServices.length > 0 ? filteredServices.map(service => (
                     <tr key={service.id} className="hover:bg-slate-50/80 transition-all group cursor-pointer" onClick={() => navigate(`/billing/pricing/edit/${service.id}`)}>
                        <td className="px-4 md:px-5 py-3">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white text-slate-300 group-hover:bg-[#2EA7B8] group-hover:text-white transition-all flex items-center justify-center border border-slate-200 shrink-0">
                                 <FaTag size={12}/>
                              </div>
                              <div className="min-w-0">
                                 <p className="text-[13px] font-bold text-slate-800 truncate group-hover:text-[#2EA7B8] transition-colors">{service.name}</p>
                                 <p className="text-[9px] font-medium text-slate-400 mt-0.5">ID: {String(service.id).padStart(3, '0')}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-4 md:px-5 py-3 text-center">
                           <span className="text-[10px] font-semibold text-[#2EA7B8] bg-[#2EA7B8]/10 px-2 py-1 rounded-md whitespace-nowrap">{service.category || 'Clinical'}</span>
                        </td>
                        <td className="px-4 md:px-5 py-3 text-center text-[14px] font-bold text-slate-800 whitespace-nowrap">{formatCurrency(service.price)}</td>
                        <td className="px-4 md:px-5 py-3 text-center text-[12px] font-semibold text-slate-500 whitespace-nowrap">{service.duration}m</td>
                        <td className="px-4 md:px-5 py-3">
                           <div className={`mx-auto flex items-center justify-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide border transition-all whitespace-nowrap ${
                             service.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                           }`}>
                              {service.is_active ? <FaCheckCircle size={8}/> : <FaExclamationCircle size={8}/>}
                              {service.is_active ? 'Active' : 'Inactive'}
                           </div>
                        </td>
                        <td className="px-4 md:px-5 py-3 text-right pr-6">
                           <div className="flex items-center justify-end gap-3">
                              <button 
                                 onClick={(e) => { e.stopPropagation(); navigate(`/billing/pricing/edit/${service.id}`); }}
                                 className="text-[10px] font-bold text-[#2EA7B8] hover:text-slate-900 transition-colors"
                              >
                                 Edit
                              </button>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); handleDelete(service.id, service.name, e); }}
                                 className="text-[10px] font-bold text-rose-500 hover:text-rose-700 transition-colors"
                              >
                                 Remove
                              </button>
                           </div>
                        </td>
                     </tr>
                  )) : (
                     <tr>
                        <td colSpan="6" className="px-6 py-10 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                               <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                                  <FaTag size={24}/>
                               </div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">No matching services found</p>
                            </div>
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
          </div>
      </div>
    </div>

  );
};

export default PricingServices;

