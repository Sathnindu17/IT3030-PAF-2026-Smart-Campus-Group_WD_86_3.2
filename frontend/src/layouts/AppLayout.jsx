import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, hasRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="app-layout">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>🏫 Smart Campus</h2>
          <p>Operations Hub</p>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Main</div>
            <NavLink to="/app/dashboard" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">📊</span> Dashboard
            </NavLink>
            <NavLink to="/app/resources" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">🏢</span> Resources
            </NavLink>
            <NavLink to="/app/resources/map" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">🗺️</span> Campus Map
            </NavLink>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Bookings</div>
            <NavLink to="/app/bookings/new" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">➕</span> New Booking
            </NavLink>
            <NavLink to="/app/bookings/my" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">📅</span> My Bookings
            </NavLink>
            {hasRole('ADMIN') && (
              <NavLink to="/app/bookings/admin" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="icon">✅</span> Review Bookings
              </NavLink>
            )}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Tickets</div>
            <NavLink to="/app/tickets/new" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">🎫</span> New Ticket
            </NavLink>
            <NavLink to="/app/tickets/my" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">📋</span> My Tickets
            </NavLink>
            {hasRole('ADMIN') && (
              <NavLink to="/app/tickets/admin" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="icon">🔧</span> All Tickets
              </NavLink>
            )}
            {hasRole('TECHNICIAN', 'ADMIN') && (
              <NavLink to="/app/tickets/assigned" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="icon">👷</span> Assigned Tickets
              </NavLink>
            )}
          </div>

          {hasRole('ADMIN') && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Admin</div>
              <NavLink to="/app/resources/new" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="icon">➕</span> Add Resource
              </NavLink>
            </div>
          )}

          <div className="sidebar-section">
            <div className="sidebar-section-title">Settings</div>
            <NavLink to="/app/notifications/preferences" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">⚙️</span> Notification Settings
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initial}</div>
            <div className="sidebar-user-info">
              <div className="name">{user?.fullName || 'Guest'}</div>
              <div className="role">{user?.role || 'VISITOR'}</div>
            </div>
          </div>
          {isAuthenticated ? (
            <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 12 }}>
              Logout
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 12 }}>
              Login
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <button 
              className={`hamburger-menu ${sidebarOpen ? 'open' : ''}`}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div className="topbar-title">
              <h1>Smart Campus Hub</h1>
            </div>
          </div>
          <div className="topbar-actions">
            {isAuthenticated ? <NotificationBell /> : null}
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
