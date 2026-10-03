import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaUserCircle, FaReceipt, FaCreditCard, FaCalendarAlt } from 'react-icons/fa';
import ClinicalNoteIcon from '../components/ui/ClinicalNoteIcon';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';

import { fetchApi } from '../config/api';
import { useEffect } from 'react';
import { getActiveCurrencySymbol } from '../utils/currency';

const RecordPaymentPage = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [patients, setPatients] = useState([]);
    const [newPayment, setNewPayment] = useState({
        patient_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        method: 'Visa •• 4242',
        status: 'Paid',
        description: 'General Clinic Service'
    });

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await fetchApi('/patients');
                if (!response) return;
                const resData = await response.json();
                if (resData.success) {
                    setPatients(resData.data);
                }
            } catch (error) {
                showToast('Failed to load clinical subjects.', 'error');
            }
        };
        fetchPatients();
    }, [showToast]);

    const handleCommit = async () => {
        if (!newPayment.patient_id || !newPayment.amount) {
            showToast('Please fill in all required clinical fields (Patient, Amount).', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                patient_id: parseInt(newPayment.patient_id, 10),
                amount: parseFloat(newPayment.amount),
                date: newPayment.date,
                method: newPayment.method,
                status: newPayment.status,
                description: newPayment.description
            };

            const response = await fetchApi('/payments', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (!response) return;

            const resData = await response.json();

            if (resData.success) {
                showToast('Payment Node Logged in Database.', 'success');
                navigate('/billing/payments');
            } else {
                showToast(resData.message || 'Failed to log payment', 'error');
            }
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-10 animate-fade-in font-sans custom-scrollbar">
            <div className="flex items-center gap-6">
                <button onClick={() => navigate('/billing/payments')} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-clinicPrimary hover:shadow-google transition-all active:scale-90 shadow-sm">
                    <FaArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Initialize Transaction</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1.5">PCI-DSS Secure Ledger Protocol</p>
                </div>
            </div>

            <Card className="bg-white rounded-[40px] shadow-premium border border-slate-50 overflow-hidden">
                <div className="p-10 space-y-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <FaUserCircle className="text-clinicPrimary" /> Patient Subject <span className="text-rose-500">*</span>
                        </label>
                        <select
                            className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer appearance-none shadow-inner-soft"
                            value={newPayment.patient_id}
                            onChange={e => setNewPayment({ ...newPayment, patient_id: e.target.value })}
                        >
                            <option value="">Select verified patient subject...</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.firstName || p.first_name} {p.lastName || p.last_name} (ID: {p.id})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FaReceipt className="text-clinicPrimary" /> Valuation Amount ({getActiveCurrencySymbol()}) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 shadow-inner-soft"
                                value={newPayment.amount}
                                onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FaCreditCard className="text-clinicPrimary" /> Verified Method
                            </label>
                            <select
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer appearance-none shadow-inner-soft"
                                value={newPayment.method}
                                onChange={e => setNewPayment({ ...newPayment, method: e.target.value })}
                            >
                                <option value="Visa •• 4242">Visa Credit (•• 4242)</option>
                                <option value="Mastercard •• 8888">Mastercard Debit (•• 8888)</option>
                                <option value="Direct Deposit">BACS Direct Deposit</option>
                                <option value="Cash">Physical Currency (Cash)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FaCalendarAlt className="text-clinicPrimary" /> Deployment Date
                            </label>
                            <input
                                type="date"
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer shadow-inner-soft"
                                value={newPayment.date}
                                onChange={e => setNewPayment({ ...newPayment, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <FaCheckCircle className="text-clinicPrimary" /> Initial Status
                            </label>
                            <select
                                className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer appearance-none shadow-inner-soft"
                                value={newPayment.status}
                                onChange={e => setNewPayment({ ...newPayment, status: e.target.value })}
                            >
                                <option value="Paid">Processed (Paid)</option>
                                <option value="Pending">Pending Validation</option>
                                <option value="Failed">Declined / Failed</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 border-t border-slate-100 pt-8">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <ClinicalNoteIcon className="text-clinicPrimary" size={24} /> Clinical Description
                        </label>
                        <textarea
                            rows="3"
                            placeholder="Attach clinical reasoning or service breakdown..."
                            className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[32px] text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-300 resize-none shadow-inner-soft"
                            value={newPayment.description}
                            onChange={e => setNewPayment({ ...newPayment, description: e.target.value })}
                        ></textarea>
                    </div>
                </div>

                <div className="px-10 py-8 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encrypted Session</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Button
                            variant="secondary"
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-premium hover:bg-white"
                            onClick={() => navigate('/billing/payments')}
                        >
                            Abort
                        </Button>
                        <Button
                            variant="accent"
                            className="flex-1 md:px-10 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-google active:scale-95 transition-all"
                            onClick={handleCommit}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Committing...' : 'Commit Ledger Entry'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default RecordPaymentPage;
