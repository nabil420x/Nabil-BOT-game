import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Package, Sparkles, Shield, Zap, Coins, Cpu, X } from 'lucide-react';
import {
  PRE_RUN_BOOSTERS,
  SUPPLY_CRATE_COSTS,
  loadSupplyCrateState,
  openSupplyCrate,
} from '../game/supplyCrate';
import { generateCelebrationParticles, stepCelebrationParticles } from '../game/missions';
import { soundEngine } from '../game/audio';
import { WEAPONS } from '../game/weapons';
import type {
  CelebrationParticle,
  SupplyCrateReward,
  SupplyCrateState,
  SupplyCrateTier,
  WeaponType,
} from '../game/types';

interface SupplyCrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  diamonds: number;
  activeWeapon: WeaponType;
  onWalletUpdated: (newCoins: number, newDiamonds?: number) => void;
}

const RARITY_COLORS: Record<string, { border: string; text: string; bg: string; label: string }> = {
  common: {
    border: 'border-slate-500/60',
    text: 'text-slate-200',
    bg: 'bg-slate-900/90',
    label: 'COMMON DROP',
  },
  rare: {
    border: 'border-sky-400/70',
    text: 'text-sky-300',
    bg: 'bg-sky-950/60',
    label: 'RARE DROP',
  },
  epic: {
    border: 'border-purple-400/80',
    text: 'text-purple-300',
    bg: 'bg-purple-950/60',
    label: 'EPIC DROP',
  },
  apex: {
    border: 'border-amber-400',
    text: 'text-amber-300',
    bg: 'bg-amber-950/60',
    label: 'APEX JACKPOT',
  },
};

