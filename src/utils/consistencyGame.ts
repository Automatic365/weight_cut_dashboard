import {
  DATA_YEAR,
  CONSISTENCY_MILESTONES,
  CONSISTENCY_LADDER_TIERS,
  MYSTERY_INTEL_POOL,
  PROTEIN_FLOOR,
  SLEEP_GOAL,
  ADHERENCE_HIGH,
  WEEKLY_SCHEDULE,
} from '../config';
import type { ChartDayEntry, ConsistencyGameState, ConsistencyFocusOption } from '../types';

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
      { id: 'adherence', title: 'Behavioral Adherence', targetText: `≥${ADHERENCE_HIGH}%`, actualText: '—', completed: false, pending: true },
      { id: 'protein',   title: 'Protein Floor',        targetText: `≥${PROTEIN_FLOOR}g`,  actualText: '—', completed: false, pending: true },
      { id: 'sleep',     title: 'Sleep Target',          targetText: `≥${SLEEP_GOAL}h`,    actualText: '—', completed: false, pending: true },
    ],
    focusOptions: [
      { id: 'recovery_lock',  title: 'Recovery Lock',  why: 'Prioritize 7+ hours sleep tonight. Sleep is the cheapest anabolic in the protocol.',              recommended: false },
      { id: 'protein_anchor', title: 'Protein Anchor', why: 'Hit 190g protein before anything else. Protein compliance protects muscle during the cut.',        recommended: false },
      { id: 'containment',    title: 'Containment Mode', why: 'Return to structure at the next meal — not the next day. One meal fixes it.',                   recommended: true },
    ],
    weekPasses: 0,
    weekRemainingSlots: 7,
    mysteryIntelTitle: MYSTERY_INTEL_POOL[0].title,
    mysteryIntelBody: MYSTERY_INTEL_POOL[0].body,
    mysterySeed: '',
  };
}

export function deriveConsistencyGameState(
  days: ChartDayEntry[],
  todayDate: Date = new Date(),
): ConsistencyGameState {
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

  // ── Today's schedule context ─────────────────────────────────────────────────
  const todayDow = todayDate.getDay(); // 0=Sun … 6=Sat
  const todaySchedule = WEEKLY_SCHEDULE[todayDow];

  // ── Daily missions ───────────────────────────────────────────────────────────
  // Adherence + protein: forward-looking against today's schedule.
  //   Fast day  → already satisfied (completed=true, pending=false).
  //   Eating day → target not yet confirmable until end of day (pending=true).
  // Sleep: always backward-looking — last night's data from the latest log entry.

  const missions = [
    {
      id: 'adherence' as const,
      title: todaySchedule.isFast ? 'Fasting today' : `Stay on ${todaySchedule.nutritionLabel}`,
      targetText: todaySchedule.isFast
        ? '0 kcal'
        : `${todaySchedule.calorieRange![0]}–${todaySchedule.calorieRange![1]} kcal`,
      actualText: '—',
      completed: todaySchedule.isFast,
      pending: !todaySchedule.isFast,
    },
    {
      id: 'protein' as const,
      title: todaySchedule.isFast ? 'Protein suspended' : 'Hit protein target',
      targetText: todaySchedule.isFast
        ? 'Fast day'
        : todaySchedule.proteinMax
        ? `${todaySchedule.proteinMin}–${todaySchedule.proteinMax}g`
        : `≥${todaySchedule.proteinMin}g`,
      actualText: todaySchedule.isFast ? '0g' : '—',
      completed: todaySchedule.isFast,
      pending: !todaySchedule.isFast,
    },
    {
      id: 'sleep' as const,
      title: 'Sleep tonight',
      targetText: `≥${SLEEP_GOAL}h`,
      actualText: '—',
      completed: false,
      pending: true,
    },
  ];

  // ── Focus recommendation ──────────────────────────────────────────────────────
  // Fast day always → Recovery Lock (rest and fasting are the whole agenda).
  // Eating days → driven by T-1 signals (what went wrong yesterday).
  const failedAdherence = latest.status === 'Fail';
  const failedProtein = (latest.protein ?? 0) < PROTEIN_FLOOR;

  const recommendedId: ConsistencyFocusOption['id'] = todaySchedule.isFast
    ? 'recovery_lock'
    : failedAdherence
    ? 'containment'
    : failedProtein
    ? 'protein_anchor'
    : 'recovery_lock';

  const focusOptions: ConsistencyFocusOption[] = [
    {
      id: 'recovery_lock',
      title: 'Recovery Lock',
      why: 'Prioritize 7+ hours sleep tonight. Sleep is the cheapest anabolic in the protocol.',
      recommended: recommendedId === 'recovery_lock',
    },
    {
      id: 'protein_anchor',
      title: 'Protein Anchor',
      why: `Hit ${PROTEIN_FLOOR}g protein before anything else. Protein compliance protects muscle during the cut.`,
      recommended: recommendedId === 'protein_anchor',
    },
    {
      id: 'containment',
      title: 'Containment Mode',
      why: 'Return to structure at the next meal — not the next day. One meal fixes it.',
      recommended: recommendedId === 'containment',
    },
  ];

  // ── Weekly scarcity — Monday-start ISO week containing the latest day ────────
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

  // ── Mystery intel — deterministic hash from latest date + streak + weekPasses ─
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
