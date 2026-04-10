import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI, resourcesAPI, uploadAPI } from '../../api/axios';

const categories = [
  { value: 'GENERAL', label: 'General' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'IT_EQUIPMENT', label: 'IT Equipment' },
  { value: 'FURNITURE', label: 'Furniture' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
];

const priorities = [
  { value: 'LOW', label: 'Low', color: '#639922', bg: '#EAF3DE', border: '#639922', textColor: '#3B6D11' },
  { value: 'MEDIUM', label: 'Medium', color: '#BA7517', bg: '#FAEEDA', border: '#BA7517', textColor: '#854F0B' },
  { value: 'HIGH', label: 'High', color: '#D85A30', bg: '#FAECE7', border: '#D85A30', textColor: '#993C1D' },
  { value: 'URGENT', label: 'Urgent', color: '#E24B4A', bg: '#FCEBEB', border: '#E24B4A', textColor: '#A32D2D' },
];

export default function CreateTicket() {
  const [resources, setResources] = useState([]);
  const [step, setStep] = useState(1);
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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 3) { setError('Maximum 3 images allowed'); return; }
    setFiles(selected);
    setError('');
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const isStep1Valid = form.title.trim().length >= 5 && form.description.trim().length >= 10;

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      let attachmentUrls = [];
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
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>
          Tickets › New ticket
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 500, margin: '0 0 4px' }}>Create Incident Ticket</h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          Report issues quickly with clear details so support teams can resolve them faster.
        </p>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {['Details', 'Priority', 'Attachments'].map((label, i) => {
          const num = i + 1;
          const isDone = step > num;
          const isActive = step === num;
          return (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', margin: '0 auto 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 500,
                background: isDone ? '#639922' : isActive ? '#185FA5' : '#f3f4f6',
                color: isDone || isActive ? '#fff' : '#9ca3af',
                border: `1px solid ${isDone ? '#639922' : isActive ? '#185FA5' : '#e5e7eb'}`
              }}>{num}</div>
              <div style={{ fontSize: 11, color: isActive ? '#111' : '#9ca3af' }}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: '#e5e7eb', borderRadius: 2, marginBottom: '1.75rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(step / 3) * 100}%`, background: '#185FA5', borderRadius: 2, transition: 'width .3s' }} />
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ padding: '10px 14px', background: '#FCEBEB', border: '0.5px solid #F09595', color: '#791F1F', borderRadius: 8, fontSize: 13, marginBottom: '1.25rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ padding: '10px 14px', background: '#EAF3DE', border: '0.5px solid #97C459', color: '#27500A', borderRadius: 8, fontSize: 13, marginBottom: '1.25rem' }}>
          {success}
        </div>
      )}

      {/* ── STEP 1: Details ── */}
      {step === 1 && (
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>Basic information</div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Issue title</label>
            <input
              name="title" value={form.title} onChange={handleChange}
              placeholder="Brief title for the issue"
              style={inputStyle}
            />
            <p style={hintStyle}>Minimum 5 characters. e.g. Projector not powering on in Lab 2.</p>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Category</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {categories.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value })}
                  style={{
                    fontSize: 12, padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                    border: `0.5px solid ${form.category === cat.value ? '#378ADD' : '#d1d5db'}`,
                    background: form.category === cat.value ? '#E6F1FB' : '#f9fafb',
                    color: form.category === cat.value ? '#185FA5' : '#6b7280',
                    fontWeight: form.category === cat.value ? 500 : 400,
                    transition: 'all .15s',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              placeholder="Describe the issue — what happened, when it started, visible impact."
              style={{ ...inputStyle, minHeight: 100, resize: 'vertical', lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={hintStyle}>Minimum 10 characters.</span>
              <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{form.description.length} chars</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Location</label>
              <input name="location" value={form.location} onChange={handleChange}
                placeholder="e.g. Building A, Room 201" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Preferred contact <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>optional</span></label>
              <input name="preferredContact" value={form.preferredContact} onChange={handleChange}
                placeholder="Email or phone number" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button onClick={() => setStep(2)} disabled={!isStep1Valid} style={isStep1Valid ? primaryBtnStyle : disabledBtnStyle}>
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Priority ── */}
      {step === 2 && (
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>Priority &amp; resource</div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Priority level</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {priorities.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p.value })}
                  style={{
                    border: `1px solid ${form.priority === p.value ? p.border : '#e5e7eb'}`,
                    borderRadius: 8, padding: '10px 4px', textAlign: 'center', cursor: 'pointer',
                    background: form.priority === p.value ? p.bg : '#f9fafb',
                    transition: 'all .15s',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, margin: '0 auto 5px' }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: form.priority === p.value ? p.textColor : '#6b7280' }}>
                    {p.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Related resource <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>optional</span></label>
            <select name="resourceId" value={form.resourceId} onChange={handleChange} style={inputStyle}>
              <option value="">None</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>{r.name} — {r.location}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <button onClick={() => setStep(1)} style={ghostBtnStyle}>← Back</button>
            <button onClick={() => setStep(3)} style={primaryBtnStyle}>Continue →</button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Attachments ── */}
      {step === 3 && (
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>Attachments</div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Images <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>max 3</span></label>
            <label style={{
              display: 'block', border: '1.5px dashed #d1d5db', borderRadius: 8, padding: '1.5rem',
              textAlign: 'center', cursor: 'pointer', background: '#f9fafb', transition: 'all .15s'
            }}>
              <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
              <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.4 }}>↑</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Click to upload images</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>PNG, JPG, WEBP up to 5MB each</div>
            </label>

            {files.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
                {files.map((file, index) => {
                  const previewUrl = URL.createObjectURL(file);
                  return (
                    <div key={`${file.name}-${index}`} style={{ border: '0.5px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                      <img src={previewUrl} alt={file.name}
                        onLoad={() => URL.revokeObjectURL(previewUrl)}
                        style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                      <div style={{ padding: '6px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                        <span style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{file.name}</span>
                        <button type="button" onClick={() => removeFile(index)}
                          style={{ fontSize: 11, color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <button onClick={() => setStep(2)} style={ghostBtnStyle}>← Back</button>
            <button onClick={handleSubmit} disabled={loading} style={loading ? disabledBtnStyle : primaryBtnStyle}>
              {loading ? 'Creating...' : 'Create ticket'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  background: '#fff', border: '0.5px solid #e5e7eb',
  borderRadius: 12, padding: '1.75rem',
};
const sectionLabelStyle = {
  fontSize: 11, fontWeight: 500, letterSpacing: '.08em',
  textTransform: 'uppercase', color: '#9ca3af',
  marginBottom: '1.25rem', paddingBottom: '0.5rem',
  borderBottom: '0.5px solid #e5e7eb',
};
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: '0.4rem' };
const inputStyle = {
  width: '100%', fontSize: 14, color: '#111827',
  background: '#f9fafb', border: '0.5px solid #d1d5db',
  borderRadius: 8, padding: '9px 12px', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
};
const hintStyle = { fontSize: 12, color: '#9ca3af', marginTop: 4 };
const primaryBtnStyle = {
  fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
  padding: '9px 24px', borderRadius: 8, border: 'none',
  cursor: 'pointer', background: '#185FA5', color: '#fff',
};
const disabledBtnStyle = { ...primaryBtnStyle, opacity: 0.45, cursor: 'not-allowed' };
const ghostBtnStyle = {
  fontSize: 14, color: '#6b7280', background: 'none',
  border: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: '9px 0',
};