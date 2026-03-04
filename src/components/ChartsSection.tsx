import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Activity, Ruler } from 'lucide-react';
import CustomWeightDot from './CustomWeightDot';
import CoachAnalysis from './CoachAnalysis';
import type { ChartDayEntry } from '../types';

interface ChartsSectionProps {
  chartData: ChartDayEntry[];
}

// Primary output charts: Body Weight Trend and Abdomen/Waist Compression.
const ChartsSection: React.FC<ChartsSectionProps> = ({ chartData }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* Weight Chart */}
      <div className="ui-card ui-card-interactive p-6 flex flex-col justify-between">
        <div>
          <h2 className="ui-section-title mb-1">
            <Activity className="text-ui-primary" size={20} />
            Body Weight Trend & Context
          </h2>
          <p className="text-xs text-ui-muted mb-4">Dots indicate training load & physiological context.</p>
          <div className="ui-chart-wrap h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#314560" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8ea2bd' }} tickMargin={10} minTickGap={20} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 12, fill: '#8ea2bd' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #27374f', backgroundColor: '#0f1724', boxShadow: '0 12px 24px rgba(4, 9, 18, 0.35)' }} labelStyle={{ color: '#e5edf8' }} itemStyle={{ color: '#c8d7eb' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#c8d7eb' }} />
                <Line type="monotone" dataKey="weightAvg" name="7-Day Avg" stroke="#94a3b8" strokeWidth={3} dot={false} connectNulls={true} />
                <Line type="monotone" dataKey="weight" name="Daily Weight" stroke="#cbd5e1" strokeWidth={1} activeDot={{ r: 6 }} connectNulls={true} dot={<CustomWeightDot />} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 mb-4 text-xs text-ui-muted">
            <div className="flex items-center gap-1"><div className="ui-legend-dot rounded-full w-2 h-2 bg-red-500"></div> Hard (Tier 1)</div>
            <div className="flex items-center gap-1"><div className="ui-legend-dot rounded-full w-2 h-2 bg-blue-500"></div> Standard</div>
            <div className="flex items-center gap-1"><div className="ui-legend-dot rounded-full w-2 h-2 bg-green-500"></div> Fast (Tier 3)</div>
            <div className="flex items-center gap-1"><div className="ui-legend-dot rounded-full w-2 h-2 bg-amber-500"></div> Slip/Flex</div>
          </div>
        </div>

        <CoachAnalysis colorScheme="slate">
          <li>
            <strong className="text-slate-100 font-semibold">Trend vs. Noise:</strong> The 7-day average filters daily noise and shows the real direction of change.
          </li>
          <li>
            <strong className="text-slate-100 font-semibold">Contextual Spikes:</strong> Hard training days often create temporary scale bumps from inflammation and glycogen, not fat gain.
          </li>
          <li>
            <strong className="text-slate-100 font-semibold">Actionable Takeaway:</strong> React to moving averages, not single weigh-ins.
          </li>
        </CoachAnalysis>
      </div>

      {/* Waist Chart */}
      <div className="ui-card ui-card-interactive p-6 flex flex-col justify-between">
        <div>
          <h2 className="ui-section-title mb-4">
            <Ruler className="text-ui-accent" size={20} />
            Abdomen & Waist Compression
          </h2>
          <div className="ui-chart-wrap h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#314560" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#8ea2bd' }} tickMargin={10} minTickGap={20} />
                <YAxis domain={[31, 34.5]} tick={{ fontSize: 12, fill: '#8ea2bd' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #27374f', backgroundColor: '#0f1724', boxShadow: '0 12px 24px rgba(4, 9, 18, 0.35)' }} labelStyle={{ color: '#e5edf8' }} itemStyle={{ color: '#c8d7eb' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#c8d7eb' }} />
                <Line type="monotone" dataKey="waistNavel" name="Abdomen (Navel)" stroke="#f59e0b" strokeWidth={2.75} dot={{ r: 3, fill: '#f59e0b' }} connectNulls={true} />
                <Line type="monotone" dataKey="waistPlus2" name="Waist (+2&quot;)" stroke="#5ca6ff" strokeWidth={2.25} dot={{ r: 2.5, fill: '#5ca6ff' }} connectNulls={true} />
                <Line type="monotone" dataKey="waistMinus2" name="Below Abdomen" stroke="#34d399" strokeWidth={2.25} dot={{ r: 2.5, fill: '#34d399' }} connectNulls={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <CoachAnalysis colorScheme="slate" className="mt-4">
          <li>
            <strong className="text-slate-100 font-semibold">True Tissue Signal:</strong> Waist (+2") is your cleaner fat-loss marker and has compressed toward the low 31" range.
          </li>
          <li>
            <strong className="text-slate-100 font-semibold">Gut Volume Noise:</strong> Navel readings fluctuate more from digestion, food volume, and sodium.
          </li>
          <li>
            <strong className="text-slate-100 font-semibold">Actionable Takeaway:</strong> If waist stays tight while weight stalls, recomposition is still working.
          </li>
        </CoachAnalysis>
      </div>
    </div>
  );
};

export default ChartsSection;
