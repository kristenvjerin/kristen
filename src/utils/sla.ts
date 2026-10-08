import { PriorityLevel, SeverityLevel, SLAConfig } from '../types';

export const DEFAULT_SLA_CONFIG: SLAConfig = {
  criticalHours: 2,
  highHours: 6,
  mediumHours: 24,
  lowHours: 72,
};

/**
 * Calculates due timestamp based on priority and configurable SLA hours.
 */
export function calculateDueDate(
  priority: PriorityLevel | SeverityLevel,
  baseDate: Date = new Date(),
  config: SLAConfig = DEFAULT_SLA_CONFIG
): Date {
  const normPriority = priority.toUpperCase() as PriorityLevel;
  let hoursToAdd: number;

  switch (normPriority) {
    case 'CRITICAL':
      hoursToAdd = config.criticalHours;
      break;
    case 'HIGH':
      hoursToAdd = config.highHours;
      break;
    case 'MEDIUM':
      hoursToAdd = config.mediumHours;
      break;
    case 'LOW':
    default:
      hoursToAdd = config.lowHours;
      break;
  }

  return new Date(baseDate.getTime() + hoursToAdd * 60 * 60 * 1000);
}

/**
 * Evaluates whether an incident is overdue or remaining time.
 */
export function getSLAStatus(
  dueAt: string,
  resolvedAt?: string
): {
  isOverdue: boolean;
  remainingMs: number;
  remainingHours: number;
  formattedRemaining: string;
  badgeColor: string;
} {
  const due = new Date(dueAt).getTime();
  const targetTime = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
  const diff = due - targetTime;
  const isOverdue = diff < 0;
  const absDiff = Math.abs(diff);

  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  let formattedRemaining: string;
  if (resolvedAt) {
    formattedRemaining = isOverdue
      ? `Breached by ${hours}h ${minutes}m`
      : `Met SLA (${hours}h ${minutes}m buffer)`;
  } else {
    formattedRemaining = isOverdue
      ? `Overdue by ${hours}h ${minutes}m`
      : `${hours}h ${minutes}m left`;
  }

  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (isOverdue) {
    badgeColor = 'bg-red-100 text-red-800 border-red-300';
  } else if (hours <= 2) {
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
  }

  return {
    isOverdue,
    remainingMs: diff,
    remainingHours: diff / (1000 * 60 * 60),
    formattedRemaining,
    badgeColor,
  };
}
