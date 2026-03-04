import React, { useState } from 'react';
import { Swords, Shield, X } from 'lucide-react';

interface IncomingBossAlertProps {
  bossName: string;
  shieldCharges: number;
  maxShield: number;
}

const IncomingBossAlert: React.FC<IncomingBossAlertProps> = ({ bossName, shieldCharges, maxShield }) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const shieldReady = shieldCharges >= maxShield;

  return (
    <div className="rounded-ui-lg border border-red-500/50 bg-red-500/10 px-4 py-3 flex items-start gap-3">
      <Swords size={15} className="text-red-400 mt-0.5 shrink-0" />
      <div className="flex-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-red-300 mb-0.5">
          ⚔ Incoming Boss Battle
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          <span className="text-red-200 font-semibold">{bossName}</span> is on the horizon.{' '}
          {shieldReady
            ? 'Shield fully charged — you\'re going into this fight at full strength. Execute the pre-game strategy and contain the deviation.'
            : `Shield at ${shieldCharges}/${maxShield} — stack clean days before the encounter to charge up.`}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Shield size={11} className={shieldReady ? 'text-blue-400' : 'text-red-400'} />
          <span className={`text-[10px] font-semibold ${shieldReady ? 'text-blue-300' : 'text-red-300'}`}>
            {shieldReady ? 'Shield Ready' : `${shieldCharges}/${maxShield} charges`}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-ui-muted hover:text-ui-text transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X size={13} />
      </button>
    </div>
  );
};

export default IncomingBossAlert;
