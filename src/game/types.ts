export type GameState = 'title' | 'playing' | 'paused' | 'gameover' | 'victory' | 'duel_victory';

export type DifficultyMode = 'easy' | 'normal' | 'nightmare';

export interface DifficultyModifier {
  id: DifficultyMode;
  label: string;
  subtitle: string;
  spawnRateMultiplier: number; // >1 spawns faster, <1 spawns slower
  spawnDelayMultiplier: number; // <1 shorter delay between spawns
  damageMultiplier: number; // Scales enemy contact, projectile, and slam damage
  maxSimultaneousOffset: number; // Adjusts max active hostiles on arena
  budgetMultiplier: number; // Scales wave budget proportionally
  color: string;
}

export type WeaponType =
  | 'pulse'
  | 'scatter'
  | 'beam'
  | 'missile'
  | 'plasma_scythe'
  | 'leviathan'
  | 'vortex'
  | 'cryo_shatter'
  | 'inferno'
  | 'chrono_thunder'
  | 'supernova'
  | 'aegis_titan'
  | 'hyperion_astral'
  | 'omega_singularity'
  | 'prism_splitter'
  | 'void_rail'
  | 'celestial_eclipse';

export type WeaponTier = 'starter' | 'advanced' | 'monster' | 'heavy' | 'godtier';

export interface WeaponDef {
  id: WeaponType;
  name: string;
  role: string;
  tier: WeaponTier;
  keyLabel: string;
  damage: number;
  fireRate: number; // shots per sec
  spread: number; // radians
  pellets: number;
  speed: number;
  color: string;
  icon?: string;
  range: number;
  heatPerShot: number;
  pierce: number;
  price: number; // Price in Cyber Coins (0 for starter weapon)
  diamondCost?: number; // Optional price in Cyber Diamonds
  description: string;
  specialTrait: string;
  isHoming?: boolean;
  explosionRadius?: number;
  pullRadius?: number;
  cryoSlowDuration?: number;
}

// --- Flying Craft (Starship Chassis) System ---
export type CraftId =
  | 'vanguard_alpha'
  | 'cyber_falcon'
  | 'phantom_shadow'
  | 'titan_dread'
  | 'solar_phoenix'
  | 'nebula_harbinger'
  | 'aegis_celestial'
  | 'astral_valkyrie'
  | 'zenith_emperor'
  | 'tempest_raptor'
  | 'seraph_nova';

export type CraftTier = 'starter' | 'interceptor' | 'heavy' | 'solar' | 'godtier';

export interface CraftDef {
  id: CraftId;
  name: string;
  callsign: string;
  model: string;
  role: string;
  price: number; // in Cyber Coins (0 for starter)
  diamondCost?: number; // Optional price in Cyber Diamonds
  tier: CraftTier;
  hullColor: string;
  accentColor: string;
  glowColor: string;
  thrusterColor: string;
  primaryColor: string;
  engineColor: string;
  speedMultiplier: number;
  shieldBonus: number;
  damageMultiplier: number;
  fireRateMultiplier: number;
  dashCooldownMultiplier: number;
  magnetRadiusBonus: number;
  statModifiers: {
    speedBonus: number; // percentage, e.g. 0.25 = +25%
    maxShieldBonus: number; // flat shield increase, e.g. +100
    shieldRechargeBonus: number; // flat recharge per sec
    damageMultiplier: number; // e.g. 1.25 = +25%
    fireRateMultiplier: number; // e.g. 1.20 = +20%
    dashCooldownReduction: number; // seconds, e.g. 0.3
    magnetRadiusBonus: number; // pixels, e.g. +80px
  };
  description: string;
  perkDescription: string;
}

// --- Daily Missions System ---
export type MissionObjectiveType =
  | 'kills_total'
  | 'kill_total'
  | 'kills_swarmer'
  | 'kill_swarmers'
  | 'kills_tank'
  | 'kill_tank_phantom'
  | 'kills_sniper'
  | 'kills_phantom'
  | 'kills_boss'
  | 'destroy_boss'
  | 'score_reach'
  | 'collect_coins'
  | 'clear_sectors'
  | 'flawless_victory'
  | 'purchase_weapon';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  objectiveType: MissionObjectiveType;
  targetValue: number;
  currentValue: number;
  rewardCoins: number;
  rewardDiamonds?: number;
  isCompleted: boolean;
  isClaimed: boolean;
  icon: string;
  targetProgress?: number;
  currentProgress?: number;
  claimed?: boolean;
}

