import React, { useEffect, useState, useMemo } from 'react';
import { 
  FaEnvelope, FaSearch, FaFilter, FaPlus, FaInbox, FaRegPaperPlane, 
  FaStar, FaTrash, FaChevronRight, FaPaperclip, FaCheckCircle, 
  FaExclamationCircle, FaUserCircle, FaReply, FaShare, FaPrint, 
  FaArchive, FaSync, FaFileAlt, FaUndo, FaTimes, FaExternalLinkAlt, 
  FaCheck, FaInfoCircle, FaFilePdf, FaTag, FaClock, FaCheckDouble
} from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { fetchApi } from '../config/api';

const CLINICAL_TEMPLATES = [
  {
    id: 'appt_reminder',
    name: 'Appointment Reminder & Details',
    subject: 'Appointment Reminder - DeePhysio Clinic',
    body: 'Dear {name},\n\nThis is a friendly reminder of your upcoming physiotherapy appointment at DeePhysio Clinic.\n\nDate: [Date]\nTime: [Time]\nClinician: [Therapist Name]\nLocation: Main Clinical Wing\n\nPlease arrive 10 minutes prior to your scheduled session. If you need to reschedule, kindly notify us at least 24 hours in advance.\n\nWarm regards,\nDeePhysio Clinic Team'
  },
  {
    id: 'invoice_notice',
    name: 'Invoice & Payment Receipt',
    subject: 'Clinical Invoice & Payment Summary - DeePhysio Clinic',
    body: 'Dear {name},\n\nThank you for choosing DeePhysio Clinic. Please find the details regarding your clinical session and pending invoice summary below.\n\nInvoice Number: [INV-XXXX]\nAmount Due: [Amount]\nServices: Physiotherapy Rehabilitation Session\n\nPlease let our billing team know if you have questions regarding health insurance claims or payments.\n\nSincerely,\nDeePhysio Accounts Team'
  },
  {
    id: 'exercise_protocol',
    name: 'Home Exercise Protocol & Instructions',
    subject: 'Your Prescribed Physiotherapy Exercise Program',
    body: 'Dear {name},\n\nFollowing your clinical assessment, here is your customized home exercise protocol designed to support your rehabilitation.\n\nProtocol Guidelines:\n1. Perform exercises twice daily in a comfortable, controlled range.\n2. Hydrate well and maintain recommended posture.\n3. If you experience sharp pain or discomfort, pause and contact us immediately.\n\nConsistency is key to optimal recovery. We look forward to reviewing your progress at your next appointment!\n\nBest regards,\nYour Physiotherapy Team\nDeePhysio Clinic'
  },
  {
    id: 'progress_checkin',
    name: 'Clinical Recovery & Progress Check-in',
    subject: 'Post-Treatment Follow-up - DeePhysio Clinic',
    body: 'Dear {name},\n\nWe wanted to check in on how you are feeling following your recent physiotherapy session at DeePhysio Clinic.\n\nHow is your pain level and mobility today? Please reply directly to this email or call our desk if you have any questions or require any adjustments to your rehabilitation plan.\n\nWarm regards,\nDeePhysio Clinical Care'
  },
  {
    id: 'general_notice',
    name: 'General Clinic Information / Announcement',
    subject: 'Clinical Update from DeePhysio Healthcare',
    body: 'Dear {name},\n\nWe are pleased to share an update regarding services and appointment availability at DeePhysio Clinic.\n\nOur team remains committed to providing you with the highest standard of physical therapy and rehabilitative care.\n\nFeel free to reach out to us whenever you require assistance.\n\nKind regards,\nDeePhysio Clinic Management'
  }
];

