import {
  DATA_YEAR,
  CONSISTENCY_MILESTONES,
  CONSISTENCY_LADDER_TIERS,
  MYSTERY_INTEL_POOL,
  PROTEIN_FLOOR,
  SLEEP_GOAL,
  ADHERENCE_HIGH,
} from '../config';
import type { ChartDayEntry, ConsistencyGameState } from '../types';

function parseEntryDate(dateStr: string): Date {
  const [month, day] = dateStr.split('/');
  return new Date(DATA_YEAR, parseInt(month) - 1, parseInt(day));
}

/**
 * djb2 string hash. Exported so tests can verify determinism.
 */
export function hashSeed(seed: string): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
    hash = hash | 0; // keep 32-bit signed
  }
  return Math.abs(hash);
}

function buildSafeDefaults(): ConsistencyGameState {
  return {
    currentStreak: 0,
    maxStreak: 0,
    passRate: 0,
    ladderTierLabel: CONSISTENCY_LADDER_TIERS['0'] ?? 'Rookie Discipline',
    nextMilestone: CONSISTENCY_MILESTONES[0],
    daysToNextMilestone: CONSISTENCY_MILESTONES[0],
    milestones: CONSISTENCY_MILESTONES.map(t => ({
      threshold: t,
      label: CONSISTENCY_LADDER_TIERS[String(t)] ?? String(t),
      achieved: false,
      achievedOn: null,
    })),
    missions: [
      { id: 'adherence', title: 'Behavioral Adherence', targetText: `≥${ADHERENCE_HIGH}%`, actualText: '—', completed: false },
      { id: 'protein', title: 'Protein Floor', targetText: `≥${PROTEIN_FLOOR}g`, actualText: '—', completed: false },
      { id: 'sleep', title: 'Sleep Target', targetText: `≥${SLEEP_GOAL}h`, actualText: '—', completed: false },
    ],
    focusOptions: [
      { id: 'recovery_lock', title: 'Recovery Lock', why: 'Prioritize 7+ hours sleep tonight. Sleep is the cheapest anabolic in the protocol.', recommended: false },
      { id: 'protein_anchor', title: 'Protein Anchor', why: 'Hit 190g protein before anything else. Protein compliance protects muscle during the cut.', recommended: false },
      { id: 'containment', title: 'Containment Mode', why: 'Return to structure at the next meal — not the next day. One meal fixes it.', recommended: true },
    ],
    weekPasses: 0,
    weekRemainingSlots: 7,
    mysteryIntelTitle: MYSTERY_INTEL_POOL[0].title,
    mysteryIntelBody: MYSTERY_INTEL_POOL[0].body,
    mysterySeed: '',
  };
}

export function deriveConsistencyGameState(days: ChartDayEntry[]): ConsistencyGameState {
  if (days.length === 0) return buildSafeDefaults();

  const latest = days[days.length - 1];
  const currentStreak = latest.streak ?? 0;
  const maxStreak = Math.max(...days.map(d => d.streak ?? 0));
  const passRate = Math.round((days.filter(d => d.status === 'Pass').length / days.length) * 100);

  // Ladder tier: highest threshold not exceeding currentStreak
  const tierKey = [...CONSISTENCY_MILESTONES].reverse().find(t => currentStreak >= t) ?? 0;
  const ladderTierLabel = CONSISTENCY_LADDER_TIERS[String(tierKey)] ?? CONSISTENCY_LADDER_TIERS['0'];

  // Milestones
  const milestones = CONSISTENCY_MILESTONES.map(threshold => {
    const achievedDay = days.find(d => (d.streak ?? 0) >= threshold);
    return {
      threshold,
      label: CONSISTENCY_LADDER_TIERS[String(threshold)] ?? String(threshold),
      achieved: !!achievedDay,
      achievedOn: achievedDay?.date ?? null,
    };
  });

  // Next milestone
  const nextMilestoneThreshold = CONSISTENCY_MILESTONES.find(t => t > currentStreak) ?? null;
  const daysToNextMilestone = nextMilestoneThreshold !== null
    ? nextMilestoneThreshold - currentStreak
    : null;

  // Daily missions from the latest logged day
  const missions = [
    {
      id: 'adherence' as const,
      title: 'Behavioral Adherence',
      targetText: `≥${ADHERENCE_HIGH}%`,
      actualText: latest.adherenceScore !== null ? `${latest.adherenceScore}%` : '—',
      completed: latest.status === 'Pass',
    },
    {
      id: 'protein' as const,
      title: 'Protein Floor',
      targetText: `≥${PROTEIN_FLOOR}g protein`,
      actualText: latest.protein ? `${latest.protein}g` : '—',
      completed: (latest.protein ?? 0) >= PROTEIN_FLOOR,
    },
    {
      id: 'sleep' as const,
      title: 'Sleep Target',
      targetText: `≥${SLEEP_GOAL}h sleep`,
      actualText: latest.sleep !== null ? `${latest.sleep}h` : '— (not logged)',
      completed: latest.sleep !== null && latest.sleep >= SLEEP_GOAL,
    },
  ];

  // Focus recommendation: weakest signal drives priority
  const failedAdherence = latest.status === 'Fail';
  const failedProtein = (latest.protein ?? 0) < PROTEIN_FLOOR;
  const recommendedId = failedAdherence ? 'containment'
    : failedProtein ? 'protein_anchor'
    : 'recovery_lock';

  const focusOptions = [
    {
      id: 'recovery_lock' as const,
      title: 'Recovery Lock',
      why: 'Prioritize 7+ hours sleep tonight. Sleep is the cheapest anabolic in the protocol.',
      recommended: recommendedId === 'recovery_lock',
    },
    {
      id: 'protein_anchor' as const,
      title: 'Protein Anchor',
      why: `Hit ${PROTEIN_FLOOR}g protein before anything else. Protein compliance protects muscle during the cut.`,
      recommended: recommendedId === 'protein_anchor',
    },
    {
      id: 'containment' as const,
      title: 'Containment Mode',
      why: 'Return to structure at the next meal — not the next day. One meal fixes it.',
      recommended: recommendedId === 'containment',
    },
  ];

  // Weekly scarcity — Monday-start ISO week containing the latest day
  const latestDate = parseEntryDate(latest.date);
  const dayOfWeek = (latestDate.getDay() + 6) % 7; // 0=Mon, 6=Sun
  const weekStart = new Date(latestDate);
  weekStart.setDate(latestDate.getDate() - dayOfWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const daysInWeek = days.filter(d => {
    const dt = parseEntryDate(d.date);
    return dt >= weekStart && dt <= weekEnd;
  });
  const weekPasses = daysInWeek.filter(d => d.status === 'Pass').length;
  const weekRemainingSlots = Math.max(0, 7 - daysInWeek.length);

  // Mystery intel — deterministic hash from latest date + streak + weekPasses
  const mysterySeed = `${latest.date}_${currentStreak}_${weekPasses}`;
  const intelIndex = hashSeed(mysterySeed) % MYSTERY_INTEL_POOL.length;
  const intelCard = MYSTERY_INTEL_POOL[intelIndex];

  return {
    currentStreak,
    maxStreak,
    passRate,
    ladderTierLabel,
    nextMilestone: nextMilestoneThreshold,
    daysToNextMilestone,
    milestones,
    missions,
    focusOptions,
    weekPasses,
    weekRemainingSlots,
    mysteryIntelTitle: intelCard.title,
    mysteryIntelBody: intelCard.body,
    mysterySeed,
  };
}
