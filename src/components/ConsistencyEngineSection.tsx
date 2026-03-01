import React from 'react';
import {
  CheckCircle2, XCircle, Dumbbell, Heart, Brain, Shield,
  Target, Zap, Radio, ChevronRight,
} from 'lucide-react';
import type { ConsistencyGameState, ConsistencyMission, ConsistencyFocusOption } from '../types';

interface ConsistencyEngineSectionProps {
  gameState: ConsistencyGameState;
}

// ─── Mission icon + color lookup ──────────────────────────────────────────────

const MISSION_META: Record<ConsistencyMission['id'], {
  icon: React.FC<{ size?: number; className?: string }>;
  colorClass: string;
}> = {
  adherence: { icon: Brain,    colorClass: 'text-purple-400' },
  protein:   { icon: Dumbbell, colorClass: 'text-red-400' },
  sleep:     { icon: Heart,    colorClass: 'text-green-400' },
};

// ─── Focus option icon lookup ─────────────────────────────────────────────────

const FOCUS_META: Record<ConsistencyFocusOption['id'], {
  icon: React.FC<{ size?: number; className?: string }>;
}> = {
  recovery_lock:  { icon: Heart },
  protein_anchor: { icon: Dumbbell },
  containment:    { icon: Shield },
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
    ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_8px_rgba(139,92,246,0.6)]'
    : isNext
    ? 'bg-slate-700 border-amber-500 text-amber-400'
    : 'bg-slate-800 border-slate-600 text-slate-500';

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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
          <Target size={16} className="text-slate-400" /> Consistency Engine
        </h3>
        <div className="text-[10px] text-slate-500 font-semibold">
          {passRate}% overall pass rate · Max streak: {maxStreak}d
        </div>
      </div>

      {/* ── Block 1: Consistency Ladder ────────────────────────────────────────── */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-0.5">Current Tier</div>
            <div className="text-sm font-bold text-purple-300">{ladderTierLabel}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-0.5">Active Streak</div>
            <div className="text-sm font-bold text-white">{currentStreak} days</div>
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
                <div className={`flex-1 h-px mx-1 ${m.achieved ? 'bg-purple-600/60' : 'bg-slate-700'}`} />
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
          <div className="mt-3 text-[11px] text-purple-400 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> All milestones achieved. Unbreakable System status locked in.
          </div>
        )}
      </div>

      {/* ── Block 2: Daily Missions ─────────────────────────────────────────────── */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-3">
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
                  <span className={`text-[10px] font-semibold ${mission.completed ? 'text-green-400' : 'text-slate-400'}`}>
                    {mission.actualText}
                  </span>
                  {mission.completed
                    ? <CheckCircle2 size={14} className="text-green-400" />
                    : <XCircle size={14} className="text-amber-500/70" />
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
          const Icon = FOCUS_META[option.id].icon;
          return (
            <div
              key={option.id}
              className={`bg-slate-800/50 border rounded-xl p-3 flex flex-col gap-1.5 transition-all ${
                option.recommended
                  ? 'border-amber-500/60 ring-1 ring-amber-500/30'
                  : 'border-slate-700 opacity-60'
              }`}
            >
              {option.recommended && (
                <div className="text-[9px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  <Zap size={9} /> Recommended
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Icon size={13} className={option.recommended ? 'text-amber-400' : 'text-slate-500'} />
                <span className={`text-xs font-bold ${option.recommended ? 'text-white' : 'text-slate-400'}`}>
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
        weekRemainingSlots <= 2 ? 'text-amber-400' : 'text-slate-400'
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
      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Radio size={12} /> Daily Intel
          </div>
          <span className="text-[9px] text-slate-600 font-mono">{mysterySeed}</span>
        </div>
        <div className="text-sm font-bold text-white mb-1">{mysteryIntelTitle}</div>
        <p className="text-xs text-slate-400 leading-relaxed">{mysteryIntelBody}</p>
      </div>

    </div>
  );
};

export default ConsistencyEngineSection;
