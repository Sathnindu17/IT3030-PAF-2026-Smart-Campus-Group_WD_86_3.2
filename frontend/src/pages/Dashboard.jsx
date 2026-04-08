import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI, ticketsAPI, resourcesAPI, notificationsAPI } from '../api/axios';

export default function Dashboard() {
  const { user, hasRole } = useAuth();
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
      <h2 style={{ marginBottom: 8 }}>Welcome back, {user?.fullName} 👋</h2>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>Here's a summary of your campus activity.</p>

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

      {hasRole('ADMIN') && (
        <>
          <h3 style={{ marginBottom: 16 }}>Admin Overview</h3>
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
