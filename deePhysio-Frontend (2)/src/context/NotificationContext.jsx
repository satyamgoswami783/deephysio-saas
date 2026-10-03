import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { fetchApi } from '../config/api';
import { readAllowedModules } from '../config/modules';

const NotificationContext = createContext();

const formatRelativeTime = (ts) => {
  if (!ts) return 'Just now';
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return 'Just now';
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const getNotificationLink = (meta = {}, actionType = '') => {
  const entity = meta?.entity || '';
  const normalizedEntity = String(entity).toLowerCase();
  if (normalizedEntity === 'appointment') return '/appointments';
  if (normalizedEntity === 'patient') return '/patients';
  if (normalizedEntity === 'invoice' || normalizedEntity === 'payment') return '/billing';
  if (normalizedEntity === 'clinicalnote' || normalizedEntity === 'note') return '/notes';
  if (actionType === 'LOGIN' || actionType === 'UPDATE_SETTINGS') return '/settings';
  return '/';
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState([]);
  const [readMessageIds, setReadMessageIds] = useState([]);
  const [readStateLoaded, setReadStateLoaded] = useState(false);
  const pollingLockRef = useRef(false);

  const getAllowedModules = () => {
    try {
      const role = sessionStorage.getItem('deephysio_role') || 'therapist';
      const user = JSON.parse(sessionStorage.getItem('deephysio_user') || 'null');
      return readAllowedModules(user, role);
    } catch (_) {
      return [];
    }
  };

  const hasModuleAccess = (moduleName) => getAllowedModules().includes(moduleName);

  const getCurrentUserId = () => {
    try {
      const user = JSON.parse(sessionStorage.getItem('deephysio_user') || 'null');
      return user?.id ? Number(user.id) : null;
    } catch (_) {
      return null;
    }
  };

  const getReadStateKey = () => {
    const userId = getCurrentUserId();
    return userId ? `deephysio_notification_reads_user_${userId}` : null;
  };

  const persistReadStateToBackend = async (nextNotifIds, nextMsgIds) => {
    if (!hasModuleAccess('Settings')) return;
    const readKey = getReadStateKey();
    if (!readKey) return;
    try {
      await fetchApi('/settings', {
        method: 'POST',
        body: JSON.stringify({
          settings: {
            [readKey]: {
              notificationIds: nextNotifIds,
              messageIds: nextMsgIds,
              updatedAt: new Date().toISOString()
            }
          }
        })
      });
    } catch (_) {
      // keep silent, local state still works
    }
  };

  useEffect(() => {
    const loadReadState = async () => {
      if (!hasModuleAccess('Settings')) {
        setReadNotificationIds([]);
        setReadMessageIds([]);
        setReadStateLoaded(true);
        return;
      }
      const readKey = getReadStateKey();
      if (!readKey) {
        setReadStateLoaded(true);
        return;
      }
      try {
        const res = await fetchApi(`/settings?keys=${encodeURIComponent(readKey)}`);
        if (res && res.ok) {
          const json = await res.json();
          const payload = json?.data?.[readKey];
          if (payload && typeof payload === 'object') {
            setReadNotificationIds(Array.isArray(payload.notificationIds) ? payload.notificationIds : []);
            setReadMessageIds(Array.isArray(payload.messageIds) ? payload.messageIds : []);
          } else {
            setReadNotificationIds([]);
            setReadMessageIds([]);
          }
        }
      } catch (_) {
        setReadNotificationIds([]);
        setReadMessageIds([]);
      } finally {
        setReadStateLoaded(true);
      }
    };
    loadReadState();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('deephysio_read_notifications', JSON.stringify(readNotificationIds));
  }, [readNotificationIds]);

  useEffect(() => {
    sessionStorage.setItem('deephysio_read_messages', JSON.stringify(readMessageIds));
  }, [readMessageIds]);

  useEffect(() => {
    if (!readStateLoaded) return;
    const loadLiveData = async () => {
      // Prevent overlapping polls when network is slow.
      if (pollingLockRef.current) return;
      pollingLockRef.current = true;
      try {
        const token = sessionStorage.getItem('token');
        if (!token || token === 'null' || token === 'undefined') {
          return;
        }

        const canAccessActivity = hasModuleAccess('Analytics');
        const canAccessComms = hasModuleAccess('Communication');

        // Fire both notification + message fetches in PARALLEL
        const [activityResult, threadsResult] = await Promise.allSettled([
          canAccessActivity
            ? fetchApi('/analytics/activity?limit=20').then(r => r?.ok ? r.json() : null)
            : Promise.resolve(null),
          canAccessComms
            ? fetchApi('/communication/threads').then(r => r?.ok ? r.json() : null)
            : Promise.resolve(null)
        ]);

        // Process activity notifications
        if (!canAccessActivity || activityResult.status !== 'fulfilled' || !activityResult.value) {
          setNotifications([]);
        } else {
          const json = activityResult.value;
          const feed = Array.isArray(json?.systemFeed)
            ? json.systemFeed
            : (Array.isArray(json?.data?.systemFeed) ? json.data.systemFeed : []);
          const mappedNotifications = feed.map((item) => ({
            id: `A-${item.id}`,
            type: String(item.type || 'system').toLowerCase(),
            title: item.type || 'System Activity',
            message: item.patient || item.staff || 'Activity update',
            time: item.time || formatRelativeTime(item.timestamp),
            read: readNotificationIds.includes(`A-${item.id}`),
            link: getNotificationLink(item.meta, item.action),
            timestamp: item.timestamp || null
          }));
          setNotifications(mappedNotifications);
        }

        // Process message threads
        if (!canAccessComms || threadsResult.status !== 'fulfilled' || !threadsResult.value) {
          setMessages([]);
        } else {
          const json = threadsResult.value;
          const threads = Array.isArray(json?.data) ? json.data : [];
          const mappedMessages = threads.map((t) => ({
            id: `T-${t.id}`,
            sender: t.patientName || 'Patient',
            text: t.lastMessage || 'New conversation activity',
            time: formatRelativeTime(t.updatedAt || t.createdAt),
            read: readMessageIds.includes(`T-${t.id}`),
            link: '/communication/sms'
          }));
          setMessages(mappedMessages.slice(0, 20));
        }
      } finally {
        pollingLockRef.current = false;
      }
    };

    loadLiveData();
    const interval = setInterval(loadLiveData, 90000);

    return () => clearInterval(interval);
  }, [readStateLoaded]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const unreadMessagesCount = messages.filter(m => !m.read).length;

  const markNotificationAsRead = (id) => {
    const nextNotifIds = readNotificationIds.includes(id) ? readNotificationIds : [...readNotificationIds, id];
    setReadNotificationIds(nextNotifIds);
    persistReadStateToBackend(nextNotifIds, readMessageIds);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markMessageAsRead = (id) => {
    const nextMsgIds = readMessageIds.includes(id) ? readMessageIds : [...readMessageIds, id];
    setReadMessageIds(nextMsgIds);
    persistReadStateToBackend(readNotificationIds, nextMsgIds);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const markAllNotificationsAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const nextNotifIds = [...new Set([...readNotificationIds, ...allIds])];
    setReadNotificationIds(nextNotifIds);
    persistReadStateToBackend(nextNotifIds, readMessageIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAllMessagesAsRead = () => {
    const allIds = messages.map((m) => m.id);
    const nextMsgIds = [...new Set([...readMessageIds, ...allIds])];
    setReadMessageIds(nextMsgIds);
    persistReadStateToBackend(readNotificationIds, nextMsgIds);
    setMessages(prev => prev.map(m => ({ ...m, read: true })));
  };

  const addNotification = (notification) => {
    const newNotif = {
      id: `MANUAL-${Date.now()}`,
      type: notification?.type || 'system',
      title: notification?.title || 'Notification',
      message: notification?.message || '',
      time: 'Just now',
      read: false,
      link: notification?.link || '/'
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 20));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        messages,
        unreadNotificationsCount,
        unreadMessagesCount,
        markNotificationAsRead,
        markMessageAsRead,
        markAllNotificationsAsRead,
        markAllMessagesAsRead,
        addNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
