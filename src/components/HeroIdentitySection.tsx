import React from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { User, Dumbbell, Heart, Brain, Shield } from 'lucide-react';
import AvatarHero from './AvatarHero';
import AttributeCard from './AttributeCard';
import type { ProjectionStats, ChartDayEntry, Attributes, RadarDataPoint } from '../types';

interface HeroIdentitySectionProps {
  projectionStats: ProjectionStats;
  latestData: ChartDayEntry;
  latestAttributes: Attributes;
  radarData: RadarDataPoint[];
}

// Hero Identity & Attributes section: Avatar, Spider Chart, and RPG attribute cards.
const HeroIdentitySection: React.FC<HeroIdentitySectionProps> = ({ projectionStats, latestData, latestAttributes, radarData }) => {
  return (
    <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-inner">
      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-1 uppercase tracking-wider">
        <User size={16} className="text-slate-400" /> Hero Identity & Attributes
      </h3>

      <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 mt-6">

        {/* Avatar Section */}
        <div className="w-full md:w-1/3 flex flex-col items-center justify-center bg-slate-950/50 rounded-lg p-4 border border-slate-800/50">
          <AvatarHero
            lbsRemaining={parseFloat(projectionStats.lbsRemaining)}
            shieldLevel={latestData.shield}
          />
        </div>

        {/* Spider Chart */}
        <div className="w-full md:w-1/3 h-64 flex justify-center items-center">
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

        {/* Attribute Cards */}
        <div className="w-full md:w-1/2 grid grid-cols-2 gap-3">
          <AttributeCard
            name="Strength"
            icon={Dumbbell}
            iconClass="text-red-400"
            level={latestAttributes.strength.level}
            currentLvlXp={latestAttributes.strength.currentLvlXp}
            nextLvlXp={latestAttributes.strength.nextLvlXp}
            tooltipAccentClass="text-red-400"
            tooltipLines={[
              '+10 XP: Protein floor (≥190g)',
              '+5 XP: Logging a workout',
            ]}
          />
          <AttributeCard
            name="Vitality"
            icon={Heart}
            iconClass="text-green-400"
            level={latestAttributes.vitality.level}
            currentLvlXp={latestAttributes.vitality.currentLvlXp}
            nextLvlXp={latestAttributes.vitality.nextLvlXp}
            tooltipAccentClass="text-green-400"
            tooltipLines={[
              '+10 XP: Sleep >7 hours',
              '-5 XP: Sleep <6 hours',
            ]}
          />
          <AttributeCard
            name="Discipline"
            icon={Brain}
            iconClass="text-purple-400"
            level={latestAttributes.discipline.level}
            currentLvlXp={latestAttributes.discipline.currentLvlXp}
            nextLvlXp={latestAttributes.discipline.nextLvlXp}
            tooltipAccentClass="text-purple-400"
            tooltipLines={[
              '+10 XP: Adherence ≥90%',
              '+5 XP: Logging a workout',
              '-10 XP: Adherence <85%',
            ]}
          />
          <AttributeCard
            name="Resilience"
            icon={Shield}
            iconClass="text-blue-400"
            level={latestAttributes.resilience.level}
            currentLvlXp={latestAttributes.resilience.currentLvlXp}
            nextLvlXp={latestAttributes.resilience.nextLvlXp}
            tooltipAccentClass="text-blue-400"
            tooltipLines={[
              '+50 XP: Surviving a Boss Battle',
              '-20 XP: Boss Critical Hit (Fail)',
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default HeroIdentitySection;
