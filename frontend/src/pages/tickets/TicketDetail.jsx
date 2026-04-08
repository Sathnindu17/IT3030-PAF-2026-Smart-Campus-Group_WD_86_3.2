import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ticketsAPI, commentsAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function TicketDetail() {
  const { id } = useParams();
  const { user, hasRole } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicket();
    fetchComments();
  }, [id]);

  const fetchTicket = async () => {
    try {
      const res = await ticketsAPI.getById(id);
      setTicket(res.data.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const fetchComments = async () => {
    try {
      const res = await commentsAPI.getByTicket(id);
      setComments(res.data.data);
    } catch (e) {}
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await commentsAPI.create({ ticketId: id, message: newComment });
      setNewComment('');
      fetchComments();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleEditComment = async (commentId) => {
    try {
      await commentsAPI.update(commentId, editText);
      setEditingComment(null);
      setEditText('');
      fetchComments();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentsAPI.delete(commentId);
      fetchComments();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete comment');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString() : '-';

  if (loading) return <div className="loading"><div className="spinner"></div> Loading ticket...</div>;
  if (!ticket) return <div className="empty-state"><p>Ticket not found</p></div>;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2>{ticket.title}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <span className={`badge badge-${ticket.status?.toLowerCase()}`}>{ticket.status}</span>
            <span className={`badge badge-${ticket.priority?.toLowerCase()}`}>{ticket.priority}</span>
            <span className="badge" style={{ background: '#f3f4f6', color: '#374151' }}>{ticket.category}</span>
          </div>
        </div>
      </div>

      {/* Ticket Details */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><h3>Details</h3></div>
        <div className="card-body">
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">Created By</div>
              <div className="detail-value">{ticket.createdByName}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Created At</div>
              <div className="detail-value">{formatDate(ticket.createdAt)}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Location</div>
              <div className="detail-value">{ticket.location || ticket.resourceName || '-'}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">Contact</div>
              <div className="detail-value">{ticket.preferredContact || '-'}</div>
            </div>
            {ticket.assignedTechnicianName && (
              <div className="detail-item">
                <div className="detail-label">Assigned Technician</div>
                <div className="detail-value">{ticket.assignedTechnicianName}</div>
              </div>
            )}
            {ticket.resourceName && (
              <div className="detail-item">
                <div className="detail-label">Related Resource</div>
                <div className="detail-value">{ticket.resourceName}</div>
              </div>
            )}
          </div>

          <div className="detail-item" style={{ marginTop: 16 }}>
            <div className="detail-label">Description</div>
            <div className="detail-value">{ticket.description}</div>
          </div>

          {ticket.resolutionNotes && (
            <div className="detail-item" style={{ marginTop: 16 }}>
              <div className="detail-label">Resolution Notes</div>
              <div className="detail-value" style={{ background: '#d1fae5', padding: 12, borderRadius: 8 }}>
                {ticket.resolutionNotes}
              </div>
            </div>
          )}

          {/* Attachments */}
          {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
            <div className="detail-item" style={{ marginTop: 16 }}>
              <div className="detail-label">Attachments</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                {ticket.attachmentUrls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Attachment ${i + 1}`}
                      style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="card">
        <div className="card-header"><h3>Comments ({comments.length})</h3></div>
        <div className="card-body">
          {comments.length === 0 && (
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>No comments yet</p>
          )}

          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <div className="comment-header">
                <div>
                  <span className="comment-author">{c.authorName}</span>
                  <span className="comment-time" style={{ marginLeft: 8 }}>{formatDate(c.createdAt)}</span>
                </div>
                {c.authorId === user?.id && (
                  <div className="comment-actions">
                    <button onClick={() => { setEditingComment(c.id); setEditText(c.message); }}>Edit</button>
                    <button onClick={() => handleDeleteComment(c.id)}>Delete</button>
                  </div>
                )}
              </div>
              {editingComment === c.id ? (
                <div style={{ marginTop: 8 }}>
                  <textarea className="form-control" value={editText}
                    onChange={e => setEditText(e.target.value)} style={{ minHeight: 60 }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => handleEditComment(c.id)} className="btn btn-sm btn-primary">Save</button>
                    <button onClick={() => setEditingComment(null)} className="btn btn-sm btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="comment-body">{c.message}</div>
              )}
            </div>
          ))}

          {/* Add Comment */}
          <form onSubmit={handleAddComment} style={{ marginTop: 16 }}>
            <div className="form-group">
              <textarea className="form-control" value={newComment} onChange={e => setNewComment(e.target.value)}
                placeholder="Write a comment..." style={{ minHeight: 70 }} />
            </div>
            <button type="submit" className="btn btn-sm btn-primary">Add Comment</button>
          </form>
        </div>
      </div>
    </div>
  );
}
