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

// ─── Avatar / Body Fat ──────────────────────────────────────────────────────
export const BF_GOAL_PERCENT = 10;          // estimated BF% at goal weight
export const BF_LBS_SCALE = 0.667;          // BF% increase per lb above goal weight
export const BODY_STAGE_THRESHOLDS = {
  shredded: 10,    // BF% <= this → Stage 4
  athletic: 15,    // BF% <= this → Stage 3
  leaningOut: 20,  // BF% <= this → Stage 2; above this → Stage 1
} as const;
export const ARMOR_TIER_THRESHOLDS = {
  full: 10,   // shield >= this → Tier 2 (Full Combat)
  light: 5,   // shield >= this → Tier 1 (Light Gear); below → Tier 0 (Vulnerable)
} as const;
