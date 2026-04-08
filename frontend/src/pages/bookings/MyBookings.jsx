import { useState, useEffect } from 'react';
import { bookingsAPI } from '../../api/axios';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchBookings(); }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await bookingsAPI.getMyBookings(params);
      setBookings(res.data.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookingsAPI.cancel(id);
      fetchBookings();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to cancel');
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div> Loading bookings...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>My Bookings</h2>

      <div className="filters">
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📅</div><p>No bookings found</p></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td><strong>{b.resourceName}</strong></td>
                    <td>{b.date}</td>
                    <td>{b.startTime} - {b.endTime}</td>
                    <td>{b.purpose}</td>
                    <td><span className={`badge badge-${b.status?.toLowerCase()}`}>{b.status}</span></td>
                    <td>
                      {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                        <button onClick={() => handleCancel(b.id)} className="btn btn-sm btn-danger">Cancel</button>
                      )}
                      {b.status === 'REJECTED' && b.rejectionReason && (
                        <span style={{ fontSize: 12, color: '#ef4444' }}>Reason: {b.rejectionReason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
