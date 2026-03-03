import React from 'react';
import {
  CheckCircle2, XCircle, Dumbbell, Heart, Brain, Shield,
  Target, Zap, Radio, ChevronRight,
} from 'lucide-react';
import { ATTRIBUTE_THEME } from '../config';
import type { ConsistencyGameState, ConsistencyMission, ConsistencyFocusOption } from '../types';

interface ConsistencyEngineSectionProps {
  gameState: ConsistencyGameState;
}

// ─── Mission icon + color lookup ──────────────────────────────────────────────

const MISSION_META: Record<ConsistencyMission['id'], {
  icon: React.FC<{ size?: number; className?: string }>;
  colorClass: string;
}> = {
  adherence: { icon: Brain,    colorClass: ATTRIBUTE_THEME.discipline.iconClass },
  protein:   { icon: Dumbbell, colorClass: ATTRIBUTE_THEME.strength.iconClass },
  sleep:     { icon: Heart,    colorClass: ATTRIBUTE_THEME.vitality.iconClass },
};

// ─── Focus option icon lookup ─────────────────────────────────────────────────

const FOCUS_META: Record<ConsistencyFocusOption['id'], {
  icon: React.FC<{ size?: number; className?: string }>;
  colorClass: string;
}> = {
  recovery_lock:  { icon: Heart, colorClass: ATTRIBUTE_THEME.vitality.iconClass },
  protein_anchor: { icon: Dumbbell, colorClass: ATTRIBUTE_THEME.strength.iconClass },
  containment:    { icon: Shield, colorClass: ATTRIBUTE_THEME.resilience.iconClass },
};

// ─── Milestone node ────────────────────────────────────────────────────────────