export interface DailyMissionsState {
  lastResetDay: string; // e.g. "2026-11-08"
  missions: DailyMission[];
}

export interface DailyStreakState {
  currentStreak: number;
  bestStreak: number;
  lastPlayedDay: string | null;
  lastClaimedDay: string | null;
  totalCheckIns: number;
}

export interface DailyStreakReward {
  day: number;
  coins: number;
  diamonds: number;
  label: string;
}

export interface SocialFollowState {
  visited: boolean;
  claimed: boolean;
  claimedAt?: number;
}

export type CelebrationVariant = 'mission' | 'streak' | 'diamond';

export interface CelebrationParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'coin' | 'diamond' | 'spark' | 'star';
  gravity: number;
}

export type MapRegionId =
  | 'dhaka'
  | 'rajshahi'
  | 'chattogram'
  | 'sylhet'
  | 'sundarbans'
  | 'cox_orbit'
  | 'kuakata_abyss'
  | 'bengal_singularity'
  | 'barishal_nebula'
  | 'rangpur_cryo'
  | 'khulna_reactor'
  | 'padma_eternity';

export interface UserProfile {
  id: string;
  name: string;
  callsign: string;
  tagline: string;
  avatarId: string;
  homeRegion: MapRegionId;
  themeColor: string;
  rankTitle: string;
  createdAt: number;
  totalBattles: number;
  totalPurges: number;
  highestLevel: number;
  bestScore: number;
  totalCoinsEarned: number;
  activeCraft?: CraftId;
  unlockedCrafts?: Record<CraftId, boolean>;
  unlockedRegions?: Record<string, boolean>;
}

// --- Medals / Achievements System ---
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementCategory = 'combat' | 'mastery' | 'progression' | 'elite';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  currentProgress: number;
  targetProgress: number;
  isUnlocked: boolean;
  unlockedAt?: number;
  rewardCoins: number;
}

export type AchievementEventType =
  | 'kill'
  | 'kills_total'
  | 'kill_swarmer'
  | 'kill_phantom'
  | 'kill_storm_drone'
  | 'kill_tank'
  | 'kill_behemoth'
  | 'kill_boss'
  | 'no_hit_clear'
  | 'combo_streak'
  | 'level_clear'
  | 'coins_collected'
  | 'craft_unlocked'
  | 'weapon_equipped';

export interface AchievementEvent {
  type: AchievementEventType;
  amount?: number;
  metadata?: Record<string, any>;
}

// --- Global High-Score Leaderboard System ---
export interface LeaderboardEntry {
  id: string;
  rank: number;
  callsign: string;
  commanderName: string;
  avatarBadge: string;
  region: MapRegionId;
  score: number;
  highestLevel: number;
  activeCraft: CraftId;
  isPlayer?: boolean;
  date: string;
}


export type EnemyType =
  | 'swarmer'
  | 'tank'
  | 'sniper'
  | 'goliath'
  | 'phantom'
  | 'behemoth'
  | 'storm_drone'
  | 'shield_breaker';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  color: string;
  angle: number;
  targetAngle: number;
  // AI telegraph state
  state: 'seek' | 'windup' | 'attack' | 'cooldown' | 'ko';
  telegraphTimer: number; // seconds
  telegraphDuration: number;
  cooldownTimer: number;
  koTimer: number; // for KO topple / dissolve arc
  contactDamage?: number;
  projectileDamage?: number;
  projectileSpeed?: number;
  slamDamage?: number;
  shieldAngle?: number; // for Tank & Behemoth front shield
  shieldArc?: number;
  kineticBarrierHp?: number; // for Shield-Breaker 360 kinetic barrier
  kineticBarrierMaxHp?: number;
  kineticBarrierDownTimer?: number;
  kineticBarrierMaxDownSec?: number;
  kineticBarrierFlash?: number;
  barrierHintCooldown?: number;
  sniperLaserAim?: { x: number; y: number };
  // Specific enemy mechanic timers
  specialCooldownTimer?: number;
  phaseAlpha?: number;
  isPhasing?: boolean;
  shockTimer?: number;
  cryoSlowTimer?: number;
  // Active trajectory evasion state
  isEvading?: boolean;
  evasionTimer?: number;
  evasionDirection?: number; // -1 (left) or 1 (right)
  spawnPattern?: string;
  duelSpawnId?: string;
  duelTargetSlot?: 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6';
  lastHitWeapon?: WeaponType;
  isBountyTarget?: boolean;
  bountyCodename?: string;
  bossTitle?: string;
}

