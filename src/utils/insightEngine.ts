import { PROTEIN_FLOOR, SLEEP_GOAL, ADHERENCE_HIGH, SLEEP_FRICTION_DISPLAY } from '../config';
import type { ChartDayEntry } from '../types';

export interface WeeklyDebrief {
  weekLabel: string;
  passDays: number;
  failDays: number;
  avgWeight: number | null;
  avgSleep: number | null;
  avgProtein: number | null;
  avgAdherence: number | null;
  biggestLeak: string;
  directive: string;
}

export function computeWeeklyDebrief(days: ChartDayEntry[]): WeeklyDebrief | null {
  if (days.length === 0) return null;

  const window = days.slice(-7);

  const passDays = window.filter(d => d.status === 'Pass').length;
  const failDays = window.length - passDays;

  const weights = window.map(d => d.weight).filter((w): w is number => w != null);
  const avgWeight = weights.length > 0 ? +( weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : null;

  const sleeps = window.map(d => d.sleep).filter((s): s is number => s != null);
  const avgSleep = sleeps.length > 0 ? +(sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1) : null;

  const proteins = window.map(d => d.protein).filter((p): p is number => p != null && p > 0);
  const avgProtein = proteins.length > 0 ? Math.round(proteins.reduce((a, b) => a + b, 0) / proteins.length) : null;

  const adherences = window.map(d => d.adherenceScore).filter((a): a is number => a != null);
  const avgAdherence = adherences.length > 0 ? Math.round(adherences.reduce((a, b) => a + b, 0) / adherences.length) : null;

  // Determine biggest leak
  const proteinMisses = proteins.filter(p => p < PROTEIN_FLOOR).length;
  const sleepMisses = sleeps.filter(s => s < SLEEP_GOAL).length;
  const adherenceMisses = adherences.filter(a => a < ADHERENCE_HIGH).length;

  let biggestLeak = 'No major leaks detected';
  let directive = 'Maintain current structure. Stack clean days.';

  if (failDays >= 3) {
    biggestLeak = `${failDays}/7 days failed — adherence breakdown`;
    directive = 'Simplify meals this week. Default to the same 2–3 compliant meals to eliminate decision fatigue.';
  } else if (proteinMisses >= 3 && proteins.length >= 3) {
    biggestLeak = `Protein missed on ${proteinMisses}/${proteins.length} logged days`;
    directive = `Pre-log protein sources the night before. Every day must clear ${PROTEIN_FLOOR}g before 8 PM.`;
  } else if (sleepMisses >= 3 && sleeps.length >= 3) {
    biggestLeak = `Sleep under ${SLEEP_GOAL}h on ${sleepMisses}/${sleeps.length} logged nights`;
    directive = 'Set a hard lights-out time this week. Sleep is the only lever that improves every metric simultaneously.';
  } else if (failDays === 2) {
    biggestLeak = `2 fail days — manageable but needs correction`;
    directive = 'Identify the pattern on the 2 fail days (time of day, social event, stress). Eliminate or pre-plan around it.';
  } else if (failDays === 0) {
    biggestLeak = 'None — perfect week';
    directive = 'Perfect execution. Stay boring. The compound effect is building.';
  } else {
    biggestLeak = `${failDays} fail day${failDays > 1 ? 's' : ''} — minor drift`;
    directive = `${passDays}/7 pass days is solid. Focus on protein and sleep quality to tighten the remaining gaps.`;
  }

  const firstDate = window[0].date;
  const lastDate = window[window.length - 1].date;
  const weekLabel = `${firstDate} – ${lastDate}`;

  return {
    weekLabel,
    passDays,
    failDays,
    avgWeight,
    avgSleep,
    avgProtein,
    avgAdherence,
    biggestLeak,
    directive,
  };
}

// ─── Dynamic Coach Insights ───────────────────────────────────────────────────

export interface CoachInsights {
  weight: string[];
  waist: string[];
  calories: string[];
  sleep: string[];
  protein: string[];
  adherence: string[];
}

export function computeCoachInsights(days: ChartDayEntry[]): CoachInsights {
  if (days.length === 0) {
    return { weight: [], waist: [], calories: [], sleep: [], protein: [], adherence: [] };
  }

  const last14 = days.slice(-14);
  const last7 = days.slice(-7);

  // ── Weight ────────────────────────────────────────────────────────────────
  const avgWeights = last7.map(d => d.weightAvg).filter((w): w is number => w != null);
  const weightInsights: string[] = [];
  if (avgWeights.length >= 2) {
    const delta = +(avgWeights[avgWeights.length - 1] - avgWeights[0]).toFixed(1);
    const ratePerWk = +((delta / 7) * 7).toFixed(2);
    if (delta < 0) {
      weightInsights.push(`7-day average dropped ${Math.abs(delta)} lbs this week (${Math.abs(ratePerWk)} lbs/wk rate). The trend line is working.`);
    } else if (delta === 0) {
      weightInsights.push('7-day average is flat this week. Check sodium, sleep quality, and training load before adjusting calories.');
    } else {
      weightInsights.push(`7-day average is up ${delta} lbs this week. Investigate: high sodium intake, poor sleep, or post-training inflammation before reacting.`);
    }
  }
  weightInsights.push('React to moving averages, not single weigh-ins. A single day spike is almost never fat gain.');

  // ── Waist ─────────────────────────────────────────────────────────────────
  const waistReadings = last14.map(d => d.waistNavel).filter((w): w is number => w != null);
  const waistInsights: string[] = [];
  if (waistReadings.length >= 2) {
    const delta = +(waistReadings[waistReadings.length - 1] - waistReadings[0]).toFixed(2);
    if (delta < 0) {
      waistInsights.push(`Abdomen compressed ${Math.abs(delta)}" over the last ${last14.length} days. This is the real fat-loss signal.`);
    } else if (delta > 0.5) {
      waistInsights.push(`Abdomen up ${delta}" over the last ${last14.length} days. Check sodium intake and digestion volume before concluding fat gain.`);
    } else {
      waistInsights.push('Abdomen stable. Waist measurement noise is normal — look for multi-week trends, not day-to-day changes.');
    }
  }
  waistInsights.push('If waist stays tight while weight stalls, recomposition is still working.');

  // ── Calories ─────────────────────────────────────────────────────────────
  const calReadings = last7.map(d => d.calories).filter(c => c > 0);
  const caloriesInsights: string[] = [];
  if (calReadings.length >= 3) {
    const avgCal = Math.round(calReadings.reduce((a, b) => a + b, 0) / calReadings.length);
    caloriesInsights.push(`Last 7-day average: ${avgCal} kcal/day. ${avgCal <= 1650 ? 'Inside the linear target — hold this.' : avgCal <= 2000 ? 'Slightly over linear target — tighten this week.' : 'Significantly above target — identify which days drove this.'}`);
  }
  caloriesInsights.push('Keep compliance boring and repeatable instead of chasing aggressive calorie swings.');

  // ── Sleep ─────────────────────────────────────────────────────────────────
  const sleepReadings = last14.map(d => d.sleep).filter((s): s is number => s != null);
  const sleepInsights: string[] = [];
  if (sleepReadings.length >= 3) {
    const poorNights = sleepReadings.filter(s => s < SLEEP_FRICTION_DISPLAY).length;
    if (poorNights >= 3) {
      sleepInsights.push(`${poorNights} of the last ${sleepReadings.length} logged nights were under ${SLEEP_FRICTION_DISPLAY}h. Ghrelin is elevated — willpower is compromised. Fix sleep before tightening anything else.`);
    } else if (poorNights === 0) {
      sleepInsights.push(`Clean sleep block — all ${sleepReadings.length} logged nights above ${SLEEP_FRICTION_DISPLAY}h. This is directly supporting your adherence rate.`);
    } else {
      sleepInsights.push(`${poorNights}/${sleepReadings.length} logged nights under ${SLEEP_FRICTION_DISPLAY}h. Manageable, but don't let this trend continue.`);
    }
  }
  sleepInsights.push(`On low-sleep days (<${SLEEP_FRICTION_DISPLAY}h), pre-commit meals earlier to avoid reactive decisions.`);

  // ── Protein ───────────────────────────────────────────────────────────────
  const proteinReadings = last14.map(d => d.protein).filter((p): p is number => p != null && p > 0);
  const proteinInsights: string[] = [];
  if (proteinReadings.length >= 3) {
    const metFloor = proteinReadings.filter(p => p >= PROTEIN_FLOOR).length;
    const pct = Math.round((metFloor / proteinReadings.length) * 100);
    proteinInsights.push(`Protein floor met on ${metFloor}/${proteinReadings.length} logged days (${pct}%) over the last 2 weeks. ${pct >= 80 ? 'Muscle protection is solid.' : 'Below 80% compliance — muscle retention risk is real at this caloric deficit.'}`);
  }
  proteinInsights.push(`Hitting ${PROTEIN_FLOOR}g+ is the non-negotiable anchor of this cut. Miss it and the deficit eats muscle, not fat.`);

  // ── Adherence ─────────────────────────────────────────────────────────────
  const last7Pass = last7.filter(d => d.status === 'Pass').length;
  const totalPass = days.filter(d => d.status === 'Pass').length;
  const overallRate = Math.round((totalPass / days.length) * 100);
  const adherenceInsights: string[] = [];
  adherenceInsights.push(`${last7Pass}/7 pass days this week. Overall block rate: ${overallRate}%. ${overallRate >= 90 ? 'Elite consistency — the compound effect is building fast.' : overallRate >= 85 ? 'Solid system execution. Keep stacking clean days.' : 'Below 85% — identify the recurring pattern and eliminate it.'}`);
  adherenceInsights.push('A single slip does not erase a week of green days. What matters is the trend, not a single data point.');

  return {
    weight: weightInsights,
    waist: waistInsights,
    calories: caloriesInsights,
    sleep: sleepInsights,
    protein: proteinInsights,
    adherence: adherenceInsights,
  };
}
