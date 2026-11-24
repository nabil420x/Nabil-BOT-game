import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RotateCw, X } from 'lucide-react';
import { GameEngine } from './game/engine';
import { GameState, PlayerStats, RunSnapshot, WeaponType, CraftId, DifficultyMode, CyberAugmentId } from './game/types';
import { TitleScreen } from './components/TitleScreen';
import { MapScreen } from './components/MapScreen';
import { StoreScreen } from './components/StoreScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { GlobalEventsModal } from './components/GlobalEventsModal';
import { SupplyCrateModal } from './components/SupplyCrateModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { GameHUD } from './components/GameHUD';
import { CyberDuelHUD } from './components/CyberDuelHUD';
import { CyberDuelModal } from './components/CyberDuelModal';
import { CyberAugmentModal } from './components/CyberAugmentModal';
import { DuelVictoryModal } from './components/DuelVictoryModal';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { VictoryModal } from './components/VictoryModal';
import { SystemHealthOverlay } from './components/SystemHealthOverlay';
import { TouchControlsOverlay } from './components/TouchControlsOverlay';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  UpgradeId,
  loadDifficultyMode,
  PerformanceMode,
  loadPerformanceMode,
  savePerformanceMode,
} from './game/rules';
import { loadDailyMissionsState, getUnclaimedMissionsCount, recordDailyPlayStreak } from './game/missions';
import { loadGlobalEventState, getUnclaimedGlobalEventRewardsCount } from './game/globalEvents';
import { loadSupplyCrateState } from './game/supplyCrate';
import { loadEndlessRecord } from './game/endless';
import { loadBossRushRecord } from './game/bountyAndBossRush';
import { loadActiveCraft, loadUnlockedCrafts } from './game/crafts';
import { loadDiamonds } from './game/diamonds';
import { loadUserProfile } from './game/profile';
import {
  parseDuelInviteFromSearch,
  type DuelCameraMode,
  type DuelConfig,
  type DuelHudSnapshot,
  type DuelModeType,
  type DuelSpectatorCamera,
  type DuelVictorySummary,
} from './game/duel';
import type { DuelClient, SpectateJoinedPayload } from './game/duelClient';
import {
  computeViewportLayoutState,
  detectTouchCapability,
  exitLandscapeFullscreen,
  isFullscreenActive,
  requestLandscapeFullscreen,
  shouldShowRotatePrompt,
  type ViewportLayoutState,
} from './game/orientation';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('title');
  const [currentTab, setCurrentTab] = useState<'home' | 'map' | 'store' | 'profile'>('home');
  const [profileInitialTab, setProfileInitialTab] = useState<'profile' | 'medals'>('profile');
  const [hudStats, setHudStats] = useState<PlayerStats | null>(null);
  const [currentWave, setCurrentWave] = useState(1);
  const [enemiesLeft, setEnemiesLeft] = useState(0);
  const [isBoss, setIsBoss] = useState(false);
  const [runSnapshot, setRunSnapshot] = useState<RunSnapshot | null>(null);
  const [bestScore, setBestScore] = useState(0);
  const [highestLevelUnlocked, setHighestLevelUnlocked] = useState(1);
  const [walletCoins, setWalletCoins] = useState(500);
  const [walletDiamonds, setWalletDiamonds] = useState<number>(() => loadDiamonds());
  const [unlockedWeapons, setUnlockedWeapons] = useState<Record<WeaponType, boolean>>({
    pulse: true,
    scatter: false,
    beam: false,
    missile: false,
    leviathan: false,
    vortex: false,
    inferno: false,
    chrono_thunder: false,
    supernova: false,
    aegis_titan: false,
    hyperion_astral: false,
    plasma_scythe: false,
    cryo_shatter: false,
    omega_singularity: false,
    prism_splitter: false,
    void_rail: false,
    celestial_eclipse: false,
  });
  const [activeWeapon, setActiveWeapon] = useState<WeaponType>('pulse');

  // Flying Crafts and Daily Missions & Leaderboard State
  const [activeCraft, setActiveCraft] = useState<CraftId>(() => loadActiveCraft());
  const [unlockedCrafts, setUnlockedCrafts] = useState<Record<CraftId, boolean>>(() => loadUnlockedCrafts());
  const [difficulty, setDifficulty] = useState<DifficultyMode>(() => loadDifficultyMode());
  const [isDailyMissionsOpen, setIsDailyMissionsOpen] = useState(false);
  const [isGlobalEventsOpen, setIsGlobalEventsOpen] = useState(false);
  const [isSupplyCratesOpen, setIsSupplyCratesOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isCyberDuelOpen, setIsCyberDuelOpen] = useState(false);
  const [cyberDuelInitialMode, setCyberDuelInitialMode] = useState<DuelModeType>('local');
  const [cyberDuelInviteCode, setCyberDuelInviteCode] = useState<string | null>(null);
  const [cyberDuelInitialSpectate, setCyberDuelInitialSpectate] = useState<boolean>(false);
  const [duelHud, setDuelHud] = useState<DuelHudSnapshot | null>(null);
  const [duelVictory, setDuelVictory] = useState<DuelVictorySummary | null>(null);
  const [systemHealthOpen, setSystemHealthOpen] = useState<boolean>(false);
  const [unclaimedMissionsCount, setUnclaimedMissionsCount] = useState(() =>
    getUnclaimedMissionsCount(loadDailyMissionsState())
  );
  const [unclaimedEventsCount, setUnclaimedEventsCount] = useState(() =>
    getUnclaimedGlobalEventRewardsCount(loadGlobalEventState())
  );
  const [freeSupplyKeysCount, setFreeSupplyKeysCount] = useState(() => loadSupplyCrateState().freeKeys);
  const [endlessBestWave, setEndlessBestWave] = useState(() => loadEndlessRecord().bestWave);
  const [bossRushBestStage, setBossRushBestStage] = useState(() => loadBossRushRecord().bestStage);
  const [radarEnabled, setRadarEnabled] = useState(false);
  const [touchControlsEnabled, setTouchControlsEnabled] = useState<boolean>(true);
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>(() => loadPerformanceMode());
  const [viewportLayout, setViewportLayout] = useState<ViewportLayoutState>(() => {
    if (typeof window === 'undefined') {
      return computeViewportLayoutState(1440, 900, false, false);
    }
    return computeViewportLayoutState(
      window.innerWidth,
      window.innerHeight,
      detectTouchCapability(),
      isFullscreenActive()
    );
  });
  const [rotatePromptDismissed, setRotatePromptDismissed] = useState(false);
  const [tiltHintVisible, setTiltHintVisible] = useState(false);

  // Stats sync throttle to avoid excessive 60Hz React renders
  const lastSyncRef = useRef<number>(0);
  const lastDashReadyRef = useRef<boolean>(true);
  const lastDashOverchargedRef = useRef<boolean>(false);
  const lastOverheatRef = useRef<boolean>(false);
  const lastStormPhaseRef = useRef<string>('calm');
  const lastAugmentOpenRef = useRef<boolean>(false);
  const lastOverdriveRef = useRef<boolean>(false);
  const lastBossRushRef = useRef<boolean>(false);
  const lastBossRushStageRef = useRef<number>(1);
  const lastBountyIdRef = useRef<number | null>(null);

  const handleStatsSync = useCallback(
    (stats: PlayerStats, wave: number, enemies: number, boss: boolean) => {
      const now = performance.now();
      const dashReadyNow = stats.dashCooldownTimer <= 0.01;
      const dashOverchargedNow = Boolean(stats.dashOvercharged);
      const overheatNow = Boolean(stats.weaponOverheated);
      const stormPhaseNow = stats.cyberStormPhase || 'calm';
      const augmentOpenNow = Boolean(stats.pendingAugmentChoices && stats.pendingAugmentChoices.length > 0);
      const overdriveNow = (stats.overdriveTimer ?? 0) > 0;
      const bossRushNow = Boolean(stats.isBossRush);
      const bossRushStageNow = stats.bossRushStage || 1;
      const bountyIdNow = stats.activeBounty?.enemyId ?? null;
      const dashEdgeChanged = dashReadyNow !== lastDashReadyRef.current;
      const overchargeEdgeChanged = dashOverchargedNow !== lastDashOverchargedRef.current;
      const overheatEdgeChanged = overheatNow !== lastOverheatRef.current;
      const stormEdgeChanged = stormPhaseNow !== lastStormPhaseRef.current;
      const augmentEdgeChanged = augmentOpenNow !== lastAugmentOpenRef.current;
      const overdriveEdgeChanged = overdriveNow !== lastOverdriveRef.current;
      const bossRushEdgeChanged =
        bossRushNow !== lastBossRushRef.current || bossRushStageNow !== lastBossRushStageRef.current;
      const bountyEdgeChanged = bountyIdNow !== lastBountyIdRef.current;
      const isCompactViewport =
        typeof window !== 'undefined' &&
        (window.innerWidth <= 900 || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0));
      const syncIntervalMs = isCompactViewport ? 160 : 100;
      if (
        dashEdgeChanged ||
        overchargeEdgeChanged ||
        overheatEdgeChanged ||
        stormEdgeChanged ||
        augmentEdgeChanged ||
        overdriveEdgeChanged ||
        bossRushEdgeChanged ||
        bountyEdgeChanged ||
        now - lastSyncRef.current > syncIntervalMs
      ) {
        lastSyncRef.current = now;
        lastDashReadyRef.current = dashReadyNow;
        lastDashOverchargedRef.current = dashOverchargedNow;
        lastOverheatRef.current = overheatNow;
        lastStormPhaseRef.current = stormPhaseNow;
        lastAugmentOpenRef.current = augmentOpenNow;
        lastOverdriveRef.current = overdriveNow;
        lastBossRushRef.current = bossRushNow;
        lastBossRushStageRef.current = bossRushStageNow;
        lastBountyIdRef.current = bountyIdNow;
        setHudStats({ ...stats });
        setWalletCoins(stats.coins);
        setUnlockedWeapons({ ...stats.unlockedWeapons });
        setActiveWeapon(stats.activeWeapon);
        if (stats.activeCraft) setActiveCraft(stats.activeCraft);
        if (stats.unlockedCrafts) setUnlockedCrafts({ ...stats.unlockedCrafts });
        setCurrentWave(wave);
        setEnemiesLeft(enemies);
        setIsBoss(boss);
        if (engineRef.current) {
          setHighestLevelUnlocked(engineRef.current.highestLevelUnlocked);
        }
      }
    },
    []
  );

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
    if (state === 'gameover' || state === 'victory') {
      if (engineRef.current) {
        const snap = engineRef.current.getRunSnapshot();
        setRunSnapshot(snap);
        setBestScore(snap.bestScore);
        setHighestLevelUnlocked(engineRef.current.highestLevelUnlocked);
        setWalletCoins(snap.totalCoins);
        setWalletDiamonds(snap.diamonds ?? loadDiamonds());
      }
      setUnclaimedMissionsCount(getUnclaimedMissionsCount(loadDailyMissionsState()));
      setUnclaimedEventsCount(getUnclaimedGlobalEventRewardsCount(loadGlobalEventState()));
      setEndlessBestWave(loadEndlessRecord().bestWave);
      setBossRushBestStage(loadBossRushRecord().bestStage);
    }
  }, []);

  // Initialize engine once on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(
      canvasRef.current,
      handleStateChange,
      handleStatsSync
    );
    engine.setPerformanceMode(loadPerformanceMode());
    engine.setDuelCallbacks(
      (snapshot) => {
        setDuelHud(snapshot);
      },
      (summary) => {
        setDuelVictory(summary);
      },
      () => {
        setDuelVictory(null);
      }
    );
    engineRef.current = engine;
    (window as any).__engine = engine;
    setHighestLevelUnlocked(engine.highestLevelUnlocked);
    setWalletCoins(engine.stats.coins);
    setUnlockedWeapons({ ...engine.stats.unlockedWeapons });
    setActiveWeapon(engine.stats.activeWeapon);
    setActiveCraft(engine.activeCraft);
    setUnlockedCrafts({ ...engine.unlockedCrafts });
    setUnclaimedMissionsCount(getUnclaimedMissionsCount(loadDailyMissionsState()));

    // Load initial best score
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('neon_vanguard_best');
      if (saved) setBestScore(parseInt(saved, 10) || 0);

      const invite = parseDuelInviteFromSearch(window.location.search);
      if (invite) {
        setCyberDuelInitialMode('online');
        setCyberDuelInviteCode(invite.roomCode);
        setCyberDuelInitialSpectate(invite.spectate);
        setIsCyberDuelOpen(true);
      }

      // Support ?autostart=1
      const params = new URLSearchParams(window.location.search);
      if (!invite && params.get('autostart') === '1') {
        engine.startRun();
      }
      (window as unknown as { __nabilEngine?: GameEngine }).__nabilEngine = engine;
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as unknown as { __nabilEngine?: GameEngine }).__nabilEngine;
      }
      engine.destroy();
      engineRef.current = null;
    };
  }, [handleStateChange, handleStatsSync]);

  // Keep engine informed when full-screen overlays cover the canvas to save phone battery/GPU
  useEffect(() => {
    const covered =
      currentTab !== 'home' ||
      isDailyMissionsOpen ||
      isGlobalEventsOpen ||
      isSupplyCratesOpen ||
      isLeaderboardOpen ||
      isCyberDuelOpen;
    engineRef.current?.setOverlayCoveringCanvas(covered);
  }, [
    currentTab,
    isDailyMissionsOpen,
    isGlobalEventsOpen,
    isSupplyCratesOpen,
    isLeaderboardOpen,
    isCyberDuelOpen,
  ]);

  // Global keyboard shortcut (F3 or Backtick) to toggle System Health overlay
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'F3' || e.code === 'Backquote') {
        if (e.key === 'F3') e.preventDefault();
        setSystemHealthOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Track responsive mobile/landscape/fullscreen layout state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncViewport = () => {
      const next = computeViewportLayoutState(
        window.innerWidth,
        window.innerHeight,
        detectTouchCapability(),
        isFullscreenActive()
      );
      setViewportLayout(next);
      if (!next.isPortrait) {
        setRotatePromptDismissed(false);
        setTiltHintVisible(false);
      }
      engineRef.current?.resizeCanvas();
    };

    syncViewport();
    window.addEventListener('resize', syncViewport);
    window.addEventListener('orientationchange', syncViewport);
    document.addEventListener('fullscreenchange', syncViewport);
    return () => {
      window.removeEventListener('resize', syncViewport);
      window.removeEventListener('orientationchange', syncViewport);
      document.removeEventListener('fullscreenchange', syncViewport);
    };
  }, []);

  const handleRequestLandscape = useCallback(async () => {
    const res = await requestLandscapeFullscreen();
    if (!res.orientationLocked) {
      setTiltHintVisible(true);
    }
    setViewportLayout(
      computeViewportLayoutState(
        window.innerWidth,
        window.innerHeight,
        detectTouchCapability(),
        isFullscreenActive()
      )
    );
    engineRef.current?.resizeCanvas();
  }, []);

  const handleExitFullscreen = useCallback(async () => {
    await exitLandscapeFullscreen();
    setViewportLayout(
      computeViewportLayoutState(
        window.innerWidth,
        window.innerHeight,
        detectTouchCapability(),
        isFullscreenActive()
      )
    );
    engineRef.current?.resizeCanvas();
  }, []);

  const handleChangeDifficulty = (mode: DifficultyMode) => {
    setDifficulty(mode);
    engineRef.current?.setDifficulty(mode);
  };

  const handleStartGame = (startingLevel?: number) => {
    recordDailyPlayStreak();
    if (viewportLayout.hasTouchPointer) {
      void handleRequestLandscape();
    }
    setCurrentTab('home');
    setIsDailyMissionsOpen(false);
    setIsGlobalEventsOpen(false);
    setIsSupplyCratesOpen(false);
    setIsLeaderboardOpen(false);
    setIsCyberDuelOpen(false);
    setDuelHud(null);
    setDuelVictory(null);
    engineRef.current?.startRun(startingLevel, difficulty);
    setFreeSupplyKeysCount(loadSupplyCrateState().freeKeys);
  };

  const handleStartEndless = () => {
    recordDailyPlayStreak();
    if (viewportLayout.hasTouchPointer) {
      void handleRequestLandscape();
    }
    setCurrentTab('home');
    setIsDailyMissionsOpen(false);
    setIsGlobalEventsOpen(false);
    setIsSupplyCratesOpen(false);
    setIsLeaderboardOpen(false);
    setIsCyberDuelOpen(false);
    setDuelHud(null);
    setDuelVictory(null);
    engineRef.current?.startEndlessRun(difficulty);
    setFreeSupplyKeysCount(loadSupplyCrateState().freeKeys);
  };

  const handleStartBossRush = () => {
    recordDailyPlayStreak();
    if (viewportLayout.hasTouchPointer) {
      void handleRequestLandscape();
    }
    setCurrentTab('home');
    setIsDailyMissionsOpen(false);
    setIsGlobalEventsOpen(false);
    setIsSupplyCratesOpen(false);
    setIsLeaderboardOpen(false);
    setIsCyberDuelOpen(false);
    setDuelHud(null);
    setDuelVictory(null);
    engineRef.current?.startBossRushRun(difficulty);
    setFreeSupplyKeysCount(loadSupplyCrateState().freeKeys);
  };

  const handleToggleRadar = () => {
    if (engineRef.current) {
      setRadarEnabled(engineRef.current.toggleRadar());
    }
  };

  const handleToggleTouchControls = () => {
    setTouchControlsEnabled((prev) => {
      const next = !prev;
      if (!next && engineRef.current) {
        engineRef.current.setVirtualMoveVector(0, 0);
        engineRef.current.setVirtualFiring(false);
        engineRef.current.setVirtualAimAngle(null);
      }
      return next;
    });
  };

  const handleChangePerformanceMode = (mode: PerformanceMode) => {
    setPerformanceMode(mode);
    savePerformanceMode(mode);
    engineRef.current?.setPerformanceMode(mode);
  };

  const handleCyclePerformanceMode = () => {
    const order: PerformanceMode[] = ['auto', 'mobile_turbo', 'high'];
    const idx = order.indexOf(performanceMode);
    const next = order[(idx + 1) % order.length];
    handleChangePerformanceMode(next);
  };

  const handleOpenCyberDuel = (mode: DuelModeType = 'local') => {
    setCyberDuelInitialMode(mode);
    setCyberDuelInviteCode(null);
    setCyberDuelInitialSpectate(false);
    setIsCyberDuelOpen(true);
  };

  const handleStartDuel = (
    config: DuelConfig,
    onlineClient?: DuelClient,
    initialSpectateData?: SpectateJoinedPayload
  ) => {
    recordDailyPlayStreak();
    if (viewportLayout.hasTouchPointer) {
      void handleRequestLandscape();
    }
    setCurrentTab('home');
    setIsDailyMissionsOpen(false);
    setIsLeaderboardOpen(false);
    setIsCyberDuelOpen(false);
    setCyberDuelInviteCode(null);
    setCyberDuelInitialSpectate(false);
    setDuelVictory(null);
    engineRef.current?.startDuel(config, onlineClient, initialSpectateData);
  };

  const handleChangeSpectatorCamera = (cam: DuelSpectatorCamera) => {
    engineRef.current?.setSpectatorCamera(cam);
  };

  const handleChangeDuelCameraMode = (cam: DuelCameraMode) => {
    engineRef.current?.setDuelCameraMode(cam);
  };

  const handleToggleDuelFreePointerMove = (enabled: boolean) => {
    engineRef.current?.setDuelFreePointerMove(enabled);
  };

  const handleTriggerDuelDash = () => {
    engineRef.current?.triggerDuelDash();
  };

  const handlePause = () => {
    engineRef.current?.pauseGame();
  };

  const handleResume = () => {
    engineRef.current?.resumeGame();
  };

  const handleRestart = () => {
    recordDailyPlayStreak();
    setCurrentTab('home');
    setIsDailyMissionsOpen(false);
    setIsLeaderboardOpen(false);
    setDuelVictory(null);
    engineRef.current?.restartRun();
  };

  const handleReviveWithDiamonds = (): { success: boolean; error?: string } => {
    const engine = engineRef.current;
    if (!engine) return { success: false, error: 'Engine unavailable.' };
    const res = engine.reviveWithDiamonds();
    setWalletDiamonds(res.remainingDiamonds);
    if (res.success) {
      setHudStats({ ...engine.stats });
      setRunSnapshot(null);
    } else {
      const snap = engine.getRunSnapshot();
      setRunSnapshot(snap);
    }
    return { success: res.success, error: res.error };
  };

  const handleTitle = () => {
    setCurrentTab('home');
    setIsDailyMissionsOpen(false);
    setIsLeaderboardOpen(false);
    setIsCyberDuelOpen(false);
    setDuelHud(null);
    setDuelVictory(null);
    engineRef.current?.returnToTitle();
  };

  const handleOpenMap = () => {
    if (engineRef.current) {
      setWalletCoins(engineRef.current.stats.coins);
      setHighestLevelUnlocked(engineRef.current.highestLevelUnlocked);
    }
    setCurrentTab('map');
    if (gameState !== 'title') {
      engineRef.current?.returnToTitle();
    }
  };

  const handleOpenStore = () => {
    if (engineRef.current) {
      setWalletCoins(engineRef.current.stats.coins);
      setUnlockedWeapons({ ...engineRef.current.stats.unlockedWeapons });
      setActiveWeapon(engineRef.current.stats.activeWeapon);
      setActiveCraft(engineRef.current.activeCraft);
      setUnlockedCrafts({ ...engineRef.current.unlockedCrafts });
    }
    setCurrentTab('store');
    if (gameState !== 'title') {
      engineRef.current?.returnToTitle();
    }
  };

  const handleOpenProfile = (initialTab: 'profile' | 'medals' = 'profile') => {
    if (engineRef.current) {
      setWalletCoins(engineRef.current.stats.coins);
      setHighestLevelUnlocked(engineRef.current.highestLevelUnlocked);
      setActiveCraft(engineRef.current.activeCraft);
    }
    setProfileInitialTab(initialTab);
    setCurrentTab('profile');
    if (gameState !== 'title') {
      engineRef.current?.returnToTitle();
    }
  };

  const handleBackToHome = () => {
    setCurrentTab('home');
    setUnclaimedMissionsCount(getUnclaimedMissionsCount(loadDailyMissionsState()));
    setUnclaimedEventsCount(getUnclaimedGlobalEventRewardsCount(loadGlobalEventState()));
    setFreeSupplyKeysCount(loadSupplyCrateState().freeKeys);
    setEndlessBestWave(loadEndlessRecord().bestWave);
    setBossRushBestStage(loadBossRushRecord().bestStage);
  };

  const handleSelectWeapon = (weapon: WeaponType) => {
    engineRef.current?.switchWeapon(weapon);
    if (engineRef.current) {
      setActiveWeapon(engineRef.current.stats.activeWeapon);
    }
  };

  const handleBuyWeapon = (weapon: WeaponType) => {
    if (engineRef.current) {
      const res = engineRef.current.buyStoreWeapon(weapon);
      if (res.success) {
        setWalletCoins(engineRef.current.stats.coins);
        setUnlockedWeapons({ ...engineRef.current.stats.unlockedWeapons });
        setActiveWeapon(engineRef.current.stats.activeWeapon);
        if (hudStats) setHudStats({ ...engineRef.current.stats });
        setUnclaimedMissionsCount(getUnclaimedMissionsCount(loadDailyMissionsState()));
      }
    }
  };

  const handleEquipWeapon = (weapon: WeaponType) => {
    if (engineRef.current) {
      engineRef.current.equipStoreWeapon(weapon);
      setActiveWeapon(engineRef.current.stats.activeWeapon);
      if (hudStats) setHudStats({ ...engineRef.current.stats });
    }
  };

  const handleBuyCraft = (craftId: CraftId) => {
    if (engineRef.current) {
      const res = engineRef.current.buyCraft(craftId);
      if (res.success) {
        setWalletCoins(engineRef.current.stats.coins);
        setActiveCraft(engineRef.current.activeCraft);
        setUnlockedCrafts({ ...engineRef.current.unlockedCrafts });
        if (hudStats) setHudStats({ ...engineRef.current.stats });
        setUnclaimedMissionsCount(getUnclaimedMissionsCount(loadDailyMissionsState()));
      }
    }
  };

  const handleEquipCraft = (craftId: CraftId) => {
    if (engineRef.current) {
      engineRef.current.equipCraft(craftId);
      setActiveCraft(engineRef.current.activeCraft);
      if (hudStats) setHudStats({ ...engineRef.current.stats });
    }
  };

  const handleBuyUpgrade = (id: UpgradeId) => {
    if (engineRef.current) {
      engineRef.current.buyUpgrade(id);
      setHudStats({ ...engineRef.current.stats });
    }
  };

  const handleSelectAugment = (id: CyberAugmentId) => {
    if (engineRef.current) {
      engineRef.current.selectAugment(id);
      setHudStats({ ...engineRef.current.stats });
    }
  };

  const handleRewardClaimed = (claimedCoins: number, _claimedDiamonds: number = 0) => {
    const newCoins = walletCoins + claimedCoins;
    setWalletCoins(newCoins);
    setWalletDiamonds(loadDiamonds());
    if (engineRef.current) {
      engineRef.current.stats.coins = newCoins;
      engineRef.current.stats.diamonds = loadDiamonds();
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('nabilbot_coins', String(newCoins));
    }
    setUnclaimedMissionsCount(getUnclaimedMissionsCount(loadDailyMissionsState()));
    setUnclaimedEventsCount(getUnclaimedGlobalEventRewardsCount(loadGlobalEventState()));
  };

  const handleCrateWalletUpdated = (newCoins: number, newDiamonds?: number) => {
    const latestDiamonds = typeof newDiamonds === 'number' ? newDiamonds : loadDiamonds();
    setWalletCoins(newCoins);
    setWalletDiamonds(latestDiamonds);
    if (engineRef.current) {
      engineRef.current.stats.coins = newCoins;
      engineRef.current.stats.diamonds = latestDiamonds;
      if (hudStats) setHudStats({ ...engineRef.current.stats });
    }
    setFreeSupplyKeysCount(loadSupplyCrateState().freeKeys);
  };

  const handleSkinUpdated = () => {
    if (engineRef.current) {
      engineRef.current.refreshActiveCraftSkin();
      if (hudStats) {
        setHudStats({ ...engineRef.current.stats });
      }
    }
  };

  const handleDiamondPurchase = (
    type: 'weapon' | 'craft' | 'relic' | 'companion' | 'trail',
    id: string,
    _cost: number
  ) => {
    const remainingDiamonds = loadDiamonds();
    setWalletDiamonds(remainingDiamonds);
    if (engineRef.current) {
      engineRef.current.stats.diamonds = remainingDiamonds;
      if (type === 'weapon') {
        engineRef.current.unlockDiamondWeapon(id as WeaponType);
        setUnlockedWeapons({ ...engineRef.current.stats.unlockedWeapons });
        setActiveWeapon(engineRef.current.stats.activeWeapon);
        if (hudStats) setHudStats({ ...engineRef.current.stats });
        setUnclaimedMissionsCount(getUnclaimedMissionsCount(loadDailyMissionsState()));
      } else if (type === 'craft') {
        engineRef.current.unlockDiamondCraft(id as CraftId);
        setUnlockedCrafts({ ...engineRef.current.unlockedCrafts });
        setActiveCraft(engineRef.current.activeCraft);
        if (hudStats) setHudStats({ ...engineRef.current.stats });
        setUnclaimedMissionsCount(getUnclaimedMissionsCount(loadDailyMissionsState()));
      } else if (type === 'companion' || type === 'trail' || type === 'relic') {
        engineRef.current.refreshStoreGear();
        if (hudStats) setHudStats({ ...engineRef.current.stats });
      }
    }
  };

  const handleStoreGearUpdated = () => {
    if (engineRef.current) {
      engineRef.current.refreshStoreGear();
      if (hudStats) setHudStats({ ...engineRef.current.stats });
    }
  };

  const handleStoreWalletSync = (newCoins: number, newDiamonds: number) => {
    setWalletCoins(newCoins);
    setWalletDiamonds(newDiamonds);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nabilbot_coins', String(newCoins));
    }
    if (engineRef.current) {
      engineRef.current.stats.coins = newCoins;
      engineRef.current.stats.diamonds = newDiamonds;
      if (hudStats) setHudStats({ ...engineRef.current.stats });
    }
  };

  const handleUnlockBundleWeapons = (weapons: WeaponType[]) => {
    if (engineRef.current) {
      engineRef.current.unlockStoreBundleWeapons(weapons);
      setUnlockedWeapons({ ...engineRef.current.stats.unlockedWeapons });
      if (hudStats) setHudStats({ ...engineRef.current.stats });
    }
  };

  const handleTouchMoveVector = useCallback((dx: number, dy: number) => {
    engineRef.current?.setVirtualMoveVector(dx, dy);
  }, []);

  const handleTouchSetFiring = useCallback((firing: boolean) => {
    engineRef.current?.setVirtualFiring(firing);
  }, []);

  const handleTouchAimAngle = useCallback((angle: number | null) => {
    engineRef.current?.setVirtualAimAngle(angle);
  }, []);

  const handleTouchDash = useCallback(() => {
    engineRef.current?.triggerDash();
  }, []);

  const handleTouchFinisher = useCallback(() => {
    engineRef.current?.triggerComboFinisher();
  }, []);

  const handleTouchCycleWeapon = useCallback((dir: 1 | -1) => {
    const next = engineRef.current?.cycleUnlockedWeapon(dir);
    if (next) setActiveWeapon(next);
  }, []);

  const showRotateBanner = shouldShowRotatePrompt({
    width: viewportLayout.width,
    height: viewportLayout.height,
    hasTouchPointer: viewportLayout.hasTouchPointer,
    isPlaying: gameState === 'playing',
    isDismissed: rotatePromptDismissed,
    isModalOpen:
      Boolean(hudStats?.pendingAugmentChoices && hudStats.pendingAugmentChoices.length > 0) ||
      systemHealthOpen,
  });

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-[#05060a]">
      {/* 60fps Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair z-0 touch-none"
      />

      {/* Screen Shell Overlays */}
      {gameState === 'title' && currentTab === 'home' && (
        <TitleScreen
          onStart={handleStartGame}
          onStartEndless={handleStartEndless}
          onStartBossRush={handleStartBossRush}
          onOpenCyberDuel={() => handleOpenCyberDuel('local')}
          onOpenOnlineDuel={() => handleOpenCyberDuel('online')}
          onOpenMap={handleOpenMap}
          onOpenStore={handleOpenStore}
          onOpenSupplyCrates={() => setIsSupplyCratesOpen(true)}
          onOpenProfile={() => handleOpenProfile('profile')}
          onOpenDailyMissions={() => setIsDailyMissionsOpen(true)}
          onOpenGlobalEvents={() => setIsGlobalEventsOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenAchievements={() => handleOpenProfile('medals')}
          unclaimedMissionsCount={unclaimedMissionsCount}
          unclaimedEventsCount={unclaimedEventsCount}
          freeSupplyKeysCount={freeSupplyKeysCount}
          endlessBestWave={endlessBestWave}
          bossRushBestStage={bossRushBestStage}
          bestScore={bestScore}
          highestLevelUnlocked={highestLevelUnlocked}
          coins={walletCoins}
          diamonds={walletDiamonds}
          performanceMode={performanceMode}
          onCyclePerformanceMode={handleCyclePerformanceMode}
        />
      )}

      {gameState === 'title' && currentTab === 'map' && (
        <MapScreen
          highestLevelUnlocked={highestLevelUnlocked}
          coins={walletCoins}
          diamonds={walletDiamonds}
          difficulty={difficulty}
          onChangeDifficulty={handleChangeDifficulty}
          onDeployLevel={handleStartGame}
          onNavigateHome={handleBackToHome}
          onNavigateStore={handleOpenStore}
          onNavigateProfile={() => handleOpenProfile('profile')}
        />
      )}

      {gameState === 'title' && currentTab === 'store' && (
        <StoreScreen
          coins={walletCoins}
          diamonds={walletDiamonds}
          unlockedWeapons={unlockedWeapons}
          activeWeapon={activeWeapon}
          onBuyWeapon={handleBuyWeapon}
          onEquipWeapon={handleEquipWeapon}
          activeCraft={activeCraft}
          unlockedCrafts={unlockedCrafts}
          onBuyCraft={handleBuyCraft}
          onEquipCraft={handleEquipCraft}
          onDiamondPurchase={handleDiamondPurchase}
          onSkinUpdated={handleSkinUpdated}
          onGearUpdated={handleStoreGearUpdated}
          onWalletSync={handleStoreWalletSync}
          onUnlockBundleWeapons={handleUnlockBundleWeapons}
          onBackToHome={handleBackToHome}
          onNavigateMap={handleOpenMap}
          onNavigateProfile={() => handleOpenProfile('profile')}
          onOpenSupplyCrates={() => setIsSupplyCratesOpen(true)}
          onDeployGame={() => handleStartGame()}
        />
      )}

      {gameState === 'title' && currentTab === 'profile' && (
        <ProfileScreen
          onBackToHome={handleBackToHome}
          onOpenMap={handleOpenMap}
          onOpenStore={handleOpenStore}
          onStartGame={() => handleStartGame()}
          onOpenDailyMissions={() => setIsDailyMissionsOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          unclaimedMissionsCount={unclaimedMissionsCount}
          activeCraft={activeCraft}
          coins={walletCoins}
          diamonds={walletDiamonds}
          initialTab={profileInitialTab}
        />
      )}

      {/* Daily Combat Missions Modal */}
      <DailyMissionsModal
        isOpen={isDailyMissionsOpen}
        onClose={() => {
          setIsDailyMissionsOpen(false);
          setUnclaimedMissionsCount(getUnclaimedMissionsCount(loadDailyMissionsState()));
        }}
        coins={walletCoins}
        diamonds={walletDiamonds}
        onRewardClaimed={handleRewardClaimed}
      />

      {/* Global Limited-Time 48h Rotating Event Modal */}
      <GlobalEventsModal
        isOpen={isGlobalEventsOpen}
        onClose={() => {
          setIsGlobalEventsOpen(false);
          setUnclaimedEventsCount(getUnclaimedGlobalEventRewardsCount(loadGlobalEventState()));
        }}
        coins={walletCoins}
        diamonds={walletDiamonds}
        activeCraft={activeCraft}
        unlockedCrafts={unlockedCrafts}
        onRewardClaimed={handleRewardClaimed}
        onSkinUpdated={handleSkinUpdated}
      />

      {/* Daily Cyber Supply Crates Modal */}
      <SupplyCrateModal
        isOpen={isSupplyCratesOpen}
        onClose={() => {
          setIsSupplyCratesOpen(false);
          setFreeSupplyKeysCount(loadSupplyCrateState().freeKeys);
        }}
        coins={walletCoins}
        diamonds={walletDiamonds}
        activeWeapon={activeWeapon}
        onWalletUpdated={handleCrateWalletUpdated}
      />

      {/* Global High-Score Leaderboard Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        playerScore={bestScore}
      />

      {/* 2-Minute Cyber Duel Setup / Online Room Modal */}
      <CyberDuelModal
        isOpen={isCyberDuelOpen}
        defaultDifficulty={difficulty}
        defaultP1Name={loadUserProfile().callsign}
        initialMode={cyberDuelInitialMode}
        initialRoomCode={cyberDuelInviteCode}
        initialSpectate={cyberDuelInitialSpectate}
        onClose={() => {
          setIsCyberDuelOpen(false);
          setCyberDuelInviteCode(null);
          setCyberDuelInitialSpectate(false);
        }}
        onStartDuel={handleStartDuel}
      />

      {gameState === 'playing' && duelHud ? (
        <>
          <CyberDuelHUD
            duel={duelHud}
            onPause={handlePause}
            onChangeSpectatorCamera={handleChangeSpectatorCamera}
            onChangeCameraMode={handleChangeDuelCameraMode}
            onToggleFreePointerMove={handleToggleDuelFreePointerMove}
            onSelectWeapon={handleSelectWeapon}
            onTriggerDash={handleTriggerDuelDash}
            onTriggerFinisher={() => engineRef.current?.triggerComboFinisher()}
            onDeployWall={() => engineRef.current?.triggerDuelWallDeploy()}
            onLeaveSpectate={handleTitle}
            systemHealthOpen={systemHealthOpen}
            onToggleSystemHealth={() => setSystemHealthOpen((prev) => !prev)}
            compactMobile={viewportLayout.compactMobile}
            touchControlsEnabled={touchControlsEnabled}
            isFullscreen={viewportLayout.isFullscreen}
            onRequestLandscape={() => void handleRequestLandscape()}
            onExitFullscreen={() => void handleExitFullscreen()}
          />
          {touchControlsEnabled && !duelHud.isSpectator && (
            <TouchControlsOverlay
              onMoveVector={handleTouchMoveVector}
              onSetFiring={handleTouchSetFiring}
              onAimAngle={handleTouchAimAngle}
              onDash={handleTouchDash}
              onFinisher={handleTouchFinisher}
              onDeployWall={() => engineRef.current?.triggerDuelWallDeploy()}
              wallCharges={duelHud.wallCharges ?? 2}
              maxWallCharges={duelHud.maxWallCharges ?? 2}
              wallCooldownTimer={duelHud.wallCooldownTimer ?? 0}
              onCycleWeapon={handleTouchCycleWeapon}
              activeWeapon={duelHud.activeWeapon || activeWeapon}
              weaponHeat={0}
              weaponOverheated={false}
              dashReady={(duelHud.dashCooldownTimer ?? 0) <= 0.01}
              dashOvercharged={false}
              finisherReady={Boolean(duelHud.finisherReady)}
              compactMobile={viewportLayout.compactMobile}
            />
          )}
        </>
      ) : (
        gameState === 'playing' && hudStats && (
          <>
            <GameHUD
              stats={hudStats}
              wave={currentWave}
              enemiesLeft={enemiesLeft}
              isBoss={isBoss}
              onPause={handlePause}
              onSelectWeapon={handleSelectWeapon}
              onBuyUpgrade={handleBuyUpgrade}
              onTriggerFinisher={() => engineRef.current?.triggerComboFinisher()}
              systemHealthOpen={systemHealthOpen}
              onToggleSystemHealth={() => setSystemHealthOpen((prev) => !prev)}
              radarEnabled={radarEnabled}
              onToggleRadar={handleToggleRadar}
              touchControlsEnabled={touchControlsEnabled}
              onToggleTouchControls={handleToggleTouchControls}
              performanceMode={performanceMode}
              onCyclePerformanceMode={handleCyclePerformanceMode}
              compactMobile={viewportLayout.compactMobile}
              isFullscreen={viewportLayout.isFullscreen}
              onRequestLandscape={() => void handleRequestLandscape()}
              onExitFullscreen={() => void handleExitFullscreen()}
            />
            {touchControlsEnabled && (
              <TouchControlsOverlay
                onMoveVector={handleTouchMoveVector}
                onSetFiring={handleTouchSetFiring}
                onAimAngle={handleTouchAimAngle}
                onDash={handleTouchDash}
                onFinisher={handleTouchFinisher}
                onCycleWeapon={handleTouchCycleWeapon}
                activeWeapon={hudStats.activeWeapon}
                weaponHeat={hudStats.weaponHeat ?? 0}
                weaponOverheated={Boolean(hudStats.weaponOverheated)}
                dashReady={hudStats.dashCooldownTimer <= 0.01}
                dashOvercharged={Boolean(hudStats.dashOvercharged)}
                finisherReady={Boolean(hudStats.comboFinisherReady)}
                compactMobile={viewportLayout.compactMobile}
              />
            )}
          </>
        )
      )}

      {showRotateBanner && (
        <div
          data-testid="rotate-landscape-banner"
          className="fixed top-[108px] left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#09111f]/95 border border-cyan-400/50 shadow-[0_6px_22px_rgba(0,0,0,0.65)] text-[11px] font-mono text-slate-100 max-w-[92vw]"
        >
          <RotateCw className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <span className="truncate">
            {tiltHintVisible ? 'Tilt phone sideways for horizontal view' : 'Play horizontal for wide view'}
          </span>
          <button
            type="button"
            data-testid="rotate-landscape-cta"
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              void handleRequestLandscape();
            }}
            className="px-2 py-0.5 rounded bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[10px] tracking-wide cursor-pointer shrink-0"
          >
            LANDSCAPE
          </button>
          <button
            type="button"
            data-testid="rotate-landscape-dismiss"
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              setRotatePromptDismissed(true);
            }}
            className="p-0.5 text-slate-400 hover:text-white cursor-pointer shrink-0"
            aria-label="Dismiss Landscape Hint"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {gameState === 'playing' && systemHealthOpen && (
        <SystemHealthOverlay
          getSnapshot={() => engineRef.current?.getSystemHealthSnapshot() ?? null}
          onClearEffects={() => engineRef.current?.clearTransientEffects()}
          onClose={() => setSystemHealthOpen(false)}
        />
      )}

      {gameState === 'playing' &&
        hudStats?.pendingAugmentChoices &&
        hudStats.pendingAugmentChoices.length > 0 && (
          <CyberAugmentModal
            choices={hudStats.pendingAugmentChoices}
            wave={currentWave}
            level={hudStats.level}
            draftReason={hudStats.augmentDraftReason}
            clearedLevel={hudStats.augmentClearedLevel}
            onSelect={handleSelectAugment}
          />
        )}

      {gameState === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onTitle={handleTitle}
          performanceMode={performanceMode}
          onChangePerformanceMode={handleChangePerformanceMode}
        />
      )}

      {gameState === 'gameover' && runSnapshot && (
        <GameOverModal
          snapshot={runSnapshot}
          onReviveWithDiamonds={handleReviveWithDiamonds}
          onRestart={handleRestart}
          onTitle={handleTitle}
          onOpenStore={handleOpenStore}
          onOpenMap={handleOpenMap}
          onOpenProfile={() => handleOpenProfile('profile')}
        />
      )}

      {gameState === 'victory' && runSnapshot && (
        <VictoryModal
          snapshot={runSnapshot}
          onRestart={handleRestart}
          onTitle={handleTitle}
          onOpenStore={handleOpenStore}
          onOpenMap={handleOpenMap}
          onOpenProfile={() => handleOpenProfile('profile')}
        />
      )}

      {gameState === 'duel_victory' && duelVictory && (
        <DuelVictoryModal
          summary={duelVictory}
          isSpectator={Boolean(duelHud?.isSpectator)}
          onRematch={handleRestart}
          onTitle={handleTitle}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}
