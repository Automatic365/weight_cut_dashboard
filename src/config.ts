import type { Attributes } from './types';

// ─── Narrative Anchor ────────────────────────────────────────────────────────
export const MISSION_STATEMENT =
  "Reach 155 lbs by May without sacrificing muscle, metabolic health, or training output. " +
  "Every logged meal, every sleep entry, every disciplined day is a move in this campaign. " +
  "The data does not lie — and neither does the mirror.";

// ─── Block Configuration ───────────────────────────────────────────────────
export const GOAL_WEIGHT = 155;              // lbs
export const DATA_YEAR = 2026;
export const TARGET_RATE_PER_WEEK = 1.0;    // lbs/week (protocol target)
export const SAFE_BURN_FLOOR = 0.05;        // lbs/week (minimum simulated rate, prevents ÷0)

// ─── Shield System ──────────────────────────────────────────────────────────
export const MAX_SHIELD = 14;               // maximum shield charges
export const SHIELD_OVEREAT_THRESHOLD = 2300; // kcal — calories above this deal shield damage
export const SHIELD_DAMAGE_DENOMINATOR = 250; // kcal per 1 point of shield damage

// ─── Caloric Targets ────────────────────────────────────────────────────────
export const LINEAR_TARGET_CALORIES = 1600;
export const TIER2_TARGET_CALORIES = 2400;
export const PROTEIN_FLOOR = 190;           // grams — minimum for Strength XP reward

// ─── Sleep Thresholds ────────────────────────────────────────────────────────
// NOTE: These are two intentionally distinct thresholds serving different purposes.
export const SLEEP_GOAL = 7;                   // hours — XP reward if sleep exceeds this
export const SLEEP_POOR_PENALTY_THRESHOLD = 6.0; // hours — XP penalty if sleep falls below (used in sync_logs)
export const SLEEP_FRICTION_DISPLAY = 6.5;     // hours — chart reference line for craving correlation

// ─── Adherence Thresholds ───────────────────────────────────────────────────
export const ADHERENCE_HIGH = 90;           // % — Discipline XP reward cutoff
export const ADHERENCE_LOW = 85;            // % — Discipline XP penalty cutoff; also heatmap color cutoff

// ─── XP Values ──────────────────────────────────────────────────────────────
// Positive values are gains; negative values are penalties.
// ─── Consistency Engine ───────────────────────────────────────────────────────
export const CONSISTENCY_MILESTONES = [3, 7, 14, 21, 30] as const;

export const CONSISTENCY_LADDER_TIERS: Record<string, string> = {
  '0':  'Rookie Discipline',
  '3':  'Structured Operator',
  '7':  'Consistency Fighter',
  '14': 'Elite Executor',
  '21': 'Unbreakable System',
};

export const MYSTERY_INTEL_POOL: Array<{ title: string; body: string }> = [
  {
    title: 'Sleep Debt Compounds',
    body: 'Two nights under 6 hours doubles ghrelin output. Cravings tomorrow will be louder than willpower. Protect the sleep window tonight.',
  },
  {
    title: 'The 90% Rule',
    body: '90% adherence over a 6-week cut is elite — 10% flex is physiologically and psychologically necessary. Perfection is a fragile system. Consistency is a durable one.',
  },
  {
    title: 'Protein Timing',
    body: 'Spreading 190g across 4 meals (≈47g each) maximizes MPS compared to front- or back-loading. Your last meal before bed matters.',
  },
  {
    title: 'Scale Noise is Normal',
    body: 'A single day +2 lbs on the scale is water, glycogen, and digestion — not fat. The 7-day average is the real signal. The trend line does not lie.',
  },
  {
    title: 'Cortisol & the Scale',
    body: 'High-stress weeks cause cortisol-driven water retention. You may be losing fat while the scale moves up. Watch waist measurements, not just weight.',
  },
  {
    title: 'Training & Water Retention',
    body: 'Heavy legs or back sessions cause micro-tears that retain 1–3 lbs of water for 48–72 hours. Post-training weigh-ins are unreliable. Weigh in the morning after rest days.',
  },
  {
    title: 'Metabolic Runway',
    body: 'Dropping below 1,400 kcal for more than 4 consecutive days signals the body to downregulate. Stay inside the tier targets — the deficit is already baked in.',
  },
  {
    title: 'The Compound Effect',
    body: 'Forty disciplined days create a 5–6 lb trend. Sixty create a visible physique change. The math does not require heroics — it requires showing up 90% of the time.',
  },
];