export type SpawnPatternType =
  | 'perimeter_random'
  | 'corner_ambush'
  | 'circle_ring'
  | 'pincer_flank'
  | 'v_wedge'
  | 'portal_cluster'
  | 'quad_cross'
  | 'escort_convoy'
  | 'spiral_vortex'
  | 'perimeter'
  | 'pincer'
  | 'arrowhead'
  | 'surround'
  | 'enfilade'
  | 'escort'
  | 'quad_corner';

export interface PatternSpawnPoint {
  x: number;
  y: number;
  delaySec: number;
  archetype?: EnemyType;
  role?: string;
  patternName: SpawnPatternType;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  rangeRemaining: number;
  color: string;
  isEnemy: boolean;
  pierceRemaining: number;
  trail: { x: number; y: number }[];
  isHoming?: boolean;
  targetEnemyId?: number;
  explosionRadius?: number;
  pullRadius?: number;
  isShockOrb?: boolean;
  weaponType?: WeaponType;
  damageCategory?: DamageCategory;
  ownerSlot?: 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6';
  bouncesRemaining?: number;
  isWingmanBolt?: boolean;
  cryoSlowDuration?: number;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  life: number;
  maxLife: number;
  color: string;
  alpha: number;
  type: 'spark' | 'smoke' | 'ring' | 'dash_ghost' | 'debris' | 'shockwave';
}

export interface Pickup {
  id: number;
  type: 'scrap' | 'nanite_heal' | 'shield_boost' | 'overdrive' | 'coin';
  x: number;
  y: number;
  value: number;
  life: number;
  radius: number;
}

export type DamageCategory =
  | 'plasma'       // Pulse: Neon Cyan (#00f3ff)
  | 'scatter'      // Flak Scattergun: Kinetic Amber (#ffb400)
  | 'beam'         // Phase Lance: Piercing Neon Magenta (#ff0077)
  | 'explosive'    // Micro-Missiles / Hydra / AOE: Heavy Blast Orange (#ff6200)
  | 'kinetic'      // Leviathan Dreadnought: Heavy Ice Blue (#38bdf8)
  | 'void'         // Vortex Singularity: Gravitational Violet (#c084fc)
  | 'fire'         // Inferno Dragonfire: Blazing Crimson Red (#ff3300)
  | 'electric'     // Chrono Thunder: High-Voltage Lightning Yellow (#fde047)
  | 'cosmic'       // Supernova Sun Cannon: Solar Radiant White-Gold (#fef08a)
  | 'titan'        // Aegis Titan Beam: Cosmic Rail Crimson (#fb7185)
  | 'critical'     // Shield Shatter / Weakpoint Crit: Blinding Pure White-Gold (#ffffff)
  | 'resisted';    // Phasing Glitch / Armored Deflection: Glitch Violet-Grey (#a5b4fc)

export interface DamageStyle {
  text: string;
  glow: string;
  stroke: string;
  label?: string;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  life: number;
  maxLife?: number;
  vx?: number;
  vy?: number;
  scale?: number;
  isDamageText?: boolean;
  damageCategory?: DamageCategory;
  isCrit?: boolean;
  fontSize?: number;
}

