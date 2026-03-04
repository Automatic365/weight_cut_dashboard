import React from 'react';
import { CalendarDays } from 'lucide-react';
import { WEEKLY_SCHEDULE, DATA_YEAR } from '../config';
import type { ChartDayEntry } from '../types';

interface WeeklyScheduleCardProps {
  latestDate: string; // "MM/DD"
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TIER_COLOR: Record<string, string> = {
  Fast:        'text-slate-400 border-slate-600/60 bg-slate-800/40',
  PSMF:        'text-purple-300 border-purple-500/40 bg-purple-900/20',
  Linear:      'text-ui-primary border-blue-500/40 bg-blue-900/20',
  Maintenance: 'text-green-300 border-green-500/40 bg-green-900/20',
};

const WeeklyScheduleCard: React.FC<WeeklyScheduleCardProps> = ({ latestDate }) => {
  const [m, d] = latestDate.split('/');
  const today = new Date(DATA_YEAR, +m - 1, +d);
  const todayDow = today.getDay(); // 0=Sun

  return (
    <div className="ui-card-dark ui-card-interactive p-5">
      <div className="flex items-center gap-1.5 mb-4">
        <CalendarDays size={15} className="text-ui-muted" />
        <span className="ui-kicker">Weekly Protocol</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {[0, 1, 2, 3, 4, 5, 6].map(dow => {
          const sched = WEEKLY_SCHEDULE[dow];
          const isToday = dow === todayDow;
          const tierColor = TIER_COLOR[sched.nutritionLabel] ?? 'text-ui-muted border-ui-border bg-ui-surface';

          return (
            <div
              key={dow}
              className={`rounded-ui-md border p-2 flex flex-col gap-1 text-center transition-all ${tierColor} ${
                isToday ? 'ring-2 ring-ui-accent ring-offset-1 ring-offset-[#060b12]' : 'opacity-70'
              }`}
            >
              <div className={`text-[9px] font-bold uppercase tracking-widest ${isToday ? 'text-ui-accent' : 'text-ui-muted'}`}>
                {DAY_LABELS[dow]}
              </div>
              <div className="text-[10px] font-semibold leading-tight">
                {sched.nutritionLabel}
              </div>
              {sched.calorieRange ? (
                <div className="text-[9px] text-ui-muted leading-tight">
                  {sched.calorieRange[0]}–{sched.calorieRange[1]}<br />kcal
                </div>
              ) : (
                <div className="text-[9px] text-ui-muted">—</div>
              )}
              {sched.muayThaiTime && (
                <div className="text-[8px] text-amber-400/80 font-semibold mt-0.5 leading-tight">
                  MT {sched.muayThaiTime}
                </div>
              )}
              <div className="text-[8px] text-ui-muted/70 leading-tight mt-auto pt-1 border-t border-ui-border/30">
                {sched.strengthFocus}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyScheduleCard;
