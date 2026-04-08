import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourcesAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function ResourceList() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '' });
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchResources(); }, [filters]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      const res = await resourcesAPI.getAll(params);
      setResources(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await resourcesAPI.delete(id);
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      alert('Delete failed: ' + (e.response?.data?.message || e.message));
    }
  };

  const typeLabel = (t) => t?.replace(/_/g, ' ') || '';

  if (loading) return <div className="loading"><div className="spinner"></div> Loading resources...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Resources & Facilities</h2>
        {hasRole('ADMIN') && (
          <button onClick={() => navigate('/app/resources/new')} className="btn btn-primary">+ Add Resource</button>
        )}
      </div>

      <div className="filters">
        <select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="LECTURE_HALL">Lecture Hall</option>
          <option value="LAB">Lab</option>
          <option value="MEETING_ROOM">Meeting Room</option>
          <option value="EQUIPMENT">Equipment</option>
        </select>
        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="OUT_OF_SERVICE">Out of Service</option>
        </select>
      </div>

      {resources.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <p>No resources found</p>
        </div>
      ) : (
        <div className="resource-grid">
          {resources.map(r => (
            <div key={r.id} className="resource-card">
              <h3>{r.name}</h3>
              <div className="resource-meta">
                <span className={`badge badge-${r.status?.toLowerCase()}`}>{r.status}</span>
                <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>{typeLabel(r.type)}</span>
                <span className="badge" style={{ background: '#f3f4f6', color: '#374151' }}>👥 {r.capacity}</span>
              </div>
              <div className="resource-desc">📍 {r.location}</div>
              {r.description && <div className="resource-desc">{r.description}</div>}
              <div className="resource-actions">
                <button onClick={() => navigate(`/app/bookings/new?resourceId=${r.id}`)}
                  className="btn btn-sm btn-primary">Book</button>
                {hasRole('ADMIN') && (
                  <>
                    <button onClick={() => navigate(`/app/resources/edit/${r.id}`)}
                      className="btn btn-sm btn-secondary">Edit</button>
                    <button onClick={() => handleDelete(r.id)}
                      className="btn btn-sm btn-danger">Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