export interface PlayerStats {
  maxHp: number;
  currentHp: number;
  maxShield: number;
  currentShield: number;
  shieldRechargeRate: number;
  shieldRechargeDelay: number;
  shieldCooldownTimer: number;
  speed: number;
  dashCooldown: number;
  dashCooldownTimer: number;
  dashDuration: number;
  dashTimer: number;
  scrap: number;
  coins: number;
  coinsEarnedThisRun: number;
  diamonds?: number;
  score: number;
  comboStreak: number;
  comboCount: number;
  comboMultiplier: number;
  comboTimer: number;
  comboWindowSeconds?: number;
  highestCombo: number;
  maxCombo: number;
  comboFinisherCharge?: number;
  comboFinisherReady?: boolean;
  kills: number;
  activeWeapon: WeaponType;
  unlockedWeapons: Record<WeaponType, boolean>;
  activeCraft: CraftId;
  activeCraftSkin?: CraftSkinId;
  unlockedCrafts: Record<CraftId, boolean>;
  level: number;
  levelKills: number;
  levelQuota: number;
  levelName: string;
  difficulty?: DifficultyMode;
  weaponHeat?: number;
  weaponOverheated?: boolean;
  weaponOverheatTimer?: number;
  weaponMasteryLevel?: number;
  weaponMasteryTitle?: string;
  weaponMasteryProgress?: number; // 0..100
  weaponMasteryXp?: number;
  weaponMasteryNextXp?: number | null;
  weaponMasteryHeatReduction?: number; // 0..0.5
  weaponMasteryCritChance?: number; // 0..0.5
  cyberStormActive?: boolean;
  cyberStormPhase?: CyberStormPhase;
  cyberStormTimeLeft?: number;
  cyberStormInWindZone?: boolean;
  cyberStormWindLabel?: string;
  cyberStormSpeedMult?: number;
  dashOvercharged?: boolean;
  dashOverchargeTimer?: number;
  dashOverchargeDuration?: number;
  dashRangeMultiplier?: number;
  activeAugments?: Partial<Record<CyberAugmentId, number>>;
  pendingAugmentChoices?: CyberAugmentChoice[] | null;
  augmentDraftReason?: 'level_clear' | 'wave_clear' | 'headstart' | null;
  augmentClearedLevel?: number | null;
  overdriveTimer?: number;
  overdriveDuration?: number;
  multiKillCount?: number;
  multiKillLabel?: string;
  multiKillTimer?: number;
  wingmanDroneCount?: number;
  goldenCoresDestroyed?: number;
  isEndless?: boolean;
  endlessBestWave?: number;
  isBossRush?: boolean;
  bossRushStage?: number;
  bossRushTotalStages?: number;
  bossRushBestStage?: number;
  bossRushBossName?: string;
  activeBounty?: ActiveBountyContract | null;
  radarEnabled?: boolean;
  activeBoosters?: PreRunBoosterId[];
  activeCompanion?: CompanionDroneId | null;
  activeTrail?: ThrusterTrailId;
  activeModules?: PermanentModuleId[];
  barrelsDetonated?: number;
  upgrades: {
    maxHealthLvl: number;
    shieldLvl: number;
    damageLvl: number;
    fireRateLvl: number;
    dashLvl: number;
  };
}

export type CyberAugmentId =
  | 'wingman_drone'
  | 'chain_arc'
  | 'vampiric_core'
  | 'ricochet_rounds'
  | 'cryo_aura'
  | 'overclock_vents'
  | 'magnet_greed';

export type CyberAugmentRarity = 'core' | 'elite' | 'apex';

export interface CyberAugmentDef {
  id: CyberAugmentId;
  name: string;
  shortTag: string;
  rarity: CyberAugmentRarity;
  maxStacks: number;
  color: string;
  description: string;
  statSummary: string;
  icon: string;
}

export interface CyberAugmentChoice {
  def: CyberAugmentDef;
  currentLevel: number;
  nextLevel: number;
  isOverclockSurge?: boolean;
}

export type CyberStormPhase = 'calm' | 'warning' | 'storm';

export interface WeaponThermalState {
  heat: number; // 0..100
  isOverheated: boolean;
  overheatTimer: number; // seconds left before weapon unlocks
  coolDelayTimer: number; // brief grace pause right after firing before cooling starts
}

export interface WindZone {
  id: number;
  x: number;
  y: number;
  radius: number;
  dirAngle: number;
  strength: number; // 0.14 .. 0.22
  label: string;
  color: string;
}

export interface LightningBolt {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  points: Array<{ x: number; y: number }>;
  color: string;
  life: number;
  maxLife: number;
}

