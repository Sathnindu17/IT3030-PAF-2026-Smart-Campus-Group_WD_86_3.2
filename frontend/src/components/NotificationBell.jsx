import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../api/axios';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // poll every 30s
    return () => clearInterval(interval);
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

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className="notification-bell" onClick={toggleDropdown}>
        🔔
        {count > 0 && <span className="notification-badge">{count}</span>}
      </div>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h4>Notifications</h4>
            {count > 0 && (
              <button onClick={markAllRead} className="btn btn-sm btn-secondary">Mark all read</button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>
                No notifications
              </div>
            ) : (
              notifications.map(n => (
                <div key={n.id}
                  className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => { if (!n.isRead) markRead(n.id); }}
                >
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-message">{n.message}</div>
                  <div className="notif-time">{formatTime(n.createdAt)}</div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            <button onClick={() => { setOpen(false); navigate('/app/notifications'); }}
              className="btn btn-sm btn-outline">View All</button>
          </div>
        </div>
      )}
    </div>
  );
}
