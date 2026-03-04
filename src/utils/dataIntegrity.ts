import type { ChartDayEntry } from '../types';

export interface DataWarning {
  id: string;
  severity: 'warn' | 'info';
  message: string;
}

export function computeDataWarnings(days: ChartDayEntry[]): DataWarning[] {
  const warnings: DataWarning[] = [];

  const missingWeight = days.filter(d => d.weight == null).length;
  if (missingWeight > 0) {
    warnings.push({
      id: 'missing_weight',
      severity: 'warn',
      message: `${missingWeight} day${missingWeight > 1 ? 's' : ''} missing weight — trend average and projections may be skewed.`,
    });
  }

  const missingProtein = days.filter(d => d.protein == null || d.protein === 0).length;
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
