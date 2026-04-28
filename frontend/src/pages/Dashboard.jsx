import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI, ticketsAPI, resourcesAPI, notificationsAPI } from '../api/axios';

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    resources: 0, myBookings: 0, myTickets: 0, unread: 0,
    allBookings: 0, allTickets: 0, assignedTickets: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [resourcesRes, notifRes] = await Promise.all([
        resourcesAPI.getAll(),
        notificationsAPI.getUnreadCount()
      ]);

      const newStats = {
        resources: resourcesRes.data.data.length,
        unread: notifRes.data.data.count,
        myBookings: 0, myTickets: 0,
        allBookings: 0, allTickets: 0, assignedTickets: 0
      };

      try {
        const myBookings = await bookingsAPI.getMyBookings();
        newStats.myBookings = myBookings.data.data.length;
      } catch (e) {}

      try {
        const myTickets = await ticketsAPI.getMyTickets();
        newStats.myTickets = myTickets.data.data.length;
      } catch (e) {}

      if (hasRole('ADMIN')) {
        try {
          const allBookings = await bookingsAPI.getAllBookings();
          newStats.allBookings = allBookings.data.data.length;
        } catch (e) {}
        try {
          const allTickets = await ticketsAPI.getAllTickets();
          newStats.allTickets = allTickets.data.data.length;
        } catch (e) {}
      }

      if (hasRole('TECHNICIAN', 'ADMIN')) {
        try {
          const assigned = await ticketsAPI.getAssignedTickets();
          newStats.assignedTickets = assigned.data.data.length;
        } catch (e) {}
      }

      setStats(newStats);
    } catch (e) {
      console.error('Failed to load stats', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div> Loading dashboard...</div>;

  return (
    <div>
      <div
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #1d4ed8 55%, #0ea5e9 100%)',
          color: '#fff',
          borderRadius: 18,
          padding: '22px 24px',
          marginBottom: 24,
          boxShadow: '0 16px 35px rgba(15, 23, 42, 0.18)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 6 }}>
              Dashboard
            </div>
            <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.1 }}>Welcome back, {user?.fullName || 'Guest'}</h2>
            <p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.88)' }}>
              A quick view of campus resources, bookings, tickets, and notifications.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', borderColor: 'rgba(255,255,255,0.18)' }} onClick={() => navigate('/app/resources')}>
              Browse Resources
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/app/bookings/new')}>
              New Booking
            </button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-label">Total Resources</div>
          <div className="stat-value">{stats.resources}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-label">My Bookings</div>
          <div className="stat-value">{stats.myBookings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎫</div>
          <div className="stat-label">My Tickets</div>
          <div className="stat-value">{stats.myTickets}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-label">Unread Notifications</div>
          <div className="stat-value">{stats.unread}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-body">
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/app/resources/map')}>Open Campus Map</button>
            <button className="btn btn-secondary" onClick={() => navigate('/app/notifications')}>View Notifications</button>
            <button className="btn btn-secondary" onClick={() => navigate('/app/tickets/new')}>Raise Ticket</button>
          </div>
        </div>
      </div>

      {hasRole('ADMIN') && (
        <>
          <h3 style={{ marginTop: 24, marginBottom: 16 }}>Admin Overview</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-label">All Bookings</div>
              <div className="stat-value">{stats.allBookings}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-label">All Tickets</div>
              <div className="stat-value">{stats.allTickets}</div>
            </div>
          </div>
        </>
      )}

      {hasRole('TECHNICIAN', 'ADMIN') && (
        <div className="stats-grid" style={{ marginTop: 16 }}>
          <div className="stat-card">
            <div className="stat-icon">👷</div>
            <div className="stat-label">Assigned Tickets</div>
            <div className="stat-value">{stats.assignedTickets}</div>
          </div>
        </div>
      )}
    </div>
  );
}
