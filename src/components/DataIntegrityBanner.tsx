import React, { useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import type { DataIntegrityReport } from '../utils/dataIntegrity';

interface DataIntegrityBannerProps {
  report: DataIntegrityReport;
}

const DataIntegrityBanner: React.FC<DataIntegrityBannerProps> = ({ report }) => {
  const [dismissed, setDismissed] = useState(false);
  const { warnings, badges } = report;
  const hasBadgeSignal = badges.some((badge) => badge.count > 0);

  if (dismissed || (!hasBadgeSignal && warnings.length === 0)) return null;

  return (
    <div className="rounded-ui-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex items-start gap-3">
      <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mb-1.5">Data Verifier</div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {badges.map((badge) => (
            <span
              key={badge.id}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                badge.count > 0
                  ? 'border-amber-400/40 text-amber-200 bg-amber-500/10'
                  : 'border-slate-600/60 text-slate-400 bg-slate-800/30'
              }`}
            >
              {badge.label}: {badge.count}
            </span>
          ))}
        </div>
        {warnings.map((w) => (
          <div key={w.id} className="flex items-start gap-1.5 text-[11px] text-slate-300">
            {w.severity === 'warn'
              ? <AlertTriangle size={11} className="text-amber-400 mt-0.5 shrink-0" />
              : <Info size={11} className="text-blue-400 mt-0.5 shrink-0" />
            }
            {w.message}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-ui-muted hover:text-ui-text transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default DataIntegrityBanner;
