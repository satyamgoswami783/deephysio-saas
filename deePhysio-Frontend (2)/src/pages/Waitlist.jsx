import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaUser, FaPhone, FaCalendarPlus, FaFilter, FaSearch, FaEllipsisV, FaCheckCircle, FaArrowRight, FaChevronLeft, FaChevronRight, FaPlus, FaTrash, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import PageHeader from '../components/ui/PageHeader';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';

const Waitlist = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEntry, setNewEntry] = useState({
    firstName: '',
    lastName: '',
    requestedService: '',
    preferredDate: '',
    preferredTime: '',
    contactNumber: '',
    status: 'Medium'
  });


  const role = sessionStorage.getItem('deephysio_role');
  const isTherapist = role === 'therapist';
  const isReceptionist = role === 'receptionist';

  // --- API Integration: Load Services ---
  const fetchServices = async () => {
    try {
      const res = await fetchApi('/services');
      if (res && res.ok) {
        const result = await res.json();
        const serviceList = Array.isArray(result.data) ? result.data : [];
        setServices(serviceList);
        if (serviceList.length > 0) {
          setNewEntry(prev => ({
            ...prev,
            requestedService: prev.requestedService || serviceList[0].name
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching services in Waitlist:', err);
    }
  };

  // --- API Integration: Load Data ---
  const fetchWaitlist = async () => {
    setIsLoading(true);
    try {
      const res = await fetchApi('/waitlist');
      if (res && res.ok) {
        const result = await res.json();
        // Backend returns data in result.data
        setWaitlistEntries(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      showToast('Failed to load waitlist data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
    fetchServices();
  }, []);

  const filteredEntries = waitlistEntries.filter(e => {
    const fullName = `${e.firstName || ''} ${e.lastName || ''}`.trim();
    const serviceName = e.service || e.requestedService || '';
    const idStr = String(e.id || '');
    
    return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           idStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
           serviceName.toLowerCase().includes(searchTerm.toLowerCase());
  });


  // --- API Integration: Add Entry ---
  const handleAddEntry = async () => {
    if (!newEntry.firstName || !newEntry.lastName) {
      showToast('First and last names are required.', 'error');
      return;
    }


    try {
      // Map frontend fields to backend camelCase expected by validation
      const payload = {
        firstName: newEntry.firstName,
        lastName: newEntry.lastName,
        service: newEntry.requestedService,
        preferredDate: newEntry.preferredDate || null,
        preferredTime: newEntry.preferredTime || '',
        contactNumber: newEntry.contactNumber,
        priority: newEntry.status.toUpperCase() // Map "High" -> "HIGH"
      };


      const res = await fetchApi('/waitlist', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res && res.ok) {
        showToast(`${newEntry.firstName} ${newEntry.lastName} added to the waitlist.`);
        setIsAddModalOpen(false);
        setNewEntry({ firstName: '', lastName: '', requestedService: services[0]?.name || '', preferredDate: '', preferredTime: '', contactNumber: '', status: 'Medium' });
        fetchWaitlist(); // Refresh the list
      } else {

        const errorData = await res.json();
        showToast(errorData.message || 'Failed to add entry', 'error');
      }
    } catch (error) {
      console.error('Error adding waitlist entry:', error);
      showToast('Network error while adding to waitlist.', 'error');
    }
  };

  // --- API Integration: Delete Entry ---
  const handleRemoveEntry = async (id) => {
    try {
      const res = await fetchApi(`/waitlist/${id}`, {
        method: 'DELETE'
      });

      if (res && res.ok) {
        showToast('Patient removed from waitlist.', 'success');
        fetchWaitlist(); // Refresh the list
      } else {
        showToast('Failed to remove entry.', 'error');
      }
    } catch (error) {
      console.error('Error removing waitlist entry:', error);
      showToast('Network error while removing entry.', 'error');
    }
  };

  const handleReclaimSlot = (entry) => {
    // Instead of deleting, we pass the data to the book page to initiate conversion
    showToast(`Initiating clinical conversion for ${entry.firstName} ${entry.lastName}...`, 'success');
    navigate('/appointments/book', { 
        state: { 
            waitlistId: entry.id,
            patientId: entry.patientId,
            patientName: `${entry.firstName} ${entry.lastName}`,
            service: entry.service,
            contactNumber: entry.contactNumber,
            preferredDate: entry.preferredDate,
            preferredTime: entry.preferredTime
        } 
    });
  };




  const handleAction = (action, entry) => {
    // Placeholder for extended functionality
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 animate-fade-in custom-scrollbar font-sans pb-20 relative">

      <PageHeader
        title="Waitlist"
        subtitle="Manage patient requests and find available appointment slots."
        icon={<FaClock />}
        actions={
          <Button
            variant="accent"
            className="h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-google"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<FaCalendarPlus size={12} />}
          >
            Add to Waitlist
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-none overflow-hidden border border-slate-100">
            <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 bg-slate-50/50">
              <div className="relative flex-1 group w-full">
                <FaSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-clinicPrimary transition-colors" size={12} />
                <input
                  type="text"
                  placeholder="Search waitlist by patient or service..."
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-lg text-[11px] sm:text-[12px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-colors placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left table-auto">
                <thead className="bg-slate-50/80 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Patient Name</th>
                    <th className="px-4 py-3 whitespace-nowrap">Service</th>
                    <th className="px-4 py-3 whitespace-nowrap">Preferred Time</th>
                    <th className="px-4 py-3 whitespace-nowrap">Contact Number</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">Priority</th>
                    <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!isLoading && filteredEntries.length > 0 ? filteredEntries.map(entry => {
                    const fullName = `${entry.firstName || ''} ${entry.lastName || ''}`.trim() || 'Unknown';
                    const initials = `${entry.firstName?.[0] || ''}${entry.lastName?.[0] || ''}` || '?';
                    const priority = entry.priority || 'Medium';
                    const displayPriority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
                    const service = entry.service;
                    const contact = entry.contactNumber;
                    
                    // Unified time display
                    let timeStr = entry.preferredTime || 'Any Time';
                    if (entry.preferredDate) {
                        const d = new Date(entry.preferredDate);
                        timeStr = `${d.toLocaleDateString('en-GB')} @ ${timeStr}`;
                    }


                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer border-l-2 border-transparent hover:border-clinicPrimary" onClick={() => handleAction('Node Inspection', entry)}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <p className="text-[12px] sm:text-[13px] font-black text-slate-900 group-hover:text-clinicPrimary transition-colors leading-none tracking-tight">{fullName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 py-1 bg-slate-100/50 rounded group-hover:bg-clinicPrimary/5 group-hover:text-clinicPrimary transition-colors">{service}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-[11px] font-bold text-slate-600 italic">{timeStr}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-[11px] font-bold text-[#2EA7B8]">{contact}</p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className={`mx-auto w-fit px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border shadow-sm ${priority === 'HIGH' || priority === 'High' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                              priority === 'MEDIUM' || priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                            {displayPriority}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 text-emerald-500 hover:text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors flex items-center justify-center shrink-0"
                              title="Book Now"
                              onClick={(e) => { e.stopPropagation(); handleReclaimSlot(entry); }}
                            >
                              <FaCalendarPlus size={10} />
                            </button>
                            <a
                              href={`tel:${contact}`}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 text-[#2EA7B8] hover:text-white hover:bg-[#2EA7B8] hover:border-[#2EA7B8] transition-colors flex items-center justify-center shrink-0"
                              title="Call Patient"
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              <FaPhone size={10} />
                            </a>
                            <button
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 text-rose-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors flex items-center justify-center shrink-0"
                              title="Purge Entry"
                              onClick={(e) => { e.stopPropagation(); handleRemoveEntry(entry.id); }}
                            >
                              <FaTrash size={10} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : !isLoading && (
                    <tr>
                      <td colSpan="6" className="px-4 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">No patients on waitlist</td>
                    </tr>
                  )}
                  {isLoading && (
                    <tr>
                      <td colSpan="6" className="px-4 py-16 text-center text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Waitlist...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 sm:p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Viewing {filteredEntries.length} entries
              </p>
              <div className="flex gap-2">
                <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-clinicPrimary transition-colors disabled:opacity-30 px-2 py-1" disabled>Back</button>
                <button className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-clinicPrimary transition-colors disabled:opacity-30 px-2 py-1" disabled>Forward</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High-Reliability Inline Modal Overlay */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
              onClick={() => setIsAddModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-[0_32px_128px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-clinicPrimary/10 rounded-xl flex items-center justify-center text-clinicPrimary border border-clinicPrimary/10">
                    <FaCalendarPlus size={16} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Add to Waitlist</h2>
                    <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest leading-none">New patient request</p>
                  </div>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                  <FaPlus className="rotate-45" size={14} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">First Name</label>
                    <div className="relative group/input">
                      <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-clinicPrimary transition-colors" size={12} />
                      <input
                        type="text"
                        autoFocus
                        className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary/30 focus:bg-white transition-all placeholder:text-slate-300 shadow-sm"
                        placeholder="John"
                        value={newEntry.firstName}
                        onChange={(e) => setNewEntry({ ...newEntry, firstName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Name</label>
                    <div className="relative group/input">
                      <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-clinicPrimary transition-colors" size={12} />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-[12px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary/30 focus:bg-white transition-all placeholder:text-slate-300 shadow-sm"
                        placeholder="Doe"
                        value={newEntry.lastName}
                        onChange={(e) => setNewEntry({ ...newEntry, lastName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Requested Service</label>
                    <div className="relative">
                      <select
                        className="w-full pl-4 pr-10 py-3 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary/30 transition-all cursor-pointer shadow-sm appearance-none"
                        value={newEntry.requestedService}
                        onChange={(e) => setNewEntry({ ...newEntry, requestedService: e.target.value })}
                      >
                        {services.length > 0 ? (
                          services.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name} ({s.duration} min)
                            </option>
                          ))
                        ) : (
                          <option value="">No services available (Configure in Services)</option>
                        )}
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                        <FaChevronRight className="rotate-90" size={8} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Priority Level</label>
                    <div className="relative">
                      <select
                        className="w-full pl-4 pr-10 py-3 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary/30 transition-all cursor-pointer shadow-sm appearance-none"
                        value={newEntry.status}
                        onChange={(e) => setNewEntry({ ...newEntry, status: e.target.value })}
                      >
                        <option value="Low">Low Priority</option>
                        <option value="Medium">Medium Priority</option>
                        <option value="High">High Priority</option>
                      </select>
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                        <FaChevronRight className="rotate-90" size={8} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Date</label>
                    <div className="relative group/input">
                      <FaCalendarPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-clinicPrimary transition-colors" size={12} />
                      <input
                        type="date"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary/30 transition-all cursor-pointer shadow-sm"
                        value={newEntry.preferredDate}
                        onChange={(e) => setNewEntry({ ...newEntry, preferredDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Preferred Time</label>
                    <div className="relative group/input">
                      <FaClock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-clinicPrimary transition-colors" size={12} />
                      <input
                        type="time"
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary/30 transition-all cursor-pointer shadow-sm"
                        value={newEntry.preferredTime}
                        onChange={(e) => setNewEntry({ ...newEntry, preferredTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Number</label>
                  <div className="relative group/input">
                    <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-clinicPrimary transition-colors" size={12} />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary/30 transition-all placeholder:text-slate-300 shadow-sm"
                      placeholder="+XX XXXXXXXX"
                      value={newEntry.contactNumber}
                      onChange={(e) => setNewEntry({ ...newEntry, contactNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex sm:flex-row justify-end gap-3 flex-shrink-0">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 bg-white text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddEntry}
                  className="px-6 py-2.5 bg-clinicPrimary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-clinicPrimary/20 hover:bg-clinicPrimary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <FaPlus size={10} /> Add to Waitlist
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Waitlist;
