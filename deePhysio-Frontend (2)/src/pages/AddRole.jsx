import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaChevronLeft, FaShieldAlt, FaKey, FaLayerGroup, FaNetworkWired, FaSave, FaUndo, FaLock } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const AddRole = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        template: 'Clinical Partition Only',
        securityLevel: 'Level 2'
    });

    const handleCommit = () => {
        console.log('Initializing New Role:', formData);
        alert(`Institutional Protocol: New authority hierarchy "${formData.name}" has been successfully initialized and recorded in the institutional grid.`);
        navigate('/settings/roles');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 px-4 py-12 animate-fade-in custom-scrollbar">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div className="space-y-4 text-left">
                    <button 
                        onClick={() => navigate('/settings/roles')}
                        className="group flex items-center gap-3 text-slate-400 hover:text-clinicPrimary transition-all font-black text-[10px] uppercase tracking-[0.3em]"
                    >
                        <FaChevronLeft className="group-hover:-translate-x-1 transition-transform" /> 
                        Access Matrix
                    </button>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        Initialize <span className="text-clinicPrimary">Hierarchy</span>
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] opacity-80">
                        Define a new authority node for institutional calibration.
                    </p>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl shadow-premium border border-slate-50">
                    <div className="w-3 h-3 rounded-full bg-clinicPrimary animate-pulse"></div>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Role Initialization Active</span>
                </div>
            </div>

            {/* Main Form Card */}
            <Card className="rounded-[40px] shadow-premium border-none bg-white overflow-hidden group">
                <div className="p-10 md:p-16 space-y-12">
                    
                    {/* Role Configuration */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-soft">
                                <FaLayerGroup size={18} />
                            </div>
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em]">Hierarchy Parameters</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Hierarchy Alias (Role Name)</label>
                                <div className="relative group/input text-left">
                                    <FaShieldAlt className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-clinicPrimary transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Senior Tech Analyst"
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-[13px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary shadow-inner-soft transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Access Partition Template</label>
                                <div className="relative group/input text-left">
                                    <FaKey className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-clinicPrimary transition-colors" />
                                    <select 
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-[13px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary shadow-inner-soft transition-all cursor-pointer appearance-none"
                                        value={formData.template}
                                        onChange={(e) => setFormData({...formData, template: e.target.value})}
                                    >
                                        <option>Clinical Partition Only</option>
                                        <option>Financial & Billing Node</option>
                                        <option>Operational & Frontend</option>
                                        <option>Unrestricted Institutional Access</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left block">Security Calibration Level</label>
                                <div className="relative group/input text-left">
                                    <FaLock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-clinicPrimary transition-colors" />
                                    <select 
                                        className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[24px] text-[13px] font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary shadow-inner-soft transition-all cursor-pointer appearance-none"
                                        value={formData.securityLevel}
                                        onChange={(e) => setFormData({...formData, securityLevel: e.target.value})}
                                    >
                                        <option>Level 1 (Basic)</option>
                                        <option>Level 2 (Standard)</option>
                                        <option>Level 3 (Restricted)</option>
                                        <option>Level 4 (Elevated)</option>
                                        <option>Level 5 (Institutional Root)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center pt-8">
                                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 w-full flex items-center gap-4">
                                   <FaNetworkWired className="text-amber-500 scale-125" />
                                   <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-relaxed text-left">
                                      Warning: New hierarchy nodes require manual personnel assignment from the Administrative Core.
                                   </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="bg-slate-50/50 p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-blue-500 shadow-soft">
                            <FaUndo size={18} />
                        </div>
                        <div className="text-left">
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none mb-1">Process Logged</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Institutional sync is pending</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                        <Button 
                            variant="secondary" 
                            className="flex-1 md:px-12 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest border-none shadow-premium hover:bg-slate-100 transition-all font-sans"
                            onClick={() => navigate('/settings/roles')}
                        >
                            Terminate Protocol
                        </Button>
                        <Button 
                            variant="accent" 
                            className="flex-1 md:px-12 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-google active:scale-95 transition-all font-sans"
                            onClick={handleCommit}
                            leftIcon={<FaSave />}
                        >
                            Authorize Role
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AddRole;
