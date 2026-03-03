import React from 'react';
import {
  RadarChart, PolarGrid, PolarRadiusAxis, Radar,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Dumbbell, Heart, Brain, Shield, Sword } from 'lucide-react';
import AttributeRow from './AttributeRow';
import type { Attributes, RadarDataPoint } from '../types';

interface HeroIdentitySectionProps {
  latestAttributes: Attributes;
  radarData: RadarDataPoint[];
  tier: string;
  ladderTierLabel: string;
}

// Derive display tag from nutrition tier string
function tierTag(tier: string): string {
  if (tier === 'Linear') return 'LINEAR CUT';
  if (tier === 'PSMF' || tier === 'Tier 2') return 'PSMF';
  if (tier === 'Tier 3') return 'FAST';
  return tier.toUpperCase();
}

const Tag: React.FC<{ label: string }> = ({ label }) => (
  <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300">
    {label}
  </span>
);

const HeroIdentitySection: React.FC<HeroIdentitySectionProps> = ({
  latestAttributes, radarData, tier, ladderTierLabel,
}) => {
  return (
    <div className="mt-4 bg-[#0a0c14] border border-slate-700/60 rounded-xl overflow-hidden shadow-2xl">

      {/* Section label */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-800/80">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
          Performance Attributes
        </span>
      </div>

      <div className="flex flex-col md:flex-row">

        {/* ── Left: Character Panel ───────────────────────────────────────── */}
        <div className="md:w-1/4 bg-[#0d1117] border-b md:border-b-0 md:border-r border-slate-700/50 p-5 flex flex-col items-center justify-center gap-4">

          {/* Avatar frame with amber corner brackets */}
          <div className="relative w-24 h-24">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500/80" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500/80" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500/80" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500/80" />
            {/* Avatar placeholder */}
            <div className="w-full h-full bg-slate-800/80 flex items-center justify-center">
              <Sword size={40} className="text-amber-400/50" />
            </div>
          </div>

          {/* Name + Rank */}
          <div className="text-center">
            <div className="text-sm font-black text-white uppercase tracking-widest">Operative</div>
            <div className="text-[9px] text-amber-400/70 uppercase tracking-wider mt-0.5">
              {ladderTierLabel}
            </div>
          </div>

          {/* Tag chips */}
          <div className="flex flex-wrap justify-center gap-1.5">
            <Tag label={tierTag(tier)} />
            <Tag label="Muay Thai" />
            <Tag label="Fighter" />
          </div>
        </div>

        {/* ── Center: Attribute Rows ──────────────────────────────────────── */}
        <div className="md:w-1/2 p-5 flex flex-col justify-center">
          <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">
            Attribute Levels
          </div>
          <div>
            <AttributeRow
              name="Strength"
              icon={Dumbbell}
              iconClass="text-red-400"
              barColorClass="bg-red-500"
              level={latestAttributes.strength.level}
              currentLvlXp={latestAttributes.strength.currentLvlXp}
              nextLvlXp={latestAttributes.strength.nextLvlXp}
              tooltipLines={['+10 XP: Protein floor (≥190g)', '+5 XP: Logging a workout']}
            />
            <AttributeRow
              name="Vitality"
              icon={Heart}
              iconClass="text-green-400"
              barColorClass="bg-green-500"
              level={latestAttributes.vitality.level}
              currentLvlXp={latestAttributes.vitality.currentLvlXp}
              nextLvlXp={latestAttributes.vitality.nextLvlXp}
              tooltipLines={['+10 XP: Sleep >7 hours', '-5 XP: Sleep <6 hours']}
            />
            <AttributeRow
              name="Discipline"
              icon={Brain}
              iconClass="text-purple-400"
              barColorClass="bg-purple-500"
              level={latestAttributes.discipline.level}
              currentLvlXp={latestAttributes.discipline.currentLvlXp}
              nextLvlXp={latestAttributes.discipline.nextLvlXp}
              tooltipLines={['+10 XP: Adherence ≥90%', '+5 XP: Logging a workout', '-10 XP: Adherence <85%']}
            />
            <AttributeRow
              name="Resilience"
              icon={Shield}
              iconClass="text-blue-400"
              barColorClass="bg-blue-500"
              level={latestAttributes.resilience.level}
              currentLvlXp={latestAttributes.resilience.currentLvlXp}
              nextLvlXp={latestAttributes.resilience.nextLvlXp}
              tooltipLines={['+50 XP: Surviving a Boss Battle', '-20 XP: Boss Critical Hit (Fail)']}
            />
          </div>
        </div>

        {/* ── Right: Radar Chart ──────────────────────────────────────────── */}
        <div className="md:w-1/4 border-t md:border-t-0 md:border-l border-slate-700/50 p-4 flex items-center justify-center">
          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 'dataMax']}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name="Attributes"
                  dataKey="level"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.35}
                  strokeWidth={1.5}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0d1117', borderColor: '#f59e0b40', color: '#fff' }}
                  itemStyle={{ color: '#fcd34d' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeroIdentitySection;
