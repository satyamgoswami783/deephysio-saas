import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import CalendarHeader from '../components/appointments/CalendarHeader';
import CalendarGrid from '../components/appointments/CalendarGrid';
import RightSidebar from '../components/appointments/RightSidebar';
import Toast from '../components/ui/Toast';
import { fetchApi } from '../config/api';

/** Body for PUT /appointments/:id — used for saves and for status correction when PATCH /status rejects transitions */
const buildPutPayloadFromMappedAppt = (a, statusOverride) => {
  const appointmentDateIso = a.date
    ? new Date(`${a.date}T${a.startTime || '00:00'}:00`).toISOString()
    : undefined;
  const startTimeIso =
    a.date && a.startTime ? new Date(`${a.date}T${a.startTime}:00`).toISOString() : undefined;
  const endTimeIso =
    a.date && (a.endTime || a.startTime)
      ? new Date(`${a.date}T${(a.endTime || a.startTime)}:00`).toISOString()
      : undefined;
  return {
    appointmentDate: appointmentDateIso,
    therapistId: a.therapistId || undefined,
    serviceId: a.serviceId || undefined,
    room: a.room || undefined,
    notes: a.notes ?? '',
    startTime: startTimeIso,
    endTime: endTimeIso,
    status: statusOverride !== undefined ? statusOverride : a.status
  };
};

const isStatusTransitionError = (message) =>
  /invalid status transition|status transition/i.test(String(message || ''));

