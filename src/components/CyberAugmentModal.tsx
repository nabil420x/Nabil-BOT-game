import React from 'react';
import { Cpu, Sparkles, Zap } from 'lucide-react';
import type { CyberAugmentChoice, CyberAugmentId, CyberAugmentRarity } from '../game/types';

interface CyberAugmentModalProps {
  choices: CyberAugmentChoice[];
  wave: number;
  level: number;
  draftReason?: 'level_clear' | 'wave_clear' | 'headstart' | null;
  clearedLevel?: number | null;
  onSelect: (id: CyberAugmentId) => void;
}

const RARITY_STYLES: Record<
  CyberAugmentRarity,
  { badgeText: string; badgeClass: string }
> = {
  core: {
    badgeText: 'CORE MODULE',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/50',
  },
  elite: {
    badgeText: 'ELITE PROTOCOL',
    badgeClass: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/50',
  },
  apex: {
    badgeText: 'APEX CYBER-CHIP',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/60',
  },
};

export const CyberAugmentModal: React.FC<CyberAugmentModalProps> = ({
  choices,
  wave,
  level,
  draftReason,
  clearedLevel,
  onSelect,
}) => {
  if (!choices || choices.length === 0) return null;

  const isLevelClear = draftReason === 'level_clear';
  const displayCleared = clearedLevel ?? Math.max(1, level - 1);

  return (
    <div
      data-testid="cyber-augment-modal"
      className="fixed inset-0 z-50 bg-[#040710]/85 flex items-center justify-center p-3 sm:p-6 select-none"
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#09111f] border-2 border-cyan-400/60 rounded-xl p-4 sm:p-7 shadow-[0_0_50px_rgba(0,243,255,0.25)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 sm:pb-4 mb-4 sm:mb-5 border-b border-cyan-500/30">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-cyan-500/15 border border-cyan-400/50 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-xl font-black tracking-wider text-white uppercase">
                  CYBER-CHIP AUGMENT DRAFT
                </h2>
                {isLevelClear ? (
                  <span
                    data-testid="augment-level-clear-badge"
                    className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/60 text-amber-300 text-[10px] font-mono font-bold shrink-0"
                  >
                    LEVEL {displayCleared} CLEARED · NEXT: SECTOR {level}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/50 text-emerald-300 text-[10px] font-mono font-bold shrink-0">
                    SECTOR {level} · WAVE {wave}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                {isLevelClear
                  ? `Level ${displayCleared} Victory Reward! Install 1 combat chip before Sector ${level} · Click or press `
                  : 'Install 1 tactical combat sub-routine onto NaBil-BOT · Click a chip or press '}
                <span className="text-cyan-300 font-bold">[1]</span>{' '}
                <span className="text-cyan-300 font-bold">[2]</span>{' '}
                <span className="text-cyan-300 font-bold">[3]</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-400/40 px-3 py-1.5 rounded-lg self-start sm:self-auto shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>CHOOSE 1 OF {choices.length}</span>
          </div>
        </div>

        {/* 3 Upgrade Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {choices.map((choice, idx) => {
            const { def, currentLevel, nextLevel, isOverclockSurge } = choice;
            const rarityStyle = RARITY_STYLES[def.rarity];

            return (
              <button
                key={def.id}
                type="button"
                data-testid={`augment-card-${def.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  onSelect(def.id);
                }}
                className="group relative flex flex-col justify-between text-left p-3.5 sm:p-5 rounded-xl bg-[#0c1628] hover:bg-[#111f38] border-2 transition-all duration-150 cursor-pointer focus:outline-none"
                style={{
                  borderColor: isOverclockSurge ? '#f59e0b99' : `${def.color}66`,
                  boxShadow: `0 0 20px ${isOverclockSurge ? '#f59e0b22' : `${def.color}18`}`,
                }}
              >
                <div>
                  {/* Top Row: Key + Rarity */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-3">
                    <span
                      className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold tracking-wider ${
                        isOverclockSurge
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/60'
                          : rarityStyle.badgeClass
                      }`}
                    >
                      {isOverclockSurge ? '⚡ OVERCLOCK SURGE' : rarityStyle.badgeText}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded font-mono font-black text-xs border"
                      style={{
                        color: def.color,
                        borderColor: `${def.color}88`,
                        backgroundColor: `${def.color}18`,
                      }}
                    >
                      KEY [{idx + 1}]
                    </span>
                  </div>

                  {/* Icon + Title */}
                  <div className="flex items-center gap-3 mb-2 sm:mb-2.5">
                    <div
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center text-xl sm:text-2xl border shrink-0"
                      style={{
                        backgroundColor: `${def.color}1a`,
                        borderColor: `${def.color}66`,
                      }}
                    >
                      {def.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-black tracking-wide text-white leading-tight group-hover:text-cyan-200 transition-colors">
                        {def.name}
                      </h3>
                      <div
                        className="text-[11px] font-mono font-bold mt-0.5"
                        style={{ color: isOverclockSurge ? '#fbbf24' : def.color }}
                      >
                        {isOverclockSurge
                          ? `⚡ OVERCLOCK LVL ${currentLevel} → ${nextLevel}`
                          : `LVL ${currentLevel} → LVL ${nextLevel} / ${def.maxStacks}`}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-3 sm:mb-4">
                    {isOverclockSurge
                      ? `${def.description} (Overclock Surge: +6% DMG, +5% Fire Rate, +12% Coins & +2 Shield/Kill)`
                      : def.description}
                  </p>
                </div>

                {/* Footer Stat Callout */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    {def.statSummary}
                  </span>
                  <span
                    className="px-2.5 py-1 rounded text-[10px] font-black tracking-wider uppercase text-slate-950 shrink-0 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: def.color }}
                  >
                    INSTALL
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
