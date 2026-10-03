import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../../config/api';
import { FaCalendarAlt, FaUserInjured, FaPlus, FaClock, FaArrowRight } from 'react-icons/fa';
import PageHeader from '../../components/ui/PageHeader';

const StatCard = ({ title, value, icon, color, trend, onClick }) => (
  <div 
    onClick={onClick}
    className="p-3.5 sm:p-4 bg-white border border-slate-200/90 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md hover:border-clinicPrimary/40 transition-all duration-300 cursor-pointer group"
  >
    <div className="flex items-center justify-between w-full mb-2.5">
      <div className={`w-8 h-8 flex items-center justify-center rounded-xl bg-opacity-10 ${color} group-hover:scale-110 transition-transform duration-300`}>
        <span className={`text-sm ${color.replace('bg-', 'text-')}`}>{icon}</span>
      </div>
      {trend && (
        <div className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-100">
          {trend}
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-0.5">{title}</p>
      <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">{value}</h3>
    </div>
  </div>
);

const formatAppointmentTime = (appt) => {
  if (!appt) return '--:--';
  const timeVal = appt.startTime || appt.start_time;
  if (!timeVal) return '--:--';
  if (typeof timeVal === 'string' && timeVal.includes('T')) {
    const d = new Date(timeVal);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  if (typeof timeVal === 'string' && timeVal.includes(':')) {
    return timeVal.slice(0, 5);
  }
  return String(timeVal);
};

const TherapistDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    patients: 0
  });
  const [todayList, setTodayList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const storedUser = sessionStorage.getItem('deephysio_user');
        let loggedInUser = null;
        try {
          loggedInUser = storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
          loggedInUser = null;
        }

        const [apptRes, patRes] = await Promise.all([
          fetchApi('/appointments'),
          fetchApi('/patients')
        ]);

        const allAppointments = apptRes?.ok ? (await apptRes.json()).data || [] : [];
        const patients = patRes?.ok ? (await patRes.json()).data || [] : [];

        // Filter appointments for therapist
        const therapistAppts = allAppointments.filter(a => {
          if (!loggedInUser?.id) return true;
          const tId = a.therapistId || a.therapist_id || a.therapist?.id;
          return !tId || Number(tId) === Number(loggedInUser.id);
        });

        const todayStr = new Date().toISOString().split('T')[0];
        const todayAppts = therapistAppts.filter(a => {
          const aDate = a.appointmentDate || a.appointment_date || a.date;
          if (!aDate) return false;
          return String(aDate).split('T')[0] === todayStr;
        });

        // Filter patients for therapist
        const therapistPatients = patients.filter(p => {
          if (!loggedInUser?.id) return true;
          const tId = p.therapistId || p.therapist_id;
          return !tId || Number(tId) === Number(loggedInUser.id);
        });

        setStats({
          totalAppointments: therapistAppts.length,
          todayAppointments: todayAppts.length,
          patients: therapistPatients.length > 0 ? therapistPatients.length : patients.length
        });
        setTodayList(todayAppts);
      } catch (e) {
        console.error("Error fetching therapist dashboard stats:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-5 animate-fade-in custom-scrollbar p-1 sm:p-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader
          title="My Dashboard"
          subtitle="Welcome back 👋 Here is your clinical summary."
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/appointments/book')}
            className="px-3.5 py-2 bg-clinicPrimary text-white rounded-xl text-xs font-bold shadow-md shadow-clinicPrimary/20 hover:bg-clinicPrimaryDark hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FaPlus size={10} /> Book Appointment
          </button>
          <button
            onClick={() => navigate('/patients/add')}
            className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FaPlus size={10} /> Add Patient
          </button>
        </div>
      </div>

      {/* COMPACT STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 max-w-4xl">
        <StatCard 
          title="Total Appointments" 
          value={loading ? "..." : stats.totalAppointments} 
          icon={<FaCalendarAlt />} 
          color="bg-clinicPrimary" 
          trend={`${stats.todayAppointments} Today`} 
          onClick={() => navigate('/appointments')}
        />
        <StatCard 
          title="Total Patients" 
          value={loading ? "..." : stats.patients} 
          icon={<FaUserInjured />} 
          color="bg-emerald-500" 
          trend="Active Records" 
          onClick={() => navigate('/patients')}
        />
      </div>
      
      {/* Today's Schedule Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FaClock className="text-slate-400" size={12} />
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Today's Schedule</h3>
          </div>
          <button
            onClick={() => navigate('/appointments')}
            className="text-[11px] font-bold text-clinicPrimary hover:underline flex items-center gap-1"
          >
            View Calendar <FaArrowRight size={9} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center text-slate-400 text-xs font-medium">
            Loading schedule...
          </div>
        ) : todayList.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
              <FaCalendarAlt size={15} />
            </div>
            <p className="text-xs font-bold text-slate-600 mb-0.5">No appointments scheduled for today</p>
            <p className="text-[11px] text-slate-400 mb-3">You can book new sessions or view upcoming appointments in the calendar.</p>
            <button
              onClick={() => navigate('/appointments/book')}
              className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
            >
              + Book New Appointment
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todayList.map((appt) => {
              const patientName = `${appt.patient?.firstName || ''} ${appt.patient?.lastName || ''}`.trim() || 'Patient';
              const service = appt.service?.name || 'Consultation';
              const timeDisplay = formatAppointmentTime(appt);

              return (
                <div key={appt.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="min-w-[62px] px-2.5 py-1.5 rounded-lg bg-clinicPrimary/10 text-clinicPrimary flex items-center justify-center font-bold text-xs">
                      {timeDisplay}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800">{patientName}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">{service} • {appt.room || 'Room 1'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                      {appt.status || 'Scheduled'}
                    </span>
                    <button
                      onClick={() => navigate('/appointments')}
                      className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-clinicPrimary hover:text-white rounded-lg text-xs font-bold transition-all"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TherapistDashboard;
