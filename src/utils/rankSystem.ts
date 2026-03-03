import { CONSISTENCY_MILESTONES } from '../config';
import type { ChartDayEntry, RankState } from '../types';

// ── Rank XP point values ──────────────────────────────────────────────────────
export const RANK_XP_VALUES = {
  PASS_DAY:           1,
  BOSS_WIN:           3,
  STREAK_MILESTONE:   2,
  ATTRIBUTE_LEVEL_UP: 1,
} as const;

// ── Rank ladder thresholds ────────────────────────────────────────────────────
export const RANK_LADDER = [
  { minXP: 0,   rank: 'Trainee' },
  { minXP: 15,  rank: 'Operator' },
  { minXP: 40,  rank: 'Specialist' },
  { minXP: 80,  rank: 'Enforcer' },
  { minXP: 150, rank: 'Vanguard' },
  { minXP: 250, rank: 'Ghost' },
] as const;

/**
 * Accumulate Rank XP across all logged days.
 *
 * Sources (never decreases):
 *   +1 per Pass day
 *   +3 per Boss Fight win (stacks on top of the pass day point)
 *   +2 per streak milestone hit — first time only (3, 7, 14, 21)
 *   +1 per attribute level-up (any of 4 attributes)
 */
export function computeRankXP(days: ChartDayEntry[]): number {
  let rxp = 0;
  const milestonesHit = new Set<number>();

  for (let i = 0; i < days.length; i++) {
    const day = days[i];

    // Pass day
    if (day.status === 'Pass') rxp += RANK_XP_VALUES.PASS_DAY;

    // Boss Fight win bonus
    if (day.isBossFight && day.status === 'Pass') rxp += RANK_XP_VALUES.BOSS_WIN;

    // First-time streak milestones
    for (const m of CONSISTENCY_MILESTONES) {
      if (!milestonesHit.has(m) && (day.streak ?? 0) >= m) {
        milestonesHit.add(m);
        rxp += RANK_XP_VALUES.STREAK_MILESTONE;
      }
    }

    // Attribute level-ups (compare consecutive days)
    if (i > 0) {
      const prev = days[i - 1].attributes;
      const curr = day.attributes;
      for (const attr of ['vitality', 'discipline', 'strength', 'resilience'] as const) {
        if (curr[attr].level > prev[attr].level) rxp += RANK_XP_VALUES.ATTRIBUTE_LEVEL_UP;
      }
    }
  }

  return rxp;
}

/**
 * Derive full RankState from the day log.
 */
export function deriveRankState(days: ChartDayEntry[]): RankState {
  const totalRankXP = computeRankXP(days);

  // Find the highest rank whose minXP does not exceed totalRankXP
  let rankIndex = 0;
  for (let i = 0; i < RANK_LADDER.length; i++) {
    if (totalRankXP >= RANK_LADDER[i].minXP) rankIndex = i;
  }

  const currentEntry = RANK_LADDER[rankIndex];
  const nextEntry = RANK_LADDER[rankIndex + 1] ?? null;

  const xpIntoCurrentTier = totalRankXP - currentEntry.minXP;
  const tierWidth = nextEntry ? nextEntry.minXP - currentEntry.minXP : 1;
  const rankProgress = nextEntry ? Math.min(1, xpIntoCurrentTier / tierWidth) : 1;

  return {
    totalRankXP,
    currentRank: currentEntry.rank,
    nextRank: nextEntry?.rank ?? null,
    xpToNextRank: nextEntry ? nextEntry.minXP - totalRankXP : null,
    rankProgress,
  };
}
