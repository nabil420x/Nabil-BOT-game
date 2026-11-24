import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkCircleCollision,
  checkShieldBlock,
  getComboMultiplier,
  calculateKillScore,
  calculateWaveBudget,
  calculateEnemyStats,
  selectEnemyArchetype,
  applyDamageToPlayer,
  purchaseUpgrade,
  getUpgradeCost,
  getWeaponPrice,
  getWeaponDiamondCost,
  isWeaponDiamondExclusive,
  purchaseWeapon,
  purchaseWeaponWithDiamonds,
  calculateLevelCoinBonus,
  calculateEnemyCoinDrop,
  getAvailableSpawnPatterns,
  selectSpawnPattern,
  generateSpawnPositions,
  calculateTrajectoryAvoidanceForce,
  calculateProjectileDodgeForce,
  getDamageColor,
  mapWeaponToDamageCategory,
  DAMAGE_STYLES,
  getDifficultyModifier,
  getRegionAtmosphereTheme,
  getLevelDifficultyParameters,
  COMBO_FINISHER_THRESHOLD,
  COMBO_FINISHER_RADIUS,
  COMBO_FINISHER_BASE_DAMAGE,
  COMBO_FINISHER_HITSTOP,
  advanceComboFinisherState,
  canActivateComboFinisher,
  computeComboFinisherExplosion,
  BASE_DASH_COOLDOWN_SECONDS,
  MIN_DASH_COOLDOWN_SECONDS,
  computeDashCooldown,
  computeDashGaugeState,
  DIAMOND_REVIVE_BASE_COST,
  MAX_DIAMOND_REVIVES_PER_RUN,
  getDiamondReviveCost,
  canPurchaseDiamondRevive,
  WEAPON_HEAT_MAX,
  WEAPON_OVERHEAT_COOLDOWN_SECONDS,
  createInitialWeaponThermalState,
  applyWeaponShotHeat,
  stepWeaponThermalState,
  CYBER_STORM_WARNING_SEC,
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
  MOBILE_MAX_CANVAS_DPR,
  shouldThrottleCanvasRender,
  computeViewportCullBounds,
  isInViewportBounds,
  evaluateSystemHealthStatus,
  formatMemoryUsageLabel,
  computeSystemHealthSnapshot,
  computeAdaptiveQualityState,
  isBarrierBypassWeapon,
  computeShieldBreakerBarrierHp,
  resolveShieldBreakerImpact,
  computeTouchStickVector,
  computeTouchAimVector,
  getNextUnlockedWeapon,
  getEnemyBasePoints,
  getEnemyBudgetCost,
  createPendingCombatProgressBuffer,
  accumulatePendingKillProgress,
  accumulatePendingCoinProgress,
  computeMultiKillFrameFxBudget,
  wrapAngleSafe,
  computeSafePullDelta,
  collectChainDetonatedBarrels,
} from './rules';
import {
  createEmptyMasteryMap,
  awardWeaponMasteryXp,
  getMasteryTierForXp,
  formatMasteryPerksSummary,
} from './mastery';
import { LEVELS, REGIONS, isRegionUnlocked, purchaseRegionAccess, getLevelDef } from './levels';
import {
  getDefaultMissionsForToday,
  createInitialDailyStreakState,
  advanceDailyStreakState,
  getDailyStreakSnapshot,
  claimDailyStreakBonusState,
  getPreviousDateKey,
  FACEBOOK_FOLLOW_URL,
  FACEBOOK_FOLLOW_REWARD_DIAMONDS,
  createInitialSocialFollowState,
  markSocialFollowVisitedState,
  claimSocialFollowRewardState,
  generateCelebrationParticles,
  stepCelebrationParticles,
} from './missions';
import { WEAPONS, WEAPON_ORDER } from './weapons';
import { ACHIEVEMENTS_STORAGE_KEY, INITIAL_ACHIEVEMENTS, recordAchievementEvent } from './achievements';
import { PlayerStats, WeaponType } from './types';

function createMockPlayerStats(overrides: Partial<PlayerStats> = {}): PlayerStats {
  return {
    maxHp: 10,
    currentHp: 10,
    maxShield: 180,
    currentShield: 180,
    shieldRechargeRate: 35,
    shieldRechargeDelay: 1.0,
    shieldCooldownTimer: 0,
    speed: 350,
    dashCooldown: 0.8,
    dashCooldownTimer: 0,
    dashDuration: 0.2,
    dashTimer: 0,
    scrap: 50,
    coins: 400,
    coinsEarnedThisRun: 0,
    score: 0,
    comboStreak: 0,
    comboCount: 0,
    comboMultiplier: 1.0,
    comboTimer: 0,
    highestCombo: 0,
    maxCombo: 0,
    kills: 0,
    activeWeapon: 'pulse',
    activeCraft: 'vanguard_alpha',
    unlockedCrafts: {
      vanguard_alpha: true,
      phantom_shadow: false,
      titan_dread: false,
      solar_phoenix: false,
      aegis_celestial: false,
      astral_valkyrie: false,
      cyber_falcon: false,
      nebula_harbinger: false,
      zenith_emperor: false,
      tempest_raptor: false,
      seraph_nova: false,
      mirage_viper: false,
      colossus_bastion: false,
      frost_valkyrie: false,
      eclipse_phantom: false,
      kronos_sovereign: false,
    },
    unlockedWeapons: {
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
      ricochet_disc: false,
      pulsar_matrix: false,
      quantum_swarm: false,
      crimson_reaper: false,
      astral_horizon: false,
      genesis_nova: false,
    },
    level: 1,
    levelKills: 0,
    levelQuota: 5,
    levelName: 'DHAKA CYBER CORE',
    upgrades: {
      maxHealthLvl: 0,
      shieldLvl: 0,
      damageLvl: 0,
      fireRateLvl: 0,
      dashLvl: 0,
    },
    ...overrides,
  };
}

test('checkCircleCollision accurately detects overlapping or touching circles', () => {
  // Touching / overlapping
  assert.equal(checkCircleCollision(0, 0, 10, 15, 0, 10), true);
  // Separated
  assert.equal(checkCircleCollision(0, 0, 10, 25, 0, 10), false);
  // Exact boundary
  assert.equal(checkCircleCollision(0, 0, 10, 20, 0, 10), true);
});

test('checkShieldBlock correctly distinguishes front shield angles from flanks/rear', () => {
  const enemyX = 100;
  const enemyY = 100;
  const facingAngle = 0; // facing right (+X)
  const arc = Math.PI * 0.6; // 108 degree front arc

  // Attack coming directly from front (from right, e.g. x=200, y=100)
  assert.equal(checkShieldBlock(enemyX, enemyY, facingAngle, arc, 200, 100), true);

  // Attack coming from rear (from left, e.g. x=0, y=100)
  assert.equal(checkShieldBlock(enemyX, enemyY, facingAngle, arc, 0, 100), false);

  // Attack coming from top flank (x=100, y=200 -> 90 degrees)
  assert.equal(checkShieldBlock(enemyX, enemyY, facingAngle, arc, 100, 200), false);
});

test('getComboMultiplier scales progressively with kill streaks', () => {
  assert.equal(getComboMultiplier(0), 1.0);
  assert.equal(getComboMultiplier(2), 1.0);
  assert.equal(getComboMultiplier(5), 1.5);
  assert.equal(getComboMultiplier(10), 2.0);
  assert.equal(getComboMultiplier(15), 2.5);
  assert.equal(getComboMultiplier(25), 3.0);
  assert.equal(getComboMultiplier(50), 5.0);
});

test('calculateKillScore computes scaled score with combo and wave multiplier', () => {
  const baseScore = 100;
  // Streak 0, Wave 1 -> 100 * 1.0 * 1.0 = 100
  assert.equal(calculateKillScore(baseScore, 0, 1), 100);
  // Streak 5 (1.5x), Wave 1 -> 150
  assert.equal(calculateKillScore(baseScore, 5, 1), 150);
  // Streak 10 (2.0x), Wave 3 (1 + 2*0.15 = 1.30) -> 100 * 2.0 * 1.30 = 260
  assert.equal(calculateKillScore(baseScore, 10, 3), 260);
});

test('calculateWaveBudget scales total budget and limits concurrent spawns by level', () => {
  const lvl1 = calculateWaveBudget(1, 1);
  const lvl2 = calculateWaveBudget(1, 2);
  const lvl5 = calculateWaveBudget(1, 5);

  assert.ok(lvl1.totalBudget > 0);
  assert.ok(lvl2.totalBudget > lvl1.totalBudget);
  assert.ok(lvl5.totalBudget > lvl2.totalBudget);
  assert.ok(lvl1.maxSimultaneous === 2, 'Level 1 has gentle max 2 simultaneous enemies');
  assert.ok(lvl5.maxSimultaneous > lvl1.maxSimultaneous);
  assert.ok(lvl1.spawnDelaySec > lvl5.spawnDelaySec, 'Level 1 has longer spawn delay');
});

test('calculateEnemyStats ensures Level 1 is easy and higher levels scale progressively', () => {
  const swarmerLvl1 = calculateEnemyStats('swarmer', 1);
  const swarmerLvl2 = calculateEnemyStats('swarmer', 2);
  const swarmerLvl3 = calculateEnemyStats('swarmer', 3);
  const swarmerLvl5 = calculateEnemyStats('swarmer', 5);

  // Level 1 Swarmer is significantly gentler
  assert.ok(swarmerLvl1.hp <= 25, `Level 1 Swarmer HP should be ~13 for fast kills, got ${swarmerLvl1.hp}`);
  assert.ok(swarmerLvl1.speed <= 140, `Level 1 Swarmer speed should be slow (~114), got ${swarmerLvl1.speed}`);
  assert.ok(swarmerLvl1.contactDamage <= 8, `Level 1 damage should be gentle (~5), got ${swarmerLvl1.contactDamage}`);
  assert.ok(swarmerLvl1.telegraphDuration >= 0.50, `Level 1 telegraph should provide ample reaction time, got ${swarmerLvl1.telegraphDuration}`);

  // Monotonic difficulty progression
  assert.ok(swarmerLvl2.hp > swarmerLvl1.hp);
  assert.ok(swarmerLvl3.hp > swarmerLvl2.hp);
  assert.ok(swarmerLvl5.hp > swarmerLvl3.hp);

  assert.ok(swarmerLvl2.speed > swarmerLvl1.speed);
  assert.ok(swarmerLvl5.speed > swarmerLvl3.speed);

  assert.ok(swarmerLvl2.contactDamage > swarmerLvl1.contactDamage);
  assert.ok(swarmerLvl5.contactDamage > swarmerLvl3.contactDamage);

  // Telegraph windups are tighter on higher levels
  assert.ok(swarmerLvl5.telegraphDuration < swarmerLvl1.telegraphDuration);
});

test('selectEnemyArchetype enforces swarmer-only on Level 1 and diversifies on higher levels', () => {
  // Level 1 is always swarmer regardless of roll
  assert.equal(selectEnemyArchetype(1, 1000, () => 0.05, 1), 'swarmer');
  assert.equal(selectEnemyArchetype(1, 1000, () => 0.95, 1), 'swarmer');

  // Level 2 introduces snipers
  assert.equal(selectEnemyArchetype(1, 500, () => 0.85, 2), 'sniper');

  // Level 3 introduces tanks
  assert.equal(selectEnemyArchetype(1, 500, () => 0.92, 3), 'tank');

  // Level 28 boss spawns goliath when roll < 0.25 with sufficient budget (>= 1200)
  assert.equal(selectEnemyArchetype(1, 1500, () => 0.1, 28), 'goliath');
});

