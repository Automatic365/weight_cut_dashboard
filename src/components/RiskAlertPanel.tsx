import React, { useState } from 'react';
import { AlertOctagon, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import type { RiskAlert } from '../utils/riskEngine';

interface RiskAlertPanelProps {
  alerts: RiskAlert[];
}

const RiskAlertPanel: React.FC<RiskAlertPanelProps> = ({ alerts }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = alerts.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map(alert => (
        <div
          key={alert.id}
          className={`flex items-start gap-3 rounded-ui-lg border px-4 py-3 ${
            alert.level === 'critical'
              ? 'border-red-500/40 bg-red-500/8'
              : 'border-amber-500/35 bg-amber-500/8'
          }`}
        >
          <ShieldAlert
            size={15}
            className={`mt-0.5 shrink-0 ${alert.level === 'critical' ? 'text-red-400' : 'text-amber-400'}`}
          />
          <div className="flex-1">
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${
              alert.level === 'critical' ? 'text-red-300' : 'text-amber-300'
            }`}>
              {alert.level === 'critical' ? '⚠ Critical' : '△ Warning'} · {alert.title}
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">{alert.detail}</p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
            className="shrink-0 text-ui-muted hover:text-ui-text transition-colors mt-0.5"
            aria-label="Dismiss alert"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default RiskAlertPanel;
