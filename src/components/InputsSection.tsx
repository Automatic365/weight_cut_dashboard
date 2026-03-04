import React, { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { Utensils, Moon, Dumbbell } from 'lucide-react';
import CoachAnalysis from './CoachAnalysis';
import {
  LINEAR_TARGET_CALORIES, TIER2_TARGET_CALORIES,
  SLEEP_GOAL, SLEEP_FRICTION_DISPLAY, PROTEIN_FLOOR,
} from '../config';
import type { ChartDayEntry } from '../types';
import type { CoachInsights } from '../utils/insightEngine';

interface InputsSectionProps {
  chartData: ChartDayEntry[];
  coachInsights: CoachInsights;
}

// Secondary input charts: Caloric Intake, Sleep & Recovery Friction, and Protein Compliance.
const InputsSection: React.FC<InputsSectionProps> = ({ chartData, coachInsights }) => {
  // Sleep → next-day pass rate correlation
  const sleepCorrelation = useMemo(() => {
    let lowSleepNextDayPass = 0, lowSleepCount = 0;
    let totalPass = 0;
    for (let i = 0; i < chartData.length; i++) {
      if (chartData[i].status === 'Pass') totalPass++;
      if (i > 0 && chartData[i - 1].sleep != null && chartData[i - 1].sleep! < SLEEP_FRICTION_DISPLAY) {
        lowSleepCount++;
        if (chartData[i].status === 'Pass') lowSleepNextDayPass++;
      }
    }
    const overallRate = Math.round((totalPass / chartData.length) * 100);
    const lowSleepRate = lowSleepCount > 0 ? Math.round((lowSleepNextDayPass / lowSleepCount) * 100) : null;
    return { overallRate, lowSleepRate, lowSleepCount };
  }, [chartData]);

  // Protein compliance stats
  const proteinStats = useMemo(() => {
    const tracked = chartData.filter(d => d.protein != null && d.protein > 0);
    const met = tracked.filter(d => d.protein! >= PROTEIN_FLOOR).length;
    return {
      complianceRate: tracked.length > 0 ? Math.round((met / tracked.length) * 100) : null,
      trackedDays: tracked.length,
    };
  }, [chartData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Caloric Intake Chart */}
      <div className="ui-card ui-card-interactive p-6 flex flex-col justify-between">
        <div>
          <h2 className="ui-section-title mb-1">
            <Utensils className="text-ui-accent" size={20} />
            Caloric Intake vs. Target
          </h2>
          <p className="text-xs text-ui-muted mb-4">Values at 0 reflect Tier 3 Fasting days.</p>
          <div className="ui-chart-wrap h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#314560" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8ea2bd' }} tickMargin={10} minTickGap={20} />
                <YAxis domain={[0, 3200]} tick={{ fontSize: 12, fill: '#8ea2bd' }} />
                <Tooltip cursor={{ fill: 'rgba(92,166,255,0.12)' }} contentStyle={{ borderRadius: '12px', border: '1px solid #27374f', backgroundColor: '#0f1724', boxShadow: '0 12px 24px rgba(4, 9, 18, 0.35)' }} labelStyle={{ color: '#e5edf8' }} itemStyle={{ color: '#c8d7eb' }} />
                <ReferenceLine y={LINEAR_TARGET_CALORIES} stroke="#22c55e" strokeDasharray="4 4" label={{ position: 'top', value: `Linear Target (${LINEAR_TARGET_CALORIES})`, fill: '#16a34a', fontSize: 11 }} />
                <ReferenceLine y={TIER2_TARGET_CALORIES} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Tier 2 Target', fill: '#94a3b8', fontSize: 11 }} />
                <Bar dataKey="calories" name="Calories" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <CoachAnalysis colorScheme="orange" className="mt-4">
          {coachInsights.calories.map((line, i) => (
            <li key={i}><span className="text-amber-100">{line}</span></li>
          ))}
        </CoachAnalysis>
      </div>

      {/* Sleep / Recovery Chart */}
      <div className="ui-card ui-card-interactive p-6 flex flex-col justify-between">
        <div>
          <h2 className="ui-section-title mb-1">
            <Moon className="text-ui-primary" size={20} />
            Sleep & Recovery Friction
          </h2>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-ui-muted">Dips below 6.5 hrs correlate directly with higher craving days.</p>
            {sleepCorrelation.lowSleepRate !== null && (
              <div className="text-right shrink-0 ml-4">
                <div className="text-[9px] text-ui-muted uppercase tracking-widest">After &lt;6.5h sleep</div>
                <div className="text-sm font-bold">
                  <span className={sleepCorrelation.lowSleepRate < sleepCorrelation.overallRate ? 'text-red-400' : 'text-green-400'}>
                    {sleepCorrelation.lowSleepRate}%
                  </span>
                  <span className="text-[10px] text-ui-muted font-normal ml-1">pass rate</span>
                </div>
                <div className="text-[9px] text-ui-muted">vs {sleepCorrelation.overallRate}% overall</div>
              </div>
            )}
          </div>
          <div className="ui-chart-wrap h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#314560" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8ea2bd' }} tickMargin={10} minTickGap={20} />
                <YAxis domain={[4, 9]} tick={{ fontSize: 12, fill: '#8ea2bd' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #27374f', backgroundColor: '#0f1724', boxShadow: '0 12px 24px rgba(4, 9, 18, 0.35)' }} labelStyle={{ color: '#e5edf8' }} itemStyle={{ color: '#c8d7eb' }} />
                <ReferenceLine y={SLEEP_GOAL} stroke="#22c55e" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: '7hr Goal', fill: '#16a34a', fontSize: 11 }} />
                <ReferenceLine y={SLEEP_FRICTION_DISPLAY} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Friction Threshold', fill: '#ef4444', fontSize: 11 }} />
                <Line type="monotone" dataKey="sleep" name="Sleep (Hrs)" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} connectNulls={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <CoachAnalysis colorScheme="indigo" className="mt-4">
          {coachInsights.sleep.map((line, i) => (
            <li key={i}><span className="text-sky-100">{line}</span></li>
          ))}
        </CoachAnalysis>
      </div>

      {/* Protein Compliance Chart */}
      <div className="ui-card ui-card-interactive p-6 flex flex-col justify-between lg:col-span-2">
        <div>
          <div className="flex items-start justify-between mb-1">
            <h2 className="ui-section-title">
              <Dumbbell className="text-red-400" size={20} />
              Protein Compliance
            </h2>
            {proteinStats.complianceRate !== null && (
              <div className="text-right">
                <div className="text-[9px] text-ui-muted uppercase tracking-widest">Floor Met</div>
                <div className="text-sm font-bold">
                  <span className={proteinStats.complianceRate >= 80 ? 'text-green-400' : 'text-amber-400'}>
                    {proteinStats.complianceRate}%
                  </span>
                  <span className="text-[10px] text-ui-muted font-normal ml-1">of logged days</span>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-ui-muted mb-4">
            Daily protein intake vs {PROTEIN_FLOOR}g floor. Hitting this target is required for Strength XP and muscle preservation during the cut.
          </p>
          <div className="ui-chart-wrap h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#314560" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8ea2bd' }} tickMargin={10} minTickGap={20} />
                <YAxis domain={[0, 260]} tick={{ fontSize: 12, fill: '#8ea2bd' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(239,68,68,0.08)' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #27374f', backgroundColor: '#0f1724', boxShadow: '0 12px 24px rgba(4,9,18,0.35)' }}
                  labelStyle={{ color: '#e5edf8' }}
                  itemStyle={{ color: '#c8d7eb' }}
                />
                <ReferenceLine
                  y={PROTEIN_FLOOR}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ position: 'top', value: `${PROTEIN_FLOOR}g Floor`, fill: '#ef4444', fontSize: 11 }}
                />
                <Bar dataKey="protein" name="Protein (g)" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <CoachAnalysis colorScheme="orange" className="mt-4">
          {coachInsights.protein.map((line, i) => (
            <li key={i}><span className="text-amber-100">{line}</span></li>
          ))}
        </CoachAnalysis>
      </div>

    </div>
  );
};

export default InputsSection;
