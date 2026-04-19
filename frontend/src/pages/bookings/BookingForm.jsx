import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { bookingsAPI, resourcesAPI } from '../../api/axios';

export default function BookingForm() {
  const [searchParams] = useSearchParams();
  const preselectedResource = searchParams.get('resourceId') || '';

  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({
    resourceId: preselectedResource,
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: 1,
  });

  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Fetch resources
  useEffect(() => {
    resourcesAPI
      .getAll({ status: 'ACTIVE' })
      .then((res) => setResources(res.data.data))
      .catch(() => { });
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const value =
      e.target.name === 'expectedAttendees'
        ? parseInt(e.target.value) || 0
        : e.target.value;

    setForm({ ...form, [e.target.name]: value });
  };

  // Availability check
  useEffect(() => {
    if (form.resourceId && form.date && form.startTime && form.endTime) {
      bookingsAPI
        .checkAvailability(form)
        .then((res) => setAvailability(res.data.available))
        .catch(() => setAvailability(null));
    }
  }, [form.resourceId, form.date, form.startTime, form.endTime]);

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await bookingsAPI.create(form);
      setSuccess('Booking request submitted!');
      setTimeout(() => navigate('/app/bookings/my'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const selectedResource = resources.find(r => r.id === form.resourceId);

  return (
    <div style={{ padding: '20px' }}>

      {/* 🔥 SMALL HEADER */}
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          color: '#fff',
          padding: '16px 20px',
          borderRadius: '16px',
          marginBottom: '20px',
          boxShadow: '0 8px 20px rgba(79,70,229,0.2)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
          📅 New Booking Request
        </h2>
        <p style={{ marginTop: '6px', fontSize: '14px', opacity: 0.9 }}>
          Reserve campus resources with availability checking.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

        {/* LEFT FORM */}
        <div style={{ flex: 2, minWidth: '300px' }}>
          <div className="card">
            <div className="card-body">

              {error && <div className="alert alert-error">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <form onSubmit={handleSubmit}>

                <div className="form-group">
                  <label>Resource</label>
                  <select
                    name="resourceId"
                    className="form-control"
                    value={form.resourceId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a resource</option>
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.type?.replace(/_/g, ' ')}) - {r.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    name="date"
                    className="form-control"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      type="time"
                      name="startTime"
                      className="form-control"
                      value={form.startTime}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>End Time</label>
                    <input
                      type="time"
                      name="endTime"
                      className="form-control"
                      value={form.endTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* 🔥 Availability Status */}
                {availability !== null && (
                  <div
                    style={{
                      marginBottom: '10px',
                      color: availability ? 'green' : 'red',
                      fontWeight: 500,
                    }}
                  >
                    {availability
                      ? '✅ Resource Available'
                      : '❌ Resource Not Available'}
                  </div>
                )}

                <div className="form-group">
                  <label>Purpose</label>
                  <textarea
                    name="purpose"
                    className="form-control"
                    value={form.purpose}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Expected Attendees</label>
                  <input
                    type="number"
                    name="expectedAttendees"
                    min="1"
                    className="form-control"
                    value={form.expectedAttendees}
                    onChange={handleChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || availability === false}
                >
                  {loading ? 'Submitting...' : 'Submit Booking'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT SUMMARY */}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <div className="card">
            <div className="card-body">
              <h4>Booking Summary</h4>
              <p><strong>Resource:</strong> {selectedResource?.name || '-'}</p>
              <p><strong>Type:</strong> {selectedResource?.type || '-'}</p>
              <p><strong>Location:</strong> {selectedResource?.location || '-'}</p>
              <p><strong>Date:</strong> {form.date || '-'}</p>
              <p><strong>Time:</strong> {form.startTime} - {form.endTime}</p>
              <p><strong>Attendees:</strong> {form.expectedAttendees}</p>
            </div>
          </div>

          <div className="card" style={{ marginTop: '15px' }}>
            <div className="card-body">
              <h4>Quick Tips</h4>
              <ul style={{ paddingLeft: '18px' }}>
                <li>Select correct resource</li>
                <li>Avoid overlapping bookings</li>
                <li>Provide clear purpose</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}