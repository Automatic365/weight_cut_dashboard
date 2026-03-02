export interface AttributeLevel {
  level: number;
  currentLvlXp: number;
  nextLvlXp: number;
}

export interface Attributes {
  vitality: AttributeLevel;
  discipline: AttributeLevel;
  strength: AttributeLevel;
  resilience: AttributeLevel;
}

export type Tier = 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Linear';
export type Status = 'Pass' | 'Fail';

export interface DayEntry {
  date: string;
  weight: number | null;
  waistNavel: number | null;
  waistPlus2: number | null;
  waistMinus2: number | null;
  tier: Tier;
  status: Status;
  calories: number;
  protein: number;
  sleep: number | null;
  notes: string;
  isBossFight: boolean;
  bossName: string | null;
  shield: number;
  streak: number;
  adherenceScore: number | null;
  attributes: Attributes;
}

// After compute7DayAvg adds the rolling average field
export interface ChartDayEntry extends DayEntry {
  weightAvg: number | null;
}

export interface ProjectionStats {
  historicalRate: string;
  simulatedRate: string;
  targetRate: string;
  lbsRemaining: string;
  dateSimulated: string;
  dateTarget: string;
}

export interface RadarDataPoint {
  subject: string;
  level: number;
  fullMark: number;
}

// ─── Consistency Engine Types ─────────────────────────────────────────────────

export interface ConsistencyMilestone {
  threshold: number;
  label: string;
  achieved: boolean;
  achievedOn: string | null; // "MM/DD" date string from data.json
}

export interface ConsistencyMission {
  id: 'adherence' | 'protein' | 'sleep';
  title: string;
  targetText: string;
  actualText: string;
  completed: boolean;
  pending: boolean; // true = forward-looking target not yet confirmable today
}

export interface ConsistencyFocusOption {
  id: 'recovery_lock' | 'protein_anchor' | 'containment';
  title: string;
  why: string;
  recommended: boolean;
}

export interface ConsistencyGameState {
  currentStreak: number;
  maxStreak: number;
  passRate: number;
  ladderTierLabel: string;
  nextMilestone: number | null;
  daysToNextMilestone: number | null;
  milestones: ConsistencyMilestone[];
  missions: ConsistencyMission[];
  focusOptions: ConsistencyFocusOption[];
  weekPasses: number;
  weekRemainingSlots: number;
  mysteryIntelTitle: string;
  mysteryIntelBody: string;
  mysterySeed: string;
}
