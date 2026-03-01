import React from 'react';
import { Shield, ShieldAlert } from 'lucide-react';
import { BF_GOAL_PERCENT, BF_LBS_SCALE, BODY_STAGE_THRESHOLDS, ARMOR_TIER_THRESHOLDS } from '../config';
import avatarImg from '../assets/avatar.png';

type BodyStage = 1 | 2 | 3 | 4;
type ArmorTier = 0 | 1 | 2;

interface AvatarHeroProps {
    lbsRemaining: number;
    shieldLevel: number;
}

const AvatarHero: React.FC<AvatarHeroProps> = ({ lbsRemaining, shieldLevel }) => {
    const estimatedBF = BF_GOAL_PERCENT + (lbsRemaining * BF_LBS_SCALE);

    let bodyStage: BodyStage = 1;
    if (estimatedBF <= BODY_STAGE_THRESHOLDS.shredded) bodyStage = 4;
    else if (estimatedBF <= BODY_STAGE_THRESHOLDS.athletic) bodyStage = 3;
    else if (estimatedBF <= BODY_STAGE_THRESHOLDS.leaningOut) bodyStage = 2;
    else bodyStage = 1;

    let armorTier: ArmorTier = 0;
    if (shieldLevel >= ARMOR_TIER_THRESHOLDS.full) armorTier = 2;
    else if (shieldLevel >= ARMOR_TIER_THRESHOLDS.light) armorTier = 1;
    else armorTier = 0;

    const bodyColors: Record<BodyStage, string> = {
        1: '#cbd5e1',
        2: '#94a3b8',
        3: '#64748b',
        4: '#3b82f6',
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="relative w-32 h-32 mb-4 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center shadow-inner overflow-hidden">
                {armorTier === 2 && (
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse rounded-full"></div>
                )}

                {/* Image-based avatar with dynamic CSS filters per body stage */}
                <div
                    className="absolute inset-0 bg-cover bg-center z-10 transition-all duration-700 ease-in-out"
                    style={{
                        backgroundImage: `url(${avatarImg})`,
                        filter: bodyStage >= 3 ? 'contrast(1.1) saturate(1.1)' : 'grayscale(15%)',
                        boxShadow: `inset 0 0 15px ${bodyColors[bodyStage]}80`,
                    }}
                />

                {/* Armor overlays */}
                {armorTier === 1 && (
                    <div className="absolute inset-0 border-4 rounded-full z-20 pointer-events-none transition-colors duration-500 border-slate-500/50" />
                )}
                {armorTier === 2 && (
                    <div className="absolute inset-0 border-[6px] rounded-full z-20 pointer-events-none transition-colors duration-500 border-blue-500/80 shadow-[inset_0_0_15px_rgba(59,130,246,0.5)]" />
                )}

                {armorTier === 0 && (
                    <div className="absolute top-2 right-2 text-red-500 animate-pulse z-30">
                        <ShieldAlert size={14} />
                    </div>
                )}
            </div>

            <div className="flex w-full gap-2 justify-center">
                <div className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center w-24">
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Est. Body Fat</div>
                    <div className={`text-xs font-black ${bodyStage >= 3 ? 'text-blue-400' : 'text-slate-300'}`}>
                        {estimatedBF.toFixed(1)}% <span className="text-[10px] text-slate-500 font-normal ml-0.5">Lvl {bodyStage}</span>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center w-24">
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Armor Tier</div>
                    <div className="text-xs font-black text-slate-300 flex items-center justify-center gap-1">
                        {armorTier === 0 ? <ShieldAlert size={10} className="text-red-500" /> : <Shield size={10} className="text-blue-500" />}
                        Tier {armorTier}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvatarHero;
