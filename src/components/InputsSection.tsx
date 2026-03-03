import React from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';
import { Utensils, Moon } from 'lucide-react';
import CoachAnalysis from './CoachAnalysis';
import {
  LINEAR_TARGET_CALORIES, TIER2_TARGET_CALORIES,
  SLEEP_GOAL, SLEEP_FRICTION_DISPLAY,
} from '../config';
import type { ChartDayEntry } from '../types';

interface InputsSectionProps {
  chartData: ChartDayEntry[];
}

// Secondary input charts: Caloric Intake and Sleep & Recovery Friction.
const InputsSection: React.FC<InputsSectionProps> = ({ chartData }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Caloric Intake Chart */}
      <div className="ui-card p-6 flex flex-col justify-between">
        <div>
          <h2 className="ui-section-title mb-1">
            <Utensils className="text-ui-accent" size={20} />
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
                <ReferenceLine y={LINEAR_TARGET_CALORIES} stroke="#22c55e" strokeDasharray="4 4" label={{ position: 'top', value: `Linear Target (${LINEAR_TARGET_CALORIES})`, fill: '#16a34a', fontSize: 11 }} />
                <ReferenceLine y={TIER2_TARGET_CALORIES} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Tier 2 Target', fill: '#94a3b8', fontSize: 11 }} />
                <Bar dataKey="calories" name="Calories" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <CoachAnalysis colorScheme="orange" className="mt-4">
          <li>
            <strong className="text-amber-200 font-semibold">Linear Stability:</strong> The shift to a linear target reduced the early volatility seen in the tier cycling phase.
          </li>
          <li>
            <strong className="text-amber-200 font-semibold">Protein Floor:</strong> Hitting 190g+ consistently is the muscle-protection anchor during the cut.
          </li>
          <li>
            <strong className="text-amber-200 font-semibold">Actionable Takeaway:</strong> Keep compliance boring and repeatable instead of chasing aggressive calorie swings.
          </li>
        </CoachAnalysis>
      </div>

      {/* Sleep / Recovery Chart */}
      <div className="ui-card p-6 flex flex-col justify-between">
        <div>
          <h2 className="ui-section-title mb-1">
            <Moon className="text-ui-primary" size={20} />
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
                <ReferenceLine y={SLEEP_GOAL} stroke="#22c55e" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: '7hr Goal', fill: '#16a34a', fontSize: 11 }} />
                <ReferenceLine y={SLEEP_FRICTION_DISPLAY} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Friction Threshold', fill: '#ef4444', fontSize: 11 }} />
                <Line type="monotone" dataKey="sleep" name="Sleep (Hrs)" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} connectNulls={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <CoachAnalysis colorScheme="indigo" className="mt-4">
          <li>
            <strong className="text-sky-200 font-semibold">6.5hr Threshold:</strong> Fail/slip risk rises sharply when sleep falls below this range.
          </li>
          <li>
            <strong className="text-sky-200 font-semibold">Willpower vs. Fatigue:</strong> Low sleep increases cognitive friction and makes novelty food harder to resist.
          </li>
          <li>
            <strong className="text-sky-200 font-semibold">Actionable Takeaway:</strong> On low-sleep days, pre-commit meals earlier to avoid reactive decisions.
          </li>
        </CoachAnalysis>
      </div>

    </div>
  );
};

export default InputsSection;
