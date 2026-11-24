import React, { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, Sparkles, X } from 'lucide-react';
import {
  SystemHealthSnapshot,
  formatMemoryUsageLabel,
} from '../game/rules';

interface SystemHealthOverlayProps {
  getSnapshot: () => SystemHealthSnapshot | null;
  onClearEffects: () => void;
  onClose: () => void;
}

const HISTORY_LENGTH = 16;

export const SystemHealthOverlay: React.FC<SystemHealthOverlayProps> = ({
  getSnapshot,
  onClearEffects,
  onClose,
}) => {
  const [snapshot, setSnapshot] = useState<SystemHealthSnapshot | null>(() => getSnapshot());
  const [fpsHistory, setFpsHistory] = useState<number[]>(() => {
    const initial = getSnapshot()?.fps ?? 60;
    return Array.from({ length: HISTORY_LENGTH }, () => initial);
  });
  const [clearedBanner, setClearedBanner] = useState(false);

  useEffect(() => {
    const poll = () => {
      const next = getSnapshot();
      if (!next) return;
      setSnapshot(next);
      setFpsHistory((prev) => [...prev.slice(-(HISTORY_LENGTH - 1)), next.fps]);
    };
    poll();
    const timer = window.setInterval(poll, 500);
    return () => window.clearInterval(timer);
  }, [getSnapshot]);

  if (!snapshot) return null;

  const statusTone =
    snapshot.healthStatus === 'OPTIMAL'
      ? {
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50',
          fpsText: 'text-emerald-300',
          barColor: 'bg-emerald-400',
          border: 'border-cyan-500/40',
        }
      : snapshot.healthStatus === 'MODERATE'
      ? {
          badge: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
          fpsText: 'text-amber-300',
          barColor: 'bg-amber-400',
          border: 'border-amber-400/50',
        }
      : {
          badge: 'bg-rose-500/20 text-rose-300 border-rose-400/60',
          fpsText: 'text-rose-300',
          barColor: 'bg-rose-500',
          border: 'border-rose-500/60',
        };

  const memoryLabel = formatMemoryUsageLabel(snapshot.memoryUsedMb, snapshot.memoryLimitMb);
  const memBarWidth = snapshot.memoryPercent !== null ? Math.max(4, snapshot.memoryPercent) : 0;

  const handleClearClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.blur();
    onClearEffects();
    setClearedBanner(true);
    window.setTimeout(() => setClearedBanner(false), 900);
  };

  const handleCloseClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.blur();
    onClose();
  };

  return (
    <aside
      data-testid="system-health-overlay"
      aria-label="System Health Telemetry"
      className={`pointer-events-auto fixed bottom-28 left-4 sm:left-6 z-30 w-64 bg-[#070d18]/94 border ${statusTone.border} rounded-lg p-3 shadow-[0_6px_20px_rgba(0,0,0,0.6)] text-[11px] font-mono text-slate-200 select-none`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/90">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-bold tracking-wider text-cyan-300 text-[10px]">
            SYSTEM HEALTH
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            data-testid="syshealth-status"
            className={`px-1.5 py-0.5 rounded border text-[9px] font-black tracking-wider ${statusTone.badge}`}
          >
            {snapshot.healthStatus}
          </span>
          <button
            type="button"
            data-testid="syshealth-close"
            onClick={handleCloseClick}
            tabIndex={-1}
            title="Hide System Health (F3)"
            aria-label="Hide System Health"
            className="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary FPS + Sparkline */}
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-slate-400">FRAME RATE</div>
          <div className="flex items-baseline gap-1">
            <span
              data-testid="syshealth-fps"
              className={`text-xl font-black font-mono-numbers tabular-nums leading-none ${statusTone.fpsText}`}
            >
              {snapshot.fps}
            </span>
            <span className="text-[10px] text-slate-400 font-bold">FPS</span>
          </div>
        </div>

        {/* 16-bar Sparkline */}
        <div
          aria-hidden="true"
          className="flex items-end gap-[2px] h-7 px-1.5 py-1 rounded bg-slate-950/80 border border-slate-800/80"
        >
          {fpsHistory.map((val, idx) => {
            const pct = Math.max(12, Math.min(100, Math.round((val / 60) * 100)));
            const color =
              val >= 50 ? 'bg-emerald-400/90' : val >= 30 ? 'bg-amber-400/90' : 'bg-rose-500/90';
            return (
              <span
                key={idx}
                className={`w-1 rounded-xs ${color} transition-all duration-150`}
                style={{ height: `${pct}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* CPU Work & Frame Budget */}
      <div className="mt-2 grid grid-cols-3 gap-1.5 bg-slate-950/75 rounded px-2 py-1.5 border border-slate-800/70 text-[10px]">
        <div>
          <div className="text-[8px] text-slate-400 uppercase flex items-center gap-0.5">
            <Cpu className="w-2.5 h-2.5 text-cyan-400" />
            CPU
          </div>
          <div data-testid="syshealth-workms" className="font-bold tabular-nums text-slate-100">
            {snapshot.workMs.toFixed(1)}ms
          </div>
        </div>
        <div>
          <div className="text-[8px] text-slate-400 uppercase">FRAME</div>
          <div className="font-bold tabular-nums text-slate-100">
            {snapshot.avgFrameMs.toFixed(1)}ms
          </div>
        </div>
        <div>
          <div className="text-[8px] text-slate-400 uppercase">DROPS</div>
          <div
            className={`font-bold tabular-nums ${
              snapshot.frameDrops >= 3 ? 'text-amber-300' : 'text-slate-100'
            }`}
          >
            {snapshot.frameDrops}
          </div>
        </div>
      </div>

      {/* Memory Usage */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="flex items-center gap-1 text-slate-400 uppercase text-[9px]">
            <HardDrive className="w-2.5 h-2.5 text-cyan-400" />
            JS HEAP
          </span>
          <span
            data-testid="syshealth-memory"
            className="font-bold tabular-nums text-cyan-200 truncate max-w-[145px]"
            title={memoryLabel}
          >
            {memoryLabel}
          </span>
        </div>
        {snapshot.memoryPercent !== null && (
          <div className="mt-1 w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                snapshot.memoryPercent >= 75
                  ? 'bg-rose-500'
                  : snapshot.memoryPercent >= 50
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
              }`}
              style={{ width: `${memBarWidth}%` }}
            />
          </div>
        )}
      </div>

      {/* Diagnostic Hint */}
      <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[9px] text-slate-300 leading-snug">
        {snapshot.diagnosticHint}
      </div>

      {/* Scene Entities, DPR & Quick Troubleshoot Action */}
      <div className="mt-1.5 flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
        <span data-testid="syshealth-entities" className="text-[9px] text-slate-400 tabular-nums">
          {snapshot.activeEnemies}E · {snapshot.activeProjectiles}P · {snapshot.activeParticles}FX · {snapshot.canvasDpr}x
        </span>
        <button
          type="button"
          data-testid="syshealth-clear-fx"
          onClick={handleClearClick}
          tabIndex={-1}
          className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-200 text-[9px] font-bold tracking-wider transition-colors cursor-pointer"
          title="Clear active particles & floating damage numbers"
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>{clearedBanner ? 'CLEARED' : 'CLEAR FX'}</span>
        </button>
      </div>
    </aside>
  );
};
