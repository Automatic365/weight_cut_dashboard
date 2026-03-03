import React from 'react';
import { Lightbulb } from 'lucide-react';

type ColorScheme = 'green' | 'slate' | 'orange' | 'indigo';

const COLOR_SCHEMES: Record<ColorScheme, { wrapper: string; title: string; body: string }> = {
  green: {
    wrapper: 'bg-emerald-500/8 border border-emerald-400/25',
    title: 'text-emerald-200',
    body: 'text-slate-300',
  },
  slate: {
    wrapper: 'bg-ui-surface-2/60 border border-ui-border',
    title: 'text-ui-text',
    body: 'text-slate-300',
  },
  orange: {
    wrapper: 'bg-amber-500/8 border border-amber-400/25',
    title: 'text-amber-200',
    body: 'text-slate-300',
  },
  indigo: {
    wrapper: 'bg-sky-500/8 border border-sky-400/25',
    title: 'text-sky-200',
    body: 'text-slate-300',
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
    <div className={`rounded-ui-lg p-4 ${c.wrapper} ${className}`}>
      <h3 className={`text-xs md:text-sm font-display font-semibold flex items-center gap-1.5 mb-2 uppercase tracking-wide ${c.title}`}>
        <Lightbulb size={16} className="text-ui-accent" />
        Coach's Analysis
      </h3>
      <ul className={`text-xs leading-relaxed space-y-2 ${c.body}`}>
        {children}
      </ul>
    </div>
  );
};

export default CoachAnalysis;
