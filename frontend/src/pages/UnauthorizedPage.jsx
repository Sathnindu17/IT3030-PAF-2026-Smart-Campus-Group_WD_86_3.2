import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="error-page">
      <h1>403</h1>
      <h2>Access Denied</h2>
      <p>You don't have permission to access this page.</p>
      <Link to="/app" className="btn btn-primary">Go to Dashboard</Link>
    </div>
  );
}
