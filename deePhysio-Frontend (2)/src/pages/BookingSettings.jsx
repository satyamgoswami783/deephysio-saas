import React, { useState, useEffect } from 'react';
import { FaCog, FaBell, FaGlobe, FaLink, FaMobileAlt, FaShieldAlt, FaSave, FaCheckCircle, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchApi } from '../config/api';

const BookingSettings = () => {
  const [activeTab, setActiveTab] = useState('Policy & Rules');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [settings, setSettings] = useState({
    noticePeriod: '24 Hours before',
    maxFuture: '3 Months ahead',
    requirePayment: true,
    autoRebooking: false,
    successMessage: 'Your appointment at DeePhysio is confirmed! We look forward to seeing you.',
    emails: { booking: true, cancellation: true, daily: false },
    widgetColor: '#2ea7b8',
    apiKey: 'pk_test_dee_923847293847',
    smsReminders: true,
    phone: '+44 700 000 000',
    bookingRooms: ['Room 1 (Consult)', 'Room 2 (Rehab)', 'Room 3 (Assessment)', 'Studio A', 'Main Gym']
  });
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetchApi('/settings');
        if (res && res.ok) {
          const resData = await res.json();
          if (resData.success && resData.data && Object.keys(resData.data).length > 0) {
            setSettings((prev) => ({
              ...prev,
              ...resData.data,
              emails: { ...prev.emails, ...(resData.data.emails || {}) },
              bookingRooms: Array.isArray(resData.data.bookingRooms) ? resData.data.bookingRooms : prev.bookingRooms
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    loadSettings();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  const handleSave = async () => {
    try {
      const res = await fetchApi('/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: { ...settings } })
      });
      if (res && res.ok) {
        showToast('Configuration Nodes Synchronized Successfully.');
      } else {
        showToast('Failed to sync settings.', 'error');
      }
    } catch (err) {
      showToast('Error syncing settings.', 'error');
      console.error(err);
    }
  };

  const handleAddRoom = () => {
    const trimmed = newRoomName.trim();
    if (!trimmed) {
      showToast('Room name cannot be empty.', 'error');
      return;
    }
    if ((settings.bookingRooms || []).includes(trimmed)) {
      showToast('Room already exists.', 'error');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      bookingRooms: [...(prev.bookingRooms || []), trimmed]
    }));
    setNewRoomName('');
  };

  const handleDeleteRoom = (room) => {
    setSettings((prev) => ({
      ...prev,
      bookingRooms: (prev.bookingRooms || []).filter((r) => r !== room)
    }));
  };

  const tabs = [
    { name: 'Policy & Rules', icon: <FaShieldAlt /> },
    { name: 'Room Master', icon: <FaCog /> },
    { name: 'Notifications', icon: <FaBell /> },
    { name: 'Integrations', icon: <FaLink /> },
    { name: 'SMS Alerts', icon: <FaMobileAlt /> },
  ];

  return (
    <div className="max-w-[1300px] w-full mx-auto space-y-4 sm:space-y-5 px-4 sm:px-5 lg:px-6 animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans relative">
      {/* Professional Toast Notifications */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl shadow-sm border bg-emerald-50 border-emerald-100 text-emerald-700 flex items-center gap-2 sm:gap-3 min-w-[240px] sm:min-w-[280px]"
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
               <FaCheck size={10}/>
            </div>
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Booking Configuration</h1>
          <p className="text-[9px] sm:text-[10px] border-l-2 sm:border-l-4 border-clinicPrimary pl-2 sm:pl-3 font-bold text-slate-400 mt-1.5 sm:mt-2 uppercase tracking-widest">Fine-tune how clients interact with your clinic online.</p>
        </div>
        <button 
          onClick={handleSave}
          className="w-full sm:w-auto bg-slate-900 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] shadow-sm hover:bg-clinicPrimary active:scale-95 transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          <FaSave size={10}/> Update Settings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1 border-b lg:border-none border-slate-100 pb-4 lg:pb-0 mb-2 lg:mb-0">
          <div className="flex flex-row lg:flex-col gap-1.5 sm:gap-2 overflow-x-auto lg:overflow-visible custom-scrollbar pb-2 lg:pb-0 h-full">
            <div className="lg:bg-white lg:border lg:border-slate-100 lg:p-2 lg:rounded-xl lg:shadow-sm space-y-0 lg:space-y-1 sm:flex lg:block">
               {tabs.map(item => (
                 <button 
                   key={item.name}
                   onClick={() => setActiveTab(item.name)}
                   className={`flex-shrink-0 w-auto lg:w-full flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-lg transition-colors text-left ${
                     activeTab === item.name 
                     ? 'bg-clinicPrimary/10 text-clinicPrimary font-black shadow-sm border border-clinicPrimary/20' 
                     : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent font-bold'
                   }`}
                 >
                   <span className={`text-[12px] sm:text-[14px] ${activeTab === item.name ? 'text-clinicPrimary' : 'text-slate-400'}`}>{item.icon}</span>
                   <span className="text-[9px] sm:text-[10px] uppercase tracking-widest whitespace-nowrap">{item.name}</span>
                 </button>
               ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 h-fit max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Policy & Rules */}
          {activeTab === 'Policy & Rules' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-5 lg:p-6 space-y-5 sm:space-y-6">
              <section className="space-y-3 sm:space-y-4">
                <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-clinicPrimary border-b border-slate-100 pb-2 flex items-center justify-between">
                  General Booking Rules
                  <FaCheckCircle className="text-emerald-500" size={10}/>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Notice Period</label>
                    <select 
                      className="w-full p-2 sm:p-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-[11px] sm:text-[12px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary shadow-sm transition-colors appearance-none cursor-pointer"
                      value={settings.noticePeriod}
                      onChange={(e) => setSettings({...settings, noticePeriod: e.target.value})}
                    >
                      <option>24 Hours before</option>
                      <option>12 Hours before</option>
                      <option>2 Hours before</option>
                    </select>
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Minimum time for new bookings.</p>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Max Future Booking</label>
                    <select 
                      className="w-full p-2 sm:p-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-[11px] sm:text-[12px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary shadow-sm transition-colors appearance-none cursor-pointer"
                      value={settings.maxFuture}
                      onChange={(e) => setSettings({...settings, maxFuture: e.target.value})}
                    >
                      <option>3 Months ahead</option>
                      <option>6 Months ahead</option>
                      <option>1 Year ahead</option>
                    </select>
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Maximum future scheduling reach.</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3 sm:space-y-4">
                <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-clinicPrimary border-b border-slate-100 pb-2">Cancellation Policy</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <label className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl cursor-pointer transition-colors border shadow-sm ${settings.requirePayment ? 'bg-clinicPrimary/5 border-clinicPrimary/20' : 'bg-white border-slate-200 hover:bg-slate-50'}`} onClick={() => setSettings({...settings, requirePayment: !settings.requirePayment})}>
                      <div className={`mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${settings.requirePayment ? 'bg-clinicPrimary border-clinicPrimary text-white' : 'bg-slate-50 border-slate-200'}`}>
                        {settings.requirePayment && <FaCheck size={8}/>}
                      </div>
                      <div className="flex-1">
                         <p className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase tracking-tight leading-tight">Require Cancel Payment</p>
                         <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Charge fee if less than 24h prior.</p>
                      </div>
                   </label>
                   <label className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl cursor-pointer transition-colors border shadow-sm ${settings.autoRebooking ? 'bg-clinicPrimary/5 border-clinicPrimary/20' : 'bg-white border-slate-200 hover:bg-slate-50'}`} onClick={() => setSettings({...settings, autoRebooking: !settings.autoRebooking})}>
                      <div className={`mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center border transition-colors shrink-0 ${settings.autoRebooking ? 'bg-clinicPrimary border-clinicPrimary text-white' : 'bg-slate-50 border-slate-200'}`}>
                        {settings.autoRebooking && <FaCheck size={8}/>}
                      </div>
                      <div className="flex-1">
                         <p className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase tracking-tight leading-tight">Automated Re-booking</p>
                         <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Suggest immediately after cancel.</p>
                      </div>
                   </label>
                </div>
              </section>

              <section className="space-y-3 sm:space-y-4">
                 <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-clinicPrimary border-b border-slate-100 pb-2">Personalization</h3>
                 <div className="space-y-2 sm:space-y-3">
                    <div className="space-y-1.5 sm:space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Custom Success Message</label>
                       <textarea 
                        className="w-full mt-1 p-3 sm:p-4 bg-white border border-slate-200 rounded-xl text-[11px] sm:text-[12px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary shadow-sm transition-colors h-20 sm:h-24 resize-none leading-relaxed custom-scrollbar placeholder:text-slate-400"
                        value={settings.successMessage}
                        onChange={(e) => setSettings({...settings, successMessage: e.target.value})}
                       />
                       <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Displayed to clients after confirming their booking.</p>
                    </div>
                 </div>
              </section>
            </motion.div>
          )}

          {/* Room Master Tab */}
          {activeTab === 'Room Master' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-5 lg:p-6 space-y-5 sm:space-y-6">
              <section className="space-y-3 sm:space-y-4">
                <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-clinicPrimary border-b border-slate-100 pb-2">
                  Room Master
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      placeholder="Add room name..."
                      className="flex-1 p-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary"
                    />
                    <button
                      onClick={handleAddRoom}
                      className="px-4 py-2.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-clinicPrimary transition-colors"
                    >
                      Add Room
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(settings.bookingRooms || []).map((room) => (
                      <div key={room} className="flex items-center justify-between px-3 py-2 bg-white border border-slate-200 rounded-lg">
                        <span className="text-[12px] font-bold text-slate-700">{room}</span>
                        <button
                          onClick={() => handleDeleteRoom(room)}
                          className="text-[10px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    Rooms saved here will be used in appointment booking.
                  </p>
                </div>
              </section>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'Notifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-5 lg:p-6 space-y-5 sm:space-y-6">
              <section className="space-y-3 sm:space-y-4">
                <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-clinicPrimary border-b border-slate-100 pb-2 flex items-center justify-between">
                  Communication Nodes
                  <FaBell className="text-clinicPrimary/50" size={10}/>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {['booking', 'cancellation', 'daily'].map(type => (
                    <div key={type} className="p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between gap-3 sm:gap-4 transition-colors hover:border-clinicPrimary/30">
                      <div>
                        <p className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">Email {type}</p>
                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest">Automatic Dispatch</p>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, emails: {...settings.emails, [type]: !settings.emails[type]}})}
                        className={`w-9 sm:w-10 h-4 sm:h-5 rounded-full transition-colors relative self-start shadow-sm border ${settings.emails[type] ? 'bg-clinicPrimary border-clinicPrimary' : 'bg-slate-100 border-slate-200'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${settings.emails[type] ? 'translate-x-[20px] sm:translate-x-[22px]' : 'translate-x-0.5'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'Integrations' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-5 lg:p-6 space-y-5 sm:space-y-6">
              <section className="space-y-3 sm:space-y-4">
                 <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-clinicPrimary border-b border-slate-100 pb-2 flex items-center justify-between">
                    External Protocol Link
                    <FaLink className="text-clinicPrimary/50" size={10}/>
                 </h3>
                 <div className="space-y-3 sm:space-y-4">
                   <div className="space-y-1.5 sm:space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">API Secure Key</label>
                     <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                       <input type="text" readOnly value={settings.apiKey} className="flex-1 p-2 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] sm:text-[11px] font-bold text-slate-600 font-mono shadow-sm transition-colors text-ellipsis" />
                       <button className="w-full sm:w-auto px-4 sm:px-5 py-2 sm:py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-clinicPrimary hover:border-clinicPrimary/30 hover:bg-clinicPrimary/5 transition-colors shadow-sm text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center justify-center shrink-0">Copy Key</button>
                     </div>
                   </div>
                 </div>
              </section>
            </motion.div>
          )}
          
          {/* SMS Alerts Tab */}
          {activeTab === 'SMS Alerts' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 sm:p-5 lg:p-6 space-y-5 sm:space-y-6">
              <section className="space-y-3 sm:space-y-4">
                 <h3 className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-clinicPrimary border-b border-slate-100 pb-2 flex items-center justify-between">
                   Temporal SMS Dispatch
                   <FaMobileAlt className="text-clinicPrimary/50" size={10}/>
                 </h3>
                 <div className="space-y-3 sm:space-y-4">
                   <div className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                     <div className="flex items-center gap-2 sm:gap-3">
                       <div className="w-8 h-8 rounded-lg bg-clinicPrimary/10 text-clinicPrimary flex items-center justify-center shrink-0 hidden sm:flex">
                          <FaMobileAlt size={12}/>
                       </div>
                       <div>
                         <p className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase leading-none mb-1">Emergency Protocol SMS</p>
                         <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Instant sync for priority cancellations</p>
                       </div>
                     </div>
                     <button 
                       onClick={() => setSettings({...settings, smsReminders: !settings.smsReminders})}
                       className={`w-9 sm:w-10 h-4 sm:h-5 rounded-full transition-colors relative flex-shrink-0 shadow-sm border ${settings.smsReminders ? 'bg-clinicPrimary border-clinicPrimary' : 'bg-slate-100 border-slate-200'}`}
                     >
                       <div className={`absolute top-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${settings.smsReminders ? 'translate-x-[20px] sm:translate-x-[22px]' : 'translate-x-0.5'}`}></div>
                     </button>
                   </div>
                   <div className="space-y-1.5 sm:space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Dispatch Phone Vector</label>
                     <input 
                       type="text" 
                       className="w-full mt-1 p-2 sm:p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] sm:text-[12px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary shadow-sm transition-colors"
                       value={settings.phone}
                       onChange={(e) => setSettings({...settings, phone: e.target.value})}
                     />
                   </div>
                 </div>
              </section>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingSettings;
