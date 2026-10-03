import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaPlus, FaSearch, FaCheck, FaTimes, FaLock, FaUserCog, FaShieldAlt, FaChevronRight, FaSave, FaUndo, FaEye, FaEdit, FaTrashAlt, FaHeartbeat, FaUser, FaCreditCard, FaUserPlus } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';

const RolesPermissions = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matrixState, setMatrixState] = useState({
    ADMIN: {},
    THERAPIST: {},
    RECEPTIONIST: {},
    'BILLING STAFF': {}
  });

  const roles = [
    { id: 'RL-001', name: 'ADMIN', users: 1, level: 'GLOBAL ACCESS', color: 'slate', icon: <FaShieldAlt /> },
    { id: 'RL-002', name: 'THERAPIST', users: 2, level: 'CLINICAL ONLY', color: 'clinicPrimary', icon: <FaHeartbeat /> },
    { id: 'RL-003', name: 'RECEPTIONIST', users: 1, level: 'OPERATIONAL', color: 'emerald', icon: <FaUser /> },
    { id: 'RL-004', name: 'BILLING STAFF', users: 1, level: 'FINANCE NODE', color: 'indigo', icon: <FaCreditCard /> },
  ];

  const permissions = [
    { id: 'db', cat: 'DASHBOARD', actions: ['READ', 'WRITE', 'DELETE', 'ADMIN'] },
    { id: 'ap', cat: 'APPOINTMENTS', actions: ['READ', 'WRITE', 'DELETE', 'ADMIN'] },
    { id: 'pt', cat: 'PATIENTS', actions: ['READ', 'WRITE', 'DELETE', 'ADMIN'] },
    { id: 'cn', cat: 'CLINICAL NOTES', actions: ['READ', 'WRITE', 'DELETE', 'ADMIN'] },
    { id: 'cm', cat: 'COMMUNICATION', actions: ['READ', 'WRITE', 'DELETE', 'ADMIN'] },
    { id: 'bp', cat: 'BILLING & PAYMENTS', actions: ['READ', 'WRITE', 'DELETE', 'ADMIN'] },
    { id: 'fm', cat: 'FORMS', actions: ['READ', 'WRITE', 'DELETE', 'ADMIN'] },
    { id: 'an', cat: 'ANALYTICS', actions: ['READ', 'WRITE', 'DELETE', 'ADMIN'] },
    { id: 'mk', cat: 'MARKETING', actions: ['READ', 'WRITE', 'DELETE', 'ADMIN'] },
    { id: 'ig', cat: 'INTEGRATIONS', actions: ['READ', 'WRITE', 'DELETE', 'ADMIN'] },
    { id: 'st', cat: 'SETTINGS', actions: ['READ', 'WRITE', 'DELETE', 'ADMIN'] },
  ];

  useEffect(() => {
    const fetchMatrix = async () => {
      try {
        const res = await fetchApi('/settings/roles-permissions');
        const data = await res.json();
        if (data.success && data.data) {
          setMatrixState(data.data);
        }
      } catch (err) {
        console.error('Failed to load matrix:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatrix();
  }, []);

  const isChecked = (cat, action) => {
    const roleKey = selectedRole.toUpperCase();
    const roleObj = matrixState[roleKey] || matrixState[selectedRole] || {};
    const catActions = roleObj[cat] || [];
    if (selectedRole === 'ADMIN') return true;
    return catActions.includes(action);
  };

  const togglePermission = (cat, action) => {
    if (selectedRole === 'ADMIN') return; // Admin has full access
    const roleKey = selectedRole.toUpperCase();
    setMatrixState(prev => {
      const currentRole = prev[roleKey] || {};
      const currentCatActions = currentRole[cat] || [];
      const hasAction = currentCatActions.includes(action);
      const updatedCatActions = hasAction
        ? currentCatActions.filter(a => a !== action)
        : [...currentCatActions, action];

      return {
        ...prev,
        [roleKey]: {
          ...currentRole,
          [cat]: updatedCatActions
        }
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetchApi('/settings/roles-permissions', {
        method: 'POST',
        body: JSON.stringify(matrixState)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Security Matrix Synchronized: Permissions for "${selectedRole}" saved successfully.`);
      } else {
        showToast(data.message || 'Failed to save permissions', 'error');
      }
    } catch (err) {
      showToast('Error syncing role permissions', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = (action) => {
    showToast(`Institutional Protocol: Initiating ${action} for Role Optimization.`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 px-4 sm:px-6 lg:px-8 py-12 animate-fade-in custom-scrollbar font-sans bg-slate-50/30">
      
      {/* Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-4 px-2">
        <div className="text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Access Control Matrix</h1>
          <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-[10px] opacity-70">Calibrate institutional permission nodes and authority hierarchies.</p>
        </div>
        <Button 
          variant="accent" 
          size="lg"
          className="rounded-[20px] h-12 px-8 shadow-google active:scale-95 transition-all text-[10px] font-black uppercase tracking-[0.2em] w-full lg:w-auto"
          onClick={() => navigate('/settings/roles/add')}
          leftIcon={<FaPlus size={12}/>}
        >
          Initialize New Role
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Sidebar: Hierarchies */}
        <div className="lg:col-span-4 space-y-4">
           <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] px-4 mb-6">Authority Hierarchies</h4>
           
           <div className="space-y-4">
             {roles.map(role => (
                <button 
                  key={role.id} 
                  onClick={() => setSelectedRole(role.name)}
                  className={`w-full p-6 rounded-[28px] border-none transition-all text-left flex items-center gap-6 group relative ${
                    selectedRole === role.name 
                      ? 'bg-[#0f172a] text-white shadow-2xl' 
                      : 'bg-white text-slate-400 hover:bg-white hover:shadow-premium'
                  }`}
                >
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all duration-500 ${
                     selectedRole === role.name 
                       ? 'bg-clinicPrimary text-white shadow-clinicPrimary/20' 
                       : (role.color === 'slate' ? 'bg-slate-100 text-slate-400' : `bg-${role.color === 'clinicPrimary' ? 'blue' : role.color}-50 text-${role.color === 'clinicPrimary' ? 'clinicPrimary' : role.color}-400`)
                   }`}>
                      {React.cloneElement(role.icon, { size: 18 })}
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <h3 className={`text-[13px] font-black uppercase tracking-wider truncate mb-1 ${selectedRole === role.name ? 'text-white' : 'text-slate-700'}`}>{role.name}</h3>
                      <p className={`text-[9px] font-bold uppercase tracking-[0.15em] opacity-40`}>
                        {role.level} <span className="mx-1">•</span> {role.users} ACTIVE NODES
                      </p>
                   </div>
                   <FaChevronRight className={`ml-auto transition-transform text-[10px] ${selectedRole === role.name ? 'text-clinicPrimary translate-x-1' : 'text-slate-100 group-hover:text-slate-200'}`} />
                </button>
             ))}
           </div>
        </div>

        {/* Right Panel: Matrix */}
        <div className="lg:col-span-8">
          <Card className="p-0 bg-white border-none shadow-premium overflow-hidden rounded-[40px] flex flex-col h-full border border-slate-50">
            <div className="p-10 flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden group">
               <div className="flex items-center gap-6 relative z-10 text-left">
                  <div className="w-14 h-14 bg-slate-50 rounded-[20px] text-clinicPrimary flex items-center justify-center border border-slate-100 shadow-sm">
                     <FaShieldAlt size={20}/>
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">{selectedRole} Matrix</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 opacity-60">Synchronize functional permissions for this node.</p>
                  </div>
               </div>
               <button 
                onClick={() => handleAction('Security Bulk Lock')}
                className="text-[9px] font-black text-clinicPrimary uppercase tracking-[0.2em] flex items-center gap-3 px-6 py-3 border border-clinicPrimary/10 rounded-xl hover:bg-clinicPrimary hover:text-white transition-all shadow-sm active:scale-95 bg-white"
               >
                  <FaLock size={10} /> ENCRYPTION LOCK
               </button>
            </div>

            <div className="flex-1 overflow-x-auto custom-scrollbar px-6">
               <table className="w-full text-left min-w-[600px]">
                  <thead className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                     <tr>
                        <th className="px-6 py-4 w-[40%]">OPERATIONAL MODULE</th>
                        {['READ', 'WRITE', 'DELETE', 'ADMIN'].map(act => (
                          <th key={act} className="px-6 py-4 text-center">{act}</th>
                        ))}
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50/50">
                     {permissions.map((p) => (
                        <tr key={p.id} className="group/tr transition-all">
                           <td className="px-6 py-6 text-left">
                              <div className="flex items-center gap-4 text-slate-600 font-bold text-[12px] uppercase tracking-wider group-hover/tr:text-clinicPrimary transition-colors">
                                 <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover/tr:bg-clinicPrimary transition-all"></div>
                                 {p.cat}
                              </div>
                           </td>
                           {p.actions.map(action => (
                              <td key={action} className="px-6 py-6 text-center">
                                 <label className="relative inline-flex items-center cursor-pointer group/toggle">
                                    <input 
                                      type="checkbox" 
                                      className="sr-only peer" 
                                      checked={isChecked(p.cat, action)}
                                      onChange={() => togglePermission(p.cat, action)}
                                      disabled={selectedRole === 'ADMIN'}
                                    />
                                    <div className="w-10 h-5 bg-slate-100/80 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:shadow-sm after:transition-all peer-checked:bg-clinicPrimary transition-all"></div>
                                 </label>
                              </td>
                           ))}
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            
            <div className="p-8 bg-slate-50/20 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-slate-50/50">
               <div className="flex flex-col text-left">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[.3em]">LAST SYNC: {new Date().toLocaleTimeString()} <span className="mx-2">•</span> VERIFIED PROTOCOL ACTIVE</p>
               </div>
               <div className="flex gap-4 w-full sm:w-auto">
                  <button 
                    onClick={() => handleAction('Matrix Grid Reset')}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <FaUndo size={10} /> RESET GRID
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none py-3 px-10 text-[9px] font-black text-white bg-clinicPrimary uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 transition-all rounded-xl flex items-center justify-center gap-2"
                  >
                    {isSaving ? 'SYNCING...' : <><FaSave size={10} /> SAVE MATRIX</>}
                  </button>
               </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissions;
