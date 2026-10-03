import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { MODULES, ROLE_DEFAULTS } from '../config/modules';

import { fetchApi } from '../config/api';

const AddUser = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'therapist',
        status: 'Active',
        allowed_menus: ROLE_DEFAULTS.therapist
    });

    const handleSave = async () => {
        if (!formData.name || !formData.email || !formData.password) {
            showToast('Please fill all required fields (Name, Email, Password).', 'error');
            return;
        }
        
        setIsSaving(true);
        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role.toLowerCase(),
                allowed_menus: formData.allowed_menus
            };

            const response = await fetchApi('/users', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (!response) return; // intercepted

            const resData = await response.json();

            if (resData.success) {
                showToast('User created successfully in database.', 'success');
                navigate('/settings/users');
            } else {
                showToast(resData.message || 'Failed to create user', 'error');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 px-4 py-8 animate-fade-in font-sans">
            <div className="flex items-center gap-4 mb-6">
               <button 
                 onClick={() => navigate('/settings/users')}
                 className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:text-slate-800 hover:shadow-sm transition-all"
               >
                 <FaArrowLeft size={12} />
               </button>
               <div>
                 <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Add New User</h1>
                 <p className="text-sm font-medium text-slate-500 mt-1">Create a new staff profile and set role access.</p>
               </div>
            </div>

            <Card className="p-8 border-none shadow-sm bg-white border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                        <input 
                            type="email" 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            placeholder="Min 6 characters"
                        />
                    </div>
                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Role</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all cursor-pointer"
                            value={formData.role}
                            onChange={(e) => {
                                const newRole = e.target.value;
                                setFormData({
                                    ...formData, 
                                    role: newRole,
                                    allowed_menus: ROLE_DEFAULTS[newRole] || []
                                });
                            }}
                        >
                            <option value="admin">Admin</option>
                            <option value="therapist">Therapist</option>
                            <option value="receptionist">Receptionist</option>
                            <option value="billing">Billing Staff</option>
                        </select>
                    </div>
                    <div className="space-y-1.5 col-span-2 md:col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Status</label>
                        <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/20 transition-all cursor-pointer"
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>

                    <div className="space-y-3 col-span-2 pt-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Menu Access Permissions</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            {MODULES.map(menu => (
                                <label key={menu} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl cursor-pointer transition-all group border border-transparent hover:border-slate-100 hover:shadow-sm">
                                    <input 
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-clinicPrimary focus:ring-clinicPrimary/20"
                                        checked={formData.allowed_menus?.includes(menu)}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setFormData(prev => {
                                                const currentMenus = prev.allowed_menus || [];
                                                const newMenus = checked 
                                                    ? [...currentMenus, menu]
                                                    : currentMenus.filter(m => m !== menu);
                                                return { ...prev, allowed_menus: newMenus };
                                            });
                                        }}
                                    />
                                    <span className={`text-[11px] font-bold ${formData.allowed_menus?.includes(menu) ? 'text-slate-900' : 'text-slate-400'} group-hover:text-clinicPrimary transition-colors`}>{menu}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium italic ml-1">Assign custom sidebar access for this staff member.</p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex gap-3 justify-end">
                    <Button variant="secondary" className="px-8 rounded-xl" onClick={() => navigate('/settings/users')} disabled={isSaving}>Cancel</Button>
                    <Button variant="primary" className="px-10 rounded-xl" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Registering...' : 'Save User'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
export default AddUser;
