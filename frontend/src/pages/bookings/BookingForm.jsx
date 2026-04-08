import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookingsAPI, resourcesAPI } from '../../api/axios';

export default function BookingForm() {
  const [searchParams] = useSearchParams();
  const preselectedResource = searchParams.get('resourceId') || '';
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({
    resourceId: preselectedResource, date: '', startTime: '', endTime: '', purpose: '', expectedAttendees: 1
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    resourcesAPI.getAll({ status: 'ACTIVE' }).then(res => setResources(res.data.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const value = e.target.name === 'expectedAttendees' ? parseInt(e.target.value) || 0 : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await bookingsAPI.create(form);
      setSuccess('Booking request submitted! Waiting for admin approval.');
      setTimeout(() => navigate('/app/bookings/my'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2>New Booking Request</h2>
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Resource</label>
              <select name="resourceId" className="form-control" value={form.resourceId} onChange={handleChange} required>
                <option value="">Select a resource</option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.type?.replace(/_/g, ' ')}) - {r.location}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" name="date" className="form-control" value={form.date} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Time</label>
                <input type="time" name="startTime" className="form-control" value={form.startTime} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input type="time" name="endTime" className="form-control" value={form.endTime} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-group">
              <label>Purpose</label>
              <textarea name="purpose" className="form-control" value={form.purpose} onChange={handleChange} required placeholder="Describe the purpose of booking" />
            </div>
            <div className="form-group">
              <label>Expected Attendees</label>
              <input type="number" name="expectedAttendees" min="1" className="form-control" value={form.expectedAttendees} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Booking Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
