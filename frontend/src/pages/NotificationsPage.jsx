import { useState, useEffect } from 'react';
import { notificationsAPI } from '../api/axios';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setError('');
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load notifications right now.');
    } finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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
    if (diff < 10080) return `${Math.floor(diff / 1440)}d ago`;
    return d.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.length - unreadCount;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'read') return n.isRead;
    return true;
  });

  if (loading) return <div className="loading"><div className="spinner"></div> Loading notifications...</div>;

  return (
    <div className="notifications-page">
      <div className="notifications-hero">
        <div>
          <h2>
            Notifications {unreadCount > 0 && <span className="badge badge-open">{unreadCount} unread</span>}
          </h2>
          <p>Stay on top of ticket updates, assignments, and system events.</p>
        </div>
        <div className="notifications-hero-actions">
          <button onClick={fetchNotifications} className="btn btn-sm btn-secondary">Refresh</button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn btn-sm btn-secondary">Mark all as read</button>
          )}
        </div>
      </div>

      <div className="notifications-stats">
        <div className="notifications-stat-card">
          <div className="notifications-stat-label">Total</div>
          <div className="notifications-stat-value">{notifications.length}</div>
        </div>
        <div className="notifications-stat-card">
          <div className="notifications-stat-label">Unread</div>
          <div className="notifications-stat-value">{unreadCount}</div>
        </div>
        <div className="notifications-stat-card">
          <div className="notifications-stat-label">Read</div>
          <div className="notifications-stat-value">{readCount}</div>
        </div>
      </div>

      <div className="notifications-tabs">
        <button className={`notifications-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          All ({notifications.length})
        </button>
        <button className={`notifications-tab ${activeTab === 'unread' ? 'active' : ''}`} onClick={() => setActiveTab('unread')}>
          Unread ({unreadCount})
        </button>
        <button className={`notifications-tab ${activeTab === 'read' ? 'active' : ''}`} onClick={() => setActiveTab('read')}>
          Read ({readCount})
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <p>No notifications yet</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🧹</div>
          <p>No {activeTab} notifications</p>
        </div>
      ) : (
        <div className="notifications-list card">
          {filteredNotifications.map((n) => (
            <article key={n.id} className={`notifications-page-item ${!n.isRead ? 'unread' : ''}`}>
              <div className="notifications-page-item-main">
                <div className="notifications-page-item-title-wrap">
                  {!n.isRead && <span className="notifications-dot" aria-hidden="true" />}
                  <h3 className="notifications-page-item-title">{n.title}</h3>
                </div>
                <p className="notifications-page-item-message">{n.message}</p>
                <div className="notifications-page-item-time" title={n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}>
                  {formatTime(n.createdAt)}
                </div>
              </div>
              {!n.isRead && (
                <button className="btn btn-sm btn-outline" onClick={() => markRead(n.id)}>
                  Mark as read
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
