import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resourcesAPI } from '../../api/axios';

export default function ResourceForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', type: 'LECTURE_HALL', capacity: 1, location: '', status: 'ACTIVE', description: '', equipmentText: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      resourcesAPI.getById(id).then(res => {
        const r = res.data.data;
        setForm({
          name: r.name,
          type: r.type,
          capacity: r.capacity,
          location: r.location,
          status: r.status,
          description: r.description || '',
          equipmentText: (r.equipment || []).join(', ')
        });
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
      const payload = {
        ...form,
        equipment: form.equipmentText
          .split(',')
          .map(item => item.trim())
          .filter(Boolean)
      };

      if (isEdit) {
        await resourcesAPI.update(id, payload);
      } else {
        await resourcesAPI.create(payload);
      }
      navigate('/app/resources');
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const status = err.response?.status;

      if (apiMessage) {
        setError(apiMessage);
      } else if (status === 403) {
        setError('You do not have permission to perform this action.');
      } else if (status === 400) {
        setError('Invalid resource data. Please check all fields and try again.');
      } else {
        setError('Failed to save resource');
      }
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
                  <option value="UNDER_RENOVATION">Under Renovation</option>
                  <option value="OUT_OF_SERVICE">Out of Service</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" className="form-control" value={form.description} onChange={handleChange} placeholder="Optional description" />
            </div>
            <div className="form-group">
              <label>Equipment (comma separated)</label>
              <input
                name="equipmentText"
                className="form-control"
                value={form.equipmentText}
                onChange={handleChange}
                placeholder="e.g. Projector, 40 PCs, Smart Board"
              />
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
