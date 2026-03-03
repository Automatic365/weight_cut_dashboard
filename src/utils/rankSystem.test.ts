import { describe, it, expect } from 'vitest';
import { computeRankXP, deriveRankState } from './rankSystem';
import type { ChartDayEntry } from '../types';

// ── Minimal stub factory ────────────────────────────────────────────────────

function makeDay(overrides: Partial<ChartDayEntry> = {}): ChartDayEntry {
  return {
    date: '1/1',
    weight: 170,
    waistNavel: null,
    waistPlus2: null,
    waistMinus2: null,
    tier: 'Linear',
    status: 'Fail',
    calories: 1600,
    protein: 190,
    sleep: 7,
    notes: '',
    isBossFight: false,
    bossName: null,
    shield: 10,
    streak: 0,
    adherenceScore: null,
    weightAvg: null,
    attributes: {
      vitality:   { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
      discipline: { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
      strength:   { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
      resilience: { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
    },
    ...overrides,
  };
}

// ── computeRankXP ───────────────────────────────────────────────────────────

describe('computeRankXP', () => {
  it('returns 0 for empty day list', () => {
    expect(computeRankXP([])).toBe(0);
  });

  it('adds +1 per Pass day', () => {
    const days = [
      makeDay({ status: 'Pass', streak: 1 }),
      makeDay({ status: 'Pass', streak: 2 }),
      makeDay({ status: 'Fail', streak: 0 }),
    ];
    // 2 pass days × 1 = 2; no milestones, no boss, no level-ups
    expect(computeRankXP(days)).toBe(2);
  });

  it('does NOT count Fail days', () => {
    const days = [
      makeDay({ status: 'Fail', streak: 0 }),
      makeDay({ status: 'Fail', streak: 0 }),
    ];
    expect(computeRankXP(days)).toBe(0);
  });

  it('adds +3 bonus for Boss Fight win (stacks with pass day +1)', () => {
    const days = [
      makeDay({ status: 'Pass', isBossFight: true, streak: 1 }),
    ];
    // +1 (pass) + +3 (boss win) = 4
    expect(computeRankXP(days)).toBe(4);
  });

  it('does NOT add boss bonus for a Boss Fail', () => {
    const days = [
      makeDay({ status: 'Fail', isBossFight: true, streak: 0 }),
    ];
    expect(computeRankXP(days)).toBe(0);
  });

  it('adds +2 per streak milestone, first time only', () => {
    // Build 3 consecutive pass days to hit the streak=3 milestone
    const days = [
      makeDay({ status: 'Pass', streak: 1 }),
      makeDay({ status: 'Pass', streak: 2 }),
      makeDay({ status: 'Pass', streak: 3 }), // milestone hit!
    ];
    // 3 pass × 1 = 3, plus 1 milestone × 2 = 2 → total 5
    expect(computeRankXP(days)).toBe(5);
  });

  it('does not double-count a streak milestone', () => {
    // Days 3 and 4 both have streak ≥ 3
    const days = [
      makeDay({ status: 'Pass', streak: 3 }), // milestone triggers here
      makeDay({ status: 'Pass', streak: 4 }), // already counted
    ];
    // 2 pass × 1 = 2, plus 1 milestone × 2 = 2 → total 4
    expect(computeRankXP(days)).toBe(4);
  });

  it('detects attribute level-ups between consecutive days', () => {
    const base = makeDay({ status: 'Pass', streak: 1 });
    const leveled = makeDay({
      status: 'Pass',
      streak: 2,
      attributes: {
        vitality:   { level: 2, currentLvlXp: 0, nextLvlXp: 200 }, // level up!
        discipline: { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
        strength:   { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
        resilience: { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
      },
    });
    // 2 pass × 1 = 2, plus 1 level-up × 1 = 1 → total 3
    expect(computeRankXP([base, leveled])).toBe(3);
  });
});

// ── deriveRankState ─────────────────────────────────────────────────────────

describe('deriveRankState', () => {
  it('returns Trainee for 0 RXP', () => {
    const state = deriveRankState([]);
    expect(state.currentRank).toBe('Trainee');
    expect(state.totalRankXP).toBe(0);
    expect(state.nextRank).toBe('Operator');
    expect(state.xpToNextRank).toBe(15);
  });

  it('returns Trainee at 14 RXP (threshold boundary)', () => {
    // 14 pass days, all streak=1 so no streak milestones trigger → 14 × 1 = 14 RXP
    const days = Array.from({ length: 14 }, () =>
      makeDay({ status: 'Pass', streak: 1 })
    );
    const state = deriveRankState(days);
    expect(state.currentRank).toBe('Trainee');
    expect(state.totalRankXP).toBe(14);
  });

  it('promotes to Operator at exactly 15 RXP', () => {
    // 15 pass days, all streak=1 (no milestones) → 15 × 1 = 15 RXP
    const days = Array.from({ length: 15 }, () =>
      makeDay({ status: 'Pass', streak: 1 })
    );
    const state = deriveRankState(days);
    expect(state.currentRank).toBe('Operator');
    expect(state.totalRankXP).toBe(15);
    expect(state.nextRank).toBe('Specialist');
    expect(state.xpToNextRank).toBe(25); // 40 - 15
  });

  it('rankProgress is 0 at the floor of a tier', () => {
    // Exactly at Operator floor: 15 pass days, no milestones → 15 RXP
    const days = Array.from({ length: 15 }, () =>
      makeDay({ status: 'Pass', streak: 1 })
    );
    const state = deriveRankState(days);
    expect(state.rankProgress).toBeCloseTo(0);
  });

  it('rankProgress is 1 when at Ghost (final rank)', () => {
    // Ghost starts at 250 — create enough RXP
    const days = Array.from({ length: 250 }, (_, i) =>
      makeDay({ status: 'Pass', streak: i + 1 })
    );
    const state = deriveRankState(days);
    expect(state.currentRank).toBe('Ghost');
    expect(state.rankProgress).toBe(1);
    expect(state.nextRank).toBeNull();
    expect(state.xpToNextRank).toBeNull();
  });
});