test('applyDamageToPlayer drains shield first, then health', () => {
  const initial = createMockPlayerStats({ currentShield: 50, currentHp: 5 });

  // Damage 30 -> fully absorbed by shield
  const res1 = applyDamageToPlayer(initial, 30);
  assert.equal(res1.shieldAbsorbed, 30);
  assert.equal(res1.hpLost, 0);
  assert.equal(res1.newStats.currentShield, 20);
  assert.equal(res1.newStats.currentHp, 5);
  assert.equal(res1.isDead, false);

  // Damage 60 from initial (50 shield, 5 HP) -> absorbs 50 shield, loses 10 HP (capped by HP)
  const res2 = applyDamageToPlayer(initial, 60);
  assert.equal(res2.shieldAbsorbed, 50);
  assert.equal(res2.hpLost, 5);
  assert.equal(res2.newStats.currentShield, 0);
  assert.equal(res2.newStats.currentHp, 0);
  assert.equal(res2.isDead, true);
});

test('purchaseUpgrade validates scrap and levels, deducting balance', () => {
  const initial = createMockPlayerStats({ scrap: 30 });
  const cost = getUpgradeCost('dash', 0); // baseCost 15

  const res = purchaseUpgrade(initial, 'dash');
  assert.equal(res.success, true);
  assert.equal(res.cost, cost);
  assert.equal(res.newStats.scrap, 30 - cost);
  assert.equal(res.newStats.upgrades.dashLvl, 1);

  // Second purchase when not enough scrap fails gracefully
  const poorPlayer = createMockPlayerStats({ scrap: 5 });
  const resFail = purchaseUpgrade(poorPlayer, 'damage');
  assert.equal(resFail.success, false);
  assert.equal(resFail.newStats.scrap, 5);
});

test('purchaseWeapon unlocks weapons when player has sufficient coins and deducts cost', () => {
  const initialWeapons: Record<WeaponType, boolean> = {
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
    ricochet_disc: false,
    pulsar_matrix: false,
    quantum_swarm: false,
    crimson_reaper: false,
    astral_horizon: false,
    genesis_nova: false,
  };

  const scatterCost = getWeaponPrice('scatter'); // 600 coins
  assert.equal(scatterCost, 600);

  // Buy scatter with 700 coins -> success, leaves 100 coins
  const res = purchaseWeapon(700, initialWeapons, 'scatter');
  assert.equal(res.success, true);
  assert.equal(res.remainingCoins, 100);
  assert.equal(res.updatedWeapons.scatter, true);
  assert.equal(res.updatedWeapons.pulse, true);
  assert.equal(res.updatedWeapons.beam, false);

  // Buy chrono_thunder god-tier weapon (4800 coins) with 5200 coins
  const resThunder = purchaseWeapon(5200, res.updatedWeapons, 'chrono_thunder');
  assert.equal(resThunder.success, true);
  assert.equal(resThunder.remainingCoins, 400); // 5200 - 4800
  assert.equal(resThunder.updatedWeapons.chrono_thunder, true);

  // Attempting to buy already unlocked weapon fails
  const resDuplicate = purchaseWeapon(50, res.updatedWeapons, 'scatter');
  assert.equal(resDuplicate.success, false);
  assert.ok(resDuplicate.error?.includes('already unlocked'));

  // Attempting to buy supernova (6200 coins) with only 50 coins fails
  const resPoor = purchaseWeapon(50, res.updatedWeapons, 'supernova');
  assert.equal(resPoor.success, false);
  assert.ok(resPoor.error?.includes('Insufficient coins'));
  assert.equal(resPoor.remainingCoins, 50);

  // Buying coin-tier weapons with Diamonds works cleanly
  assert.equal(isWeaponDiamondExclusive('scatter'), false);
  assert.equal(getWeaponDiamondCost('scatter'), 30);
  const scatterDiamond = purchaseWeaponWithDiamonds(35, initialWeapons, 'scatter');
  assert.equal(scatterDiamond.success, true);
  assert.equal(scatterDiamond.remainingDiamonds, 5);
  assert.equal(scatterDiamond.cost, 30);
  assert.equal(scatterDiamond.updatedWeapons.scatter, true);

  // Insufficient diamonds rejected cleanly
  const poorDiamond = purchaseWeaponWithDiamonds(10, initialWeapons, 'void_rail');
  assert.equal(poorDiamond.success, false);
  assert.equal(poorDiamond.remainingDiamonds, 10);
  assert.equal(poorDiamond.updatedWeapons.void_rail, false);
});

test('calculateLevelCoinBonus scales progressively across levels 1 through 100', () => {
  const bonusLvl1 = calculateLevelCoinBonus(1);
  const bonusLvl2 = calculateLevelCoinBonus(2);
  const bonusLvl3 = calculateLevelCoinBonus(3);
  const bonusLvl21 = calculateLevelCoinBonus(21);
  const bonusLvl28 = calculateLevelCoinBonus(28);
  const bonusLvl34 = calculateLevelCoinBonus(34);
  const bonusLvl40 = calculateLevelCoinBonus(40);
  const bonusLvl50 = calculateLevelCoinBonus(50);
  const bonusLvl60 = calculateLevelCoinBonus(60);
  const bonusLvl70 = calculateLevelCoinBonus(70);
  const bonusLvl80 = calculateLevelCoinBonus(80);
  const bonusLvl90 = calculateLevelCoinBonus(90);
  const bonusLvl100 = calculateLevelCoinBonus(100);

  assert.equal(bonusLvl1, 250);
  assert.ok(bonusLvl2 > bonusLvl1);
  assert.ok(bonusLvl3 > bonusLvl2);
  assert.equal(bonusLvl21, 7500);
  assert.equal(bonusLvl28, 15000);
  assert.equal(bonusLvl34, 22500);
  assert.equal(bonusLvl40, 35000, 'Level 40 orbital apex provides 35000 coin prize');
  assert.equal(bonusLvl50, 56000);
  assert.equal(bonusLvl60, 75000, 'Level 60 cosmic singularity finale provides 75000 coin prize');
  assert.equal(bonusLvl70, 96500);
  assert.equal(bonusLvl80, 116500);
  assert.equal(bonusLvl90, 136500);
  assert.equal(bonusLvl100, 160000, 'Level 100 eternity finale provides 160000 coin grand prize');
});

test('calculateEnemyCoinDrop scales by enemy threat tier', () => {
  const swarmerDrop = calculateEnemyCoinDrop('swarmer', () => 0.1);
  assert.equal(swarmerDrop.count, 1);
  assert.equal(swarmerDrop.value, 1);

  const sniperDrop = calculateEnemyCoinDrop('sniper');
  assert.equal(sniperDrop.count, 3);

  const stormDrop = calculateEnemyCoinDrop('storm_drone');
  assert.equal(stormDrop.count * stormDrop.value, 8); // 4 * 2 = 8 coins

  const tankDrop = calculateEnemyCoinDrop('tank');
  assert.equal(tankDrop.count * tankDrop.value, 12); // 6 * 2 = 12 coins

  const phantomDrop = calculateEnemyCoinDrop('phantom');
  assert.equal(phantomDrop.count * phantomDrop.value, 10); // 5 * 2 = 10 coins

  const behemothDrop = calculateEnemyCoinDrop('behemoth');
  assert.equal(behemothDrop.count * behemothDrop.value, 24); // 8 * 3 = 24 coins

  const goliathDrop = calculateEnemyCoinDrop('goliath');
  assert.equal(goliathDrop.count * goliathDrop.value, 75); // 15 * 5 = 75 coins
});

test('getAvailableSpawnPatterns expands variety monotonically as wave count increases', () => {
  const wave1Patterns = getAvailableSpawnPatterns(1);
  const wave2Patterns = getAvailableSpawnPatterns(2);
  const wave3Patterns = getAvailableSpawnPatterns(3);
  const wave4Patterns = getAvailableSpawnPatterns(4);
  const wave5Patterns = getAvailableSpawnPatterns(5);
  const wave6Patterns = getAvailableSpawnPatterns(6);

  // Wave 1 has simple infiltration
  assert.equal(wave1Patterns.length, 2);
  assert.ok(wave1Patterns.includes('perimeter_random'));
  assert.ok(wave1Patterns.includes('corner_ambush'));

  // Wave 2 unlocks encirclement & pincers
  assert.ok(wave2Patterns.length > wave1Patterns.length);
  assert.ok(wave2Patterns.includes('circle_ring'));
  assert.ok(wave2Patterns.includes('pincer_flank'));

  // Wave 3 unlocks V-wedge and portal clusters
  assert.ok(wave3Patterns.length > wave2Patterns.length);
  assert.ok(wave3Patterns.includes('v_wedge'));
  assert.ok(wave3Patterns.includes('portal_cluster'));

  // Wave 4 unlocks 4-way cross siege
  assert.ok(wave4Patterns.length > wave3Patterns.length);
  assert.ok(wave4Patterns.includes('quad_cross'));

  // Wave 5 unlocks heavy escort convoy
  assert.ok(wave5Patterns.length > wave4Patterns.length);
  assert.ok(wave5Patterns.includes('escort_convoy'));

  // Wave 6+ unlocks all 9 tactical patterns including spiral vortex
  assert.equal(wave6Patterns.length, 9);
  assert.ok(wave6Patterns.includes('spiral_vortex'));
});

test('selectSpawnPattern returns valid unlocked patterns for the given wave', () => {
  const p1 = selectSpawnPattern(1, () => 0.1);
  assert.ok(getAvailableSpawnPatterns(1).includes(p1));

  const p3 = selectSpawnPattern(3, () => 0.5);
  assert.ok(getAvailableSpawnPatterns(3).includes(p3));

  const p6 = selectSpawnPattern(6, () => 0.9);
  assert.ok(getAvailableSpawnPatterns(6).includes(p6));
});

test('generateSpawnPositions outputs coordinates inside arena boundaries for all patterns', () => {
  const arenaW = 2000;
  const arenaH = 1500;
  const player = { x: 1000, y: 750 };
  const patterns = getAvailableSpawnPatterns(6);

  for (const pattern of patterns) {
    const points = generateSpawnPositions(pattern, 4, player, arenaW, arenaH, () => 0.5);
    assert.equal(points.length, 4, `Pattern ${pattern} should produce 4 spawn points`);

    for (const pt of points) {
      assert.ok(pt.x >= 60 && pt.x <= arenaW - 60, `Point X out of bounds in ${pattern}: ${pt.x}`);
      assert.ok(pt.y >= 60 && pt.y <= arenaH - 60, `Point Y out of bounds in ${pattern}: ${pt.y}`);
    }
  }
});

