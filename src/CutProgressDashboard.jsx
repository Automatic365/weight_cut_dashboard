import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  TrendingDown, Scale, Activity, Ruler, Info, Target,
  CalendarDays, CheckCircle2, XCircle, Moon, Utensils, Lightbulb,
  Shield, Flame, Trophy, Heart, Dumbbell, Brain
} from 'lucide-react';

// Enriched data with Calories, Protein, Sleep, and Adherence Status
import rawData from './data.json';

// Custom Dot for Weight Chart to show context
const CustomWeightDot = (props) => {
  const { cx, cy, payload } = props;

  if (!cx || !cy) return null;

  let fill = "#3b82f6"; // Default Blue (Linear/Tier 2)
  let stroke = "#fff";

  if (payload.status === 'Fail') {
    fill = "#f59e0b"; // Orange/Yellow for slips
  } else if (payload.tier === 'Tier 1') {
    fill = "#ef4444"; // Red for Hard Muay Thai
  } else if (payload.tier === 'Tier 3') {
    fill = "#22c55e"; // Green for Fasting
  }

  return (
    <circle cx={cx} cy={cy} r={5} fill={fill} stroke={stroke} strokeWidth={2} />
  );
};

export default function CutProgressDashboard() {
  const [fixSwaps, setFixSwaps] = useState(true);

  // Interactive Projection States
  const [simulatedOneOff, setSimulatedOneOff] = useState(0); // +/- calories (one time)
  const [simulatedDaily, setSimulatedDaily] = useState(0);   // +/- calories (every day)

  // Process data
  const chartData = useMemo(() => {
    const cleanedData = rawData.map(day => {
      let navel = day.waistNavel;
      let plus2 = day.waistPlus2;

      if (fixSwaps && navel && plus2 && plus2 > navel + 0.5) {
        navel = day.waistPlus2;
        plus2 = day.waistNavel;
      }
      return { ...day, waistNavel: navel, waistPlus2: plus2 };
    });

    return cleanedData.map((row, index, arr) => {
      let sum = 0, count = 0;
      for (let i = Math.max(0, index - 6); i <= index; i++) {
        if (arr[i].weight) { sum += arr[i].weight; count++; }
      }
      return {
        ...row,
        weightAvg: count > 0 ? Number((sum / count).toFixed(1)) : null
      };
    });
  }, [fixSwaps]);

  // Goal Projection Calculations
  const projectionStats = useMemo(() => {
    const startWeight = rawData[0].weight;
    const currentWeight = rawData[rawData.length - 1].weight;
    let lbsRemaining = currentWeight - 155;

    // --- APPLY SIMULATIONS ---
    // 1. One-Off Event: 3,500 kcal = 1lb
    const oneOffLbsEffect = simulatedOneOff / 3500;
    lbsRemaining += oneOffLbsEffect;

    // Safety check if user simulates eating their way out of the goal entirely
    if (lbsRemaining < 0) lbsRemaining = 0;

    const parseDate = (dateStr) => {
      const [month, day] = dateStr.split('/');
      return new Date(2026, parseInt(month) - 1, parseInt(day));
    };

    const startDate = parseDate(rawData[0].date);
    const endDate = parseDate(rawData[rawData.length - 1].date);
    const daysElapsed = (endDate - startDate) / (1000 * 60 * 60 * 24);

    const lbsLost = startWeight - currentWeight;
    const historicalRatePerWeek = (lbsLost / daysElapsed) * 7;

    // 2. Daily Habit Event: 500 kcal daily deficit = 1lb per week
    const dailyLbsEffectPerWeek = simulatedDaily / 500;
    let simulatedRatePerWeek = historicalRatePerWeek - dailyLbsEffectPerWeek;
    // Example: If burn is 1 lb/wk, and user adds +500 daily: 1 - 1 = 0 burn rate.
    // Ensure we don't divide by zero or negative if they simulate a huge surplus.
    if (simulatedRatePerWeek <= 0.05) simulatedRatePerWeek = 0.05;

    const targetRatePerWeek = 1.0;

    const daysRemainingSimulated = (lbsRemaining / simulatedRatePerWeek) * 7;
    const daysRemainingTarget = (lbsRemaining / targetRatePerWeek) * 7;

    const projectedDateSimulated = new Date(endDate);
    projectedDateSimulated.setDate(projectedDateSimulated.getDate() + daysRemainingSimulated);

    const projectedDateTarget = new Date(endDate);
    projectedDateTarget.setDate(projectedDateTarget.getDate() + daysRemainingTarget);

    return {
      historicalRate: historicalRatePerWeek.toFixed(2),
      simulatedRate: simulatedRatePerWeek.toFixed(2),
      targetRate: targetRatePerWeek.toFixed(2),
      lbsRemaining: lbsRemaining.toFixed(1),
      dateSimulated: projectedDateSimulated.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dateTarget: projectedDateTarget.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
  }, [simulatedOneOff, simulatedDaily]);

  const latestData = chartData[chartData.length - 1];
  const currentAvg = latestData.weightAvg;

  // Calculate adherence stats
  const totalDays = chartData.length;
  const passDays = chartData.filter(d => d.status === 'Pass').length;
  const adherencePercent = Math.round((passDays / totalDays) * 100);

  // Gamification Stats
  const currentStreak = latestData?.streak || 0;
  const currentShield = latestData?.shield || 0;
  const shieldPercent = Math.min(100, Math.max(0, (currentShield / 14) * 100));

  const latestAttributes = latestData?.attributes || {
    vitality: { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
    discipline: { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
    strength: { level: 1, currentLvlXp: 0, nextLvlXp: 100 },
    resilience: { level: 1, currentLvlXp: 0, nextLvlXp: 100 }
  };

  const radarData = useMemo(() => {
    return [
      { subject: 'Strength', level: latestAttributes.strength.level, fullMark: Math.max(10, latestAttributes.strength.level + 2) },
      { subject: 'Vitality', level: latestAttributes.vitality.level, fullMark: Math.max(10, latestAttributes.vitality.level + 2) },
      { subject: 'Resilience', level: latestAttributes.resilience.level, fullMark: Math.max(10, latestAttributes.resilience.level + 2) },
      { subject: 'Discipline', level: latestAttributes.discipline.level, fullMark: Math.max(10, latestAttributes.discipline.level + 2) },
    ];
  }, [latestAttributes]);

  // Get all earned trophies (Defeated Bosses)
  const trophies = useMemo(() => {
    return chartData
      .filter(d => d.isBossFight && d.status === 'Pass' && d.bossName)
      .map(d => d.bossName);
  }, [chartData]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="text-blue-600" />
              Combat Nutrition Progress
            </h1>
            <p className="text-slate-500 text-sm mt-1">Metabolic Audit & Linear Cut Block (Jan 19 - Feb 25)</p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setFixSwaps(true)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${fixSwaps ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Auto-Fix Waist Data</button>
            <button onClick={() => setFixSwaps(false)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!fixSwaps ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Raw Logs</button>
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
              Pass Rate: <span className={`${adherencePercent >= 85 ? 'text-green-600' : 'text-amber-600'} font-bold`}>{adherencePercent}%</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {chartData.map((day, i) => (
              <div
                key={i}
                className={`group relative w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold text-white transition-transform hover:scale-110 cursor-help
                  ${day.isBossFight
                    ? (day.status === 'Pass' ? 'bg-[#dba104] shadow-[0_0_8px_rgba(219,161,4,0.6)] z-10' : 'bg-red-600 shadow-inner')
                    : (day.adherenceScore && day.adherenceScore < 85
                      ? 'bg-red-500 shadow-inner'
                      : (day.status === 'Pass' ? 'bg-green-500 shadow-sm' : 'bg-orange-500 shadow-inner'))}`}
              >
                {day.isBossFight
                  ? (day.status === 'Pass' ? <Trophy size={16} /> : <XCircle size={16} />)
                  : (day.status === 'Pass' ? <CheckCircle2 size={16} /> : <XCircle size={16} />)}

                {/* Custom Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
                  <div className="bg-slate-900 text-white text-xs rounded-md py-1.5 px-3 whitespace-nowrap shadow-xl border border-slate-700">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{day.date}</span>
                      <span className="text-slate-400">|</span>
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
                          <span className={`${day.adherenceScore < 85 ? 'text-red-400' : 'text-green-400'} font-medium`}>{day.adherenceScore}%</span>
                        </div>
                      )}
                      {day.shield != null && (
                        <div className="flex justify-between gap-3 text-slate-300">
                          <span>Shield:</span>
                          <span className="font-medium text-blue-300">{day.shield}/14</span>
                        </div>
                      )}
                      {day.isBossFight && (
                        <div className="flex justify-between gap-3 text-amber-300 mt-0.5 pt-0.5 border-t border-slate-700">
                          <span>Boss:</span>
                          <span className="font-medium">{day.bossName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Tooltip Arrow */}
                  <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500 mt-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Controlled & Compliant</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded-sm"></div> Slip / Unplanned Flex</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#dba104] rounded-sm shadow-[0_0_4px_rgba(219,161,4,0.5)]"></div> Boss Defeated</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-600 rounded-sm"></div> Boss Critical Hit / &lt;85%</div>
          </div>

          {/* Combat Readiness (Gamification) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Shield Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-center">
              <div className="flex justify-between items-end mb-2">
                <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Shield size={16} className="text-blue-500" /> Tactical Shield</div>
                <div className="text-xs font-semibold text-slate-500 text-right">{currentShield} / 14 Charges</div>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                <div className={`h-full transition-all duration-1000 ${currentShield === 14 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-blue-400'}`} style={{ width: `${shieldPercent}%` }}></div>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 text-center text-balance">
                {currentShield === 14 ? 'Shield fully charged. Ready for next Boss Encounter.' : 'Complete disciplined days to recharge shield.'}
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

          {/* RPG Hero Attributes */}
          <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-inner">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-1 uppercase tracking-wider">
              Hero Attributes
            </h3>
            <div className="text-xs text-slate-400 mb-4">Level Progression (Max Lvl 10)</div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="w-full md:w-1/2 h-64 flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                    <Radar
                      name="Hero Level"
                      dataKey="level"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.5}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                      itemStyle={{ color: '#c4b5fd' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex flex-col justify-between" title="Strength: Hitting protein floor (>=190g) and logging workouts (Muay Thai, lifting, etc).">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                    <Dumbbell size={14} className="text-red-400" /> Strength
                  </div>
                  <div className="text-xl font-black text-white">Lvl {latestAttributes.strength.level}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{latestAttributes.strength.currentLvlXp}/{latestAttributes.strength.nextLvlXp} XP</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex flex-col justify-between" title="Vitality: Consistent sleep. >7 hours grants XP, <6 hours loses XP.">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                    <Heart size={14} className="text-green-400" /> Vitality
                  </div>
                  <div className="text-xl font-black text-white">Lvl {latestAttributes.vitality.level}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{latestAttributes.vitality.currentLvlXp}/{latestAttributes.vitality.nextLvlXp} XP</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex flex-col justify-between" title="Discipline: High adherence (>90%) and logging workouts. Drops significantly if adherence is <85%.">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                    <Brain size={14} className="text-purple-400" /> Discipline
                  </div>
                  <div className="text-xl font-black text-white">Lvl {latestAttributes.discipline.level}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{latestAttributes.discipline.currentLvlXp}/{latestAttributes.discipline.nextLvlXp} XP</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex flex-col justify-between" title="Resilience: Boss encounters. Huge XP for surviving, penalty for taking a Critical Hit from a Boss.">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-2">
                    <Shield size={14} className="text-blue-400" /> Resilience
                  </div>
                  <div className="text-xl font-black text-white">Lvl {latestAttributes.resilience.level}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{latestAttributes.resilience.currentLvlXp}/{latestAttributes.resilience.nextLvlXp} XP</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-green-50/50 border border-green-100/80 rounded-xl p-4">
            <h3 className="text-sm font-bold text-green-900 flex items-center gap-1.5 mb-2">
              <Lightbulb size={16} className="text-amber-500" />
              Coach's Analysis
            </h3>
            <ul className="text-xs text-green-800/90 space-y-2">
              <li>
                <strong className="text-green-900 font-semibold">Consistency &gt; Perfection:</strong> A pass rate of {adherencePercent}% means the system is working. Physique is built by stacking 85–90% disciplined weeks.
              </li>
              <li>
                <strong className="text-green-900 font-semibold">Controlled Leakage:</strong> Your "Fails" (like the Feb 14th Valentine's or Feb 21st Buffet) were contained. You stopped eating, you didn't spiral, and you returned to structure the next morning.
              </li>
              <li>
                <strong className="text-green-900 font-semibold">Actionable Takeaway:</strong> A single slip does not erase a week of green days. Keep your adherence above 90% and the math will take care of the fat loss.
              </li>
            </ul>
          </div>
        </div>

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

        {/* Projection Module */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white">
            <div className="flex items-center gap-2 mb-5">
              <Target size={22} className="text-blue-300" />
              <h2 className="text-xl font-bold tracking-wide">155 lbs Goal Projection</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-xl p-5 border border-white/20 flex flex-col justify-center">
                <div className="text-blue-200 text-sm font-medium mb-1">Distance to Goal</div>
                <div className="text-4xl font-bold">{projectionStats.lbsRemaining} <span className="text-lg font-normal opacity-80">lbs</span></div>
                <div className="text-sm font-medium text-blue-200 mt-2 flex justify-between items-center">
                  <span>Baseline Rate:</span>
                  <span className="text-white font-semibold">{projectionStats.historicalRate} lbs/wk</span>
                </div>
              </div>

              {/* INTERACTIVE SIMULATION CARD */}
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
                <p><strong className="text-slate-800">Actionable Takeaway:</strong> Stop chasing aggressive volatility. The math proves that the "boring" linear process will get you to 155 lbs by early May without crashing your metabolism.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Outputs (Lagging Indicators) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weight Chart with Context */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2">Body Weight Trend & Context</h2>
              <p className="text-xs text-slate-500 mb-4">Dots indicate training load & physiological context.</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={10} minTickGap={20} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />

                    <Line type="monotone" dataKey="weightAvg" name="7-Day Avg" stroke="#94a3b8" strokeWidth={3} dot={false} connectNulls={true} />
                    <Line type="monotone" dataKey="weight" name="Daily Weight" stroke="#cbd5e1" strokeWidth={1} activeDot={{ r: 6 }} connectNulls={true} dot={<CustomWeightDot />} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2 mb-4 text-xs text-slate-500">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Hard (Tier 1)</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Standard</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Fast (Tier 3)</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Slip/Flex</div>
              </div>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                <Lightbulb size={16} className="text-amber-500" />
                Coach's Analysis
              </h3>
              <ul className="text-xs text-slate-600 space-y-2">
                <li>
                  <strong className="text-slate-800 font-semibold">Effort Theater vs. Data Stability:</strong> Look at the 7-day average line. It filters out the daily noise and shows a clear downward slope.
                </li>
                <li>
                  <strong className="text-slate-800 font-semibold">Contextual Spikes:</strong> Notice the red dots (Tier 1 Muay Thai days like Feb 10). They are almost always followed by a weight spike due to inflammation and glycogen refill, <em className="italic">not fat gain</em>.
                </li>
                <li>
                  <strong className="text-slate-800 font-semibold">Actionable Takeaway:</strong> Do not emotionally react to one weigh-in. Do not tighten calories after a post-training water bump. Trust the moving average.
                </li>
              </ul>
            </div>
          </div>

          {/* Waist Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">Abdomen & Waist Compression</h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={10} minTickGap={20} />
                    <YAxis domain={[31, 34.5]} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line type="monotone" dataKey="waistNavel" name="Abdomen (Navel)" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} connectNulls={true} />
                    <Line type="monotone" dataKey="waistPlus2" name="Waist (+2&quot;)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} connectNulls={true} />
                    <Line type="monotone" dataKey="waistMinus2" name="Below Abdomen" stroke="#cbd5e1" strokeWidth={2} dot={{ r: 2 }} connectNulls={true} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-4 mt-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                <Lightbulb size={16} className="text-amber-500" />
                Coach's Analysis
              </h3>
              <ul className="text-xs text-slate-600 space-y-2">
                <li>
                  <strong className="text-slate-800 font-semibold">True Tissue Loss:</strong> The waist measurement (+2") establishes the true floor for fat loss. It has consistently compressed down toward the low 31" range.
                </li>
                <li>
                  <strong className="text-slate-800 font-semibold">Gut Volume Noise:</strong> The abdomen (navel) fluctuates far more dramatically due to digestion, food volume, and sodium.
                </li>
                <li>
                  <strong className="text-slate-800 font-semibold">Actionable Takeaway:</strong> When the scale stalls but the waist (+2") stays tight, it confirms recomposition and fat loss are still occurring.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Secondary Inputs (Leading Indicators) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Caloric Intake Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                <Utensils className="text-orange-500" size={20} />
                Caloric Intake vs. Target
              </h2>
              <p className="text-xs text-slate-500 mb-4">Values at 0 reflect Tier 3 Fasting days.</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={10} minTickGap={20} />
                    <YAxis domain={[0, 3200]} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <ReferenceLine y={1600} stroke="#22c55e" strokeDasharray="4 4" label={{ position: 'top', value: 'Linear Target (1600)', fill: '#16a34a', fontSize: 11 }} />
                    <ReferenceLine y={2400} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Tier 2 Target', fill: '#94a3b8', fontSize: 11 }} />
                    <Bar dataKey="calories" name="Calories" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 bg-orange-50/50 border border-orange-100/80 rounded-xl p-4">
              <h3 className="text-sm font-bold text-orange-900 flex items-center gap-1.5 mb-2">
                <Lightbulb size={16} className="text-amber-500" />
                Coach's Analysis
              </h3>
              <ul className="text-xs text-orange-800/90 space-y-2">
                <li>
                  <strong className="text-orange-900 font-semibold">The Shift to Linear:</strong> Notice the volatility of the Tier 1/2/3 cycles in late January, compared to the steady execution of the 1,600 kcal "Linear Target" starting Feb 12.
                </li>
                <li>
                  <strong className="text-orange-900 font-semibold">The Protein Floor:</strong> Across almost all days, your logs show high compliance with hitting the non-negotiable &gt;190g protein floor, protecting muscle mass.
                </li>
                <li>
                  <strong className="text-orange-900 font-semibold">Actionable Takeaway:</strong> Boring linear compliance works. Avoid the temptation to slash calories further just to speed things up; it only increases the risk of a binge.
                </li>
              </ul>
            </div>
          </div>

          {/* Sleep / Recovery Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                <Moon className="text-indigo-500" size={20} />
                Sleep & Recovery Friction
              </h2>
              <p className="text-xs text-slate-500 mb-4">Dips below 6.5 hrs correlate directly with higher craving days.</p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} tickMargin={10} minTickGap={20} />
                    <YAxis domain={[4, 9]} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <ReferenceLine y={7} stroke="#22c55e" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: '7hr Goal', fill: '#16a34a', fontSize: 11 }} />
                    <ReferenceLine y={6.5} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Friction Threshold', fill: '#ef4444', fontSize: 11 }} />
                    <Line type="monotone" dataKey="sleep" name="Sleep (Hrs)" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} connectNulls={true} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 bg-indigo-50/40 border border-indigo-100/60 rounded-xl p-4">
              <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5 mb-2">
                <Lightbulb size={16} className="text-amber-500" />
                Coach's Analysis
              </h3>
              <ul className="text-xs text-indigo-800/80 space-y-2">
                <li>
                  <strong className="text-indigo-900 font-semibold">The 6.5hr Threshold:</strong> Both recorded "Fail/Slip" days (Feb 14, Feb 21) happened on or right after sleep dipped to 6.5 hours or below.
                </li>
                <li>
                  <strong className="text-indigo-900 font-semibold">Willpower vs. Fatigue:</strong> As noted explicitly in your logs on Feb 15 (6.3 hrs sleep): <em className="text-slate-600 block mt-0.5 border-l-2 border-indigo-200 pl-2">"Mental fatigue: 10/10... Not a food-control issue; cognitive load + sleep restriction."</em>
                </li>
                <li>
                  <strong className="text-indigo-900 font-semibold">Actionable Takeaway:</strong> When sleep falls below the red dotted line, your brain actively seeks high-stimulation foods (sugar/fat) to compensate for low energy. Rigid pre-plating is critical on these days.
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
