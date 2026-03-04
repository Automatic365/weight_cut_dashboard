import React from 'react';
import { BookOpen } from 'lucide-react';
import type { ChartDayEntry } from '../types';

interface NotesFeedProps {
  chartData: ChartDayEntry[];
}

const NotesFeed: React.FC<NotesFeedProps> = ({ chartData }) => {
  const entries = chartData.filter(d => d.notes && d.notes.trim().length > 0);

  if (entries.length === 0) return null;

  return (
    <div className="ui-card-dark ui-card-interactive p-5">
      <div className="flex items-center gap-1.5 mb-4">
        <BookOpen size={15} className="text-ui-muted" />
        <span className="ui-kicker">Field Journal</span>
        <span className="ml-auto text-[10px] text-ui-muted">{entries.length} entries</span>
      </div>

      <div className="space-y-2.5">
        {entries.map((d, i) => (
          <div key={i} className="flex gap-3 items-start">
            {/* Date chip */}
            <div className={`shrink-0 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border mt-0.5 ${
              d.isBossFight && d.status === 'Pass'
                ? 'border-amber-400/40 text-amber-300 bg-amber-400/10'
                : d.status === 'Pass'
                ? 'border-green-500/40 text-green-400 bg-green-500/10'
                : 'border-red-500/40 text-red-400 bg-red-500/10'
            }`}>
              {d.date}
            </div>
            {/* Boss badge */}
            {d.isBossFight && (
              <div className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-400/50 text-amber-300 bg-amber-400/10 mt-0.5">
                BOSS
              </div>
            )}
            {/* Note text */}
            <p className="text-xs text-slate-300 leading-relaxed">{d.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotesFeed;
