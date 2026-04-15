import type { ChartDayEntry } from '../types';

export interface ProteinComplianceStats {
  complianceRate: number | null;
  trackedDays: number;
}

export function computeProteinComplianceStats(days: ChartDayEntry[], proteinFloor: number): ProteinComplianceStats {
  const tracked = days.filter((d) => d.protein != null && d.protein > 0);
  const met = tracked.filter((d) => (d.protein ?? 0) >= proteinFloor).length;
  return {
    complianceRate: tracked.length > 0 ? Math.round((met / tracked.length) * 100) : null,
    trackedDays: tracked.length,
  };
}