// ─── Weekly Schedule ─────────────────────────────────────────────────────────
export interface DaySchedule {
  nutritionLabel: string;
  isFast: boolean;
  calorieRange: [number, number] | null;
  proteinMin: number | null;
  proteinMax: number | null;
  muayThaiTime: string | null;
  strengthFocus: string;
}

export const WEEKLY_SCHEDULE: Record<number, DaySchedule> = {
  0: { nutritionLabel: 'Fast',        isFast: true,  calorieRange: null,         proteinMin: null, proteinMax: null, muayThaiTime: null,      strengthFocus: 'Grip / Abs / Calves' },
  1: { nutritionLabel: 'Linear',      isFast: false, calorieRange: [1550, 1650], proteinMin: 190,  proteinMax: null, muayThaiTime: null,      strengthFocus: 'Chest + Triceps' },
  2: { nutritionLabel: 'Linear',      isFast: false, calorieRange: [1550, 1650], proteinMin: 190,  proteinMax: null, muayThaiTime: '7–9 PM',  strengthFocus: 'Back + Biceps' },
  3: { nutritionLabel: 'PSMF',        isFast: false, calorieRange: [1100, 1200], proteinMin: 180,  proteinMax: 200,  muayThaiTime: null,      strengthFocus: 'Grip / Abs / Calves' },
  4: { nutritionLabel: 'Linear',      isFast: false, calorieRange: [1550, 1650], proteinMin: 190,  proteinMax: null, muayThaiTime: '7–9 PM',  strengthFocus: 'Neck + Hips' },
  5: { nutritionLabel: 'Maintenance', isFast: false, calorieRange: [2300, 2500], proteinMin: 180,  proteinMax: null, muayThaiTime: null,      strengthFocus: 'Legs or Shoulders' },
  6: { nutritionLabel: 'Maintenance', isFast: false, calorieRange: [2300, 2500], proteinMin: 180,  proteinMax: null, muayThaiTime: '11 AM',   strengthFocus: 'Legs or Shoulders' },
};

// ─── XP Values ──────────────────────────────────────────────────────────────
export const XP = {
  VITALITY_SLEEP: 10,           // sleep > SLEEP_GOAL
  VITALITY_POOR_SLEEP: -5,      // sleep < SLEEP_POOR_PENALTY_THRESHOLD

  DISCIPLINE_HIGH: 10,          // adherence >= ADHERENCE_HIGH
  DISCIPLINE_LOW: -10,          // adherence < ADHERENCE_LOW
  DISCIPLINE_WORKOUT: 5,        // workout day logged

  STRENGTH_PROTEIN: 10,         // protein >= PROTEIN_FLOOR
  STRENGTH_WORKOUT: 5,          // workout day logged

  RESILIENCE_BOSS_WIN: 50,      // boss fight survived (Pass)
  RESILIENCE_BOSS_LOSS: -20,    // boss fight failed (Fail)
} as const;

// ─── Attribute Visual Theme ──────────────────────────────────────────────────
export const ATTRIBUTE_THEME: Record<keyof Attributes, {
  hex: string;
  iconClass: string;
  barClass: string;
}> = {
  strength: {
    hex: '#ef4444',
    iconClass: 'text-red-400',
    barClass: 'bg-red-500',
  },
  vitality: {
    hex: '#22c55e',
    iconClass: 'text-emerald-400',
    barClass: 'bg-emerald-500',
  },
  discipline: {
    hex: '#5ca6ff',
    iconClass: 'text-ui-primary',
    barClass: 'bg-ui-primary',
  },
  resilience: {
    hex: '#f0a93e',
    iconClass: 'text-amber-400',
    barClass: 'bg-amber-500',
  },
};
