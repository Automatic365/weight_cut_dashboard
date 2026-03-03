import React from 'react';
import { Zap, Dumbbell, Heart, Brain, Shield, TrendingUp } from 'lucide-react';
import type { Attributes } from '../types';
import type { SessionXP } from '../utils/xpDelta';

const ATTR_META: Record<keyof Attributes, {
  icon: React.FC<{ size?: number; className?: string }>;
  colorClass: string;
}> = {
  strength:   { icon: Dumbbell, colorClass: 'text-red-400'    },
  vitality:   { icon: Heart,    colorClass: 'text-green-400'  },
  discipline: { icon: Brain,    colorClass: 'text-purple-400' },
  resilience: { icon: Shield,   colorClass: 'text-blue-400'   },
};

interface LastSessionXPProps {
  session: SessionXP;
}

const LastSessionXP: React.FC<LastSessionXPProps> = ({ session }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
          <Zap size={16} className="text-amber-400" /> Last Session XP
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">{session.date}</span>
      </div>

      {/* Per-attribute rows */}
      <div className="space-y-2.5">
        {session.gains.map(g => {
          const meta = ATTR_META[g.attribute];
          const Icon = meta.icon;
          const isPos = g.delta > 0;
          const isNeg = g.delta < 0;
          return (
            <div key={g.attribute} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={14} className={meta.colorClass} />
                <span className="text-xs text-slate-300 font-medium w-20">{g.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {g.didLevelUp && (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    <TrendingUp size={9} /> Lvl {g.newLevel}
                  </span>
                )}
                <span className={`text-xs font-bold tabular-nums w-14 text-right ${
                  isPos ? 'text-green-400' : isNeg ? 'text-red-400' : 'text-slate-500'
                }`}>
                  {isPos ? '+' : ''}{g.delta} XP
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Session Total</span>
        <span className={`text-sm font-bold ${
          session.total > 0 ? 'text-green-400' :
          session.total < 0 ? 'text-red-400'   : 'text-slate-400'
        }`}>
          {session.total > 0 ? '+' : ''}{session.total} XP
        </span>
      </div>

    </div>
  );
};

export default LastSessionXP;
