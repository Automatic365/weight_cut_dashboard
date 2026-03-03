import React from 'react';
import { Trophy, XCircle, CheckCircle2 } from 'lucide-react';
import { ADHERENCE_LOW, MAX_SHIELD } from '../config';
import type { ChartDayEntry } from '../types';

interface HeatmapCellProps {
  day: ChartDayEntry;
}

// Single heatmap day cell with tooltip for the Behavioral Adherence Tracker.
const HeatmapCell: React.FC<HeatmapCellProps> = ({ day }) => {
  const bgClass = day.isBossFight
    ? (day.status === 'Pass' ? 'bg-[#dba104] shadow-[0_0_8px_rgba(219,161,4,0.6)] z-10' : 'bg-red-600 shadow-inner')
    : (day.adherenceScore && day.adherenceScore < ADHERENCE_LOW
      ? 'bg-red-500 shadow-inner'
      : (day.status === 'Pass' ? 'bg-green-500 shadow-sm' : 'bg-orange-500 shadow-inner'));

  const icon = day.isBossFight
    ? (day.status === 'Pass' ? <Trophy size={16} /> : <XCircle size={16} />)
    : (day.status === 'Pass' ? <CheckCircle2 size={16} /> : <XCircle size={16} />);

  return (
    <div
      className={`group relative w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold text-white transition-transform hover:scale-110 cursor-help ${bgClass}`}
    >
      {icon}

      {/* Custom Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
        <div className="ui-tooltip text-xs py-1.5 px-3 whitespace-nowrap">
          <div className="font-bold flex items-center gap-1.5">
            <span>{day.date}</span>
            <span className="text-ui-muted">|</span>
            <span>{day.tier}</span>
          </div>
          <div className="flex flex-col mt-0.5 gap-0.5">
            <div className="flex justify-between gap-3 text-slate-300">
              <span>Status:</span>
              <span className="font-medium text-white">{day.status}</span>
            </div>
            {day.adherenceScore != null && (
              <div className="flex justify-between gap-3 text-slate-300">
                <span>Score:</span>
                <span className={`${day.adherenceScore < ADHERENCE_LOW ? 'text-red-400' : 'text-green-400'} font-medium`}>{day.adherenceScore}%</span>
              </div>
            )}
            {day.shield != null && (
              <div className="flex justify-between gap-3 text-slate-300">
                <span>Shield:</span>
                <span className="font-medium text-blue-300">{day.shield}/{MAX_SHIELD}</span>
              </div>
            )}
            {day.isBossFight && (
              <div className="flex justify-between gap-3 text-amber-300 mt-0.5 pt-0.5 border-t border-ui-border">
                <span>Boss:</span>
                <span className="font-medium">{day.bossName}</span>
              </div>
            )}
          </div>
        </div>
        {/* Tooltip Arrow */}
        <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-ui-border"></div>
      </div>
    </div>
  );
};

export default HeatmapCell;