test('calculateTrajectoryAvoidanceForce steers enemies away when directly in crosshairs', () => {
  const playerX = 500;
  const playerY = 500;
  const aimAngle = 0; // aiming east (+X axis)

  // Enemy A is directly in the crosshairs ahead of player (x=800, y=500)
  const inLineEnemy = calculateTrajectoryAvoidanceForce(
    800,
    500,
    18,
    playerX,
    playerY,
    aimAngle,
    900,
    true, // isFiring
    130
  );

  assert.equal(inLineEnemy.inDanger, true, 'Enemy directly in crosshairs must detect danger');
  assert.ok(inLineEnemy.intensity > 0.8, 'Intensity should be near max at center line');
  // Evasion vector must be strictly perpendicular to aim (aim is along X, so evasion must be along Y)
  assert.equal(Math.abs(Math.round(inLineEnemy.avoidVx)), 0, 'Avoidance Vx must be 0 for horizontal shot');
  assert.notEqual(Math.round(inLineEnemy.avoidVy), 0, 'Avoidance Vy must be non-zero to dodge laterally');

  // Enemy B is to the left of aim line (x=800, y=470): must steer further left away from center line
  const leftEnemy = calculateTrajectoryAvoidanceForce(
    800,
    470,
    18,
    playerX,
    playerY,
    aimAngle,
    900,
    false,
    130
  );
  assert.equal(leftEnemy.inDanger, true);
  assert.ok(leftEnemy.avoidVy < 0, 'Must push further north (-Y) away from beam');

  // Enemy C is behind the player (x=200, y=500): no danger
  const behindEnemy = calculateTrajectoryAvoidanceForce(
    200,
    500,
    18,
    playerX,
    playerY,
    aimAngle,
    900,
    true,
    130
  );
  assert.equal(behindEnemy.inDanger, false);
  assert.equal(behindEnemy.avoidVx, 0);
  assert.equal(behindEnemy.avoidVy, 0);

  // Enemy D is far outside avoidance corridor (x=800, y=900): no danger
  const farEnemy = calculateTrajectoryAvoidanceForce(
    800,
    900,
    18,
    playerX,
    playerY,
    aimAngle,
    900,
    true,
    130
  );
  assert.equal(farEnemy.inDanger, false);
});

test('calculateProjectileDodgeForce steers away from incoming player bullets', () => {
  const enemyX = 600;
  const enemyY = 400;
  const enemyRadius = 16;

  // Projectile heading straight towards enemy from left
  const incomingBullet = {
    x: 450,
    y: 400,
    vx: 800, // moving right towards enemy
    vy: 0,
    radius: 6,
    isEnemy: false,
  };

  const res = calculateProjectileDodgeForce(enemyX, enemyY, enemyRadius, [incomingBullet]);
  assert.equal(res.hasBulletThreat, true, 'Should detect incoming player bullet threat');
  assert.notEqual(res.dodgeVy, 0, 'Should apply lateral dodging thrust');

  // Enemy bullet moving towards enemy does not trigger dodge
  const enemyBullet = {
    ...incomingBullet,
    isEnemy: true,
  };
  const resEnemy = calculateProjectileDodgeForce(enemyX, enemyY, enemyRadius, [enemyBullet]);
  assert.equal(resEnemy.hasBulletThreat, false, 'Should ignore friendly/enemy bullets');
});

test('mapWeaponToDamageCategory maps weapons and traits to distinct damage categories', () => {
  assert.equal(mapWeaponToDamageCategory('pulse'), 'plasma');
  assert.equal(mapWeaponToDamageCategory('scatter'), 'scatter');
  assert.equal(mapWeaponToDamageCategory('beam'), 'beam');
  assert.equal(mapWeaponToDamageCategory('missile'), 'explosive');
  assert.equal(mapWeaponToDamageCategory('inferno'), 'fire');
  assert.equal(mapWeaponToDamageCategory('chrono_thunder'), 'electric');
  assert.equal(mapWeaponToDamageCategory('supernova'), 'cosmic');
  assert.equal(mapWeaponToDamageCategory('aegis_titan'), 'titan');

  // Critical and resisted priority overrides
  assert.equal(mapWeaponToDamageCategory('pulse', false, true, false), 'critical');
  assert.equal(mapWeaponToDamageCategory('pulse', false, false, true), 'resisted');
  assert.equal(mapWeaponToDamageCategory('pulse', true, false, false), 'explosive');
});

test('getDamageColor returns valid contrasting colors and glows for all categories', () => {
  const categories = Object.keys(DAMAGE_STYLES) as (keyof typeof DAMAGE_STYLES)[];
  assert.ok(categories.length >= 10);

  for (const cat of categories) {
    const style = getDamageColor(cat);
    assert.ok(style.text.startsWith('#'), `${cat} text must be valid hex color`);
    assert.ok(style.glow.length > 0, `${cat} glow must be defined`);
    assert.ok(style.stroke.length > 0, `${cat} stroke must be defined`);
  }

  // Ensure critical is distinct pure bright
  assert.equal(getDamageColor('critical').text, '#ffffff');
  // Ensure plasma is electric cyan
  assert.equal(getDamageColor('plasma').text, '#00f3ff');
  // Ensure fire is fiery red
  assert.equal(getDamageColor('fire').text, '#ff3300');
});

test('difficulty modifiers scale enemy spawn rate, simultaneous cap, and enemy damage across Easy, Normal, and Nightmare', () => {
  const easyMod = getDifficultyModifier('easy');
  const normalMod = getDifficultyModifier('normal');
  const nightmareMod = getDifficultyModifier('nightmare');

  assert.ok(easyMod.spawnRateMultiplier < normalMod.spawnRateMultiplier);
  assert.ok(nightmareMod.spawnRateMultiplier > normalMod.spawnRateMultiplier);
  assert.ok(easyMod.damageMultiplier < normalMod.damageMultiplier);
  assert.ok(nightmareMod.damageMultiplier > normalMod.damageMultiplier);

  // Wave spawn delay & simultaneous enemy cap scaling
  const easyBudget = calculateWaveBudget(2, 5, 'easy');
  const normalBudget = calculateWaveBudget(2, 5, 'normal');
  const nightmareBudget = calculateWaveBudget(2, 5, 'nightmare');

  assert.ok(easyBudget.spawnDelaySec > normalBudget.spawnDelaySec, 'Easy should have longer delay between spawns');
  assert.ok(nightmareBudget.spawnDelaySec < normalBudget.spawnDelaySec, 'Nightmare should spawn enemies faster');
  assert.ok(nightmareBudget.maxSimultaneous > normalBudget.maxSimultaneous, 'Nightmare allows more simultaneous enemies');
  assert.ok(easyBudget.maxSimultaneous <= normalBudget.maxSimultaneous, 'Easy caps simultaneous enemies lower or equal');

  // Enemy contact, projectile, and slam damage scaling
  const easyBehemoth = calculateEnemyStats('behemoth', 10, 2, 'easy');
  const normalBehemoth = calculateEnemyStats('behemoth', 10, 2, 'normal');
  const nightmareBehemoth = calculateEnemyStats('behemoth', 10, 2, 'nightmare');

  assert.ok(easyBehemoth.contactDamage < normalBehemoth.contactDamage);
  assert.ok(nightmareBehemoth.contactDamage > normalBehemoth.contactDamage);
  assert.ok(easyBehemoth.projectileDamage < normalBehemoth.projectileDamage);
  assert.ok(nightmareBehemoth.projectileDamage > normalBehemoth.projectileDamage);
  assert.ok(easyBehemoth.slamDamage < normalBehemoth.slamDamage);
  assert.ok(nightmareBehemoth.slamDamage > normalBehemoth.slamDamage);
});

test('region unlocking requires combat progression across all 12 regions and coin purchases are disabled', () => {
  for (const reg of Object.values(REGIONS)) {
    assert.equal(reg.isPurchasable, false);
  }

  // Dhaka is always unlocked; higher regions require clearing prior sectors
  assert.equal(isRegionUnlocked('dhaka', 1), true);
  assert.equal(isRegionUnlocked('rajshahi', 1), false);
  assert.equal(isRegionUnlocked('rajshahi', 8), true);
  assert.equal(isRegionUnlocked('chattogram', 14), false);
  assert.equal(isRegionUnlocked('chattogram', 15), true);
  assert.equal(isRegionUnlocked('sylhet', 21), false);
  assert.equal(isRegionUnlocked('sylhet', 22), true);
  assert.equal(isRegionUnlocked('sundarbans', 28), false);
  assert.equal(isRegionUnlocked('sundarbans', 29), true);
  assert.equal(isRegionUnlocked('cox_orbit', 34), false);
  assert.equal(isRegionUnlocked('cox_orbit', 35), true);
  assert.equal(isRegionUnlocked('kuakata_abyss', 40), false);
  assert.equal(isRegionUnlocked('kuakata_abyss', 41), true);
  assert.equal(isRegionUnlocked('bengal_singularity', 50), false);
  assert.equal(isRegionUnlocked('bengal_singularity', 51), true);
  assert.equal(isRegionUnlocked('barishal_nebula', 60), false);
  assert.equal(isRegionUnlocked('barishal_nebula', 61), true);
  assert.equal(isRegionUnlocked('rangpur_cryo', 70), false);
  assert.equal(isRegionUnlocked('rangpur_cryo', 71), true);
  assert.equal(isRegionUnlocked('khulna_reactor', 80), false);
  assert.equal(isRegionUnlocked('khulna_reactor', 81), true);
  assert.equal(isRegionUnlocked('padma_eternity', 90), false);
  assert.equal(isRegionUnlocked('padma_eternity', 91), true);

  // Attempting to buy a region with coins always fails and deducts 0 coins
  const res = purchaseRegionAccess('rajshahi', 5000);
  assert.equal(res.success, false);
  assert.equal(res.remainingCoins, 5000);
});

test('daily missions award strictly 1 or 2 diamonds each alongside hardened targets', () => {
  const missions = getDefaultMissionsForToday();
  assert.equal(missions.length, 6);

  const byObjective = Object.fromEntries(missions.map((m) => [m.objectiveType, m]));
  assert.ok(byObjective.kills_swarmer.targetValue >= 60);
  assert.ok(byObjective.kills_sniper.targetValue >= 25);
  assert.ok(byObjective.kills_tank.targetValue >= 18);
  assert.ok(byObjective.kills_phantom.targetValue >= 15);
  assert.ok(byObjective.collect_coins.targetValue >= 120);
  assert.ok(byObjective.kills_boss.targetValue >= 2);

  for (const m of missions) {
    assert.ok(
      m.rewardDiamonds === 1 || m.rewardDiamonds === 2,
      `Mission ${m.id} should award 1 or 2 diamonds, got ${m.rewardDiamonds}`
    );
  }

  const totalDiamonds = missions.reduce((sum, m) => sum + (m.rewardDiamonds ?? 0), 0);
  assert.equal(totalDiamonds, 8, 'Total daily diamond yield across 6 missions should equal 8 (1-2 per mission)');
});

test('daily streak tracking increments on consecutive days, resets on skipped days, and guards once-per-day bonus claim', () => {
  assert.equal(getPreviousDateKey('2026-11-01'), '2026-10-31');

  let streak = createInitialDailyStreakState();
  const snapDay0 = getDailyStreakSnapshot(streak, '2026-11-10');
  assert.equal(snapDay0.currentStreak, 0);
  assert.equal(snapDay0.claimableDay, 1);
  assert.equal(snapDay0.hasClaimedToday, false);

  // Day 1 play + claim
  const adv1 = advanceDailyStreakState(streak, '2026-11-10');
  assert.equal(adv1.advanced, true);
  streak = adv1.nextState;
  assert.equal(streak.currentStreak, 1);

  // Same-day replay does not double-increment streak
  const replayDay1 = advanceDailyStreakState(streak, '2026-11-10');
  assert.equal(replayDay1.advanced, false);
  assert.equal(replayDay1.nextState.currentStreak, 1);

  const claim1 = claimDailyStreakBonusState(streak, '2026-11-10');
  assert.equal(claim1.success, true);
  assert.equal(claim1.streakDay, 1);
  assert.equal(claim1.rewardCoins, 150);
  assert.equal(claim1.rewardDiamonds, 1);
  streak = claim1.nextState;

  // Duplicate claim on the same day is blocked
  const dupClaim1 = claimDailyStreakBonusState(streak, '2026-11-10');
  assert.equal(dupClaim1.success, false);

  // Day 2 consecutive play escalates streak & reward
  const snapBeforeDay2 = getDailyStreakSnapshot(streak, '2026-11-11');
  assert.equal(snapBeforeDay2.currentStreak, 1);
  assert.equal(snapBeforeDay2.claimableDay, 2);
  assert.equal(snapBeforeDay2.hasClaimedToday, false);

  const claim2 = claimDailyStreakBonusState(streak, '2026-11-11');
  assert.equal(claim2.success, true);
  assert.equal(claim2.streakDay, 2);
  assert.equal(claim2.rewardCoins, 250);
  assert.equal(claim2.rewardDiamonds, 1);
  streak = claim2.nextState;
  assert.equal(streak.bestStreak, 2);

  // Skipping Day 3 (jumping to Day 4: 2026-11-13) resets streak back to 1 while preserving bestStreak
  const snapSkipped = getDailyStreakSnapshot(streak, '2026-11-13');
  assert.equal(snapSkipped.currentStreak, 0);
  assert.equal(snapSkipped.bestStreak, 2);
  assert.equal(snapSkipped.claimableDay, 1);

  const claimAfterSkip = claimDailyStreakBonusState(streak, '2026-11-13');
  assert.equal(claimAfterSkip.success, true);
  assert.equal(claimAfterSkip.streakDay, 1);
  assert.equal(claimAfterSkip.nextState.bestStreak, 2);
});

