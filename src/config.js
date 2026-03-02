// JS constants for Node scripts (e.g., scripts/sync_logs.js) so CI can run under Node 20
// without TypeScript loaders.
export const MISSION_STATEMENT =
  "Reach 155 lbs by May without sacrificing muscle, metabolic health, or training output. " +
  "Every logged meal, every sleep entry, every disciplined day is a move in this campaign. " +
  "The data does not lie — and neither does the mirror.";
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

export const CONSISTENCY_MILESTONES = [3, 7, 14, 21, 30];

export const CONSISTENCY_LADDER_TIERS = {
  '0':  'Rookie Discipline',
  '3':  'Structured Operator',
  '7':  'Consistency Fighter',
  '14': 'Elite Executor',
  '21': 'Unbreakable System',
};

export const MYSTERY_INTEL_POOL = [
  { title: 'Sleep Debt Compounds', body: 'Two nights under 6 hours doubles ghrelin output. Cravings tomorrow will be louder than willpower. Protect the sleep window tonight.' },
  { title: 'The 90% Rule', body: '90% adherence over a 6-week cut is elite — 10% flex is physiologically and psychologically necessary. Perfection is a fragile system. Consistency is a durable one.' },
  { title: 'Protein Timing', body: 'Spreading 190g across 4 meals (≈47g each) maximizes MPS compared to front- or back-loading. Your last meal before bed matters.' },
  { title: 'Scale Noise is Normal', body: 'A single day +2 lbs on the scale is water, glycogen, and digestion — not fat. The 7-day average is the real signal. The trend line does not lie.' },
  { title: 'Cortisol & the Scale', body: 'High-stress weeks cause cortisol-driven water retention. You may be losing fat while the scale moves up. Watch waist measurements, not just weight.' },
  { title: 'Training & Water Retention', body: 'Heavy legs or back sessions cause micro-tears that retain 1–3 lbs of water for 48–72 hours. Post-training weigh-ins are unreliable. Weigh in the morning after rest days.' },
  { title: 'Metabolic Runway', body: 'Dropping below 1,400 kcal for more than 4 consecutive days signals the body to downregulate. Stay inside the tier targets — the deficit is already baked in.' },
  { title: 'The Compound Effect', body: 'Forty disciplined days create a 5–6 lb trend. Sixty create a visible physique change. The math does not require heroics — it requires showing up 90% of the time.' },
];

export const WEEKLY_SCHEDULE = {
  0: { nutritionLabel: 'Fast',        isFast: true,  calorieRange: null,         proteinMin: null, proteinMax: null, muayThaiTime: null,      strengthFocus: 'Grip / Abs / Calves' },
  1: { nutritionLabel: 'Linear',      isFast: false, calorieRange: [1550, 1650], proteinMin: 190,  proteinMax: null, muayThaiTime: null,      strengthFocus: 'Chest + Triceps' },
  2: { nutritionLabel: 'Linear',      isFast: false, calorieRange: [1550, 1650], proteinMin: 190,  proteinMax: null, muayThaiTime: '7–9 PM',  strengthFocus: 'Back + Biceps' },
  3: { nutritionLabel: 'PSMF',        isFast: false, calorieRange: [1100, 1200], proteinMin: 180,  proteinMax: 200,  muayThaiTime: null,      strengthFocus: 'Grip / Abs / Calves' },
  4: { nutritionLabel: 'Linear',      isFast: false, calorieRange: [1550, 1650], proteinMin: 190,  proteinMax: null, muayThaiTime: '7–9 PM',  strengthFocus: 'Neck + Hips' },
  5: { nutritionLabel: 'Maintenance', isFast: false, calorieRange: [2300, 2500], proteinMin: 180,  proteinMax: null, muayThaiTime: null,      strengthFocus: 'Legs or Shoulders' },
  6: { nutritionLabel: 'Maintenance', isFast: false, calorieRange: [2300, 2500], proteinMin: 180,  proteinMax: null, muayThaiTime: '11 AM',   strengthFocus: 'Legs or Shoulders' },
};

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