function MilestoneNode({
  threshold, achieved, current, isNext,
}: {
  threshold: number;
  achieved: boolean;
  current: boolean;
  isNext: boolean;
}) {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all';
  const style = achieved
    ? 'bg-ui-primary border-sky-300 text-white'
    : isNext
    ? 'bg-ui-surface-2 border-ui-accent text-ui-accent'
    : 'bg-ui-surface border-ui-border text-ui-muted';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${base} ${style} ${current ? 'ring-2 ring-white/30' : ''}`}>
        {threshold}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const ConsistencyEngineSection: React.FC<ConsistencyEngineSectionProps> = ({ gameState }) => {
  const {
    currentStreak, maxStreak, passRate, ladderTierLabel,
    nextMilestone, daysToNextMilestone, milestones,
    missions, focusOptions,
    weekPasses, weekRemainingSlots,
    mysteryIntelTitle, mysteryIntelBody, mysterySeed,
  } = gameState;

  return (
    <div className="ui-card-dark ui-card-interactive p-5 space-y-5">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-semibold text-ui-text flex items-center gap-1.5 uppercase tracking-wider">
          <Target size={16} className="text-ui-primary" /> Consistency Engine
        </h3>
        <div className="text-[10px] text-ui-muted font-semibold">
          {passRate}% overall pass rate · Max streak: {maxStreak}d
        </div>
      </div>

      {/* ── Block 1: Consistency Ladder ────────────────────────────────────────── */}
      <div className="bg-ui-surface-2/55 border border-ui-border/80 rounded-ui-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="ui-kicker mb-0.5">Current Tier</div>
            <div className="text-sm font-display font-semibold text-ui-primary">{ladderTierLabel}</div>
          </div>
          <div className="text-right">
            <div className="ui-kicker mb-0.5">Active Streak</div>
            <div className="text-sm font-display font-semibold text-ui-text">{currentStreak} days</div>
          </div>
        </div>

        {/* Milestone rail */}
        <div className="flex items-center justify-between px-1">
          {milestones.map((m, i) => (
            <React.Fragment key={m.threshold}>
              <MilestoneNode
                threshold={m.threshold}
                achieved={m.achieved}
                current={currentStreak >= m.threshold && (i === milestones.length - 1 || currentStreak < milestones[i + 1].threshold)}
                isNext={!m.achieved && (i === 0 || milestones[i - 1].achieved)}
              />
              {i < milestones.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${m.achieved ? 'bg-ui-primary/70' : 'bg-ui-border'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {nextMilestone !== null && daysToNextMilestone !== null && (
          <div className="mt-3 text-[11px] text-amber-400 flex items-center gap-1">
            <ChevronRight size={12} />
            Next milestone: <strong>{milestones.find(m => m.threshold === nextMilestone)?.label}</strong> in {daysToNextMilestone} day{daysToNextMilestone !== 1 ? 's' : ''}
          </div>
        )}
        {nextMilestone === null && (
          <div className="mt-3 text-[11px] text-ui-primary font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> All milestones achieved. Unbreakable System status locked in.
          </div>
        )}
      </div>

      {/* ── Block 2: Daily Missions ─────────────────────────────────────────────── */}
      <div className="bg-ui-surface-2/55 border border-ui-border/80 rounded-ui-lg p-4">
        <div className="ui-kicker mb-3">
          Today's Missions
        </div>
        <div className="space-y-2.5">
          {missions.map(mission => {
            const meta = MISSION_META[mission.id];
            const Icon = meta.icon;
            return (
              <div key={mission.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={14} className={meta.colorClass} />
                  <span className="text-xs text-slate-300 font-medium">{mission.title}</span>
                  <span className="text-[10px] text-slate-500">{mission.targetText}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold ${
                    mission.pending    ? 'text-blue-400'  :
                    mission.completed  ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {mission.actualText}
                  </span>
                  {mission.pending
                    ? <Target size={14} className="text-blue-400" />
                    : mission.completed
                    ? <CheckCircle2 size={14} className="text-green-400" />
                    : <XCircle size={14} className="text-red-500/70" />
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Block 3 + 4: Next Best Focus + Weekly Scarcity ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {focusOptions.map(option => {
          const meta = FOCUS_META[option.id];
          const Icon = meta.icon;
          return (
            <div
              key={option.id}
              className={`bg-ui-surface-2/40 border rounded-ui-md p-3 flex flex-col gap-1.5 transition-all ${
                option.recommended
                  ? 'border-amber-400/55 ring-1 ring-amber-400/30'
                  : 'border-ui-border opacity-65'
              }`}
            >
              {option.recommended && (
                <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  <Zap size={9} /> Recommended
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Icon size={13} className={option.recommended ? meta.colorClass : 'text-ui-muted'} />
                  <span className={`text-xs font-display font-semibold ${option.recommended ? 'text-ui-text' : 'text-ui-muted'}`}>
                    {option.title}
                  </span>
                </div>
              <p className="text-[10px] text-slate-400 leading-snug">{option.why}</p>
            </div>
          );
        })}
      </div>

      {/* Weekly scarcity strip */}
      <div className={`flex items-center justify-between text-[11px] px-1 ${
        weekRemainingSlots === 0 ? 'text-green-400' :
        weekRemainingSlots <= 2 ? 'text-ui-accent' : 'text-ui-muted'
      }`}>
        <span>
          This week: <strong>{weekPasses}</strong> pass{weekPasses !== 1 ? 'es' : ''}
          {weekRemainingSlots > 0 && (
            <> · <strong>{weekRemainingSlots}</strong> slot{weekRemainingSlots !== 1 ? 's' : ''} remaining</>
          )}
        </span>
        {weekRemainingSlots === 0 && (
          <span className="font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> Full week logged
          </span>
        )}
      </div>

      {/* ── Block 5: Mystery Intel ───────────────────────────────────────────────── */}
      <div className="bg-ui-surface-2/55 border border-ui-border/80 rounded-ui-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-display font-semibold uppercase tracking-widest text-ui-muted">
            <Radio size={12} /> Daily Intel
          </div>
          <span className="text-[9px] text-ui-muted/80 font-mono">{mysterySeed}</span>
        </div>
        <div className="text-sm font-display font-semibold text-ui-text mb-1">{mysteryIntelTitle}</div>
        <p className="text-xs text-slate-400 leading-relaxed">{mysteryIntelBody}</p>
      </div>

    </div>
  );
};

export default ConsistencyEngineSection;
