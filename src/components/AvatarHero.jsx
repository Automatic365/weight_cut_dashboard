import React from 'react';
import { Shield, Sparkles, Zap, ShieldAlert, Crosshair } from 'lucide-react';

const AvatarHero = ({ lbsRemaining, shieldLevel }) => {
    // 1. Calculate Estimated Body Fat %
    // Goal (0 lbs remaining) = ~10% BF. 
    // Current (9 lbs remaining) = ~16% BF.
    // Formula: 10 + (lbsRemaining * 0.667)
    const estimatedBF = 10 + (lbsRemaining * 0.667);

    // 2. Determine Body Stage (1-4)
    let bodyStage = 1;
    if (estimatedBF <= 10) bodyStage = 4;        // Shredded
    else if (estimatedBF <= 15) bodyStage = 3;   // Athletic
    else if (estimatedBF <= 20) bodyStage = 2;   // Leaning Out
    else bodyStage = 1;                          // Starting/Bulking

    // 3. Determine Armor Tier (0-2)
    let armorTier = 0;
    if (shieldLevel >= 10) armorTier = 2;        // Full Combat Armor
    else if (shieldLevel >= 5) armorTier = 1;    // Light Gear
    else armorTier = 0;                          // Vulnerable

    // Colors & Styles based on Stage
    const bodyColors = {
        1: '#cbd5e1', // Slate 300 (Softer)
        2: '#94a3b8', // Slate 400 (Defined)
        3: '#64748b', // Slate 500 (Harder)
        4: '#3b82f6', // Blue 500 (Goku SSJ Blue vibe for reaching goal)
    };

    const getBodyPath = (stage) => {
        switch (stage) {
            case 1: // Bulking (Wider waist, softer shoulders)
                return "M 35 30 Q 50 10 65 30 L 70 60 Q 50 90 30 60 Z";
            case 2: // Leaning Out (Straighter sides, slight V-taper)
                return "M 30 25 Q 50 15 70 25 L 65 60 Q 50 85 35 60 Z";
            case 3: // Athletic (Clear V-taper, broad shoulders, narrow waist)
                return "M 25 20 Q 50 15 75 20 L 60 65 Q 50 80 40 65 Z";
            case 4: // Shredded (Extreme V-taper, aggressive lines)
                return "M 20 15 Q 50 10 80 15 L 55 70 Q 50 75 45 70 Z";
            default:
                return "M 35 30 Q 50 10 65 30 L 70 60 Q 50 90 30 60 Z";
        }
    };

    const getCoreDefinition = (stage) => {
        if (stage < 3) return null;
        // Add abs/core lines for athletic & shredded stages
        return (
            <g stroke={stage === 4 ? "#dbeafe" : "#475569"} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6">
                <path d="M 50 35 L 50 60" /> {/* Center line */}
                <path d="M 42 42 Q 50 45 58 42" /> {/* Top abs */}
                <path d="M 44 50 Q 50 53 56 50" /> {/* Mid abs */}
                {stage === 4 && <path d="M 45 58 Q 50 60 55 58" />} {/* Lower abs (shredded only) */}
            </g>
        );
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">

            {/* Avatar Container */}
            <div className="relative w-32 h-32 mb-4 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center shadow-inner overflow-hidden">

                {/* Tier 2 Aura */}
                {armorTier === 2 && (
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl animate-pulse rounded-full"></div>
                )}

                <svg viewBox="0 0 100 100" className="w-full h-full p-2 relative z-10" overflow="visible">
                    {/* Base Body */}
                    <path
                        d={getBodyPath(bodyStage)}
                        fill={bodyColors[bodyStage]}
                        className="transition-all duration-700 ease-in-out"
                    />

                    {/* Core Definition (Appears at higher stages) */}
                    {getCoreDefinition(bodyStage)}

                    {/* Armor Elements */}
                    {armorTier >= 1 && (
                        <g className="transition-opacity duration-500">
                            {/* Light Gear: Shoulders & Chest Plate */}
                            <path d="M 25 20 Q 35 15 50 25 Q 65 15 75 20 L 78 28 Q 50 35 22 28 Z" fill="#334155" stroke="#475569" strokeWidth="1" />
                            {armorTier === 1 && (
                                <circle cx="50" cy="25" r="4" fill="#60a5fa" /> // Small power core
                            )}
                        </g>
                    )}

                    {armorTier === 2 && (
                        <g className="transition-opacity duration-500">
                            {/* Full Combat Armor: Heavy plates, glowing core */}
                            <path d="M 20 15 Q 35 5 50 20 Q 65 5 80 15 L 85 25 Q 50 45 15 25 Z" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
                            <path d="M 35 35 L 65 35 L 60 65 Q 50 75 40 65 Z" fill="#0f172a" stroke="#475569" strokeWidth="1" opacity="0.8" />
                            <circle cx="50" cy="22" r="6" fill="#3b82f6" className="animate-pulse" /> {/* Glowing power core */}
                            <circle cx="50" cy="22" r="3" fill="#ffffff" />
                        </g>
                    )}

                    {/* Head (Generic helmet/visor to keep it abstract) */}
                    <circle cx="50" cy="18" r="10" fill={armorTier > 0 ? "#0f172a" : "#94a3b8"} stroke={armorTier > 0 ? "#3b82f6" : "none"} strokeWidth={armorTier > 0 ? "1.5" : "0"} />
                    {armorTier > 0 && (
                        <path d="M 42 16 Q 50 20 58 16 L 56 22 Q 50 24 44 22 Z" fill="#60a5fa" /> // Visor
                    )}
                </svg>

                {/* Tier 0 Vulnerable Indicator */}
                {armorTier === 0 && (
                    <div className="absolute top-2 right-2 text-red-500 animate-pulse">
                        <ShieldAlert size={14} />
                    </div>
                )}
            </div>

            {/* Stats Readout */}
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
