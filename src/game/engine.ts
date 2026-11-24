import {
  Enemy,
  EnemyType,
  FloatingText,
  GameState,
  Particle,
  Pickup,
  PlayerStats,
  Projectile,
  RunSnapshot,
  WeaponType,
  CraftId,
  SpawnPatternType,
  DamageCategory,
  DamageStyle,
  DifficultyMode,
  WeaponThermalState,
  CyberAugmentId,
  CyberAugmentChoice,
  CraftSkinId,
  ArenaBarrel,
  PreRunBoosterId,
  ActiveBountyContract,
  StoreGearState,
} from './types';
import {
  COMPANION_DRONES,
  THRUSTER_TRAILS,
  computeStoreGearModifiers,
  loadStoreGearState,
} from './storeCatalog';
import {
  BOSS_RUSH_TITANS,
  computeBossRushStageRewards,
  createBountyContractState,
  getBossRushStageDef,
  loadBossRushRecord,
  projectToRadar,
  recordBossRushMilestone,
  resolveBountyCompletion,
  stepBountyContract,
} from './bountyAndBossRush';
import {
  computeEndlessWaveConfig,
  computeEndlessWaveClearReward,
  loadEndlessRecord,
  recordEndlessMilestone,
} from './endless';
import {
  applyBarrelDamage,
  computeBarrelExplosionOutcome,
  createArenaBarrel,
} from './arenaObjects';
import { consumeArmedBoostersForRun } from './supplyCrate';
import {
  AugmentModifiers,
  CYBER_AUGMENTS,
  GoldenDataCore,
  MultiKillState,
  OVERDRIVE_DURATION_SEC,
  OVERDRIVE_FIRE_RATE_MULT,
  applyAugmentSelection,
  computeAugmentModifiers,
  computeGoldenCoreJackpot,
  computeWingmanOrbitPosition,
  createEmptyAugments,
  createGoldenDataCore,
  createInitialMultiKillState,
  rollAugmentDraftChoices,
  selectWingmanTarget,
  stepGoldenDataCore,
  stepMultiKillStreak,
} from './augments';
import { WEAPONS, WEAPON_ORDER } from './weapons';
import {
  checkCircleCollision,
  checkShieldBlock,
  getComboMultiplier,
  calculateKillScore,
  calculateWaveBudget,
  calculateEnemyStats,
  selectEnemyArchetype,
  applyDamageToPlayer,
  getEnemyBasePoints,
  getEnemyBudgetCost,
  UPGRADES,
  purchaseUpgrade,
  UpgradeId,
  purchaseWeapon,
  calculateLevelCoinBonus,
  calculateEnemyCoinDrop,
  getWeaponPrice,
  selectSpawnPattern,
  generateSpawnPositions,
  getPatternTacticalLabel,
  calculateTrajectoryAvoidanceForce,
  calculateProjectileDodgeForce,
  getDamageColor,
  mapWeaponToDamageCategory,
  loadDifficultyMode,
  saveDifficultyMode,
  getDifficultyModifier,
  getRegionAtmosphereTheme,
  COMBO_FINISHER_THRESHOLD,
  COMBO_FINISHER_RADIUS,
  COMBO_FINISHER_TRAUMA,
  advanceComboFinisherState,
  canActivateComboFinisher,
  computeComboFinisherExplosion,
  BASE_DASH_COOLDOWN_SECONDS,
  computeDashCooldown,
  MAX_DIAMOND_REVIVES_PER_RUN,
  getDiamondReviveCost,
  canPurchaseDiamondRevive,
  createInitialWeaponThermalState,
  applyWeaponShotHeat,
  stepWeaponThermalState,
  CyberStormState,
  createInitialCyberStormState,
  generateCyberStormZones,
  generateLightningBolt,
  stepCyberStormState,
  computeWindZoneMovementEffect,
  DASH_OVERCHARGE_DURATION_SEC,
  DASH_OVERCHARGE_INVULN_SEC,
  DASH_OVERCHARGE_RANGE_MULT,
  detectPerfectDashThreat,
  computeDashMotionParams,
  stepDashOverchargeState,
  getWeaponFireShakeTrauma,
  getBossAttackShakeTrauma,
  getCameraShakeProfile,
  computeCameraShakeSample,
  getOptimalCanvasDpr,
  PerformanceMode,
  loadPerformanceMode,
  shouldThrottleCanvasRender,
  ViewportCullBounds,
  computeViewportCullBounds,
  isInViewportBounds,
  SystemHealthSnapshot,
  computeSystemHealthSnapshot,
  AdaptiveQualityState,
  computeAdaptiveQualityState,
  computeShieldBreakerBarrierHp,
  isBarrierBypassWeapon,
  resolveShieldBreakerImpact,
  getNextUnlockedWeapon,
  PendingCombatProgressBuffer,
  createPendingCombatProgressBuffer,
  accumulatePendingKillProgress,
  accumulatePendingCoinProgress,
  computeMultiKillFrameFxBudget,
  wrapAngleSafe,
  computeSafePullDelta,
  collectChainDetonatedBarrels,
} from './rules';
import {
  WeaponMasteryMap,
  loadWeaponMastery,
  saveWeaponMastery,
  awardWeaponMasteryXp,
  getMasteryTierForXp,
  formatMasteryPerksSummary,
} from './mastery';
import { soundEngine } from './audio';
import { LEVELS, getLevelDef, LevelDef } from './levels';
import { recordBattleResult } from './profile';
import {
  CRAFTS,
  CRAFT_ORDER,
  getCraftDef,
  loadActiveCraft,
  saveActiveCraft,
  loadUnlockedCrafts,
  saveUnlockedCrafts,
  purchaseCraft,
} from './crafts';
import { recordMissionProgress } from './missions';
import {
  NEON_CRAFT_SKINS,
  getActiveCraftSkin,
  recordGlobalEventProgress,
} from './globalEvents';
import type { GlobalEventObjectiveType } from './types';
import { recordAchievementEvent } from './achievements';
import { loadDiamonds, addDiamonds, spendDiamonds, loadDiamondRelics, type DiamondRelics } from './diamonds';
import {
  ALL_DUEL_SLOTS,
  type DuelConfig,
  type DuelHudSnapshot,
  type DuelMatchFormat,
  type DuelPlayerScore,
  type DuelSlotId,
  type DuelCameraMode,
  type DuelSpectatorCamera,
  type DuelVictorySummary,
  type DuelCompetitiveSpawn,
  type DuelKillFeedEvent,
  type DuelEventTracker,
  canDamageDuelTarget,
  computePvpProjectileDamage,
  applyPvpDamageToPool,
  PVP_SHIELD_RECHARGE_DELAY_SECONDS,
  PVP_SHIELD_RECHARGE_RATE_PER_SECOND,
  PVP_RESPAWN_DURATION_SECONDS,
  computeDuelTeamScores,
  createInitialDuelPlayerScore,
  createDuelEventTracker,
  evaluateDuelMajorEvents,
  generateCompetitiveDuelSpawns,
  computeDuelKillReward,
  computeDuelPvpTakedownReward,
  computeDuelVictorySummary,
  advanceCyberMomentumOnKill,
  stepCyberMomentumTimer,
  getCyberMomentumSpeedMultiplier,
  resetCyberMomentum,
  isPurePvpFormat,
} from './duel';
import {
  CYBER_FOREST_BACKDROP_SRC,
  buildArenaObstacles,
  checkProjectileObstacleHit,
  getSafeArenaSpawnPoint,
  resolveCircleObstacleCollisions,
  type ArenaMapTheme,
  type ArenaObstacle,
} from './arenaObstacles';
import {
  TACTICAL_WALL_IMAGE_SRC,
  TACTICAL_WALL_MAX_ACTIVE_PER_PLAYER,
  applyDamageToTacticalWall,
  computeWallPlacement,
  consumeTacticalWallCharge,
  createInitialTacticalWallChargeState,
  createTacticalWall,
  enforceOwnerWallCap,
  findProjectileTacticalWallHit,
  resolveCircleTacticalWallCollisions,
  stepTacticalWallChargeState,
  stepTacticalWalls,
  type DuelTacticalWall,
  type TacticalWallChargeSlotState,
} from './duelWalls';
import {
  DuelClient,
  type RemotePlayerTelemetry,
  type RemoteProjectilePayload,
  type SpectateJoinedPayload,
} from './duelClient';
import { computeViewportCameraScale } from './orientation';

const ARENA_WIDTH = 2200;
const ARENA_HEIGHT = 1600;
const MAX_PARTICLES = 320;
const MAX_FLOATING_TEXTS = 45;

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private destroyed = false;
  private lastTime: number = 0;
  private currentDpr = 1;

  private writeStorageSafe(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage quota / private-browsing exceptions so gameplay never freezes
    }
  }

  // Level Progression System & Backgrounds
  public currentLevel = 1;
  public highestLevelUnlocked = 1;
  public difficulty: DifficultyMode = loadDifficultyMode();
  private levelImages = new Map<number, HTMLImageElement>();
  private levelImageSources = new Map<string, HTMLImageElement>();
  private cyberForestImage: HTMLImageElement | null = null;
  private tacticalWallImage: HTMLImageElement | null = null;
  private prevLevelImage: HTMLImageElement | null = null;
  private levelTransitionTimer = 0;
  private tookDamageInSector = false;

  // Offscreen Render Caches & Viewport Culling
  private arenaFloorCache: HTMLCanvasElement | null = null;
  private arenaFloorCacheKey = '';
  private vignetteCache: HTMLCanvasElement | null = null;
  private vignetteCacheW = 0;
  private vignetteCacheH = 0;
  private nebulaSpritePrimary: HTMLCanvasElement | null = null;
  private nebulaSpriteSecondary: HTMLCanvasElement | null = null;
  private nebulaSpriteRegion = '';
  private currentViewBounds: ViewportCullBounds = {
    minX: -200,
    maxX: ARENA_WIDTH + 200,
    minY: -200,
    maxY: ARENA_HEIGHT + 200,
  };

  // State
  public state: GameState = 'title';
  private onStateChange: (state: GameState) => void;
  private onStatsSync: (stats: PlayerStats, wave: number, enemiesLeft: number, isBoss: boolean) => void;
  private onDuelSync?: (snapshot: DuelHudSnapshot) => void;
  private onDuelVictory?: (summary: DuelVictorySummary) => void;
  private onDuelRematch?: () => void;

  // Player & Input
  public player = {
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT / 2,
    vx: 0,
    vy: 0,
    radius: 18,
    angle: 0,
    targetX: ARENA_WIDTH / 2,
    targetY: ARENA_HEIGHT / 2,
    targetAngle: 0,
    scaleX: 1,
    scaleY: 1,
    isDashing: false,
    invulnerableTimer: 0,
  };

  // Cyber Duel (Local / Online PvPvE & Pure PvP Solo/Team) State
  public isDuelMode = false;
  public duelConfig: DuelConfig | null = null;
  public duelMatchFormat: DuelMatchFormat = 'pvpve_1v1';
  public duelMapTheme: ArenaMapTheme = 'sector';
  public duelObstacles: ArenaObstacle[] = [];
  public duelTacticalWalls: DuelTacticalWall[] = [];
  private duelWallSeq = 1;
  private duelWallChargeBySlot = new Map<DuelSlotId, TacticalWallChargeSlotState>();
  public duelTimeRemaining = 0;
  public duelElapsedTime = 0;
  public duelP1Score: DuelPlayerScore | null = null;
  public duelP2Score: DuelPlayerScore | null = null;
  private duelRoster = new Map<DuelSlotId, DuelPlayerScore>();
  private duelExtraActors = new Map<
    DuelSlotId,
    {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      angle: number;
      targetX: number;
      targetY: number;
      targetAngle: number;
      scaleX: number;
      scaleY: number;
      isDashing: boolean;
      invulnerableTimer: number;
      activeWeapon: WeaponType;
      activeCraft: CraftId;
      dashCooldownTimer: number;
      dashTimer: number;
      fireCooldownTimer: number;
      shieldCooldownTimer: number;
      comboTimer: number;
      trail: { x: number; y: number; angle: number; life: number; maxLife: number }[];
    }
  >();
  public duelClient: DuelClient | null = null;
  private duelSpawnTimer = 0;
  private duelWaveCounter = 1;
  private duelSpawnSeq = 1;
  private duelStateSyncTimer = 0;
  private duelHudSyncTimer = 0;
  private duelSpawnedIds = new Set<string>();
  private duelP1Trail: { x: number; y: number; angle: number; life: number; maxLife: number }[] = [];
  private duelP2Trail: { x: number; y: number; angle: number; life: number; maxLife: number }[] = [];
  private duelSpectatorCount = 0;
  public duelSpectatorCamera: DuelSpectatorCamera = 'both';
  public duelCameraMode: DuelCameraMode = 'both';
  public duelFreePointerMove = true;
  private duelKillFeed: DuelKillFeedEvent[] = [];
  private duelEventTracker: DuelEventTracker = createDuelEventTracker();
  public cameraScale = 1;

  public player2 = {
    x: ARENA_WIDTH * 0.65,
    y: ARENA_HEIGHT / 2,
    vx: 0,
    vy: 0,
    radius: 18,
    angle: Math.PI,
    scaleX: 1,
    scaleY: 1,
    isDashing: false,
    invulnerableTimer: 0,
    activeWeapon: 'pulse' as WeaponType,
    activeCraft: 'phantom_shadow' as CraftId,
    dashCooldownTimer: 0,
    dashTimer: 0,
    fireCooldownTimer: 0,
    shieldCooldownTimer: 0,
    comboTimer: 0,
    targetX: ARENA_WIDTH * 0.65,
    targetY: ARENA_HEIGHT / 2,
    targetAngle: Math.PI,
  };

  public activeCraft: CraftId = 'vanguard_alpha';
  public activeCraftSkin: CraftSkinId = 'default';
  public unlockedCrafts: Record<CraftId, boolean> = Object.fromEntries(
    CRAFT_ORDER.map((id) => [id, id === 'vanguard_alpha'])
  ) as Record<CraftId, boolean>;

  public stats: PlayerStats = {
    maxHp: 10,
    currentHp: 10,
    maxShield: 150, // Rebalanced protective shield
    currentShield: 150,
    shieldRechargeRate: 30, // Tactical shield restoration rate
    shieldRechargeDelay: 1.4, // Punishing 1.4s recharge trigger requiring evasive maneuvers
    shieldCooldownTimer: 0,
    speed: 360, // Ultra-responsive, agile kiting speed
    dashCooldown: BASE_DASH_COOLDOWN_SECONDS, // 1.5s tactical dash recharge
    dashCooldownTimer: 0,
    dashDuration: 0.22,
    dashTimer: 0,
    dashOvercharged: false,
    dashOverchargeTimer: 0,
    dashOverchargeDuration: DASH_OVERCHARGE_DURATION_SEC,
    dashRangeMultiplier: 1.0,
    scrap: 0,
    coins: 500, // Generous starting cyber credits for early store shopping
    coinsEarnedThisRun: 0,
    score: 0,
    comboStreak: 0,
    comboCount: 0,
    comboMultiplier: 1.0,
    comboTimer: 0,
    highestCombo: 0,
    maxCombo: 0,
    comboFinisherCharge: 0,
    comboFinisherReady: false,
    kills: 0,
    activeWeapon: 'pulse',
    activeCraft: 'vanguard_alpha',
    activeCraftSkin: 'default',
    unlockedCrafts: Object.fromEntries(
      CRAFT_ORDER.map((id) => [id, id === 'vanguard_alpha'])
    ) as Record<CraftId, boolean>,
    unlockedWeapons: Object.fromEntries(
      WEAPON_ORDER.map((id) => [id, id === 'pulse'])
    ) as Record<WeaponType, boolean>,
    goldenCoresDestroyed: 0,
    isBossRush: false,
    bossRushStage: 1,
    bossRushTotalStages: BOSS_RUSH_TITANS.length,
    bossRushBestStage: loadBossRushRecord().bestStage,
    bossRushBossName: '',
    activeBounty: null,
    radarEnabled: false,
    level: 1,
    levelKills: 0,
    levelQuota: 5,
    levelName: 'DHAKA CYBER CORE',
    difficulty: loadDifficultyMode(),
    upgrades: {
      maxHealthLvl: 0,
      shieldLvl: 0,
      damageLvl: 0,
      fireRateLvl: 0,
      dashLvl: 0,
    },
  };

  public applyCraftModifiers() {
    const craft = getCraftDef(this.activeCraft);
    const gearMods = this.cachedStoreGearMods;
    const boosterSpeedBonus = this.activeBoosters.includes('turbo_thrusters') ? 0.15 : 0;
    const boosterDashMult = this.activeBoosters.includes('turbo_thrusters') ? 0.8 : 1.0;
    this.stats.activeCraft = this.activeCraft;
    this.stats.unlockedCrafts = { ...this.unlockedCrafts };
    this.stats.maxHp = 12 + gearMods.maxHpBonus + this.stats.upgrades.maxHealthLvl;
    this.stats.currentHp = Math.min(this.stats.maxHp, Math.max(this.stats.currentHp, this.stats.maxHp));
    this.stats.speed = Math.round(360 * (craft.speedMultiplier + gearMods.speedBonus + boosterSpeedBonus));
    const boosterShieldBonus = this.activeBoosters.includes('shield_overcharge') ? 60 : 0;
    this.stats.maxShield =
      150 +
      craft.shieldBonus +
      gearMods.maxShieldBonus +
      boosterShieldBonus +
      this.stats.upgrades.shieldLvl * 40;
    this.stats.currentShield = Math.min(this.stats.maxShield, Math.max(this.stats.currentShield, this.stats.maxShield));
    this.stats.shieldRechargeRate = 40 + craft.statModifiers.shieldRechargeBonus + gearMods.shieldRechargeBonus;
    this.stats.shieldRechargeDelay = Math.max(0.55, Number((1.4 * gearMods.shieldDelayMultiplier).toFixed(2)));
    this.stats.dashCooldown = computeDashCooldown(
      craft.dashCooldownMultiplier * gearMods.dashCdMultiplier * boosterDashMult,
      this.stats.upgrades.dashLvl
    );
  }

  // Camera & Screen Shake
  public camera = {
    x: ARENA_WIDTH / 2,
    y: ARENA_HEIGHT / 2,
    trauma: 0, // 0..1
    shakeOffsetX: 0,
    shakeOffsetY: 0,
    shakeAngle: 0,
    recoilX: 0,
    recoilY: 0,
    glitchAlpha: 0,
  };

  // Per-frame multi-kill counter (prevents synchronous particle/strokeText spikes)
  private killsThisFrame = 0;

  // Input hub
  private heldKeys = new Set<string>();
  private heldCodes = new Set<string>();
  private justPressedKeys = new Set<string>();
  private mouse = {
    clientX: 0,
    clientY: 0,
    worldX: ARENA_WIDTH / 2,
    worldY: ARENA_HEIGHT / 2,
    isDown: false,
    hasMoved: false,
  };
  private fireCooldownTimer = 0;
  private dashBufferTimer = 0;
  private p2DashBufferTimer = 0;

  // Entities
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private pickups: Pickup[] = [];
  private floatingTexts: FloatingText[] = [];
  private finisherShockwaves: Array<{
    x: number;
    y: number;
    maxRadius: number;
    life: number;
    maxLife: number;
    color: string;
    secondaryColor: string;
  }> = [];
  private isResolvingFinisher = false;
  private finisherChargeProgress = 0;
  private nextId = 1;

  // Particles pool
  private particles: Particle[] = [];
  private particlePoolIndex = 0;

  // Pre-allocated zero-GC parallax backdrop entities
  private bgStars: Array<{
    x: number;
    y: number;
    depth: number;
    size: number;
    phase: number;
    speedX: number;
    speedY: number;
  }> = [];
  private bgStreamers: Array<{
    x: number;
    y: number;
    length: number;
    speed: number;
    depth: number;
    phase: number;
  }> = [];

  // Wave system
  public currentWave = 1;
  private waveBudgetRemaining = 0;
  private waveSpawnTimer = 0;
  private waveClearDelay = 0;
  private bossActive = false;
  private totalEnemiesInWave = 0;
  private enemiesSpawnedThisWave = 0;

  // Wave-Scaled Tactical Spawn Queue & Pattern System
  private spawnSquadQueue: Array<{
    type: EnemyType;
    x: number;
    y: number;
    role?: string;
    pattern: SpawnPatternType;
  }> = [];
  private lastAnnouncedPattern: string | null = null;

  // Run tracking
  private runStartTime = 0;
  private totalRunTime = 0;
  private bestScore = 0;
  public revivesUsedThisRun = 0;

  // Weapon Heat / Overheat, Weapon Mastery & Procedural Cyber-Storm
  public weaponThermals: Record<WeaponType, WeaponThermalState> = this.createThermalMap();
  public weaponMastery: WeaponMasteryMap = loadWeaponMastery();
  public cyberStorm: CyberStormState = createInitialCyberStormState();
  private cyberStormSpeedMult = 1.0;
  private cyberStormInWindZone = false;
  private cyberStormWindLabel = '';
  private overheatWarnCooldown = 0;
  private masteryDirty = false;
  private masterySaveTimer = 0;
  private coinsDirty = false;
  private coinsSaveTimer = 0;
  private cachedDiamondRelics: DiamondRelics = loadDiamondRelics();
  public dashOverchargeTimer = 0;
  private isCurrentDashOvercharged = false;

  // Cyber-Chip Augments, Wingman Drones, Golden Data-Cores, Multi-Kill Streak & Overdrive
  public activeAugments: Partial<Record<CyberAugmentId, number>> = createEmptyAugments();
  public pendingAugmentChoices: CyberAugmentChoice[] | null = null;
  private augmentDraftReason: 'level_clear' | 'wave_clear' | 'headstart' | null = null;
  private augmentClearedLevel: number | null = null;
  private augmentOpenedAtMs = 0;
  private vampiricKillCounter = 0;
  private wingmanFireTimers: number[] = [0, 0.16, 0.32];
  private cryoTickTimer = 0;
  private overdriveTimer = 0;
  private multiKillState: MultiKillState = createInitialMultiKillState();
  public goldenCores: GoldenDataCore[] = [];
  private goldenCoreSpawnTimer = 14;
  private goldenCoresDestroyed = 0;
  private electricArcs: Array<{
    points: Array<{ x: number; y: number }>;
    color: string;
    life: number;
    maxLife: number;
  }> = [];

  // Endless Overdrive, Tactical Arena Barrels & Pre-Run Supply Boosters
  public isEndlessMode = false;
  private endlessBestWave = loadEndlessRecord().bestWave;
  private endlessBossesPending = 0;
  public arenaBarrels: ArenaBarrel[] = [];
  private barrelRespawnTimer = 12;
  private barrelsDetonated = 0;
  public activeBoosters: PreRunBoosterId[] = [];

  // Boss Rush Championship, Live HVT Bounty Contracts, Radar Minimap & Virtual Touch Controls
  public isBossRushMode = false;
  private bossRushStage = 1;
  private readonly bossRushTotalStages = BOSS_RUSH_TITANS.length;
  private bossRushBestStage = loadBossRushRecord().bestStage;
  private bossRushBossName = '';
  public activeBounty: ActiveBountyContract | null = null;
  private bountySpawnTimer = 16;
  private bountyDiamondsEarnedThisRun = 0;
  public radarEnabled = false;
  private virtualMoveX = 0;
  private virtualMoveY = 0;
  private virtualFiring = false;
  private virtualAimAngle: number | null = null;
  private activeCanvasTouchId: number | null = null;
  private lastTouchInputAt = 0;
  private shieldBreakerSpawnedThisWave = false;
  public storeGear: StoreGearState = loadStoreGearState();
  private companionFireTimer = 0.2;
  private companionShieldTimer = 0;
  private moduleVampiricKills = 0;
  private trailEmitTimer = 0;

  // Real-time System Health telemetry (sampled every 0.5s with zero per-frame allocations)
  private perfFrameCount = 0;
  private perfAccumSec = 0;
  private perfWorkMsAccum = 0;
  private perfFrameDrops = 0;
  private perfLastFps = 60;
  private perfLastAvgFrameMs = 16.7;
  private perfLastWorkMs = 2.0;
  private perfLastFrameDrops = 0;
  private perfFrameSeq = 0;
  private enemyProjScratch: Projectile[] = [];
  private performanceMode: PerformanceMode = loadPerformanceMode();
  private isMobileDevice = false;
  private overlayCoveringCanvas = false;
  private lastThrottledRenderAt = 0;
  private frameNowMs = 0;
  private traumaBurstCooldownUntil = 0;
  private cachedAugMods: AugmentModifiers = computeAugmentModifiers(createEmptyAugments());
  private cachedStoreGearMods = computeStoreGearModifiers(this.storeGear, this.cachedDiamondRelics);
  private pendingProgress: PendingCombatProgressBuffer = createPendingCombatProgressBuffer();
  private progressFlushTimer = 0;
  private adaptiveQuality: AdaptiveQualityState = {
    tier: 'high',
    effectiveDpr: 1.5,
    maxParticlesCap: MAX_PARTICLES,
    drawProjectileTrails: true,
    drawSecondaryGlows: true,
    maxFloatingTexts: 36,
    simplifyPickups: false,
    skipAtmosphericOverlay: false,
  };
  private adaptiveLowPerfStreak = 0;

  private createThermalMap(): Record<WeaponType, WeaponThermalState> {
    const map = {} as Record<WeaponType, WeaponThermalState>;
    for (const wId of WEAPON_ORDER) {
      map[wId] = createInitialWeaponThermalState();
    }
    return map;
  }

  constructor(
    canvas: HTMLCanvasElement,
    onStateChange: (state: GameState) => void,
    onStatsSync: (stats: PlayerStats, wave: number, enemiesLeft: number, isBoss: boolean) => void
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not acquire 2d context');
    this.ctx = context;
    this.onStateChange = onStateChange;
    this.onStatsSync = onStatsSync;

    // Load best score, unlocked level, coins & armory from storage
    if (typeof window !== 'undefined') {
      const savedBest = localStorage.getItem('neon_vanguard_best');
      if (savedBest) this.bestScore = parseInt(savedBest, 10) || 0;

      const savedLvl = localStorage.getItem('nabilbot_unlocked_level');
      if (savedLvl) this.highestLevelUnlocked = Math.max(1, Math.min(LEVELS.length, parseInt(savedLvl, 10) || 1));

      const savedCoins = localStorage.getItem('nabilbot_coins');
      if (savedCoins !== null) {
        this.stats.coins = parseInt(savedCoins, 10) || 0;
      } else {
        // Welcome starter gift: 500 cyber credits
        this.stats.coins = 500;
        localStorage.setItem('nabilbot_coins', '500');
      }

      const savedWeapons = localStorage.getItem('nabilbot_unlocked_weapons');
      if (savedWeapons) {
        try {
          const parsed = JSON.parse(savedWeapons);
          this.stats.unlockedWeapons = Object.fromEntries(
            WEAPON_ORDER.map((wId) => [wId, wId === 'pulse' ? true : !!parsed[wId]])
          ) as Record<WeaponType, boolean>;
        } catch {
          // ignore parse error
        }
      }

      const savedActiveWep = localStorage.getItem('nabilbot_active_weapon') as WeaponType;
      if (savedActiveWep && this.stats.unlockedWeapons[savedActiveWep]) {
        this.stats.activeWeapon = savedActiveWep;
      }

      this.activeCraft = loadActiveCraft();
      this.unlockedCrafts = loadUnlockedCrafts();
      this.activeCraftSkin = getActiveCraftSkin(this.activeCraft);
      this.stats.activeCraftSkin = this.activeCraftSkin;
      this.applyCraftModifiers();
    }

    // Deduplicate & preload level background images by URL (prevents 40 simultaneous image decodes)
    for (const lvl of LEVELS) {
      let img = this.levelImageSources.get(lvl.imageSrc);
      if (!img) {
        img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          // Invalidate arena floor cache once image finishes decoding
          this.arenaFloorCacheKey = '';
        };
        img.src = lvl.imageSrc;
        this.levelImageSources.set(lvl.imageSrc, img);
      }
      this.levelImages.set(lvl.level, img);
    }

    // Preload Crystal Conduit Ruins tactical arena image & Cyber Shield Wall art attached by user
    if (typeof Image !== 'undefined') {
      const forestImg = new Image();
      forestImg.decoding = 'async';
      forestImg.onload = () => {
        this.arenaFloorCacheKey = '';
      };
      forestImg.src = CYBER_FOREST_BACKDROP_SRC;
      this.cyberForestImage = forestImg;

      const wallImg = new Image();
      wallImg.decoding = 'async';
      wallImg.src = TACTICAL_WALL_IMAGE_SRC;
      this.tacticalWallImage = wallImg;
    }

    // Initialize particle pool
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 2,
        maxSize: 2,
        life: 0,
        maxLife: 1,
        color: '#ffffff',
        alpha: 1,
        type: 'spark',
      });
    }

    // Pre-allocate zero-GC parallax starfield & atmospheric motes
    for (let i = 0; i < 90; i++) {
      this.bgStars.push({
        x: ((i * 293) % 2400),
        y: ((i * 419) % 1800),
        depth: 0.12 + (i % 4) * 0.14,
        size: 1.1 + (i % 3) * 0.9,
        phase: i * 0.71,
        speedX: ((i % 5) - 2) * 8,
        speedY: 10 + (i % 4) * 9,
      });
    }

    // Pre-allocate zero-GC cyber energy streamers / rain streaks
    for (let i = 0; i < 20; i++) {
      this.bgStreamers.push({
        x: ((i * 347) % 2400),
        y: ((i * 521) % 1800),
        length: 45 + (i % 4) * 28,
        speed: 190 + (i % 5) * 55,
        depth: 0.28 + (i % 3) * 0.18,
        phase: i * 1.13,
      });
    }

    this.setupListeners();
    this.updateDeviceProfile();
    this.applyPerformanceProfile(true);
    this.resizeCanvas();
    this.startLoop();
  }

  private updateDeviceProfile() {
    if (typeof window === 'undefined') {
      this.isMobileDevice = false;
      return;
    }
    this.isMobileDevice =
      window.innerWidth <= 920 ||
      window.innerHeight <= 540 ||
      (window.matchMedia?.('(pointer: coarse)').matches ?? false);
  }

  private applyPerformanceProfile(forceReset: boolean = false) {
    this.updateDeviceProfile();
    const baseDpr = getOptimalCanvasDpr(
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      this.isMobileDevice,
      this.performanceMode
    );
    const quality = computeAdaptiveQualityState({
      fps: this.perfLastFps,
      workMs: this.perfLastWorkMs,
      baseDpr,
      activeProjectiles: this.projectiles.length,
      isMobile: this.isMobileDevice,
      mode: this.performanceMode,
    });
    if (forceReset || this.performanceMode !== 'auto') {
      this.adaptiveQuality = quality;
    }
  }

  public setPerformanceMode(mode: PerformanceMode) {
    this.performanceMode = mode;
    this.adaptiveLowPerfStreak = 0;
    this.applyPerformanceProfile(true);
    this.resizeCanvas();
  }

  public getPerformanceMode(): PerformanceMode {
    return this.performanceMode;
  }

  public setOverlayCoveringCanvas(covered: boolean) {
    this.overlayCoveringCanvas = covered;
    if (!covered) {
      this.lastThrottledRenderAt = 0;
    }
  }

  private handleResize = () => {
    this.updateDeviceProfile();
    this.resizeCanvas();
  };

  public resizeCanvas() {
    this.updateDeviceProfile();
    const baseDpr = getOptimalCanvasDpr(
      window.devicePixelRatio || 1,
      this.isMobileDevice,
      this.performanceMode
    );
    const dpr = Math.min(baseDpr, this.adaptiveQuality.effectiveDpr || baseDpr);
    this.currentDpr = dpr;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || window.innerWidth;
    const h = rect.height || window.innerHeight;
    const nextW = Math.max(1, Math.floor(w * dpr));
    const nextH = Math.max(1, Math.floor(h * dpr));
    if (this.canvas.width !== nextW || this.canvas.height !== nextH) {
      this.canvas.width = nextW;
      this.canvas.height = nextH;
    }
  }

  private getTargetBaseCameraScale(): number {
    if (typeof window === 'undefined') return 1.0;
    const dpr = this.currentDpr || 1;
    const viewW = this.canvas.width > 0 ? this.canvas.width / dpr : window.innerWidth;
    const viewH = this.canvas.height > 0 ? this.canvas.height / dpr : window.innerHeight;
    return computeViewportCameraScale(viewW, viewH);
  }

  private setupListeners() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('visibilitychange', this.handleVisibility);

    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
    this.canvas.addEventListener('touchcancel', this.handleTouchEnd);

    // Window resize
    window.addEventListener('resize', this.handleResize);
  }

  public destroy() {
    this.destroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.flushPendingPersistence();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    this.canvas.removeEventListener('touchcancel', this.handleTouchEnd);
    window.removeEventListener('resize', this.handleResize);
  }

  private handleTouchStart = (e: TouchEvent) => {
    if (e.changedTouches.length > 0) {
      e.preventDefault();
      this.lastTouchInputAt = performance.now();
      if (this.activeCanvasTouchId === null) {
        const touch = e.changedTouches[0];
        this.activeCanvasTouchId = touch.identifier;
        this.mouse.clientX = touch.clientX;
        this.mouse.clientY = touch.clientY;
        this.mouse.isDown = true;
        this.mouse.hasMoved = true;
        this.updateMouseWorldPos();
      }
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      e.preventDefault();
      this.lastTouchInputAt = performance.now();
      const touch =
        Array.from(e.touches).find((t) => t.identifier === this.activeCanvasTouchId) ??
        e.touches[0];
      this.mouse.clientX = touch.clientX;
      this.mouse.clientY = touch.clientY;
      this.mouse.hasMoved = true;
      this.updateMouseWorldPos();
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    this.lastTouchInputAt = performance.now();
    if (this.activeCanvasTouchId !== null) {
      const ended = Array.from(e.changedTouches).some(
        (t) => t.identifier === this.activeCanvasTouchId
      );
      if (ended) {
        this.activeCanvasTouchId = null;
        this.mouse.isDown = false;
      }
    } else if (e.touches.length === 0) {
      this.mouse.isDown = false;
    }
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    this.heldKeys.add(key);
    this.heldCodes.add(e.code);
    this.justPressedKeys.add(key);

    // Prevent browser scrolling on Arrow/Space during active gameplay
    if (this.state === 'playing' && (key.startsWith('arrow') || key === ' ')) {
      e.preventDefault();
    }

    // Mute shortcut (skip if typing inside an input/textarea)
    const activeTag = document.activeElement?.tagName;
    const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

    if (key === 'm' && !isTyping) {
      soundEngine.toggleMute();
    }

    // Pause toggle (in Duel mode, use Escape only so P never collides)
    if (!isTyping && (key === 'escape' || (!this.isDuelMode && key === 'p'))) {
      if (this.state === 'playing') {
        this.pauseGame();
      } else if (this.state === 'paused') {
        this.resumeGame();
      }
    }

    // Title / Game Over start triggers (skip when focused on a modal button so Diamond Revive or other buttons remain cleanly clickable)
    if (
      !isTyping &&
      activeTag !== 'BUTTON' &&
      (key === 'enter' || key === ' ') &&
      (this.state === 'gameover' || this.state === 'victory')
    ) {
      e.preventDefault();
      this.restartRun();
    }

    // Weapon select 1 to 10 (or Cyber-Chip Augment Draft pick 1/2/3 when Draft Modal is active)
    if (!isTyping && this.isDuelMode && this.duelConfig?.isSpectator) {
      if (key === '1') this.setSpectatorCamera('both');
      if (key === '2') this.setSpectatorCamera('p1');
      if (key === '3') this.setSpectatorCamera('p2');
    } else if (
      !isTyping &&
      this.state === 'playing' &&
      !this.isDuelMode &&
      this.pendingAugmentChoices &&
      this.pendingAugmentChoices.length > 0 &&
      (key === '1' || key === '2' || key === '3')
    ) {
      e.preventDefault();
      if (performance.now() - this.augmentOpenedAtMs < 260) {
        return;
      }
      const idx = parseInt(key, 10) - 1;
      const choice = this.pendingAugmentChoices[idx];
      if (choice) {
        this.selectAugment(choice.def.id);
      }
      return;
    } else if (!isTyping && !(this.isDuelMode && this.duelConfig?.isSpectator)) {
      if (key === '1') this.switchWeapon('pulse');
      if (key === '2') this.switchWeapon('scatter');
      if (key === '3') this.switchWeapon('beam');
      if (key === '4') this.switchWeapon('missile');
      if (key === 't') this.switchWeapon('ricochet_disc');
      if (key === 'z') this.switchWeapon('plasma_scythe');
      if (key === 'b') this.switchWeapon('pulsar_matrix');
      if (key === '5') this.switchWeapon('leviathan');
      if (key === '6') this.switchWeapon('vortex');
      if (key === 'u') this.switchWeapon('quantum_swarm');
      if (key === 'c') this.switchWeapon('cryo_shatter');
      if (key === 'h') this.switchWeapon('crimson_reaper');
      if (key === '7') this.switchWeapon('inferno');
      if (key === '8') this.switchWeapon('chrono_thunder');
      if (key === '9') this.switchWeapon('supernova');
      if (key === '0') this.switchWeapon('aegis_titan');
      if (key === 'x') this.switchWeapon('hyperion_astral');
      if (key === 'v') this.switchWeapon('omega_singularity');
      if (key === 'f') this.switchWeapon('prism_splitter');
      if (key === 'g') this.switchWeapon('void_rail');
      if (key === 'n') this.switchWeapon('astral_horizon');
      if (key === 'y') this.switchWeapon('celestial_eclipse');
      if (key === '=') this.switchWeapon('genesis_nova');
    }

    // Dash shortcut Shift / Q / L (in regular gameplay and Cyber Duel)
    if (
      !isTyping &&
      this.state === 'playing' &&
      (!this.isDuelMode || !this.duelConfig?.isSpectator)
    ) {
      if (this.isDuelMode && this.duelConfig?.mode === 'local') {
        if (e.code === 'ShiftLeft' || e.code === 'KeyQ') {
          e.preventDefault();
          this.dashBufferTimer = 0.12;
        } else if (e.code === 'ShiftRight' || e.code === 'KeyL') {
          e.preventDefault();
          this.p2DashBufferTimer = 0.12;
        }
      } else if (key === 'shift' || key === 'q') {
        e.preventDefault();
        this.dashBufferTimer = 0.12;
      }

      // Combo Finisher AoE Overload (E for Singleplayer / Online / Local P1, K for Local P2)
      if (this.isDuelMode && this.duelConfig?.mode === 'local') {
        if (e.code === 'KeyE') {
          e.preventDefault();
          this.triggerComboFinisher('p1');
        } else if (e.code === 'KeyK') {
          e.preventDefault();
          this.triggerComboFinisher('p2');
        } else if (e.code === 'KeyR') {
          e.preventDefault();
          this.triggerDuelWallDeploy('p1');
        } else if (e.code === 'KeyO') {
          e.preventDefault();
          this.triggerDuelWallDeploy('p2');
        }
      } else if (key === 'e') {
        e.preventDefault();
        this.triggerComboFinisher();
      } else if (this.isDuelMode && key === 'r') {
        e.preventDefault();
        this.triggerDuelWallDeploy();
      }
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.key.toLowerCase());
    this.heldCodes.delete(e.code);
  };

  private handleBlur = () => {
    this.heldKeys.clear();
    this.heldCodes.clear();
    this.justPressedKeys.clear();
    this.mouse.isDown = false;
    this.virtualMoveX = 0;
    this.virtualMoveY = 0;
    this.virtualFiring = false;
  };

  private handleVisibility = () => {
    if (document.hidden) {
      this.heldKeys.clear();
      this.heldCodes.clear();
      this.justPressedKeys.clear();
      this.mouse.isDown = false;
      this.virtualMoveX = 0;
      this.virtualMoveY = 0;
      this.virtualFiring = false;
    }
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (performance.now() - this.lastTouchInputAt < 700) return;
    if (e.button === 0) {
      this.mouse.clientX = e.clientX;
      this.mouse.clientY = e.clientY;
      this.mouse.isDown = true;
      this.mouse.hasMoved = true;
      this.updateMouseWorldPos();
      this.justPressedKeys.add('mouse0');
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (performance.now() - this.lastTouchInputAt < 700) return;
    if (e.button === 0) {
      this.mouse.isDown = false;
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (performance.now() - this.lastTouchInputAt < 700) return;
    this.mouse.clientX = e.clientX;
    this.mouse.clientY = e.clientY;
    this.mouse.hasMoved = true;
    this.updateMouseWorldPos();
  };

  private updateMouseWorldPos() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = this.currentDpr || getOptimalCanvasDpr(window.devicePixelRatio || 1);
    const canvasCenterX = (this.canvas.width / dpr) / 2;
    const canvasCenterY = (this.canvas.height / dpr) / 2;

    const relX = eClamp(this.mouse.clientX - rect.left, 0, rect.width);
    const relY = eClamp(this.mouse.clientY - rect.top, 0, rect.height);
    const scale = this.cameraScale || 1;

    this.mouse.worldX = this.camera.x + (relX - canvasCenterX) / scale;
    this.mouse.worldY = this.camera.y + (relY - canvasCenterY) / scale;
  }

  private syncWeaponAchievement(weapon: WeaponType) {
    try {
      const def = WEAPONS[weapon];
      if (def && (def.tier === 'godtier' || (def.price === 0 && def.diamondCost && def.diamondCost > 0))) {
        const godTierCount = (Object.keys(this.stats.unlockedWeapons) as WeaponType[]).filter((wId) => {
          if (!this.stats.unlockedWeapons[wId]) return false;
          const w = WEAPONS[wId];
          return w && (w.tier === 'godtier' || (w.price === 0 && w.diamondCost && w.diamondCost > 0));
        }).length;
        const res = recordAchievementEvent({
          type: 'weapon_equipped',
          amount: godTierCount,
          metadata: { isGodTier: true },
        });
        if (res.rewardCoinsTotal > 0) {
          this.stats.coins += res.rewardCoinsTotal;
        }
      }
    } catch {
      // ignore
    }
  }

  private syncCraftAchievement() {
    try {
      const unlockedCraftCount = Object.values(this.unlockedCrafts).filter(Boolean).length;
      const res = recordAchievementEvent({ type: 'craft_unlocked', amount: unlockedCraftCount });
      if (res.rewardCoinsTotal > 0) {
        this.stats.coins += res.rewardCoinsTotal;
      }
    } catch {
      // ignore
    }
  }

  public switchWeapon(type: WeaponType) {
    if (this.stats.unlockedWeapons[type]) {
      this.stats.activeWeapon = type;
      this.fireCooldownTimer = 0.05;
      this.syncCombatTelemetryToStats();
      if (typeof window !== 'undefined') {
        localStorage.setItem('nabilbot_active_weapon', type);
      }
      this.syncWeaponAchievement(type);
      soundEngine.playPickup();
      const activeEnemies = this.countAliveEnemies();
      this.onStatsSync(this.stats, this.currentWave, activeEnemies, this.bossActive);
      if (this.isDuelMode) {
        this.emitDuelSyncSnapshot();
      }
    }
  }

  public buyStoreWeapon(weapon: WeaponType): { success: boolean; error?: string } {
    const res = purchaseWeapon(this.stats.coins, this.stats.unlockedWeapons, weapon);
    if (res.success) {
      this.stats.coins = res.remainingCoins;
      this.stats.unlockedWeapons = res.updatedWeapons;
      this.stats.activeWeapon = weapon;
      if (typeof window !== 'undefined') {
        localStorage.setItem('nabilbot_coins', String(this.stats.coins));
        localStorage.setItem('nabilbot_unlocked_weapons', JSON.stringify(this.stats.unlockedWeapons));
        localStorage.setItem('nabilbot_active_weapon', weapon);
      }
      soundEngine.playVictory();
      recordMissionProgress('purchase_weapon', 1);
      this.syncWeaponAchievement(weapon);
      const activeEnemies = this.countAliveEnemies();
      this.onStatsSync(this.stats, this.currentWave, activeEnemies, this.bossActive);
      return { success: true };
    }
    soundEngine.playDefeat();
    return { success: false, error: res.error };
  }

  public equipStoreWeapon(weapon: WeaponType): boolean {
    if (this.stats.unlockedWeapons[weapon]) {
      this.stats.activeWeapon = weapon;
      if (typeof window !== 'undefined') {
        localStorage.setItem('nabilbot_active_weapon', weapon);
      }
      this.syncWeaponAchievement(weapon);
      soundEngine.playPickup();
      const activeEnemies = this.countAliveEnemies();
      this.onStatsSync(this.stats, this.currentWave, activeEnemies, this.bossActive);
      return true;
    }
    return false;
  }

  public buyCraft(craftId: CraftId): { success: boolean; error?: string } {
    const res = purchaseCraft(this.stats.coins, this.unlockedCrafts, craftId);
    if (res.success) {
      this.stats.coins = res.remainingCoins;
      this.unlockedCrafts = res.updatedCrafts;
      this.activeCraft = craftId;
      this.applyCraftModifiers();
      if (typeof window !== 'undefined') {
        localStorage.setItem('nabilbot_coins', String(this.stats.coins));
      }
      recordMissionProgress('purchase_weapon', 1);
      this.syncCraftAchievement();
      soundEngine.playVictory();
      const activeEnemies = this.countAliveEnemies();
      this.onStatsSync(this.stats, this.currentWave, activeEnemies, this.bossActive);
      return { success: true };
    }
    soundEngine.playDefeat();
    return { success: false, error: res.error };
  }

  public refreshActiveCraftSkin(): CraftSkinId {
    this.activeCraftSkin = getActiveCraftSkin(this.activeCraft);
    this.stats.activeCraftSkin = this.activeCraftSkin;
    return this.activeCraftSkin;
  }

  private refreshCachedModifiers(): void {
    this.cachedAugMods = computeAugmentModifiers(this.activeAugments);
    this.cachedStoreGearMods = computeStoreGearModifiers(this.storeGear, this.cachedDiamondRelics);
  }

  public refreshStoreGear(): void {
    this.storeGear = loadStoreGearState();
    this.cachedDiamondRelics = loadDiamondRelics();
    this.refreshCachedModifiers();
    this.applyCraftModifiers();
    this.syncCombatTelemetryToStats();
    const activeEnemies = this.countAliveEnemies();
    this.onStatsSync(this.stats, this.currentWave, activeEnemies, this.bossActive);
  }

  public unlockStoreBundleWeapons(weaponsToUnlock: WeaponType[]): void {
    let changed = false;
    for (const wId of weaponsToUnlock) {
      if (!this.stats.unlockedWeapons[wId]) {
        this.stats.unlockedWeapons[wId] = true;
        changed = true;
      }
    }
    if (changed && typeof window !== 'undefined') {
      localStorage.setItem('nabilbot_unlocked_weapons', JSON.stringify(this.stats.unlockedWeapons));
    }
    this.refreshStoreGear();
  }

  public unlockStoreBundleCrafts(craftsToUnlock: CraftId[]): void {
    let changed = false;
    for (const cId of craftsToUnlock) {
      if (!this.unlockedCrafts[cId]) {
        this.unlockedCrafts[cId] = true;
        changed = true;
      }
    }
    if (changed) {
      saveUnlockedCrafts(this.unlockedCrafts);
      this.syncCraftAchievement();
    }
    this.refreshStoreGear();
  }

  private trackGlobalEvent(type: GlobalEventObjectiveType, value: number = 1) {
    if (this.isDuelMode) return;
    try {
      const { newlyCompleted } = recordGlobalEventProgress(type, value);
      for (const obj of newlyCompleted) {
        this.spawnFloatingText(
          `🌐 48H EVENT · ${obj.title.toUpperCase()} READY!`,
          this.player.x,
          this.player.y - 110,
          '#00ffd5'
        );
      }
    } catch {
      // ignore
    }
  }

  public equipCraft(craftId: CraftId): boolean {
    if (this.unlockedCrafts[craftId]) {
      this.activeCraft = craftId;
      saveActiveCraft(craftId);
      this.refreshActiveCraftSkin();
      this.applyCraftModifiers();
      soundEngine.playPickup();
      const activeEnemies = this.countAliveEnemies();
      this.onStatsSync(this.stats, this.currentWave, activeEnemies, this.bossActive);
      return true;
    }
    return false;
  }

  public unlockDiamondWeapon(weapon: WeaponType): void {
    this.stats.unlockedWeapons[weapon] = true;
    this.stats.activeWeapon = weapon;
    this.stats.diamonds = loadDiamonds();
    if (typeof window !== 'undefined') {
      localStorage.setItem('nabilbot_unlocked_weapons', JSON.stringify(this.stats.unlockedWeapons));
      localStorage.setItem('nabilbot_active_weapon', weapon);
    }
    recordMissionProgress('purchase_weapon', 1);
    this.syncWeaponAchievement(weapon);
    soundEngine.playVictory();
    const activeEnemies = this.countAliveEnemies();
    this.onStatsSync(this.stats, this.currentWave, activeEnemies, this.bossActive);
  }

  public unlockDiamondCraft(craftId: CraftId): void {
    this.unlockedCrafts[craftId] = true;
    if (this.stats.unlockedCrafts) {
      this.stats.unlockedCrafts[craftId] = true;
    }
    this.activeCraft = craftId;
    this.stats.diamonds = loadDiamonds();
    saveUnlockedCrafts(this.unlockedCrafts);
    saveActiveCraft(craftId);
    this.refreshActiveCraftSkin();
    this.applyCraftModifiers();
    recordMissionProgress('purchase_weapon', 1);
    this.syncCraftAchievement();
    soundEngine.playVictory();
    const activeEnemies = this.countAliveEnemies();
    this.onStatsSync(this.stats, this.currentWave, activeEnemies, this.bossActive);
  }

  public setDifficulty(mode: DifficultyMode) {
    this.difficulty = mode;
    this.stats.difficulty = mode;
    saveDifficultyMode(mode);
  }

  public setDuelCallbacks(
    onDuelSync?: (snapshot: DuelHudSnapshot) => void,
    onDuelVictory?: (summary: DuelVictorySummary) => void,
    onDuelRematch?: () => void
  ) {
    this.onDuelSync = onDuelSync;
    this.onDuelVictory = onDuelVictory;
    this.onDuelRematch = onDuelRematch;
  }

  public startEndlessRun(difficultyOverride?: DifficultyMode) {
    this.startRun(1, difficultyOverride, true, false);
  }

  public startBossRushRun(difficultyOverride?: DifficultyMode) {
    this.startRun(1, difficultyOverride, false, true);
  }

  public toggleRadar(): boolean {
    this.radarEnabled = !this.radarEnabled;
    this.syncCombatTelemetryToStats();
    const activeEnemies = this.countAliveEnemies();
    this.onStatsSync(this.stats, this.currentWave, activeEnemies, this.bossActive);
    return this.radarEnabled;
  }

  public setVirtualMoveVector(dx: number, dy: number): void {
    const mag = Math.hypot(dx, dy);
    if (mag > 1) {
      this.virtualMoveX = dx / mag;
      this.virtualMoveY = dy / mag;
    } else {
      this.virtualMoveX = dx;
      this.virtualMoveY = dy;
    }
  }

  public setVirtualFiring(firing: boolean): void {
    this.virtualFiring = firing;
  }

  public setVirtualAimAngle(angle: number | null): void {
    this.virtualAimAngle = angle;
  }

  public cycleUnlockedWeapon(direction: 1 | -1 = 1): WeaponType {
    const next = getNextUnlockedWeapon(
      this.stats.activeWeapon,
      this.stats.unlockedWeapons,
      WEAPON_ORDER,
      direction
    );
    if (next !== this.stats.activeWeapon) {
      this.switchWeapon(next);
    }
    return next;
  }

  public triggerDash(): void {
    if (this.state === 'playing') {
      this.dashBufferTimer = 0.12;
    }
  }

  public startRun(
    startingLevel?: number,
    difficultyOverride?: DifficultyMode,
    endlessMode: boolean = false,
    bossRushMode: boolean = false
  ) {
    this.isDuelMode = false;
    this.duelConfig = null;
    this.isBossRushMode = bossRushMode;
    this.isEndlessMode = bossRushMode ? false : endlessMode;
    this.endlessBestWave = loadEndlessRecord().bestWave;
    this.endlessBossesPending = 0;
    this.bossRushStage = 1;
    this.bossRushBestStage = loadBossRushRecord().bestStage;
    this.bossRushBossName = bossRushMode ? getBossRushStageDef(1).name : '';
    this.activeBounty = null;
    this.bountySpawnTimer = 16;
    this.bountyDiamondsEarnedThisRun = 0;
    this.virtualMoveX = 0;
    this.virtualMoveY = 0;
    this.virtualFiring = false;
    this.cameraScale = 1;
    this.adaptiveLowPerfStreak = 0;
    this.applyPerformanceProfile(true);
    this.resizeCanvas();
    if (this.duelClient) {
      this.duelClient.disconnect();
      this.duelClient = null;
    }

    if (difficultyOverride) {
      this.setDifficulty(difficultyOverride);
    } else {
      this.difficulty = loadDifficultyMode();
    }
    this.stats.difficulty = this.difficulty;
    this.refreshActiveCraftSkin();

    // Consume armed pre-run Supply Crate Boosters once at deployment
    this.storeGear = loadStoreGearState();
    this.cachedDiamondRelics = loadDiamondRelics();
    this.refreshCachedModifiers();
    this.activeBoosters = consumeArmedBoostersForRun();
    this.bountySpawnTimer = this.activeBoosters.includes('bounty_radar_vip') ? 4 : 16;
    this.companionFireTimer = 0.25;
    this.companionShieldTimer = 0;
    this.moduleVampiricKills = 0;
    this.applyCraftModifiers();

    if (this.isEndlessMode) {
      const rec = recordEndlessMilestone({ newRun: true });
      this.endlessBestWave = rec.bestWave;
    }

    this.state = 'playing';
    document.body.dataset.state = 'playing';
    this.onStateChange('playing');

    this.currentLevel = this.isBossRushMode
      ? getBossRushStageDef(1).arenaLevel
      : this.isEndlessMode
      ? 1
      : Math.max(1, Math.min(LEVELS.length, startingLevel || 1));
    const lvlDef = getLevelDef(this.currentLevel);

    // Reset player
    this.player.x = ARENA_WIDTH / 2;
    this.player.y = ARENA_HEIGHT / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.scaleX = 1;
    this.player.scaleY = 1;
    this.player.isDashing = false;
    this.player.invulnerableTimer = 0.5;

    // Reset stats
    this.stats.currentHp = this.stats.maxHp;
    this.stats.currentShield = this.stats.maxShield;
    this.stats.dashCooldownTimer = 0;
    this.stats.dashTimer = 0;
    this.dashBufferTimer = 0;
    this.virtualAimAngle = null;
    this.stats.score = 0;
    this.stats.comboStreak = 0;
    this.stats.comboCount = 0;
    this.stats.comboMultiplier = 1.0;
    this.stats.comboTimer = 0;
    this.stats.highestCombo = 0;
    this.stats.maxCombo = 0;
    this.stats.comboFinisherCharge = 0;
    this.stats.comboFinisherReady = false;
    this.finisherChargeProgress = 0;
    this.stats.kills = 0;
    this.stats.scrap = 0;
    this.stats.level = this.currentLevel;
    this.stats.levelKills = 0;
    this.stats.levelQuota = this.isBossRushMode
      ? 1 + getBossRushStageDef(1).escortCount
      : this.isEndlessMode
      ? 8
      : lvlDef.hostileQuota;
    this.stats.levelName = this.isBossRushMode
      ? getBossRushStageDef(1).name
      : this.isEndlessMode
      ? 'ENDLESS OVERDRIVE ARENA'
      : lvlDef.name;
    this.levelTransitionTimer = 1.0;
    this.tookDamageInSector = false;
    this.revivesUsedThisRun = 0;
    this.cachedDiamondRelics = loadDiamondRelics();
    this.stats.diamonds = loadDiamonds();
    this.resetAllWeaponThermals();
    this.cyberStorm = createInitialCyberStormState();
    this.cyberStormSpeedMult = 1.0;
    this.cyberStormInWindZone = false;
    this.cyberStormWindLabel = '';
    this.overheatWarnCooldown = 0;
    this.dashOverchargeTimer = 0;
    this.isCurrentDashOvercharged = false;
    this.activeAugments = createEmptyAugments();
    this.pendingProgress = createPendingCombatProgressBuffer();
    this.progressFlushTimer = 0;
    this.refreshCachedModifiers();
    this.pendingAugmentChoices = null;
    this.augmentDraftReason = null;
    this.augmentClearedLevel = null;
    this.augmentOpenedAtMs = 0;
    this.vampiricKillCounter = 0;
    this.wingmanFireTimers = [0, 0.16, 0.32];
    this.cryoTickTimer = 0;
    this.overdriveTimer = 0;
    this.multiKillState = createInitialMultiKillState();
    this.goldenCores = [];
    this.goldenCoreSpawnTimer = 14;
    this.goldenCoresDestroyed = 0;
    this.arenaBarrels = [];
    this.barrelRespawnTimer = 11;
    this.barrelsDetonated = 0;
    this.electricArcs = [];
    this.coinsDirty = false;
    this.coinsSaveTimer = 0;
    this.syncCombatTelemetryToStats();

    // Reset entities
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.floatingTexts = [];
    this.finisherShockwaves = [];
    this.heldKeys.clear();
    this.heldCodes.clear();
    this.justPressedKeys.clear();

    // Reset camera
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.camera.trauma = 0;
    this.camera.shakeOffsetX = 0;
    this.camera.shakeOffsetY = 0;
    this.camera.shakeAngle = 0;
    this.camera.recoilX = 0;
    this.camera.recoilY = 0;
    this.camera.glitchAlpha = 0;

    // Wave 1
    this.currentWave = 1;
    this.initWave(1);
    this.runStartTime = performance.now();
    this.syncCombatTelemetryToStats();
    this.onStatsSync(this.stats, this.currentWave, this.countAliveEnemies(), this.bossActive);

    if (this.activeBoosters.length > 0) {
      this.spawnFloatingText(
        `🎁 SUPPLY BOOSTERS ONLINE (${this.activeBoosters.length})`,
        this.player.x,
        this.player.y - 92,
        '#38bdf8'
      );
      if (this.activeBoosters.includes('finisher_charged')) {
        this.stats.comboFinisherCharge = COMBO_FINISHER_THRESHOLD;
        this.stats.comboFinisherReady = true;
        this.stats.comboStreak = Math.max(1, this.stats.comboStreak);
        this.stats.comboCount = this.stats.comboStreak;
        this.stats.comboTimer = this.cachedDiamondRelics.chrono_flux ? 5.5 : 3.0;
        this.syncCombatTelemetryToStats();
        this.onStatsSync(this.stats, this.currentWave, this.countAliveEnemies(), this.bossActive);
      }
      if (this.activeBoosters.includes('headstart_augment')) {
        this.openAugmentDraft('headstart');
      }
    }

    // Blur active buttons
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  public setSpectatorCamera(cam: DuelSpectatorCamera) {
    this.duelSpectatorCamera = cam;
    this.emitDuelSyncSnapshot();
  }

  public setDuelCameraMode(cam: DuelCameraMode) {
    if (this.duelConfig?.isSpectator) {
      this.duelSpectatorCamera = cam;
    } else {
      this.duelCameraMode = cam;
    }
    this.emitDuelSyncSnapshot();
  }

  public setDuelFreePointerMove(enabled: boolean) {
    this.duelFreePointerMove = enabled;
    this.emitDuelSyncSnapshot();
  }

  public triggerDuelDash() {
    if (this.isDuelMode && !this.duelConfig?.isSpectator && this.state === 'playing') {
      this.dashBufferTimer = 0.12;
    }
  }

  public triggerDuelWallDeploy(explicitSlot?: DuelSlotId): boolean {
    if (!this.isDuelMode || this.state !== 'playing' || !this.duelConfig) return false;
    if (this.duelConfig.isSpectator) return false;
    const isOnline = this.duelConfig.mode === 'online';
    const slot: DuelSlotId = isOnline
      ? this.duelConfig.localSlot || 'p1'
      : explicitSlot || 'p1';
    const actor = this.getDuelActorRef(slot);
    const score = this.getDuelScoreRef(slot);
    if (!actor || !score || score.respawnTimer > 0) return false;

    const currentCharges =
      this.duelWallChargeBySlot.get(slot) || createInitialTacticalWallChargeState();
    const res = consumeTacticalWallCharge(currentCharges);
    if (!res.consumed) {
      if (slot === (this.duelConfig.localSlot || 'p1')) {
        this.spawnFloatingText(
          `WALL RECHARGING ${currentCharges.cooldownTimer.toFixed(1)}s`,
          actor.x,
          actor.y - 36,
          '#94a3b8'
        );
      }
      return false;
    }
    this.duelWallChargeBySlot.set(slot, res.nextState);

    const placement = computeWallPlacement({
      playerX: actor.x,
      playerY: actor.y,
      angle: actor.angle,
      arenaW: ARENA_WIDTH,
      arenaH: ARENA_HEIGHT,
    });

    if (isOnline && this.duelClient) {
      this.duelClient.deployTacticalWall(placement);
      soundEngine.playFinisherReady();
      this.emitBurst(placement.x, placement.y, score.color || '#00f3ff', 10, 1.0);
      this.emitDuelSyncSnapshot();
      return true;
    }

    const wall = createTacticalWall({
      id: `local_wall_${this.duelWallSeq++}`,
      ownerSlot: slot,
      ownerTeam: score.team,
      color: score.color,
      x: placement.x,
      y: placement.y,
      angle: placement.angle,
    });
    this.duelTacticalWalls = enforceOwnerWallCap(
      [...this.duelTacticalWalls, wall],
      slot,
      TACTICAL_WALL_MAX_ACTIVE_PER_PLAYER
    );
    soundEngine.playFinisherReady();
    this.emitBurst(wall.x, wall.y, wall.color || '#00f3ff', 14, 1.2);
    this.emitParticle(wall.x, wall.y, 0, 0, 74, wall.color || '#00f3ff', 0.28, 'ring');
    this.spawnFloatingText('🛡️ SHIELD WALL', wall.x, wall.y - 36, wall.color || '#00f3ff');
    this.emitDuelSyncSnapshot();
    return true;
  }

  private shatterTacticalWallFx(wall: DuelTacticalWall) {
    soundEngine.playExplosion();
    this.addCameraTrauma(0.14);
    this.emitBurst(wall.x, wall.y, wall.color || '#00f3ff', 22, 1.6);
    this.emitBurst(wall.x, wall.y, '#e879f9', 14, 1.35);
    this.emitParticle(wall.x, wall.y, 0, 0, 95, '#38bdf8', 0.34, 'ring');
    this.spawnFloatingText('💥 SHIELD DESTROYED!', wall.x, wall.y - 34, '#f472b6');
  }

  private getDuelActorRef(slot: DuelSlotId): {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    angle: number;
    targetX: number;
    targetY: number;
    targetAngle: number;
    scaleX: number;
    scaleY: number;
    isDashing: boolean;
    invulnerableTimer: number;
  } | null {
    if (slot === 'p1') return this.player;
    if (slot === 'p2') return this.player2;
    return this.duelExtraActors.get(slot) || null;
  }

  private getDuelScoreRef(slot: DuelSlotId): DuelPlayerScore | null {
    if (slot === 'p1') return this.duelP1Score;
    if (slot === 'p2') return this.duelP2Score;
    return this.duelRoster.get(slot) || null;
  }

  private getDuelTrailRef(slot: DuelSlotId): { x: number; y: number; angle: number; life: number; maxLife: number }[] {
    if (slot === 'p1') return this.duelP1Trail;
    if (slot === 'p2') return this.duelP2Trail;
    const extra = this.duelExtraActors.get(slot);
    return extra ? extra.trail : this.duelP2Trail;
  }

  private getDuelSpawnCoordsForSlot(slot: DuelSlotId): { x: number; y: number; angle: number } {
    const isTeamMode = this.duelMatchFormat === 'pvp_team';
    const rosterList = Array.from(this.duelRoster.values());
    const score = this.getDuelScoreRef(slot);
    const totalSlots = Math.max(2, rosterList.length);
    let slotIndex = Math.max(0, ALL_DUEL_SLOTS.indexOf(slot));
    if (isTeamMode && score?.team) {
      const sameTeam = rosterList.filter((p) => p.team === score.team);
      const foundIdx = sameTeam.findIndex((p) => p.slot === slot);
      slotIndex = foundIdx >= 0 ? foundIdx : 0;
    }
    return getSafeArenaSpawnPoint({
      slotIndex,
      totalSlots,
      team: score?.team,
      isTeamMode,
      obstacles: this.duelObstacles,
      arenaW: ARENA_WIDTH,
      arenaH: ARENA_HEIGHT,
    });
  }

  private getActiveDuelSlots(): DuelSlotId[] {
    if (this.duelRoster.size > 0) {
      return ALL_DUEL_SLOTS.filter((s) => this.duelRoster.has(s));
    }
    return ['p1', 'p2'];
  }

  public startDuel(
    config: DuelConfig,
    onlineClient?: DuelClient,
    initialSpectateData?: SpectateJoinedPayload
  ) {
    this.isDuelMode = true;
    this.duelConfig = { ...config };
    this.duelMatchFormat = config.matchFormat || 'pvpve_1v1';
    this.duelMapTheme = config.mapTheme || 'sector';
    this.duelObstacles = buildArenaObstacles(this.duelMapTheme, ARENA_WIDTH, ARENA_HEIGHT);
    this.duelTacticalWalls = initialSpectateData?.tacticalWalls
      ? initialSpectateData.tacticalWalls.map((w) => ({ ...w }))
      : [];
    this.duelWallSeq = 1;
    this.duelWallChargeBySlot.clear();
    this.arenaFloorCacheKey = '';
    this.duelClient = onlineClient || null;
    this.duelTimeRemaining =
      initialSpectateData?.roomState.timeRemaining ?? config.durationSeconds ?? 120;
    this.duelElapsedTime = initialSpectateData?.elapsedSeconds ?? 0;
    this.duelSpawnTimer = 0.6;
    this.duelWaveCounter = 1;
    this.duelSpawnSeq = 1;
    this.duelStateSyncTimer = 0;
    this.duelHudSyncTimer = 0;
    this.duelSpawnedIds.clear();
    this.duelExtraActors.clear();
    this.duelRoster.clear();
    this.duelSpectatorCount = initialSpectateData?.roomState.spectatorCount ?? 0;
    this.duelSpectatorCamera = 'both';
    this.duelCameraMode = 'both';
    this.duelFreePointerMove = config.freePointerMove ?? true;
    this.duelKillFeed = [];
    this.duelEventTracker = createDuelEventTracker();
    this.dashBufferTimer = 0;
    this.p2DashBufferTimer = 0;

    this.currentLevel = Math.max(1, Math.min(LEVELS.length, config.level || 1));
    this.difficulty = config.difficulty || 'normal';
    this.stats.difficulty = this.difficulty;
    const lvlDef = getLevelDef(this.currentLevel);

    this.state = 'playing';
    document.body.dataset.state = 'playing';
    this.onStateChange('playing');

    // Initialize full multi-player roster (supports 2-6 slots cleanly)
    const sourcePlayers =
      initialSpectateData?.roomState.players && initialSpectateData.roomState.players.length > 0
        ? initialSpectateData.roomState.players
        : config.players && config.players.length > 0
        ? config.players
        : initialSpectateData?.roomState.p1 && initialSpectateData?.roomState.p2
        ? [initialSpectateData.roomState.p1, initialSpectateData.roomState.p2]
        : [
            createInitialDuelPlayerScore('p1', config.p1Name, this.stats.maxHp, this.stats.maxShield, true),
            createInitialDuelPlayerScore('p2', config.p2Name, this.stats.maxHp, this.stats.maxShield, true),
          ];

    for (const entry of sourcePlayers) {
      this.duelRoster.set(entry.slot, { ...entry });
    }
    this.duelP1Score =
      this.duelRoster.get('p1') ||
      createInitialDuelPlayerScore('p1', config.p1Name, this.stats.maxHp, this.stats.maxShield, true);
    this.duelP2Score =
      this.duelRoster.get('p2') ||
      createInitialDuelPlayerScore('p2', config.p2Name, this.stats.maxHp, this.stats.maxShield, false);
    if (!this.duelRoster.has('p1')) this.duelRoster.set('p1', this.duelP1Score);
    if (!this.duelRoster.has('p2') && this.duelMatchFormat === 'pvpve_1v1') {
      this.duelRoster.set('p2', this.duelP2Score);
    }

    // Equalized baseline combat stats for fair competitive PvP
    this.stats.currentHp = this.stats.maxHp;
    this.stats.currentShield = this.stats.maxShield;
    this.stats.dashCooldown = BASE_DASH_COOLDOWN_SECONDS;
    this.stats.dashCooldownTimer = 0;
    this.stats.dashTimer = 0;
    this.stats.score = 0;
    this.stats.comboStreak = 0;
    this.stats.comboCount = 0;
    this.stats.comboMultiplier = 1.0;
    this.stats.comboTimer = 0;
    this.stats.comboFinisherCharge = 0;
    this.stats.comboFinisherReady = false;
    this.stats.kills = 0;
    this.stats.level = this.currentLevel;
    this.stats.levelName =
      this.duelMapTheme === 'cyber_forest_ruins' ? 'Crystal Conduit Ruins' : lvlDef.name;

    // Position P1, P2, and any P3..P6 extra actors at obstacle-clear spawn coords
    const p1Safe = this.getDuelSpawnCoordsForSlot('p1');
    const p1Init = initialSpectateData?.playerStates?.p1 || initialSpectateData?.p1State;
    this.player.x = p1Init ? p1Init.x : p1Safe.x;
    this.player.y = p1Init ? p1Init.y : p1Safe.y;
    this.player.targetX = this.player.x;
    this.player.targetY = this.player.y;
    this.player.vx = p1Init ? p1Init.vx : 0;
    this.player.vy = p1Init ? p1Init.vy : 0;
    this.player.angle = p1Init ? p1Init.angle : p1Safe.angle;
    this.player.targetAngle = this.player.angle;
    this.player.scaleX = 1;
    this.player.scaleY = 1;
    this.player.isDashing = p1Init ? p1Init.isDashing : false;
    this.player.invulnerableTimer = 1.0;

    const p2Safe = this.getDuelSpawnCoordsForSlot('p2');
    const p2Init = initialSpectateData?.playerStates?.p2 || initialSpectateData?.p2State;
    this.player2.x = p2Init ? p2Init.x : p2Safe.x;
    this.player2.y = p2Init ? p2Init.y : p2Safe.y;
    this.player2.targetX = this.player2.x;
    this.player2.targetY = this.player2.y;
    this.player2.vx = p2Init ? p2Init.vx : 0;
    this.player2.vy = p2Init ? p2Init.vy : 0;
    this.player2.angle = p2Init ? p2Init.angle : p2Safe.angle;
    this.player2.targetAngle = this.player2.angle;
    this.player2.scaleX = 1;
    this.player2.scaleY = 1;
    this.player2.isDashing = p2Init ? p2Init.isDashing : false;
    this.player2.invulnerableTimer = 1.0;
    this.player2.activeWeapon = p2Init ? p2Init.activeWeapon : this.stats.activeWeapon;
    this.player2.activeCraft = p2Init ? p2Init.activeCraft : this.player2.activeCraft;
    this.player2.dashCooldownTimer = 0;
    this.player2.dashTimer = 0;
    this.player2.fireCooldownTimer = 0;
    this.player2.shieldCooldownTimer = 0;
    this.player2.comboTimer = 0;

    for (const extraSlot of ['p3', 'p4', 'p5', 'p6'] as DuelSlotId[]) {
      if (!this.duelRoster.has(extraSlot)) continue;
      const safe = this.getDuelSpawnCoordsForSlot(extraSlot);
      const initTelemetry = initialSpectateData?.playerStates?.[extraSlot];
      this.duelExtraActors.set(extraSlot, {
        x: initTelemetry ? initTelemetry.x : safe.x,
        y: initTelemetry ? initTelemetry.y : safe.y,
        vx: initTelemetry ? initTelemetry.vx : 0,
        vy: initTelemetry ? initTelemetry.vy : 0,
        radius: 18,
        angle: initTelemetry ? initTelemetry.angle : safe.angle,
        targetX: initTelemetry ? initTelemetry.x : safe.x,
        targetY: initTelemetry ? initTelemetry.y : safe.y,
        targetAngle: initTelemetry ? initTelemetry.angle : safe.angle,
        scaleX: 1,
        scaleY: 1,
        isDashing: initTelemetry ? initTelemetry.isDashing : false,
        invulnerableTimer: 1.0,
        activeWeapon: initTelemetry ? initTelemetry.activeWeapon : 'pulse',
        activeCraft: initTelemetry ? initTelemetry.activeCraft : 'vanguard_alpha',
        dashCooldownTimer: 0,
        dashTimer: 0,
        fireCooldownTimer: 0,
        shieldCooldownTimer: 0,
        comboTimer: 0,
        trail: [],
      });
    }

    if (p1Init && config.isSpectator) {
      this.stats.activeWeapon = p1Init.activeWeapon;
      this.activeCraft = p1Init.activeCraft;
    }

    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.floatingTexts = [];
    this.finisherShockwaves = [];
    this.duelP1Trail = [];
    this.duelP2Trail = [];
    this.heldKeys.clear();
    this.heldCodes.clear();
    this.justPressedKeys.clear();
    this.mouse.isDown = false;
    this.mouse.hasMoved = false;
    this.levelTransitionTimer = 0.8;

    const localSlot = config.localSlot || 'p1';
    if (config.mode === 'local' || config.isSpectator) {
      this.camera.x = (this.player.x + this.player2.x) / 2;
      this.camera.y = (this.player.y + this.player2.y) / 2;
      this.cameraScale = Math.min(0.82, this.getTargetBaseCameraScale());
    } else {
      const localActor = this.getDuelActorRef(localSlot) || this.player;
      this.camera.x = localActor.x;
      this.camera.y = localActor.y;
      this.cameraScale = this.getTargetBaseCameraScale();
    }
    this.camera.trauma = 0;
    this.camera.shakeOffsetX = 0;
    this.camera.shakeOffsetY = 0;
    this.camera.shakeAngle = 0;
    this.camera.recoilX = 0;
    this.camera.recoilY = 0;
    this.camera.glitchAlpha = 0;
    this.runStartTime = performance.now();

    if (config.isSpectator) {
      this.spawnFloatingText(
        `👁️ SPECTATING LIVE DUEL`,
        this.camera.x,
        this.camera.y - 60,
        '#00f3ff'
      );
    } else {
      const startBanner = isPurePvpFormat(this.duelMatchFormat)
        ? this.duelMatchFormat === 'pvp_team'
          ? '⚔️ PURE PVP · TEAM BATTLE START!'
          : '⚔️ PURE PVP · SOLO ARENA START!'
        : `⚔️ ${Math.round(this.duelTimeRemaining / 60)}-MIN CYBER DUEL START!`;
      this.spawnFloatingText(startBanner, this.camera.x, this.camera.y - 60, '#00f3ff');
    }

    // Spawn AI waves ONLY in PvPvE 1v1; Pure PvP (Solo / Team) keeps zero AI bots
    if (!isPurePvpFormat(this.duelMatchFormat)) {
      if (initialSpectateData?.activeSpawns?.length) {
        this.spawnCompetitiveBatch(initialSpectateData.activeSpawns);
      } else if (config.mode === 'local') {
        this.spawnCompetitiveDuelWave(1);
      }
    }

    if (onlineClient) {
      this.attachDuelClientHandlers(onlineClient, config.isSpectator ? 'spectator' : localSlot);
    }

    this.emitDuelSyncSnapshot();

    if (initialSpectateData?.summary) {
      this.finishDuelWithSummary(initialSpectateData.summary);
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  private attachDuelClientHandlers(client: DuelClient, localRole: DuelSlotId | 'spectator') {
    const isSpectator = localRole === 'spectator';
    client.setHandlers({
      onRoomState: (roomState) => {
        if (!this.isDuelMode) return;
        this.duelSpectatorCount = roomState.spectatorCount || 0;
        const wasOppConnected =
          localRole !== 'spectator' &&
          Array.from(this.duelRoster.values()).some((p) => p.slot !== localRole && p.connected);

        if (roomState.players && roomState.players.length > 0) {
          for (const p of roomState.players) {
            const existing = this.duelRoster.get(p.slot);
            if (existing) {
              existing.connected = p.connected;
              existing.team = p.team;
            }
          }
        }
        if (this.duelP1Score) this.duelP1Score.connected = roomState.p1.connected;
        if (this.duelP2Score) this.duelP2Score.connected = roomState.p2.connected;

        const nowOppConnected =
          localRole !== 'spectator' &&
          Array.from(this.duelRoster.values()).some((p) => p.slot !== localRole && p.connected);
        if (wasOppConnected && !nowOppConnected) {
          this.spawnFloatingText('⚠️ PLAYER DISCONNECTED', this.camera.x, this.camera.y - 70, '#ffaa00');
        }
        this.emitDuelSyncSnapshot();
      },
      onMatchStarted: (startedState) => {
        if (!this.duelConfig) return;
        this.onDuelRematch?.();
        this.startDuel(
          {
            mode: 'online',
            matchFormat: startedState.matchFormat || this.duelMatchFormat,
            mapTheme: startedState.mapTheme || this.duelMapTheme,
            durationSeconds: startedState.durationSeconds,
            level: startedState.level,
            difficulty: startedState.difficulty,
            p1Name: startedState.p1.name,
            p2Name: startedState.p2.name,
            roomCode: startedState.roomCode,
            localSlot: isSpectator ? 'p1' : localRole,
            isSpectator,
            freePointerMove: this.duelConfig.freePointerMove ?? true,
            players: startedState.players,
          },
          client
        );
      },
      onTimerTick: (timeRemaining, elapsedSeconds) => {
        if (!this.isDuelMode) return;
        this.duelTimeRemaining = timeRemaining;
        this.duelElapsedTime = elapsedSeconds;
        this.emitDuelSyncSnapshot();
      },
      onSpawnWave: (waveNumber, spawns) => {
        if (!this.isDuelMode || isPurePvpFormat(this.duelMatchFormat)) return;
        this.duelWaveCounter = waveNumber;
        this.spawnCompetitiveBatch(spawns);
      },
      onRemotePlayerState: (slot, state: RemotePlayerTelemetry) => {
        if (!this.isDuelMode || slot === localRole) return;
        const targetActor = this.getDuelActorRef(slot);
        const targetScore = this.getDuelScoreRef(slot);
        if (targetActor) {
          targetActor.targetX = state.x;
          targetActor.targetY = state.y;
          targetActor.targetAngle = state.angle;
          targetActor.vx = state.vx;
          targetActor.vy = state.vy;
          targetActor.isDashing = state.isDashing;
        }
        if (slot === 'p2') {
          this.player2.activeWeapon = state.activeWeapon;
          this.player2.activeCraft = state.activeCraft;
        } else if (slot === 'p1' && isSpectator) {
          this.stats.activeWeapon = state.activeWeapon;
          this.activeCraft = state.activeCraft;
        } else {
          const extra = this.duelExtraActors.get(slot);
          if (extra) {
            extra.activeWeapon = state.activeWeapon;
            extra.activeCraft = state.activeCraft;
          }
        }
        if (targetScore) {
          const prevRespawn = targetScore.respawnTimer;
          targetScore.hp = state.hp;
          targetScore.maxHp = state.maxHp;
          targetScore.shield = state.shield;
          targetScore.maxShield = state.maxShield;
          targetScore.respawnTimer = state.respawnTimer;
          if (targetActor && prevRespawn > 0 && state.respawnTimer <= 0) {
            targetActor.invulnerableTimer = 1.4;
          }
          if (typeof state.momentumTimer === 'number') {
            targetScore.momentumTimer = state.momentumTimer;
          }
        }
      },
      onRemoteProjectile: (slot, proj: RemoteProjectilePayload) => {
        if (!this.isDuelMode || slot === localRole) return;
        this.projectiles.push({
          id: this.nextId++,
          x: proj.x,
          y: proj.y,
          vx: proj.vx,
          vy: proj.vy,
          radius: proj.radius,
          damage: proj.damage,
          rangeRemaining: proj.rangeRemaining,
          color: proj.color,
          isEnemy: false,
          pierceRemaining: proj.pierceRemaining,
          trail: [],
          isHoming: proj.isHoming,
          explosionRadius: proj.explosionRadius,
          pullRadius: proj.pullRadius,
          weaponType: proj.weaponType,
          damageCategory: mapWeaponToDamageCategory(proj.weaponType, Boolean(proj.explosionRadius)),
          ownerSlot: slot,
        });
      },
      onWallDeployed: (wall) => {
        if (!this.isDuelMode) return;
        const idx = this.duelTacticalWalls.findIndex((w) => w.id === wall.id);
        if (idx >= 0) {
          this.duelTacticalWalls[idx] = { ...wall };
        } else {
          this.duelTacticalWalls = enforceOwnerWallCap(
            [...this.duelTacticalWalls, { ...wall }],
            wall.ownerSlot,
            TACTICAL_WALL_MAX_ACTIVE_PER_PLAYER
          );
          this.emitBurst(wall.x, wall.y, wall.color || '#00f3ff', 14, 1.2);
          this.emitParticle(wall.x, wall.y, 0, 0, 74, wall.color || '#00f3ff', 0.28, 'ring');
          this.spawnFloatingText('🛡️ SHIELD WALL', wall.x, wall.y - 36, wall.color || '#00f3ff');
        }
        this.emitDuelSyncSnapshot();
      },
      onWallDamaged: ({ wallId, hp, maxHp }) => {
        if (!this.isDuelMode) return;
        const target = this.duelTacticalWalls.find((w) => w.id === wallId);
        if (target) {
          target.hp = hp;
          target.maxHp = maxHp;
          target.hitFlash = 1.0;
          this.emitBurst(target.x, target.y, '#38bdf8', 5, 0.75);
        }
      },
      onWallDestroyed: ({ wallId }) => {
        if (!this.isDuelMode) return;
        const target = this.duelTacticalWalls.find((w) => w.id === wallId);
        if (target) {
          this.duelTacticalWalls = this.duelTacticalWalls.filter((w) => w.id !== wallId);
          this.shatterTacticalWallFx(target);
          this.emitDuelSyncSnapshot();
        }
      },
      onPvpHit: ({ attackerSlot, targetSlot, damage, fromX, fromY }) => {
        if (!this.isDuelMode) return;
        if (isSpectator) {
          const targetActor = this.getDuelActorRef(targetSlot) || this.player;
          const attackerColor = this.getDuelScoreRef(attackerSlot)?.color || '#ff0077';
          this.emitBurst(targetActor.x, targetActor.y, attackerColor, 8, 1.0);
          this.spawnDamageText(damage, targetActor.x, targetActor.y, 'kinetic', false, 1.0);
          return;
        }
        if (targetSlot !== localRole) return;
        const localActor = this.getDuelActorRef(localRole) || this.player;
        const localScore = this.getDuelScoreRef(localRole);
        if (
          localActor.isDashing ||
          (localScore && localScore.respawnTimer > 0) ||
          localActor.invulnerableTimer > 1.2
        ) {
          return;
        }
        this.handleDuelPlayerDamaged(localRole, damage, fromX, fromY, attackerSlot);
      },
      onScoreboardUpdate: ({ spawnId, killerSlot, rewardPoints, momentumTriggered, p1, p2, players }) => {
        if (!this.isDuelMode) return;
        const prevP1Timer = this.duelP1Score?.momentumTimer || 0;
        const prevP2Timer = this.duelP2Score?.momentumTimer || 0;
        this.duelP1Score = {
          ...p1,
          momentumTimer:
            localRole === 'p1' && !momentumTriggered && prevP1Timer > 0
              ? prevP1Timer
              : p1.momentumTimer,
        };
        this.duelP2Score = {
          ...p2,
          momentumTimer:
            localRole === 'p2' && !momentumTriggered && prevP2Timer > 0
              ? prevP2Timer
              : p2.momentumTimer,
        };

        if (players && players.length > 0) {
          for (const updated of players) {
            const prev = this.duelRoster.get(updated.slot);
            const merged = {
              ...updated,
              momentumTimer:
                updated.slot === localRole && !momentumTriggered && prev && prev.momentumTimer > 0
                  ? prev.momentumTimer
                  : updated.momentumTimer,
            };
            this.duelRoster.set(updated.slot, merged);
            if (updated.slot === 'p1') this.duelP1Score = merged;
            if (updated.slot === 'p2') this.duelP2Score = merged;
          }
        } else {
          this.duelRoster.set('p1', this.duelP1Score);
          this.duelRoster.set('p2', this.duelP2Score);
        }

        if (momentumTriggered && killerSlot) {
          const momActor = this.getDuelActorRef(killerSlot) || this.player;
          const momColor = this.getDuelScoreRef(killerSlot)?.color || '#00f3ff';
          if (killerSlot !== localRole) {
            this.spawnFloatingText('⚡ CYBER MOMENTUM! +35% SPD', momActor.x, momActor.y - 44, momColor);
            this.emitBurst(momActor.x, momActor.y, momColor, 18, 1.4);
          }
        }
        if (spawnId) {
          const matchedEnemy = this.enemies.find((e) => e.duelSpawnId === spawnId && e.state !== 'ko');
          if (matchedEnemy) {
            matchedEnemy.state = 'ko';
            matchedEnemy.koTimer = 0.25;
            this.emitBurst(matchedEnemy.x, matchedEnemy.y, matchedEnemy.color, 12, 1.1);
            if (rewardPoints && killerSlot) {
              const color = this.getDuelScoreRef(killerSlot)?.color || '#00f3ff';
              this.spawnFloatingText(`+${rewardPoints}`, matchedEnemy.x, matchedEnemy.y - 20, color);
            }
          }
        } else if (rewardPoints && killerSlot) {
          const killerActor = this.getDuelActorRef(killerSlot) || this.player;
          const color = this.getDuelScoreRef(killerSlot)?.color || '#00f3ff';
          this.spawnFloatingText(`⚔️ +${rewardPoints} PVP KO!`, killerActor.x, killerActor.y - 34, color);
        }
        this.emitDuelSyncSnapshot();
      },
      onMatchFinished: (summary) => {
        if (!this.isDuelMode) return;
        this.finishDuelWithSummary(summary);
      },
    });
  }

  public advanceToNextLevel() {
    this.prevLevelImage = this.levelImages.get(this.currentLevel) || null;
    this.currentLevel += 1;
    if (this.currentLevel > this.highestLevelUnlocked) {
      this.highestLevelUnlocked = this.currentLevel;
      this.writeStorageSafe('nabilbot_unlocked_level', String(this.highestLevelUnlocked));
    }
    const nextLvl = getLevelDef(this.currentLevel);
    this.stats.level = this.currentLevel;
    this.stats.levelKills = 0;
    this.stats.levelQuota = nextLvl.hostileQuota;
    this.stats.levelName = nextLvl.name;
    this.stats.scrap += nextLvl.clearRewardScrap;
    this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + 2);
    this.stats.currentShield = this.stats.maxShield;

    this.levelTransitionTimer = 1.6;
    soundEngine.playVictory();
    this.addCameraTrauma(0.25);

    this.spawnFloatingText(`★ LEVEL ${this.currentLevel} UNLOCKED! ★`, this.player.x, this.player.y - 70, nextLvl.primaryColor);
    this.spawnFloatingText(`+${nextLvl.clearRewardScrap} SCRAP BONUS`, this.player.x, this.player.y - 40, '#ffb400');

    // Level Clear Coin Award
    const coinBonus = calculateLevelCoinBonus(this.currentLevel - 1);
    this.stats.coins += coinBonus;
    this.stats.coinsEarnedThisRun += coinBonus;
    this.writeStorageSafe('nabilbot_coins', String(this.stats.coins));
    this.coinsDirty = false;
    this.coinsSaveTimer = 0;
    this.spawnFloatingText(`+${coinBonus} COINS LEVEL BONUS!`, this.player.x, this.player.y - 100, '#ffd700');

    // Achievements for sector completion and true No-Hit Run (0 damage taken in the cleared sector)
    this.trackGlobalEvent('clear_sectors', 1);
    try {
      recordAchievementEvent({ type: 'level_clear', amount: this.currentLevel - 1 });
      if (!this.tookDamageInSector) {
        const noHitRes = recordAchievementEvent({ type: 'no_hit_clear', amount: 1 });
        if (noHitRes.newlyUnlocked.length > 0) {
          this.spawnFloatingText('🛡️ UNTOUCHABLE NO-HIT MEDAL EARNED!', this.player.x, this.player.y - 130, '#00ff88');
        }
        if (noHitRes.rewardCoinsTotal > 0) {
          this.stats.coins += noHitRes.rewardCoinsTotal;
        }
      }
    } catch {
      // ignore
    }
    this.tookDamageInSector = false;

    this.spawnFloatingText(`WARPING TO ${nextLvl.name}`, this.player.x, this.player.y + 40, '#ffffff');

    this.emitBurst(this.player.x, this.player.y, nextLvl.primaryColor, 35, 2.2);

    // Vacuum remaining pickups & ALWAYS offer a Cyber-Chip Augment Draft on Level Clear
    this.vacuumAllPickups();
    const clearedLevel = Math.max(1, this.currentLevel - 1);
    this.openAugmentDraft('level_clear', clearedLevel);

    if (nextLvl.hasBoss) {
      this.spawnNextWaveEnemy();
    }
  }

  private flushPendingPersistence() {
    if (this.pendingProgress.dirty) {
      const buf = this.pendingProgress;
      this.pendingProgress = createPendingCombatProgressBuffer();
      this.progressFlushTimer = 0;

      if (buf.missionKillsTotal > 0) recordMissionProgress('kill_total', buf.missionKillsTotal);
      if (buf.missionKillsSwarmer > 0) recordMissionProgress('kills_swarmer', buf.missionKillsSwarmer);
      if (buf.missionKillsSniper > 0) recordMissionProgress('kills_sniper', buf.missionKillsSniper);
      if (buf.missionKillsTank > 0) recordMissionProgress('kills_tank', buf.missionKillsTank);
      if (buf.missionKillsPhantom > 0) recordMissionProgress('kills_phantom', buf.missionKillsPhantom);
      if (buf.missionKillsBoss > 0) recordMissionProgress('kills_boss', buf.missionKillsBoss);
      if (buf.missionCoinsCollected > 0) recordMissionProgress('collect_coins', buf.missionCoinsCollected);

      if (buf.eventKillsTotal > 0) this.trackGlobalEvent('kills_total', buf.eventKillsTotal);
      if (buf.eventKillsSwarmer > 0) this.trackGlobalEvent('kills_swarmer', buf.eventKillsSwarmer);
      if (buf.eventKillsSniper > 0) this.trackGlobalEvent('kills_sniper', buf.eventKillsSniper);
      if (buf.eventKillsTank > 0) this.trackGlobalEvent('kills_tank', buf.eventKillsTank);
      if (buf.eventKillsPhantom > 0) this.trackGlobalEvent('kills_phantom', buf.eventKillsPhantom);
      if (buf.eventKillsBoss > 0) this.trackGlobalEvent('kills_boss', buf.eventKillsBoss);
      if (buf.eventCoinsCollected > 0) this.trackGlobalEvent('collect_coins', buf.eventCoinsCollected);
      if (buf.eventMaxCombo > 0) this.trackGlobalEvent('combo_streak', buf.eventMaxCombo);

      try {
        const unlockedHere: Array<{ title: string }> = [];
        let medalCoins = 0;
        if (buf.achKills > 0) {
          const r = recordAchievementEvent({ type: 'kill', amount: buf.achKills });
          unlockedHere.push(...r.newlyUnlocked);
          medalCoins += r.rewardCoinsTotal;
        }
        if (buf.achMaxCombo >= 5) {
          const r = recordAchievementEvent({ type: 'combo_streak', amount: buf.achMaxCombo });
          unlockedHere.push(...r.newlyUnlocked);
          medalCoins += r.rewardCoinsTotal;
        }
        if (buf.achBehemoth > 0) {
          const r = recordAchievementEvent({ type: 'kill_behemoth', amount: buf.achBehemoth });
          unlockedHere.push(...r.newlyUnlocked);
          medalCoins += r.rewardCoinsTotal;
        }
        if (buf.achPhantom > 0) {
          const r = recordAchievementEvent({ type: 'kill_phantom', amount: buf.achPhantom });
          unlockedHere.push(...r.newlyUnlocked);
          medalCoins += r.rewardCoinsTotal;
        }
        if (buf.achStormDrone > 0) {
          const r = recordAchievementEvent({ type: 'kill_storm_drone', amount: buf.achStormDrone });
          unlockedHere.push(...r.newlyUnlocked);
          medalCoins += r.rewardCoinsTotal;
        }
        if (buf.achBossLevel > 0) {
          const r = recordAchievementEvent({ type: 'kill_boss', amount: buf.achBossLevel });
          unlockedHere.push(...r.newlyUnlocked);
          medalCoins += r.rewardCoinsTotal;
        }
        if (buf.achCoins > 0) {
          const r = recordAchievementEvent({ type: 'coins_collected', amount: buf.achCoins });
          unlockedHere.push(...r.newlyUnlocked);
          medalCoins += r.rewardCoinsTotal;
        }
        if (unlockedHere.length > 0 && this.state === 'playing') {
          soundEngine.playVictory();
          this.spawnFloatingText(`🎖️ MEDAL: ${unlockedHere[0].title}!`, this.player.x, this.player.y - 80, '#ffd700');
        }
        if (medalCoins > 0) {
          this.stats.coins += medalCoins;
          this.coinsDirty = true;
          if (this.state === 'playing') {
            this.spawnFloatingText(`+${medalCoins} MEDAL COINS`, this.player.x, this.player.y - 110, '#ffd700');
          }
        }
      } catch {
        // ignore achievement sync error
      }
    }

    if (this.masteryDirty) {
      try {
        saveWeaponMastery(this.weaponMastery);
      } catch {
        // ignore mastery save error
      }
      this.masteryDirty = false;
      this.masterySaveTimer = 0;
    }
    if (this.coinsDirty) {
      this.writeStorageSafe('nabilbot_coins', String(this.stats.coins));
      this.coinsDirty = false;
      this.coinsSaveTimer = 0;
    }
  }

  public pauseGame() {
    if (this.state !== 'playing') return;
    this.flushPendingPersistence();
    this.state = 'paused';
    document.body.dataset.state = 'paused';
    this.onStateChange('paused');
    this.heldKeys.clear();
    this.mouse.isDown = false;
    this.virtualMoveX = 0;
    this.virtualMoveY = 0;
    this.virtualFiring = false;
  }

  public resumeGame() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    document.body.dataset.state = 'playing';
    this.onStateChange('playing');
    this.lastTime = performance.now();
  }

  public restartRun() {
    if (this.isDuelMode && this.duelConfig) {
      if (this.duelConfig.isSpectator) return;
      if (this.duelConfig.mode === 'online' && this.duelClient) {
        this.duelClient.requestRematch();
      } else {
        this.startDuel(this.duelConfig);
      }
      return;
    }
    if (this.isBossRushMode) {
      this.startRun(1, undefined, false, true);
      return;
    }
    this.startRun(this.currentLevel, undefined, this.isEndlessMode, false);
  }

  public returnToTitle() {
    this.isDuelMode = false;
    this.duelMatchFormat = 'pvpve_1v1';
    this.duelMapTheme = 'sector';
    this.duelObstacles = [];
    this.duelTacticalWalls = [];
    this.duelWallChargeBySlot.clear();
    this.duelRoster.clear();
    this.duelExtraActors.clear();
    this.arenaFloorCacheKey = '';
    this.isEndlessMode = false;
    this.isBossRushMode = false;
    this.activeBounty = null;
    this.virtualMoveX = 0;
    this.virtualMoveY = 0;
    this.virtualFiring = false;
    this.duelConfig = null;
    this.duelSpectatorCount = 0;
    this.duelSpectatorCamera = 'both';
    this.duelCameraMode = 'both';
    this.duelFreePointerMove = true;
    this.duelKillFeed = [];
    this.duelEventTracker = createDuelEventTracker();
    this.cameraScale = 1;
    if (this.duelClient) {
      this.duelClient.disconnect();
      this.duelClient = null;
    }
    this.state = 'title';
    document.body.dataset.state = 'title';
    this.onStateChange('title');
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.finisherShockwaves = [];
    this.duelP1Trail = [];
    this.duelP2Trail = [];
    this.revivesUsedThisRun = 0;
    this.flushPendingPersistence();
    this.resetAllWeaponThermals();
    this.cyberStorm = createInitialCyberStormState();
    this.dashOverchargeTimer = 0;
    this.isCurrentDashOvercharged = false;
    this.activeAugments = createEmptyAugments();
    this.pendingAugmentChoices = null;
    this.augmentDraftReason = null;
    this.augmentClearedLevel = null;
    this.augmentOpenedAtMs = 0;
    this.overdriveTimer = 0;
    this.multiKillState = createInitialMultiKillState();
    this.goldenCores = [];
    this.arenaBarrels = [];
    this.activeBoosters = [];
    this.electricArcs = [];
    this.syncCombatTelemetryToStats();
    this.stats.comboFinisherCharge = 0;
    this.stats.comboFinisherReady = false;
  }

  private initBossRushStage(stage: number) {
    const titan = getBossRushStageDef(stage);
    this.bossRushStage = stage;
    this.bossRushBossName = titan.name;
    this.currentWave = stage;
    this.currentLevel = titan.arenaLevel;
    this.stats.level = titan.arenaLevel;
    this.stats.levelName = titan.name;
    this.stats.levelKills = 0;
    this.stats.levelQuota = 1 + titan.escortCount;
    this.waveBudgetRemaining = 0;
    this.waveSpawnTimer = 0.4;
    this.waveClearDelay = 0;
    this.bossActive = true;
    this.endlessBossesPending = 0;
    this.enemiesSpawnedThisWave = 0;
    this.spawnSquadQueue = [];
    this.lastAnnouncedPattern = null;
    this.projectiles = this.projectiles.filter((p) => !p.isEnemy);

    const bossAngle = Math.random() * Math.PI * 2;
    const bx = Math.min(ARENA_WIDTH - 140, Math.max(140, this.player.x + Math.cos(bossAngle) * 460));
    const by = Math.min(ARENA_HEIGHT - 140, Math.max(140, this.player.y + Math.sin(bossAngle) * 380));
    const baseStats = calculateEnemyStats('goliath', titan.arenaLevel, stage * 2, this.difficulty);
    const bossHp = Math.round(baseStats.hp * titan.hpMultiplier);
    const bossSpeed = Math.round(baseStats.speed * titan.speedMultiplier);

    this.enemies.push({
      id: this.nextId++,
      type: 'goliath',
      x: bx,
      y: by,
      vx: 0,
      vy: 0,
      radius: 44 + Math.min(8, stage),
      hp: bossHp,
      maxHp: bossHp,
      speed: bossSpeed,
      color: titan.color,
      angle: Math.atan2(this.player.y - by, this.player.x - bx),
      targetAngle: 0,
      state: 'seek',
      telegraphTimer: 0,
      telegraphDuration: baseStats.telegraphDuration,
      cooldownTimer: 1.0,
      koTimer: 0,
      contactDamage: baseStats.contactDamage,
      projectileDamage: baseStats.projectileDamage,
      projectileSpeed: Math.round(baseStats.projectileSpeed * (1 + (stage - 1) * 0.05)),
      slamDamage: baseStats.slamDamage,
      bossTitle: titan.name,
    });
    this.emitBurst(bx, by, titan.color, 26, 2.0);
    this.emitParticle(bx, by, 0, 0, 120, titan.color, 0.45, 'ring');

    const escortTypes: EnemyType[] = ['tank', 'storm_drone', 'shield_breaker', 'sniper', 'phantom'];
    for (let i = 0; i < titan.escortCount; i++) {
      const eType = escortTypes[(stage + i) % escortTypes.length];
      const eStats = calculateEnemyStats(eType, titan.arenaLevel, stage, this.difficulty);
      const ang = bossAngle + (i - (titan.escortCount - 1) / 2) * 0.55;
      const ex = Math.min(ARENA_WIDTH - 100, Math.max(100, this.player.x + Math.cos(ang) * 520));
      const ey = Math.min(ARENA_HEIGHT - 100, Math.max(100, this.player.y + Math.sin(ang) * 430));
      const eRadius =
        eType === 'tank'
          ? 26
          : eType === 'shield_breaker'
          ? 25
          : eType === 'storm_drone'
          ? 22
          : eType === 'phantom'
          ? 20
          : 18;
      const eColor =
        eType === 'tank'
          ? '#ffb400'
          : eType === 'shield_breaker'
          ? '#38bdf8'
          : eType === 'storm_drone'
          ? '#00f3ff'
          : eType === 'phantom'
          ? '#b026ff'
          : '#ff0077';
      const kbHp = eType === 'shield_breaker' ? computeShieldBreakerBarrierHp(eStats.hp) : undefined;
      this.enemies.push({
        id: this.nextId++,
        type: eType,
        x: ex,
        y: ey,
        vx: 0,
        vy: 0,
        radius: eRadius,
        hp: eStats.hp,
        maxHp: eStats.hp,
        speed: eStats.speed,
        color: eColor,
        angle: 0,
        targetAngle: 0,
        state: 'seek',
        telegraphTimer: 0,
        telegraphDuration: eStats.telegraphDuration,
        cooldownTimer: 0.9,
        koTimer: 0,
        contactDamage: eStats.contactDamage,
        projectileDamage: eStats.projectileDamage,
        projectileSpeed: eStats.projectileSpeed,
        slamDamage: eStats.slamDamage,
        shieldAngle: 0,
        shieldArc: eType === 'tank' ? Math.PI * 0.65 : undefined,
        kineticBarrierHp: kbHp,
        kineticBarrierMaxHp: kbHp,
        kineticBarrierDownTimer: 0,
        kineticBarrierMaxDownSec: 5.0,
      });
    }

    this.replenishArenaBarrels(3);
    this.spawnFloatingText(
      `👑 TITAN ${stage}/${this.bossRushTotalStages} · ${titan.name.toUpperCase()}`,
      this.player.x,
      this.player.y - 76,
      titan.color
    );
    soundEngine.playTelegraphTone();
  }

  private initWave(wave: number) {
    if (this.isBossRushMode) {
      this.initBossRushStage(wave);
      return;
    }

    this.currentWave = wave;
    this.shieldBreakerSpawnedThisWave = false;
    if (this.isEndlessMode) {
      const cfg = computeEndlessWaveConfig(wave, this.difficulty);
      this.currentLevel = cfg.effectiveLevel;
      this.stats.level = cfg.effectiveLevel;
      this.stats.levelName = 'ENDLESS OVERDRIVE ARENA';
      this.waveBudgetRemaining = cfg.totalBudget;
      this.waveSpawnTimer = cfg.spawnDelaySec;
      this.waveClearDelay = 0;
      this.bossActive = cfg.isBossWave;
      this.endlessBossesPending = cfg.bossCount;
      this.enemiesSpawnedThisWave = 0;
      this.spawnSquadQueue = [];
      this.lastAnnouncedPattern = null;
      this.totalEnemiesInWave = Math.max(8, Math.floor(cfg.totalBudget / 150));
      this.stats.levelKills = 0;
      this.stats.levelQuota = this.totalEnemiesInWave;
      this.replenishArenaBarrels(3);
      this.spawnFloatingText(
        cfg.isBossWave ? `♾️ ENDLESS WAVE ${wave} · BOSS INCOMING!` : `♾️ ENDLESS WAVE ${wave}`,
        this.player.x,
        this.player.y - 60,
        cfg.isBossWave ? '#ff0077' : '#00f3ff'
      );
      return;
    }

    const budget = calculateWaveBudget(wave, this.currentLevel, this.difficulty);
    this.waveBudgetRemaining = budget.totalBudget;
    const diffMod = getDifficultyModifier(this.difficulty);
    this.waveSpawnTimer = Number((0.8 * diffMod.spawnDelayMultiplier).toFixed(3));
    this.waveClearDelay = 0;
    this.bossActive = wave % 5 === 0;
    this.endlessBossesPending = 0;
    this.enemiesSpawnedThisWave = 0;
    this.spawnSquadQueue = [];
    this.lastAnnouncedPattern = null;

    // Estimate total enemies
    this.totalEnemiesInWave = Math.max(5, Math.floor(budget.totalBudget / 160));
    this.replenishArenaBarrels(3);

    this.spawnFloatingText(`WAVE ${wave} INITIATED`, this.player.x, this.player.y - 60, '#00f3ff');
  }

  private triggerGameOver(victory: boolean = false) {
    this.state = victory ? 'victory' : 'gameover';
    document.body.dataset.state = this.state;
    this.onStateChange(this.state);

    this.totalRunTime = (performance.now() - this.runStartTime) / 1000;
    if (this.stats.score > this.bestScore) {
      this.bestScore = this.stats.score;
      if (typeof window !== 'undefined') {
        localStorage.setItem('neon_vanguard_best', String(this.bestScore));
      }
    }

    if (this.isEndlessMode) {
      const rec = recordEndlessMilestone({
        wave: this.currentWave,
        score: this.stats.score,
      });
      this.endlessBestWave = rec.bestWave;
    } else if (this.isBossRushMode) {
      const rec = recordBossRushMilestone({
        stageCleared: victory ? this.bossRushTotalStages : Math.max(0, this.bossRushStage - 1),
        victory,
        clearSeconds: victory ? this.totalRunTime : undefined,
      });
      this.bossRushBestStage = rec.bestStage;
    }

    if (victory) {
      const victoryCoins = this.isBossRushMode ? 350 : calculateLevelCoinBonus(this.currentLevel);
      this.stats.coins += victoryCoins;
      this.stats.coinsEarnedThisRun += victoryCoins;
      if (typeof window !== 'undefined') {
        localStorage.setItem('nabilbot_coins', String(this.stats.coins));
      }
      try {
        if (!this.isBossRushMode) {
          recordAchievementEvent({ type: 'level_clear', amount: this.currentLevel });
        }
        if (!this.tookDamageInSector) {
          const noHitRes = recordAchievementEvent({ type: 'no_hit_clear', amount: 1 });
          if (noHitRes.rewardCoinsTotal > 0) {
            this.stats.coins += noHitRes.rewardCoinsTotal;
          }
        }
      } catch {
        // ignore
      }
      this.spawnFloatingText(`+${victoryCoins} VICTORY COINS!`, this.player.x, this.player.y - 100, '#ffd700');
      soundEngine.playVictory();
    } else {
      soundEngine.playDefeat();
    }

    // Automatically sync battle results with Commander Profile
    this.flushPendingPersistence();
    try {
      recordBattleResult(
        this.stats.kills,
        this.currentLevel,
        this.stats.score,
        this.stats.coinsEarnedThisRun
      );
    } catch {
      // ignore sync error
    }
  }

  public getRunSnapshot(): RunSnapshot {
    const diamonds = loadDiamonds();
    const reviveInfo = getDiamondReviveCost(this.revivesUsedThisRun, MAX_DIAMOND_REVIVES_PER_RUN);
    return {
      score: this.stats.score,
      bestScore: Math.max(this.bestScore, this.stats.score),
      level: this.currentLevel,
      levelName: this.isBossRushMode
        ? `BOSS RUSH TITAN ${this.bossRushStage}/${this.bossRushTotalStages}`
        : this.isEndlessMode
        ? 'ENDLESS OVERDRIVE ARENA'
        : getLevelDef(this.currentLevel).name,
      wave: this.currentWave,
      kills: this.stats.kills,
      highestCombo: this.stats.highestCombo,
      timeSurvivedSeconds: Math.round(this.totalRunTime || (performance.now() - this.runStartTime) / 1000),
      scrapCollected: this.stats.scrap,
      coinsEarned: this.stats.coinsEarnedThisRun,
      totalCoins: this.stats.coins,
      diamonds,
      revivesUsed: this.revivesUsedThisRun,
      reviveCost: reviveInfo.cost,
      revivesRemaining: reviveInfo.remainingRevives,
      maxRevives: reviveInfo.maxRevives,
      activeCraft: this.activeCraft,
      difficulty: this.difficulty,
      isEndless: this.isEndlessMode,
      endlessBestWave: Math.max(this.endlessBestWave, this.isEndlessMode ? this.currentWave : 0),
      isBossRush: this.isBossRushMode,
      bossRushStage: this.bossRushStage,
      bossRushTotalStages: this.bossRushTotalStages,
      bossRushBestStage: Math.max(this.bossRushBestStage, this.isBossRushMode ? this.bossRushStage : 0),
      bossRushVictory: this.isBossRushMode && this.state === 'victory',
    };
  }

  /**
   * Spends Diamonds after a campaign defeat to revive NaBil-BOT with a full new life
   * and resume the current level & wave progress safely.
   */
  public reviveWithDiamonds(): {
    success: boolean;
    remainingDiamonds: number;
    costPaid: number;
    revivesUsed: number;
    error?: string;
  } {
    const currentDiamonds = loadDiamonds();
    if (this.state !== 'gameover' || this.isDuelMode) {
      return {
        success: false,
        remainingDiamonds: currentDiamonds,
        costPaid: 0,
        revivesUsed: this.revivesUsedThisRun,
        error: 'Diamond revive is only available upon mission defeat.',
      };
    }

    const check = canPurchaseDiamondRevive({
      diamonds: currentDiamonds,
      revivesUsed: this.revivesUsedThisRun,
      maxRevives: MAX_DIAMOND_REVIVES_PER_RUN,
    });
    if (!check.allowed) {
      return {
        success: false,
        remainingDiamonds: currentDiamonds,
        costPaid: 0,
        revivesUsed: this.revivesUsedThisRun,
        error:
          check.reason === 'max_revives'
            ? `Maximum ${check.maxRevives} Diamond Revives already used in this run.`
            : `Insufficient diamonds! Need ${check.cost} 💎, have ${currentDiamonds} 💎.`,
      };
    }

    const spendRes = spendDiamonds(check.cost);
    if (!spendRes.success) {
      return {
        success: false,
        remainingDiamonds: spendRes.remaining,
        costPaid: 0,
        revivesUsed: this.revivesUsedThisRun,
        error: spendRes.error,
      };
    }

    this.revivesUsedThisRun += 1;
    this.cachedDiamondRelics = loadDiamondRelics();
    this.stats.diamonds = spendRes.remaining;
    this.resetAllWeaponThermals();
    this.syncCombatTelemetryToStats();

    // Restore full HP, Shield, Dash readiness, and clear hostile threats near player
    this.stats.currentHp = this.stats.maxHp;
    this.stats.currentShield = this.stats.maxShield;
    this.stats.shieldCooldownTimer = 0;
    this.stats.dashCooldownTimer = 0;
    this.stats.dashTimer = 0;
    this.dashBufferTimer = 0;
    this.dashOverchargeTimer = 0;
    this.isCurrentDashOvercharged = false;
    this.player.isDashing = false;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invulnerableTimer = 2.5;

    // Clear active enemy projectiles & reset sticky inputs so the player isn't trapped
    this.projectiles = this.projectiles.filter((p) => !p.isEnemy);
    this.heldKeys.clear();
    this.heldCodes.clear();
    this.justPressedKeys.clear();
    this.mouse.isDown = false;

    // Radial knockback to push nearby threats away on revive
    const safeRadius = 380;
    for (const enemy of this.enemies) {
      if (enemy.state === 'ko') continue;
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < safeRadius) {
        const angle = dist > 0.01 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
        const pushDist = safeRadius - dist + 70;
        enemy.x = Math.max(40, Math.min(ARENA_WIDTH - 40, enemy.x + Math.cos(angle) * pushDist));
        enemy.y = Math.max(40, Math.min(ARENA_HEIGHT - 40, enemy.y + Math.sin(angle) * pushDist));
        enemy.vx += Math.cos(angle) * 320;
        enemy.vy += Math.sin(angle) * 320;
      }
    }

    // Resume live simulation without losing level / kill quota / score / scrap
    this.state = 'playing';
    document.body.dataset.state = 'playing';
    this.lastTime = performance.now();
    this.onStateChange('playing');

    const activeEnemies = this.countAliveEnemies();
    this.onStatsSync(this.stats, this.currentWave, activeEnemies, this.bossActive);

    // Visual & Audio celebration feedback
    soundEngine.playVictory();
    this.addCameraTrauma(0.35);
    this.finisherShockwaves.push({
      x: this.player.x,
      y: this.player.y,
      maxRadius: safeRadius,
      life: 0.45,
      maxLife: 0.45,
      color: '#38bdf8',
      secondaryColor: '#facc15',
    });
    this.emitBurst(this.player.x, this.player.y, '#38bdf8', 36, 2.2);
    this.spawnFloatingText(
      `💎 NEW LIFE RESTORED! (-${check.cost} 💎)`,
      this.player.x,
      this.player.y - 68,
      '#38bdf8'
    );

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    return {
      success: true,
      remainingDiamonds: spendRes.remaining,
      costPaid: check.cost,
      revivesUsed: this.revivesUsedThisRun,
    };
  }

  private resetAllWeaponThermals() {
    this.weaponThermals = this.createThermalMap();
  }

  private syncCombatTelemetryToStats() {
    const activeWep = this.stats.activeWeapon;
    const thermal = this.weaponThermals[activeWep] || createInitialWeaponThermalState();
    const rec = this.weaponMastery[activeWep] || { xp: 0, level: 0, shots: 0, hits: 0, kills: 0 };
    const tier = getMasteryTierForXp(rec.xp);

    this.stats.weaponHeat = thermal.heat;
    this.stats.weaponOverheated = thermal.isOverheated;
    this.stats.weaponOverheatTimer = thermal.overheatTimer;

    this.stats.weaponMasteryLevel = tier.level;
    this.stats.weaponMasteryTitle = tier.title;
    this.stats.weaponMasteryProgress = tier.progressPercent;
    this.stats.weaponMasteryXp = tier.xp;
    this.stats.weaponMasteryNextXp = tier.nextXp;
    this.stats.weaponMasteryHeatReduction = tier.heatReduction;
    this.stats.weaponMasteryCritChance = tier.critChance;

    this.stats.cyberStormActive = this.cyberStorm.phase === 'storm';
    this.stats.cyberStormPhase = this.cyberStorm.phase;
    this.stats.cyberStormTimeLeft = Number(this.cyberStorm.timer.toFixed(1));
    this.stats.cyberStormInWindZone = this.cyberStormInWindZone;
    this.stats.cyberStormWindLabel = this.cyberStormWindLabel;
    this.stats.cyberStormSpeedMult = this.cyberStormSpeedMult;

    this.stats.dashOvercharged = this.dashOverchargeTimer > 0;
    this.stats.dashOverchargeTimer = Number(this.dashOverchargeTimer.toFixed(2));
    this.stats.dashOverchargeDuration = DASH_OVERCHARGE_DURATION_SEC;
    this.stats.dashRangeMultiplier = this.dashOverchargeTimer > 0 ? DASH_OVERCHARGE_RANGE_MULT : 1.0;
    this.stats.comboWindowSeconds = this.cachedDiamondRelics.chrono_flux ? 5.5 : 3.0;

    this.stats.activeAugments = this.activeAugments;
    this.stats.pendingAugmentChoices = this.pendingAugmentChoices;
    this.stats.augmentDraftReason = this.augmentDraftReason;
    this.stats.augmentClearedLevel = this.augmentClearedLevel;
    this.stats.overdriveTimer = Number(this.overdriveTimer.toFixed(2));
    this.stats.overdriveDuration = OVERDRIVE_DURATION_SEC;
    this.stats.multiKillCount = this.multiKillState.count;
    this.stats.multiKillLabel = this.multiKillState.label;
    this.stats.multiKillTimer = Number(this.multiKillState.timer.toFixed(2));
    this.stats.wingmanDroneCount = this.cachedAugMods.wingmanCount;
    this.stats.goldenCoresDestroyed = this.goldenCoresDestroyed;
    this.stats.activeCraftSkin = this.activeCraftSkin;
    this.stats.isEndless = this.isEndlessMode;
    this.stats.endlessBestWave = Math.max(this.endlessBestWave, this.isEndlessMode ? this.currentWave : 0);
    this.stats.isBossRush = this.isBossRushMode;
    this.stats.bossRushStage = this.bossRushStage;
    this.stats.bossRushTotalStages = this.bossRushTotalStages;
    this.stats.bossRushBestStage = Math.max(this.bossRushBestStage, this.isBossRushMode ? this.bossRushStage : 0);
    this.stats.bossRushBossName = this.bossRushBossName;
    this.stats.activeBounty = this.activeBounty ? { ...this.activeBounty } : null;
    this.stats.radarEnabled = this.radarEnabled;
    this.stats.activeBoosters = this.activeBoosters;
    this.stats.activeCompanion = this.storeGear.activeCompanion;
    this.stats.activeTrail = this.storeGear.activeTrail;
    this.stats.activeModules = (Object.keys(this.storeGear.unlockedModules) as Array<keyof typeof this.storeGear.unlockedModules>).filter(
      (k) => this.storeGear.unlockedModules[k]
    );
    this.stats.barrelsDetonated = this.barrelsDetonated;
  }

  public openAugmentDraft(
    reason: 'level_clear' | 'wave_clear' | 'headstart' = 'wave_clear',
    clearedLevel?: number
  ): boolean {
    if (this.isDuelMode || this.state !== 'playing') return false;
    const choices = rollAugmentDraftChoices(this.activeAugments, 3, Math.random, true);
    if (choices.length === 0) return false;
    this.pendingAugmentChoices = choices;
    this.augmentDraftReason = reason;
    this.augmentClearedLevel =
      reason === 'level_clear' ? (clearedLevel ?? Math.max(1, this.currentLevel - 1)) : null;
    this.augmentOpenedAtMs = performance.now();
    this.heldKeys.clear();
    this.heldCodes.clear();
    this.justPressedKeys.clear();
    this.mouse.isDown = false;
    soundEngine.playAugmentDraft();
    this.syncCombatTelemetryToStats();
    this.onStatsSync(this.stats, this.currentWave, this.countAliveEnemies(), this.bossActive);
    return true;
  }

  public selectAugment(id: CyberAugmentId): boolean {
    if (this.isDuelMode) return false;
    const chipDef = CYBER_AUGMENTS[id];
    const prevStack = this.activeAugments[id] || 0;
    this.activeAugments = applyAugmentSelection(this.activeAugments, id, true);
    this.refreshCachedModifiers();
    const newStack = this.activeAugments[id] || 1;
    const isOverclockSurge = chipDef ? newStack > chipDef.maxStacks : false;

    this.pendingAugmentChoices = null;
    this.augmentDraftReason = null;
    this.augmentClearedLevel = null;
    this.lastTime = performance.now();
    this.player.invulnerableTimer = Math.max(this.player.invulnerableTimer, 1.2);
    soundEngine.playAugmentSelect();

    if (isOverclockSurge) {
      this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + 1);
      this.stats.currentShield = Math.min(this.stats.maxShield, this.stats.currentShield + 25);
    }

    const mods = this.cachedAugMods;
    const chipColor = isOverclockSurge ? '#fbbf24' : chipDef?.color ?? '#00f3ff';
    const chipName = chipDef?.name ?? id.replace(/_/g, ' ').toUpperCase();
    this.emitBurst(this.player.x, this.player.y, chipColor, 26, 1.8);
    this.finisherShockwaves.push({
      x: this.player.x,
      y: this.player.y,
      maxRadius: 165,
      life: 0.35,
      maxLife: 0.35,
      color: chipColor,
      secondaryColor: '#ffffff',
    });
    this.spawnFloatingText(
      isOverclockSurge
        ? `⚡ OVERCLOCK SURGE · ${chipName} LVL ${prevStack}→${newStack}`
        : `⚡ CHIP ONLINE · ${chipName} LVL ${newStack}`,
      this.player.x,
      this.player.y - 64,
      chipColor
    );
    if (mods.wingmanCount > 0 && id === 'wingman_drone') {
      this.spawnFloatingText(
        `🛸 WINGMAN DRONE x${mods.wingmanCount} DEPLOYED!`,
        this.player.x,
        this.player.y - 94,
        '#00f3ff'
      );
    }
    this.trackGlobalEvent('augments_installed', 1);
    this.syncCombatTelemetryToStats();
    this.onStatsSync(this.stats, this.currentWave, this.countAliveEnemies(), this.bossActive);
    return true;
  }

  public spawnGoldenCore(): GoldenDataCore {
    const core = createGoldenDataCore(
      this.nextId++,
      ARENA_WIDTH,
      ARENA_HEIGHT,
      this.currentLevel,
      this.difficulty
    );
    this.goldenCores.push(core);
    soundEngine.playGoldenCoreSpawn();
    this.emitBurst(core.x, core.y, '#ffd700', 22, 1.7);
    this.spawnFloatingText('💎 GOLDEN DATA-CORE WARPED IN! SHOOT IT!', core.x, core.y - 42, '#ffd700');
    return core;
  }

  private vacuumAllPickups() {
    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      const dx = this.player.x - p.x;
      const dy = this.player.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 1) {
        p.x += (dx / dist) * Math.min(dist, dist * 0.45);
        p.y += (dy / dist) * Math.min(dist, dist * 0.45);
      }
    }
  }

  private awardMastery(weapon: WeaponType, action: 'shot' | 'hit' | 'kill') {
    if (this.isDuelMode && this.duelConfig?.isSpectator) return;
    const res = awardWeaponMasteryXp(this.weaponMastery, weapon, action, 1);
    this.weaponMastery = res.updatedMap;
    this.masteryDirty = true;
    if (res.leveledUp) {
      saveWeaponMastery(this.weaponMastery);
      this.masteryDirty = false;
      const wepName = WEAPONS[weapon].name.toUpperCase();
      const perks = formatMasteryPerksSummary(res.tier).join(' · ');
      soundEngine.playVictory();
      this.emitBurst(this.player.x, this.player.y, res.tier.badgeColor, 24, 1.6);
      this.spawnFloatingText(
        `★ ${wepName} MASTERY LVL ${res.newLevel} (${res.tier.title})! ${perks}`,
        this.player.x,
        this.player.y - 76,
        res.tier.badgeColor
      );
      this.syncCombatTelemetryToStats();
    }
  }

  /**
   * Triggers a Procedural Cyber-Storm immediately (used organically or for direct storm testing).
   */
  public triggerCyberStorm(durationSeconds: number = 16, includeCenterZone: boolean = false) {
    const zones = generateCyberStormZones(ARENA_WIDTH, ARENA_HEIGHT, 3);
    if (includeCenterZone && zones.length > 0) {
      zones[0] = {
        ...zones[0],
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        radius: 280,
      };
    }
    this.cyberStorm = {
      phase: 'storm',
      timer: durationSeconds,
      maxTimer: durationSeconds,
      nextStrikeTimer: 0.4,
      flashAlpha: 0.25,
      windZones: zones,
      lightningBolts: [generateLightningBolt(ARENA_WIDTH, ARENA_HEIGHT)],
    };
    soundEngine.playCyberThunder();
    this.addCameraTrauma(0.14);
    this.spawnFloatingText('⛈️ CYBER-STORM SURGE! WIND ZONES ACTIVE', this.player.x, this.player.y - 74, '#38bdf8');
    this.syncCombatTelemetryToStats();
  }

  public buyUpgrade(upgradeId: UpgradeId): boolean {
    const res = purchaseUpgrade(this.stats, upgradeId);
    if (res.success) {
      this.stats = res.newStats;
      soundEngine.playPickup();
      this.spawnFloatingText(
        `UPGRADED ${UPGRADES[upgradeId].name.toUpperCase()}`,
        this.player.x,
        this.player.y - 40,
        '#00f3ff'
      );
      return true;
    }
    return false;
  }

  private countAliveEnemies(): number {
    let alive = 0;
    for (let i = 0; i < this.enemies.length; i++) {
      if (this.enemies[i].state !== 'ko') alive++;
    }
    return alive;
  }

  // --- Particle Emitter (Ring Buffer, Zero GC) ---
  public emitParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    color: string,
    life: number,
    type: Particle['type'] = 'spark'
  ) {
    const poolCap = Math.min(MAX_PARTICLES, this.adaptiveQuality.maxParticlesCap);
    const p = this.particles[this.particlePoolIndex % poolCap];
    this.particlePoolIndex = (this.particlePoolIndex + 1) % poolCap;

    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.size = size;
    p.maxSize = size;
    p.life = life;
    p.maxLife = life;
    p.color = color;
    p.alpha = 1;
    p.type = type;
  }

  public emitBurst(x: number, y: number, color: string, count: number, speedMultiplier: number = 1) {
    const scaledCount =
      this.adaptiveQuality.tier === 'performance'
        ? Math.max(1, Math.ceil(count * 0.4))
        : this.adaptiveQuality.tier === 'balanced'
        ? Math.max(1, Math.ceil(count * 0.65))
        : count;
    for (let i = 0; i < scaledCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (60 + Math.random() * 240) * speedMultiplier;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const size = 1.5 + Math.random() * 3.5;
      const life = 0.25 + Math.random() * 0.45;
      this.emitParticle(x, y, vx, vy, size, color, life, 'spark');
    }
  }

  private getActiveShakeProfile() {
    return getCameraShakeProfile(
      this.performanceMode,
      this.isMobileDevice,
      this.adaptiveQuality.tier
    );
  }

  private refreshCameraShakeSample() {
    const profile = this.getActiveShakeProfile();
    const sample = computeCameraShakeSample(
      this.camera.trauma,
      Math.random,
      this.camera.recoilX,
      this.camera.recoilY,
      profile.intensityScale,
      profile.allowCanvasRotation
    );
    this.camera.shakeOffsetX = sample.shakeOffsetX;
    this.camera.shakeOffsetY = sample.shakeOffsetY;
    this.camera.shakeAngle = sample.shakeAngle;
    this.camera.glitchAlpha = profile.allowGlitchOverlay ? sample.glitchAlpha : 0;
  }

  public addCameraTrauma(amount: number, maxTrauma: number = 1.0) {
    const profile = this.getActiveShakeProfile();
    if (profile.intensityScale <= 0 || profile.maxTraumaCap <= 0) return;
    const now = this.frameNowMs || performance.now();
    // Ignore minor shakes (dashes, regular hits, spawns) so gameplay never vibrates continuously
    if (amount <= 0.16) {
      return;
    }
    if (now < this.traumaBurstCooldownUntil) {
      return;
    }
    this.traumaBurstCooldownUntil = now + 180;
    const cappedMax = Math.min(maxTrauma, profile.maxTraumaCap);
    const scaledAmount = amount * 0.25;
    if (this.camera.trauma < cappedMax) {
      this.camera.trauma = Math.min(cappedMax, this.camera.trauma + scaledAmount);
    }
    this.refreshCameraShakeSample();
  }

  public addDirectionalCameraShake(
    traumaAmount: number,
    dirX: number,
    dirY: number,
    recoilPx: number = 0,
    maxTrauma: number = 1.0
  ) {
    const profile = this.getActiveShakeProfile();
    if (profile.intensityScale <= 0 || profile.maxTraumaCap <= 0) return;
    if (traumaAmount <= 0.12 && recoilPx <= 2) return;
    const cappedMax = Math.min(maxTrauma, profile.maxTraumaCap);
    const scaledTrauma = traumaAmount * 0.25;
    if (this.camera.trauma < cappedMax) {
      this.camera.trauma = Math.min(cappedMax, this.camera.trauma + scaledTrauma);
    }
    const scaledRecoil = recoilPx * 0.12;
    if (scaledRecoil > 0.05) {
      const mag = Math.hypot(dirX, dirY);
      if (mag > 0.001) {
        this.camera.recoilX = Math.max(-3, Math.min(3, this.camera.recoilX + (dirX / mag) * scaledRecoil));
        this.camera.recoilY = Math.max(-3, Math.min(3, this.camera.recoilY + (dirY / mag) * scaledRecoil));
      }
    }
    this.refreshCameraShakeSample();
  }

  public spawnFloatingText(text: string, x: number, y: number, color: string = '#00f3ff') {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const rawCap = Math.min(MAX_FLOATING_TEXTS, this.adaptiveQuality.maxFloatingTexts || MAX_FLOATING_TEXTS);
    const maxCap = Math.max(1, Number.isFinite(rawCap) ? Math.floor(rawCap) : MAX_FLOATING_TEXTS);
    let pruneGuard = 0;
    while (this.floatingTexts.length >= maxCap && pruneGuard < MAX_FLOATING_TEXTS) {
      this.floatingTexts.shift();
      pruneGuard++;
    }
    let resolvedY = y;
    for (let attempt = 0; attempt < 4; attempt++) {
      const collides = this.floatingTexts.some(
        (ft) =>
          !ft.isDamageText &&
          ft.life > 0.25 &&
          Math.abs(ft.x - x) < 110 &&
          Math.abs(ft.y - resolvedY) < 24
      );
      if (!collides) break;
      resolvedY -= 26;
    }
    this.floatingTexts.push({
      id: this.nextId++,
      text,
      x,
      y: resolvedY,
      color,
      alpha: 1,
      life: 0.9,
    });
  }

  public spawnDamageText(
    amount: number,
    x: number,
    y: number,
    category: DamageCategory,
    isCrit: boolean = false,
    comboMultiplier: number = 1.0
  ) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(amount)) return;
    const rawCap = Math.min(MAX_FLOATING_TEXTS, this.adaptiveQuality.maxFloatingTexts || MAX_FLOATING_TEXTS);
    const maxCap = Math.max(1, Number.isFinite(rawCap) ? Math.floor(rawCap) : MAX_FLOATING_TEXTS);
    if (this.floatingTexts.length >= maxCap) {
      // On mobile/performance saturation, drop minor non-crit ticks instead of spiking text rasterization
      if (!isCrit && (this.isMobileDevice || this.adaptiveQuality.tier === 'performance')) {
        return;
      }
      this.floatingTexts.shift();
    }
    const style = getDamageColor(category);
    const text = isCrit
      ? `CRIT -${amount}`
      : comboMultiplier > 1.2
      ? `-${amount} (x${comboMultiplier.toFixed(1)})`
      : `-${amount}`;

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.95;
    const speed = 75 + Math.random() * 45;

    this.floatingTexts.push({
      id: this.nextId++,
      text,
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 16 - 12,
      color: style.text,
      alpha: 1,
      life: 0.95,
      maxLife: 0.95,
      vx: Math.cos(angle) * speed * 0.5,
      vy: Math.sin(angle) * speed,
      scale: isCrit ? 1.4 : amount >= 100 ? 1.25 : 1.0,
      isDamageText: true,
      damageCategory: category,
      isCrit,
      fontSize: isCrit ? 19 : amount >= 100 ? 17 : 14,
    });
  }

  // --- Main Simulation Loop ---
  private startLoop() {
    this.lastTime = performance.now();
    const frame = (time: number) => {
      if (this.destroyed) return;
      try {
        const throttleMode = shouldThrottleCanvasRender({
          gameState: this.state,
          overlayCoveringCanvas: this.overlayCoveringCanvas,
          isTabHidden: typeof document !== 'undefined' && document.hidden,
        });

        if (throttleMode === 'pause') {
          this.lastTime = time;
          return;
        }

        if (throttleMode === 'throttle') {
          if (time - this.lastThrottledRenderAt < 110) {
            this.lastTime = time;
            return;
          }
          this.lastThrottledRenderAt = time;
        }

        const workStart = performance.now();
        this.frameNowMs = workStart;
        const rawDt = Math.max(0.0001, (time - this.lastTime) / 1000);
        this.lastTime = time;

        // Clamped delta time & coordinate integrity recovery
        const dt = Math.min(Number.isFinite(rawDt) ? rawDt : 0.016, 0.05);
        if (!Number.isFinite(this.player.x) || !Number.isFinite(this.player.y)) {
          this.player.x = ARENA_WIDTH / 2;
          this.player.y = ARENA_HEIGHT / 2;
          this.player.vx = 0;
          this.player.vy = 0;
        }

        this.update(dt);
        this.render();

        // Lightweight rolling System Health metrics (~0.5s window, zero allocations)
        this.perfFrameSeq++;
        const workMs = performance.now() - workStart;
        this.perfFrameCount++;
        this.perfAccumSec += rawDt;
        this.perfWorkMsAccum += workMs;
        if (rawDt > 0.034) {
          this.perfFrameDrops++;
        }
        if (this.perfAccumSec >= 0.5) {
          const frames = Math.max(1, this.perfFrameCount);
          this.perfLastFps = Math.round(frames / this.perfAccumSec);
          this.perfLastAvgFrameMs = (this.perfAccumSec * 1000) / frames;
          this.perfLastWorkMs = this.perfWorkMsAccum / frames;
          this.perfLastFrameDrops = this.perfFrameDrops;
          this.perfFrameCount = 0;
          this.perfAccumSec = 0;
          this.perfWorkMsAccum = 0;
          this.perfFrameDrops = 0;

          // Auto-adapt render quality (particles/trails/glows/text caps) without mid-game canvas buffer reallocation
          if (this.state === 'playing') {
            const baseDpr = getOptimalCanvasDpr(
              window.devicePixelRatio || 1,
              this.isMobileDevice,
              this.performanceMode
            );
            const candidate = computeAdaptiveQualityState({
              fps: this.perfLastFps,
              workMs: this.perfLastWorkMs,
              baseDpr,
              activeProjectiles: this.projectiles.length,
              isMobile: this.isMobileDevice,
              mode: this.performanceMode,
            });
            if (this.performanceMode !== 'auto') {
              this.adaptiveQuality = candidate;
            } else {
              if (candidate.tier !== 'high') {
                this.adaptiveLowPerfStreak = Math.min(4, this.adaptiveLowPerfStreak + 1);
              } else {
                this.adaptiveLowPerfStreak = Math.max(0, this.adaptiveLowPerfStreak - 1);
              }
              const requiredStreak = this.isMobileDevice || this.perfLastWorkMs > 14 ? 1 : 2;
              if (
                (candidate.tier !== 'high' && this.adaptiveLowPerfStreak >= requiredStreak) ||
                (candidate.tier === 'high' && this.adaptiveLowPerfStreak === 0)
              ) {
                this.adaptiveQuality = candidate;
              }
            }
          }
        }
      } catch (err) {
        // Recover loop cleanly so a transient entity/rendering anomaly can never permanently freeze the screen
        console.error('[NaBil-BOT Loop Recovery]', err);
        this.lastTime = time;
      } finally {
        this.justPressedKeys.clear();
        if (!this.destroyed) {
          this.animFrameId = requestAnimationFrame(frame);
        }
      }
    };

    this.animFrameId = requestAnimationFrame(frame);
  }

  public getSystemHealthSnapshot(): SystemHealthSnapshot {
    let activeParticles = 0;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (this.particles[i]?.active) activeParticles++;
    }
    const perfWithMemory = performance as Performance & {
      memory?: {
        usedJSHeapSize?: number;
        jsHeapSizeLimit?: number;
      };
    };
    const mem = perfWithMemory?.memory;
    return computeSystemHealthSnapshot({
      fps: this.perfLastFps,
      avgFrameMs: this.perfLastAvgFrameMs,
      workMs: this.perfLastWorkMs,
      frameDrops: this.perfLastFrameDrops,
      usedJsHeapBytes: typeof mem?.usedJSHeapSize === 'number' ? mem.usedJSHeapSize : null,
      jsHeapSizeLimitBytes: typeof mem?.jsHeapSizeLimit === 'number' ? mem.jsHeapSizeLimit : null,
      activeEnemies: this.enemies.length,
      activeProjectiles: this.projectiles.length,
      activeParticles,
      activePickups: this.pickups.length,
      canvasDpr: this.currentDpr,
    });
  }

  public clearTransientEffects(): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (p) p.active = false;
    }
    this.floatingTexts.length = 0;
    this.finisherShockwaves.length = 0;
  }

  // --- Update Step ---
  private update(dt: number) {
    // Ultra-fast crisp shake decay so camera never lingers in vibration
    const recoilDecay = Math.exp(-36 * dt);
    this.camera.recoilX *= recoilDecay;
    this.camera.recoilY *= recoilDecay;

    if (this.camera.trauma > 0) {
      this.camera.trauma = Math.max(0, this.camera.trauma - dt * 6.0);
    }

    const shakeProfile = this.getActiveShakeProfile();
    const shakeSample = computeCameraShakeSample(
      this.camera.trauma,
      Math.random,
      this.camera.recoilX,
      this.camera.recoilY,
      shakeProfile.intensityScale,
      shakeProfile.allowCanvasRotation
    );
    this.camera.shakeOffsetX = shakeSample.shakeOffsetX;
    this.camera.shakeOffsetY = shakeSample.shakeOffsetY;
    this.camera.shakeAngle = shakeSample.shakeAngle;
    this.camera.glitchAlpha = shakeProfile.allowGlitchOverlay ? shakeSample.glitchAlpha : 0;

    if (this.levelTransitionTimer > 0) {
      this.levelTransitionTimer = Math.max(0, this.levelTransitionTimer - dt);
    }

    // Particle update (runs in real time)
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.alpha = Math.max(0, p.life / p.maxLife);
    }

    // Floating text update (Arcade damage text physics & smooth alpha decay)
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;

      if (ft.isDamageText) {
        // Dynamic arc velocity & float
        ft.x += (ft.vx || 0) * dt;
        ft.y += (ft.vy || -40) * dt;
        if (ft.vx) ft.vx *= 0.94;
        if (ft.vy) ft.vy += 32 * dt; // gentle deceleration/gravity curve

        // Pop scale in initial 0.14s, then stabilize
        const maxL = ft.maxLife || 0.95;
        const elapsed = maxL - ft.life;
        if (elapsed < 0.14) {
          const progress = elapsed / 0.14;
          ft.scale = (ft.isCrit ? 1.55 : 1.25) * (0.75 + 0.25 * progress);
        } else {
          ft.scale = ft.isCrit ? 1.25 : 1.0;
        }

        // Keep opaque during pop, then smoothly fade in final 0.38s
        ft.alpha = Math.max(0, Math.min(1, ft.life / 0.38));
      } else {
        ft.y -= 35 * dt;
        ft.alpha = Math.max(0, ft.life / (ft.maxLife || 0.9));
      }

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Active Combo Finisher AoE shockwaves update in real time
    for (let i = this.finisherShockwaves.length - 1; i >= 0; i--) {
      const sw = this.finisherShockwaves[i];
      sw.life -= dt;
      if (sw.life <= 0) {
        this.finisherShockwaves.splice(i, 1);
      }
    }

    // If on Title screen, update ambient turntable presentation
    if (this.state === 'title') {
      this.updateTitleScreen(dt);
      return;
    }

    // If Paused or Duel Victory Summary, freeze gameplay simulation
    if (this.state === 'paused' || this.state === 'duel_victory') {
      return;
    }

    if (this.state === 'playing') {
      this.killsThisFrame = 0;
      if (this.isDuelMode) {
        this.updateDuelPlaying(dt);
      } else {
        this.updatePlaying(dt);
      }
    }
  }

  private updateTitleScreen(dt: number) {
    // Ambient drift around center with gentle orbital flyover + mouse parallax
    const t = performance.now() * 0.001;
    this.player.x = ARENA_WIDTH / 2;
    this.player.y = ARENA_HEIGHT / 2;
    this.player.angle += dt * 0.8;

    const dpr = this.currentDpr || getOptimalCanvasDpr(window.devicePixelRatio || 1);
    const canvasCenterX = (this.canvas.width / dpr) / 2;
    const canvasCenterY = (this.canvas.height / dpr) / 2;
    const orbitX = Math.sin(t * 0.35) * 95;
    const orbitY = Math.cos(t * 0.25) * 65;
    const targetCamX = this.player.x + orbitX + (this.mouse.clientX - canvasCenterX) * 0.16;
    const targetCamY = this.player.y + orbitY + (this.mouse.clientY - canvasCenterY) * 0.16;

    this.camera.x += (targetCamX - this.camera.x) * 0.05;
    this.camera.y += (targetCamY - this.camera.y) * 0.05;

    // Ambient floating sparks
    if (Math.random() < 0.25) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 90;
      this.emitParticle(
        this.player.x + Math.cos(angle) * dist,
        this.player.y + Math.sin(angle) * dist,
        Math.cos(angle) * 30,
        Math.sin(angle) * 30,
        2,
        '#00f3ff',
        0.8,
        'spark'
      );
    }
  }

  private updatePlaying(dt: number) {
    // Pause live simulation cleanly while Cyber-Chip Draft selection modal is active
    if (this.pendingAugmentChoices && this.pendingAugmentChoices.length > 0) {
      return;
    }

    this.updateMouseWorldPos();

    // Step Overdrive, Multi-Kill timer, and Electric Arcs decay
    if (this.overdriveTimer > 0) {
      this.overdriveTimer = Math.max(0, this.overdriveTimer - dt);
    }
    const mkIdle = stepMultiKillStreak(this.multiKillState, false, dt);
    this.multiKillState = mkIdle.state;
    for (let i = this.electricArcs.length - 1; i >= 0; i--) {
      this.electricArcs[i].life -= dt;
      if (this.electricArcs[i].life <= 0) {
        this.electricArcs.splice(i, 1);
      }
    }

    // Tactical Arena Barrels periodic replenishment (capped cleanly at 3)
    if (this.arenaBarrels.length < 3) {
      this.barrelRespawnTimer -= dt;
      if (this.barrelRespawnTimer <= 0) {
        this.replenishArenaBarrels(3);
        this.barrelRespawnTimer = 14;
      }
    }

    // Golden Data-Core bonus pinata spawn & movement
    this.goldenCoreSpawnTimer -= dt;
    if (this.goldenCoreSpawnTimer <= 0 && this.goldenCores.length === 0) {
      this.spawnGoldenCore();
      this.goldenCoreSpawnTimer = 24;
    }
    for (let i = this.goldenCores.length - 1; i >= 0; i--) {
      const updated = stepGoldenDataCore(
        this.goldenCores[i],
        this.player.x,
        this.player.y,
        dt,
        ARENA_WIDTH,
        ARENA_HEIGHT
      );
      if (updated.life <= 0) {
        this.emitBurst(updated.x, updated.y, '#ffd700', 10, 0.9);
        this.goldenCores.splice(i, 1);
      } else {
        this.goldenCores[i] = updated;
      }
    }

    // Live HVT Cyber Bounty Contracts (Campaign & Endless)
    if (!this.isBossRushMode) {
      if (this.activeBounty) {
        const bountyTarget = this.enemies.find(
          (e) => e.id === this.activeBounty!.enemyId && e.state !== 'ko'
        );
        if (!bountyTarget) {
          this.activeBounty = null;
          this.bountySpawnTimer = 26;
        } else {
          const step = stepBountyContract(this.activeBounty, dt);
          this.activeBounty = step.contract;
          if (step.expired) {
            bountyTarget.isBountyTarget = false;
            bountyTarget.bountyCodename = undefined;
            this.activeBounty = null;
            this.bountySpawnTimer = 26;
            this.spawnFloatingText('⌛ BOUNTY CONTRACT EXPIRED', this.player.x, this.player.y - 68, '#94a3b8');
          }
        }
      } else {
        this.bountySpawnTimer -= dt;
        if (this.bountySpawnTimer <= 0) {
          this.triggerNextBountyContract();
        }
      }
    }

    // Store-Equipped Permanent Companion Drone (Orbits opposite Wingman side, fires + optional shield pulse)
    if (this.storeGear.activeCompanion) {
      const compDef = COMPANION_DRONES[this.storeGear.activeCompanion];
      if (compDef) {
        const nowSec = (this.frameNowMs || performance.now()) * 0.001;
        const compAngle = nowSec * 2.1 + Math.PI;
        const compX = this.player.x + Math.cos(compAngle) * 58;
        const compY = this.player.y + Math.sin(compAngle) * 58;

        this.companionFireTimer = Math.max(0, this.companionFireTimer - dt);
        if (this.companionFireTimer <= 0) {
          const target = selectWingmanTarget(compX, compY, this.enemies, 620);
          if (target) {
            this.companionFireTimer = compDef.fireIntervalSec;
            const craft = getCraftDef(this.activeCraft);
            const compGearMods = this.cachedStoreGearMods;
            const compDmg = Math.max(
              8,
              Math.round(
                compDef.boltDamage *
                  (1 + this.stats.upgrades.damageLvl * 0.15) *
                  craft.damageMultiplier *
                  compGearMods.damageMultiplier
              )
            );
            this.projectiles.push({
              id: this.nextId++,
              x: compX,
              y: compY,
              vx: Math.cos(target.angle) * 860,
              vy: Math.sin(target.angle) * 860,
              radius: compDef.explosionRadius ? 6.5 : 4.8,
              damage: compDmg,
              rangeRemaining: 680,
              color: compDef.color,
              isEnemy: false,
              pierceRemaining: compDef.pierce,
              trail: [],
              isHoming: compDef.isHoming,
              explosionRadius: compDef.explosionRadius,
              cryoSlowDuration: compDef.cryoSlowSec,
              weaponType: this.stats.activeWeapon,
              damageCategory: compDef.explosionRadius ? 'explosive' : 'plasma',
              ownerSlot: 'p1',
              isWingmanBolt: true,
            });
            soundEngine.playWingmanLaser();
          }
        }

        if (compDef.shieldPerCycle && compDef.shieldCycleSec) {
          this.companionShieldTimer += dt;
          if (this.companionShieldTimer >= compDef.shieldCycleSec) {
            this.companionShieldTimer = 0;
            if (this.stats.currentShield < this.stats.maxShield) {
              this.stats.currentShield = Math.min(this.stats.maxShield, this.stats.currentShield + compDef.shieldPerCycle);
              this.spawnFloatingText(`+${compDef.shieldPerCycle} SHIELD`, this.player.x, this.player.y - 34, compDef.color);
            }
          }
        }
      }
    }

    // Store Thruster Trail Particle Wake
    const activeTrail = THRUSTER_TRAILS[this.storeGear.activeTrail];
    if (activeTrail && activeTrail.id !== 'trail_standard') {
      this.trailEmitTimer -= dt;
      const moveSpeedNow = Math.hypot(this.player.vx, this.player.vy);
      if (this.trailEmitTimer <= 0 && (moveSpeedNow > 30 || this.player.isDashing)) {
        this.trailEmitTimer = this.player.isDashing ? 0.018 : 0.038;
        const backX = this.player.x - Math.cos(this.player.angle) * (this.player.radius * 0.9);
        const backY = this.player.y - Math.sin(this.player.angle) * (this.player.radius * 0.9);
        const col = activeTrail.colors[Math.floor(Math.random() * activeTrail.colors.length) % activeTrail.colors.length];
        this.emitParticle(
          backX + (Math.random() - 0.5) * 8,
          backY + (Math.random() - 0.5) * 8,
          -Math.cos(this.player.angle) * 55 + (Math.random() - 0.5) * 35,
          -Math.sin(this.player.angle) * 55 + (Math.random() - 0.5) * 35,
          this.player.isDashing ? 5.2 : 3.6,
          col,
          0.34,
          activeTrail.id === 'trail_void_lightning' ? 'spark' : 'dash_ghost'
        );
      }
    }

    // Autonomous Wingman Assault Drones + Cryo-Pulse Field
    const augMods = this.cachedAugMods;
    if (augMods.wingmanCount > 0) {
      const nowSec = (this.frameNowMs || performance.now()) * 0.001;
      for (let dIdx = 0; dIdx < augMods.wingmanCount; dIdx++) {
        this.wingmanFireTimers[dIdx] = Math.max(0, (this.wingmanFireTimers[dIdx] ?? 0) - dt);
        if (this.wingmanFireTimers[dIdx] <= 0) {
          const orbit = computeWingmanOrbitPosition(
            this.player.x,
            this.player.y,
            dIdx,
            augMods.wingmanCount,
            nowSec
          );
          const target = selectWingmanTarget(orbit.x, orbit.y, this.enemies, 580);
          if (target) {
            this.wingmanFireTimers[dIdx] = 0.46;
            const craft = getCraftDef(this.activeCraft);
            const boltDamage = Math.max(
              10,
              Math.round(20 * (1 + this.stats.upgrades.damageLvl * 0.2) * craft.damageMultiplier * augMods.damageMult)
            );
            this.projectiles.push({
              id: this.nextId++,
              x: orbit.x,
              y: orbit.y,
              vx: Math.cos(target.angle) * 840,
              vy: Math.sin(target.angle) * 840,
              radius: 4.5,
              damage: boltDamage,
              rangeRemaining: 620,
              color: '#00f3ff',
              isEnemy: false,
              pierceRemaining: 1 + augMods.bonusPierce,
              trail: [],
              weaponType: this.stats.activeWeapon,
              damageCategory: 'plasma',
              ownerSlot: 'p1',
              bouncesRemaining: augMods.ricochetBounces,
              isWingmanBolt: true,
            });
            soundEngine.playWingmanLaser();
          }
        }
      }
    }

    if (augMods.cryoAuraRadius > 0) {
      this.cryoTickTimer += dt;
      if (this.cryoTickTimer >= 0.45) {
        this.cryoTickTimer = 0;
        const rSq = augMods.cryoAuraRadius * augMods.cryoAuraRadius;
        for (let ei = 0; ei < this.enemies.length; ei++) {
          const enemy = this.enemies[ei];
          if (enemy.state === 'ko') continue;
          const dx = enemy.x - this.player.x;
          const dy = enemy.y - this.player.y;
          if (dx * dx + dy * dy <= rSq) {
            const cryoDmg = augMods.cryoDamagePerTick;
            enemy.hp -= cryoDmg;
            this.emitBurst(enemy.x, enemy.y, '#67e8f9', 3, 0.5);
            if (enemy.hp <= 0) {
              this.killEnemy(enemy, 'p1');
            }
          }
        }
      }
    }

    // 1. Dash input buffering & execution
    if (this.dashBufferTimer > 0) {
      this.dashBufferTimer -= dt;
    }
    if (this.stats.dashCooldownTimer > 0) {
      this.stats.dashCooldownTimer = Math.max(0, this.stats.dashCooldownTimer - dt);
    }
    if (this.player.invulnerableTimer > 0) {
      this.player.invulnerableTimer = Math.max(0, this.player.invulnerableTimer - dt);
    }
    if (this.dashOverchargeTimer > 0) {
      this.dashOverchargeTimer = stepDashOverchargeState(this.dashOverchargeTimer, dt).remainingSeconds;
    }

    if (this.dashBufferTimer > 0 && this.stats.dashCooldownTimer <= 0 && !this.player.isDashing) {
      this.performDash();
      this.dashBufferTimer = 0;
    }

    if (this.player.isDashing) {
      this.stats.dashTimer -= dt;
      // Emit ghost trails (electric gold/violet when Overcharged)
      if (Math.random() < (this.isCurrentDashOvercharged ? 0.92 : 0.7)) {
        this.emitParticle(
          this.player.x,
          this.player.y,
          0,
          0,
          this.player.radius * (this.isCurrentDashOvercharged ? 2.15 : 1.8),
          this.isCurrentDashOvercharged ? '#facc15' : '#00f3ff',
          0.18,
          'dash_ghost'
        );
      }
      if (this.stats.dashTimer <= 0) {
        this.player.isDashing = false;
        this.isCurrentDashOvercharged = false;
        this.player.scaleX = 1;
        this.player.scaleY = 1;
      }
    }

    // 2. Player Movement (WASD + Virtual Touch Stick + Touch navigation fallback) + Procedural Cyber-Storm Wind Zones
    let moveX = this.virtualMoveX;
    let moveY = this.virtualMoveY;
    if (this.heldKeys.has('w') || this.heldKeys.has('arrowup')) moveY -= 1;
    if (this.heldKeys.has('s') || this.heldKeys.has('arrowdown')) moveY += 1;
    if (this.heldKeys.has('a') || this.heldKeys.has('arrowleft')) moveX -= 1;
    if (this.heldKeys.has('d') || this.heldKeys.has('arrowright')) moveX += 1;

    let moveLen = Math.hypot(moveX, moveY);
    if (moveLen === 0 && this.mouse.isDown && !this.virtualFiring) {
      const tDx = this.mouse.worldX - this.player.x;
      const tDy = this.mouse.worldY - this.player.y;
      const tDist = Math.hypot(tDx, tDy);
      if (tDist > 45) {
        moveX = tDx / tDist;
        moveY = tDy / tDist;
        moveLen = 1;
      }
    } else if (moveLen > 1) {
      moveX /= moveLen;
      moveY /= moveLen;
    }

    // Keep weather calm (rainy Cyber-Storm weather disabled per player request for clean visibility & smooth FPS)
    this.cyberStormSpeedMult = 1.0;
    this.cyberStormInWindZone = false;
    this.cyberStormWindLabel = '';

    const dashMotion = computeDashMotionParams(
      this.stats.speed,
      this.stats.dashDuration,
      this.isCurrentDashOvercharged
    );
    const baseMoveSpeed = this.player.isDashing
      ? dashMotion.speed
      : this.stats.speed;
    const currentSpeed = Math.max(80, baseMoveSpeed);
    const accel = this.player.isDashing ? currentSpeed * 14 : 2100;

    const targetVx = moveX * currentSpeed;
    const targetVy = moveY * currentSpeed;
    this.player.vx += (targetVx - this.player.vx) * Math.min(1, accel * dt / currentSpeed);
    this.player.vy += (targetVy - this.player.vy) * Math.min(1, accel * dt / currentSpeed);

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Arena Clamping with wall bounce
    const pad = this.player.radius + 15;
    if (this.player.x < pad) {
      this.player.x = pad;
      this.player.vx = 0;
    } else if (this.player.x > ARENA_WIDTH - pad) {
      this.player.x = ARENA_WIDTH - pad;
      this.player.vx = 0;
    }

    if (this.player.y < pad) {
      this.player.y = pad;
      this.player.vy = 0;
    } else if (this.player.y > ARENA_HEIGHT - pad) {
      this.player.y = ARENA_HEIGHT - pad;
      this.player.vy = 0;
    }

    // Rotate player via manual Touch Aim Stick -> Touch Auto-Aim -> Mouse Cursor
    if (this.virtualAimAngle !== null) {
      this.player.angle = this.virtualAimAngle;
    } else if (this.virtualFiring) {
      let bestDistSq = 980 * 980;
      let aimTarget: Enemy | null = null;
      for (let ei = 0; ei < this.enemies.length; ei++) {
        const cand = this.enemies[ei];
        if (cand.state === 'ko') continue;
        const dx = cand.x - this.player.x;
        const dy = cand.y - this.player.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          aimTarget = cand;
        }
      }
      if (aimTarget) {
        this.player.angle = Math.atan2(aimTarget.y - this.player.y, aimTarget.x - this.player.x);
      } else if (Math.hypot(moveX, moveY) > 0.15) {
        this.player.angle = Math.atan2(moveY, moveX);
      }
    } else {
      this.player.angle = Math.atan2(this.mouse.worldY - this.player.y, this.mouse.worldX - this.player.x);
    }

    // Squash & Stretch decay
    this.player.scaleX += (1 - this.player.scaleX) * 12 * dt;
    this.player.scaleY += (1 - this.player.scaleY) * 12 * dt;

    // 3. Shield Regeneration (uses cached relics + boosters to avoid 60Hz localStorage JSON parse)
    const passiveRelicRegen =
      (this.cachedDiamondRelics.quantum_nanite ? 15 : 0) +
      (this.cachedDiamondRelics.void_overdrive ? 10 : 0) +
      (this.activeBoosters.includes('vampiric_surge') ? 10 : 0);
    if (passiveRelicRegen > 0 && this.stats.currentShield < this.stats.maxShield) {
      // Continuous passive quantum/void shield auto-repair
      this.stats.currentShield = Math.min(
        this.stats.maxShield,
        this.stats.currentShield + passiveRelicRegen * dt
      );
    }

    if (this.stats.shieldCooldownTimer > 0) {
      this.stats.shieldCooldownTimer -= dt;
    } else if (this.stats.currentShield < this.stats.maxShield) {
      this.stats.currentShield = Math.min(
        this.stats.maxShield,
        this.stats.currentShield + this.stats.shieldRechargeRate * dt
      );
    }

    // 4. Consecutive Hit Combo Window (3-second rolling window)
    if (this.stats.comboTimer > 0) {
      this.stats.comboTimer -= dt;
      if (this.stats.comboTimer <= 0) {
        this.stats.comboTimer = 0;
        this.stats.comboStreak = 0;
        this.stats.comboCount = 0;
        this.stats.comboMultiplier = 1.0;
        this.stats.comboFinisherCharge = 0;
        this.stats.comboFinisherReady = false;
        this.finisherChargeProgress = 0;
      }
    }

    // 5. Weapon Cooling & Fire
    if (this.overheatWarnCooldown > 0) {
      this.overheatWarnCooldown = Math.max(0, this.overheatWarnCooldown - dt);
    }
    const gearCoolingMods = this.cachedStoreGearMods;
    for (const wId of WEAPON_ORDER) {
      const mRec = this.weaponMastery[wId];
      const tier = getMasteryTierForXp(mRec?.xp || 0);
      const effectiveCoolingBonus = (1 + tier.coolingBonus) * gearCoolingMods.coolingMultiplier - 1;
      const cooled = stepWeaponThermalState(this.weaponThermals[wId], dt, effectiveCoolingBonus);
      this.weaponThermals[wId] = cooled.state;
      if (cooled.justCooledDown && wId === this.stats.activeWeapon) {
        soundEngine.playWeaponCooldownReady();
        this.spawnFloatingText('❄️ WEAPON COOLED · ONLINE', this.player.x, this.player.y - 48, '#38bdf8');
      }
    }

    if (this.fireCooldownTimer > 0) {
      this.fireCooldownTimer -= dt;
    }

    const wantsFire =
      this.mouse.isDown ||
      this.virtualFiring ||
      this.heldKeys.has('f') ||
      this.heldKeys.has('j') ||
      this.heldKeys.has(' ') ||
      this.heldKeys.has('space');
    if (wantsFire && this.fireCooldownTimer <= 0 && !this.player.isDashing) {
      this.fireActiveWeapon();
    }

    // Periodic combat progression, mastery & coin persistence (batched to avoid mid-frame localStorage stalls)
    if (this.pendingProgress.dirty) {
      this.progressFlushTimer += dt;
      if (this.progressFlushTimer >= 2.8) {
        this.flushPendingPersistence();
      }
    }
    if (this.masteryDirty) {
      this.masterySaveTimer += dt;
      if (this.masterySaveTimer >= 5.0) {
        saveWeaponMastery(this.weaponMastery);
        this.masteryDirty = false;
        this.masterySaveTimer = 0;
      }
    }
    if (this.coinsDirty && typeof window !== 'undefined') {
      this.coinsSaveTimer += dt;
      if (this.coinsSaveTimer >= 2.0) {
        localStorage.setItem('nabilbot_coins', String(this.stats.coins));
        this.coinsDirty = false;
        this.coinsSaveTimer = 0;
      }
    }

    // 6. Projectiles update & collision
    this.updateProjectiles(dt);

    // 7. Enemies update & AI telegraphs
    this.updateEnemies(dt);

    // 8. Pickups magnet & collection
    this.updatePickups(dt);

    // 9. Wave Spawning
    this.updateWaveSpawning(dt);

    // 10. Smooth Camera tracking with cursor lookahead
    const lookaheadDist = 80;
    const toCursorX = Math.cos(this.player.angle) * lookaheadDist;
    const toCursorY = Math.sin(this.player.angle) * lookaheadDist;
    const targetCamX = this.player.x + toCursorX;
    const targetCamY = this.player.y + toCursorY;

    this.camera.x += (targetCamX - this.camera.x) * 8 * dt;
    this.camera.y += (targetCamY - this.camera.y) * 8 * dt;
    const targetCampaignScale = this.getTargetBaseCameraScale();
    this.cameraScale += (targetCampaignScale - this.cameraScale) * 6 * dt;

    // Sync HUD status periodically
    this.syncCombatTelemetryToStats();
    const enemiesAlive = this.countAliveEnemies();
    this.onStatsSync(this.stats, this.currentWave, enemiesAlive, this.bossActive);
  }

  private performDash() {
    this.enemyProjScratch.length = 0;
    for (let i = 0; i < this.projectiles.length; i++) {
      if (this.projectiles[i].isEnemy) {
        this.enemyProjScratch.push(this.projectiles[i]);
      }
    }
    const threat = detectPerfectDashThreat({
      playerX: this.player.x,
      playerY: this.player.y,
      playerRadius: this.player.radius,
      enemyProjectiles: this.enemyProjScratch,
      enemies: this.enemies,
    });

    const wasAlreadyOvercharged = this.dashOverchargeTimer > 0;
    const isOverchargeDash = threat.isPerfectTiming || wasAlreadyOvercharged;
    const motion = computeDashMotionParams(
      this.stats.speed,
      this.stats.dashDuration,
      isOverchargeDash
    );

    this.player.isDashing = true;
    this.isCurrentDashOvercharged = motion.isOvercharged;
    this.player.scaleX = motion.isOvercharged ? 0.68 : 0.75;
    this.player.scaleY = motion.isOvercharged ? 1.45 : 1.35;
    this.stats.dashTimer = motion.duration;
    this.stats.dashCooldownTimer = this.stats.dashCooldown;

    if (threat.isPerfectTiming) {
      this.dashOverchargeTimer = DASH_OVERCHARGE_DURATION_SEC;
      this.player.invulnerableTimer = Math.max(
        this.player.invulnerableTimer,
        DASH_OVERCHARGE_INVULN_SEC
      );
      this.stats.score += Math.round(50 * (this.stats.comboMultiplier || 1));
      this.trackGlobalEvent('dash_overcharges', 1);
      soundEngine.playDashOvercharge();
      this.addCameraTrauma(0.16);
      this.finisherShockwaves.push({
        x: this.player.x,
        y: this.player.y,
        maxRadius: 120,
        life: 0.28,
        maxLife: 0.28,
        color: '#facc15',
        secondaryColor: '#00f3ff',
      });
      this.emitBurst(this.player.x, this.player.y, '#facc15', 22, 1.8);
      this.spawnFloatingText(
        '⚡ PERFECT DASH · OVERCHARGED!',
        this.player.x,
        this.player.y - 54,
        '#facc15'
      );
    } else {
      this.player.invulnerableTimer = Math.max(
        this.player.invulnerableTimer,
        motion.duration + 0.05
      );
      soundEngine.playDash();
      this.emitBurst(
        this.player.x,
        this.player.y,
        motion.isOvercharged ? '#facc15' : '#00f3ff',
        motion.isOvercharged ? 16 : 12,
        motion.isOvercharged ? 1.5 : 1.2
      );
    }

    this.syncCombatTelemetryToStats();
    const activeEnemies = this.countAliveEnemies();
    this.onStatsSync(this.stats, this.currentWave, activeEnemies, this.bossActive);
  }

  private updateDuelPlaying(dt: number) {
    if (!this.duelConfig || !this.duelP1Score || !this.duelP2Score) return;
    this.updateMouseWorldPos();

    const isOnline = this.duelConfig.mode === 'online';
    const isSpectator = Boolean(this.duelConfig.isSpectator);
    const localSlot: DuelSlotId = this.duelConfig.localSlot || 'p1';
    const isPurePvp = isPurePvpFormat(this.duelMatchFormat);

    if (this.dashBufferTimer > 0) {
      this.dashBufferTimer = Math.max(0, this.dashBufferTimer - dt);
    }
    if (this.p2DashBufferTimer > 0) {
      this.p2DashBufferTimer = Math.max(0, this.p2DashBufferTimer - dt);
    }

    // 1. Timer countdown & competitive wave spawning (Local authoritative; Online is server-driven; Pure PvP spawns zero bots)
    if (!isOnline) {
      this.duelTimeRemaining = Math.max(0, this.duelTimeRemaining - dt);
      this.duelElapsedTime += dt;
      if (this.duelTimeRemaining <= 0) {
        const summary = computeDuelVictorySummary(
          this.duelP1Score,
          this.duelP2Score,
          'local',
          this.duelConfig.durationSeconds,
          this.currentLevel,
          this.duelKillFeed,
          {
            matchFormat: this.duelMatchFormat,
            mapTheme: this.duelMapTheme,
            players: Array.from(this.duelRoster.values()),
          }
        );
        this.finishDuelWithSummary(summary);
        return;
      }

      if (!isPurePvp) {
        const activeEnemies = this.countAliveEnemies();
        this.duelSpawnTimer -= dt;
        if (this.duelSpawnTimer <= 0 && activeEnemies < 18) {
          const pairs = this.duelElapsedTime >= 60 ? 2 : 1;
          this.spawnCompetitiveDuelWave(pairs);
          this.duelSpawnTimer = 2.4;
          if (Math.floor(this.duelElapsedTime) > 0 && Math.floor(this.duelElapsedTime) % 25 === 0) {
            this.duelWaveCounter += 1;
          }
        }
      }
    }

    // 2. Player simulation for ALL slots in roster (p1..p6)
    const activeSlots = this.getActiveDuelSlots();
    for (const slot of activeSlots) {
      const actor = this.getDuelActorRef(slot);
      const scoreState = this.getDuelScoreRef(slot);
      if (!actor || !scoreState) continue;

      if (!isSpectator && (!isOnline || localSlot === slot)) {
        this.stepDuelActor(slot, actor, scoreState, dt, isOnline);
      } else {
        actor.x += (actor.targetX - actor.x) * Math.min(1, 16 * dt);
        actor.y += (actor.targetY - actor.y) * Math.min(1, 16 * dt);
        actor.angle = actor.targetAngle;
        actor.scaleX += (1 - actor.scaleX) * 12 * dt;
        actor.scaleY += (1 - actor.scaleY) * 12 * dt;
        if (actor.invulnerableTimer > 0) {
          actor.invulnerableTimer = Math.max(0, actor.invulnerableTimer - dt);
        }
        if (scoreState.respawnTimer > 0) {
          scoreState.respawnTimer = Math.max(0, scoreState.respawnTimer - dt);
        }
        scoreState.momentumTimer = stepCyberMomentumTimer(scoreState.momentumTimer, dt);
        this.recordDuelMomentumTrail(slot, actor, scoreState);
      }
    }

    this.updateDuelMomentumTrails(dt);

    // 2b. Tactical Shield Walls cooldown recharge + TTL decay
    for (const slot of activeSlots) {
      if (!isOnline || localSlot === slot) {
        const prevState =
          this.duelWallChargeBySlot.get(slot) || createInitialTacticalWallChargeState();
        this.duelWallChargeBySlot.set(slot, stepTacticalWallChargeState(prevState, dt));
      }
    }
    if (this.duelTacticalWalls.length > 0) {
      const prevWalls = this.duelTacticalWalls;
      const steppedWalls = stepTacticalWalls(prevWalls, dt);
      if (isOnline) {
        // Keep online walls alive until authoritative server duel:wall_destroyed arrives, clamping visual ttl
        this.duelTacticalWalls = prevWalls.map((w) => ({
          ...w,
          ttl: w.maxTtl > 0 ? Math.max(0.01, w.ttl - dt) : w.ttl,
          hitFlash: Math.max(0, (w.hitFlash || 0) - dt * 4.5),
        }));
      } else {
        this.duelTacticalWalls = steppedWalls.walls;
        if (steppedWalls.expiredIds.length > 0) {
          const expiredSet = new Set(steppedWalls.expiredIds);
          for (const w of prevWalls) {
            if (expiredSet.has(w.id)) {
              this.shatterTacticalWallFx(w);
            }
          }
          this.emitDuelSyncSnapshot();
        }
      }
    }

    // 3. Projectiles, Enemies, Pickups
    this.updateProjectiles(dt);
    if (!isPurePvp) {
      this.updateEnemies(dt);
    }
    this.updatePickups(dt);

    // 4. Camera framing
    const activeCam: DuelCameraMode = isSpectator ? this.duelSpectatorCamera : this.duelCameraMode;
    if ((!isOnline && activeCam === 'both') || (isSpectator && activeCam === 'both')) {
      const midX = (this.player.x + this.player2.x) / 2;
      const midY = (this.player.y + this.player2.y) / 2;
      this.camera.x += (midX - this.camera.x) * 8 * dt;
      this.camera.y += (midY - this.camera.y) * 8 * dt;

      const dpr = this.currentDpr || getOptimalCanvasDpr(window.devicePixelRatio || 1);
      const viewW = this.canvas.width / dpr || window.innerWidth;
      const viewH = this.canvas.height / dpr || window.innerHeight;
      const spanX = Math.abs(this.player.x - this.player2.x) + 560;
      const spanY = Math.abs(this.player.y - this.player2.y) + 420;
      const targetScale = eClamp(Math.min(viewW / spanX, viewH / spanY), 0.36, 1.0);
      this.cameraScale += (targetScale - this.cameraScale) * 5 * dt;
    } else if (!isOnline || isSpectator) {
      const targetActor = activeCam === 'p2' ? this.player2 : this.player;
      const lookahead = isSpectator ? 55 : 80;
      const targetCamX = targetActor.x + Math.cos(targetActor.angle) * lookahead;
      const targetCamY = targetActor.y + Math.sin(targetActor.angle) * lookahead;
      this.camera.x += (targetCamX - this.camera.x) * 8 * dt;
      this.camera.y += (targetCamY - this.camera.y) * 8 * dt;
      const baseScale = this.getTargetBaseCameraScale();
      this.cameraScale += (baseScale - this.cameraScale) * 6 * dt;
    } else {
      const localActor = this.getDuelActorRef(localSlot) || this.player;
      const targetCamX = localActor.x + Math.cos(localActor.angle) * 80;
      const targetCamY = localActor.y + Math.sin(localActor.angle) * 80;
      this.camera.x += (targetCamX - this.camera.x) * 8 * dt;
      this.camera.y += (targetCamY - this.camera.y) * 8 * dt;
      const baseScale = this.getTargetBaseCameraScale();
      this.cameraScale += (baseScale - this.cameraScale) * 6 * dt;

      // Sync local player telemetry to server (~20Hz)
      this.duelStateSyncTimer += dt;
      if (this.duelStateSyncTimer >= 0.05 && this.duelClient) {
        this.duelStateSyncTimer = 0;
        const localScore = this.getDuelScoreRef(localSlot) || this.duelP1Score;
        this.duelClient.sendPlayerState({
          x: Math.round(localActor.x * 10) / 10,
          y: Math.round(localActor.y * 10) / 10,
          vx: Math.round(localActor.vx),
          vy: Math.round(localActor.vy),
          angle: Number(localActor.angle.toFixed(3)),
          isDashing: localActor.isDashing,
          activeWeapon: this.stats.activeWeapon,
          activeCraft: this.activeCraft,
          hp: localScore.hp,
          maxHp: localScore.maxHp,
          shield: Math.round(localScore.shield),
          maxShield: localScore.maxShield,
          respawnTimer: Number(localScore.respawnTimer.toFixed(2)),
          momentumTimer: Number(localScore.momentumTimer.toFixed(2)),
        });
      }
    }

    // 5. Throttled Duel HUD Sync (~10Hz)
    this.duelHudSyncTimer += dt;
    if (this.duelHudSyncTimer >= 0.1) {
      this.duelHudSyncTimer = 0;
      this.emitDuelSyncSnapshot();
    }
  }

  private getDuelTimerSlotState(slot: DuelSlotId, isOnline: boolean) {
    if (isOnline || slot === 'p1') {
      return {
        getDashCd: () => this.stats.dashCooldownTimer,
        setDashCd: (v: number) => {
          this.stats.dashCooldownTimer = v;
        },
        getDashTimer: () => this.stats.dashTimer,
        setDashTimer: (v: number) => {
          this.stats.dashTimer = v;
        },
        getFireCd: () => this.fireCooldownTimer,
        setFireCd: (v: number) => {
          this.fireCooldownTimer = v;
        },
        getShieldCd: () => this.stats.shieldCooldownTimer,
        setShieldCd: (v: number) => {
          this.stats.shieldCooldownTimer = v;
        },
        getComboTimer: () => this.stats.comboTimer,
        setComboTimer: (v: number) => {
          this.stats.comboTimer = v;
        },
      };
    }
    return {
      getDashCd: () => this.player2.dashCooldownTimer,
      setDashCd: (v: number) => {
        this.player2.dashCooldownTimer = v;
      },
      getDashTimer: () => this.player2.dashTimer,
      setDashTimer: (v: number) => {
        this.player2.dashTimer = v;
      },
      getFireCd: () => this.player2.fireCooldownTimer,
      setFireCd: (v: number) => {
        this.player2.fireCooldownTimer = v;
      },
      getShieldCd: () => this.player2.shieldCooldownTimer,
      setShieldCd: (v: number) => {
        this.player2.shieldCooldownTimer = v;
      },
      getComboTimer: () => this.player2.comboTimer,
      setComboTimer: (v: number) => {
        this.player2.comboTimer = v;
      },
    };
  }

  private stepDuelActor(
    slot: DuelSlotId,
    actor: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      angle: number;
      scaleX: number;
      scaleY: number;
      isDashing: boolean;
      invulnerableTimer: number;
    },
    scoreState: DuelPlayerScore,
    dt: number,
    isOnline: boolean
  ) {
    const timers = this.getDuelTimerSlotState(slot, isOnline);

    // Handle KO respawn cooldown at guaranteed obstacle-free spawn spot
    if (scoreState.respawnTimer > 0) {
      scoreState.respawnTimer = Math.max(0, scoreState.respawnTimer - dt);
      if (scoreState.respawnTimer <= 0) {
        const safe = this.getDuelSpawnCoordsForSlot(slot);
        actor.x = safe.x;
        actor.y = safe.y;
        actor.vx = 0;
        actor.vy = 0;
        actor.invulnerableTimer = 1.4;
        scoreState.hp = scoreState.maxHp;
        scoreState.shield = scoreState.maxShield;
        if (isOnline) {
          this.duelStateSyncTimer = 0.05;
        }
        this.spawnFloatingText(`${scoreState.name} RESPAWNED`, actor.x, actor.y - 36, scoreState.color);
        this.emitBurst(actor.x, actor.y, scoreState.color, 16, 1.2);
      }
      return;
    }

    if (actor.invulnerableTimer > 0) {
      actor.invulnerableTimer = Math.max(0, actor.invulnerableTimer - dt);
    }

    scoreState.momentumTimer = stepCyberMomentumTimer(scoreState.momentumTimer, dt);

    if (timers.getDashCd() > 0) timers.setDashCd(Math.max(0, timers.getDashCd() - dt));
    if (timers.getFireCd() > 0) timers.setFireCd(Math.max(0, timers.getFireCd() - dt));
    if (timers.getShieldCd() > 0) timers.setShieldCd(Math.max(0, timers.getShieldCd() - dt));
    else if (scoreState.shield < scoreState.maxShield) {
      scoreState.shield = Math.min(
        scoreState.maxShield,
        scoreState.shield + PVP_SHIELD_RECHARGE_RATE_PER_SECOND * dt
      );
    }

    // Combo rolling decay
    if (scoreState.comboStreak > 0) {
      const nextComboT = timers.getComboTimer() - dt;
      timers.setComboTimer(Math.max(0, nextComboT));
      if (nextComboT <= 0) {
        scoreState.comboStreak = 0;
        scoreState.finisherCharge = 0;
        scoreState.finisherReady = false;
      }
    }

    // Movement Input
    let moveX = isOnline || slot === 'p1' ? this.virtualMoveX : 0;
    let moveY = isOnline || slot === 'p1' ? this.virtualMoveY : 0;
    if (isOnline) {
      if (this.heldKeys.has('w') || this.heldKeys.has('arrowup')) moveY -= 1;
      if (this.heldKeys.has('s') || this.heldKeys.has('arrowdown')) moveY += 1;
      if (this.heldKeys.has('a') || this.heldKeys.has('arrowleft')) moveX -= 1;
      if (this.heldKeys.has('d') || this.heldKeys.has('arrowright')) moveX += 1;
    } else if (slot === 'p1') {
      if (this.heldKeys.has('w')) moveY -= 1;
      if (this.heldKeys.has('s')) moveY += 1;
      if (this.heldKeys.has('a')) moveX -= 1;
      if (this.heldKeys.has('d')) moveX += 1;
    } else {
      if (this.heldKeys.has('arrowup')) moveY -= 1;
      if (this.heldKeys.has('arrowdown')) moveY += 1;
      if (this.heldKeys.has('arrowleft')) moveX -= 1;
      if (this.heldKeys.has('arrowright')) moveX += 1;
    }

    let moveLen = Math.hypot(moveX, moveY);
    if (
      moveLen === 0 &&
      this.duelFreePointerMove &&
      this.mouse.isDown &&
      (isOnline || slot === 'p1') &&
      !this.virtualFiring
    ) {
      const tDx = this.mouse.worldX - actor.x;
      const tDy = this.mouse.worldY - actor.y;
      const tDist = Math.hypot(tDx, tDy);
      if (tDist > 45) {
        moveX = tDx / tDist;
        moveY = tDy / tDist;
        moveLen = 1;
      }
    } else if (moveLen > 1) {
      moveX /= moveLen;
      moveY /= moveLen;
    }

    // Dash execution (keyboard or buffered pointer/HUD dash)
    const wantsDash = isOnline
      ? this.dashBufferTimer > 0 || this.heldKeys.has('shift') || this.heldKeys.has('q')
      : slot === 'p1'
      ? this.dashBufferTimer > 0 || this.heldCodes.has('ShiftLeft') || this.heldCodes.has('KeyQ')
      : this.p2DashBufferTimer > 0 || this.heldCodes.has('ShiftRight') || this.heldCodes.has('KeyL');

    if (wantsDash && timers.getDashCd() <= 0 && !actor.isDashing) {
      actor.isDashing = true;
      actor.scaleX = 0.75;
      actor.scaleY = 1.35;
      actor.invulnerableTimer = this.stats.dashDuration + 0.05;
      if (slot === 'p1' || isOnline) {
        this.dashBufferTimer = 0;
      } else {
        this.p2DashBufferTimer = 0;
      }
      timers.setDashTimer(this.stats.dashDuration);
      timers.setDashCd(this.stats.dashCooldown);
      soundEngine.playDash();
      this.emitBurst(actor.x, actor.y, scoreState.color, 10, 1.1);
      if (slot === (this.duelConfig?.localSlot || 'p1')) {
        this.emitDuelSyncSnapshot();
      }
    }

    if (actor.isDashing) {
      const nextDashT = timers.getDashTimer() - dt;
      timers.setDashTimer(nextDashT);
      if (nextDashT <= 0) actor.isDashing = false;
      if (Math.random() < 0.65) {
        this.emitParticle(actor.x, actor.y, 0, 0, actor.radius * 1.7, scoreState.color, 0.16, 'dash_ghost');
      }
    }

    const momentumSpeedMult = getCyberMomentumSpeedMultiplier(scoreState.momentumTimer);
    const boostedBaseSpeed = this.stats.speed * momentumSpeedMult;
    const currentSpeed = actor.isDashing ? boostedBaseSpeed * 2.7 : boostedBaseSpeed;
    const accel = actor.isDashing ? 3200 : 2200 * momentumSpeedMult;
    actor.vx += (moveX * currentSpeed - actor.vx) * Math.min(1, (accel * dt) / currentSpeed);
    actor.vy += (moveY * currentSpeed - actor.vy) * Math.min(1, (accel * dt) / currentSpeed);
    actor.x += actor.vx * dt;
    actor.y += actor.vy * dt;

    // Obstacle + Arena Bounds Collision (smooth sliding along trees, walls, crystals, crates)
    if (this.duelObstacles.length > 0) {
      const resolved = resolveCircleObstacleCollisions(
        actor.x,
        actor.y,
        actor.radius,
        this.duelObstacles,
        ARENA_WIDTH,
        ARENA_HEIGHT,
        15
      );
      actor.x = resolved.x;
      actor.y = resolved.y;
      if (resolved.collided) {
        const dot = actor.vx * resolved.normalX + actor.vy * resolved.normalY;
        if (dot < 0) {
          actor.vx -= dot * resolved.normalX;
          actor.vy -= dot * resolved.normalY;
        }
      }
    } else {
      const pad = actor.radius + 15;
      if (actor.x < pad) { actor.x = pad; actor.vx = 0; }
      else if (actor.x > ARENA_WIDTH - pad) { actor.x = ARENA_WIDTH - pad; actor.vx = 0; }
      if (actor.y < pad) { actor.y = pad; actor.vy = 0; }
      else if (actor.y > ARENA_HEIGHT - pad) { actor.y = ARENA_HEIGHT - pad; actor.vy = 0; }
    }

    // Tactical Cyber Shield Wall Collision (smooth pushout around deployed walls)
    if (this.duelTacticalWalls.length > 0) {
      const resolvedWall = resolveCircleTacticalWallCollisions(
        actor.x,
        actor.y,
        actor.radius,
        this.duelTacticalWalls,
        ARENA_WIDTH,
        ARENA_HEIGHT,
        15
      );
      actor.x = resolvedWall.x;
      actor.y = resolvedWall.y;
      if (resolvedWall.collided) {
        const dot = actor.vx * resolvedWall.normalX + actor.vy * resolvedWall.normalY;
        if (dot < 0) {
          actor.vx -= dot * resolvedWall.normalX;
          actor.vy -= dot * resolvedWall.normalY;
        }
      }
    }

    this.recordDuelMomentumTrail(slot, actor, scoreState);

    // Aiming: Virtual Touch Aim Stick -> Mouse -> Auto-target nearest AI enemy OR rival PvP player
    const hasTouchControl = isOnline || slot === 'p1';
    const findNearestHostileTarget = (maxRange: number): { x: number; y: number } | null => {
      let bestTarget: { x: number; y: number } | null = null;
      let bestDist = maxRange;
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const d = Math.hypot(enemy.x - actor.x, enemy.y - actor.y);
        if (d < bestDist) {
          bestDist = d;
          bestTarget = enemy;
        }
      }
      if (!bestTarget) {
        for (const rivalSlot of this.getActiveDuelSlots()) {
          const rivalScore = this.getDuelScoreRef(rivalSlot);
          const rivalActor = this.getDuelActorRef(rivalSlot);
          if (!rivalScore || !rivalActor || !rivalScore.connected || rivalScore.respawnTimer > 0) continue;
          if (!canDamageDuelTarget(this.duelMatchFormat, scoreState, rivalScore)) continue;
          const d = Math.hypot(rivalActor.x - actor.x, rivalActor.y - actor.y);
          if (d < bestDist) {
            bestDist = d;
            bestTarget = rivalActor;
          }
        }
      }
      return bestTarget;
    };

    if (hasTouchControl && this.virtualAimAngle !== null) {
      actor.angle = this.virtualAimAngle;
    } else if (hasTouchControl && this.virtualFiring) {
      const target = findNearestHostileTarget(1050);
      if (target) {
        actor.angle = Math.atan2(target.y - actor.y, target.x - actor.x);
      } else if (moveLen > 0) {
        actor.angle = Math.atan2(moveY, moveX);
      }
    } else {
      const useMouseAim = hasTouchControl && this.mouse.hasMoved;
      if (useMouseAim) {
        actor.angle = Math.atan2(this.mouse.worldY - actor.y, this.mouse.worldX - actor.x);
      } else {
        const target = findNearestHostileTarget(950);
        if (target) {
          actor.angle = Math.atan2(target.y - actor.y, target.x - actor.x);
        } else if (moveLen > 0) {
          actor.angle = Math.atan2(moveY, moveX);
        }
      }
    }

    actor.scaleX += (1 - actor.scaleX) * 12 * dt;
    actor.scaleY += (1 - actor.scaleY) * 12 * dt;

    // Weapon Fire
    const wantsFire = isOnline
      ? this.mouse.isDown || this.virtualFiring || this.heldKeys.has(' ') || this.heldKeys.has('space') || this.heldKeys.has('f') || this.heldKeys.has('j') || this.heldKeys.has('enter')
      : slot === 'p1'
      ? this.mouse.isDown || this.virtualFiring || this.heldKeys.has(' ') || this.heldKeys.has('space') || this.heldKeys.has('f')
      : this.heldKeys.has('enter') || this.heldKeys.has('/') || this.heldCodes.has('Slash') || this.heldCodes.has('Quote') || this.heldCodes.has('Numpad0');

    if (wantsFire && timers.getFireCd() <= 0 && !actor.isDashing) {
      this.fireDuelWeapon(slot, actor, isOnline);
    }
  }

  private fireDuelWeapon(
    slot: DuelSlotId,
    actor: { x: number; y: number; radius: number; angle: number; scaleX: number; scaleY: number },
    isOnline: boolean
  ) {
    const weaponId: WeaponType = this.stats.activeWeapon;
    const weapon = WEAPONS[weaponId];
    const craft = getCraftDef(this.activeCraft);
    const dmgMultiplier = (1 + this.stats.upgrades.damageLvl * 0.2) * craft.damageMultiplier;
    const rateMultiplier = (1 + this.stats.upgrades.fireRateLvl * 0.18) * craft.fireRateMultiplier;
    const cooldown = 1 / (weapon.fireRate * rateMultiplier);

    const timers = this.getDuelTimerSlotState(slot, isOnline);
    timers.setFireCd(cooldown);

    actor.scaleX = 1.25;
    actor.scaleY = 0.85;
    const baseAngle = actor.angle;
    const duelFireTrauma = getWeaponFireShakeTrauma(weapon.id, weapon.tier);
    this.addDirectionalCameraShake(
      duelFireTrauma,
      -Math.cos(baseAngle),
      -Math.sin(baseAngle),
      duelFireTrauma * 24,
      0.48
    );
    const spawnDist = actor.radius + 12;
    const slotScore = this.getDuelScoreRef(slot);
    const projColor =
      weaponId === 'pulse' ? slotScore?.color || (slot === 'p2' ? '#ff0077' : '#00f3ff') : weapon.color;

    for (let i = 0; i < weapon.pellets; i++) {
      let angle = baseAngle;
      if (weapon.pellets > 1) {
        const spreadOffset = (i / (weapon.pellets - 1) - 0.5) * weapon.spread;
        angle += spreadOffset + (Math.random() - 0.5) * 0.05;
      } else {
        angle += (Math.random() - 0.5) * weapon.spread;
      }

      const pX = actor.x + Math.cos(baseAngle) * spawnDist;
      const pY = actor.y + Math.sin(baseAngle) * spawnDist;
      const vx = Math.cos(angle) * weapon.speed;
      const vy = Math.sin(angle) * weapon.speed;
      const dmg = Math.round(weapon.damage * dmgMultiplier);
      const radius =
        weapon.id === 'supernova'
          ? 16
          : weapon.id === 'omega_singularity' || weapon.id === 'genesis_nova' || weapon.id === 'leviathan'
          ? 14
          : weapon.id === 'celestial_eclipse'
          ? 13
          : weapon.id === 'vortex'
          ? 12
          : weapon.id === 'astral_horizon'
          ? 11
          : weapon.id === 'crimson_reaper'
          ? 10
          : weapon.id === 'ricochet_disc'
          ? 8
          : weapon.id === 'quantum_swarm'
          ? 7
          : 6;

      if (this.duelTacticalWalls.length > 0) {
        const muzzleWallHit = findProjectileTacticalWallHit({
          prevX: actor.x,
          prevY: actor.y,
          x: pX,
          y: pY,
          radius,
          walls: this.duelTacticalWalls,
          isEnemyProjectile: false,
          projectileOwnerSlot: slot,
          projectileOwnerTeam: slotScore?.team,
          matchFormat: this.duelMatchFormat,
        });
        if (muzzleWallHit) {
          const { wall: targetWall, hitX, hitY } = muzzleWallHit;
          const localSlot = this.duelConfig?.localSlot || 'p1';
          const isSpectatorView = Boolean(this.duelConfig?.isSpectator);
          const wallDamage = computePvpProjectileDamage(dmg);
          this.emitBurst(hitX, hitY, '#38bdf8', 7, 0.9);
          this.emitBurst(hitX, hitY, '#e879f9', 4, 0.7);
          if (!isSpectatorView) {
            soundEngine.playHitImpact();
            this.spawnDamageText(wallDamage, hitX, hitY - 8, 'cosmic', false, 0.9);
          }
          if (!isOnline && !isSpectatorView) {
            const dmgRes = applyDamageToTacticalWall(targetWall, wallDamage);
            if (dmgRes.destroyed) {
              this.duelTacticalWalls = this.duelTacticalWalls.filter((w) => w.id !== targetWall.id);
              this.shatterTacticalWallFx(targetWall);
            } else {
              this.duelTacticalWalls = this.duelTacticalWalls.map((w) =>
                w.id === targetWall.id ? dmgRes.wall : w
              );
            }
          } else if (!isSpectatorView && this.duelClient && slot === localSlot) {
            targetWall.hitFlash = 1.0;
            this.duelClient.damageTacticalWall(targetWall.id, wallDamage);
          }
          continue;
        }
      }

      this.projectiles.push({
        id: this.nextId++,
        x: pX,
        y: pY,
        vx,
        vy,
        radius,
        damage: dmg,
        rangeRemaining: weapon.range,
        color: projColor,
        isEnemy: false,
        pierceRemaining: weapon.pierce,
        trail: [],
        isHoming: weapon.isHoming,
        explosionRadius: weapon.explosionRadius,
        pullRadius: weapon.pullRadius,
        weaponType: weapon.id,
        damageCategory: mapWeaponToDamageCategory(weapon.id, Boolean(weapon.explosionRadius)),
        ownerSlot: slot,
        bouncesRemaining: weapon.id === 'ricochet_disc' ? 2 : 0,
      });

      if (isOnline && this.duelClient) {
        this.duelClient.sendProjectile({
          x: pX,
          y: pY,
          vx,
          vy,
          radius,
          damage: dmg,
          rangeRemaining: weapon.range,
          color: projColor,
          pierceRemaining: weapon.pierce,
          isHoming: weapon.isHoming,
          explosionRadius: weapon.explosionRadius,
          pullRadius: weapon.pullRadius,
          weaponType: weapon.id,
        });
      }
    }

    soundEngine.playPulseShoot();
    this.emitParticle(
      actor.x + Math.cos(baseAngle) * spawnDist,
      actor.y + Math.sin(baseAngle) * spawnDist,
      Math.cos(baseAngle) * 80,
      Math.sin(baseAngle) * 80,
      4,
      projColor,
      0.1,
      'spark'
    );
  }

  private spawnCompetitiveDuelWave(pairsCount: number) {
    const spawns = generateCompetitiveDuelSpawns({
      p1Pos: { x: this.player.x, y: this.player.y },
      p2Pos: { x: this.player2.x, y: this.player2.y },
      arenaW: ARENA_WIDTH,
      arenaH: ARENA_HEIGHT,
      pairsCount,
      waveNumber: this.duelWaveCounter,
      level: this.currentLevel,
      spawnSeqStart: this.duelSpawnSeq,
    });
    this.duelSpawnSeq += spawns.length;
    this.spawnCompetitiveBatch(spawns);
  }

  private spawnCompetitiveBatch(spawns: DuelCompetitiveSpawn[]) {
    for (const sp of spawns) {
      if (this.duelSpawnedIds.has(sp.spawnId)) continue;
      this.duelSpawnedIds.add(sp.spawnId);

      const stats = calculateEnemyStats(sp.type, this.currentLevel, this.duelWaveCounter, this.difficulty);
      let radius = 16;
      let color = '#00ff88';
      let shieldArc: number | undefined;

      if (sp.type === 'swarmer') { radius = 16; color = '#00ff88'; }
      else if (sp.type === 'sniper') { radius = 18; color = '#ff0077'; }
      else if (sp.type === 'storm_drone') { radius = 22; color = '#00f3ff'; }
      else if (sp.type === 'tank') { radius = 26; color = '#ffb400'; shieldArc = Math.PI * 0.65; }
      else if (sp.type === 'shield_breaker') { radius = 25; color = '#38bdf8'; }
      else if (sp.type === 'phantom') { radius = 20; color = '#b026ff'; }
      else if (sp.type === 'behemoth') { radius = 35; color = '#ff3300'; shieldArc = Math.PI * 0.75; }
      else if (sp.type === 'goliath') { radius = 42; color = '#ff0055'; }

      const duelBarrierHp = sp.type === 'shield_breaker' ? computeShieldBreakerBarrierHp(stats.hp) : undefined;
      this.enemies.push({
        id: this.nextId++,
        type: sp.type,
        x: sp.x,
        y: sp.y,
        vx: 0,
        vy: 0,
        radius,
        hp: stats.hp,
        maxHp: stats.hp,
        speed: stats.speed,
        color,
        angle: 0,
        targetAngle: 0,
        state: 'seek',
        telegraphTimer: 0,
        telegraphDuration: stats.telegraphDuration,
        cooldownTimer: 0.7,
        koTimer: 0,
        contactDamage: stats.contactDamage,
        projectileDamage: stats.projectileDamage,
        projectileSpeed: stats.projectileSpeed,
        slamDamage: stats.slamDamage,
        shieldAngle: 0,
        shieldArc,
        kineticBarrierHp: duelBarrierHp,
        kineticBarrierMaxHp: duelBarrierHp,
        kineticBarrierDownTimer: 0,
        kineticBarrierMaxDownSec: 5.0,
        duelSpawnId: sp.spawnId,
        duelTargetSlot: sp.assignedTo,
      });

      const portalColor = sp.assignedTo === 'p1' ? '#00f3ff' : '#ff0077';
      this.emitBurst(sp.x, sp.y, portalColor, 10, 1.1);
    }
  }

  private emitDuelSyncSnapshot() {
    if (!this.isDuelMode || !this.duelConfig || !this.duelP1Score || !this.duelP2Score || !this.onDuelSync) {
      return;
    }
    const localSlot = this.duelConfig.localSlot || 'p1';
    const isOnline = this.duelConfig.mode === 'online';
    const localScore = this.getDuelScoreRef(localSlot) || this.duelP1Score;
    const timers = this.getDuelTimerSlotState(localSlot, isOnline);
    const playersArray = Array.from(this.duelRoster.values()).map((p) => ({ ...p }));
    const teamScores =
      this.duelMatchFormat === 'pvp_team' ? computeDuelTeamScores(playersArray) : undefined;

    const wallState =
      this.duelWallChargeBySlot.get(localSlot) || createInitialTacticalWallChargeState();
    if (typeof document !== 'undefined') {
      document.body.dataset.duelWalls = String(this.duelTacticalWalls.length);
      document.body.dataset.duelWallsHp = this.duelTacticalWalls.map((w) => `${w.id}:${w.hp}`).join(',');
    }

    this.onDuelSync({
      mode: this.duelConfig.mode,
      matchFormat: this.duelMatchFormat,
      mapTheme: this.duelMapTheme,
      roomCode: this.duelConfig.roomCode,
      localSlot,
      isSpectator: Boolean(this.duelConfig.isSpectator),
      spectatorCount: this.duelSpectatorCount,
      spectatorCamera: this.duelSpectatorCamera,
      cameraMode: this.duelCameraMode,
      freePointerMove: this.duelFreePointerMove,
      activeWeapon: this.stats.activeWeapon,
      unlockedWeapons: { ...this.stats.unlockedWeapons },
      dashCooldown: this.stats.dashCooldown,
      dashCooldownTimer: timers.getDashCd(),
      wallCharges: wallState.charges,
      maxWallCharges: wallState.maxCharges,
      wallCooldownTimer: wallState.cooldownTimer,
      wallCooldownTotal: wallState.cooldownTotal,
      finisherCharge: localScore.finisherCharge || 0,
      finisherReady: Boolean(localScore.finisherReady),
      timeRemaining: this.duelTimeRemaining,
      durationSeconds: this.duelConfig.durationSeconds,
      level: this.currentLevel,
      p1: { ...this.duelP1Score },
      p2: { ...this.duelP2Score },
      players: playersArray,
      teamScores,
      activeEnemies: isPurePvpFormat(this.duelMatchFormat) ? 0 : this.countAliveEnemies(),
    });
  }

  public finishDuelWithSummary(summary: DuelVictorySummary) {
    if (this.state === 'duel_victory') return;
    this.state = 'duel_victory';
    document.body.dataset.state = 'duel_victory';
    this.heldKeys.clear();
    this.heldCodes.clear();
    this.justPressedKeys.clear();
    this.mouse.isDown = false;
    soundEngine.playVictory();
    this.onStateChange('duel_victory');
    this.onDuelVictory?.(summary);
  }

  private fireActiveWeapon() {
    const weapon = WEAPONS[this.stats.activeWeapon];
    const thermal = this.weaponThermals[weapon.id] || createInitialWeaponThermalState();
    if (thermal.isOverheated) {
      if (this.overheatWarnCooldown <= 0) {
        this.overheatWarnCooldown = 0.7;
        this.spawnFloatingText(
          `🔥 ${weapon.name.split(' ')[0].toUpperCase()} OVERHEATED!`,
          this.player.x,
          this.player.y - 44,
          '#ff4d4d'
        );
      }
      return;
    }

    const craft = getCraftDef(this.activeCraft);
    const masteryTier = getMasteryTierForXp(this.weaponMastery[weapon.id]?.xp || 0);
    const augMods = this.cachedAugMods;
    const gearMods = this.cachedStoreGearMods;
    const isOverdrive = this.overdriveTimer > 0;
    const boosterDmgMult = this.activeBoosters.includes('weapon_overclock') ? 1.2 : 1.0;
    const dmgMultiplier =
      (1 + this.stats.upgrades.damageLvl * 0.2) *
      craft.damageMultiplier *
      (1 + masteryTier.damageBonus) *
      augMods.damageMult *
      gearMods.damageMultiplier *
      boosterDmgMult;
    const rateMultiplier =
      (1 + this.stats.upgrades.fireRateLvl * 0.18) *
      craft.fireRateMultiplier *
      augMods.fireRateMult *
      gearMods.fireRateMultiplier *
      (isOverdrive ? OVERDRIVE_FIRE_RATE_MULT : 1);
    this.fireCooldownTimer = 1 / (weapon.fireRate * rateMultiplier);

    // Accumulate weapon heat (0 heat during Overdrive; reduced by Weapon Mastery + Cryo-Vent Overclock + Thermal Vent Module)
    const effectiveHeatPerShot = isOverdrive ? 0 : weapon.heatPerShot * gearMods.heatPerShotMultiplier;
    const combinedHeatReduction = Math.min(0.85, masteryTier.heatReduction + augMods.heatReduction);
    const heatRes = applyWeaponShotHeat(thermal, effectiveHeatPerShot, combinedHeatReduction);
    this.weaponThermals[weapon.id] = heatRes.state;
    if (heatRes.triggeredOverheat) {
      soundEngine.playOverheat();
      this.addCameraTrauma(0.12);
      this.emitBurst(this.player.x, this.player.y, '#ff5500', 18, 1.4);
      this.spawnFloatingText('🔥 WEAPON OVERHEATED! COOLING DOWN', this.player.x, this.player.y - 54, '#ff4d4d');
      this.syncCombatTelemetryToStats();
      const enemiesAlive = this.countAliveEnemies();
      this.onStatsSync(this.stats, this.currentWave, enemiesAlive, this.bossActive);
    }

    // Track shot towards Weapon Mastery progression
    this.awardMastery(weapon.id, 'shot');

    // Crisp light player muzzle snap without camera vibration
    const baseAngle = this.player.angle;
    const fireTrauma = getWeaponFireShakeTrauma(weapon.id, weapon.tier);
    const shakeProfile = this.getActiveShakeProfile();
    this.player.scaleX = fireTrauma >= 0.2 ? 1.1 : 1.06;
    this.player.scaleY = fireTrauma >= 0.2 ? 0.93 : 0.96;
    if (shakeProfile.fireShakeScale > 0) {
      this.addDirectionalCameraShake(
        fireTrauma * shakeProfile.fireShakeScale,
        -Math.cos(baseAngle),
        -Math.sin(baseAngle),
        fireTrauma * 6 * shakeProfile.fireShakeScale,
        0.12
      );
    }
    const spawnDist = this.player.radius + 12;

    for (let i = 0; i < weapon.pellets; i++) {
      let angle = baseAngle;
      if (weapon.pellets > 1) {
        const spreadOffset = (i / (weapon.pellets - 1) - 0.5) * weapon.spread;
        angle += spreadOffset + (Math.random() - 0.5) * 0.05;
      } else {
        angle += (Math.random() - 0.5) * weapon.spread;
      }

      const pX = this.player.x + Math.cos(baseAngle) * spawnDist;
      const pY = this.player.y + Math.sin(baseAngle) * spawnDist;
      const projSpeed = weapon.speed * augMods.projSpeedMult;

      this.projectiles.push({
        id: this.nextId++,
        x: pX,
        y: pY,
        vx: Math.cos(angle) * projSpeed,
        vy: Math.sin(angle) * projSpeed,
        radius:
          weapon.id === 'supernova'
            ? 16
            : weapon.id === 'omega_singularity' || weapon.id === 'genesis_nova'
            ? 14
            : weapon.id === 'celestial_eclipse'
            ? 13
            : weapon.id === 'vortex'
            ? 12
            : weapon.id === 'leviathan'
            ? 14
            : weapon.id === 'astral_horizon'
            ? 11
            : weapon.id === 'void_rail' || weapon.id === 'crimson_reaper'
            ? 10
            : weapon.id === 'cryo_shatter'
            ? 9
            : weapon.id === 'plasma_scythe'
            ? 9
            : weapon.id === 'ricochet_disc'
            ? 8
            : weapon.id === 'chrono_thunder'
            ? 8
            : weapon.id === 'aegis_titan'
            ? 8
            : weapon.id === 'hyperion_astral'
            ? 10
            : weapon.id === 'missile' || weapon.id === 'quantum_swarm'
            ? 7
            : weapon.id === 'prism_splitter' || weapon.id === 'pulsar_matrix'
            ? 6
            : weapon.id === 'beam'
            ? 6
            : weapon.id === 'inferno'
            ? 6
            : weapon.id === 'scatter'
            ? 4
            : 5,
        damage: Math.round(weapon.damage * dmgMultiplier),
        rangeRemaining: weapon.range,
        color: isOverdrive ? '#facc15' : weapon.color,
        isEnemy: false,
        pierceRemaining: weapon.pierce + augMods.bonusPierce,
        trail: [],
        isHoming: weapon.isHoming,
        explosionRadius: weapon.explosionRadius,
        pullRadius: weapon.pullRadius,
        cryoSlowDuration: weapon.cryoSlowDuration,
        weaponType: weapon.id,
        damageCategory: mapWeaponToDamageCategory(weapon.id, Boolean(weapon.explosionRadius)),
        ownerSlot: 'p1',
        bouncesRemaining: (weapon.id === 'ricochet_disc' ? 2 : 0) + augMods.ricochetBounces,
      });
    }

    // Play sound according to weapon
    if (weapon.id === 'pulse' || weapon.id === 'pulsar_matrix') soundEngine.playPulseShoot();
    else if (
      weapon.id === 'scatter' ||
      weapon.id === 'plasma_scythe' ||
      weapon.id === 'crimson_reaper' ||
      weapon.id === 'prism_splitter' ||
      weapon.id === 'ricochet_disc'
    )
      soundEngine.playScatterShoot();
    else if (weapon.id === 'beam' || weapon.id === 'void_rail' || weapon.id === 'astral_horizon')
      soundEngine.playBeamShoot();
    else if (weapon.id === 'missile' || weapon.id === 'quantum_swarm') soundEngine.playScatterShoot();
    else if (weapon.id === 'leviathan' || weapon.id === 'cryo_shatter') soundEngine.playBeamShoot();
    else if (weapon.id === 'vortex') soundEngine.playBeamShoot();
    else if (weapon.id === 'inferno') soundEngine.playPulseShoot();
    else if (weapon.id === 'chrono_thunder') soundEngine.playPulseShoot();
    else if (
      weapon.id === 'supernova' ||
      weapon.id === 'omega_singularity' ||
      weapon.id === 'celestial_eclipse' ||
      weapon.id === 'genesis_nova'
    )
      soundEngine.playBeamShoot();
    else if (weapon.id === 'aegis_titan') soundEngine.playBeamShoot();
    else if (weapon.id === 'hyperion_astral') soundEngine.playBeamShoot();

    // Muzzle flash particles
    this.emitParticle(
      this.player.x + Math.cos(baseAngle) * spawnDist,
      this.player.y + Math.sin(baseAngle) * spawnDist,
      Math.cos(baseAngle) * 80,
      Math.sin(baseAngle) * 80,
      4,
      weapon.color,
      0.1,
      'spark'
    );
  }

  // --- Projectiles Update ---
  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      // Homing guidance for smart missiles (squared distance scan avoids sqrt in loop)
      if (p.isHoming && !p.isEnemy) {
        let nearestTarget: { x: number; y: number } | null = null;
        let nearestDistSq = 600 * 600;
        for (let ei = 0; ei < this.enemies.length; ei++) {
          const enemy = this.enemies[ei];
          if (enemy.state === 'ko') continue;
          const dx = enemy.x - p.x;
          const dy = enemy.y - p.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < nearestDistSq) {
            nearestDistSq = dSq;
            nearestTarget = enemy;
          }
        }
        if (!nearestTarget && this.isDuelMode) {
          const ownerSlot: DuelSlotId = p.ownerSlot || 'p1';
          const shooterScore = this.getDuelScoreRef(ownerSlot) || { slot: ownerSlot };
          for (const targetSlot of this.getActiveDuelSlots()) {
            const rivalScore = this.getDuelScoreRef(targetSlot);
            const rivalActor = this.getDuelActorRef(targetSlot);
            if (!rivalScore || !rivalActor || !rivalScore.connected || rivalScore.respawnTimer > 0) continue;
            if (!canDamageDuelTarget(this.duelMatchFormat, shooterScore, rivalScore)) continue;
            const dx = rivalActor.x - p.x;
            const dy = rivalActor.y - p.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < nearestDistSq) {
              nearestDistSq = dSq;
              nearestTarget = rivalActor;
            }
          }
        }
        if (nearestTarget) {
          const targetAngle = Math.atan2(nearestTarget.y - p.y, nearestTarget.x - p.x);
          const currentSpeed = Math.hypot(p.vx, p.vy);
          const currentAngle = Math.atan2(p.vy, p.vx);
          const diff = wrapAngleSafe(targetAngle - currentAngle);
          const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), 6.5 * dt);
          p.vx = Math.cos(newAngle) * currentSpeed;
          p.vy = Math.sin(newAngle) * currentSpeed;
        }
      }

      const prevX = p.x;
      const prevY = p.y;
      const dist = Math.hypot(p.vx, p.vy) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rangeRemaining -= dist;

      // Trail (skip object allocations completely when projectile trails are disabled for performance)
      if (this.adaptiveQuality.drawProjectileTrails) {
        p.trail.unshift({ x: p.x, y: p.y });
        if (p.trail.length > 4) p.trail.pop();
      } else if (p.trail.length > 0) {
        p.trail.length = 0;
      }

      // Wall Ricochet Prism check (if player projectile has bouncesRemaining > 0)
      if (!p.isEnemy && (p.bouncesRemaining || 0) > 0 && p.rangeRemaining > 0) {
        let bounced = false;
        if (p.x < 12) {
          p.x = 12;
          p.vx = Math.abs(p.vx);
          bounced = true;
        } else if (p.x > ARENA_WIDTH - 12) {
          p.x = ARENA_WIDTH - 12;
          p.vx = -Math.abs(p.vx);
          bounced = true;
        }
        if (p.y < 12) {
          p.y = 12;
          p.vy = Math.abs(p.vy);
          bounced = true;
        } else if (p.y > ARENA_HEIGHT - 12) {
          p.y = ARENA_HEIGHT - 12;
          p.vy = -Math.abs(p.vy);
          bounced = true;
        }
        if (bounced) {
          p.bouncesRemaining = (p.bouncesRemaining || 1) - 1;
          this.emitBurst(p.x, p.y, '#f472b6', 5, 0.7);
        }
      }

      // Check arena bounds
      if (p.x < 10 || p.x > ARENA_WIDTH - 10 || p.y < 10 || p.y > ARENA_HEIGHT - 10 || p.rangeRemaining <= 0) {
        this.emitBurst(p.x, p.y, p.color, 4, 0.5);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check Duel Arena Obstacles (walls, crystal trees, crystal clusters, crates)
      if (this.isDuelMode && this.duelObstacles.length > 0) {
        const hitObstacle = checkProjectileObstacleHit(p.x, p.y, p.radius, this.duelObstacles);
        if (hitObstacle) {
          const sparkColor =
            hitObstacle.kind === 'tree'
              ? '#5eead4'
              : hitObstacle.kind === 'wall'
              ? '#e0f2fe'
              : hitObstacle.kind === 'crystal'
              ? '#c084fc'
              : '#fbbf24';
          this.emitBurst(p.x, p.y, sparkColor, 6, 0.75);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Check Player-Deployed Tactical Cyber Shield Walls (blocks enemy shots, absorbs damage, shatters on heavy fire)
      if (this.isDuelMode && this.duelTacticalWalls.length > 0) {
        const ownerSlot: DuelSlotId | undefined = p.ownerSlot;
        const ownerScore = ownerSlot ? this.getDuelScoreRef(ownerSlot) : null;
        const hitWallRes = findProjectileTacticalWallHit({
          prevX,
          prevY,
          x: p.x,
          y: p.y,
          radius: p.radius,
          walls: this.duelTacticalWalls,
          isEnemyProjectile: p.isEnemy,
          projectileOwnerSlot: ownerSlot,
          projectileOwnerTeam: ownerScore?.team,
          matchFormat: this.duelMatchFormat,
        });
        if (hitWallRes) {
          const { wall: targetWall, hitX, hitY } = hitWallRes;
          const isOnline = this.duelConfig?.mode === 'online';
          const isSpectatorView = Boolean(this.duelConfig?.isSpectator);
          const localSlot = this.duelConfig?.localSlot || 'p1';
          const wallDamage = p.isEnemy
            ? Math.max(12, Math.round(p.damage))
            : computePvpProjectileDamage(p.damage);

          this.emitBurst(hitX, hitY, '#38bdf8', 7, 0.9);
          this.emitBurst(hitX, hitY, '#e879f9', 4, 0.7);
          if (!isSpectatorView) {
            soundEngine.playHitImpact();
            this.spawnDamageText(wallDamage, hitX, hitY - 8, 'cosmic', false, 0.9);
          }

          if (!isOnline && !isSpectatorView) {
            const dmgRes = applyDamageToTacticalWall(targetWall, wallDamage);
            if (dmgRes.destroyed) {
              this.duelTacticalWalls = this.duelTacticalWalls.filter((w) => w.id !== targetWall.id);
              this.shatterTacticalWallFx(targetWall);
            } else {
              this.duelTacticalWalls = this.duelTacticalWalls.map((w) =>
                w.id === targetWall.id ? dmgRes.wall : w
              );
            }
          } else if (!isSpectatorView && this.duelClient) {
            targetWall.hitFlash = 1.0;
            if (!p.isEnemy && ownerSlot === localSlot) {
              this.duelClient.damageTacticalWall(targetWall.id, wallDamage);
            } else if (p.isEnemy && targetWall.ownerSlot === localSlot) {
              this.duelClient.damageTacticalWall(targetWall.id, wallDamage);
            }
          }

          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Player projectiles vs Golden Data-Core bonus target
      if (!p.isEnemy && !this.isDuelMode && this.goldenCores.length > 0) {
        let hitCore = false;
        for (let gc = this.goldenCores.length - 1; gc >= 0; gc--) {
          const core = this.goldenCores[gc];
          if (checkCircleCollision(p.x, p.y, p.radius, core.x, core.y, core.radius + 4)) {
            core.hp -= p.damage;
            soundEngine.playHitImpact();
            this.emitBurst(p.x, p.y, '#ffd700', 8, 1.1);
            this.spawnDamageText(p.damage, core.x, core.y, 'cosmic', true, 1.0);
            if (core.hp <= 0) {
              this.goldenCores.splice(gc, 1);
              this.goldenCoresDestroyed += 1;
              this.trackGlobalEvent('golden_cores', 1);
              const jackpot = computeGoldenCoreJackpot(this.currentLevel);
              this.overdriveTimer = Math.max(this.overdriveTimer, jackpot.overdriveSeconds);
              this.stats.score += jackpot.score;
              const updatedDiamonds = addDiamonds(jackpot.diamonds);
              this.stats.diamonds = updatedDiamonds;
              for (let c = 0; c < jackpot.coinCount; c++) {
                this.pickups.push({
                  id: this.nextId++,
                  type: 'coin',
                  x: core.x + (Math.random() - 0.5) * 60,
                  y: core.y + (Math.random() - 0.5) * 60,
                  value: jackpot.coinValue,
                  life: 30,
                  radius: 10,
                });
              }
              this.pickups.push({
                id: this.nextId++,
                type: 'nanite_heal',
                x: core.x,
                y: core.y,
                value: 1,
                life: 25,
                radius: 10,
              });
              soundEngine.playGoldenCoreJackpot();
              this.addCameraTrauma(0.22);
              this.finisherShockwaves.push({
                x: core.x,
                y: core.y,
                maxRadius: 190,
                life: 0.42,
                maxLife: 0.42,
                color: '#ffd700',
                secondaryColor: '#38bdf8',
              });
              this.emitBurst(core.x, core.y, '#ffd700', 32, 2.1);
              this.spawnFloatingText(
                `💎 JACKPOT! +${jackpot.diamonds} 💎 · OVERDRIVE ${jackpot.overdriveSeconds}s!`,
                core.x,
                core.y - 44,
                '#ffd700'
              );
            }
            p.pierceRemaining -= 1;
            if (p.pierceRemaining <= 0) {
              hitCore = true;
              break;
            }
          }
        }
        if (hitCore) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Player projectiles vs Interactive Tactical Arena Barrels (Plasma & Cryo-Nova)
      if (!p.isEnemy && !this.isDuelMode && this.arenaBarrels.length > 0) {
        let hitBarrel = false;
        let barrelToDetonate: ArenaBarrel | null = null;
        for (let bi = this.arenaBarrels.length - 1; bi >= 0; bi--) {
          const barrel = this.arenaBarrels[bi];
          if (!barrel) continue;
          if (checkCircleCollision(p.x, p.y, p.radius, barrel.x, barrel.y, barrel.radius + 4)) {
            const dmgRes = applyBarrelDamage(barrel, p.damage);
            if (dmgRes.destroyed) {
              this.arenaBarrels.splice(bi, 1);
              barrelToDetonate = barrel;
            } else {
              this.arenaBarrels[bi] = dmgRes.barrel;
              soundEngine.playHitImpact();
              this.emitBurst(p.x, p.y, barrel.type === 'cryo' ? '#38bdf8' : '#ff6200', 6, 0.9);
            }
            p.pierceRemaining -= 1;
            if (p.pierceRemaining <= 0) {
              hitBarrel = true;
            }
            // Break out before detonateArenaBarrel splices chained barrels from this.arenaBarrels
            if (barrelToDetonate || hitBarrel) break;
          }
        }
        if (barrelToDetonate) {
          this.detonateArenaBarrel(barrelToDetonate);
        }
        if (hitBarrel) {
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Player projectiles -> Hit Enemies
      if (!p.isEnemy) {
        let hitSomething = false;
        for (let j = 0; j < this.enemies.length; j++) {
          const enemy = this.enemies[j];
          if (enemy.state === 'ko') continue;
          if (checkCircleCollision(p.x, p.y, p.radius, enemy.x, enemy.y, enemy.radius)) {
            let isCrit = false;
            // Check Tank or Behemoth front shield - SHATTERS ON IMPACT with critical damage!
            if ((enemy.type === 'tank' || enemy.type === 'behemoth') && enemy.shieldArc) {
              const blocked = checkShieldBlock(
                enemy.x,
                enemy.y,
                enemy.angle,
                enemy.shieldArc,
                this.player.x,
                this.player.y
              );
              if (blocked) {
                // Break shield and allow bullet through with 1.6x critical damage
                enemy.shieldArc = 0;
                p.damage = Math.round(p.damage * 1.6);
                isCrit = true;
                soundEngine.playCritHit();
                this.emitBurst(enemy.x, enemy.y, '#00f3ff', 16, 1.8);
                this.spawnFloatingText('SHIELD SHATTERED! 1.6x CRIT', enemy.x, enemy.y - 42, '#00f3ff');
              }
            }

            // Phantom Phase Glitch & Shield-Breaker Kinetic Barrier Tactical Check
            let isResisted = false;
            let barrierBypassed = false;
            if (enemy.type === 'phantom' && enemy.isPhasing) {
              p.damage = Math.max(1, Math.round(p.damage * 0.35));
              isResisted = true;
              this.spawnFloatingText('PHASE GLITCH', enemy.x, enemy.y - 42, '#b026ff');
            } else if (enemy.type === 'shield_breaker' && (enemy.kineticBarrierHp ?? 0) > 0) {
              const sbHit = resolveShieldBreakerImpact({
                rawDamage: p.damage,
                weaponType: p.weaponType,
                barrierHp: enemy.kineticBarrierHp ?? 0,
              });
              enemy.kineticBarrierHp = sbHit.nextBarrierHp;
              enemy.kineticBarrierFlash = 0.22;
              p.damage = sbHit.hullDamage;
              if (sbHit.bypassed) {
                isCrit = true;
                barrierBypassed = true;
                soundEngine.playCritHit();
                this.emitBurst(enemy.x, enemy.y, '#00f3ff', 10, 1.2);
                if ((enemy.barrierHintCooldown ?? 0) <= 0) {
                  enemy.barrierHintCooldown = 1.4;
                  this.spawnFloatingText('⚡ BARRIER BYPASS!', enemy.x, enemy.y - 46, '#00f3ff');
                }
              } else if (sbHit.resisted) {
                isResisted = true;
                this.emitBurst(p.x, p.y, '#818cf8', 6, 0.8);
                if ((enemy.barrierHintCooldown ?? 0) <= 0) {
                  enemy.barrierHintCooldown = 1.8;
                  this.spawnFloatingText('🛡️ KINETIC BARRIER · USE BEAM/RAIL!', enemy.x, enemy.y - 46, '#38bdf8');
                }
              }
              if (sbHit.barrierShattered) {
                enemy.kineticBarrierDownTimer = enemy.kineticBarrierMaxDownSec ?? 5.0;
                if (enemy.state === 'windup') {
                  enemy.state = 'seek';
                  enemy.telegraphTimer = 0;
                }
                soundEngine.playExplosion();
                this.emitParticle(enemy.x, enemy.y, 0, 0, 120, '#38bdf8', 0.4, 'ring');
                this.emitBurst(enemy.x, enemy.y, '#00f3ff', 18, 1.6);
                this.spawnFloatingText('💥 KINETIC BARRIER OVERLOADED!', enemy.x, enemy.y - 54, '#38bdf8');
              }
            }

            // --- Combo Multiplier System (Consecutive Hits within Rolling Window) ---
            const ownerSlot: DuelSlotId = p.ownerSlot || 'p1';
            const isSpectatorView = Boolean(this.isDuelMode && this.duelConfig?.isSpectator);
            const comboWindow = this.cachedDiamondRelics.chrono_flux ? 5.5 : 3.0;
            let activeComboMult = 1.0;

            if (isSpectatorView) {
              activeComboMult = 1.0;
            } else if (this.isDuelMode && this.duelP1Score && this.duelP2Score) {
              const slotScore = this.getDuelScoreRef(ownerSlot) || this.duelP1Score;
              const timers = this.getDuelTimerSlotState(ownerSlot, this.duelConfig?.mode === 'online');
              slotScore.comboStreak += 1;
              if (slotScore.comboStreak > slotScore.bestCombo) {
                slotScore.bestCombo = slotScore.comboStreak;
              }
              timers.setComboTimer(comboWindow);
              const fin = advanceComboFinisherState(
                slotScore.finisherCharge || 0,
                Boolean(slotScore.finisherReady),
                slotScore.comboStreak
              );
              slotScore.finisherCharge = fin.charge;
              slotScore.finisherReady = fin.ready;
              if (fin.justBecameReady) {
                const actorPos = this.getDuelActorRef(ownerSlot) || this.player;
                soundEngine.playFinisherReady();
                this.spawnFloatingText(
                  `⚡ ${COMBO_FINISHER_THRESHOLD}-HIT FINISHER READY!`,
                  actorPos.x,
                  actorPos.y - 52,
                  '#ffd700'
                );
                this.emitParticle(actorPos.x, actorPos.y, 0, 0, 95, '#ffd700', 0.35, 'ring');
              }
              activeComboMult = getComboMultiplier(slotScore.comboStreak);
            } else {
              this.stats.comboStreak += 1;
              this.stats.comboCount = this.stats.comboStreak;
              this.stats.comboTimer = comboWindow;
              this.stats.comboMultiplier = getComboMultiplier(this.stats.comboCount);
              if (this.stats.comboCount > this.stats.highestCombo) {
                this.stats.highestCombo = this.stats.comboCount;
              }
              this.stats.maxCombo = this.stats.highestCombo;
              this.finisherChargeProgress += this.cachedStoreGearMods.finisherChargeMultiplier;
              const finSteps = Math.floor(this.finisherChargeProgress);
              this.finisherChargeProgress -= finSteps;
              const prevCharge = this.stats.comboFinisherCharge || 0;
              const prevReady = Boolean(this.stats.comboFinisherReady);
              const baseFin = advanceComboFinisherState(
                Math.min(COMBO_FINISHER_THRESHOLD, prevCharge + Math.max(0, finSteps - 1)),
                prevReady,
                this.stats.comboStreak
              );
              const finJustReady = !prevReady && baseFin.ready;
              this.stats.comboFinisherCharge = baseFin.charge;
              this.stats.comboFinisherReady = baseFin.ready;
              if (finJustReady) {
                soundEngine.playFinisherReady();
                this.spawnFloatingText(
                  `⚡ ${COMBO_FINISHER_THRESHOLD}-HIT COMBO FINISHER READY! PRESS [E]`,
                  this.player.x,
                  this.player.y - 58,
                  '#ffd700'
                );
                this.emitParticle(this.player.x, this.player.y, 0, 0, 105, '#ffd700', 0.4, 'ring');
                this.emitBurst(this.player.x, this.player.y, '#ffd700', 14, 1.3);
              }
              activeComboMult = this.stats.comboMultiplier;
            }

            // Damage scaled with active combo multiplier + Weapon Mastery critical strike roll
            if (p.weaponType) {
              enemy.lastHitWeapon = p.weaponType;
              if (!this.isDuelMode || !this.duelConfig?.isSpectator) {
                this.awardMastery(p.weaponType, 'hit');
                const mTier = getMasteryTierForXp(this.weaponMastery[p.weaponType]?.xp || 0);
                const modCritBonus = this.cachedStoreGearMods.critChanceBonus;
                const boosterCritBonus = this.activeBoosters.includes('vampiric_surge') ? 0.12 : 0;
                const totalCritChance = Math.min(0.85, (mTier.critChance || 0) + modCritBonus + boosterCritBonus);
                if (!isCrit && !barrierBypassed && totalCritChance > 0 && Math.random() < totalCritChance) {
                  isCrit = true;
                  p.damage = Math.round(p.damage * 1.75);
                  soundEngine.playCritHit();
                  this.emitBurst(enemy.x, enemy.y, '#facc15', 10, 1.2);
                }
              }
            }
            const hitDamage = Math.max(1, Math.round(p.damage * activeComboMult));
            if (isSpectatorView) {
              enemy.hp = Math.max(1, enemy.hp - hitDamage);
            } else {
              enemy.hp -= hitDamage;
              if (this.isDuelMode && this.duelP1Score && this.duelP2Score) {
                const slotScore = this.getDuelScoreRef(ownerSlot) || this.duelP1Score;
                slotScore.damageDealt += hitDamage;
                if (enemy.hp <= 0) {
                  this.killEnemy(enemy, ownerSlot);
                }
              }
            }
            soundEngine.playHitImpact();
            this.emitBurst(p.x, p.y, p.color, 6, 0.8);

            // Determine damage category from projectile and hit traits
            const damageCategory = mapWeaponToDamageCategory(
              p.weaponType,
              Boolean(p.explosionRadius),
              isCrit,
              isResisted
            );

            // Render floating, fading damage number with color varying by damage type
            this.spawnDamageText(
              hitDamage,
              enemy.x,
              enemy.y,
              damageCategory,
              isCrit,
              activeComboMult
            );

            // Apply Cryo Frost slow from Cryo-Shatter weapon or Cryo-Frost Sentinel Drone
            if (p.cryoSlowDuration && p.cryoSlowDuration > 0) {
              enemy.cryoSlowTimer = Math.max(enemy.cryoSlowTimer || 0, p.cryoSlowDuration);
              this.emitBurst(enemy.x, enemy.y, '#67e8f9', 5, 0.8);
            }

            // Explosive AOE Damage (Missiles and Vortex)
            if (p.explosionRadius) {
              const radius = p.explosionRadius;
              const radiusSq = radius * radius;
              soundEngine.playExplosion();
              this.addCameraTrauma(
                radius >= 65 ? getBossAttackShakeTrauma('heavy_explosion') : 0.11
              );
              this.emitBurst(p.x, p.y, p.color, radius >= 65 ? 20 : 14, radius >= 65 ? 1.5 : 1.2);
              this.emitParticle(p.x, p.y, 0, 0, radius * 1.5, p.color, 0.35, 'ring');

              for (let oi = 0; oi < this.enemies.length; oi++) {
                const other = this.enemies[oi];
                if (other.state === 'ko' || other.id === enemy.id) continue;
                const dx = other.x - p.x;
                const dy = other.y - p.y;
                if (dx * dx + dy * dy <= radiusSq) {
                  const splashDmg = Math.max(1, Math.round(hitDamage * 0.7));
                  if (isSpectatorView) {
                    other.hp = Math.max(1, other.hp - splashDmg);
                  } else {
                    other.hp -= splashDmg;
                    if (this.isDuelMode && this.duelP1Score && this.duelP2Score) {
                      const slotScore = this.getDuelScoreRef(ownerSlot) || this.duelP1Score;
                      slotScore.damageDealt += splashDmg;
                      if (other.hp <= 0) {
                        this.killEnemy(other, ownerSlot);
                      }
                    }
                  }
                  // Explosive splash damage text with distinct blast orange styling
                  this.spawnDamageText(splashDmg, other.x, other.y, 'explosive', false, 1.0);
                }
              }
            }

            // Vortex Gravitational Implosion Pull
            if (p.pullRadius) {
              const pullRadiusSq = p.pullRadius * p.pullRadius;
              for (let oi = 0; oi < this.enemies.length; oi++) {
                const other = this.enemies[oi];
                if (other.state === 'ko') continue;
                const dx = other.x - p.x;
                const dy = other.y - p.y;
                const dSq = dx * dx + dy * dy;
                if (dSq <= pullRadiusSq && dSq > 100) {
                  const d = Math.sqrt(dSq);
                  const pullForce = 320 * (1 - d / p.pullRadius);
                  const pAngle = Math.atan2(p.y - other.y, p.x - other.x);
                  other.vx += Math.cos(pAngle) * pullForce;
                  other.vy += Math.sin(pAngle) * pullForce;
                }
              }
            }

            // Subtle trauma kick on heavy damage without pausing/freezing gameplay frames
            if (p.damage >= 50) {
              this.addCameraTrauma(0.06, 0.45);
            }

            // Tesla Chain Arc Lightning Protocol (Cyber-Augment)
            if (!this.isDuelMode && !p.isWingmanBolt) {
              const chainMods = this.cachedAugMods;
              if (chainMods.chainArcTargets > 0) {
                let arcsRemaining = chainMods.chainArcTargets;
                let sourceX = enemy.x;
                let sourceY = enemy.y;
                const chainDmg = Math.max(4, Math.round(hitDamage * chainMods.chainArcDamageRatio));
                const chainedIds = new Set<number>([enemy.id]);
                for (let hop = 0; hop < arcsRemaining; hop++) {
                  let bestNext: Enemy | null = null;
                  let bestDistSq = 240 * 240;
                  for (let oi = 0; oi < this.enemies.length; oi++) {
                    const cand = this.enemies[oi];
                    if (cand.state === 'ko' || chainedIds.has(cand.id)) continue;
                    const dx = cand.x - sourceX;
                    const dy = cand.y - sourceY;
                    const distHopSq = dx * dx + dy * dy;
                    if (distHopSq < bestDistSq) {
                      bestDistSq = distHopSq;
                      bestNext = cand;
                    }
                  }
                  if (!bestNext) break;
                  chainedIds.add(bestNext.id);
                  bestNext.hp -= chainDmg;
                  this.spawnDamageText(chainDmg, bestNext.x, bestNext.y, 'electric', false, 1.0);
                  this.emitBurst(bestNext.x, bestNext.y, '#38bdf8', 5, 0.8);
                  const midX = (sourceX + bestNext.x) * 0.5 + (Math.random() - 0.5) * 28;
                  const midY = (sourceY + bestNext.y) * 0.5 + (Math.random() - 0.5) * 28;
                  this.electricArcs.push({
                    points: [
                      { x: sourceX, y: sourceY },
                      { x: midX, y: midY },
                      { x: bestNext.x, y: bestNext.y },
                    ],
                    color: '#38bdf8',
                    life: 0.16,
                    maxLife: 0.16,
                  });
                  if (bestNext.hp <= 0) {
                    this.killEnemy(bestNext, ownerSlot);
                  }
                  sourceX = bestNext.x;
                  sourceY = bestNext.y;
                }
              }
            }

            p.pierceRemaining -= 1;
            if (p.pierceRemaining <= 0) {
              hitSomething = true;
              break;
            }
          }
        }

        // PvP Duel Hit Check (Player projectile vs opposing Players across p1..p6 with team friendly-fire protection)
        if (!hitSomething && this.isDuelMode && this.duelP1Score && this.duelConfig) {
          const ownerSlot: DuelSlotId = p.ownerSlot || 'p1';
          const shooterScore = this.getDuelScoreRef(ownerSlot);
          const isOnline = this.duelConfig.mode === 'online';
          const isSpectatorView = Boolean(this.duelConfig.isSpectator);
          const localSlot = this.duelConfig.localSlot || 'p1';
          const prevX = p.x - p.vx * dt;
          const prevY = p.y - p.vy * dt;
          const segDx = p.x - prevX;
          const segDy = p.y - prevY;
          const segLenSq = segDx * segDx + segDy * segDy;

          for (const targetSlot of this.getActiveDuelSlots()) {
            if (targetSlot === ownerSlot) continue;
            const targetActor = this.getDuelActorRef(targetSlot);
            const targetScore = this.getDuelScoreRef(targetSlot);
            if (!targetActor || !targetScore || !targetScore.connected) continue;
            if (!canDamageDuelTarget(this.duelMatchFormat, shooterScore || { slot: ownerSlot }, targetScore)) continue;

            if (
              targetScore.respawnTimer <= 0 &&
              !targetActor.isDashing &&
              targetActor.invulnerableTimer <= 0
            ) {
              const hitRadius = p.radius + targetActor.radius;
              let hitDetected = checkCircleCollision(p.x, p.y, p.radius, targetActor.x, targetActor.y, targetActor.radius);
              if (!hitDetected && segLenSq > 1) {
                const t = Math.max(0, Math.min(1, ((targetActor.x - prevX) * segDx + (targetActor.y - prevY) * segDy) / segLenSq));
                const closestX = prevX + segDx * t;
                const closestY = prevY + segDy * t;
                const distSq = (targetActor.x - closestX) ** 2 + (targetActor.y - closestY) ** 2;
                hitDetected = distSq <= hitRadius * hitRadius;
              }
              if (hitDetected) {
                const pvpDamage = computePvpProjectileDamage(p.damage);
                this.emitBurst(p.x, p.y, p.color, 8, 1.0);
                if (!isSpectatorView) {
                  this.spawnDamageText(pvpDamage, targetActor.x, targetActor.y, 'kinetic', false, 1.0);
                  soundEngine.playHitImpact();
                }

                if (!isOnline && !isSpectatorView) {
                  this.handleDuelPlayerDamaged(targetSlot, pvpDamage, p.x, p.y, ownerSlot);
                } else if (!isSpectatorView && ownerSlot === localSlot && this.duelClient) {
                  if (shooterScore) shooterScore.damageDealt += pvpDamage;
                  this.duelClient.sendPvpHit(targetSlot, pvpDamage, p.x, p.y);
                }
                hitSomething = true;
                break;
              }
            }
          }
        }

        if (hitSomething) {
          this.projectiles.splice(i, 1);
          continue;
        }
      } else {
        // Enemy projectiles -> Hit Player(s)
        if (this.isDuelMode) {
          let consumed = false;
          if (
            this.duelP1Score &&
            this.duelP1Score.respawnTimer <= 0 &&
            !this.player.isDashing &&
            this.player.invulnerableTimer <= 0 &&
            checkCircleCollision(p.x, p.y, p.radius, this.player.x, this.player.y, this.player.radius)
          ) {
            this.handleDuelPlayerDamaged('p1', p.damage, p.x, p.y);
            consumed = true;
          } else if (
            this.duelP2Score &&
            this.duelP2Score.respawnTimer <= 0 &&
            !this.player2.isDashing &&
            this.player2.invulnerableTimer <= 0 &&
            checkCircleCollision(p.x, p.y, p.radius, this.player2.x, this.player2.y, this.player2.radius)
          ) {
            this.handleDuelPlayerDamaged('p2', p.damage, p.x, p.y);
            consumed = true;
          }
          if (consumed) {
            this.projectiles.splice(i, 1);
            continue;
          }
        } else if (!this.player.isDashing && this.player.invulnerableTimer <= 0) {
          if (checkCircleCollision(p.x, p.y, p.radius, this.player.x, this.player.y, this.player.radius)) {
            this.handlePlayerDamaged(p.damage, p.x, p.y);
            this.projectiles.splice(i, 1);
            continue;
          }
        }
      }
    }
  }

  private handleDuelPlayerDamaged(
    slot: DuelSlotId,
    amount: number,
    fromX: number,
    fromY: number,
    attackerSlot?: DuelSlotId
  ) {
    if (!this.duelP1Score || !this.duelConfig) return;
    if (this.duelConfig.isSpectator) return;
    const isOnline = this.duelConfig.mode === 'online';
    const localSlot = this.duelConfig.localSlot || 'p1';
    if (isOnline && slot !== localSlot) return;

    const actor = this.getDuelActorRef(slot);
    const scoreState = this.getDuelScoreRef(slot);
    if (!actor || !scoreState || scoreState.respawnTimer > 0) return;

    const attackerScore = attackerSlot ? this.getDuelScoreRef(attackerSlot) : null;
    if (attackerSlot && attackerScore && !canDamageDuelTarget(this.duelMatchFormat, attackerScore, scoreState)) {
      return;
    }

    if (!isOnline && attackerScore && attackerSlot !== slot) {
      attackerScore.damageDealt += amount;
    }

    const dmgRes = applyPvpDamageToPool({
      shield: scoreState.shield,
      hp: scoreState.hp,
      maxHp: scoreState.maxHp,
      damage: amount,
    });
    scoreState.shield = dmgRes.shield;
    scoreState.hp = dmgRes.hp;

    if (dmgRes.shieldAbsorbed > 0) {
      this.spawnDamageText(Math.round(dmgRes.shieldAbsorbed), actor.x, actor.y, 'kinetic', false, 1.0);
    }
    if (dmgRes.hpLost > 0) {
      this.spawnFloatingText(`-${dmgRes.hpLost} HP`, actor.x, actor.y - 30, '#ff0055');
    }

    const timers = this.getDuelTimerSlotState(slot, isOnline);
    timers.setShieldCd(PVP_SHIELD_RECHARGE_DELAY_SECONDS);

    scoreState.comboStreak = 0;
    scoreState.finisherCharge = 0;
    scoreState.finisherReady = false;
    const angle = Math.atan2(actor.y - fromY, actor.x - fromX);
    actor.vx += Math.cos(angle) * 240;
    actor.vy += Math.sin(angle) * 240;
    this.emitBurst(actor.x, actor.y, scoreState.color, 12, 1.2);
    soundEngine.playExplosion();

    if (isOnline) {
      this.duelStateSyncTimer = 0.05;
    }

    if (dmgRes.isKO) {
      scoreState.deaths += 1;
      scoreState.respawnTimer = PVP_RESPAWN_DURATION_SECONDS;
      const resetMom = resetCyberMomentum();
      scoreState.momentumKills = resetMom.momentumKills;
      scoreState.momentumTimer = resetMom.momentumTimer;
      const trail = this.getDuelTrailRef(slot);
      trail.length = 0;
      this.spawnFloatingText(`${scoreState.name} REBOOTING...`, actor.x, actor.y - 36, '#ff0055');
      if (isOnline && this.duelClient) {
        this.duelClient.reportKO(attackerSlot);
      } else if (!isOnline && attackerScore && attackerSlot && attackerSlot !== slot) {
        attackerScore.pvpKills += 1;
        attackerScore.comboStreak += 1;
        if (attackerScore.comboStreak > attackerScore.bestCombo) {
          attackerScore.bestCombo = attackerScore.comboStreak;
        }
        const pvpReward = computeDuelPvpTakedownReward(this.duelElapsedTime);
        attackerScore.pvpBonusPoints += pvpReward;
        attackerScore.totalPoints =
          attackerScore.baseKillPoints + attackerScore.comboBonusPoints + attackerScore.pvpBonusPoints;

        const momRes = advanceCyberMomentumOnKill(attackerScore);
        attackerScore.momentumKills = momRes.momentumKills;
        attackerScore.momentumTimer = momRes.momentumTimer;
        attackerScore.momentumActivations = momRes.momentumActivations;
        const attackerActor = this.getDuelActorRef(attackerSlot) || this.player;
        this.spawnFloatingText(`⚔️ +${pvpReward} PVP KO!`, actor.x, actor.y - 58, attackerScore.color);
        if (momRes.triggered) {
          this.spawnFloatingText('⚡ CYBER MOMENTUM! +35% SPD', attackerActor.x, attackerActor.y - 44, attackerScore.color);
          this.emitBurst(attackerActor.x, attackerActor.y, attackerScore.color, 20, 1.5);
          soundEngine.playMomentumBoost();
        }
        if (this.duelP2Score) {
          const majorEvents = evaluateDuelMajorEvents({
            tracker: this.duelEventTracker,
            p1: this.duelP1Score,
            p2: this.duelP2Score,
            actingSlot: attackerSlot,
            elapsedSeconds: this.duelElapsedTime,
            pvpKO: true,
            pvpRewardPoints: pvpReward,
            momentumTriggered: momRes.triggered,
          });
          if (majorEvents.length > 0) {
            this.duelKillFeed.push(...majorEvents);
          }
        }
        this.emitDuelSyncSnapshot();
      }
    }
  }

  private handlePlayerDamaged(amount: number, fromX: number, fromY: number) {
    if (this.isDuelMode) {
      this.handleDuelPlayerDamaged('p1', amount, fromX, fromY);
      return;
    }
    const res = applyDamageToPlayer(this.stats, amount);
    this.stats = res.newStats;
    if (res.shieldAbsorbed > 0 || res.hpLost > 0) {
      this.tookDamageInSector = true;
    }

    this.addCameraTrauma(0.35);

    soundEngine.playExplosion();
    this.emitBurst(this.player.x, this.player.y, '#ff0055', 20, 1.5);

    // Knockback
    const angle = Math.atan2(this.player.y - fromY, this.player.x - fromX);
    this.player.vx += Math.cos(angle) * 320;
    this.player.vy += Math.sin(angle) * 320;

    // Reset combo streak on taking damage
    this.stats.comboStreak = 0;
    this.stats.comboCount = 0;
    this.stats.comboMultiplier = 1.0;
    this.stats.comboTimer = 0;
    this.stats.comboFinisherCharge = 0;
    this.stats.comboFinisherReady = false;

    if (res.shieldAbsorbed > 0) {
      this.spawnFloatingText(`-${res.shieldAbsorbed} SHIELD`, this.player.x, this.player.y - 30, '#00f3ff');
    }
    if (res.hpLost > 0) {
      this.spawnFloatingText(`-${res.hpLost} HP`, this.player.x, this.player.y - 50, '#ff0055');
    }

    if (res.isDead) {
      this.triggerGameOver(false);
    }
  }

  /**
   * Unleashes the 20-Hit Combo Finisher AoE Overload with expanding plasma shockwaves and heavy screen shake.
   */
  public triggerComboFinisher(requestedSlot?: DuelSlotId): boolean {
    if (this.state !== 'playing') return false;
    if (this.isDuelMode && this.duelConfig?.isSpectator) return false;

    const craft = getCraftDef(this.activeCraft);

    if (this.isDuelMode && this.duelP1Score && this.duelConfig) {
      const isOnline = this.duelConfig.mode === 'online';
      const slot: DuelSlotId = isOnline
        ? this.duelConfig.localSlot || 'p1'
        : requestedSlot || this.duelConfig.localSlot || 'p1';
      const scoreState = this.getDuelScoreRef(slot);
      const actor = this.getDuelActorRef(slot);
      if (!scoreState || !actor) return false;
      const timers = this.getDuelTimerSlotState(slot, isOnline);
      const timer = timers.getComboTimer();

      if (scoreState.respawnTimer > 0) return false;
      if (
        !canActivateComboFinisher({
          ready: Boolean(scoreState.finisherReady),
          streak: scoreState.comboStreak,
          comboTimer: timer,
        })
      ) {
        return false;
      }

      scoreState.finisherCharge = 0;
      scoreState.finisherReady = false;
      timers.setComboTimer(Math.max(timer, 2.5));

      this.addCameraTrauma(COMBO_FINISHER_TRAUMA);
      soundEngine.playComboFinisher();

      this.finisherShockwaves.push({
        x: actor.x,
        y: actor.y,
        maxRadius: COMBO_FINISHER_RADIUS,
        life: 0.55,
        maxLife: 0.55,
        color: scoreState.color || '#00f3ff',
        secondaryColor: '#ffd700',
      });
      this.emitBurst(actor.x, actor.y, scoreState.color || '#00f3ff', 36, 2.2);
      this.emitParticle(actor.x, actor.y, 0, 0, COMBO_FINISHER_RADIUS * 0.85, '#ffd700', 0.35, 'ring');
      this.spawnFloatingText('⚡ COMBO FINISHER NOVA!', actor.x, actor.y - 82, '#ffd700');

      const comboMult = getComboMultiplier(scoreState.comboStreak);
      this.isResolvingFinisher = true;
      try {
        for (const enemy of this.enemies) {
          if (enemy.state === 'ko') continue;
          const dist = Math.hypot(enemy.x - actor.x, enemy.y - actor.y);
          const blast = computeComboFinisherExplosion({
            damageUpgradeLvl: this.stats.upgrades.damageLvl,
            craftDamageMultiplier: craft.damageMultiplier,
            comboMultiplier: comboMult,
            wave: this.duelWaveCounter,
            distanceFromCenter: dist,
          });
          if (!blast.inRange) continue;

          const kbAngle = Math.atan2(enemy.y - actor.y, enemy.x - actor.x);
          enemy.vx += Math.cos(kbAngle) * blast.knockbackForce;
          enemy.vy += Math.sin(kbAngle) * blast.knockbackForce;
          if (enemy.state === 'windup') {
            enemy.state = 'seek';
            enemy.telegraphTimer = 0;
          }
          enemy.hp -= blast.enemyDamage;
          scoreState.damageDealt += blast.enemyDamage;
          this.spawnDamageText(blast.enemyDamage, enemy.x, enemy.y, 'cosmic', true, comboMult);
          if (enemy.hp <= 0) {
            this.killEnemy(enemy, slot);
          }
        }

        for (const oppSlot of this.getActiveDuelSlots()) {
          if (oppSlot === slot) continue;
          const oppActor = this.getDuelActorRef(oppSlot);
          const oppScore = this.getDuelScoreRef(oppSlot);
          if (!oppActor || !oppScore || !oppScore.connected) continue;
          if (!canDamageDuelTarget(this.duelMatchFormat, scoreState, oppScore)) continue;
          if (
            oppScore.respawnTimer <= 0 &&
            !oppActor.isDashing &&
            oppActor.invulnerableTimer <= 0
          ) {
            const oppDist = Math.hypot(oppActor.x - actor.x, oppActor.y - actor.y);
            const oppBlast = computeComboFinisherExplosion({
              damageUpgradeLvl: this.stats.upgrades.damageLvl,
              craftDamageMultiplier: craft.damageMultiplier,
              comboMultiplier: comboMult,
              wave: this.duelWaveCounter,
              distanceFromCenter: oppDist,
            });
            if (oppBlast.inRange) {
              const pvpDamage = Math.max(35, Math.min(160, Math.round(oppBlast.enemyDamage * 0.35)));
              this.spawnDamageText(pvpDamage, oppActor.x, oppActor.y, 'cosmic', true, 1.0);
              if (isOnline && this.duelClient) {
                scoreState.damageDealt += pvpDamage;
                this.duelClient.sendPvpHit(oppSlot, pvpDamage, actor.x, actor.y);
              } else {
                this.handleDuelPlayerDamaged(oppSlot, pvpDamage, actor.x, actor.y, slot);
              }
            }
          }
        }
      } finally {
        this.isResolvingFinisher = false;
      }

      this.emitDuelSyncSnapshot();
      return true;
    }

    // Single-Player Campaign Combo Finisher
    if (
      !canActivateComboFinisher({
        ready: Boolean(this.stats.comboFinisherReady),
        streak: Math.max(this.stats.comboStreak, this.stats.comboFinisherCharge || 0),
        comboTimer: this.stats.comboTimer,
      })
    ) {
      return false;
    }

    this.stats.comboFinisherCharge = 0;
    this.stats.comboFinisherReady = false;
    this.finisherChargeProgress = 0;
    this.stats.comboTimer = Math.max(this.stats.comboTimer, 2.5);

    this.addCameraTrauma(COMBO_FINISHER_TRAUMA);
    soundEngine.playComboFinisher();

    this.player.scaleX = 1.35;
    this.player.scaleY = 1.35;

    this.finisherShockwaves.push({
      x: this.player.x,
      y: this.player.y,
      maxRadius: COMBO_FINISHER_RADIUS,
      life: 0.58,
      maxLife: 0.58,
      color: '#00f3ff',
      secondaryColor: '#ffd700',
    });

    this.emitBurst(this.player.x, this.player.y, '#00f3ff', 28, 2.3);
    this.emitBurst(this.player.x, this.player.y, '#ffd700', 18, 1.9);
    this.emitParticle(this.player.x, this.player.y, 0, 0, COMBO_FINISHER_RADIUS * 0.6, '#00f3ff', 0.28, 'ring');
    this.emitParticle(this.player.x, this.player.y, 0, 0, COMBO_FINISHER_RADIUS, '#ffd700', 0.42, 'ring');

    this.stats.score += 250;
    this.spawnFloatingText('⚡ COMBO FINISHER OVERLOAD!', this.player.x, this.player.y - 86, '#ffd700');

    const comboMult = this.stats.comboMultiplier || 1.0;
    this.isResolvingFinisher = true;
    try {
      for (const enemy of this.enemies) {
        if (enemy.state === 'ko') continue;
        const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        const blast = computeComboFinisherExplosion({
          damageUpgradeLvl: this.stats.upgrades.damageLvl,
          craftDamageMultiplier: craft.damageMultiplier,
          comboMultiplier: comboMult,
          wave: this.currentWave,
          distanceFromCenter: dist,
        });
        if (!blast.inRange) continue;

        const kbAngle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
        enemy.vx += Math.cos(kbAngle) * blast.knockbackForce;
        enemy.vy += Math.sin(kbAngle) * blast.knockbackForce;
        if (enemy.state === 'windup') {
          enemy.state = 'seek';
          enemy.telegraphTimer = 0;
        }

        enemy.hp -= blast.enemyDamage;
        this.spawnDamageText(blast.enemyDamage, enemy.x, enemy.y, 'cosmic', true, comboMult);
        this.emitBurst(enemy.x, enemy.y, '#ffd700', 10, 1.2);
        if (enemy.hp <= 0) {
          this.killEnemy(enemy);
        }
      }
    } finally {
      this.isResolvingFinisher = false;
    }

    const activeEnemies = this.countAliveEnemies();
    this.onStatsSync(this.stats, this.currentWave, activeEnemies, this.bossActive);
    return true;
  }

  private getEnemyTargetForUpdate(e: Enemy): { x: number; y: number; slot: DuelSlotId; isDashing: boolean; invulnerableTimer: number; radius: number } {
    if (!this.isDuelMode || !this.duelP1Score || !this.duelP2Score) {
      return {
        x: this.player.x,
        y: this.player.y,
        slot: 'p1',
        isDashing: this.player.isDashing,
        invulnerableTimer: this.player.invulnerableTimer,
        radius: this.player.radius,
      };
    }

    const p1Alive = this.duelP1Score.respawnTimer <= 0;
    const p2Alive = this.duelP2Score.respawnTimer <= 0;
    if (p1Alive && !p2Alive) {
      return { x: this.player.x, y: this.player.y, slot: 'p1', isDashing: this.player.isDashing, invulnerableTimer: this.player.invulnerableTimer, radius: this.player.radius };
    }
    if (p2Alive && !p1Alive) {
      return { x: this.player2.x, y: this.player2.y, slot: 'p2', isDashing: this.player2.isDashing, invulnerableTimer: this.player2.invulnerableTimer, radius: this.player2.radius };
    }

    const d1 = Math.hypot(this.player.x - e.x, this.player.y - e.y) * (e.duelTargetSlot === 'p1' ? 0.85 : 1);
    const d2 = Math.hypot(this.player2.x - e.x, this.player2.y - e.y) * (e.duelTargetSlot === 'p2' ? 0.85 : 1);
    if (d2 < d1) {
      return { x: this.player2.x, y: this.player2.y, slot: 'p2', isDashing: this.player2.isDashing, invulnerableTimer: this.player2.invulnerableTimer, radius: this.player2.radius };
    }
    return { x: this.player.x, y: this.player.y, slot: 'p1', isDashing: this.player.isDashing, invulnerableTimer: this.player.invulnerableTimer, radius: this.player.radius };
  }

  // --- Enemies AI & Telegraphs Update ---
  private updateEnemies(dt: number) {
    const cryoMods = !this.isDuelMode ? this.cachedAugMods : null;
    const cryoAuraRadius = cryoMods?.cryoAuraRadius ?? 0;
    const cryoSlowFactor = cryoMods?.cryoSlowFactor ?? 1.0;
    const isPerfTier = this.adaptiveQuality.tier === 'performance';
    const activeWep = WEAPONS[this.stats.activeWeapon];
    const weaponRange = activeWep?.range ?? 900;
    const isFiring = this.mouse.isDown || this.virtualFiring || this.fireCooldownTimer > 0;
    const nowMs = this.frameNowMs || performance.now();

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      // If KO state (topple/dissolve arc)
      if (e.state === 'ko') {
        e.koTimer -= dt;
        e.radius = Math.max(0, e.radius - 20 * dt);
        if (e.koTimer <= 0) {
          this.enemies.splice(i, 1);
        }
        continue;
      }

      // Check if dead
      if (e.hp <= 0) {
        if (!(this.isDuelMode && this.duelConfig?.isSpectator)) {
          this.killEnemy(e);
        }
        continue;
      }

      // Distance & angle to target player
      const target = this.getEnemyTargetForUpdate(e);
      const dx = target.x - e.x;
      const dy = target.y - e.y;
      const distToPlayer = Math.hypot(dx, dy);
      const angleToPlayer = Math.atan2(dy, dx);

      // Decrement timers
      if (e.cooldownTimer > 0) e.cooldownTimer -= dt;
      if (e.kineticBarrierFlash && e.kineticBarrierFlash > 0) {
        e.kineticBarrierFlash = Math.max(0, e.kineticBarrierFlash - dt);
      }
      if (e.barrierHintCooldown && e.barrierHintCooldown > 0) {
        e.barrierHintCooldown = Math.max(0, e.barrierHintCooldown - dt);
      }
      if (e.type === 'shield_breaker' && (e.kineticBarrierHp ?? 0) <= 0 && (e.kineticBarrierDownTimer ?? 0) > 0) {
        e.kineticBarrierDownTimer = Math.max(0, (e.kineticBarrierDownTimer ?? 0) - dt);
        if (e.kineticBarrierDownTimer <= 0) {
          e.kineticBarrierHp = e.kineticBarrierMaxHp ?? computeShieldBreakerBarrierHp(e.maxHp);
          e.kineticBarrierFlash = 0.35;
          this.emitParticle(e.x, e.y, 0, 0, e.radius + 26, '#38bdf8', 0.35, 'ring');
          this.spawnFloatingText('🛡️ BARRIER RECHARGED!', e.x, e.y - 40, '#38bdf8');
        }
      }

      // Archetype Decision Policies:
      if (e.type === 'swarmer') {
        // Fast pack chaser with red lunge telegraph
        if (e.state === 'seek') {
          // Subtle weaving / zig-zag
          const weave = Math.sin(nowMs * 0.005 + e.id) * 0.35;
          e.angle = angleToPlayer + weave;
          e.vx = Math.cos(e.angle) * e.speed;
          e.vy = Math.sin(e.angle) * e.speed;

          // Trigger lunge windup when within close striking distance
          if (distToPlayer < 170 && e.cooldownTimer <= 0) {
            e.state = 'windup';
            e.telegraphTimer = e.telegraphDuration; // 0.35s
            e.vx *= 0.2;
            e.vy *= 0.2;
          }
        } else if (e.state === 'windup') {
          e.telegraphTimer -= dt;
          e.angle = angleToPlayer; // lock onto player during windup
          if (e.telegraphTimer <= 0) {
            // LUNGE!
            e.state = 'attack';
            e.vx = Math.cos(e.angle) * (e.speed * 2.6);
            e.vy = Math.sin(e.angle) * (e.speed * 2.6);
            e.cooldownTimer = 0.45;
          }
        } else if (e.state === 'attack') {
          e.cooldownTimer -= dt;
          if (e.cooldownTimer <= 0) {
            e.state = 'seek';
            e.cooldownTimer = 1.2;
          }
        }

        // Contact damage with player
        if (distToPlayer < e.radius + target.radius && !target.isDashing && target.invulnerableTimer <= 0) {
          if (this.isDuelMode) this.handleDuelPlayerDamaged(target.slot, e.contactDamage ?? 15, e.x, e.y);
          else this.handlePlayerDamaged(e.contactDamage ?? 15, e.x, e.y);
          e.vx = -Math.cos(angleToPlayer) * 150;
          e.vy = -Math.sin(angleToPlayer) * 150;
        }
      } else if (e.type === 'sniper') {
        // Kiter drone with charged laser sightline telegraph
        e.angle = angleToPlayer;

        if (e.state === 'seek') {
          // Maintain ideal distance: 420..600
          if (distToPlayer < 380) {
            // Back away
            e.vx = -Math.cos(angleToPlayer) * e.speed;
            e.vy = -Math.sin(angleToPlayer) * e.speed;
          } else if (distToPlayer > 620) {
            // Move closer
            e.vx = Math.cos(angleToPlayer) * e.speed;
            e.vy = Math.sin(angleToPlayer) * e.speed;
          } else {
            // Strafe perpendicular
            const strafeAngle = angleToPlayer + Math.PI / 2 * (e.id % 2 === 0 ? 1 : -1);
            e.vx = Math.cos(strafeAngle) * (e.speed * 0.7);
            e.vy = Math.sin(strafeAngle) * (e.speed * 0.7);
          }

          if (e.cooldownTimer <= 0 && distToPlayer < 750) {
            // Start laser telegraph windup
            e.state = 'windup';
            e.telegraphTimer = e.telegraphDuration; // scaled by level
            e.vx *= 0.1;
            e.vy *= 0.1;
            soundEngine.playTelegraphTone();
          }
        } else if (e.state === 'windup') {
          e.telegraphTimer -= dt;
          e.sniperLaserAim = { x: target.x, y: target.y };

          if (e.telegraphTimer <= 0) {
            // FIRE high speed sniper bolt!
            e.state = 'seek';
            e.cooldownTimer = 2.4;
            soundEngine.playBeamShoot();

            const boltAngle = Math.atan2(target.y - e.y, target.x - e.x);
            const boltSpeed = e.projectileSpeed ?? 850;
            const boltDamage = e.projectileDamage ?? 28;
            this.projectiles.push({
              id: this.nextId++,
              x: e.x + Math.cos(boltAngle) * (e.radius + 10),
              y: e.y + Math.sin(boltAngle) * (e.radius + 10),
              vx: Math.cos(boltAngle) * boltSpeed,
              vy: Math.sin(boltAngle) * boltSpeed,
              radius: 6,
              damage: boltDamage,
              rangeRemaining: 950,
              color: '#ff0077',
              isEnemy: true,
              pierceRemaining: 1,
              trail: [],
            });
            this.emitBurst(e.x, e.y, '#ff0077', 8, 1);
          }
        }
      } else if (e.type === 'tank') {
        // Enforcer with front directional shield and shockwave ground slam
        e.angle = angleToPlayer;

        if (e.state === 'seek') {
          e.vx = Math.cos(angleToPlayer) * e.speed;
          e.vy = Math.sin(angleToPlayer) * e.speed;

          if (distToPlayer < 190 && e.cooldownTimer <= 0) {
            e.state = 'windup';
            e.telegraphTimer = e.telegraphDuration;
            e.vx = 0;
            e.vy = 0;
          }
        } else if (e.state === 'windup') {
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            // Ground Slam Shockwave!
            e.state = 'seek';
            e.cooldownTimer = 3.2;
            soundEngine.playExplosion();
            this.addCameraTrauma(getBossAttackShakeTrauma('tank_slam', distToPlayer));

            // Ring shockwave particles
            this.emitParticle(e.x, e.y, 0, 0, 150, '#ffb400', 0.45, 'ring');

            // If player caught in shockwave radius (150px)
            if (distToPlayer < 150 && !target.isDashing && target.invulnerableTimer <= 0) {
              if (this.isDuelMode) this.handleDuelPlayerDamaged(target.slot, e.slamDamage ?? 6, e.x, e.y);
              else this.handlePlayerDamaged(e.slamDamage ?? 6, e.x, e.y);
            }
          }
        }

        // Contact damage
        if (distToPlayer < e.radius + target.radius && !target.isDashing && target.invulnerableTimer <= 0) {
          if (this.isDuelMode) this.handleDuelPlayerDamaged(target.slot, e.contactDamage ?? 6, e.x, e.y);
          else this.handlePlayerDamaged(e.contactDamage ?? 6, e.x, e.y);
          e.vx = -Math.cos(angleToPlayer) * 80;
          e.vy = -Math.sin(angleToPlayer) * 80;
        }
      } else if (e.type === 'phantom') {
        // Spectral assassin: phases in and out, high speed flank dash
        e.phaseAlpha = 0.3 + 0.7 * Math.abs(Math.sin(nowMs * 0.003 + e.id));
        e.isPhasing = (e.phaseAlpha ?? 1) < 0.65;
        e.angle = angleToPlayer;

        if (e.state === 'seek') {
          // Flank around player with high maneuverability
          const flankOffset = Math.sin(nowMs * 0.004 + e.id) * 0.8;
          e.vx = Math.cos(angleToPlayer + flankOffset) * e.speed;
          e.vy = Math.sin(angleToPlayer + flankOffset) * e.speed;

          if (distToPlayer < 240 && e.cooldownTimer <= 0) {
            e.state = 'windup';
            e.telegraphTimer = e.telegraphDuration;
            e.vx *= 0.2;
            e.vy *= 0.2;
            soundEngine.playTelegraphTone();
          }
        } else if (e.state === 'windup') {
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            // Sudden phase strike dash!
            e.state = 'attack';
            e.vx = Math.cos(angleToPlayer) * (e.speed * 2.8);
            e.vy = Math.sin(angleToPlayer) * (e.speed * 2.8);
            e.cooldownTimer = 0.5;
            this.emitBurst(e.x, e.y, '#b026ff', 10, 1.2);
          }
        } else if (e.state === 'attack') {
          e.cooldownTimer -= dt;
          if (e.cooldownTimer <= 0) {
            e.state = 'seek';
            e.cooldownTimer = 2.0;
          }
        }

        // Contact damage
        if (distToPlayer < e.radius + target.radius && !target.isDashing && target.invulnerableTimer <= 0) {
          if (this.isDuelMode) this.handleDuelPlayerDamaged(target.slot, e.contactDamage ?? 22, e.x, e.y);
          else this.handlePlayerDamaged(e.contactDamage ?? 22, e.x, e.y);
          e.vx = -Math.cos(angleToPlayer) * 160;
          e.vy = -Math.sin(angleToPlayer) * 160;
        }
      } else if (e.type === 'storm_drone') {
        // Electrified hex drone: maintains orbit and shoots tracking shock orbs
        e.angle += 3.0 * dt; // Rapid rotation of lightning vanes
        const idealDist = 340;
        const radialDiff = distToPlayer - idealDist;
        const radialSpeed = Math.sign(radialDiff) * Math.min(e.speed, Math.abs(radialDiff) * 0.8);
        const tangSpeed = e.speed * 0.8 * (e.id % 2 === 0 ? 1 : -1);
        const tangAngle = angleToPlayer + Math.PI / 2;

        e.vx = Math.cos(angleToPlayer) * radialSpeed + Math.cos(tangAngle) * tangSpeed;
        e.vy = Math.sin(angleToPlayer) * radialSpeed + Math.sin(tangAngle) * tangSpeed;

        if (e.cooldownTimer <= 0) {
          e.cooldownTimer = 2.4;
          soundEngine.playBeamShoot();

          // Fire twin shock orbs
          for (const side of [-0.25, 0.25]) {
            const fireAngle = angleToPlayer + side;
            this.projectiles.push({
              id: this.nextId++,
              x: e.x + Math.cos(fireAngle) * (e.radius + 8),
              y: e.y + Math.sin(fireAngle) * (e.radius + 8),
              vx: Math.cos(fireAngle) * (e.projectileSpeed ?? 420),
              vy: Math.sin(fireAngle) * (e.projectileSpeed ?? 420),
              radius: 8,
              damage: e.projectileDamage ?? 20,
              rangeRemaining: 750,
              color: '#00f3ff',
              isEnemy: true,
              isShockOrb: true,
              pierceRemaining: 1,
              trail: [],
            });
          }
          this.emitBurst(e.x, e.y, '#00f3ff', 8, 1);
        }
      } else if (e.type === 'shield_breaker') {
        // Shield-Breaker Aegis Sentinel: 360 kinetic barrier + Disruptor Triple-Bolt & close shockwave
        e.angle = angleToPlayer;
        if (e.state === 'seek') {
          const idealDist = 250;
          if (distToPlayer < 170) {
            const strafeAngle = angleToPlayer + (Math.PI * 0.62) * (e.id % 2 === 0 ? 1 : -1);
            e.vx = Math.cos(strafeAngle) * e.speed;
            e.vy = Math.sin(strafeAngle) * e.speed;
          } else if (distToPlayer > idealDist + 50) {
            e.vx = Math.cos(angleToPlayer) * e.speed;
            e.vy = Math.sin(angleToPlayer) * e.speed;
          } else {
            const strafeAngle = angleToPlayer + (Math.PI / 2) * (e.id % 2 === 0 ? 1 : -1);
            e.vx = Math.cos(strafeAngle) * (e.speed * 0.8);
            e.vy = Math.sin(strafeAngle) * (e.speed * 0.8);
          }

          if (distToPlayer < 480 && e.cooldownTimer <= 0) {
            e.state = 'windup';
            e.telegraphTimer = e.telegraphDuration;
            e.vx *= 0.2;
            e.vy *= 0.2;
            soundEngine.playTelegraphTone();
          }
        } else if (e.state === 'windup') {
          e.telegraphTimer -= dt;
          if (e.telegraphTimer <= 0) {
            e.state = 'seek';
            e.cooldownTimer = 2.6;
            soundEngine.playScatterShoot();
            // Triple kinetic disruptor lance burst
            const projDmg = e.projectileDamage ?? 20;
            const projSpd = e.projectileSpeed ?? 520;
            for (const spreadOff of [-0.22, 0, 0.22]) {
              const shotAng = angleToPlayer + spreadOff;
              this.projectiles.push({
                id: this.nextId++,
                x: e.x + Math.cos(shotAng) * (e.radius + 10),
                y: e.y + Math.sin(shotAng) * (e.radius + 10),
                vx: Math.cos(shotAng) * projSpd,
                vy: Math.sin(shotAng) * projSpd,
                radius: 7,
                damage: projDmg,
                rangeRemaining: 760,
                color: '#38bdf8',
                isEnemy: true,
                pierceRemaining: 1,
                trail: [],
              });
            }
            this.emitBurst(e.x, e.y, '#38bdf8', 12, 1.1);

            // Close-range Kinetic Disruptor Pulse
            if (distToPlayer < 190) {
              this.emitParticle(e.x, e.y, 0, 0, 185, '#38bdf8', 0.4, 'ring');
              if (!target.isDashing && target.invulnerableTimer <= 0) {
                if (this.isDuelMode) this.handleDuelPlayerDamaged(target.slot, e.slamDamage ?? 16, e.x, e.y);
                else this.handlePlayerDamaged(e.slamDamage ?? 16, e.x, e.y);
              }
            }
          }
        }

        // Contact damage
        if (distToPlayer < e.radius + target.radius && !target.isDashing && target.invulnerableTimer <= 0) {
          if (this.isDuelMode) this.handleDuelPlayerDamaged(target.slot, e.contactDamage ?? 18, e.x, e.y);
          else this.handlePlayerDamaged(e.contactDamage ?? 18, e.x, e.y);
          e.vx = -Math.cos(angleToPlayer) * 100;
          e.vy = -Math.sin(angleToPlayer) * 100;
        }
      } else if (e.type === 'behemoth') {
        // Heavy war cruiser: dual forward shield, heavy twin plasma cannons, seismic pulse
        e.angle = angleToPlayer;
        e.vx = Math.cos(angleToPlayer) * (e.speed * 0.8);
        e.vy = Math.sin(angleToPlayer) * (e.speed * 0.8);

        if (e.cooldownTimer <= 0) {
          e.cooldownTimer = 2.5;
          soundEngine.playScatterShoot();
          this.addDirectionalCameraShake(
            getBossAttackShakeTrauma('behemoth_cannon', distToPlayer),
            -Math.cos(angleToPlayer),
            -Math.sin(angleToPlayer),
            10
          );

          // Dual heavy plasma cannons
          for (const offset of [-16, 16]) {
            const perp = angleToPlayer + Math.PI / 2;
            const cannonX = e.x + Math.cos(angleToPlayer) * (e.radius + 12) + Math.cos(perp) * offset;
            const cannonY = e.y + Math.sin(angleToPlayer) * (e.radius + 12) + Math.sin(perp) * offset;
            this.projectiles.push({
              id: this.nextId++,
              x: cannonX,
              y: cannonY,
              vx: Math.cos(angleToPlayer) * (e.projectileSpeed ?? 460),
              vy: Math.sin(angleToPlayer) * (e.projectileSpeed ?? 460),
              radius: 9,
              damage: e.projectileDamage ?? 30,
              rangeRemaining: 850,
              color: '#ff3300',
              isEnemy: true,
              pierceRemaining: 1,
              trail: [],
            });
          }
          this.emitBurst(e.x, e.y, '#ff3300', 12, 1.2);
        }

        // Proximity Seismic Pulse
        if (distToPlayer < 220 && (e.specialCooldownTimer ?? 0) <= 0) {
          e.specialCooldownTimer = 4.0;
          soundEngine.playExplosion();
          this.addCameraTrauma(getBossAttackShakeTrauma('behemoth_seismic', distToPlayer));
          this.emitParticle(e.x, e.y, 0, 0, 240, '#ff3300', 0.5, 'ring');
          if (!target.isDashing && target.invulnerableTimer <= 0) {
            if (this.isDuelMode) this.handleDuelPlayerDamaged(target.slot, e.slamDamage ?? 25, e.x, e.y);
            else this.handlePlayerDamaged(e.slamDamage ?? 25, e.x, e.y);
          }
        }
        if (e.specialCooldownTimer && e.specialCooldownTimer > 0) {
          e.specialCooldownTimer -= dt;
        }

        // Contact damage
        if (distToPlayer < e.radius + target.radius && !target.isDashing && target.invulnerableTimer <= 0) {
          if (this.isDuelMode) this.handleDuelPlayerDamaged(target.slot, e.contactDamage ?? 26, e.x, e.y);
          else this.handlePlayerDamaged(e.contactDamage ?? 26, e.x, e.y);
          e.vx = -Math.cos(angleToPlayer) * 70;
          e.vy = -Math.sin(angleToPlayer) * 70;
        }
      } else if (e.type === 'goliath') {
        // Elite boss with rotating plasma cannons and seismic nova barrages
        e.angle = angleToPlayer;
        e.vx = Math.cos(angleToPlayer) * (e.speed * 0.7);
        e.vy = Math.sin(angleToPlayer) * (e.speed * 0.7);

        if (e.specialCooldownTimer === undefined) {
          e.specialCooldownTimer = 4.5;
        } else if (e.specialCooldownTimer > 0) {
          e.specialCooldownTimer -= dt;
        }

        if (e.specialCooldownTimer <= 0) {
          // Goliath Boss Seismic Nova Blast (heavy screen shake + crimson shockwave + 12-orb volley)
          e.specialCooldownTimer = 5.5;
          soundEngine.playExplosion();
          this.addCameraTrauma(getBossAttackShakeTrauma('goliath_nova', distToPlayer));
          this.emitParticle(e.x, e.y, 0, 0, 270, '#ff0055', 0.55, 'ring');
          this.emitBurst(e.x, e.y, '#ff0055', 22, 1.8);

          const gDmg = Math.round((e.projectileDamage ?? 22) * 1.15);
          const gSpeed = (e.projectileSpeed ?? 360) * 1.15;
          for (let k = 0; k < 12; k++) {
            const orbAngle = e.angle + (k * Math.PI) / 6;
            this.projectiles.push({
              id: this.nextId++,
              x: e.x + Math.cos(orbAngle) * (e.radius + 16),
              y: e.y + Math.sin(orbAngle) * (e.radius + 16),
              vx: Math.cos(orbAngle) * gSpeed,
              vy: Math.sin(orbAngle) * gSpeed,
              radius: 9,
              damage: gDmg,
              rangeRemaining: 880,
              color: '#ff2266',
              isEnemy: true,
              pierceRemaining: 1,
              trail: [],
            });
          }
          if (distToPlayer < 250 && !target.isDashing && target.invulnerableTimer <= 0) {
            if (this.isDuelMode) this.handleDuelPlayerDamaged(target.slot, e.slamDamage ?? 24, e.x, e.y);
            else this.handlePlayerDamaged(e.slamDamage ?? 24, e.x, e.y);
          }
        } else if (e.cooldownTimer <= 0) {
          e.cooldownTimer = 2.0;
          soundEngine.playScatterShoot();
          this.addDirectionalCameraShake(
            getBossAttackShakeTrauma('goliath_barrage', distToPlayer),
            -Math.cos(angleToPlayer),
            -Math.sin(angleToPlayer),
            12
          );
          this.emitParticle(e.x, e.y, 0, 0, 140, '#ff0055', 0.35, 'ring');
          this.emitBurst(e.x, e.y, '#ff0055', 14, 1.3);

          const gDmg = e.projectileDamage ?? 22;
          const gSpeed = e.projectileSpeed ?? 360;

          // Fire ring of 8 plasma orbs
          for (let k = 0; k < 8; k++) {
            const orbAngle = e.angle + (k * Math.PI / 4);
            this.projectiles.push({
              id: this.nextId++,
              x: e.x + Math.cos(orbAngle) * (e.radius + 15),
              y: e.y + Math.sin(orbAngle) * (e.radius + 15),
              vx: Math.cos(orbAngle) * gSpeed,
              vy: Math.sin(orbAngle) * gSpeed,
              radius: 7,
              damage: gDmg,
              rangeRemaining: 800,
              color: '#ff0055',
              isEnemy: true,
              pierceRemaining: 1,
              trail: [],
            });
          }
        }
      }

      // --- Active Weapon Trajectory Avoidance & Bullet Dodging ---
      // Hostiles actively steer perpendicular to the player's weapon crosshairs and trajectory
      const evasionSpeed =
        e.type === 'behemoth' || e.type === 'goliath'
          ? 120
          : Math.max(120, Math.min(260, e.speed * 0.75));
      const trajAvoid = calculateTrajectoryAvoidanceForce(
        e.x,
        e.y,
        e.radius,
        this.player.x,
        this.player.y,
        this.player.angle,
        weaponRange,
        isFiring,
        125,
        evasionSpeed
      );

      const dodgeStrideMask = isPerfTier ? 3 : 1;
      const bulletDodge =
        this.projectiles.length > 0 && ((this.perfFrameSeq + i) & dodgeStrideMask) === 0
          ? calculateProjectileDodgeForce(
              e.x,
              e.y,
              e.radius,
              this.projectiles,
              220,
              evasionSpeed * 1.2
            )
          : { hasBulletThreat: false, dodgeVx: 0, dodgeVy: 0 };

      if (trajAvoid.inDanger) {
        // Blend evasive steering perpendicular to weapon aim line
        e.vx += trajAvoid.avoidVx * 1.2;
        e.vy += trajAvoid.avoidVy * 1.2;

        // Archetype-specific evasive maneuvers
        if (e.type === 'phantom' && (e.phaseAlpha ?? 1) > 0.45 && Math.random() < 0.06) {
          // Spectral phase slip sideways out of crosshairs
          e.x += trajAvoid.avoidVx * dt * 2.2;
          e.y += trajAvoid.avoidVy * dt * 2.2;
          this.emitBurst(e.x, e.y, '#b026ff', 3, 0.4);
        } else if (e.type === 'tank' || e.type === 'behemoth') {
          // Pivot front directional energy shield directly to intercept the player's firing trajectory
          e.shieldAngle = this.player.angle + Math.PI;
        } else if (e.type === 'swarmer' && Math.random() < 0.05) {
          // Thruster spark burst indicating evasive jet burn
          this.emitBurst(e.x, e.y, '#00ff88', 2, 0.25);
        }
      }

      if (bulletDodge.hasBulletThreat) {
        // Immediate lateral dodge from incoming projectile flight path
        e.vx += bulletDodge.dodgeVx * 1.15;
        e.vy += bulletDodge.dodgeVy * 1.15;
      }

      // Cryo-Pulse Field & Cryo-Nova Barrel Chill Slow (hoisted augment lookup above loop)
      let cryoSlow = 1.0;
      if (cryoAuraRadius > 0 && distToPlayer <= cryoAuraRadius) {
        cryoSlow = cryoSlowFactor;
      }
      if (e.cryoSlowTimer && e.cryoSlowTimer > 0) {
        e.cryoSlowTimer = Math.max(0, e.cryoSlowTimer - dt);
        cryoSlow = Math.min(cryoSlow, 0.4);
      }

      // Move entity
      e.x += e.vx * cryoSlow * dt;
      e.y += e.vy * cryoSlow * dt;

      // Soft separation between enemies (squared distance early-out eliminates ~95% of sqrt calls)
      for (let k = i - 1; k >= 0; k--) {
        const other = this.enemies[k];
        if (other.state === 'ko') continue;
        const sDx = other.x - e.x;
        const sDy = other.y - e.y;
        const minSep = e.radius + other.radius;
        const sDistSq = sDx * sDx + sDy * sDy;
        if (sDistSq < minSep * minSep && sDistSq > 0.0001) {
          const sDist = Math.sqrt(sDistSq);
          const overlap = (minSep - sDist) * 0.5;
          const nx = sDx / sDist;
          const ny = sDy / sDist;
          e.x -= nx * overlap;
          e.y -= ny * overlap;
          other.x += nx * overlap;
          other.y += ny * overlap;
        }
      }
    }
  }

  private killEnemy(e: Enemy, killerSlot: DuelSlotId = 'p1') {
    if (e.state === 'ko') return;
    if (this.isDuelMode && this.duelConfig?.isSpectator) return;
    e.state = 'ko';
    e.koTimer = 0.35; // dissolve / shatter arc

    if (this.isDuelMode && this.duelConfig && this.duelP1Score && this.duelP2Score) {
      soundEngine.playExplosion();
      this.addCameraTrauma(0.1);
      this.emitBurst(e.x, e.y, e.color, 16, 1.3);

      const scorer = killerSlot === 'p2' ? this.duelP2Score : this.duelP1Score;
      const isOnline = this.duelConfig.mode === 'online';
      const localSlot = this.duelConfig.localSlot || 'p1';

      if (isOnline && this.duelClient) {
        if (killerSlot === localSlot) {
          scorer.comboStreak += 1;
          if (scorer.comboStreak > scorer.bestCombo) scorer.bestCombo = scorer.comboStreak;
          if (killerSlot === 'p1') this.stats.comboTimer = 4.0;
          else this.player2.comboTimer = 4.0;
          if (!this.isResolvingFinisher) {
            const fin = advanceComboFinisherState(
              scorer.finisherCharge || 0,
              Boolean(scorer.finisherReady),
              scorer.comboStreak
            );
            scorer.finisherCharge = fin.charge;
            scorer.finisherReady = fin.ready;
            if (fin.justBecameReady) {
              const actorPos = killerSlot === 'p2' ? this.player2 : this.player;
              soundEngine.playFinisherReady();
              this.spawnFloatingText(
                `⚡ ${COMBO_FINISHER_THRESHOLD}-HIT FINISHER READY!`,
                actorPos.x,
                actorPos.y - 52,
                '#ffd700'
              );
              this.emitParticle(actorPos.x, actorPos.y, 0, 0, 95, '#ffd700', 0.35, 'ring');
            }
          }

          const momRes = advanceCyberMomentumOnKill(scorer);
          scorer.momentumKills = momRes.momentumKills;
          scorer.momentumTimer = momRes.momentumTimer;
          scorer.momentumActivations = momRes.momentumActivations;
          if (momRes.triggered) {
            const momActor = killerSlot === 'p2' ? this.player2 : this.player;
            this.spawnFloatingText('⚡ CYBER MOMENTUM! +35% SPD', momActor.x, momActor.y - 44, scorer.color);
            this.emitBurst(momActor.x, momActor.y, scorer.color, 18, 1.4);
            soundEngine.playMomentumBoost();
            this.emitDuelSyncSnapshot();
          }

          this.duelClient.claimKill({
            spawnId: e.duelSpawnId,
            enemyType: e.type,
            comboStreak: scorer.comboStreak,
            damageDealt: scorer.damageDealt,
          });
        }
      } else {
        scorer.kills += 1;
        scorer.comboStreak += 1;
        if (scorer.comboStreak > scorer.bestCombo) {
          scorer.bestCombo = scorer.comboStreak;
        }
        if (killerSlot === 'p1') this.stats.comboTimer = 4.0;
        else this.player2.comboTimer = 4.0;
        if (!this.isResolvingFinisher) {
          const fin = advanceComboFinisherState(
            scorer.finisherCharge || 0,
            Boolean(scorer.finisherReady),
            scorer.comboStreak
          );
          scorer.finisherCharge = fin.charge;
          scorer.finisherReady = fin.ready;
          if (fin.justBecameReady) {
            const actorPos = killerSlot === 'p2' ? this.player2 : this.player;
            soundEngine.playFinisherReady();
            this.spawnFloatingText(
              `⚡ ${COMBO_FINISHER_THRESHOLD}-HIT FINISHER READY!`,
              actorPos.x,
              actorPos.y - 52,
              '#ffd700'
            );
            this.emitParticle(actorPos.x, actorPos.y, 0, 0, 95, '#ffd700', 0.35, 'ring');
          }
        }

        const momRes = advanceCyberMomentumOnKill(scorer);
        scorer.momentumKills = momRes.momentumKills;
        scorer.momentumTimer = momRes.momentumTimer;
        scorer.momentumActivations = momRes.momentumActivations;
        if (momRes.triggered) {
          const momActor = killerSlot === 'p2' ? this.player2 : this.player;
          this.spawnFloatingText('⚡ CYBER MOMENTUM! +35% SPD', momActor.x, momActor.y - 44, scorer.color);
          this.emitBurst(momActor.x, momActor.y, scorer.color, 20, 1.5);
          soundEngine.playMomentumBoost();
        }

        const reward = computeDuelKillReward(e.type, scorer.comboStreak, this.duelElapsedTime);
        scorer.baseKillPoints += reward.basePoints;
        scorer.comboBonusPoints += reward.comboBonus;
        scorer.totalPoints = scorer.baseKillPoints + scorer.comboBonusPoints + scorer.pvpBonusPoints;
        const majorEvents = evaluateDuelMajorEvents({
          tracker: this.duelEventTracker,
          p1: this.duelP1Score,
          p2: this.duelP2Score,
          actingSlot: killerSlot,
          elapsedSeconds: this.duelElapsedTime,
          momentumTriggered: momRes.triggered,
          killRewardPoints: reward.totalPoints,
        });
        if (majorEvents.length > 0) {
          this.duelKillFeed.push(...majorEvents);
        }
        this.spawnFloatingText(`+${reward.totalPoints} (${scorer.name})`, e.x, e.y - 22, scorer.color);
        this.emitDuelSyncSnapshot();
      }
      return;
    }

    // Sound, capped per-frame burst & juice (no per-kill freeze/hitstop so combat remains fluid 60fps)
    this.killsThisFrame += 1;
    const fxBudget = computeMultiKillFrameFxBudget(this.killsThisFrame, this.adaptiveQuality.tier);
    soundEngine.playExplosion();
    this.addCameraTrauma(0.09, 0.48);

    if (fxBudget.burstCount > 0) {
      this.emitBurst(e.x, e.y, e.color, fxBudget.burstCount, 1.35);
    }

    // Score & Combo + Weapon Mastery Kill XP
    const killerWeapon = e.lastHitWeapon || this.stats.activeWeapon;
    this.awardMastery(killerWeapon, 'kill');
    const comboWindow = this.cachedDiamondRelics.chrono_flux ? 5.5 : 3.0;
    this.stats.kills += 1;
    this.stats.comboStreak += 1;
    this.stats.comboCount = this.stats.comboStreak;
    this.stats.comboTimer = comboWindow;
    this.stats.comboMultiplier = getComboMultiplier(this.stats.comboCount);
    if (this.stats.comboCount > this.stats.highestCombo) {
      this.stats.highestCombo = this.stats.comboCount;
    }
    this.stats.maxCombo = this.stats.highestCombo;
    if (!this.isResolvingFinisher) {
      this.finisherChargeProgress += this.cachedStoreGearMods.finisherChargeMultiplier;
      const finSteps = Math.floor(this.finisherChargeProgress);
      this.finisherChargeProgress -= finSteps;
      const prevCharge = this.stats.comboFinisherCharge || 0;
      const prevReady = Boolean(this.stats.comboFinisherReady);
      const baseFin = advanceComboFinisherState(
        Math.min(COMBO_FINISHER_THRESHOLD, prevCharge + Math.max(0, finSteps - 1)),
        prevReady,
        this.stats.comboStreak
      );
      const finJustReady = !prevReady && baseFin.ready;
      this.stats.comboFinisherCharge = baseFin.charge;
      this.stats.comboFinisherReady = baseFin.ready;
      if (finJustReady) {
        soundEngine.playFinisherReady();
        this.spawnFloatingText(
          `⚡ ${COMBO_FINISHER_THRESHOLD}-HIT COMBO FINISHER READY! PRESS [E]`,
          this.player.x,
          this.player.y - 58,
          '#ffd700'
        );
        this.emitParticle(this.player.x, this.player.y, 0, 0, 105, '#ffd700', 0.4, 'ring');
        this.emitBurst(this.player.x, this.player.y, '#ffd700', 14, 1.3);
      }
    }

    // Batch Daily Mission, Global 48h Event & Achievement tracking in memory (flushed periodically & on level/run boundaries)
    accumulatePendingKillProgress(
      this.pendingProgress,
      e.type,
      this.stats.comboStreak,
      this.currentLevel
    );
    if (e.type === 'goliath') {
      this.flushPendingPersistence();
    }

    const augMods = this.cachedAugMods;

    // Multi-Kill Streak Announcer
    const mkStep = stepMultiKillStreak(this.multiKillState, true, 0);
    this.multiKillState = mkStep.state;
    if (mkStep.triggeredTier >= 2) {
      soundEngine.playMultiKillFanfare(mkStep.triggeredTier);
      this.stats.score += mkStep.triggeredTier * 35;
      this.spawnFloatingText(`⚡ ${mkStep.label}`, this.player.x, this.player.y - 84, mkStep.color);
      if (mkStep.triggeredTier >= 4) {
        this.addCameraTrauma(0.14);
      }
    }

    // Vampiric Nanite Core Sustainment + Permanent Store Siphon Module
    const storeMods = this.cachedStoreGearMods;
    if (augMods.vampiricShieldPerKill > 0 || storeMods.vampiricKillsPerHp > 0) {
      if (augMods.vampiricShieldPerKill > 0) {
        this.stats.currentShield = Math.min(
          this.stats.maxShield,
          this.stats.currentShield + augMods.vampiricShieldPerKill
        );
      }
      const vampThreshold =
        augMods.vampiricHpEveryKills > 0 && storeMods.vampiricKillsPerHp > 0
          ? Math.min(augMods.vampiricHpEveryKills, storeMods.vampiricKillsPerHp)
          : augMods.vampiricHpEveryKills > 0
          ? augMods.vampiricHpEveryKills
          : storeMods.vampiricKillsPerHp;
      if (vampThreshold > 0) {
        this.vampiricKillCounter += 1;
        if (this.vampiricKillCounter >= vampThreshold) {
          this.vampiricKillCounter = 0;
          if (this.stats.currentHp < this.stats.maxHp) {
            this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + 1);
            this.spawnFloatingText('💚 +1 HP NANITE SIPHON', this.player.x, this.player.y - 46, '#00ff88');
            this.emitBurst(this.player.x, this.player.y, '#00ff88', 10, 1.1);
          }
        }
      }
    }

    const basePoints = getEnemyBasePoints(e.type);
    const earnedScore = Math.round(
      calculateKillScore(basePoints, this.stats.comboStreak, this.currentWave) * augMods.scoreMult
    );
    this.stats.score += earnedScore;

    if (fxBudget.spawnScoreText) {
      this.spawnFloatingText(`+${earnedScore}`, e.x, e.y - 20, '#00f3ff');
    }

    if (e.type === 'goliath') {
      this.addCameraTrauma(0.28);
    }

    if (e.isBountyTarget && this.activeBounty && this.activeBounty.enemyId === e.id) {
      const bountyRes = resolveBountyCompletion(this.activeBounty, this.bountyDiamondsEarnedThisRun);
      const vipBountyMult = this.activeBoosters.includes('bounty_radar_vip') ? 1.4 : 1.0;
      const bountyCoinPayout = Math.round(bountyRes.totalCoins * vipBountyMult * storeMods.coinMultiplier);
      this.stats.coins += bountyCoinPayout;
      this.stats.coinsEarnedThisRun += bountyCoinPayout;
      this.stats.score += bountyRes.scoreBonus;
      this.stats.currentShield = Math.min(this.stats.maxShield, this.stats.currentShield + bountyRes.shieldRestore);
      this.coinsDirty = true;
      if (bountyRes.diamondsEarned > 0) {
        this.bountyDiamondsEarnedThisRun += bountyRes.diamondsEarned;
        this.stats.diamonds = addDiamonds(bountyRes.diamondsEarned);
      }
      this.activeBounty = null;
      this.bountySpawnTimer = 28;
      soundEngine.playVictory();
      this.emitBurst(e.x, e.y, '#ffd700', 26, 1.9);
      this.spawnFloatingText(
        `🎯 BOUNTY CLAIMED! +${bountyCoinPayout}🪙${bountyRes.diamondsEarned > 0 ? ` +${bountyRes.diamondsEarned}💎` : ''}`,
        e.x,
        e.y - 46,
        '#ffd700'
      );
    }

    // Level progression check (Campaign only; Endless Overdrive and Boss Rush advance by waves/stages)
    this.stats.levelKills += 1;
    if (this.isEndlessMode) {
      if (e.type === 'goliath') {
        recordEndlessMilestone({ bossKilled: true, wave: this.currentWave, score: this.stats.score });
      }
    } else if (this.isBossRushMode) {
      if (e.type === 'goliath') {
        recordBossRushMilestone({ bossDefeated: true });
      }
    } else if (this.stats.levelKills >= this.stats.levelQuota) {
      if (this.currentLevel < LEVELS.length) {
        this.advanceToNextLevel();
      } else {
        this.triggerGameOver(true);
        return;
      }
    }

    // Spawn Pickups (Scrap core always, chance for nanite repair or shield cell)
    const scrapCount =
      e.type === 'goliath'
        ? 8
        : e.type === 'behemoth'
        ? 6
        : e.type === 'tank' || e.type === 'phantom'
        ? 4
        : e.type === 'sniper' || e.type === 'storm_drone'
        ? 2
        : 1;
    const MAX_PICKUPS = 85;
    for (let s = 0; s < scrapCount; s++) {
      if (this.pickups.length >= MAX_PICKUPS) break;
      this.pickups.push({
        id: this.nextId++,
        type: 'scrap',
        x: e.x + (Math.random() - 0.5) * 40,
        y: e.y + (Math.random() - 0.5) * 40,
        value: 1,
        life: 25,
        radius: 8,
      });
    }

    // Spawn Cyber Coins - Combo multiplier + Quantum Greed Coil + Midas Booster boost yield!
    const coinDrop = calculateEnemyCoinDrop(e.type);
    const comboMult = this.stats.comboMultiplier || 1.0;
    const bonusCount = Math.floor(coinDrop.count * (comboMult - 1.0));
    const effectiveCoinCount = coinDrop.count + Math.max(0, bonusCount);
    const baseCoinVal = comboMult >= 2.0 ? Math.round(coinDrop.value * 1.5) : coinDrop.value;
    const boosterCoinMult = this.activeBoosters.includes('coin_rush') ? 1.5 : 1.0;
    const effectiveCoinValue = Math.round(baseCoinVal * augMods.coinMult * boosterCoinMult * storeMods.coinMultiplier);

    for (let c = 0; c < effectiveCoinCount; c++) {
      if (this.pickups.length >= MAX_PICKUPS) {
        // Merge excess coins into newest coin pickup so rewards are never lost while capping entity count
        let merged = false;
        for (let pi = this.pickups.length - 1; pi >= 0; pi--) {
          if (this.pickups[pi].type === 'coin') {
            this.pickups[pi].value += effectiveCoinValue;
            this.pickups[pi].life = 30;
            merged = true;
            break;
          }
        }
        if (merged) continue;
      }
      this.pickups.push({
        id: this.nextId++,
        type: 'coin',
        x: e.x + (Math.random() - 0.5) * 35,
        y: e.y + (Math.random() - 0.5) * 35,
        value: effectiveCoinValue,
        life: 30,
        radius: 9,
      });
    }

    if (comboMult > 1.2 && fxBudget.spawnCoinText) {
      this.spawnFloatingText(`+${effectiveCoinCount * effectiveCoinValue} COINS (${comboMult.toFixed(1)}x COMBO)`, e.x, e.y - 45, '#ffd700');
    }

    // Nanite heal chance (restores 1 HP socket)
    if (Math.random() < 0.22 && this.stats.currentHp < this.stats.maxHp) {
      this.pickups.push({
        id: this.nextId++,
        type: 'nanite_heal',
        x: e.x,
        y: e.y,
        value: 1,
        life: 20,
        radius: 10,
      });
    } else if (Math.random() < 0.25) {
      this.pickups.push({
        id: this.nextId++,
        type: 'shield_boost',
        x: e.x,
        y: e.y,
        value: 35,
        life: 20,
        radius: 10,
      });
    }
  }

  // --- Pickups Update ---
  private updatePickups(dt: number) {
    const craft = getCraftDef(this.activeCraft);
    const augMods = this.cachedAugMods;
    const storeGearMods = this.cachedStoreGearMods;
    const magnetRadius = 260 + craft.magnetRadiusBonus + augMods.magnetRadiusBonus + storeGearMods.magnetBonusPx; // Broad magnetic pickup field scaled by craft, Store gear & Quantum Greed Coil
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.pickups.splice(i, 1);
        continue;
      }

      // Magnet pull towards player (NaN/zero-distance guarded)
      const dx = this.player.x - p.x;
      const dy = this.player.y - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist < magnetRadius) {
        const pull = computeSafePullDelta(dx, dy, magnetRadius, 480, dt);
        p.x += pull.x;
        p.y += pull.y;
      }

      // Collect pickup
      if (!Number.isFinite(dist) || dist < this.player.radius + p.radius) {
        soundEngine.playPickup();
        if (p.type === 'coin') {
          this.stats.coins += p.value;
          this.stats.coinsEarnedThisRun += p.value;
          this.coinsDirty = true;
          accumulatePendingCoinProgress(this.pendingProgress, p.value);
          this.spawnFloatingText(`+${p.value} COIN`, this.player.x, this.player.y - 30, '#ffd700');
          this.emitBurst(p.x, p.y, '#ffd700', 8, 1.0);
        } else if (p.type === 'scrap') {
          this.stats.scrap += p.value;
          this.emitBurst(p.x, p.y, '#ffb400', 4, 0.6);
        } else if (p.type === 'nanite_heal') {
          this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + p.value);
          this.spawnFloatingText('+1 HP REPAIR', this.player.x, this.player.y - 30, '#00ff88');
          this.emitBurst(p.x, p.y, '#00ff88', 12, 1);
        } else if (p.type === 'shield_boost') {
          this.stats.currentShield = Math.min(this.stats.maxShield, this.stats.currentShield + p.value);
          this.spawnFloatingText(`+${p.value} SHIELD`, this.player.x, this.player.y - 30, '#00f3ff');
          this.emitBurst(p.x, p.y, '#00f3ff', 12, 1);
        }

        this.pickups.splice(i, 1);
      }
    }
  }

  private triggerNextBountyContract() {
    const alive = this.enemies.filter((e) => e.state !== 'ko' && e.type !== 'goliath');
    let target: Enemy | undefined =
      alive.find(
        (e) =>
          e.type === 'behemoth' ||
          e.type === 'shield_breaker' ||
          e.type === 'tank' ||
          e.type === 'phantom' ||
          e.type === 'storm_drone'
      ) || alive[0];

    if (!target) {
      const ang = Math.random() * Math.PI * 2;
      const sx = Math.min(ARENA_WIDTH - 120, Math.max(120, this.player.x + Math.cos(ang) * 440));
      const sy = Math.min(ARENA_HEIGHT - 120, Math.max(120, this.player.y + Math.sin(ang) * 360));
      const eStats = calculateEnemyStats('phantom', this.currentLevel, this.currentWave, this.difficulty);
      target = {
        id: this.nextId++,
        type: 'phantom',
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        radius: 22,
        hp: eStats.hp,
        maxHp: eStats.hp,
        speed: eStats.speed,
        color: '#b026ff',
        angle: 0,
        targetAngle: 0,
        state: 'seek',
        telegraphTimer: 0,
        telegraphDuration: eStats.telegraphDuration,
        cooldownTimer: 0.7,
        koTimer: 0,
        contactDamage: eStats.contactDamage,
        projectileDamage: eStats.projectileDamage,
        projectileSpeed: eStats.projectileSpeed,
        slamDamage: eStats.slamDamage,
      };
      this.enemies.push(target);
      this.emitBurst(sx, sy, '#ffd700', 18, 1.5);
    }

    const contract = createBountyContractState(target.id);
    target.isBountyTarget = true;
    target.bountyCodename = contract.codename;
    target.hp = Math.round(target.hp * 1.45);
    target.maxHp = Math.max(target.maxHp, target.hp);
    this.activeBounty = contract;
    this.bountySpawnTimer = 28;
    soundEngine.playFinisherReady();
    this.spawnFloatingText(
      `🎯 BOUNTY TARGET: ${contract.codename.toUpperCase()}!`,
      target.x,
      target.y - target.radius - 28,
      '#ffd700'
    );
    this.syncCombatTelemetryToStats();
    this.onStatsSync(this.stats, this.currentWave, this.countAliveEnemies(), this.bossActive);
  }

  // --- Wave Spawning Logic ---
  private updateWaveSpawning(dt: number) {
    const activeEnemies = this.countAliveEnemies();
    if (this.isBossRushMode) {
      if (activeEnemies === 0) {
        this.waveClearDelay += dt;
        if (this.waveClearDelay >= 1.1) {
          soundEngine.playVictory();
          this.vacuumAllPickups();
          const reward = computeBossRushStageRewards(this.bossRushStage);
          this.stats.coins += reward.coins;
          this.stats.coinsEarnedThisRun += reward.coins;
          this.stats.score += reward.scoreBonus;
          this.coinsDirty = true;
          this.stats.diamonds = addDiamonds(reward.diamonds);
          this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + reward.hpHeal);
          this.stats.currentShield = this.stats.maxShield;

          const elapsedSec = (performance.now() - this.runStartTime) / 1000;
          const isFinalClear = this.bossRushStage >= this.bossRushTotalStages;
          const rec = recordBossRushMilestone({
            stageCleared: this.bossRushStage,
            victory: isFinalClear,
            clearSeconds: isFinalClear ? elapsedSec : undefined,
          });
          this.bossRushBestStage = rec.bestStage;

          this.spawnFloatingText(
            `👑 TITAN ${this.bossRushStage}/${this.bossRushTotalStages} DEFEATED! +${reward.coins}🪙 +${reward.diamonds}💎`,
            this.player.x,
            this.player.y - 84,
            '#ffd700'
          );

          if (isFinalClear) {
            this.triggerGameOver(true);
            return;
          }

          this.initBossRushStage(this.bossRushStage + 1);
          if (!this.pendingAugmentChoices) {
            this.openAugmentDraft();
          }
        }
      }
      return;
    }

    const waveBudget = this.isEndlessMode
      ? computeEndlessWaveConfig(this.currentWave, this.difficulty)
      : calculateWaveBudget(this.currentWave, this.currentLevel, this.difficulty);

    if (this.waveBudgetRemaining > 0 || (this.isEndlessMode && this.endlessBossesPending > 0)) {
      this.waveSpawnTimer -= dt;
      if (this.waveSpawnTimer <= 0 && activeEnemies < waveBudget.maxSimultaneous) {
        this.spawnNextWaveEnemy();
        this.waveSpawnTimer = waveBudget.spawnDelaySec;
      }
    } else {
      // All budget spawned: check if all enemies defeated
      if (activeEnemies === 0) {
        this.waveClearDelay += dt;
        if (this.waveClearDelay >= 1.5) {
          // Wave victory!
          soundEngine.playVictory();
          this.spawnFloatingText(`WAVE ${this.currentWave} CLEARED!`, this.player.x, this.player.y - 60, '#00ff88');
          this.vacuumAllPickups();

          if (this.isEndlessMode) {
            const reward = computeEndlessWaveClearReward(this.currentWave);
            this.stats.coins += reward.coins;
            this.stats.coinsEarnedThisRun += reward.coins;
            this.stats.score += reward.scoreBonus;
            this.coinsDirty = true;
            if (reward.diamonds > 0) {
              this.stats.diamonds = addDiamonds(reward.diamonds);
              this.spawnFloatingText(
                `♾️ BOSS WAVE CLEAR! +${reward.coins}🪙 +${reward.diamonds}💎`,
                this.player.x,
                this.player.y - 96,
                '#ffd700'
              );
            } else {
              this.spawnFloatingText(
                `+${reward.coins} COINS · WAVE ${this.currentWave} BONUS`,
                this.player.x,
                this.player.y - 96,
                '#ffd700'
              );
            }
            const rec = recordEndlessMilestone({
              wave: this.currentWave,
              score: this.stats.score,
            });
            this.endlessBestWave = rec.bestWave;
            this.initWave(this.currentWave + 1);
            if (!this.pendingAugmentChoices && this.currentWave % 2 === 1) {
              this.openAugmentDraft();
            }
            return;
          }

          // In Campaign, Cyber-Chip Augment Draft appears ONLY on Level Clear (advanceToNextLevel),
          // never mid-level between waves.
          this.initWave(this.currentWave + 1);
        }
      }
    }
  }

  private spawnNextWaveEnemy() {
    // If Endless boss wave has pending Goliath Boss(es), dispatch from perimeter right away
    if (this.isEndlessMode && this.endlessBossesPending > 0 && this.spawnSquadQueue.length === 0) {
      this.endlessBossesPending -= 1;
      const bossAngle = Math.random() * Math.PI * 2;
      const bx = Math.min(ARENA_WIDTH - 120, Math.max(120, this.player.x + Math.cos(bossAngle) * 520));
      const by = Math.min(ARENA_HEIGHT - 120, Math.max(120, this.player.y + Math.sin(bossAngle) * 420));
      this.spawnSquadQueue.push({
        type: 'goliath',
        x: bx,
        y: by,
        role: 'boss',
        pattern: 'portal_cluster',
      });
    }

    // If we have squad units queued from an active tactical formation, spawn next squad member
    let nextUnit = this.spawnSquadQueue.shift();

    if (!nextUnit) {
      // Select a tactical pattern scaled to the current wave count
      const pattern = selectSpawnPattern(this.currentWave, Math.random);

      // Determine squad size according to formation type and remaining budget
      let squadCount = 1;
      if (pattern === 'pincer_flank') squadCount = 2;
      else if (pattern === 'v_wedge') squadCount = 3;
      else if (pattern === 'circle_ring') squadCount = Math.min(5, Math.max(3, Math.floor(this.waveBudgetRemaining / 130)));
      else if (pattern === 'quad_cross') squadCount = 4;
      else if (pattern === 'portal_cluster') squadCount = 3;
      else if (pattern === 'escort_convoy') squadCount = 3;
      else if (pattern === 'corner_ambush') squadCount = 2;
      else if (pattern === 'spiral_vortex') squadCount = 4;

      squadCount = Math.max(1, squadCount);

      const spawnPoints = generateSpawnPositions(
        pattern,
        squadCount,
        { x: this.player.x, y: this.player.y },
        ARENA_WIDTH,
        ARENA_HEIGHT,
        Math.random
      );

      // Announce tactical pattern banner to player
      if (pattern !== 'perimeter_random' && this.lastAnnouncedPattern !== pattern) {
        this.lastAnnouncedPattern = pattern;
        const banner = getPatternTacticalLabel(pattern);
        this.spawnFloatingText(`⚡ TACTICAL INCOMING: ${banner}!`, this.player.x, this.player.y - 75, '#00f3ff');
        soundEngine.playTelegraphTone();
      }

      // Populate squad queue with archetypes
      const guaranteeShieldBreakerThisSquad =
        !this.shieldBreakerSpawnedThisWave &&
        !this.isBossRushMode &&
        (this.isEndlessMode || this.currentLevel >= 2 || this.currentWave >= 2);

      for (let i = 0; i < spawnPoints.length; i++) {
        const pt = spawnPoints[i];
        if (this.waveBudgetRemaining <= 0) break;

        let unitType: EnemyType;
        if (guaranteeShieldBreakerThisSquad && !this.shieldBreakerSpawnedThisWave && i === 0) {
          unitType = 'shield_breaker';
          this.shieldBreakerSpawnedThisWave = true;
          this.spawnFloatingText(
            '🛡️ SHIELD-BREAKER DEPLOYED · BEAM/RAIL BYPASSES BARRIER!',
            this.player.x,
            this.player.y - 96,
            '#38bdf8'
          );
        } else if (pattern === 'escort_convoy') {
          if (i === 0 && this.waveBudgetRemaining >= getEnemyBudgetCost('tank') && this.currentLevel >= 3) {
            unitType = this.currentLevel >= 8 && Math.random() < 0.4 ? 'behemoth' : 'tank';
          } else {
            unitType = selectEnemyArchetype(this.currentWave, this.waveBudgetRemaining, Math.random, this.currentLevel);
          }
        } else {
          unitType = selectEnemyArchetype(this.currentWave, this.waveBudgetRemaining, Math.random, this.currentLevel);
        }

        const cost = getEnemyBudgetCost(unitType);
        this.waveBudgetRemaining -= Math.min(this.waveBudgetRemaining, cost);
        this.enemiesSpawnedThisWave += 1;

        this.spawnSquadQueue.push({
          type: unitType,
          x: pt.x,
          y: pt.y,
          role: pt.role,
          pattern,
        });
      }

      nextUnit = this.spawnSquadQueue.shift();
    }

    if (!nextUnit) return;

    const { type, x: sx, y: sy, pattern } = nextUnit;
    const stats = calculateEnemyStats(type, this.currentLevel, this.currentWave, this.difficulty);
    const hp = stats.hp;
    const speed = stats.speed + (type === 'swarmer' ? (Math.random() - 0.5) * 15 : 0);
    const telegraphDuration = stats.telegraphDuration;

    let radius = 16;
    let color = '#00ff88';
    let shieldArc: number | undefined;

    if (type === 'swarmer') {
      radius = 16;
      color = '#00ff88';
    } else if (type === 'sniper') {
      radius = 18;
      color = '#ff0077';
    } else if (type === 'storm_drone') {
      radius = 22;
      color = '#00f3ff';
    } else if (type === 'tank') {
      radius = 26;
      color = '#ffb400';
      shieldArc = Math.PI * 0.65; // ~117 degree front energy shield
    } else if (type === 'shield_breaker') {
      radius = 25;
      color = '#38bdf8';
    } else if (type === 'phantom') {
      radius = 20;
      color = '#b026ff';
    } else if (type === 'behemoth') {
      radius = 35;
      color = '#ff3300';
      shieldArc = Math.PI * 0.75; // ~135 degree heavy fortress shield
    } else if (type === 'goliath') {
      radius = 42;
      color = '#ff0055';
    }

    const kineticBarrierHp = type === 'shield_breaker' ? computeShieldBreakerBarrierHp(hp) : undefined;
    this.enemies.push({
      id: this.nextId++,
      type,
      x: sx,
      y: sy,
      vx: 0,
      vy: 0,
      radius,
      hp,
      maxHp: hp,
      speed,
      color,
      angle: 0,
      targetAngle: 0,
      state: 'seek',
      telegraphTimer: 0,
      telegraphDuration,
      cooldownTimer: 0.8,
      koTimer: 0,
      contactDamage: stats.contactDamage,
      projectileDamage: stats.projectileDamage,
      projectileSpeed: stats.projectileSpeed,
      slamDamage: stats.slamDamage,
      shieldAngle: 0,
      shieldArc,
      kineticBarrierHp,
      kineticBarrierMaxHp: kineticBarrierHp,
      kineticBarrierDownTimer: 0,
      kineticBarrierMaxDownSec: 5.0,
    });

    // Spawn warp portal particles with formation styling
    const burstColor = pattern === 'portal_cluster' ? '#00f3ff' : pattern === 'v_wedge' ? '#ffb400' : color;
    this.emitBurst(sx, sy, burstColor, 14, 1.3);
  }

  // --- Rendering Pipeline ---
  private render() {
    const dpr = this.currentDpr || getOptimalCanvasDpr(window.devicePixelRatio || 1);
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;

    this.ctx.save();
    this.ctx.scale(dpr, dpr);

    // Camera transform & world-space viewport culling bounds
    const camX = this.camera.x + this.camera.shakeOffsetX;
    const camY = this.camera.y + this.camera.shakeOffsetY;
    this.currentViewBounds = computeViewportCullBounds(
      camX,
      camY,
      width,
      height,
      this.cameraScale,
      140
    );

    // 0. Always paint solid deep-space clear fill so rotated/shaken camera edges never flash blank pixels
    this.ctx.fillStyle = '#04060d';
    this.ctx.fillRect(0, 0, width, height);
    const floorCoversViewport =
      this.currentViewBounds.minX >= 0 &&
      this.currentViewBounds.maxX <= ARENA_WIDTH &&
      this.currentViewBounds.minY >= 0 &&
      this.currentViewBounds.maxY <= ARENA_HEIGHT;
    if (!floorCoversViewport) {
      this.renderParallaxBackdrop(width, height, camX, camY);
    }

    this.ctx.save();
    this.ctx.translate(width / 2, height / 2);
    if (Math.abs(this.camera.shakeAngle) > 0.0001) {
      this.ctx.rotate(this.camera.shakeAngle);
    }
    if (this.cameraScale !== 1) {
      this.ctx.scale(this.cameraScale, this.cameraScale);
    }
    this.ctx.translate(-camX, -camY);

    // 1. Cyber Arena Grid, Conduits, Reactor & Arena Boundary Walls
    this.renderArenaGrid(camX, camY);

    // 1b. Procedural Cyber-Storm Localized Wind Zones & Neon Lightning
    this.renderCyberStormWorld();

    // 1c. Crystal Conduit Ruins Obstacles & Player Tactical Cyber Shield Walls
    if (this.isDuelMode && this.duelObstacles.length > 0) {
      this.renderDuelObstacles();
    }
    if (this.isDuelMode && this.duelTacticalWalls.length > 0) {
      this.renderDuelTacticalWalls();
    }

    // 2. Pickups
    this.renderPickups();

    // 3. Enemy Telegraphs (Ground rings, sniper laser lines)
    this.renderTelegraphs();

    // 4. Enemies, Golden Data-Cores & Interactive Tactical Arena Barrels
    this.renderArenaBarrels();
    this.renderEnemies();
    this.renderGoldenCores();

    // 5. Player Combat Mech, Store Companion Drone & Autonomous Wingman Drones
    this.renderPlayer();
    this.renderStoreCompanionDrone();
    this.renderWingmanDrones();

    // 6. Projectiles & Tesla Electric Arcs
    this.renderProjectiles();
    this.renderElectricArcs();

    // 6b. Combo Finisher AoE Shockwave Blasts
    this.renderFinisherShockwaves();

    // 7. Particles
    this.renderParticles();

    // 8. Floating Texts
    this.renderFloatingTexts();

    this.ctx.restore();

    // Screen-space atmospheric shimmer + low-HP alert vignette
    this.renderAtmosphericForeground(width, height);
    if (this.state === 'playing' && !this.isDuelMode && this.radarEnabled) {
      this.renderRadarMinimap(width, height);
    }
    this.renderScreenVignette(width, height);

    this.ctx.restore();
  }

  private renderRadarMinimap(width: number, height: number) {
    const ctx = this.ctx;
    const isMobile = width < 640;
    const size = isMobile ? 84 : 132;
    const rx = width - size - (isMobile ? 12 : 18);
    const ry = isMobile ? 168 : height - size - 18;

    ctx.save();
    ctx.fillStyle = 'rgba(6, 13, 24, 0.88)';
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(rx, ry, size, size);
    ctx.strokeRect(rx, ry, size, size);

    // Tactical crosshair lines
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + size * 0.5, ry);
    ctx.lineTo(rx + size * 0.5, ry + size);
    ctx.moveTo(rx, ry + size * 0.5);
    ctx.lineTo(rx + size, ry + size * 0.5);
    ctx.stroke();

    // Cyber-Storm Wind Zones on Radar
    if (this.cyberStorm.phase === 'storm') {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
      for (const wz of this.cyberStorm.windZones) {
        const pt = projectToRadar(wz.x, wz.y, ARENA_WIDTH, ARENA_HEIGHT, rx, ry, size);
        const rRad = Math.max(4, (wz.radius / ARENA_WIDTH) * size);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, rRad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Viewport rectangle indicator
    const viewW = Math.min(size, (width / ARENA_WIDTH) * size);
    const viewH = Math.min(size, (height / ARENA_HEIGHT) * size);
    const camCenter = projectToRadar(this.camera.x, this.camera.y, ARENA_WIDTH, ARENA_HEIGHT, rx, ry, size);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      Math.max(rx, Math.min(rx + size - viewW, camCenter.x - viewW * 0.5)),
      Math.max(ry, Math.min(ry + size - viewH, camCenter.y - viewH * 0.5)),
      viewW,
      viewH
    );

    // Arena Barrels
    for (const b of this.arenaBarrels) {
      const pt = projectToRadar(b.x, b.y, ARENA_WIDTH, ARENA_HEIGHT, rx, ry, size);
      ctx.fillStyle = b.type === 'plasma' ? '#fb923c' : '#38bdf8';
      ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
    }

    // Golden Data-Cores
    for (const c of this.goldenCores) {
      const pt = projectToRadar(c.x, c.y, ARENA_WIDTH, ARENA_HEIGHT, rx, ry, size);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hostiles, Bounty Targets & Titan Bosses
    const pulseR = 4.5 + Math.sin((this.frameNowMs || performance.now()) * 0.01) * 1.4;
    for (const e of this.enemies) {
      if (e.state === 'ko') continue;
      const pt = projectToRadar(e.x, e.y, ARENA_WIDTH, ARENA_HEIGHT, rx, ry, size);
      if (e.isBountyTarget) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'goliath') {
        ctx.fillStyle = '#ff0077';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y - 4.5);
        ctx.lineTo(pt.x + 4.5, pt.y);
        ctx.lineTo(pt.x, pt.y + 4.5);
        ctx.lineTo(pt.x - 4.5, pt.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = '#ff3366';
        ctx.fillRect(pt.x - 1.5, pt.y - 1.5, 3, 3);
      }
    }

    // Player Chevron
    const pPt = projectToRadar(this.player.x, this.player.y, ARENA_WIDTH, ARENA_HEIGHT, rx, ry, size);
    ctx.save();
    ctx.translate(pPt.x, pPt.y);
    ctx.rotate(this.player.angle);
    ctx.fillStyle = '#00f3ff';
    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.lineTo(-3.5, -3);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-3.5, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Label
    ctx.fillStyle = 'rgba(0, 243, 255, 0.85)';
    ctx.font = 'bold 9px ui-monospace, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('RADAR', rx + 5, ry + 11);

    ctx.restore();
  }

  private ensureNebulaSprites(region: string, primaryColor: string, secondaryColor: string) {
    if (
      typeof document === 'undefined' ||
      (this.nebulaSpriteRegion === region && this.nebulaSpritePrimary && this.nebulaSpriteSecondary)
    ) {
      return;
    }
    const buildSprite = (color: string) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const g = c.getContext('2d');
      if (g) {
        const grad = g.createRadialGradient(128, 128, 8, 128, 128, 128);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'rgba(4, 6, 13, 0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 256, 256);
      }
      return c;
    };
    this.nebulaSpritePrimary = buildSprite(primaryColor);
    this.nebulaSpriteSecondary = buildSprite(secondaryColor);
    this.nebulaSpriteRegion = region;
  }

  private renderParallaxBackdrop(width: number, height: number, camX: number, camY: number) {
    const ctx = this.ctx;
    const lvl = getLevelDef(this.currentLevel);
    const theme = getRegionAtmosphereTheme(lvl.region);
    const time = (this.frameNowMs || performance.now()) * 0.001;

    // Blit pre-rendered radial nebula sprites (zero per-frame gradient allocation)
    if (this.adaptiveQuality.tier !== 'performance') {
      this.ensureNebulaSprites(lvl.region, theme.nebulaPrimary, theme.nebulaSecondary);
      if (this.nebulaSpritePrimary && this.nebulaSpriteSecondary) {
        const size1 = Math.max(width, height) * 1.1;
        const neb1X = width * 0.25 + Math.sin(time * 0.18) * 90 - (camX - ARENA_WIDTH / 2) * 0.06;
        const neb1Y = height * 0.28 + Math.cos(time * 0.14) * 70 - (camY - ARENA_HEIGHT / 2) * 0.06;
        ctx.drawImage(this.nebulaSpritePrimary, neb1X - size1 * 0.5, neb1Y - size1 * 0.5, size1, size1);

        const size2 = Math.max(width, height) * 1.0;
        const neb2X = width * 0.78 + Math.cos(time * 0.16) * 80 - (camX - ARENA_WIDTH / 2) * 0.09;
        const neb2Y = height * 0.72 + Math.sin(time * 0.21) * 60 - (camY - ARENA_HEIGHT / 2) * 0.09;
        ctx.drawImage(this.nebulaSpriteSecondary, neb2X - size2 * 0.5, neb2Y - size2 * 0.5, size2, size2);
      }
    }

    // Multi-depth parallax stars in outer void
    const wrapW = Math.max(width + 200, 1800);
    const wrapH = Math.max(height + 200, 1200);
    const starLimit =
      this.adaptiveQuality.tier === 'performance' ? 32 : width < 900 ? 50 : this.bgStars.length;
    ctx.fillStyle = theme.starTint;
    ctx.globalAlpha = 0.65;
    for (let i = 0; i < starLimit; i++) {
      const s = this.bgStars[i];
      const sx = (((s.x - camX * s.depth + time * s.speedX) % wrapW) + wrapW) % wrapW - 100;
      const sy = (((s.y - camY * s.depth + time * s.speedY * 0.35) % wrapH) + wrapH) % wrapH - 100;
      if (sx < -6 || sx > width + 6 || sy < -6 || sy > height + 6) continue;
      const d = s.size * 1.8;
      ctx.fillRect(sx - s.size, sy - s.size, d, d);
    }
    ctx.globalAlpha = 1;
  }

  private renderAtmosphericForeground(width: number, height: number) {
    if (this.adaptiveQuality.skipAtmosphericOverlay) return;
    const ctx = this.ctx;
    const lvl = getLevelDef(this.currentLevel);
    const theme = getRegionAtmosphereTheme(lvl.region);
    const time = (this.frameNowMs || performance.now()) * 0.001;
    const camX = this.camera.x;
    const camY = this.camera.y;
    const streamerStep = this.adaptiveQuality.tier === 'performance' ? 2 : 1;

    ctx.save();
    if (theme.weatherStyle === 'cyber_rain') {
      // Rainy weather streaks removed for clear visibility and smooth performance;
      // show gentle calm floating neon motes instead.
      const moteCount = this.adaptiveQuality.tier === 'performance' ? 6 : 12;
      ctx.fillStyle = 'rgba(0, 243, 255, 0.22)';
      ctx.beginPath();
      for (let i = 0; i < moteCount; i++) {
        const s = this.bgStars[i];
        const sx = (((s.x - camX * 0.4 + Math.sin(time * 0.6 + s.phase) * 35) % (width + 100)) + (width + 100)) % (width + 100) - 50;
        const sy = (((s.y - camY * 0.4 - time * 12) % (height + 100)) + (height + 100)) % (height + 100) - 50;
        const r = s.size * 1.6;
        ctx.moveTo(sx + r, sy);
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
      }
      ctx.fill();
    } else if (theme.weatherStyle === 'solar_spores') {
      // Batched Rajshahi / Sundarbans biosphere motes
      const count = this.adaptiveQuality.tier === 'performance' ? 10 : 20;
      ctx.fillStyle = 'rgba(0, 255, 136, 0.32)';
      ctx.beginPath();
      for (let i = 0; i < count; i += 2) {
        const s = this.bgStars[i];
        const sx = (((s.x - camX * 0.45 + Math.sin(time * 0.9 + s.phase) * 45) % (width + 120)) + (width + 120)) % (width + 120) - 60;
        const sy = (((s.y - camY * 0.45 - time * (18 + s.depth * 24)) % (height + 120)) + (height + 120)) % (height + 120) - 60;
        const r = s.size * 2.1;
        ctx.moveTo(sx + r, sy);
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
      }
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 215, 0, 0.30)';
      ctx.beginPath();
      for (let i = 1; i < count; i += 2) {
        const s = this.bgStars[i];
        const sx = (((s.x - camX * 0.45 + Math.sin(time * 0.9 + s.phase) * 45) % (width + 120)) + (width + 120)) % (width + 120) - 60;
        const sy = (((s.y - camY * 0.45 - time * (18 + s.depth * 24)) % (height + 120)) + (height + 120)) % (height + 120) - 60;
        const r = s.size * 2.1;
        ctx.moveTo(sx + r, sy);
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
      }
      ctx.fill();
    } else if (theme.weatherStyle === 'lighthouse_beams') {
      // Chattogram sweeping coastal lighthouse searchlight beams
      const sweepA = Math.sin(time * 0.42) * 0.55 - Math.PI * 0.28;
      const sweepB = Math.cos(time * 0.34) * 0.5 - Math.PI * 0.72;
      const originAX = width * 0.12;
      const originAY = height * 0.95;
      const beamLen = Math.hypot(width, height) * 1.1;

      ctx.fillStyle = 'rgba(255, 180, 0, 0.055)';
      ctx.beginPath();
      ctx.moveTo(originAX, originAY);
      ctx.lineTo(originAX + Math.cos(sweepA - 0.09) * beamLen, originAY + Math.sin(sweepA - 0.09) * beamLen);
      ctx.lineTo(originAX + Math.cos(sweepA + 0.09) * beamLen, originAY + Math.sin(sweepA + 0.09) * beamLen);
      ctx.closePath();
      ctx.fill();

      const originBX = width * 0.88;
      ctx.fillStyle = 'rgba(0, 170, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(originBX, originAY);
      ctx.lineTo(originBX + Math.cos(sweepB - 0.08) * beamLen, originAY + Math.sin(sweepB - 0.08) * beamLen);
      ctx.lineTo(originBX + Math.cos(sweepB + 0.08) * beamLen, originAY + Math.sin(sweepB + 0.08) * beamLen);
      ctx.closePath();
      ctx.fill();
    } else {
      // Sylhet / Cox's Orbit shimmering celestial aurora curtains (fast flat alpha bands, zero gradient allocation)
      for (let i = 0; i < 4; i++) {
        const bandX = width * (0.18 + i * 0.22) + Math.sin(time * 0.45 + i * 1.4) * 70;
        ctx.fillStyle = i % 2 === 0 ? 'rgba(168, 85, 247, 0.05)' : 'rgba(56, 189, 248, 0.045)';
        ctx.fillRect(bandX - 75, 0, 150, height);
      }
      // Batched diamond crystals (1 stroke call instead of 14)
      ctx.strokeStyle = 'rgba(216, 180, 254, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const crystalCount = this.adaptiveQuality.tier === 'performance' ? 7 : 14;
      for (let i = 0; i < crystalCount; i++) {
        const s = this.bgStars[i * 3];
        const sx = (((s.x - camX * 0.5 + time * 18) % (width + 100)) + (width + 100)) % (width + 100) - 50;
        const sy = (((s.y - camY * 0.5 + Math.sin(time + s.phase) * 28) % (height + 100)) + (height + 100)) % (height + 100) - 50;
        const r = s.size * 2.2;
        ctx.moveTo(sx, sy - r);
        ctx.lineTo(sx + r * 0.7, sy);
        ctx.lineTo(sx, sy + r);
        ctx.lineTo(sx - r * 0.7, sy);
        ctx.closePath();
      }
      ctx.stroke();
    }

    // Rainy Cyber-Storm weather streaks & flashes disabled for clean gameplay visibility

    // Smooth peripheral chromatic edge tint on heavy impact (no jarring horizontal scanline tears)
    if (this.camera.glitchAlpha > 0.01) {
      const edgeAlpha = Math.min(0.11, this.camera.glitchAlpha * 0.32);
      ctx.strokeStyle = `rgba(0, 243, 255, ${edgeAlpha})`;
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, width - 6, height - 6);
    }

    // Cached screen vignette (skip full-screen alpha composite on mobile to eliminate fillrate stall)
    if (!this.isMobileDevice) {
      const intW = Math.max(1, Math.round(width));
      const intH = Math.max(1, Math.round(height));
      if (
        typeof document !== 'undefined' &&
        (!this.vignetteCache || this.vignetteCacheW !== intW || this.vignetteCacheH !== intH)
      ) {
        const vc = this.vignetteCache || document.createElement('canvas');
        vc.width = intW;
        vc.height = intH;
        const vctx = vc.getContext('2d');
        if (vctx) {
          const vig = vctx.createRadialGradient(
            intW * 0.5,
            intH * 0.5,
            Math.min(intW, intH) * 0.32,
            intW * 0.5,
            intH * 0.5,
            Math.max(intW, intH) * 0.78
          );
          vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
          vig.addColorStop(1, 'rgba(2, 4, 10, 0.52)');
          vctx.clearRect(0, 0, intW, intH);
          vctx.fillStyle = vig;
          vctx.fillRect(0, 0, intW, intH);
        }
        this.vignetteCache = vc;
        this.vignetteCacheW = intW;
        this.vignetteCacheH = intH;
      }
      if (this.vignetteCache) {
        ctx.drawImage(this.vignetteCache, 0, 0, width, height);
      }
    }
    ctx.restore();
  }

  private renderCyberStormWorld() {
    if (this.cyberStorm.windZones.length === 0 && this.cyberStorm.lightningBolts.length === 0) return;
    const ctx = this.ctx;
    const time = (this.frameNowMs || performance.now()) * 0.001;
    const bounds = this.currentViewBounds;

    // 1. Localized Wind Zones with layered translucent fills (zero per-frame createRadialGradient)
    for (const z of this.cyberStorm.windZones) {
      if (!isInViewportBounds(z.x, z.y, z.radius + 30, bounds)) continue;
      ctx.save();
      ctx.translate(z.x, z.y);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.beginPath();
      ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(192, 132, 252, 0.07)';
      ctx.beginPath();
      ctx.arc(0, 0, z.radius * 0.58, 0, Math.PI * 2);
      ctx.fill();

      // Rotating dashed perimeter
      ctx.save();
      ctx.rotate(time * 0.4);
      ctx.setLineDash([14, 10]);
      ctx.strokeStyle = z.color;
      ctx.globalAlpha = 0.52;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, z.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Scrolling directional wind chevrons along wind angle
      ctx.save();
      ctx.rotate(z.dirAngle);
      ctx.strokeStyle = z.color;
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = 0.45;
      const offsetShift = ((time * 130) % 70) - 35;
      ctx.beginPath();
      for (let row = -1; row <= 1; row++) {
        const yOff = row * 56;
        for (let col = -1; col <= 1; col++) {
          const xOff = col * 70 + offsetShift;
          if (Math.hypot(xOff, yOff) > z.radius - 35) continue;
          ctx.moveTo(xOff - 10, yOff - 8);
          ctx.lineTo(xOff + 4, yOff);
          ctx.lineTo(xOff - 10, yOff + 8);
        }
      }
      ctx.stroke();
      ctx.restore();

      // Zone caption
      ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = z.color;
      ctx.globalAlpha = 0.78;
      ctx.fillText(`💨 ${z.label}`, 0, -z.radius + 22);

      ctx.restore();
    }

    // 2. Jagged Neon Lightning Bolts (fast multi-pass stroke glow, zero shadowBlur)
    for (const bolt of this.cyberStorm.lightningBolts) {
      if (bolt.points.length < 2) continue;
      const alpha = Math.max(0, Math.min(1, bolt.life / bolt.maxLife));
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(bolt.points[0].x, bolt.points[0].y);
      for (let i = 1; i < bolt.points.length; i++) {
        ctx.lineTo(bolt.points[i].x, bolt.points[i].y);
      }

      ctx.globalAlpha = alpha * 0.28;
      ctx.strokeStyle = bolt.color;
      ctx.lineWidth = 11;
      ctx.stroke();

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = bolt.color;
      ctx.lineWidth = 4.5;
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  private ensureArenaFloorCache(lvl: LevelDef, bgImg: HTMLImageElement | undefined) {
    if (typeof document === 'undefined') return null;
    const useCyberForest = this.isDuelMode && this.duelMapTheme === 'cyber_forest_ruins';
    const effectiveImg = useCyberForest ? this.cyberForestImage || undefined : bgImg;
    const imgReady = Boolean(effectiveImg && effectiveImg.complete && effectiveImg.naturalWidth > 0);
    const cacheKey = useCyberForest
      ? `cyber_forest:${imgReady ? 1 : 0}`
      : `${lvl.level}:${imgReady ? 1 : 0}`;
    if (this.arenaFloorCache && this.arenaFloorCacheKey === cacheKey) {
      return this.arenaFloorCache;
    }

    const cache = this.arenaFloorCache || document.createElement('canvas');
    if (cache.width !== ARENA_WIDTH || cache.height !== ARENA_HEIGHT) {
      cache.width = ARENA_WIDTH;
      cache.height = ARENA_HEIGHT;
    }
    const cctx = cache.getContext('2d');
    if (!cctx) return null;

    const theme = getRegionAtmosphereTheme(lvl.region);
    const centerX = ARENA_WIDTH / 2;
    const centerY = ARENA_HEIGHT / 2;

    cctx.fillStyle = useCyberForest ? '#0f081e' : '#05070e';
    cctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    if (imgReady && effectiveImg) {
      try {
        cctx.drawImage(effectiveImg, 0, 0, ARENA_WIDTH, ARENA_HEIGHT);
      } catch {
        // Ignore transient decode failure on level image
      }
    }

    cctx.fillStyle = useCyberForest
      ? 'rgba(12, 6, 26, 0.34)'
      : `rgba(5, 7, 14, ${theme.overlayOpacity})`;
    cctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    const primaryTint = useCyberForest ? '#c084fc' : lvl.primaryColor;
    const accentTint = useCyberForest ? '#2dd4bf' : lvl.accentColor;

    const arenaBloom = cctx.createRadialGradient(centerX, centerY, 40, centerX, centerY, 720);
    arenaBloom.addColorStop(0, `${primaryTint}26`);
    arenaBloom.addColorStop(0.55, `${accentTint}12`);
    arenaBloom.addColorStop(1, 'rgba(8, 5, 18, 0.32)');
    cctx.fillStyle = arenaBloom;
    cctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);

    // Static 100px cyber grid
    const gridSize = 100;
    cctx.lineWidth = 1;
    cctx.strokeStyle = useCyberForest ? 'rgba(192, 132, 252, 0.14)' : `${lvl.primaryColor}1c`;
    cctx.beginPath();
    for (let x = 0; x <= ARENA_WIDTH; x += gridSize) {
      cctx.moveTo(x, 0);
      cctx.lineTo(x, ARENA_HEIGHT);
    }
    for (let y = 0; y <= ARENA_HEIGHT; y += gridSize) {
      cctx.moveTo(0, y);
      cctx.lineTo(ARENA_WIDTH, y);
    }
    cctx.stroke();

    // Static dashed floor circuit pathways into the reactor
    cctx.save();
    cctx.strokeStyle = `${accentTint}2e`;
    cctx.lineWidth = 2;
    cctx.setLineDash([12, 8]);
    cctx.beginPath();
    cctx.moveTo(40, 40); cctx.lineTo(centerX, centerY);
    cctx.moveTo(ARENA_WIDTH - 40, 40); cctx.lineTo(centerX, centerY);
    cctx.moveTo(ARENA_WIDTH - 40, ARENA_HEIGHT - 40); cctx.lineTo(centerX, centerY);
    cctx.moveTo(40, ARENA_HEIGHT - 40); cctx.lineTo(centerX, centerY);
    cctx.moveTo(centerX, 20); cctx.lineTo(centerX, centerY);
    cctx.moveTo(ARENA_WIDTH - 20, centerY); cctx.lineTo(centerX, centerY);
    cctx.moveTo(centerX, ARENA_HEIGHT - 20); cctx.lineTo(centerX, centerY);
    cctx.moveTo(20, centerY); cctx.lineTo(centerX, centerY);
    cctx.stroke();
    cctx.restore();

    this.arenaFloorCache = cache;
    this.arenaFloorCacheKey = cacheKey;
    return cache;
  }

  private renderDuelObstacles() {
    const ctx = this.ctx;
    const bounds = this.currentViewBounds;
    const time = (this.frameNowMs || performance.now()) * 0.001;

    for (const obs of this.duelObstacles) {
      if (obs.shape === 'rect') {
        const obsW = obs.w ?? 80;
        const obsH = obs.h ?? 58;
        const rx = obs.x - obsW / 2;
        const ry = obs.y - obsH / 2;
        const maxR = Math.max(obsW, obsH);
        if (!isInViewportBounds(obs.x, obs.y, maxR, bounds)) continue;

        ctx.save();
        if (obs.kind === 'crate') {
          // Armored frost-trimmed supply crate matching the picture
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(rx + 4, ry + 6, obsW, obsH);

          ctx.fillStyle = '#4a2e1f';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2;
          ctx.fillRect(rx, ry, obsW, obsH);
          ctx.strokeRect(rx, ry, obsW, obsH);

          // Cross timber / metal bracing
          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(rx + 6, ry + 6);
          ctx.lineTo(rx + obsW - 6, ry + obsH - 6);
          ctx.moveTo(rx + obsW - 6, ry + 6);
          ctx.lineTo(rx + 6, ry + obsH - 6);
          ctx.stroke();

          // Frost ice cap across top edge
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(rx - 2, ry - 2, obsW + 4, 8);
          ctx.fillStyle = '#7dd3fc';
          ctx.fillRect(rx - 2, ry + 6, obsW + 4, 3);
        } else {
          // Frosted Bunker Metallic Wall with purple neon pipe conduit (from user reference)
          ctx.fillStyle = 'rgba(4, 2, 12, 0.55)';
          ctx.fillRect(rx + 5, ry + 7, obsW, obsH);

          // Industrial steel face
          ctx.fillStyle = '#3b4254';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.fillRect(rx, ry, obsW, obsH);
          ctx.strokeRect(rx, ry, obsW, obsH);

          // Inner recessed metallic panel seams
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(rx + 6, ry + 10, obsW - 12, Math.max(8, obsH - 20));

          // Glowing purple energy conduit stripe along lower wall edge
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(rx + 4, ry + obsH - 7, obsW - 8, 3.5);
          ctx.fillStyle = '#f0abfc';
          ctx.fillRect(rx + 6, ry + obsH - 6, obsW - 12, 1.5);

          // Frost / snow crust on upper ledge
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(rx - 2, ry - 3, obsW + 4, 9);
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(rx - 2, ry + 6, obsW + 4, 3);
        }
        ctx.restore();
      } else {
        const r = obs.radius ?? 36;
        if (!isInViewportBounds(obs.x, obs.y, r + 36, bounds)) continue;
        ctx.save();
        ctx.translate(obs.x, obs.y);

        if (obs.kind === 'tree') {
          // Bioluminescent Circuit-Trunk Crystal Tree ("gach" from user reference picture)
          const pulse = 0.72 + 0.28 * Math.sin(time * 2.2 + obs.x * 0.01);

          // Ground shadow
          ctx.fillStyle = 'rgba(2, 6, 18, 0.5)';
          ctx.beginPath();
          ctx.ellipse(3, 6, r * 1.05, r * 0.92, 0, 0, Math.PI * 2);
          ctx.fill();

          // Outer glow halo
          ctx.strokeStyle = `rgba(45, 212, 191, ${0.28 * pulse})`;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
          ctx.stroke();

          // Frosted base roots & golden circuit core trunk
          ctx.fillStyle = '#3f2e18';
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Bioluminescent teal/cyan faceted leaf canopy clusters (6 petals around trunk)
          for (let k = 0; k < 6; k++) {
            const ang = (k / 6) * Math.PI * 2 + 0.25;
            const lx = Math.cos(ang) * r * 0.62;
            const ly = Math.sin(ang) * r * 0.62;
            ctx.fillStyle = k % 2 === 0 ? 'rgba(20, 184, 166, 0.85)' : 'rgba(56, 189, 248, 0.8)';
            ctx.strokeStyle = '#a5f3fc';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(lx, ly, r * 0.42, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Golden circuit vein branches from center toward leaves
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          for (let k = 0; k < 4; k++) {
            const ang = (k / 4) * Math.PI * 2 + 0.4;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(ang) * r * 0.72, Math.sin(ang) * r * 0.72);
          }
          ctx.stroke();

          // Bright crystalline center crown
          ctx.fillStyle = '#99f6e4';
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Purple & Cyan Crystal Cluster
          ctx.fillStyle = 'rgba(4, 2, 12, 0.48)';
          ctx.beginPath();
          ctx.arc(3, 5, r * 0.95, 0, Math.PI * 2);
          ctx.fill();

          const shards = [
            { ox: -r * 0.35, oy: r * 0.12, h: r * 0.95, w: r * 0.42, rot: -0.45, color: '#7e22ce', edge: '#e9d5ff' },
            { ox: r * 0.32, oy: r * 0.1, h: r * 0.85, w: r * 0.38, rot: 0.48, color: '#0284c7', edge: '#a5f3fc' },
            { ox: 0, oy: -r * 0.08, h: r * 1.15, w: r * 0.46, rot: 0.05, color: '#9333ea', edge: '#f5d0fe' },
          ];
          for (const sh of shards) {
            ctx.save();
            ctx.translate(sh.ox, sh.oy);
            ctx.rotate(sh.rot);
            ctx.fillStyle = sh.color;
            ctx.strokeStyle = sh.edge;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(0, -sh.h);
            ctx.lineTo(sh.w, 0);
            ctx.lineTo(0, sh.h * 0.45);
            ctx.lineTo(-sh.w, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          }
        }
        ctx.restore();
      }
    }
  }

  private renderDuelTacticalWalls() {
    const ctx = this.ctx;
    const bounds = this.currentViewBounds;
    const wallImg = this.tacticalWallImage;
    const hasArt = Boolean(wallImg && wallImg.complete && wallImg.naturalWidth > 0);
    const nowSec = (this.frameNowMs || performance.now()) * 0.001;

    for (const wall of this.duelTacticalWalls) {
      if (wall.hp <= 0) continue;
      const hw = wall.halfWidth;
      const vh = 26;
      if (!isInViewportBounds(wall.x, wall.y, hw + 40, bounds)) continue;

      const hpRatio = Math.max(0, Math.min(1, wall.hp / Math.max(1, wall.maxHp)));
      const ownerColor = wall.color || '#00f3ff';

      ctx.save();
      ctx.translate(wall.x, wall.y);
      ctx.rotate(wall.angle + Math.PI / 2);

      // Ground drop shadow
      ctx.fillStyle = 'rgba(4, 2, 16, 0.55)';
      ctx.beginPath();
      ctx.roundRect(-hw + 3, -vh + 5, hw * 2, vh * 2, 10);
      ctx.fill();

      // Clip shield silhouette matching user's cyber shield plate
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-hw + 10, -vh);
      ctx.lineTo(hw - 10, -vh);
      ctx.lineTo(hw, -vh + 9);
      ctx.lineTo(hw, vh - 9);
      ctx.lineTo(hw - 10, vh);
      ctx.lineTo(-hw + 10, vh);
      ctx.lineTo(-hw, vh - 9);
      ctx.lineTo(-hw, -vh + 9);
      ctx.closePath();

      if (hasArt && wallImg) {
        ctx.save();
        ctx.clip();
        const iw = wallImg.naturalWidth;
        const ih = wallImg.naturalHeight;
        // Crop cleanly onto the cyber shield emblem/plate without dark outer backdrop
        ctx.drawImage(
          wallImg,
          iw * 0.06,
          ih * 0.16,
          iw * 0.88,
          ih * 0.68,
          -hw,
          -vh,
          hw * 2,
          vh * 2
        );
        ctx.restore();
      } else {
        ctx.fillStyle = '#0e3748';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Glowing outer energy shield frame (owner accent + magenta circuit shimmer)
      const pulse = 0.72 + 0.28 * Math.sin(nowSec * 5 + wall.x * 0.02);
      ctx.strokeStyle = wall.hitFlash > 0.15 ? '#ffffff' : ownerColor;
      ctx.lineWidth = wall.hitFlash > 0.15 ? 3.4 : 2.6;
      ctx.globalAlpha = wall.hitFlash > 0.15 ? 1 : 0.92 * pulse;
      ctx.stroke();

      // Hit impact bright flash overlay
      if (wall.hitFlash > 0.05) {
        ctx.fillStyle = `rgba(224, 242, 254, ${Math.min(0.65, wall.hitFlash * 0.55)})`;
        ctx.fill();
      }

      // Progressive structural crack lines as the shield takes sustained fire
      if (hpRatio < 0.75) {
        ctx.strokeStyle = hpRatio < 0.35 ? '#fb7185' : '#bae6fd';
        ctx.lineWidth = hpRatio < 0.35 ? 2.2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.55, -vh * 0.7);
        ctx.lineTo(-hw * 0.22, -4);
        ctx.lineTo(-hw * 0.38, vh * 0.6);
        if (hpRatio < 0.45) {
          ctx.moveTo(hw * 0.45, -vh * 0.65);
          ctx.lineTo(hw * 0.14, 2);
          ctx.lineTo(hw * 0.36, vh * 0.7);
          ctx.moveTo(-12, 0);
          ctx.lineTo(14, -6);
        }
        ctx.stroke();
      }

      ctx.restore();
      ctx.restore();

      // Upright tactical durability bar floating above shield wall
      ctx.save();
      const barW = 78;
      const barH = 6;
      const bx = wall.x - barW / 2;
      const by = wall.y - 40;
      ctx.fillStyle = 'rgba(5, 9, 18, 0.88)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 1;
      ctx.fillRect(bx, by, barW, barH);
      ctx.strokeRect(bx, by, barW, barH);
      ctx.fillStyle =
        hpRatio > 0.5 ? '#22d3ee' : hpRatio > 0.25 ? '#fbbf24' : '#fb7185';
      ctx.fillRect(bx + 1, by + 1, Math.max(0, (barW - 2) * hpRatio), barH - 2);
      if (wall.maxTtl > 0) {
        const ttlRatio = Math.max(0, Math.min(1, wall.ttl / wall.maxTtl));
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(bx, by + barH + 2, barW, 3);
        ctx.fillStyle = ttlRatio > 0.35 ? '#e879f9' : '#fb7185';
        ctx.fillRect(bx, by + barH + 2, barW * ttlRatio, 3);
      }
      ctx.restore();
    }
  }

  private renderArenaGrid(_camX: number, _camY: number) {
    const ctx = this.ctx;
    const lvl = getLevelDef(this.currentLevel);
    const theme = getRegionAtmosphereTheme(lvl.region);
    const time = (this.frameNowMs || performance.now()) * 0.001;
    const bounds = this.currentViewBounds;
    const bgImg = this.levelImages.get(this.currentLevel);

    // 1. Blit ONLY visible sub-rectangle from cached static arena floor (eliminates scaling 2200x1600 image & gradients every frame)
    const floorCache = this.ensureArenaFloorCache(lvl, bgImg);
    const sx = Math.max(0, Math.floor(bounds.minX));
    const sy = Math.max(0, Math.floor(bounds.minY));
    const ex = Math.min(ARENA_WIDTH, Math.ceil(bounds.maxX));
    const ey = Math.min(ARENA_HEIGHT, Math.ceil(bounds.maxY));
    const sw = ex - sx;
    const sh = ey - sy;

    if (floorCache && sw > 0 && sh > 0) {
      ctx.drawImage(floorCache, sx, sy, sw, sh, sx, sy, sw, sh);
    } else {
      ctx.fillStyle = '#05070e';
      ctx.fillRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    }

    // 2. Viewport-clipped crossfade from previous level image during level transition
    if (
      !this.isMobileDevice &&
      this.adaptiveQuality.tier !== 'performance' &&
      this.levelTransitionTimer > 0 &&
      sw > 0 &&
      sh > 0 &&
      this.prevLevelImage &&
      this.prevLevelImage.complete &&
      this.prevLevelImage.naturalWidth > 0
    ) {
      try {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.levelTransitionTimer / 1.6));
        const imgScaleX = this.prevLevelImage.naturalWidth / ARENA_WIDTH;
        const imgScaleY = this.prevLevelImage.naturalHeight / ARENA_HEIGHT;
        ctx.drawImage(
          this.prevLevelImage,
          sx * imgScaleX,
          sy * imgScaleY,
          sw * imgScaleX,
          sh * imgScaleY,
          sx,
          sy,
          sw,
          sh
        );
        ctx.restore();
      } catch {
        ctx.restore();
      }
    }

    const centerX = ARENA_WIDTH / 2;
    const centerY = ARENA_HEIGHT / 2;

    // 4. Outer boundary containment field (fast double-pass border glow, zero shadowBlur)
    const dangerSurge = this.bossActive || this.difficulty === 'nightmare';
    const borderGlowAlpha = dangerSurge ? 0.35 + 0.2 * Math.sin(time * 5) : 0.22;
    const borderColor = dangerSurge ? '#ff0055' : lvl.primaryColor;
    ctx.save();
    ctx.strokeStyle = borderColor;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = dangerSurge ? 12 : 8;
    ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    ctx.restore();

    ctx.lineWidth = 1.2;
    ctx.strokeStyle = `${lvl.primaryColor}${Math.floor(borderGlowAlpha * 255).toString(16).padStart(2, '0')}`;
    ctx.strokeRect(14, 14, ARENA_WIDTH - 28, ARENA_HEIGHT - 28);

    // 5. Batched illuminated junction crosshairs ONLY inside visible viewport
    const startJx = Math.max(200, Math.ceil(bounds.minX / 200) * 200);
    const endJx = Math.min(ARENA_WIDTH - 1, Math.floor(bounds.maxX / 200) * 200);
    const startJy = Math.max(200, Math.ceil(bounds.minY / 200) * 200);
    const endJy = Math.min(ARENA_HEIGHT - 1, Math.floor(bounds.maxY / 200) * 200);

    ctx.strokeStyle = lvl.primaryColor;
    ctx.lineWidth = 1.4;
    ctx.globalAlpha = 0.24;
    ctx.beginPath();
    for (let x = startJx; x <= endJx; x += 200) {
      for (let y = startJy; y <= endJy; y += 200) {
        ctx.moveTo(x - 6, y);
        ctx.lineTo(x + 6, y);
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x, y + 6);
      }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 6. Racing energy pulses into the reactor
    const corners = [
      { x: 40, y: 40 },
      { x: ARENA_WIDTH - 40, y: 40 },
      { x: ARENA_WIDTH - 40, y: ARENA_HEIGHT - 40 },
      { x: 40, y: ARENA_HEIGHT - 40 },
    ];
    const cardinals = [
      { x: centerX, y: 20 },
      { x: ARENA_WIDTH - 20, y: centerY },
      { x: centerX, y: ARENA_HEIGHT - 20 },
      { x: 20, y: centerY },
    ];

    // Animated comet pulses racing along conduits toward the center reactor
    for (let i = 0; i < corners.length; i++) {
      const c = corners[i];
      const progress = (time * 0.32 + i * 0.25) % 1;
      const px = c.x + (centerX - c.x) * progress;
      const py = c.y + (centerY - c.y) * progress;
      ctx.fillStyle = lvl.primaryColor;
      ctx.beginPath();
      ctx.arc(px, py, 4.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < cardinals.length; i++) {
      const m = cardinals[i];
      const progress = (time * 0.4 + i * 0.25 + 0.12) % 1;
      const px = m.x + (centerX - m.x) * progress;
      const py = m.y + (centerY - m.y) * progress;
      ctx.fillStyle = lvl.accentColor;
      ctx.beginPath();
      ctx.arc(px, py, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Corner boundary energy pylons with rotating diamond brackets
    const beaconPulse = Math.sin(time * 3.2) * 7;
    for (let i = 0; i < corners.length; i++) {
      const c = corners[i];
      ctx.fillStyle = `${lvl.primaryColor}24`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 34 + beaconPulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(time * (i % 2 === 0 ? 0.9 : -0.9));
      ctx.strokeStyle = lvl.accentColor;
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-18, -18, 36, 36);
      ctx.restore();

      ctx.strokeStyle = lvl.primaryColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. Center arena holographic cyber reactor (culled when offscreen; zero per-frame gradient allocations)
    if (isInViewportBounds(centerX, centerY, 390, bounds)) {
      const rot = time * 0.42;
      const sweepAngle = time * 0.75;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.fillStyle = theme.radarColor;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 260, sweepAngle - 0.38, sweepAngle);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = `${lvl.primaryColor}66`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sweepAngle) * 260, Math.sin(sweepAngle) * 260);
      ctx.stroke();
      ctx.restore();

      const sonarRadius = (time * 85) % 380;
      const sonarAlpha = Math.max(0, 1 - sonarRadius / 380) * 0.22;
      ctx.beginPath();
      ctx.arc(centerX, centerY, sonarRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `${lvl.primaryColor}${Math.floor(sonarAlpha * 255).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 260, 0, Math.PI * 2);
      ctx.strokeStyle = `${lvl.primaryColor}38`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rot);

      // Batched spoke ticks (2 strokes instead of 12)
      ctx.strokeStyle = `${lvl.accentColor}88`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let k = 0; k < 12; k += 3) {
        const a = (k * Math.PI * 2) / 12;
        ctx.moveTo(Math.cos(a) * 246, Math.sin(a) * 246);
        ctx.lineTo(Math.cos(a) * 266, Math.sin(a) * 266);
      }
      ctx.stroke();

      ctx.strokeStyle = `${lvl.primaryColor}44`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = 0; k < 12; k++) {
        if (k % 3 === 0) continue;
        const a = (k * Math.PI * 2) / 12;
        ctx.moveTo(Math.cos(a) * 246, Math.sin(a) * 246);
        ctx.lineTo(Math.cos(a) * 266, Math.sin(a) * 266);
      }
      ctx.stroke();

      ctx.strokeStyle = `${lvl.accentColor}66`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 190, 0, Math.PI * 2);
      ctx.stroke();

      ctx.rotate(-rot * 2.1);
      ctx.strokeStyle = `${lvl.primaryColor}4d`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let h = 0; h <= 6; h++) {
        const ha = (h * Math.PI) / 3;
        const hx = Math.cos(ha) * 145;
        const hy = Math.sin(ha) * 145;
        if (h === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.stroke();

      ctx.strokeStyle = `${lvl.primaryColor}66`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 110, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const corePulse = 56 + Math.sin(time * 2.8) * 8;
      ctx.fillStyle = `${lvl.primaryColor}28`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, corePulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderPickups() {
    if (this.pickups.length === 0) return;
    const ctx = this.ctx;
    const time = (this.frameNowMs || performance.now()) * 0.005;
    const bounds = this.currentViewBounds;
    const fastCoins = this.adaptiveQuality.simplifyPickups || this.pickups.length > 16;

    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];
      if (!isInViewportBounds(p.x, p.y, p.radius + 10, bounds)) continue;
      const bob = Math.sin(time + p.id) * 3;

      if (p.type === 'coin') {
        if (fastCoins) {
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.arc(p.x, p.y + bob, p.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(p.x, p.y + bob, p.radius * 0.72, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Glowing Golden Cyber Coin with specular 3D spin
          const spin = Math.cos(time * 3.5 + p.id);
          const coinW = Math.max(3, p.radius * Math.abs(spin));
          const coinH = p.radius;

          // Outer golden glow aura
          ctx.fillStyle = 'rgba(255, 215, 0, 0.28)';
          ctx.beginPath();
          ctx.arc(p.x, p.y + bob, p.radius + 5, 0, Math.PI * 2);
          ctx.fill();

          // Golden outer rim
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + bob, coinW, coinH, 0, 0, Math.PI * 2);
          ctx.fill();

          // Inner bright gold face
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.ellipse(p.x, p.y + bob, coinW * 0.8, coinH * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Specular highlight
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(p.x - coinW * 0.25, p.y + bob - coinH * 0.25, coinW * 0.35, coinH * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();

          // Embossed 'C' symbol when facing front
          if (Math.abs(spin) > 0.45) {
            ctx.fillStyle = '#7a4b00';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('C', p.x, p.y + bob);
          }
        }
      } else if (p.type === 'scrap') {
        ctx.fillStyle = '#ffb400';
        ctx.beginPath();
        // Hexagonal scrap core
        for (let a = 0; a < 6; a++) {
          const rad = (a * Math.PI) / 3;
          const px = p.x + Math.cos(rad) * p.radius;
          const py = p.y + bob + Math.sin(rad) * p.radius;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Inner glowing core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y + bob, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'nanite_heal') {
        // Green medical cross
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(p.x, p.y + bob, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x - 2, p.y + bob - 6, 4, 12);
        ctx.fillRect(p.x - 6, p.y + bob - 2, 12, 4);
      } else if (p.type === 'shield_boost') {
        // Cyan shield flux cell
        ctx.fillStyle = '#00f3ff';
        ctx.beginPath();
        ctx.arc(p.x, p.y + bob, p.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  private renderTelegraphs() {
    const ctx = this.ctx;

    for (const e of this.enemies) {
      if (e.state !== 'windup') continue;

      if (e.type === 'swarmer') {
        // Red lunge dash corridor line telegraph
        const progress = 1 - e.telegraphTimer / e.telegraphDuration;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 85, ${0.4 + progress * 0.5})`;
        ctx.lineWidth = 3 + progress * 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(e.angle) * 160, e.y + Math.sin(e.angle) * 160);
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'sniper' && e.sniperLaserAim) {
        // Red laser sightline beam telegraph with increasing intensity
        const progress = 1 - e.telegraphTimer / e.telegraphDuration;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 0, 119, ${0.3 + progress * 0.7})`;
        ctx.lineWidth = 1.5 + progress * 3;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.sniperLaserAim.x, e.sniperLaserAim.y);
        ctx.stroke();

        // Target reticle on player
        ctx.strokeStyle = '#ff0077';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.sniperLaserAim.x, e.sniperLaserAim.y, 14 * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'tank') {
        // Expanding ground shockwave hazard ring
        const progress = 1 - e.telegraphTimer / e.telegraphDuration;
        ctx.save();
        ctx.fillStyle = `rgba(255, 180, 0, ${progress * 0.25})`;
        ctx.strokeStyle = '#ffb400';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 200 * progress, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'phantom') {
        // Purple phase corridor telegraph
        const progress = 1 - e.telegraphTimer / e.telegraphDuration;
        ctx.save();
        ctx.strokeStyle = `rgba(176, 38, 255, ${0.4 + progress * 0.5})`;
        ctx.lineWidth = 3 + progress * 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(e.angle) * 220, e.y + Math.sin(e.angle) * 220);
        ctx.stroke();
        ctx.restore();
      } else if (e.type === 'shield_breaker') {
        // Expanding cyan kinetic disruptor pulse & twin prong laser telegraph
        const progress = 1 - e.telegraphTimer / e.telegraphDuration;
        ctx.save();
        ctx.fillStyle = `rgba(56, 189, 248, ${progress * 0.18})`;
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.45 + progress * 0.5})`;
        ctx.lineWidth = 2 + progress * 2;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 185 * progress, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(e.angle) * 320, e.y + Math.sin(e.angle) * 320);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  private renderEnemies() {
    const ctx = this.ctx;
    const bounds = this.currentViewBounds;
    const nowMs = this.frameNowMs || performance.now();

    for (const e of this.enemies) {
      if (!isInViewportBounds(e.x, e.y, e.radius + 20, bounds)) continue;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(e.angle);

      // KO dissolve/alpha
      if (e.state === 'ko') {
        ctx.globalAlpha = Math.max(0, e.koTimer / 0.35);
      }

      // Windup sprite vibration removed for smooth lag-free clarity

      if (e.type === 'swarmer') {
        // Sharp triangular attack drone
        ctx.fillStyle = e.state === 'windup' ? '#ff0055' : e.color;
        ctx.beginPath();
        ctx.moveTo(e.radius * 1.3, 0);
        ctx.lineTo(-e.radius * 0.9, -e.radius * 0.8);
        ctx.lineTo(-e.radius * 0.4, 0);
        ctx.lineTo(-e.radius * 0.9, e.radius * 0.8);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Eye
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(e.radius * 0.3, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'sniper') {
        // Sleek elongated diamond shape
        ctx.fillStyle = e.state === 'windup' ? '#ffffff' : '#1a0d24';
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(e.radius * 1.5, 0);
        ctx.lineTo(0, -e.radius * 0.7);
        ctx.lineTo(-e.radius * 1.2, 0);
        ctx.lineTo(0, e.radius * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sniper lens
        ctx.fillStyle = '#ff0077';
        ctx.beginPath();
        ctx.arc(e.radius * 0.7, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'tank') {
        // Heavy armored octagonal hull
        ctx.fillStyle = '#1c1608';
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Directional Front Shield Arc
        if (e.shieldArc) {
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 7, -e.shieldArc / 2, e.shieldArc / 2);
          ctx.strokeStyle = '#00f3ff';
          ctx.lineWidth = 5;
          ctx.stroke();
        }

        // Inner reactor
        ctx.fillStyle = '#ffb400';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'shield_breaker') {
        // Armored sapphire/cyan twin-prong Shield-Breaker chassis + 360 hexagonal kinetic barrier
        ctx.fillStyle = '#0b182e';
        ctx.strokeStyle = e.state === 'windup' ? '#ffffff' : '#38bdf8';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(e.radius * 1.15, -e.radius * 0.42);
        ctx.lineTo(e.radius * 0.25, -e.radius * 0.92);
        ctx.lineTo(-e.radius * 0.85, -e.radius * 0.65);
        ctx.lineTo(-e.radius * 0.55, 0);
        ctx.lineTo(-e.radius * 0.85, e.radius * 0.65);
        ctx.lineTo(e.radius * 0.25, e.radius * 0.92);
        ctx.lineTo(e.radius * 1.15, e.radius * 0.42);
        ctx.lineTo(e.radius * 0.55, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner kinetic core
        ctx.fillStyle = (e.kineticBarrierHp ?? 0) > 0 ? '#00f3ff' : '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
        ctx.fill();

        // 360-degree Hexagonal Kinetic Barrier Dome
        if ((e.kineticBarrierHp ?? 0) > 0) {
          const bRatio = Math.max(0.25, (e.kineticBarrierHp ?? 1) / Math.max(1, e.kineticBarrierMaxHp ?? 1));
          const flash = (e.kineticBarrierFlash ?? 0) > 0;
          const barrierR = e.radius + 9;
          ctx.fillStyle = flash ? 'rgba(0, 243, 255, 0.28)' : 'rgba(56, 189, 248, 0.14)';
          ctx.strokeStyle = flash ? '#ffffff' : `rgba(56, 189, 248, ${0.45 + bRatio * 0.5})`;
          ctx.lineWidth = flash ? 3.5 : 2.6;
          ctx.beginPath();
          for (let h = 0; h < 6; h++) {
            const ha = (h * Math.PI) / 3 + (this.frameNowMs || 0) * 0.0016;
            const hx = Math.cos(ha) * barrierR;
            const hy = Math.sin(ha) * barrierR;
            if (h === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Overloaded/Recharging dashed indicator
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else if (e.type === 'phantom') {
        // Ethereal phase stealth assassin with sweeping wings and pulsing purple glow
        ctx.globalAlpha = (e.phaseAlpha ?? 1) * (e.state === 'ko' ? Math.max(0, e.koTimer / 0.35) : 1);
        ctx.fillStyle = e.isPhasing ? '#1f0733' : '#33084d';
        ctx.strokeStyle = '#b026ff';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(e.radius * 1.5, 0); // sharp needle nose
        ctx.lineTo(-e.radius * 0.4, -e.radius * 1.2); // swept forward left wingtip
        ctx.lineTo(-e.radius * 0.8, -e.radius * 0.4);
        ctx.lineTo(-e.radius * 0.3, 0); // rear notch
        ctx.lineTo(-e.radius * 0.8, e.radius * 0.4);
        ctx.lineTo(-e.radius * 0.4, e.radius * 1.2); // swept forward right wingtip
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Spectral cockpit eye
        ctx.fillStyle = e.isPhasing ? '#00f3ff' : '#ff00ff';
        ctx.beginPath();
        ctx.arc(e.radius * 0.4, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'storm_drone') {
        // Electric hex drone with spinning lightning rods
        ctx.fillStyle = '#061a29';
        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const rad = (a * Math.PI) / 3;
          const px = Math.cos(rad) * e.radius;
          const py = Math.sin(rad) * e.radius;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rotating lightning arcs
        for (let r = 0; r < 3; r++) {
          const rodAngle = (r * Math.PI * 2) / 3 + nowMs * 0.005;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(rodAngle) * (e.radius + 6), Math.sin(rodAngle) * (e.radius + 6));
          ctx.stroke();
        }

        // Electric core
        ctx.fillStyle = '#00f3ff';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'behemoth') {
        // Massive dual-shielded war cruiser with twin heavy cannons
        ctx.fillStyle = '#2b0900';
        ctx.strokeStyle = '#ff3300';
        ctx.lineWidth = 3.5;

        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Directional Front Shield Arc
        if (e.shieldArc) {
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 8, -e.shieldArc / 2, e.shieldArc / 2);
          ctx.strokeStyle = '#ff7700';
          ctx.lineWidth = 6;
          ctx.stroke();
        }

        // Twin heavy forward cannon barrels
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(e.radius * 0.5, -12, 16, 5);
        ctx.fillRect(e.radius * 0.5, 7, 16, 5);

        // Heavy red core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'goliath') {
        // Heavy boss fortress
        ctx.fillStyle = '#260510';
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Rotating turrets
        for (let t = 0; t < 4; t++) {
          const a = (t * Math.PI) / 2;
          ctx.fillStyle = '#ff0055';
          ctx.beginPath();
          ctx.arc(Math.cos(a) * (e.radius - 8), Math.sin(a) * (e.radius - 8), 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      if (e.isBountyTarget && e.state !== 'ko') {
        const pulse = 1 + Math.sin(nowMs * 0.01) * 0.12;
        ctx.save();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(e.x, e.y, (e.radius + 14) * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 10px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🎯 BOUNTY', e.x, e.y - e.radius - 18);
        ctx.restore();
      }

      // Enemy Health Bar (+ Kinetic Barrier Bar for Shield-Breaker)
      if (
        e.hp < e.maxHp ||
        e.type === 'goliath' ||
        e.type === 'tank' ||
        e.type === 'shield_breaker' ||
        e.type === 'behemoth' ||
        e.type === 'phantom'
      ) {
        const barW = e.radius * 2;
        const barH = 4;
        const barX = e.x - barW / 2;
        const barY = e.y - e.radius - 12;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(barX, barY, barW, barH);

        const hpRatio = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = e.type === 'goliath' ? '#ff0055' : e.color;
        ctx.fillRect(barX, barY, barW * hpRatio, barH);

        if (e.type === 'shield_breaker' && (e.kineticBarrierMaxHp ?? 0) > 0) {
          const bBarY = barY - 6;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
          ctx.fillRect(barX, bBarY, barW, 3.5);
          const bRatio = Math.max(0, (e.kineticBarrierHp ?? 0) / Math.max(1, e.kineticBarrierMaxHp ?? 1));
          if (bRatio > 0) {
            ctx.fillStyle = '#00f3ff';
            ctx.fillRect(barX, bBarY, barW * bRatio, 3.5);
            if (!isBarrierBypassWeapon(this.stats.activeWeapon) && !e.isBountyTarget) {
              ctx.fillStyle = '#bae6fd';
              ctx.font = 'bold 9px ui-monospace, monospace';
              ctx.textAlign = 'center';
              ctx.fillText('BEAM / RAIL', e.x, bBarY - 4);
            }
          }
        }
      }
    }
  }

  private recordDuelMomentumTrail(
    slot: DuelSlotId,
    actor: { x: number; y: number; vx: number; vy: number; radius: number; angle: number },
    scoreState: DuelPlayerScore
  ) {
    if (scoreState.momentumTimer <= 0 || scoreState.respawnTimer > 0) return;
    const trail = this.getDuelTrailRef(slot);
    const last = trail[trail.length - 1];
    const dist = last ? Math.hypot(actor.x - last.x, actor.y - last.y) : 999;
    if (dist >= 8) {
      trail.push({
        x: actor.x,
        y: actor.y,
        angle: actor.angle,
        life: 0.38,
        maxLife: 0.38,
      });
      if (trail.length > 22) {
        trail.shift();
      }
      if (Math.random() < 0.45) {
        const backX = actor.x - Math.cos(actor.angle) * (actor.radius * 0.8);
        const backY = actor.y - Math.sin(actor.angle) * (actor.radius * 0.8);
        this.emitParticle(
          backX + (Math.random() - 0.5) * 8,
          backY + (Math.random() - 0.5) * 8,
          -actor.vx * 0.18 + (Math.random() - 0.5) * 35,
          -actor.vy * 0.18 + (Math.random() - 0.5) * 35,
          3.2,
          scoreState.color || (slot === 'p2' ? '#ff66aa' : '#67e8f9'),
          0.26,
          'spark'
        );
      }
    }
  }

  private updateDuelMomentumTrails(dt: number) {
    const trails: { x: number; y: number; angle: number; life: number; maxLife: number }[][] = [
      this.duelP1Trail,
      this.duelP2Trail,
    ];
    for (const extra of this.duelExtraActors.values()) {
      trails.push(extra.trail);
    }
    for (const trail of trails) {
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].life -= dt;
        if (trail[i].life <= 0) {
          trail.splice(i, 1);
        }
      }
    }
  }

  private renderCyberMomentumTrail(
    trail: { x: number; y: number; angle: number; life: number; maxLife: number }[],
    color: string,
    momentumTimer: number
  ) {
    if (trail.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const total = trail.length - 1;
    for (let i = 0; i < total; i++) {
      const a = trail[i];
      const b = trail[i + 1];
      const t = (i + 1) / total;
      const lifeAlpha = Math.max(0, Math.min(1, b.life / b.maxLife));

      // Outer luminous slipstream ribbon
      ctx.globalAlpha = lifeAlpha * t * 0.55;
      ctx.strokeStyle = color;
      ctx.lineWidth = 4 + t * 16;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Inner bright core filament
      ctx.globalAlpha = lifeAlpha * t * 0.85;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2 + t * 4.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Subtle speed-chevron afterimages along trail when actively boosted
    if (momentumTimer > 0) {
      for (let i = 1; i < trail.length; i += 4) {
        const pt = trail[i];
        const alpha = Math.max(0, Math.min(0.45, (pt.life / pt.maxLife) * 0.45));
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.angle);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-8, -9);
        ctx.moveTo(10, 0);
        ctx.lineTo(-8, 9);
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  private renderPlayer() {
    if (this.isDuelMode) {
      for (const slot of this.getActiveDuelSlots()) {
        const score = this.getDuelScoreRef(slot);
        if (!score || !score.connected || score.respawnTimer > 0) continue;
        this.renderCyberMomentumTrail(
          this.getDuelTrailRef(slot),
          score.color || (slot === 'p1' ? '#00f3ff' : '#ff0077'),
          score.momentumTimer
        );
      }
    }

    const primarySlot: DuelSlotId =
      this.isDuelMode && this.duelConfig?.mode === 'online'
        ? this.duelConfig.localSlot || 'p1'
        : 'p1';
    const isSpectatorView = Boolean(this.isDuelMode && this.duelConfig?.isSpectator);
    const heroActor = this.isDuelMode ? this.getDuelActorRef(primarySlot) || this.player : this.player;
    const heroScore = this.isDuelMode ? this.getDuelScoreRef(primarySlot) : null;
    const heroRespawning = this.isDuelMode && heroScore && heroScore.respawnTimer > 0;
    const ctx = this.ctx;
    if (!isSpectatorView && heroRespawning) {
      ctx.save();
      ctx.strokeStyle = heroScore?.color || 'rgba(0, 243, 255, 0.5)';
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(heroActor.x, heroActor.y, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (!isSpectatorView) {
      ctx.save();
      ctx.translate(heroActor.x, heroActor.y);
      ctx.rotate(heroActor.angle);
      ctx.scale(heroActor.scaleX, heroActor.scaleY);

    const nowMs = this.frameNowMs || performance.now();

    // Invulnerability blink
    if (heroActor.invulnerableTimer > 0 && Math.floor(nowMs / 80) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Active Cyber Momentum speed ring around local hero hull
    if (this.isDuelMode && heroScore && heroScore.momentumTimer > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(nowMs * 0.015);
      ctx.strokeStyle = `rgba(103, 232, 249, ${0.45 + pulse * 0.4})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, heroActor.radius + 13, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Active Dash Overcharge electric gold-cyan aura & momentary invulnerability ring
    if (this.dashOverchargeTimer > 0) {
      const nowSec = nowMs * 0.008;
      const isInvulnWindow = this.player.invulnerableTimer > 0.02;
      ctx.save();
      ctx.rotate(nowSec);
      ctx.strokeStyle = isInvulnWindow
        ? 'rgba(250, 204, 21, 0.92)'
        : 'rgba(56, 189, 248, 0.72)';
      ctx.lineWidth = isInvulnWindow ? 3.2 : 2.2;
      ctx.setLineDash([10, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius + 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (isInvulnWindow) {
        ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
        ctx.beginPath();
        ctx.arc(0, 0, this.player.radius + 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Active Cryo-Pulse Stasis Field Aura
    if (!this.isDuelMode) {
      const cMods = this.cachedAugMods;
      if (cMods.cryoAuraRadius > 0) {
        const pulse = 0.5 + 0.5 * Math.sin(nowMs * 0.006);
        ctx.save();
        ctx.strokeStyle = `rgba(103, 232, 249, ${0.22 + pulse * 0.16})`;
        ctx.fillStyle = 'rgba(103, 232, 249, 0.04)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, cMods.cryoAuraRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    // Active Overdrive Surge Golden Halo
    if (this.overdriveTimer > 0) {
      ctx.save();
      ctx.rotate(-nowMs * 0.01);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius + 19, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    const craft = getCraftDef(this.activeCraft);
    const neonSkin =
      !this.isDuelMode && this.activeCraftSkin === 'neon'
        ? NEON_CRAFT_SKINS[this.activeCraft]
        : null;

    // Exclusive Neon Skin Rotating Outer Lattice Aura
    if (neonSkin) {
      ctx.save();
      ctx.rotate(nowMs * 0.004);
      ctx.strokeStyle = neonSkin.secondaryNeon;
      ctx.globalAlpha = 0.52 + 0.18 * Math.sin(nowMs * 0.009);
      ctx.lineWidth = 1.6;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, this.player.radius + 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Shield bubble
    const activeShield = heroScore ? heroScore.shield : this.stats.currentShield;
    const activeMaxShield = heroScore ? heroScore.maxShield : this.stats.maxShield;
    if (activeShield > 0) {
      const shieldRatio = activeShield / Math.max(1, activeMaxShield);
      ctx.strokeStyle = neonSkin
        ? neonSkin.shieldNeon
        : `rgba(0, 243, 255, ${0.35 + shieldRatio * 0.45})`;
      ctx.lineWidth = neonSkin ? 2.8 : 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, heroActor.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    const r = heroActor.radius;

    // Craft Specific Geometries (with Exclusive Neon Skin overrides):
    if (this.activeCraft === 'phantom_shadow') {
      // Sleek forward-swept stealth chevron interceptor
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#120a21';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#b026ff';
      ctx.lineWidth = neonSkin ? 3 : 2.5;

      ctx.beginPath();
      ctx.moveTo(r * 1.6, 0); // needle nose
      ctx.lineTo(r * 0.2, -r * 1.3); // left forward swept wingtip
      ctx.lineTo(-r * 0.8, -r * 0.5);
      ctx.lineTo(-r * 0.3, 0); // rear notch
      ctx.lineTo(-r * 0.8, r * 0.5);
      ctx.lineTo(r * 0.2, r * 1.3); // right forward swept wingtip
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner neon wing ribs
      ctx.strokeStyle = neonSkin ? neonSkin.secondaryNeon : '#00f3ff';
      ctx.lineWidth = neonSkin ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(r * 0.8, 0);
      ctx.lineTo(0, -r * 0.8);
      ctx.moveTo(r * 0.8, 0);
      ctx.lineTo(0, r * 0.8);
      ctx.stroke();
    } else if (this.activeCraft === 'titan_dread') {
      // Broad armored fortress dreadnought
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#1c160b';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#ffb400';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(r * 1.3, -r * 0.6); // left forward prong
      ctx.lineTo(r * 1.3, r * 0.6); // right forward prong
      ctx.lineTo(r * 0.5, r * 1.2); // wide starboard hull
      ctx.lineTo(-r * 0.9, r * 1.1); // rear right
      ctx.lineTo(-r * 0.7, 0); // rear center
      ctx.lineTo(-r * 0.9, -r * 1.1); // rear left
      ctx.lineTo(r * 0.5, -r * 1.2); // wide port hull
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Armor plating lines
      ctx.fillStyle = neonSkin ? neonSkin.secondaryNeon : '#ff7700';
      ctx.fillRect(-r * 0.4, -r * 0.8, 4, r * 1.6);
    } else if (this.activeCraft === 'solar_phoenix') {
      // Radiant golden soaring avian wings
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#260a0a';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#ff7700';
      ctx.lineWidth = neonSkin ? 3 : 2.5;

      ctx.beginPath();
      ctx.moveTo(r * 1.5, 0); // beak
      ctx.quadraticCurveTo(0, -r * 1.4, -r * 0.9, -r * 1.2); // curving wing arch
      ctx.lineTo(-r * 0.4, -r * 0.4);
      ctx.lineTo(-r * 0.8, 0); // feathered tail
      ctx.lineTo(-r * 0.4, r * 0.4);
      ctx.lineTo(-r * 0.9, r * 1.2);
      ctx.quadraticCurveTo(0, r * 1.4, r * 1.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wing veins
      ctx.strokeStyle = neonSkin ? neonSkin.secondaryNeon : '#ffd700';
      ctx.lineWidth = neonSkin ? 2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(r * 0.5, 0);
      ctx.lineTo(-r * 0.5, -r * 0.9);
      ctx.moveTo(r * 0.5, 0);
      ctx.lineTo(-r * 0.5, r * 0.9);
      ctx.stroke();
    } else if (this.activeCraft === 'aegis_celestial') {
      // Ultra-flagship: dual outer warp nacelles & floating energy halo
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#081426';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#00f3ff';
      ctx.lineWidth = neonSkin ? 3 : 2.5;

      // Central command needle
      ctx.beginPath();
      ctx.moveTo(r * 1.6, 0);
      ctx.lineTo(-r * 0.6, -r * 0.6);
      ctx.lineTo(-r * 0.3, 0);
      ctx.lineTo(-r * 0.6, r * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Outer Warp Nacelles
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#003366';
      ctx.strokeStyle = neonSkin ? neonSkin.secondaryNeon : '#00f3ff';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(-r * 0.7, -r * 1.2, r * 1.4, 4);
      ctx.strokeRect(-r * 0.7, r * 1.2 - 4, r * 1.4, 4);

      // Celestial energy halo ring
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : 'rgba(0, 243, 255, 0.7)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.activeCraft === 'astral_valkyrie') {
      // Diamond Celestial Flagship: tri-blade diamond interceptor
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#0b1838';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#38bdf8';
      ctx.lineWidth = neonSkin ? 3 : 2.5;

      ctx.beginPath();
      ctx.moveTo(r * 1.65, 0);
      ctx.lineTo(r * 0.15, -r * 0.55);
      ctx.lineTo(-r * 0.45, -r * 1.3);
      ctx.lineTo(-r * 0.85, -r * 0.35);
      ctx.lineTo(-r * 0.4, 0);
      ctx.lineTo(-r * 0.85, r * 0.35);
      ctx.lineTo(-r * 0.45, r * 1.3);
      ctx.lineTo(r * 0.15, r * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = neonSkin ? neonSkin.secondaryNeon : '#c084fc';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(r * 1.1, 0);
      ctx.lineTo(-r * 0.35, -r * 0.95);
      ctx.moveTo(r * 1.1, 0);
      ctx.lineTo(-r * 0.35, r * 0.95);
      ctx.stroke();
    } else if (this.activeCraft === 'cyber_falcon') {
      // Swift twin-fin interceptor
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#061f22';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#2dd4bf';
      ctx.lineWidth = neonSkin ? 3 : 2.3;
      ctx.beginPath();
      ctx.moveTo(r * 1.55, 0);
      ctx.lineTo(r * 0.1, -r * 0.55);
      ctx.lineTo(-r * 0.95, -r * 1.15);
      ctx.lineTo(-r * 0.45, -r * 0.3);
      ctx.lineTo(-r * 0.65, 0);
      ctx.lineTo(-r * 0.45, r * 0.3);
      ctx.lineTo(-r * 0.95, r * 1.15);
      ctx.lineTo(r * 0.1, r * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = neonSkin ? neonSkin.secondaryNeon : '#38bdf8';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(r * 0.9, 0);
      ctx.lineTo(-r * 0.6, -r * 0.7);
      ctx.moveTo(r * 0.9, 0);
      ctx.lineTo(-r * 0.6, r * 0.7);
      ctx.stroke();
    } else if (this.activeCraft === 'nebula_harbinger') {
      // Crescent Void Cruiser with magnetic crescent wings
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#180b28';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#c084fc';
      ctx.lineWidth = neonSkin ? 3 : 2.6;
      ctx.beginPath();
      ctx.moveTo(r * 1.45, 0);
      ctx.quadraticCurveTo(r * 0.4, -r * 1.5, -r * 0.85, -r * 1.25);
      ctx.lineTo(-r * 0.35, -r * 0.45);
      ctx.lineTo(-r * 0.85, 0);
      ctx.lineTo(-r * 0.35, r * 0.45);
      ctx.lineTo(-r * 0.85, r * 1.25);
      ctx.quadraticCurveTo(r * 0.4, r * 1.5, r * 1.45, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = neonSkin ? neonSkin.secondaryNeon : '#f472b6';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.52, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.activeCraft === 'zenith_emperor') {
      // Sovereign Diamond Battleship with imperial crown wings & gold core
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#1f1606';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(r * 1.7, 0);
      ctx.lineTo(r * 0.55, -r * 0.45);
      ctx.lineTo(r * 0.1, -r * 1.38);
      ctx.lineTo(-r * 0.75, -r * 1.15);
      ctx.lineTo(-r * 0.55, -r * 0.38);
      ctx.lineTo(-r * 0.9, 0);
      ctx.lineTo(-r * 0.55, r * 0.38);
      ctx.lineTo(-r * 0.75, r * 1.15);
      ctx.lineTo(r * 0.1, r * 1.38);
      ctx.lineTo(r * 0.55, r * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = neonSkin ? neonSkin.secondaryNeon : '#f43f5e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(r * 1.2, 0);
      ctx.lineTo(-r * 0.4, -r * 0.9);
      ctx.moveTo(r * 1.2, 0);
      ctx.lineTo(-r * 0.4, r * 0.9);
      ctx.stroke();
    } else if (this.activeCraft === 'tempest_raptor') {
      // Forward-swept Storm Interceptor
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#071c26';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#38bdf8';
      ctx.lineWidth = neonSkin ? 3 : 2.4;
      ctx.beginPath();
      ctx.moveTo(r * 1.65, 0);
      ctx.lineTo(r * 0.4, -r * 0.45);
      ctx.lineTo(r * 0.75, -r * 1.15);
      ctx.lineTo(-r * 0.5, -r * 0.85);
      ctx.lineTo(-r * 0.75, 0);
      ctx.lineTo(-r * 0.5, r * 0.85);
      ctx.lineTo(r * 0.75, r * 1.15);
      ctx.lineTo(r * 0.4, r * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = neonSkin ? neonSkin.secondaryNeon : '#fde047';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(r * 1.1, 0);
      ctx.lineTo(-r * 0.35, -r * 0.65);
      ctx.moveTo(r * 1.1, 0);
      ctx.lineTo(-r * 0.35, r * 0.65);
      ctx.stroke();
    } else if (this.activeCraft === 'seraph_nova') {
      // Quad-Vane Celestial Starfighter
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#220b24';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#f472b6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(r * 1.75, 0);
      ctx.lineTo(r * 0.5, -r * 0.55);
      ctx.lineTo(-r * 0.1, -r * 1.45);
      ctx.lineTo(-r * 0.85, -r * 1.05);
      ctx.lineTo(-r * 0.5, -r * 0.35);
      ctx.lineTo(-r * 0.95, 0);
      ctx.lineTo(-r * 0.5, r * 0.35);
      ctx.lineTo(-r * 0.85, r * 1.05);
      ctx.lineTo(-r * 0.1, r * 1.45);
      ctx.lineTo(r * 0.5, r * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = neonSkin ? neonSkin.secondaryNeon : '#fbbf24';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.activeCraft === 'mirage_viper') {
      // Twin-lance desert mirage interceptor
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#1f1407';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#f59e0b';
      ctx.lineWidth = neonSkin ? 3 : 2.4;
      ctx.beginPath();
      ctx.moveTo(r * 1.7, 0);
      ctx.lineTo(r * 0.4, -r * 0.38);
      ctx.lineTo(r * 0.85, -r * 0.92);
      ctx.lineTo(-r * 0.9, -r * 1.05);
      ctx.lineTo(-r * 0.45, -r * 0.25);
      ctx.lineTo(-r * 0.7, 0);
      ctx.lineTo(-r * 0.45, r * 0.25);
      ctx.lineTo(-r * 0.9, r * 1.05);
      ctx.lineTo(r * 0.85, r * 0.92);
      ctx.lineTo(r * 0.4, r * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.activeCraft === 'colossus_bastion') {
      // Heavy armored hexagonal bastion cruiser
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#091829';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#38bdf8';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(r * 1.35, -r * 0.45);
      ctx.lineTo(r * 1.35, r * 0.45);
      ctx.lineTo(r * 0.45, r * 1.3);
      ctx.lineTo(-r * 0.85, r * 1.2);
      ctx.lineTo(-r * 1.05, 0);
      ctx.lineTo(-r * 0.85, -r * 1.2);
      ctx.lineTo(r * 0.45, -r * 1.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = neonSkin ? neonSkin.secondaryNeon : '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(-r * 0.55, -r * 0.8, r * 0.35, r * 1.6);
    } else if (this.activeCraft === 'frost_valkyrie') {
      // Crystalline glacial overclock raider
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#081f29';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#67e8f9';
      ctx.lineWidth = neonSkin ? 3 : 2.5;
      ctx.beginPath();
      ctx.moveTo(r * 1.6, 0);
      ctx.lineTo(r * 0.35, -r * 0.48);
      ctx.lineTo(-r * 0.25, -r * 1.35);
      ctx.lineTo(-r * 0.9, -r * 0.65);
      ctx.lineTo(-r * 0.45, 0);
      ctx.lineTo(-r * 0.9, r * 0.65);
      ctx.lineTo(-r * 0.25, r * 1.35);
      ctx.lineTo(r * 0.35, r * 0.48);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.activeCraft === 'eclipse_phantom') {
      // Stealth orchid delta apex fighter
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#1d0924';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#e879f9';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(r * 1.72, 0);
      ctx.lineTo(-r * 0.15, -r * 1.35);
      ctx.lineTo(-r * 0.95, -r * 0.9);
      ctx.lineTo(-r * 0.38, -r * 0.28);
      ctx.lineTo(-r * 0.78, 0);
      ctx.lineTo(-r * 0.38, r * 0.28);
      ctx.lineTo(-r * 0.95, r * 0.9);
      ctx.lineTo(-r * 0.15, r * 1.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = neonSkin ? neonSkin.secondaryNeon : '#facc15';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.46, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.activeCraft === 'kronos_sovereign') {
      // Mythic Solar-Gold Vault Warship with chrono-ring & twin crown spears
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#1c1505';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#fde047';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(r * 1.8, 0);
      ctx.lineTo(r * 0.55, -r * 0.5);
      ctx.lineTo(r * 0.15, -r * 1.48);
      ctx.lineTo(-r * 0.85, -r * 1.2);
      ctx.lineTo(-r * 0.52, -r * 0.35);
      ctx.lineTo(-r * 1.0, 0);
      ctx.lineTo(-r * 0.52, r * 0.35);
      ctx.lineTo(-r * 0.85, r * 1.2);
      ctx.lineTo(r * 0.15, r * 1.48);
      ctx.lineTo(r * 0.55, r * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = neonSkin ? neonSkin.secondaryNeon : '#22d3ee';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Vanguard Alpha (Default sleek delta fighter)
      ctx.fillStyle = neonSkin ? neonSkin.hullFill : '#0b1626';
      ctx.strokeStyle = neonSkin ? neonSkin.primaryNeon : '#00f3ff';
      ctx.lineWidth = neonSkin ? 3 : 2;

      ctx.beginPath();
      ctx.moveTo(r * 1.4, 0); // nose
      ctx.lineTo(-r * 0.9, -r * 0.9); // left wing
      ctx.lineTo(-r * 0.4, 0); // rear indent
      ctx.lineTo(-r * 0.9, r * 0.9); // right wing
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (neonSkin) {
        // Dual neon wing stripes & nose vector highlight
        ctx.strokeStyle = neonSkin.secondaryNeon;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(r * 0.85, 0);
        ctx.lineTo(-r * 0.65, -r * 0.58);
        ctx.moveTo(r * 0.85, 0);
        ctx.lineTo(-r * 0.65, r * 0.58);
        ctx.stroke();
      }
    }

    // Weapon Turret Barrel
    const activeWep = WEAPONS[this.stats.activeWeapon];
    ctx.fillStyle = neonSkin ? neonSkin.secondaryNeon : activeWep.color;
    ctx.fillRect(r * 0.6, -2, 14, 4);

    // Cockpit / Core Glow
    ctx.fillStyle = neonSkin ? neonSkin.primaryNeon : craft.primaryColor || '#ffffff';
    ctx.beginPath();
    ctx.arc(2, 0, neonSkin ? 4.8 : 4, 0, Math.PI * 2);
    ctx.fill();

    // Engine Thrusters
    const thrusterFlicker = (neonSkin ? 13 : 10) + Math.random() * 8;
    ctx.fillStyle = neonSkin ? neonSkin.thrusterNeon : craft.engineColor || '#ff7700';
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -4);
    ctx.lineTo(-r * 0.6 - thrusterFlicker, 0);
    ctx.lineTo(-r * 0.6, 4);
    ctx.closePath();
    ctx.fill();

      ctx.restore();
    }

    if (this.isDuelMode) {
      const localSlot = this.duelConfig?.localSlot || 'p1';
      for (const slot of this.getActiveDuelSlots()) {
        const score = this.getDuelScoreRef(slot);
        const actor = this.getDuelActorRef(slot);
        if (!score || !actor) continue;
        if (this.duelConfig?.mode === 'online' && !score.connected) continue;
        const teamBadge =
          this.duelMatchFormat === 'pvp_team' && score.team
            ? score.team === 'alpha'
              ? '[ALPHA] '
              : '[OMEGA] '
            : '';
        const isLocalPilot = !this.duelConfig?.isSpectator && this.duelConfig?.mode === 'online' && slot === localSlot;
        const selfSuffix = isLocalPilot ? ' ★' : '';
        const tagColor = score.color || (slot === 'p1' ? '#00f3ff' : '#ff0077');

        if (slot === primarySlot && !isSpectatorView) {
          if (score.respawnTimer <= 0) {
            this.renderDuelPlayerTag(actor.x, actor.y - actor.radius - 20, `${teamBadge}${score.name}${selfSuffix}`, tagColor);
          }
          continue;
        }

        if (score.respawnTimer <= 0) {
          this.renderDuelRemoteShip(actor, score);
          this.renderDuelPlayerTag(actor.x, actor.y - actor.radius - 20, `${teamBadge}${score.name}${selfSuffix}`, tagColor);
        } else {
          ctx.save();
          ctx.strokeStyle = tagColor;
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(actor.x, actor.y, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  private renderDuelPlayerTag(x: number, y: number, name: string, color: string) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.lineWidth = 3;
    ctx.strokeText(name, x, y);
    ctx.fillStyle = color;
    ctx.fillText(name, x, y);
    ctx.restore();
  }

  private renderDuelRemoteShip(
    actor: {
      x: number;
      y: number;
      radius: number;
      angle: number;
      scaleX: number;
      scaleY: number;
      invulnerableTimer: number;
    },
    scoreState: DuelPlayerScore
  ) {
    const ctx = this.ctx;
    const r = actor.radius;
    const shipColor = scoreState.color || '#ff0077';
    ctx.save();
    ctx.translate(actor.x, actor.y);
    ctx.rotate(actor.angle);
    ctx.scale(actor.scaleX, actor.scaleY);

    const nowMs = this.frameNowMs || performance.now();
    if (actor.invulnerableTimer > 0 && Math.floor(nowMs / 80) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    if (scoreState.momentumTimer > 0) {
      const pulse = 0.5 + 0.5 * Math.sin(nowMs * 0.015);
      ctx.strokeStyle = shipColor;
      ctx.globalAlpha = 0.45 + pulse * 0.4;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r + 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (scoreState.shield > 0) {
      const shieldRatio = scoreState.shield / Math.max(1, scoreState.maxShield);
      ctx.strokeStyle = shipColor;
      ctx.globalAlpha = 0.35 + shieldRatio * 0.45;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = '#0e1320';
    ctx.strokeStyle = shipColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(r * 1.45, 0);
    ctx.lineTo(-r * 0.85, -r * 0.95);
    ctx.lineTo(-r * 0.35, 0);
    ctx.lineTo(-r * 0.85, r * 0.95);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = shipColor;
    ctx.fillRect(r * 0.6, -2, 14, 4);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    const thrusterFlicker = 10 + Math.random() * 8;
    ctx.fillStyle = shipColor;
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -4);
    ctx.lineTo(-r * 0.55 - thrusterFlicker, 0);
    ctx.lineTo(-r * 0.55, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private renderProjectiles() {
    const ctx = this.ctx;
    const bounds = this.currentViewBounds;
    const showTrails = this.adaptiveQuality.drawProjectileTrails && this.projectiles.length <= 50;

    for (let i = 0; i < this.projectiles.length; i++) {
      const p = this.projectiles[i];
      if (!isInViewportBounds(p.x, p.y, p.radius + 90, bounds)) continue;
      // Trail (skipped automatically under heavy projectile density or performance mode)
      if (showTrails && p.trail.length > 1) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.radius * 0.7;
        ctx.beginPath();
        for (let t = 0; t < p.trail.length; t++) {
          const pt = p.trail[t];
          if (t === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Custom silhouette for Crescent Plasma Scythes, Ricochet Sawblades, Cryo Shards & Apex Rails
      if (p.weaponType === 'plasma_scythe' || p.weaponType === 'crimson_reaper') {
        const ang = Math.atan2(p.vy, p.vx);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(ang);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(-4, 0, p.radius * 1.5, -Math.PI * 0.46, Math.PI * 0.46);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-4, 0, p.radius * 1.35, -Math.PI * 0.32, Math.PI * 0.32);
        ctx.stroke();
        ctx.restore();
      } else if (p.weaponType === 'ricochet_disc') {
        const spin = ((this.frameNowMs || performance.now()) * 0.018 + p.id) % (Math.PI * 2);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(spin);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 1.15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        for (let b = 0; b < 4; b++) {
          const a = (b * Math.PI) / 2;
          ctx.moveTo(Math.cos(a) * p.radius * 0.4, Math.sin(a) * p.radius * 0.4);
          ctx.lineTo(Math.cos(a) * p.radius * 1.45, Math.sin(a) * p.radius * 1.45);
        }
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.weaponType === 'cryo_shatter' || p.weaponType === 'astral_horizon') {
        const ang = Math.atan2(p.vy, p.vx);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(ang);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(p.radius * 1.85, 0);
        ctx.lineTo(-p.radius * 0.85, -p.radius * 0.72);
        ctx.lineTo(-p.radius * 0.3, 0);
        ctx.lineTo(-p.radius * 0.85, p.radius * 0.72);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.radius * 0.25, 0, p.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.weaponType === 'genesis_nova') {
        const pulseSpin = ((this.frameNowMs || performance.now()) * 0.008 + p.id) % (Math.PI * 2);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(pulseSpin);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 1.2, 0, Math.PI * 1.4);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Projectile head
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright white core (fast inner square on high projectile counts or tiny bullets)
        if (this.adaptiveQuality.drawSecondaryGlows || p.radius >= 8) {
          ctx.fillStyle = '#ffffff';
          const cr = p.radius * 0.45;
          ctx.fillRect(p.x - cr, p.y - cr, cr * 2, cr * 2);
        }
      }
    }
  }

  private renderParticles() {
    const ctx = this.ctx;
    const bounds = this.currentViewBounds;
    const poolCap = Math.min(MAX_PARTICLES, this.adaptiveQuality.maxParticlesCap);

    for (let i = 0; i < poolCap; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      if (!isInViewportBounds(p.x, p.y, p.size + 4, bounds)) continue;

      ctx.globalAlpha = p.alpha;

      if (p.type === 'spark') {
        // Fast hardware-accelerated rect spark (5-8x faster than per-particle arc)
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      } else if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'dash_ghost') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  private renderFinisherShockwaves() {
    if (this.finisherShockwaves.length === 0) return;
    const ctx = this.ctx;

    for (const sw of this.finisherShockwaves) {
      const progress = Math.max(0, Math.min(1, 1 - sw.life / sw.maxLife));
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const radius = Math.max(16, sw.maxRadius * easeOut);
      const alpha = Math.max(0, 1 - progress);

      ctx.save();

      // Fast translucent plasma rings (avoids per-frame radial gradient allocation)
      ctx.globalAlpha = alpha * 0.18;
      ctx.fillStyle = sw.color;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Primary outer shockwave ring
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = Math.max(2, 10 * (1 - progress));
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary inner gold resonance ring
      ctx.globalAlpha = alpha * 0.9;
      ctx.strokeStyle = sw.secondaryColor;
      ctx.lineWidth = Math.max(1.5, 5 * (1 - progress));
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, radius * 0.72, 0, Math.PI * 2);
      ctx.stroke();

      // 12 radial overload energy rays
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = alpha * 0.7;
      ctx.beginPath();
      const innerR = radius * 0.32;
      const outerR = radius * 0.95;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + progress * 0.5;
        ctx.moveTo(sw.x + Math.cos(a) * innerR, sw.y + Math.sin(a) * innerR);
        ctx.lineTo(sw.x + Math.cos(a) * outerR, sw.y + Math.sin(a) * outerR);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderFloatingTexts() {
    if (this.floatingTexts.length === 0) return;
    const ctx = this.ctx;
    const bounds = this.currentViewBounds;
    const skipStroke = this.adaptiveQuality.tier === 'performance';
    let lastFont = '';
    ctx.save();
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';

    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (!isInViewportBounds(ft.x, ft.y, 120, bounds)) continue;
      const alpha = Math.max(0, Math.min(1, ft.alpha));
      ctx.globalAlpha = alpha;

      if (ft.isDamageText) {
        const style = getDamageColor(ft.damageCategory || 'plasma');
        const baseSize = ft.fontSize || 14;
        const currentScale = ft.scale || 1.0;
        const pixelSize = Math.max(10, Math.round(baseSize * currentScale));
        const nextFont = `900 ${pixelSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
        if (nextFont !== lastFont) {
          ctx.font = nextFont;
          ctx.textBaseline = 'middle';
          lastFont = nextFont;
        }

        if (!skipStroke) {
          // Crisp dark contrasting stroke (zero shadowBlur so mobile/laptop GPUs maintain 60fps)
          ctx.strokeStyle = style.stroke || 'rgba(0, 0, 0, 0.88)';
          ctx.lineWidth = ft.isCrit ? 4.5 : 3.5;
          ctx.strokeText(ft.text, ft.x, ft.y);
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
          ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
        }

        // Vibrant neon damage type fill
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      } else {
        const nextFont = 'bold 14px ui-monospace, SFMono-Regular, Menlo, monospace';
        if (nextFont !== lastFont) {
          ctx.font = nextFont;
          ctx.textBaseline = 'alphabetic';
          lastFont = nextFont;
        }
        if (!skipStroke) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.78)';
          ctx.lineWidth = 3;
          ctx.strokeText(ft.text, ft.x, ft.y);
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
          ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
        }
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
    }

    ctx.restore();
  }

  private renderScreenVignette(w: number, h: number) {
    const ctx = this.ctx;

    // Critical low health red pulse
    if (this.state === 'playing' && this.stats.currentHp <= 1) {
      const pulse = (Math.sin((this.frameNowMs || performance.now()) * 0.008) + 1) * 0.5;
      ctx.strokeStyle = `rgba(255, 0, 50, ${0.25 + pulse * 0.35})`;
      ctx.lineWidth = 18;
      ctx.strokeRect(0, 0, w, h);
    }
  }

  private renderGoldenCores() {
    if (this.goldenCores.length === 0 || this.isDuelMode) return;
    const ctx = this.ctx;
    const nowSec = (this.frameNowMs || performance.now()) * 0.004;

    for (let i = 0; i < this.goldenCores.length; i++) {
      const core = this.goldenCores[i];
      if (!isInViewportBounds(core.x, core.y, core.radius + 45, this.currentViewBounds)) continue;
      const hpRatio = Math.max(0, Math.min(1, core.hp / Math.max(1, core.maxHp)));
      const lifeRatio = Math.max(0, Math.min(1, core.life / Math.max(1, core.maxLife)));

      ctx.save();
      ctx.translate(core.x, core.y);

      // Outer golden countdown ring
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, core.radius + 11, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, core.radius + 11, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifeRatio);
      ctx.stroke();

      // Rotating holographic diamond octahedron
      ctx.save();
      ctx.rotate(nowSec + core.phase);
      ctx.fillStyle = '#422006';
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 2.5;
      const r = core.radius;
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.85, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.85, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // HP bar & tag
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-20, core.radius + 16, 40, 5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-20, core.radius + 16, 40 * hpRatio, 5);

      ctx.font = 'bold 10px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.fillText('💎 GOLDEN CORE', 0, -core.radius - 16);
      ctx.restore();
    }
  }

  private renderStoreCompanionDrone() {
    if (this.isDuelMode || !this.storeGear.activeCompanion) return;
    const compDef = COMPANION_DRONES[this.storeGear.activeCompanion];
    if (!compDef) return;

    const ctx = this.ctx;
    const nowSec = (this.frameNowMs || performance.now()) * 0.001;
    const orbitAngle = nowSec * 2.1 + Math.PI;
    const x = this.player.x + Math.cos(orbitAngle) * 58;
    const y = this.player.y + Math.sin(orbitAngle) * 58;
    const target = selectWingmanTarget(x, y, this.enemies, 620);
    const aimAngle = target ? target.angle : this.player.angle;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(aimAngle);

    ctx.fillStyle = `${compDef.color}28`;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0a1220';
    ctx.strokeStyle = compDef.color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(0, -9);
    ctx.lineTo(-10, -5);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 5);
    ctx.lineTo(0, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = compDef.secondaryColor;
    ctx.beginPath();
    ctx.arc(2, 0, 3.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderWingmanDrones() {
    if (this.isDuelMode) return;
    const mods = this.cachedAugMods;
    if (mods.wingmanCount <= 0) return;

    const ctx = this.ctx;
    const nowSec = (this.frameNowMs || performance.now()) * 0.001;
    for (let i = 0; i < mods.wingmanCount; i++) {
      const orbit = computeWingmanOrbitPosition(
        this.player.x,
        this.player.y,
        i,
        mods.wingmanCount,
        nowSec
      );
      const target = selectWingmanTarget(orbit.x, orbit.y, this.enemies, 580);
      const aimAngle = target ? target.angle : this.player.angle;

      ctx.save();
      ctx.translate(orbit.x, orbit.y);
      ctx.rotate(aimAngle);

      // Cyan orbital thruster aura
      ctx.fillStyle = 'rgba(0, 243, 255, 0.16)';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Sleek Wingman triangular drone chassis
      ctx.fillStyle = '#09182c';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(-7, -8);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-7, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Core lens
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(2, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private renderElectricArcs() {
    if (this.electricArcs.length === 0) return;
    const ctx = this.ctx;
    ctx.save();
    for (let i = 0; i < this.electricArcs.length; i++) {
      const arc = this.electricArcs[i];
      if (arc.points.length < 2) continue;
      const alpha = Math.max(0, Math.min(1, arc.life / Math.max(0.01, arc.maxLife)));
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = arc.color;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(arc.points[0].x, arc.points[0].y);
      for (let p = 1; p < arc.points.length; p++) {
        ctx.lineTo(arc.points[p].x, arc.points[p].y);
      }
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
    ctx.restore();
  }

  private replenishArenaBarrels(targetCount: number = 3) {
    if (this.isDuelMode) return;
    const safeTarget = Math.max(0, Math.min(8, Math.floor(Number.isFinite(targetCount) ? targetCount : 3)));
    let guard = 0;
    while (this.arenaBarrels.length < safeTarget && guard < 8) {
      guard++;
      const type = this.arenaBarrels.length % 2 === 0 ? 'plasma' : 'cryo';
      const barrel = createArenaBarrel(
        this.nextId++,
        type,
        ARENA_WIDTH,
        ARENA_HEIGHT,
        this.player.x,
        this.player.y,
        this.currentWave
      );
      this.arenaBarrels.push(barrel);
    }
  }

  private detonateArenaBarrel(barrel: ArenaBarrel) {
    // Plan the entire chain detonation iteratively BEFORE splicing so nested splices can never corrupt indices or leave undefined entries
    const detonations = collectChainDetonatedBarrels(
      barrel,
      this.arenaBarrels,
      (b) => computeBarrelExplosionOutcome(b, this.currentWave).radius
    );
    const detonatedIds = new Set<number>(detonations.map((b) => b.id));
    this.arenaBarrels = this.arenaBarrels.filter((b) => !detonatedIds.has(b.id));

    const augMods = this.cachedAugMods;

    for (let bi = 0; bi < detonations.length; bi++) {
      const targetBarrel = detonations[bi];
      const outcome = computeBarrelExplosionOutcome(targetBarrel, this.currentWave);
      this.barrelsDetonated += 1;
      this.trackGlobalEvent('barrels_detonated', 1);

      soundEngine.playExplosion();
      this.addCameraTrauma(outcome.trauma);
      this.emitBurst(outcome.x, outcome.y, outcome.primaryColor, 20, 1.8);
      this.emitParticle(outcome.x, outcome.y, 0, 0, outcome.radius, outcome.primaryColor, 0.36, 'ring');
      this.finisherShockwaves.push({
        x: outcome.x,
        y: outcome.y,
        maxRadius: outcome.radius,
        life: 0.36,
        maxLife: 0.36,
        color: outcome.primaryColor,
        secondaryColor: outcome.secondaryColor,
      });
      this.spawnFloatingText(outcome.label, outcome.x, outcome.y - 38, outcome.primaryColor);

      const blastDmg = Math.round(outcome.damage * augMods.damageMult);

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (!e || e.state === 'ko') continue;
        const dist = Math.hypot(e.x - outcome.x, e.y - outcome.y);
        if (dist <= outcome.radius + e.radius) {
          e.hp -= blastDmg;
          if (outcome.cryoFreezeSeconds > 0) {
            e.cryoSlowTimer = Math.max(e.cryoSlowTimer || 0, outcome.cryoFreezeSeconds);
          }
          const pushAngle = Math.atan2(e.y - outcome.y, e.x - outcome.x);
          const pushForce = outcome.type === 'plasma' ? 320 : 180;
          e.vx += Math.cos(pushAngle) * pushForce;
          e.vy += Math.sin(pushAngle) * pushForce;
          this.spawnDamageText(
            blastDmg,
            e.x,
            e.y,
            outcome.type === 'cryo' ? 'kinetic' : 'explosive',
            true,
            1.0
          );
          if (e.hp <= 0) {
            this.killEnemy(e, 'p1');
          }
        }
      }
    }
  }

  private renderArenaBarrels() {
    if (this.arenaBarrels.length === 0 || this.isDuelMode) return;
    const ctx = this.ctx;
    const nowSec = (this.frameNowMs || performance.now()) * 0.004;

    for (let i = 0; i < this.arenaBarrels.length; i++) {
      const b = this.arenaBarrels[i];
      if (!isInViewportBounds(b.x, b.y, b.radius + 32, this.currentViewBounds)) continue;
      const isCryo = b.type === 'cryo';
      const primary = isCryo ? '#38bdf8' : '#ff5500';
      const secondary = isCryo ? '#cffafe' : '#fde047';
      const fill = isCryo ? '#082f49' : '#431407';
      const pulse = 0.5 + 0.5 * Math.sin(nowSec + b.pulsePhase);

      ctx.save();
      ctx.translate(b.x, b.y);

      // Tactical danger radius halo
      ctx.strokeStyle = isCryo
        ? `rgba(56, 189, 248, ${0.22 + pulse * 0.25})`
        : `rgba(255, 85, 0, ${0.24 + pulse * 0.28})`;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, b.radius + 9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Hexagonal pressurized canister silhouette
      ctx.fillStyle = fill;
      ctx.strokeStyle = primary;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const ang = (s * Math.PI) / 3 + Math.PI / 6;
        const px = Math.cos(ang) * b.radius;
        const py = Math.sin(ang) * b.radius;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner hazard diamond / core
      ctx.fillStyle = secondary;
      ctx.beginPath();
      ctx.arc(0, 0, 5.5 + pulse * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // HP bar if damaged
      if (b.hp < b.maxHp) {
        const ratio = Math.max(0, Math.min(1, b.hp / Math.max(1, b.maxHp)));
        ctx.fillStyle = '#090d16';
        ctx.fillRect(-16, b.radius + 6, 32, 4);
        ctx.fillStyle = primary;
        ctx.fillRect(-16, b.radius + 6, 32 * ratio, 4);
      }

      ctx.font = 'bold 9px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = secondary;
      ctx.fillText(isCryo ? '❄️ CRYO' : '💥 PLASMA', 0, -b.radius - 8);
      ctx.restore();
    }
  }
}

function eClamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
