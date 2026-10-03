import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchApi } from '../../../config/api';
import {
  FaSortAmountDown, FaSortAmountUp, FaChevronDown,
  FaFileAlt, FaWpforms, FaCreditCard, FaSpinner, FaHistory, FaDownload
} from 'react-icons/fa';
import ClinicalNoteIcon from '../../ui/ClinicalNoteIcon';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const TYPE_CONFIG = {
  note: {
    icon: <ClinicalNoteIcon size={20} />,
    bg: 'bg-pink-50',
    border: 'border-pink-100',
    text: 'text-pink-600',
    badge: 'bg-pink-50 text-pink-600 border-pink-100',
    accent: 'border-l-pink-400'
  },
  form: {
    icon: <FaWpforms size={16} />,
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    text: 'text-blue-600',
    badge: 'bg-blue-50 text-blue-600 border-blue-100',
    accent: 'border-l-blue-400'
  },
  payment: {
    icon: <FaCreditCard size={16} />,
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    text: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    accent: 'border-l-emerald-400'
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ClinicalHistoryTab = () => {
  const { id } = useParams();
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDownloadHistory = async () => {
    if (timeline.length === 0) return;
    setIsDownloading(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 15;
      let y = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(46, 167, 184); // clinicPrimary color
      pdf.text('Clinical History Report', margin, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Patient ID: ${id} | Generated on: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}`, margin, y);
      y += 15;

      // Entries
      timeline.forEach((entry, index) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }

        // Title & Type
        pdf.setFontSize(12);
        pdf.setTextColor(30);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${entry.title} (${entry.type.toUpperCase()})`, margin, y);
        y += 6;

        // Date
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(150);
        pdf.text(`${formatDate(entry.date)} • ${formatTime(entry.date)}`, margin, y);
        y += 6;

        // Description
        pdf.setFontSize(10);
        pdf.setTextColor(80);
        const splitDescription = pdf.splitTextToSize(entry.description || 'No description provided.', 180);
        pdf.text(splitDescription, margin, y);
        y += (splitDescription.length * 5) + 8;

        // Separator line
        pdf.setDrawColor(240);
        pdf.line(margin, y - 4, 195, y - 4);
      });

      pdf.save(`Clinical_History_PID${id}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const fetchHistory = useCallback(async (order) => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchApi(`/clinical-history/${id}?sort=${order}`);
      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          setTimeline(data.data);
        } else {
          setError(data.message || 'Failed to load clinical history');
        }
      } else {
        const errJson = res ? await res.json().catch(() => ({})) : {};
        setError(errJson?.message || 'Failed to load clinical history');
      }
    } catch (err) {
      console.error('Clinical History Error:', err);
      setError('Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHistory(sortOrder);
  }, [fetchHistory, sortOrder]);

  const handleSortChange = (order) => {
    setSortOrder(order);
    setIsDropdownOpen(false);
  };

  // Loading state
  if (isLoading && timeline.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-clinicPrimary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading clinical history...</p>
      </div>
    );
  }

  // Error state
  if (error && timeline.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-rose-500 mb-4 text-3xl">⚠️</div>
        <h4 className="text-[16px] font-bold text-slate-700">{error}</h4>
        <button
          onClick={() => fetchHistory(sortOrder)}
          className="mt-4 px-4 py-2 bg-clinicPrimary text-white rounded-lg text-[12px] font-bold shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <h3 className="text-[15px] sm:text-[17px] font-bold text-slate-800 flex items-center gap-2">
            <FaHistory className="text-indigo-500" size={16} /> Clinical History
            <span className="px-2 py-0.5 bg-slate-200 rounded text-[10px] font-black text-slate-600 ml-1">
              {timeline.length}
            </span>
          </h3>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadHistory}
              disabled={isDownloading || timeline.length === 0}
              className={`flex items-center gap-2 h-9 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                isDownloading || timeline.length === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-clinicPrimary text-white hover:bg-clinicPrimary/90'
              }`}
            >
              {isDownloading ? (
                <FaSpinner size={12} className="animate-spin" />
              ) : (
                <FaDownload size={12} />
              )}
              {isDownloading ? 'Processing...' : 'Download History'}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 h-9 px-3 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                {sortOrder === 'desc' ? (
                  <FaSortAmountDown size={12} className="text-slate-400" />
                ) : (
                  <FaSortAmountUp size={12} className="text-slate-400" />
                )}
                {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                <FaChevronDown size={9} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-40 overflow-hidden animate-fade-in">
                  <button
                    onClick={() => handleSortChange('desc')}
                    className={`w-full px-3.5 py-2.5 text-left text-[12px] font-bold flex items-center gap-2 transition-colors ${
                      sortOrder === 'desc'
                        ? 'bg-clinicPrimary/5 text-clinicPrimary'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FaSortAmountDown size={11} /> Newest First
                  </button>
                  <button
                    onClick={() => handleSortChange('asc')}
                    className={`w-full px-3.5 py-2.5 text-left text-[12px] font-bold flex items-center gap-2 transition-colors ${
                      sortOrder === 'asc'
                        ? 'bg-clinicPrimary/5 text-clinicPrimary'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FaSortAmountUp size={11} /> Oldest First
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

        {/* Timeline */}
        <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
          {timeline.length > 0 ? (
            timeline.map((entry, index) => {
              const config = TYPE_CONFIG[entry.type] || TYPE_CONFIG.note;
              return (
                <div
                  key={`${entry.type}-${entry.id}-${index}`}
                  className={`px-4 sm:px-5 py-4 hover:bg-slate-50/50 transition-colors group border-l-4 ${config.accent}`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl ${config.bg} ${config.border} border ${config.text} flex items-center justify-center shrink-0 mt-0.5`}>
                      {config.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-[13px] sm:text-[14px] font-bold text-slate-800">
                            {entry.title}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${config.badge}`}>
                            {entry.type}
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap shrink-0">
                          {formatDate(entry.date)} • {formatTime(entry.date)}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-[12px] sm:text-[13px] font-medium text-slate-600 leading-relaxed line-clamp-2 break-words">
                        {entry.description}
                      </p>

                      {/* Metadata chips */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {entry.type === 'note' && entry.metadata?.noteType && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold border border-slate-200">
                            {entry.metadata.noteType}
                          </span>
                        )}
                        {entry.type === 'note' && entry.metadata?.author && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold border border-slate-200">
                            By: {entry.metadata.author}
                          </span>
                        )}
                        {entry.type === 'note' && entry.metadata?.status && (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                            entry.metadata.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {entry.metadata.status}
                          </span>
                        )}
                        {entry.type === 'form' && entry.metadata?.category && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-500 rounded text-[9px] font-bold border border-blue-100">
                            {entry.metadata.category}
                          </span>
                        )}
                        {entry.type === 'payment' && entry.metadata?.amount != null && (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-black border border-emerald-100">
                            ₹{entry.metadata.amount.toFixed(2)}
                          </span>
                        )}
                        {entry.type === 'payment' && entry.metadata?.method && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold border border-slate-200">
                            {entry.metadata.method}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400 mb-4">
                <FaHistory size={24} />
              </div>
              <h4 className="text-[14px] font-bold text-slate-700">No Clinical History</h4>
              <p className="text-[12px] text-slate-400 max-w-[300px] mx-auto mt-1 leading-relaxed">
                This patient has no recorded clinical notes, form submissions, or payments yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicalHistoryTab;
