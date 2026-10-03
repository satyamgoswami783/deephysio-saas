import React, { useState } from 'react';
import { FaMapMarkerAlt, FaPlus, FaPhoneAlt, FaRegClock, FaGlobe, FaClinicMedical, FaTimes, FaCheck } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';

const MultiLocation = () => {
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [locations, setLocations] = useState([
    { id: 1, name: 'Main Downtown Clinic', address: '123 Health Ave, City Center', phone: '+1 234-567-890', timezone: 'EST (GMT-5)', status: 'Primary' },
    { id: 2, name: 'North Suburban Branch', address: '456 Wellness Blvd, Northside', phone: '+1 234-987-654', timezone: 'EST (GMT-5)', status: 'Active' },
  ]);

  const [form, setForm] = useState({ name: '', address: '', phone: '', timezone: 'EST (GMT-5)', status: 'Active' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.phone) {
      showToast('Please fill all required fields.'); return;
    }
    setLocations(prev => [...prev, { ...form, id: Date.now() }]);
    setForm({ name: '', address: '', phone: '', timezone: 'EST (GMT-5)', status: 'Active' });
    setShowForm(false);
    showToast('New location added successfully!');
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-black text-gray-900 tracking-tight uppercase leading-none">Multi-Location Management</h1>
          <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Configure and sync clinical operations across different physical sites.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-clinicPrimary text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-md hover:bg-clinicPrimary/90 active:scale-95 transition-all"
        >
          <FaPlus size={9}/> Add New Location
        </button>
      </div>

      {/* Add New Location Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Add New Location</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Register a new clinical site</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all">
                <FaTimes size={12}/>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Location Name *</label>
                <input
                  name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. East Wing Clinic"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-clinicPrimary focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Address *</label>
                <input
                  name="address" value={form.address} onChange={handleChange}
                  placeholder="e.g. 789 Medical Lane, Downtown"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-clinicPrimary focus:bg-white transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone *</label>
                  <input
                    name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+1 234-000-000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-clinicPrimary focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Timezone</label>
                  <select
                    name="timezone" value={form.timezone} onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-clinicPrimary focus:bg-white transition-all"
                  >
                    <option>EST (GMT-5)</option>
                    <option>PST (GMT-8)</option>
                    <option>CST (GMT-6)</option>
                    <option>IST (GMT+5:30)</option>
                    <option>GMT (GMT+0)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Site Status</label>
                <div className="flex gap-2">
                  {['Active', 'Primary', 'Inactive'].map(s => (
                    <button
                      key={s} type="button"
                      onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${form.status === s ? 'bg-clinicPrimary text-white border-clinicPrimary' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-clinicPrimary/40'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 py-2 rounded-lg text-[10px] font-black text-white uppercase tracking-widest bg-clinicPrimary hover:bg-clinicPrimary/90 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <FaCheck size={9}/> Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Locations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {locations.map(loc => (
          <div key={loc.id} className="bg-white rounded-xl border border-slate-100 shadow-md hover:shadow-lg transition-all group relative overflow-hidden p-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-clinicLight/40 rounded-bl-full -mr-10 -mt-10 group-hover:scale-110 transition-transform pointer-events-none"/>

            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-clinicPrimary text-white flex items-center justify-center shadow-sm shrink-0">
                <FaClinicMedical size={16}/>
              </div>
              <div>
                <span className="text-[9px] font-black text-clinicPrimary uppercase tracking-widest border border-clinicPrimary/20 px-2 py-0.5 rounded-md inline-block mb-0.5">
                  {loc.status} Site
                </span>
                <h3 className="text-xs font-black text-gray-900 tracking-tight uppercase leading-tight">{loc.name}</h3>
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-slate-300 shrink-0" size={11}/>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{loc.address}</p>
              </div>
              <div className="flex items-center gap-2">
                <FaPhoneAlt className="text-slate-300 shrink-0" size={11}/>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{loc.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <FaRegClock className="text-slate-300 shrink-0" size={11}/>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{loc.timezone}</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center relative z-10">
              <button className="text-[10px] font-black text-clinicPrimary uppercase tracking-widest hover:underline transition-all">
                Edit Site Settings
              </button>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-green-500 uppercase tracking-widest">
                <FaGlobe size={9}/> Synced
              </div>
            </div>
          </div>
        ))}

        {/* Add More Placeholder */}
        <div
          onClick={() => setShowForm(true)}
          className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 shadow-none flex flex-col items-center justify-center text-center group cursor-pointer hover:border-clinicPrimary/40 hover:bg-white transition-all p-6 min-h-[160px]"
        >
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mb-3 group-hover:border-clinicPrimary transition-all">
            <FaPlus className="text-slate-200 group-hover:text-clinicPrimary transition-all" size={16}/>
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-clinicPrimary transition-all">Enable Branch Expansion</h3>
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1 max-w-[180px]">Click to add a new clinical site location.</p>
        </div>
      </div>
    </div>
  );
};

export default MultiLocation;
