import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Gauge } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { PerformanceMode } from '../game/rules';
import { PWAInstallButton } from './PWAInstallButton';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
  performanceMode?: PerformanceMode;
  onChangePerformanceMode?: (mode: PerformanceMode) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onTitle,
  performanceMode = 'auto',
  onChangePerformanceMode,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundEngine.getMuted());

  const handleToggleMute = () => {
    setIsMuted(soundEngine.toggleMute());
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 select-none">
      <div className="bg-[#0a1220] border-2 border-cyan-500/50 rounded-xl p-6 sm:p-8 max-w-sm w-full shadow-[0_0_50px_rgba(0,243,255,0.25)] text-center">
        <div className="mb-2">
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold font-mono">SIMULATION SUSPENDED</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-widest mb-6">GAME PAUSED</h2>

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.4)]"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            RESUME PROTOCOL
          </button>

          <button
            onClick={onRestart}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            RESTART MISSION
          </button>

          <PWAInstallButton variant="modal-action" label="DOWNLOAD / INSTALL APP" />

          <button
            onClick={onTitle}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 font-bold text-sm uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            RETURN TO TITLE
          </button>
        </div>

        {onChangePerformanceMode && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-left">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-2">
              <span className="flex items-center gap-1.5 font-bold text-cyan-300">
                <Gauge className="w-3.5 h-3.5" /> PHONE / FPS MODE:
              </span>
              <span className="text-[10px] text-slate-400 uppercase">
                {performanceMode === 'mobile_turbo' ? 'ZERO-LAG' : performanceMode === 'high' ? 'MAX FX' : 'SMART'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: 'auto', label: 'AUTO' },
                  { id: 'mobile_turbo', label: 'TURBO' },
                  { id: 'high', label: 'HIGH FX' },
                ] as const
              ).map((opt) => {
                const active = performanceMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    data-testid={`pause-perf-${opt.id}`}
                    onClick={() => onChangePerformanceMode(opt.id)}
                    className={`py-1.5 rounded text-[10px] font-mono font-black tracking-wider border transition-colors cursor-pointer ${
                      active
                        ? opt.id === 'mobile_turbo'
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                          : 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>AUDIO STATUS:</span>
          <button
            onClick={handleToggleMute}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-700 rounded text-cyan-400 hover:text-cyan-300 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'MUTED' : 'ACTIVE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
