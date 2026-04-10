import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../../api/axios';

export default function TechnicianTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
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
      setFeedback({ type: 'success', message: 'Status updated successfully.' });
      fetchTickets();
    } catch (e) { setFeedback({ type: 'error', message: e.response?.data?.message || 'Failed to update status.' }); }
  };

  const handleResolve = async () => {
    try {
      await ticketsAPI.addResolutionNotes(resolveModal.ticketId, resolveModal.notes);
      setResolveModal({ open: false, ticketId: null, notes: '' });
      setFeedback({ type: 'success', message: 'Resolution notes saved.' });
      fetchTickets();
    } catch (e) { setFeedback({ type: 'error', message: e.response?.data?.message || 'Failed to save notes.' }); }
  };

  const filteredTickets = tickets
    .filter((ticket) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return [ticket.title, ticket.category, ticket.createdByName, ticket.location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .filter((ticket) => (statusFilter ? ticket.status === statusFilter : true));

  const stats = {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === 'OPEN').length,
    inProgress: tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length,
    urgent: tickets.filter((ticket) => ticket.priority === 'URGENT').length
  };

  if (loading) return <div className="loading"><div className="spinner"></div> Loading assigned tickets...</div>;

  return (
    <div>
      <div className="ticket-page-header-row">
        <div>
          <h2>My Assigned Tickets</h2>
          <p className="ticket-subtext">Update status continuously so users and admins can track progress.</p>
        </div>
      </div>

      {feedback.message && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.message}
        </div>
      )}

      <div className="ticket-stats-grid" style={{ marginBottom: 16 }}>
        <div className="ticket-stat-card"><span>Total</span><strong>{stats.total}</strong></div>
        <div className="ticket-stat-card"><span>Open</span><strong>{stats.open}</strong></div>
        <div className="ticket-stat-card"><span>In Progress</span><strong>{stats.inProgress}</strong></div>
        <div className="ticket-stat-card"><span>Urgent</span><strong>{stats.urgent}</strong></div>
      </div>

      <div className="filters">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, category, reporter, location"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {filteredTickets.length === 0 ? (
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
                {filteredTickets.map(t => (
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
