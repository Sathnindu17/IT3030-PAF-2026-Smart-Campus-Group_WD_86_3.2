import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { calculateSLAStatus, formatSLATime, getSLAColor } from '../../utils/slaCalculator';
import TicketRoleGreeting from '../../components/TicketRoleGreeting';
import TicketCategoryPicker, { getTicketCategoryMeta, normalizeTicketCategory } from '../../components/TicketCategoryPicker';

export default function TechnicianTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [statusModal, setStatusModal] = useState({ open: false, ticketId: null, status: '' });
  const [resolveModal, setResolveModal] = useState({ open: false, ticketId: null, notes: '' });
  const navigate = useNavigate();

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Admins see all assigned tickets; Technicians see only their own
      if (user?.role === 'ADMIN') {
        const res = await ticketsAPI.getAllTickets();
        const assignedOnly = res.data.data.filter((ticket) => ticket.assignedTechnicianId);
        setTickets(assignedOnly);
      } else {
        const res = await ticketsAPI.getAssignedTickets();
        setTickets(res.data.data);
      }
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
    
  const filteredTicketsByCategory = filteredTickets.filter((ticket) => (categoryFilter ? normalizeTicketCategory(ticket.category) === categoryFilter : true));
  const hasActiveFilters = Boolean(search || statusFilter || categoryFilter);

  const stats = {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === 'OPEN').length,
    inProgress: tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length,
    urgent: tickets.filter((ticket) => ticket.priority === 'URGENT').length
  };

  const getDeadlineDate = (ticket) => {
    if (!ticket?.createdAt) return null;
    const sla = calculateSLAStatus(ticket);
    if (!sla?.hoursAllowed) return null;
    const createdAt = new Date(ticket.createdAt);
    return new Date(createdAt.getTime() + (sla.hoursAllowed * 60 * 60 * 1000));
  };

  const toDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setSelectedDateKey('');
  };

  const currentMonthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const currentMonthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  const monthLabel = currentMonthStart.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const startOffset = (currentMonthStart.getDay() + 6) % 7;
  const totalCalendarCells = Math.ceil((startOffset + currentMonthEnd.getDate()) / 7) * 7;
  const todayKey = toDateKey(new Date());

  const calendarCells = Array.from({ length: totalCalendarCells }, (_, index) => {
    const dayNumber = index - startOffset + 1;
    if (dayNumber < 1 || dayNumber > currentMonthEnd.getDate()) return null;

    const date = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth(), dayNumber);
    const dateKey = toDateKey(date);
    const dayTickets = filteredTicketsByCategory
      .map((ticket) => {
        const deadline = getDeadlineDate(ticket);
        if (!deadline) return null;
        if (toDateKey(deadline) !== dateKey) return null;
        return {
          ticket,
          deadline,
          sla: calculateSLAStatus(ticket),
        };
      })
      .filter(Boolean);

    return {
      date,
      dateKey,
      dayNumber,
      dayTickets,
    };
  });

  const selectedDay = calendarCells.find((cell) => cell && cell.dateKey === selectedDateKey);

  if (loading) return <div className="loading"><div className="spinner"></div> Loading assigned tickets...</div>;

  const isAdmin = user?.role === 'ADMIN';
  const pageTitle = isAdmin ? 'All Assigned Tickets' : 'My Assigned Tickets';
  const pageDescription = isAdmin 
    ? 'Monitor technician assignments and track ticket resolution progress.'
    : 'Update status continuously so users and admins can track progress.';

  return (
    <div>
      <div className="ticket-page-header-row">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>👷</span>
            {pageTitle}
          </h2>
          <p className="ticket-subtext">{pageDescription}</p>
        </div>
      </div>

      <TicketRoleGreeting />

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

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Category</div>
        <TicketCategoryPicker value={categoryFilter} onChange={setCategoryFilter} allowAll mode="chips" compact />
      </div>

      {filteredTicketsByCategory.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #eef2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#111827' }}>📅 Calendar View</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>Scheduled technician tasks by SLA deadline</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              >
                ←
              </button>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', minWidth: 140, textAlign: 'center' }}>{monthLabel}</div>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              >
                →
              </button>
            </div>
          </div>

          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6, marginBottom: 6 }}>
              {weekdayLabels.map((label) => (
                <div key={label} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em', padding: '4px 0' }}>
                  {label}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 6 }}>
              {calendarCells.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} style={{ minHeight: 84, borderRadius: 8, background: '#f8fafc' }} />;
                }

                const count = cell.dayTickets.length;
                const urgentCount = cell.dayTickets.filter((item) => item.ticket.priority === 'URGENT').length;
                const breachedCount = cell.dayTickets.filter((item) => item.sla?.breached).length;
                const isToday = cell.dateKey === todayKey;
                const isSelected = cell.dateKey === selectedDateKey;

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(cell.dateKey)}
                    style={{
                      minHeight: 84,
                      borderRadius: 8,
                      border: isSelected ? '1px solid #185FA5' : '1px solid #e5e7eb',
                      background: isSelected ? '#ebf4ff' : count > 0 ? '#ffffff' : '#f9fafb',
                      textAlign: 'left',
                      padding: '8px 8px 6px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? '#185FA5' : '#374151' }}>{cell.dayNumber}</span>
                      {isToday && <span style={{ fontSize: 10, color: '#185FA5', fontWeight: 600 }}>Today</span>}
                    </div>
                    {count > 0 ? (
                      <div style={{ display: 'grid', gap: 3 }}>
                        <span style={{ fontSize: 11, color: '#0f172a', fontWeight: 600 }}>{count} task{count > 1 ? 's' : ''}</span>
                        {urgentCount > 0 && <span style={{ fontSize: 10, color: '#b45309' }}>⚠ {urgentCount} urgent</span>}
                        {breachedCount > 0 && <span style={{ fontSize: 10, color: '#b91c1c' }}>🚨 {breachedCount} breached</span>}
                      </div>
                    ) : (
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>No deadlines</span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDay && (
              <div style={{ marginTop: 12, border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, background: '#fff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                  Tasks on {selectedDay.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                {selectedDay.dayTickets.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>No scheduled deadlines for this day.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 7 }}>
                    {selectedDay.dayTickets.map(({ ticket, deadline, sla }) => (
                      <div key={ticket.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, border: '1px solid #f1f5f9', borderRadius: 6, padding: '8px 10px' }}>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1f2937', cursor: 'pointer' }} onClick={() => navigate(`/app/tickets/${ticket.id}`)}>
                            {ticket.title}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {getTicketCategoryMeta(ticket.category)?.icon} {getTicketCategoryMeta(ticket.category)?.label} • Deadline {deadline.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div style={{
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          background: getSLAColor(sla?.status).bg,
                          color: getSLAColor(sla?.status).text,
                          whiteSpace: 'nowrap',
                        }}>
                          {sla?.status === 'breached' ? 'Breached' : formatSLATime(sla?.hoursRemaining || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {filteredTicketsByCategory.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2.2rem 1.25rem',
          borderRadius: 14,
          border: '1px dashed #cbd5e1',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
          color: '#475569',
        }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>{hasActiveFilters ? '🔎' : '👷'}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            {hasActiveFilters 
              ? 'No assignments match your filters' 
              : isAdmin 
              ? 'No assigned tickets yet' 
              : 'No tickets assigned to you'}
          </div>
          <p style={{ margin: '0 auto 16px', maxWidth: 420, fontSize: 13, lineHeight: 1.55 }}>
            {hasActiveFilters
              ? 'Clear the filters to return to the full assignment list, or refresh if you expect new work.'
              : isAdmin
              ? 'Tickets assigned to technicians will appear here. Go to All Tickets to start assigning.'
              : 'Your queue is currently clear. New tickets will appear here as they are assigned.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                style={{
                  padding: '9px 14px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#1f2937',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Clear filters
              </button>
            )}
            <button
              type="button"
              onClick={fetchTickets}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #185FA5, #378ADD)',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 18px rgba(24,95,165,0.22)',
              }}
            >
              Refresh assignments
            </button>
          </div>
        </div>
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
                  <th>SLA</th>
                  <th>Created By</th>
                  {isAdmin && <th>Assigned Technician</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTicketsByCategory.map(t => {
                  const sla = calculateSLAStatus(t);
                  const slaColor = sla ? getSLAColor(sla.status) : null;
                  return (
                  <tr key={t.id} style={{ background: sla?.breached ? 'rgba(255, 227, 227, 0.3)' : 'transparent' }}>
                    <td><strong style={{ cursor: 'pointer', color: '#4f46e5' }} onClick={() => navigate(`/app/tickets/${t.id}`)}>{t.title}</strong></td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', fontSize: 12, fontWeight: 600 }}>
                        {getTicketCategoryMeta(t.category)?.icon} {getTicketCategoryMeta(t.category)?.label}
                      </span>
                    </td>
                    <td><span className={`badge badge-${t.priority?.toLowerCase()}`}>{t.priority}</span></td>
                    <td><span className={`badge badge-${t.status?.toLowerCase()}`}>{t.status}</span></td>
                    <td>
                      {sla && (
                        <div style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          background: slaColor.bg,
                          color: slaColor.text,
                          display: 'inline-block',
                          fontSize: 12,
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                        }}>
                          {sla.status === 'breached' ? '🚨 Breached' : formatSLATime(sla.hoursRemaining)}
                        </div>
                      )}
                    </td>
                    <td>{t.createdByName}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
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
