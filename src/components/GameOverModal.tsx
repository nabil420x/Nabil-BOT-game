import React, { useState } from 'react';
import { RotateCcw, Home, Skull, ShoppingBag, MapPin, Gem, HeartHandshake } from 'lucide-react';
import { RunSnapshot } from '../game/types';
import { MAX_DIAMOND_REVIVES_PER_RUN, canPurchaseDiamondRevive, getDiamondReviveCost } from '../game/rules';

interface GameOverModalProps {
  snapshot: RunSnapshot;
  onReviveWithDiamonds?: () => { success: boolean; error?: string };
  onRestart: () => void;
  onTitle: () => void;
  onOpenStore?: () => void;
  onOpenMap?: () => void;
  onOpenProfile?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  snapshot,
  onReviveWithDiamonds,
  onRestart,
  onTitle,
  onOpenStore,
  onOpenMap,
  onOpenProfile,
}) => {
  const [reviveError, setReviveError] = useState<string | null>(null);
  const isNewBest = snapshot.score >= snapshot.bestScore && snapshot.score > 0;
  const diamonds = snapshot.diamonds ?? 0;
  const revivesUsed = snapshot.revivesUsed ?? 0;
  const maxRevives = snapshot.maxRevives ?? MAX_DIAMOND_REVIVES_PER_RUN;
  const costInfo = getDiamondReviveCost(revivesUsed, maxRevives);
  const validation = canPurchaseDiamondRevive({
    diamonds,
    revivesUsed,
    maxRevives,
  });

  const handleReviveClick = () => {
    if (!onReviveWithDiamonds || !validation.allowed) return;
    const res = onReviveWithDiamonds();
    if (!res.success && res.error) {
      setReviveError(res.error);
    } else {
      setReviveError(null);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none overflow-y-auto">
      <div className="bg-[#0e070c] border-2 border-red-500/60 rounded-xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_60px_rgba(255,0,85,0.3)] text-center">
        {/* Header Icon & Title */}
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
          <Skull className="w-6 h-6 text-red-400" />
        </div>

        <div className="text-xs uppercase tracking-widest text-red-400 font-bold font-mono">
          NABIL-BOT COMPROMISED
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-widest mb-4">MISSION FAILED</h2>

        {/* Tabular Run Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4 text-left">
          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">FINAL SCORE</div>
            <div className="text-xl font-bold text-white font-mono-numbers">
              {snapshot.score.toLocaleString()}
            </div>
            {isNewBest && (
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wide">
                ★ NEW RECORD
              </span>
            )}
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {snapshot.isBossRush ? 'BOSS RUSH TITAN' : snapshot.isEndless ? 'ENDLESS WAVE' : 'SECTOR REACHED'}
            </div>
            {snapshot.isBossRush ? (
              <div>
                <div
                  data-testid="gameover-boss-rush-stage"
                  className="text-sm font-bold text-amber-300 font-mono-numbers truncate"
                >
                  TITAN {snapshot.bossRushStage || 1}/{snapshot.bossRushTotalStages || 6}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  BEST: S{Math.max(snapshot.bossRushStage || 0, snapshot.bossRushBestStage || 0)}/6
                </div>
              </div>
            ) : snapshot.isEndless ? (
              <div>
                <div
                  data-testid="gameover-endless-wave"
                  className="text-sm font-bold text-fuchsia-300 font-mono-numbers truncate"
                >
                  WAVE {snapshot.wave}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  BEST: W{Math.max(snapshot.wave, snapshot.endlessBestWave || 0)}
                  {snapshot.wave >= (snapshot.endlessBestWave || 0) && snapshot.wave > 1
                    ? ' · ★ NEW RECORD'
                    : ''}
                </div>
              </div>
            ) : (
              <div className="text-sm font-bold text-cyan-400 font-mono-numbers truncate">
                LVL {snapshot.level || 1}/100
              </div>
            )}
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">HOSTILES PURGED</div>
            <div className="text-lg font-bold text-slate-200 font-mono-numbers">
              {snapshot.kills}
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-amber-500/30 bg-amber-500/5">
            <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">COINS EARNED</div>
            <div className="text-lg font-bold text-amber-400 font-mono-numbers">
              🪙 +{snapshot.coinsEarned}
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">MAX COMBO</div>
            <div className="text-base font-bold text-amber-400 font-mono-numbers">
              {snapshot.highestCombo}x STREAK
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">SURVIVAL TIME</div>
            <div className="text-base font-bold text-slate-200 font-mono-numbers">
              {Math.floor(snapshot.timeSurvivedSeconds / 60)}m {snapshot.timeSurvivedSeconds % 60}s
            </div>
          </div>
        </div>

        {/* Diamond Revive (New Life) Panel */}
        {onReviveWithDiamonds && (
          <div className="mb-4 p-3 rounded-lg border border-sky-400/50 bg-sky-950/35 text-left">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-sky-300 font-bold text-[11px] uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4 text-sky-400" />
                <span>CONTINUE LEVEL · NEW LIFE</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
                <span
                  data-testid="diamond-balance-badge"
                  className="px-2 py-0.5 rounded bg-slate-900/90 border border-sky-400/40 text-sky-200"
                >
                  💎 {diamonds}
                </span>
                <span className="text-slate-400">
                  {costInfo.remainingRevives}/{maxRevives} LEFT
                </span>
              </div>
            </div>

            <button
              type="button"
              data-testid="diamond-revive-btn"
              onClick={handleReviveClick}
              disabled={!validation.allowed}
              className={`w-full py-2.5 px-3 font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all ${
                validation.allowed
                  ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 cursor-pointer shadow-[0_0_24px_rgba(56,189,248,0.45)]'
                  : 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Gem className="w-4 h-4" />
              {costInfo.canRevive ? (
                <span>
                  REVIVE WITH DIAMONDS (<span data-testid="diamond-revive-cost">{costInfo.cost} 💎</span>)
                </span>
              ) : (
                <span data-testid="diamond-revive-cost">MAX REVIVES USED ({maxRevives}/{maxRevives})</span>
              )}
            </button>

            <div className="mt-1.5 text-[10px] leading-snug">
              {validation.allowed ? (
                <span className="text-sky-200/85">
                  Restores full HP & Shield with 2.5s spawn shield and keeps Level {snapshot.level || 1} progress.
                </span>
              ) : validation.reason === 'insufficient_diamonds' ? (
                <span data-testid="diamond-revive-insufficient" className="text-amber-300 font-medium">
                  Need {costInfo.cost} 💎 for a New Life (you have {diamonds} 💎). Complete Daily Missions to earn Diamonds.
                </span>
              ) : (
                <span className="text-slate-400">
                  Maximum {maxRevives} Diamond Revives reached for this run.
                </span>
              )}
              {reviveError && (
                <div className="mt-1 text-red-400 font-semibold">{reviveError}</div>
              )}
            </div>
          </div>
        )}

        {/* Action CTAs */}
        <div className="flex flex-col gap-2">
          <button
            data-start="true"
            onClick={onRestart}
            className="w-full py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(255,0,85,0.4)]"
          >
            <RotateCcw className="w-4 h-4" />
            REDEPLOY NABIL-BOT [SPACE / ENTER]
          </button>

          {onOpenMap && (
            <button
              onClick={onOpenMap}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,243,255,0.2)]"
            >
              <MapPin className="w-4 h-4 text-cyan-400" />
              CHOOSE MAP (DHAKA · RAJSHAHI · CHATTOGRAM · SYLHET)
            </button>
          )}

          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>👤 VIEW COMMANDER PROFILE</span>
            </button>
          )}

          {onOpenStore && (
            <button
              onClick={onOpenStore}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(255,180,0,0.3)]"
            >
              <ShoppingBag className="w-4 h-4" />
              VISIT WEAPON STORE (BUY WEAPONS)
            </button>
          )}

          <button
            onClick={onTitle}
            className="w-full py-1.5 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            RETURN TO HOME
          </button>
        </div>
      </div>
    </div>
  );
};

