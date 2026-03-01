import React from 'react';
import { Lightbulb } from 'lucide-react';

type ColorScheme = 'green' | 'slate' | 'orange' | 'indigo';

const COLOR_SCHEMES: Record<ColorScheme, { wrapper: string; title: string; body: string }> = {
  green: {
    wrapper: 'bg-green-50/50 border border-green-100/80',
    title: 'text-green-900',
    body: 'text-green-800/90',
  },
  slate: {
    wrapper: 'bg-slate-50/80 border border-slate-200/60',
    title: 'text-slate-800',
    body: 'text-slate-600',
  },
  orange: {
    wrapper: 'bg-orange-50/50 border border-orange-100/80',
    title: 'text-orange-900',
    body: 'text-orange-800/90',
  },
  indigo: {
    wrapper: 'bg-indigo-50/40 border border-indigo-100/60',
    title: 'text-indigo-900',
    body: 'text-indigo-800/80',
  },
};

interface CoachAnalysisProps {
  colorScheme?: ColorScheme;
  className?: string;
  children: React.ReactNode;
}

// Reusable Coach's Analysis card. Pass <li> elements as children.
const CoachAnalysis: React.FC<CoachAnalysisProps> = ({ colorScheme = 'slate', className = '', children }) => {
  const c = COLOR_SCHEMES[colorScheme];
  return (
    <div className={`rounded-xl p-4 ${c.wrapper} ${className}`}>
      <h3 className={`text-sm font-bold flex items-center gap-1.5 mb-2 ${c.title}`}>
        <Lightbulb size={16} className="text-amber-500" />
        Coach's Analysis
      </h3>
      <ul className={`text-xs space-y-2 ${c.body}`}>
        {children}
      </ul>
    </div>
  );
};

export default CoachAnalysis;
