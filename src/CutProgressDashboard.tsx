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
import NotesFeed from './components/NotesFeed';
import WeeklyScheduleCard from './components/WeeklyScheduleCard';
import WeeklyDebriefCard from './components/WeeklyDebriefCard';
import { computeWeeklyDebrief, computeCoachInsights } from './utils/insightEngine';
import DataIntegrityBanner from './components/DataIntegrityBanner';
import RiskAlertPanel from './components/RiskAlertPanel';
import { computeDataWarnings } from './utils/dataIntegrity';
import { computeRiskAlerts } from './utils/riskEngine';
import { deriveConsistencyGameState } from './utils/consistencyGame';
import { computeSessionXP } from './utils/xpDelta';
import { deriveRankState } from './utils/rankSystem';

type RangeKey = 'all' | '30d' | '14d' | '7d';
const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '7d',  label: 'Last 7D'  },
  { key: '14d', label: 'Last 14D' },
  { key: '30d', label: 'Last 30D' },
  { key: 'all', label: 'All'      },
];

export default function CutProgressDashboard() {
  const [fixSwaps, setFixSwaps] = useState(true);
  const [simulatedOneOff, setSimulatedOneOff] = useState(0);
  const [simulatedDaily, setSimulatedDaily] = useState(0);
  const [rangeKey, setRangeKey] = useState<RangeKey>('all');

  const allChartData = useMemo(() => {
    const cleaned = applyWaistSwapFix(rawData as DayEntry[], fixSwaps);
    return compute7DayAvg(cleaned);
  }, [fixSwaps]);

  const chartData = useMemo(() => {
    const limits: Record<RangeKey, number> = { '7d': 7, '14d': 14, '30d': 30, 'all': Infinity };
    const limit = limits[rangeKey];
    return limit === Infinity ? allChartData : allChartData.slice(-limit);
  }, [allChartData, rangeKey]);

  const projectionStats = useMemo(() => (
    computeProjectionStats(rawData as DayEntry[], simulatedOneOff, simulatedDaily)
  ), [simulatedOneOff, simulatedDaily]);

  // Always use full dataset for persistent/cumulative stats
  const latestData = allChartData[allChartData.length - 1];
  const currentAvg = latestData.weightAvg ?? 0;
  const latestWeight = latestData.weight ?? currentAvg;

  const totalDays = allChartData.length;
  const passDays = allChartData.filter(d => d.status === 'Pass').length;
  const adherencePercent = Math.round((passDays / totalDays) * 100);

  const currentStreak = latestData?.streak || 0;
  const currentShield = latestData?.shield || 0;
  const shieldPercent = Math.min(100, Math.max(0, (currentShield / MAX_SHIELD) * 100));
  const numericWeights = allChartData.flatMap((d) => (typeof d.weight === 'number' ? [d.weight] : []));
  const peakWeight = numericWeights.length ? Math.max(...numericWeights) : latestWeight;
  const fromPeak = +(peakWeight - latestWeight).toFixed(1);
  const lowestNavelVal = Math.min(...allChartData.map((d) => d.waistNavel).filter((v): v is number => v != null));
  const lowestNavel = Number.isFinite(lowestNavelVal) ? lowestNavelVal : (latestData.waistNavel ?? 0);

  const latestAttributes: Attributes = latestData?.attributes || {
    vitality: { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
    discipline: { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
    strength: { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
    resilience: { level: 1, currentLvlXp: 0, nextLvlXp: 100 }
  };

  const radarMax = useMemo(() => {
    const maxLevel = Math.max(
      latestAttributes.strength.level,
      latestAttributes.vitality.level,
      latestAttributes.resilience.level,
      latestAttributes.discipline.level,
    );
    // Scale: always show at least 5 rings worth; cap at 10
    return Math.min(10, Math.max(5, maxLevel + 2));
  }, [latestAttributes]);

  const radarData = useMemo(() => [
    { subject: 'Strength',   level: latestAttributes.strength.level,   fullMark: radarMax },
    { subject: 'Vitality',   level: latestAttributes.vitality.level,   fullMark: radarMax },
    { subject: 'Resilience', level: latestAttributes.resilience.level, fullMark: radarMax },
    { subject: 'Discipline', level: latestAttributes.discipline.level, fullMark: radarMax },
  ], [latestAttributes, radarMax]);

  // Cumulative/persistent: always use full dataset
  const trophies = useMemo(() => (
    allChartData
      .filter(d => d.isBossFight && d.status === 'Pass' && d.bossName)
      .map(d => d.bossName as string)
  ), [allChartData]);

  const gameState = useMemo(() => deriveConsistencyGameState(allChartData), [allChartData]);
  const dataWarnings = useMemo(() => computeDataWarnings(allChartData), [allChartData]);
  const riskAlerts = useMemo(() => computeRiskAlerts(allChartData), [allChartData]);
  const weeklyDebrief = useMemo(() => computeWeeklyDebrief(allChartData), [allChartData]);
  const sessionXP = useMemo(() => computeSessionXP(allChartData), [allChartData]);
  const rankState = useMemo(() => deriveRankState(allChartData), [allChartData]);

  // Range-sensitive: use filtered chartData
  const coachInsights = useMemo(() => computeCoachInsights(chartData), [chartData]);

  const NAV_SECTIONS = [
    { id: 'overview',    label: 'Overview'    },
    { id: 'attributes',  label: 'Attributes'  },
    { id: 'consistency', label: 'Consistency' },
    { id: 'stats',       label: 'Stats'       },
    { id: 'projections', label: 'Projections' },
    { id: 'charts',      label: 'Charts'      },
  ];

  return (
    <>
      {/* Sticky nav */}
      <nav className="sticky top-0 z-50 bg-[#060b12]/90 backdrop-blur-md border-b border-ui-border/40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center">
          <div className="flex items-center overflow-x-auto scrollbar-hide shrink-0">
            {NAV_SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-[10px] uppercase tracking-[0.14em] font-semibold text-ui-muted hover:text-amber-300 px-4 py-3 transition-colors whitespace-nowrap border-b-2 border-transparent hover:border-amber-400/50"
              >
                {s.label}
              </a>
            ))}
          </div>
          {/* Today's missions — persistent in nav */}
          <div className="ml-auto pl-4 hidden md:flex items-center gap-2 shrink-0 py-2">
            {gameState.missions.map(m => (
              <div
                key={m.id}
                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border font-semibold whitespace-nowrap ${
                  m.pending    ? 'border-blue-500/40 text-blue-300 bg-blue-500/10' :
                  m.completed  ? 'border-green-500/40 text-green-300 bg-green-500/10' :
                                 'border-red-500/40 text-red-400 bg-red-500/10'
                }`}
              >
                <span>{m.title}:</span>
                <span>{m.targetText}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

    <div className="ui-page-shell">
      <div className="ui-page-width">

        {/* Header */}
        <div id="overview" className="ui-card-dark ui-card-interactive p-6">
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
                  return `Metabolic Audit & Linear Cut Block (${fmt(allChartData[0].date)} – ${fmt(latestData.date)})`;
                })()}
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end mt-2 md:mt-0">
              <div className="ui-control-rail">
                <button onClick={() => setFixSwaps(true)} className={`ui-control-btn ${fixSwaps ? 'ui-control-btn-active' : ''}`}>Auto-Fix Waist Data</button>
                <button onClick={() => setFixSwaps(false)} className={`ui-control-btn ${!fixSwaps ? 'ui-control-btn-active' : ''}`}>Raw Logs</button>
              </div>
              <div className="ui-control-rail">
                {RANGE_OPTIONS.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setRangeKey(r.key)}
                    className={`ui-control-btn ${rangeKey === r.key ? 'ui-control-btn-active' : ''}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-ui-border/70 flex gap-2 items-start">
            <span className="text-ui-primary text-xl font-bold leading-none mt-0.5 select-none">"</span>
            <p className="text-sm text-slate-300 italic leading-relaxed flex-1">{MISSION_STATEMENT}</p>
            <span className="text-ui-primary text-xl font-bold leading-none self-end mb-0.5 select-none">"</span>
          </div>
          {dataWarnings.length > 0 && (
            <div className="mt-4">
              <DataIntegrityBanner warnings={dataWarnings} />
            </div>
          )}
        </div>

        <WeeklyScheduleCard latestDate={latestData.date} />

        {/* Risk alerts */}
        {riskAlerts.length > 0 && <RiskAlertPanel alerts={riskAlerts} />}

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

          <div id="attributes">
            <HeroIdentitySection
              latestAttributes={latestAttributes}
              radarData={radarData}
              radarMax={radarMax}
              tier={latestData.tier}
              rankState={rankState}
            />
          </div>

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

        <div id="consistency"><ConsistencyEngineSection gameState={gameState} /></div>
        {weeklyDebrief && <WeeklyDebriefCard debrief={weeklyDebrief} />}

        {/* KPI Cards */}
        <div id="stats" className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <div id="projections" />
        <ProjectionModule
          projectionStats={projectionStats}
          simulatedOneOff={simulatedOneOff}
          setSimulatedOneOff={setSimulatedOneOff}
          simulatedDaily={simulatedDaily}
          setSimulatedDaily={setSimulatedDaily}
        />

        <div id="charts"><ChartsSection chartData={chartData} coachInsights={coachInsights} /></div>

        <InputsSection chartData={chartData} coachInsights={coachInsights} />

        <NotesFeed chartData={chartData} />

      </div>
    </div>
    </>
  );
}
