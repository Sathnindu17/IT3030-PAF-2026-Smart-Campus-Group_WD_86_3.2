import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { resourcesAPI } from '../../api/axios';

const SLIIT_CAMPUS_LOCATIONS = [
  { id: 'new-building', label: 'New Building' },
  { id: 'library', label: 'Library' },
  { id: 'main-building', label: 'Main Building' },
  { id: 'auditorium', label: 'Auditorium' },
  { id: 'lab-complex', label: 'Lab Complex' },
  { id: 'car-park', label: 'Car Park / Parking' },
];

const normalizeLocation = (value) => (value || '').trim().toLowerCase();

const isPredefinedLocation = (value) => {
  const normalized = normalizeLocation(value);
  return SLIIT_CAMPUS_LOCATIONS.some((loc) => normalizeLocation(loc.label) === normalized);
};

const normalizeLegacyLocation = (value) => {
  if (!value) return '';
  if (normalizeLocation(value) === 'main hall') return 'Main Building';
  return value;
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
  const [locationMode, setLocationMode] = useState('select');

  useEffect(() => {
    if (isEdit) {
      setFormLoading(true);
      resourcesAPI.getById(id)
        .then(res => {
          const r = res.data.data;
          const normalizedLocation = normalizeLegacyLocation(r.location);
          setForm({
            name: r.name,
            type: r.type,
            capacity: r.capacity,
            location: normalizedLocation,
            status: r.status,
            description: r.description || '',
            equipmentText: (r.equipment || []).join(', ')
          });
          setLocationMode(isPredefinedLocation(normalizedLocation) ? 'select' : 'custom');
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

  const handleLocationModeChange = (mode) => {
    setLocationMode(mode);
    setError('');

    if (mode === 'select' && !isPredefinedLocation(form.location)) {
      setForm((prev) => ({ ...prev, location: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.location.trim()) {
      setError('Location is required. Please select from dropdown or type a campus location.');
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
                  <option value="EXAM_HALL">Exam Hall</option>
                  <option value="AUDITORIUM">Auditorium</option>
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
                <div style={{ display: 'flex', gap: 16, marginBottom: 8, fontSize: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="locationMode"
                      checked={locationMode === 'select'}
                      onChange={() => handleLocationModeChange('select')}
                    />
                    Choose from list
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="locationMode"
                      checked={locationMode === 'custom'}
                      onChange={() => handleLocationModeChange('custom')}
                    />
                    Type location
                  </label>
                </div>

                {locationMode === 'select' ? (
                  <select
                    name="location"
                    className="form-control"
                    value={isPredefinedLocation(form.location) ? form.location : ''}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Select a Campus Location --</option>
                    {SLIIT_CAMPUS_LOCATIONS.map(loc => (
                      <option key={loc.id} value={loc.label}>{loc.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="location"
                    className="form-control"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Main Building - Floor 5"
                    required
                  />
                )}
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
