import React, { useState, useEffect, useCallback } from 'react';
import { FaLayerGroup, FaPlus, FaCalendarAlt, FaCheckCircle, FaInfoCircle, FaHourglassHalf } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { fetchApi } from '../../../config/api';
import { useToast } from '../../../context/ToastContext';
import Button from '../../ui/Button';

const EpisodesTab = () => {
  const { id: patientId } = useParams();
  const { showToast } = useToast();
  const [episodes, setEpisodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const fetchEpisodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchApi(`/episodes?patientId=${patientId}`);
      const data = await response.json();
      if (data.success) {
        setEpisodes(data.data);
      }
    } catch (error) {
      showToast('failed to fetch episodes', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [patientId, showToast]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  const handleCreateEpisode = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetchApi('/episodes', {
        method: 'POST',
        body: JSON.stringify({
          patientId: parseInt(patientId),
          title: newTitle,
          description: newDescription
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Treatment episode started successfully', 'success');
        setNewTitle('');
        setNewDescription('');
        fetchEpisodes();
      } else {
        showToast(data.message || 'Failed to create episode', 'error');
      }
    } catch (error) {
      showToast('Error creating episode', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndEpisode = async (episodeId) => {
    try {
      const response = await fetchApi(`/episodes/${episodeId}`, {
        method: 'PUT',
        body: JSON.stringify({
          endDate: new Date().toISOString()
        })
      });
      const data = await response.json();
      if (data.success) {
        showToast('Treatment episode completed', 'success');
        fetchEpisodes();
      }
    } catch (error) {
      showToast('Error completing episode', 'error');
    }
  };

  const activeEpisode = episodes.find(e => !e.endDate);
  const completedEpisodes = episodes.filter(e => e.endDate);

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-clinicPrimary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-500 font-bold text-[12px] uppercase">Loading episodes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ─── ACTIVE EPISODE SECTION ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[16px] lg:text-[18px] font-bold text-slate-800 flex items-center gap-2">
            <FaHourglassHalf className="text-clinicPrimary" size={14} /> Active Treatment Phase
          </h3>
          {activeEpisode && (
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
              In Progress
            </span>
          )}
        </div>

        {activeEpisode ? (
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h4 className="text-[20px] font-black text-slate-900 tracking-tight">{activeEpisode.title}</h4>
                {activeEpisode.description && (
                  <p className="text-[13px] text-slate-500 font-medium leading-relaxed max-w-2xl">{activeEpisode.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <FaCalendarAlt size={12} className="text-clinicPrimary/60" />
                    Started: {new Date(activeEpisode.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
              <Button 
                variant="accent" 
                onClick={() => handleEndEpisode(activeEpisode.id)}
                className="whitespace-nowrap h-12 px-8 uppercase tracking-widest text-[11px] font-black"
                leftIcon={<FaCheckCircle />}
              >
                Complete Episode
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-50/30">
            <div className="max-w-xl mx-auto text-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
                <FaLayerGroup size={24} />
              </div>
              <h4 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">Start New Care Episode</h4>
              <p className="text-[12px] text-slate-500 font-medium mt-1">Group sessions and progress tracking into a defined treatment phase.</p>
            </div>

            <form onSubmit={handleCreateEpisode} className="max-w-2xl mx-auto space-y-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Episode Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Post-Op ACL Rehab, Chronic Back Pain Phase 1"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clinical Description (Optional)</label>
                <textarea 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Primary goals, frequency of treatment, etc..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] font-bold text-slate-700 h-24 focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary outline-none transition-all resize-none"
                />
              </div>
              <Button 
                type="submit" 
                variant="accent" 
                disabled={isSubmitting || !newTitle.trim()}
                className="w-full h-12 uppercase tracking-widest text-[11px] font-black"
                leftIcon={<FaPlus size={10} />}
              >
                {isSubmitting ? 'Starting Phase...' : 'Start Treatment Episode'}
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* ─── EPISODE HISTORY SECTION ─── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-[14px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <FaCheckCircle className="text-slate-400" size={14} /> Episode History
          </h3>
        </div>
        
        {completedEpisodes.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {completedEpisodes.map((episode) => (
              <div key={episode.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[15px] font-bold text-slate-800">{episode.title}</h4>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded border border-slate-200">
                        Completed
                      </span>
                    </div>
                    {episode.description && (
                      <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2">{episode.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(episode.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} 
                        &nbsp;—&nbsp;
                        {new Date(episode.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-3 border border-slate-100">
              <FaLayerGroup size={16} />
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No completed episodes</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
        <FaInfoCircle className="text-blue-500 mt-0.5 shrink-0" size={14} />
        <p className="text-[11px] font-medium text-blue-700 leading-relaxed">
          Episodes provide a high-level grouping for clinical tracking. Only one episode can be active at a time to maintain focus on the current treatment phase.
        </p>
      </div>

    </div>
  );
};

export default EpisodesTab;
