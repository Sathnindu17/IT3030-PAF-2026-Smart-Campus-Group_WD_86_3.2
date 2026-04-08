import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="logo">🏫 Smart Campus Hub</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {isAuthenticated ? (
            <Link to="/app" className="btn btn-primary">Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      <div className="landing-hero">
        <h1>Smart Campus<br />Operations Hub</h1>
        <p>Streamline your university's resource management, bookings, and maintenance — all in one simple platform.</p>
        <Link to={isAuthenticated ? '/app' : '/register'} className="btn btn-primary" style={{ padding: '14px 36px', fontSize: 16 }}>
          {isAuthenticated ? 'Open Dashboard' : 'Get Started Free'}
        </Link>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">🏢</div>
            <h3>Facilities Catalogue</h3>
            <p>Manage lecture halls, labs, meeting rooms, and equipment in one place.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Smart Bookings</h3>
            <p>Book resources with conflict prevention and approval workflows.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3>Incident Tickets</h3>
            <p>Report issues, track progress, and communicate with technicians.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Notifications</h3>
            <p>Stay updated with real-time notifications for bookings and tickets.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
