import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resourcesAPI } from '../../api/axios';

export default function ResourceForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', type: 'LECTURE_HALL', capacity: 1, location: '', status: 'ACTIVE', description: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      resourcesAPI.getById(id).then(res => {
        const r = res.data.data;
        setForm({ name: r.name, type: r.type, capacity: r.capacity, location: r.location, status: r.status, description: r.description || '' });
      }).catch(() => navigate('/app/resources'));
    }
  }, [id]);

  const handleChange = (e) => {
    const value = e.target.name === 'capacity' ? parseInt(e.target.value) || 0 : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        await resourcesAPI.update(id, form);
      } else {
        await resourcesAPI.create(form);
      }
      navigate('/app/resources');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2>{isEdit ? 'Edit Resource' : 'Add New Resource'}</h2>
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input name="name" className="form-control" value={form.name} onChange={handleChange} required placeholder="e.g. Main Lecture Hall A" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Type</label>
                <select name="type" className="form-control" value={form.type} onChange={handleChange}>
                  <option value="LECTURE_HALL">Lecture Hall</option>
                  <option value="LAB">Lab</option>
                  <option value="MEETING_ROOM">Meeting Room</option>
                  <option value="EQUIPMENT">Equipment</option>
                </select>
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input name="capacity" type="number" min="1" className="form-control" value={form.capacity} onChange={handleChange} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input name="location" className="form-control" value={form.location} onChange={handleChange} required placeholder="e.g. Building A, Floor 2" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" className="form-control" value={form.status} onChange={handleChange}>
                  <option value="ACTIVE">Active</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" className="form-control" value={form.description} onChange={handleChange} placeholder="Optional description" />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : (isEdit ? 'Update Resource' : 'Create Resource')}
              </button>
              <button type="button" onClick={() => navigate('/app/resources')} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
