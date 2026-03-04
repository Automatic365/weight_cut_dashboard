import React from 'react';
import { CheckCircle2, XCircle, ChevronRight, ClipboardList } from 'lucide-react';
import type { WeeklyDebrief } from '../utils/insightEngine';

interface WeeklyDebriefCardProps {
  debrief: WeeklyDebrief;
}

const Stat: React.FC<{ label: string; value: string | number | null; unit?: string }> = ({ label, value, unit }) => (
  <div className="text-center">
    <div className="text-[9px] text-ui-muted uppercase tracking-widest mb-0.5">{label}</div>
    <div className="text-sm font-bold text-ui-text">
      {value != null ? value : '—'}
      {value != null && unit && <span className="text-[10px] text-ui-muted font-normal ml-0.5">{unit}</span>}
    </div>
  </div>
);

const WeeklyDebriefCard: React.FC<WeeklyDebriefCardProps> = ({ debrief }) => {
  return (
    <div className="ui-card-dark ui-card-interactive p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ClipboardList size={15} className="text-ui-muted" />
          <span className="ui-kicker">Weekly Debrief</span>
        </div>
        <span className="text-[10px] text-ui-muted font-mono">{debrief.weekLabel}</span>
      </div>

      {/* Pass/Fail summary */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm font-bold text-green-400">
          <CheckCircle2 size={16} /> {debrief.passDays} pass
        </div>
        <div className="text-ui-border">·</div>
        <div className={`flex items-center gap-1.5 text-sm font-bold ${debrief.failDays > 0 ? 'text-red-400' : 'text-ui-muted'}`}>
          <XCircle size={16} /> {debrief.failDays} fail
        </div>
        <div className="ml-auto">
          <div className="text-[10px] text-ui-muted">Adherence</div>
          <div className={`text-sm font-bold ${
            (debrief.passDays / 7) >= 0.86 ? 'text-green-400' : 'text-amber-400'
          }`}>
            {Math.round((debrief.passDays / 7) * 100)}%
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 bg-ui-surface-2/40 border border-ui-border/60 rounded-ui-md p-3">
        <Stat label="Avg Weight" value={debrief.avgWeight} unit="lbs" />
        <Stat label="Avg Sleep" value={debrief.avgSleep} unit="h" />
        <Stat label="Avg Protein" value={debrief.avgProtein} unit="g" />
      </div>

      {/* Biggest leak */}
      <div className="bg-ui-surface-2/55 border border-ui-border/80 rounded-ui-md p-3">
        <div className="text-[9px] text-ui-muted uppercase tracking-widest mb-1">Biggest Leak</div>
        <div className="text-xs text-slate-300 font-medium">{debrief.biggestLeak}</div>
      </div>

      {/* Directive */}
      <div className="flex items-start gap-2 bg-ui-accent/8 border border-ui-accent/30 rounded-ui-md p-3">
        <ChevronRight size={13} className="text-ui-accent mt-0.5 shrink-0" />
        <div>
          <div className="text-[9px] text-ui-accent uppercase tracking-widest font-bold mb-1">Next 7-Day Directive</div>
          <p className="text-[11px] text-slate-200 leading-relaxed">{debrief.directive}</p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyDebriefCard;
