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
                <ReferenceLine y={LINEAR_TARGET_CALORIES} stroke="#22c55e" strokeDasharray="4 4" label={{ position: 'top', value: `Linear Target (${LINEAR_TARGET_CALORIES})`, fill: '#16a34a', fontSize: 11 }} />
                <ReferenceLine y={TIER2_TARGET_CALORIES} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'Tier 2 Target', fill: '#94a3b8', fontSize: 11 }} />
                <Bar dataKey="calories" name="Calories" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <CoachAnalysis colorScheme="orange" className="mt-4">
          <li>
            <strong className="text-orange-900 font-semibold">The Shift to Linear:</strong> Notice the volatility of the Tier 1/2/3 cycles in late January, compared to the steady execution of the 1,600 kcal "Linear Target" starting Feb 12.
          </li>
          <li>
            <strong className="text-orange-900 font-semibold">The Protein Floor:</strong> Across almost all days, your logs show high compliance with hitting the non-negotiable &gt;190g protein floor, protecting muscle mass.
          </li>
          <li>
            <strong className="text-orange-900 font-semibold">Actionable Takeaway:</strong> Boring linear compliance works. Avoid the temptation to slash calories further just to speed things up; it only increases the risk of a binge.
          </li>
        </CoachAnalysis>
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
                <ReferenceLine y={SLEEP_GOAL} stroke="#22c55e" strokeDasharray="4 4" label={{ position: 'insideTopLeft', value: '7hr Goal', fill: '#16a34a', fontSize: 11 }} />
                <ReferenceLine y={SLEEP_FRICTION_DISPLAY} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Friction Threshold', fill: '#ef4444', fontSize: 11 }} />
                <Line type="monotone" dataKey="sleep" name="Sleep (Hrs)" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} connectNulls={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <CoachAnalysis colorScheme="indigo" className="mt-4">
          <li>
            <strong className="text-indigo-900 font-semibold">The 6.5hr Threshold:</strong> Both recorded "Fail/Slip" days (Feb 14, Feb 21) happened on or right after sleep dipped to 6.5 hours or below.
          </li>
          <li>
            <strong className="text-indigo-900 font-semibold">Willpower vs. Fatigue:</strong> As noted explicitly in your logs on Feb 15 (6.3 hrs sleep): <em className="text-slate-600 block mt-0.5 border-l-2 border-indigo-200 pl-2">"Mental fatigue: 10/10... Not a food-control issue; cognitive load + sleep restriction."</em>
          </li>
          <li>
            <strong className="text-indigo-900 font-semibold">Actionable Takeaway:</strong> When sleep falls below the red dotted line, your brain actively seeks high-stimulation foods (sugar/fat) to compensate for low energy. Rigid pre-plating is critical on these days.
          </li>
        </CoachAnalysis>
      </div>

    </div>
  );
};

export default InputsSection;