test('Facebook profile follow option awards exactly 50 diamonds one-time after visiting the profile link', () => {
  assert.equal(FACEBOOK_FOLLOW_URL, 'https://www.facebook.com/profile.php?id=100086479151613');
  assert.equal(FACEBOOK_FOLLOW_REWARD_DIAMONDS, 50);

  let state = createInitialSocialFollowState();
  assert.equal(state.visited, false);
  assert.equal(state.claimed, false);

  // Cannot claim before clicking follow link
  const beforeVisit = claimSocialFollowRewardState(state);
  assert.equal(beforeVisit.success, false);
  assert.equal(beforeVisit.rewardDiamonds, 0);

  // Visiting marks visited = true and unlocks +50 diamond claim
  state = markSocialFollowVisitedState(state);
  assert.equal(state.visited, true);
  assert.equal(state.claimed, false);

  const claimRes = claimSocialFollowRewardState(state);
  assert.equal(claimRes.success, true);
  assert.equal(claimRes.rewardDiamonds, 50);
  assert.equal(claimRes.nextState.claimed, true);

  // Duplicate claim is permanently blocked
  const dupRes = claimSocialFollowRewardState(claimRes.nextState);
  assert.equal(dupRes.success, false);
  assert.equal(dupRes.rewardDiamonds, 0);
});

test('getRegionAtmosphereTheme assigns distinct visual weather styles and palettes across all 12 regions', () => {
  const dhaka = getRegionAtmosphereTheme('dhaka');
  const rajshahi = getRegionAtmosphereTheme('rajshahi');
  const chattogram = getRegionAtmosphereTheme('chattogram');
  const sylhet = getRegionAtmosphereTheme('sylhet');
  const sundarbans = getRegionAtmosphereTheme('sundarbans');
  const coxOrbit = getRegionAtmosphereTheme('cox_orbit');
  const kuakataAbyss = getRegionAtmosphereTheme('kuakata_abyss');
  const bengalSingularity = getRegionAtmosphereTheme('bengal_singularity');
  const barishalNebula = getRegionAtmosphereTheme('barishal_nebula');
  const rangpurCryo = getRegionAtmosphereTheme('rangpur_cryo');
  const khulnaReactor = getRegionAtmosphereTheme('khulna_reactor');
  const padmaEternity = getRegionAtmosphereTheme('padma_eternity');

  assert.equal(dhaka.weatherStyle, 'cyber_rain');
  assert.equal(rajshahi.weatherStyle, 'solar_spores');
  assert.equal(chattogram.weatherStyle, 'lighthouse_beams');
  assert.equal(sylhet.weatherStyle, 'celestial_aurora');
  assert.equal(sundarbans.weatherStyle, 'solar_spores');
  assert.equal(coxOrbit.weatherStyle, 'celestial_aurora');
  assert.equal(kuakataAbyss.weatherStyle, 'lighthouse_beams');
  assert.equal(bengalSingularity.weatherStyle, 'celestial_aurora');
  assert.equal(barishalNebula.weatherStyle, 'cyber_rain');
  assert.equal(rangpurCryo.weatherStyle, 'celestial_aurora');
  assert.equal(khulnaReactor.weatherStyle, 'lighthouse_beams');
  assert.equal(padmaEternity.weatherStyle, 'celestial_aurora');

  const styles = new Set([dhaka.weatherStyle, rajshahi.weatherStyle, chattogram.weatherStyle, sylhet.weatherStyle]);
  assert.equal(styles.size, 4);
  assert.notEqual(sundarbans.nebulaPrimary, rajshahi.nebulaPrimary);
  assert.notEqual(coxOrbit.nebulaPrimary, sylhet.nebulaPrimary);
  assert.notEqual(kuakataAbyss.nebulaPrimary, chattogram.nebulaPrimary);
  assert.notEqual(bengalSingularity.nebulaPrimary, coxOrbit.nebulaPrimary);
  assert.notEqual(barishalNebula.nebulaPrimary, dhaka.nebulaPrimary);
  assert.notEqual(rangpurCryo.nebulaPrimary, barishalNebula.nebulaPrimary);
  assert.notEqual(khulnaReactor.nebulaPrimary, rangpurCryo.nebulaPrimary);
  assert.notEqual(padmaEternity.nebulaPrimary, khulnaReactor.nebulaPrimary);
});

test('Hydra and Inferno weapons are exclusive to Diamond Vault with premium diamond prices', () => {
  assert.equal(WEAPONS.missile.price, 0);
  assert.equal(WEAPONS.inferno.price, 0);
  assert.ok((WEAPONS.missile.diamondCost ?? 0) >= 100, 'Hydra should have a high Diamond Vault cost (>= 100)');
  assert.ok((WEAPONS.inferno.diamondCost ?? 0) > (WEAPONS.missile.diamondCost ?? 0), 'Inferno should cost more Diamonds than Hydra');
  assert.equal(getWeaponPrice('missile'), 0);
  assert.equal(getWeaponPrice('inferno'), 0);

  const initialWeapons: Record<WeaponType, boolean> = {
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
    ricochet_disc: false,
    pulsar_matrix: false,
    quantum_swarm: false,
    crimson_reaper: false,
    astral_horizon: false,
    genesis_nova: false,
  };

  // Coin store must reject buying Diamond Vault weapons even with plenty of coins
  const resMissile = purchaseWeapon(50000, initialWeapons, 'missile');
  assert.equal(resMissile.success, false);
  assert.equal(resMissile.remainingCoins, 50000);
  assert.equal(resMissile.updatedWeapons.missile, false);

  const resInferno = purchaseWeapon(50000, initialWeapons, 'inferno');
  assert.equal(resInferno.success, false);
  assert.equal(resInferno.remainingCoins, 50000);
  assert.equal(resInferno.updatedWeapons.inferno, false);
});

test('medals have hardened targets and boss medals require actual boss kills rather than passive level clears', () => {
  assert.equal(ACHIEVEMENTS_STORAGE_KEY, 'nabilbot_achievements_v2');
  const byId = Object.fromEntries(INITIAL_ACHIEVEMENTS.map((a) => [a.id, a]));

  assert.ok(byId.first_blood.targetProgress >= 50);
  assert.ok(byId.swarm_slayer.targetProgress >= 400);
  assert.ok(byId.centurion_purger.targetProgress >= 1500);
  assert.ok(byId.kills_1000.targetProgress >= 4000);
  assert.ok(byId.no_hit_run.targetProgress >= 3);
  assert.ok(byId.combo_master.targetProgress >= 45);
  assert.ok(byId.ghost_hunter.targetProgress >= 50);
  assert.ok(byId.behemoth_breaker.targetProgress >= 40);
  assert.ok(byId.storm_breaker.targetProgress >= 75);
  assert.ok(byId.coin_hoarder.targetProgress >= 10000);
  assert.ok(byId.fleet_commander.targetProgress >= 5);
  assert.ok(byId.godtier_wielder.targetProgress >= 3);
  assert.ok(byId.naval_supreme.targetProgress >= 2);
  assert.ok(byId.sylhet_apex.targetProgress >= 2);

  // level_clear alone must not unlock Dhaka boss medal (dhaka_liberator)
  const levelClearRes = recordAchievementEvent({ type: 'level_clear', amount: 7 });
  const dhakaAfterClear = levelClearRes.updatedAchievements.find((a) => a.id === 'dhaka_liberator');
  assert.equal(dhakaAfterClear?.isUnlocked, false);

  // Single kill does not unlock first_blood anymore
  const killRes = recordAchievementEvent({ type: 'kill', amount: 1 });
  const fbAfterOneKill = killRes.updatedAchievements.find((a) => a.id === 'first_blood');
  assert.equal(fbAfterOneKill?.isUnlocked, false);
  assert.equal(fbAfterOneKill?.currentProgress, 1);
});

