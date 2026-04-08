import { useState, useEffect } from 'react';
import { bookingsAPI } from '../../api/axios';

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, reason: '' });

  useEffect(() => { fetchBookings(); }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const res = await bookingsAPI.getAllBookings(params);
      setBookings(res.data.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    try {
      await bookingsAPI.approve(id);
      fetchBookings();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    try {
      await bookingsAPI.reject(rejectModal.id, rejectModal.reason);
      setRejectModal({ open: false, id: null, reason: '' });
      fetchBookings();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to reject');
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div> Loading bookings...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Review Bookings (Admin)</h2>

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
                  <th>User</th>
                  <th>Resource</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Purpose</th>
                  <th>Attendees</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>{b.userName}</td>
                    <td><strong>{b.resourceName}</strong></td>
                    <td>{b.date}</td>
                    <td>{b.startTime} - {b.endTime}</td>
                    <td>{b.purpose}</td>
                    <td>{b.expectedAttendees}</td>
                    <td><span className={`badge badge-${b.status?.toLowerCase()}`}>{b.status}</span></td>
                    <td>
                      {b.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleApprove(b.id)} className="btn btn-sm btn-success">Approve</button>
                          <button onClick={() => setRejectModal({ open: true, id: b.id, reason: '' })} className="btn btn-sm btn-danger">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="modal-overlay" onClick={() => setRejectModal({ open: false, id: null, reason: '' })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reject Booking</h3>
              <button className="modal-close" onClick={() => setRejectModal({ open: false, id: null, reason: '' })}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Reason for rejection</label>
                <textarea className="form-control" value={rejectModal.reason}
                  onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  placeholder="Provide a reason..." />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setRejectModal({ open: false, id: null, reason: '' })} className="btn btn-secondary">Cancel</button>
              <button onClick={handleReject} className="btn btn-danger">Reject Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
