import React from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Crown,
  Clock,
  Zap,
  Eye,
  LogOut,
  Link2,
  Check,
  Navigation,
  Video,
  Wind,
  Activity,
  Maximize2,
  Minimize2,
  Shield,
} from 'lucide-react';
import {
  CYBER_MOMENTUM_DURATION_SECONDS,
  CYBER_MOMENTUM_KILL_THRESHOLD,
  buildDuelWatchUrl,
  computeDuelTeamScores,
  formatDuelTimer,
  isPurePvpFormat,
  sortDuelRosterByScore,
  type DuelCameraMode,
  type DuelHudSnapshot,
  type DuelMatchFormat,
  type DuelPlayerScore,
  type DuelSpectatorCamera,
} from '../game/duel';
import type { WeaponType } from '../game/types';
import { WEAPONS } from '../game/weapons';
import { soundEngine } from '../game/audio';
import { getLevelDef } from '../game/levels';
import { BASE_DASH_COOLDOWN_SECONDS, COMBO_FINISHER_THRESHOLD, computeDashGaugeState } from '../game/rules';

const WEAPON_KEYS: { id: WeaponType; keyHint: string }[] = [
  { id: 'pulse', keyHint: '1' },
  { id: 'scatter', keyHint: '2' },
  { id: 'beam', keyHint: '3' },
  { id: 'missile', keyHint: '4' },
  { id: 'leviathan', keyHint: '5' },
  { id: 'vortex', keyHint: '6' },
  { id: 'inferno', keyHint: '7' },
  { id: 'chrono_thunder', keyHint: '8' },
  { id: 'supernova', keyHint: '9' },
  { id: 'aegis_titan', keyHint: '0' },
  { id: 'hyperion_astral', keyHint: 'X' },
  { id: 'plasma_scythe', keyHint: 'Z' },
  { id: 'cryo_shatter', keyHint: 'C' },
  { id: 'omega_singularity', keyHint: 'V' },
  { id: 'prism_splitter', keyHint: 'F' },
  { id: 'void_rail', keyHint: 'G' },
  { id: 'celestial_eclipse', keyHint: 'Y' },
];

interface CyberDuelHUDProps {
  duel: DuelHudSnapshot;
  onPause: () => void;
  onChangeSpectatorCamera?: (cam: DuelSpectatorCamera) => void;
  onChangeCameraMode?: (cam: DuelCameraMode) => void;
  onToggleFreePointerMove?: (enabled: boolean) => void;
  onSelectWeapon?: (weapon: WeaponType) => void;
  onTriggerDash?: () => void;
  onTriggerFinisher?: () => void;
  onDeployWall?: () => void;
  onLeaveSpectate?: () => void;
  systemHealthOpen?: boolean;
  onToggleSystemHealth?: () => void;
  compactMobile?: boolean;
  touchControlsEnabled?: boolean;
  isFullscreen?: boolean;
  onRequestLandscape?: () => void;
  onExitFullscreen?: () => void;
}

