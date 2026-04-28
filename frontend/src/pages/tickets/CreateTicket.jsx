import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI, resourcesAPI, uploadAPI } from '../../api/axios';
import TicketRoleGreeting from '../../components/TicketRoleGreeting';
import TicketCategoryPicker from '../../components/TicketCategoryPicker';

const priorities = [
  { value: 'LOW',    label: 'Low',    color: '#639922', bg: '#EAF3DE', border: '#639922', textColor: '#3B6D11' },
  { value: 'MEDIUM', label: 'Medium', color: '#BA7517', bg: '#FAEEDA', border: '#BA7517', textColor: '#854F0B' },
  { value: 'HIGH',   label: 'High',   color: '#D85A30', bg: '#FAECE7', border: '#D85A30', textColor: '#993C1D' },
  { value: 'URGENT', label: 'Urgent', color: '#E24B4A', bg: '#FCEBEB', border: '#E24B4A', textColor: '#A32D2D' },
];

const priorityGuidance = {
  LOW: {
    eta: 'Expected response: within 48 hours',
    useWhen: 'Use for minor issues that do not block classes, labs, or daily operations.'
  },
  MEDIUM: {
    eta: 'Expected response: within 24 hours',
    useWhen: 'Use for noticeable issues that affect comfort or productivity but have workarounds.'
  },
  HIGH: {
    eta: 'Expected response: within 8 hours',
    useWhen: 'Use for major disruptions affecting teaching, assessments, or shared facilities.'
  },
  URGENT: {
    eta: 'Expected response: within 2 hours',
    useWhen: 'Use only for safety risks or complete service outages needing immediate attention.'
  }
};

const quickGuide = [
  'Use a specific title (what failed and where).',
  'Describe visible impact and when the issue started.',
  'Choose HIGH or URGENT only for service-blocking incidents.',
  'Attach up to 3 clear images to speed up diagnosis.'
];

const relatedResourceKeywords = [
  'Lecture Hall',
  'Lab',
  'Meeting Room',
  'Projector',
  'Camera',
  'Printer'
];

const resourceTypeMeta = {
  LECTURE_HALL: { icon: '🏛️', label: 'Lecture Hall' },
  LAB: { icon: '🧪', label: 'Lab' },
  MEETING_ROOM: { icon: '💼', label: 'Meeting Room' },
  EQUIPMENT: { icon: '🧰', label: 'Equipment' },
};

const timelineOptions = [
  { value: 'STARTED_NOW', label: 'Started now' },
  { value: 'LESS_THAN_1H', label: '< 1 hour' },
  { value: 'TODAY', label: 'Today' },
  { value: 'SINCE_YESTERDAY', label: 'Since yesterday' },
];

const urgencyKeywordGroups = {
  safety: ['fire', 'smoke', 'electric shock', 'sparking', 'unsafe', 'injury', 'hazard'],
  serviceOutage: ['outage', 'down', 'not working', 'cannot access', 'offline', 'unavailable', 'no internet'],
  singleDevice: ['single device', 'one device', 'one pc', 'my laptop only', 'this pc only'],
};

const descriptionTemplateByCategory = {
  DEFAULT: {
    happened: 'Describe the exact issue and any error signs (message, sound, or behavior).',
    where: 'Mention building, room, and affected equipment/resource.',
    sinceWhen: 'State when it started and whether it is constant or intermittent.',
    impact: 'Explain impact on classes, labs, bookings, or operations.',
  },
  NETWORK: {
    happened: 'Internet is unstable/disconnected on affected devices; login or access may fail.',
    where: 'Building/floor/room and network segment (Wi-Fi name or lab network).',
    sinceWhen: 'Started at [time]; issue is continuous/intermittent.',
    impact: 'Classes or online activities cannot proceed normally.',
  },
  SOFTWARE: {
    happened: 'Application fails to open, crashes, or returns an error.',
    where: 'Device/lab where issue occurs and software name/version if known.',
    sinceWhen: 'Started after [update/change/time].',
    impact: 'Users cannot complete coursework or scheduled tasks.',
  },
  HARDWARE: {
    happened: 'Device is physically malfunctioning (power/display/input/peripheral failure).',
    where: 'Asset location and device label/ID if visible.',
    sinceWhen: 'First noticed at [time/date].',
    impact: 'Resource is unavailable for current class/session.',
  },
  FACILITIES: {
    happened: 'Facility issue observed (lighting/AC/furniture/room utility problem).',
    where: 'Building and exact room/zone.',
    sinceWhen: 'Started at [time/date] and current condition.',
    impact: 'Learning environment or safety/comfort is affected.',
  },
};

