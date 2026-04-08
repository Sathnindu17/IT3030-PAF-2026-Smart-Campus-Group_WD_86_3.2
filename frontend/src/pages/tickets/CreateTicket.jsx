import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI, resourcesAPI, uploadAPI } from '../../api/axios';

export default function CreateTicket() {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({
    title: '', category: 'GENERAL', description: '', priority: 'MEDIUM',
    preferredContact: '', resourceId: '', location: '', attachmentUrls: []
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    resourcesAPI.getAll().then(res => setResources(res.data.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 3) {
      setError('Maximum 3 images allowed');
      return;
    }
    setFiles(selected);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let attachmentUrls = [];

      // Upload files first if any
      if (files.length > 0) {
        const uploadRes = await uploadAPI.uploadFiles(files);
        attachmentUrls = uploadRes.data.data;
      }

      const ticketData = { ...form, attachmentUrls };
      if (!ticketData.resourceId) delete ticketData.resourceId;

      await ticketsAPI.create(ticketData);
      setSuccess('Ticket created successfully!');
      setTimeout(() => navigate('/app/tickets/my'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 650 }}>
      <h2>Create Incident Ticket</h2>
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input name="title" className="form-control" value={form.title} onChange={handleChange}
                required placeholder="Brief title for the issue" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select name="category" className="form-control" value={form.category} onChange={handleChange}>
                  <option value="GENERAL">General</option>
                  <option value="ELECTRICAL">Electrical</option>
                  <option value="PLUMBING">Plumbing</option>
                  <option value="IT_EQUIPMENT">IT Equipment</option>
                  <option value="FURNITURE">Furniture</option>
                  <option value="HVAC">HVAC</option>
                  <option value="SAFETY">Safety</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select name="priority" className="form-control" value={form.priority} onChange={handleChange}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" className="form-control" value={form.description}
                onChange={handleChange} required placeholder="Describe the issue in detail" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Related Resource (optional)</label>
                <select name="resourceId" className="form-control" value={form.resourceId} onChange={handleChange}>
                  <option value="">None</option>
                  {resources.map(r => (
                    <option key={r.id} value={r.id}>{r.name} - {r.location}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Location</label>
                <input name="location" className="form-control" value={form.location} onChange={handleChange}
                  placeholder="e.g. Building A, Room 201" />
              </div>
            </div>
            <div className="form-group">
              <label>Preferred Contact</label>
              <input name="preferredContact" className="form-control" value={form.preferredContact}
                onChange={handleChange} placeholder="Email or phone number" />
            </div>
            <div className="form-group">
              <label>Attachments (max 3 images)</label>
              <input type="file" accept="image/*" multiple onChange={handleFileChange}
                className="form-control" />
              {files.length > 0 && (
                <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  {files.length} file(s) selected
                </p>
              )}
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
