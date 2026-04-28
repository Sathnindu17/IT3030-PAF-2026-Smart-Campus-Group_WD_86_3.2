/**
 * SLA Calculator for Ticket Management
 * Calculates response time and resolution time based on ticket priority
 */

const SLA_CONFIG = {
  LOW: {
    responseHours: 48,
    resolutionHours: 72,
    label: 'Low Priority',
  },
  MEDIUM: {
    responseHours: 24,
    resolutionHours: 48,
    label: 'Medium Priority',
  },
  HIGH: {
    responseHours: 8,
    resolutionHours: 24,
    label: 'High Priority',
  },
  URGENT: {
    responseHours: 2,
    resolutionHours: 8,
    label: 'Urgent Priority',
  },
};

/**
 * Calculate SLA status for a ticket
 * @param {Object} ticket - Ticket object with createdAt, status, priority, updatedAt
 * @returns {Object} SLA status object
 */
export const calculateSLAStatus = (ticket) => {
  if (!ticket || !ticket.createdAt || !ticket.priority) {
    return null;
  }

  const slaConfig = SLA_CONFIG[ticket.priority] || SLA_CONFIG.MEDIUM;
  const now = new Date();
  const createdAt = new Date(ticket.createdAt);
  const updatedAt = ticket.updatedAt ? new Date(ticket.updatedAt) : createdAt;

  // Calculate time elapsed in hours
  const elapsedHours = (now - createdAt) / (1000 * 60 * 60);

  // Determine which SLA to check based on ticket status
  let targetSlaHours;
  let slaType;

  if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
    // For resolved/closed tickets, check resolution SLA
    targetSlaHours = slaConfig.resolutionHours;
    slaType = 'resolution';
    const resolvedHours = (updatedAt - createdAt) / (1000 * 60 * 60);
    const isBreach = resolvedHours > targetSlaHours;
    return {
      type: slaType,
      breached: isBreach,
      hoursUsed: resolvedHours,
      hoursAllowed: targetSlaHours,
      status: isBreach ? 'breached' : 'met',
      percentage: Math.min(100, (resolvedHours / targetSlaHours) * 100),
    };
  } else if (['IN_PROGRESS', 'ASSIGNED'].includes(ticket.status)) {
    // For in-progress, check against resolution SLA
    targetSlaHours = slaConfig.resolutionHours;
    slaType = 'resolution';
  } else {
    // For open/new tickets, check against response SLA
    targetSlaHours = slaConfig.responseHours;
    slaType = 'response';
  }

  const hoursRemaining = targetSlaHours - elapsedHours;
  const percentage = Math.min(100, (elapsedHours / targetSlaHours) * 100);

  let status = 'ok';
  if (hoursRemaining < 0) {
    status = 'breached';
  } else if (hoursRemaining < targetSlaHours * 0.2) {
    // Less than 20% time remaining
    status = 'warning';
  }

  return {
    type: slaType,
    hoursRemaining: Math.max(0, hoursRemaining),
    hoursAllowed: targetSlaHours,
    elapsedHours,
    status,
    breached: status === 'breached',
    percentage,
    label: slaConfig.label,
    config: slaConfig,
  };
};

/**
 * Format SLA time display
 * @param {number} hours - Hours to format
 * @returns {string} Formatted time string
 */
export const formatSLATime = (hours) => {
  if (hours <= 0) return 'Expired';
  if (hours < 1) {
    const minutes = Math.ceil(hours * 60);
    return `${minutes}m`;
  }
  if (hours < 24) {
    return `${Math.ceil(hours)}h`;
  }
  const days = Math.ceil(hours / 24);
  return `${days}d`;
};

/**
 * Get SLA status color
 * @param {string} status - SLA status (ok, warning, breached)
 * @returns {Object} Color config with bg, text, border
 */
export const getSLAColor = (status) => {
  switch (status) {
    case 'breached':
      return {
        bg: '#fee2e2',
        text: '#991b1b',
        border: '#fca5a5',
        badge: '#dc2626',
      };
    case 'warning':
      return {
        bg: '#fef3c7',
        text: '#92400e',
        border: '#fcd34d',
        badge: '#f59e0b',
      };
    default:
      return {
        bg: '#d1fae5',
        text: '#065f46',
        border: '#6ee7b7',
        badge: '#10b981',
      };
  }
};

/**
 * Get SLA status badge label
 * @param {Object} slaStatus - SLA status object from calculateSLAStatus
 * @returns {string} Badge label
 */
export const getSLABadgeLabel = (slaStatus) => {
  if (!slaStatus) return '';
  if (slaStatus.status === 'breached') {
    return `SLA Breached (${Math.ceil(Math.abs(slaStatus.hoursRemaining))}h overdue)`;
  }
  if (slaStatus.status === 'warning') {
    return `${formatSLATime(slaStatus.hoursRemaining)} remaining`;
  }
  return `${formatSLATime(slaStatus.hoursRemaining)} remaining`;
};

export default {
  calculateSLAStatus,
  formatSLATime,
  getSLAColor,
  getSLABadgeLabel,
  SLA_CONFIG,
};
