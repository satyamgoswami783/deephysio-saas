import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCloudUploadAlt, FaHistory, FaCheckCircle, FaDownload, 
  FaSyncAlt, FaDatabase, FaTrashAlt, FaFileCode, FaShieldAlt, 
  FaInfoCircle, FaClock, FaEye, FaLock, FaExclamationTriangle,
  FaFileAlt, FaCheck, FaTimes, FaSearch, FaFilter, FaBuilding,
  FaFileArchive, FaEnvelope, FaPaperPlane, FaUserShield, FaServer
} from 'react-icons/fa';
import API_BASE_URL, { fetchApi } from '../config/api';
import { useToast } from '../context/ToastContext';

const DataBackup = () => {
  const navigate = useNavigate();
  const [backups, setBackups] = useState([]);
  const [liveStats, setLiveStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState('ALL'); // ALL | DATABASE | FILES | SQL
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [backupDetails, setBackupDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [restoreImmediately, setRestoreImmediately] = useState(true);
  const [targetTenantId, setTargetTenantId] = useState('');

  // Backup Form config
  const [backupConfig, setBackupConfig] = useState({
    type: 'JSON', // JSON (Full/Company) | SQL | UPLOADS
    scope: 'FULL', // FULL | COMPANY
    tenantId: '',
    compress: true
  });

  // Automatic 7-Day Admin Email Backup Schedule State
  const [scheduleData, setScheduleData] = useState({
    enabled: true,
    frequency: 'EVERY_7_DAYS',
    cronExpression: '0 2 * * 0',
    executionTime: '02:00',
    dayOfWeek: 0,
    backupType: 'DATABASE',
    recipientEmails: [],
    lastRunAt: null,
    lastStatus: 'PENDING',
    lastMessage: 'Automated 7-day backup schedule initialized.',
    nextRunAt: null,
    isSchedulerRunning: true
  });
  const [recipientEmailsInput, setRecipientEmailsInput] = useState('');
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [runningScheduleNow, setRunningScheduleNow] = useState(false);

  // Current Logged-in User & Clinic Context
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('deephysio_user') || localStorage.getItem('deephysio_user') || '{}');
    } catch (e) {
      return {};
    }
  }, []);
  const isSuperAdmin = currentUser?.role?.toLowerCase() === 'superadmin';
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';
  const clinicName = currentUser?.tenant?.clinic_name || currentUser?.clinicName || 'My Clinic';

  // Admin Email Backup Dispatcher State
  const defaultAdminEmail = useMemo(() => {
    if (currentUser?.email && ['admin', 'superadmin'].includes(currentUser.role?.toLowerCase())) {
      return currentUser.email;
    }
    return '';
  }, [currentUser]);

  const [adminEmail, setAdminEmail] = useState(defaultAdminEmail);
  const [emailBackupType, setEmailBackupType] = useState('DATABASE'); // 'DATABASE' | 'UPLOADS' | 'SQL'
  const [emailSelectedFile, setEmailSelectedFile] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  // Live SMTP config info
  const [smtpInfo, setSmtpInfo] = useState({ loaded: false, isConfigured: false, host: '', provider: '' });

  // Email on backup creation in modal
  const [emailOnCreate, setEmailOnCreate] = useState(false);
  const [onCreateEmail, setOnCreateEmail] = useState(defaultAdminEmail);

  // Email row modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [modalTargetBackup, setModalTargetBackup] = useState(null);
  const [modalAdminEmail, setModalAdminEmail] = useState(defaultAdminEmail);
  const [modalSendingEmail, setModalSendingEmail] = useState(false);

  useEffect(() => {
    if (defaultAdminEmail) {
      if (!adminEmail) setAdminEmail(defaultAdminEmail);
      if (!modalAdminEmail) setModalAdminEmail(defaultAdminEmail);
      if (!onCreateEmail) setOnCreateEmail(defaultAdminEmail);
    }
  }, [defaultAdminEmail]);

  const toastCtx = useToast();
  const showToast = (msg, type = 'success') => {
    if (toastCtx?.showToast) toastCtx.showToast(msg, type);
  };

  const fetchSmtpInfo = async () => {
    try {
      const res = await fetchApi('/email-settings');
      const data = await res.json();
      if (data?.success && data?.data) {
        const d = data.data;
        const isConfigured = Boolean(d.isSmtpActive !== false && d.hasSavedPassword && d.smtpHost);
        setSmtpInfo({
          loaded: true,
          isConfigured,
          host: d.smtpHost || '',
          provider: d.provider || 'gmail',
          fromEmail: d.fromEmail || d.smtpUser
        });
      } else {
        setSmtpInfo({ loaded: true, isConfigured: false });
      }
    } catch (_) {
      setSmtpInfo({ loaded: true, isConfigured: false });
    }
  };

  const fetchLiveStats = async () => {
    try {
      const res = await fetchApi('/backup/live-stats');
      const data = await res.json();
      if (data?.success) {
        setLiveStats(data.data);
      }
    } catch (err) {
      console.error('Failed to load live stats:', err);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await fetchApi('/saas/tenants');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setTenants(data.data);
      }
    } catch (err) {
      console.error('Failed to load tenants:', err);
    }
  };

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/backup');
      const data = await res.json();
      if (data?.success) {
        setBackups(data.data || []);
      }
      fetchLiveStats();
    } catch (err) {
      console.error('Failed to load backups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      setLoadingSchedule(true);
      const res = await fetchApi('/backup/schedule');
      const data = await res.json();
      if (data?.success && data?.data) {
        setScheduleData(data.data);
        if (Array.isArray(data.data.recipientEmails)) {
          setRecipientEmailsInput(data.data.recipientEmails.join(', '));
        }
      }
    } catch (err) {
      console.error('Failed to load schedule config:', err);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleSaveSchedule = async (e) => {
    if (e) e.preventDefault();
    setSavingSchedule(true);
    try {
      const emailsArr = recipientEmailsInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s && s.includes('@'));

      const payload = {
        enabled: scheduleData.enabled,
        frequency: scheduleData.frequency,
        executionTime: scheduleData.executionTime,
        dayOfWeek: scheduleData.dayOfWeek,
        recipientEmails: emailsArr
      };

      const res = await fetchApi('/backup/schedule', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data?.success) {
        showToast(data.message || 'Auto-backup schedule updated successfully!', 'success');
        if (data.data) {
          setScheduleData(data.data);
        }
        setShowScheduleModal(false);
      } else {
        showToast(data?.message || 'Failed to update schedule.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save schedule.', 'error');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleRunScheduleNow = async () => {
    setRunningScheduleNow(true);
    try {
      showToast('Executing automated backup and sending to Admin email...', 'info');
      const res = await fetchApi('/backup/schedule/run-now', { method: 'POST' });
      const data = await res.json();
      if (data?.success) {
        showToast(data.message || 'Automated backup executed and emailed to Admin!', 'success');
        fetchSchedule();
        fetchBackups();
      } else {
        showToast(data?.message || 'Execution failed.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to run scheduled backup.', 'error');
    } finally {
      setRunningScheduleNow(false);
    }
  };

  useEffect(() => {
    fetchBackups();
    fetchLiveStats();
    fetchTenants();
    fetchSchedule();
    fetchSmtpInfo();
  }, []);

  const handleTriggerBackup = async () => {
    setTriggering(true);
    try {
      const effectiveTenant = !isSuperAdmin ? currentUser?.tenant_id : (backupConfig.scope === 'COMPANY' ? backupConfig.tenantId : null);
      const payload = {
        type: backupConfig.type,
        tenantId: effectiveTenant,
        compress: backupConfig.compress,
        emailTo: emailOnCreate && onCreateEmail ? onCreateEmail.trim() : null
      };

      const res = await fetchApi('/backup/trigger', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data?.success) {
        if (data.emailDispatch) {
          if (data.emailDispatch.success) {
            showToast(data.message || `Backup created and emailed to ${onCreateEmail}!`, 'success');
          } else if (data.emailDispatch.requiresSmtp) {
            showToast('Backup generated locally. Live email delivery requires SMTP setup (Settings > Email SMTP).', 'info');
          } else {
            showToast(`Backup created, but email delivery failed: ${data.emailDispatch.message || 'Error'}`, 'warning');
          }
        } else {
          showToast(data?.message || 'Backup created successfully!', 'success');
        }
        setShowCreateModal(false);
        fetchBackups();
      } else {
        showToast(data?.message || 'Failed to create backup.', 'error');
      }
    } catch (err) {
      showToast('Failed to generate backup snapshot.', 'error');
    } finally {
      setTriggering(false);
    }
  };

  const handleUploadBackup = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select a backup file (.json.gz, .json, .zip, .sql) to upload.', 'error');
      return;
    }

    if (restoreImmediately) {
      const confirmed = window.confirm(
        'Warning: Data restore will overwrite current database records. Proceed?'
      );
      if (!confirmed) return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('backupFile', uploadFile);
      formData.append('restoreImmediately', restoreImmediately);
      const effectiveUploadTenant = !isSuperAdmin ? currentUser?.tenant_id : targetTenantId;
      if (effectiveUploadTenant) {
        formData.append('targetTenantId', effectiveUploadTenant);
      }

      const res = await fetchApi('/backup/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data?.success) {
        showToast(data.message || (data.restored ? 'Backup uploaded and database restored successfully!' : 'Backup archive uploaded!'), 'success');
        setShowUploadModal(false);
        setUploadFile(null);
        fetchBackups();
      } else {
        showToast(data?.message || 'Upload failed.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSendBackupToEmail = async (overrideParams = null) => {
    const targetEmail = overrideParams?.email !== undefined ? overrideParams.email.trim() : adminEmail.trim();
    const targetType = overrideParams?.backupType || emailBackupType;
    const targetFile = overrideParams?.fileName !== undefined ? overrideParams.fileName : emailSelectedFile;
    const isModal = Boolean(overrideParams?.isModal);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!targetEmail || !emailRegex.test(targetEmail)) {
      showToast('Please enter a valid destination email address.', 'error');
      setEmailStatus({
        type: 'error',
        message: 'Please enter a valid email address.'
      });
      return;
    }

    if (isModal) {
      setModalSendingEmail(true);
    } else {
      setSendingEmail(true);
    }
    setEmailStatus(null);

    try {
      const effectiveTenant = !isSuperAdmin ? currentUser?.tenant_id : undefined;
      const res = await fetchApi('/backup/send-email', {
        method: 'POST',
        body: JSON.stringify({
          email: targetEmail,
          backupType: targetType,
          fileName: targetFile || undefined,
          targetTenantId: effectiveTenant
        })
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        showToast(data.message || `Backup successfully dispatched to ${targetEmail}!`, 'success');
        setEmailStatus({
          type: 'success',
          delivered: true,
          message: data.message,
          recipient: data.recipient,
          admin: data.admin,
          backup: data.backup
        });
        if (isModal) {
          setShowEmailModal(false);
        }
      } else {
        const errMsg = data?.message || 'Failed to dispatch backup to the specified email.';
        const requiresSmtp = Boolean(data?.requiresSmtp || data?.emailResult?.requiresSmtp);
        showToast(errMsg, requiresSmtp ? 'info' : 'error');
        setEmailStatus({
          type: requiresSmtp ? 'warning' : 'error',
          requiresSmtp,
          message: errMsg,
          recipient: data?.recipient,
          backup: data?.backup
        });
      }
    } catch (err) {
      const errMsg = err.message || 'Failed to dispatch backup to the specified email.';
      showToast(errMsg, 'error');
      setEmailStatus({
        type: 'error',
        message: errMsg
      });
    } finally {
      if (isModal) {
        setModalSendingEmail(false);
      } else {
        setSendingEmail(false);
      }
    }
  };

  const handleOpenEmailModal = (backup) => {
    setModalTargetBackup(backup);
    setModalAdminEmail(adminEmail || defaultAdminEmail);
    setShowEmailModal(true);
  };

  const handleExportAuditCsv = () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    window.open(`${API_BASE_URL}/audit-logs/export?token=${token || ''}`, '_blank');
  };

  const handleDownload = async (fileName) => {
    try {
      showToast(`Downloading ${fileName}...`, 'info');
      const res = await fetchApi(`/backup/download/${fileName}`);
      if (!res || !res.ok) {
        throw new Error('Download failed from server');
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showToast('Download complete.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to download backup.', 'error');
    }
  };

  const handleViewDetails = async (backup) => {
    setSelectedBackup(backup);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    try {
      const res = await fetchApi(`/backup/details/${backup.fileName}`);
      const data = await res.json();
      if (data?.success) {
        setBackupDetails(data.data);
      } else {
        setBackupDetails(null);
      }
    } catch (err) {
      setBackupDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenRestore = (backup) => {
    setSelectedBackup(backup);
    setShowRestoreModal(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackup) return;
    setRestoring(true);
    try {
      const res = await fetchApi('/backup/restore', {
        method: 'POST',
        body: JSON.stringify({
          fileName: selectedBackup.fileName,
          targetTenantId: !isSuperAdmin ? currentUser?.tenant_id : (targetTenantId || null)
        })
      });
      const data = await res.json();
      if (data?.success) {
        showToast(data?.message || 'Database restored successfully!', 'success');
        setShowRestoreModal(false);
        fetchBackups();
      } else {
        showToast(data?.message || 'Restore failed.', 'error');
      }
    } catch (err) {
      showToast('Restore execution failed.', 'error');
    } finally {
      setRestoring(false);
    }
  };

  const handleDelete = async (fileName) => {
    if (!window.confirm(`Are you sure you want to permanently delete backup '${fileName}'?`)) {
      return;
    }
    try {
      const res = await fetchApi(`/backup/${fileName}`, { method: 'DELETE' });
      const data = await res.json();
      if (data?.success) {
        showToast('Backup file deleted successfully.', 'success');
        fetchBackups();
      } else {
        showToast(data?.message || 'Failed to delete backup.', 'error');
      }
    } catch (err) {
      showToast('Failed to delete backup.', 'error');
    }
  };

  // Filtered backups list
  const filteredBackups = useMemo(() => {
    return backups.filter(b => {
      const matchesSearch = 
        b.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.scope?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (formatFilter === 'DATABASE') {
        return b.type === 'JSON' || b.type === 'JSON.GZ';
      }
      if (formatFilter === 'FILES') {
        return b.type === 'UPLOADS_ZIP';
      }
      if (formatFilter === 'SQL') {
        return b.type === 'SQL';
      }
      return true;
    });
  }, [backups, searchQuery, formatFilter]);

  const lastBackupDate = useMemo(() => {
    if (!backups || backups.length === 0) return 'No backups yet';
    const latest = backups[0];
    return new Date(latest.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [backups]);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-5 animate-fade-in text-slate-800">
      {/* ── HEADER & PRIMARY ACTIONS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Database Connected
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              • AES-256 Encrypted Vault
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isSuperAdmin ? 'Data Backup & Disaster Recovery' : `${clinicName} — Data Backup`}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {isSuperAdmin
              ? 'Dynamic, zero-hardcoding database snapshots (Full + Tenant-Scoped) and file uploads archiving.'
              : `Securely backup and restore all ${clinicName} records, patients, staff roles, appointments, billing, and clinical data.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Export Activity CSV */}
          <button
            type="button"
            onClick={handleExportAuditCsv}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            title="Download full activity log and audit trail as CSV spreadsheet"
          >
            <FaDownload size={12} />
            <span>Export Activity CSV</span>
          </button>

          {/* Upload Backup File Modal */}
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            title="Upload and restore a .json.gz or .json backup archive"
          >
            <FaCloudUploadAlt size={13} className="text-indigo-600" />
            <span>Upload Archive</span>
          </button>

          {/* Auto Schedule */}
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
          >
            <FaClock size={12} className="text-slate-400" />
            <span>Auto Schedule</span>
          </button>

          {/* Create Backup Button */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-clinicPrimary hover:bg-clinicPrimary-dark text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <FaDatabase size={13} />
            <span>Create Backup</span>
          </button>
        </div>
      </div>

      {/* ── 3 COMPACT SUMMARY METRICS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Backup Protection Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Protection Status
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-slate-900">System Protected</span>
              <FaCheckCircle className="text-emerald-500" size={14} />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Last backup: <span className="font-bold text-slate-700">{lastBackupDate}</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FaShieldAlt size={16} />
          </div>
        </div>

        {/* Card 2: Live Clinic Database */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Live Database
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-slate-900">
                {liveStats ? liveStats.totalClinicalRecords : '—'}
              </span>
              <span className="text-[11px] font-bold text-slate-400">Active Records</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
              {liveStats 
                ? `${liveStats.patientsCount} Patients • ${liveStats.invoicesCount} Invoices • ${liveStats.notesCount} Notes` 
                : 'Loading database records...'}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <FaDatabase size={15} />
          </div>
        </div>

        {/* Card 3: Auto 7-Day Email Backup */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Auto 7-Day Email Backup
              </span>
              <span className={`w-2 h-2 rounded-full ${scheduleData.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-slate-900">
                {scheduleData.enabled ? 'Every 7 Days' : 'Disabled'}
              </span>
              <span className="text-[11px] font-bold text-slate-400">at {scheduleData.executionTime || '02:00'}</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[210px]" title={scheduleData.nextRunAt ? formatDateTime(scheduleData.nextRunAt) : ''}>
              {scheduleData.enabled 
                ? `Next: ${scheduleData.nextRunAt ? formatDateTime(scheduleData.nextRunAt) : 'Sunday 02:00 AM'}` 
                : 'Automated weekly schedule paused'}
            </p>
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center shrink-0 transition-colors"
            title="Configure Automatic 7-Day Backup"
          >
            <FaClock size={15} />
          </button>
        </div>
      </div>

      {/* ── DIRECT ADMIN EMAIL BACKUP DISPATCH BOX ── */}
      <div className="bg-gradient-to-r from-sky-50/70 via-white to-indigo-50/70 rounded-3xl p-5 md:p-6 shadow-sm border border-indigo-100/90 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-clinicPrimary/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-clinicPrimary to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-clinicPrimary/20">
                <FaEnvelope size={17} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight text-slate-900">
                    {isSuperAdmin ? 'Direct Email Backup Dispatcher' : 'Send Clinic Backup to Email'}
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-clinicPrimary/10 text-clinicPrimary border border-clinicPrimary/20">
                    <FaUserShield size={10} />
                    {isSuperAdmin ? 'Superadmin Authorized' : `Clinic Admin • ${clinicName}`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isSuperAdmin
                    ? 'Enter your admin email or any alternate destination to dispatch live database dumps (.json.gz) or file archives (.zip) directly as an email attachment.'
                    : `Dispatches an instant complete backup snapshot of ${clinicName} (patients, staff, appointments, billing) directly to your admin email or another alternate email.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {smtpInfo.isConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[10px] font-bold text-emerald-700 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live SMTP Ready ({smtpInfo.host})
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/smtp-settings')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[10px] font-bold text-amber-800 shadow-2xs transition-colors cursor-pointer"
                  title="Configure your active Gmail App Password or Brevo Key"
                >
                  <FaExclamationTriangle size={10} className="text-amber-600" />
                  <span>Setup Live SMTP</span>
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200/80 text-[10px] font-bold text-slate-500 shadow-2xs hidden md:inline-flex">
                25MB Attachment Limit
              </span>
            </div>
          </div>

          {/* Input Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Admin or Any Recipient Email Field */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Recipient Email Address (Admin or Any Alternate Email) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FaEnvelope size={13} />
                </div>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => {
                    setAdminEmail(e.target.value);
                    if (emailStatus) setEmailStatus(null);
                  }}
                  placeholder="e.g. admin@deephysio.com or another.backup@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary shadow-2xs transition-all"
                />
              </div>
            </div>

            {/* Backup Type Selector */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Backup Payload
              </label>
              <select
                value={emailSelectedFile ? `FILE:${emailSelectedFile}` : emailBackupType}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('FILE:')) {
                    setEmailSelectedFile(val.replace('FILE:', ''));
                  } else {
                    setEmailSelectedFile('');
                    setEmailBackupType(val);
                  }
                  if (emailStatus) setEmailStatus(null);
                }}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary shadow-2xs transition-all cursor-pointer"
              >
                <option value="DATABASE">
                  🗄️ Full Database Snapshot (.json.gz) - Instant Dump
                </option>
                <option value="SQL">
                  📄 Raw MySQL SQL Dump (.sql)
                </option>
                <option value="UPLOADS">
                  📁 File Attachments Archive (.zip)
                </option>
                {backups.length > 0 && (
                  <optgroup label="── Existing Saved Snapshots ──">
                    {backups.slice(0, 10).map((b) => (
                      <option key={b.fileName} value={`FILE:${b.fileName}`}>
                        {b.title} ({b.sizeFormatted}) - {b.fileName}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-3">
              <button
                type="button"
                onClick={() => handleSendBackupToEmail()}
                disabled={sendingEmail || !adminEmail}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-clinicPrimary to-teal-600 hover:from-clinicPrimary-dark hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-clinicPrimary/20 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                {sendingEmail ? (
                  <>
                    <FaSyncAlt size={13} className="animate-spin" />
                    <span>Verifying & Sending...</span>
                  </>
                ) : (
                  <>
                    <FaPaperPlane size={13} />
                    <span>{isSuperAdmin ? 'Send Backup to Email' : 'Send Clinic Backup to Email'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Validation & Delivery Alert Banner */}
          {emailStatus && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-fade-in ${
                emailStatus.type === 'success'
                  ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
                  : emailStatus.type === 'warning'
                  ? 'bg-amber-50/95 border-amber-200 text-amber-900'
                  : 'bg-rose-50/95 border-rose-200 text-rose-800'
              }`}
            >
              {emailStatus.type === 'success' ? (
                <FaCheckCircle size={17} className="text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <FaExclamationTriangle size={17} className={emailStatus.type === 'warning' ? 'text-amber-500 shrink-0 mt-0.5' : 'text-rose-500 shrink-0 mt-0.5'} />
              )}
              <div className="space-y-1.5 flex-1">
                <p className="font-bold text-xs leading-relaxed">{emailStatus.message}</p>
                {emailStatus.requiresSmtp && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => navigate('/smtp-settings')}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <FaServer size={11} />
                      <span>Configure Email SMTP Credentials (Gmail / Brevo)</span>
                    </button>
                  </div>
                )}
                {emailStatus.recipient && (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 pt-0.5">
                    <span>
                      Destination Mailbox: <strong className="text-slate-800 font-bold">{emailStatus.recipient.email}</strong>
                    </span>
                    {emailStatus.backup && (
                      <span>
                        &bull; Attachment: <code className="font-mono text-slate-800 font-bold">{emailStatus.backup.fileName}</code> ({emailStatus.backup.sizeFormatted})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SNAPSHOTS TABLE CARD ── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-3.5 px-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">
                Saved Backups
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                {filteredBackups.length}
              </span>
            </div>

            {/* Format Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormatFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  formatFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({backups.length})
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter('DATABASE')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  formatFilter === 'DATABASE' ? 'bg-white text-clinicPrimary shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Database ({backups.filter(b => b.type === 'JSON' || b.type === 'JSON.GZ').length})
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter('FILES')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  formatFilter === 'FILES' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Files ({backups.filter(b => b.type === 'UPLOADS_ZIP').length})
              </button>
              <button
                type="button"
                onClick={() => setFormatFilter('SQL')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  formatFilter === 'SQL' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                SQL ({backups.filter(b => b.type === 'SQL').length})
              </button>
            </div>
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <FaSearch size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search backups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 w-48 focus:outline-none focus:ring-2 focus:ring-clinicPrimary focus:bg-white transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={fetchBackups}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold transition-all"
              title="Refresh backup list"
            >
              <FaSyncAlt size={12} className={loading ? 'animate-spin text-clinicPrimary' : ''} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Snapshot Name</th>
                <th className="px-5 py-3 whitespace-nowrap">Created Date</th>
                <th className="px-5 py-3">Scope & Content</th>
                <th className="px-4 py-3 text-center">Size</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && backups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FaSyncAlt size={18} className="animate-spin text-clinicPrimary" />
                      <span>Loading backups...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBackups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FaDatabase size={24} className="text-slate-300" />
                      <p className="font-semibold text-slate-600">No backups found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {searchQuery 
                          ? 'No backups match your search filter.' 
                          : 'Click "Create Backup" or "Upload Archive" to generate or upload a backup.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBackups.map(item => {
                  const isDb = item.type === 'JSON' || item.type === 'JSON.GZ';
                  const isSql = item.type === 'SQL';
                  const isFiles = item.type === 'UPLOADS_ZIP';
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Snapshot Name & Type Column */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isFiles ? 'bg-amber-50 text-amber-600' :
                            isSql ? 'bg-indigo-50 text-indigo-600' : 'bg-cyan-50 text-cyan-600'
                          }`}>
                            {isFiles ? <FaFileArchive size={13} /> :
                             isSql ? <FaDatabase size={12} /> : <FaFileCode size={13} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                                isFiles ? 'bg-amber-100 text-amber-800' :
                                isSql ? 'bg-indigo-100 text-indigo-800' : 'bg-cyan-100 text-cyan-800'
                              }`}>
                                {item.type}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px] block" title={item.fileName}>
                              {item.fileName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time Column */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 text-xs">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </td>

                      {/* Scope & Records Column */}
                      <td className="px-5 py-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-xs">{item.scope || 'Full Platform'}</span>
                          </div>
                          {item.records ? (
                            <span className="text-slate-500 text-[11px] block">
                              <strong className="text-slate-700">{item.records.patientsCount || 0}</strong> Patients • <strong className="text-slate-700">{item.records.appointmentsCount || 0}</strong> Appts • <strong className="text-slate-700">{item.records.invoicesCount || 0}</strong> Invoices
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] block">
                              {isFiles ? 'Uploads & File Attachments Folder' : 'Full MySQL Schema & All Tables'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Format & Size Column */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-slate-700">
                          {item.sizeFormatted}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Verified
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Download Button */}
                          <button
                            type="button"
                            onClick={() => handleDownload(item.fileName)}
                            title="Download backup archive"
                            className="p-1.5 hover:bg-clinicPrimary/10 text-clinicPrimary rounded-lg font-bold transition-all active:scale-95"
                          >
                            <FaDownload size={13} />
                          </button>

                          {/* Email Backup to Admin Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEmailModal(item)}
                            title="Send this backup to verified Admin email"
                            className="p-1.5 hover:bg-indigo-50 text-indigo-600 rounded-lg font-bold transition-all active:scale-95"
                          >
                            <FaEnvelope size={13} />
                          </button>

                          {/* Details Button */}
                          <button
                            type="button"
                            onClick={() => handleViewDetails(item)}
                            title="Inspect details and table breakdown"
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg font-bold transition-all active:scale-95"
                          >
                            <FaEye size={13} />
                          </button>

                          {/* Restore Button (Only for JSON/GZ) */}
                          {isDb && (
                            <button
                              type="button"
                              onClick={() => handleOpenRestore(item)}
                              title="Restore database from this snapshot"
                              className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg font-bold transition-all active:scale-95"
                            >
                              <FaHistory size={13} />
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.fileName)}
                            title="Delete this backup"
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg font-bold transition-all active:scale-95"
                          >
                            <FaTrashAlt size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE BACKUP MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-clinicPrimary/10 text-clinicPrimary flex items-center justify-center">
                  <FaDatabase size={17} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Create System Backup</h3>
                  <p className="text-xs text-slate-400">Generate a zero-hardcoding dynamic snapshot or file archive.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Backup Type Options */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-2 text-[11px]">
                  Select Backup Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div 
                    onClick={() => setBackupConfig({ ...backupConfig, type: 'JSON', compress: true })}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      backupConfig.type === 'JSON' 
                        ? 'bg-clinicPrimary/5 border-clinicPrimary text-clinicPrimary shadow-xs' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-xs">Database (.gz)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Dynamic Gzip snapshot</div>
                  </div>

                  <div 
                    onClick={() => setBackupConfig({ ...backupConfig, type: 'SQL', compress: false })}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      backupConfig.type === 'SQL' 
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-xs' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-xs">SQL Dump (.sql)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Raw MySQL Schema</div>
                  </div>

                  <div 
                    onClick={() => setBackupConfig({ ...backupConfig, type: 'UPLOADS', compress: false })}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                      backupConfig.type === 'UPLOADS' 
                        ? 'bg-amber-50 border-amber-600 text-amber-700 shadow-xs' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-black text-xs">Uploads (.zip)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Files & Documents</div>
                  </div>
                </div>
              </div>

              {/* Scope Selection (Full Platform vs Specific Clinic) */}
              {backupConfig.type !== 'UPLOADS' && (
                isSuperAdmin ? (
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      Backup Scope
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBackupConfig({ ...backupConfig, scope: 'FULL', tenantId: '' })}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          backupConfig.scope === 'FULL'
                            ? 'border-clinicPrimary bg-clinicPrimary/5 text-clinicPrimary'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Full Platform (All Tenants)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBackupConfig({ ...backupConfig, scope: 'COMPANY' })}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          backupConfig.scope === 'COMPANY'
                            ? 'border-clinicPrimary bg-clinicPrimary/5 text-clinicPrimary'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Company / Clinic Scoped
                      </button>
                    </div>

                    {backupConfig.scope === 'COMPANY' && (
                      <div className="pt-1">
                        <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                          Select Clinic / Company:
                        </label>
                        <select
                          value={backupConfig.tenantId}
                          onChange={(e) => setBackupConfig({ ...backupConfig, tenantId: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-clinicPrimary"
                        >
                          <option value="">-- Choose Clinic --</option>
                          {tenants.map(t => (
                            <option key={t.id} value={t.id}>
                              #{t.id} - {t.clinic_name || t.name} ({t.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-emerald-950">Clinic Scope: {clinicName}</div>
                      <div className="text-[11px] text-emerald-800 mt-0.5 font-medium">
                        Backs up all data for your clinic: patients, appointments, billing, clinical notes, staff roles, and settings.
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg uppercase shrink-0">
                      Clinic Admin
                    </span>
                  </div>
                )
              )}

              {/* Optional Email Dispatch Upon Creation */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={emailOnCreate}
                    onChange={(e) => setEmailOnCreate(e.target.checked)}
                    className="w-4 h-4 rounded text-clinicPrimary focus:ring-clinicPrimary"
                  />
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <FaEnvelope size={12} className="text-clinicPrimary" />
                    <span>Also dispatch this backup to Email upon generation</span>
                  </span>
                </label>
                {emailOnCreate && (
                  <div className="pt-1.5 pl-6 space-y-1">
                    <input
                      type="email"
                      value={onCreateEmail}
                      onChange={(e) => setOnCreateEmail(e.target.value)}
                      placeholder="e.g. admin@deephysio.com or another.backup@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-clinicPrimary/20 focus:border-clinicPrimary shadow-2xs"
                    />
                    <p className="text-[10px] text-slate-400 font-medium">
                      The generated snapshot archive will be attached and dispatched directly to this mailbox.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerBackup}
                disabled={triggering || (backupConfig.scope === 'COMPANY' && !backupConfig.tenantId)}
                className="px-5 py-2 bg-clinicPrimary hover:bg-clinicPrimary-dark text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {triggering ? (
                  <>
                    <FaSyncAlt size={12} className="animate-spin" />
                    <span>Generating Backup...</span>
                  </>
                ) : (
                  <>
                    <FaCheck size={12} />
                    <span>Generate Backup Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── UPLOAD BACKUP ARCHIVE MODAL ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FaCloudUploadAlt size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Upload & Restore Archive</h3>
                  <p className="text-xs text-slate-400">Upload any .json.gz, .json, .zip, or .sql archive.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadBackup} className="space-y-4 text-xs">
              {/* File Dropzone */}
              <div className="border-2 border-dashed border-slate-200 hover:border-clinicPrimary rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-white transition-all cursor-pointer">
                <input
                  type="file"
                  id="backupUploadInput"
                  accept=".gz,.json,.sql,.zip"
                  onChange={(e) => setUploadFile(e.target.files[0] || null)}
                  className="hidden"
                />
                <label htmlFor="backupUploadInput" className="cursor-pointer block space-y-2">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <FaCloudUploadAlt size={20} />
                  </div>
                  {uploadFile ? (
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{uploadFile.name}</p>
                      <p className="text-[11px] text-slate-400">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-slate-700 text-xs">Click to browse or drag file here</p>
                      <p className="text-[11px] text-slate-400">Supports .json.gz, .json, .sql, .zip up to 200MB</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Restore Immediately Toggle */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={restoreImmediately}
                    onChange={(e) => setRestoreImmediately(e.target.checked)}
                    className="w-4 h-4 text-clinicPrimary rounded accent-clinicPrimary cursor-pointer"
                  />
                  <span>1-Click Restore immediately into Database</span>
                </label>
                {restoreImmediately && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1.5 font-medium pl-6">
                    <FaExclamationTriangle size={11} className="shrink-0" />
                    <span>Database tables will be safely synchronized using atomic REPLACE INTO.</span>
                  </p>
                )}
              </div>

              {/* Target Clinic Scope (Optional) */}
              <div>
                <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                  Target Clinic (Optional for Company backups):
                </label>
                <select
                  value={targetTenantId}
                  onChange={(e) => setTargetTenantId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-clinicPrimary"
                >
                  <option value="">-- Auto-detect from backup manifest --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      #{t.id} - {t.clinic_name || t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <FaSyncAlt size={12} className="animate-spin" />
                      <span>Uploading & Restoring...</span>
                    </>
                  ) : (
                    <>
                      <FaCloudUploadAlt size={13} />
                      <span>Upload & Execute</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 1-CLICK RESTORE CONFIRMATION MODAL ── */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <FaExclamationTriangle size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Restore Database Snapshot</h3>
                <p className="text-xs text-slate-400">Atomic synchronization with zero foreign-key lock</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span className="font-bold">Snapshot:</span>
                <span className="font-mono text-slate-900 font-bold truncate max-w-[180px]">{selectedBackup.fileName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-bold">Scope:</span>
                <span className="font-bold text-slate-900">{selectedBackup.scope}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span className="font-bold">Size:</span>
                <span className="font-mono font-bold text-slate-900">{selectedBackup.sizeFormatted}</span>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-amber-50/70 p-3 rounded-xl border border-amber-200/70">
              <strong className="text-amber-800">Notice:</strong> Existing matching records will be safely synchronized using <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-300">REPLACE INTO</code>. Clinical notes, appointments, and billing data will be updated to this snapshot's state.
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={restoring}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {restoring ? (
                  <>
                    <FaSyncAlt size={12} className="animate-spin" />
                    <span>Restoring Database...</span>
                  </>
                ) : (
                  <>
                    <FaHistory size={12} />
                    <span>Confirm & Restore Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BACKUP DETAILS MODAL ── */}
      {showDetailsModal && selectedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <FaInfoCircle size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Backup Details & Tables</h3>
                  <p className="text-xs text-slate-400 font-mono truncate max-w-[280px]">{selectedBackup.fileName}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto pr-1">
              {loadingDetails ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                  <FaSyncAlt size={18} className="animate-spin text-clinicPrimary" />
                  <span>Loading backup metadata...</span>
                </div>
              ) : backupDetails ? (
                <>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Scope</span>
                      <span className="font-bold text-slate-900">{backupDetails.scopeName || selectedBackup.scope}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Archive Type</span>
                      <span className="font-bold text-slate-900">{backupDetails.type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Created At</span>
                      <span className="font-semibold text-slate-800">{formatDateTime(backupDetails.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tables</span>
                      <span className="font-bold text-slate-900">{backupDetails.tablesCount || 'All Schema'}</span>
                    </div>
                  </div>

                  {backupDetails.tableBreakdown && backupDetails.tableBreakdown.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                        Table-by-Table Records:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px]">
                        {backupDetails.tableBreakdown.map((t, idx) => (
                          <div key={idx} className="flex justify-between p-1.5 bg-white rounded-lg border border-slate-100">
                            <span className="font-mono text-slate-700 truncate mr-2">{t.tableName}</span>
                            <span className="font-bold text-clinicPrimary">{t.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <p>Raw archive file: {selectedBackup.fileName}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => handleDownload(selectedBackup.fileName)}
                className="px-4 py-2 bg-clinicPrimary text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <FaDownload size={11} />
                <span>Download Archive</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AUTOMATIC 7-DAY ADMIN EMAIL BACKUP MODAL ── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
                  <FaClock size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Automatic 7-Day Admin Email Backup
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Automatically generate and dispatch full database backups to administrator emails every 7 days.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1 transition-colors"
                title="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Scope Coverage Badge Alert */}
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/70 rounded-2xl text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <FaShieldAlt size={13} className="text-indigo-600 shrink-0" />
                <span>100% Comprehensive Database Snapshot (All Tables Included)</span>
              </div>
              <p className="text-[11px] text-indigo-800/80 leading-relaxed">
                This automated system packages all platform data—including Patients, Invoices, Payments, Appointments, Clinical SOAP Notes, Medical History, Forms, System Settings, and Users—into a secure encrypted archive (<code className="font-mono bg-white/70 px-1 py-0.2 rounded border border-indigo-200">.json.gz</code>) and emails it directly to administrator inbox(es).
              </p>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
              {/* Toggle Enable / Disable */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">Automated Backup Scheduler</span>
                  <span className="text-[11px] text-slate-500">
                    {scheduleData.enabled 
                      ? 'Active — Automatic weekly backup is running every 7 days' 
                      : 'Paused — Automatic backup scheduler is currently disabled'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleData.enabled}
                    onChange={(e) => setScheduleData({ ...scheduleData, enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Frequency & Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                    Backup Frequency
                  </label>
                  <select
                    value={scheduleData.frequency}
                    onChange={(e) => setScheduleData({ ...scheduleData, frequency: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-clinicPrimary"
                  >
                    <option value="EVERY_7_DAYS">Every 7 Days (Weekly - Recommended)</option>
                    <option value="DAILY">Daily (Every 24 Hours)</option>
                    <option value="BI_WEEKLY">Bi-Weekly (Every 14 Days)</option>
                    <option value="MONTHLY">Monthly (Every 30 Days)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                    Execution Time
                  </label>
                  <input
                    type="time"
                    value={scheduleData.executionTime || '02:00'}
                    onChange={(e) => setScheduleData({ ...scheduleData, executionTime: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-clinicPrimary"
                  />
                </div>
              </div>

              {/* Day of Week if Weekly */}
              {scheduleData.frequency === 'EVERY_7_DAYS' && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                    Weekly Run Day
                  </label>
                  <select
                    value={scheduleData.dayOfWeek}
                    onChange={(e) => setScheduleData({ ...scheduleData, dayOfWeek: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-clinicPrimary"
                  >
                    <option value="0">Sunday Night (Recommended)</option>
                    <option value="1">Monday Night</option>
                    <option value="2">Tuesday Night</option>
                    <option value="3">Wednesday Night</option>
                    <option value="4">Thursday Night</option>
                    <option value="5">Friday Night</option>
                    <option value="6">Saturday Night</option>
                  </select>
                </div>
              )}

              {/* Recipient Emails */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                  Recipient Email(s) for 7-Day Automatic Backup
                </label>
                <div className="relative">
                  <FaEnvelope size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={recipientEmailsInput}
                    onChange={(e) => setRecipientEmailsInput(e.target.value)}
                    placeholder="e.g. admin@deephysio.com, myanotheremail@gmail.com (comma-separated)"
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  * Enter admin email, alternate email, or multiple comma-separated emails. (If left blank, sent to all registered Admin accounts).
                </p>
              </div>

              {/* Status Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Last Execution:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">
                      {scheduleData.lastRunAt ? formatDateTime(scheduleData.lastRunAt) : 'Never executed yet'}
                    </span>
                    {scheduleData.lastStatus && (
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                        scheduleData.lastStatus === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {scheduleData.lastStatus}
                      </span>
                    )}
                  </div>
                </div>
                {scheduleData.nextRunAt && (
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-600">Next Scheduled Delivery:</span>
                    <span className="font-mono font-bold text-clinicPrimary">
                      {formatDateTime(scheduleData.nextRunAt)}
                    </span>
                  </div>
                )}
                {scheduleData.lastMessage && (
                  <p className="text-[10px] text-slate-500 truncate pt-1 border-t border-slate-200/50">
                    {scheduleData.lastMessage}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRunScheduleNow}
                  disabled={runningScheduleNow}
                  className="w-full sm:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-98"
                  title="Run backup now and send directly to admin email"
                >
                  <FaSyncAlt size={11} className={runningScheduleNow ? 'animate-spin' : ''} />
                  <span>{runningScheduleNow ? 'Sending Test Backup...' : '⚡ Run Backup Now (Test)'}</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSchedule}
                    className="px-5 py-2 bg-clinicPrimary hover:bg-clinicPrimary-dark text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-98"
                  >
                    {savingSchedule ? (
                      <>
                        <FaSyncAlt size={11} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Schedule Settings</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── EMAIL BACKUP MODAL ── */}
      {showEmailModal && modalTargetBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FaEnvelope size={18} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Email Backup Archive</h3>
                  <p className="text-xs text-slate-400">Dispatch file attachment to authorized Admin</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">File:</span>
                <span className="font-mono font-bold text-slate-800 truncate max-w-[200px]" title={modalTargetBackup.fileName}>
                  {modalTargetBackup.fileName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">Payload Size:</span>
                <span className="font-mono font-bold text-slate-800">{modalTargetBackup.sizeFormatted}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-500">Type:</span>
                <span className="font-bold text-slate-800">{modalTargetBackup.type}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Recipient Email Address (Admin or Another Email)
              </label>
              <div className="relative">
                <FaEnvelope size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={modalAdminEmail}
                  onChange={(e) => setModalAdminEmail(e.target.value)}
                  placeholder="e.g. admin@deephysio.com or another.backup@gmail.com"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                * You can dispatch this backup to your admin email or any alternate destination mailbox.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSendBackupToEmail({
                  email: modalAdminEmail,
                  fileName: modalTargetBackup.fileName,
                  backupType: modalTargetBackup.type === 'UPLOADS_ZIP' ? 'UPLOADS' : (modalTargetBackup.type === 'SQL' ? 'SQL' : 'DATABASE'),
                  isModal: true
                })}
                disabled={modalSendingEmail || !modalAdminEmail}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2"
              >
                {modalSendingEmail ? (
                  <>
                    <FaSyncAlt size={12} className="animate-spin" />
                    <span>Verifying & Sending...</span>
                  </>
                ) : (
                  <>
                    <FaPaperPlane size={12} />
                    <span>Dispatch Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataBackup;