test('campaign expands to 100 levels across 12 regions with easier first 10 levels and untouched 11-60 tuning', () => {
  assert.equal(LEVELS.length, 100);
  assert.equal(Object.keys(REGIONS).length, 12);
  const byId = Object.fromEntries(INITIAL_ACHIEVEMENTS.map((a) => [a.id, a]));
  assert.equal(byId.campaign_victor.targetProgress, 100);

  // Verify sequential level numbers 1..100 with non-empty fields and <= 18 simultaneous cap
  for (let i = 0; i < LEVELS.length; i++) {
    assert.equal(LEVELS[i].level, i + 1);
    assert.ok(LEVELS[i].hostileQuota > 0);
    assert.ok(LEVELS[i].maxSimultaneous <= 18, `Level ${i + 1} maxSimultaneous stays capped <= 18 for smooth performance`);
  }

  // Levels 1..10 have extra gentle HP/damage/speed multipliers and smaller quotas
  const lvl1 = getLevelDef(1);
  const lvl7 = getLevelDef(7);
  const lvl10 = getLevelDef(10);
  assert.equal(lvl1.hostileQuota, 5);
  assert.ok(lvl7.hostileQuota <= 16);
  assert.ok(lvl10.hostileQuota <= 18);
  assert.equal(lvl10.archetypes.includes('behemoth'), false);
  assert.equal(selectEnemyArchetype(1, 2000, () => 0.05, 10), 'phantom');

  for (let l = 1; l <= 10; l++) {
    const p = getLevelDifficultyParameters(l);
    assert.ok(p.hpMult <= 0.50, `Level ${l} hpMult should be <= 0.50, got ${p.hpMult}`);
    assert.ok(p.damageMult <= 0.44, `Level ${l} damageMult should be <= 0.44, got ${p.damageMult}`);
    assert.ok(p.speedMult <= 0.72, `Level ${l} speedMult should be <= 0.72, got ${p.speedMult}`);
  }

  // Levels 11..28 remain untouched
  const p11 = getLevelDifficultyParameters(11);
  assert.equal(p11.hpMult, 0.90);
  assert.equal(p11.speedMult, 0.94);
  assert.equal(p11.damageMult, 0.84);
  assert.equal(getLevelDef(11).hostileQuota, 38);

  const p14 = getLevelDifficultyParameters(14);
  assert.equal(p14.hpMult, 1.10);
  assert.equal(getLevelDef(14).hostileQuota, 52);

  const p21 = getLevelDifficultyParameters(21);
  assert.equal(p21.hpMult, 1.52);
  assert.equal(getLevelDef(21).hostileQuota, 70);

  const p28 = getLevelDifficultyParameters(28);
  assert.equal(p28.hpMult, 1.80);
  assert.equal(p28.damageMult, 1.40);
  assert.equal(getLevelDef(28).hostileQuota, 85);

  // Sundarbans (29..34) & Cox's Orbit (35..40) remain untouched
  const lvl29 = getLevelDef(29);
  const lvl34 = getLevelDef(34);
  const lvl35 = getLevelDef(35);
  const lvl40 = getLevelDef(40);
  assert.equal(lvl29.region, 'sundarbans');
  assert.equal(lvl34.region, 'sundarbans');
  assert.equal(lvl34.hasBoss, true);
  assert.equal(lvl35.region, 'cox_orbit');
  assert.equal(lvl40.region, 'cox_orbit');
  assert.equal(lvl40.hasBoss, true);
  assert.equal(selectEnemyArchetype(1, 1500, () => 0.1, 40), 'goliath');
  const p40 = getLevelDifficultyParameters(40);
  assert.equal(p40.hpMult, 2.35);
  assert.equal(p40.damageMult, 1.66);

  // Regions 7 & 8: Kuakata Abyss (41..50) & Bengal Singularity (51..60) remain untouched
  const lvl41 = getLevelDef(41);
  const lvl50 = getLevelDef(50);
  const lvl51 = getLevelDef(51);
  const lvl55 = getLevelDef(55);
  const lvl60 = getLevelDef(60);
  assert.equal(lvl41.region, 'kuakata_abyss');
  assert.equal(lvl50.region, 'kuakata_abyss');
  assert.equal(lvl50.hasBoss, true);
  assert.equal(lvl51.region, 'bengal_singularity');
  assert.equal(lvl55.region, 'bengal_singularity');
  assert.equal(lvl55.hasBoss, true);
  assert.equal(lvl60.region, 'bengal_singularity');
  assert.equal(lvl60.hasBoss, true);
  assert.equal(selectEnemyArchetype(1, 1500, () => 0.1, 50), 'goliath');
  assert.equal(selectEnemyArchetype(1, 1500, () => 0.1, 60), 'goliath');

  const p50 = getLevelDifficultyParameters(50);
  const p60 = getLevelDifficultyParameters(60);
  assert.equal(p50.hpMult, 2.75);
  assert.equal(p60.hpMult, 3.15);
  assert.equal(p60.damageMult, 2.06);
  assert.ok(p60.hpMult > p50.hpMult && p50.hpMult > p40.hpMult);

  // Regions 9..12: Barishal Nebula (61..70), Rangpur Cryo (71..80), Khulna Reactor (81..90), Padma Eternity (91..100)
  assert.equal(getLevelDef(61).region, 'barishal_nebula');
  assert.equal(getLevelDef(70).region, 'barishal_nebula');
  assert.equal(getLevelDef(70).hasBoss, true);
  assert.equal(getLevelDef(71).region, 'rangpur_cryo');
  assert.equal(getLevelDef(75).hasBoss, true);
  assert.equal(getLevelDef(80).region, 'rangpur_cryo');
  assert.equal(getLevelDef(80).hasBoss, true);
  assert.equal(getLevelDef(81).region, 'khulna_reactor');
  assert.equal(getLevelDef(85).hasBoss, true);
  assert.equal(getLevelDef(90).region, 'khulna_reactor');
  assert.equal(getLevelDef(90).hasBoss, true);
  assert.equal(getLevelDef(91).region, 'padma_eternity');
  assert.equal(getLevelDef(95).hasBoss, true);
  assert.equal(getLevelDef(100).region, 'padma_eternity');
  assert.equal(getLevelDef(100).hasBoss, true);

  for (const bossLvl of [70, 75, 80, 85, 90, 95, 100]) {
    assert.equal(selectEnemyArchetype(1, 1500, () => 0.1, bossLvl), 'goliath');
  }

  const p70 = getLevelDifficultyParameters(70);
  const p80 = getLevelDifficultyParameters(80);
  const p90 = getLevelDifficultyParameters(90);
  const p100 = getLevelDifficultyParameters(100);
  assert.ok(p70.hpMult > p60.hpMult);
  assert.ok(p80.hpMult > p70.hpMult);
  assert.ok(p90.hpMult > p80.hpMult);
  assert.equal(p100.hpMult, 4.55);
  assert.equal(p100.damageMult, 2.66);
  assert.equal(p100.maxSimultaneous, 18);
});

test('combo finisher charges across 20 consecutive hits, activates only with active 20+ streak, and deals radial AoE damage with knockback', () => {
  let charge = 0;
  let ready = false;
  let becameReadyAt = -1;

  for (let hit = 1; hit <= COMBO_FINISHER_THRESHOLD + 2; hit++) {
    const res = advanceComboFinisherState(charge, ready, hit);
    charge = res.charge;
    ready = res.ready;
    if (res.justBecameReady) {
      becameReadyAt = hit;
    }
    if (hit < COMBO_FINISHER_THRESHOLD) {
      assert.equal(ready, false, `Finisher must not be ready at hit ${hit}`);
    } else {
      assert.equal(ready, true, `Finisher must be ready at hit ${hit}`);
    }
  }

  assert.equal(becameReadyAt, 20);
  assert.equal(charge, COMBO_FINISHER_THRESHOLD);

  // Broken streak clears progress
  const resetRes = advanceComboFinisherState(15, false, 0);
  assert.equal(resetRes.charge, 0);
  assert.equal(resetRes.ready, false);

  // Activation gating
  assert.equal(canActivateComboFinisher({ ready: true, streak: 20, comboTimer: 1.5 }), true);
  assert.equal(canActivateComboFinisher({ ready: true, streak: 19, comboTimer: 1.5 }), false);
  assert.equal(canActivateComboFinisher({ ready: true, streak: 20, comboTimer: 0 }), false);
  assert.equal(canActivateComboFinisher({ ready: false, streak: 25, comboTimer: 2.0 }), false);

  // AoE damage & falloff calculation
  const centerBlast = computeComboFinisherExplosion({
    damageUpgradeLvl: 2,
    craftDamageMultiplier: 1.25,
    comboMultiplier: 3.0,
    wave: 1,
    distanceFromCenter: 0,
  });
  const edgeBlast = computeComboFinisherExplosion({
    damageUpgradeLvl: 2,
    craftDamageMultiplier: 1.25,
    comboMultiplier: 3.0,
    wave: 1,
    distanceFromCenter: COMBO_FINISHER_RADIUS,
  });
  const outOfRangeBlast = computeComboFinisherExplosion({
    damageUpgradeLvl: 2,
    craftDamageMultiplier: 1.25,
    comboMultiplier: 3.0,
    wave: 1,
    distanceFromCenter: COMBO_FINISHER_RADIUS + 10,
  });

  assert.ok(centerBlast.inRange);
  assert.ok(centerBlast.enemyDamage >= COMBO_FINISHER_BASE_DAMAGE * 4);
  assert.ok(edgeBlast.inRange);
  assert.ok(edgeBlast.enemyDamage < centerBlast.enemyDamage);
  assert.ok(edgeBlast.enemyDamage > 0);
  assert.ok(centerBlast.knockbackForce > edgeBlast.knockbackForce);
  assert.equal(outOfRangeBlast.inRange, false);
  assert.equal(outOfRangeBlast.enemyDamage, 0);
  assert.equal(outOfRangeBlast.knockbackForce, 0);
});

test('dash cooldown defaults to 1.5 seconds and computes visual gauge recharge progress accurately', () => {
  assert.equal(BASE_DASH_COOLDOWN_SECONDS, 1.5);
  assert.equal(computeDashCooldown(1.0, 0), 1.5);

  // Craft & upgrade reductions stay clamped above minimum tactical threshold
  assert.equal(computeDashCooldown(0.6, 0), 0.9);
  assert.ok(computeDashCooldown(0.5, 5) >= MIN_DASH_COOLDOWN_SECONDS);

  // Gauge state progression from 1.5s down to 0s
  const justDashed = computeDashGaugeState(1.5, 1.5);
  assert.equal(justDashed.isReady, false);
  assert.equal(justDashed.chargePercent, 0);
  assert.equal(justDashed.remainingSeconds, 1.5);

  const halfway = computeDashGaugeState(0.75, 1.5);
  assert.equal(halfway.isReady, false);
  assert.equal(halfway.chargePercent, 50);
  assert.equal(halfway.remainingSeconds, 0.75);

  const ready = computeDashGaugeState(0, 1.5);
  assert.equal(ready.isReady, true);
  assert.equal(ready.chargePercent, 100);
  assert.equal(ready.remainingSeconds, 0);

  // Dash upgrade scales down from 1.5s
  const upgraded = purchaseUpgrade(createMockPlayerStats({ scrap: 50, dashCooldown: 1.5 }), 'dash');
  assert.equal(upgraded.success, true);
  assert.equal(upgraded.newStats.dashCooldown, 1.32);
});

test('diamond revive escalates cost across up to 3 revives and enforces diamond balance and caps', () => {
  assert.equal(DIAMOND_REVIVE_BASE_COST, 5);
  assert.equal(MAX_DIAMOND_REVIVES_PER_RUN, 3);

  const first = getDiamondReviveCost(0);
  assert.equal(first.canRevive, true);
  assert.equal(first.cost, 5);
  assert.equal(first.remainingRevives, 3);

  const second = getDiamondReviveCost(1);
  assert.equal(second.canRevive, true);
  assert.equal(second.cost, 10);
  assert.equal(second.remainingRevives, 2);

  const third = getDiamondReviveCost(2);
  assert.equal(third.canRevive, true);
  assert.equal(third.cost, 15);
  assert.equal(third.remainingRevives, 1);

  const exhausted = getDiamondReviveCost(3);
  assert.equal(exhausted.canRevive, false);
  assert.equal(exhausted.cost, 0);
  assert.equal(exhausted.remainingRevives, 0);

  // Validation with insufficient diamonds
  const poorAttempt = canPurchaseDiamondRevive({ diamonds: 4, revivesUsed: 0 });
  assert.equal(poorAttempt.allowed, false);
  assert.equal(poorAttempt.reason, 'insufficient_diamonds');
  assert.equal(poorAttempt.cost, 5);

  // Validation with sufficient diamonds
  const validAttempt = canPurchaseDiamondRevive({ diamonds: 5, revivesUsed: 0 });
  assert.equal(validAttempt.allowed, true);
  assert.equal(validAttempt.cost, 5);

  // Escalated 2nd attempt requires 10 diamonds
  const poorSecond = canPurchaseDiamondRevive({ diamonds: 9, revivesUsed: 1 });
  assert.equal(poorSecond.allowed, false);
  assert.equal(poorSecond.reason, 'insufficient_diamonds');

  const validSecond = canPurchaseDiamondRevive({ diamonds: 10, revivesUsed: 1 });
  assert.equal(validSecond.allowed, true);
  assert.equal(validSecond.cost, 10);

  // Max revives reached rejects even with abundant diamonds
  const cappedAttempt = canPurchaseDiamondRevive({ diamonds: 999, revivesUsed: 3 });
  assert.equal(cappedAttempt.allowed, false);
  assert.equal(cappedAttempt.reason, 'max_revives');

  // Cannot revive on victory
  const victoryAttempt = canPurchaseDiamondRevive({ diamonds: 999, revivesUsed: 0, isVictory: true });
  assert.equal(victoryAttempt.allowed, false);
  assert.equal(victoryAttempt.reason, 'not_defeat');
});

