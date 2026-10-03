import React, { useState, useEffect, useCallback } from 'react';
import { FaTasks, FaPlus, FaCheckCircle, FaRegCircle, FaClock, FaSpinner } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import { fetchApi } from '../../../config/api';

const TasksTab = () => {
  const { id } = useParams();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetchApi(`/tasks?patientId=${id}`);
      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          setTasks(data.data);
          setError(null);
        }
      } else {
        const errJson = res ? await res.json().catch(() => ({})) : {};
        const msg = String(errJson?.message || '');
        if (msg.toLowerCase().includes('forbidden') || msg.toLowerCase().includes('access denied')) {
          setError('You do not have access to patient tasks');
        } else {
          setError('Failed to load tasks');
        }
      }
    } catch (err) {
      console.error('Fetch Tasks Error:', err);
      setError('Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetchApi('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          patientId: id,
          title: taskTitle.trim()
        })
      });

      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          setTaskTitle('');
          // Re-fetch tasks to show the new one
          await fetchTasks();
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.message || 'Failed to create task');
      }
    } catch (err) {
      console.error('Create Task Error:', err);
      alert('Error connecting to the server while creating task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'pending' ? 'done' : 'pending';
    
    try {
      const res = await fetchApi(`/tasks/${task.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (res && res.ok) {
        // Optimistic update or re-fetch
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      } else {
        alert('Failed to update task status');
      }
    } catch (err) {
      console.error('Toggle Task Error:', err);
      alert('Error updating task status');
    }
  };

  if (isLoading && tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-clinicPrimary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading tasks...</p>
      </div>
    );
  }

  if (error && tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-rose-500 mb-4 text-3xl">⚠️</div>
        <h4 className="text-[16px] font-bold text-slate-700">{error}</h4>
        <button 
          onClick={() => fetchTasks()} 
          className="mt-4 px-4 py-2 bg-clinicPrimary text-white rounded-lg text-[12px] font-bold shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Premium Create Task Input Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <form onSubmit={handleCreateTask} className="p-4 sm:p-6">
          <div className="relative group">
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="What needs to be done for this patient?"
              disabled={isSubmitting}
              className="w-full pl-4 pr-[120px] py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-[15px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-clinicPrimary/5 focus:border-clinicPrimary/40 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!taskTitle.trim() || isSubmitting}
              className={`absolute right-2 top-2 bottom-2 px-5 rounded-xl flex items-center gap-2 transition-all ${
                !taskTitle.trim() || isSubmitting
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-clinicPrimary text-white shadow-lg shadow-clinicPrimary/20 hover:bg-clinicPrimary/90 hover:-translate-y-0.5 active:translate-y-0 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <FaSpinner className="animate-spin" size={14} />
              ) : (
                <FaPlus size={14} />
              )}
              <span className="text-[13px] font-bold whitespace-nowrap">
                {isSubmitting ? 'Saving...' : 'Add Task'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Tasks List Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
            Active Tasks <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[10px] text-slate-600">{tasks.length}</span>
          </h3>
        </div>

        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors group flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div 
                    className={`mt-1 shrink-0 cursor-pointer transition-transform active:scale-90 ${task.status === 'done' ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-400'}`}
                    onClick={() => handleToggleTask(task)}
                  >
                    {task.status === 'done' ? <FaCheckCircle size={20} /> : <FaRegCircle size={20} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-[14px] sm:text-[15px] font-bold truncate transition-all ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {task.title}
                    </h4>
                    {(task.description || task.due_date) && (
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                        {task.description && (
                          <p className={`text-[12px] transition-colors ${task.status === 'done' ? 'text-slate-300' : 'text-slate-500'} line-clamp-2`}>{task.description}</p>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <FaClock size={10} />
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border transition-colors ${
                    task.status === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {task.status === 'done' ? 'Completed' : task.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-clinicPrimary/10 border border-clinicPrimary/20 flex items-center justify-center text-clinicPrimary/60 mb-4">
                <FaTasks size={24} />
              </div>
              <h4 className="text-[14px] font-bold text-slate-700">No tasks found</h4>
              <p className="text-[12px] text-slate-400 max-w-[250px] mx-auto mt-1 leading-relaxed">
                This patient currently has no active tasks or follow-ups assigned.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksTab;
