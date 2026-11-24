import React from 'react';
import { Volume2, VolumeX, Play, Lock, ShoppingBag, MapPin, User, Target, Trophy, Medal, Swords, Globe, Clock, Gift, Infinity as InfinityIcon, Crown, Gauge } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { LEVELS, REGIONS, MapRegionId, isRegionUnlocked } from '../game/levels';
import { loadUserProfile } from '../game/profile';
import { loadAchievements, getAchievementStats } from '../game/achievements';
import { getGlobalEventWindow, loadGlobalEventState, NEON_CRAFT_SKINS } from '../game/globalEvents';
import { PerformanceMode } from '../game/rules';
import { PWAInstallButton } from './PWAInstallButton';

interface TitleScreenProps {
  onStart: (startingLevel?: number) => void;
  onStartEndless?: () => void;
  onStartBossRush?: () => void;
  onOpenCyberDuel?: () => void;
  onOpenOnlineDuel?: () => void;
  onOpenMap: () => void;
  onOpenStore: () => void;
  onOpenSupplyCrates?: () => void;
  onOpenProfile: () => void;
  onOpenDailyMissions?: () => void;
  onOpenGlobalEvents?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenAchievements?: () => void;
  unclaimedMissionsCount?: number;
  unclaimedEventsCount?: number;
  freeSupplyKeysCount?: number;
  endlessBestWave?: number;
  bossRushBestStage?: number;
  bestScore: number;
  highestLevelUnlocked?: number;
  coins?: number;
  diamonds?: number;
  performanceMode?: PerformanceMode;
  onCyclePerformanceMode?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onStartEndless,
  onStartBossRush,
  onOpenCyberDuel,
  onOpenOnlineDuel,
  onOpenMap,
  onOpenStore,
  onOpenSupplyCrates,
  onOpenProfile,
  onOpenDailyMissions,
  onOpenGlobalEvents,
  onOpenLeaderboard,
  onOpenAchievements,
  unclaimedMissionsCount = 0,
  unclaimedEventsCount = 0,
  freeSupplyKeysCount = 0,
  endlessBestWave = 0,
  bossRushBestStage = 0,
  bestScore,
  highestLevelUnlocked = 1,
  coins = 0,
  diamonds = 0,
  performanceMode = 'auto',
  onCyclePerformanceMode,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundEngine.getMuted());
  const [selectedLevel, setSelectedLevel] = React.useState(1);
  const [activeRegionTab, setActiveRegionTab] = React.useState<MapRegionId>('dhaka');
  const [eventWindow, setEventWindow] = React.useState(() => getGlobalEventWindow());
  const [eventState, setEventState] = React.useState(() => loadGlobalEventState());
  const userProfile = React.useMemo(() => loadUserProfile(), []);
  const achStats = React.useMemo(() => getAchievementStats(loadAchievements()), []);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      setEventWindow(getGlobalEventWindow(now));
      setEventState(loadGlobalEventState(now));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const selectedDef = LEVELS[selectedLevel - 1] || LEVELS[0];
  const activeRegionDef = REGIONS[activeRegionTab];
  const regionLevels = React.useMemo(
    () => LEVELS.filter((l) => l.region === activeRegionTab),
    [activeRegionTab]
  );

  return (
    <div className="absolute inset-0 z-30 pointer-events-auto sm:pointer-events-none overflow-y-auto flex flex-col justify-start sm:justify-between gap-4 p-3 sm:p-8 select-none">
      {/* Top Bar: Nav Tabs (Home / Maps / Store / Daily Missions / Supply Crate / 48H Event / Leaderboard / Profile), Coin & Diamond Wallet, and Audio */}
      <div className="w-full flex flex-wrap justify-between items-center gap-2.5">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
          <div className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold text-[11px] uppercase tracking-wider shadow-[0_0_12px_rgba(0,243,255,0.3)] flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>HOME</span>
          </div>

          <button
            onClick={onOpenMap}
            className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-400/60 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,243,255,0.15)]"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>MAPS ({LEVELS.length})</span>
          </button>

          <button
            onClick={onOpenStore}
            className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-400/60 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,180,0,0.15)]"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>STORE</span>
          </button>

          {onOpenDailyMissions && (
            <button
              onClick={onOpenDailyMissions}
              className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-400/60 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,180,0,0.15)]"
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>DAILY MISSIONS</span>
              {unclaimedMissionsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] animate-pulse">
                  {unclaimedMissionsCount}
                </span>
              )}
            </button>
          )}

          {onOpenSupplyCrates && (
            <button
              type="button"
              data-testid="nav-supply-crate-btn"
              onClick={onOpenSupplyCrates}
              className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/50 hover:border-amber-300 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(251,191,36,0.2)]"
            >
              <Gift className="w-3.5 h-3.5 text-amber-400" />
              <span>SUPPLY CRATE</span>
              {freeSupplyKeysCount > 0 && (
                <span className="px-1.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[10px]">
                  {freeSupplyKeysCount} FREE
                </span>
              )}
            </button>
          )}

          {onOpenGlobalEvents && (
            <button
              data-testid="nav-global-event-btn"
              onClick={onOpenGlobalEvents}
              className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-white border border-cyan-500/50 hover:border-cyan-300 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,255,213,0.2)]"
            >
              <span>{eventWindow.eventDef.badgeIcon}</span>
              <span>48H EVENT</span>
              <span className="font-mono text-[10px] text-slate-300 tabular-nums">
                {eventWindow.formattedCountdown}
              </span>
              {unclaimedEventsCount > 0 && (
                <span className="px-1.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[10px]">
                  {unclaimedEventsCount}
                </span>
              )}
            </button>
          )}

          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-400/60 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,180,0,0.15)]"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>LEADERBOARD</span>
            </button>
          )}

          <button
            onClick={onOpenAchievements || onOpenProfile}
            className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-yellow-300 border border-slate-700 hover:border-yellow-400/60 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,215,0,0.15)]"
          >
            <Medal className="w-3.5 h-3.5 text-yellow-400" />
            <span>MEDALS ({achStats.unlockedCount}/{achStats.totalCount})</span>
          </button>

          <button
            onClick={onOpenProfile}
            className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-400/60 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,136,0.15)]"
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>{userProfile.callsign}</span>
          </button>
        </div>

        {/* Right: Coins balance, Diamond balance & Audio */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          <div
            onClick={onOpenStore}
            className="flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 rounded-lg cursor-pointer transition-all shadow-[0_0_10px_rgba(255,180,0,0.2)]"
            title="Click to visit Weapon Store"
          >
            <span className="text-base">🪙</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-amber-300 font-bold tracking-wider uppercase font-mono">COINS</span>
              <span className="text-xs font-bold font-mono-numbers text-amber-400">{coins.toLocaleString()}</span>
            </div>
          </div>

          <div
            onClick={onOpenStore}
            className="flex items-center gap-2 px-3 py-1 bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 rounded-lg cursor-pointer transition-all shadow-[0_0_10px_rgba(0,243,255,0.25)]"
            title="Cyber Diamonds (obtained strictly from Daily Missions)"
          >
            <span className="text-base">💎</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-cyan-300 font-bold tracking-wider uppercase font-mono">DIAMONDS</span>
              <span className="text-xs font-black font-mono-numbers text-cyan-300">{diamonds.toLocaleString()}</span>
            </div>
          </div>

          {onCyclePerformanceMode && (
            <button
              type="button"
              data-testid="title-performance-toggle"
              onClick={onCyclePerformanceMode}
              className={`px-2.5 py-1.5 rounded-lg border font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                performanceMode === 'mobile_turbo'
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-400/70 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                  : performanceMode === 'high'
                  ? 'bg-fuchsia-950/90 text-fuchsia-300 border-fuchsia-400/60'
                  : 'bg-slate-900/90 text-cyan-300 border-cyan-500/40 hover:border-cyan-400'
              }`}
              title="Switch Phone / FPS Mode (AUTO / TURBO / HIGH)"
            >
              <Gauge className="w-3.5 h-3.5 shrink-0" />
              <span>
                {performanceMode === 'mobile_turbo'
                  ? 'FPS: TURBO'
                  : performanceMode === 'high'
                  ? 'FPS: HIGH'
                  : 'FPS: AUTO'}
              </span>
            </button>
          )}

          <PWAInstallButton variant="compact" label="DOWNLOAD" />

          <button
            onClick={handleToggleMute}
            className="p-2 rounded-lg bg-slate-900/90 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 transition-colors focus:outline-none cursor-pointer"
            title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            tabIndex={-1}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Center Left Hero Lockup */}
      <div className="max-w-xl sm:my-auto pt-1 sm:pt-0">
        {/* Title Lockup */}
        <div className="mb-2 sm:mb-3">
          <svg className="w-full max-w-[260px] sm:max-w-[420px] h-auto drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]" viewBox="0 0 460 90" fill="none">
            <path d="M 0 0 L 25 0 L 15 90 L 0 90 Z" fill="#00f3ff" opacity="0.8" />
            <path d="M 20 15 L 430 15 L 440 25 L 430 75 L 30 75 Z" fill="#0a1220" stroke="#00f3ff" strokeWidth="2" />
            <text x="45" y="58" fill="#ffffff" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="36" letterSpacing="4">
              NABIL-BOT
            </text>
            <text x="270" y="72" fill="#ff0077" fontFamily="ui-monospace, monospace" fontWeight="700" fontSize="12" letterSpacing="2">
              CYBER PROTOCOL
            </text>
            <line x1="45" y1="64" x2="240" y2="64" stroke="#00f3ff" strokeWidth="1.5" />
          </svg>
        </div>

        <p className="hidden sm:block text-xs sm:text-sm text-slate-300 mb-3 font-mono max-w-xl leading-relaxed">
          Command NaBil-BOT across {LEVELS.length} cyber sectors in {Object.keys(REGIONS).length} regional battlegrounds: <strong className="text-cyan-300">Dhaka</strong> (1-7), <strong className="text-emerald-300">Rajshahi</strong> (8-14), <strong className="text-amber-300">Chattogram</strong> (15-21), <strong className="text-purple-300">Sylhet</strong> (22-28), <strong className="text-teal-300">Sundarbans</strong> (29-34), <strong className="text-pink-300">Cox&apos;s Orbit</strong> (35-40), <strong className="text-sky-300">Kuakata Abyss</strong> (41-50), <strong className="text-amber-400">Singularity</strong> (51-60), <strong className="text-cyan-300">Barishal Nebula</strong> (61-70), <strong className="text-blue-300">Rangpur Cryo</strong> (71-80), <strong className="text-orange-300">Khulna Core</strong> (81-90), &amp; <strong className="text-rose-300">Eternity Throne</strong> (91-100).
        </p>

        {/* Region-Tabbed Level Selector (100 Levels / 12 Regions) */}
        <div className="mb-4">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 flex items-center justify-between max-w-xl">
            <div className="flex items-center gap-1.5">
              <span>SELECT MISSION SECTOR:</span>
              <span className="text-cyan-400 font-mono-numbers">LEVEL {selectedLevel}/{LEVELS.length}</span>
            </div>
            <span className="text-[10px] font-bold" style={{ color: activeRegionDef.primaryColor }}>
              {activeRegionDef.name} ({activeRegionDef.startLevel}-{activeRegionDef.endLevel})
            </span>
          </div>

          {/* Compact Region Tabs (12 Regions) */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-w-xl mb-2">
            {(Object.keys(REGIONS) as MapRegionId[]).map((rId, idx) => {
              const reg = REGIONS[rId];
              const regionUnlocked = isRegionUnlocked(rId, highestLevelUnlocked);
              const isTabActive = activeRegionTab === rId;
              return (
                <button
                  key={rId}
                  type="button"
                  onClick={() => setActiveRegionTab(rId)}
                  className={`pointer-events-auto px-2 py-1 rounded text-[10px] font-bold font-mono tracking-wider flex items-center justify-center gap-1 whitespace-nowrap transition-all cursor-pointer ${
                    isTabActive
                      ? 'bg-slate-800 border text-white'
                      : regionUnlocked
                      ? 'bg-slate-900/75 border border-slate-800 text-slate-300 hover:border-slate-600'
                      : 'bg-slate-950/70 border border-slate-900 text-slate-500 hover:border-slate-700'
                  }`}
                  style={isTabActive ? { borderColor: reg.primaryColor, color: reg.primaryColor } : {}}
                  title={`${reg.name} (Sectors ${reg.startLevel}-${reg.endLevel})`}
                >
                  {!regionUnlocked && <Lock className="w-2.5 h-2.5 opacity-70 shrink-0" />}
                  <span>R{idx + 1} · {reg.startLevel}-{reg.endLevel}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1 max-w-lg">
            {regionLevels.map((lvl) => {
              const isUnlocked = lvl.level <= highestLevelUnlocked;
              const isSelected = lvl.level === selectedLevel;
              return (
                <button
                  key={lvl.level}
                  disabled={!isUnlocked}
                  onClick={() => setSelectedLevel(lvl.level)}
                  className={`pointer-events-auto px-2 py-1 rounded text-xs font-bold tracking-wider font-mono-numbers flex items-center gap-0.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-2 shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                      : isUnlocked
                      ? 'bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-300'
                      : 'bg-slate-950/60 border border-slate-800/80 text-slate-600 cursor-not-allowed'
                  }`}
                  style={isSelected ? { borderColor: lvl.primaryColor, color: lvl.primaryColor } : {}}
                  title={isUnlocked ? `Select ${lvl.name}` : `Unlock Level ${lvl.level} by beating Level ${lvl.level - 1}`}
                >
                  {!isUnlocked && <Lock className="w-2.5 h-2.5" />}
                  <span>LVL {lvl.level}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 text-[11px] font-mono flex items-center gap-2">
            <span className="text-slate-400">SECTOR:</span>
            <span className="font-bold tracking-wider" style={{ color: selectedDef.primaryColor }}>
              {selectedDef.name} ({selectedDef.difficultyLabel})
            </span>
          </div>
        </div>

        {bestScore > 0 && (
          <div className="mb-3 inline-flex items-center gap-3 px-3.5 py-1 bg-slate-900/90 border border-cyan-500/20 rounded">
            <span className="text-[10px] uppercase tracking-wider text-slate-400">BEST RECORD:</span>
            <span className="text-xs font-bold text-amber-400 font-mono-numbers">{bestScore.toLocaleString()} PTS</span>
          </div>
        )}

        {/* Active 48h Global Event Spotlight Banner */}
        {onOpenGlobalEvents && (
          <button
            type="button"
            data-testid="title-global-event-banner"
            onClick={onOpenGlobalEvents}
            className="pointer-events-auto mb-3 w-full max-w-xl text-left px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/95 border border-cyan-400/45 hover:border-cyan-300 flex items-center justify-between gap-3 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-lg shrink-0">{eventWindow.eventDef.badgeIcon}</span>
              <div className="min-w-0">
                <div className="text-xs font-black text-white truncate">
                  {eventWindow.eventDef.title} · Reward: {NEON_CRAFT_SKINS[eventWindow.eventDef.rewardCraftId].name}
                </div>
                <div className="text-[11px] font-mono text-slate-300 flex items-center gap-2 tabular-nums">
                  <span>
                    Objectives {eventState.objectives.filter((o) => o.isCompleted).length}/{eventState.objectives.length}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-cyan-300">
                    <Clock className="w-3 h-3" />
                    {eventWindow.formattedCountdown} left
                  </span>
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-cyan-400/15 border border-cyan-400/50 text-cyan-200 text-[10px] font-black uppercase tracking-wider shrink-0">
              View Event
            </span>
          </button>
        )}

        {/* Primary CTA buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            data-start="true"
            onClick={() => onStart(selectedLevel)}
            className="pointer-events-auto inline-flex items-center gap-2 px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs sm:text-sm tracking-wider uppercase rounded shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_30px_rgba(0,243,255,0.7)] transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>DEPLOY TO LEVEL {selectedLevel}</span>
          </button>

          {onStartEndless && (
            <button
              type="button"
              data-testid="start-endless-btn"
              onClick={onStartEndless}
              className="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white font-bold text-xs sm:text-sm tracking-wider uppercase rounded shadow-[0_0_20px_rgba(217,70,239,0.45)] transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <InfinityIcon className="w-4 h-4" />
              <span>
                ENDLESS OVERDRIVE{endlessBestWave > 0 ? ` · BEST W${endlessBestWave}` : ''}
              </span>
            </button>
          )}

          {onStartBossRush && (
            <button
              type="button"
              data-testid="start-boss-rush-btn"
              onClick={onStartBossRush}
              className="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm tracking-wider uppercase rounded shadow-[0_0_20px_rgba(245,158,11,0.45)] transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Crown className="w-4 h-4" />
              <span>
                BOSS RUSH{bossRushBestStage > 0 ? ` · S${bossRushBestStage}/6` : ' (6 TITANS)'}
              </span>
            </button>
          )}

          {onOpenCyberDuel && (
            <button
              type="button"
              onClick={onOpenCyberDuel}
              className="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs sm:text-sm tracking-wider uppercase rounded shadow-[0_0_20px_rgba(255,0,119,0.45)] transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Swords className="w-4 h-4" />
              <span>2-Min Cyber Duel (1v1)</span>
            </button>
          )}

          {onOpenOnlineDuel && (
            <button
              type="button"
              data-testid="open-online-pvp-btn"
              onClick={onOpenOnlineDuel}
              className="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm tracking-wider uppercase rounded shadow-[0_0_20px_rgba(16,185,129,0.45)] transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Globe className="w-4 h-4" />
              <span>Online PvP (Solo / Team)</span>
            </button>
          )}

          <button
            onClick={onOpenMap}
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/50 hover:border-cyan-400 font-bold text-xs tracking-wider uppercase rounded shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all cursor-pointer"
          >
            <MapPin className="w-4 h-4" />
            <span>MAPS ({LEVELS.length})</span>
          </button>

          <button
            onClick={onOpenStore}
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/50 hover:border-amber-400 font-bold text-xs tracking-wider uppercase rounded shadow-[0_0_15px_rgba(255,180,0,0.2)] transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>STORE</span>
          </button>

          {onOpenLeaderboard && (
            <button
              onClick={onOpenLeaderboard}
              className="pointer-events-auto inline-flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/50 hover:border-amber-400 font-bold text-xs tracking-wider uppercase rounded shadow-[0_0_15px_rgba(255,180,0,0.2)] transition-all cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>LEADERBOARD</span>
            </button>
          )}

          <button
            onClick={onOpenProfile}
            className="pointer-events-auto inline-flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/50 hover:border-emerald-400 font-bold text-xs tracking-wider uppercase rounded shadow-[0_0_15px_rgba(0,255,136,0.2)] transition-all cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>PROFILE</span>
          </button>

          <PWAInstallButton variant="primary" label="DOWNLOAD APP" />
        </div>
      </div>

      {/* Flat Single-Line Control Hints at bottom */}
      <div className="w-full text-center">
        <p className="text-xs sm:text-sm text-slate-400 tracking-wider font-mono-numbers">
          WASD Move · Click / Space Fire · Shift Dash · E Finisher (20-Hit) · 1-9, 0 Weapon · Esc Pause
        </p>
      </div>
    </div>
  );
};