test('weapon heat accumulates per shot, triggers overheat lock at 100, and cools back down cleanly', () => {
  let state = createInitialWeaponThermalState();
  assert.equal(state.heat, 0);
  assert.equal(state.isOverheated, false);

  // Rapid shots without mastery reduction (25 heat per shot)
  const s1 = applyWeaponShotHeat(state, 25, 0);
  assert.equal(s1.triggeredOverheat, false);
  assert.equal(s1.state.heat, 25);

  const s2 = applyWeaponShotHeat(s1.state, 25, 0);
  const s3 = applyWeaponShotHeat(s2.state, 25, 0);
  assert.equal(s3.state.heat, 75);
  assert.equal(s3.triggeredOverheat, false);

  // 4th shot hits WEAPON_HEAT_MAX (100) -> triggers Overheat
  const s4 = applyWeaponShotHeat(s3.state, 25, 0);
  assert.equal(s4.triggeredOverheat, true);
  assert.equal(s4.state.isOverheated, true);
  assert.equal(s4.state.heat, WEAPON_HEAT_MAX);
  assert.equal(s4.state.overheatTimer, WEAPON_OVERHEAT_COOLDOWN_SECONDS);

  // Attempting to fire while overheated adds 0 heat and keeps overheated state
  const blocked = applyWeaponShotHeat(s4.state, 25, 0);
  assert.equal(blocked.heatAdded, 0);
  assert.equal(blocked.triggeredOverheat, false);
  assert.equal(blocked.state.isOverheated, true);

  // Stepping cooldown midway shows venting progress without unlocking yet
  const midway = stepWeaponThermalState(s4.state, 1.2, 0);
  assert.equal(midway.justCooledDown, false);
  assert.equal(midway.state.isOverheated, true);
  assert.ok(midway.state.heat > 0 && midway.state.heat < WEAPON_HEAT_MAX);

  // Stepping past remaining cooldown unlocks the weapon at 0 heat
  const unlocked = stepWeaponThermalState(midway.state, 1.3, 0);
  assert.equal(unlocked.justCooledDown, true);
  assert.equal(unlocked.state.isOverheated, false);
  assert.equal(unlocked.state.heat, 0);
  assert.equal(unlocked.state.overheatTimer, 0);

  // Mastery heat reduction reduces per-shot heat build, and cooling bonus accelerates dissipation
  const reduced = applyWeaponShotHeat(createInitialWeaponThermalState(), 25, 0.4);
  assert.equal(reduced.heatAdded, 15);
  assert.equal(reduced.state.heat, 15);

  // After cool delay passes, cooling bonus speeds up normal heat dissipation
  const hotShot = applyWeaponShotHeat(createInitialWeaponThermalState(), 50, 0.4);
  const afterDelay = stepWeaponThermalState(hotShot.state, 0.25, 0.25);
  const cooledFast = stepWeaponThermalState(afterDelay.state, 0.4, 0.25);
  const cooledNormal = stepWeaponThermalState(afterDelay.state, 0.4, 0);
  assert.ok(cooledFast.state.heat > 0 && cooledFast.state.heat < cooledNormal.state.heat);
});

test('weapon mastery awards XP for shots/hits/kills and unlocks passive buffs across tiers', () => {
  let map = createEmptyMasteryMap();
  assert.equal(map.pulse.level, 0);
  assert.equal(map.pulse.xp, 0);

  // 5 shots (+5), 5 hits (+10), 1 kill (+10) = 25 XP -> Level 1 ADEPT
  let res = awardWeaponMasteryXp(map, 'pulse', 'shot', 5);
  map = res.updatedMap;
  res = awardWeaponMasteryXp(map, 'pulse', 'hit', 5);
  map = res.updatedMap;
  assert.equal(map.pulse.xp, 15);
  assert.equal(res.leveledUp, false);

  res = awardWeaponMasteryXp(map, 'pulse', 'kill', 1);
  map = res.updatedMap;
  assert.equal(map.pulse.xp, 25);
  assert.equal(res.leveledUp, true);
  assert.equal(res.previousLevel, 0);
  assert.equal(res.newLevel, 1);
  assert.equal(res.tier.title, 'ADEPT');
  assert.equal(res.tier.heatReduction, 0.12);
  assert.equal(res.tier.critChance, 0.06);

  // Verify higher tier progression (Cyber Apex at 500 XP)
  const apex = getMasteryTierForXp(520);
  assert.equal(apex.level, 5);
  assert.equal(apex.title, 'CYBER APEX');
  assert.equal(apex.nextXp, null);
  assert.equal(apex.progressPercent, 100);
  assert.equal(apex.heatReduction, 0.42);
  assert.equal(apex.critChance, 0.32);

  const perks = formatMasteryPerksSummary(apex);
  assert.deepEqual(perks, ['-42% Heat', '+32% Crit', '+30% Dmg', '+25% Cool']);
});

test('procedural cyber-storm transitions calm -> warning -> storm -> calm and applies localized wind speed modifiers', () => {
  const fixedRand = () => 0.5;
  let storm = createInitialCyberStormState(fixedRand);
  assert.equal(storm.phase, 'calm');
  assert.equal(storm.windZones.length, 0);

  // Advance past calm timer to enter warning phase
  const toWarning = stepCyberStormState(storm, storm.timer + 0.1, 2000, 1400, fixedRand);
  storm = toWarning.state;
  assert.equal(toWarning.phaseChangedTo, 'warning');
  assert.equal(storm.phase, 'warning');
  assert.equal(storm.timer, CYBER_STORM_WARNING_SEC);

  // Advance past warning duration to ignite the Cyber-Storm with wind zones
  const toStorm = stepCyberStormState(storm, CYBER_STORM_WARNING_SEC + 0.1, 2000, 1400, fixedRand);
  storm = toStorm.state;
  assert.equal(toStorm.phaseChangedTo, 'storm');
  assert.equal(storm.phase, 'storm');
  assert.ok(storm.windZones.length >= 3);

  // Step forward inside storm to trigger a lightning strike & bolt
  const strikeStep = stepCyberStormState(storm, storm.nextStrikeTimer + 0.05, 2000, 1400, fixedRand);
  storm = strikeStep.state;
  assert.equal(strikeStep.struckLightning, true);
  assert.ok(storm.lightningBolts.length >= 1);
  assert.ok(storm.flashAlpha > 0);

  // Step past remaining storm duration to return to calm and clear wind zones
  const toCalm = stepCyberStormState(storm, storm.timer + 0.2, 2000, 1400, fixedRand);
  assert.equal(toCalm.phaseChangedTo, 'calm');
  assert.equal(toCalm.state.phase, 'calm');
  assert.equal(toCalm.state.windZones.length, 0);

  // Localized Wind Zone directional speed effect: tailwind boosts, headwind slows
  const eastWindZone = generateCyberStormZones(2000, 1400, 2, fixedRand).map((z, idx) =>
    idx === 0 ? { ...z, x: 500, y: 500, radius: 240, dirAngle: 0, strength: 0.18 } : z
  );
  const tailwind = computeWindZoneMovementEffect(520, 500, 1, 0, eastWindZone);
  assert.equal(tailwind.inWindZone, true);
  assert.ok(tailwind.speedMultiplier > 1.1);
  assert.ok(tailwind.driftVx > 0);
  assert.match(tailwind.windLabel, /TAILWIND/);

  const headwind = computeWindZoneMovementEffect(520, 500, -1, 0, eastWindZone);
  assert.equal(headwind.inWindZone, true);
  assert.ok(headwind.speedMultiplier < 0.9);
  assert.match(headwind.windLabel, /HEADWIND/);

  const outside = computeWindZoneMovementEffect(1200, 1200, 1, 0, [eastWindZone[0]]);
  assert.equal(outside.inWindZone, false);
  assert.equal(outside.speedMultiplier, 1.0);

  const bolt = generateLightningBolt(2000, 1400, fixedRand);
  assert.ok(bolt.points.length >= 6);
});

test('dash overcharge detects imminent threats, doubles dash range, and decays cleanly', () => {
  // No threats -> not perfect timing
  const safeCheck = detectPerfectDashThreat({
    playerX: 500,
    playerY: 500,
    playerRadius: 18,
    enemyProjectiles: [
      // Distant projectile
      { x: 900, y: 500, vx: -200, vy: 0, radius: 6 },
      // Close projectile moving AWAY from player
      { x: 560, y: 500, vx: 300, vy: 0, radius: 6 },
    ],
    enemies: [
      // Distant or KO enemy
      { x: 900, y: 500, radius: 20, type: 'swarmer', state: 'seek', telegraphTimer: 0 },
      { x: 520, y: 500, radius: 20, type: 'swarmer', state: 'ko', telegraphTimer: 0 },
    ],
  });
  assert.equal(safeCheck.isPerfectTiming, false);
  assert.equal(safeCheck.threatType, 'none');

  // Imminent incoming projectile heading toward player -> triggers Perfect Timing
  const projThreat = detectPerfectDashThreat({
    playerX: 500,
    playerY: 500,
    playerRadius: 18,
    enemyProjectiles: [{ x: 585, y: 500, vx: -420, vy: 0, radius: 6 }],
    enemies: [],
  });
  assert.equal(projThreat.isPerfectTiming, true);
  assert.equal(projThreat.threatType, 'projectile');

  // Imminent tank ground slam windup -> triggers Perfect Timing
  const slamThreat = detectPerfectDashThreat({
    playerX: 500,
    playerY: 500,
    playerRadius: 18,
    enemyProjectiles: [],
    enemies: [
      { x: 630, y: 500, radius: 28, type: 'tank', state: 'windup', telegraphTimer: 0.2 },
    ],
  });
  assert.equal(slamThreat.isPerfectTiming, true);
  assert.equal(slamThreat.threatType, 'slam');

  // Imminent swarmer lunge attack -> triggers Perfect Timing
  const lungeThreat = detectPerfectDashThreat({
    playerX: 500,
    playerY: 500,
    playerRadius: 18,
    enemyProjectiles: [],
    enemies: [
      { x: 595, y: 500, radius: 16, type: 'swarmer', state: 'attack', telegraphTimer: 0 },
    ],
  });
  assert.equal(lungeThreat.isPerfectTiming, true);
  assert.equal(lungeThreat.threatType, 'lunge');

  // Overcharged dash doubles total dash range compared to standard dash
  const normalDash = computeDashMotionParams(360, 0.22, false);
  const overchargedDash = computeDashMotionParams(360, 0.22, true);
  assert.equal(normalDash.rangeMultiplier, 1.0);
  assert.equal(overchargedDash.rangeMultiplier, DASH_OVERCHARGE_RANGE_MULT);
  assert.equal(overchargedDash.rangeMultiplier, 2.0);
  assert.ok(Math.abs(overchargedDash.range - normalDash.range * 2) < 0.05);
  assert.ok(DASH_OVERCHARGE_INVULN_SEC >= 0.8);

  // Timer decay
  const mid = stepDashOverchargeState(DASH_OVERCHARGE_DURATION_SEC, 2.5);
  assert.equal(mid.isOvercharged, true);
  assert.equal(mid.remainingSeconds, 2.5);
  assert.equal(mid.percent, 50);

  const expired = stepDashOverchargeState(mid.remainingSeconds, 2.6);
  assert.equal(expired.isOvercharged, false);
  assert.equal(expired.remainingSeconds, 0);
  assert.equal(expired.percent, 0);
});

