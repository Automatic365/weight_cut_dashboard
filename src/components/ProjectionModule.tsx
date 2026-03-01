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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white">
        <div className="flex items-center gap-2 mb-5">
          <Target size={22} className="text-blue-300" />
          <h2 className="text-xl font-bold tracking-wide">{GOAL_WEIGHT} lbs Goal Projection</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Distance to Goal */}
          <div className="bg-white/10 rounded-xl p-5 border border-white/20 flex flex-col justify-center">
            <div className="text-blue-200 text-sm font-medium mb-1">Distance to Goal</div>
            <div className="text-4xl font-bold">{projectionStats.lbsRemaining} <span className="text-lg font-normal opacity-80">lbs</span></div>
            <div className="text-sm font-medium text-blue-200 mt-2 flex justify-between items-center">
              <span>Baseline Rate:</span>
              <span className="text-white font-semibold">{projectionStats.historicalRate} lbs/wk</span>
            </div>
          </div>

          {/* Interactive Simulation Card */}
          <div className="bg-white/20 rounded-xl p-5 border-2 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">INTERACTIVE</div>
            <div className="text-amber-200 text-sm font-bold mb-2 flex items-center gap-1.5 relative z-10">
              <Lightbulb size={16} /> Simulated Trajectory
            </div>

            <div className="space-y-4 relative z-10">
              {/* Slider 1: One-Off Event */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-white/80">One-Off Event</span>
                  <span className="font-mono bg-white/10 px-1 rounded">{simulatedOneOff > 0 ? '+' : ''}{simulatedOneOff} kcal</span>
                </div>
                <input
                  type="range"
                  min="-7000" max="7000" step="500"
                  value={simulatedOneOff}
                  onChange={(e) => setSimulatedOneOff(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
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
                  <span className="font-mono bg-white/10 px-1 rounded">{simulatedDaily > 0 ? '+' : ''}{simulatedDaily} kcal/day</span>
                </div>
                <input
                  type="range"
                  min="-1000" max="1000" step="100"
                  value={simulatedDaily}
                  onChange={(e) => setSimulatedDaily(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-white/50 mt-1">
                  <span>Extra Deficit</span>
                  <span>Extra Surplus</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/20 flex flex-col relative z-10">
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
                  className="absolute bottom-0 right-0 text-[10px] text-white/60 hover:text-white bg-white/10 px-2 py-1 rounded transition-colors"
                >
                  Reset Math
                </button>
              )}
            </div>
          </div>

          {/* Target Protocol Rate */}
          <div className="bg-white/10 rounded-xl p-5 border border-white/20 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute -right-4 -bottom-4 opacity-5"><Target size={120} /></div>
            <div className="text-blue-200 text-sm font-medium mb-1 relative z-10">Target Protocol Rate</div>
            <div className="text-4xl font-bold relative z-10">{projectionStats.targetRate} <span className="text-lg font-normal opacity-80">lbs/wk</span></div>
            <div className="text-sm font-medium text-blue-200 mt-2 flex items-center gap-1 relative z-10">
              <CalendarDays size={14} /> Hits Goal: <span className="text-white font-semibold ml-1">{projectionStats.dateTarget}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-4 border-t border-slate-100">
        <div className="flex gap-2">
          <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-1">
            <p><strong className="text-slate-800">The Arithmetic:</strong> At {projectionStats.historicalRate} lbs/week, you are squarely inside the coach's realistic and sustainable target band (0.8–1.0 lb/week).</p>
            <p><strong className="text-slate-800">Actionable Takeaway:</strong> Stop chasing aggressive volatility. The math proves that the "boring" linear process will get you to {GOAL_WEIGHT} lbs by early May without crashing your metabolism.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectionModule;
