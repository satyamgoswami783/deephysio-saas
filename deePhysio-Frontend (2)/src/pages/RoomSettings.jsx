import React, { useEffect, useState, useRef } from 'react';
import { FaDoorOpen, FaPlus, FaTrash, FaSave, FaArrowLeft, FaCheck, FaSyncAlt } from 'react-icons/fa';
import { fetchApi } from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

const DEFAULT_ROOMS = ['Room 1 (Consult)', 'Room 2 (Rehab)', 'Room 3 (Assessment)', 'Studio A', 'Main Gym'];

const RoomSettings = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const inputRef = useRef(null);

  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [newRoom, setNewRoom] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [inputError, setInputError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchApi('/settings?keys=bookingRooms');
        if (!res || !res.ok) return;
        const data = await res.json();
        if (!data.success) return;
        const value = data?.data?.bookingRooms;
        if (Array.isArray(value) && value.length) setRooms(value);
      } catch (e) {
        // keep defaults on read failure
      }
    };
    load();
  }, []);

  const addRoom = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newRoom.trim();

    if (!trimmed) {
      setInputError(true);
      if (inputRef.current) inputRef.current.focus();
      showToast('Please type a room name to add.', 'error');
      return;
    }

    setInputError(false);

    // Case-insensitive duplicate check
    if (rooms.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Room "${trimmed}" already exists.`, 'error');
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    const updated = [...rooms, trimmed];
    setRooms(updated);
    setNewRoom('');

    // Auto-save immediately to backend so changes are never lost
    try {
      await fetchApi('/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: { bookingRooms: updated } })
      });
      showToast(`"${trimmed}" added successfully!`, 'success');
    } catch (_) {
      showToast(`Added "${trimmed}". Please click "Update Settings" to save.`, 'info');
    }
  };

  const removeRoom = async (roomToDelete) => {
    const updated = rooms.filter((r) => r !== roomToDelete);
    setRooms(updated);

    try {
      await fetchApi('/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: { bookingRooms: updated } })
      });
      showToast(`"${roomToDelete}" removed.`, 'success');
    } catch (_) {
      showToast(`"${roomToDelete}" removed. Click "Update Settings" to save.`, 'info');
    }
  };

  const saveRooms = async () => {
    setIsSaving(true);
    try {
      const res = await fetchApi('/settings', {
        method: 'POST',
        body: JSON.stringify({ settings: { bookingRooms: rooms } })
      });
      if (res && res.ok) {
        showToast('Room settings saved successfully!', 'success');
      } else {
        showToast('Failed to save room settings.', 'error');
      }
    } catch (e) {
      showToast('Error saving room settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-slate-500 hover:text-clinicPrimary hover:border-clinicPrimary/40 transition-all cursor-pointer shadow-2xs"
            title="Back to Settings"
          >
            <FaArrowLeft size={13} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Room Settings</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage clinical rooms and consultation spaces shown during appointment booking.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={saveRooms}
          disabled={isSaving}
          className="px-5 py-2.5 bg-clinicPrimary hover:bg-clinicPrimary-dark text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs hover:shadow transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isSaving ? (
            <>
              <FaSyncAlt size={11} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <FaSave size={12} />
              <span>Update Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
        {/* Add Room Form */}
        <form onSubmit={addRoom} className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700">Add New Room or Space</label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              ref={inputRef}
              type="text"
              value={newRoom}
              onChange={(e) => {
                setNewRoom(e.target.value);
                if (inputError) setInputError(false);
              }}
              placeholder="e.g. Room 4 (Electrotherapy), Studio B..."
              className={`flex-1 h-11 px-3.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 ${
                inputError 
                  ? 'border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/30' 
                  : 'border-slate-200 focus:border-clinicPrimary focus:ring-2 focus:ring-clinicPrimary/15 focus:bg-white'
              }`}
            />
            <button
              type="submit"
              className="h-11 px-5 bg-slate-900 hover:bg-clinicPrimary text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <FaPlus size={11} />
              <span>Add Room</span>
            </button>
          </div>
          {inputError && (
            <p className="text-[11px] text-rose-500 font-semibold mt-1">
              Please enter a name for the room before clicking Add Room.
            </p>
          )}
        </form>

        {/* Existing Rooms List */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-600 block">
            Configured Rooms ({rooms.length})
          </span>

          {rooms.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FaDoorOpen size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-500">No rooms configured yet.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Use the input above to add your clinic consultation rooms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {rooms.map((room) => (
                <div
                  key={room}
                  className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-clinicPrimary shrink-0 shadow-2xs">
                      <FaDoorOpen size={11} />
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate">{room}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRoom(room)}
                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title={`Delete ${room}`}
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomSettings;
