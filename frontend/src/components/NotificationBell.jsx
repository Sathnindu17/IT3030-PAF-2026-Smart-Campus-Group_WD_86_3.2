import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../api/axios';

function isDndActive() {
  try {
    const stored = localStorage.getItem('dnd_preferences');
    if (!stored) return false;
    const { dndEnabled, dndStart, dndEnd } = JSON.parse(stored);
    if (!dndEnabled) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = dndStart.split(':').map(Number);
    const [endH, endM] = dndEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      // Same day range (e.g. 09:00 - 17:00)
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight range (e.g. 22:00 - 07:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  } catch {
    return false;
  }
}

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [dnd, setDnd] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCount();
    const interval = setInterval(() => {
      fetchCount();
      setDnd(isDndActive());
    }, 30000); // poll every 30s
    setDnd(isDndActive());

    const handleNotificationsUpdated = () => {
      fetchCount();
      fetchNotifications();
    };

    window.addEventListener('notifications-updated', handleNotificationsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications-updated', handleNotificationsUpdated);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCount = async () => {
    try {
      const res = await notificationsAPI.getUnreadCount();
      setCount(res.data.data.count);
    } catch (e) {}
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.data);
    } catch (e) {}
  };

  const toggleDropdown = () => {
    if (!open) fetchNotifications();
    setOpen(!open);
  };

  const markRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setCount(0);
    } catch (e) {}
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SECURITY': return '🔐';
      case 'BOOKING': return '📅';
      case 'TICKET': return '🎫';
      case 'SYSTEM': return '📢';
      default: return '🔔';
    }
  };

  const showBadge = count > 0 && !dnd;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="notification-bell" onClick={toggleDropdown}>
        🔔
        {showBadge && <span className="notification-badge">{count}</span>}
        {dnd && <span className="dnd-indicator" title="Do Not Disturb is active">🔕</span>}
      </div>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h4>Notifications</h4>
            <div style={{ display: 'flex', gap: 8 }}>
              {count > 0 && (
                <button onClick={markAllRead} className="btn btn-sm btn-secondary">Mark all read</button>
              )}
            </div>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                No notifications
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id}
                  className={`notification-item ${!n.isRead ? 'unread' : ''} ${n.type === 'SECURITY' ? 'security' : ''}`}
                  onClick={() => { if (!n.isRead) markRead(n.id); }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{getTypeIcon(n.type)}</span>
                    <div className="notif-title">{n.title}</div>
                  </div>
                  <div className="notif-message">{n.message}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div className="notif-time">{formatTime(n.createdAt)}</div>
                    {n.type && <span className={`notif-type-badge notif-type-${n.type?.toLowerCase()}`}>{n.type}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', textAlign: 'center', display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => { setOpen(false); navigate('/app/notifications'); }}
              className="btn btn-sm btn-outline">View All</button>
            <button onClick={() => { setOpen(false); navigate('/app/notifications/preferences'); }}
              className="btn btn-sm btn-secondary">⚙️ Settings</button>
          </div>
        </div>
      )}
    </div>
  );
}
