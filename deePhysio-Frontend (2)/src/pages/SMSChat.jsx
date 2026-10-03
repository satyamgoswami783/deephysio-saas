import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  FaComments, FaSearch, FaPaperPlane, FaUserCircle, FaCheckDouble, 
  FaPlus, FaPhoneAlt, FaInfoCircle, FaEllipsisV, FaRegSmile, 
  FaPaperclip, FaHistory, FaCheck, FaTimes, FaCircle, FaWhatsapp,
  FaInbox, FaUser, FaReply, FaSyncAlt, FaUsers, FaFileAlt,
  FaImage, FaMicrophone, FaRegClock, FaExternalLinkAlt, FaCheckSquare,
  FaSignOutAlt
} from 'react-icons/fa';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../config/api';
import { normalizeWhatsAppPhone, formatPhoneDisplay } from '../utils/phoneUtils';

// Canonical WhatsApp chat key helper:
// Groups -> {groupId}@g.us
// Individual contacts -> 919XXXXXXXXX (canonical international digits)
const getCanonicalChatKey = (raw, isGroup = false) => {
  if (!raw) return '';
  const str = String(raw).trim();
  if (isGroup || str.endsWith('@g.us') || str.startsWith('120363')) {
    const base = str.replace(/@.*$/, '').trim();
    return `${base}@g.us`;
  }
  return normalizeWhatsAppPhone(str);
};

// Format message bubble time: "11:30 PM"
const formatBubbleTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return '';
  }
};

// Format thread last message time: "11:30 PM", "Yesterday", or "01/10/26"
const formatThreadTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month}`;
  } catch (_) {
    return '';
  }
};

// Format date separator label: "TODAY", "YESTERDAY", or "02 OCTOBER 2026"
const formatDateSeparator = (dateStr) => {
  if (!dateStr) return 'TODAY';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'TODAY';
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'YESTERDAY';

    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  } catch (_) {
    return 'TODAY';
  }
};

// Reliable Patient Name Extractor
const getPatientFullName = (p) => {
  if (!p) return '';
  const first = p.firstName || p.first_name || '';
  const last = p.lastName || p.last_name || '';
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (p.name && String(p.name).trim()) return String(p.name).trim();
  return `Patient #${p.id || ''}`.trim();
};

