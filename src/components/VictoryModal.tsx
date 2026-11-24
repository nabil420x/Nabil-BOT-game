import React, { useEffect, useRef } from 'react';
import { Trophy, RotateCcw, Home, ShoppingBag } from 'lucide-react';
import { RunSnapshot } from '../game/types';
import { LEVELS, REGIONS } from '../game/levels';
import {
  createCyberShatterState,
  emitCyberShatterBurst,
  renderCyberShatterFrame,
  stepCyberShatterState,
} from '../game/victoryFx';

interface VictoryModalProps {
  snapshot: RunSnapshot;
  onRestart: () => void;
  onTitle: () => void;
  onOpenStore?: () => void;
  onOpenMap?: () => void;
  onOpenProfile?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  snapshot,
  onRestart,
  onTitle,
  onOpenStore,
  onOpenMap,
  onOpenProfile,
}) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = overlayRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

    let width = container.clientWidth || window.innerWidth || 800;
    let height = container.clientHeight || window.innerHeight || 600;
    let dpr = Math.min(2, window.devicePixelRatio || 1);

    const syncSize = () => {
      width = Math.max(1, container.clientWidth || window.innerWidth || 800);
      height = Math.max(1, container.clientHeight || window.innerHeight || 600);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    syncSize();
    const state = createCyberShatterState(width, height, reducedMotion);
    renderCyberShatterFrame(ctx, state);

    let animId: number | null = null;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.max(0.001, (now - lastTime) / 1000);
      lastTime = now;
      state.width = width;
      state.height = height;
      stepCyberShatterState(state, dt);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderCyberShatterFrame(ctx, state);
      animId = requestAnimationFrame(tick);
    };

    if (!reducedMotion) {
      animId = requestAnimationFrame(tick);
    }

    const handleResize = () => {
      syncSize();
      state.width = width;
      state.height = height;
      if (reducedMotion) {
        renderCyberShatterFrame(ctx, state);
      }
    };

    const handleOverlayPointer = (e: PointerEvent) => {
      if (reducedMotion) return;
      const rect = container.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      emitCyberShatterBurst(state, px, py, 24, 0.9);
    };

    window.addEventListener('resize', handleResize);
    container.addEventListener('pointerdown', handleOverlayPointer);

    return () => {
      if (animId !== null) cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handleOverlayPointer);
    };
  }, []);

  return (
    <div
      ref={overlayRef}
      data-testid="victory-modal"
      className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        data-testid="victory-cyber-shatter-canvas"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />
      <div className="relative z-10 bg-[#071318]/95 border-2 border-cyan-400 rounded-xl p-6 sm:p-8 max-w-md w-full max-h-[94dvh] overflow-y-auto shadow-[0_0_70px_rgba(0,243,255,0.45)] text-center">
        {/* Header Icon & Title */}
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-cyan-400/20 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_24px_rgba(0,243,255,0.45)]">
          <Trophy className="w-7 h-7 text-cyan-300" />
        </div>

        <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold font-mono">
          {snapshot.isBossRush
            ? 'ALL 6 CYBER TITANS VANQUISHED · CHAMPION CROWNED'
            : `ALL ${Object.keys(REGIONS).length} REGIONS LIBERATED · NABIL-BOT SUPREME`}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-widest mb-4">
          {snapshot.isBossRush ? 'BOSS RUSH CHAMPION' : 'SUPREME VICTORY'}
        </h2>

        {/* Tabular Run Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 text-left">
          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">TOTAL SCORE</div>
            <div className="text-xl font-bold text-cyan-300 font-mono-numbers">
              {snapshot.score.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              {snapshot.isBossRush ? 'TITANS DEFEATED' : 'SECTORS CONQUERED'}
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono-numbers">
              {snapshot.isBossRush
                ? `${snapshot.bossRushTotalStages || 6}/${snapshot.bossRushTotalStages || 6} TITANS`
                : `${LEVELS.length}/${LEVELS.length} SECTORS`}
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">SWARM PURGED</div>
            <div className="text-lg font-bold text-slate-200 font-mono-numbers">
              {snapshot.kills} HOSTILES
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-amber-500/40 bg-amber-500/10">
            <div className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">COINS EARNED</div>
            <div className="text-lg font-bold text-amber-400 font-mono-numbers">
              🪙 +{snapshot.coinsEarned}
            </div>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800 col-span-2">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">TOTAL COMBAT TIME</div>
            <div className="text-base font-bold text-slate-200 font-mono-numbers">
              {Math.floor(snapshot.timeSurvivedSeconds / 60)}m {snapshot.timeSurvivedSeconds % 60}s
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col gap-2">
          <button
            data-start="true"
            onClick={onRestart}
            className="w-full py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(0,243,255,0.5)]"
          >
            <RotateCcw className="w-4 h-4 fill-slate-950" />
            {snapshot.isBossRush ? 'REPLAY BOSS RUSH [SPACE / ENTER]' : 'DEPLOY ENDLESS OVERCLOCK [SPACE / ENTER]'}
          </button>

          {onOpenMap && (
            <button
              onClick={onOpenMap}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>🗺️ EXPLORE OTHER MAPS</span>
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
              VISIT WEAPON STORE (UPGRADE ARSENAL)
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