const PlayerScoreCard: React.FC<{
  player: DuelPlayerScore;
  rank: number;
  isLeader: boolean;
  align: 'left' | 'right';
}> = ({ player, rank, isLeader, align }) => {
  const isP1 = player.team ? player.team === 'alpha' : player.slot === 'p1';
  const borderClass =
    player.momentumTimer > 0
      ? isP1
        ? 'border-cyan-300 shadow-[0_0_24px_rgba(0,243,255,0.45)]'
        : 'border-pink-400 shadow-[0_0_24px_rgba(255,0,119,0.45)]'
      : isP1
      ? 'border-cyan-500/45 shadow-[0_6px_24px_rgba(0,0,0,0.55)]'
      : 'border-pink-500/45 shadow-[0_6px_24px_rgba(0,0,0,0.55)]';
  const accentText = isP1 ? 'text-cyan-300' : 'text-pink-300';
  const barColor = isP1 ? 'bg-cyan-400' : 'bg-pink-500';
  const shieldPct = Math.max(0, Math.min(100, (player.shield / Math.max(1, player.maxShield)) * 100));
  const momentumActive = player.momentumTimer > 0;
  const momentumPct = Math.max(
    0,
    Math.min(100, (player.momentumTimer / CYBER_MOMENTUM_DURATION_SECONDS) * 100)
  );

  return (
    <div
      data-testid={`duel-card-${player.slot}`}
      className={`bg-[#09111f]/95 border ${borderClass} rounded-lg px-3.5 py-2.5 min-w-[220px] sm:min-w-[260px] transition-colors`}
    >
      <div className={`flex items-center justify-between gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-black font-mono-numbers text-slate-400">#{rank}</span>
          <span className={`text-sm font-bold truncate max-w-[125px] ${accentText}`}>
            {player.name}
          </span>
          {isLeader && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
        </div>
        <span className="text-lg font-black font-mono-numbers text-white tabular-nums" data-testid={`duel-points-${player.slot}`}>
          {player.totalPoints.toLocaleString()}
        </span>
      </div>

      <div className={`mt-1.5 flex flex-wrap items-center justify-between gap-x-2.5 gap-y-0.5 text-xs font-mono-numbers text-slate-300 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <span data-testid={`duel-kills-${player.slot}`}>
          Kills: <strong className="text-white">{player.kills}</strong>
          {player.pvpKills > 0 && (
            <span className="ml-1 text-pink-300 font-bold" title="PvP Takedowns">
              ({player.pvpKills} PvP)
            </span>
          )}
        </span>
        <span>
          Streak: <strong className="text-amber-300">{player.comboStreak}x</strong>
        </span>
        <span>
          HP: <strong className="text-emerald-300">{player.hp}/{player.maxHp}</strong>
        </span>
      </div>

      <div className="mt-1.5 w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} transition-all duration-100`} style={{ width: `${shieldPct}%` }} />
      </div>

      {/* Cyber Momentum Speed Boost Indicator / 3-Kill Charge */}
      <div className="mt-2 pt-1.5 border-t border-slate-800/80" data-testid={`duel-momentum-${player.slot}`}>
        {momentumActive ? (
          <div>
            <div className={`flex items-center justify-between text-[11px] font-bold font-mono-numbers ${align === 'right' ? 'flex-row-reverse' : ''}`}>
              <span className={`flex items-center gap-1 ${isP1 ? 'text-cyan-300' : 'text-pink-300'}`}>
                <Zap className="w-3 h-3 shrink-0" />
                <span>Cyber Momentum +35%</span>
              </span>
              <span className="text-white tabular-nums">{player.momentumTimer.toFixed(1)}s</span>
            </div>
            <div className="mt-1 w-full h-1 bg-slate-900 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${isP1 ? 'bg-cyan-300' : 'bg-pink-400'}`}
                style={{ width: `${momentumPct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className={`flex items-center justify-between text-[11px] font-mono-numbers text-slate-400 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-slate-500 shrink-0" />
              <span>Momentum {player.momentumKills}/{CYBER_MOMENTUM_KILL_THRESHOLD}</span>
            </span>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((idx) => (
                <span
                  key={idx}
                  className={`w-3.5 h-1.5 rounded-xs ${
                    idx < player.momentumKills
                      ? isP1
                        ? 'bg-cyan-400'
                        : 'bg-pink-500'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 20-Hit Combo Finisher Charge Indicator */}
      <div
        className={`mt-1.5 flex items-center justify-between text-[10px] font-mono-numbers ${
          align === 'right' ? 'flex-row-reverse' : ''
        }`}
        data-testid={`duel-finisher-status-${player.slot}`}
      >
        <span className={player.finisherReady ? 'text-amber-300 font-bold' : 'text-slate-400'}>
          {player.finisherReady ? '⚡ FINISHER READY!' : `Finisher ${Math.min(COMBO_FINISHER_THRESHOLD, player.finisherCharge || 0)}/${COMBO_FINISHER_THRESHOLD}`}
        </span>
        <div className="w-20 h-1 bg-slate-900 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${player.finisherReady ? 'bg-amber-400' : 'bg-amber-500/70'}`}
            style={{
              width: `${Math.min(
                100,
                ((player.finisherReady ? COMBO_FINISHER_THRESHOLD : player.finisherCharge || 0) /
                  COMBO_FINISHER_THRESHOLD) *
                  100
              )}%`,
            }}
          />
        </div>
      </div>

      {player.respawnTimer > 0 && (
        <div className="mt-1 text-[11px] font-bold text-rose-400 font-mono-numbers">
          Rebooting in {player.respawnTimer.toFixed(1)}s
        </div>
      )}
    </div>
  );
};

const CompactMobilePilotPill: React.FC<{
  player: DuelPlayerScore;
  isLeader: boolean;
  align: 'left' | 'right';
}> = ({ player, isLeader, align }) => {
  const isP1 = player.team ? player.team === 'alpha' : player.slot === 'p1';
  const hpPct = Math.max(0, Math.min(100, (player.hp / Math.max(1, player.maxHp)) * 100));
  const shieldPct = Math.max(0, Math.min(100, (player.shield / Math.max(1, player.maxShield)) * 100));
  const accentText = isP1 ? 'text-cyan-300' : 'text-pink-300';
  const borderClass = isP1 ? 'border-cyan-500/45' : 'border-pink-500/45';

  return (
    <div
      data-testid={`duel-card-${player.slot}`}
      className={`bg-[#09111f]/90 border ${borderClass} rounded-lg px-2 py-1 min-w-[96px] max-w-[148px] sm:max-w-[178px] flex-1 shadow-[0_2px_10px_rgba(0,0,0,0.5)]`}
    >
      <div className={`flex items-center justify-between gap-1.5 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-1 min-w-0 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
          {isLeader && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
          <span className={`text-[11px] font-bold truncate ${accentText}`}>{player.name}</span>
        </div>
        <span
          className="text-xs font-black font-mono-numbers text-white tabular-nums shrink-0"
          data-testid={`duel-points-${player.slot}`}
        >
          {player.totalPoints.toLocaleString()}
        </span>
      </div>

      {/* Slim Mini-Militia dual HP + Shield gauge */}
      <div className="mt-1 flex flex-col gap-0.5">
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${hpPct <= 30 ? 'bg-rose-400' : 'bg-emerald-400'}`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 ${isP1 ? 'bg-cyan-400' : 'bg-pink-400'}`}
            style={{ width: `${shieldPct}%` }}
          />
        </div>
      </div>

      <div
        className={`mt-0.5 flex items-center justify-between gap-1.5 text-[9px] font-mono-numbers text-slate-300 ${
          align === 'right' ? 'flex-row-reverse' : ''
        }`}
      >
        <span data-testid={`duel-kills-${player.slot}`}>
          {player.pvpKills > 0 ? `${player.pvpKills} KO` : `${player.kills} K`}
        </span>
        <span className={player.finisherReady ? 'text-amber-300 font-bold' : 'text-slate-400'}>
          {player.respawnTimer > 0
            ? `${player.respawnTimer.toFixed(1)}s`
            : player.finisherReady
            ? 'NOVA!'
            : `HP ${player.hp}/${player.maxHp}`}
        </span>
      </div>
    </div>
  );
};

export const CyberDuelHUD: React.FC<CyberDuelHUDProps> = ({
  duel,
  onPause,
  onChangeSpectatorCamera,
  onChangeCameraMode,
  onToggleFreePointerMove,
  onSelectWeapon,
  onTriggerDash,
  onTriggerFinisher,
  onDeployWall,
  onLeaveSpectate,
  systemHealthOpen = false,
  onToggleSystemHealth,
  compactMobile = false,
  touchControlsEnabled = true,
  isFullscreen = false,
  onRequestLandscape,
  onExitFullscreen,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundEngine.getMuted());
  const [copiedWatch, setCopiedWatch] = React.useState(false);
  const matchFormat: DuelMatchFormat = duel.matchFormat || 'pvpve_1v1';
  const isPurePvp = isPurePvpFormat(matchFormat);
  const isTeamMode = matchFormat === 'pvp_team';
  const roster = duel.players && duel.players.length > 0 ? duel.players : [duel.p1, duel.p2];
  const ranked = sortDuelRosterByScore(roster);
  const first = ranked[0] || duel.p1;
  const second = ranked[1] || duel.p2;
  const isTie = first.totalPoints === second.totalPoints && first.pvpKills === second.pvpKills && first.kills === second.kills;
  const teamScores = isTeamMode ? computeDuelTeamScores(roster) : null;
  const alphaMembers = isTeamMode ? roster.filter((p) => (p.team || 'alpha') === 'alpha') : [];
  const omegaMembers = isTeamMode ? roster.filter((p) => p.team === 'omega') : [];
  const allConnected = roster.every((p) => p.connected);
  const localPilot = roster.find((p) => p.slot === (duel.localSlot || 'p1')) || duel.p1;
  const rivalLeader = ranked.find((p) => p.slot !== localPilot.slot) || duel.p2;

  const lvlDef = getLevelDef(duel.level);
  const mapLabel = duel.mapTheme === 'cyber_forest_ruins' ? 'Crystal Conduit Ruins' : lvlDef.name;
  const isUrgent = duel.timeRemaining <= 15;
  const isWarning = duel.timeRemaining <= 30 && !isUrgent;
  const activeCamera: DuelSpectatorCamera = duel.spectatorCamera || 'both';
  const duelCameraMode: DuelCameraMode = duel.cameraMode || 'both';
  const freePointerMove = duel.freePointerMove ?? true;
  const activeWeapon = duel.activeWeapon || 'pulse';
  const unlockedWeapons: Partial<Record<WeaponType, boolean>> = duel.unlockedWeapons || { pulse: true };
  const dashGauge = computeDashGaugeState(
    duel.dashCooldownTimer ?? 0,
    duel.dashCooldown ?? BASE_DASH_COOLDOWN_SECONDS
  );
  const dashReady = dashGauge.isReady;
  const wallCharges = duel.wallCharges ?? 2;
  const maxWallCharges = duel.maxWallCharges ?? 2;
  const wallCd = duel.wallCooldownTimer ?? 0;
  const wallCdTotal = Math.max(1, duel.wallCooldownTotal ?? 6);
  const wallReady = wallCharges > 0;
  const wallChargePct = wallReady ? 100 : Math.max(0, Math.min(100, ((wallCdTotal - wallCd) / wallCdTotal) * 100));

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(soundEngine.toggleMute());
  };

  const handleCopyWatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!duel.roomCode || typeof window === 'undefined') return;
    navigator.clipboard?.writeText(buildDuelWatchUrl(window.location.origin, duel.roomCode));
    setCopiedWatch(true);
    setTimeout(() => setCopiedWatch(false), 1800);
  };

  const leadBannerText = (() => {
    if (isTeamMode && teamScores) {
      const alpha = teamScores.alpha;
      const omega = teamScores.omega;
      if (alpha.totalPoints === omega.totalPoints) return 'Teams Tied';
      return alpha.totalPoints > omega.totalPoints
        ? `Cyan Alpha +${alpha.totalPoints - omega.totalPoints}`
        : `Magenta Omega +${omega.totalPoints - alpha.totalPoints}`;
    }
    return isTie ? 'Tied Match' : `${first.name} leads (+${first.totalPoints - second.totalPoints})`;
  })();

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-20 flex flex-col justify-between select-none ${
        compactMobile ? 'p-2' : 'p-3 sm:p-5'
      }`}
    >
      {compactMobile ? (
        /* Ultra-Slim Mini-Militia Top Edge Bar for Mobile Portrait (<560px) & Mobile Landscape (>=560px) */
        <div
          data-testid="duel-compact-mobile-topbar"
          className="w-full flex flex-col min-[560px]:flex-row min-[560px]:items-start min-[560px]:justify-between gap-1.5"
        >
          {/* Portrait Row 1 (<560px): Timer Badge + Action Icons cleanly side-by-side without crowding players */}
          <div className="flex min-[560px]:hidden w-full items-center justify-between gap-1.5">
            <div className="flex items-center gap-2 bg-[#09111f]/90 border border-cyan-500/40 rounded-lg px-2.5 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
              <span
                data-testid="duel-countdown-timer"
                className={`text-sm font-black font-mono-numbers tabular-nums leading-none ${
                  isUrgent ? 'text-rose-400 animate-pulse' : isWarning ? 'text-amber-300' : 'text-white'
                }`}
              >
                {formatDuelTimer(duel.timeRemaining)}
              </span>
              {duel.mode === 'online' && duel.roomCode && (
                <span className="text-[9px] font-mono font-bold text-cyan-300">{duel.roomCode}</span>
              )}
              {isPurePvp && (
                <span
                  data-testid="pure-pvp-hud-badge"
                  className="px-1 rounded bg-purple-500/25 border border-purple-400/50 text-purple-200 text-[8px] font-mono font-bold"
                >
                  {isTeamMode ? 'TEAM' : 'PVP'}
                </span>
              )}
              {duel.mode === 'online' && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    allConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                  }`}
                />
              )}
            </div>

            <div className="flex items-center gap-1 pointer-events-auto shrink-0">
              {(onRequestLandscape || onExitFullscreen) && (
                <button
                  type="button"
                  data-testid="hud-landscape-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.currentTarget.blur();
                    if (isFullscreen) {
                      onExitFullscreen?.();
                    } else {
                      onRequestLandscape?.();
                    }
                  }}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isFullscreen
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60'
                      : 'bg-[#09111f]/90 text-cyan-300 border-cyan-500/35 hover:bg-slate-800'
                  }`}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Landscape Fullscreen'}
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Landscape Fullscreen'}
                  tabIndex={-1}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              )}
              {duel.mode === 'online' && duel.roomCode && (
                <button
                  type="button"
                  onClick={handleCopyWatch}
                  className="p-1.5 bg-[#09111f]/90 text-cyan-300 rounded-lg border border-cyan-500/35 hover:bg-slate-800 cursor-pointer"
                  title="Copy Watch Link"
                  aria-label="Copy Watch Link"
                  tabIndex={-1}
                >
                  {copiedWatch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 bg-[#09111f]/90 hover:bg-slate-800 text-cyan-400 rounded-lg border border-cyan-500/35 cursor-pointer"
                title="Mute Audio"
                aria-label="Mute Audio"
                tabIndex={-1}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              {duel.isSpectator && onLeaveSpectate ? (
                <button
                  type="button"
                  onClick={onLeaveSpectate}
                  data-testid="hud-leave-spectate"
                  className="p-1.5 bg-[#09111f]/90 hover:bg-rose-950 text-rose-300 rounded-lg border border-rose-500/40 cursor-pointer"
                  title="Exit Spectator View"
                  aria-label="Exit Spectator View"
                  tabIndex={-1}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPause}
                  className="p-1.5 bg-[#09111f]/90 hover:bg-slate-800 text-cyan-400 rounded-lg border border-cyan-500/35 cursor-pointer"
                  title="Pause Game"
                  aria-label="Pause Game"
                  tabIndex={-1}
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Portrait Row 2 (<560px): Equal-width Pilot vs Rival Bars with zero overlap */}
          <div className="flex min-[560px]:hidden w-full items-stretch justify-between gap-1.5">
            <CompactMobilePilotPill
              player={isTeamMode ? (alphaMembers[0] || localPilot) : (roster.length > 2 ? localPilot : duel.p1)}
              isLeader={!isTie && first.slot === (roster.length > 2 ? localPilot.slot : duel.p1.slot)}
              align="left"
            />
            <CompactMobilePilotPill
              player={isTeamMode ? (omegaMembers[0] || rivalLeader) : (roster.length > 2 ? rivalLeader : duel.p2)}
              isLeader={!isTie && first.slot === (roster.length > 2 ? rivalLeader.slot : duel.p2.slot)}
              align="right"
            />
          </div>

          {/* Mobile Landscape (>=560px): True Left Pilot + Centered Timer + Right Rival & Controls */}
          <div className="hidden min-[560px]:flex w-full items-start justify-between gap-2">
            <div className="w-[175px] shrink-0">
              <CompactMobilePilotPill
                player={isTeamMode ? (alphaMembers[0] || localPilot) : (roster.length > 2 ? localPilot : duel.p1)}
                isLeader={!isTie && first.slot === (roster.length > 2 ? localPilot.slot : duel.p1.slot)}
                align="left"
              />
            </div>

            <div className="flex flex-col items-center bg-[#09111f]/90 border border-cyan-500/40 rounded-lg px-3 py-1 shrink-0 shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
              <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-slate-300">
                {duel.mode === 'online' && duel.roomCode ? (
                  <span className="text-cyan-300">{duel.roomCode}</span>
                ) : (
                  <span>ARENA</span>
                )}
                {isPurePvp && (
                  <span
                    data-testid="pure-pvp-hud-badge"
                    className="px-1 py-0 rounded bg-purple-500/25 border border-purple-400/50 text-purple-200 text-[8px]"
                  >
                    {isTeamMode ? 'TEAM' : 'PVP'}
                  </span>
                )}
                {duel.mode === 'online' && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      allConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                    }`}
                  />
                )}
              </div>
              <div
                data-testid="duel-countdown-timer"
                className={`text-lg font-black font-mono-numbers tabular-nums leading-tight ${
                  isUrgent ? 'text-rose-400 animate-pulse' : isWarning ? 'text-amber-300' : 'text-white'
                }`}
              >
                {formatDuelTimer(duel.timeRemaining)}
              </div>
              <span className="text-[8px] font-mono text-slate-400 truncate max-w-[100px]">
                {isTeamMode && teamScores
                  ? `${teamScores.alpha.totalPoints}-${teamScores.omega.totalPoints}`
                  : isTie
                  ? 'Tied'
                  : `${first.name.slice(0, 8)} +${first.totalPoints - second.totalPoints}`}
              </span>
            </div>

            <div className="flex items-start justify-end gap-1.5 shrink-0">
              <div className="w-[165px]">
                <CompactMobilePilotPill
                  player={isTeamMode ? (omegaMembers[0] || rivalLeader) : (roster.length > 2 ? rivalLeader : duel.p2)}
                  isLeader={!isTie && first.slot === (roster.length > 2 ? rivalLeader.slot : duel.p2.slot)}
                  align="right"
                />
              </div>
              <div className="flex items-center gap-1 pointer-events-auto shrink-0">
                {(onRequestLandscape || onExitFullscreen) && (
                  <button
                    type="button"
                    data-testid="hud-landscape-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.currentTarget.blur();
                      if (isFullscreen) {
                        onExitFullscreen?.();
                      } else {
                        onRequestLandscape?.();
                      }
                    }}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isFullscreen
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60'
                        : 'bg-[#09111f]/90 text-cyan-300 border-cyan-500/35 hover:bg-slate-800'
                    }`}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Landscape Fullscreen'}
                    aria-label={isFullscreen ? 'Exit Fullscreen' : 'Landscape Fullscreen'}
                    tabIndex={-1}
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                )}
                {duel.mode === 'online' && duel.roomCode && (
                  <button
                    type="button"
                    onClick={handleCopyWatch}
                    className="p-1.5 bg-[#09111f]/90 text-cyan-300 rounded-lg border border-cyan-500/35 hover:bg-slate-800 cursor-pointer"
                    title="Copy Watch Link"
                    aria-label="Copy Watch Link"
                    tabIndex={-1}
                  >
                    {copiedWatch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 bg-[#09111f]/90 hover:bg-slate-800 text-cyan-400 rounded-lg border border-cyan-500/35 cursor-pointer"
                  title="Mute Audio"
                  aria-label="Mute Audio"
                  tabIndex={-1}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                {duel.isSpectator && onLeaveSpectate ? (
                  <button
                    type="button"
                    onClick={onLeaveSpectate}
                    data-testid="hud-leave-spectate"
                    className="p-1.5 bg-[#09111f]/90 hover:bg-rose-950 text-rose-300 rounded-lg border border-rose-500/40 cursor-pointer"
                    title="Exit Spectator View"
                    aria-label="Exit Spectator View"
                    tabIndex={-1}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPause}
                    className="p-1.5 bg-[#09111f]/90 hover:bg-slate-800 text-cyan-400 rounded-lg border border-cyan-500/35 cursor-pointer"
                    title="Pause Game"
                    aria-label="Pause Game"
                    tabIndex={-1}
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Full Desktop Top Row: Left Score/Team Panel, Center Countdown Timer, Right Score/Team Panel + Controls */
        <div className="w-full flex flex-wrap items-start justify-between gap-3">
        {isTeamMode && teamScores ? (
          <div
            data-testid="team-alpha-hud-card"
            className="bg-[#09111f]/95 border border-cyan-500/50 rounded-lg px-3.5 py-2.5 min-w-[230px] shadow-[0_6px_24px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-slate-800">
              <span className="text-xs font-black text-cyan-300 tracking-wider">TEAM CYAN (ALPHA)</span>
              <span className="text-lg font-black font-mono-numbers text-white tabular-nums">
                {teamScores.alpha.totalPoints.toLocaleString()}
              </span>
            </div>
            <div className="mt-1.5 space-y-1 text-[11px] font-mono">
              {alphaMembers.map((m) => (
                <div key={m.slot} className="flex items-center justify-between gap-2 text-slate-200">
                  <span className="truncate max-w-[110px]">{m.name}</span>
                  <span className="text-cyan-300">{m.pvpKills} KO · HP {m.hp}/{m.maxHp}</span>
                </div>
              ))}
            </div>
          </div>
        ) : roster.length > 2 ? (
          <div
            data-testid="multiplayer-solo-leaderboard"
            className="bg-[#09111f]/95 border border-cyan-500/45 rounded-lg px-3.5 py-2.5 min-w-[235px] shadow-[0_6px_24px_rgba(0,0,0,0.55)]"
          >
            <div className="text-[11px] font-black text-cyan-300 pb-1 border-b border-slate-800">
              SOLO ARENA STANDINGS
            </div>
            <div className="mt-1.5 space-y-1 text-xs font-mono-numbers">
              {ranked.slice(0, 4).map((p, idx) => (
                <div key={p.slot} className="flex items-center justify-between gap-2">
                  <span className="truncate max-w-[130px]" style={{ color: p.color }}>
                    #{idx + 1} {p.name}
                  </span>
                  <span className="text-white font-bold tabular-nums">
                    {p.pvpKills} KO · {p.totalPoints.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <PlayerScoreCard
            player={duel.p1}
            rank={first.slot === 'p1' ? 1 : 2}
            isLeader={!isTie && first.slot === 'p1'}
            align="left"
          />
        )}

        {/* Top-Center Real-Time Countdown Timer & Live Leaderboard Order */}
        <div className="flex flex-col items-center bg-[#09111f]/95 border border-cyan-500/40 rounded-xl px-5 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.65)]">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
            {duel.isSpectator ? (
              <span
                data-testid="spectator-live-badge"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-bold"
              >
                <Eye className="w-3 h-3" />
                <span>SPECTATING LIVE</span>
              </span>
            ) : (
              <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-400' : 'text-cyan-400'}`} />
            )}
            <span>
              {duel.mode === 'online' ? `Room ${duel.roomCode || ''}` : 'Local Cyber Arena'}
            </span>
            {isPurePvp && (
              <span
                data-testid="pure-pvp-hud-badge"
                className="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-400/50 text-purple-200 text-[10px] font-bold"
              >
                {isTeamMode ? 'TEAM PVP · NO BOTS' : 'SOLO PVP · NO BOTS'}
              </span>
            )}
            {duel.mode === 'online' && (
              <span
                className={`ml-1 inline-flex items-center gap-1 text-[10px] font-bold ${
                  allConnected ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    allConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                  }`}
                />
                {allConnected ? 'Live' : 'Player Left'}
              </span>
            )}
          </div>

          <div
            data-testid="duel-countdown-timer"
            className={`text-3xl sm:text-4xl font-black font-mono-numbers tabular-nums tracking-wider mt-0.5 ${
              isUrgent ? 'text-rose-400 animate-pulse' : isWarning ? 'text-amber-300' : 'text-white'
            }`}
          >
            {formatDuelTimer(duel.timeRemaining)}
          </div>

          <div className="mt-1 flex items-center gap-3 text-[11px] font-mono text-slate-300">
            <span>{mapLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{leadBannerText}</span>
            {duel.mode === 'online' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-cyan-300 flex items-center gap-1" data-testid="hud-spectator-count">
                  <Eye className="w-3 h-3" />
                  <span>{duel.spectatorCount ?? 0}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Omega Team / Rival / P2 Scoreboard + Controls */}
        <div className="flex items-start gap-2">
          {isTeamMode && teamScores ? (
            <div
              data-testid="team-omega-hud-card"
              className="bg-[#09111f]/95 border border-pink-500/50 rounded-lg px-3.5 py-2.5 min-w-[230px] shadow-[0_6px_24px_rgba(0,0,0,0.55)]"
            >
              <div className="flex items-center justify-between gap-3 pb-1.5 border-b border-slate-800">
                <span className="text-lg font-black font-mono-numbers text-white tabular-nums">
                  {teamScores.omega.totalPoints.toLocaleString()}
                </span>
                <span className="text-xs font-black text-pink-300 tracking-wider">TEAM MAGENTA (OMEGA)</span>
              </div>
              <div className="mt-1.5 space-y-1 text-[11px] font-mono">
                {omegaMembers.map((m) => (
                  <div key={m.slot} className="flex items-center justify-between gap-2 text-slate-200">
                    <span className="text-pink-300">{m.pvpKills} KO · HP {m.hp}/{m.maxHp}</span>
                    <span className="truncate max-w-[110px]">{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : roster.length > 2 ? (
            <PlayerScoreCard
              player={duel.isSpectator ? rivalLeader : localPilot}
              rank={ranked.findIndex((p) => p.slot === (duel.isSpectator ? rivalLeader.slot : localPilot.slot)) + 1}
              isLeader={first.slot === (duel.isSpectator ? rivalLeader.slot : localPilot.slot)}
              align="right"
            />
          ) : (
            <PlayerScoreCard
              player={duel.p2}
              rank={first.slot === 'p2' ? 1 : 2}
              isLeader={!isTie && first.slot === 'p2'}
              align="right"
            />
          )}

          <div className="flex flex-col gap-1.5 pointer-events-auto">
            {onToggleSystemHealth && (
              <button
                type="button"
                data-testid="system-health-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  onToggleSystemHealth();
                }}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  systemHealthOpen
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60'
                    : 'bg-[#09111f]/95 hover:bg-slate-800 text-slate-300 border-cyan-500/30'
                }`}
                title="Toggle System Health Telemetry (F3)"
                aria-label="Toggle System Health"
                tabIndex={-1}
              >
                <Activity className="w-4 h-4 text-cyan-400" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 bg-[#09111f]/95 hover:bg-slate-800 text-cyan-400 rounded-lg border border-cyan-500/30 transition-colors cursor-pointer"
              title="Mute Audio (M)"
              aria-label="Mute Audio"
              tabIndex={-1}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {duel.isSpectator && onLeaveSpectate ? (
              <button
                type="button"
                onClick={onLeaveSpectate}
                data-testid="hud-leave-spectate"
                className="p-2 bg-[#09111f]/95 hover:bg-rose-950 text-rose-300 rounded-lg border border-rose-500/40 transition-colors cursor-pointer"
                title="Exit Spectator View"
                aria-label="Exit Spectator View"
                tabIndex={-1}
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onPause}
                className="p-2 bg-[#09111f]/95 hover:bg-slate-800 text-cyan-400 rounded-lg border border-cyan-500/30 transition-colors cursor-pointer"
                title="Pause Game (Esc)"
                aria-label="Pause Game"
                tabIndex={-1}
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Bottom Compact Controls / Spectator Camera Switcher Bar */}
      <div className="w-full flex justify-center">
        {duel.isSpectator ? (
          <div className="pointer-events-auto bg-[#080d17]/95 border border-cyan-500/40 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 flex flex-wrap items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
            <span className="text-cyan-300 font-bold flex items-center gap-1 mr-1">
              <Eye className="w-3.5 h-3.5" />
              <span>Camera:</span>
            </span>
            {(
              [
                { id: 'both', label: '1 · Arena Wide' },
                { id: 'p1', label: `2 · ${duel.p1.name}` },
                { id: 'p2', label: `3 · ${duel.p2.name}` },
              ] as { id: DuelSpectatorCamera; label: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                data-testid={`spectator-cam-${opt.id}`}
                onClick={() => onChangeSpectatorCamera?.(opt.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  activeCamera === opt.id
                    ? 'bg-cyan-400 text-slate-950'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {duel.roomCode && (
              <button
                type="button"
                onClick={handleCopyWatch}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-bold text-cyan-200 flex items-center gap-1 cursor-pointer"
              >
                {copiedWatch ? <Check className="w-3 h-3 text-emerald-400" /> : <Link2 className="w-3 h-3" />}
                <span>{copiedWatch ? 'Copied' : 'Watch Link'}</span>
              </button>
            )}
          </div>
        ) : compactMobile && touchControlsEnabled ? (
          /* On compact mobile with touch sticks active, keep bottom corners & center open cleanly */
          null
        ) : (
          <div className="pointer-events-auto flex flex-col items-center gap-1.5">
            {/* Weapon Switcher + Free Movement & Camera Controls */}
            <div className="bg-[#080d17]/95 border border-cyan-500/35 rounded-lg px-2.5 py-1.5 flex flex-wrap items-center justify-center gap-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.65)]">
              <button
                type="button"
                data-testid="toggle-free-pointer-move"
                onClick={() => onToggleFreePointerMove?.(!freePointerMove)}
                className={`px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                  freePointerMove
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/60'
                    : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                }`}
                title="Hold mouse/touch to steer freely like singleplayer"
                tabIndex={-1}
              >
                <Navigation className="w-3 h-3" />
                <span>Free Move: {freePointerMove ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                data-testid="duel-dash-btn"
                onClick={() => onTriggerDash?.()}
                disabled={!dashReady}
                className={`px-2.5 py-1 rounded text-[11px] font-bold flex flex-col gap-0.5 min-w-[92px] transition-colors ${
                  dashReady
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/60 hover:bg-emerald-500/35 cursor-pointer'
                    : 'bg-slate-900 text-amber-300 border border-amber-500/40 cursor-not-allowed'
                }`}
                title="Dash (Shift / Q)"
                tabIndex={-1}
              >
                <div className="flex items-center justify-between w-full gap-1.5">
                  <span className="flex items-center gap-1">
                    <Wind className="w-3 h-3" />
                    <span>Dash</span>
                  </span>
                  <span className="font-mono-numbers tabular-nums text-[10px]">
                    {dashReady ? 'READY' : `${dashGauge.remainingSeconds.toFixed(1)}s`}
                  </span>
                </div>
                <div
                  data-testid="duel-dash-gauge"
                  className="w-full h-1 bg-slate-950 rounded-full overflow-hidden"
                >
                  <div
                    className={`h-full transition-all duration-75 ${
                      dashReady ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${dashGauge.chargePercent}%` }}
                  />
                </div>
              </button>

              <button
                type="button"
                data-testid="duel-wall-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  onDeployWall?.();
                }}
                disabled={!wallReady}
                className={`px-2.5 py-1 rounded text-[11px] font-bold flex flex-col gap-0.5 min-w-[104px] transition-colors ${
                  wallReady
                    ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/70 shadow-[0_0_12px_rgba(34,211,238,0.35)] hover:bg-cyan-500/35 cursor-pointer'
                    : 'bg-slate-900 text-slate-400 border border-slate-700 cursor-not-allowed'
                }`}
                title="Deploy Cyber Shield Wall ahead of aim [R]"
                tabIndex={-1}
              >
                <div className="flex items-center justify-between w-full gap-1.5">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-cyan-300" />
                    <span>Wall [R]</span>
                  </span>
                  <span className="font-mono-numbers tabular-nums text-[10px] text-white">
                    {wallReady ? `${wallCharges}/${maxWallCharges}` : `${wallCd.toFixed(1)}s`}
                  </span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-75 ${
                      wallReady ? 'bg-cyan-400' : 'bg-purple-400'
                    }`}
                    style={{ width: `${wallChargePct}%` }}
                  />
                </div>
              </button>

              <button
                type="button"
                data-testid="duel-finisher-btn"
                onClick={(e) => {
                  e.currentTarget.blur();
                  onTriggerFinisher?.();
                }}
                disabled={!duel.finisherReady}
                className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  duel.finisherReady
                    ? 'bg-amber-400 text-slate-950 border border-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.6)] hover:bg-amber-300 cursor-pointer'
                    : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                }`}
                title="20-Hit Combo Finisher (E / K)"
                tabIndex={-1}
              >
                <Zap className="w-3 h-3" />
                <span>
                  {duel.finisherReady
                    ? 'Finisher [E]'
                    : `Finisher ${Math.min(COMBO_FINISHER_THRESHOLD, duel.finisherCharge || 0)}/${COMBO_FINISHER_THRESHOLD}`}
                </span>
              </button>

              {duel.mode === 'local' && (
                <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                  <Video className="w-3 h-3 text-slate-400 mr-0.5" />
                  {(
                    [
                      { id: 'both', label: 'Arena Fit' },
                      { id: 'p1', label: 'Follow P1' },
                      { id: 'p2', label: 'Follow P2' },
                    ] as { id: DuelCameraMode; label: string }[]
                  ).map((camOpt) => (
                    <button
                      key={camOpt.id}
                      type="button"
                      data-testid={`duel-cam-${camOpt.id}`}
                      onClick={() => onChangeCameraMode?.(camOpt.id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        duelCameraMode === camOpt.id
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                      tabIndex={-1}
                    >
                      {camOpt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Unlocked Weapons Bar */}
              <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                {WEAPON_KEYS.filter(({ id }) => unlockedWeapons[id]).map(({ id, keyHint }) => {
                  const isActive = activeWeapon === id;
                  const weaponName = WEAPONS[id].name.split(' ')[0];
                  return (
                    <button
                      key={id}
                      type="button"
                      data-testid={`duel-weapon-${id}`}
                      onClick={() => onSelectWeapon?.(id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                      tabIndex={-1}
                    >
                      <span className="opacity-75">[{keyHint}]</span>
                      <span>{weaponName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compact Control Legend */}
            <div className="bg-[#080d17]/90 border border-slate-800 rounded-lg px-4 py-1 text-[11px] font-mono text-slate-300 flex flex-wrap items-center justify-center gap-3">
              {duel.mode === 'local' ? (
                <>
                  <span>
                    <strong className="text-cyan-300">{duel.p1.name}:</strong> WASD Move · Click/Space Fire · Q/L-Shift Dash · R Wall · E Finisher
                  </span>
                  <span aria-hidden="true" className="text-slate-600">|</span>
                  <span>
                    <strong className="text-pink-300">{duel.p2.name}:</strong> Arrows Move · Enter/Slash Fire · R-Shift/L Dash · O Wall · K Finisher
                  </span>
                </>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    WASD/Arrows or Hold Mouse Move · Click/Space Fire · Shift/Q Dash · R Wall · E Finisher · 1-9 Switch Weapon · Esc Pause
                  </span>
                  {duel.roomCode && (
                    <button
                      type="button"
                      onClick={handleCopyWatch}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-[11px] font-bold text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedWatch ? <Check className="w-3 h-3 text-emerald-400" /> : <Link2 className="w-3 h-3" />}
                      <span>{copiedWatch ? 'Watch Link Copied' : 'Share Watch Link'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
