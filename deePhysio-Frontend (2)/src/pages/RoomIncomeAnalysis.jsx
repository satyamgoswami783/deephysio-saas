import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../config/api';
import * as XLSX from 'xlsx';
import {
  FaArrowLeft, FaFileExcel, FaBed, FaCalendarAlt, FaMoneyBillWave
} from 'react-icons/fa';
import { formatCurrency } from '../utils/currency';

const RoomIncomeAnalysis = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date filters defaulting to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = `/analytics/room-income?startDate=${startDate}&endDate=${endDate}`;
      const res = await fetchApi(url);
      if (res?.ok) {
        const payload = await res.json();
        if (payload.success) {
          setData(payload.data || []);
        }
      }
    } catch (e) {
      console.error('Room income fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fmtCurrency = (val) => formatCurrency(val);

  const handleExportExcel = () => {
    if (data.length === 0) return;
    const exportData = data.map(item => ({
      'Room': item.room,
      'Total Bookings': item.totalBookings,
      'Total Revenue': fmtCurrency(item.totalRevenue),
      'Paid Amount': fmtCurrency(item.paidAmount),
      'Pending Amount': fmtCurrency(item.pendingAmount)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Room Income');
    
    XLSX.writeFile(workbook, `Room_Income_Analysis_${startDate}_to_${endDate}.xlsx`);
  };

  const totals = data.reduce((acc, curr) => {
    acc.bookings += curr.totalBookings;
    acc.revenue += curr.totalRevenue;
    acc.paid += curr.paidAmount;
    acc.pending += curr.pendingAmount;
    return acc;
  }, { bookings: 0, revenue: 0, paid: 0, pending: 0 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5 animate-fade-in custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 w-full">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/analytics')}
            className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-all duration-200 shadow-sm"
          >
            <FaArrowLeft size={12} />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-slate-800 tracking-tight uppercase leading-none">Room Income Analysis</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Financial performance by clinic rooms
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input 
               type="date" 
               value={startDate} 
               onChange={(e) => setStartDate(e.target.value)}
               className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:border-clinicPrimary"
            />
            <span className="text-slate-400 font-bold text-sm">to</span>
            <input 
               type="date" 
               value={endDate} 
               onChange={(e) => setEndDate(e.target.value)}
               className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-700 outline-none focus:border-clinicPrimary"
            />
          </div>
          <button
            onClick={handleExportExcel}
            disabled={loading || data.length === 0}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <FaFileExcel size={14} /> Export to Excel
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Room Identity
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                  Total Bookings
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Gross Revenue
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Paid Amount
                </th>
                <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Pending Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-14 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-clinicPrimary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-sm">
                          <FaBed size={14} />
                        </div>
                        <span className="text-sm font-bold text-slate-800">{item.room}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm font-extrabold text-slate-700">{item.totalBookings}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-extrabold text-slate-800">{fmtCurrency(item.totalRevenue)}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-extrabold text-emerald-600">{fmtCurrency(item.paidAmount)}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-sm font-extrabold ${item.pendingAmount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {fmtCurrency(item.pendingAmount)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-5 py-14 text-center">
                     <div className="flex flex-col items-center gap-2">
                      <div className="w-11 h-11 rounded-full bg-slate-50 flex items-center justify-center">
                        <FaMoneyBillWave size={16} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">No room income data found for this period</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {!loading && data.length > 0 && (
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td className="px-5 py-4 font-black text-slate-700 text-[11px] uppercase tracking-wider">
                    Total Overview
                  </td>
                  <td className="px-5 py-4 text-center font-black text-slate-800 text-sm">
                    {totals.bookings}
                  </td>
                  <td className="px-5 py-4 text-right font-black text-slate-800 text-base">
                    {fmtCurrency(totals.revenue)}
                  </td>
                  <td className="px-5 py-4 text-right font-black text-emerald-600 text-base">
                    {fmtCurrency(totals.paid)}
                  </td>
                  <td className="px-5 py-4 text-right font-black text-rose-500 text-base">
                    {fmtCurrency(totals.pending)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default RoomIncomeAnalysis;
