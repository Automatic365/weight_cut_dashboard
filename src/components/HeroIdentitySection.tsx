import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Dumbbell, Heart, Brain, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AttributeRow from './AttributeRow';
import { ATTRIBUTE_THEME } from '../config';
import type { Attributes, RadarDataPoint, RankState } from '../types';

interface HeroIdentitySectionProps {
  latestAttributes: Attributes;
  radarData: RadarDataPoint[];
  tier: string;
  rankState: RankState;
}

// ── Radar chart icon vertices ───────────────────────────────────────────────

const RADAR_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  Strength:   { icon: Dumbbell, color: ATTRIBUTE_THEME.strength.hex },
  Vitality:   { icon: Heart,    color: ATTRIBUTE_THEME.vitality.hex },
  Resilience: { icon: Shield,   color: ATTRIBUTE_THEME.resilience.hex },
  Discipline: { icon: Brain,    color: ATTRIBUTE_THEME.discipline.hex },
};

const RadarIconTick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => {
  const meta = RADAR_ICONS[payload?.value ?? ''];
  if (!meta || x == null || y == null) return null;
  const { icon: Icon, color } = meta;
  const size = 16;
  return (
    <g>
      <Icon x={x - size / 2} y={y - size / 2} width={size} height={size} color={color} strokeWidth={1.5} />
    </g>
  );
};

// Derive display tag from nutrition tier string
function tierTag(tier: string): string {
  if (tier === 'Linear') return 'LINEAR CUT';
  if (tier === 'PSMF' || tier === 'Tier 2') return 'PSMF';
  if (tier === 'Tier 3') return 'FAST';
  return tier.toUpperCase();
}

const Tag: React.FC<{ label: string }> = ({ label }) => (
  <span className="ui-chip-accent">
    {label}
  </span>
);

function getRankWriteup(rank: string): string {
  const byRank: Record<string, string> = {
    Trainee: 'Building baseline discipline. The win condition is stacking clean Pass days and avoiding streak breaks.',
    Operator: 'Execution is becoming consistent. Focus on boring repeatability and tighter recovery to keep momentum.',
    Specialist: 'You are proving system control under normal stress. Keep pass-rate high and convert boss days into controlled wins.',
    Enforcer: 'High reliability tier. Preserve structure during volatility days; this is where physique change compounds quickly.',
    Vanguard: 'Elite consistency zone. Small leaks now matter most, so guard sleep and protein to protect the streak engine.',
    Ghost: 'Top rank. You execute without drama. Maintain standards and mentor your own future decisions with data-first discipline.',
  };
  return byRank[rank] ?? 'Consistency rank derived from your long-term execution, streak integrity, and boss-day outcomes.';
}

