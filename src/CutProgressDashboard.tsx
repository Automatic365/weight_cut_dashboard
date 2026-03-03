import { useState, useMemo } from 'react';
import {
  TrendingDown, Scale, Activity, Ruler,
  CheckCircle2, Shield, Flame, Trophy
} from 'lucide-react';

import rawData from './data.json';
import { MAX_SHIELD, ADHERENCE_LOW, MISSION_STATEMENT } from './config';
import { applyWaistSwapFix, compute7DayAvg, computeProjectionStats } from './utils/dataProcessing';
import type { DayEntry, Attributes } from './types';

import HeatmapCell from './components/HeatmapCell';
import HeroIdentitySection from './components/HeroIdentitySection';
import CoachAnalysis from './components/CoachAnalysis';
import ProjectionModule from './components/ProjectionModule';
import ChartsSection from './components/ChartsSection';
import InputsSection from './components/InputsSection';
import ConsistencyEngineSection from './components/ConsistencyEngineSection';
import LastSessionXP from './components/LastSessionXP';
import { deriveConsistencyGameState } from './utils/consistencyGame';
import { computeSessionXP } from './utils/xpDelta';

export default function CutProgressDashboard() {
  const [fixSwaps, setFixSwaps] = useState(true);
  const [simulatedOneOff, setSimulatedOneOff] = useState(0);
  const [simulatedDaily, setSimulatedDaily] = useState(0);

  const chartData = useMemo(() => {
    const cleaned = applyWaistSwapFix(rawData as DayEntry[], fixSwaps);
    return compute7DayAvg(cleaned);
  }, [fixSwaps]);

  const projectionStats = useMemo(() => (
    computeProjectionStats(rawData as DayEntry[], simulatedOneOff, simulatedDaily)
  ), [simulatedOneOff, simulatedDaily]);

  const latestData = chartData[chartData.length - 1];
  const currentAvg = latestData.weightAvg;

  const totalDays = chartData.length;
  const passDays = chartData.filter(d => d.status === 'Pass').length;
  const adherencePercent = Math.round((passDays / totalDays) * 100);

  const currentStreak = latestData?.streak || 0;
  const currentShield = latestData?.shield || 0;
  const shieldPercent = Math.min(100, Math.max(0, (currentShield / MAX_SHIELD) * 100));

  const latestAttributes: Attributes = latestData?.attributes || {
    vitality: { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
    discipline: { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
    strength: { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
    resilience: { level: 1, currentLvlXp: 0, nextLvlXp: 100 }
  };

  const radarData = useMemo(() => [
    { subject: 'Strength', level: latestAttributes.strength.level, fullMark: Math.max(10, latestAttributes.strength.level + 2) },
    { subject: 'Vitality', level: latestAttributes.vitality.level, fullMark: Math.max(10, latestAttributes.vitality.level + 2) },
    { subject: 'Resilience', level: latestAttributes.resilience.level, fullMark: Math.max(10, latestAttributes.resilience.level + 2) },
    { subject: 'Discipline', level: latestAttributes.discipline.level, fullMark: Math.max(10, latestAttributes.discipline.level + 2) },
  ], [latestAttributes]);

  const trophies = useMemo(() => (
    chartData
      .filter(d => d.isBossFight && d.status === 'Pass' && d.bossName)
      .map(d => d.bossName as string)
  ), [chartData]);

  const gameState = useMemo(() => deriveConsistencyGameState(chartData), [chartData]);
  const sessionXP = useMemo(() => computeSessionXP(chartData), [chartData]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="text-blue-600" />
                Combat Nutrition Progress
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {(() => {
                  const fmt = (mmdd: string) => {
                    const [m, d] = mmdd.split('/');
                    return new Date(2026, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  };
                  return `Metabolic Audit & Linear Cut Block (${fmt(chartData[0].date)} – ${fmt(latestData.date)})`;
                })()}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
              <button onClick={() => setFixSwaps(true)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${fixSwaps ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Auto-Fix Waist Data</button>
              <button onClick={() => setFixSwaps(false)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!fixSwaps ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Raw Logs</button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2 items-start">
            <span className="text-blue-400 text-xl font-bold leading-none mt-0.5 select-none">"</span>
            <p className="text-sm text-slate-600 italic leading-relaxed flex-1">{MISSION_STATEMENT}</p>
            <span className="text-blue-400 text-xl font-bold leading-none self-end mb-0.5 select-none">"</span>
          </div>
        </div>

        {/* Adherence Heatmap & Stats */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="text-green-500" size={20} />
              Behavioral Adherence Tracker
            </h2>
            <div className="text-sm font-medium bg-slate-100 px-3 py-1 rounded-full mt-2 md:mt-0">
              Pass Rate: <span className={`${adherencePercent >= ADHERENCE_LOW ? 'text-green-600' : 'text-amber-600'} font-bold`}>{adherencePercent}%</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {chartData.map((day, i) => <HeatmapCell key={i} day={day} />)}
          </div>

          <div className="text-xs text-slate-500 mt-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Controlled & Compliant</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded-sm"></div> Slip / Unplanned Flex</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#dba104] rounded-sm shadow-[0_0_4px_rgba(219,161,4,0.5)]"></div> Boss Defeated</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-600 rounded-sm"></div> Boss Critical Hit / &lt;85%</div>
          </div>

          {/* Combat Readiness */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Shield Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center">
              <div className="flex justify-between items-end mb-2">
                <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Shield size={16} className="text-blue-500" /> Tactical Shield</div>
                <div className="text-xs font-semibold text-slate-500 text-right">{currentShield} / {MAX_SHIELD} Charges</div>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div className={`h-full transition-all duration-1000 ${currentShield === MAX_SHIELD ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-blue-400'}`} style={{ width: `${shieldPercent}%` }}></div>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 text-center text-balance">
                {currentShield === MAX_SHIELD ? 'Shield fully charged. Ready for next Boss Encounter.' : 'Complete disciplined days to recharge shield.'}
              </div>
            </div>

            {/* Trophies & Streak */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
              <div>
                <div className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-widest">Active Streak</div>
                <div className="text-3xl font-bold flex items-center gap-2">
                  {currentStreak} <span className="text-sm font-normal text-slate-500">days</span>
                  {currentStreak >= 7 && <Flame size={20} className="text-orange-500 shrink-0" />}
                </div>
              </div>
              <div className="text-right border-l border-slate-200 pl-4">
                <div className="text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-widest flex items-center justify-end gap-1">
                  <Trophy size={11} className="text-amber-500" /> Trophies
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {trophies.length > 0 ? trophies.map((boss, idx) => (
                    <div key={idx} className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded border border-amber-200 shadow-sm" title={`Defeated Boss: ${boss}`}>
                      {boss}
                    </div>
                  )) : (
                    <div className="text-[10px] text-slate-400 italic mt-1">No Bosses Defeated Yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <HeroIdentitySection
            latestAttributes={latestAttributes}
            radarData={radarData}
            tier={latestData.tier}
            ladderTierLabel={gameState.ladderTierLabel}
          />

          <CoachAnalysis colorScheme="green" className="mt-4">
            <li>
              <strong className="text-green-900 font-semibold">Consistency &gt; Perfection:</strong> A pass rate of {adherencePercent}% means the system is working. Physique is built by stacking 85–90% disciplined weeks.
            </li>
            <li>
              <strong className="text-green-900 font-semibold">Controlled Leakage:</strong> Your "Fails" (like the Feb 14th Valentine's or Feb 21st Buffet) were contained. You stopped eating, you didn't spiral, and you returned to structure the next morning.
            </li>
            <li>
              <strong className="text-green-900 font-semibold">Actionable Takeaway:</strong> A single slip does not erase a week of green days. Keep your adherence above 90% and the math will take care of the fat loss.
            </li>
          </CoachAnalysis>
        </div>

        {sessionXP && <LastSessionXP session={sessionXP} />}

        <ConsistencyEngineSection gameState={gameState} />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-sm font-semibold">Current Weight</span>
              <Scale size={18} />
            </div>
            <div className="text-3xl font-bold">{latestData.weight} <span className="text-base font-normal text-slate-500">lbs</span></div>
            <div className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1"><TrendingDown size={14} /> From Peak: -4.6 lbs</div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-sm font-semibold">7-Day Trend (Avg)</span>
              <Activity size={18} />
            </div>
            <div className="text-3xl font-bold">{currentAvg} <span className="text-base font-normal text-slate-500">lbs</span></div>
            <div className="text-xs text-slate-500 font-medium mt-2">Coach KPI metric</div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-sm font-semibold">Abdomen (Navel)</span>
              <Ruler size={18} />
            </div>
            <div className="text-3xl font-bold">{latestData.waistNavel?.toFixed(2)} <span className="text-base font-normal text-slate-500">in</span></div>
            <div className="text-xs text-slate-500 font-medium mt-2">Lowest recorded: 31.39"</div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div className="flex justify-between items-center text-slate-500 mb-2">
              <span className="text-sm font-semibold">Block Status</span>
              <Activity size={18} />
            </div>
            <div className="text-xl font-bold text-blue-700">Linear Cut</div>
            <div className="text-xs text-slate-500 font-medium mt-2">Target: 1550-1650 kcal</div>
          </div>
        </div>

        <ProjectionModule
          projectionStats={projectionStats}
          simulatedOneOff={simulatedOneOff}
          setSimulatedOneOff={setSimulatedOneOff}
          simulatedDaily={simulatedDaily}
          setSimulatedDaily={setSimulatedDaily}
        />

        <ChartsSection chartData={chartData} />

        <InputsSection chartData={chartData} />

      </div>
    </div>
  );
}
