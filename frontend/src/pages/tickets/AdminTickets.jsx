import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI, usersAPI } from '../../api/axios';
import { calculateSLAStatus, formatSLATime, getSLAColor } from '../../utils/slaCalculator';
import TicketRoleGreeting from '../../components/TicketRoleGreeting';
import TicketCategoryPicker, { getTicketCategoryMeta, normalizeTicketCategory } from '../../components/TicketCategoryPicker';

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [assignModal, setAssignModal] = useState({ open: false, ticketId: null, techId: '' });
  const [statusModal, setStatusModal] = useState({ open: false, ticketId: null, status: '' });
  const [resolveModal, setResolveModal] = useState({ open: false, ticketId: null, notes: '' });
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketRes, techRes] = await Promise.all([
        ticketsAPI.getAllTickets(),
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
      setFeedback({ type: 'success', message: 'Technician assigned successfully.' });
      fetchData();
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (e) { setFeedback({ type: 'error', message: e.response?.data?.message || 'Failed to assign technician.' }); }
  };

  const handleStatusUpdate = async () => {
    try {
      await ticketsAPI.updateStatus(statusModal.ticketId, statusModal.status);
      setStatusModal({ open: false, ticketId: null, status: '' });
      setFeedback({ type: 'success', message: 'Ticket status updated.' });
      fetchData();
    } catch (e) { setFeedback({ type: 'error', message: e.response?.data?.message || 'Failed to update status.' }); }
  };

  const handleResolve = async () => {
    try {
      await ticketsAPI.addResolutionNotes(resolveModal.ticketId, resolveModal.notes);
      setResolveModal({ open: false, ticketId: null, notes: '' });
      setFeedback({ type: 'success', message: 'Resolution notes saved.' });
      fetchData();
    } catch (e) { setFeedback({ type: 'error', message: e.response?.data?.message || 'Failed to save resolution notes.' }); }
  };

  const filteredTickets = tickets
    .filter((ticket) => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return [ticket.title, ticket.createdByName, ticket.assignedTechnicianName, ticket.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .filter((ticket) => (statusFilter ? ticket.status === statusFilter : true))
    .filter((ticket) => (categoryFilter ? normalizeTicketCategory(ticket.category) === categoryFilter : true))
    .filter((ticket) => {
      if (!technicianFilter) return true;
      if (technicianFilter === '__UNASSIGNED__') return !ticket.assignedTechnicianName;
      return ticket.assignedTechnicianName === technicianFilter;
    })
    .filter((ticket) => (userFilter ? ticket.createdByName === userFilter : true));

  const technicianOptions = Array.from(new Set(tickets.map((ticket) => ticket.assignedTechnicianName).filter(Boolean))).sort();
  const userOptions = Array.from(new Set(tickets.map((ticket) => ticket.createdByName).filter(Boolean))).sort();

  const stats = {
    total: tickets.length,
    unassigned: tickets.filter((ticket) => !ticket.assignedTechnicianName).length,
    active: tickets.filter((ticket) => ['OPEN', 'IN_PROGRESS'].includes(ticket.status)).length,
    urgent: tickets.filter((ticket) => ticket.priority === 'URGENT').length
  };

  if (loading) return <div className="loading"><div className="spinner"></div> Loading tickets...</div>;

  return (
    <div>
      <div className="ticket-page-header-row">
        <div>
          <h2>All Tickets (Admin)</h2>
          <p className="ticket-subtext">Monitor incidents, assign technicians, and keep the workflow moving.</p>
        </div>
      </div>

      <TicketRoleGreeting />

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        margin: '0 0 14px',
        padding: '14px 16px',
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 4 }}>
            Ticket Operations
          </div>
          <div style={{ fontSize: 13, color: '#475569' }}>
            Review, filter, assign, and resolve incidents in one clean workspace.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 600 }}>
            Total {stats.total}
          </span>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: '#ecfeff', color: '#0f766e', fontSize: 12, fontWeight: 600 }}>
            Active {stats.active}
          </span>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 600 }}>
            Urgent {stats.urgent}
          </span>
        </div>
      </div>

      {feedback.message && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.message}
        </div>
      )}

      <div className="ticket-stats-grid" style={{ marginBottom: 16 }}>
        <div className="ticket-stat-card"><span>Total</span><strong>{stats.total}</strong></div>
        <div className="ticket-stat-card"><span>Unassigned</span><strong>{stats.unassigned}</strong></div>
        <div className="ticket-stat-card"><span>Active</span><strong>{stats.active}</strong></div>
        <div className="ticket-stat-card"><span>Urgent</span><strong>{stats.urgent}</strong></div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 2fr) repeat(3, minmax(150px, 1fr))',
        gap: 10,
        marginBottom: 16,
        alignItems: 'center',
      }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, requester, technician, category"
          style={{
            height: 42,
            padding: '0 14px',
            borderRadius: 10,
            border: '1px solid #dbe2ea',
            background: '#fff',
            fontSize: 13,
            outline: 'none',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
          }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={filterSelectStyle}>
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Category</div>
          <TicketCategoryPicker value={categoryFilter} onChange={setCategoryFilter} allowAll mode="chips" compact />
        </div>

        <select value={technicianFilter} onChange={e => setTechnicianFilter(e.target.value)} style={filterSelectStyle}>
          <option value="">All Technician</option>
          <option value="__UNASSIGNED__">Unassigned</option>
          {technicianOptions.map((technician) => (
            <option key={technician} value={technician}>{technician}</option>
          ))}
        </select>

        <select value={userFilter} onChange={e => setUserFilter(e.target.value)} style={filterSelectStyle}>
          <option value="">All User</option>
          {userOptions.map((requester) => (
            <option key={requester} value={requester}>{requester}</option>
          ))}
        </select>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="empty-state" style={{ borderRadius: 14, border: '1px dashed #dbe2ea', background: '#fff', padding: '3rem 1rem' }}>
          <div className="empty-icon">📋</div>
          <p>No tickets found</p>
        </div>
      ) : (
        <div style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
          overflow: 'hidden',
        }}>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f3f6fb 100%)' }}>
                  {['Title', 'Created By', 'Category', 'Priority', 'Status', 'SLA', 'Technician', 'Actions'].map((header) => (
                    <th key={header} style={{
                      padding: '14px 16px',
                      textAlign: 'left',
                      fontSize: 11,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: '#64748b',
                      fontWeight: 700,
                      borderBottom: '1px solid #e5e7eb',
                      whiteSpace: 'nowrap',
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t, index) => {
                  const sla = calculateSLAStatus(t);
                  const slaColor = sla ? getSLAColor(sla.status) : null;
                  return (
                  <tr
                    key={t.id}
                    style={{
                      background: sla?.breached ? 'rgba(255, 227, 227, 0.28)' : index % 2 === 0 ? '#fff' : '#fcfdff',
                      borderBottom: '1px solid #eef2f7',
                      transition: 'background .15s ease, transform .15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = sla?.breached ? 'rgba(255, 227, 227, 0.4)' : '#f8fafc'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = sla?.breached ? 'rgba(255, 227, 227, 0.28)' : index % 2 === 0 ? '#fff' : '#fcfdff'; }}
                  >
                    <td style={tableCellStyle}>
                      <button
                        onClick={() => navigate(`/app/tickets/${t.id}`)}
                        style={{
                          border: 'none',
                          background: 'none',
                          padding: 0,
                          fontWeight: 700,
                          color: '#4f46e5',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {t.title}
                      </button>
                    </td>
                    <td style={tableCellStyle}>{t.createdByName}</td>
                    <td style={tableCellStyle}>
                      <span style={chipStyle('#eff6ff', '#1d4ed8')}>
                        {getTicketCategoryMeta(t.category)?.icon} {getTicketCategoryMeta(t.category)?.label}
                      </span>
                    </td>
                    <td style={tableCellStyle}><span style={priorityChipStyle(t.priority)}>{t.priority}</span></td>
                    <td style={tableCellStyle}><span style={statusChipStyle(t.status)}>{t.status}</span></td>
                    <td style={tableCellStyle}>
                      {sla && (
                        <span style={{
                          ...slaChipStyle(slaColor),
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}>
                          <span style={{ fontSize: 10 }}>⏱</span>
                          {sla.status === 'breached' ? 'Breached' : formatSLATime(sla.hoursRemaining)}
                        </span>
                      )}
                    </td>
                    <td style={tableCellStyle}>
                      {t.assignedTechnicianName ? (
                        <span style={{ fontWeight: 500 }}>{t.assignedTechnicianName}</span>
                      ) : t.assignedTechnicianId ? (
                        <span style={{ color: '#f59e0b', fontSize: 12 }}>⚠ ID: {t.assignedTechnicianId.substring(0, 8)}...</span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Unassigned</span>
                      )}
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button onClick={() => setAssignModal({ open: true, ticketId: t.id, techId: '' })} className="btn btn-sm btn-secondary">Assign</button>
                        <button onClick={() => setStatusModal({ open: true, ticketId: t.id, status: t.status })} className="btn btn-sm btn-warning">Status</button>
                        <button onClick={() => setResolveModal({ open: true, ticketId: t.id, notes: t.resolutionNotes || '' })} className="btn btn-sm btn-success">Resolve</button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
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

const filterSelectStyle = {
  height: 42,
  padding: '0 14px',
  borderRadius: 10,
  border: '1px solid #dbe2ea',
  background: '#fff',
  fontSize: 13,
  outline: 'none',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
  cursor: 'pointer',
};

const tableCellStyle = {
  padding: '16px',
  verticalAlign: 'middle',
  color: '#334155',
  whiteSpace: 'nowrap',
};

const chipStyle = (bg, color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 999,
  background: bg,
  color,
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1,
});

const priorityChipStyle = (priority) => {
  const map = {
    LOW: ['#eaf3de', '#3b6d11'],
    MEDIUM: ['#faeeda', '#854f0b'],
    HIGH: ['#faece7', '#993c1d'],
    URGENT: ['#fcebeb', '#a32d2d'],
  };
  const [bg, color] = map[priority] || ['#f1f5f9', '#334155'];
  return chipStyle(bg, color);
};

const statusChipStyle = (status) => {
  const map = {
    OPEN: ['#e6f1fb', '#185fa5'],
    IN_PROGRESS: ['#faeeda', '#854f0b'],
    RESOLVED: ['#eaf3de', '#3b6d11'],
    CLOSED: ['#f1efe8', '#5f5e5a'],
    REJECTED: ['#fcebeb', '#791f1f'],
  };
  const [bg, color] = map[status] || ['#f1f5f9', '#334155'];
  return chipStyle(bg, color);
};

const slaChipStyle = (slaColor) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: 999,
  background: slaColor?.bg || '#f1f5f9',
  color: slaColor?.text || '#334155',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: 1,
});
