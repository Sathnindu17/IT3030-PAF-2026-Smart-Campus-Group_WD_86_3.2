import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { calculateSLAStatus, formatSLATime, getSLAColor } from '../../utils/slaCalculator';
import TicketRoleGreeting from '../../components/TicketRoleGreeting';
import { getTicketCategoryMeta } from '../../components/TicketCategoryPicker';

const statusConfig = {
  OPEN: { label: 'Open', bg: '#E6F1FB', color: '#185FA5', dot: '#378ADD' },
  IN_PROGRESS: { label: 'In Progress', bg: '#FAEEDA', color: '#854F0B', dot: '#BA7517' },
  RESOLVED: { label: 'Resolved', bg: '#EAF3DE', color: '#3B6D11', dot: '#639922' },
  CLOSED: { label: 'Closed', bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780' },
  REJECTED: { label: 'Rejected', bg: '#FCEBEB', color: '#791F1F', dot: '#E24B4A' },
};

const priorityConfig = {
  LOW: { label: 'Low', bg: '#EAF3DE', color: '#3B6D11', dot: '#639922' },
  MEDIUM: { label: 'Medium', bg: '#FAEEDA', color: '#854F0B', dot: '#BA7517' },
  HIGH: { label: 'High', bg: '#FAECE7', color: '#993C1D', dot: '#D85A30' },
  URGENT: { label: 'Urgent', bg: '#FCEBEB', color: '#A32D2D', dot: '#E24B4A' },
};

const darkTheme = {
  bg: '#0f172a',
  surfacePrimary: '#1e293b',
  surfaceSecondary: '#334155',
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  border: '#475569',
};

const defaultColumns = {
  title: true,
  category: true,
  priority: true,
  status: true,
  sla: true,
  created: true,
  age: true,
};

const defaultColumnOrder = ['title', 'category', 'priority', 'status', 'sla', 'created', 'age'];

function calculateTicketAge(createdAt) {
  if (!createdAt) return null;
  const diffDays = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return { text: diffDays === 0 ? 'Today' : '1 day old', color: '#3B6D11', bg: '#EAF3DE', alert: false };
  if (diffDays < 7) return { text: `${diffDays}d old`, color: '#854F0B', bg: '#FAEEDA', alert: false };
  if (diffDays < 14) return { text: `${Math.floor(diffDays / 7)}w old`, color: '#854F0B', bg: '#FAEEDA', alert: false };
  return { text: `${Math.floor(diffDays / 7)}w old`, color: '#791F1F', bg: '#FCEBEB', alert: true };
}

function calculateAnalytics(tickets) {
  const resolved = tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status));
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthResolved = resolved.filter((t) => new Date(t.updatedAt || t.createdAt) >= monthStart);
  const pending = tickets.filter((t) => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length;

  const totalHours = monthResolved.reduce((acc, t) => {
    const created = new Date(t.createdAt);
    const ended = new Date(t.updatedAt || t.createdAt);
    return acc + (ended - created) / (1000 * 60 * 60);
  }, 0);

  const avgHours = monthResolved.length ? Math.round(totalHours / monthResolved.length) : 0;
  return {
    avgResolutionTime: avgHours < 24 ? `${avgHours}h` : `${Math.round(avgHours / 24)}d`,
    responseRate: tickets.length ? Math.round((resolved.length / tickets.length) * 100) : 0,
    monthResolved: monthResolved.length,
    pending,
  };
}

