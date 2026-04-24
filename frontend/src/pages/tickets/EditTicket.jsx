import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ticketsAPI, resourcesAPI, uploadAPI } from '../../api/axios';
import TicketRoleGreeting from '../../components/TicketRoleGreeting';
import TicketCategoryPicker from '../../components/TicketCategoryPicker';
import { useAuth } from '../../context/AuthContext';

const priorities = [
  { value: 'LOW',    label: 'Low',    color: '#639922', bg: '#EAF3DE', border: '#639922', textColor: '#3B6D11' },
  { value: 'MEDIUM', label: 'Medium', color: '#BA7517', bg: '#FAEEDA', border: '#BA7517', textColor: '#854F0B' },
  { value: 'HIGH',   label: 'High',   color: '#D85A30', bg: '#FAECE7', border: '#D85A30', textColor: '#993C1D' },
  { value: 'URGENT', label: 'Urgent', color: '#E24B4A', bg: '#FCEBEB', border: '#E24B4A', textColor: '#A32D2D' },
];

const priorityGuidance = {
  LOW: { eta: 'Expected response: within 48 hours', useWhen: 'Use for minor issues that do not block classes, labs, or daily operations.' },
  MEDIUM: { eta: 'Expected response: within 24 hours', useWhen: 'Use for noticeable issues that affect comfort or productivity but have workarounds.' },
  HIGH: { eta: 'Expected response: within 8 hours', useWhen: 'Use for major disruptions affecting teaching, assessments, or shared facilities.' },
  URGENT: { eta: 'Expected response: within 2 hours', useWhen: 'Use only for safety risks or complete service outages needing immediate attention.' }
};

const quickGuide = [
  'Use a specific title (what failed and where).',
  'Describe visible impact and when the issue started.',
  'Choose HIGH or URGENT only for service-blocking incidents.',
];

const relatedResourceKeywords = ['Lecture Hall', 'Lab', 'Meeting Room', 'Projector', 'Camera', 'Printer'];

const resourceTypeMeta = {
  LECTURE_HALL: { icon: '🏛️', label: 'Lecture Hall' },
  LAB: { icon: '🧪', label: 'Lab' },
  MEETING_ROOM: { icon: '💼', label: 'Meeting Room' },
  EQUIPMENT: { icon: '🧰', label: 'Equipment' },
};