// Avatar soft background color generator based on name
const getAvatarColor = (name = '') => {
  const colors = [
    'bg-emerald-600',
    'bg-teal-600',
    'bg-blue-600',
    'bg-indigo-600',
    'bg-violet-600',
    'bg-amber-600',
    'bg-rose-600',
    'bg-cyan-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Group participant name color generator (like WhatsApp group chats)
const getParticipantColor = (name = '') => {
  const colors = [
    'text-emerald-700',
    'text-teal-700',
    'text-blue-700',
    'text-indigo-700',
    'text-purple-700',
    'text-rose-700',
    'text-amber-700',
    'text-cyan-700'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const SMSChat = () => {
  const { showToast } = useToast();
  const userRole = (sessionStorage.getItem('deephysio_role') || 'admin').toLowerCase();
  const canWrite = ['admin', 'superadmin', 'billing', 'therapist', 'receptionist', 'administrator', 'staff'].includes(userRole);

  // Active chat selection
  const [selectedChatKey, setSelectedChatKey] = useState(null);

  // Raw data from server
  const [logs, setLogs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [waGroups, setWaGroups] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('CHECKING'); // 'CHECKING' | 'CONNECTED' | 'DISCONNECTED' | 'QR_READY' | 'CONNECTING'
  const [isReady, setIsReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Chat UI state
  const [messageText, setMessageText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'PATIENTS' | 'GROUPS'
  const [isSending, setIsSending] = useState(false);

  // New Chat Modal
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatTab, setNewChatTab] = useState('PATIENTS'); // 'PATIENTS' | 'GROUPS'
  const [newChatSearchTerm, setNewChatSearchTerm] = useState('');

  // Emojis & Attachments
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  const pollTimerRef = useRef(null);
  // Read timestamps map (threadKey -> timestamp): Persisted in localStorage so read messages stay read
  const [readTimestamps, setReadTimestamps] = useState(() => {
    try {
      const stored = localStorage.getItem('deephysio_chat_read_map');
      return stored ? JSON.parse(stored) : {};
    } catch (_) {
      return {};
    }
  });

  // Mark a thread as read
  const markThreadAsRead = useCallback((threadKey) => {
    if (!threadKey) return;
    setReadTimestamps((prev) => {
      const updated = { ...prev, [threadKey]: Date.now() };
      try {
        localStorage.setItem('deephysio_chat_read_map', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, []);

  // WhatsApp emoji list
  const emojiCategories = [
    '👍', '🙏', '😊', '❤️', '🏥', '📅', '💊', '✅', '👋', '💙', 
    '💯', '🙌', '🩺', '🏃', '💪', '🤝', '⭐', '✨', '💐', '🔔'
  ];

  // Profile picture cache: key (phone/jid) -> url or null
  const [profilePics, setProfilePics] = useState({});
  const profilePicFetchedRef = useRef(new Set());

  // Fetch a profile picture URL for a given phone/jid
  const fetchProfilePic = useCallback(async (rawPhone) => {
    if (!rawPhone || profilePicFetchedRef.current.has(rawPhone)) return;
    profilePicFetchedRef.current.add(rawPhone);
    try {
      const res = await fetchApi(`/settings/whatsapp/profile-picture?phone=${encodeURIComponent(rawPhone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.data?.url) {
          setProfilePics((prev) => ({ ...prev, [rawPhone]: data.data.url }));
        }
      }
    } catch (_) {}
  }, []);

  // 1. Fetch WhatsApp logs, Patient list, Groups & Connection Status
  const fetchChatData = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsRefreshing(true);
    try {
      const [logsRes, patientsRes, groupsRes, statusRes] = await Promise.allSettled([
        fetchApi('/settings/whatsapp/logs'),
        fetchApi('/patients?limit=300'),
        fetchApi('/settings/whatsapp/groups'),
        fetchApi('/settings/whatsapp/status')
      ]);

      if (statusRes.status === 'fulfilled' && statusRes.value?.ok) {
        const sJson = await statusRes.value.json();
        if (sJson?.data) {
          setConnectionStatus(sJson.data.status || 'DISCONNECTED');
          setIsReady(Boolean(sJson.data.isReady));
          setStatusMessage(sJson.data.message || '');
        }
      }

      if (logsRes.status === 'fulfilled' && logsRes.value?.ok) {
        const lJson = await logsRes.value.json();
        if (lJson?.success && Array.isArray(lJson.data)) {
          setLogs(lJson.data);
        }
      }

      if (patientsRes.status === 'fulfilled' && patientsRes.value?.ok) {
        const pJson = await patientsRes.value.json();
        const pList = Array.isArray(pJson) ? pJson : (pJson?.data || []);
        if (Array.isArray(pList)) {
          setPatients(pList);
        }
      }

      if (groupsRes.status === 'fulfilled' && groupsRes.value?.ok) {
        const gJson = await groupsRes.value.json();
        if (gJson?.success && Array.isArray(gJson.data)) {
          setWaGroups(gJson.data);
        }
      }
    } catch (err) {
      console.error('Error loading SMS & WhatsApp chat data:', err);
    } finally {
      if (!isBackground) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    // Proactively ensure tenant session is restored from persistent auth state
    fetchApi('/settings/whatsapp/ensure-session', { method: 'POST' }).catch(() => {});

    fetchChatData(false);

    // Auto-poll every 5 seconds for live WhatsApp sync
    pollTimerRef.current = setInterval(() => {
      fetchChatData(true);
    }, 5000);

    // Also refresh on window focus
    const handleFocus = () => fetchChatData(true);
    window.addEventListener('focus', handleFocus);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchChatData]);

  // 2. Build indexed conversation threads from received logs, active groups & patients
  const conversationThreads = useMemo(() => {
    const threadMap = new Map();

    // Build map of known group subjects from waGroups
    const groupSubjectMap = new Map();
    waGroups.forEach((g) => {
      if (g.jid && g.subject) {
        groupSubjectMap.set(g.jid, g.subject);
        groupSubjectMap.set(g.jid.split('@')[0], g.subject);
      }
    });

    // Index DB patients by canonical phone AND last 10 digits for accurate lookup
    const patientByPhoneMap = new Map();
    patients.forEach((p) => {
      const pPhone = p.phone || p.contact_number || p.mobile;
      if (!pPhone) return;
      const canonicalKey = normalizeWhatsAppPhone(pPhone);
      const digits10 = String(pPhone).replace(/\D/g, '').slice(-10);
      if (canonicalKey) patientByPhoneMap.set(canonicalKey, p);
      if (digits10.length === 10) patientByPhoneMap.set(digits10, p);
    });

    // Process all WhatsApp logs (Both INBOUND received & OUTBOUND sent)
    logs.forEach((log) => {
      const rawPhone = String(log.recipientPhone || log.recipient_phone || '').trim();
      if (!rawPhone) return;

      const recipientType = String(log.recipientType || log.recipient_type || '').toUpperCase();
      const statusVal = String(log.status || '').toUpperCase();
      const eventType = String(log.eventType || log.event_type || '').toUpperCase();
      const isSystem = recipientType === 'SYSTEM' || eventType === 'WHATSAPP_ACTIVATED';
      if (isSystem) return;

      const cleanDigits = rawPhone.replace(/\D/g, '');
      const isGroup = 
        log.isGroup === true ||
        rawPhone.includes('@g.us') || 
        recipientType.includes('GROUP') || 
        eventType.includes('GROUP') ||
        cleanDigits.startsWith('120363') ||
        groupSubjectMap.has(rawPhone);

      // Canonical Thread Identity: Every WhatsApp contact maps to ONE canonical key
      const groupKey = getCanonicalChatKey(rawPhone, isGroup);
      if (!groupKey) return;

      // Determine sender direction
      const isInbound = recipientType.includes('INBOUND') || statusVal === 'RECEIVED' || eventType.includes('_IN') || recipientType === 'GROUP_INBOUND';
      const sender = isInbound ? 'them' : 'me';

      const dateStr = log.createdAt || log.created_at || new Date().toISOString();
      const rawMsg = log.messageBody || log.message_body || '';

      // Parse sender name & body for group messages
      let participantName = null;
      let textBody = rawMsg;
      if (isGroup) {
        if (!isInbound) {
          participantName = 'Clinic Staff (You)';
        } else {
          const match = rawMsg && typeof rawMsg === 'string' ? rawMsg.match(/^\[(.*?)\]:\s*([\s\S]*)$/) : null;
          if (match) {
            participantName = match[1];
            textBody = match[2];
          } else {
            participantName = log.recipientName || 'Group Member';
          }
        }
      }

      if (!threadMap.has(groupKey)) {
        let displayName = '';
        let isRegisteredPatient = false;
        let patientId = null;
        let initials = 'CO';
        let phoneFormatted = '';

        if (isGroup) {
          const baseJid = groupKey.split('@')[0];
          const fetchedSubject = groupSubjectMap.get(groupKey) || 
                                 groupSubjectMap.get(baseJid) || 
                                 log.groupSubject ||
                                 (log.recipientName && log.recipientName.includes('Group') ? log.recipientName : null);
          displayName = fetchedSubject || `WhatsApp Group (${baseJid.slice(-6)})`;
          initials = '👥';
          phoneFormatted = 'WhatsApp Group Chat';
        } else {
          // 1. Try finding matching patient in DB (by canonical groupKey or last 10 digits)
          const matchedPatient = patientByPhoneMap.get(groupKey) || patientByPhoneMap.get(groupKey.replace(/\D/g, '').slice(-10));
          if (matchedPatient) {
            displayName = getPatientFullName(matchedPatient);
            isRegisteredPatient = true;
            patientId = matchedPatient.id;
          } else {
            // 2. Try contact name from WhatsApp log
            const rawName = log.recipientName || log.recipient_name;
            if (rawName && rawName !== 'WhatsApp Contact' && rawName !== 'Clinic Staff' && !rawName.startsWith('+') && rawName !== rawPhone) {
              displayName = rawName;
            } else {
              displayName = formatPhoneDisplay(groupKey) || rawPhone;
            }
          }
          initials = displayName
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'CO';
          phoneFormatted = formatPhoneDisplay(groupKey) || rawPhone;
        }

        threadMap.set(groupKey, {
          key: groupKey,
          rawPhone: isGroup ? groupKey : (rawPhone.startsWith('+') ? rawPhone : groupKey),
          name: displayName,
          initials,
          isGroup,
          isRegisteredPatient,
          patientId,
          phoneFormatted,
          unreadCount: 0,
          hasReceivedMessages: false,
          lastMsgTime: null,
          lastMsgText: '',
          lastSenderName: null,
          participantsCount: 0,
          seenIds: new Set(),
          messages: []
        });
      }

      const thread = threadMap.get(groupKey);

      // Enhance group name if better subject is found later
      if (isGroup) {
        const betterSubject = groupSubjectMap.get(groupKey) || log.groupSubject;
        if (betterSubject) {
          thread.name = betterSubject;
        }
      } else if (!isGroup && (thread.name.startsWith('+') || thread.name === thread.rawPhone || thread.name === 'WhatsApp Contact')) {
        const matchedPatient = patientByPhoneMap.get(groupKey) || patientByPhoneMap.get(groupKey.replace(/\D/g, '').slice(-10));
        if (matchedPatient) {
          thread.name = getPatientFullName(matchedPatient);
          thread.isRegisteredPatient = true;
          thread.patientId = matchedPatient.id;
          thread.initials = thread.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'PT';
        } else {
          const rawName = log.recipientName || log.recipient_name;
          if (rawName && !rawName.startsWith('+') && rawName !== rawPhone) {
            thread.name = rawName;
            thread.initials = thread.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'CO';
          }
        }
      }

      // Update thread stats
      if (isInbound) {
        thread.hasReceivedMessages = true;
      }

      // Prevent duplicate messages within the same thread (stable providerMessageId takes precedence)
      const providerId = log.providerMessageId || log.provider_message_id;
      const isDuplicate = 
        (providerId && thread.seenIds.has(String(providerId))) ||
        (log.id && thread.seenIds.has(String(log.id)));

      if (isDuplicate) {
        return;
      }
      if (providerId) thread.seenIds.add(String(providerId));
      if (log.id) thread.seenIds.add(String(log.id));

      // If this confirmed server message matches a recent optimistic message, supersede it
      if (log.id && !String(log.id).startsWith('opt-') && sender === 'me') {
        const optIdx = thread.messages.findIndex(
          (m) => String(m.id).startsWith('opt-') && m.text === textBody && Math.abs(m.rawDate - new Date(dateStr).getTime()) < 30000
        );
        if (optIdx !== -1) {
          thread.messages.splice(optIdx, 1);
        }
      }

      // Add message
      thread.messages.push({
        id: log.id,
        text: textBody,
        rawText: rawMsg,
        participantName,
        sender,
        isGroup,
        time: formatBubbleTime(dateStr),
        fullTime: formatThreadTime(dateStr),
        dateSeparator: formatDateSeparator(dateStr),
        rawDate: new Date(dateStr).getTime() || 0,
        status: statusVal.toLowerCase() || (isInbound ? 'received' : 'sent'),
        messageBody: textBody,
        error: log.error || log.failureReason || log.failure_reason || null
      });
    });

    // Also include active participating groups from Baileys if they don't have logs yet
    waGroups.forEach((g) => {
      const gJid = g.jid || `${g.id}@g.us`;
      const normalizedKey = getCanonicalChatKey(gJid, true);

      if (!threadMap.has(normalizedKey)) {
        const baseJid = normalizedKey.split('@')[0];
        threadMap.set(normalizedKey, {
          key: normalizedKey,
          rawPhone: normalizedKey,
          name: g.subject || `WhatsApp Group (${baseJid.slice(-6)})`,
          initials: '👥',
          isGroup: true,
          isRegisteredPatient: false,
          patientId: null,
          phoneFormatted: 'WhatsApp Group Chat',
          unreadCount: 0,
          hasReceivedMessages: false,
          lastMsgTime: null,
          lastMsgText: 'Active WhatsApp Group',
          lastSenderName: null,
          participantsCount: g.participantsCount || 0,
          seenIds: new Set(),
          messages: []
        });
      } else {
        const existing = threadMap.get(normalizedKey);
        if (g.subject) existing.name = g.subject;
        if (g.participantsCount) existing.participantsCount = g.participantsCount;
      }
    });

    // Also include any patients who haven't messaged yet, so user can initiate chat
    patients.forEach((p) => {
      const pPhone = p.phone || p.contact_number || p.mobile;
      if (!pPhone) return;
      const groupKey = normalizeWhatsAppPhone(pPhone);
      if (!groupKey) return;

      if (!threadMap.has(groupKey)) {
        const pFullName = getPatientFullName(p);
        const initials = pFullName
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'PT';

        threadMap.set(groupKey, {
          key: groupKey,
          rawPhone: p.phone || groupKey,
          name: pFullName,
          initials,
          isGroup: false,
          isRegisteredPatient: true,
          patientId: p.id,
          phoneFormatted: formatPhoneDisplay(groupKey),
          unreadCount: 0,
          hasReceivedMessages: false,
          lastMsgTime: p.createdAt || p.created_at || null,
          lastMsgText: 'Start conversation with patient...',
          lastSenderName: null,
          seenIds: new Set(),
          messages: []
        });
      }
    });

    // Sort messages inside each thread chronologically (oldest to newest) & calculate unread status
    const threadList = Array.from(threadMap.values()).map((t) => {
      t.messages.sort((a, b) => a.rawDate - b.rawDate);
      if (t.messages.length > 0) {
        const last = t.messages[t.messages.length - 1];
        t.lastMsgText = last.text;
        t.lastSenderName = last.participantName;
        t.lastMsgTime = last.fullTime;
        t.lastMsgSender = last.sender;
      }

      // Calculate actual unread status:
      // Only unread if there are inbound messages received after the user last opened this chat,
      // AND this thread is not currently active on screen.
      const lastReadTime = readTimestamps[t.key] || 0;
      const inboundMessages = t.messages.filter((m) => m.sender === 'them');
      const unreadMessages = inboundMessages.filter((m) => m.rawDate > lastReadTime);
      const isCurrentlySelected = selectedChatKey === t.key;

      t.isUnread = !isCurrentlySelected && unreadMessages.length > 0;
      t.unreadCount = isCurrentlySelected ? 0 : unreadMessages.length;

      return t;
    });

    // Sort threads: Threads with most recent messages first
    threadList.sort((a, b) => {
      const timeA = a.messages.length > 0 ? a.messages[a.messages.length - 1].rawDate : 0;
      const timeB = b.messages.length > 0 ? b.messages[b.messages.length - 1].rawDate : 0;
      return timeB - timeA;
    });

    return threadList;
  }, [logs, patients, waGroups, readTimestamps, selectedChatKey]);

  // When selectedChatKey changes or new messages arrive in active chat, mark it as read
  useEffect(() => {
    if (selectedChatKey) {
      markThreadAsRead(selectedChatKey);
    }
  }, [selectedChatKey, logs.length, markThreadAsRead]);

  // Set default selected chat if none selected
  useEffect(() => {
    if (!selectedChatKey && conversationThreads.length > 0) {
      // Prioritize threads that have received inbound messages
      const receivedThread = conversationThreads.find((t) => t.hasReceivedMessages);
      setSelectedChatKey(receivedThread ? receivedThread.key : conversationThreads[0].key);
    }
  }, [conversationThreads, selectedChatKey]);

  // Active selected thread — must be defined before effects that use it
  const activeThread = useMemo(() => {
    return conversationThreads.find((t) => t.key === selectedChatKey) || conversationThreads[0] || null;
  }, [conversationThreads, selectedChatKey]);

  // Lazily fetch profile pictures for visible threads
  useEffect(() => {
    conversationThreads.slice(0, 20).forEach((thread) => {
      if (!thread.isGroup && thread.rawPhone) {
        fetchProfilePic(thread.rawPhone);
      } else if (thread.isGroup && thread.key) {
        fetchProfilePic(thread.key);
      }
    });
  }, [conversationThreads, fetchProfilePic]);

  // Fetch profile pic for active thread immediately
  useEffect(() => {
    if (activeThread) {
      const picKey = activeThread.isGroup ? activeThread.key : activeThread.rawPhone;
      if (picKey) fetchProfilePic(picKey);
    }
  }, [activeThread?.key, fetchProfilePic]);

  // Smart WhatsApp-like auto-scroll
  const isNearBottomRef = useRef(true);
  const handleChatScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 150;
  };

  const prevChatKeyRef = useRef(selectedChatKey);
  useEffect(() => {
    if (!scrollRef.current) return;
    const chatChanged = prevChatKeyRef.current !== selectedChatKey;
    prevChatKeyRef.current = selectedChatKey;

    if (chatChanged || isNearBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedChatKey, logs.length]);

  // Filter threads by search and tabs
  const filteredThreads = useMemo(() => {
    let list = conversationThreads;

    if (activeFilter === 'UNREAD') {
      list = list.filter((t) => t.isUnread);
    } else if (activeFilter === 'PATIENTS') {
      list = list.filter((t) => t.isRegisteredPatient && !t.isGroup);
    } else if (activeFilter === 'GROUPS') {
      list = list.filter((t) => t.isGroup);
    }

    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, '');
    const qNorm = normalizeWhatsAppPhone(q);

    return list.filter((t) => {
      const nameMatch = t.name && t.name.toLowerCase().includes(q);
      const msgMatch = t.lastMsgText && t.lastMsgText.toLowerCase().includes(q);
      const phoneMatch = 
        (t.phoneFormatted && t.phoneFormatted.toLowerCase().includes(q)) ||
        (t.rawPhone && String(t.rawPhone).toLowerCase().includes(q)) ||
        (t.key && String(t.key).toLowerCase().includes(q)) ||
        (qDigits && t.key && t.key.replace(/\D/g, '').includes(qDigits)) ||
        (qNorm && t.key === qNorm);

      return nameMatch || msgMatch || phoneMatch;
    });
  }, [conversationThreads, activeFilter, searchTerm]);

  // Disconnect / Logout WhatsApp Session for Tenant
  const handleWhatsAppLogout = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetchApi('/settings/whatsapp/disconnect', { method: 'POST' });
      const data = await res?.json?.();
      if (res?.ok && data?.success) {
        setConnectionStatus('DISCONNECTED');
        setIsReady(false);
        setShowDisconnectModal(false);
        showToast('WhatsApp logged out successfully', 'success');
        fetchChatData(false);
      } else {
        showToast(data?.message || 'Failed to logout WhatsApp', 'error');
      }
    } catch (_) {
      showToast('Network error while logging out WhatsApp', 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Retry a failed message
  const handleRetryMessage = (failedMsg) => {
    const textToRetry = failedMsg?.text || failedMsg?.messageBody || '';
    if (!textToRetry) return;
    setMessageText(textToRetry);
    // Remove the failed optimistic item so it can be cleanly re-sent
    setLogs((prev) => prev.filter((l) => l.id !== failedMsg.id));
  };

  // Send Reply / New Message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeThread) return;
    const isGroup = activeThread.isGroup;
    const sendingPhone = isGroup 
      ? activeThread.key 
      : normalizeWhatsAppPhone(activeThread.rawPhone || activeThread.key);

    if (!sendingPhone || (sendingPhone.length < 7 && !isGroup)) {
      showToast('Recipient has no valid phone number or group linked.', 'error');
      return;
    }

    if (connectionStatus === 'DISCONNECTED') {
      showToast('WhatsApp is offline. Please link your phone in Settings before sending.', 'error');
      return;
    }

    const sendingBody = messageText.trim();
    setMessageText('');
    setIsSending(true);

    // Optimistically add message with SENDING state (never fake SENT before confirmation)
    const optimisticMsgId = `opt-${Date.now()}`;
    const optimisticLog = {
      id: optimisticMsgId,
      recipientPhone: sendingPhone,
      recipient_phone: sendingPhone,
      recipientName: activeThread.name,
      recipient_name: activeThread.name,
      recipientType: isGroup ? 'GROUP_OUTBOUND' : 'OUTBOUND',
      recipient_type: isGroup ? 'GROUP_OUTBOUND' : 'OUTBOUND',
      eventType: isGroup ? 'WHATSAPP_GROUP_CHAT' : 'WHATSAPP_CHAT_OUT',
      event_type: isGroup ? 'WHATSAPP_GROUP_CHAT' : 'WHATSAPP_CHAT_OUT',
      messageBody: sendingBody,
      message_body: sendingBody,
      status: 'SENDING',
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      isGroup
    };

    setLogs((prev) => [...prev, optimisticLog]);

    try {
      const res = await fetchApi('/settings/whatsapp/send', {
        method: 'POST',
        body: JSON.stringify({
          recipientPhone: sendingPhone,
          recipientName: activeThread.name,
          recipientType: isGroup ? 'GROUP_OUTBOUND' : (activeThread.isRegisteredPatient ? 'PATIENT' : 'OUTBOUND'),
          eventType: isGroup ? 'WHATSAPP_GROUP_CHAT' : 'WHATSAPP_CHAT_OUT',
          message: sendingBody
        })
      });

      const data = await res?.json?.();
      if (res?.ok && data?.success) {
        showToast(`Message sent to ${activeThread.name}!`, 'success');
        // Update optimistic item to SENT with real provider messageId
        const realId = data.data?.messageId || data.data?.log?.provider_message_id || `sent-${Date.now()}`;
        setLogs((prev) => prev.map((l) => l.id === optimisticMsgId ? { ...l, status: 'SENT', id: realId } : l));
        // Instantly refresh logs in background without full reloading
        fetchChatData(true);
      } else {
        const errMsg = data?.message || 'Failed to dispatch message. WhatsApp is offline or reconnecting.';
        showToast(errMsg, 'error');
        // Mark optimistic message as failed with error details
        setLogs((prev) => prev.map((l) => l.id === optimisticMsgId ? { ...l, status: 'FAILED', error: errMsg } : l));
      }
    } catch (err) {
      showToast('Network error while dispatching message. Check if backend is running.', 'error');
      setLogs((prev) => prev.map((l) => l.id === optimisticMsgId ? { ...l, status: 'FAILED', error: err.message } : l));
    } finally {
      setIsSending(false);
    }
  };

  const addEmoji = (emoji) => {
    setMessageText((prev) => prev + emoji);
    setIsEmojiOpen(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      showToast(`Attachment "${file.name}" selected. Ready to send.`, 'success');
      setMessageText((prev) => prev ? `${prev} [Attachment: ${file.name}]` : `[Attachment: ${file.name}]`);
    }
  };

  // Helper to render message content with nice WhatsApp formatting
  const renderMessageBubbleContent = (text = '') => {
    if (!text) return null;

    // 1. Document attachment
    if (text.startsWith('📎')) {
      const fileName = text.replace('📎', '').replace('[Document:', '').replace(']', '').trim();
      return (
        <div className="flex items-center gap-3 p-2 bg-black/5 rounded-xl border border-black/10 my-1">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FaFileAlt size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold truncate text-slate-900">{fileName || 'Document'}</div>
            <div className="text-[10px] text-slate-500 font-medium">WhatsApp Document Attachment</div>
          </div>
        </div>
      );
    }

    // 2. Image attachment
    if (text.startsWith('📷')) {
      return (
        <div className="flex items-center gap-2 p-2 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200/60 my-1 font-semibold text-xs">
          <FaImage className="text-emerald-600 shrink-0" size={16} />
          <span>{text.replace('📷', '').trim() || 'Photo Attachment'}</span>
        </div>
      );
    }

    // 3. Audio / Voice note
    if (text.startsWith('🎵')) {
      return (
        <div className="flex items-center gap-3 p-2.5 bg-black/5 rounded-xl border border-black/10 my-1 min-w-[200px]">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <FaMicrophone size={13} />
          </div>
          <div className="flex-1">
            <div className="h-2 bg-emerald-200 rounded-full w-full mb-1">
              <div className="h-full bg-emerald-600 rounded-full w-2/3"></div>
            </div>
            <div className="text-[10px] text-slate-500 font-bold">Voice Message • WhatsApp Audio</div>
          </div>
        </div>
      );
    }

    // 4. URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-semibold break-all inline-flex items-center gap-1"
          >
            <span>{part}</span>
            <FaExternalLinkAlt size={9} />
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center gap-3 bg-[#f0f2f5] rounded-2xl border border-slate-200">
        <div className="w-14 h-14 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-lg animate-bounce">
          <FaWhatsapp size={32} />
        </div>
        <div className="flex items-center gap-2 text-[#00a884] font-black text-sm">
          <FaSyncAlt size={16} className="animate-spin" />
          <span>Connecting to WhatsApp Web...</span>
        </div>
        <p className="text-xs text-slate-500">Syncing live conversations, patient threads & group chats</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-95px)] flex flex-col font-sans bg-[#f0f2f5] p-2 sm:p-3 rounded-2xl shadow-sm border border-slate-200 select-none overflow-hidden">
      
      {/* ── TOP STATUS / CLINIC BAR ── */}
      <div className={`px-4 py-2 rounded-t-xl flex items-center justify-between shadow-xs transition-colors ${
        connectionStatus === 'CONNECTED' && isReady
          ? 'bg-[#00a884] text-white'
          : connectionStatus === 'CONNECTED' && !isReady
          ? 'bg-amber-600 text-white'
          : 'bg-slate-700 text-white'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <FaWhatsapp size={18} />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-black tracking-wide flex items-center gap-1.5">
              <span>WhatsApp Web Console</span>
              {connectionStatus === 'CONNECTED' && isReady ? (
                <span className="text-[10px] bg-white/20 px-2 py-0.2 rounded-full font-bold">Live 2-Way Sync</span>
              ) : connectionStatus === 'CONNECTED' && !isReady ? (
                <span className="text-[10px] bg-black/25 px-2 py-0.2 rounded-full font-bold animate-pulse">🔄 Restoring Connection...</span>
              ) : connectionStatus === 'CHECKING' ? (
                <span className="text-[10px] bg-black/25 px-2 py-0.2 rounded-full font-bold">Checking WhatsApp Status...</span>
              ) : (
                <span className="text-[10px] bg-black/25 px-2 py-0.2 rounded-full font-bold">⚠️ Scan QR to Link Phone</span>
              )}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          {connectionStatus === 'CHECKING' ? (
            <div className="flex items-center gap-1.5 bg-black/15 px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <FaSyncAlt size={10} className="animate-spin" />
              <span>Connecting...</span>
            </div>
          ) : connectionStatus === 'CONNECTED' ? (
            <>
              {isReady ? (
                <div className="hidden sm:flex items-center gap-1.5 bg-black/15 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#25d366] animate-pulse"></span>
                  <span>Online & Ready</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-black/25 px-2.5 py-1 rounded-full text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-ping"></span>
                  <span>Reconnecting Session...</span>
                </div>
              )}

              {/* WhatsApp Logout / Disconnect Button */}
              <button
                type="button"
                onClick={() => setShowDisconnectModal(true)}
                className="bg-white/20 hover:bg-rose-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                title="Logout WhatsApp Session"
              >
                <FaSignOutAlt size={11} />
                <span>Logout WhatsApp</span>
              </button>
            </>
          ) : (
            <a
              href="/settings/whatsapp"
              className="bg-white text-slate-800 hover:bg-slate-50 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 shadow-xs transition-transform active:scale-95"
            >
              <span>Scan QR Code</span>
              <FaExternalLinkAlt size={10} />
            </a>
          )}

          <button
            type="button"
            onClick={() => fetchChatData(false)}
            disabled={isRefreshing}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
            title="Force refresh chats"
          >
            <FaSyncAlt size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── MAIN WHATSAPP CONTAINER (SIDEBAR + CHAT AREA) ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white rounded-b-xl border-x border-b border-slate-200/80 shadow-md">
        
        {/* ── LEFT SIDEBAR: CONVERSATION THREADS ── */}
        <div className="w-full lg:w-[380px] flex flex-col bg-white border-r border-slate-200 h-full shrink-0">
          
          {/* Sidebar Top Controls Header */}
          <div className="p-3 bg-[#f0f2f5] border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#00a884] text-white flex items-center justify-center font-black text-sm shadow-xs">
                <FaComments size={16} />
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-800">Chats & Groups</h2>
                <p className="text-[10px] text-slate-500 font-semibold">{conversationThreads.length} total active threads</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsNewChatModalOpen(true)}
              className="px-3 py-1.5 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
            >
              <FaPlus size={10} />
              <span>New Chat</span>
            </button>
          </div>

          {/* Search Box in WhatsApp Web Style */}
          <div className="p-2.5 bg-white border-b border-slate-100">
            <div className="relative flex items-center bg-[#f0f2f5] rounded-xl px-3 py-1.5 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00a884]/30 border border-transparent focus-within:border-[#00a884] transition-all">
              <FaSearch className="text-slate-400 mr-2 shrink-0" size={13} />
              <input
                type="text"
                placeholder="Search or start new chat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs font-medium text-slate-800 placeholder:text-slate-400"
              />
              {searchTerm && (
                <button 
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <FaTimes size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs (All / Unread / Patients / Groups) */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-slate-100 overflow-x-auto text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-[#e7f8f5] text-[#00a884] font-black border border-[#00a884]/30'
                  : 'bg-[#f0f2f5] text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({conversationThreads.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('UNREAD')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'UNREAD'
                  ? 'bg-[#e7f8f5] text-[#00a884] font-black border border-[#00a884]/30'
                  : 'bg-[#f0f2f5] text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Unread</span>
              {conversationThreads.filter((t) => t.isUnread).length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#25d366] text-white flex items-center justify-center text-[9px] font-black">
                  {conversationThreads.filter((t) => t.isUnread).length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('PATIENTS')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                activeFilter === 'PATIENTS'
                  ? 'bg-[#e7f8f5] text-[#00a884] font-black border border-[#00a884]/30'
                  : 'bg-[#f0f2f5] text-slate-600 hover:bg-slate-200'
              }`}
            >
              Patients
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('GROUPS')}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                activeFilter === 'GROUPS'
                  ? 'bg-[#e7f8f5] text-[#00a884] font-black border border-[#00a884]/30'
                  : 'bg-[#f0f2f5] text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Groups</span>
              <span className="text-[10px] text-slate-400">
                ({conversationThreads.filter((t) => t.isGroup).length})
              </span>
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 custom-scrollbar bg-white">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
                  <FaInbox size={22} />
                </div>
                <p className="text-xs font-bold text-slate-700">No conversations found</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Incoming WhatsApp messages and patient threads will automatically appear here.
                </p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = selectedChatKey === thread.key;
                const isGroup = thread.isGroup;
                const picKey = isGroup ? thread.key : thread.rawPhone;
                const picUrl = profilePics[picKey];

                return (
                  <div
                    key={thread.key}
                    onClick={() => setSelectedChatKey(thread.key)}
                    className={`px-3 py-3 cursor-pointer transition-colors flex items-center gap-3 relative ${
                      isSelected
                        ? 'bg-[#f0f2f5] border-l-4 border-l-[#00a884]'
                        : 'hover:bg-[#f5f6f6] bg-white'
                    }`}
                  >
                    {/* WhatsApp Round Circular Avatar */}
                    <div className="relative shrink-0">
                      {picUrl ? (
                        <img
                          src={picUrl}
                          alt={thread.name}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      
                      <div
                        style={{ display: picUrl ? 'none' : 'flex' }}
                        className={`w-12 h-12 rounded-full items-center justify-center font-bold text-xs text-white shadow-2xs ${
                          isGroup ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' : getAvatarColor(thread.name)
                        }`}
                      >
                        {isGroup ? <FaUsers size={18} /> : thread.initials}
                      </div>

                      {/* Online indicator or Group icon */}
                      {thread.isUnread && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#25d366] border-2 border-white rounded-full" title="Unread Message"></span>
                      )}
                    </div>

                    {/* Chat Text Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h3 className={`text-xs truncate ${thread.isUnread ? 'text-slate-950 font-black' : isSelected ? 'text-slate-900 font-bold' : 'text-slate-800 font-medium'}`}>
                          {thread.name}
                        </h3>
                        <span className={`text-[10px] shrink-0 font-medium ${thread.isUnread ? 'text-[#00a884] font-bold' : 'text-slate-400'}`}>
                          {thread.lastMsgTime}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 min-w-0 text-[11px] text-slate-500 truncate">
                          {/* Sent status double checkmark in WhatsApp blue */}
                          {thread.lastMsgSender === 'me' && (
                            <FaCheckDouble size={11} className="text-[#53bdeb] shrink-0" />
                          )}
                          {isGroup && thread.lastSenderName && (
                            <span className="font-bold text-slate-700 shrink-0">
                              {thread.lastSenderName}:
                            </span>
                          )}
                          <span className={`truncate ${thread.isUnread ? 'font-bold text-slate-900' : ''}`}>{thread.lastMsgText || 'Tap to chat'}</span>
                        </div>

                        {/* Unread badge */}
                        {thread.isUnread && (
                          <span className="w-5 h-5 rounded-full bg-[#25d366] text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT MAIN: WHATSAPP CHAT WINDOW ── */}
        <div className="flex-1 flex flex-col h-full bg-[#efeae2] relative overflow-hidden">
          
          {activeThread ? (
            <>
              {/* WhatsApp Chat Top Header */}
              <div className="px-4 py-2.5 bg-[#f0f2f5] border-b border-slate-200 flex items-center justify-between shadow-xs z-10">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {(() => {
                      const picKey = activeThread.isGroup ? activeThread.key : activeThread.rawPhone;
                      const picUrl = profilePics[picKey];
                      return picUrl ? (
                        <img
                          src={picUrl}
                          alt={activeThread.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null;
                    })()}
                    
                    <div
                      style={{ display: profilePics[activeThread.isGroup ? activeThread.key : activeThread.rawPhone] ? 'none' : 'flex' }}
                      className={`w-10 h-10 rounded-full items-center justify-center font-black text-xs text-white shadow-2xs ${
                        activeThread.isGroup ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' : getAvatarColor(activeThread.name)
                      }`}
                    >
                      {activeThread.isGroup ? <FaUsers size={16} /> : activeThread.initials}
                    </div>
                  </div>

                  {/* Header Title & Subtitle */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-slate-900 truncate">
                        {activeThread.name}
                      </h2>
                      {activeThread.isGroup ? (
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                          <FaUsers size={9} /> Group
                        </span>
                      ) : activeThread.isRegisteredPatient ? (
                        <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Patient #{activeThread.patientId}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#25d366] shrink-0"></span>
                      <span className="truncate">
                        {activeThread.isGroup
                          ? (activeThread.participantsCount ? `${activeThread.participantsCount} participants` : 'WhatsApp Group Chat')
                          : `WhatsApp • ${activeThread.phoneFormatted || 'Online'}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                  {!activeThread.isGroup && activeThread.rawPhone && (
                    <a
                      href={`tel:${activeThread.rawPhone}`}
                      title="Direct Call"
                      className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    >
                      <FaPhoneAlt size={11} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => fetchChatData(true)}
                    title="Live Sync"
                    className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-[#00a884] border border-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  >
                    <FaSyncAlt size={11} className={isRefreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* WhatsApp Messages Feed with Pattern Background */}
              <div
                ref={scrollRef}
                onScroll={handleChatScroll}
                className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar relative"
                style={{
                  backgroundImage: `radial-gradient(#00a884 0.4px, transparent 0.4px), radial-gradient(#128c7e 0.4px, #efeae2 0.4px)`,
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 8px 8px'
                }}
              >
                {/* Security encryption banner */}
                <div className="flex justify-center my-1">
                  <div className="px-3 py-1 bg-[#ffeecd] border border-[#ffdda4] rounded-lg text-[10px] font-semibold text-[#66542d] shadow-2xs text-center max-w-sm flex items-center justify-center gap-1">
                    <span>🔒</span>
                    <span>Messages are synced live with WhatsApp Baileys engine.</span>
                  </div>
                </div>

                {activeThread.messages.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-white/80 shadow-xs flex items-center justify-center mx-auto text-[#00a884]">
                      <FaComments size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-700">No Messages Yet</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      Send a message below to start chatting with {activeThread.name} on WhatsApp.
                    </p>
                  </div>
                ) : (
                  activeThread.messages.map((msg, index) => {
                    const isMe = msg.sender === 'me';
                    const isGroupMsg = activeThread.isGroup;
                    const participantName = msg.participantName || (isGroupMsg && !isMe ? 'Group Member' : null);
                    const showDateSeparator = index === 0 || activeThread.messages[index - 1].dateSeparator !== msg.dateSeparator;

                    return (
                      <React.Fragment key={msg.id || index}>
                        {/* Date Separator Pill (WhatsApp style) */}
                        {showDateSeparator && (
                          <div className="flex justify-center my-2">
                            <span className="px-3 py-0.5 bg-white/90 backdrop-blur-xs text-slate-600 border border-slate-200/80 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                              {msg.dateSeparator}
                            </span>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-1`}>
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] p-2.5 sm:p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs whitespace-pre-wrap break-words relative ${
                              isMe
                                ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-xs border border-[#c1f5b8]'
                                : 'bg-white text-slate-900 rounded-tl-xs border border-slate-200/80'
                            }`}
                          >
                            {/* Group sender name in colorful text (like WhatsApp) */}
                            {isGroupMsg && !isMe && participantName && (
                              <div className={`text-[11px] font-black mb-1 ${getParticipantColor(participantName)} flex items-center gap-1`}>
                                <span>~ {participantName}</span>
                              </div>
                            )}

                            {/* Body Content */}
                            <div>
                              {renderMessageBubbleContent(msg.text)}
                            </div>

                            {/* Time and status indicators */}
                            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 font-medium select-none">
                              <span>{msg.time}</span>
                              {isMe && (
                                msg.status === 'failed' ? (
                                  <span className="text-red-500 flex items-center gap-1 font-bold" title={msg.error || "Failed to send"}>
                                    <FaTimes size={10} /> Failed
                                    <button
                                      type="button"
                                      onClick={() => handleRetryMessage(msg)}
                                      className="ml-1 text-[10px] underline hover:text-red-700 cursor-pointer"
                                      title="Retry sending"
                                    >
                                      Retry
                                    </button>
                                  </span>
                                ) : (msg.status === 'pending' || msg.status === 'sending' || (msg.id && String(msg.id).startsWith('opt-'))) ? (
                                  <span className="text-slate-400 flex items-center gap-0.5" title="Sending...">
                                    <FaRegClock size={10} className="animate-spin text-amber-500" />
                                    <span>Sending...</span>
                                  </span>
                                ) : (
                                  <FaCheckDouble size={11} className="text-[#53bdeb]" title="Delivered via WhatsApp" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
              </div>

              {/* Quick Clinic Response Strip */}
              <div className="px-3 py-1.5 bg-[#f0f2f5] border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                  Quick Reply:
                </span>
                <button
                  type="button"
                  onClick={() => setMessageText('Hello! This is a reminder for your upcoming physiotherapy appointment at DeePhysio Clinic.')}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shrink-0 transition-colors cursor-pointer shadow-2xs"
                >
                  📅 Appointment Reminder
                </button>
                <button
                  type="button"
                  onClick={() => setMessageText('Hello! Your home exercise program has been updated. Please follow the prescribed steps.')}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shrink-0 transition-colors cursor-pointer shadow-2xs"
                >
                  🏋️ Home Exercises
                </button>
                <button
                  type="button"
                  onClick={() => setMessageText('Thank you for visiting DeePhysio. How are you feeling today? Please let us know if you have any questions.')}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 shrink-0 transition-colors cursor-pointer shadow-2xs"
                >
                  🏥 Follow-up
                </button>
              </div>

              {/* WhatsApp Web Composer Bar */}
              <div className="p-2 sm:p-3 bg-[#f0f2f5] border-t border-slate-200 relative">
                
                {connectionStatus === 'CONNECTED' && !isReady && (
                  <div className="mb-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FaSyncAlt size={11} className="animate-spin text-amber-700" />
                      <span>WhatsApp session is reconnecting in the background. Sending will be ready in seconds...</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => fetchChatData(false)}
                      className="text-[11px] font-bold underline hover:text-amber-950 cursor-pointer ml-2"
                    >
                      Check
                    </button>
                  </div>
                )}

                {/* Emoji Popover */}
                {isEmojiOpen && (
                  <div className="absolute bottom-16 left-3 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 grid grid-cols-5 sm:grid-cols-10 gap-2 z-50 animate-in slide-in-from-bottom-2">
                    {emojiCategories.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => addEmoji(e)}
                        className="text-xl hover:scale-125 transition-transform p-1.5 cursor-pointer rounded-lg hover:bg-slate-100"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Input Container */}
                <div className="flex items-center gap-2">
                  
                  {/* Emoji Button */}
                  <button
                    type="button"
                    onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                    className="w-10 h-10 rounded-full text-slate-500 hover:text-[#00a884] hover:bg-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Choose emoji"
                  >
                    <FaRegSmile size={20} />
                  </button>

                  {/* Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      selectedFile ? 'text-[#00a884] bg-white shadow-2xs' : 'text-slate-500 hover:text-[#00a884] hover:bg-white'
                    }`}
                    title="Attach document or media"
                  >
                    <FaPaperclip size={18} />
                  </button>

                  {/* Text Input Box (WhatsApp Web rounded style) */}
                  <div className="flex-1 bg-white rounded-xl px-4 py-2 border border-slate-200 focus-within:border-[#00a884] focus-within:ring-2 focus-within:ring-[#00a884]/20 transition-all flex items-center">
                    <input
                      type="text"
                      placeholder={
                        connectionStatus !== 'CONNECTED'
                          ? 'WhatsApp offline. Link phone in Settings to message.'
                          : !isReady
                          ? 'Reconnecting session... please wait'
                          : (activeThread.isGroup ? `Message ${activeThread.name}...` : `Type a message...`)
                      }
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!isSending && messageText.trim() && connectionStatus === 'CONNECTED' && isReady) {
                            handleSendMessage();
                          }
                        }
                      }}
                      className="w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  {/* WhatsApp Circular Green Send Button */}
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={isSending || !messageText.trim() || connectionStatus !== 'CONNECTED' || !isReady}
                    className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
                    title={
                      connectionStatus !== 'CONNECTED'
                        ? 'WhatsApp not connected. Scan QR in Settings.'
                        : !isReady
                        ? 'WhatsApp session is restoring. Please wait a moment...'
                        : 'Send message'
                    }
                  >
                    {isSending ? (
                      <FaSyncAlt size={14} className="animate-spin" />
                    ) : (
                      <FaPaperPlane size={14} className="ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-white shadow-xs flex items-center justify-center text-[#00a884] mb-3">
                <FaWhatsapp size={36} />
              </div>
              <h2 className="text-sm font-black text-slate-800">WhatsApp for DeePhysio Clinic</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
                Select a conversation from the left sidebar to start messaging patients or WhatsApp groups in real-time.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* ── NEW CHAT MODAL ── */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <FaWhatsapp className="text-[#00a884]" size={18} />
                <span>Start New WhatsApp Chat</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <FaTimes size={14} />
              </button>
            </div>

            {/* Sub-tabs: Patients vs WhatsApp Groups */}
            <div className="flex items-center gap-1 bg-[#f0f2f5] p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setNewChatTab('PATIENTS')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  newChatTab === 'PATIENTS'
                    ? 'bg-white text-[#00a884] shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FaUser size={11} />
                <span>Patients ({patients.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setNewChatTab('GROUPS')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  newChatTab === 'GROUPS'
                    ? 'bg-white text-indigo-700 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FaUsers size={12} />
                <span>WhatsApp Groups ({conversationThreads.filter((t) => t.isGroup).length})</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                type="text"
                autoFocus
                placeholder={newChatTab === 'PATIENTS' ? "Search patient by name or phone..." : "Search group by name..."}
                value={newChatSearchTerm}
                onChange={(e) => setNewChatSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-[#f0f2f5] border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#00a884] focus:bg-white"
              />
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 custom-scrollbar">
              {newChatTab === 'PATIENTS' ? (
                patients
                  .filter((p) => {
                    const fullName = getPatientFullName(p).toLowerCase();
                    const phone = String(p.phone || '').toLowerCase();
                    const q = newChatSearchTerm.toLowerCase();
                    return fullName.includes(q) || phone.includes(q);
                  })
                  .map((p) => {
                    const fullName = getPatientFullName(p);
                    const key = normalizeWhatsAppPhone(p.phone || p.contact_number || p.mobile);

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (key) setSelectedChatKey(key);
                          setIsNewChatModalOpen(false);
                        }}
                        className="p-3 hover:bg-[#e7f8f5] rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs ${getAvatarColor(fullName)}`}>
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-black text-xs text-slate-900">{fullName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {p.phone ? formatPhoneDisplay(p.phone) : 'No phone'}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">MRN #{p.id}</span>
                      </div>
                    );
                  })
              ) : (
                conversationThreads
                  .filter((t) => t.isGroup)
                  .filter((g) => {
                    const q = newChatSearchTerm.toLowerCase();
                    return g.name.toLowerCase().includes(q);
                  })
                  .map((g) => (
                    <div
                      key={g.key}
                      onClick={() => {
                        setSelectedChatKey(g.key);
                        setIsNewChatModalOpen(false);
                      }}
                      className="p-3 hover:bg-indigo-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                          <FaUsers size={12} />
                        </div>
                        <div>
                          <div className="font-black text-xs text-slate-900">{g.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {g.participantsCount ? `${g.participantsCount} participants` : 'WhatsApp Group'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-[#00a884] bg-[#e7f8f5] px-2.5 py-0.5 rounded-full border border-[#00a884]/20">
                        Open Chat
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── WHATSAPP LOGOUT CONFIRMATION MODAL ── */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              <FaSignOutAlt />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Logout WhatsApp Account?</h3>
              <p className="text-xs text-slate-500 font-medium">
                This will disconnect your clinic's WhatsApp session. You will need to scan the QR code again to reconnect.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                disabled={isDisconnecting}
                className="flex-1 py-2 px-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWhatsAppLogout}
                disabled={isDisconnecting}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isDisconnecting ? (
                  <>
                    <FaSyncAlt size={11} className="animate-spin" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <FaSignOutAlt size={11} />
                    <span>Confirm Logout</span>
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

export default SMSChat;