function exportToCSV(tickets) {
  const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Created', 'Age'];
  const rows = tickets.map((t) => [
    t.id,
    t.title,
    t.category,
    t.priority,
    t.status,
    t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : '-',
    calculateTicketAge(t.createdAt)?.text || '-',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tickets-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportToPDF(tickets) {
  const win = window.open('', '', 'width=1000,height=700');
  if (!win) return;

  const rows = tickets
    .map(
      (t) => `
      <tr>
        <td>${t.id}</td>
        <td>${t.title || '-'}</td>
        <td>${t.category || '-'}</td>
        <td>${t.priority || '-'}</td>
        <td>${t.status || '-'}</td>
        <td>${t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB') : '-'}</td>
      </tr>
    `,
    )
    .join('');

  win.document.write(`
    <html>
      <head>
        <title>Tickets Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { color: #185FA5; margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #185FA5; color: white; }
        </style>
      </head>
      <body>
        <h1>My Tickets Report</h1>
        <div>Generated: ${new Date().toLocaleString()}</div>
        <table>
          <thead>
            <tr><th>ID</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Created</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 200);
}

function Badge({ config }) {
  if (!config) return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11,
        fontWeight: 500,
        padding: '3px 9px',
        borderRadius: 20,
        background: config.bg,
        color: config.color,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.dot, flexShrink: 0 }} />
      {config.label}
    </span>
  );
}

function Chip({ label, onRemove }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        padding: '5px 12px',
        borderRadius: 20,
        background: '#E6F1FB',
        color: '#185FA5',
        border: '1px solid #B5D4F4',
      }}
    >
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#185FA5', fontSize: 14, lineHeight: 1 }}>
        ×
      </button>
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
  const [deleteMessage, setDeleteMessage] = useState({ ticketId: null, text: '' });

  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('ticketsDarkMode') === 'true');
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('ticketsVisibleColumns');
    return saved ? JSON.parse(saved) : defaultColumns;
  });
  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem('ticketsColumnOrder');
    return saved ? JSON.parse(saved) : defaultColumnOrder;
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [analyticsExpanded, setAnalyticsExpanded] = useState(false);
  const [activityBadges, setActivityBadges] = useState({});
  const [newTicketsCount, setNewTicketsCount] = useState(0);
  const [hoveredTicketId, setHoveredTicketId] = useState(null);

  const wsRef = useRef(null);
  const dragColumnRef = useRef(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  const loadTickets = useCallback(() => {
    setLoading(true);
    ticketsAPI
      .getMyTickets()
      .then((res) => setTickets(res?.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    localStorage.setItem('ticketsDarkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('ticketsVisibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem('ticketsColumnOrder', JSON.stringify(columnOrder));
  }, [columnOrder]);

  useEffect(() => {
    if (!user?.id) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsRef.current = new WebSocket(`${protocol}//${window.location.host}/ws/tickets/${user.id}`);

      wsRef.current.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.action === 'ticket_updated' && payload.ticketId) {
            setActivityBadges((prev) => ({ ...prev, [payload.ticketId]: true }));
            setTimeout(() => {
              setActivityBadges((prev) => ({ ...prev, [payload.ticketId]: false }));
            }, 3000);
          }
          if (payload.action === 'ticket_created') {
            setNewTicketsCount((n) => n + 1);
          }
          loadTickets();
        } catch {
          // ignore malformed websocket messages
        }
      };
    } catch {
      // ignore websocket setup failures
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [user?.id, loadTickets]);

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await ticketsAPI.delete(ticketId);
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      setDeleteMessage({ ticketId: null, text: 'Ticket deleted successfully.' });
    } catch (error) {
      setDeleteMessage({ ticketId, text: error?.response?.data?.message || 'Failed to delete ticket.' });
    } finally {
      setTimeout(() => setDeleteMessage({ ticketId: null, text: '' }), 3000);
    }
  };

  const filteredTickets = useMemo(() => {
    return [...tickets]
      .filter((ticket) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return [ticket.title, ticket.category, ticket.location, ticket.resourceName]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(query));
      })
      .filter((ticket) => (statusFilter ? ticket.status === statusFilter : true))
      .filter((ticket) => (priorityFilter ? ticket.priority === priorityFilter : true))
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
  }, [tickets, search, statusFilter, priorityFilter, sortBy]);

  const stats = useMemo(
    () => [
      { label: 'Total', value: tickets.length, dot: '#888780', bg: '#fafafa', bgGradient: '#f3f4f6', border: '#e5e7eb' },
      {
        label: 'Open',
        value: tickets.filter((t) => ['OPEN', 'IN_PROGRESS'].includes(t.status)).length,
        dot: '#378ADD',
        bg: '#e6f1fb',
        bgGradient: '#dbeafe',
        border: '#bfdbfe',
      },
      {
        label: 'Resolved',
        value: tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length,
        dot: '#639922',
        bg: '#eaf3de',
        bgGradient: '#dcfce7',
        border: '#bbf7d0',
      },
      { label: 'Urgent', value: tickets.filter((t) => t.priority === 'URGENT').length, dot: '#E24B4A', bg: '#fcebeb', bgGradient: '#fee2e2', border: '#fecaca' },
    ],
    [tickets],
  );

  const analytics = useMemo(() => calculateAnalytics(tickets), [tickets]);
  const orderedVisibleColumns = columnOrder.filter((key) => visibleColumns[key]);

  const columnLabel = {
    title: 'Title',
    category: 'Category',
    priority: 'Priority',
    status: 'Status',
    sla: 'SLA',
    created: 'Created',
    age: 'Age',
  };

  const onColumnDragStart = (key) => {
    dragColumnRef.current = key;
  };

  const onColumnDrop = (targetKey) => {
    const sourceKey = dragColumnRef.current;
    if (!sourceKey || sourceKey === targetKey) return;

    setColumnOrder((prev) => {
      const next = [...prev];
      const sourceIndex = next.indexOf(sourceKey);
      const targetIndex = next.indexOf(targetKey);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, sourceKey);
      return next;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: '#6b7280', fontSize: 14 }}>
        <div style={{ width: 18, height: 18, border: '2px solid #e5e7eb', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        Loading tickets...
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 1080,
        margin: '0 auto',
        padding: '2rem 1.5rem',
        fontFamily: 'inherit',
        background: darkMode ? darkTheme.bg : '#fff',
        color: darkMode ? darkTheme.textPrimary : '#111827',
        minHeight: '100vh',
        transition: 'background-color 0.3s ease',
      }}
    >
      <style>{`
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>
            My Tickets{' '}
            {newTicketsCount > 0 && (
              <span style={{ fontSize: 12, marginLeft: 8, background: '#EAF3DE', color: '#3B6D11', padding: '2px 8px', borderRadius: 999 }}>
                +{newTicketsCount} new
              </span>
            )}
          </h2>
          <p style={{ fontSize: 14, color: darkMode ? darkTheme.textSecondary : '#6b7280', margin: 0 }}>Track incidents, responses, and final resolutions in one place.</p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => exportToCSV(filteredTickets)}
            style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: darkMode ? darkTheme.surfaceSecondary : '#fff', color: darkMode ? darkTheme.textPrimary : '#374151', cursor: 'pointer' }}
          >
            CSV
          </button>
          <button
            onClick={() => exportToPDF(filteredTickets)}
            style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: darkMode ? darkTheme.surfaceSecondary : '#fff', color: darkMode ? darkTheme.textPrimary : '#374151', cursor: 'pointer' }}
          >
            PDF
          </button>
          <button
            onClick={() => window.print()}
            style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: darkMode ? darkTheme.surfaceSecondary : '#fff', color: darkMode ? darkTheme.textPrimary : '#374151', cursor: 'pointer' }}
          >
            Print
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowColumnMenu((v) => !v)}
              style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: darkMode ? darkTheme.surfaceSecondary : '#fff', color: darkMode ? darkTheme.textPrimary : '#374151', cursor: 'pointer' }}
            >
              Columns
            </button>
            {showColumnMenu && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  zIndex: 10,
                  width: 220,
                  background: darkMode ? darkTheme.surfacePrimary : '#fff',
                  border: `1px solid ${darkMode ? darkTheme.border : '#d1d5db'}`,
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  padding: 8,
                }}
              >
                {columnOrder.map((key) => (
                  <div
                    key={key}
                    draggable
                    onDragStart={() => onColumnDragStart(key)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onColumnDrop(key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'grab' }}
                  >
                    <input type="checkbox" checked={visibleColumns[key]} onChange={() => setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))} />
                    <span style={{ fontSize: 12, flex: 1 }}>{columnLabel[key]}</span>
                    <span style={{ fontSize: 12, color: darkMode ? darkTheme.textSecondary : '#9ca3af' }}>↕</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setDarkMode((v) => !v)}
            style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: darkMode ? '#1e3a5f' : '#e6f1fb', color: darkMode ? '#93c5fd' : '#185FA5', cursor: 'pointer' }}
          >
            {darkMode ? 'Dark' : 'Light'}
          </button>
          <button onClick={() => navigate('/app/tickets/new')} style={{ fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', cursor: 'pointer' }}>
            + New Ticket
          </button>
        </div>
      </div>

      <TicketRoleGreeting style={{ marginBottom: '1rem' }} />

      <div style={{ background: darkMode ? '#0b3558' : 'linear-gradient(90deg, #e0f2fe, #dbeafe)', border: `1px solid ${darkMode ? '#1d4c76' : '#bfdbfe'}`, borderRadius: 12, padding: '12px 14px', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: darkMode ? '#93c5fd' : '#0369a1' }}>Avg Resolution Time</div>
              <div style={{ fontWeight: 700 }}>{analytics.avgResolutionTime}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: darkMode ? '#93c5fd' : '#0369a1' }}>Response Rate</div>
              <div style={{ fontWeight: 700 }}>{analytics.responseRate}%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: darkMode ? '#93c5fd' : '#0369a1' }}>This Month</div>
              <div style={{ fontWeight: 700 }}>
                {analytics.monthResolved} resolved, {analytics.pending} pending
              </div>
            </div>
          </div>
          <button onClick={() => setAnalyticsExpanded((v) => !v)} style={{ border: 'none', background: '#0369a1', color: '#fff', borderRadius: 6, padding: '7px 10px', cursor: 'pointer', fontSize: 12 }}>
            {analyticsExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
        {analyticsExpanded && <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.25)', paddingTop: 10, fontSize: 12 }}>Efficiency score: {Math.min(100, Math.round(analytics.responseRate * 1.2))}%</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: '1rem' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: darkMode ? darkTheme.surfacePrimary : `linear-gradient(135deg, ${s.bg} 0%, ${s.bgGradient} 100%)`, border: `1px solid ${darkMode ? darkTheme.border : s.border}`, borderRadius: 12, padding: '14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, background: s.dot, borderRadius: '50%' }} />
              <span style={{ fontSize: 12, color: darkMode ? darkTheme.textSecondary : '#6b7280' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, category, location..."
          style={{ flex: 1, minWidth: 220, padding: '10px 12px', borderRadius: 8, border: `1px solid ${darkMode ? darkTheme.border : '#d1d5db'}`, background: darkMode ? darkTheme.surfacePrimary : '#fff', color: darkMode ? darkTheme.textPrimary : '#111827' }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${darkMode ? darkTheme.border : '#d1d5db'}`, background: darkMode ? darkTheme.surfacePrimary : '#fff', color: darkMode ? darkTheme.textPrimary : '#111827' }}>
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${darkMode ? darkTheme.border : '#d1d5db'}`, background: darkMode ? darkTheme.surfacePrimary : '#fff', color: darkMode ? darkTheme.textPrimary : '#111827' }}>
          <option value="">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${darkMode ? darkTheme.border : '#d1d5db'}`, background: darkMode ? darkTheme.surfacePrimary : '#fff', color: darkMode ? darkTheme.textPrimary : '#111827' }}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="priority">By Priority</option>
        </select>
      </div>

      {(search || statusFilter || priorityFilter) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem' }}>
          {search && <Chip label={`"${search}"`} onRemove={() => setSearch('')} />}
          {statusFilter && <Chip label={statusConfig[statusFilter]?.label || statusFilter} onRemove={() => setStatusFilter('')} />}
          {priorityFilter && <Chip label={priorityConfig[priorityFilter]?.label || priorityFilter} onRemove={() => setPriorityFilter('')} />}
        </div>
      )}

      {deleteMessage.text && <div style={{ marginBottom: '0.75rem', color: deleteMessage.ticketId ? '#A32D2D' : '#3B6D11', fontSize: 12 }}>{deleteMessage.text}</div>}

      {filteredTickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', border: `1px dashed ${darkMode ? darkTheme.border : '#d1d5db'}`, borderRadius: 10, color: darkMode ? darkTheme.textSecondary : '#6b7280' }}>No tickets found.</div>
      ) : (
        <div style={{ border: `1px solid ${darkMode ? darkTheme.border : '#e5e7eb'}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: darkMode ? darkTheme.surfaceSecondary : '#f9fafb' }}>
                {orderedVisibleColumns.map((key) => (
                  <th key={key} style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: darkMode ? darkTheme.textSecondary : '#6b7280' }}>
                    {columnLabel[key]}
                  </th>
                ))}
                <th style={{ padding: '12px 14px' }}></th>
                <th style={{ padding: '12px 14px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t, idx) => {
                const sla = calculateSLAStatus(t);
                const slaColor = sla ? getSLAColor(sla.status) : null;
                const age = calculateTicketAge(t.createdAt);
                const lastComment = t.latestComment || t.lastComment || t.latestCommentText || '';
                const isUpdated = !!activityBadges[t.id];

                return (
                  <tr
                    key={t.id}
                    style={{
                      borderTop: idx === 0 ? 'none' : `1px solid ${darkMode ? darkTheme.border : '#f3f4f6'}`,
                      background: sla?.breached ? (darkMode ? 'rgba(239,68,68,0.12)' : 'rgba(255,227,227,0.25)') : 'transparent',
                      position: 'relative',
                    }}
                    onMouseEnter={() => setHoveredTicketId(t.id)}
                    onMouseLeave={() => setHoveredTicketId(null)}
                  >
                    {orderedVisibleColumns.map((key) => {
                      if (key === 'title') {
                        return (
                          <td key={key} style={{ padding: '12px 14px', maxWidth: 280 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {isUpdated && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s ease-in-out infinite' }} />}
                              <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                            </div>
                            {t.location && <div style={{ fontSize: 11, color: darkMode ? darkTheme.textSecondary : '#9ca3af', marginTop: 4 }}>📍 {t.location}</div>}
                            {hoveredTicketId === t.id && lastComment && (
                              <div style={{ marginTop: 6, fontSize: 11, color: darkMode ? '#bfdbfe' : '#1e3a8a', background: darkMode ? 'rgba(59,130,246,0.12)' : '#eff6ff', borderRadius: 6, padding: '4px 6px' }}>
                                Latest: {String(lastComment).slice(0, 60)}{String(lastComment).length > 60 ? '...' : ''}
                              </div>
                            )}
                          </td>
                        );
                      }

                      if (key === 'category') return <td key={key} style={{ padding: '12px 14px' }}>{getTicketCategoryMeta(t.category)?.icon} {getTicketCategoryMeta(t.category)?.label}</td>;
                      if (key === 'priority') return <td key={key} style={{ padding: '12px 14px' }}><Badge config={priorityConfig[t.priority]} /></td>;
                      if (key === 'status') return <td key={key} style={{ padding: '12px 14px' }}><Badge config={statusConfig[t.status]} /></td>;

                      if (key === 'sla') {
                        return (
                          <td key={key} style={{ padding: '12px 14px' }}>
                            {sla && (
                              <span style={{ padding: '4px 10px', borderRadius: 8, background: slaColor.bg, color: slaColor.text, fontSize: 11, fontWeight: 600 }}>
                                {sla.status === 'breached' ? 'Breached' : formatSLATime(sla.hoursRemaining)}
                              </span>
                            )}
                          </td>
                        );
                      }

                      if (key === 'created') return <td key={key} style={{ padding: '12px 14px', color: darkMode ? darkTheme.textSecondary : '#9ca3af', fontSize: 12 }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>;

                      if (key === 'age') {
                        return (
                          <td key={key} style={{ padding: '12px 14px' }}>
                            {age && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 16, background: age.bg, color: age.color, borderLeft: age.alert ? `3px solid ${age.color}` : 'none', fontSize: 11, fontWeight: 600 }}>
                                ⏱ {age.text}
                              </span>
                            )}
                          </td>
                        );
                      }

                      return null;
                    })}

                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => navigate(`/app/tickets/${t.id}`)} style={{ fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 7, border: `1px solid ${darkMode ? darkTheme.border : '#d1d5db'}`, background: darkMode ? darkTheme.surfaceSecondary : '#fff', color: darkMode ? darkTheme.textPrimary : '#374151', cursor: 'pointer' }}>
                        View
                      </button>
                    </td>
                    <td style={{ padding: '12px 14px', display: 'flex', gap: 8 }}>
                      {t.createdBy === user?.id && (
                        <>
                          <button onClick={() => navigate(`/app/tickets/${t.id}/edit`)} style={{ fontSize: 12, fontWeight: 600, padding: '6px 10px', borderRadius: 7, border: '1px solid #185FA5', background: darkMode ? 'rgba(96,165,250,0.15)' : '#E6F1FB', color: darkMode ? '#93c5fd' : '#185FA5', cursor: 'pointer' }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteTicket(t.id)} style={{ fontSize: 12, fontWeight: 600, padding: '6px 10px', borderRadius: 7, border: '1px solid #E24B4A', background: darkMode ? 'rgba(248,113,113,0.15)' : '#FCEBEB', color: darkMode ? '#fca5a5' : '#A32D2D', cursor: 'pointer' }}>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ padding: '10px 14px', borderTop: `1px solid ${darkMode ? darkTheme.border : '#f3f4f6'}`, fontSize: 12, color: darkMode ? darkTheme.textSecondary : '#9ca3af', background: darkMode ? darkTheme.surfaceSecondary : '#fafafa' }}>
            Showing {filteredTickets.length} of {tickets.length} tickets
          </div>
        </div>
      )}
    </div>
  );
}
