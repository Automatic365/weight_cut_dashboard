import type { ChartDayEntry, Attributes } from '../types';

export interface AttributeXP {
  attribute: keyof Attributes;
  label: string;
  delta: number;
  didLevelUp: boolean;
  newLevel: number;
}

export interface SessionXP {
  date: string;
  gains: AttributeXP[];
  total: number;
}

const ATTR_LABELS: Record<keyof Attributes, string> = {
  strength:   'Strength',
  vitality:   'Vitality',
  discipline: 'Discipline',
  resilience: 'Resilience',
};

function xpDelta(
  prev: { level: number; currentLvlXp: number; nextLvlXp: number },
  curr: { level: number; currentLvlXp: number; nextLvlXp: number },
): number {
  if (curr.level === prev.level) {
    return curr.currentLvlXp - prev.currentLvlXp;
  }
  // Level-up: XP needed to fill prev level + any XP earned into new level
  return (prev.nextLvlXp - prev.currentLvlXp) + curr.currentLvlXp;
}

export function computeSessionXP(days: ChartDayEntry[]): SessionXP | null {
  if (days.length < 2) return null;

  const prev = days[days.length - 2];
  const curr = days[days.length - 1];

  const attrs = Object.keys(ATTR_LABELS) as (keyof Attributes)[];
  const gains: AttributeXP[] = attrs.map(attr => {
    const delta = xpDelta(prev.attributes[attr], curr.attributes[attr]);
    return {
      attribute: attr,
      label: ATTR_LABELS[attr],
      delta,
      didLevelUp: curr.attributes[attr].level > prev.attributes[attr].level,
      newLevel: curr.attributes[attr].level,
    };
  });

  return {
    date: curr.date,
    gains,
    total: gains.reduce((sum, g) => sum + g.delta, 0),
  };
}
