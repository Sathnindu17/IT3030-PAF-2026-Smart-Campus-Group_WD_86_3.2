import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/axios';

const AuthContext = createContext(null);

// Simple hash function for device fingerprinting
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

function getDeviceFingerprint() {
  const ua = navigator.userAgent;
  const screen = `${window.screen.width}x${window.screen.height}`;
  const lang = navigator.language;
  const platform = navigator.platform || 'unknown';
  return hashCode(`${ua}|${screen}|${lang}|${platform}`);
}

function getDeviceInfoString() {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);

    // ===== Trusted Device Check =====
    try {
      const currentFingerprint = getDeviceFingerprint();
      const storedFingerprint = localStorage.getItem('device_fingerprint');

      if (storedFingerprint && storedFingerprint !== currentFingerprint) {
        // New device detected — send alert
        const deviceInfo = getDeviceInfoString();
        authAPI.deviceAlert({ deviceInfo }).catch(() => {});
      }

      // Always update stored fingerprint
      localStorage.setItem('device_fingerprint', currentFingerprint);
    } catch (e) {
      // Don't block login if fingerprinting fails
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAuthenticated = !!user;
  const role = user?.role || '';

  const hasRole = (...roles) => roles.includes(role);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, role, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
