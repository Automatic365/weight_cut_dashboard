import { SLEEP_FRICTION_DISPLAY, ADHERENCE_HIGH, MAX_SHIELD } from '../config';
import type { ChartDayEntry } from '../types';

export interface RiskAlert {
  id: string;
  level: 'critical' | 'warning';
  title: string;
  detail: string;
}

export function computeRiskAlerts(days: ChartDayEntry[]): RiskAlert[] {
  if (days.length === 0) return [];
  const alerts: RiskAlert[] = [];

  // ── Last N days window ──────────────────────────────────────────────────────
  const last3 = days.slice(-3);
  const last5 = days.slice(-5);
  const last7 = days.slice(-7);

  // 1. Consecutive poor sleep (≥2 of last 3 nights)
  const poorSleepCount = last3.filter(d => d.sleep != null && d.sleep < SLEEP_FRICTION_DISPLAY).length;
  if (poorSleepCount >= 2) {
    alerts.push({
      id: 'sleep_debt',
      level: 'critical',
      title: 'Sleep Debt Accumulating',
      detail: `${poorSleepCount} of the last 3 nights were under ${SLEEP_FRICTION_DISPLAY}h. Ghrelin output is elevated — craving resistance is compromised. Prioritize sleep tonight.`,
    });
  }

  // 2. Adherence drift (≥3 fails in last 5 days)
  const recentFails = last5.filter(d => d.status === 'Fail').length;
  if (recentFails >= 3) {
    alerts.push({
      id: 'adherence_drift',
      level: 'critical',
      title: 'Adherence Drift',
      detail: `${recentFails}/5 recent days were fails. The system is slipping. Return to structure before the streak resets.`,
    });
  }

  // 3. Shield critically low
  const latestShield = days[days.length - 1].shield ?? 0;
  if (latestShield <= 4 && latestShield > 0) {
    alerts.push({
      id: 'shield_low',
      level: 'warning',
      title: 'Tactical Shield Low',
      detail: `Shield at ${latestShield}/${MAX_SHIELD}. One more uncontrolled day risks tier drop. Stack clean days to recharge before the next Boss encounter.`,
    });
  }

  // 4. Streak at risk — last day was a fail
  const latest = days[days.length - 1];
  const prev = days.length >= 2 ? days[days.length - 2] : null;
  if (latest.status === 'Fail' && prev && prev.status === 'Pass' && (prev.streak ?? 0) >= 7) {
    alerts.push({
      id: 'streak_broken',
      level: 'critical',
      title: 'Streak Reset — Bounce-Back Window',
      detail: `A ${prev.streak}-day streak was broken. The next 24h determines whether this becomes a spiral. Reset today: hit protein, hit sleep.`,
    });
  }

  // 5. Low protein compliance over last 7 days
  const last7WithProtein = last7.filter(d => d.protein != null && d.protein > 0);
  const proteinFails = last7WithProtein.filter(d => d.protein! < 190).length;
  if (last7WithProtein.length >= 4 && proteinFails >= 3) {
    alerts.push({
      id: 'protein_deficit',
      level: 'warning',
      title: 'Protein Compliance Slipping',
      detail: `${proteinFails} of the last ${last7WithProtein.length} logged days missed the 190g floor. Muscle retention risk increases after 5+ consecutive days below target.`,
    });
  }

  return alerts;
}