test('screen-shake scales by heavy weapon tier, boss attack type, and computes quadratic camera offsets & CRT glitch pulse', () => {
  // Light starter weapon vs heavy monster/god-tier weapons
  const pulseShake = getWeaponFireShakeTrauma('pulse', 'starter');
  const beamShake = getWeaponFireShakeTrauma('beam', 'advanced');
  const leviathanShake = getWeaponFireShakeTrauma('leviathan', 'monster');
  const supernovaShake = getWeaponFireShakeTrauma('supernova', 'godtier');

  assert.ok(pulseShake < beamShake);
  assert.ok(beamShake < leviathanShake);
  assert.ok(leviathanShake < supernovaShake);
  assert.ok(supernovaShake >= 0.3);

  // Boss attacks scale powerfully and attenuate gently over distance
  const closeNova = getBossAttackShakeTrauma('goliath_nova', 100);
  const farNova = getBossAttackShakeTrauma('goliath_nova', 1200);
  assert.ok(closeNova > farNova);
  assert.ok(farNova >= 0.32); // retains strong boss presence even across arena

  const barrageShake = getBossAttackShakeTrauma('goliath_barrage', 150);
  const seismicShake = getBossAttackShakeTrauma('behemoth_seismic', 150);
  assert.ok(barrageShake >= 0.25);
  assert.ok(seismicShake >= 0.28);

  // Zero trauma + zero recoil -> zero sample
  const calm = computeCameraShakeSample(0, () => 0.5, 0, 0);
  assert.equal(calm.shakeOffsetX, 0);
  assert.equal(calm.shakeOffsetY, 0);
  assert.equal(calm.shakeAngle, 0);
  assert.equal(calm.glitchAlpha, 0);

  // High trauma -> quadratic jitter, rotational kick, recoil blend, and CRT glitch pulse
  const heavy = computeCameraShakeSample(0.6, () => 1.0, -8, 4);
  assert.ok(heavy.magnitude > 9);
  assert.ok(heavy.shakeOffsetX < heavy.magnitude); // includes -8 recoil
  assert.ok(heavy.shakeOffsetY > heavy.magnitude); // includes +4 recoil
  assert.ok(heavy.shakeAngle > 0);
  assert.ok(heavy.glitchAlpha > 0.1);

  // Reduced anti-lag vibration profiles cap trauma, disable fire-shake, and disable canvas rotation
  const mobileProfile = getCameraShakeProfile('auto', true, 'balanced');
  const turboProfile = getCameraShakeProfile('mobile_turbo', true, 'performance');
  const desktopProfile = getCameraShakeProfile('auto', false, 'high');
  assert.ok(mobileProfile.intensityScale <= 0.1);
  assert.equal(mobileProfile.fireShakeScale, 0);
  assert.equal(mobileProfile.allowCanvasRotation, false);
  assert.equal(mobileProfile.allowGlitchOverlay, false);
  assert.equal(turboProfile.intensityScale, 0);
  assert.equal(turboProfile.fireShakeScale, 0);
  assert.equal(turboProfile.allowCanvasRotation, false);
  assert.ok(desktopProfile.intensityScale <= 0.12);
  assert.equal(desktopProfile.fireShakeScale, 0);
  assert.equal(desktopProfile.allowCanvasRotation, false);

  const reducedSample = computeCameraShakeSample(
    0.6,
    () => 1.0,
    0,
    0,
    mobileProfile.intensityScale,
    mobileProfile.allowCanvasRotation
  );
  assert.equal(reducedSample.shakeAngle, 0);
  assert.ok(reducedSample.magnitude < 1.0);
  assert.equal(reducedSample.glitchAlpha, 0);
});

test('canvas DPR optimization caps high-density screens at 1.5x and viewport culling filters offscreen entities', () => {
  assert.equal(getOptimalCanvasDpr(1), 1);
  assert.equal(getOptimalCanvasDpr(1.25), 1.25);
  assert.equal(getOptimalCanvasDpr(2), 1.5);
  assert.equal(getOptimalCanvasDpr(3), 1.5);
  assert.equal(getOptimalCanvasDpr(0), 1);

  const bounds = computeViewportCullBounds(1100, 800, 1280, 720, 1, 100);
  // Half width = 640 + 100 = 740 => [360..1840], half height = 360 + 100 = 460 => [340..1260]
  assert.equal(bounds.minX, 360);
  assert.equal(bounds.maxX, 1840);
  assert.equal(bounds.minY, 340);
  assert.equal(bounds.maxY, 1260);

  assert.equal(isInViewportBounds(1100, 800, 20, bounds), true);
  assert.equal(isInViewportBounds(350, 800, 20, bounds), true); // radius reaches inside bounds
  assert.equal(isInViewportBounds(100, 800, 20, bounds), false);
  assert.equal(isInViewportBounds(1100, 1400, 20, bounds), false);
});

test('system health telemetry classifies FPS/work status, formats JS heap with non-Chromium fallback, and generates diagnostic hints', () => {
  assert.equal(evaluateSystemHealthStatus(60, 2.5), 'OPTIMAL');
  assert.equal(evaluateSystemHealthStatus(42, 16), 'MODERATE');
  assert.equal(evaluateSystemHealthStatus(24, 18), 'LAGGING');
  assert.equal(evaluateSystemHealthStatus(55, 26), 'LAGGING');

  assert.equal(formatMemoryUsageLabel(null, null), 'N/A (Browser Restricted)');
  assert.equal(formatMemoryUsageLabel(128.44, 2048), '128.4 / 2048 MB');
  assert.equal(formatMemoryUsageLabel(96.2, null), '96.2 MB');

  const optimal = computeSystemHealthSnapshot({
    fps: 59.6,
    avgFrameMs: 16.71,
    workMs: 2.54,
    frameDrops: 0,
    usedJsHeapBytes: 64 * 1024 * 1024,
    jsHeapSizeLimitBytes: 512 * 1024 * 1024,
    activeEnemies: 8,
    activeProjectiles: 14,
    activeParticles: 40,
    activePickups: 3,
    canvasDpr: 1.5,
  });
  assert.equal(optimal.fps, 60);
  assert.equal(optimal.healthStatus, 'OPTIMAL');
  assert.equal(optimal.memoryUsedMb, 64);
  assert.equal(optimal.memoryLimitMb, 512);
  assert.equal(optimal.memoryPercent, 12.5);
  assert.equal(optimal.activeEnemies, 8);
  assert.equal(optimal.activeParticles, 40);
  assert.equal(optimal.canvasDpr, 1.5);
  assert.match(optimal.diagnosticHint, /Smooth 60fps/i);

  const highMem = computeSystemHealthSnapshot({
    fps: 58,
    avgFrameMs: 17.2,
    workMs: 4.0,
    frameDrops: 0,
    usedJsHeapBytes: 420 * 1024 * 1024,
    jsHeapSizeLimitBytes: 512 * 1024 * 1024,
  });
  assert.equal(highMem.healthStatus, 'OPTIMAL');
  assert.match(highMem.diagnosticHint, /Elevated JS heap/i);

  const laggingCpu = computeSystemHealthSnapshot({
    fps: 22,
    avgFrameMs: 45.4,
    workMs: 28.5,
    frameDrops: 8,
    usedJsHeapBytes: null,
    jsHeapSizeLimitBytes: null,
  });
  assert.equal(laggingCpu.healthStatus, 'LAGGING');
  assert.equal(laggingCpu.memoryUsedMb, null);
  assert.equal(laggingCpu.memoryPercent, null);
  assert.match(laggingCpu.diagnosticHint, /Clear FX/i);
});

test('all weapons sustain prolonged continuous fire (>= 7s) before overheating and adaptive quality scales under load', () => {
  for (const w of Object.values(WEAPONS)) {
    const heatPerSec = w.fireRate * w.heatPerShot;
    const secondsToOverheat = WEAPON_HEAT_MAX / heatPerSec;
    assert.ok(
      secondsToOverheat >= 7.0,
      `Expected ${w.id} to fire >= 7.0s before overheat, got ${secondsToOverheat.toFixed(2)}s`
    );
  }

  const high = computeAdaptiveQualityState({ fps: 60, workMs: 3.0, baseDpr: 1.5, activeProjectiles: 12 });
  assert.equal(high.tier, 'high');
  assert.equal(high.effectiveDpr, 1.5);
  assert.equal(high.maxParticlesCap, 320);
  assert.equal(high.drawProjectileTrails, true);

  const balanced = computeAdaptiveQualityState({ fps: 45, workMs: 11.5, baseDpr: 1.5, activeProjectiles: 25 });
  assert.equal(balanced.tier, 'balanced');
  assert.equal(balanced.effectiveDpr, 1.25);
  assert.equal(balanced.maxParticlesCap, 200);

  const perf = computeAdaptiveQualityState({ fps: 28, workMs: 19.0, baseDpr: 1.5, activeProjectiles: 40 });
  assert.equal(perf.tier, 'performance');
  assert.equal(perf.effectiveDpr, 1.0);
  assert.equal(perf.maxParticlesCap, 110);
  assert.equal(perf.drawProjectileTrails, false);
  assert.equal(perf.drawSecondaryGlows, false);
});

test('celebratory claim particle burst spawns variant shapes, spreads under gravity, and expires cleanly', () => {
  let seed = 0.25;
  const deterministicRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const missionBurst = generateCelebrationParticles(320, 240, 'mission', 32, deterministicRand);
  const diamondBurst = generateCelebrationParticles(320, 240, 'diamond', 44, deterministicRand);
  const streakBurst = generateCelebrationParticles(320, 240, 'streak', 30, deterministicRand);

  assert.equal(missionBurst.length, 32);
  assert.equal(diamondBurst.length, 44);
  assert.equal(streakBurst.length, 30);

  // Diamond burst prioritizes diamond & star shapes with cyan/violet palette
  const diamondShapes = diamondBurst.filter((p) => p.shape === 'diamond').length;
  assert.ok(diamondShapes >= 20, `Expected diamond burst to favor diamond shapes, got ${diamondShapes}`);

  // Step forward 0.1s -> particles spread outward from origin and remain alive
  let stepped = stepCelebrationParticles(missionBurst, 0.05);
  stepped = stepCelebrationParticles(stepped, 0.05);
  assert.equal(stepped.length, 32);
  const movedOutward = stepped.some((p) => Math.hypot(p.x - 320, p.y - 240) > 10);
  assert.equal(movedOutward, true);

  // Step forward past maxLife (e.g., 40 * 0.05 = 2.0s) -> all particles expire
  for (let i = 0; i < 45; i++) {
    stepped = stepCelebrationParticles(stepped, 0.05);
  }
  assert.equal(stepped.length, 0);
});

