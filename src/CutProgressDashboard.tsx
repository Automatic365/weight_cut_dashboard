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
import { deriveRankState } from './utils/rankSystem';

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
  const currentAvg = latestData.weightAvg ?? 0;
  const latestWeight = latestData.weight ?? currentAvg;

  const totalDays = chartData.length;
  const passDays = chartData.filter(d => d.status === 'Pass').length;
  const adherencePercent = Math.round((passDays / totalDays) * 100);

  const currentStreak = latestData?.streak || 0;
  const currentShield = latestData?.shield || 0;
  const shieldPercent = Math.min(100, Math.max(0, (currentShield / MAX_SHIELD) * 100));
  const numericWeights = chartData.flatMap((d) => (typeof d.weight === 'number' ? [d.weight] : []));
  const peakWeight = numericWeights.length ? Math.max(...numericWeights) : latestWeight;
  const fromPeak = +(peakWeight - latestWeight).toFixed(1);
  const lowestNavelVal = Math.min(...chartData.map((d) => d.waistNavel).filter((v): v is number => v != null));
  const lowestNavel = Number.isFinite(lowestNavelVal) ? lowestNavelVal : (latestData.waistNavel ?? 0);

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
  const rankState = useMemo(() => deriveRankState(chartData), [chartData]);

  return (
    <div className="ui-page-shell">
      <div className="ui-page-width">

        {/* Header */}
        <div className="ui-card-dark ui-card-interactive p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-display font-semibold text-ui-text flex items-center gap-2">
                <Activity className="text-ui-primary" />
                Combat Nutrition Progress
              </h1>
              <p className="text-ui-muted text-sm mt-1">
                {(() => {
                  const fmt = (mmdd: string) => {
                    const [m, d] = mmdd.split('/');
                    return new Date(2026, +m - 1, +d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  };
                  return `Metabolic Audit & Linear Cut Block (${fmt(chartData[0].date)} – ${fmt(latestData.date)})`;
                })()}
              </p>
            </div>
            <div className="ui-control-rail">
              <button onClick={() => setFixSwaps(true)} className={`ui-control-btn ${fixSwaps ? 'ui-control-btn-active' : ''}`}>Auto-Fix Waist Data</button>
              <button onClick={() => setFixSwaps(false)} className={`ui-control-btn ${!fixSwaps ? 'ui-control-btn-active' : ''}`}>Raw Logs</button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-ui-border/70 flex gap-2 items-start">
            <span className="text-ui-primary text-xl font-bold leading-none mt-0.5 select-none">"</span>
            <p className="text-sm text-slate-300 italic leading-relaxed flex-1">{MISSION_STATEMENT}</p>
            <span className="text-ui-primary text-xl font-bold leading-none self-end mb-0.5 select-none">"</span>
          </div>
        </div>

        {/* Adherence Heatmap & Stats */}
        <div className="ui-card p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h2 className="ui-section-title">
              <CheckCircle2 className="text-green-500" size={20} />
              Behavioral Adherence Tracker
            </h2>
            <div className="text-sm font-medium bg-ui-surface-2 px-3 py-1 rounded-full mt-2 md:mt-0 border border-ui-border text-ui-text">
              Pass Rate: <span className={`${adherencePercent >= ADHERENCE_LOW ? 'text-green-400' : 'text-amber-300'} font-bold`}>{adherencePercent}%</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {chartData.map((day, i) => <HeatmapCell key={i} day={day} />)}
          </div>

          <div className="text-xs text-ui-muted mt-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1"><div className="ui-legend-dot bg-green-500"></div> Controlled & Compliant</div>
            <div className="flex items-center gap-1"><div className="ui-legend-dot bg-orange-500"></div> Slip / Unplanned Flex</div>
            <div className="flex items-center gap-1"><div className="ui-legend-dot bg-[#dba104] shadow-[0_0_4px_rgba(219,161,4,0.5)]"></div> Boss Defeated</div>
            <div className="flex items-center gap-1"><div className="ui-legend-dot bg-red-600"></div> Boss Critical Hit / &lt;85%</div>
          </div>

          {/* Combat Readiness */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Shield Bar */}
            <div className="rounded-ui-lg border border-ui-border bg-ui-surface-2/50 p-4 flex flex-col justify-center">
              <div className="flex justify-between items-end mb-2">
                <div className="text-sm font-bold text-ui-text flex items-center gap-1.5"><Shield size={16} className="text-blue-500" /> Tactical Shield</div>
                <div className="text-xs font-semibold text-ui-muted text-right">{currentShield} / {MAX_SHIELD} Charges</div>
              </div>
              <div className="w-full h-3 bg-ui-border/70 rounded-full overflow-hidden flex">
                <div className={`h-full transition-all duration-1000 ${currentShield === MAX_SHIELD ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-blue-400'}`} style={{ width: `${shieldPercent}%` }}></div>
              </div>
              <div className="text-[10px] text-ui-muted mt-2 text-center text-balance">
                {currentShield === MAX_SHIELD ? 'Shield fully charged. Ready for next Boss Encounter.' : 'Complete disciplined days to recharge shield.'}
              </div>
            </div>

            {/* Trophies & Streak */}
            <div className="rounded-ui-lg border border-ui-border bg-ui-surface-2/50 p-4 flex justify-between items-center">
              <div>
                <div className="ui-kpi-label">Active Streak</div>
                <div className="text-3xl font-bold flex items-center gap-2">
                  {currentStreak} <span className="text-sm font-normal text-ui-muted">days</span>
                  {currentStreak >= 7 && <Flame size={20} className="text-orange-500 shrink-0" />}
                </div>
              </div>
              <div className="text-right border-l border-ui-border pl-4">
                <div className="ui-kpi-label flex items-center justify-end gap-1">
                  <Trophy size={11} className="text-amber-500" /> Trophies
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {trophies.length > 0 ? trophies.map((boss, idx) => (
                    <div key={idx} className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-ui-sm border border-amber-200 shadow-sm" title={`Defeated Boss: ${boss}`}>
                      {boss}
                    </div>
                  )) : (
                    <div className="text-[10px] text-ui-muted/70 italic mt-1">No Bosses Defeated Yet</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <HeroIdentitySection
            latestAttributes={latestAttributes}
            radarData={radarData}
            tier={latestData.tier}
            rankState={rankState}
          />

          <CoachAnalysis colorScheme="green" className="mt-4">
            <li>
              <strong className="text-emerald-200 font-semibold">Consistency &gt; Perfection:</strong> A pass rate of {adherencePercent}% means the system is working. Physique is built by stacking 85–90% disciplined weeks.
            </li>
            <li>
              <strong className="text-emerald-200 font-semibold">Controlled Leakage:</strong> Your "Fails" (like the Feb 14th Valentine's or Feb 21st Buffet) were contained. You stopped eating, you didn't spiral, and you returned to structure the next morning.
            </li>
            <li>
              <strong className="text-emerald-200 font-semibold">Actionable Takeaway:</strong> A single slip does not erase a week of green days. Keep your adherence above 90% and the math will take care of the fat loss.
            </li>
          </CoachAnalysis>
        </div>

        {sessionXP && <LastSessionXP session={sessionXP} />}

        <ConsistencyEngineSection gameState={gameState} />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="ui-stat-card">
            <div className="flex justify-between items-center text-ui-muted mb-2">
              <span className="text-sm font-semibold">Current Weight</span>
              <span className="ui-stat-icon"><Scale size={16} /></span>
            </div>
            <div className="text-3xl font-bold">{latestWeight} <span className="text-base font-normal text-ui-muted">lbs</span></div>
            <div className="text-xs text-green-400 font-medium mt-2 flex items-center gap-1"><TrendingDown size={14} /> From Peak: -{fromPeak} lbs</div>
          </div>

          <div className="ui-stat-card">
            <div className="flex justify-between items-center text-ui-muted mb-2">
              <span className="text-sm font-semibold">7-Day Trend (Avg)</span>
              <span className="ui-stat-icon"><Activity size={16} /></span>
            </div>
            <div className="text-3xl font-bold">{currentAvg} <span className="text-base font-normal text-ui-muted">lbs</span></div>
            <div className="text-xs text-ui-muted font-medium mt-2">Coach KPI metric</div>
          </div>

          <div className="ui-stat-card">
            <div className="flex justify-between items-center text-ui-muted mb-2">
              <span className="text-sm font-semibold">Abdomen (Navel)</span>
              <span className="ui-stat-icon"><Ruler size={16} /></span>
            </div>
            <div className="text-3xl font-bold">{latestData.waistNavel?.toFixed(2)} <span className="text-base font-normal text-ui-muted">in</span></div>
            <div className="text-xs text-ui-muted font-medium mt-2">Lowest recorded: {lowestNavel.toFixed(2)}"</div>
          </div>

          <div className="ui-stat-card">
            <div className="flex justify-between items-center text-ui-muted mb-2">
              <span className="text-sm font-semibold">Block Status</span>
              <span className="ui-stat-icon"><Activity size={16} /></span>
            </div>
            <div className="text-xl font-bold text-ui-primary">{latestData.tier === 'Linear' ? 'Linear Cut' : latestData.tier}</div>
            <div className="text-xs text-ui-muted font-medium mt-2">Target: 1550-1650 kcal</div>
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
