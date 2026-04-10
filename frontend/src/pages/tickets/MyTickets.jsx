import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../../api/axios';

const statusConfig = {
  OPEN:        { label: 'Open',        bg: '#E6F1FB', color: '#185FA5', dot: '#378ADD' },
  IN_PROGRESS: { label: 'In Progress', bg: '#FAEEDA', color: '#854F0B', dot: '#BA7517' },
  RESOLVED:    { label: 'Resolved',    bg: '#EAF3DE', color: '#3B6D11', dot: '#639922' },
  CLOSED:      { label: 'Closed',      bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780' },
  REJECTED:    { label: 'Rejected',    bg: '#FCEBEB', color: '#791F1F', dot: '#E24B4A' },
};

const priorityConfig = {
  LOW:    { label: 'Low',    bg: '#EAF3DE', color: '#3B6D11', dot: '#639922' },
  MEDIUM: { label: 'Medium', bg: '#FAEEDA', color: '#854F0B', dot: '#BA7517' },
  HIGH:   { label: 'High',   bg: '#FAECE7', color: '#993C1D', dot: '#D85A30' },
  URGENT: { label: 'Urgent', bg: '#FCEBEB', color: '#A32D2D', dot: '#E24B4A' },
};

function Badge({ config }) {
  if (!config) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 500, padding: '3px 9px',
      borderRadius: 20, background: config.bg, color: config.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.dot, flexShrink: 0 }} />
      {config.label}
    </span>
  );
}

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    ticketsAPI.getMyTickets()
      .then(res => setTickets(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredTickets = tickets
    .filter(ticket => {
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return [ticket.title, ticket.category, ticket.location, ticket.resourceName]
        .filter(Boolean).some(v => String(v).toLowerCase().includes(query));
    })
    .filter(ticket => statusFilter ? ticket.status === statusFilter : true)
    .filter(ticket => priorityFilter ? ticket.priority === priorityFilter : true)
    .sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (sortBy === 'oldest') return aDate - bDate;
      if (sortBy === 'priority') {
        const rank = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (rank[b.priority] || 0) - (rank[a.priority] || 0);
      }
      return bDate - aDate;
    });

  const stats = [
    { label: 'Total', value: tickets.length, dot: '#888780' },
    { label: 'Open', value: tickets.filter(t => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length, dot: '#378ADD' },
    { label: 'Resolved', value: tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length, dot: '#639922' },
    { label: 'Urgent', value: tickets.filter(t => t.priority === 'URGENT').length, dot: '#E24B4A' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: '#6b7280', fontSize: 14 }}>
      <div style={{ width: 18, height: 18, border: '2px solid #e5e7eb', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      Loading tickets...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'inherit' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px' }}>My Tickets</h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Track incidents, responses, and final resolutions in one place.</p>
        </div>
        <button
          onClick={() => navigate('/app/tickets/new')}
          style={{ fontSize: 13, fontWeight: 500, padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#185FA5', color: '#fff', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
        >
          + New Ticket
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: '1.5rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#f9fafb', border: '0.5px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot }} />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 500, color: '#111827' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, category, location..."
          style={{
            flex: 1, minWidth: 200, fontSize: 13, padding: '8px 12px',
            border: '0.5px solid #d1d5db', borderRadius: 8,
            background: '#f9fafb', color: '#111827', outline: 'none', fontFamily: 'inherit',
          }}
        />
        {[
          { value: statusFilter, onChange: setStatusFilter, options: [['', 'All Status'], ['OPEN', 'Open'], ['IN_PROGRESS', 'In Progress'], ['RESOLVED', 'Resolved'], ['CLOSED', 'Closed'], ['REJECTED', 'Rejected']] },
          { value: priorityFilter, onChange: setPriorityFilter, options: [['', 'All Priority'], ['LOW', 'Low'], ['MEDIUM', 'Medium'], ['HIGH', 'High'], ['URGENT', 'Urgent']] },
          { value: sortBy, onChange: setSortBy, options: [['newest', 'Newest First'], ['oldest', 'Oldest First'], ['priority', 'By Priority']] },
        ].map((sel, i) => (
          <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)}
            style={{ fontSize: 13, padding: '8px 12px', border: '0.5px solid #d1d5db', borderRadius: 8, background: '#f9fafb', color: '#374151', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
            {sel.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        ))}
      </div>

      {/* Active filter chips */}
      {(statusFilter || priorityFilter || search) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '1rem' }}>
          {search && <Chip label={`"${search}"`} onRemove={() => setSearch('')} />}
          {statusFilter && <Chip label={statusConfig[statusFilter]?.label || statusFilter} onRemove={() => setStatusFilter('')} />}
          {priorityFilter && <Chip label={priorityConfig[priorityFilter]?.label || priorityFilter} onRemove={() => setPriorityFilter('')} />}
        </div>
      )}

      {/* Table / Empty */}
      {filteredTickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9ca3af' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎫</div>
          <p style={{ fontSize: 15, margin: '0 0 4px', color: '#374151', fontWeight: 500 }}>No tickets found</p>
          <p style={{ fontSize: 13, margin: 0 }}>Try adjusting your filters or create a new ticket.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '0.5px solid #e5e7eb' }}>
                {['Title', 'Category', 'Priority', 'Status', 'Created', ''].map((h, i) => (
                  <th key={i} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: '#6b7280', fontSize: 11, letterSpacing: '.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t, idx) => (
                <tr key={t.id}
                  style={{ borderBottom: idx < filteredTickets.length - 1 ? '0.5px solid #f3f4f6' : 'none', transition: 'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', maxWidth: 220 }}>
                    <div style={{ fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    {t.location && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{t.location}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                    {t.category?.replace('_', ' ')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge config={priorityConfig[t.priority]} />
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge config={statusConfig[t.status]} />
                  </td>
                  <td style={{ padding: '12px 16px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => navigate(`/app/tickets/${t.id}`)}
                      style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 6, border: '0.5px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#9ca3af'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 16px', borderTop: '0.5px solid #f3f4f6', fontSize: 12, color: '#9ca3af' }}>
            Showing {filteredTickets.length} of {tickets.length} tickets
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#E6F1FB', color: '#185FA5', border: '0.5px solid #B5D4F4' }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#185FA5', fontSize: 13, padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}>×</button>
    </span>
  );
}