test('mobile DPR capping, mobile_turbo quality preset, and idle canvas throttling prevent mobile GPU overload', () => {
  // Desktop retains up to 1.5x, mobile auto caps at MOBILE_MAX_CANVAS_DPR (1.0x), mobile_turbo forces 1.0x
  assert.equal(getOptimalCanvasDpr(3, false, 'auto'), 1.5);
  assert.equal(getOptimalCanvasDpr(3, true, 'auto'), MOBILE_MAX_CANVAS_DPR);
  assert.equal(MOBILE_MAX_CANVAS_DPR, 1.0);
  assert.equal(getOptimalCanvasDpr(3, true, 'mobile_turbo'), 1);
  assert.equal(getOptimalCanvasDpr(3, true, 'high'), 1.5);

  // Mobile auto scales down earlier under moderate load and simplifies pickups / particle caps without mid-game DPR resize
  const mobileBalanced = computeAdaptiveQualityState({
    fps: 50,
    workMs: 8.5,
    baseDpr: MOBILE_MAX_CANVAS_DPR,
    activeProjectiles: 16,
    isMobile: true,
    mode: 'auto',
  });
  assert.equal(mobileBalanced.tier, 'balanced');
  assert.equal(mobileBalanced.effectiveDpr, 1.0);
  assert.equal(mobileBalanced.simplifyPickups, true);
  assert.ok(mobileBalanced.maxParticlesCap <= 120);

  // Mobile turbo locks lowest-latency settings regardless of FPS
  const turbo = computeAdaptiveQualityState({
    fps: 60,
    workMs: 2.0,
    baseDpr: 1.5,
    activeProjectiles: 5,
    isMobile: true,
    mode: 'mobile_turbo',
  });
  assert.equal(turbo.tier, 'performance');
  assert.equal(turbo.effectiveDpr, 1.0);
  assert.equal(turbo.drawProjectileTrails, false);
  assert.equal(turbo.drawSecondaryGlows, false);
  assert.equal(turbo.simplifyPickups, true);
  assert.equal(turbo.skipAtmosphericOverlay, true);
  assert.ok(turbo.maxFloatingTexts <= 18);

  // Occluded background menus and hidden tabs pause/throttle canvas work
  assert.equal(shouldThrottleCanvasRender({ gameState: 'playing', overlayCoveringCanvas: false, isTabHidden: true }), 'pause');
  assert.equal(shouldThrottleCanvasRender({ gameState: 'title', overlayCoveringCanvas: true }), 'throttle');
  assert.equal(shouldThrottleCanvasRender({ gameState: 'paused', overlayCoveringCanvas: false }), 'throttle');
  assert.equal(shouldThrottleCanvasRender({ gameState: 'playing', overlayCoveringCanvas: false }), 'full');
});

test('Shield-Breaker enemy scales cleanly from Level 3+ and resolves Kinetic Barrier bypass vs absorption', () => {
  assert.ok(getEnemyBasePoints('shield_breaker') >= 500);
  assert.equal(getEnemyBudgetCost('shield_breaker'), 420);

  const lvl5Stats = calculateEnemyStats('shield_breaker', 5, 2, 'normal');
  assert.ok(lvl5Stats.hp > 0);
  assert.ok(lvl5Stats.projectileDamage > 0);
  assert.ok(lvl5Stats.slamDamage > 0);

  const coins = calculateEnemyCoinDrop('shield_breaker');
  assert.equal(coins.count * coins.value, 14);

  // Level 1 stays swarmer; Level 2 Wave 2+ and Level 3+ spawn shield_breaker when roll & budget fit
  assert.equal(selectEnemyArchetype(1, 1000, () => 0.82, 1), 'swarmer');
  assert.equal(selectEnemyArchetype(2, 1000, () => 0.82, 2), 'shield_breaker');
  assert.equal(selectEnemyArchetype(1, 1000, () => 0.82, 3), 'shield_breaker');
  assert.equal(selectEnemyArchetype(1, 1000, () => 0.38, 6), 'shield_breaker');

  // Weapon bypass classification
  assert.equal(isBarrierBypassWeapon('beam'), true);
  assert.equal(isBarrierBypassWeapon('void_rail'), true);
  assert.equal(isBarrierBypassWeapon('hyperion_astral'), true);
  assert.equal(isBarrierBypassWeapon('pulse'), false);
  assert.equal(isBarrierBypassWeapon('scatter'), false);

  const barrierMax = computeShieldBreakerBarrierHp(100);
  assert.equal(barrierMax, 115);

  // Standard weapon is mitigated (25% hull, drains barrier)
  const pulseHit = resolveShieldBreakerImpact({
    rawDamage: 40,
    weaponType: 'pulse',
    barrierHp: barrierMax,
  });
  assert.equal(pulseHit.bypassed, false);
  assert.equal(pulseHit.resisted, true);
  assert.equal(pulseHit.hullDamage, 10);
  assert.equal(pulseHit.barrierDamage, 34);
  assert.equal(pulseHit.nextBarrierHp, 81);
  assert.equal(pulseHit.barrierShattered, false);

  // Beam / Rail weapon bypasses kinetic barrier directly (+25% armor-pierce damage)
  const beamHit = resolveShieldBreakerImpact({
    rawDamage: 80,
    weaponType: 'beam',
    barrierHp: 81,
  });
  assert.equal(beamHit.bypassed, true);
  assert.equal(beamHit.resisted, false);
  assert.equal(beamHit.hullDamage, 100);
  assert.equal(beamHit.barrierDamage, 28);
  assert.equal(beamHit.nextBarrierHp, 53);

  // Heavy standard hit can overload & shatter remaining barrier; subsequent hits deal 100% hull damage
  const shatterHit = resolveShieldBreakerImpact({
    rawDamage: 80,
    weaponType: 'pulse',
    barrierHp: 20,
  });
  assert.equal(shatterHit.nextBarrierHp, 0);
  assert.equal(shatterHit.barrierShattered, true);

  const postShatterHit = resolveShieldBreakerImpact({
    rawDamage: 40,
    weaponType: 'pulse',
    barrierHp: 0,
  });
  assert.equal(postShatterHit.hullDamage, 40);
  assert.equal(postShatterHit.resisted, false);
});

test('Touch controls stick deadzone, manual aim stick threshold, and weapon cycling helpers work cleanly', () => {
  // Deadzone suppresses micro-jitter (< 12% of 42px = 5.04px)
  const dead = computeTouchStickVector(3, 2, 42, 0.12);
  assert.equal(dead.normX, 0);
  assert.equal(dead.normY, 0);
  assert.equal(dead.magnitude, 0);

  // Full outer push clamps knob radius & normalizes vector cleanly
  const full = computeTouchStickVector(120, 0, 42, 0.12);
  assert.equal(full.knobX, 42);
  assert.equal(full.knobY, 0);
  assert.ok(Math.abs(full.normX - 1) < 1e-6);
  assert.equal(full.magnitude, 1);

  // Manual aim pad stays inactive inside 12px threshold, activates outside
  const idleAim = computeTouchAimVector(4, -5, 12);
  assert.equal(idleAim.active, false);
  assert.equal(idleAim.angle, null);

  const southAim = computeTouchAimVector(0, 28, 12);
  assert.equal(southAim.active, true);
  assert.ok(southAim.angle !== null && Math.abs(southAim.angle - Math.PI / 2) < 1e-6);
  assert.equal(southAim.knobY, 22);

  // Weapon cycling skips locked weapons forward and backward cleanly
  const unlocked = {
    pulse: true,
    scatter: false,
    beam: true,
    void_rail: true,
  };
  assert.equal(getNextUnlockedWeapon('pulse', unlocked, WEAPON_ORDER, 1), 'beam');
  assert.equal(getNextUnlockedWeapon('beam', unlocked, WEAPON_ORDER, 1), 'void_rail');
  assert.equal(getNextUnlockedWeapon('void_rail', unlocked, WEAPON_ORDER, 1), 'pulse');
  assert.equal(getNextUnlockedWeapon('pulse', unlocked, WEAPON_ORDER, -1), 'void_rail');
});

test('pending combat progress buffer batches multi-kills & coin pickups cleanly without per-kill disk flushes', () => {
  const buf = createPendingCombatProgressBuffer();
  assert.equal(buf.dirty, false);

  accumulatePendingKillProgress(buf, 'swarmer', 3, 2);
  accumulatePendingKillProgress(buf, 'shield_breaker', 7, 2);
  accumulatePendingKillProgress(buf, 'phantom', 4, 2);
  accumulatePendingKillProgress(buf, 'storm_drone', 9, 2);
  accumulatePendingKillProgress(buf, 'goliath', 12, 3);
  accumulatePendingCoinProgress(buf, 45);
  accumulatePendingCoinProgress(buf, 30);

  assert.equal(buf.dirty, true);
  assert.equal(buf.missionKillsTotal, 5);
  assert.equal(buf.missionKillsSwarmer, 1);
  assert.equal(buf.missionKillsTank, 1);
  assert.equal(buf.missionKillsPhantom, 1);
  assert.equal(buf.missionKillsSniper, 1);
  assert.equal(buf.missionKillsBoss, 1);
  assert.equal(buf.achKills, 5);
  assert.equal(buf.achBehemoth, 1);
  assert.equal(buf.achPhantom, 1);
  assert.equal(buf.achStormDrone, 1);
  assert.equal(buf.achBossLevel, 3);
  assert.equal(buf.eventMaxCombo, 12);
  assert.equal(buf.achMaxCombo, 12);
  assert.equal(buf.missionCoinsCollected, 75);
  assert.equal(buf.eventCoinsCollected, 75);
  assert.equal(buf.achCoins, 75);
});

test('COMBO_FINISHER_HITSTOP is zero and computeMultiKillFrameFxBudget progressively caps bursts & text', () => {
  assert.equal(COMBO_FINISHER_HITSTOP, 0);

  const kill1High = computeMultiKillFrameFxBudget(1, 'high');
  assert.equal(kill1High.burstCount, 12);
  assert.equal(kill1High.spawnScoreText, true);
  assert.equal(kill1High.spawnCoinText, true);

  const kill3High = computeMultiKillFrameFxBudget(3, 'high');
  assert.equal(kill3High.burstCount, 5);
  assert.equal(kill3High.spawnScoreText, true);
  assert.equal(kill3High.spawnCoinText, false);

  const kill7High = computeMultiKillFrameFxBudget(7, 'high');
  assert.equal(kill7High.burstCount, 2);
  assert.equal(kill7High.spawnScoreText, false);
  assert.equal(kill7High.spawnCoinText, false);

  const kill1Perf = computeMultiKillFrameFxBudget(1, 'performance');
  assert.equal(kill1Perf.burstCount, 6);
  const kill7Perf = computeMultiKillFrameFxBudget(7, 'performance');
  assert.equal(kill7Perf.burstCount, 1);
  assert.equal(kill7Perf.spawnScoreText, false);
  assert.equal(kill7Perf.spawnCoinText, false);
});

test('wrapAngleSafe handles Infinity/NaN in O(1) and computeSafePullDelta avoids NaN at zero distance', () => {
  assert.equal(wrapAngleSafe(Number.POSITIVE_INFINITY), 0);
  assert.equal(wrapAngleSafe(Number.NEGATIVE_INFINITY), 0);
  assert.equal(wrapAngleSafe(Number.NaN), 0);
  assert.ok(Math.abs(wrapAngleSafe(Math.PI * 3) - Math.PI) < 1e-6 || Math.abs(wrapAngleSafe(Math.PI * 3) + Math.PI) < 1e-6);
  assert.ok(Math.abs(wrapAngleSafe(-Math.PI * 1.5) - Math.PI / 2) < 1e-6);

  // Zero distance must never produce NaN from 0 / 0
  const zeroPull = computeSafePullDelta(0, 0, 260, 480, 0.016);
  assert.equal(zeroPull.x, 0);
  assert.equal(zeroPull.y, 0);

  const nanPull = computeSafePullDelta(Number.NaN, 10, 260, 480, 0.016);
  assert.equal(nanPull.x, 0);
  assert.equal(nanPull.y, 0);

  const validPull = computeSafePullDelta(100, 0, 260, 480, 0.016);
  assert.ok(Number.isFinite(validPull.x) && validPull.x > 0);
  assert.equal(validPull.y, 0);
});

test('collectChainDetonatedBarrels resolves multi-hop barrel chains cleanly without duplicate or undefined entries', () => {
  const barrels = [
    { id: 1, x: 100, y: 100, radius: 18 },
    { id: 2, x: 240, y: 100, radius: 18 },
    { id: 3, x: 390, y: 100, radius: 18 },
    { id: 4, x: 900, y: 900, radius: 18 },
  ];
  const chain = collectChainDetonatedBarrels(barrels[0], barrels, () => 180);
  assert.deepEqual(
    chain.map((b) => b.id),
    [1, 2, 3]
  );
});