export const SupplyCrateModal: React.FC<SupplyCrateModalProps> = ({
  isOpen,
  onClose,
  coins,
  diamonds,
  activeWeapon,
  onWalletUpdated,
}) => {
  const [crateState, setCrateState] = useState<SupplyCrateState>(() => loadSupplyCrateState());
  const [activeReward, setActiveReward] = useState<SupplyCrateReward | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalBoxRef = useRef<HTMLDivElement | null>(null);
  const particlesRef = useRef<CelebrationParticle[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    particlesRef.current = [];
  }, []);

  const renderFrame = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        stopLoop();
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        stopLoop();
        return;
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - (lastTimeRef.current || now)) / 1000));
      lastTimeRef.current = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = stepCelebrationParticles(particlesRef.current, dt);
      for (const p of particlesRef.current) {
        const alpha = Math.max(0, Math.min(1, p.life / Math.max(0.01, p.maxLife)));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        if (p.shape === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.8, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size * 0.8, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(renderFrame);
      } else {
        stopLoop();
      }
    },
    [stopLoop]
  );

  const triggerBurst = useCallback(
    (buttonEl: HTMLButtonElement | null, isDiamondJackpot: boolean) => {
      const box = modalBoxRef.current;
      const canvas = canvasRef.current;
      if (!box || !canvas) return;
      const boxRect = box.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(boxRect.width));
      canvas.height = Math.max(1, Math.round(boxRect.height));
      let originX = canvas.width / 2;
      let originY = canvas.height * 0.45;
      if (buttonEl) {
        const btnRect = buttonEl.getBoundingClientRect();
        originX = btnRect.left - boxRect.left + btnRect.width / 2;
        originY = btnRect.top - boxRect.top + btnRect.height / 2;
      }
      const next = generateCelebrationParticles(
        originX,
        originY,
        isDiamondJackpot ? 'diamond' : 'mission',
        26
      );
      particlesRef.current = [...particlesRef.current, ...next];
      if (rafRef.current === null) {
        lastTimeRef.current = performance.now();
        rafRef.current = requestAnimationFrame(renderFrame);
      }
    },
    [renderFrame]
  );

  useEffect(() => {
    if (isOpen) {
      setCrateState(loadSupplyCrateState());
      setErrorMsg(null);
      setIsOpening(false);
    } else {
      stopLoop();
    }
    return () => stopLoop();
  }, [isOpen, stopLoop]);

  if (!isOpen) return null;

  const handleOpenCrate = (tier: SupplyCrateTier, e: React.MouseEvent<HTMLButtonElement>) => {
    const buttonEl = e.currentTarget;
    setErrorMsg(null);
    setIsOpening(true);
    const res = openSupplyCrate(tier, coins, activeWeapon);
    if (!res.success || !res.reward) {
      setIsOpening(false);
      soundEngine.playDefeat();
      setErrorMsg(res.error || 'Unable to open supply crate.');
      return;
    }

    setCrateState(res.updatedState);
    setActiveReward(res.reward);
    onWalletUpdated(res.newCoinsBalance, res.newDiamondsBalance);
    soundEngine.playVictory();
    triggerBurst(buttonEl, res.reward.diamondsAwarded >= 3 || res.reward.rarity === 'apex');
    window.setTimeout(() => setIsOpening(false), 180);
  };

  const armed = crateState.armedBoosters;
  const activeWeaponName = WEAPONS[activeWeapon]?.name || 'Pulse Blaster';
  const rewardStyle = activeReward ? RARITY_COLORS[activeReward.rarity] || RARITY_COLORS.common : null;

  return (
    <div
      data-testid="supply-crate-modal"
      className="fixed inset-0 z-50 bg-[#040710]/92 flex items-center justify-center p-3 sm:p-6 select-none"
    >
      <div
        ref={modalBoxRef}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#09111f] border-2 border-amber-400/55 rounded-2xl p-4 sm:p-6 shadow-[0_0_50px_rgba(251,191,36,0.2)]"
      >
        {/* Transparent confetti overlay */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 w-full h-full z-20"
        />

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-center text-2xl shrink-0">
              🎁
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                Cyber Supply Crates
              </h2>
              <p className="text-xs text-slate-300 font-mono">
                Unbox daily free drops, Cyber Diamonds, Mastery XP for {activeWeaponName}, and Pre-Run Combat Boosters.
              </p>
              <div className="mt-1 text-[11px] font-mono text-slate-400 flex flex-wrap items-center gap-2 tabular-nums">
                <span>Wallet: <strong className="text-amber-300">{coins.toLocaleString()} Coins</strong></span>
                <span aria-hidden="true">·</span>
                <span><strong className="text-cyan-300">{diamonds.toLocaleString()} Diamonds</strong></span>
                <span aria-hidden="true">·</span>
                <span>Opened: {crateState.totalOpened}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            data-testid="supply-crate-close-btn"
            onClick={onClose}
            aria-label="Close Supply Crate Modal"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reward Reveal Spotlight */}
        {activeReward && rewardStyle && (
          <div
            data-testid="supply-crate-reward-banner"
            className={`relative z-10 mt-4 rounded-xl border-2 p-4 transition-transform duration-150 ${
              isOpening ? 'scale-[0.98]' : 'scale-100'
            } ${rewardStyle.border} ${rewardStyle.bg}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-700 flex items-center justify-center text-3xl shrink-0">
                  {activeReward.icon}
                </div>
                <div>
                  <div className={`text-[10px] font-mono font-black tracking-widest uppercase ${rewardStyle.text}`}>
                    {rewardStyle.label}
                  </div>
                  <div className="text-base sm:text-lg font-black text-white">{activeReward.title}</div>
                  <div className="text-xs font-mono text-slate-300">{activeReward.subtitle}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono font-bold tabular-nums">
                {activeReward.coinsAwarded > 0 && (
                  <span className="text-amber-300">+{activeReward.coinsAwarded} 🪙</span>
                )}
                {activeReward.diamondsAwarded > 0 && (
                  <span className="text-cyan-300">+{activeReward.diamondsAwarded} 💎</span>
                )}
                {activeReward.masteryXpAwarded > 0 && (
                  <span className="text-emerald-300">+{activeReward.masteryXpAwarded} XP</span>
                )}
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="relative z-10 mt-3 rounded-lg border border-red-500/50 bg-red-950/60 px-3 py-2 text-xs font-mono text-red-200">
            {errorMsg}
          </div>
        )}

        {/* Crate Tiers Grid */}
        <div className="relative z-10 mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Daily Free Key Drop */}
          <div className="rounded-xl bg-slate-950/90 border border-emerald-500/45 p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-300">
                <span>Daily Free Key</span>
                <span className="tabular-nums">{crateState.freeKeys} Ready</span>
              </div>
              <h3 className="mt-1 text-base font-black text-white">Daily Supply Drop</h3>
              <p className="mt-1 text-xs text-slate-300 font-mono leading-relaxed">
                1 free unlock every day. Rewards Coins, Diamonds, Mastery XP, or a Next-Run Booster.
              </p>
            </div>
            <button
              type="button"
              data-testid="open-daily-crate-btn"
              disabled={crateState.freeKeys <= 0}
              onClick={(e) => handleOpenCrate('daily_free', e)}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                crateState.freeKeys > 0
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{crateState.freeKeys > 0 ? 'Open Free Drop' : 'Claimed Today'}</span>
            </button>
          </div>

          {/* 2. Standard Coin Crate */}
          <div className="rounded-xl bg-slate-950/90 border border-sky-500/40 p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold text-sky-300">
                <span>Standard Vault</span>
                <span className="tabular-nums">{SUPPLY_CRATE_COSTS.standard} 🪙</span>
              </div>
              <h3 className="mt-1 text-base font-black text-white">Tactical Supply Crate</h3>
              <p className="mt-1 text-xs text-slate-300 font-mono leading-relaxed">
                Great coin sink: +1 to +3 Diamonds chance, Weapon Mastery XP, or Pre-Run Boosters.
              </p>
            </div>
            <button
              type="button"
              data-testid="open-standard-crate-btn"
              disabled={coins < SUPPLY_CRATE_COSTS.standard}
              onClick={(e) => handleOpenCrate('standard', e)}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                coins >= SUPPLY_CRATE_COSTS.standard
                  ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Open ({SUPPLY_CRATE_COSTS.standard} 🪙)</span>
            </button>
          </div>

          {/* 3. Apex Quantum Crate */}
          <div className="rounded-xl bg-slate-950/90 border border-amber-400/60 p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
                <span>Apex Vault</span>
                <span className="tabular-nums">{SUPPLY_CRATE_COSTS.apex} 🪙</span>
              </div>
              <h3 className="mt-1 text-base font-black text-white">Apex Quantum Crate</h3>
              <p className="mt-1 text-xs text-slate-300 font-mono leading-relaxed">
                Guaranteed +2 to +8 Cyber Diamonds plus high-tier Next-Run Overclock Boosters.
              </p>
            </div>
            <button
              type="button"
              data-testid="open-apex-crate-btn"
              disabled={coins < SUPPLY_CRATE_COSTS.apex}
              onClick={(e) => handleOpenCrate('apex', e)}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                coins >= SUPPLY_CRATE_COSTS.apex
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Open ({SUPPLY_CRATE_COSTS.apex} 🪙)</span>
            </button>
          </div>
        </div>

        {/* Armed Pre-Run Boosters Shelf */}
        <div className="relative z-10 mt-5 pt-4 border-t border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
              Armed Next-Run Combat Boosters ({armed.length}/4)
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Auto-activates on your next Campaign or Endless deployment
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(PRE_RUN_BOOSTERS) as Array<keyof typeof PRE_RUN_BOOSTERS>).map((bId) => {
              const def = PRE_RUN_BOOSTERS[bId];
              const isArmed = armed.includes(bId);
              return (
                <div
                  key={bId}
                  data-testid={`booster-status-${bId}`}
                  className={`rounded-lg border p-2.5 flex items-center justify-between gap-2 ${
                    isArmed
                      ? 'bg-cyan-950/40 border-cyan-400/70 text-white'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg shrink-0">
                      {bId === 'shield_overcharge' ? (
                        <Shield className="w-4 h-4 text-sky-400" />
                      ) : bId === 'weapon_overclock' ? (
                        <Zap className="w-4 h-4 text-orange-400" />
                      ) : bId === 'coin_rush' ? (
                        <Coins className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Cpu className="w-4 h-4 text-purple-400" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-tight">{def.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 leading-snug mt-0.5">{def.description}</div>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-black shrink-0 ${
                      isArmed ? 'text-emerald-300' : 'text-slate-600'
                    }`}
                  >
                    {isArmed ? 'ARMED' : 'EMPTY'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
