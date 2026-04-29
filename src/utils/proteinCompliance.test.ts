import { describe, expect, it } from 'vitest';
import { computeProteinComplianceStats } from './proteinCompliance';
import type { ChartDayEntry } from '../types';

function makeDay(overrides: Partial<ChartDayEntry> = {}): ChartDayEntry {
  return {
    date: '04/10',
    weight: 160,
    waistNavel: null,
    waistPlus2: null,
    waistMinus2: null,
    tier: 'Linear',
    isFast: false,
    status: 'Pass',
    calories: 1700,
    protein: 190,
    sleep: 7,
    notes: '',
    isBossFight: false,
    bossName: null,
    upcomingBossName: null,
    shield: 0,
    streak: 0,
    adherenceScore: 90,
    attributes: {
      vitality: { level: 1, currentLvlXp: 0, nextLvlXp: 100, totalXp: 0 },
      discipline: { level: 1, currentLvlXp: 0, nextLvlXp: 100, totalXp: 0 },
      strength: { level: 1, currentLvlXp: 0, nextLvlXp: 100, totalXp: 0 },
      resilience: { level: 1, currentLvlXp: 0, nextLvlXp: 100, totalXp: 0 },
    },
    weightAvg: 160,
    ...overrides,
  };
}

describe('computeProteinComplianceStats', () => {
  it('excludes null protein days from denominator', () => {
    const stats = computeProteinComplianceStats(
      [
        makeDay({ protein: 200 }),
        makeDay({ protein: 180 }),
        makeDay({ protein: null }),
      ],
      190
    );

    expect(stats.trackedDays).toBe(2);
    expect(stats.complianceRate).toBe(50);
  });

  it('excludes zero-protein fasting days from denominator', () => {
    const stats = computeProteinComplianceStats(
      [
        makeDay({ protein: 200 }),
        makeDay({ tier: 'Tier 3', protein: 0 }),
      ],
      190
    );

    expect(stats.trackedDays).toBe(1);
    expect(stats.complianceRate).toBe(100);
  });
});