const HeroIdentitySection: React.FC<HeroIdentitySectionProps> = ({
  latestAttributes, radarData, tier, rankState,
}) => {
  return (
    <div className="mt-4 ui-card-dark ui-card-interactive overflow-hidden">

      {/* Section label */}
      <div className="px-4 pt-3 pb-2 border-b border-ui-border/70">
        <span className="ui-kicker">
          Performance Attributes
        </span>
      </div>

      <div className="flex flex-col md:flex-row">

        {/* ── Left: Character Panel ───────────────────────────────────────── */}
        <div className="md:w-1/4 bg-ui-surface border-b md:border-b-0 md:border-r border-ui-border/70 p-5 flex flex-col items-center justify-center gap-4">

          {/* Name */}
          <div className="text-center">
            <div className="text-sm font-display font-bold text-ui-text uppercase tracking-widest">Apex</div>
          </div>

          {/* Avatar frame with amber corner brackets */}
          <div className="relative w-24 h-24">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-ui-accent/80" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-ui-accent/80" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-ui-accent/80" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-ui-accent/80" />
            {/* Hero avatar */}
            <img
              src="/weight_cut_dashboard/avatar.jpg"
              alt="Hero avatar"
              className="w-full h-full object-cover object-top rounded-ui-sm border border-ui-border/80 shadow-ui-panel"
            />
          </div>

          {/* Rank */}
          <div className="text-center">
            <div className="text-[9px] text-ui-muted uppercase tracking-widest mb-0.5">Rank</div>
            <div className="relative inline-flex group">
              <button
                type="button"
                className="text-xs font-display font-bold text-ui-accent uppercase tracking-wider cursor-help"
                aria-label={`Current rank: ${rankState.currentRank}`}
              >
                {rankState.currentRank}
              </button>
              <div className="pointer-events-none absolute z-30 hidden group-hover:block group-focus-within:block top-full mt-2 left-1/2 -translate-x-1/2 w-56 ui-tooltip text-left">
                <div className="px-2 py-1 border-b border-ui-border text-[9px] uppercase tracking-widest text-ui-accent font-bold">
                  Rank Briefing
                </div>
                <div className="px-2 py-1.5 text-[10px] text-slate-200 leading-relaxed">
                  {getRankWriteup(rankState.currentRank)}
                </div>
              </div>
            </div>
            {rankState.xpToNextRank !== null && (
              <>
                {/* Progress bar toward next rank */}
                <div className="w-20 h-0.5 bg-ui-border rounded-full mt-1.5 mx-auto overflow-hidden">
                  <div
                    className="h-full bg-ui-accent/80 rounded-full transition-all duration-700"
                    style={{ width: `${rankState.rankProgress * 100}%` }}
                  />
                </div>
                <div className="text-[9px] text-ui-muted mt-1">
                  {rankState.xpToNextRank} RXP → {rankState.nextRank}
                </div>
              </>
            )}
            {rankState.nextRank === null && (
              <div className="text-[9px] text-ui-accent/70 mt-1">Max Rank</div>
            )}
          </div>

          {/* Tag chips */}
          <div className="flex flex-wrap justify-center gap-1.5">
            <Tag label={tierTag(tier)} />
            <Tag label="Muay Thai" />
            <Tag label="Fighter" />
          </div>
        </div>

        {/* ── Center: Attribute Rows ──────────────────────────────────────── */}
        <div className="md:w-1/2 p-5 flex flex-col justify-center">
          <div className="ui-kicker mb-3">
            Attribute Levels
          </div>
          <div>
            <AttributeRow
              name="Strength"
              icon={Dumbbell}
              iconClass={ATTRIBUTE_THEME.strength.iconClass}
              barColorClass={ATTRIBUTE_THEME.strength.barClass}
              level={latestAttributes.strength.level}
              currentLvlXp={latestAttributes.strength.currentLvlXp}
              nextLvlXp={latestAttributes.strength.nextLvlXp}
              tooltipLines={['+10 XP: Protein floor (≥190g)', '+5 XP: Logging a workout']}
            />
            <AttributeRow
              name="Vitality"
              icon={Heart}
              iconClass={ATTRIBUTE_THEME.vitality.iconClass}
              barColorClass={ATTRIBUTE_THEME.vitality.barClass}
              level={latestAttributes.vitality.level}
              currentLvlXp={latestAttributes.vitality.currentLvlXp}
              nextLvlXp={latestAttributes.vitality.nextLvlXp}
              tooltipLines={['+10 XP: Sleep >7 hours', '-5 XP: Sleep <6 hours']}
            />
            <AttributeRow
              name="Discipline"
              icon={Brain}
              iconClass={ATTRIBUTE_THEME.discipline.iconClass}
              barColorClass={ATTRIBUTE_THEME.discipline.barClass}
              level={latestAttributes.discipline.level}
              currentLvlXp={latestAttributes.discipline.currentLvlXp}
              nextLvlXp={latestAttributes.discipline.nextLvlXp}
              tooltipLines={['+10 XP: Adherence ≥90%', '+5 XP: Logging a workout', '-10 XP: Adherence <85%']}
            />
            <AttributeRow
              name="Resilience"
              icon={Shield}
              iconClass={ATTRIBUTE_THEME.resilience.iconClass}
              barColorClass={ATTRIBUTE_THEME.resilience.barClass}
              level={latestAttributes.resilience.level}
              currentLvlXp={latestAttributes.resilience.currentLvlXp}
              nextLvlXp={latestAttributes.resilience.nextLvlXp}
              tooltipLines={['+50 XP: Surviving a Boss Battle', '-20 XP: Boss Critical Hit (Fail)']}
            />
          </div>
        </div>

        {/* ── Right: Radar Chart ──────────────────────────────────────────── */}
        <div className="md:w-1/4 border-t md:border-t-0 md:border-l border-ui-border/70 p-4 flex items-center justify-center">
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="58%" data={radarData}>
                <PolarGrid stroke="#314560" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={(props: { x: number; y: number; payload: { value: string } }) => <RadarIconTick {...props} />}
                  tickLine={false}
                  axisLine={false}
                />
                {/* tickCount=6 → rings at 0,2,4,6,8,10 = 5 visible level rings */}
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 10]}
                  tickCount={6}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Attributes"
                  dataKey="level"
                  stroke="#f0a93e"
                  fill="#f0a93e"
                  fillOpacity={0.5}
                  strokeWidth={1.5}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f1724', borderColor: '#27374f', color: '#fff', borderRadius: '10px' }}
                  itemStyle={{ color: '#f0a93e' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeroIdentitySection;