export default function CreateTicket() {
  const [resources, setResources] = useState([]);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '', category: 'NETWORK', description: '', priority: 'MEDIUM',
    preferredContact: '', resourceId: '', location: '', attachmentUrls: []
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdTicket, setCreatedTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [incidentTimeline, setIncidentTimeline] = useState('');
  const navigate = useNavigate();
  const selectedPriority = priorityGuidance[form.priority] || priorityGuidance.MEDIUM;
  const templateGuide = descriptionTemplateByCategory[form.category] || descriptionTemplateByCategory.DEFAULT;
  const selectedResourceId = form.resourceId ? String(form.resourceId) : '';
  const resourceGroups = resources.reduce((groups, resource) => {
    const type = resource.type || 'EQUIPMENT';
    if (!groups[type]) groups[type] = [];
    groups[type].push(resource);
    return groups;
  }, {});

  useEffect(() => {
    resourcesAPI.getAll().then(res => setResources(res.data.data)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleResourceChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, resourceId: value }));
  };

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

  const getUrgencyInsights = () => {
    const text = `${form.title} ${form.description}`.toLowerCase();
    let score = 8;
    const reasons = [];

    const hasSafety = urgencyKeywordGroups.safety.some((k) => text.includes(k));
    const hasOutage = urgencyKeywordGroups.serviceOutage.some((k) => text.includes(k));
    const hasSingleDevice = urgencyKeywordGroups.singleDevice.some((k) => text.includes(k));

    if (hasSafety) {
      score += 45;
      reasons.push('safety');
    }
    if (hasOutage) {
      score += 30;
      reasons.push('service outage');
    }
    if (hasSingleDevice) {
      score -= 10;
      reasons.push('single device');
    }
    if (incidentTimeline === 'STARTED_NOW' || incidentTimeline === 'LESS_THAN_1H') {
      score += 10;
      reasons.push('recent incident');
    }
    if (form.category === 'NETWORK' || form.category === 'FACILITIES') {
      score += 8;
    }

    score = Math.max(0, Math.min(100, score));
    const level = score >= 65 ? 'HIGH' : score >= 35 ? 'MEDIUM' : 'LOW';
    const color = level === 'HIGH' ? '#E24B4A' : level === 'MEDIUM' ? '#BA7517' : '#639922';

    return {
      score,
      level,
      color,
      reasons: reasons.length ? reasons : ['general issue'],
    };
  };

  const urgencyInsight = getUrgencyInsights();

  const getSuggestedPriority = () => {
    if (urgencyInsight.score >= 85) return 'URGENT';
    if (urgencyInsight.score >= 65) return 'HIGH';
    if (urgencyInsight.score >= 35) return 'MEDIUM';
    return 'LOW';
  };

  const suggestedPriority = getSuggestedPriority();
  const suggestedPriorityMeta = priorities.find((p) => p.value === suggestedPriority) || priorities[1];
  const submissionChecklist = [
    {
      label: 'Specific title',
      helper: 'What failed and where',
      complete: form.title.trim().length >= 5,
    },
    {
      label: 'Context-rich description',
      helper: 'What, where, since when',
      complete: form.description.trim().length >= 10,
    },
    {
      label: 'Timeline captured',
      helper: 'When the incident started',
      complete: Boolean(incidentTimeline),
    },
    {
      label: 'Priority set',
      helper: 'Urgency guidance applied',
      complete: Boolean(form.priority),
    },
  ];
  const checklistCompleteCount = submissionChecklist.filter((item) => item.complete).length;

  const applySuggestedPriority = () => {
    setForm((prev) => ({ ...prev, priority: suggestedPriority }));
  };

  const buildDescriptionStarter = () => {
    return [
      `What happened: ${templateGuide.happened}`,
      `Where: ${templateGuide.where}`,
      `Since when: ${templateGuide.sinceWhen}`,
      `Business impact: ${templateGuide.impact}`,
    ].join('\n');
  };

  const useFullTemplate = () => {
    const starter = buildDescriptionStarter();
    setForm((prev) => ({
      ...prev,
      description: prev.description.trim() ? `${prev.description.trim()}\n\n${starter}` : starter,
    }));
  };

  const useTemplateLine = (label, value) => {
    const line = `${label}: ${value}`;
    setForm((prev) => ({
      ...prev,
      description: prev.description.trim() ? `${prev.description.trim()}\n${line}` : line,
    }));
  };

  const resetForAnotherTicket = () => {
    setCreatedTicket(null);
    setSuccess('');
    setError('');
    setStep(1);
    setFiles([]);
    setIncidentTimeline('');
    setForm({
      title: '',
      category: 'NETWORK',
      description: '',
      priority: 'MEDIUM',
      preferredContact: '',
      resourceId: '',
      location: '',
      attachmentUrls: [],
    });
  };

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      let attachmentUrls = [];
      let attachmentWarning = '';
      if (files.length > 0) {
        try {
          const uploadRes = await uploadAPI.uploadFiles(files);
          attachmentUrls = uploadRes.data.data;
        } catch (uploadErr) {
          attachmentWarning = uploadErr.response?.data?.message || 'Attachments could not be uploaded, so the ticket will be created without images';
        }
      }
      const timelineLabel = timelineOptions.find((opt) => opt.value === incidentTimeline)?.label;
      const descriptionWithTimeline = timelineLabel
        ? `${form.description.trim()}\n\nIncident timeline: ${timelineLabel}`
        : form.description;

      const ticketData = { ...form, description: descriptionWithTimeline, attachmentUrls };
      if (!ticketData.resourceId) delete ticketData.resourceId;
      const createRes = await ticketsAPI.create(ticketData);
      const createdData = createRes?.data?.data || {};
      const createdId = createdData?.id || createdData?.ticketId || null;
      const slaTarget = selectedPriority?.eta?.replace('Expected response: ', '') || 'As per selected priority';

      setCreatedTicket({
        id: createdId,
        slaTarget,
        attachmentWarning,
      });
      setSuccess(attachmentWarning ? `Ticket created successfully. ${attachmentWarning}` : 'Ticket created successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = (field) => ({
    borderColor: focusedField === field ? '#185FA5' : '#e5e7eb',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(24,95,165,0.1)' : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'DM Sans, sans-serif' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ cursor: 'pointer', color: '#6b7280' }} onClick={() => navigate('/app/tickets/my')}>Tickets</span>
            <span>›</span>
            <span>New ticket</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 6px', color: '#111827' }}>
            Create Incident Ticket
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
            Report issues quickly with clear details so support teams can resolve them faster.
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
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e3a8a' }}>Before you submit</h3>
            <span style={{ fontSize: 11, color: '#64748b' }}>Required for faster resolution</span>
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

        <div style={{
          marginBottom: '1.5rem',
          borderRadius: 16,
          padding: '1rem 1.1rem',
          background: 'linear-gradient(135deg, #0f4c81 0%, #185FA5 45%, #378ADD 100%)',
          color: '#fff',
          boxShadow: '0 14px 30px rgba(24,95,165,0.2)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 240, flex: '1 1 260px' }}>
              <div style={{ fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 6 }}>Submission readiness</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Make this ticket easy to triage</div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, opacity: 0.92 }}>
                A complete ticket gets routed faster and needs fewer follow-up questions.
              </p>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 12 }}>
                  <span style={{ opacity: 0.9 }}>Readiness score</span>
                  <strong>{checklistCompleteCount}/{submissionChecklist.length}</strong>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
                  <div style={{ width: `${(checklistCompleteCount / submissionChecklist.length) * 100}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #dff6c8, #ffffff)' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 8, minWidth: 220, flex: '0 1 320px' }}>
              {submissionChecklist.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 10px',
                    borderRadius: 12,
                    background: item.complete ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${item.complete ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.14)'}`,
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    background: item.complete ? '#EAF3DE' : 'rgba(255,255,255,0.16)',
                    color: item.complete ? '#3B6D11' : '#fff',
                    flexShrink: 0,
                  }}>
                    {item.complete ? '✓' : '•'}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.25 }}>{item.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.86, lineHeight: 1.25 }}>{item.helper}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step indicators with connector lines */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          {['Details', 'Priority', 'Attachments'].map((label, i) => {
            const num = i + 1;
            const isDone = step > num;
            const isActive = step === num;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: isDone ? '#639922' : isActive ? '#185FA5' : '#fff',
                    border: `2px solid ${isDone ? '#639922' : isActive ? '#185FA5' : '#d1d5db'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 600,
                    color: isDone || isActive ? '#fff' : '#9ca3af',
                    boxShadow: isActive ? '0 0 0 5px rgba(24,95,165,0.12)' : 'none',
                    transition: 'all .3s',
                  }}>
                    {isDone
                      ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : num
                    }
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#185FA5' : isDone ? '#3B6D11' : '#9ca3af',
                    whiteSpace: 'nowrap',
                  }}>
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{
                    flex: 1, height: 2, marginBottom: 22, marginLeft: 8, marginRight: 8,
                    background: step > num ? '#639922' : '#e5e7eb',
                    transition: 'background .3s',
                  }} />
                )}
              </div>
            );
          })}
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

        {createdTicket && (
          <div className="fade-up-soft" style={{
            marginBottom: '1.25rem',
            background: 'linear-gradient(135deg, #f8fbff 0%, #eef6ff 100%)',
            border: '1px solid #bfdbfe',
            borderRadius: 12,
            padding: '1rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginBottom: 6 }}>Submission confidence card</div>
                <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.55 }}>
                  <div><strong>Ticket ID:</strong> {createdTicket.id || 'Generated successfully'}</div>
                  <div><strong>SLA target:</strong> {createdTicket.slaTarget}</div>
                  <div><strong>What happens next:</strong> Your ticket is now in the queue and will be assigned based on priority and category.</div>
                </div>
                {createdTicket.attachmentWarning && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#854F0B' }}>
                    Note: {createdTicket.attachmentWarning}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="lift-soft"
                  type="button"
                  onClick={() => createdTicket.id && navigate(`/app/tickets/${createdTicket.id}`)}
                  disabled={!createdTicket.id}
                  style={{ ...smallActionBtnStyle, opacity: createdTicket.id ? 1 : 0.6, cursor: createdTicket.id ? 'pointer' : 'not-allowed' }}
                >
                  View ticket
                </button>
                <button
                  className="lift-soft"
                  type="button"
                  onClick={() => createdTicket.id && navigate(`/app/tickets/${createdTicket.id}#comments`)}
                  disabled={!createdTicket.id}
                  style={{ ...smallActionBtnStyle, opacity: createdTicket.id ? 1 : 0.6, cursor: createdTicket.id ? 'pointer' : 'not-allowed' }}
                >
                  Add comment
                </button>
                <button
                  className="lift-soft"
                  type="button"
                  onClick={resetForAnotherTicket}
                  style={smallActionBtnStyle}
                >
                  Create another
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Details ── */}
        {step === 1 && (
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Basic information</div>

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
                <p style={hintStyle}>Minimum 5 characters. e.g. Projector not powering on in Lab 2.</p>
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
              <div className="fade-up-soft fade-delay-1" style={{
                marginBottom: 8,
                border: '1px solid #dbeafe',
                borderRadius: 10,
                background: '#f8fbff',
                padding: '0.7rem 0.8rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#1e3a8a' }}>What good looks like ({form.category})</div>
                  <button className="lift-soft" type="button" onClick={useFullTemplate} style={{ ...ghostBtnStyle, color: '#185FA5', fontSize: 12, padding: 0, fontWeight: 600 }}>
                    Insert full starter
                  </button>
                </div>
                <div style={{ fontSize: 11.5, color: '#334155', lineHeight: 1.45, display: 'grid', gap: 4 }}>
                  <div><strong>What happened:</strong> {templateGuide.happened}</div>
                  <div><strong>Where:</strong> {templateGuide.where}</div>
                  <div><strong>Since when:</strong> {templateGuide.sinceWhen}</div>
                  <div><strong>Business impact:</strong> {templateGuide.impact}</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  <button className="lift-soft" type="button" onClick={() => useTemplateLine('What happened', templateGuide.happened)} style={miniChipBtnStyle}>+ What happened</button>
                  <button className="lift-soft" type="button" onClick={() => useTemplateLine('Where', templateGuide.where)} style={miniChipBtnStyle}>+ Where</button>
                  <button className="lift-soft" type="button" onClick={() => useTemplateLine('Since when', templateGuide.sinceWhen)} style={miniChipBtnStyle}>+ Since when</button>
                  <button className="lift-soft" type="button" onClick={() => useTemplateLine('Business impact', templateGuide.impact)} style={miniChipBtnStyle}>+ Business impact</button>
                </div>
              </div>
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

              {/* Smart urgency meter */}
              <div style={{
                marginTop: 10,
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: '0.75rem 0.85rem',
                background: '#fcfdff',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>Smart urgency meter (live)</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: urgencyInsight.color }}>
                    {urgencyInsight.level}
                  </div>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: '#edf2f7', overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{
                    width: `${urgencyInsight.score}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${urgencyInsight.color}, ${urgencyInsight.color}CC)`,
                    transition: 'width .25s ease',
                  }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {urgencyInsight.reasons.map((reason) => (
                    <span key={reason} style={{
                      fontSize: 10.5,
                      padding: '3px 8px',
                      borderRadius: 999,
                      border: '1px solid #d1d5db',
                      color: '#475569',
                      background: '#fff',
                      textTransform: 'capitalize',
                    }}>
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Incident timeline chips */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>Incident timeline</label>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                Tell technicians when this started for faster troubleshooting.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {timelineOptions.map((opt) => {
                  const isActive = incidentTimeline === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setIncidentTimeline((prev) => (prev === opt.value ? '' : opt.value))}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        padding: '6px 11px',
                        borderRadius: 999,
                        border: `1px solid ${isActive ? '#185FA5' : '#d1d5db'}`,
                        background: isActive ? '#ebf4ff' : '#fff',
                        color: isActive ? '#185FA5' : '#475569',
                        cursor: 'pointer',
                        transition: 'all .2s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
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

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6' }}>
              <span style={{ fontSize: 12, color: isStep1Valid ? '#639922' : '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                {isStep1Valid ? '✓ Ready to continue' : 'Fill required fields to continue'}
              </span>
              <button
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
                style={{
                  fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                  padding: '10px 28px', borderRadius: 9, border: 'none',
                  cursor: isStep1Valid ? 'pointer' : 'not-allowed',
                  background: isStep1Valid ? 'linear-gradient(135deg, #185FA5, #378ADD)' : '#e5e7eb',
                  color: isStep1Valid ? '#fff' : '#9ca3af',
                  boxShadow: isStep1Valid ? '0 2px 10px rgba(24,95,165,0.3)' : 'none',
                  transition: 'all .2s',
                }}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Priority ── */}
        {step === 2 && (
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Priority &amp; resource</div>

            <div style={{
              marginBottom: '1rem',
              border: '1px solid #dbeafe',
              background: 'linear-gradient(135deg, #f8fbff 0%, #eef6ff 100%)',
              borderRadius: 10,
              padding: '0.8rem 0.9rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e3a8a', marginBottom: 4 }}>
                    Suggested by urgency meter
                  </div>
                  <div style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span>Score: <strong style={{ color: urgencyInsight.color }}>{urgencyInsight.score}</strong></span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 8px',
                        borderRadius: 999,
                        border: `1px solid ${suggestedPriorityMeta.border}`,
                        background: suggestedPriorityMeta.bg,
                        color: suggestedPriorityMeta.textColor,
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      Recommended: {suggestedPriorityMeta.label}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={applySuggestedPriority}
                  disabled={form.priority === suggestedPriority}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    padding: '7px 10px',
                    borderRadius: 8,
                    border: '1px solid #185FA5',
                    background: form.priority === suggestedPriority ? '#e5e7eb' : '#185FA5',
                    color: form.priority === suggestedPriority ? '#9ca3af' : '#fff',
                    cursor: form.priority === suggestedPriority ? 'not-allowed' : 'pointer',
                  }}
                >
                  {form.priority === suggestedPriority ? 'Already selected' : 'Use suggested priority'}
                </button>
              </div>
              <div style={{ marginTop: 7, fontSize: 11, color: '#64748b' }}>
                Signals: {urgencyInsight.reasons.join(', ')}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
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
                      {isSelected && (
                        <span style={{ fontSize: 10, color: p.textColor, opacity: 0.7, marginTop: 3, display: 'block' }}>selected</span>
                      )}
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

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>
                Related resource <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>optional</span>
              </label>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, lineHeight: 1.4 }}>
                Choose the room or asset the issue is attached to. If nothing matches, keep it as a general issue.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {relatedResourceKeywords.map((word) => (
                  <span
                    key={word}
                    style={{
                      fontSize: 11,
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      borderRadius: 999,
                      padding: '3px 9px',
                    }}
                  >
                    {word}
                  </span>
                ))}
              </div>
              {resources.length === 0 && (
                <div style={{
                  marginBottom: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px dashed #d1d5db',
                  background: '#fafafa',
                  fontSize: 12,
                  color: '#64748b',
                }}>
                  No related resources available yet. Add resources from the Resources page first, then they will appear here.
                </div>
              )}
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
              {selectedResourceId && (
                <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
                  Selected resource linked successfully.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6' }}>
              <button onClick={() => setStep(1)} style={ghostBtnStyle}>← Back</button>
              <button onClick={() => setStep(3)} style={enhancedPrimaryBtn}>Continue →</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Attachments ── */}
        {step === 3 && (
          <div style={cardStyle}>
            <div style={sectionLabelStyle}>Attachments</div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={labelStyle}>
                Images <span style={{ fontWeight: 400, color: '#9ca3af', fontSize: 11 }}>max 3</span>
              </label>
              <label
                style={{
                  display: 'block', border: '2px dashed #d1d5db', borderRadius: 12, padding: '2rem 1.5rem',
                  textAlign: 'center', cursor: 'pointer', background: '#fafafa', transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#185FA5'; e.currentTarget.style.background = '#EBF4FF'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fafafa'; }}
              >
                <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.35 }}>📎</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Click to upload images</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>PNG, JPG, WEBP — up to 5 MB each · max 3 files</div>
              </label>

              {files.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280', margin: '12px 0 8px', fontWeight: 500 }}>
                    {files.length} file{files.length > 1 ? 's' : ''} selected
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {files.map((file, index) => {
                      const previewUrl = URL.createObjectURL(file);
                      return (
                        <div key={`${file.name}-${index}`} style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                          <img src={previewUrl} alt={file.name}
                            onLoad={() => URL.revokeObjectURL(previewUrl)}
                            style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }} />
                          <div style={{ padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', borderTop: '0.5px solid #e5e7eb' }}>
                            <span style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{file.name}</span>
                            <button type="button" onClick={() => removeFile(index)}
                              style={{ fontSize: 11, color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #f3f4f6' }}>
              <button onClick={() => setStep(2)} style={ghostBtnStyle}>← Back</button>
              <button
                onClick={handleSubmit}
                disabled={loading || Boolean(createdTicket)}
                style={{
                  fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                  padding: '10px 28px', borderRadius: 9, border: 'none',
                  cursor: (loading || createdTicket) ? 'not-allowed' : 'pointer',
                  background: (loading || createdTicket) ? '#e5e7eb' : 'linear-gradient(135deg, #185FA5, #378ADD)',
                  color: (loading || createdTicket) ? '#9ca3af' : '#fff',
                  boxShadow: (loading || createdTicket) ? 'none' : '0 2px 10px rgba(24,95,165,0.3)',
                  transition: 'all .2s',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {loading && (
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                )}
                {loading ? 'Creating...' : createdTicket ? 'Ticket created' : 'Create ticket'}
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeUpSoft {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-up-soft {
            animation: fadeUpSoft 0.38s ease-out both;
          }
          .fade-delay-1 {
            animation-delay: 0.08s;
          }
          .lift-soft {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .lift-soft:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 8px rgba(24,95,165,0.12);
          }
        `}</style>
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
const enhancedPrimaryBtn = {
  fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
  padding: '10px 28px', borderRadius: 9, border: 'none',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #185FA5, #378ADD)',
  color: '#fff',
  boxShadow: '0 2px 10px rgba(24,95,165,0.3)',
  transition: 'all .2s',
};
const ghostBtnStyle = {
  fontSize: 14, color: '#6b7280', background: 'none',
  border: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: '9px 0',
};
const smallActionBtnStyle = {
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'inherit',
  padding: '7px 10px',
  borderRadius: 8,
  border: '1px solid #bfd7f3',
  background: '#fff',
  color: '#185FA5',
  cursor: 'pointer',
};
const miniChipBtnStyle = {
  fontSize: 11,
  fontWeight: 600,
  fontFamily: 'inherit',
  padding: '4px 8px',
  borderRadius: 999,
  border: '1px solid #bfdbfe',
  background: '#eff6ff',
  color: '#1e3a8a',
  cursor: 'pointer',
};