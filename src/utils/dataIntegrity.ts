import type { ChartDayEntry } from '../types';
import { WEEKLY_SCHEDULE, DATA_YEAR } from '../config';

function getDow(date: string): number {
  const [m, d] = date.split('/');
  return new Date(DATA_YEAR, +m - 1, +d).getDay();
}

export interface DataWarning {
  id: string;
  severity: 'warn' | 'info';
  message: string;
}

export function computeDataWarnings(days: ChartDayEntry[]): DataWarning[] {
  const warnings: DataWarning[] = [];

  const missingProtein = days.filter(d => {
    if (d.protein != null && d.protein !== 0) return false;
    return !WEEKLY_SCHEDULE[getDow(d.date)]?.isFast; // exclude intentional fast days
  }).length;
  if (missingProtein > 0) {
    warnings.push({
      id: 'missing_protein',
      severity: 'info',
      message: `${missingProtein} day${missingProtein > 1 ? 's' : ''} with no protein logged — Strength XP and compliance rate may be understated.`,
    });
  }

  const missingSleep = days.filter(d => d.sleep == null).length;
  if (missingSleep > 0) {
    warnings.push({
      id: 'missing_sleep',
      severity: 'info',
      message: `${missingSleep} day${missingSleep > 1 ? 's' : ''} with no sleep logged — Vitality XP and sleep correlation stats are incomplete.`,
    });
  }

  return warnings;
}
