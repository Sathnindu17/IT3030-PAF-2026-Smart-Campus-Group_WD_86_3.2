import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../../api/axios';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    ticketsAPI.getMyTickets()
      .then(res => setTickets(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div> Loading tickets...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>My Tickets</h2>
        <button onClick={() => navigate('/app/tickets/new')} className="btn btn-primary">+ New Ticket</button>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🎫</div><p>No tickets yet</p></div>
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
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.title}</strong></td>
                    <td>{t.category}</td>
                    <td><span className={`badge badge-${t.priority?.toLowerCase()}`}>{t.priority}</span></td>
                    <td><span className={`badge badge-${t.status?.toLowerCase()}`}>{t.status}</span></td>
                    <td>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <button onClick={() => navigate(`/app/tickets/${t.id}`)} className="btn btn-sm btn-secondary">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
