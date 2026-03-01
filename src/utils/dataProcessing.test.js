import { describe, it, expect } from 'vitest';
import { applyWaistSwapFix, compute7DayAvg, computeProjectionStats } from './dataProcessing';
import rawData from '../data.json';

// ─── applyWaistSwapFix ────────────────────────────────────────────────────────

describe('applyWaistSwapFix', () => {
  const swappedDay = { waistNavel: 31.5, waistPlus2: 32.1 }; // plus2 > navel + 0.5 → swapped
  const correctDay = { waistNavel: 32.1, waistPlus2: 31.5 }; // correct order, no swap needed
  const nullDay   = { waistNavel: null, waistPlus2: null };

  it('returns data unchanged when fixSwaps is false, even if swap condition is true', () => {
    const result = applyWaistSwapFix([swappedDay], false);
    expect(result[0].waistNavel).toBe(31.5);
    expect(result[0].waistPlus2).toBe(32.1);
  });

  it('swaps values when fixSwaps is true and plus2 > navel + 0.5', () => {
    const result = applyWaistSwapFix([swappedDay], true);
    expect(result[0].waistNavel).toBe(32.1);
    expect(result[0].waistPlus2).toBe(31.5);
  });

  it('leaves values unchanged when fixSwaps is true but order is already correct', () => {
    const result = applyWaistSwapFix([correctDay], true);
    expect(result[0].waistNavel).toBe(32.1);
    expect(result[0].waistPlus2).toBe(31.5);
  });

  it('passes through null values without throwing', () => {
    const result = applyWaistSwapFix([nullDay], true);
    expect(result[0].waistNavel).toBeNull();
    expect(result[0].waistPlus2).toBeNull();
  });

  it('does not mutate the original data array', () => {
    const data = [{ ...swappedDay }];
    applyWaistSwapFix(data, true);
    expect(data[0].waistNavel).toBe(31.5); // original unchanged
  });
});

// ─── compute7DayAvg ──────────────────────────────────────────────────────────

describe('compute7DayAvg', () => {
  it('uses only the first entry when it is the first element (window size 1)', () => {
    const data = [{ weight: 160 }, { weight: 159 }];
    const result = compute7DayAvg(data);
    expect(result[0].weightAvg).toBe(160);
  });

  it('averages all 7 entries at index 6', () => {
    const data = Array.from({ length: 7 }, (_, i) => ({ weight: 161 - i }));
    // weights: 161, 160, 159, 158, 157, 156, 155 → avg = 158
    const result = compute7DayAvg(data);
    expect(result[6].weightAvg).toBe(158);
  });

  it('excludes null weight entries from the window', () => {
    const data = [
      { weight: 160 },
      { weight: null },
      { weight: 158 },
    ];
    const result = compute7DayAvg(data);
    // index 2 window: [160, null, 158] → sum=318, count=2 → avg=159
    expect(result[2].weightAvg).toBe(159);
  });

  it('returns null for weightAvg when all entries in the window are null', () => {
    const data = [{ weight: null }, { weight: null }];
    const result = compute7DayAvg(data);
    expect(result[0].weightAvg).toBeNull();
    expect(result[1].weightAvg).toBeNull();
  });

  it('does not mutate the original data array', () => {
    const data = [{ weight: 160 }];
    compute7DayAvg(data);
    expect(data[0].weightAvg).toBeUndefined();
  });
});

// ─── computeProjectionStats ──────────────────────────────────────────────────

describe('computeProjectionStats', () => {
  it('simulatedRate equals historicalRate when both simulations are zero', () => {
    const stats = computeProjectionStats(rawData, 0, 0);
    expect(stats.simulatedRate).toBe(stats.historicalRate);
  });

  it('increases lbsRemaining by exactly 1 lb when simulatedOneOff is +3500 kcal', () => {
    const baseline = computeProjectionStats(rawData, 0, 0);
    const simulated = computeProjectionStats(rawData, 3500, 0);
    const diff = parseFloat(simulated.lbsRemaining) - parseFloat(baseline.lbsRemaining);
    expect(diff).toBeCloseTo(1, 1);
  });

  it('simulatedRatePerWeek never falls below SAFE_BURN_FLOOR regardless of simulatedDaily', () => {
    // +100,000 kcal/day would collapse the rate to zero without the floor guard
    const stats = computeProjectionStats(rawData, 0, 100000);
    expect(parseFloat(stats.simulatedRate)).toBeGreaterThan(0);
  });

  it('lbsRemaining is clamped to 0 when one-off simulation overshoots the goal', () => {
    // Simulate a -700,000 kcal one-off (200 lbs of fat burned) to guarantee overshoot
    const stats = computeProjectionStats(rawData, -700000, 0);
    expect(parseFloat(stats.lbsRemaining)).toBe(0);
  });

  it('returns expected shape with all required keys', () => {
    const stats = computeProjectionStats(rawData, 0, 0);
    expect(stats).toHaveProperty('historicalRate');
    expect(stats).toHaveProperty('simulatedRate');
    expect(stats).toHaveProperty('targetRate');
    expect(stats).toHaveProperty('lbsRemaining');
    expect(stats).toHaveProperty('dateSimulated');
    expect(stats).toHaveProperty('dateTarget');
  });

  it('regression: matches snapshot against real data.json', () => {
    const stats = computeProjectionStats(rawData, 0, 0);
    expect(stats).toMatchSnapshot();
  });
});
