import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface AttributeCardProps {
  name: string;
  icon: LucideIcon;
  iconClass: string;
  level: number;
  currentLvlXp: number;
  nextLvlXp: number;
  tooltipAccentClass: string;
  tooltipLines: string[];
}

// Single RPG attribute card for the Hero Identity section.
const AttributeCard: React.FC<AttributeCardProps> = ({ name, icon: Icon, iconClass, level, currentLvlXp, nextLvlXp, tooltipAccentClass, tooltipLines }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex flex-col justify-between relative group cursor-help">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
        <Icon size={14} className={iconClass} /> {name}
      </div>
      <div className="text-xl font-black text-white">Lvl {level}</div>
      <div className="text-[10px] text-slate-400 mt-1">{currentLvlXp}/{nextLvlXp} XP</div>

      {/* Custom Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-48 pointer-events-none">
        <div className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] leading-tight rounded-md p-2 shadow-xl text-center">
          <strong className={`${tooltipAccentClass} block mb-1`}>{name} XP</strong>
          {tooltipLines.map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < tooltipLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        {/* Tooltip Arrow */}
        <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
      </div>
    </div>
  );
};

export default AttributeCard;