const EmailMessages = () => {
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [activeFolder, setActiveFolder] = useState('All Mail'); // 'All Mail' | 'Inbox' | 'Sent' | 'Starred' | 'Drafts' | 'Trash'
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isForwardOpen, setIsForwardOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [toast, setToast] = useState({ message: '', visible: false, type: 'success' });
  const [isSending, setIsSending] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);

  const [patients, setPatients] = useState([]);
  const [patientNameById, setPatientNameById] = useState({});
  const [patientEmailById, setPatientEmailById] = useState({});

  // Compose State
  const [recipientMode, setRecipientMode] = useState('patient'); // 'patient' | 'direct'
  const [selectedPatientForCompose, setSelectedPatientForCompose] = useState(null);
  const [directRecipient, setDirectRecipient] = useState({ name: '', email: '' });
  const [composeSearchTerm, setComposeSearchTerm] = useState('');
  const [composeData, setComposeData] = useState({ subject: '', message: '' });
  const [attachment, setAttachment] = useState(null);

  // Reply & Forward State
  const [replyData, setReplyData] = useState({ subject: '', message: '' });
  const [forwardData, setForwardData] = useState({ to: '', note: '' });

  // Email storage
  const [emails, setEmails] = useState([]);
  const [drafts, setDrafts] = useState(() => {
    try {
      const saved = localStorage.getItem('deephysio_email_drafts');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, visible: true, type });
    setTimeout(() => setToast({ message: '', visible: false, type: 'success' }), 3500);
  };

  // 1. Load Patients
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await fetchApi('/patients?limit=500');
        if (!response) return;
        const json = await response.json();
        const patientList = json?.data || [];
        setPatients(patientList);
        const nameMap = {};
        const emailMap = {};
        patientList.forEach((p) => {
          const fullName = `${p.firstName || p.first_name || ''} ${p.lastName || p.last_name || ''}`.trim() || `Patient #${p.id}`;
          nameMap[p.id] = fullName;
          if (p.email) emailMap[p.id] = p.email;
        });
        setPatientNameById(nameMap);
        setPatientEmailById(emailMap);
      } catch (error) {
        console.error('Failed to load patients for email composer:', error);
      }
    };
    loadPatients();
  }, []);

  // 2. Load Email Data
  const loadEmailData = async () => {
    try {
      // First try optimized direct emails endpoint
      const emailRes = await fetchApi('/communication/emails');
      if (emailRes && emailRes.ok) {
        const json = await emailRes.json();
        const list = json?.data || [];
        setEmails(list);
        if (list.length > 0 && !selectedEmailId) {
          setSelectedEmailId(list[0].id);
        }
        return;
      }

      // Graceful fallback to threads endpoint
      const threadsRes = await fetchApi('/communication/threads?channel=email');
      if (!threadsRes) return;
      const threadsJson = await threadsRes.json();
      const threadList = threadsJson?.data || [];
      let all = [];

      for (const t of threadList) {
        const msgRes = await fetchApi(`/communication/threads/${t.id}/messages`);
        if (!msgRes) continue;
        const msgJson = await msgRes.json();
        const mapped = (msgJson?.data || []).map((m) => {
          const pName = patientNameById[m.patientId ?? m.patient_id] || (t.title?.replace('Communication with ', '') || `Patient #${m.patientId ?? '1'}`);
          const realEmail = m.recipient_email || patientEmailById[m.patientId ?? m.patient_id] || `patient-${m.patientId ?? 'contact'}@deephysio.local`;

          return {
            id: Number(m.id),
            threadId: Number(t.id),
            patientId: m.patientId ?? m.patient_id,
            sender: m.direction === 'outbound' ? 'Clinic Staff' : pName,
            recipientName: pName,
            email: realEmail,
            subject: m.subject || '(No Subject)',
            excerpt: String(m.body || '').replace(/<[^>]*>/g, '').slice(0, 100),
            date: new Date(m.createdAt || m.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
            createdAt: m.createdAt || m.created_at,
            read: m.is_read !== undefined ? Boolean(m.is_read) : true,
            content: m.body,
            folder: (m.is_deleted == 1 || m.is_deleted === true) ? 'Trash' : (m.direction === 'outbound' ? 'Sent' : 'Inbox'),
            isStarred: m.is_starred == 1 || m.is_starred === true || m.is_starred === '1',
            isDeleted: m.is_deleted == 1 || m.is_deleted === true || m.is_deleted === '1',
            deliveryStatus: m.delivery_status || 'DELIVERED',
            attachmentName: m.attachment_name || null,
            direction: m.direction || 'outbound'
          };
        });
        all = all.concat(mapped);
      }

      const unique = [];
      const seen = new Set();
      all.forEach((m) => {
        if (!seen.has(m.id)) {
          unique.push(m);
          seen.add(m.id);
        }
      });
      unique.sort((a, b) => Number(b.id) - Number(a.id));
      setEmails(unique);

      if (unique.length > 0 && !selectedEmailId) {
        setSelectedEmailId(unique[0].id);
      }
    } catch (e) {
      console.warn('Failed to sync emails:', e);
      showToast('Notice: Could not sync latest emails', 'error');
    }
  };

  useEffect(() => {
    loadEmailData();
  }, [patientNameById]);

  // Persist drafts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('deephysio_email_drafts', JSON.stringify(drafts));
    } catch (_) {}
  }, [drafts]);

  // Folder Counts
  const unreadCount = emails.filter((e) => !e.isDeleted && !e.read).length;
  const sentCount = emails.filter((e) => !e.isDeleted && e.direction === 'outbound').length;
  const starredCount = emails.filter((e) => !e.isDeleted && e.isStarred).length;
  const trashCount = emails.filter((e) => e.isDeleted).length;

  const folders = [
    { name: 'All Mail', icon: <FaEnvelope />, count: emails.filter((e) => !e.isDeleted).length },
    { name: 'Inbox', icon: <FaInbox />, count: unreadCount },
    { name: 'Sent', icon: <FaRegPaperPlane />, count: sentCount },
    { name: 'Starred', icon: <FaStar />, count: starredCount },
    { name: 'Drafts', icon: <FaFileAlt />, count: drafts.length },
    { name: 'Trash', icon: <FaTrash />, count: trashCount },
  ];

  // Action Handlers
  const handleAction = async (action, item) => {
    if (!item) return;

    if (action === 'Toggle Star') {
      try {
        const nextStarred = !item.isStarred;
        await fetchApi(`/communication/messages/${item.id}/flags`, {
          method: 'PUT',
          body: JSON.stringify({ isStarred: nextStarred })
        });
        setEmails((prev) => prev.map((e) => (e.id === item.id ? { ...e, isStarred: nextStarred } : e)));
        showToast(nextStarred ? 'Email starred' : 'Email unstarred');
      } catch (e) {
        showToast('Failed to update star flag', 'error');
      }
    } else if (action === 'Mark Read Unread') {
      try {
        const nextRead = !item.read;
        await fetchApi(`/communication/messages/${item.id}/flags`, {
          method: 'PUT',
          body: JSON.stringify({ isRead: nextRead })
        });
        setEmails((prev) => prev.map((e) => (e.id === item.id ? { ...e, read: nextRead } : e)));
        showToast(nextRead ? 'Marked as read' : 'Marked as unread');
      } catch (e) {
        showToast('Failed to update read state', 'error');
      }
    } else if (action === 'Move to Trash') {
      try {
        await fetchApi(`/communication/messages/${item.id}/flags`, {
          method: 'PUT',
          body: JSON.stringify({ isDeleted: true })
        });
        setEmails((prev) => prev.map((e) => (e.id === item.id ? { ...e, isDeleted: true, folder: 'Trash' } : e)));
        showToast('Moved to Trash');
      } catch (e) {
        showToast('Failed to move to trash', 'error');
      }
    } else if (action === 'Restore from Trash') {
      try {
        await fetchApi(`/communication/messages/${item.id}/flags`, {
          method: 'PUT',
          body: JSON.stringify({ isDeleted: false })
        });
        setEmails((prev) => prev.map((e) => (e.id === item.id ? { ...e, isDeleted: false, folder: e.direction === 'outbound' ? 'Sent' : 'Inbox' } : e)));
        showToast('Restored from Trash to correspondence list');
      } catch (e) {
        showToast('Failed to restore email', 'error');
      }
    } else if (action === 'Delete Permanently') {
      if (!window.confirm('Are you sure you want to permanently delete this email? This cannot be undone.')) return;
      try {
        await fetchApi(`/communication/messages/${item.id}`, { method: 'DELETE' });
        setEmails((prev) => prev.filter((e) => e.id !== item.id));
        setSelectedEmailId(null);
        showToast('Email permanently deleted');
      } catch (e) {
        showToast('Failed to delete email permanently', 'error');
      }
    } else if (action === 'Print Command') {
      window.print();
    }
  };

  const runMailSync = async () => {
    setIsSyncing(true);
    await loadEmailData();
    setIsSyncing(false);
    showToast('Emails synchronized successfully');
  };

  // Compose Handlers
  const handleApplyTemplate = (tmplId) => {
    const tmpl = CLINICAL_TEMPLATES.find((t) => t.id === tmplId);
    if (!tmpl) return;

    let targetName = 'Valued Patient';
    if (recipientMode === 'patient' && selectedPatientForCompose) {
      targetName = `${selectedPatientForCompose.firstName || selectedPatientForCompose.first_name || ''} ${selectedPatientForCompose.lastName || selectedPatientForCompose.last_name || ''}`.trim() || 'Patient';
    } else if (directRecipient.name) {
      targetName = directRecipient.name;
    }

    const filledSubject = tmpl.subject;
    const filledBody = tmpl.body.replace(/\{name\}/g, targetName);

    setComposeData({
      subject: filledSubject,
      message: filledBody
    });
    showToast(`Template applied: ${tmpl.name}`);
  };

  const handleSaveDraft = () => {
    if (!composeData.subject.trim() && !composeData.message.trim()) {
      showToast('Cannot save empty draft', 'error');
      return;
    }

    const newDraft = {
      id: `draft-${Date.now()}`,
      recipientMode,
      selectedPatientForCompose,
      directRecipient,
      subject: composeData.subject,
      message: composeData.message,
      savedAt: new Date().toISOString()
    };

    setDrafts([newDraft, ...drafts]);
    showToast('Draft saved successfully');
    setIsComposeOpen(false);
    setComposeData({ subject: '', message: '' });
    setSelectedPatientForCompose(null);
    setDirectRecipient({ name: '', email: '' });
  };

  const handleResumeDraft = (draft) => {
    setRecipientMode(draft.recipientMode || 'patient');
    setSelectedPatientForCompose(draft.selectedPatientForCompose || null);
    setDirectRecipient(draft.directRecipient || { name: '', email: '' });
    setComposeData({ subject: draft.subject || '', message: draft.message || '' });
    setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    setIsComposeOpen(true);
  };

  const handleDeleteDraft = (draftId) => {
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    showToast('Draft deleted');
  };

  const handleComposeSubmit = async () => {
    let targetEmail = '';
    let targetName = '';
    let patientId = null;

    if (recipientMode === 'patient') {
      if (!selectedPatientForCompose) {
        showToast('Please select a recipient patient', 'error');
        return;
      }
      patientId = selectedPatientForCompose.id;
      targetName = `${selectedPatientForCompose.firstName || selectedPatientForCompose.first_name || ''} ${selectedPatientForCompose.lastName || selectedPatientForCompose.last_name || ''}`.trim();
      targetEmail = selectedPatientForCompose.email;

      if (!targetEmail) {
        showToast('Selected patient has no email address on file. Please enter direct email.', 'error');
        return;
      }
    } else {
      if (!directRecipient.email || !directRecipient.email.includes('@')) {
        showToast('Please enter a valid recipient email address', 'error');
        return;
      }
      targetEmail = directRecipient.email.trim();
      targetName = directRecipient.name.trim() || targetEmail;
    }

    if (!composeData.message.trim()) {
      showToast('Please enter email message content', 'error');
      return;
    }

    setIsSending(true);
    try {
      let res;
      if (attachment) {
        // Send multipart form data if file attached
        const formData = new FormData();
        if (patientId) formData.append('patientId', patientId);
        formData.append('recipientEmail', targetEmail);
        formData.append('recipientName', targetName);
        formData.append('subject', composeData.subject || 'DeePhysio Clinic Correspondence');
        formData.append('body', composeData.message);
        formData.append('attachment', attachment);

        res = await fetchApi('/communication/emails', {
          method: 'POST',
          body: formData
        });
      } else {
        // Direct JSON
        res = await fetchApi('/communication/emails', {
          method: 'POST',
          body: JSON.stringify({
            patientId,
            recipientEmail: targetEmail,
            recipientName: targetName,
            subject: composeData.subject || 'DeePhysio Clinic Correspondence',
            body: composeData.message
          })
        });
      }

      if (!res || !res.ok) {
        const errorJson = await res?.json().catch(() => ({}));
        throw new Error(errorJson?.message || 'Transmission failed');
      }

      const json = await res.json();
      const sentMsg = json.data;

      showToast('Email Transmitted Successfully via Clinic Gateway', 'success');

      setIsComposeOpen(false);
      setComposeData({ subject: '', message: '' });
      setSelectedPatientForCompose(null);
      setDirectRecipient({ name: '', email: '' });
      setAttachment(null);

      // Refresh and switch to Sent folder to view the sent email
      await loadEmailData();
      setActiveFolder('Sent');
      if (sentMsg?.id) {
        setSelectedEmailId(Number(sentMsg.id));
      }
    } catch (err) {
      console.error('Email send error:', err);
      showToast(`Error sending email: ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Reply Submit
  const handleReplySubmit = async () => {
    if (!replyData.message.trim()) {
      showToast('Please enter your reply message', 'error');
      return;
    }

    setIsReplying(true);
    try {
      const res = await fetchApi('/communication/emails/reply', {
        method: 'POST',
        body: JSON.stringify({
          messageId: selectedEmail.id,
          threadId: selectedEmail.threadId,
          subject: replyData.subject,
          body: replyData.message
        })
      });

      if (!res || !res.ok) {
        const errJson = await res?.json().catch(() => ({}));
        throw new Error(errJson?.message || 'Reply failed');
      }

      showToast('Reply dispatched successfully');
      setIsReplyOpen(false);
      setReplyData({ subject: '', message: '' });
      await loadEmailData();
      setActiveFolder('Sent');
    } catch (e) {
      showToast(`Reply error: ${e.message}`, 'error');
    } finally {
      setIsReplying(false);
    }
  };

  // Forward Submit
  const handleForwardSubmit = async () => {
    if (!forwardData.to.trim() || !forwardData.to.includes('@')) {
      showToast('Please enter a valid forwarding recipient email', 'error');
      return;
    }

    setIsForwarding(true);
    try {
      const res = await fetchApi('/communication/emails/forward', {
        method: 'POST',
        body: JSON.stringify({
          messageId: selectedEmail.id,
          targetEmail: forwardData.to.trim(),
          note: forwardData.note
        })
      });

      if (!res || !res.ok) {
        const errJson = await res?.json().catch(() => ({}));
        throw new Error(errJson?.message || 'Forward failed');
      }

      showToast(`Email forwarded to ${forwardData.to}`);
      setIsForwardOpen(false);
      setForwardData({ to: '', note: '' });
      await loadEmailData();
      setActiveFolder('Sent');
    } catch (e) {
      showToast(`Forward error: ${e.message}`, 'error');
    } finally {
      setIsForwarding(false);
    }
  };

  // Filter Emails by Folder & Search
  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      // 1. Folder filter
      let matchesFolder = true;
      if (activeFolder === 'All Mail') {
        matchesFolder = !email.isDeleted;
      } else if (activeFolder === 'Inbox') {
        matchesFolder = !email.isDeleted && email.direction === 'inbound';
      } else if (activeFolder === 'Sent') {
        matchesFolder = !email.isDeleted && email.direction === 'outbound';
      } else if (activeFolder === 'Starred') {
        matchesFolder = !email.isDeleted && email.isStarred;
      } else if (activeFolder === 'Trash') {
        matchesFolder = email.isDeleted;
      }

      // 2. Search term
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        email.sender?.toLowerCase().includes(term) ||
        email.recipientName?.toLowerCase().includes(term) ||
        email.email?.toLowerCase().includes(term) ||
        email.subject?.toLowerCase().includes(term) ||
        email.content?.toLowerCase().includes(term);

      // 3. Dropdown sub-filter
      let matchesSub = true;
      if (activeFilter === 'Unread') matchesSub = !email.read;
      if (activeFilter === 'Starred') matchesSub = email.isStarred;
      if (activeFilter === 'Delivered') matchesSub = email.deliveryStatus === 'DELIVERED';

      return matchesFolder && matchesSearch && matchesSub;
    });
  }, [emails, activeFolder, searchTerm, activeFilter]);

  const selectedEmail = useMemo(() => {
    return emails.find((e) => e.id === selectedEmailId) || filteredEmails[0] || null;
  }, [emails, selectedEmailId, filteredEmails]);

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-5 lg:px-6 animate-fade-in font-sans relative">
      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[9999] animate-bounce-in">
          <div className={`${toast.type === 'error' ? 'bg-rose-900 border-rose-700' : 'bg-slate-900 border-slate-800'} text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border`}>
            {toast.type === 'error' ? (
              <FaExclamationCircle className="text-rose-400" size={14} />
            ) : (
              <FaCheckCircle className="text-clinicPrimary" size={14} />
            )}
            <span className="text-[11px] font-black uppercase tracking-wider">{toast.message}</span>
          </div>
        </div>
      )}

      {/* ── TOP HEADER ── */}
      <Card hover={false} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 border border-slate-100 shadow-sm bg-white relative overflow-hidden group rounded-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-clinicPrimary/10 text-clinicPrimary">
              <FaEnvelope size={14} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-clinicPrimary">Clinical Communication Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Email Center</h1>
          <p className="text-slate-500 font-bold mt-1.5 uppercase tracking-widest text-[9px] sm:text-[10px] opacity-80">
            Professional clinical, administrative, and patient correspondence via clinic gateway.
          </p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 relative z-10 w-full lg:w-auto">
          <Button 
            variant="secondary" 
            className="flex-1 lg:flex-none rounded-xl h-10 px-4 sm:px-5 border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors text-[10px] font-black uppercase tracking-widest" 
            onClick={runMailSync} 
            isLoading={isSyncing} 
            leftIcon={<FaSync size={11} className={isSyncing ? 'animate-spin' : ''} />}
          >
            {isSyncing ? 'Syncing...' : 'Sync Gateway'}
          </Button>

          <Button 
            variant="accent" 
            className="flex-1 lg:flex-none rounded-xl h-10 px-5 sm:px-6 shadow-md hover:shadow-lg active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest" 
            onClick={() => {
              setRecipientMode('patient');
              setSelectedPatientForCompose(null);
              setDirectRecipient({ name: '', email: '' });
              setComposeData({ subject: '', message: '' });
              setAttachment(null);
              setIsComposeOpen(true);
            }} 
            leftIcon={<FaPlus size={11} />}
          >
            Compose Email
          </Button>
        </div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-clinicPrimary/5 rounded-full blur-2xl group-hover:bg-clinicPrimary/10 transition-colors duration-1000"></div>
      </Card>

      {/* ── MAIN EMAIL LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-[550px] h-[calc(100vh-200px)] lg:h-[calc(100vh-160px)]">
        
        {/* FOLDERS SIDEBAR */}
        <Card hover={false} className="lg:col-span-3 p-4 sm:p-5 flex flex-col h-full bg-white border border-slate-100 shadow-sm rounded-2xl">
          <div className="mb-4 sm:mb-5 px-1 shrink-0">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mailboxes</h3>
            <div className="space-y-1.5">
              {folders.map((item) => (
                <button 
                  key={item.name}
                  onClick={() => {
                    setActiveFolder(item.name);
                    setSelectedEmailId(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all group ${
                    activeFolder === item.name 
                      ? 'bg-clinicPrimary/10 text-clinicPrimary font-black shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${activeFolder === item.name ? 'text-clinicPrimary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                      {item.icon}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider">{item.name}</span>
                  </div>
                  {item.count > 0 && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                      activeFolder === item.name 
                        ? 'bg-clinicPrimary text-white' 
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Help / SMTP Status pill */}
          <div className="p-4 bg-slate-900 rounded-xl border border-white/5 relative overflow-hidden group mt-auto shrink-0 shadow-sm">
            <div className="relative z-10 space-y-1.5">
              <p className="text-[10px] font-black text-white uppercase tracking-tight flex items-center gap-2">
                <FaCheckCircle className="text-emerald-400" size={12} /> SMTP & SSL Active
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Transmissions are dispatched via clinic-authenticated SMTP and encrypted clinical gateway.
              </p>
            </div>
          </div>
        </Card>

        {/* EMAIL LIST & PREVIEW PANE */}
        <div className="lg:col-span-9 flex flex-col lg:flex-row gap-4 sm:gap-6 h-full">
          
          {/* EMAIL LIST */}
          <Card hover={false} className="flex-1 flex flex-col p-0 overflow-hidden border border-slate-100 shadow-sm bg-white rounded-2xl shrink-0 lg:shrink h-[45vh] lg:h-full">
            {/* Search & Filter bar */}
            <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-2.5 bg-white z-10 relative shrink-0">
              <div className="relative flex-1 group">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-clinicPrimary transition-colors" size={12}/>
                <input 
                  type="text" 
                  placeholder="Search subject, patient, or email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all placeholder:text-slate-400" 
                />
              </div>

              <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)} 
                  className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-all shadow-sm active:scale-95 ${
                    isFilterOpen || activeFilter !== 'All' 
                      ? 'bg-clinicPrimary text-white border-clinicPrimary' 
                      : 'bg-white border-slate-200 text-slate-400 hover:text-clinicPrimary hover:border-clinicPrimary/30'
                  }`}
                  title="Filter messages"
                >
                  <FaFilter size={12}/>
                </button>
                {isFilterOpen && (
                  <div className="absolute top-11 right-0 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden p-1.5 animate-slide-up">
                    {['All', 'Unread', 'Starred', 'Delivered'].map((f) => (
                      <button 
                        key={f}
                        onClick={() => { setActiveFilter(f); setIsFilterOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                          activeFilter === f ? 'bg-clinicPrimary/10 text-clinicPrimary' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Email list items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-0 divide-y divide-slate-100">
              {activeFolder === 'Drafts' ? (
                drafts.length > 0 ? (
                  drafts.map((draft) => (
                    <div 
                      key={draft.id}
                      className="p-4 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3 group"
                    >
                      <div className="flex-1 min-w-0" onClick={() => handleResumeDraft(draft)}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200">
                            Draft
                          </span>
                          <span className="text-[10px] font-black text-slate-700 truncate">
                            {draft.recipientMode === 'patient' 
                              ? (draft.selectedPatientForCompose ? `${draft.selectedPatientForCompose.firstName} ${draft.selectedPatientForCompose.lastName}` : 'Unassigned Patient')
                              : (draft.directRecipient?.email || 'Direct Recipient')}
                          </span>
                        </div>
                        <h4 className="text-[12px] font-black text-slate-900 truncate mb-1">
                          {draft.subject || '(No Subject)'}
                        </h4>
                        <p className="text-[11px] font-bold text-slate-500 truncate">
                          {draft.message || 'Empty draft content...'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => handleResumeDraft(draft)}
                          className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider bg-clinicPrimary text-white rounded-lg hover:bg-clinicPrimary/90"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50"
                          title="Delete draft"
                        >
                          <FaTrash size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto border border-dashed border-slate-200">
                      <FaFileAlt className="text-slate-300" size={16} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Drafts Saved</p>
                  </div>
                )
              ) : filteredEmails.length > 0 ? (
                filteredEmails.map((email) => {
                  const isSelected = selectedEmailId === email.id;
                  return (
                    <div 
                      key={email.id} 
                      onClick={() => {
                        setSelectedEmailId(email.id);
                        if (!email.read) {
                          handleAction('Mark Read Unread', { ...email, read: false });
                        }
                      }}
                      className={`p-3.5 sm:p-4 cursor-pointer transition-all flex items-start gap-3 relative group ${
                        isSelected ? 'bg-clinicPrimary/5' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-clinicPrimary"></div>
                      )}

                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-colors shrink-0 shadow-sm ${
                        isSelected 
                          ? 'bg-clinicPrimary text-white' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {(email.recipientName || email.sender || 'P')[0]?.toUpperCase()}
                      </div>

                      {/* Text info */}
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex justify-between items-center mb-0.5">
                          <h4 className={`text-[12px] uppercase tracking-tight font-black truncate ${
                            isSelected ? 'text-clinicPrimary' : 'text-slate-800'
                          }`}>
                            {email.direction === 'outbound' ? `To: ${email.recipientName}` : email.sender}
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest shrink-0 ml-2">
                            {email.date}
                          </span>
                        </div>

                        <p className={`text-[11px] truncate tracking-tight mb-0.5 ${
                          !email.read ? 'font-black text-slate-900' : 'font-bold text-slate-600'
                        }`}>
                          {email.subject}
                        </p>

                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-slate-400 font-bold truncate flex-1">
                            {email.excerpt}
                          </p>
                          {email.attachmentName && (
                            <span className="text-slate-400 shrink-0" title={`Attachment: ${email.attachmentName}`}>
                              <FaPaperclip size={10} />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!email.read && (
                        <div className="absolute top-4 right-3 w-2 h-2 bg-clinicPrimary rounded-full"></div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto border border-dashed border-slate-200">
                    <FaEnvelope className="text-slate-300" size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Emails Found</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                      {searchTerm ? 'Try a different search keyword' : 'Your folder is currently empty'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* PREVIEW & READING PANE */}
          <Card hover={false} className="flex-[1.5] flex flex-col p-0 overflow-hidden border border-slate-100 shadow-sm bg-white rounded-2xl min-h-[50vh] lg:min-h-0">
            {selectedEmail ? (
              <>
                {/* Email Action Toolbar */}
                <div className="p-3 sm:p-4 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shrink-0">
                  <div className="flex items-center gap-2">
                    {selectedEmail.isDeleted ? (
                      <>
                        <button 
                          onClick={() => handleAction('Restore from Trash', selectedEmail)} 
                          title="Restore Email" 
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <FaUndo size={10}/> Restore
                        </button>
                        <button 
                          onClick={() => handleAction('Delete Permanently', selectedEmail)} 
                          title="Delete Permanently" 
                          className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <FaTrash size={10}/> Delete Permanently
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleAction('Move to Trash', selectedEmail)} 
                          title="Move to Trash" 
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          <FaTrash size={12}/>
                        </button>
                        <button 
                          onClick={() => handleAction('Mark Read Unread', selectedEmail)} 
                          title={selectedEmail.read ? "Mark as Unread" : "Mark as Read"} 
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-clinicPrimary hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          {selectedEmail.read ? <FaEnvelope size={12}/> : <FaCheckCircle size={12}/>}
                        </button>
                        <button 
                          onClick={() => handleAction('Print Command', selectedEmail)} 
                          title="Print Email" 
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-clinicPrimary hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          <FaPrint size={12}/>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className={`h-8 w-8 rounded-xl bg-white border border-slate-200 shadow-sm shrink-0 transition-colors ${
                        selectedEmail.isStarred ? 'bg-amber-50 border-amber-200' : ''
                      }`}
                      onClick={() => handleAction('Toggle Star', selectedEmail)}
                      title={selectedEmail.isStarred ? "Unstar" : "Star"}
                    >
                      <FaStar size={12} className={selectedEmail.isStarred ? 'text-amber-400' : 'text-slate-300'} />
                    </Button>
                  </div>
                </div>

                {/* Email Reading Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50">
                  {/* Sender & Recipient Banner */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-clinicPrimary font-black text-base shadow-sm shrink-0">
                        {(selectedEmail.recipientName || selectedEmail.sender || 'P')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight leading-none">
                            {selectedEmail.direction === 'outbound' ? `To: ${selectedEmail.recipientName}` : selectedEmail.sender}
                          </h2>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            selectedEmail.deliveryStatus === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            selectedEmail.deliveryStatus === 'SIMULATED' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                            selectedEmail.deliveryStatus === 'FAILED' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                            'bg-blue-50 text-blue-600 border border-blue-200'
                          }`}>
                            {selectedEmail.deliveryStatus || 'DELIVERED'}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                          {selectedEmail.email} • {selectedEmail.date}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                        Channel: Electronic Mail
                      </span>
                    </div>
                  </div>

                  {/* Subject and Body Card */}
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-5 sm:p-6">
                      <h3 className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-snug mb-5 border-l-4 border-clinicPrimary pl-3 sm:pl-4">
                        {selectedEmail.subject}
                      </h3>
                      
                      <div className="text-[12px] sm:text-[13px] text-slate-700 font-bold leading-relaxed whitespace-pre-wrap tracking-tight">
                        {selectedEmail.content}
                      </div>

                      {/* Attachment Pill if present */}
                      {selectedEmail.attachmentName && (
                        <div className="mt-6 pt-4 border-t border-slate-100">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Attached Document</p>
                          <div className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-700 font-black text-[11px] shadow-sm">
                            <FaFilePdf size={14} className="text-blue-500" />
                            <span>{selectedEmail.attachmentName}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Buttons at bottom of view */}
                  {!selectedEmail.isDeleted && (
                    <div className="flex items-center gap-3 pt-2">
                      <Button 
                        variant="accent" 
                        className="flex-1 h-10 rounded-xl shadow-sm font-black uppercase tracking-widest text-[10px]" 
                        leftIcon={<FaReply size={11}/>} 
                        onClick={() => {
                          setReplyData({
                            subject: selectedEmail.subject?.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject || 'Correspondence'}`,
                            message: ''
                          });
                          setIsReplyOpen(true);
                        }}
                      >
                        Reply to Recipient
                      </Button>

                      <Button 
                        variant="secondary" 
                        className="flex-1 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm font-black uppercase tracking-widest text-[10px] transition-colors" 
                        leftIcon={<FaShare size={11}/>} 
                        onClick={() => {
                          setForwardData({ to: '', note: '' });
                          setIsForwardOpen(true);
                        }}
                      >
                        Forward Email
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-10 text-center bg-transparent">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-slate-200">
                    <FaRegPaperPlane className="text-slate-300" size={24} />
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-400 uppercase tracking-tighter">Awaiting Selection</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select an email to view its content and correspondence history.</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── COMPOSE MODAL ── */}
      <Modal 
        isOpen={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)}
        title="Compose Clinical Email"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex items-center justify-between w-full px-2">
            <Button variant="secondary" onClick={handleSaveDraft} leftIcon={<FaFileAlt size={10} />}>
              Save Draft
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsComposeOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="accent" 
                onClick={handleComposeSubmit} 
                disabled={isSending} 
                isLoading={isSending} 
                leftIcon={<FaRegPaperPlane size={11}/>}
              >
                {isSending ? 'Transmitting...' : 'Send Email'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 p-0 text-left font-sans">
          
          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setRecipientMode('patient')}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                recipientMode === 'patient' 
                  ? 'bg-white text-clinicPrimary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Clinic Patient
            </button>
            <button
              type="button"
              onClick={() => setRecipientMode('direct')}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                recipientMode === 'direct' 
                  ? 'bg-white text-clinicPrimary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Direct / External Email
            </button>
          </div>

          {/* Recipient Selection */}
          {recipientMode === 'patient' ? (
            <div className="space-y-3">
              {selectedPatientForCompose ? (
                <div className="flex items-center justify-between p-3.5 bg-clinicPrimary/5 rounded-xl border border-clinicPrimary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-clinicPrimary text-white flex items-center justify-center font-black text-xs shadow-sm">
                      {(selectedPatientForCompose.firstName || 'P')[0]}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">
                        {selectedPatientForCompose.firstName} {selectedPatientForCompose.lastName}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500">
                        {selectedPatientForCompose.email || 'No Email on file (Enter direct below)'} • ID: #{selectedPatientForCompose.id}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedPatientForCompose(null)}
                    className="text-[10px] font-black text-clinicPrimary uppercase tracking-wider hover:underline"
                  >
                    Change Patient
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative group">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-clinicPrimary" size={12}/>
                    <input 
                      type="text" 
                      placeholder="Search patient by name, phone, or ID..."
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all"
                      value={composeSearchTerm}
                      onChange={(e) => setComposeSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="max-h-[170px] overflow-y-auto space-y-1.5 custom-scrollbar pr-1 border border-slate-100 rounded-xl p-1 bg-slate-50/50">
                    {patients
                      .filter((p) => {
                        const term = composeSearchTerm.toLowerCase();
                        return (
                          `${p.firstName} ${p.lastName}`.toLowerCase().includes(term) ||
                          String(p.id).includes(term) ||
                          (p.email && p.email.toLowerCase().includes(term)) ||
                          (p.phone && p.phone.includes(term))
                        );
                      })
                      .slice(0, 15)
                      .map((p) => (
                        <div 
                          key={p.id}
                          onClick={() => {
                            setSelectedPatientForCompose(p);
                            setComposeSearchTerm('');
                          }}
                          className="p-2.5 bg-white border border-slate-100 rounded-xl hover:border-clinicPrimary hover:bg-clinicPrimary/5 cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-clinicPrimary transition-colors">
                              <FaUserCircle size={14} />
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                                {p.firstName} {p.lastName}
                              </p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                ID: #{p.id} • {p.email || 'No Email'} • {p.phone || 'No Phone'}
                              </p>
                            </div>
                          </div>
                          <FaChevronRight size={10} className="text-slate-300 group-hover:text-clinicPrimary" />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Recipient Name</label>
                <input 
                  type="text" 
                  value={directRecipient.name}
                  onChange={(e) => setDirectRecipient({ ...directRecipient, name: e.target.value })}
                  placeholder="e.g. Dr. Jennifer Smith" 
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Recipient Email Address *</label>
                <input 
                  type="email" 
                  value={directRecipient.email}
                  onChange={(e) => setDirectRecipient({ ...directRecipient, email: e.target.value })}
                  placeholder="recipient@example.com" 
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all" 
                />
              </div>
            </div>
          )}

          {/* Quick Clinical Templates Dropdown */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Insert Clinical Template</label>
              <span className="text-[9px] font-bold text-clinicPrimary">Auto-fills clinical protocols</span>
            </div>
            <select
              onChange={(e) => handleApplyTemplate(e.target.value)}
              defaultValue=""
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all cursor-pointer"
            >
              <option value="" disabled>Select a pre-made template...</option>
              {CLINICAL_TEMPLATES.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Subject *</label>
            <input 
              type="text" 
              value={composeData.subject}
              onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
              placeholder="e.g. Physiotherapy Clinical Update & Progress Report" 
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all" 
            />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Message Body *</label>
            <textarea 
              value={composeData.message}
              onChange={(e) => setComposeData({ ...composeData, message: e.target.value })}
              placeholder="Write your clinical notes, directions, or patient communication here..." 
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all h-36 custom-scrollbar resize-none leading-relaxed"
            />
          </div>

          {/* Attachment upload */}
          <label className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-blue-50/50 hover:bg-blue-100/50 cursor-pointer rounded-xl border border-blue-100 shadow-sm transition-colors">
            <div className="flex items-center gap-2 overflow-hidden">
              <FaPaperclip className="text-blue-500 shrink-0" size={12}/>
              <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider truncate">
                {attachment ? `${attachment.name} (${Math.round(attachment.size / 1024)} KB)` : 'Attach Clinical PDF / Report / Documentation'}
              </p>
            </div>
            {attachment && (
              <button 
                type="button" 
                onClick={(e) => { e.preventDefault(); setAttachment(null); }}
                className="text-rose-500 hover:text-rose-700 font-bold text-[9px] uppercase tracking-widest shrink-0 ml-2"
              >
                Remove
              </button>
            )}
            <input 
              type="file" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setAttachment(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      </Modal>

      {/* ── REPLY MODAL ── */}
      <Modal 
        isOpen={isReplyOpen} 
        onClose={() => setIsReplyOpen(false)}
        title={`Reply to ${selectedEmail?.recipientName || selectedEmail?.email}`}
        footer={
          <div className="flex gap-2 justify-end w-full px-2">
            <Button variant="secondary" onClick={() => setIsReplyOpen(false)}>Cancel</Button>
            <Button 
              variant="accent" 
              onClick={handleReplySubmit} 
              isLoading={isReplying}
              disabled={isReplying}
              leftIcon={<FaReply size={10} />}
            >
              {isReplying ? 'Transmitting...' : 'Send Reply'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-0 text-left font-sans">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Subject</label>
            <input 
              type="text" 
              value={replyData.subject}
              onChange={(e) => setReplyData({ ...replyData, subject: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Your Reply Message *</label>
            <textarea 
              value={replyData.message}
              onChange={(e) => setReplyData({ ...replyData, message: e.target.value })}
              placeholder="Type your response to the recipient..." 
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all h-36 custom-scrollbar resize-none leading-relaxed"
            />
          </div>
        </div>
      </Modal>

      {/* ── FORWARD MODAL ── */}
      <Modal 
        isOpen={isForwardOpen} 
        onClose={() => setIsForwardOpen(false)}
        title="Forward Email Correspondence"
        footer={
          <div className="flex gap-2 justify-end w-full px-2">
            <Button variant="secondary" onClick={() => setIsForwardOpen(false)}>Cancel</Button>
            <Button 
              variant="accent" 
              onClick={handleForwardSubmit} 
              isLoading={isForwarding}
              disabled={isForwarding}
              leftIcon={<FaShare size={10} />}
            >
              {isForwarding ? 'Forwarding...' : 'Forward Email'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 p-0 text-left font-sans">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Forward to Email Address *</label>
            <input 
              type="email" 
              value={forwardData.to}
              onChange={(e) => setForwardData({ ...forwardData, to: e.target.value })}
              placeholder="e.g. specialist@hospital.org" 
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Optional Forwarding Note</label>
            <textarea 
              value={forwardData.note}
              onChange={(e) => setForwardData({ ...forwardData, note: e.target.value })}
              placeholder="Add an optional comment for the recipient..." 
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-clinicPrimary/10 focus:border-clinicPrimary transition-all h-20 custom-scrollbar resize-none"
            />
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 font-bold space-y-1">
            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black">Original Message</p>
            <p className="font-black text-slate-800">{selectedEmail?.subject}</p>
            <p className="text-slate-500 line-clamp-2">{selectedEmail?.content}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmailMessages;
