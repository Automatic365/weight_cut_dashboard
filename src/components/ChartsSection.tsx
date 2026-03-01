import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
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

        <CoachAnalysis colorScheme="slate">
          <li>
            <strong className="text-slate-800 font-semibold">Effort Theater vs. Data Stability:</strong> Look at the 7-day average line. It filters out the daily noise and shows a clear downward slope.
          </li>
          <li>
            <strong className="text-slate-800 font-semibold">Contextual Spikes:</strong> Notice the red dots (Tier 1 Muay Thai days like Feb 10). They are almost always followed by a weight spike due to inflammation and glycogen refill, <em className="italic">not fat gain</em>.
          </li>
          <li>
            <strong className="text-slate-800 font-semibold">Actionable Takeaway:</strong> Do not emotionally react to one weigh-in. Do not tighten calories after a post-training water bump. Trust the moving average.
          </li>
        </CoachAnalysis>
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

        <CoachAnalysis colorScheme="slate" className="mt-4">
          <li>
            <strong className="text-slate-800 font-semibold">True Tissue Loss:</strong> The waist measurement (+2") establishes the true floor for fat loss. It has consistently compressed down toward the low 31" range.
          </li>
          <li>
            <strong className="text-slate-800 font-semibold">Gut Volume Noise:</strong> The abdomen (navel) fluctuates far more dramatically due to digestion, food volume, and sodium.
          </li>
          <li>
            <strong className="text-slate-800 font-semibold">Actionable Takeaway:</strong> When the scale stalls but the waist (+2") stays tight, it confirms recomposition and fat loss are still occurring.
          </li>
        </CoachAnalysis>
      </div>
    </div>
  );
};

export default ChartsSection;
