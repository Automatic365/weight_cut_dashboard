import React, { useState } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';
import type { DataWarning } from '../utils/dataIntegrity';

interface DataIntegrityBannerProps {
  warnings: DataWarning[];
}

const DataIntegrityBanner: React.FC<DataIntegrityBannerProps> = ({ warnings }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || warnings.length === 0) return null;

  return (
    <div className="rounded-ui-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex items-start gap-3">
      <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mb-1.5">Data Gaps Detected</div>
        {warnings.map(w => (
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
