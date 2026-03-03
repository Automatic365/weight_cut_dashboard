import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface AttributeRowProps {
  name: string;
  icon: LucideIcon;
  iconClass: string;
  barColorClass: string;
  level: number;
  currentLvlXp: number;
  nextLvlXp: number;
  tooltipLines: string[];
}

const AttributeRow: React.FC<AttributeRowProps> = ({
  name, icon: Icon, iconClass, barColorClass,
  level, currentLvlXp, nextLvlXp, tooltipLines,
}) => {
  const pct = Math.min(100, Math.max(0, (currentLvlXp / nextLvlXp) * 100));

  return (
    <div className="relative group flex items-center gap-3 py-2 border-b border-slate-800/60 last:border-0 cursor-help">

      {/* Icon */}
      <Icon size={14} className={`shrink-0 ${iconClass}`} />

      {/* Attribute name */}
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 w-20 shrink-0">
        {name}
      </span>

      {/* XP bar */}
      <div className="flex-1 h-1 bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColorClass} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* XP text */}
      <span className="text-[9px] text-slate-600 tabular-nums w-14 text-right shrink-0">
        {currentLvlXp}/{nextLvlXp}
      </span>

      {/* Level badge */}
      <span className="text-[10px] font-black text-white bg-slate-700/80 border border-slate-600/50 px-1.5 py-0.5 rounded shrink-0 w-10 text-center">
        Lv.{level}
      </span>

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-48 pointer-events-none">
        <div className="bg-[#0d1117] border border-amber-500/30 text-slate-300 text-[10px] leading-tight rounded-md p-2 shadow-xl text-center">
          <strong className={`${iconClass} block mb-1`}>{name} XP</strong>
          {tooltipLines.map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < tooltipLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-amber-500/30" />
      </div>

    </div>
  );
};

export default AttributeRow;
