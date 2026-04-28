import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const roleGreetingMap = {
  ADMIN: {
    icon: '🛠️',
    title: 'Welcome Admin',
    message: 'Oversee ticket flow, assign technicians quickly, and keep SLA performance on track.',
    border: '#bfdbfe',
    background: 'linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)',
    accent: '#1d4ed8',
  },
  TECHNICIAN: {
    icon: '👷',
    title: 'Welcome Technician',
    message: 'Work through assigned tickets, update status during progress, and add clear resolution notes.',
    border: '#a5f3fc',
    background: 'linear-gradient(135deg, #ecfeff 0%, #f8fffe 100%)',
    accent: '#0f766e',
  },
  USER: {
    icon: '🎫',
    title: 'Welcome',
    message: 'Create clear tickets and track updates from open issue to final resolution.',
    border: '#dbeafe',
    background: 'linear-gradient(135deg, #f8fbff 0%, #f3f8ff 100%)',
    accent: '#1e3a8a',
  },
};

export default function TicketRoleGreeting({ style }) {
  const { user, role } = useAuth();
  const [now, setNow] = useState(new Date());
  const key = roleGreetingMap[role] ? role : 'USER';
  const config = roleGreetingMap[key];

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const timeGreeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const localTimeText = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(now);

  return (
    <div
      style={{
        marginBottom: 14,
        border: `1px solid ${config.border}`,
        background: config.background,
        borderRadius: 10,
        padding: '10px 12px',
        ...style,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: config.accent, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>
        {config.icon} {config.title}
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
        {localTimeText}
      </div>
      <div style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
        {timeGreeting}{user?.fullName ? `, ${user.fullName}` : ''}. {config.message}
      </div>
    </div>
  );
}