export interface RunSnapshot {
  score: number;
  bestScore: number;
  level: number;
  levelName: string;
  wave: number;
  kills: number;
  highestCombo: number;
  timeSurvivedSeconds: number;
  scrapCollected: number;
  coinsEarned: number;
  totalCoins: number;
  diamonds?: number;
  revivesUsed?: number;
  reviveCost?: number;
  revivesRemaining?: number;
  maxRevives?: number;
  activeCraft: CraftId;
  difficulty?: DifficultyMode;
  isEndless?: boolean;
  endlessBestWave?: number;
  isBossRush?: boolean;
  bossRushStage?: number;
  bossRushTotalStages?: number;
  bossRushBestStage?: number;
  bossRushVictory?: boolean;
}

// --- Exclusive Neon Craft Skins & 48h Global Limited-Time Events ---
export type CraftSkinId = 'default' | 'neon';

export interface NeonCraftSkinDef {
  craftId: CraftId;
  skinId: 'neon';
  name: string;
  tagline: string;
  hullFill: string;
  primaryNeon: string;
  secondaryNeon: string;
  thrusterNeon: string;
  shieldNeon: string;
  trailColor: string;
}

export type GlobalEventObjectiveType =
  | 'kills_total'
  | 'kills_swarmer'
  | 'kills_sniper'
  | 'kills_tank'
  | 'kills_phantom'
  | 'kills_boss'
  | 'collect_coins'
  | 'clear_sectors'
  | 'golden_cores'
  | 'augments_installed'
  | 'combo_streak'
  | 'barrels_detonated'
  | 'dash_overcharges';

export interface GlobalEventObjective {
  id: string;
  title: string;
  description: string;
  objectiveType: GlobalEventObjectiveType;
  targetValue: number;
  currentValue: number;
  rewardCoins: number;
  rewardDiamonds: number;
  isCompleted: boolean;
  isClaimed: boolean;
  icon: string;
}

export interface GlobalEventDef {
  id: string;
  title: string;
  subtitle: string;
  badgeIcon: string;
  accentColor: string;
  secondaryColor: string;
  rewardCraftId: CraftId;
  objectives: Array<Omit<GlobalEventObjective, 'currentValue' | 'isCompleted' | 'isClaimed'>>;
}

export interface GlobalEventState {
  cycleIndex: number;
  eventId: string;
  objectives: GlobalEventObjective[];
  skinClaimed: boolean;
  unlockedNeonSkins: Partial<Record<CraftId, boolean>>;
  equippedSkins: Partial<Record<CraftId, CraftSkinId>>;
  bonusChallenges?: GlobalEventObjective[];
}

export interface GlobalEventWindowInfo {
  cycleIndex: number;
  cycleStartMs: number;
  cycleEndMs: number;
  remainingMs: number;
  durationMs: number;
  formattedCountdown: string;
  eventDef: GlobalEventDef;
}

// --- Interactive Tactical Arena Barrels ---
export type ArenaBarrelType = 'plasma' | 'cryo';

export interface ArenaBarrel {
  id: number;
  type: ArenaBarrelType;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  pulsePhase: number;
  waveCreated: number;
}

// --- Endless Overdrive Survival Mode ---
export interface EndlessWaveConfig {
  wave: number;
  effectiveLevel: number;
  totalBudget: number;
  maxSimultaneous: number;
  spawnDelaySec: number;
  isBossWave: boolean;
  bossCount: number;
}

export interface EndlessRecord {
  bestWave: number;
  bestScore: number;
  totalRuns: number;
  totalBossesPurged: number;
}

// --- Cyber Supply Crates & Pre-Run Tactical Boosters ---
export type PreRunBoosterId =
  | 'shield_overcharge'
  | 'weapon_overclock'
  | 'coin_rush'
  | 'headstart_augment'
  | 'finisher_charged'
  | 'bounty_radar_vip';

export interface PreRunBoosterDef {
  id: PreRunBoosterId;
  name: string;
  shortLabel: string;
  description: string;
  color: string;
  icon: string;
}

export type SupplyCrateTier = 'daily_free' | 'standard' | 'apex';
export type SupplyCrateRarity = 'common' | 'rare' | 'epic' | 'apex';

export interface SupplyCrateReward {
  id: string;
  rarity: SupplyCrateRarity;
  title: string;
  subtitle: string;
  icon: string;
  coinsAwarded: number;
  diamondsAwarded: number;
  masteryXpAwarded: number;
  boosterGranted?: PreRunBoosterId;
}

