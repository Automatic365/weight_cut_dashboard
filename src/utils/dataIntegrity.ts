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

export interface IntegrityBadge {
  id: 'parse_conflicts' | 'override_days' | 'unknown_protein_days' | 'zero_protein_nonfast_days';
  label: string;
  count: number;
}

export interface DataIntegrityReport {
  warnings: DataWarning[];
  badges: IntegrityBadge[];
}

function isFastDay(day: ChartDayEntry): boolean {
  if (day.isFast === true) return true;
  if (day.parseVerification?.isFastDay === true) return true;
  if (WEEKLY_SCHEDULE[getDow(day.date)]?.isFast) return true;
  if (day.tier === 'Tier 3' && day.calories === 0) return true;
  return false;
}

export function computeDataIntegrityReport(days: ChartDayEntry[]): DataIntegrityReport {
  const warnings: DataWarning[] = [];

  const conflictingParseBlocks = days.filter((d) => d.parseVerification?.hasConflictingAppParseBlocks).length;
  const overrideDays = days.filter((d) => d.parseVerification?.hasOverrides).length;
  const missingProtein = days.filter((d) => d.protein == null && !isFastDay(d)).length;
  const zeroProteinNonFast = days.filter((d) => d.protein === 0 && !isFastDay(d)).length;

  const badges: IntegrityBadge[] = [
    { id: 'parse_conflicts', label: 'Parse Conflicts', count: conflictingParseBlocks },
    { id: 'override_days', label: 'Override Days', count: overrideDays },
    { id: 'unknown_protein_days', label: 'Unknown Protein', count: missingProtein },
    { id: 'zero_protein_nonfast_days', label: '0g Non-Fast', count: zeroProteinNonFast },
  ];

  if (missingProtein > 0) {
    warnings.push({
      id: 'missing_protein',
      severity: 'info',
      message: `${missingProtein} day${missingProtein > 1 ? 's' : ''} with unknown protein on non-fast days — Strength XP and compliance rate may be understated.`,
    });
  }

  if (zeroProteinNonFast > 0) {
    warnings.push({
      id: 'zero_protein_nonfast',
      severity: 'warn',
      message: `${zeroProteinNonFast} non-fast day${zeroProteinNonFast > 1 ? 's' : ''} parsed as 0g protein — check fasting classification before trusting protein compliance.`,
    });
  }

  // Dates where sleep data is permanently unavailable (not a logging gap)
  const SLEEP_UNAVAILABLE = new Set(['02/01']);
  const missingSleep = days.filter(d => d.sleep == null && !SLEEP_UNAVAILABLE.has(d.date)).length;
  if (missingSleep > 0) {
    warnings.push({
      id: 'missing_sleep',
      severity: 'info',
      message: `${missingSleep} day${missingSleep > 1 ? 's' : ''} with no sleep logged — Vitality XP and sleep correlation stats are incomplete.`,
    });
  }

  return { warnings, badges };
}
