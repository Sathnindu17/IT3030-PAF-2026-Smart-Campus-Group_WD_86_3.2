import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🏫 Smart Campus</h2>
          <p>Operations Hub</p>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Main</div>
            <NavLink to="/app" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">📊</span> Dashboard
            </NavLink>
            <NavLink to="/app/resources" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">🏢</span> Resources
            </NavLink>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Bookings</div>
            <NavLink to="/app/bookings/new" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">➕</span> New Booking
            </NavLink>
            <NavLink to="/app/bookings/my" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">📅</span> My Bookings
            </NavLink>
            {hasRole('ADMIN') && (
              <NavLink to="/app/bookings/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="icon">✅</span> Review Bookings
              </NavLink>
            )}
          </div>

          <div className="sidebar-section">
            <div className="sidebar-section-title">Tickets</div>
            <NavLink to="/app/tickets/new" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">🎫</span> New Ticket
            </NavLink>
            <NavLink to="/app/tickets/my" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <span className="icon">📋</span> My Tickets
            </NavLink>
            {hasRole('ADMIN') && (
              <NavLink to="/app/tickets/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="icon">🔧</span> All Tickets
              </NavLink>
            )}
            {hasRole('TECHNICIAN', 'ADMIN') && (
              <NavLink to="/app/tickets/assigned" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="icon">👷</span> Assigned Tickets
              </NavLink>
            )}
          </div>

          {hasRole('ADMIN') && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Admin</div>
              <NavLink to="/app/resources/new" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <span className="icon">➕</span> Add Resource
              </NavLink>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initial}</div>
            <div className="sidebar-user-info">
              <div className="name">{user?.fullName}</div>
              <div className="role">{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 12 }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">
            <h1>Smart Campus Hub</h1>
          </div>
          <div className="topbar-actions">
            <NotificationBell />
          </div>
        </div>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
