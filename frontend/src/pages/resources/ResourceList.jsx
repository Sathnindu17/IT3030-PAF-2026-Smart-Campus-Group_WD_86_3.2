import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourcesAPI } from '../../api/axios';

export default function ResourceList() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '' });
  const [recommendForm, setRecommendForm] = useState({
    attendees: 40,
    type: 'LAB',
    equipment: '',
    preferredLocation: '',
    date: '',
    startTime: '',
    endTime: ''
  });
  const [recommendations, setRecommendations] = useState([]);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendError, setRecommendError] = useState('');
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

  const handleRecommend = async (e) => {
    e.preventDefault();
    setRecommendError('');
    setRecommendLoading(true);
    try {
      const params = {
        attendees: recommendForm.attendees,
      };
      if (recommendForm.type) params.type = recommendForm.type;
      if (recommendForm.equipment) params.equipment = recommendForm.equipment;
      if (recommendForm.preferredLocation) params.preferredLocation = recommendForm.preferredLocation;
      if (recommendForm.date && recommendForm.startTime && recommendForm.endTime) {
        params.date = recommendForm.date;
        params.startTime = recommendForm.startTime;
        params.endTime = recommendForm.endTime;
      }

      const res = await resourcesAPI.recommend(params);
      setRecommendations(res.data.data || []);
    } catch (err) {
      setRecommendError(err.response?.data?.message || 'Failed to load recommendations');
      setRecommendations([]);
    } finally {
      setRecommendLoading(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div> Loading resources...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2>Resources & Facilities</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/app/resources/map')} className="btn btn-secondary">Campus Map</button>
          <button onClick={() => navigate('/app/resources/new')} className="btn btn-primary">+ Add Resource</button>
        </div>
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
          <option value="UNDER_RENOVATION">Under Renovation</option>
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
              {r.equipment?.length > 0 && <div className="resource-desc">🧰 {r.equipment.join(', ')}</div>}
              {r.description && <div className="resource-desc">{r.description}</div>}
              <div className="resource-actions">
                <button onClick={() => navigate(`/app/bookings/new?resourceId=${r.id}`)}
                  className="btn btn-sm btn-primary">Book</button>
                <button onClick={() => navigate(`/app/resources/edit/${r.id}`)}
                  className="btn btn-sm btn-primary">Edit</button>
                <button onClick={() => handleDelete(r.id)}
                  className="btn btn-sm btn-primary">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-body">
          <h3 style={{ marginBottom: 12 }}>Smart Resource Recommendation</h3>
          <p style={{ marginTop: 0, color: '#6b7280' }}>Example: Best lab available for 40 students.</p>
          <form onSubmit={handleRecommend}>
            <div className="form-row">
              <div className="form-group">
                <label>Capacity Needed</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={recommendForm.attendees}
                  onChange={e => setRecommendForm({ ...recommendForm, attendees: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Resource Type</label>
                <select
                  className="form-control"
                  value={recommendForm.type}
                  onChange={e => setRecommendForm({ ...recommendForm, type: e.target.value })}
                >
                  <option value="">Any Type</option>
                  <option value="LECTURE_HALL">Lecture Hall</option>
                  <option value="LAB">Lab</option>
                  <option value="MEETING_ROOM">Meeting Room</option>
                  <option value="EQUIPMENT">Equipment</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Equipment Required (comma separated)</label>
                <input
                  className="form-control"
                  value={recommendForm.equipment}
                  onChange={e => setRecommendForm({ ...recommendForm, equipment: e.target.value })}
                  placeholder="e.g. Projector, Smart Board"
                />
              </div>
              <div className="form-group">
                <label>Preferred Location</label>
                <input
                  className="form-control"
                  value={recommendForm.preferredLocation}
                  onChange={e => setRecommendForm({ ...recommendForm, preferredLocation: e.target.value })}
                  placeholder="e.g. G block"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date (optional for availability)</label>
                <input
                  type="date"
                  className="form-control"
                  value={recommendForm.date}
                  onChange={e => setRecommendForm({ ...recommendForm, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={recommendForm.startTime}
                  onChange={e => setRecommendForm({ ...recommendForm, startTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  className="form-control"
                  value={recommendForm.endTime}
                  onChange={e => setRecommendForm({ ...recommendForm, endTime: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={recommendLoading}>
              {recommendLoading ? 'Finding...' : 'Find Best Resource'}
            </button>
          </form>

          {recommendError && <div className="alert alert-error" style={{ marginTop: 12 }}>{recommendError}</div>}

          {!recommendLoading && recommendations.length > 0 && (
            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              {recommendations.map((r, index) => (
                <div key={r.resourceId} style={{ border: '1px solid #dbeafe', borderRadius: 10, padding: 12, background: index === 0 ? '#eff6ff' : '#fff' }}>
                  <div>
                    <div>
                      <strong>{index === 0 ? 'Best Match: ' : ''}{r.resourceName}</strong>
                      <div style={{ color: '#6b7280', fontSize: 13 }}>
                        {typeLabel(r.resourceType)} | {r.location} | cap {r.capacity} | score {r.score}
                      </div>
                      {r.equipment?.length > 0 && (
                        <div style={{ color: '#6b7280', fontSize: 13 }}>
                          Equipment: {r.equipment.join(', ')}
                        </div>
                      )}
                      <div style={{ color: '#4b5563', fontSize: 13 }}>{r.reason}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
