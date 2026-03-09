import { GOAL_WEIGHT, DATA_YEAR, SAFE_BURN_FLOOR, TARGET_RATE_PER_WEEK } from '../config';
import type { DayEntry, ChartDayEntry, ProjectionStats } from '../types';

/**
 * Detect and correct transposed waist measurements.
 * If waistPlus2 > waistNavel + 0.5", the two values were likely recorded in the wrong fields.
 */
export function applyWaistSwapFix(rawData: DayEntry[], fixSwaps: boolean): DayEntry[] {
  return rawData.map(day => {
    let navel = day.waistNavel;
    let plus2 = day.waistPlus2;

    if (fixSwaps && navel && plus2 && plus2 > navel + 0.5) {
      navel = day.waistPlus2;
      plus2 = day.waistNavel;
    }
    return { ...day, waistNavel: navel, waistPlus2: plus2 };
  });
}

/**
 * Add a trailing 7-day rolling average weight field to each entry.
 * Null weight entries are excluded from the window sum and count.
 */
export function compute7DayAvg(cleanedData: DayEntry[]): ChartDayEntry[] {
  return cleanedData.map((row, index, arr) => {
    let sum = 0, count = 0;
    for (let i = Math.max(0, index - 6); i <= index; i++) {
      if (arr[i].weight) { sum += arr[i].weight!; count++; }
    }
    return {
      ...row,
      weightAvg: count > 0 ? Number((sum / count).toFixed(1)) : null
    };
  });
}

/**
 * Calculate goal projection statistics, optionally adjusted by user simulations.
 *
 * One-off simulation: 3,500 kcal = 1 lb of fat.
 * Daily simulation: 500 kcal/day deficit = 1 lb/week loss rate change.
 */
export function computeProjectionStats(
  rawData: DayEntry[],
  simulatedOneOff: number,
  simulatedDaily: number
): ProjectionStats {
  const validWeights = rawData.map(d => d.weight).filter((w): w is number => w !== null && w !== undefined);
  const startWeight = validWeights[0] || 0;
  // Use 7-day rolling average as effective current weight — daily weigh-ins are too noisy
  // (sodium spikes after restaurant meals, hydration shifts, etc. can skew the endpoint by 2+ lbs)
  const last7Weights = validWeights.slice(-7);
  const currentWeight = last7Weights.reduce((s, w) => s + w, 0) / last7Weights.length;
  let lbsRemaining = currentWeight - GOAL_WEIGHT;

  // 1. One-Off Event: 3,500 kcal = 1lb
  const oneOffLbsEffect = simulatedOneOff / 3500;
  lbsRemaining += oneOffLbsEffect;

  // Safety check if user simulates eating their way past the goal entirely
  if (lbsRemaining < 0) lbsRemaining = 0;

  const parseDate = (dateStr: string): Date => {
    const [month, day] = dateStr.split('/');
    return new Date(DATA_YEAR, parseInt(month) - 1, parseInt(day));
  };

  const startDate = parseDate(rawData[0].date);
  const endDate = parseDate(rawData[rawData.length - 1].date);
  const daysElapsed = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  const lbsLost = startWeight - currentWeight;
  const historicalRatePerWeek = (lbsLost / daysElapsed) * 7;

  // 2. Daily Habit Event: 500 kcal daily deficit = 1lb per week
  const dailyLbsEffectPerWeek = simulatedDaily / 500;
  let simulatedRatePerWeek = historicalRatePerWeek - dailyLbsEffectPerWeek;
  // Prevent ÷0 or negative when user simulates a large surplus
  if (simulatedRatePerWeek <= SAFE_BURN_FLOOR) simulatedRatePerWeek = SAFE_BURN_FLOOR;

  const targetRatePerWeek = TARGET_RATE_PER_WEEK;

  const daysRemainingSimulated = (lbsRemaining / simulatedRatePerWeek) * 7;
  const daysRemainingTarget = (lbsRemaining / targetRatePerWeek) * 7;

  const projectedDateSimulated = new Date(endDate);
  projectedDateSimulated.setDate(projectedDateSimulated.getDate() + daysRemainingSimulated);

  const projectedDateTarget = new Date(endDate);
  projectedDateTarget.setDate(projectedDateTarget.getDate() + daysRemainingTarget);

  // Waist (navel) trend projection
  let navelCurrentRate: string | null = null;
  let navelAtGoalDate: string | null = null;

  const navelReadings = rawData
    .map((d, i) => ({ date: parseDate(d.date), val: d.waistNavel, i }))
    .filter((r): r is { date: Date; val: number; i: number } => r.val != null);

  if (navelReadings.length >= 2) {
    const firstNavel = navelReadings[0];
    const lastNavel = navelReadings[navelReadings.length - 1];
    const navelDays = (lastNavel.date.getTime() - firstNavel.date.getTime()) / (1000 * 60 * 60 * 24);
    if (navelDays > 0) {
      const navelRatePerWeek = ((lastNavel.val - firstNavel.val) / navelDays) * 7;
      navelCurrentRate = navelRatePerWeek.toFixed(3);
      // Project from current last navel value to the simulated goal date
      const daysToGoalSimulated = daysRemainingSimulated;
      const projectedNavel = lastNavel.val + (navelRatePerWeek / 7) * daysToGoalSimulated;
      navelAtGoalDate = projectedNavel.toFixed(2);
    }
  }

  return {
    historicalRate: historicalRatePerWeek.toFixed(2),
    simulatedRate: simulatedRatePerWeek.toFixed(2),
    targetRate: targetRatePerWeek.toFixed(2),
    lbsRemaining: lbsRemaining.toFixed(1),
    dateSimulated: projectedDateSimulated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    dateTarget: projectedDateTarget.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    navelCurrentRate,
    navelAtGoalDate,
  };
}