export default function EditTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [form, setForm] = useState({
    title: '', category: 'NETWORK', description: '', priority: 'MEDIUM',
    preferredContact: '', resourceId: '', location: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [focusedField, setFocusedField] = useState('');

  const selectedPriority = priorityGuidance[form.priority] || priorityGuidance.MEDIUM;
  const selectedResourceId = form.resourceId ? String(form.resourceId) : '';
  const resourceGroups = resources.reduce((groups, resource) => {
    const type = resource.type || 'EQUIPMENT';
    if (!groups[type]) groups[type] = [];
    groups[type].push(resource);
    return groups;
  }, {});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketRes, resourcesRes] = await Promise.all([
          ticketsAPI.getById(id),
          resourcesAPI.getAll()
        ]);
        
        const ticketData = ticketRes.data.data;
        
        // Check if user is the creator and ticket is OPEN
        if (ticketData.createdBy !== user?.id) {
          setError('You can only edit your own tickets.');
          setLoadingData(false);
          return;
        }
        
        if (ticketData.status !== 'OPEN') {
          setError('Only open tickets can be edited.');
          setLoadingData(false);
          return;
        }
        
        setTicket(ticketData);
        setResources(resourcesRes.data.data);
        
        // Pre-fill form with ticket data
        setForm({
          title: ticketData.title || '',
          category: ticketData.category || 'NETWORK',
          description: ticketData.description || '',
          priority: ticketData.priority || 'MEDIUM',
          preferredContact: ticketData.preferredContact || '',
          resourceId: ticketData.resourceId || '',
          location: ticketData.location || ''
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load ticket');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [id, user?.id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleResourceChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, resourceId: value }));
  };

  const isFormValid = form.title.trim().length >= 5 && form.description.trim().length >= 10;

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      const ticketData = {
        title: form.title,
        category: form.category,
        description: form.description,
        priority: form.priority,
        preferredContact: form.preferredContact,
        location: form.location,
      };
      if (form.resourceId) ticketData.resourceId = form.resourceId;
      
      await ticketsAPI.update(id, ticketData);
      setSuccess('Ticket updated successfully!');
      setTimeout(() => navigate(`/app/tickets/${id}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ticket');
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = (field) => ({
    borderColor: focusedField === field ? '#185FA5' : '#e5e7eb',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(24,95,165,0.1)' : 'none',
  });

  if (loadingData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: '#6b7280', fontSize: 14 }}>
        <div style={{ width: 18, height: 18, border: '2px solid #e5e7eb', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        Loading ticket...
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f6f9', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ padding: '20px 16px', background: '#FCEBEB', border: '0.5px solid #F09595', color: '#791F1F', borderRadius: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <span style={{ fontSize: 18 }}>⚠</span> {error}
          </div>
          <button
            onClick={() => navigate('/app/tickets/my')}
            style={{ fontSize: 14, fontWeight: 500, padding: '10px 28px', borderRadius: 9, border: 'none', cursor: 'pointer', background: '#185FA5', color: '#fff', fontFamily: 'inherit' }}
          >
            ← Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => navigate('/app/tickets/my')}>Tickets</span>
            <span>›</span>
            <span onClick={() => navigate(`/app/tickets/${id}`)} style={{ cursor: 'pointer', color: '#6b7280' }}>{ticket?.title}</span>
            <span>›</span>
            <span>Edit</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 6px', color: '#111827' }}>
            Edit Ticket
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
            Update ticket details. Only open tickets can be edited.
          </p>
        </div>

        <TicketRoleGreeting style={{ marginBottom: '1.5rem' }} />

        {/* Quick instructions */}
        <div style={{
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #f8fbff 0%, #f3f8ff 100%)',
          border: '1px solid #dbeafe',
          borderRadius: 12,
          padding: '0.95rem 1rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            flexWrap: 'wrap',
          }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e3a8a' }}>Update ticket information</h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>All fields can be modified</span>
          </div>
          <ul style={{ margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {quickGuide.map((item) => (
              <li key={item} style={{
                listStyle: 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                color: '#334155',
                fontSize: 12.5,
                lineHeight: 1.45,
              }}>
                <span style={{ color: '#1d4ed8', fontWeight: 700, lineHeight: 1 }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ padding: '10px 14px', background: '#FCEBEB', border: '0.5px solid #F09595', color: '#791F1F', borderRadius: 8, fontSize: 13, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15 }}>⚠</span> {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '10px 14px', background: '#EAF3DE', border: '0.5px solid #97C459', color: '#27500A', borderRadius: 8, fontSize: 13, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15 }}>✓</span> {success}
          </div>
        )}

        {/* Edit Form */}
        <div style={cardStyle}>
          <div style={sectionLabelStyle}>Ticket details</div>

          {/* Title */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Issue title</label>
            <input
              name="title" value={form.title} onChange={handleChange}
              placeholder="Brief title for the issue"
              style={{ ...inputStyle, ...focusStyle('title') }}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField('')}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <p style={hintStyle}>Minimum 5 characters.</p>
              {form.title.length > 0 && (
                <span style={{ fontSize: 11, color: form.title.trim().length >= 5 ? '#639922' : '#E24B4A', fontWeight: 500 }}>
                  {form.title.trim().length >= 5 ? '✓' : `${5 - form.title.trim().length} more`}
                </span>
              )}
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Category</label>
            <TicketCategoryPicker value={form.category} onChange={(value) => setForm({ ...form, category: value })} />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              placeholder="Describe the issue — what happened, when it started, visible impact."
              style={{ ...inputStyle, ...focusStyle('description'), minHeight: 110, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField('')}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={hintStyle}>Minimum 10 characters.</span>
              <span style={{ fontSize: 11, color: form.description.length >= 10 ? '#639922' : '#9ca3af', fontFamily: 'monospace', fontWeight: 500 }}>
                {form.description.length} chars
              </span>
            </div>
          </div>

          {/* Location + Contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={labelStyle}>Location</label>
              <input name="location" value={form.location} onChange={handleChange}
                placeholder="e.g. Building A, Room 201"
                style={{ ...inputStyle, ...focusStyle('location') }}
                onFocus={() => setFocusedField('location')}
                onBlur={() => setFocusedField('')}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Preferred contact <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>optional</span>
              </label>
              <input name="preferredContact" value={form.preferredContact} onChange={handleChange}
                placeholder="Email or phone number"
                style={{ ...inputStyle, ...focusStyle('contact') }}
                onFocus={() => setFocusedField('contact')}
                onBlur={() => setFocusedField('')}
              />
            </div>
          </div>

          {/* Priority */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>Priority level</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              {priorities.map(p => {
                const isSelected = form.priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setForm({ ...form, priority: p.value })}
                    style={{
                      border: `2px solid ${isSelected ? p.border : '#e5e7eb'}`,
                      borderRadius: 10, padding: '14px 4px', textAlign: 'center', cursor: 'pointer',
                      background: isSelected ? p.bg : '#fff',
                      transition: 'all .15s',
                      transform: isSelected ? 'translateY(-2px)' : 'none',
                      boxShadow: isSelected ? `0 4px 12px ${p.color}33` : 'none',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: p.color, margin: '0 auto 8px',
                      boxShadow: isSelected ? `0 0 0 3px ${p.color}33` : 'none',
                    }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? p.textColor : '#6b7280', display: 'block' }}>
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{
              marginTop: '0.9rem',
              border: '1px solid #dbeafe',
              background: '#f8fbff',
              borderRadius: 10,
              padding: '0.8rem 0.9rem',
              display: 'grid',
              gap: 6,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Priority guidance
              </div>
              <div style={{ fontSize: 12.5, color: '#1f2937', fontWeight: 500 }}>
                {selectedPriority.eta}
              </div>
              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.45 }}>
                {selectedPriority.useWhen}
              </div>
            </div>
          </div>

          {/* Resource */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={labelStyle}>
              Related resource <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>optional</span>
            </label>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, lineHeight: 1.4 }}>
              Choose the room or asset the issue is attached to. If nothing matches, keep it as a general issue.
            </div>
            <select
              name="resourceId" value={selectedResourceId} onChange={handleResourceChange}
              style={{ ...inputStyle, ...focusStyle('resource'), cursor: 'pointer', background: '#fff' }}
              onFocus={() => setFocusedField('resource')}
              onBlur={() => setFocusedField('')}
            >
              <option value="">None - general issue</option>
              {Object.entries(resourceGroups).map(([type, items]) => {
                const meta = resourceTypeMeta[type] || resourceTypeMeta.EQUIPMENT;
                return (
                  <optgroup key={type} label={`${meta.icon} ${meta.label}`}>
                    {items.map((resource) => (
                      <option key={resource.id} value={String(resource.id)}>
                        {resource.name} — {resource.location} {resource.status ? `(${resource.status})` : ''}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6' }}>
            <button onClick={() => navigate(`/app/tickets/${id}`)} style={ghostBtnStyle}>← Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              style={{
                fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                padding: '10px 28px', borderRadius: 9, border: 'none',
                cursor: (loading || !isFormValid) ? 'not-allowed' : 'pointer',
                background: (loading || !isFormValid) ? '#e5e7eb' : 'linear-gradient(135deg, #185FA5, #378ADD)',
                color: (loading || !isFormValid) ? '#9ca3af' : '#fff',
                boxShadow: (loading || !isFormValid) ? 'none' : '0 2px 10px rgba(24,95,165,0.3)',
                transition: 'all .2s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {loading && (
                <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              )}
              {loading ? 'Updating...' : 'Update ticket'}
            </button>
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderLeft: '4px solid #185FA5',
  borderRadius: 12,
  padding: '1.75rem',
  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
};
const sectionLabelStyle = {
  fontSize: 11, fontWeight: 600, letterSpacing: '.08em',
  textTransform: 'uppercase', color: '#9ca3af',
  marginBottom: '1.25rem', paddingBottom: '0.5rem',
  borderBottom: '0.5px solid #f3f4f6',
};
const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: '0.4rem',
};
const inputStyle = {
  width: '100%', fontSize: 14, color: '#111827',
  background: '#fff', border: '1.5px solid #e5e7eb',
  borderRadius: 8, padding: '9px 12px', outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
  transition: 'border-color .2s, box-shadow .2s',
};
const hintStyle = { fontSize: 12, color: '#9ca3af', marginTop: 4, margin: 0 };
const ghostBtnStyle = {
  fontSize: 14, color: '#6b7280', background: 'none',
  border: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: '9px 0',
};
