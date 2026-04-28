import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resourcesAPI } from '../../api/axios';

const SLIIT_CAMPUS_LOCATIONS = [
  { id: 'a-block', label: 'A Block' },
  { id: 'b-block', label: 'B Block' },
  { id: 'c-block', label: 'C Block' },
  { id: 'd-block', label: 'D Block' },
  { id: 'e-block', label: 'E Block' },
  { id: 'f-block', label: 'F Block' },
  { id: 'g-block', label: 'G Block' },
  { id: 'h-block', label: 'H Block' },
  { id: 'new-building', label: 'New Building' },
  { id: 'library', label: 'Library' },
  { id: 'main-hall', label: 'Main Hall / Auditorium' },
  { id: 'lab-complex', label: 'Lab Complex' },
  { id: 'car-park', label: 'Car Park / Parking' },
];

const getLocationLabel = (id) => {
  const location = SLIIT_CAMPUS_LOCATIONS.find(l => l.id === id);
  return location ? location.label : id;
};

export default function ResourceForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', type: 'LECTURE_HALL', capacity: 1, location: '', status: 'ACTIVE', description: '', equipmentText: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      setFormLoading(true);
      resourcesAPI.getById(id)
        .then(res => {
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
          setFormLoading(false);
        })
        .catch(err => {
          console.error('Failed to load resource:', err);
          setError('Failed to load resource. Redirecting...');
          setTimeout(() => navigate('/app/resources'), 1500);
        });
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const value = e.target.name === 'capacity' ? parseInt(e.target.value) || 0 : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.location) {
      setError('Location is required. Please select a SLIIT campus location.');
      return;
    }

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
        setSuccess('Resource updated successfully! Redirecting...');
      } else {
        await resourcesAPI.create(payload);
        setSuccess('Resource created successfully! Redirecting...');
      }
      
      setTimeout(() => {
        navigate('/app/resources');
      }, 1500);
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const status = err.response?.status;

      if (apiMessage) {
        setError(apiMessage);
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
          {success && <div className="alert alert-success">{success}</div>}
          {formLoading && (
            <div className="loading" style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="spinner"></div>
              <p>Loading resource...</p>
            </div>
          )}
          {!formLoading && (
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
                <label>Location (SLIIT Campus)</label>
                <select name="location" className="form-control" value={form.location} onChange={handleChange} required>
                  <option value="">-- Select a Campus Location --</option>
                  {SLIIT_CAMPUS_LOCATIONS.map(loc => (
                    <option key={loc.id} value={loc.label}>{loc.label}</option>
                  ))}
                </select>
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
          )}
        </div>
      </div>
    </div>
  );
}
