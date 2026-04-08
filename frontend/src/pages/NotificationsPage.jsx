import { useState, useEffect } from 'react';
import { notificationsAPI } from '../api/axios';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="loading"><div className="spinner"></div> Loading notifications...</div>;

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>Notifications {unreadCount > 0 && <span className="badge badge-open">{unreadCount} unread</span>}</h2>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn btn-sm btn-secondary">Mark all as read</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🔔</div><p>No notifications yet</p></div>
      ) : (
        <div className="card">
          {notifications.map(n => (
            <div key={n.id} className={`notification-item ${!n.isRead ? 'unread' : ''}`}
              onClick={() => { if (!n.isRead) markRead(n.id); }}
              style={{ cursor: !n.isRead ? 'pointer' : 'default' }}>
              <div className="notif-title">{n.title}</div>
              <div className="notif-message">{n.message}</div>
              <div className="notif-time">{formatTime(n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
