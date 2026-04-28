export const TICKET_CATEGORY_OPTIONS = [
  { value: 'NETWORK', label: 'Network', icon: '🌐', color: '#1d4ed8' },
  { value: 'HOSTEL', label: 'Hostel', icon: '🏠', color: '#0f766e' },
  { value: 'IT_SUPPORT', label: 'IT Support', icon: '💻', color: '#7c3aed' },
  { value: 'ACADEMIC', label: 'Academic', icon: '📚', color: '#d97706' },
  { value: 'FACILITIES', label: 'Facilities', icon: '🏢', color: '#2563eb' },
  { value: 'SECURITY', label: 'Security', icon: '🛡️', color: '#b45309' },
  { value: 'OTHER', label: 'Other', icon: '➕', color: '#64748b' },
];

const CATEGORY_ALIASES = {
  GENERAL: 'NETWORK',
  ELECTRICAL: 'FACILITIES',
  PLUMBING: 'FACILITIES',
  IT_EQUIPMENT: 'IT_SUPPORT',
  FURNITURE: 'FACILITIES',
  HVAC: 'FACILITIES',
  SAFETY: 'SECURITY',
};

const CATEGORY_LOOKUP = new Map([
  ...TICKET_CATEGORY_OPTIONS.map((option) => [option.value, option]),
  ...TICKET_CATEGORY_OPTIONS.map((option) => [option.label.toUpperCase(), option]),
]);

export const normalizeTicketCategory = (category) => CATEGORY_ALIASES[category] || category;

export const getTicketCategoryMeta = (category) => {
  const normalized = normalizeTicketCategory(category);
  return CATEGORY_LOOKUP.get(normalized) || CATEGORY_LOOKUP.get('OTHER');
};

export default function TicketCategoryPicker({
  value,
  onChange,
  mode = 'grid',
  allowAll = false,
  allLabel = 'All Categories',
  compact = false,
  style,
}) {
  const options = allowAll
    ? [{ value: '', label: allLabel, icon: '✨', color: '#334155' }, ...TICKET_CATEGORY_OPTIONS]
    : TICKET_CATEGORY_OPTIONS;

  const gridStyle = mode === 'chips'
    ? {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
      }
    : {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 10,
      };

  return (
    <div style={{ ...gridStyle, ...style }}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value || 'all'}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              border: `1.5px solid ${isSelected ? option.color : '#e5e7eb'}`,
              background: isSelected ? `${option.color}12` : '#fff',
              color: isSelected ? option.color : '#334155',
              borderRadius: 14,
              padding: compact ? '8px 12px' : '12px 12px',
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: isSelected ? `0 8px 18px ${option.color}22` : '0 1px 3px rgba(15,23,42,0.05)',
              transition: 'all .18s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minHeight: compact ? 42 : 58,
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: compact ? 16 : 20, lineHeight: 1 }}>{option.icon}</span>
            <span style={{ display: 'grid', gap: 1 }}>
              <span style={{ fontSize: compact ? 12 : 13, fontWeight: 700, lineHeight: 1.1 }}>{option.label}</span>
              {!compact && <span style={{ fontSize: 11, color: '#94a3b8' }}>{isSelected ? 'Selected' : 'Tap to choose'}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}