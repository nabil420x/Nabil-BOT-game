import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Sparkles, RefreshCw, X, Globe, MapPin, Rocket, Shield } from 'lucide-react';
import { LeaderboardEntry, MapRegionId } from '../game/types';
import { LEVELS, REGIONS } from '../game/levels';
import { fetchGlobalLeaderboard } from '../game/leaderboard';
import { soundEngine } from '../game/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerScore?: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  playerScore,
}) => {
  const [filter, setFilter] = useState<MapRegionId | 'all'>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async (activeFilter: MapRegionId | 'all') => {
    setIsLoading(true);
    try {
      const data = await fetchGlobalLeaderboard(activeFilter);
      setEntries(data);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData(filter);
    }
  }, [isOpen, filter]);

  if (!isOpen) return null;

  const playerRow = entries.find((e) => e.isPlayer);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#070b16] border border-cyan-500/40 rounded-2xl shadow-[0_0_60px_rgba(0,243,255,0.25)] flex flex-col max-h-[90vh] overflow-hidden font-mono">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cyan-500/20 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(255,180,0,0.3)]">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black tracking-wider text-white">
                  GLOBAL CYBER LEADERBOARD
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 tracking-widest uppercase">
                  BANGLADESH 2077
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Top echelon cyber commanders across all {Object.keys(REGIONS).length} theaters ({LEVELS.length} sectors): Dhaka through Bengal Eternity Throne
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playPickup();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Leaderboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Navigation & Refresh Bar */}
        <div className="px-6 py-3.5 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                soundEngine.playPickup();
                setFilter('all');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,243,255,0.3)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🌐 GLOBAL APEX
            </button>
            <button
              onClick={() => {
                soundEngine.playPickup();
                setFilter('dhaka');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'dhaka'
                  ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🏙️ DHAKA GRID
            </button>
            <button
              onClick={() => {
                soundEngine.playPickup();
                setFilter('rajshahi');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'rajshahi'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🌳 RAJSHAHI
            </button>
            <button
              onClick={() => {
                soundEngine.playPickup();
                setFilter('chattogram');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'chattogram'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🔱 CHATTOGRAM
            </button>
            <button
              onClick={() => {
                soundEngine.playPickup();
                setFilter('sylhet');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'sylhet'
                  ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              💎 SYLHET
            </button>
            <button
              onClick={() => {
                soundEngine.playPickup();
                setFilter('sundarbans');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'sundarbans'
                  ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🌿 SUNDARBANS
            </button>
            <button
              onClick={() => {
                soundEngine.playPickup();
                setFilter('cox_orbit');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'cox_orbit'
                  ? 'bg-pink-500/20 border-pink-400 text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🛸 COX&apos;S ORBIT
            </button>
            <button
              onClick={() => {
                soundEngine.playPickup();
                setFilter('kuakata_abyss');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'kuakata_abyss'
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🌊 KUAKATA ABYSS
            </button>
            <button
              onClick={() => {
                soundEngine.playPickup();
                setFilter('bengal_singularity');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'bengal_singularity'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🌌 SINGULARITY
            </button>
            <button
              onClick={() => {
                soundEngine.playPickup();
                setFilter('barishal_nebula');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'barishal_nebula'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ✨ BARISHAL NEBULA
            </button>
            <button
              onClick={() => {
                soundEngine.playPickup();
                setFilter('rangpur_cryo');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'rangpur_cryo'
                  ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_10px_rgba(96,165,250,0.3)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ❄️ RANGPUR CRYO
            </button>
            <button
              onClick={() => {
                soundEngine.playPickup();
                setFilter('khulna_reactor');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'khulna_reactor'
                  ? 'bg-orange-500/20 border-orange-400 text-orange-300 shadow-[0_0_10px_rgba(251,146,60,0.3)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              ☢️ KHULNA CORE
            </button>
            <button
              onClick={() => {
                soundEngine.playPickup();
                setFilter('padma_eternity');
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'padma_eternity'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              👑 ETERNITY THRONE
            </button>
          </div>

          <button
            onClick={() => {
              soundEngine.playPickup();
              loadData(filter);
            }}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>SYNC DATA</span>
          </button>
        </div>

        {/* Player Quick Banner if present */}
        {playerRow && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/40 border-2 border-cyan-400/80 flex items-center justify-between shadow-[0_0_20px_rgba(0,243,255,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center font-black text-cyan-300">
                #{playerRow.rank}
              </div>
              <div>
                <div className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <span>YOUR ACTIVE COMMANDER DOSSIER</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                </div>
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <span>{playerRow.avatarBadge}</span>
                  <span>{playerRow.commanderName}</span>
                  <span className="text-xs text-slate-400 font-normal">({playerRow.callsign})</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-right">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">SECTOR REACHED</div>
                <div className="text-xs font-bold text-emerald-400">LEVEL {playerRow.highestLevel}/{LEVELS.length}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">RECORD SCORE</div>
                <div className="text-base sm:text-lg font-black text-amber-400 font-mono-numbers">
                  {playerRow.score.toLocaleString()} PTS
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Leaderboard List */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-cyan-400">
              <RefreshCw className="w-8 h-8 animate-spin" />
              <div className="text-xs font-bold tracking-widest uppercase">FETCHING GLOBAL SEC-NET TELEMETRY...</div>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const rankColor =
                  entry.rank === 1
                    ? 'text-amber-300 border-amber-400/70 bg-amber-500/15'
                    : entry.rank === 2
                    ? 'text-slate-200 border-slate-300/70 bg-slate-300/15'
                    : entry.rank === 3
                    ? 'text-amber-600 border-amber-600/70 bg-amber-700/15'
                    : 'text-slate-400 border-slate-800 bg-slate-900/40';

                return (
                  <div
                    key={entry.id}
                    className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      entry.isPlayer
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.25)]'
                        : isTop3
                        ? 'bg-slate-900/60 border-slate-700/80 hover:border-slate-600'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Rank Badge & Profile Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg border font-black flex items-center justify-center text-sm shrink-0 ${rankColor}`}
                      >
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-base">{entry.avatarBadge}</span>
                          <span className="font-bold text-sm text-white truncate tracking-wide">
                            {entry.commanderName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">[{entry.callsign}]</span>
                          {entry.isPlayer && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-cyan-400 text-slate-950 uppercase tracking-widest">
                              YOU
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            <span className="uppercase">
                              {REGIONS[entry.region]?.name ?? entry.region}
                            </span>
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Rocket className="w-3 h-3 text-amber-400" />
                            <span className="capitalize">{entry.activeCraft.replace('_', ' ')}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score & Sector */}
                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-black text-amber-300 font-mono-numbers">
                        {entry.score.toLocaleString()} <span className="text-[10px] text-amber-400/80">PTS</span>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                        SECTOR {entry.highestLevel} REACHED
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Global Sec-Net simulated telemetry · Standings refresh continuously based on arena battle purges</span>
          <button
            onClick={() => {
              soundEngine.playPickup();
              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