export interface SupplyCrateState {
  lastDailyResetDay: string;
  freeKeys: number;
  totalOpened: number;
  armedBoosters: PreRunBoosterId[];
  lastReward: SupplyCrateReward | null;
}

// --- Boss Rush Championship & HVT Bounty Contracts ---
export interface BossRushStageDef {
  stage: number;
  name: string;
  regionLabel: string;
  arenaLevel: number;
  hpMultiplier: number;
  speedMultiplier: number;
  color: string;
  escortCount: number;
  coinReward: number;
  diamondReward: number;
}

export interface BossRushRecord {
  bestStage: number;
  clears: number;
  fastestClearSeconds: number | null;
  totalBossesDefeated: number;
}

export interface ActiveBountyContract {
  enemyId: number;
  codename: string;
  timeRemaining: number;
  duration: number;
  rewardCoins: number;
  rewardDiamonds: number;
}

// --- Expanded Cyber Store: Companions, Thruster Trails, Permanent Modules & Bundles ---
export type CompanionDroneId =
  | 'scout_spark'
  | 'aegis_orbiter'
  | 'coin_collector_bot'
  | 'volt_arc_bot'
  | 'cryo_sentinel'
  | 'nova_harvester'
  | 'inferno_wyrm'
  | 'archon_seraph'
  | 'void_reaper_drone';

export interface CompanionDroneDef {
  id: CompanionDroneId;
  name: string;
  role: string;
  tier: 'standard' | 'tactical' | 'apex';
  price: number;
  diamondCost?: number;
  color: string;
  secondaryColor: string;
  icon: string;
  fireIntervalSec: number;
  boltDamage: number;
  pierce: number;
  explosionRadius?: number;
  cryoSlowSec?: number;
  shieldPerCycle?: number;
  shieldCycleSec?: number;
  magnetBonusPx?: number;
  coinMultBonus?: number;
  description: string;
  perkSummary: string;
}

export type ThrusterTrailId =
  | 'trail_standard'
  | 'trail_cyber_rainbow'
  | 'trail_crimson_afterburn'
  | 'trail_solar_flare'
  | 'trail_emerald_matrix'
  | 'trail_arctic_aurora'
  | 'trail_void_lightning'
  | 'trail_celestial_gold'
  | 'trail_quantum_prism';

export interface ThrusterTrailDef {
  id: ThrusterTrailId;
  name: string;
  subtitle: string;
  price: number;
  diamondCost?: number;
  colors: string[];
  icon: string;
  speedBonus: number; // e.g. 0.05 = +5%
  coolingBonus: number; // e.g. 0.08 = +8% cooling
  magnetBonusPx: number;
  dashCdReduction: number; // e.g. 0.08 = -8%
  shieldRechargeBonus: number;
  perkSummary: string;
  description: string;
}

export type PermanentModuleId =
  | 'kinetic_plating'
  | 'magnet_overdrive'
  | 'thermal_vent'
  | 'vampiric_siphon'
  | 'crit_amplifier'
  | 'shield_capacitor';

export interface PermanentModuleDef {
  id: PermanentModuleId;
  name: string;
  category: string;
  price: number;
  diamondCost: number;
  color: string;
  icon: string;
  statLabel: string;
  description: string;
}

export interface StoreBundleDef {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  priceCoins?: number;
  priceDiamonds?: number;
  originalValueLabel: string;
  color: string;
  icon: string;
  unlockWeapons?: WeaponType[];
  unlockCompanions?: CompanionDroneId[];
  unlockTrails?: ThrusterTrailId[];
  unlockModules?: PermanentModuleId[];
  grantBoosters?: PreRunBoosterId[];
  grantCoins?: number;
  grantMasteryXp?: number;
  highlights: string[];
}

export interface StoreGearState {
  unlockedCompanions: Record<CompanionDroneId, boolean>;
  activeCompanion: CompanionDroneId | null;
  unlockedTrails: Record<ThrusterTrailId, boolean>;
  activeTrail: ThrusterTrailId;
  unlockedModules: Record<PermanentModuleId, boolean>;
  purchasedBundles: Record<string, boolean>;
}


