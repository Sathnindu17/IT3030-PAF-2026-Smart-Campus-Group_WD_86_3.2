import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../../api/axios';

export default function TechnicianTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState({ open: false, ticketId: null, status: '' });
  const [resolveModal, setResolveModal] = useState({ open: false, ticketId: null, notes: '' });
  const navigate = useNavigate();

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await ticketsAPI.getAssignedTickets();
      setTickets(res.data.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleStatusUpdate = async () => {
    try {
      await ticketsAPI.updateStatus(statusModal.ticketId, statusModal.status);
      setStatusModal({ open: false, ticketId: null, status: '' });
      fetchTickets();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const handleResolve = async () => {
    try {
      await ticketsAPI.addResolutionNotes(resolveModal.ticketId, resolveModal.notes);
      setResolveModal({ open: false, ticketId: null, notes: '' });
      fetchTickets();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div> Loading assigned tickets...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>My Assigned Tickets</h2>

      {tickets.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">👷</div><p>No tickets assigned to you</p></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td><strong style={{ cursor: 'pointer', color: '#4f46e5' }} onClick={() => navigate(`/app/tickets/${t.id}`)}>{t.title}</strong></td>
                    <td>{t.category}</td>
                    <td><span className={`badge badge-${t.priority?.toLowerCase()}`}>{t.priority}</span></td>
                    <td><span className={`badge badge-${t.status?.toLowerCase()}`}>{t.status}</span></td>
                    <td>{t.createdByName}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setStatusModal({ open: true, ticketId: t.id, status: t.status })} className="btn btn-sm btn-warning">Status</button>
                        <button onClick={() => setResolveModal({ open: true, ticketId: t.id, notes: t.resolutionNotes || '' })} className="btn btn-sm btn-success">Resolve</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusModal.open && (
        <div className="modal-overlay" onClick={() => setStatusModal({ open: false, ticketId: null, status: '' })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Update Status</h3><button className="modal-close" onClick={() => setStatusModal({ open: false, ticketId: null, status: '' })}>×</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label>New Status</label>
                <select className="form-control" value={statusModal.status} onChange={e => setStatusModal({ ...statusModal, status: e.target.value })}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setStatusModal({ open: false, ticketId: null, status: '' })} className="btn btn-secondary">Cancel</button>
              <button onClick={handleStatusUpdate} className="btn btn-primary">Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModal.open && (
        <div className="modal-overlay" onClick={() => setResolveModal({ open: false, ticketId: null, notes: '' })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Resolution Notes</h3><button className="modal-close" onClick={() => setResolveModal({ open: false, ticketId: null, notes: '' })}>×</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label>Notes</label>
                <textarea className="form-control" value={resolveModal.notes} onChange={e => setResolveModal({ ...resolveModal, notes: e.target.value })} placeholder="Describe what was done..." />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setResolveModal({ open: false, ticketId: null, notes: '' })} className="btn btn-secondary">Cancel</button>
              <button onClick={handleResolve} className="btn btn-success">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
