// JS constants for Node scripts (e.g., scripts/sync_logs.js) so CI can run under Node 20
// without TypeScript loaders.
export const GOAL_WEIGHT = 155;
export const DATA_YEAR = 2026;
export const TARGET_RATE_PER_WEEK = 1.0;
export const SAFE_BURN_FLOOR = 0.05;

export const MAX_SHIELD = 14;
export const SHIELD_OVEREAT_THRESHOLD = 2300;
export const SHIELD_DAMAGE_DENOMINATOR = 250;

export const LINEAR_TARGET_CALORIES = 1600;
export const TIER2_TARGET_CALORIES = 2400;
export const PROTEIN_FLOOR = 190;

export const SLEEP_GOAL = 7;
export const SLEEP_POOR_PENALTY_THRESHOLD = 6.0;
export const SLEEP_FRICTION_DISPLAY = 6.5;

export const ADHERENCE_HIGH = 90;
export const ADHERENCE_LOW = 85;

export const XP = {
  VITALITY_SLEEP: 10,
  VITALITY_POOR_SLEEP: -5,
  DISCIPLINE_HIGH: 10,
  DISCIPLINE_LOW: -10,
  DISCIPLINE_WORKOUT: 5,
  STRENGTH_PROTEIN: 10,
  STRENGTH_WORKOUT: 5,
  RESILIENCE_BOSS_WIN: 50,
  RESILIENCE_BOSS_LOSS: -20,
};
