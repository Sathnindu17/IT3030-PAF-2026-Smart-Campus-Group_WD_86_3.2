import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI, usersAPI } from '../../api/axios';

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [assignModal, setAssignModal] = useState({ open: false, ticketId: null, techId: '' });
  const [statusModal, setStatusModal] = useState({ open: false, ticketId: null, status: '' });
  const [resolveModal, setResolveModal] = useState({ open: false, ticketId: null, notes: '' });
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = filter ? { status: filter } : {};
      const [ticketRes, techRes] = await Promise.all([
        ticketsAPI.getAllTickets(params),
        usersAPI.getTechnicians()
      ]);
      setTickets(ticketRes.data.data);
      setTechnicians(techRes.data.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const handleAssign = async () => {
    try {
      await ticketsAPI.assignTechnician(assignModal.ticketId, assignModal.techId);
      setAssignModal({ open: false, ticketId: null, techId: '' });
      fetchData();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const handleStatusUpdate = async () => {
    try {
      await ticketsAPI.updateStatus(statusModal.ticketId, statusModal.status);
      setStatusModal({ open: false, ticketId: null, status: '' });
      fetchData();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const handleResolve = async () => {
    try {
      await ticketsAPI.addResolutionNotes(resolveModal.ticketId, resolveModal.notes);
      setResolveModal({ open: false, ticketId: null, notes: '' });
      fetchData();
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div> Loading tickets...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>All Tickets (Admin)</h2>

      <div className="filters">
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📋</div><p>No tickets found</p></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Created By</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Technician</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td><strong style={{ cursor: 'pointer', color: '#4f46e5' }} onClick={() => navigate(`/app/tickets/${t.id}`)}>{t.title}</strong></td>
                    <td>{t.createdByName}</td>
                    <td>{t.category}</td>
                    <td><span className={`badge badge-${t.priority?.toLowerCase()}`}>{t.priority}</span></td>
                    <td><span className={`badge badge-${t.status?.toLowerCase()}`}>{t.status}</span></td>
                    <td>{t.assignedTechnicianName || <span style={{ color: '#9ca3af' }}>Unassigned</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button onClick={() => setAssignModal({ open: true, ticketId: t.id, techId: '' })} className="btn btn-sm btn-secondary">Assign</button>
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

      {/* Assign Technician Modal */}
      {assignModal.open && (
        <div className="modal-overlay" onClick={() => setAssignModal({ open: false, ticketId: null, techId: '' })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Technician</h3>
              <button className="modal-close" onClick={() => setAssignModal({ open: false, ticketId: null, techId: '' })}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Select Technician</label>
                <select className="form-control" value={assignModal.techId}
                  onChange={e => setAssignModal({ ...assignModal, techId: e.target.value })}>
                  <option value="">Choose...</option>
                  {technicians.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.email})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setAssignModal({ open: false, ticketId: null, techId: '' })} className="btn btn-secondary">Cancel</button>
              <button onClick={handleAssign} className="btn btn-primary" disabled={!assignModal.techId}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {statusModal.open && (
        <div className="modal-overlay" onClick={() => setStatusModal({ open: false, ticketId: null, status: '' })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Status</h3>
              <button className="modal-close" onClick={() => setStatusModal({ open: false, ticketId: null, status: '' })}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>New Status</label>
                <select className="form-control" value={statusModal.status}
                  onChange={e => setStatusModal({ ...statusModal, status: e.target.value })}>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REJECTED">Rejected</option>
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

      {/* Resolution Notes Modal */}
      {resolveModal.open && (
        <div className="modal-overlay" onClick={() => setResolveModal({ open: false, ticketId: null, notes: '' })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Resolution Notes</h3>
              <button className="modal-close" onClick={() => setResolveModal({ open: false, ticketId: null, notes: '' })}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Notes</label>
                <textarea className="form-control" value={resolveModal.notes}
                  onChange={e => setResolveModal({ ...resolveModal, notes: e.target.value })}
                  placeholder="Describe the resolution..." />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setResolveModal({ open: false, ticketId: null, notes: '' })} className="btn btn-secondary">Cancel</button>
              <button onClick={handleResolve} className="btn btn-success">Save Notes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
