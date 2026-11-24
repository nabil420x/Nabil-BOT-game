import React from 'react';
import { Volume2, VolumeX, Pause, Zap, Shield, Cpu, Flame, Award, CloudLightning, Wind, Activity, Radar, Gamepad2, Target, Gauge, Maximize2, Minimize2 } from 'lucide-react';
import { PlayerStats, WeaponType } from '../game/types';
import { WEAPONS, WEAPON_ORDER } from '../game/weapons';
import { soundEngine } from '../game/audio';
import {
  UPGRADES,
  UpgradeId,
  getDifficultyModifier,
  COMBO_FINISHER_THRESHOLD,
  computeDashGaugeState,
  WEAPON_HEAT_MAX,
  DASH_OVERCHARGE_DURATION_SEC,
  PerformanceMode,
} from '../game/rules';
import { LEVELS, REGIONS, MapRegionId, getLevelDef } from '../game/levels';
import { CYBER_AUGMENTS, AUGMENT_ORDER } from '../game/augments';
import { PRE_RUN_BOOSTERS } from '../game/supplyCrate';
import { COMPANION_DRONES } from '../game/storeCatalog';

interface GameHUDProps {
  stats: PlayerStats;
  wave: number;
  enemiesLeft: number;
  isBoss: boolean;
  onPause: () => void;
  onSelectWeapon: (weapon: WeaponType) => void;
  onBuyUpgrade: (id: UpgradeId) => void;
  onTriggerFinisher?: () => void;
  systemHealthOpen?: boolean;
  onToggleSystemHealth?: () => void;
  radarEnabled?: boolean;
  onToggleRadar?: () => void;
  touchControlsEnabled?: boolean;
  onToggleTouchControls?: () => void;
  performanceMode?: PerformanceMode;
  onCyclePerformanceMode?: () => void;
  compactMobile?: boolean;
  isFullscreen?: boolean;
  onRequestLandscape?: () => void;
  onExitFullscreen?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  wave,
  enemiesLeft,
  isBoss,
  onPause,
  onSelectWeapon,
  onBuyUpgrade,
  onTriggerFinisher,
  systemHealthOpen = false,
  onToggleSystemHealth,
  radarEnabled = false,
  onToggleRadar,
  touchControlsEnabled = true,
  onToggleTouchControls,
  performanceMode = 'auto',
  onCyclePerformanceMode,
  compactMobile = false,
  isFullscreen = false,
  onRequestLandscape,
  onExitFullscreen,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundEngine.getMuted());
  const [upgradeDrawerOpen, setUpgradeDrawerOpen] = React.useState(false);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(soundEngine.toggleMute());
  };

  const shieldPercent = Math.max(0, Math.min(100, (stats.currentShield / stats.maxShield) * 100));
  const dashGauge = computeDashGaugeState(stats.dashCooldownTimer, stats.dashCooldown);
  const dashReady = dashGauge.isReady;
  const dashOvercharged = Boolean(stats.dashOvercharged);
  const dashOverchargeTimer = stats.dashOverchargeTimer || 0;
  const dashOverchargeDuration = stats.dashOverchargeDuration || DASH_OVERCHARGE_DURATION_SEC;
  const dashOverchargePercent = dashOvercharged
    ? Math.max(0, Math.min(100, Math.round((dashOverchargeTimer / dashOverchargeDuration) * 100)))
    : 0;
  const weaponHeat = Math.max(0, Math.min(WEAPON_HEAT_MAX, stats.weaponHeat || 0));
  const weaponOverheated = Boolean(stats.weaponOverheated);
  const weaponOverheatTimer = stats.weaponOverheatTimer || 0;
  const masteryLvl = stats.weaponMasteryLevel ?? 0;
  const masteryTitle = stats.weaponMasteryTitle || 'ROOKIE';
  const masteryProgress = stats.weaponMasteryProgress ?? 0;
  const masteryHeatRed = Math.round((stats.weaponMasteryHeatReduction || 0) * 100);
  const masteryCrit = Math.round((stats.weaponMasteryCritChance || 0) * 100);
  const stormPhase = stats.cyberStormPhase || 'calm';
  const stormTimeLeft = stats.cyberStormTimeLeft || 0;
  const currentLvlDef = getLevelDef(stats.level || 1);
  const diffMod = getDifficultyModifier(stats.difficulty || 'normal');

  const hpPercent = Math.max(0, Math.min(100, (stats.currentHp / Math.max(1, stats.maxHp)) * 100));

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-20 flex flex-col justify-between select-none ${
        compactMobile ? 'p-2' : 'p-2.5 sm:p-6'
      }`}
    >
      {compactMobile ? (
        /* Ultra-Slim Mini-Militia Top Bar for Mobile Portrait & Mobile Landscape */
        <div data-testid="game-compact-mobile-topbar" className="w-full flex items-start justify-between gap-1.5">
          {/* Top-Left Compact Vitality + Shield + Dash/Heat Strip */}
          <div className="flex flex-col gap-1 min-w-0 max-w-[155px] sm:max-w-[195px]">
            <div className="bg-[#0a1220]/90 px-2 py-1 rounded-lg border border-cyan-500/35 shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between gap-2 text-[9px] font-mono-numbers font-bold">
                <span className="text-emerald-300">HP {stats.currentHp}/{stats.maxHp}</span>
                <span className="text-cyan-300">SH {Math.round(stats.currentShield)}</span>
              </div>
              <div className="mt-0.5 flex flex-col gap-0.5">
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-[width] duration-75 ${
                      hpPercent <= 30 ? 'bg-rose-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-[width] duration-75"
                    style={{ width: `${shieldPercent}%` }}
                  />
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[8px] font-mono-numbers">
                <span className={dashOvercharged ? 'text-yellow-300 font-bold' : dashReady ? 'text-emerald-300' : 'text-amber-300'}>
                  {dashReady ? 'DASH RDY' : `DASH ${dashGauge.remainingSeconds.toFixed(1)}s`}
                </span>
                <span className={weaponOverheated ? 'text-red-400 font-bold' : weaponHeat >= 75 ? 'text-orange-300' : 'text-sky-300'}>
                  {weaponOverheated ? 'COOLING' : `HEAT ${Math.round(weaponHeat)}%`}
                </span>
              </div>
            </div>
            {(stats.isBossRush || stats.activeBounty || (stats.overdriveTimer ?? 0) > 0) && (
              <div className="px-2 py-0.5 rounded bg-amber-950/90 border border-amber-400/70 text-[8px] font-mono font-black text-amber-200 truncate">
                {stats.isBossRush
                  ? `TITAN ${stats.bossRushStage || wave}/${stats.bossRushTotalStages || 6}`
                  : stats.activeBounty
                  ? `HVT ${stats.activeBounty.codename.toUpperCase()} · ${Math.ceil(stats.activeBounty.timeRemaining)}s`
                  : `OVERDRIVE ${(stats.overdriveTimer ?? 0).toFixed(1)}s`}
              </div>
            )}
          </div>

          {/* Top-Center Slim Sector Progress Pill */}
          <div className="hidden min-[440px]:flex flex-col items-center bg-[#0a1220]/90 px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-[0_2px_10px_rgba(0,0,0,0.45)] max-w-[200px]">
            <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold">
              <span style={{ color: stats.isBossRush ? '#fbbf24' : stats.isEndless ? '#e879f9' : currentLvlDef.primaryColor }}>
                {stats.isBossRush
                  ? `BOSS RUSH ${stats.bossRushStage || wave}/${stats.bossRushTotalStages || 6}`
                  : stats.isEndless
                  ? `ENDLESS W${wave}`
                  : `LVL ${stats.level}/${LEVELS.length}`}
              </span>
              <span className="text-slate-400 tabular-nums">
                {stats.isBossRush ? `${enemiesLeft} TGT` : `${stats.levelKills}/${stats.levelQuota}`}
              </span>
            </div>
            <div className="mt-1 w-28 h-1 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-200"
                style={{
                  width: `${
                    stats.isBossRush
                      ? ((stats.bossRushStage || 1) / Math.max(1, stats.bossRushTotalStages || 6)) * 100
                      : Math.min(100, (stats.levelKills / Math.max(1, stats.levelQuota)) * 100)
                  }%`,
                  backgroundColor: stats.isBossRush ? '#f59e0b' : stats.isEndless ? '#e879f9' : currentLvlDef.primaryColor,
                }}
              />
            </div>
            {(stormPhase === 'warning' || stormPhase === 'storm') && (
              <span className="mt-0.5 text-[8px] font-mono text-sky-300 font-bold">
                {stormPhase === 'storm' ? `STORM ${stormTimeLeft.toFixed(0)}s` : 'STORM SOON'}
              </span>
            )}
          </div>

          {/* Top-Right Compact Action Icons + Score Pill */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1 pointer-events-auto">
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
                      : 'bg-[#0a1220]/90 text-cyan-300 border-cyan-500/35 hover:bg-slate-800'
                  }`}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Landscape Fullscreen'}
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Landscape Fullscreen'}
                  tabIndex={-1}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  setUpgradeDrawerOpen((prev) => !prev);
                }}
                className="px-2 py-1 rounded-lg border border-cyan-500/35 bg-[#0a1220]/90 text-[9px] font-mono font-bold text-cyan-300 cursor-pointer flex items-center gap-1"
                title="Open Upgrades Matrix"
                aria-label="Open Upgrades Matrix"
                tabIndex={-1}
              >
                <Cpu className="w-3 h-3" />
                <span>{stats.scrap}</span>
              </button>
              {onToggleTouchControls && (
                <button
                  type="button"
                  data-testid="hud-touch-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.currentTarget.blur();
                    onToggleTouchControls();
                  }}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    touchControlsEnabled
                      ? 'bg-pink-500/20 text-pink-200 border-pink-400/60'
                      : 'bg-[#0a1220]/90 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle Virtual Touch Controls"
                  aria-label="Toggle Virtual Touch Controls"
                  tabIndex={-1}
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-pink-400" />
                </button>
              )}
              {onToggleRadar && (
                <button
                  type="button"
                  data-testid="hud-radar-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.currentTarget.blur();
                    onToggleRadar();
                  }}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    radarEnabled
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60'
                      : 'bg-[#0a1220]/90 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle Tactical Radar Minimap"
                  aria-label="Toggle Tactical Radar Minimap"
                  tabIndex={-1}
                >
                  <Radar className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              )}
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 bg-[#0a1220]/90 hover:bg-slate-800 text-cyan-400 rounded-lg border border-cyan-500/35 cursor-pointer"
                title="Mute Audio"
                aria-label="Mute Audio"
                tabIndex={-1}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={onPause}
                className="p-1.5 bg-[#0a1220]/90 hover:bg-slate-800 text-cyan-400 rounded-lg border border-cyan-500/35 cursor-pointer"
                title="Pause Game"
                aria-label="Pause Game"
                tabIndex={-1}
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="bg-[#0a1220]/90 px-2 py-0.5 rounded-lg border border-cyan-500/30 flex items-center gap-2 text-[10px] font-mono-numbers">
              <span className="font-bold text-cyan-300">{stats.score.toLocaleString()}</span>
              <span className="text-slate-400">W{wave} · {enemiesLeft}</span>
              {stats.comboTimer > 0 && (stats.comboCount > 0 || stats.comboStreak > 0) && (
                <span className="text-amber-300 font-black">
                  {(stats.comboMultiplier || 1.0).toFixed(1)}x
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Top Bar Perimeter Clusters (Desktop) */
        <div className="w-full flex justify-between items-start gap-1.5 sm:gap-2">
        {/* Top-Left: Player Vitality & Shield Cluster */}
        <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0">
          {/* Health Sockets (Discrete Pips: Full, Damaged/Low, Hollow Socket) */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-[#0a1220]/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-cyan-500/30">
            <span className="text-[9px] sm:text-[10px] font-bold text-cyan-400 tracking-wider mr-0.5 sm:mr-1">HP</span>
            {Array.from({ length: stats.maxHp }).map((_, i) => {
              const isFilled = i < stats.currentHp;
              return (
                <div
                  key={i}
                  className={`w-2 sm:w-4 h-3.5 sm:h-5 rounded-sm transition-all duration-150 ${
                    isFilled
                      ? 'bg-gradient-to-t from-cyan-500 to-cyan-300 shadow-[0_0_8px_rgba(0,243,255,0.7)]'
                      : 'bg-slate-900 border border-slate-700/60'
                  }`}
                />
              );
            })}
            <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs font-bold font-mono-numbers text-slate-200">
              {stats.currentHp}/{stats.maxHp}
            </span>
            {stats.activeCraftSkin === 'neon' && (
              <span
                data-testid="hud-neon-skin-badge"
                className="hidden sm:inline ml-1.5 text-[10px] font-mono font-black tracking-wider text-cyan-300"
              >
                ⚡ NEON SKIN
              </span>
            )}
          </div>

          {/* Shield Rally Bar */}
          <div className="flex flex-col gap-0.5 bg-[#0a1220]/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-cyan-500/20 w-40 sm:w-56">
            <div className="flex justify-between items-center text-[10px] text-cyan-300 font-bold tracking-wider">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-400" /> SHIELD
              </span>
              <span className="font-mono-numbers">{Math.round(stats.currentShield)}/{stats.maxShield}</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-[width] duration-75 ease-out shadow-[0_0_6px_rgba(0,243,255,0.8)]"
                style={{ width: `${shieldPercent}%` }}
              />
            </div>
          </div>

          {/* Visual Dash Cooldown Gauge + Perfect-Dash Overcharge State */}
          <div
            data-testid="dash-cooldown-gauge"
            className={`flex flex-col gap-1 bg-[#0a1220]/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded border w-40 sm:w-56 transition-colors ${
              dashOvercharged
                ? 'border-amber-300/80 shadow-[0_0_14px_rgba(250,204,21,0.4)]'
                : dashReady
                ? 'border-emerald-400/50'
                : 'border-amber-500/40'
            }`}
          >
            <div className="flex justify-between items-center text-[10px] font-bold tracking-wider">
              <span
                className={`flex items-center gap-1 ${
                  dashOvercharged
                    ? 'text-yellow-300'
                    : dashReady
                    ? 'text-emerald-300'
                    : 'text-amber-300'
                }`}
              >
                <Zap
                  className={`w-3 h-3 ${
                    dashOvercharged
                      ? 'text-yellow-300'
                      : dashReady
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                />
                {dashOvercharged ? 'DASH · 2X RANGE' : 'DASH [SHIFT]'}
              </span>
              <span
                data-testid="dash-cooldown-label"
                className={`font-mono-numbers tabular-nums ${
                  dashReady ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {dashReady
                  ? 'READY'
                  : `${dashGauge.remainingSeconds.toFixed(1)}s / ${dashGauge.totalSeconds.toFixed(1)}s`}
              </span>
            </div>
            <div className="relative w-full h-2 bg-slate-900 rounded overflow-hidden border border-slate-800">
              <div
                data-testid="dash-cooldown-fill"
                className={`h-full transition-[width] duration-75 ease-linear ${
                  dashOvercharged && dashReady
                    ? 'bg-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.9)]'
                    : dashReady
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.65)]'
                }`}
                style={{ width: `${dashGauge.chargePercent}%` }}
              />
              {/* Tactical 3-segment ticks */}
              <div className="absolute inset-0 flex justify-evenly pointer-events-none">
                <span className="w-px h-full bg-[#0a1220]/80" />
                <span className="w-px h-full bg-[#0a1220]/80" />
              </div>
            </div>
            {dashOvercharged && (
              <div
                data-testid="dash-overcharge-badge"
                className="flex flex-col gap-0.5 pt-0.5 border-t border-yellow-400/25"
              >
                <div className="flex items-center justify-between text-[9px] font-mono font-bold text-yellow-300">
                  <span>⚡ OVERCHARGED · 2X RANGE</span>
                  <span className="tabular-nums">{dashOverchargeTimer.toFixed(1)}s</span>
                </div>
                <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-300 transition-all duration-75 ease-linear"
                    style={{ width: `${dashOverchargePercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Weapon Heat / Overheat Gauge */}
          <div
            data-testid="weapon-heat-gauge"
            className={`flex flex-col gap-1 bg-[#0a1220]/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded border w-40 sm:w-56 transition-colors ${
              weaponOverheated
                ? 'border-red-500/80 shadow-[0_0_16px_rgba(239,68,68,0.45)]'
                : weaponHeat >= 75
                ? 'border-orange-400/70'
                : 'border-cyan-500/25'
            }`}
          >
            <div className="flex justify-between items-center text-[10px] font-bold tracking-wider">
              <span
                className={`flex items-center gap-1 ${
                  weaponOverheated
                    ? 'text-red-400'
                    : weaponHeat >= 75
                    ? 'text-orange-300'
                    : 'text-slate-300'
                }`}
              >
                <Flame
                  className={`w-3 h-3 ${
                    weaponOverheated
                      ? 'text-red-400'
                      : weaponHeat >= 75
                      ? 'text-orange-400'
                      : 'text-cyan-400'
                  }`}
                />
                {weaponOverheated ? 'OVERHEATED!' : 'WEAPON HEAT'}
              </span>
              <span
                data-testid="weapon-heat-label"
                className={`font-mono-numbers tabular-nums ${
                  weaponOverheated
                    ? 'text-red-300'
                    : weaponHeat >= 75
                    ? 'text-orange-300'
                    : 'text-cyan-300'
                }`}
              >
                {weaponOverheated ? `COOL ${weaponOverheatTimer.toFixed(1)}s` : `${Math.round(weaponHeat)}%`}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded overflow-hidden border border-slate-800">
              <div
                data-testid="weapon-heat-fill"
                className={`h-full transition-[width] duration-75 ease-linear ${
                  weaponOverheated
                    ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.9)]'
                    : weaponHeat >= 75
                    ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]'
                    : 'bg-sky-400'
                }`}
                style={{ width: `${Math.round((weaponHeat / WEAPON_HEAT_MAX) * 100)}%` }}
              />
            </div>

            {/* Active Weapon Mastery Readout */}
            <div
              data-testid="weapon-mastery-badge"
              className="flex items-center justify-between pt-0.5 text-[9px] font-mono border-t border-slate-800/80"
            >
              <span className="flex items-center gap-1 text-amber-300 font-bold">
                <Award className="w-3 h-3 text-amber-400" />
                M{masteryLvl} {masteryTitle}
              </span>
              <span className="text-slate-300">
                {masteryLvl > 0
                  ? `-${masteryHeatRed}% HEAT · +${masteryCrit}% CRIT`
                  : `${stats.weaponMasteryXp ?? 0}/${stats.weaponMasteryNextXp ?? 25} XP`}
              </span>
            </div>
            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-150"
                style={{ width: `${masteryProgress}%` }}
              />
            </div>
          </div>

          {/* Installed Cyber-Chip Augments Strip */}
          {stats.activeAugments &&
            AUGMENT_ORDER.some((id) => (stats.activeAugments?.[id] ?? 0) > 0) && (
              <div
                data-testid="active-augments-strip"
                className="flex flex-wrap items-center gap-1 bg-[#0a1220]/90 px-2.5 py-1.5 rounded border border-cyan-500/30 w-48 sm:w-56"
              >
                {AUGMENT_ORDER.filter((id) => (stats.activeAugments?.[id] ?? 0) > 0).map((id) => {
                  const def = CYBER_AUGMENTS[id];
                  const lvl = stats.activeAugments?.[id] ?? 0;
                  return (
                    <span
                      key={id}
                      data-testid={`active-augment-chip-${id}`}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border"
                      style={{
                        color: def.color,
                        borderColor: `${def.color}66`,
                        backgroundColor: `${def.color}15`,
                      }}
                      title={`${def.name} LVL ${lvl}/${def.maxStacks} · ${def.statSummary}`}
                    >
                      <span>{def.icon}</span>
                      <span>{def.shortTag}</span>
                      <span className="text-white">x{lvl}</span>
                    </span>
                  );
                })}
              </div>
            )}

          {stats.activeBoosters && stats.activeBoosters.length > 0 && (
            <div
              data-testid="hud-active-boosters"
              className="px-2 sm:px-2.5 py-1 bg-[#0a1220]/90 rounded border border-amber-400/40 text-[9px] font-mono font-bold text-amber-300 w-40 sm:w-56 truncate"
              title="Armed Pre-Run Combat Boosters active for this run"
            >
              BOOSTS: {stats.activeBoosters.map((id) => PRE_RUN_BOOSTERS[id]?.shortLabel).filter(Boolean).join(' · ')}
            </div>
          )}

          {/* Mobile compact Boss Rush / Bounty status strip */}
          {(stats.isBossRush || stats.activeBounty) && (
            <div className="flex sm:hidden flex-col gap-1 w-40">
              {stats.isBossRush && (
                <div className="px-2 py-1 rounded bg-amber-950/90 border border-amber-400/70 text-[9px] font-mono font-black text-amber-300 truncate">
                  👑 TITAN {stats.bossRushStage || wave}/{stats.bossRushTotalStages || 6}
                </div>
              )}
              {stats.activeBounty && (
                <div className="px-2 py-1 rounded bg-amber-950/90 border border-amber-400/80 text-[9px] font-mono font-black text-amber-200 truncate">
                  🎯 {stats.activeBounty.codename.toUpperCase()} · {Math.ceil(stats.activeBounty.timeRemaining)}s
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top-Center: Level Sector Progress OR Endless Overdrive OR Boss Rush Indicator */}
        <div className="hidden sm:flex flex-col items-center gap-1 bg-[#0a1220]/90 px-4 py-1.5 rounded border border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2">
            {stats.isBossRush ? (
              <span
                data-testid="hud-boss-rush-badge"
                className="text-xs font-bold tracking-wider uppercase font-mono-numbers text-amber-300"
              >
                👑 BOSS RUSH · TITAN {stats.bossRushStage || wave}/{stats.bossRushTotalStages || 6}
              </span>
            ) : stats.isEndless ? (
              <span
                data-testid="hud-endless-badge"
                className="text-xs font-bold tracking-wider uppercase font-mono-numbers text-fuchsia-300"
              >
                ♾️ ENDLESS · WAVE {wave}
              </span>
            ) : (
              <span
                className="text-xs font-bold tracking-wider uppercase font-mono-numbers"
                style={{ color: currentLvlDef.primaryColor }}
              >
                LEVEL {stats.level}/{LEVELS.length} · {stats.levelName}
              </span>
            )}
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase border font-mono"
              style={{
                color: diffMod.color,
                borderColor: `${diffMod.color}66`,
                backgroundColor: `${diffMod.color}18`,
              }}
            >
              {diffMod.label}
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
            {stats.isBossRush
              ? `${stats.bossRushBossName || stats.levelName} · +1💎 PER TITAN`
              : stats.isEndless
              ? `BEST W${Math.max(wave, stats.endlessBestWave || 0)} · WAVE ${wave} OVERDRIVE`
              : currentLvlDef.difficultyLabel}
          </span>

          {/* Level / Endless / Boss Rush Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="w-28 sm:w-44 h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 ease-out"
                style={{
                  width: `${
                    stats.isBossRush
                      ? ((stats.bossRushStage || 1) / Math.max(1, stats.bossRushTotalStages || 6)) * 100
                      : Math.min(100, (stats.levelKills / Math.max(1, stats.levelQuota)) * 100)
                  }%`,
                  backgroundColor: stats.isBossRush
                    ? '#f59e0b'
                    : stats.isEndless
                    ? '#e879f9'
                    : currentLvlDef.primaryColor,
                  boxShadow: `0 0 8px ${
                    stats.isBossRush ? '#f59e0b' : stats.isEndless ? '#e879f9' : currentLvlDef.primaryColor
                  }`,
                }}
              />
            </div>
            <span className="text-[10px] font-mono-numbers text-slate-400 font-bold">
              {stats.isBossRush
                ? `${enemiesLeft} TARGETS`
                : `${stats.levelKills}/${stats.levelQuota} PURGED`}
            </span>
          </div>

          {stats.isBossRush ? (
            <div className="flex items-center justify-center gap-1.5 pt-0.5">
              {Array.from({ length: stats.bossRushTotalStages || 6 }).map((_, idx) => {
                const st = idx + 1;
                const active = st === (stats.bossRushStage || 1);
                const cleared = st < (stats.bossRushStage || 1);
                return (
                  <span
                    key={st}
                    className={`h-1.5 rounded-full transition-all ${
                      active
                        ? 'w-5 bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                        : cleared
                        ? 'w-2.5 bg-emerald-400'
                        : 'w-2.5 bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          ) : stats.isEndless ? (
            <div className="text-[9px] font-mono text-fuchsia-300/80 tracking-wider pt-0.5">
              BOSS EVERY 3 WAVES · AUGMENT EVERY 2 WAVES
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 pt-0.5" title={`Region: ${REGIONS[currentLvlDef.region].name}`}>
              {(Object.keys(REGIONS) as MapRegionId[]).map((rId) => {
                const reg = REGIONS[rId];
                const isCurrentRegion = stats.level >= reg.startLevel && stats.level <= reg.endLevel;
                const isClearedRegion = stats.level > reg.endLevel;
                return (
                  <span
                    key={rId}
                    className={`h-1.5 rounded-full transition-all ${
                      isCurrentRegion
                        ? 'w-4'
                        : isClearedRegion
                        ? 'w-2 bg-emerald-400/80'
                        : 'w-2 bg-slate-800'
                    }`}
                    style={isCurrentRegion ? { backgroundColor: currentLvlDef.primaryColor } : {}}
                  />
                );
              })}
            </div>
          )}

          {/* Live HVT Bounty Contract Banner */}
          {stats.activeBounty && (
            <div
              data-testid="bounty-contract-banner"
              className="mt-1 px-3 py-1 rounded border bg-amber-950/90 border-amber-400/80 text-amber-200 flex items-center gap-2 text-[10px] font-mono font-black tracking-wider shadow-[0_0_14px_rgba(250,204,21,0.35)]"
            >
              <Target className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>BOUNTY: {stats.activeBounty.codename.toUpperCase()}</span>
              <span className="text-yellow-300 tabular-nums">
                {Math.ceil(stats.activeBounty.timeRemaining)}s
              </span>
              <span className="text-emerald-300">
                +{stats.activeBounty.rewardCoins}🪙 +1💎
              </span>
            </div>
          )}

          {/* Procedural Cyber-Storm Weather Status Banner */}
          {(stormPhase === 'warning' || stormPhase === 'storm') && (
            <div
              data-testid="cyber-storm-banner"
              className={`mt-1 px-2.5 py-1 rounded border flex items-center gap-2 text-[10px] font-mono font-bold tracking-wider ${
                stormPhase === 'storm'
                  ? 'bg-sky-950/85 border-sky-400/70 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                  : 'bg-purple-950/80 border-purple-400/60 text-purple-200 animate-pulse'
              }`}
            >
              <CloudLightning className="w-3.5 h-3.5 text-sky-300 shrink-0" />
              <span>
                {stormPhase === 'storm'
                  ? `CYBER-STORM · ${stormTimeLeft.toFixed(0)}s`
                  : `STORM INBOUND · ${stormTimeLeft.toFixed(1)}s`}
              </span>
              {stormPhase === 'storm' && stats.cyberStormInWindZone && (
                <span
                  data-testid="cyber-storm-wind-badge"
                  className="px-1.5 py-0.5 rounded bg-sky-400/20 border border-sky-300/50 text-sky-100 flex items-center gap-1"
                >
                  <Wind className="w-3 h-3" />
                  {stats.cyberStormWindLabel}
                </span>
              )}
            </div>
          )}

          {/* Overdrive Surge Golden Zero-Heat Timer */}
          {(stats.overdriveTimer ?? 0) > 0 && (
            <div
              data-testid="overdrive-surge-banner"
              className="mt-1 px-3 py-1 rounded border bg-amber-950/90 border-amber-400/80 text-amber-200 flex items-center gap-2 text-[10px] font-mono font-black tracking-wider shadow-[0_0_16px_rgba(250,204,21,0.45)]"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
              <span>OVERDRIVE · ZERO HEAT +40% SPD</span>
              <span className="text-yellow-300 tabular-nums">
                {(stats.overdriveTimer ?? 0).toFixed(1)}s
              </span>
            </div>
          )}

          {/* Multi-Kill Streak Callout Pill */}
          {(stats.multiKillTimer ?? 0) > 0 &&
            (stats.multiKillCount ?? 0) >= 2 &&
            stats.multiKillLabel && (
              <div
                data-testid="multi-kill-banner"
                className="mt-1 px-3 py-1 rounded border bg-fuchsia-950/90 border-fuchsia-400/80 text-fuchsia-200 text-[11px] font-mono font-black tracking-widest uppercase shadow-[0_0_16px_rgba(232,121,249,0.4)]"
              >
                ⚡ {stats.multiKillLabel}
              </div>
            )}
        </div>

        {/* Top-Right: Score, Combo & Controls Cluster */}
        <div className="flex flex-col items-end gap-1.5 sm:gap-2 shrink-0">
          {/* Controls: Touch, Radar, Performance, System Health, Mute, Pause */}
          <div className="flex items-center justify-end gap-1 sm:gap-1.5 flex-wrap max-w-[168px] sm:max-w-none">
            {onToggleTouchControls && (
              <button
                type="button"
                data-testid="hud-touch-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  onToggleTouchControls();
                }}
                className={`pointer-events-auto inline-flex items-center gap-1 p-1.5 sm:px-2 sm:py-2 rounded border transition-colors focus:outline-none cursor-pointer text-[10px] font-mono font-bold ${
                  touchControlsEnabled
                    ? 'bg-pink-500/20 text-pink-200 border-pink-400/60'
                    : 'bg-[#0a1220]/90 hover:bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Toggle Virtual Touch Joystick & Fire Controls"
                aria-label="Toggle Virtual Touch Controls"
                tabIndex={-1}
              >
                <Gamepad2 className="w-3.5 h-3.5 text-pink-400" />
                <span className="hidden sm:inline">TOUCH</span>
              </button>
            )}
            {onToggleRadar && (
              <button
                type="button"
                data-testid="hud-radar-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  onToggleRadar();
                }}
                className={`pointer-events-auto inline-flex items-center gap-1 p-1.5 sm:px-2 sm:py-2 rounded border transition-colors focus:outline-none cursor-pointer text-[10px] font-mono font-bold ${
                  radarEnabled
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60'
                    : 'bg-[#0a1220]/90 hover:bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Toggle Tactical Radar Minimap"
                aria-label="Toggle Tactical Radar Minimap"
                tabIndex={-1}
              >
                <Radar className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">RADAR</span>
              </button>
            )}
            {onCyclePerformanceMode && (
              <button
                type="button"
                data-testid="hud-performance-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  onCyclePerformanceMode();
                }}
                className={`pointer-events-auto inline-flex items-center gap-1 p-1.5 sm:px-2 sm:py-2 rounded border transition-colors focus:outline-none cursor-pointer text-[10px] font-mono font-bold ${
                  performanceMode === 'mobile_turbo'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/70'
                    : performanceMode === 'high'
                    ? 'bg-purple-500/20 text-purple-200 border-purple-400/60'
                    : 'bg-[#0a1220]/90 hover:bg-slate-800 text-slate-300 border-cyan-500/30'
                }`}
                title="Switch Performance / Anti-Lag Mode (Auto / Turbo / High)"
                aria-label="Toggle Performance Mode"
                tabIndex={-1}
              >
                <Gauge className={`w-3.5 h-3.5 ${performanceMode === 'mobile_turbo' ? 'text-emerald-400' : 'text-cyan-400'}`} />
                <span className="hidden sm:inline">
                  {performanceMode === 'mobile_turbo' ? 'TURBO' : performanceMode === 'high' ? 'HIGH' : 'AUTO'}
                </span>
              </button>
            )}
            {onToggleSystemHealth && (
              <button
                type="button"
                data-testid="system-health-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  onToggleSystemHealth();
                }}
                className={`pointer-events-auto inline-flex items-center gap-1 p-1.5 sm:px-2 sm:py-2 rounded border transition-colors focus:outline-none cursor-pointer text-[10px] font-mono font-bold ${
                  systemHealthOpen
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60'
                    : 'bg-[#0a1220]/90 hover:bg-slate-800 text-slate-300 border-cyan-500/30'
                }`}
                title="Toggle System Health Telemetry (F3)"
                aria-label="Toggle System Health"
                tabIndex={-1}
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">SYS</span>
              </button>
            )}
            <button
              onClick={toggleMute}
              className="pointer-events-auto p-1.5 sm:p-2 bg-[#0a1220]/90 hover:bg-slate-800 text-cyan-400 rounded border border-cyan-500/30 transition-colors focus:outline-none cursor-pointer"
              title="Mute Audio (M)"
              aria-label="Mute Audio"
              tabIndex={-1}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
            <button
              onClick={onPause}
              className="pointer-events-auto p-1.5 sm:p-2 bg-[#0a1220]/90 hover:bg-slate-800 text-cyan-400 rounded border border-cyan-500/30 transition-colors focus:outline-none cursor-pointer"
              title="Pause Game (Esc)"
              aria-label="Pause Game"
              tabIndex={-1}
            >
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Score & Multiplier */}
          <div className="bg-[#0a1220]/90 px-2.5 sm:px-4 py-1 sm:py-2 rounded border border-cyan-500/30 text-right min-w-[96px] sm:min-w-[140px]">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider">SCORE</div>
            <div className="text-base sm:text-2xl font-bold font-mono-numbers text-cyan-300 tracking-wider">
              {stats.score.toLocaleString()}
            </div>
          </div>

          {/* Active Consecutive Hit Combo Counter */}
          {stats.comboTimer > 0 && (stats.comboCount > 0 || stats.comboStreak > 0) && (
            <div
              className="bg-gradient-to-r from-[#0a1424]/95 via-[#131d33]/95 to-[#0a1424]/95 px-3.5 py-2 rounded-lg border-2 text-right shadow-[0_0_20px_rgba(0,243,255,0.35)] transition-colors flex flex-col gap-1 items-end min-w-[170px]"
              style={{
                borderColor:
                  (stats.comboMultiplier || 1.0) >= 3.0
                    ? '#ff0055'
                    : (stats.comboMultiplier || 1.0) >= 2.0
                    ? '#ffb400'
                    : '#00f3ff',
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-300">
                  CHAIN HIT
                </span>
                <span
                  className="text-lg sm:text-xl font-black font-mono-numbers tracking-tight"
                  style={{
                    color:
                      (stats.comboMultiplier || 1.0) >= 3.0
                        ? '#ff3377'
                        : (stats.comboMultiplier || 1.0) >= 2.0
                        ? '#ffc107'
                        : '#00f3ff',
                  }}
                >
                  {(stats.comboMultiplier || 1.0).toFixed(1)}x COMBO
                </span>
              </div>

              <div className="flex items-center justify-between w-full text-[10px] font-bold font-mono-numbers">
                <span className="text-amber-400">
                  {stats.comboCount || stats.comboStreak} HITS
                </span>
                <span className="text-cyan-400/90 text-[9px]">
                  +DMG & +COINS
                </span>
              </div>

              {/* 3-Second Rolling Window Countdown Progress Bar */}
              <div className="w-full h-1.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-700/50 mt-0.5">
                <div
                  className="h-full rounded-full transition-all duration-75 ease-linear"
                  style={{
                    width: `${Math.max(0, Math.min(100, ((stats.comboTimer || 0) / (stats.comboWindowSeconds || 3.0)) * 100))}%`,
                    backgroundColor:
                      (stats.comboMultiplier || 1.0) >= 3.0
                        ? '#ff0055'
                        : (stats.comboMultiplier || 1.0) >= 2.0
                        ? '#ffb400'
                        : '#00f3ff',
                    boxShadow:
                      (stats.comboMultiplier || 1.0) >= 3.0
                        ? '0 0 8px #ff0055'
                        : (stats.comboMultiplier || 1.0) >= 2.0
                        ? '0 0 8px #ffb400'
                        : '0 0 8px #00f3ff',
                  }}
                />
              </div>

              {/* 20-Hit Combo Finisher Charge / Trigger */}
              <div className="w-full pt-1 mt-0.5 border-t border-slate-700/60 flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px] font-bold font-mono-numbers">
                  <span className={stats.comboFinisherReady ? 'text-amber-300' : 'text-slate-400'}>
                    FINISHER
                  </span>
                  <span
                    data-testid="combo-finisher-charge"
                    className={stats.comboFinisherReady ? 'text-amber-300' : 'text-cyan-300'}
                  >
                    {stats.comboFinisherReady
                      ? 'READY!'
                      : `${Math.min(COMBO_FINISHER_THRESHOLD, stats.comboFinisherCharge || 0)}/${COMBO_FINISHER_THRESHOLD}`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${
                      stats.comboFinisherReady ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' : 'bg-cyan-400'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        ((stats.comboFinisherReady ? COMBO_FINISHER_THRESHOLD : stats.comboFinisherCharge || 0) /
                          COMBO_FINISHER_THRESHOLD) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                {stats.comboFinisherReady && (
                  <button
                    type="button"
                    data-testid="combo-finisher-btn"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.currentTarget.blur();
                      onTriggerFinisher?.();
                    }}
                    className="pointer-events-auto mt-1 w-full px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] tracking-wider uppercase shadow-[0_0_16px_rgba(251,191,36,0.6)] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>UNLEASH FINISHER [E]</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Wave & Hostile Count */}
          <div className="bg-[#0a1220]/90 px-3 py-1.5 rounded border border-slate-800 text-right">
            <div className="text-xs font-bold tracking-wider text-slate-300">
              WAVE <span className="text-cyan-400 font-mono-numbers">{wave}</span>
              {isBoss && <span className="ml-1.5 text-red-400 font-bold animate-pulse">[BOSS]</span>}
            </div>
            <div className="text-[10px] text-slate-400 font-mono-numbers">
              {enemiesLeft} HOSTILES ACTIVE
            </div>
            {(stats.activeCompanion || (stats.activeModules && stats.activeModules.length > 0)) && (
              <div className="text-[9px] text-cyan-300 font-mono font-bold mt-0.5 truncate max-w-[180px]">
                {stats.activeCompanion ? `${COMPANION_DRONES[stats.activeCompanion]?.icon} ${COMPANION_DRONES[stats.activeCompanion]?.name.split(' ')[0]}` : ''}
                {stats.activeCompanion && stats.activeModules && stats.activeModules.length > 0 ? ' · ' : ''}
                {stats.activeModules && stats.activeModules.length > 0 ? `${stats.activeModules.length} MOD` : ''}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Bottom Center: Weapon Selector Dock & Scrap / Coin Counters */}
      {compactMobile && touchControlsEnabled ? (
        <div className="hidden min-[540px]:flex w-full justify-center">
          <div className="pointer-events-auto flex items-center gap-2 bg-[#080d17]/90 px-2.5 py-1 rounded-full border border-cyan-500/30 text-[10px] font-mono-numbers">
            <span className="text-amber-300 font-bold">🪙 {stats.coins.toLocaleString()}</span>
            <span className="text-cyan-200 font-bold">💎 {(stats.diamonds ?? 0).toLocaleString()}</span>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center gap-2">
        {/* Weapon Slots & Scrap bar */}
        <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5 bg-[#080d17]/95 p-1.5 rounded-lg border border-cyan-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-x-auto max-w-full">
          {WEAPON_ORDER.map((wId) => {
            const wep = WEAPONS[wId];
            const isUnlocked = stats.unlockedWeapons[wId];
            const isSelected = stats.activeWeapon === wId;
            return (
              <button
                key={wId}
                disabled={!isUnlocked}
                onClick={() => onSelectWeapon(wId)}
                className={`relative px-1.5 py-1 rounded flex flex-col items-center gap-0.5 min-w-[44px] sm:min-w-[52px] shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 border-2 border-cyan-400 shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                    : isUnlocked
                    ? 'bg-slate-900/60 border border-slate-700/60 hover:border-slate-500'
                    : 'bg-slate-950/80 border border-slate-800/80 text-slate-600 cursor-not-allowed opacity-50'
                }`}
                tabIndex={-1}
                title={isUnlocked ? `${wep.name} (Key ${wep.keyLabel})` : `${wep.name} (Locked - visit Weapon Store)`}
              >
                <span
                  className="text-[9px] font-bold px-1 py-0.2 rounded"
                  style={{
                    backgroundColor: isUnlocked ? `${wep.color}22` : '#1e293b',
                    color: isUnlocked ? wep.color : '#64748b',
                    border: isUnlocked ? `1px solid ${wep.color}55` : '1px solid #334155',
                  }}
                >
                  [{wep.keyLabel}]
                </span>
                <span className="text-[10px] font-bold text-slate-200 tracking-tight truncate max-w-[55px] sm:max-w-none">
                  {wep.name.split(' ')[0]}
                </span>
                <span className="text-[8px] font-mono uppercase text-slate-400">
                  {isUnlocked ? (wep.tier === 'godtier' ? '★GOD' : wep.tier === 'monster' ? '★MON' : wep.tier) : '🔒LOCK'}
                </span>
              </button>
            );
          })}

          <div className="h-8 w-[1px] bg-slate-700 mx-0.5" />

          {/* Coins Display */}
          <div className="flex flex-col items-start px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded">
            <span className="text-[9px] font-bold text-amber-400 flex items-center gap-0.5">
              🪙 COINS
            </span>
            <span className="text-xs font-bold font-mono-numbers text-amber-300">
              {stats.coins.toLocaleString()}
            </span>
          </div>

          {/* Diamonds Display */}
          <div className="flex flex-col items-start px-2 py-1 bg-cyan-500/10 border border-cyan-400/30 rounded">
            <span className="text-[9px] font-bold text-cyan-300 flex items-center gap-0.5">
              💎 DIAMONDS
            </span>
            <span className="text-xs font-bold font-mono-numbers text-cyan-200">
              {(stats.diamonds ?? 0).toLocaleString()}
            </span>
          </div>

          {/* Scrap core counter & Upgrades toggle */}
          <button
            onClick={() => setUpgradeDrawerOpen(!upgradeDrawerOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 rounded transition-all cursor-pointer"
            title="Open Upgrades Matrix"
          >
            <div className="flex flex-col items-start">
              <span className="text-[9px] font-bold text-cyan-400 flex items-center gap-1">
                <Cpu className="w-3 h-3" /> UPGRADES
              </span>
              <span className="text-xs font-bold font-mono-numbers text-cyan-300">
                {stats.scrap} SCRAP
              </span>
            </div>
          </button>
        </div>
      </div>
      )}

      {/* Field Upgrades Modal Overlay (if opened) */}
      {upgradeDrawerOpen && (
        <div className="pointer-events-auto absolute inset-0 z-40 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#0a1220] border-2 border-cyan-500/60 rounded-xl p-6 max-w-lg w-full shadow-[0_0_40px_rgba(0,243,255,0.3)]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-cyan-500/30">
              <div>
                <h3 className="text-lg font-bold text-cyan-300 tracking-wider">CORE OVERCLOCK MATRIX</h3>
                <p className="text-xs text-slate-400">Enhance chassis combat sub-routines</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">AVAILABLE:</span>
                <div className="text-base font-bold text-amber-400 font-mono-numbers">{stats.scrap} SCRAP</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {(Object.keys(UPGRADES) as UpgradeId[]).map((upId) => {
                const def = UPGRADES[upId];
                let currentLvl = 0;
                if (upId === 'maxHealth') currentLvl = stats.upgrades.maxHealthLvl;
                else if (upId === 'shield') currentLvl = stats.upgrades.shieldLvl;
                else if (upId === 'damage') currentLvl = stats.upgrades.damageLvl;
                else if (upId === 'fireRate') currentLvl = stats.upgrades.fireRateLvl;
                else if (upId === 'dash') currentLvl = stats.upgrades.dashLvl;

                const isMax = currentLvl >= def.maxLevel;
                const cost = Math.round(def.baseCost * Math.pow(def.costMultiplier, currentLvl));
                const canAfford = stats.scrap >= cost && !isMax;

                return (
                  <div
                    key={upId}
                    className="flex justify-between items-center p-3 bg-slate-900/80 border border-slate-800 rounded-lg hover:border-cyan-500/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-200">{def.name}</span>
                        <span className="text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
                          LVL {currentLvl}/{def.maxLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{def.description}</p>
                    </div>

                    <button
                      disabled={!canAfford}
                      onClick={() => onBuyUpgrade(upId)}
                      className={`px-3 py-1.5 rounded text-xs font-bold tracking-wider font-mono-numbers cursor-pointer transition-all ${
                        isMax
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_10px_rgba(255,180,0,0.4)]'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? 'MAXED' : `${cost} SCRAP`}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setUpgradeDrawerOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider rounded border border-slate-600 transition-colors cursor-pointer"
              >
                RETURN TO COMBAT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
