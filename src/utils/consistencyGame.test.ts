import { describe, it, expect } from 'vitest';
import { deriveConsistencyGameState, hashSeed } from './consistencyGame';
import type { ChartDayEntry } from '../types';

// ─── Minimal day factory ──────────────────────────────────────────────────────

function makeDay(overrides: Partial<ChartDayEntry> = {}): ChartDayEntry {
  return {
    date: '01/19',
    weight: 168,
    waistNavel: 32,
    waistPlus2: null,
    waistMinus2: null,
    tier: 'Linear',
    status: 'Pass',
    calories: 1600,
    protein: 195,
    sleep: 7.5,
    notes: '',
    isBossFight: false,
    bossName: null,
    shield: 5,
    streak: 1,
    adherenceScore: 92,
    weightAvg: 168,
    attributes: {
      vitality:   { level: 1, currentLvlXp: 10, nextLvlXp: 100 },
      discipline: { level: 1, currentLvlXp: 10, nextLvlXp: 100 },
      strength:   { level: 1, currentLvlXp: 10, nextLvlXp: 100 },
      resilience: { level: 1, currentLvlXp: 0,  nextLvlXp: 100 },
    },
    ...overrides,
  };
}

function makeStreak(length: number): ChartDayEntry[] {
  return Array.from({ length }, (_, i) => {
    const month = 1;
    const day = 19 + i;
    return makeDay({
      date: `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
      streak: i + 1,
    });
  });
}

// ─── Known-good test dates (Jan 2026) ─────────────────────────────────────────
// Jan 19 2026 = Monday (getDay() = 1)  → Linear
// Jan 21 2026 = Wednesday (getDay() = 3) → PSMF
// Jan 23 2026 = Friday (getDay() = 5) → Maintenance
// Jan 24 2026 = Saturday (getDay() = 6) → Maintenance
// Jan 25 2026 = Sunday (getDay() = 0) → Fast

const MONDAY    = new Date(2026, 0, 19); // Linear
const WEDNESDAY = new Date(2026, 0, 21); // PSMF
const FRIDAY    = new Date(2026, 0, 23); // Maintenance
const SUNDAY    = new Date(2026, 0, 25); // Fast

// ─── hashSeed ─────────────────────────────────────────────────────────────────

describe('hashSeed', () => {
  it('returns a non-negative integer', () => {
    expect(hashSeed('01/30_7_3')).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic — same input always produces the same output', () => {
    const a = hashSeed('01/30_7_3');
    const b = hashSeed('01/30_7_3');
    expect(a).toBe(b);
  });

  it('produces different outputs for different inputs', () => {
    expect(hashSeed('01/30_7_3')).not.toBe(hashSeed('01/30_8_3'));
    expect(hashSeed('01/30_7_3')).not.toBe(hashSeed('01/31_7_3'));
  });
});

// ─── Empty array guard ────────────────────────────────────────────────────────

describe('deriveConsistencyGameState — empty input', () => {
  it('returns safe defaults without throwing', () => {
    const state = deriveConsistencyGameState([]);
    expect(state.currentStreak).toBe(0);
    expect(state.milestones).toHaveLength(5);
    expect(state.missions).toHaveLength(3);
    expect(state.focusOptions).toHaveLength(3);
  });

  it('default missions all have pending=true', () => {
    const state = deriveConsistencyGameState([]);
    expect(state.missions.every(m => m.pending)).toBe(true);
  });
});

// ─── Streak / milestone progression ──────────────────────────────────────────

describe('streak milestone progression', () => {
  it('no milestone achieved at streak 2', () => {
    const days = makeStreak(2);
    const state = deriveConsistencyGameState(days, MONDAY);
    expect(state.milestones.every(m => !m.achieved)).toBe(true);
  });

  it('first milestone achieved exactly at streak 3', () => {
    const days = makeStreak(3);
    const state = deriveConsistencyGameState(days, MONDAY);
    expect(state.milestones[0].achieved).toBe(true); // threshold 3
    expect(state.milestones[1].achieved).toBe(false); // threshold 7
  });

  it('milestones 3 and 7 achieved at streak 7', () => {
    const days = makeStreak(7);
    const state = deriveConsistencyGameState(days, MONDAY);
    expect(state.milestones[0].achieved).toBe(true);
    expect(state.milestones[1].achieved).toBe(true);
    expect(state.milestones[2].achieved).toBe(false);
  });

  it('all milestones achieved at streak 30', () => {
    const days = makeStreak(30);
    const state = deriveConsistencyGameState(days, MONDAY);
    expect(state.milestones.every(m => m.achieved)).toBe(true);
    expect(state.nextMilestone).toBeNull();
    expect(state.daysToNextMilestone).toBeNull();
  });

  it('daysToNextMilestone is correct for streak 5', () => {
    const days = makeStreak(5);
    const state = deriveConsistencyGameState(days, MONDAY);
    expect(state.nextMilestone).toBe(7);
    expect(state.daysToNextMilestone).toBe(2);
  });
});

// ─── achievedOn ──────────────────────────────────────────────────────────────

describe('achievedOn', () => {
  it('resolves to the first date where streak >= threshold', () => {
    // days 1..6: streak 1-6; day at index 2 (streak 3) should be achievedOn for milestone 3
    const days = makeStreak(6);
    const state = deriveConsistencyGameState(days, MONDAY);
    const m3 = state.milestones.find(m => m.threshold === 3)!;
    expect(m3.achieved).toBe(true);
    expect(m3.achievedOn).toBe('01/21'); // 3rd day in sequence
  });
});

// ─── Mission — adherence (today's forward-looking target) ────────────────────

describe('mission — adherence', () => {
  it('fast day (Sunday): completed=true, pending=false, N/A', () => {
    const state = deriveConsistencyGameState([makeDay()], SUNDAY);
    const m = state.missions.find(m => m.id === 'adherence')!;
    expect(m.completed).toBe(true);
    expect(m.pending).toBe(false);
  });

  it('eating day (Monday): pending=true, completed=false regardless of latest status', () => {
    const state = deriveConsistencyGameState([makeDay({ status: 'Pass' })], MONDAY);
    const m = state.missions.find(m => m.id === 'adherence')!;
    expect(m.pending).toBe(true);
    expect(m.completed).toBe(false);
  });

  it('eating day: title reflects nutrition tier', () => {
    const state = deriveConsistencyGameState([makeDay()], MONDAY);
    const m = state.missions.find(m => m.id === 'adherence')!;
    expect(m.title).toContain('Linear');
  });

  it('PSMF day: targetText shows PSMF calorie range', () => {
    const state = deriveConsistencyGameState([makeDay()], WEDNESDAY);
    const m = state.missions.find(m => m.id === 'adherence')!;
    expect(m.targetText).toContain('1100');
    expect(m.targetText).toContain('1200');
  });
});

// ─── Mission — protein (today's forward-looking target) ──────────────────────

describe('mission — protein', () => {
  it('fast day (Sunday): completed=true, pending=false', () => {
    const state = deriveConsistencyGameState([makeDay()], SUNDAY);
    const m = state.missions.find(m => m.id === 'protein')!;
    expect(m.completed).toBe(true);
    expect(m.pending).toBe(false);
  });

  it('Linear day (Monday): pending=true, completed=false, target ≥190g', () => {
    const state = deriveConsistencyGameState([makeDay()], MONDAY);
    const m = state.missions.find(m => m.id === 'protein')!;
    expect(m.pending).toBe(true);
    expect(m.completed).toBe(false);
    expect(m.targetText).toBe('≥190g');
  });

  it('PSMF day (Wednesday): targetText shows range 180–200g', () => {
    const state = deriveConsistencyGameState([makeDay()], WEDNESDAY);
    const m = state.missions.find(m => m.id === 'protein')!;
    expect(m.targetText).toContain('180');
    expect(m.targetText).toContain('200');
  });

  it('Maintenance day (Friday): target ≥180g', () => {
    const state = deriveConsistencyGameState([makeDay()], FRIDAY);
    const m = state.missions.find(m => m.id === 'protein')!;
    expect(m.targetText).toBe('≥180g');
  });
});

// ─── Mission — sleep (forward-looking tonight's target) ──────────────────────
// Sleep data in the log is always T-2 from the user's perspective (log uploaded
// in the morning represents yesterday, so sleep = night before last). All three
// missions are therefore forward-looking pending targets for today.

describe('mission — sleep', () => {
  it('always pending=true, completed=false regardless of latest sleep value', () => {
    for (const sleep of [7.5, 6.5, null]) {
      const state = deriveConsistencyGameState([makeDay({ sleep: sleep as number | null })], MONDAY);
      const m = state.missions.find(m => m.id === 'sleep')!;
      expect(m.pending).toBe(true);
      expect(m.completed).toBe(false);
    }
  });

  it('actualText is always —', () => {
    const state = deriveConsistencyGameState([makeDay({ sleep: 8.0 })], MONDAY);
    const m = state.missions.find(m => m.id === 'sleep')!;
    expect(m.actualText).toBe('—');
  });

  it('targetText shows sleep goal', () => {
    const state = deriveConsistencyGameState([makeDay()], MONDAY);
    const m = state.missions.find(m => m.id === 'sleep')!;
    expect(m.targetText).toContain('7');
  });
});

// ─── Focus recommendation priority ───────────────────────────────────────────

describe('focus recommendation priority', () => {
  it('recommends containment when adherence fails (T-1)', () => {
    // Pass MONDAY so fast-day override doesn't fire
    const state = deriveConsistencyGameState([makeDay({ status: 'Fail', protein: 180 })], MONDAY);
    const rec = state.focusOptions.find(f => f.recommended)!;
    expect(rec.id).toBe('containment');
  });

  it('recommends protein_anchor when protein misses but adherence passes (T-1)', () => {
    const state = deriveConsistencyGameState([makeDay({ status: 'Pass', protein: 150 })], MONDAY);
    const rec = state.focusOptions.find(f => f.recommended)!;
    expect(rec.id).toBe('protein_anchor');
  });

  it('recommends recovery_lock when all signals pass', () => {
    const state = deriveConsistencyGameState([makeDay({ status: 'Pass', protein: 200, sleep: 8 })], MONDAY);
    const rec = state.focusOptions.find(f => f.recommended)!;
    expect(rec.id).toBe('recovery_lock');
  });

  it('always recommends recovery_lock on fast day regardless of T-1 data', () => {
    const state = deriveConsistencyGameState([makeDay({ status: 'Fail', protein: 0 })], SUNDAY);
    const rec = state.focusOptions.find(f => f.recommended)!;
    expect(rec.id).toBe('recovery_lock');
  });

  it('always has exactly one recommended option', () => {
    const state = deriveConsistencyGameState([makeDay()], MONDAY);
    const recommended = state.focusOptions.filter(f => f.recommended);
    expect(recommended).toHaveLength(1);
  });
});

// ─── Weekly slot math ─────────────────────────────────────────────────────────

describe('weekly slot math', () => {
  it('3 logged days in same week → weekRemainingSlots = 4', () => {
    // 2026-01-19 is a Monday; 01/19, 01/20, 01/21 = 3 days in week 1
    const days = makeStreak(3);
    const state = deriveConsistencyGameState(days, MONDAY);
    expect(state.weekRemainingSlots).toBe(4);
  });

  it('7 logged days in same week → weekRemainingSlots = 0', () => {
    const days = makeStreak(7);
    const state = deriveConsistencyGameState(days, MONDAY);
    expect(state.weekRemainingSlots).toBe(0);
  });
});

// ─── Mystery intel determinism ────────────────────────────────────────────────

describe('mystery intel determinism', () => {
  it('same input days always produce the same intel title', () => {
    const days = makeStreak(5);
    const a = deriveConsistencyGameState(days, MONDAY);
    const b = deriveConsistencyGameState(days, MONDAY);
    expect(a.mysteryIntelTitle).toBe(b.mysteryIntelTitle);
  });

  it('different streak produces different seed', () => {
    const days5 = makeStreak(5);
    const days6 = makeStreak(6);
    const a = deriveConsistencyGameState(days5, MONDAY);
    const b = deriveConsistencyGameState(days6, MONDAY);
    expect(a.mysterySeed).not.toBe(b.mysterySeed);
  });

  it('mysterySeed contains the latest date string', () => {
    const days = makeStreak(3);
    const state = deriveConsistencyGameState(days, MONDAY);
    expect(state.mysterySeed).toContain(days[days.length - 1].date);
  });
});
