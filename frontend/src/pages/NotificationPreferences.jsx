import { useState, useEffect } from 'react';
import { authAPI } from '../api/axios';

const NOTIFICATION_TYPES = [
  { key: 'SECURITY', label: 'Security Alerts', icon: '🔐', desc: 'New device sign-ins and account security' },
  { key: 'BOOKING', label: 'Booking Updates', icon: '📅', desc: 'Booking confirmations, approvals, and cancellations' },
  { key: 'TICKET', label: 'Ticket Updates', icon: '🎫', desc: 'Ticket status changes and technician responses' },
  { key: 'SYSTEM', label: 'System Announcements', icon: '📢', desc: 'Platform updates and maintenance notices' },
  { key: 'GENERAL', label: 'General', icon: '🔔', desc: 'Other miscellaneous notifications' },
];

export default function NotificationPreferences() {
  const [enabledTypes, setEnabledTypes] = useState([]);
  const [dndEnabled, setDndEnabled] = useState(false);
  const [dndStart, setDndStart] = useState('22:00');
  const [dndEnd, setDndEnd] = useState('07:00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const res = await authAPI.getNotificationPreferences();
      const prefs = res.data.data;
      if (prefs) {
        setEnabledTypes(prefs.enabledTypes || NOTIFICATION_TYPES.map(t => t.key));
        setDndEnabled(prefs.dndEnabled || false);
        setDndStart(prefs.dndStart || '22:00');
        setDndEnd(prefs.dndEnd || '07:00');
      }
    } catch (e) {
      // Use defaults
      setEnabledTypes(NOTIFICATION_TYPES.map(t => t.key));
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (key) => {
    setEnabledTypes(prev =>
      prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
    );
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await authAPI.updateNotificationPreferences({
        enabledTypes,
        dndEnabled,
        dndStart,
        dndEnd,
      });
      // Also save DND settings to localStorage for the bell component
      localStorage.setItem('dnd_preferences', JSON.stringify({
        dndEnabled,
        dndStart,
        dndEnd,
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div> Loading preferences...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 24 }}>
        <h2>⚙️ Notification Preferences</h2>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, marginTop: 4 }}>
          Choose which notifications you'd like to receive and set quiet hours.
        </p>
      </div>

      {/* Notification Type Toggles */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>Notification Types</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {NOTIFICATION_TYPES.map((type, idx) => (
            <div
              key={type.key}
              className="pref-type-row"
              style={{
                borderBottom: idx < NOTIFICATION_TYPES.length - 1 ? '1px solid var(--gray-100)' : 'none',
              }}
            >
              <div className="pref-type-info">
                <span className="pref-type-icon">{type.icon}</span>
                <div>
                  <div className="pref-type-label">{type.label}</div>
                  <div className="pref-type-desc">{type.desc}</div>
                </div>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={enabledTypes.includes(type.key)}
                  onChange={() => toggleType(type.key)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Do Not Disturb */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>🔕 Do Not Disturb</h3>
        </div>
        <div className="card-body">
          <div className="pref-type-row" style={{ border: 'none', padding: '0 0 16px 0' }}>
            <div className="pref-type-info">
              <div>
                <div className="pref-type-label">Enable Quiet Hours</div>
                <div className="pref-type-desc">
                  Badge count will be hidden during this window
                </div>
              </div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={dndEnabled}
                onChange={(e) => { setDndEnabled(e.target.checked); setSaved(false); }}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {dndEnabled && (
            <div className="dnd-time-row">
              <div className="dnd-time-group">
                <label>From</label>
                <input
                  type="time"
                  className="form-control"
                  value={dndStart}
                  onChange={(e) => { setDndStart(e.target.value); setSaved(false); }}
                />
              </div>
              <div className="dnd-time-separator">→</div>
              <div className="dnd-time-group">
                <label>Until</label>
                <input
                  type="time"
                  className="form-control"
                  value={dndEnd}
                  onChange={(e) => { setDndEnd(e.target.value); setSaved(false); }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
        {saved && (
          <span className="save-success-msg">
            ✅ Preferences saved successfully!
          </span>
        )}
      </div>
    </div>
  );
}
