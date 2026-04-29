import { describe, expect, it } from 'vitest';
import { computeDataIntegrityReport } from './dataIntegrity';
import type { ChartDayEntry } from '../types';

function makeDay(overrides: Partial<ChartDayEntry> = {}): ChartDayEntry {
  return {
    date: '04/09',
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
    parseVerification: {
      appParseBlockCount: 1,
      selectedAppParseBlockIndex: 1,
      hasCorrectedAppParseBlock: false,
      hasConflictingAppParseBlocks: false,
      proteinSource: 'app_block',
      isFastDay: false,
      hasOverrides: false,
      overrideFields: [],
    },
    ...overrides,
  };
}

describe('computeDataIntegrityReport', () => {
  it('counts verifier badges from parse metadata', () => {
    const report = computeDataIntegrityReport([
      makeDay({ parseVerification: { ...makeDay().parseVerification!, hasConflictingAppParseBlocks: true } }),
      makeDay({ parseVerification: { ...makeDay().parseVerification!, hasOverrides: true, overrideFields: ['protein'] } }),
      makeDay({ protein: null }),
    ]);

    const map = Object.fromEntries(report.badges.map((b) => [b.id, b.count]));
    expect(map.parse_conflicts).toBe(1);
    expect(map.override_days).toBe(1);
    expect(map.unknown_protein_days).toBe(1);
  });

  it('does not count null protein on fast days as unknown', () => {
    const report = computeDataIntegrityReport([
      makeDay({ date: '04/12', tier: 'Tier 3', isFast: true, protein: null }),
    ]);

    const unknown = report.badges.find((b) => b.id === 'unknown_protein_days');
    expect(unknown?.count).toBe(0);
  });

  it('flags zero protein on non-fast days separately from unknown protein', () => {
    const report = computeDataIntegrityReport([
      makeDay({ protein: 0, calories: 1700, isFast: false }),
      makeDay({ protein: 0, calories: 0, isFast: true }),
    ]);

    const zeroNonFast = report.badges.find((b) => b.id === 'zero_protein_nonfast_days');
    expect(zeroNonFast?.count).toBe(1);
    expect(report.warnings.some((w) => w.id === 'zero_protein_nonfast')).toBe(true);
  });
});
