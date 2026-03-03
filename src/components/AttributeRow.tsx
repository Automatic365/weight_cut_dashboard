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
    <div className="relative group flex items-center gap-3 py-2 border-b border-ui-border/70 last:border-0 cursor-help">

      {/* Icon */}
      <Icon size={14} className={`shrink-0 ${iconClass}`} />

      {/* Attribute name */}
      <span className="text-[10px] font-display font-semibold uppercase tracking-widest text-ui-muted w-20 shrink-0">
        {name}
      </span>

      {/* XP bar */}
      <div className="flex-1 ui-progress-track">
        <div
          className={`ui-progress-fill ${barColorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* XP text */}
      <span className="text-[9px] text-ui-muted/80 tabular-nums w-14 text-right shrink-0">
        {currentLvlXp}/{nextLvlXp}
      </span>

      {/* Level badge */}
      <span className="text-[10px] font-display font-bold text-ui-text bg-ui-surface-2 border border-ui-border px-1.5 py-0.5 rounded-ui-sm shrink-0 w-10 text-center">
        Lv.{level}
      </span>

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-48 pointer-events-none">
        <div className="ui-tooltip text-center p-2">
          <strong className={`${iconClass} block mb-1`}>{name} XP</strong>
          {tooltipLines.map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < tooltipLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-ui-border" />
      </div>

    </div>
  );
};

export default AttributeRow;
