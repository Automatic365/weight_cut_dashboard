import React from 'react';
import { Target, Lightbulb, CalendarDays } from 'lucide-react';
import { GOAL_WEIGHT } from '../config';
import type { ProjectionStats } from '../types';

interface ProjectionModuleProps {
  projectionStats: ProjectionStats;
  simulatedOneOff: number;
  setSimulatedOneOff: React.Dispatch<React.SetStateAction<number>>;
  simulatedDaily: number;
  setSimulatedDaily: React.Dispatch<React.SetStateAction<number>>;
}

// Goal Projection section: distance-to-goal display, interactive simulation sliders, and target rate card.
const ProjectionModule: React.FC<ProjectionModuleProps> = ({
  projectionStats,
  simulatedOneOff, setSimulatedOneOff,
  simulatedDaily, setSimulatedDaily,
}) => {
  return (
    <div className="ui-card ui-card-interactive overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-[#102136] to-[#152a46] p-6 text-white border-b border-ui-border/60">
        <div className="ui-kicker text-ui-primary/80 mb-2">Projection Console</div>
        <div className="flex items-center gap-2 mb-5">
          <Target size={22} className="text-ui-primary" />
          <h2 className="text-xl font-display font-semibold tracking-wide">{GOAL_WEIGHT} lbs Goal Projection</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Distance to Goal */}
          <div className="bg-ui-surface-2/70 rounded-ui-lg p-5 border border-ui-border/80 flex flex-col justify-center">
            <div className="text-ui-primary text-sm font-medium mb-1">Distance to Goal</div>
            <div className="text-4xl font-bold">{projectionStats.lbsRemaining} <span className="text-lg font-normal opacity-80">lbs</span></div>
            <div className="text-sm font-medium text-ui-muted mt-2 flex justify-between items-center">
              <span>Baseline Rate:</span>
              <span className="text-white font-semibold">{projectionStats.historicalRate} lbs/wk</span>
            </div>
          </div>

          {/* Interactive Simulation Card */}
          <div className="bg-ui-surface-2/70 rounded-ui-lg p-5 border border-amber-400/50 shadow-ui-glow-accent relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-ui-accent text-[#20150a] text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">INTERACTIVE</div>
            <div className="text-amber-200 text-sm font-display font-semibold mb-2 flex items-center gap-1.5 relative z-10">
              <Lightbulb size={16} /> Simulated Trajectory
            </div>

            <div className="space-y-4 relative z-10">
              {/* Slider 1: One-Off Event */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/80">One-Off Event</span>
                  <span className="font-mono bg-ui-surface/80 px-1 rounded">{simulatedOneOff > 0 ? '+' : ''}{simulatedOneOff} kcal</span>
                </div>
                <input
                  type="range"
                  min="-7000" max="7000" step="500"
                  value={simulatedOneOff}
                  onChange={(e) => setSimulatedOneOff(Number(e.target.value))}
                  className="ui-slider"
                />
                <div className="flex justify-between text-[10px] text-white/50 mt-1">
                  <span>-48h Fast</span>
                  <span>+Bad Binge</span>
                </div>
              </div>

              {/* Slider 2: Daily Habit Change */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/80">Daily Habit +/-</span>
                  <span className="font-mono bg-ui-surface/80 px-1 rounded">{simulatedDaily > 0 ? '+' : ''}{simulatedDaily} kcal/day</span>
                </div>
                <input
                  type="range"
                  min="-1000" max="1000" step="100"
                  value={simulatedDaily}
                  onChange={(e) => setSimulatedDaily(Number(e.target.value))}
                  className="ui-slider"
                />
                <div className="flex justify-between text-[10px] text-white/50 mt-1">
                  <span>Extra Deficit</span>
                  <span>Extra Surplus</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-ui-border/80 flex flex-col relative z-10">
              <div className="text-2xl font-bold text-amber-300">
                {projectionStats.simulatedRate} <span className="text-sm font-normal opacity-80 text-white">lbs/wk</span>
              </div>
              <div className="text-sm font-medium text-amber-100 mt-1 flex items-center gap-1">
                <CalendarDays size={14} /> Hits Goal: <span className="text-white font-bold ml-1 bg-amber-500/20 px-1.5 py-0.5 rounded">{projectionStats.dateSimulated}</span>
              </div>

              {/* Quick Reset Button visible when active */}
              {(simulatedOneOff !== 0 || simulatedDaily !== 0) && (
                <button
                  onClick={() => { setSimulatedOneOff(0); setSimulatedDaily(0); }}
                  className="absolute bottom-0 right-0 text-[10px] text-white/70 hover:text-white bg-ui-surface/70 px-2 py-1 rounded transition-colors"
                >
                  Reset Math
                </button>
              )}
            </div>
          </div>

          {/* Target Protocol Rate */}
          <div className="bg-ui-surface-2/70 rounded-ui-lg p-5 border border-ui-border/80 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute -right-4 -bottom-4 opacity-5"><Target size={120} /></div>
            <div className="text-ui-primary text-sm font-medium mb-1 relative z-10">Target Protocol Rate</div>
            <div className="text-4xl font-bold relative z-10">{projectionStats.targetRate} <span className="text-lg font-normal opacity-80">lbs/wk</span></div>
            <div className="text-sm font-medium text-ui-muted mt-2 flex items-center gap-1 relative z-10">
              <CalendarDays size={14} /> Hits Goal: <span className="text-white font-semibold ml-1">{projectionStats.dateTarget}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-ui-surface-2/45 p-4 border-t border-ui-border/70">
        <div className="flex gap-2">
          <Lightbulb size={16} className="text-ui-accent shrink-0 mt-0.5" />
          <div className="text-xs text-ui-muted space-y-1">
            <p><strong className="text-ui-text">The Arithmetic:</strong> At {projectionStats.historicalRate} lbs/week, you are inside a sustainable fat-loss range.</p>
            <p><strong className="text-ui-text">Actionable Takeaway:</strong> Keep the linear process steady; consistency gets you to {GOAL_WEIGHT} without metabolic whiplash.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectionModule;