/* ──────────────────────────────────────────────────────────────────────── */
const Appointments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Read role and user from localStorage
  const userRole = sessionStorage.getItem('deephysio_role');


  const isTherapist = userRole === 'therapist';
  const isReceptionist = userRole === 'receptionist';
  
  const storedUser = sessionStorage.getItem('deephysio_user');
  let loggedInUser = null;
  try {
    loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    loggedInUser = null;
  }
  
  /* Calendar state */
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week');
  const [selectedPractitioner, setSelectedPract] = useState(
    isTherapist && loggedInUser?.id ? loggedInUser.id : 'all'
  );
  const [statusFilter, setStatusFilter] = useState('all');

  /* Appointment data */
  const [appointments, setAppointments] = useState([]);
  const [practitioners, setPractitioners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /* Customization state */
  const [slotHeight, setSlotHeight] = useState(100);
  const [sidebarWidth, setSidebarWidth] = useState(450);

  /* ── Helpers: normalize time to 24h HH:mm ── */
  const normalize24h = (t) => {
    if (!t) return '';
    // Already in 24h format (no AM/PM)
    if (!t.includes('AM') && !t.includes('PM')) {
      const [hStr, mStr] = t.split(':');
      return `${hStr.padStart(2, '0')}:${(mStr || '00').padStart(2, '0')}`;
    }
    // Convert from 12h AM/PM
    const [time, ampm] = t.split(' ');
    let [h, m] = time.split(':').map(Number);
    if (ampm?.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (ampm?.toUpperCase() === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
  };
  const addMins24h = (t24, mins) => {
    if (!t24) return '';
    const [h, m] = t24.split(':').map(Number);
    const total = h * 60 + m + mins;
    const eH = Math.floor(total / 60) % 24;
    const eM = total % 60;
    return `${eH.toString().padStart(2, '0')}:${eM.toString().padStart(2, '0')}`;
  };

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchApi('/appointments');
      if (!response) return;
      const resData = await response.json();

      if (resData.success) {
        const mapped = resData.data.map(appt => {
          const dateObj = appt.appointmentDate ? new Date(appt.appointmentDate) : null;
          
          // Safety check: if date is invalid, return a default item or skip
          if (!dateObj || isNaN(dateObj.getTime())) {
            console.warn('Invalid appointment date found:', appt.id);
            return null;
          }

          const startDateTime = appt.startTime ? new Date(appt.startTime) : dateObj;
          const endDateTime = appt.endTime ? new Date(appt.endTime) : new Date(startDateTime.getTime() + 60 * 60 * 1000);

          const formatHMM = (d) => {
            if (!d || isNaN(d.getTime())) return '00:00';
            return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          };

          return {
            id: appt.id,
            patientId: appt.patientId || appt.patient?.id,
            patientName: `${appt.patient?.firstName || ''} ${appt.patient?.lastName || ''}`.trim() || 'Unknown Patient',
            date: dateObj.toISOString().split('T')[0],
            startTime: formatHMM(startDateTime),
            endTime: formatHMM(endDateTime),
            serviceId: appt.serviceId || appt.service?.id,
            type: appt.service?.name || 'Physio Session',
            practitioner: appt.therapist?.name || 'N/A',
            therapistId: appt.therapistId || appt.therapist?.id,
            status: appt.status === 'confirmed' ? 'scheduled' : (appt.status || 'scheduled'),
            notes: appt.notes || '',
            isEmergency: appt.patient?.patient_type === 'Emergency',
            room: appt.room
          };
        }).filter(Boolean);
        setAppointments(mapped);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchedRef = useRef(null);

  const loadPractitioners = useCallback(async () => {
    try {
      const response = await fetchApi('/appointments/practitioners');
      if (!response) return;
      const resData = await response.json();
      if (!resData.success) return;

      const allUsers = Array.isArray(resData.data) ? resData.data : [];
      const therapistUsers = allUsers
        .filter((u) => String(u.role || '').toLowerCase() === 'therapist')
        .map((u) => ({
          id: u.id,
          name: u.name || `Therapist ${u.id}`
        }));

      setPractitioners(therapistUsers);
    } catch (error) {
      console.error('Failed to load practitioners:', error);
      setPractitioners([]);
    }
  }, []);

  // Reload appointments from Backend
  useEffect(() => {
    if (fetchedRef.current === location.key) return;
    fetchedRef.current = location.key;
    
    loadAppointments();
  }, [loadAppointments, location.key]);

  useEffect(() => {
    loadPractitioners();
  }, [loadPractitioners]);

  useEffect(() => {
    const statusFromUrl = String(searchParams.get('status') || '').toLowerCase();
    const allowed = ['all', 'scheduled', 'checked_in', 'completed', 'no_show', 'cancelled'];
    if (allowed.includes(statusFromUrl)) {
      setStatusFilter(statusFromUrl);
    }
  }, [searchParams]);

  /* ── Auto No-Show: check every 60s for scheduled appointments 30+ min past ── */
  useEffect(() => {
    const autoNoShow = async () => {
      const now = new Date();
      for (const appt of appointments) {
        if (appt.status !== 'scheduled') continue;
        // Build full datetime from date + startTime
        const [h, m] = (appt.startTime || '00:00').split(':').map(Number);
        const apptTime = new Date(appt.date + 'T' + appt.startTime + ':00');
        const diffMs = now - apptTime;
        const diffMin = diffMs / 60000;
        if (diffMin >= 30) {
          try {
            await fetchApi(`/appointments/${appt.id}/status`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'no_show' })
            });
            setAppointments(prev =>
              prev.map(a => a.id === appt.id ? { ...a, status: 'no_show' } : a)
            );
            setToast({ message: `⏰ ${appt.patientName} auto-marked as DNA`, type: 'warning' });
          } catch (e) { /* silent */ }
        }
      }
    };
    const interval = setInterval(autoNoShow, 60000);
    return () => clearInterval(interval);
  }, [appointments]);

  /* Sidebar state */
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* Toast state */
  const [toast, setToast] = useState(null);

  /* ── Helpers ── */
  const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 – 21:00 (9 PM)

  const shiftDate = (delta) => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + delta);
    } else {
      const step = viewMode === 'week' ? 7 : 1;
      d.setDate(d.getDate() + delta * step);
    }
    setCurrentDate(d);
  };

  const toMinutesLocal = (timeStr = '') => {
    if (!timeStr) return 0;
    const normalized = normalize24h(timeStr);
    const [h, m] = normalized.split(':').map(Number);
    return (h * 60) + (m || 0);
  };

  const formatTimeStr = (h, m) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  /* ── Drag & Drop ── */
  const handleAppointmentDrop = useCallback((apptId, targetDateFmt, targetHour, targetMin = 0) => {
    setAppointments(prev => prev.map(a => {
      if (a.id.toString() === apptId.toString()) {
        const startMin = toMinutesLocal(a.startTime);
        const endMin = toMinutesLocal(a.endTime || a.startTime);
        const durationMins = endMin - startMin > 0 ? endMin - startMin : 60;

        const newStartH = targetHour;
        const newStartM = targetMin;
        const newStartTime = formatTimeStr(newStartH, newStartM);

        const endTotalMins = (newStartH * 60) + newStartM + durationMins;
        const newEndH = Math.floor(endTotalMins / 60);
        const newEndM = endTotalMins % 60;
        const newEndTime = formatTimeStr(newEndH, newEndM);

        return { ...a, date: targetDateFmt, startTime: newStartTime, endTime: newEndTime };
      }
      return a;
    }));
    setToast({ message: 'Appointment rescheduled successfully', type: 'success' });
  }, [formatTimeStr]);

  /* ── Sidebar ── */
  const openSidebar = useCallback((appt) => {
    setSelectedAppt(appt);
    setSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    setTimeout(() => setSelectedAppt(null), 400);
  }, []);

  const handleSave = useCallback(async (updatedAppt) => {
    try {
      const appointmentDateIso = updatedAppt.date
        ? new Date(`${updatedAppt.date}T${updatedAppt.startTime || '00:00'}:00`).toISOString()
        : undefined;
      const startTimeIso = (updatedAppt.date && updatedAppt.startTime)
        ? new Date(`${updatedAppt.date}T${updatedAppt.startTime}:00`).toISOString()
        : undefined;
      const endTimeIso = (updatedAppt.date && updatedAppt.endTime)
        ? new Date(`${updatedAppt.date}T${updatedAppt.endTime}:00`).toISOString()
        : undefined;

      const savePayload = {
        appointmentDate: appointmentDateIso,
        therapistId: updatedAppt.therapistId || undefined,
        serviceId: updatedAppt.serviceId || undefined,
        room: updatedAppt.room || undefined,
        notes: updatedAppt.notes,
        startTime: startTimeIso,
        endTime: endTimeIso,
        status: updatedAppt.status
      };

      const response = await fetchApi(`/appointments/${updatedAppt.id}`, {
        method: 'PUT',
        body: JSON.stringify(savePayload)
      });
      
      if (response) {
        const resData = await response.json();
        if (resData.success) {
          setAppointments(prev =>
            prev.map((a) =>
              a.id === updatedAppt.id
                ? {
                    ...a,
                    ...updatedAppt,
                    therapistId: updatedAppt.therapistId || a.therapistId,
                    serviceId: updatedAppt.serviceId || a.serviceId
                  }
                : a
            )
          );
          setSelectedAppt((prev) => (prev && prev.id === updatedAppt.id ? { ...prev, ...updatedAppt } : prev));
          setToast({ message: '✅ Appointment saved successfully', type: 'success' });
          closeSidebar();
        } else {
          setToast({ message: `❌ Error: ${resData.message}`, type: 'error' });
        }
      }
    } catch (error) {
      setToast({ message: '❌ Network error while saving', type: 'error' });
    }
  }, [closeSidebar]);

  const handleStatusUpdate = useCallback(
    async (apptId, status, successMessage = 'Status updated') => {
      const applyLocalSuccess = () => {
        setAppointments((prev) => prev.map((a) => (a.id === apptId ? { ...a, status } : a)));
        setSelectedAppt((prev) => (prev && prev.id === apptId ? { ...prev, status } : prev));
        setToast({
          message: successMessage,
          type: status === 'cancelled' ? 'warning' : 'success'
        });
      };

      try {
        const response = await fetchApi(`/appointments/${apptId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });

        if (!response) return false;
        let resData = await response.json();
        if (resData.success) {
          applyLocalSuccess();
          return true;
        }

        /* Terminal states (e.g. completed): API often blocks PATCH transitions — retry full PUT with corrected status */
        if (isStatusTransitionError(resData.message)) {
          const appt = appointments.find((a) => a.id === apptId);
          if (appt) {
            const putPayload = buildPutPayloadFromMappedAppt(appt, status);
            const putRes = await fetchApi(`/appointments/${apptId}`, {
              method: 'PUT',
              body: JSON.stringify(putPayload)
            });
            if (!putRes) return false;
            resData = await putRes.json();
            if (resData.success) {
              applyLocalSuccess();
              return true;
            }
          }
        }

        setToast({ message: `❌ ${resData.message || 'Failed to update status'}`, type: 'error' });
        return false;
      } catch (e) {
        setToast({ message: '❌ Error updating status', type: 'error' });
        return false;
      }
    },
    [appointments]
  );

  /* ── Role-based Action Handlers ── */
  const handleMarkArrived = useCallback(async (apptId) => {
    // STATE GUARD: scheduled/no_show -> checked_in (late-arrival recovery)
    const appt = appointments.find(a => a.id === apptId);
    if (appt && !['scheduled', 'no_show'].includes(appt.status)) {
      setToast({ message: `⚠️ Cannot check-in from "${appt.status}"`, type: 'error' });
      return;
    }
    try {
      const response = await fetchApi(`/appointments/${apptId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'checked_in' })
      });
      if (response) {
        const resData = await response.json();
        if (resData.success) {
          setAppointments(prev =>
            prev.map(a => a.id === apptId ? { ...a, status: 'checked_in' } : a)
          );
          setToast({ message: '📍 Patient checked in', type: 'success' });
        } else {
          setToast({ message: `❌ ${resData.message}`, type: 'error' });
        }
      }
    } catch (e) {
      setToast({ message: '❌ Error updating status', type: 'error' });
    }
  }, [appointments]);

  const handleMarkCompleted = useCallback(async (apptId) => {
    // STATE GUARD: only checked_in → completed
    const appt = appointments.find(a => a.id === apptId);
    if (appt && appt.status !== 'checked_in') {
      setToast({ message: `⚠️ Cannot complete: patient must be checked in first (current: "${appt.status}")`, type: 'error' });
      return;
    }
    try {
      const response = await fetchApi(`/appointments/${apptId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' })
      });
      if (response) {
        const resData = await response.json();
        if (resData.success) {
          setAppointments(prev =>
            prev.map(a => a.id === apptId ? { ...a, status: 'completed' } : a)
          );
          setToast({ message: '✅ Appointment completed', type: 'success' });
        } else {
          setToast({ message: `❌ ${resData.message}`, type: 'error' });
        }
      }
    } catch (e) {
      setToast({ message: '❌ Error updating status', type: 'error' });
    }
  }, [appointments]);

  const handleAddClinicalNote = useCallback((appt) => {
    navigate(`/notes/new?patientId=${appt.patientId}&appointmentId=${appt.id}`);
  }, [navigate]);

  const handleViewPatient = useCallback((appt) => {
    navigate(`/patients/profile/${appt.patientId}`);
  }, [navigate]);

  const handleSlotClick = useCallback((date, hour, min) => {
    const formattedDate = date.toISOString().split('T')[0];
    const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
    navigate(`/appointments/book?date=${formattedDate}&time=${timeStr}`);
  }, [navigate]);

  const exportAppointmentsCsv = useCallback(async (type = 'all') => {
    setToast({ message: '🔄 Preparing export data...', type: 'info' });
    
    let startDate = null;
    let endDate = null;

    if (type === 'week') {
      const dow = currentDate.getDay();
      const diff = currentDate.getDate() - dow + (dow === 0 ? -6 : 1);
      const start = new Date(currentDate);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      startDate = start.toLocaleDateString('en-CA'); // YYYY-MM-DD
      endDate = end.toLocaleDateString('en-CA');
    } else if (type === 'month') {
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      startDate = start.toLocaleDateString('en-CA');
      endDate = end.toLocaleDateString('en-CA');
    }

    const params = new URLSearchParams();
    if (startDate && endDate && type !== 'all') {
      params.append('startDate', startDate);
      params.append('endDate', endDate);
    }
    if (selectedPractitioner !== 'all') {
      params.append('therapistId', selectedPractitioner);
    }

    try {
      const query = `/appointments?${params.toString()}`;
      const response = await fetchApi(query);
      if (!response) return;
      const resData = await response.json();

      if (!resData.success || !resData.data.length) {
        setToast({ message: 'No records found for the selected range/filters', type: 'warning' });
        return;
      }

      // Filter by status if not "all"
      let exportData = resData.data;
      if (statusFilter !== 'all') {
        exportData = exportData.filter(a => a.status === statusFilter);
      } else {
        // Default behavior: hide cancelled
        exportData = exportData.filter(a => a.status !== 'cancelled');
      }

      if (!exportData.length) {
        setToast({ message: 'No records match your status filter', type: 'warning' });
        return;
      }

      const escapeCsv = (value) => {
        const text = value === null || value === undefined ? '' : String(value);
        if (text.includes('"') || text.includes(',') || text.includes('\n')) {
          return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      };

      const rows = exportData.map((appt) => {
        const dateObj = appt.appointmentDate ? new Date(appt.appointmentDate) : null;
        const dateStr = dateObj ? ` ${dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}` : 'N/A';
        const startT = appt.startTime ? new Date(appt.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
        const endT = appt.endTime ? new Date(appt.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';

        return [
          appt.id,
          dateStr,
          startT,
          endT,
          appt.patient?.id || '',
          `${appt.patient?.firstName || appt.patient?.first_name || ''} ${appt.patient?.lastName || appt.patient?.last_name || ''}`.trim(),
          appt.service?.name || '',
          appt.therapist?.name || '',
          appt.status || '',
          appt.notes || '',
          appt.patient?.patient_type === 'Emergency' ? 'Yes' : 'No'
        ];
      });

      const header = [
        'Appointment ID',
        'Date',
        'Start Time',
        'End Time',
        'Patient ID',
        'Patient Name',
        'Service',
        'Practitioner',
        'Status',
        'Notes',
        'Emergency'
      ];

      const csvContent = [header, ...rows]
        .map((row) => row.map(escapeCsv).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.body.appendChild(document.createElement('a'));
      link.href = url;
      link.download = `appointments-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToast({ message: `Successfully exported ${exportData.length} records`, type: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      setToast({ message: 'Failed to generate export file', type: 'error' });
    }
  }, [appointments, currentDate, selectedPractitioner, statusFilter]);

  /* ── Filtered appointments (default "All" hides cancelled appointments) ── */
  const filtered = appointments.filter((a) => {
    const practitionerAllowed = isTherapist
      ? (loggedInUser?.id ? a.therapistId === loggedInUser.id : true)
      : selectedPractitioner === 'all' || Number(a.therapistId) === Number(selectedPractitioner);
    const statusAllowed = statusFilter === 'all' ? a.status !== 'cancelled' : a.status === statusFilter;
    return practitionerAllowed && statusAllowed;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg flex flex-col overflow-hidden p-4 pb-12 sm:pb-4 sm:p-5 h-full min-h-[850px] sm:min-h-0">

      {/* Header */}
      <CalendarHeader
        view={viewMode}
        setView={setViewMode}
        currentDate={currentDate}
        onPrev={() => shiftDate(-1)}
        onNext={() => shiftDate(1)}
        onToday={() => setCurrentDate(new Date())}
        practitioners={practitioners}
        selectedPractitioner={selectedPractitioner}
        setSelectedPractitioner={setSelectedPract}
        onNewBooking={() => navigate('/appointments/book')}
        userRole={userRole}
        slotHeight={slotHeight}
        setSlotHeight={setSlotHeight}
        onExportAppointments={exportAppointmentsCsv}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Calendar body — fills remaining height */}
      <div className="flex-1 min-h-0 mt-4 relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-clinicPrimary/20 border-t-clinicPrimary rounded-full animate-spin"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">Syncing Scheduler...</p>
            </div>
          </div>
        )}
        <CalendarGrid
          view={viewMode}
          currentDate={currentDate}
          appointments={filtered}
          onSlotClick={handleSlotClick}
          onAppointmentClick={openSidebar}
          onAppointmentDrop={handleAppointmentDrop}
          practitioners={practitioners}
          selectedPractitioner={selectedPractitioner}
          hours={HOURS}
          slotHeight={slotHeight}
          userRole={userRole}
          onMarkCompleted={handleMarkCompleted}
          onMarkArrived={handleMarkArrived}
          onAddNote={(!isTherapist && !isReceptionist) || isTherapist ? handleAddClinicalNote : null}
          onViewPatient={handleViewPatient}
        />
      </div>

      {/* Right Sidebar (slide-in detail panel) */}
      <RightSidebar
        isOpen={sidebarOpen}
        appointment={selectedAppt}
        onClose={closeSidebar}
        onSave={handleSave}
        onUpdateStatus={handleStatusUpdate}
        userRole={userRole}
        width={sidebarWidth}
        setWidth={setSidebarWidth}
      />

      {/* Toast notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
};

export default Appointments;
