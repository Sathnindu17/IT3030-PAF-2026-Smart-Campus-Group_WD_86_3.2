import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketsAPI, commentsAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { calculateSLAStatus, formatSLATime, getSLAColor, getSLABadgeLabel } from '../../utils/slaCalculator';
import { getTicketCategoryMeta } from '../../components/TicketCategoryPicker';

const ticketFlow = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

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
      fontSize: 11, fontWeight: 500, padding: '3px 10px',
      borderRadius: 20, background: config.bg, color: config.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.dot, flexShrink: 0 }} />
      {config.label}
    </span>
  );
}

function Avatar({ name }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
  const colors = ['#185FA5', '#639922', '#854F0B', '#993C1D', '#3B6D11'];
  const bg = colors[name?.charCodeAt(0) % colors.length] || '#185FA5';
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', background: bg,
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 500, flexShrink: 0,
    }}>{initials}</div>
  );
}

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [slaStatus, setSlaStatus] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchTicket(); fetchComments(); }, [id]);

  const fetchTicket = async () => {
    try {
      const res = await ticketsAPI.getById(id);
      setTicket(res.data.data);
      const sla = calculateSLAStatus(res.data.data);
      setSlaStatus(sla);
    } catch (e) {} finally { setLoading(false); }
  };

  const fetchComments = async () => {
    try {
      const res = await commentsAPI.getByTicket(id);
      setComments(res.data.data);
    } catch (e) {}
  };

  const showMessage = (type, text) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage({ type: '', text: '' }), 3000);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await commentsAPI.create({ ticketId: id, message: newComment });
      setNewComment('');
      showMessage('success', 'Comment added successfully.');
      fetchComments();
    } catch (e) {
      showMessage('error', e.response?.data?.message || 'Failed to add comment');
    } finally { setSubmitting(false); }
  };

  const handleEditComment = async (commentId) => {
    try {
      await commentsAPI.update(commentId, editText);
      setEditingComment(null);
      setEditText('');
      showMessage('success', 'Comment updated.');
      fetchComments();
    } catch (e) {
      showMessage('error', e.response?.data?.message || 'Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentsAPI.delete(commentId);
      showMessage('success', 'Comment deleted.');
      fetchComments();
    } catch (e) {
      showMessage('error', e.response?.data?.message || 'Failed to delete comment');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
  const formatDateShort = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const currentStatusStep = ticketFlow.indexOf(ticket?.status);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: '#6b7280', fontSize: 14 }}>
      <div style={{ width: 18, height: 18, border: '2px solid #e5e7eb', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      Loading ticket...
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!ticket) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🎫</div>
      <p style={{ fontSize: 15, color: '#374151', fontWeight: 500 }}>Ticket not found</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'inherit' }}>

      {/* Back + Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <button onClick={() => navigate(-1)}
          style={{ fontSize: 13, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Back to tickets
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px' }}>{ticket.title}</h2>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 10px', fontFamily: 'monospace' }}>ID: {ticket.id}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Badge config={statusConfig[ticket.status]} />
              <Badge config={priorityConfig[ticket.priority]} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: '#F1EFE8', color: '#5F5E5A' }}>
                {getTicketCategoryMeta(ticket.category)?.icon} {getTicketCategoryMeta(ticket.category)?.label}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right' }}>
            <div>Created {formatDateShort(ticket.createdAt)}</div>
            {ticket.createdByName && <div style={{ marginTop: 2 }}>by {ticket.createdByName}</div>}
          </div>
        </div>
      </div>

      {/* Alert */}
      {actionMessage.text && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: '1.25rem',
          background: actionMessage.type === 'error' ? '#FCEBEB' : '#EAF3DE',
          border: `0.5px solid ${actionMessage.type === 'error' ? '#F09595' : '#97C459'}`,
          color: actionMessage.type === 'error' ? '#791F1F' : '#27500A',
        }}>
          {actionMessage.text}
        </div>
      )}

      {/* SLA Timer Section */}
      {slaStatus && (
        <div style={{
          marginBottom: 24,
          border: `2px solid ${getSLAColor(slaStatus.status).border}`,
          background: getSLAColor(slaStatus.status).bg,
          borderRadius: 12,
          padding: '1rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 4,
              }}>
                SLA {slaStatus.type} Timeline
              </div>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: getSLAColor(slaStatus.status).text,
              }}>
                {slaStatus.status === 'breached' ? '🚨 SLA Breached' : '⏱️ ' + formatSLATime(slaStatus.hoursRemaining) + ' Remaining'}
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <div style={{ width: 100, height: 8, background: '#e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, slaStatus.percentage)}%`,
                    height: '100%',
                    background: getSLAColor(slaStatus.status).badge,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                color: getSLAColor(slaStatus.status).text,
                minWidth: 35,
              }}>
                {Math.round(slaStatus.percentage)}%
              </span>
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginTop: 10,
            fontSize: 12,
            color: getSLAColor(slaStatus.status).text,
          }}>
            <div>
              <span style={{ fontWeight: 500, opacity: 0.8 }}>Allowed: </span>
              {slaStatus.hoursAllowed}h
            </div>
            <div>
              <span style={{ fontWeight: 500, opacity: 0.8 }}>Used: </span>
              {Math.ceil(slaStatus.elapsedHours)}h
            </div>
          </div>
        </div>
      )}

      {/* Workflow Progress */}
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>Workflow progress</div>
        {ticket.status === 'REJECTED' ? (
          <div style={{ padding: '12px 14px', background: '#FCEBEB', border: '0.5px solid #F09595', color: '#791F1F', borderRadius: 8, fontSize: 13 }}>
            Ticket was rejected. Reason: {ticket.rejectionReason || ticket.rejectReason || ticket.reason || 'Not provided'}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {ticketFlow.map((status, index) => {
              const isDone = index < currentStatusStep;
              const isActive = index === currentStatusStep;
              const cfg = statusConfig[status];
              return (
                <div key={status} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? '#639922' : isActive ? cfg?.dot || '#185FA5' : '#f3f4f6',
                      border: `2px solid ${isDone ? '#639922' : isActive ? cfg?.dot || '#185FA5' : '#e5e7eb'}`,
                      transition: 'all .3s',
                    }}>
                      {isDone ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#fff' : '#d1d5db' }} />
                      )}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: isActive ? 500 : 400, color: isActive ? '#111827' : isDone ? '#3B6D11' : '#9ca3af', whiteSpace: 'nowrap' }}>
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                  {index < ticketFlow.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: isDone ? '#639922' : '#e5e7eb', marginBottom: 20, transition: 'background .3s' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <div style={sectionLabelStyle}>Ticket details</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: 16 }}>
          {[
            { label: 'Created by', value: ticket.createdByName },
            { label: 'Created at', value: formatDate(ticket.createdAt) },
            { label: 'Location', value: ticket.location || ticket.resourceName || '—' },
            { label: 'Preferred contact', value: ticket.preferredContact || '—' },
            ticket.assignedTechnicianId && { label: 'Assigned technician', value: ticket.assignedTechnicianName || `Technician ${ticket.assignedTechnicianId.substring(0, 8)}...` },
            ticket.resourceName && { label: 'Related resource', value: ticket.resourceName },
          ].filter(Boolean).map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: '#111827' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '0.5px solid #f3f4f6', paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Description</div>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>{ticket.description}</p>
        </div>

        {ticket.resolutionNotes && (
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#3B6D11', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>Resolution notes</div>
            <p style={{ fontSize: 13, color: '#27500A', margin: 0, lineHeight: 1.6 }}>{ticket.resolutionNotes}</p>
          </div>
        )}

        {/* Attachments */}
        {ticket.attachmentUrls?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Attachments</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {ticket.attachmentUrls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', border: '0.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', textDecoration: 'none' }}>
                  <img src={url} alt={`Attachment ${i + 1}`} style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '5px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>Attachment {i + 1}</span>
                    <span style={{ fontSize: 11, color: '#185FA5' }}>Open ↗</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Comments */}
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <div style={sectionLabelStyle}>Comments ({comments.length})</div>

        {comments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: 13 }}>
            No comments yet. Be the first to add one.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {comments.map((c, idx) => (
            <div key={c.id} style={{
              display: 'flex', gap: 12, padding: '14px 0',
              borderBottom: idx < comments.length - 1 ? '0.5px solid #f3f4f6' : 'none',
            }}>
              <Avatar name={c.authorName} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{c.authorName}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{formatDate(c.createdAt)}</span>
                  </div>
                  {c.authorId === user?.id && editingComment !== c.id && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditingComment(c.id); setEditText(c.message); }}
                        style={ghostActionBtn}>Edit</button>
                      <button onClick={() => handleDeleteComment(c.id)}
                        style={{ ...ghostActionBtn, color: '#A32D2D' }}>Delete</button>
                    </div>
                  )}
                </div>

                {editingComment === c.id ? (
                  <div>
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      style={{ ...textareaStyle, minHeight: 70 }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => handleEditComment(c.id)} style={primarySmallBtn}>Save</button>
                      <button onClick={() => setEditingComment(null)} style={ghostSmallBtn}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.6 }}>{c.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Comment */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '0.5px solid #f3f4f6', display: 'flex', gap: 12 }}>
          <Avatar name={user?.name || user?.email} />
          <form onSubmit={handleAddComment} style={{ flex: 1 }}>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              style={{ ...textareaStyle, minHeight: 80 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="submit" disabled={submitting || !newComment.trim()}
                style={submitting || !newComment.trim() ? { ...primarySmallBtn, opacity: 0.45, cursor: 'not-allowed' } : primarySmallBtn}>
                {submitting ? 'Posting...' : 'Add comment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: '#fff', border: '0.5px solid #e5e7eb', borderRadius: 12, padding: '1.5rem',
};
const sectionLabelStyle = {
  fontSize: 11, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase',
  color: '#9ca3af', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '0.5px solid #f3f4f6',
};
const textareaStyle = {
  width: '100%', fontSize: 13, color: '#111827', background: '#f9fafb',
  border: '0.5px solid #d1d5db', borderRadius: 8, padding: '9px 12px',
  outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6,
  boxSizing: 'border-box',
};
const primarySmallBtn = {
  fontSize: 12, fontWeight: 500, padding: '7px 16px', borderRadius: 7,
  border: 'none', cursor: 'pointer', background: '#185FA5', color: '#fff', fontFamily: 'inherit',
};
const ghostSmallBtn = {
  fontSize: 12, padding: '7px 14px', borderRadius: 7,
  border: '0.5px solid #d1d5db', cursor: 'pointer', background: '#fff', color: '#374151', fontFamily: 'inherit',
};
const ghostActionBtn = {
  fontSize: 11, color: '#6b7280', background: 'none', border: 'none',
  cursor: 'pointer', fontFamily: 'inherit', padding: '2px 6px',
};