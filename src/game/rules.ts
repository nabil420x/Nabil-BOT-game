import {
  PlayerStats,
  WeaponType,
  WeaponTier,
  EnemyType,
  SpawnPatternType,
  PatternSpawnPoint,
  DamageCategory,
  DamageStyle,
  DifficultyMode,
  DifficultyModifier,
  WeaponThermalState,
  WindZone,
  LightningBolt,
  CyberStormPhase,
} from './types';
import { WEAPONS } from './weapons';
export type { SpawnPatternType, PatternSpawnPoint, DamageCategory, DamageStyle, DifficultyMode, DifficultyModifier };

export const DIFFICULTY_STORAGE_KEY = 'nabilbot_difficulty';

export const DIFFICULTY_MODIFIERS: Record<DifficultyMode, DifficultyModifier> = {
  easy: {
    id: 'easy',
    label: 'EASY',
    subtitle: 'Cadet Protocol · Reduced Threat',
    spawnRateMultiplier: 0.75,
    spawnDelayMultiplier: 1.35,
    damageMultiplier: 0.7,
    maxSimultaneousOffset: -1,
    budgetMultiplier: 0.85,
    color: '#00ff88',
  },
  normal: {
    id: 'normal',
    label: 'NORMAL',
    subtitle: 'Standard Cyber Protocol',
    spawnRateMultiplier: 1.0,
    spawnDelayMultiplier: 1.0,
    damageMultiplier: 1.0,
    maxSimultaneousOffset: 0,
    budgetMultiplier: 1.0,
    color: '#00f3ff',
  },
  nightmare: {
    id: 'nightmare',
    label: 'NIGHTMARE',
    subtitle: 'Apex Overload · Lethal Swarm',
    spawnRateMultiplier: 1.6,
    spawnDelayMultiplier: 0.625,
    damageMultiplier: 1.5,
    maxSimultaneousOffset: 3,
    budgetMultiplier: 1.35,
    color: '#ff0055',
  },
};

export function getDifficultyModifier(mode: DifficultyMode = 'normal'): DifficultyModifier {
  return DIFFICULTY_MODIFIERS[mode] || DIFFICULTY_MODIFIERS.normal;
}

export function loadDifficultyMode(): DifficultyMode {
  if (typeof window === 'undefined') return 'normal';
  try {
    const raw = localStorage.getItem(DIFFICULTY_STORAGE_KEY);
    if (raw === 'easy' || raw === 'normal' || raw === 'nightmare') {
      return raw;
    }
  } catch {
    // ignore storage read error
  }
  return 'normal';
}

export function saveDifficultyMode(mode: DifficultyMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DIFFICULTY_STORAGE_KEY, mode);
  } catch {
    // ignore storage write error
  }
}

/**
 * Checks if two circles collide
 */
export function checkCircleCollision(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distSq = dx * dx + dy * dy;
  const radSum = r1 + r2;
  return distSq <= radSum * radSum;
}

/**
 * Normalizes angle to [-PI, PI]
 */
export function normalizeAngle(rad: number): number {
  let a = rad % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

/**
 * Checks if an incoming projectile hit is blocked by a directional front shield
 */
export function checkShieldBlock(
  enemyX: number,
  enemyY: number,
  shieldFacingAngle: number,
  shieldArcRadians: number,
  projectileOriginX: number,
  projectileOriginY: number
): boolean {
  // Vector from enemy to projectile origin
  const attackAngle = Math.atan2(projectileOriginY - enemyY, projectileOriginX - enemyX);
  const diff = Math.abs(normalizeAngle(attackAngle - shieldFacingAngle));
  return diff <= shieldArcRadians / 2;
}

/**
 * Calculates combo multiplier based on streak count
 */
export function getComboMultiplier(streak: number): number {
  if (streak < 3) return 1.0;
  if (streak < 7) return 1.5;
  if (streak < 12) return 2.0;
  if (streak < 20) return 2.5;
  if (streak < 30) return 3.0;
  if (streak < 45) return 4.0;
  return 5.0;
}

/**
 * Calculates score from a kill event
 */
export function calculateKillScore(
  baseEnemyPoints: number,
  streak: number,
  wave: number
): number {
  const multiplier = getComboMultiplier(streak);
  const waveBonus = 1 + (wave - 1) * 0.15;
  return Math.round(baseEnemyPoints * multiplier * waveBonus);
}

/**
 * Calculates enemy base points
 */
export function getEnemyBasePoints(type: EnemyType): number {
  switch (type) {
    case 'swarmer':
      return 100;
    case 'sniper':
      return 250;
    case 'storm_drone':
      return 350;
    case 'tank':
      return 400;
    case 'phantom':
      return 500;
    case 'shield_breaker':
      return 550;
    case 'behemoth':
      return 850;
    case 'goliath':
      return 1500;
  }
}

export interface EnemySpawnStats {
  hp: number;
  speed: number;
  contactDamage: number;
  telegraphDuration: number;
  projectileDamage: number;
  projectileSpeed: number;
  slamDamage: number;
}

/**
 * Returns baseline difficulty scaling parameters by level (1 to 12)
 * Tuned with extra accessibility and forgiving health/damage pools
 */
export function getLevelDifficultyParameters(level: number): {
  hpMult: number;
  speedMult: number;
  damageMult: number;
  telegraphMult: number;
  spawnDelaySec: number;
  maxSimultaneous: number;
} {
  const lvl = Math.max(1, Math.min(100, level));
  if (lvl >= 61) {
    const step = lvl - 60;
    return {
      hpMult: Number((3.15 + step * 0.035).toFixed(2)),
      speedMult: Number((1.62 + step * 0.005).toFixed(2)),
      damageMult: Number((2.06 + step * 0.015).toFixed(2)),
      telegraphMult: Number(Math.max(0.32, 0.40 - Math.floor(step / 5) * 0.01).toFixed(2)),
      spawnDelaySec: Number(Math.max(0.22, 0.28 - step * 0.0015).toFixed(2)),
      maxSimultaneous: 18,
    };
  }
  if (lvl >= 41) {
    const step = lvl - 40;
    return {
      hpMult: Number((2.35 + step * 0.04).toFixed(2)),
      speedMult: Number((1.42 + step * 0.01).toFixed(2)),
      damageMult: Number((1.66 + step * 0.02).toFixed(2)),
      telegraphMult: Number(Math.max(0.40, 0.48 - Math.ceil(step / 2.5) * 0.01).toFixed(2)),
      spawnDelaySec: Number(Math.max(0.28, 0.36 - step * 0.004).toFixed(2)),
      maxSimultaneous: lvl >= 59 ? 18 : lvl >= 47 ? 17 : 16,
    };
  }
  switch (lvl) {
    // --- DHAKA CYBER METROPOLIS (Levels 1 - 7, Extra Easy Onboarding) ---
    case 1:
      return {
        hpMult: 0.16,
        speedMult: 0.42,
        damageMult: 0.10,
        telegraphMult: 2.10,
        spawnDelaySec: 2.7,
        maxSimultaneous: 2,
      };
    case 2:
      return {
        hpMult: 0.19,
        speedMult: 0.46,
        damageMult: 0.18,
        telegraphMult: 1.95,
        spawnDelaySec: 2.5,
        maxSimultaneous: 2,
      };
    case 3:
      return {
        hpMult: 0.23,
        speedMult: 0.50,
        damageMult: 0.20,
        telegraphMult: 1.82,
        spawnDelaySec: 2.3,
        maxSimultaneous: 3,
      };
    case 4:
      return {
        hpMult: 0.27,
        speedMult: 0.54,
        damageMult: 0.24,
        telegraphMult: 1.70,
        spawnDelaySec: 2.15,
        maxSimultaneous: 3,
      };
    case 5:
      return {
        hpMult: 0.31,
        speedMult: 0.58,
        damageMult: 0.27,
        telegraphMult: 1.58,
        spawnDelaySec: 2.0,
        maxSimultaneous: 3,
      };
    case 6:
      return {
        hpMult: 0.34,
        speedMult: 0.61,
        damageMult: 0.30,
        telegraphMult: 1.48,
        spawnDelaySec: 1.9,
        maxSimultaneous: 4,
      };
    case 7:
      return {
        hpMult: 0.38,
        speedMult: 0.64,
        damageMult: 0.34,
        telegraphMult: 1.40,
        spawnDelaySec: 1.8,
        maxSimultaneous: 4,
      };

    // --- RAJSHAHI CARTOON BIOSPHERE (Levels 8 - 10 Extra Easy; 11+ Standard) ---
    case 8:
      return {
        hpMult: 0.42,
        speedMult: 0.67,
        damageMult: 0.37,
        telegraphMult: 1.35,
        spawnDelaySec: 1.7,
        maxSimultaneous: 4,
      };
    case 9:
      return {
        hpMult: 0.46,
        speedMult: 0.70,
        damageMult: 0.40,
        telegraphMult: 1.30,
        spawnDelaySec: 1.6,
        maxSimultaneous: 4,
      };
    case 10:
      return {
        hpMult: 0.50,
        speedMult: 0.72,
        damageMult: 0.44,
        telegraphMult: 1.25,
        spawnDelaySec: 1.5,
        maxSimultaneous: 5,
      };
    case 11:
      return {
        hpMult: 0.90,
        speedMult: 0.94,
        damageMult: 0.84,
        telegraphMult: 1.00,
        spawnDelaySec: 1.1,
        maxSimultaneous: 6,
      };
    case 12:
      return {
        hpMult: 0.96,
        speedMult: 0.96,
        damageMult: 0.88,
        telegraphMult: 0.98,
        spawnDelaySec: 1.05,
        maxSimultaneous: 7,
      };
    case 13:
      return {
        hpMult: 1.02,
        speedMult: 0.98,
        damageMult: 0.92,
        telegraphMult: 0.95,
        spawnDelaySec: 1.0,
        maxSimultaneous: 7,
      };
    case 14:
      return {
        hpMult: 1.10,
        speedMult: 1.00,
        damageMult: 0.96,
        telegraphMult: 0.92,
        spawnDelaySec: 0.95,
        maxSimultaneous: 8,
      };

    // --- CHATTOGRAM NAVAL CITADEL (Levels 15 - 21) ---
    case 15:
      return {
        hpMult: 1.15,
        speedMult: 1.02,
        damageMult: 1.00,
        telegraphMult: 0.90,
        spawnDelaySec: 0.92,
        maxSimultaneous: 7,
      };
    case 16:
      return {
        hpMult: 1.20,
        speedMult: 1.05,
        damageMult: 1.04,
        telegraphMult: 0.88,
        spawnDelaySec: 0.88,
        maxSimultaneous: 8,
      };
    case 17:
      return {
        hpMult: 1.26,
        speedMult: 1.08,
        damageMult: 1.08,
        telegraphMult: 0.85,
        spawnDelaySec: 0.84,
        maxSimultaneous: 8,
      };
    case 18:
      return {
        hpMult: 1.32,
        speedMult: 1.10,
        damageMult: 1.12,
        telegraphMult: 0.82,
        spawnDelaySec: 0.80,
        maxSimultaneous: 8,
      };
    case 19:
      return {
        hpMult: 1.38,
        speedMult: 1.12,
        damageMult: 1.16,
        telegraphMult: 0.80,
        spawnDelaySec: 0.75,
        maxSimultaneous: 9,
      };
    case 20:
      return {
        hpMult: 1.44,
        speedMult: 1.15,
        damageMult: 1.20,
        telegraphMult: 0.78,
        spawnDelaySec: 0.72,
        maxSimultaneous: 9,
      };
    case 21:
      return {
        hpMult: 1.52,
        speedMult: 1.18,
        damageMult: 1.25,
        telegraphMult: 0.75,
        spawnDelaySec: 0.68,
        maxSimultaneous: 10,
      };

    // --- SYLHET CELESTIAL HIGHLANDS (Levels 22 - 28) ---
    case 22:
      return {
        hpMult: 1.56,
        speedMult: 1.20,
        damageMult: 1.28,
        telegraphMult: 0.73,
        spawnDelaySec: 0.65,
        maxSimultaneous: 10,
      };
    case 23:
      return {
        hpMult: 1.60,
        speedMult: 1.21,
        damageMult: 1.30,
        telegraphMult: 0.72,
        spawnDelaySec: 0.62,
        maxSimultaneous: 10,
      };
    case 24:
      return {
        hpMult: 1.64,
        speedMult: 1.22,
        damageMult: 1.32,
        telegraphMult: 0.70,
        spawnDelaySec: 0.60,
        maxSimultaneous: 11,
      };
    case 25:
      return {
        hpMult: 1.68,
        speedMult: 1.23,
        damageMult: 1.34,
        telegraphMult: 0.68,
        spawnDelaySec: 0.58,
        maxSimultaneous: 11,
      };
    case 26:
      return {
        hpMult: 1.71,
        speedMult: 1.24,
        damageMult: 1.36,
        telegraphMult: 0.67,
        spawnDelaySec: 0.55,
        maxSimultaneous: 12,
      };
    case 27:
      return {
        hpMult: 1.75,
        speedMult: 1.25,
        damageMult: 1.38,
        telegraphMult: 0.65,
        spawnDelaySec: 0.52,
        maxSimultaneous: 12,
      };
    case 28:
      return {
        hpMult: 1.80,
        speedMult: 1.28,
        damageMult: 1.40,
        telegraphMult: 0.62,
        spawnDelaySec: 0.50,
        maxSimultaneous: 13,
      };

    // --- SUNDARBANS MANGROVE NEXUS (Levels 29 - 34) ---
    case 29:
      return {
        hpMult: 1.86,
        speedMult: 1.30,
        damageMult: 1.43,
        telegraphMult: 0.60,
        spawnDelaySec: 0.48,
        maxSimultaneous: 13,
      };
    case 30:
      return {
        hpMult: 1.92,
        speedMult: 1.31,
        damageMult: 1.46,
        telegraphMult: 0.59,
        spawnDelaySec: 0.47,
        maxSimultaneous: 13,
      };
    case 31:
      return {
        hpMult: 1.98,
        speedMult: 1.32,
        damageMult: 1.49,
        telegraphMult: 0.58,
        spawnDelaySec: 0.46,
        maxSimultaneous: 14,
      };
    case 32:
      return {
        hpMult: 2.04,
        speedMult: 1.33,
        damageMult: 1.52,
        telegraphMult: 0.56,
        spawnDelaySec: 0.45,
        maxSimultaneous: 14,
      };
    case 33:
      return {
        hpMult: 2.08,
        speedMult: 1.34,
        damageMult: 1.54,
        telegraphMult: 0.55,
        spawnDelaySec: 0.44,
        maxSimultaneous: 14,
      };
    case 34:
      return {
        hpMult: 2.12,
        speedMult: 1.35,
        damageMult: 1.56,
        telegraphMult: 0.54,
        spawnDelaySec: 0.43,
        maxSimultaneous: 15,
      };

    // --- COX'S BAZAR ORBITAL ELEVATOR (Levels 35 - 40) ---
    case 35:
      return {
        hpMult: 2.16,
        speedMult: 1.36,
        damageMult: 1.58,
        telegraphMult: 0.53,
        spawnDelaySec: 0.42,
        maxSimultaneous: 14,
      };
    case 36:
      return {
        hpMult: 2.20,
        speedMult: 1.37,
        damageMult: 1.60,
        telegraphMult: 0.52,
        spawnDelaySec: 0.41,
        maxSimultaneous: 15,
      };
    case 37:
      return {
        hpMult: 2.24,
        speedMult: 1.38,
        damageMult: 1.61,
        telegraphMult: 0.51,
        spawnDelaySec: 0.40,
        maxSimultaneous: 15,
      };
    case 38:
      return {
        hpMult: 2.28,
        speedMult: 1.39,
        damageMult: 1.62,
        telegraphMult: 0.50,
        spawnDelaySec: 0.39,
        maxSimultaneous: 15,
      };
    case 39:
      return {
        hpMult: 2.31,
        speedMult: 1.40,
        damageMult: 1.64,
        telegraphMult: 0.49,
        spawnDelaySec: 0.38,
        maxSimultaneous: 16,
      };
    case 40:
    default:
      return {
        hpMult: 2.35,
        speedMult: 1.42,
        damageMult: 1.66,
        telegraphMult: 0.48,
        spawnDelaySec: 0.36,
        maxSimultaneous: 16,
      };
  }
}

/**
 * Computes exact enemy attributes scaled by level and wave
 */
export function calculateEnemyStats(
  type: EnemyType,
  level: number,
  wave: number = 1,
  difficulty: DifficultyMode = 'normal'
): EnemySpawnStats {
  const params = getLevelDifficultyParameters(level);
  const diffMod = getDifficultyModifier(difficulty);
  const waveBonus = Math.max(0, (wave - 1) * 0.04);

  let baseHp = 25;
  let baseSpeed = 180;
  let baseContactDamage = 12;
  let baseTelegraph = 0.40;
  let baseProjDamage = 0;
  let baseProjSpeed = 0;
  let baseSlamDamage = 0;

  switch (type) {
    case 'swarmer':
      baseHp = 24; // Engaging agile drone
      baseSpeed = 185;
      baseContactDamage = 14;
      baseTelegraph = 0.45;
      break;
    case 'sniper':
      baseHp = 45; // Tactical kiting sniper with dangerous laser bolt
      baseSpeed = 145;
      baseContactDamage = 12;
      baseTelegraph = 0.65;
      baseProjDamage = 24;
      baseProjSpeed = 650;
      break;
    case 'storm_drone':
      baseHp = 50; // Dynamic high-speed shock orb drone
      baseSpeed = 160;
      baseContactDamage = 14;
      baseTelegraph = 0.45;
      baseProjDamage = 18;
      baseProjSpeed = 490;
      break;
    case 'tank':
      baseHp = 75; // Resilient cyber enforcer
      baseSpeed = 95;
      baseContactDamage = 14;
      baseTelegraph = 0.75;
      baseSlamDamage = 16;
      break;
    case 'phantom':
      baseHp = 42; // Fast cloaking assassin
      baseSpeed = 210;
      baseContactDamage = 18;
      baseTelegraph = 0.40;
      break;
    case 'shield_breaker':
      baseHp = 85; // Armored kinetic-barrier sentinel weak to Beam/Rail bypass
      baseSpeed = 125;
      baseContactDamage = 18;
      baseTelegraph = 0.60;
      baseProjDamage = 20;
      baseProjSpeed = 520;
      baseSlamDamage = 16;
      break;
    case 'behemoth':
      baseHp = 120; // Heavy siege walker with shockwave power
      baseSpeed = 85;
      baseContactDamage = 20;
      baseTelegraph = 0.75;
      baseSlamDamage = 22;
      baseProjDamage = 20;
      baseProjSpeed = 420;
      break;
    case 'goliath':
      baseHp = 360; // Formidable sector boss
      baseSpeed = 80;
      baseContactDamage = 28;
      baseTelegraph = 0.80;
      baseProjDamage = 22;
      baseProjSpeed = 340;
      break;
  }

  const effectiveHp = Math.round(baseHp * (params.hpMult + waveBonus));
  const effectiveSpeed = Math.round(baseSpeed * params.speedMult);
  const effectiveContactDamage = Math.max(
    1,
    Math.round(baseContactDamage * params.damageMult * diffMod.damageMultiplier)
  );
  const effectiveTelegraph = Number((baseTelegraph * params.telegraphMult).toFixed(2));
  const effectiveProjDamage =
    baseProjDamage > 0
      ? Math.max(1, Math.round(baseProjDamage * params.damageMult * diffMod.damageMultiplier))
      : 0;
  const effectiveProjSpeed = Math.round(baseProjSpeed * Math.min(1.2, params.speedMult));
  const effectiveSlamDamage =
    baseSlamDamage > 0
      ? Math.max(1, Math.round(baseSlamDamage * params.damageMult * diffMod.damageMultiplier))
      : 0;

  return {
    hp: effectiveHp,
    speed: effectiveSpeed,
    contactDamage: effectiveContactDamage,
    telegraphDuration: effectiveTelegraph,
    projectileDamage: effectiveProjDamage,
    projectileSpeed: effectiveProjSpeed,
    slamDamage: effectiveSlamDamage,
  };
}

/**
 * Computes difficulty spawn budget for a wave, level, and DifficultyMode
 */
export function calculateWaveBudget(
  wave: number,
  level: number = 1,
  difficulty: DifficultyMode = 'normal'
): {
  totalBudget: number;
  maxSimultaneous: number;
  spawnDelaySec: number;
} {
  const params = getLevelDifficultyParameters(level);
  const diffMod = getDifficultyModifier(difficulty);
  const clampedWave = Math.max(1, wave);
  const baseTotalBudget = 400 + (level - 1) * 220 + (clampedWave - 1) * 260;

  return {
    totalBudget: Math.round(baseTotalBudget * diffMod.budgetMultiplier),
    maxSimultaneous: Math.max(2, params.maxSimultaneous + diffMod.maxSimultaneousOffset),
    spawnDelaySec: Number(Math.max(0.22, params.spawnDelaySec * diffMod.spawnDelayMultiplier).toFixed(3)),
  };
}

/**
 * Cost of each enemy type against the wave budget
 */
export function getEnemyBudgetCost(type: EnemyType): number {
  switch (type) {
    case 'swarmer':
      return 100;
    case 'sniper':
      return 200;
    case 'storm_drone':
      return 260;
    case 'tank':
      return 350;
    case 'phantom':
      return 380;
    case 'shield_breaker':
      return 420;
    case 'behemoth':
      return 650;
    case 'goliath':
      return 1200;
  }
}

/**
 * Chooses an enemy type given current wave, level, and remaining budget
 */
export function selectEnemyArchetype(
  wave: number,
  remainingBudget: number,
  rand: () => number = Math.random,
  level: number = 1
): EnemyType {
  // If Level 1: ALWAYS swarmer for approachable onboarding
  if (level === 1) {
    return 'swarmer';
  }

  // Boss spawns on regional apex levels (7, 14, 21, 28, 34, 40, 50, 55, 60, 70, 75, 80, 85, 90, 95, 100) if budget permits
  if (
    (level === 7 ||
      level === 14 ||
      level === 21 ||
      level === 28 ||
      level === 34 ||
      level === 40 ||
      level === 50 ||
      level === 55 ||
      level === 60 ||
      level === 70 ||
      level === 75 ||
      level === 80 ||
      level === 85 ||
      level === 90 ||
      level === 95 ||
      level === 100) &&
    remainingBudget >= getEnemyBudgetCost('goliath')
  ) {
    if (rand() < 0.25) return 'goliath';
  }

  const r = rand();

  if (level === 2) {
    if (wave >= 2 && r >= 0.72 && remainingBudget >= getEnemyBudgetCost('shield_breaker')) {
      return 'shield_breaker';
    }
    // 70% swarmer, 30% sniper
    return r < 0.7 || remainingBudget < getEnemyBudgetCost('sniper') ? 'swarmer' : 'sniper';
  }

  if (level === 3 || level === 4) {
    if (r < 0.30 || remainingBudget < getEnemyBudgetCost('sniper')) return 'swarmer';
    if (r < 0.56 || remainingBudget < getEnemyBudgetCost('sniper')) return 'sniper';
    if (r < 0.74 || remainingBudget < getEnemyBudgetCost('phantom')) return 'phantom';
    if (r < 0.88 && remainingBudget >= getEnemyBudgetCost('shield_breaker')) return 'shield_breaker';
    return remainingBudget >= getEnemyBudgetCost('tank') ? 'tank' : 'swarmer';
  }

  // High levels with diverse threats (Behemoths enter at Level 11 so first 10 levels stay approachable)
  if (remainingBudget >= getEnemyBudgetCost('behemoth') && r < 0.15 && level >= 11) return 'behemoth';
  if (remainingBudget >= getEnemyBudgetCost('phantom') && r < 0.32 && level >= 3) return 'phantom';
  if (remainingBudget >= getEnemyBudgetCost('shield_breaker') && r < 0.48 && level >= 3) return 'shield_breaker';
  if (remainingBudget >= getEnemyBudgetCost('storm_drone') && r < 0.64 && level >= 5) return 'storm_drone';
  if (remainingBudget >= getEnemyBudgetCost('tank') && r < 0.78) return 'tank';
  if (remainingBudget >= getEnemyBudgetCost('sniper') && r < 0.90) return 'sniper';
  return 'swarmer';
}

/**
 * Applies damage to player, resolving shields first then health
 */
export function applyDamageToPlayer(
  stats: PlayerStats,
  incomingDamage: number
): {
  newStats: PlayerStats;
  shieldAbsorbed: number;
  hpLost: number;
  isDead: boolean;
} {
  let shield = stats.currentShield;
  let hp = stats.currentHp;
  let remainingDmg = incomingDamage;

  let shieldAbsorbed = 0;
  if (shield > 0) {
    shieldAbsorbed = Math.min(shield, remainingDmg);
    shield -= shieldAbsorbed;
    remainingDmg -= shieldAbsorbed;
  }

  const hpLost = Math.min(hp, remainingDmg);
  hp = Math.max(0, hp - hpLost);

  const newStats: PlayerStats = {
    ...stats,
    currentShield: shield,
    currentHp: hp,
    shieldCooldownTimer: stats.shieldRechargeDelay, // reset shield cooldown
  };

  return {
    newStats,
    shieldAbsorbed,
    hpLost,
    isDead: hp <= 0,
  };
}

/**
 * Upgrade catalog definitions & costs
 */
export type UpgradeId = 'maxHealth' | 'shield' | 'damage' | 'fireRate' | 'dash';

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
}

export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  maxHealth: {
    id: 'maxHealth',
    name: 'Nanite Core',
    description: '+1 Max HP Socket and full repair',
    baseCost: 15,
    costMultiplier: 1.6,
    maxLevel: 5,
  },
  shield: {
    id: 'shield',
    name: 'Flux Capacitor',
    description: '+25 Shield Capacity & faster recharge',
    baseCost: 20,
    costMultiplier: 1.5,
    maxLevel: 5,
  },
  damage: {
    id: 'damage',
    name: 'Plasma Overdrive',
    description: '+20% Damage on all weapons',
    baseCost: 25,
    costMultiplier: 1.7,
    maxLevel: 5,
  },
  fireRate: {
    id: 'fireRate',
    name: 'Rapid Cycler',
    description: '+18% Rate of Fire across all weapons',
    baseCost: 20,
    costMultiplier: 1.6,
    maxLevel: 5,
  },
  dash: {
    id: 'dash',
    name: 'Phase Thrusters',
    description: '-20% Dash Cooldown timer',
    baseCost: 15,
    costMultiplier: 1.5,
    maxLevel: 5,
  },
};

export function getUpgradeCost(id: UpgradeId, currentLevel: number): number {
  const def = UPGRADES[id];
  return Math.round(def.baseCost * Math.pow(def.costMultiplier, currentLevel));
}

export function purchaseUpgrade(
  stats: PlayerStats,
  upgradeId: UpgradeId
): { success: boolean; newStats: PlayerStats; cost: number } {
  let currentLevel = 0;
  switch (upgradeId) {
    case 'maxHealth':
      currentLevel = stats.upgrades.maxHealthLvl;
      break;
    case 'shield':
      currentLevel = stats.upgrades.shieldLvl;
      break;
    case 'damage':
      currentLevel = stats.upgrades.damageLvl;
      break;
    case 'fireRate':
      currentLevel = stats.upgrades.fireRateLvl;
      break;
    case 'dash':
      currentLevel = stats.upgrades.dashLvl;
      break;
  }

  const def = UPGRADES[upgradeId];
  if (currentLevel >= def.maxLevel) {
    return { success: false, newStats: stats, cost: 0 };
  }

  const cost = getUpgradeCost(upgradeId, currentLevel);
  if (stats.scrap < cost) {
    return { success: false, newStats: stats, cost: 0 };
  }

  const newStats: PlayerStats = {
    ...stats,
    scrap: stats.scrap - cost,
    upgrades: { ...stats.upgrades },
  };

  switch (upgradeId) {
    case 'maxHealth':
      newStats.upgrades.maxHealthLvl += 1;
      newStats.maxHp += 1;
      newStats.currentHp = newStats.maxHp;
      break;
    case 'shield':
      newStats.upgrades.shieldLvl += 1;
      newStats.maxShield += 25;
      newStats.currentShield = newStats.maxShield;
      newStats.shieldRechargeRate += 5;
      break;
    case 'damage':
      newStats.upgrades.damageLvl += 1;
      break;
    case 'fireRate':
      newStats.upgrades.fireRateLvl += 1;
      break;
    case 'dash':
      newStats.upgrades.dashLvl += 1;
      newStats.dashCooldown = Math.max(
        MIN_DASH_COOLDOWN_SECONDS,
        Number((stats.dashCooldown * 0.88).toFixed(2))
      );
      break;
  }

  return { success: true, newStats, cost };
}

/**
 * Prices of each weapon in Cyber Coins
 */
export const WEAPON_PRICES: Record<WeaponType, number> = {
  pulse: 0,
  scatter: 600,
  beam: 1200,
  missile: 0, // Exclusive Diamond Vault Weapon
  plasma_scythe: 2000,
  leviathan: 2500,
  vortex: 3400,
  cryo_shatter: 4000,
  inferno: 0, // Exclusive Diamond Vault Weapon
  chrono_thunder: 4800,
  supernova: 6200,
  aegis_titan: 7800,
  hyperion_astral: 0, // Exclusive Diamond Vault Weapon
  omega_singularity: 9500,
  prism_splitter: 2800,
  void_rail: 5500,
  celestial_eclipse: 0, // Exclusive Diamond Vault Weapon
};

export function getWeaponPrice(type: WeaponType): number {
  return WEAPON_PRICES[type] ?? 0;
}

export function getWeaponDiamondCost(type: WeaponType): number {
  return WEAPONS[type]?.diamondCost ?? 0;
}

export function isWeaponDiamondExclusive(type: WeaponType): boolean {
  const wepDef = WEAPONS[type];
  return Boolean(wepDef && wepDef.price === 0 && (wepDef.diamondCost ?? 0) > 0);
}

/**
 * Validates and executes a weapon purchase from the store using Cyber Coins
 */
export function purchaseWeapon(
  coins: number,
  unlockedWeapons: Record<WeaponType, boolean>,
  weaponToBuy: WeaponType
): {
  success: boolean;
  remainingCoins: number;
  updatedWeapons: Record<WeaponType, boolean>;
  error?: string;
} {
  if (unlockedWeapons[weaponToBuy]) {
    return {
      success: false,
      remainingCoins: coins,
      updatedWeapons: unlockedWeapons,
      error: 'Weapon is already unlocked.',
    };
  }

  const wepDef = WEAPONS[weaponToBuy];
  if (isWeaponDiamondExclusive(weaponToBuy)) {
    return {
      success: false,
      remainingCoins: coins,
      updatedWeapons: unlockedWeapons,
      error: `${wepDef.name} is exclusive to the Diamond Vault (${wepDef.diamondCost} Diamonds).`,
    };
  }

  const price = getWeaponPrice(weaponToBuy);
  if (coins < price) {
    return {
      success: false,
      remainingCoins: coins,
      updatedWeapons: unlockedWeapons,
      error: `Insufficient coins. Need ${price} coins, but have ${coins}.`,
    };
  }

  return {
    success: true,
    remainingCoins: coins - price,
    updatedWeapons: {
      ...unlockedWeapons,
      [weaponToBuy]: true,
    },
  };
}

/**
 * Validates and executes a weapon purchase using Cyber Diamonds
 */
export function purchaseWeaponWithDiamonds(
  diamonds: number,
  unlockedWeapons: Record<WeaponType, boolean>,
  weaponToBuy: WeaponType
): {
  success: boolean;
  remainingDiamonds: number;
  updatedWeapons: Record<WeaponType, boolean>;
  cost: number;
  error?: string;
} {
  if (unlockedWeapons[weaponToBuy]) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedWeapons: unlockedWeapons,
      cost: 0,
      error: 'Weapon is already unlocked.',
    };
  }

  const wepDef = WEAPONS[weaponToBuy];
  const cost = getWeaponDiamondCost(weaponToBuy);
  if (!wepDef || cost <= 0) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedWeapons: unlockedWeapons,
      cost: 0,
      error: `${wepDef?.name ?? weaponToBuy} cannot be purchased with Diamonds.`,
    };
  }

  if (diamonds < cost) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedWeapons: unlockedWeapons,
      cost,
      error: `Insufficient diamonds. Need ${cost} 💎, but have ${diamonds} 💎.`,
    };
  }

  return {
    success: true,
    remainingDiamonds: diamonds - cost,
    updatedWeapons: {
      ...unlockedWeapons,
      [weaponToBuy]: true,
    },
    cost,
  };
}

/**
 * Calculates level clear coin bonus (Generous rewards for rapid progression)
 */
export function calculateLevelCoinBonus(level: number): number {
  switch (level) {
    case 1:
      return 250;
    case 2:
      return 350;
    case 3:
      return 500;
    case 4:
      return 700;
    case 5:
      return 900;
    case 6:
      return 1100;
    case 7:
      return 1400;
    case 8:
      return 1700;
    case 9:
      return 2000;
    case 10:
      return 2300;
    case 11:
      return 2600;
    case 12:
      return 2900;
    case 13:
      return 3200;
    case 14:
      return 3600;
    case 15:
      return 4000;
    case 16:
      return 4400;
    case 17:
      return 4800;
    case 18:
      return 5200;
    case 19:
      return 5600;
    case 20:
      return 6000;
    case 21:
      return 7500;
    case 22:
      return 8000;
    case 23:
      return 8500;
    case 24:
      return 9000;
    case 25:
      return 9500;
    case 26:
      return 10000;
    case 27:
      return 11000;
    case 28:
      return 15000;
    case 29:
      return 16000;
    case 30:
      return 17000;
    case 31:
      return 18000;
    case 32:
      return 19000;
    case 33:
      return 20500;
    case 34:
      return 22500;
    case 35:
      return 24000;
    case 36:
      return 25500;
    case 37:
      return 27000;
    case 38:
      return 28500;
    case 39:
      return 30000;
    case 40:
      return 35000;
    case 41:
      return 37000;
    case 42:
      return 39000;
    case 43:
      return 41000;
    case 44:
      return 43000;
    case 45:
      return 45000;
    case 46:
      return 47000;
    case 47:
      return 49000;
    case 48:
      return 51000;
    case 49:
      return 53000;
    case 50:
      return 56000;
    case 51:
      return 58000;
    case 52:
      return 60000;
    case 53:
      return 62000;
    case 54:
      return 64000;
    case 55:
      return 66000;
    case 56:
      return 68000;
    case 57:
      return 70000;
    case 58:
      return 71500;
    case 59:
      return 73000;
    case 60:
      return 75000;
    default: {
      const clamped = Math.max(61, Math.min(100, level));
      if (clamped >= 100) return 160000;
      const isMilestoneBoss = clamped % 10 === 0 || clamped % 5 === 0;
      return 75000 + (clamped - 60) * 2000 + (isMilestoneBoss ? 1500 : 0);
    }
  }
}

/**
 * Calculates enemy coin drop count and value
 */
export function calculateEnemyCoinDrop(
  type: EnemyType,
  rand: () => number = Math.random
): { count: number; value: number } {
  switch (type) {
    case 'swarmer':
      // 100% guarantee at least 1 coin drop
      return { count: 1, value: 1 };
    case 'sniper':
      return { count: 3, value: 1 };
    case 'storm_drone':
      return { count: 4, value: 2 }; // total 8 coins
    case 'tank':
      return { count: 6, value: 2 }; // total 12 coins
    case 'phantom':
      return { count: 5, value: 2 }; // total 10 coins
    case 'shield_breaker':
      return { count: 7, value: 2 }; // total 14 coins
    case 'behemoth':
      return { count: 8, value: 3 }; // total 24 coins
    case 'goliath':
      return { count: 15, value: 5 }; // total 75 coins
  }
}

/**
 * Returns available spawn patterns for a wave, expanding monotonically with wave progression
 */
export function getAvailableSpawnPatterns(wave: number): SpawnPatternType[] {
  const patterns: SpawnPatternType[] = ['perimeter_random', 'corner_ambush'];
  if (wave >= 2) patterns.push('circle_ring', 'pincer_flank');
  if (wave >= 3) patterns.push('v_wedge', 'portal_cluster');
  if (wave >= 4) patterns.push('quad_cross');
  if (wave >= 5) patterns.push('escort_convoy');
  if (wave >= 6) patterns.push('spiral_vortex');
  return patterns;
}

/**
 * Selects an unlocked tactical spawn pattern for the given wave
 */
export function selectSpawnPattern(wave: number, rand: () => number = Math.random): SpawnPatternType {
  const available = getAvailableSpawnPatterns(wave);
  const idx = Math.floor(rand() * available.length);
  return available[Math.min(available.length - 1, Math.max(0, idx))];
}

/**
 * Human-readable tactical label for each pattern type
 */
export function getPatternTacticalLabel(pattern: SpawnPatternType): string {
  switch (pattern) {
    case 'perimeter_random':
    case 'perimeter':
      return 'Perimeter Infiltration';
    case 'corner_ambush':
    case 'quad_corner':
      return 'Corner Crossfire Ambush';
    case 'circle_ring':
    case 'surround':
      return '360° Encirclement Ring';
    case 'pincer_flank':
    case 'pincer':
      return 'Dual Pincer Flank';
    case 'v_wedge':
    case 'arrowhead':
      return 'V-Wedge Spearhead';
    case 'portal_cluster':
    case 'enfilade':
      return 'Quantum Cluster Surge';
    case 'quad_cross':
      return 'Four-Cardinal Siege';
    case 'escort_convoy':
    case 'escort':
      return 'Heavy Escort Convoy';
    case 'spiral_vortex':
      return 'Vortex Swarm Spiral';
    default:
      return 'Tactical Formation';
  }
}

/**
 * Generates spawn coordinates inside arena boundaries for a formation pattern
 */
export function generateSpawnPositions(
  pattern: SpawnPatternType,
  count: number,
  player: { x: number; y: number },
  arenaW: number,
  arenaH: number,
  rand: () => number = Math.random
): PatternSpawnPoint[] {
  const points: PatternSpawnPoint[] = [];
  const pad = 60;
  const clampX = (x: number) => Math.max(pad, Math.min(arenaW - pad, x));
  const clampY = (y: number) => Math.max(pad, Math.min(arenaH - pad, y));

  const total = Math.max(1, count);

  switch (pattern) {
    case 'circle_ring':
    case 'surround': {
      const ringRadius = 550;
      const baseAngle = rand() * Math.PI * 2;
      for (let i = 0; i < total; i++) {
        const angle = baseAngle + (i / total) * Math.PI * 2;
        points.push({
          x: clampX(player.x + Math.cos(angle) * ringRadius),
          y: clampY(player.y + Math.sin(angle) * ringRadius),
          delaySec: i * 0.1,
          patternName: pattern,
        });
      }
      break;
    }

    case 'corner_ambush':
    case 'quad_corner': {
      const corners = [
        { x: pad + 30, y: pad + 30 },
        { x: arenaW - pad - 30, y: pad + 30 },
        { x: arenaW - pad - 30, y: arenaH - pad - 30 },
        { x: pad + 30, y: arenaH - pad - 30 },
      ];
      for (let i = 0; i < total; i++) {
        const c = corners[i % corners.length];
        const offset = Math.floor(i / corners.length) * 40;
        points.push({
          x: clampX(c.x + offset),
          y: clampY(c.y + offset),
          delaySec: i * 0.15,
          patternName: pattern,
        });
      }
      break;
    }

    case 'pincer_flank':
    case 'pincer': {
      const dist = 580;
      const angle = rand() * Math.PI * 2;
      for (let i = 0; i < total; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const flankAngle = angle + (side * Math.PI) / 2;
        const jitter = Math.floor(i / 2) * 50;
        points.push({
          x: clampX(player.x + Math.cos(flankAngle) * (dist + jitter)),
          y: clampY(player.y + Math.sin(flankAngle) * (dist + jitter)),
          delaySec: i * 0.1,
          patternName: pattern,
        });
      }
      break;
    }

    case 'v_wedge':
    case 'arrowhead': {
      const angle = Math.atan2(player.y - arenaH / 2, player.x - arenaW / 2);
      const apexDist = 620;
      const apexX = clampX(player.x - Math.cos(angle) * apexDist);
      const apexY = clampY(player.y - Math.sin(angle) * apexDist);
      const wingPerp = angle + Math.PI / 2;

      for (let i = 0; i < total; i++) {
        if (i === 0) {
          points.push({ x: apexX, y: apexY, delaySec: 0, patternName: pattern });
        } else {
          const side = i % 2 === 1 ? 1 : -1;
          const tier = Math.ceil(i / 2);
          const wingX = apexX - Math.cos(angle) * (tier * 60) + Math.cos(wingPerp) * (side * tier * 55);
          const wingY = apexY - Math.sin(angle) * (tier * 60) + Math.sin(wingPerp) * (side * tier * 55);
          points.push({
            x: clampX(wingX),
            y: clampY(wingY),
            delaySec: tier * 0.1,
            patternName: pattern,
          });
        }
      }
      break;
    }

    case 'quad_cross': {
      const dist = 560;
      const cardinalAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      for (let i = 0; i < total; i++) {
        const a = cardinalAngles[i % 4];
        const tier = Math.floor(i / 4) * 45;
        points.push({
          x: clampX(player.x + Math.cos(a) * (dist + tier)),
          y: clampY(player.y + Math.sin(a) * (dist + tier)),
          delaySec: (i % 4) * 0.12,
          patternName: pattern,
        });
      }
      break;
    }

    case 'portal_cluster':
    case 'enfilade': {
      const angle = rand() * Math.PI * 2;
      const clusterDist = 580;
      const centerX = clampX(player.x + Math.cos(angle) * clusterDist);
      const centerY = clampY(player.y + Math.sin(angle) * clusterDist);

      for (let i = 0; i < total; i++) {
        const offsetA = (i / total) * Math.PI * 2;
        const rad = 45 * Math.sqrt(i);
        points.push({
          x: clampX(centerX + Math.cos(offsetA) * rad),
          y: clampY(centerY + Math.sin(offsetA) * rad),
          delaySec: i * 0.08,
          patternName: pattern,
        });
      }
      break;
    }

    case 'escort_convoy':
    case 'escort': {
      const angle = rand() * Math.PI * 2;
      const dist = 600;
      const leadX = clampX(player.x + Math.cos(angle) * dist);
      const leadY = clampY(player.y + Math.sin(angle) * dist);
      const perp = angle + Math.PI / 2;

      for (let i = 0; i < total; i++) {
        const behind = Math.floor(i / 2) * 55;
        const side = i % 2 === 0 ? 1 : -1;
        points.push({
          x: clampX(leadX - Math.cos(angle) * behind + Math.cos(perp) * (side * 40)),
          y: clampY(leadY - Math.sin(angle) * behind + Math.sin(perp) * (side * 40)),
          delaySec: i * 0.1,
          patternName: pattern,
        });
      }
      break;
    }

    case 'spiral_vortex': {
      const baseA = rand() * Math.PI * 2;
      for (let i = 0; i < total; i++) {
        const r = 380 + i * 55;
        const a = baseA + (i * 0.75);
        points.push({
          x: clampX(player.x + Math.cos(a) * r),
          y: clampY(player.y + Math.sin(a) * r),
          delaySec: i * 0.12,
          patternName: pattern,
        });
      }
      break;
    }

    case 'perimeter_random':
    case 'perimeter':
    default: {
      for (let i = 0; i < total; i++) {
        const edge = Math.floor(rand() * 4);
        let x = pad;
        let y = pad;
        if (edge === 0) { // Top
          x = pad + rand() * (arenaW - pad * 2);
          y = pad;
        } else if (edge === 1) { // Right
          x = arenaW - pad;
          y = pad + rand() * (arenaH - pad * 2);
        } else if (edge === 2) { // Bottom
          x = pad + rand() * (arenaW - pad * 2);
          y = arenaH - pad;
        } else { // Left
          x = pad;
          y = pad + rand() * (arenaH - pad * 2);
        }
        points.push({
          x: clampX(x),
          y: clampY(y),
          delaySec: i * 0.15,
          patternName: pattern,
        });
      }
      break;
    }
  }

  return points;
}

/**
 * Calculates trajectory avoidance force so enemies dodge the player's weapon crosshairs
 */
export function calculateTrajectoryAvoidanceForce(
  enemyX: number,
  enemyY: number,
  enemyRadius: number,
  playerX: number,
  playerY: number,
  aimAngle: number,
  range: number,
  isFiring: boolean,
  avoidanceRadius: number = 125,
  evasionSpeed: number = 180
): { inDanger: boolean; intensity: number; avoidVx: number; avoidVy: number } {
  const dx = enemyX - playerX;
  const dy = enemyY - playerY;

  const cosA = Math.cos(aimAngle);
  const sinA = Math.sin(aimAngle);

  // Forward projection along aim direction
  const forwardDist = dx * cosA + dy * sinA;
  if (forwardDist <= 0 || forwardDist > range + enemyRadius) {
    return { inDanger: false, intensity: 0, avoidVx: 0, avoidVy: 0 };
  }

  // Perpendicular offset (vector pointing 90 deg counter-clockwise)
  const perpX = -sinA;
  const perpY = cosA;
  const latOffset = dx * perpX + dy * perpY;
  const latDist = Math.abs(latOffset);

  const corridor = avoidanceRadius + enemyRadius;
  if (latDist >= corridor) {
    return { inDanger: false, intensity: 0, avoidVx: 0, avoidVy: 0 };
  }

  const intensity = Math.max(0.1, 1 - latDist / corridor);
  // Steer laterally away from center of aim line
  const dir = latOffset !== 0 ? (latOffset > 0 ? 1 : -1) : 1;
  const speed = evasionSpeed * (isFiring ? 1.25 : 1.0);

  return {
    inDanger: true,
    intensity,
    avoidVx: perpX * dir * speed * intensity,
    avoidVy: perpY * dir * speed * intensity,
  };
}

/**
 * Calculates predictive dodge force away from incoming player projectiles
 */
export function calculateProjectileDodgeForce(
  enemyX: number,
  enemyY: number,
  enemyRadius: number,
  projectiles: { x: number; y: number; vx: number; vy: number; radius: number; isEnemy: boolean }[],
  scanRadius: number = 220,
  dodgeSpeed: number = 220
): { hasBulletThreat: boolean; dodgeVx: number; dodgeVy: number } {
  let dodgeVx = 0;
  let dodgeVy = 0;
  let hasBulletThreat = false;

  for (let i = 0; i < projectiles.length; i++) {
    const p = projectiles[i];
    if (p.isEnemy) continue;

    const dx = enemyX - p.x;
    const dy = enemyY - p.y;
    const speed = Math.hypot(p.vx, p.vy);
    if (speed < 1) continue;

    const bvx = p.vx / speed;
    const bvy = p.vy / speed;

    const forwardDist = dx * bvx + dy * bvy;
    if (forwardDist <= 0 || forwardDist > scanRadius) continue;

    const perpBvx = -bvy;
    const perpBvy = bvx;
    const latOffset = dx * perpBvx + dy * perpBvy;
    const dangerRadius = enemyRadius + p.radius + 30;

    if (Math.abs(latOffset) < dangerRadius) {
      hasBulletThreat = true;
      const dir = latOffset >= 0 ? 1 : -1;
      const intensity = 1 - Math.abs(latOffset) / dangerRadius;
      dodgeVx += perpBvx * dir * dodgeSpeed * intensity;
      dodgeVy += perpBvy * dir * dodgeSpeed * intensity;
    }
  }

  return { hasBulletThreat, dodgeVx, dodgeVy };
}

/**
 * Visual styling and color definitions by damage type
 */
export const DAMAGE_STYLES: Record<DamageCategory, DamageStyle> = {
  plasma: {
    text: '#00f3ff', // Neon Cyan
    glow: 'rgba(0, 243, 255, 0.85)',
    stroke: '#042f40',
    label: 'PLASMA',
  },
  scatter: {
    text: '#ffb400', // Kinetic Amber
    glow: 'rgba(255, 180, 0, 0.85)',
    stroke: '#451a03',
    label: 'FLAK',
  },
  beam: {
    text: '#ff2a85', // Piercing Magenta
    glow: 'rgba(255, 0, 119, 0.9)',
    stroke: '#4c0519',
    label: 'LANCE',
  },
  explosive: {
    text: '#ff6200', // Heavy Blast Orange
    glow: 'rgba(255, 98, 0, 0.95)',
    stroke: '#431407',
    label: 'BLAST',
  },
  kinetic: {
    text: '#38bdf8', // Dreadnought Ice Blue
    glow: 'rgba(56, 189, 248, 0.9)',
    stroke: '#082f49',
    label: 'KINETIC',
  },
  void: {
    text: '#c084fc', // Singularity Purple
    glow: 'rgba(168, 85, 247, 0.95)',
    stroke: '#3b0764',
    label: 'VOID',
  },
  fire: {
    text: '#ff3300', // Blazing Crimson Fire
    glow: 'rgba(255, 51, 0, 0.95)',
    stroke: '#450a0a',
    label: 'BURN',
  },
  electric: {
    text: '#fde047', // Lightning Shock Yellow
    glow: 'rgba(253, 224, 71, 0.95)',
    stroke: '#422006',
    label: 'SHOCK',
  },
  cosmic: {
    text: '#fef08a', // Supernova Solar Gold
    glow: 'rgba(250, 204, 21, 0.95)',
    stroke: '#713f12',
    label: 'SOLAR',
  },
  titan: {
    text: '#fb7185', // Cosmic Rail Crimson
    glow: 'rgba(244, 63, 94, 0.95)',
    stroke: '#4c0519',
    label: 'TITAN',
  },
  critical: {
    text: '#ffffff', // Blinding White / Gold Crit
    glow: 'rgba(255, 215, 0, 1.0)',
    stroke: '#854d0e',
    label: 'CRIT',
  },
  resisted: {
    text: '#a5b4fc', // Glitch Shield Violet-Grey
    glow: 'rgba(165, 180, 252, 0.7)',
    stroke: '#1e1b4b',
    label: 'GLITCH',
  },
};

/**
 * Returns damage style colors and strokes for a category
 */
export function getDamageColor(category: DamageCategory): DamageStyle {
  return DAMAGE_STYLES[category] ?? DAMAGE_STYLES.plasma;
}

/**
 * Maps weapon and hit properties to the corresponding damage category
 */
export function mapWeaponToDamageCategory(
  weapon?: WeaponType,
  isExplosive: boolean = false,
  isCrit: boolean = false,
  isResisted: boolean = false
): DamageCategory {
  if (isCrit) return 'critical';
  if (isResisted) return 'resisted';
  if (isExplosive) return 'explosive';

  switch (weapon) {
    case 'pulse':
      return 'plasma';
    case 'scatter':
      return 'scatter';
    case 'beam':
      return 'beam';
    case 'missile':
      return 'explosive';
    case 'leviathan':
      return 'kinetic';
    case 'vortex':
      return 'void';
    case 'inferno':
      return 'fire';
    case 'chrono_thunder':
      return 'electric';
    case 'supernova':
      return 'cosmic';
    case 'aegis_titan':
      return 'titan';
    case 'hyperion_astral':
    case 'omega_singularity':
    case 'celestial_eclipse':
      return 'cosmic';
    case 'plasma_scythe':
    case 'prism_splitter':
      return 'scatter';
    case 'cryo_shatter':
    case 'void_rail':
      return 'kinetic';
    default:
      return 'plasma';
  }
}

export type RegionWeatherStyle =
  | 'cyber_rain'
  | 'solar_spores'
  | 'lighthouse_beams'
  | 'celestial_aurora';

export interface RegionAtmosphereTheme {
  weatherStyle: RegionWeatherStyle;
  nebulaPrimary: string;
  nebulaSecondary: string;
  starTint: string;
  pulseColor: string;
  radarColor: string;
  overlayOpacity: number;
}

export function getRegionAtmosphereTheme(region: string): RegionAtmosphereTheme {
  switch (region) {
    case 'rajshahi':
      return {
        weatherStyle: 'solar_spores',
        nebulaPrimary: 'rgba(0, 255, 136, 0.16)',
        nebulaSecondary: 'rgba(255, 215, 0, 0.14)',
        starTint: '#a7f3d0',
        pulseColor: '#00ff88',
        radarColor: 'rgba(0, 255, 136, 0.14)',
        overlayOpacity: 0.36,
      };
    case 'chattogram':
      return {
        weatherStyle: 'lighthouse_beams',
        nebulaPrimary: 'rgba(255, 170, 0, 0.16)',
        nebulaSecondary: 'rgba(0, 136, 255, 0.18)',
        starTint: '#fde68a',
        pulseColor: '#ffaa00',
        radarColor: 'rgba(0, 170, 255, 0.16)',
        overlayOpacity: 0.42,
      };
    case 'sylhet':
      return {
        weatherStyle: 'celestial_aurora',
        nebulaPrimary: 'rgba(168, 85, 247, 0.22)',
        nebulaSecondary: 'rgba(56, 189, 248, 0.18)',
        starTint: '#e9d5ff',
        pulseColor: '#c084fc',
        radarColor: 'rgba(168, 85, 247, 0.18)',
        overlayOpacity: 0.38,
      };
    case 'sundarbans':
      return {
        weatherStyle: 'solar_spores',
        nebulaPrimary: 'rgba(16, 185, 129, 0.20)',
        nebulaSecondary: 'rgba(245, 158, 11, 0.16)',
        starTint: '#6ee7b7',
        pulseColor: '#10b981',
        radarColor: 'rgba(16, 185, 129, 0.18)',
        overlayOpacity: 0.39,
      };
    case 'cox_orbit':
      return {
        weatherStyle: 'celestial_aurora',
        nebulaPrimary: 'rgba(56, 189, 248, 0.22)',
        nebulaSecondary: 'rgba(255, 0, 85, 0.18)',
        starTint: '#e0f2fe',
        pulseColor: '#38bdf8',
        radarColor: 'rgba(56, 189, 248, 0.18)',
        overlayOpacity: 0.40,
      };
    case 'kuakata_abyss':
      return {
        weatherStyle: 'lighthouse_beams',
        nebulaPrimary: 'rgba(14, 165, 233, 0.22)',
        nebulaSecondary: 'rgba(244, 63, 94, 0.18)',
        starTint: '#bae6fd',
        pulseColor: '#0ea5e9',
        radarColor: 'rgba(14, 165, 233, 0.20)',
        overlayOpacity: 0.41,
      };
    case 'bengal_singularity':
      return {
        weatherStyle: 'celestial_aurora',
        nebulaPrimary: 'rgba(245, 158, 11, 0.24)',
        nebulaSecondary: 'rgba(168, 85, 247, 0.22)',
        starTint: '#fef08a',
        pulseColor: '#f59e0b',
        radarColor: 'rgba(245, 158, 11, 0.20)',
        overlayOpacity: 0.42,
      };
    case 'barishal_nebula':
      return {
        weatherStyle: 'cyber_rain',
        nebulaPrimary: 'rgba(34, 211, 238, 0.22)',
        nebulaSecondary: 'rgba(52, 211, 153, 0.18)',
        starTint: '#a5f3fc',
        pulseColor: '#22d3ee',
        radarColor: 'rgba(34, 211, 238, 0.20)',
        overlayOpacity: 0.39,
      };
    case 'rangpur_cryo':
      return {
        weatherStyle: 'celestial_aurora',
        nebulaPrimary: 'rgba(96, 165, 250, 0.24)',
        nebulaSecondary: 'rgba(192, 132, 252, 0.20)',
        starTint: '#dbeafe',
        pulseColor: '#60a5fa',
        radarColor: 'rgba(96, 165, 250, 0.20)',
        overlayOpacity: 0.40,
      };
    case 'khulna_reactor':
      return {
        weatherStyle: 'lighthouse_beams',
        nebulaPrimary: 'rgba(251, 146, 60, 0.23)',
        nebulaSecondary: 'rgba(244, 63, 94, 0.20)',
        starTint: '#fed7aa',
        pulseColor: '#fb923c',
        radarColor: 'rgba(251, 146, 60, 0.20)',
        overlayOpacity: 0.42,
      };
    case 'padma_eternity':
      return {
        weatherStyle: 'celestial_aurora',
        nebulaPrimary: 'rgba(244, 63, 94, 0.25)',
        nebulaSecondary: 'rgba(253, 224, 71, 0.22)',
        starTint: '#fef08a',
        pulseColor: '#f43f5e',
        radarColor: 'rgba(244, 63, 94, 0.22)',
        overlayOpacity: 0.43,
      };
    case 'dhaka':
    default:
      return {
        weatherStyle: 'cyber_rain',
        nebulaPrimary: 'rgba(0, 243, 255, 0.16)',
        nebulaSecondary: 'rgba(255, 0, 119, 0.14)',
        starTint: '#bae6fd',
        pulseColor: '#00f3ff',
        radarColor: 'rgba(0, 243, 255, 0.16)',
        overlayOpacity: 0.40,
      };
  }
}

// --- Combo Finisher Mechanic (20-Hit Streak AoE Overload + Screen Shake) ---
export const COMBO_FINISHER_THRESHOLD = 20;
export const COMBO_FINISHER_RADIUS = 420;
export const COMBO_FINISHER_BASE_DAMAGE = 360;
export const COMBO_FINISHER_TRAUMA = 0.85;
export const COMBO_FINISHER_HITSTOP = 0;

export interface ComboFinisherAdvanceResult {
  charge: number;
  ready: boolean;
  justBecameReady: boolean;
}

/**
 * Advances Combo Finisher charge on consecutive hits while streak stays active.
 */
export function advanceComboFinisherState(
  currentCharge: number,
  currentReady: boolean,
  currentStreak: number,
  threshold: number = COMBO_FINISHER_THRESHOLD
): ComboFinisherAdvanceResult {
  if (currentStreak <= 0) {
    return { charge: 0, ready: false, justBecameReady: false };
  }
  if (currentReady) {
    return { charge: threshold, ready: true, justBecameReady: false };
  }
  const nextCharge = Math.min(threshold, Math.max(0, currentCharge) + 1);
  const ready = nextCharge >= threshold && currentStreak >= threshold;
  return {
    charge: nextCharge,
    ready,
    justBecameReady: ready && !currentReady,
  };
}

/**
 * Checks whether Combo Finisher can be unleashed right now (requires an active 20+ hit streak).
 */
export function canActivateComboFinisher(params: {
  ready: boolean;
  streak: number;
  comboTimer: number;
  threshold?: number;
}): boolean {
  const threshold = params.threshold ?? COMBO_FINISHER_THRESHOLD;
  return Boolean(params.ready && params.streak >= threshold && params.comboTimer > 0);
}

/**
 * Calculates AoE Combo Finisher damage and radial knockback by distance from epicenter.
 */
export function computeComboFinisherExplosion(params: {
  damageUpgradeLvl: number;
  craftDamageMultiplier: number;
  comboMultiplier: number;
  wave: number;
  distanceFromCenter: number;
  radius?: number;
}): {
  centerDamage: number;
  enemyDamage: number;
  knockbackForce: number;
  inRange: boolean;
} {
  const radius = params.radius ?? COMBO_FINISHER_RADIUS;
  const upgradeScale = 1 + Math.max(0, params.damageUpgradeLvl) * 0.2;
  const craftScale = Math.max(0.5, params.craftDamageMultiplier);
  const comboScale = Math.max(1, params.comboMultiplier);
  const waveScale = 1 + Math.max(0, params.wave - 1) * 0.08;

  const centerDamage = Math.round(
    COMBO_FINISHER_BASE_DAMAGE * upgradeScale * craftScale * comboScale * waveScale
  );

  if (params.distanceFromCenter > radius) {
    return {
      centerDamage,
      enemyDamage: 0,
      knockbackForce: 0,
      inRange: false,
    };
  }

  const ratio = Math.max(0, Math.min(1, params.distanceFromCenter / Math.max(1, radius)));
  const falloff = 1 - ratio * 0.45; // 100% at center down to 55% at perimeter
  const enemyDamage = Math.max(1, Math.round(centerDamage * falloff));
  const knockbackForce = Math.round(680 - ratio * 340);

  return {
    centerDamage,
    enemyDamage,
    knockbackForce,
    inRange: true,
  };
}

// --- Tactical Dash Cooldown (1.5s Base Recharge & Gauge Telemetry) ---
export const BASE_DASH_COOLDOWN_SECONDS = 1.5;
export const MIN_DASH_COOLDOWN_SECONDS = 0.75;

/**
 * Computes effective dash recharge time (in seconds) from craft modifier & dash upgrades.
 * Baseline starter craft at upgrade level 0 is strictly 1.5 seconds.
 */
export function computeDashCooldown(
  craftDashMultiplier: number = 1.0,
  dashUpgradeLvl: number = 0
): number {
  const craftMult = Math.max(0.4, craftDashMultiplier);
  const upgradeScale = Math.pow(0.88, Math.max(0, dashUpgradeLvl));
  const raw = BASE_DASH_COOLDOWN_SECONDS * craftMult * upgradeScale;
  return Number(Math.max(MIN_DASH_COOLDOWN_SECONDS, raw).toFixed(2));
}

export interface DashGaugeState {
  isReady: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  chargePercent: number;
}

/**
 * Computes HUD gauge fill percentage (0..100) and remaining recharge countdown.
 */
export function computeDashGaugeState(
  cooldownTimer: number,
  totalCooldown: number = BASE_DASH_COOLDOWN_SECONDS
): DashGaugeState {
  const totalSeconds = Math.max(0.1, totalCooldown || BASE_DASH_COOLDOWN_SECONDS);
  const remainingSeconds = Math.max(0, cooldownTimer || 0);
  const isReady = remainingSeconds <= 0.01;
  const chargeRatio = isReady ? 1 : Math.max(0, Math.min(1, 1 - remainingSeconds / totalSeconds));
  return {
    isReady,
    remainingSeconds: isReady ? 0 : remainingSeconds,
    totalSeconds,
    chargePercent: Math.round(chargeRatio * 100),
  };
}

// --- Diamond Revive System (Continue Current Level Attempt With Diamonds) ---
export const DIAMOND_REVIVE_BASE_COST = 5;
export const DIAMOND_REVIVE_STEP_COST = 5;
export const MAX_DIAMOND_REVIVES_PER_RUN = 3;

export interface DiamondReviveCostInfo {
  canRevive: boolean;
  cost: number;
  remainingRevives: number;
  maxRevives: number;
}

/**
 * Computes the escalating Diamond cost for reviving in the current run.
 * Revive #1 = 5 💎, #2 = 10 💎, #3 = 15 💎 (capped at maxRevives = 3 per run).
 */
export function getDiamondReviveCost(
  revivesUsed: number,
  maxRevives: number = MAX_DIAMOND_REVIVES_PER_RUN
): DiamondReviveCostInfo {
  const safeUsed = Math.max(0, Math.floor(revivesUsed || 0));
  const safeMax = Math.max(1, Math.floor(maxRevives || MAX_DIAMOND_REVIVES_PER_RUN));
  const remainingRevives = Math.max(0, safeMax - safeUsed);
  const canRevive = remainingRevives > 0;
  const cost = canRevive
    ? DIAMOND_REVIVE_BASE_COST + safeUsed * DIAMOND_REVIVE_STEP_COST
    : 0;
  return {
    canRevive,
    cost,
    remainingRevives,
    maxRevives: safeMax,
  };
}

export interface DiamondReviveValidation {
  allowed: boolean;
  cost: number;
  remainingRevives: number;
  maxRevives: number;
  reason?: 'max_revives' | 'insufficient_diamonds' | 'not_defeat';
}

/**
 * Validates whether a defeated player can spend Diamonds to revive with a new life.
 */
export function canPurchaseDiamondRevive(params: {
  diamonds: number;
  revivesUsed: number;
  isVictory?: boolean;
  maxRevives?: number;
}): DiamondReviveValidation {
  const costInfo = getDiamondReviveCost(params.revivesUsed, params.maxRevives);
  if (params.isVictory) {
    return {
      allowed: false,
      cost: costInfo.cost,
      remainingRevives: costInfo.remainingRevives,
      maxRevives: costInfo.maxRevives,
      reason: 'not_defeat',
    };
  }
  if (!costInfo.canRevive) {
    return {
      allowed: false,
      cost: 0,
      remainingRevives: 0,
      maxRevives: costInfo.maxRevives,
      reason: 'max_revives',
    };
  }
  const safeDiamonds = Math.max(0, Math.floor(params.diamonds || 0));
  if (safeDiamonds < costInfo.cost) {
    return {
      allowed: false,
      cost: costInfo.cost,
      remainingRevives: costInfo.remainingRevives,
      maxRevives: costInfo.maxRevives,
      reason: 'insufficient_diamonds',
    };
  }
  return {
    allowed: true,
    cost: costInfo.cost,
    remainingRevives: costInfo.remainingRevives,
    maxRevives: costInfo.maxRevives,
  };
}

// --- Weapon Heat & Strategic Overheat System ---
export const WEAPON_HEAT_MAX = 100;
export const WEAPON_OVERHEAT_COOLDOWN_SECONDS = 2.0;
export const WEAPON_HEAT_COOL_DELAY_SECONDS = 0.14;
export const WEAPON_HEAT_COOL_RATE_PER_SEC = 42;

export function createInitialWeaponThermalState(): WeaponThermalState {
  return {
    heat: 0,
    isOverheated: false,
    overheatTimer: 0,
    coolDelayTimer: 0,
  };
}

/**
 * Adds heat for a weapon shot scaled by Mastery heat-reduction passives.
 * Reaching WEAPON_HEAT_MAX triggers an 'Overheat' state disabling that weapon until cooldown completes.
 */
export function applyWeaponShotHeat(
  state: WeaponThermalState,
  baseHeatPerShot: number,
  heatReductionRatio: number = 0
): {
  state: WeaponThermalState;
  heatAdded: number;
  triggeredOverheat: boolean;
} {
  if (state.isOverheated) {
    return {
      state: { ...state },
      heatAdded: 0,
      triggeredOverheat: false,
    };
  }
  const reduction = Math.max(0, Math.min(0.75, heatReductionRatio || 0));
  const heatAdded = Math.max(0.5, Number((baseHeatPerShot * (1 - reduction)).toFixed(2)));
  const rawNext = state.heat + heatAdded;

  if (rawNext >= WEAPON_HEAT_MAX) {
    return {
      state: {
        heat: WEAPON_HEAT_MAX,
        isOverheated: true,
        overheatTimer: WEAPON_OVERHEAT_COOLDOWN_SECONDS,
        coolDelayTimer: 0,
      },
      heatAdded,
      triggeredOverheat: true,
    };
  }

  return {
    state: {
      heat: Number(rawNext.toFixed(2)),
      isOverheated: false,
      overheatTimer: 0,
      coolDelayTimer: WEAPON_HEAT_COOL_DELAY_SECONDS,
    },
    heatAdded,
    triggeredOverheat: false,
  };
}

/**
 * Advances cooling / overheat recovery for a single weapon over delta time `dt`.
 */
export function stepWeaponThermalState(
  state: WeaponThermalState,
  dt: number,
  coolingBonusRatio: number = 0
): {
  state: WeaponThermalState;
  justCooledDown: boolean;
} {
  const safeDt = Math.max(0, dt);
  const coolMult = 1 + Math.max(0, coolingBonusRatio || 0);

  if (state.isOverheated) {
    const nextOverheatTimer = Math.max(0, state.overheatTimer - safeDt * coolMult);
    if (nextOverheatTimer <= 0) {
      return {
        state: {
          heat: 0,
          isOverheated: false,
          overheatTimer: 0,
          coolDelayTimer: 0,
        },
        justCooledDown: true,
      };
    }
    const ventRatio = nextOverheatTimer / WEAPON_OVERHEAT_COOLDOWN_SECONDS;
    return {
      state: {
        heat: Number((WEAPON_HEAT_MAX * ventRatio).toFixed(2)),
        isOverheated: true,
        overheatTimer: Number(nextOverheatTimer.toFixed(3)),
        coolDelayTimer: 0,
      },
      justCooledDown: false,
    };
  }

  if (state.heat <= 0) {
    return {
      state: { ...state, heat: 0, coolDelayTimer: 0 },
      justCooledDown: false,
    };
  }

  if (state.coolDelayTimer > 0) {
    const nextDelay = Math.max(0, state.coolDelayTimer - safeDt);
    return {
      state: {
        ...state,
        coolDelayTimer: Number(nextDelay.toFixed(3)),
      },
      justCooledDown: false,
    };
  }

  const cooledHeat = Math.max(0, state.heat - WEAPON_HEAT_COOL_RATE_PER_SEC * coolMult * safeDt);
  return {
    state: {
      heat: Number(cooledHeat.toFixed(2)),
      isOverheated: false,
      overheatTimer: 0,
      coolDelayTimer: 0,
    },
    justCooledDown: false,
  };
}

// --- Procedural Cyber-Storm Weather & Localized Wind Zone System ---
export const CYBER_STORM_CALM_MIN_SEC = 16;
export const CYBER_STORM_CALM_MAX_SEC = 26;
export const CYBER_STORM_WARNING_SEC = 2.5;
export const CYBER_STORM_DURATION_MIN_SEC = 14;
export const CYBER_STORM_DURATION_MAX_SEC = 20;

export interface CyberStormState {
  phase: CyberStormPhase;
  timer: number;
  maxTimer: number;
  nextStrikeTimer: number;
  flashAlpha: number;
  windZones: WindZone[];
  lightningBolts: LightningBolt[];
}

export function createInitialCyberStormState(rand: () => number = Math.random): CyberStormState {
  const calmDuration =
    CYBER_STORM_CALM_MIN_SEC + rand() * (CYBER_STORM_CALM_MAX_SEC - CYBER_STORM_CALM_MIN_SEC);
  return {
    phase: 'calm',
    timer: Number(calmDuration.toFixed(2)),
    maxTimer: Number(calmDuration.toFixed(2)),
    nextStrikeTimer: 0,
    flashAlpha: 0,
    windZones: [],
    lightningBolts: [],
  };
}

const WIND_ZONE_TEMPLATES = [
  { label: 'ION JETSTREAM', color: '#00f3ff' },
  { label: 'PLASMA GALE', color: '#c084fc' },
  { label: 'MAG-UPDRAFT', color: '#38bdf8' },
  { label: 'SURGE VORTEX', color: '#e879f9' },
];

/**
 * Generates localized wind zones scattered across the arena during a Cyber-Storm.
 */
export function generateCyberStormZones(
  arenaW: number,
  arenaH: number,
  count: number = 3,
  rand: () => number = Math.random
): WindZone[] {
  const safeCount = Math.max(2, Math.min(5, Math.floor(count)));
  const zones: WindZone[] = [];
  const margin = 280;

  for (let i = 0; i < safeCount; i++) {
    const sectorW = (arenaW - margin * 2) / safeCount;
    const baseX = margin + sectorW * i + rand() * Math.max(80, sectorW * 0.75);
    const baseY = margin + rand() * Math.max(120, arenaH - margin * 2);
    const tpl = WIND_ZONE_TEMPLATES[i % WIND_ZONE_TEMPLATES.length];
    zones.push({
      id: i + 1,
      x: Math.round(Math.max(margin, Math.min(arenaW - margin, baseX))),
      y: Math.round(Math.max(margin, Math.min(arenaH - margin, baseY))),
      radius: Math.round(230 + rand() * 80),
      dirAngle: Number((rand() * Math.PI * 2).toFixed(3)),
      strength: Number((0.14 + rand() * 0.08).toFixed(3)),
      label: tpl.label,
      color: tpl.color,
    });
  }

  return zones;
}

/**
 * Procedurally creates a jagged neon lightning arc inside the arena.
 */
export function generateLightningBolt(
  arenaW: number,
  arenaH: number,
  rand: () => number = Math.random
): LightningBolt {
  const x1 = Math.round(120 + rand() * Math.max(200, arenaW - 240));
  const y1 = Math.round(80 + rand() * Math.max(200, arenaH * 0.35));
  const x2 = Math.round(Math.max(80, Math.min(arenaW - 80, x1 + (rand() - 0.5) * 320)));
  const y2 = Math.round(Math.min(arenaH - 80, y1 + 320 + rand() * 480));

  const segments = 7;
  const points: Array<{ x: number; y: number }> = [{ x: x1, y: y1 }];
  for (let s = 1; s < segments; s++) {
    const t = s / segments;
    const jx = (rand() - 0.5) * 68;
    const jy = (rand() - 0.5) * 28;
    points.push({
      x: Math.round(x1 + (x2 - x1) * t + jx),
      y: Math.round(y1 + (y2 - y1) * t + jy),
    });
  }
  points.push({ x: x2, y: y2 });

  const color = rand() < 0.55 ? '#38bdf8' : '#e879f9';
  return {
    x1,
    y1,
    x2,
    y2,
    points,
    color,
    life: 0.28,
    maxLife: 0.28,
  };
}

/**
 * Advances the procedural Cyber-Storm weather cycle, lightning strikes, and active bolts.
 */
export function stepCyberStormState(
  state: CyberStormState,
  dt: number,
  arenaW: number,
  arenaH: number,
  rand: () => number = Math.random
): {
  state: CyberStormState;
  phaseChangedTo?: CyberStormPhase;
  struckLightning: boolean;
} {
  const safeDt = Math.max(0, dt);
  let phase = state.phase;
  let timer = Math.max(0, state.timer - safeDt);
  let maxTimer = state.maxTimer;
  let nextStrikeTimer = state.nextStrikeTimer;
  let flashAlpha = Math.max(0, state.flashAlpha - safeDt * 1.9);
  let windZones = state.windZones;
  const lightningBolts = state.lightningBolts
    .map((b) => ({ ...b, life: b.life - safeDt }))
    .filter((b) => b.life > 0);

  let phaseChangedTo: CyberStormPhase | undefined;
  let struckLightning = false;

  if (phase === 'calm') {
    if (timer <= 0) {
      phase = 'warning';
      timer = CYBER_STORM_WARNING_SEC;
      maxTimer = CYBER_STORM_WARNING_SEC;
      phaseChangedTo = 'warning';
    }
  } else if (phase === 'warning') {
    if (timer <= 0) {
      phase = 'storm';
      const stormDur =
        CYBER_STORM_DURATION_MIN_SEC +
        rand() * (CYBER_STORM_DURATION_MAX_SEC - CYBER_STORM_DURATION_MIN_SEC);
      timer = Number(stormDur.toFixed(2));
      maxTimer = timer;
      windZones = generateCyberStormZones(arenaW, arenaH, 3 + (rand() > 0.6 ? 1 : 0), rand);
      nextStrikeTimer = 0.35 + rand() * 0.9;
      phaseChangedTo = 'storm';
    }
  } else if (phase === 'storm') {
    nextStrikeTimer -= safeDt;
    if (nextStrikeTimer <= 0) {
      lightningBolts.push(generateLightningBolt(arenaW, arenaH, rand));
      flashAlpha = 0.26;
      struckLightning = true;
      nextStrikeTimer = 1.1 + rand() * 1.9;
    }

    if (timer <= 0) {
      phase = 'calm';
      const calmDur =
        CYBER_STORM_CALM_MIN_SEC + rand() * (CYBER_STORM_CALM_MAX_SEC - CYBER_STORM_CALM_MIN_SEC);
      timer = Number(calmDur.toFixed(2));
      maxTimer = timer;
      windZones = [];
      nextStrikeTimer = 0;
      phaseChangedTo = 'calm';
    }
  }

  return {
    state: {
      phase,
      timer,
      maxTimer,
      nextStrikeTimer,
      flashAlpha: Number(flashAlpha.toFixed(3)),
      windZones,
      lightningBolts,
    },
    phaseChangedTo,
    struckLightning,
  };
}

/**
 * Evaluates how localized Cyber-Storm wind zones affect player movement speed & gentle wind drift.
 */
export function computeWindZoneMovementEffect(
  playerX: number,
  playerY: number,
  moveX: number,
  moveY: number,
  zones: WindZone[]
): {
  inWindZone: boolean;
  speedMultiplier: number;
  driftVx: number;
  driftVy: number;
  windLabel: string;
  activeZone: WindZone | null;
} {
  for (let i = 0; i < zones.length; i++) {
    const z = zones[i];
    const dist = Math.hypot(playerX - z.x, playerY - z.y);
    if (dist <= z.radius) {
      const windDx = Math.cos(z.dirAngle);
      const windDy = Math.sin(z.dirAngle);
      const moveMag = Math.hypot(moveX, moveY);
      let alignment = 0;
      if (moveMag > 0.01) {
        alignment = (moveX / moveMag) * windDx + (moveY / moveMag) * windDy;
      }
      // Slight speed influence: moving with wind boosts up to +18%, against slows up to -14%
      const speedMultiplier = Number((1 + alignment * z.strength).toFixed(3));
      const driftMagnitude = z.strength * 240;
      const windLabel =
        alignment > 0.35
          ? `TAILWIND +${Math.round(alignment * z.strength * 100)}%`
          : alignment < -0.35
          ? `HEADWIND ${Math.round(alignment * z.strength * 100)}%`
          : z.label;

      return {
        inWindZone: true,
        speedMultiplier,
        driftVx: Number((windDx * driftMagnitude).toFixed(2)),
        driftVy: Number((windDy * driftMagnitude).toFixed(2)),
        windLabel,
        activeZone: z,
      };
    }
  }

  return {
    inWindZone: false,
    speedMultiplier: 1.0,
    driftVx: 0,
    driftVy: 0,
    windLabel: '',
    activeZone: null,
  };
}

// --- Dash Overcharge (Perfect-Timing Defensive Dash) ---
export const DASH_OVERCHARGE_THREAT_RADIUS = 105;
export const DASH_OVERCHARGE_PROJECTILE_LOOKAHEAD_SEC = 0.24;
export const DASH_OVERCHARGE_DURATION_SEC = 5.0;
export const DASH_OVERCHARGE_INVULN_SEC = 0.85;
export const DASH_OVERCHARGE_RANGE_MULT = 2.0;
export const NORMAL_DASH_SPEED_MULT = 2.8;

export interface PerfectDashThreatResult {
  isPerfectTiming: boolean;
  threatType: 'projectile' | 'slam' | 'lunge' | 'melee' | 'none';
  threatDistance: number;
}

/**
 * Evaluates whether an enemy projectile or enemy attack is about to strike the player,
 * enabling a Perfect-Timing Dash -> Dash Overcharge trigger.
 */
export function detectPerfectDashThreat(params: {
  playerX: number;
  playerY: number;
  playerRadius: number;
  enemyProjectiles: ReadonlyArray<{ x: number; y: number; vx: number; vy: number; radius: number }>;
  enemies: ReadonlyArray<{
    x: number;
    y: number;
    radius: number;
    type: EnemyType;
    state: 'seek' | 'windup' | 'attack' | 'cooldown' | 'ko';
    telegraphTimer: number;
  }>;
}): PerfectDashThreatResult {
  const { playerX, playerY, playerRadius, enemyProjectiles, enemies } = params;
  let closestDist = Infinity;
  let detectedType: PerfectDashThreatResult['threatType'] = 'none';

  // 1. Check incoming enemy projectiles (closing within imminent hit radius or lookahead trajectory)
  for (let i = 0; i < enemyProjectiles.length; i++) {
    const p = enemyProjectiles[i];
    const toPlayerX = playerX - p.x;
    const toPlayerY = playerY - p.y;
    const dist = Math.hypot(toPlayerX, toPlayerY);
    const contactDist = playerRadius + p.radius;
    const speedSq = p.vx * p.vx + p.vy * p.vy;

    // Velocity alignment: moving toward player
    const closingDot = toPlayerX * p.vx + toPlayerY * p.vy;
    const gap = Math.max(0, dist - contactDist);

    let isImminentProj = gap <= DASH_OVERCHARGE_THREAT_RADIUS && closingDot > 0;

    // Continuous closest-approach check over next lookahead window
    if (!isImminentProj && speedSq > 1 && closingDot > 0) {
      const tClosest = Math.max(
        0,
        Math.min(DASH_OVERCHARGE_PROJECTILE_LOOKAHEAD_SEC, closingDot / speedSq)
      );
      const futureX = p.x + p.vx * tClosest;
      const futureY = p.y + p.vy * tClosest;
      const futureDist = Math.hypot(playerX - futureX, playerY - futureY);
      if (futureDist <= contactDist + 34) {
        isImminentProj = true;
      }
    }

    if (isImminentProj && dist < closestDist) {
      closestDist = dist;
      detectedType = 'projectile';
    }
  }

  // 2. Check imminent enemy melee, lunge, or ground slam attacks
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.state === 'ko') continue;
    const dist = Math.hypot(playerX - e.x, playerY - e.y);
    const contactDist = playerRadius + e.radius;

    // Ground slam / seismic shockwave windup just before detonation
    if (
      (e.type === 'tank' || e.type === 'shield_breaker') &&
      e.state === 'windup' &&
      e.telegraphTimer <= 0.42 &&
      dist <= 195
    ) {
      if (dist < closestDist) {
        closestDist = dist;
        detectedType = 'slam';
      }
      continue;
    }

    // Active lunge / phase strike or late windup inside strike zone
    if (
      (e.state === 'attack' || (e.state === 'windup' && e.telegraphTimer <= 0.32)) &&
      dist <= contactDist + DASH_OVERCHARGE_THREAT_RADIUS
    ) {
      if (dist < closestDist) {
        closestDist = dist;
        detectedType = 'lunge';
      }
      continue;
    }

    // Close-quarters imminent contact strike
    if (dist <= contactDist + 64) {
      if (dist < closestDist) {
        closestDist = dist;
        detectedType = 'melee';
      }
    }
  }

  return {
    isPerfectTiming: detectedType !== 'none',
    threatType: detectedType,
    threatDistance: Number.isFinite(closestDist) ? Number(closestDist.toFixed(1)) : 0,
  };
}

export interface DashMotionParams {
  speed: number;
  duration: number;
  range: number;
  rangeMultiplier: number;
  isOvercharged: boolean;
}

/**
 * Computes dash velocity and duration, strictly doubling total dash range while Overcharged.
 */
export function computeDashMotionParams(
  baseMoveSpeed: number,
  baseDashDuration: number,
  isOvercharged: boolean
): DashMotionParams {
  const safeBaseSpeed = Math.max(80, baseMoveSpeed || 360);
  const safeDuration = Math.max(0.08, baseDashDuration || 0.22);
  const normalDashSpeed = safeBaseSpeed * NORMAL_DASH_SPEED_MULT;

  if (!isOvercharged) {
    return {
      speed: Number(normalDashSpeed.toFixed(2)),
      duration: Number(safeDuration.toFixed(3)),
      range: Number((normalDashSpeed * safeDuration).toFixed(2)),
      rangeMultiplier: 1.0,
      isOvercharged: false,
    };
  }

  // 1.6x speed * 1.25x duration = 2.0x exact dash range
  const overchargeSpeed = normalDashSpeed * 1.6;
  const overchargeDuration = safeDuration * 1.25;
  return {
    speed: Number(overchargeSpeed.toFixed(2)),
    duration: Number(overchargeDuration.toFixed(3)),
    range: Number((overchargeSpeed * overchargeDuration).toFixed(2)),
    rangeMultiplier: DASH_OVERCHARGE_RANGE_MULT,
    isOvercharged: true,
  };
}

export function stepDashOverchargeState(
  timer: number,
  dt: number
): {
  isOvercharged: boolean;
  remainingSeconds: number;
  percent: number;
} {
  const remainingSeconds = Math.max(0, Number(((timer || 0) - Math.max(0, dt)).toFixed(3)));
  const isOvercharged = remainingSeconds > 0;
  const percent = isOvercharged
    ? Math.max(0, Math.min(100, Math.round((remainingSeconds / DASH_OVERCHARGE_DURATION_SEC) * 100)))
    : 0;
  return {
    isOvercharged,
    remainingSeconds,
    percent,
  };
}

// --- Retro-Futuristic Screen-Shake & Camera Impact System ---
export const MAX_SCREEN_SHAKE_PX = 28;
export const MAX_SCREEN_SHAKE_ANGLE_RAD = 0.024;

export type BossAttackShakeType =
  | 'goliath_barrage'
  | 'goliath_nova'
  | 'behemoth_cannon'
  | 'behemoth_seismic'
  | 'tank_slam'
  | 'heavy_explosion';

/**
 * Computes weight-scaled camera trauma added when firing each weapon archetype.
 * Heavy monster-tier and god-tier cannons produce pronounced recoil kick & shake.
 */
export function getWeaponFireShakeTrauma(
  weaponId: WeaponType,
  tier: WeaponTier = 'starter'
): number {
  switch (weaponId) {
    case 'omega_singularity':
      return 0.34;
    case 'celestial_eclipse':
      return 0.32;
    case 'supernova':
      return 0.35;
    case 'hyperion_astral':
      return 0.30;
    case 'void_rail':
      return 0.24;
    case 'vortex':
      return 0.28;
    case 'aegis_titan':
      return 0.25;
    case 'leviathan':
      return 0.24;
    case 'cryo_shatter':
      return 0.19;
    case 'chrono_thunder':
      return 0.20;
    case 'plasma_scythe':
    case 'prism_splitter':
      return 0.13;
    case 'beam':
      return 0.14;
    case 'missile':
      return 0.13;
    case 'scatter':
      return 0.11;
    case 'inferno':
      return 0.055;
    case 'pulse':
      return 0.035;
    default:
      if (tier === 'godtier') return 0.26;
      if (tier === 'monster' || tier === 'heavy') return 0.20;
      if (tier === 'advanced') return 0.12;
      return 0.04;
  }
}

/**
 * Computes camera trauma for boss attacks and heavy explosions, gently attenuated by distance.
 */
export function getBossAttackShakeTrauma(
  attackType: BossAttackShakeType,
  distanceToPlayer: number = 0
): number {
  let base = 0.22;
  switch (attackType) {
    case 'goliath_nova':
      base = 0.50;
      break;
    case 'behemoth_seismic':
      base = 0.36;
      break;
    case 'goliath_barrage':
      base = 0.34;
      break;
    case 'heavy_explosion':
      base = 0.26;
      break;
    case 'tank_slam':
      base = 0.24;
      break;
    case 'behemoth_cannon':
      base = 0.20;
      break;
  }
  const safeDist = Math.max(0, distanceToPlayer || 0);
  const attenuation = Math.max(0.65, 1 - (safeDist / 900) * 0.35);
  return Number((base * attenuation).toFixed(3));
}

export interface CameraShakeSample {
  shakeOffsetX: number;
  shakeOffsetY: number;
  shakeAngle: number;
  glitchAlpha: number;
  magnitude: number;
}

export interface CameraShakeProfile {
  intensityScale: number;
  fireShakeScale: number;
  maxTraumaCap: number;
  allowCanvasRotation: boolean;
  allowGlitchOverlay: boolean;
}

/**
 * Returns device- and performance-aware camera vibration limits so gameplay stays
 * crisp and responsive without dizzying screen shake or rotated-canvas GPU hangs.
 */
export function getCameraShakeProfile(
  mode: PerformanceMode = 'auto',
  isMobile: boolean = false,
  tier: AdaptiveQualityTier = 'high'
): CameraShakeProfile {
  if (mode === 'mobile_turbo' || tier === 'performance') {
    return {
      intensityScale: 0,
      fireShakeScale: 0,
      maxTraumaCap: 0,
      allowCanvasRotation: false,
      allowGlitchOverlay: false,
    };
  }
  if (isMobile) {
    return {
      intensityScale: 0.08,
      fireShakeScale: 0,
      maxTraumaCap: 0.22,
      allowCanvasRotation: false,
      allowGlitchOverlay: false,
    };
  }
  if (mode === 'high') {
    return {
      intensityScale: 0.14,
      fireShakeScale: 0,
      maxTraumaCap: 0.28,
      allowCanvasRotation: false,
      allowGlitchOverlay: false,
    };
  }
  return {
    intensityScale: 0.10,
    fireShakeScale: 0,
    maxTraumaCap: 0.24,
    allowCanvasRotation: false,
    allowGlitchOverlay: false,
  };
}

/**
 * Computes positional jitter, directional recoil blend, rotational camera kick,
 * and retro CRT chromatic glitch pulse from current trauma [0..1].
 */
export function computeCameraShakeSample(
  trauma: number,
  rand: () => number = Math.random,
  recoilX: number = 0,
  recoilY: number = 0,
  intensityScale: number = 1,
  allowRotation: boolean = true
): CameraShakeSample {
  const clamped = Math.max(0, Math.min(1, trauma || 0));
  const safeScale = Math.max(0, intensityScale);
  if (
    (clamped <= 0.001 || safeScale <= 0.001) &&
    Math.abs(recoilX) < 0.05 &&
    Math.abs(recoilY) < 0.05
  ) {
    return {
      shakeOffsetX: 0,
      shakeOffsetY: 0,
      shakeAngle: 0,
      glitchAlpha: 0,
      magnitude: 0,
    };
  }
  const power = clamped * clamped * safeScale;
  const magnitude = power * MAX_SCREEN_SHAKE_PX;
  const jitterX = (rand() * 2 - 1) * magnitude;
  const jitterY = (rand() * 2 - 1) * magnitude;
  const shakeAngle = allowRotation
    ? Number(((rand() * 2 - 1) * power * MAX_SCREEN_SHAKE_ANGLE_RAD).toFixed(5))
    : 0;
  const glitchAlpha =
    clamped > 0.22 && safeScale >= 0.2
      ? Number(Math.min(0.35, ((clamped - 0.22) / 0.78) * 0.35 * Math.min(1, safeScale)).toFixed(3))
      : 0;

  return {
    shakeOffsetX: Number((jitterX + recoilX).toFixed(2)),
    shakeOffsetY: Number((jitterY + recoilY).toFixed(2)),
    shakeAngle,
    glitchAlpha,
    magnitude: Number(magnitude.toFixed(2)),
  };
}

// --- Rendering Performance & Viewport Culling Helpers ---
export const MAX_CANVAS_DPR = 1.5;
export const MOBILE_MAX_CANVAS_DPR = 1.0;

export type PerformanceMode = 'auto' | 'mobile_turbo' | 'high';
export const PERFORMANCE_MODE_STORAGE_KEY = 'nabilbot_performance_mode';

export function loadPerformanceMode(): PerformanceMode {
  if (typeof window === 'undefined') return 'auto';
  try {
    const raw = localStorage.getItem(PERFORMANCE_MODE_STORAGE_KEY);
    if (raw === 'auto' || raw === 'mobile_turbo' || raw === 'high') {
      return raw;
    }
  } catch {
    // ignore storage restriction
  }
  return 'auto';
}

export function savePerformanceMode(mode: PerformanceMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERFORMANCE_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore storage restriction
  }
}

export function getOptimalCanvasDpr(
  devicePixelRatio: number = 1,
  isMobileViewport: boolean = false,
  mode: PerformanceMode = 'auto'
): number {
  const safeDpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  if (mode === 'mobile_turbo') {
    return 1;
  }
  const cap = isMobileViewport && mode === 'auto' ? MOBILE_MAX_CANVAS_DPR : MAX_CANVAS_DPR;
  return Math.max(1, Math.min(cap, safeDpr));
}

export function shouldThrottleCanvasRender(params: {
  gameState: string;
  overlayCoveringCanvas: boolean;
  isTabHidden?: boolean;
}): 'pause' | 'throttle' | 'full' {
  if (params.isTabHidden) return 'pause';
  if (params.gameState === 'paused') return 'throttle';
  if (params.gameState === 'title' && params.overlayCoveringCanvas) return 'throttle';
  return 'full';
}

export interface ViewportCullBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function computeViewportCullBounds(
  camX: number,
  camY: number,
  viewWidth: number,
  viewHeight: number,
  cameraScale: number = 1,
  margin: number = 120
): ViewportCullBounds {
  const safeScale = Math.max(0.2, cameraScale || 1);
  const halfW = (viewWidth * 0.5) / safeScale + margin;
  const halfH = (viewHeight * 0.5) / safeScale + margin;
  return {
    minX: camX - halfW,
    maxX: camX + halfW,
    minY: camY - halfH,
    maxY: camY + halfH,
  };
}

export function isInViewportBounds(
  x: number,
  y: number,
  radius: number,
  bounds: ViewportCullBounds
): boolean {
  return (
    x + radius >= bounds.minX &&
    x - radius <= bounds.maxX &&
    y + radius >= bounds.minY &&
    y - radius <= bounds.maxY
  );
}

// --- Real-Time System Health Debug Telemetry Helpers ---
export type SystemHealthStatus = 'OPTIMAL' | 'MODERATE' | 'LAGGING';

export interface SystemHealthSnapshot {
  fps: number;
  avgFrameMs: number;
  workMs: number;
  frameDrops: number;
  memoryUsedMb: number | null;
  memoryLimitMb: number | null;
  memoryPercent: number | null;
  activeEnemies: number;
  activeProjectiles: number;
  activeParticles: number;
  activePickups: number;
  canvasDpr: number;
  healthStatus: SystemHealthStatus;
  diagnosticHint: string;
}

export function evaluateSystemHealthStatus(
  fps: number,
  avgWorkMs: number
): SystemHealthStatus {
  if (fps >= 50 && avgWorkMs <= 14) return 'OPTIMAL';
  if (fps >= 30 && avgWorkMs <= 24) return 'MODERATE';
  return 'LAGGING';
}

export function formatMemoryUsageLabel(
  usedMb: number | null,
  limitMb: number | null
): string {
  if (usedMb === null || !Number.isFinite(usedMb)) {
    return 'N/A (Browser Restricted)';
  }
  if (limitMb !== null && Number.isFinite(limitMb) && limitMb > 0) {
    return `${usedMb.toFixed(1)} / ${Math.round(limitMb)} MB`;
  }
  return `${usedMb.toFixed(1)} MB`;
}

export function computeSystemHealthSnapshot(params: {
  fps: number;
  avgFrameMs: number;
  workMs: number;
  frameDrops?: number;
  usedJsHeapBytes?: number | null;
  jsHeapSizeLimitBytes?: number | null;
  activeEnemies?: number;
  activeProjectiles?: number;
  activeParticles?: number;
  activePickups?: number;
  canvasDpr?: number;
}): SystemHealthSnapshot {
  const safeFps = Math.max(0, Math.round(params.fps || 0));
  const safeAvgFrameMs = Number(Math.max(0, params.avgFrameMs || 0).toFixed(1));
  const safeWorkMs = Number(Math.max(0, params.workMs || 0).toFixed(2));
  const safeDrops = Math.max(0, Math.round(params.frameDrops || 0));

  const hasMem =
    typeof params.usedJsHeapBytes === 'number' &&
    Number.isFinite(params.usedJsHeapBytes) &&
    params.usedJsHeapBytes >= 0;
  const memoryUsedMb = hasMem
    ? Number(((params.usedJsHeapBytes as number) / (1024 * 1024)).toFixed(1))
    : null;
  const hasLimit =
    hasMem &&
    typeof params.jsHeapSizeLimitBytes === 'number' &&
    Number.isFinite(params.jsHeapSizeLimitBytes) &&
    params.jsHeapSizeLimitBytes > 0;
  const memoryLimitMb = hasLimit
    ? Number(((params.jsHeapSizeLimitBytes as number) / (1024 * 1024)).toFixed(0))
    : null;
  const memoryPercent =
    memoryUsedMb !== null && memoryLimitMb !== null && memoryLimitMb > 0
      ? Math.min(100, Math.max(0, Number(((memoryUsedMb / memoryLimitMb) * 100).toFixed(1))))
      : null;

  const healthStatus = evaluateSystemHealthStatus(safeFps, safeWorkMs);

  let diagnosticHint = 'Smooth 60fps pipeline · Offscreen caches & culling active';
  if (healthStatus === 'LAGGING') {
    if (safeWorkMs > 20) {
      diagnosticHint = 'High CPU/GPU load · Enable Turbo Low-Lag mode or Clear FX';
    } else {
      diagnosticHint = 'Low refresh rate · Disable battery saver or enable Turbo mode';
    }
  } else if (healthStatus === 'MODERATE' || safeDrops >= 3) {
    diagnosticHint = 'Minor frame spikes detected · Keep background tabs minimal';
  } else if (memoryPercent !== null && memoryPercent >= 75) {
    diagnosticHint = 'Elevated JS heap memory · Reload if session grows sluggish';
  }

  return {
    fps: safeFps,
    avgFrameMs: safeAvgFrameMs,
    workMs: safeWorkMs,
    frameDrops: safeDrops,
    memoryUsedMb,
    memoryLimitMb,
    memoryPercent,
    activeEnemies: Math.max(0, Math.round(params.activeEnemies || 0)),
    activeProjectiles: Math.max(0, Math.round(params.activeProjectiles || 0)),
    activeParticles: Math.max(0, Math.round(params.activeParticles || 0)),
    activePickups: Math.max(0, Math.round(params.activePickups || 0)),
    canvasDpr: Number((params.canvasDpr || 1).toFixed(2)),
    healthStatus,
    diagnosticHint,
  };
}

// --- Adaptive Performance & Render Quality Scaling ---
export type AdaptiveQualityTier = 'high' | 'balanced' | 'performance';

export interface AdaptiveQualityState {
  tier: AdaptiveQualityTier;
  effectiveDpr: number;
  maxParticlesCap: number;
  drawProjectileTrails: boolean;
  drawSecondaryGlows: boolean;
  maxFloatingTexts: number;
  simplifyPickups: boolean;
  skipAtmosphericOverlay: boolean;
}

export function computeAdaptiveQualityState(params: {
  fps: number;
  workMs: number;
  baseDpr: number;
  activeProjectiles?: number;
  isMobile?: boolean;
  mode?: PerformanceMode;
}): AdaptiveQualityState {
  const safeFps = Number.isFinite(params.fps) ? params.fps : 60;
  const safeWorkMs = Number.isFinite(params.workMs) ? params.workMs : 2;
  const isMobile = Boolean(params.isMobile);
  const mode: PerformanceMode = params.mode || 'auto';
  const maxDprCap = isMobile ? MOBILE_MAX_CANVAS_DPR : MAX_CANVAS_DPR;
  const safeDpr = Math.max(1, Math.min(maxDprCap, params.baseDpr || 1));
  const projs = Math.max(0, params.activeProjectiles || 0);

  if (mode === 'mobile_turbo') {
    return {
      tier: 'performance',
      effectiveDpr: 1.0,
      maxParticlesCap: 85,
      drawProjectileTrails: false,
      drawSecondaryGlows: false,
      maxFloatingTexts: 16,
      simplifyPickups: true,
      skipAtmosphericOverlay: true,
    };
  }

  if (mode === 'high') {
    return {
      tier: 'high',
      effectiveDpr: Number(Math.min(MAX_CANVAS_DPR, Math.max(1, params.baseDpr || 1)).toFixed(2)),
      maxParticlesCap: 320,
      drawProjectileTrails: projs <= 65,
      drawSecondaryGlows: true,
      maxFloatingTexts: 40,
      simplifyPickups: false,
      skipAtmosphericOverlay: false,
    };
  }

  const perfFpsCutoff = isMobile ? 48 : 38;
  const perfWorkCutoff = isMobile ? 10 : 16;
  const balFpsCutoff = isMobile ? 56 : 52;
  const balWorkCutoff = isMobile ? 6.5 : 10;

  if (safeFps < perfFpsCutoff || safeWorkMs > perfWorkCutoff) {
    return {
      tier: 'performance',
      effectiveDpr: 1.0,
      maxParticlesCap: isMobile ? 75 : 110,
      drawProjectileTrails: false,
      drawSecondaryGlows: false,
      maxFloatingTexts: isMobile ? 14 : 18,
      simplifyPickups: true,
      skipAtmosphericOverlay: true,
    };
  }

  if (safeFps < balFpsCutoff || safeWorkMs > balWorkCutoff) {
    return {
      tier: 'balanced',
      effectiveDpr: Number(Math.min(safeDpr, isMobile ? 1.0 : 1.25).toFixed(2)),
      maxParticlesCap: isMobile ? 110 : 200,
      drawProjectileTrails: projs <= (isMobile ? 16 : 40),
      drawSecondaryGlows: !isMobile,
      maxFloatingTexts: isMobile ? 16 : 28,
      simplifyPickups: isMobile,
      skipAtmosphericOverlay: isMobile,
    };
  }

  return {
    tier: 'high',
    effectiveDpr: Number(safeDpr.toFixed(2)),
    maxParticlesCap: isMobile ? 150 : 320,
    drawProjectileTrails: projs <= (isMobile ? 28 : 65),
    drawSecondaryGlows: true,
    maxFloatingTexts: isMobile ? 22 : 40,
    simplifyPickups: false,
    skipAtmosphericOverlay: false,
  };
}

// --- Shield-Breaker Kinetic Barrier Tactical Combat Rules ---
export const SHIELD_BREAKER_BYPASS_WEAPONS: readonly WeaponType[] = [
  'beam',
  'void_rail',
  'hyperion_astral',
  'aegis_titan',
  'omega_singularity',
  'chrono_thunder',
  'celestial_eclipse',
];

const SHIELD_BREAKER_BYPASS_SET = new Set<WeaponType>(SHIELD_BREAKER_BYPASS_WEAPONS);

export function isBarrierBypassWeapon(weapon?: WeaponType): boolean {
  if (!weapon) return false;
  return SHIELD_BREAKER_BYPASS_SET.has(weapon);
}

export function computeShieldBreakerBarrierHp(enemyMaxHp: number): number {
  return Math.max(40, Math.round(enemyMaxHp * 1.15));
}

export interface ShieldBreakerImpactResult {
  hullDamage: number;
  barrierDamage: number;
  nextBarrierHp: number;
  bypassed: boolean;
  barrierShattered: boolean;
  resisted: boolean;
}

/**
 * Resolves projectile impact against a Shield-Breaker's 360-degree kinetic barrier.
 * Beam, Rail, Electric & Singularity weapons bypass the kinetic barrier directly (+25% armor-pierce damage).
 * Standard weapons are 75% absorbed by the active barrier while draining barrier integrity until overload.
 */
export function resolveShieldBreakerImpact(params: {
  rawDamage: number;
  weaponType?: WeaponType;
  barrierHp: number;
}): ShieldBreakerImpactResult {
  const safeRaw = Math.max(1, Math.round(params.rawDamage));
  const safeBarrier = Math.max(0, params.barrierHp);

  if (safeBarrier <= 0) {
    return {
      hullDamage: safeRaw,
      barrierDamage: 0,
      nextBarrierHp: 0,
      bypassed: false,
      barrierShattered: false,
      resisted: false,
    };
  }

  if (isBarrierBypassWeapon(params.weaponType)) {
    const hullDamage = Math.max(1, Math.round(safeRaw * 1.25));
    const barrierDamage = Math.max(1, Math.round(safeRaw * 0.35));
    const nextBarrierHp = Math.max(0, safeBarrier - barrierDamage);
    return {
      hullDamage,
      barrierDamage,
      nextBarrierHp,
      bypassed: true,
      barrierShattered: nextBarrierHp <= 0,
      resisted: false,
    };
  }

  const hullDamage = Math.max(1, Math.round(safeRaw * 0.25));
  const barrierDamage = Math.max(1, Math.round(safeRaw * 0.85));
  const nextBarrierHp = Math.max(0, safeBarrier - barrierDamage);
  return {
    hullDamage,
    barrierDamage,
    nextBarrierHp,
    bypassed: false,
    barrierShattered: nextBarrierHp <= 0,
    resisted: true,
  };
}

// --- Pure Virtual Touch Control Helpers ---
export function computeTouchStickVector(
  dx: number,
  dy: number,
  maxRadius: number,
  deadzoneRatio: number = 0.12
): {
  normX: number;
  normY: number;
  knobX: number;
  knobY: number;
  magnitude: number;
} {
  const safeRadius = Math.max(1, maxRadius);
  const safeDeadzone = Math.max(0, Math.min(0.45, deadzoneRatio));
  const rawDist = Math.hypot(dx, dy);

  if (rawDist <= 0.0001) {
    return { normX: 0, normY: 0, knobX: 0, knobY: 0, magnitude: 0 };
  }

  const clampedDist = Math.min(safeRadius, rawDist);
  const ux = dx / rawDist;
  const uy = dy / rawDist;
  const knobX = ux * clampedDist;
  const knobY = uy * clampedDist;

  const rawRatio = clampedDist / safeRadius;
  if (rawRatio <= safeDeadzone) {
    return { normX: 0, normY: 0, knobX, knobY, magnitude: 0 };
  }

  const scaledMag = Math.min(1, (rawRatio - safeDeadzone) / (1 - safeDeadzone));
  return {
    normX: ux * scaledMag,
    normY: uy * scaledMag,
    knobX,
    knobY,
    magnitude: scaledMag,
  };
}

export function computeTouchAimVector(
  dx: number,
  dy: number,
  thresholdPx: number = 12
): {
  active: boolean;
  angle: number | null;
  knobX: number;
  knobY: number;
} {
  const dist = Math.hypot(dx, dy);
  const maxDot = 22;
  if (dist < thresholdPx) {
    return { active: false, angle: null, knobX: 0, knobY: 0 };
  }
  const clamped = Math.min(maxDot, dist);
  const ux = dx / dist;
  const uy = dy / dist;
  return {
    active: true,
    angle: Math.atan2(dy, dx),
    knobX: ux * clamped,
    knobY: uy * clamped,
  };
}

export function getNextUnlockedWeapon(
  currentWeapon: WeaponType,
  unlockedWeapons: Partial<Record<WeaponType, boolean>>,
  order: readonly WeaponType[],
  direction: 1 | -1 = 1
): WeaponType {
  const unlocked = order.filter((w) => Boolean(unlockedWeapons[w]));
  if (unlocked.length === 0) return currentWeapon;
  const currentIdx = unlocked.indexOf(currentWeapon);
  if (currentIdx === -1) return unlocked[0];
  const nextIdx = (currentIdx + direction + unlocked.length) % unlocked.length;
  return unlocked[nextIdx];
}

// --- Pure In-Memory Combat Progress Batching Buffer (Eliminates Per-Kill localStorage Stalls) ---
export interface PendingCombatProgressBuffer {
  dirty: boolean;
  missionKillsTotal: number;
  missionKillsSwarmer: number;
  missionKillsSniper: number;
  missionKillsTank: number;
  missionKillsPhantom: number;
  missionKillsBoss: number;
  missionCoinsCollected: number;
  eventKillsTotal: number;
  eventKillsSwarmer: number;
  eventKillsSniper: number;
  eventKillsTank: number;
  eventKillsPhantom: number;
  eventKillsBoss: number;
  eventCoinsCollected: number;
  eventMaxCombo: number;
  achKills: number;
  achBehemoth: number;
  achPhantom: number;
  achStormDrone: number;
  achBossLevel: number;
  achCoins: number;
  achMaxCombo: number;
}

export function createPendingCombatProgressBuffer(): PendingCombatProgressBuffer {
  return {
    dirty: false,
    missionKillsTotal: 0,
    missionKillsSwarmer: 0,
    missionKillsSniper: 0,
    missionKillsTank: 0,
    missionKillsPhantom: 0,
    missionKillsBoss: 0,
    missionCoinsCollected: 0,
    eventKillsTotal: 0,
    eventKillsSwarmer: 0,
    eventKillsSniper: 0,
    eventKillsTank: 0,
    eventKillsPhantom: 0,
    eventKillsBoss: 0,
    eventCoinsCollected: 0,
    eventMaxCombo: 0,
    achKills: 0,
    achBehemoth: 0,
    achPhantom: 0,
    achStormDrone: 0,
    achBossLevel: 0,
    achCoins: 0,
    achMaxCombo: 0,
  };
}

export function accumulatePendingKillProgress(
  buf: PendingCombatProgressBuffer,
  enemyType: EnemyType,
  comboStreak: number,
  currentLevel: number
): void {
  buf.dirty = true;
  buf.missionKillsTotal += 1;
  buf.eventKillsTotal += 1;
  buf.achKills += 1;

  if (comboStreak > buf.eventMaxCombo) buf.eventMaxCombo = comboStreak;
  if (comboStreak >= 5 && comboStreak > buf.achMaxCombo) buf.achMaxCombo = comboStreak;

  if (enemyType === 'swarmer') {
    buf.missionKillsSwarmer += 1;
    buf.eventKillsSwarmer += 1;
  } else if (enemyType === 'sniper' || enemyType === 'storm_drone') {
    buf.missionKillsSniper += 1;
    buf.eventKillsSniper += 1;
    if (enemyType === 'storm_drone') buf.achStormDrone += 1;
  } else if (enemyType === 'tank' || enemyType === 'behemoth' || enemyType === 'shield_breaker') {
    buf.missionKillsTank += 1;
    buf.eventKillsTank += 1;
    buf.achBehemoth += 1;
  } else if (enemyType === 'phantom') {
    buf.missionKillsPhantom += 1;
    buf.eventKillsPhantom += 1;
    buf.achPhantom += 1;
  } else if (enemyType === 'goliath') {
    buf.missionKillsBoss += 1;
    buf.eventKillsBoss += 1;
    buf.achBossLevel = Math.max(buf.achBossLevel, currentLevel);
  }
}

export function accumulatePendingCoinProgress(
  buf: PendingCombatProgressBuffer,
  coinAmount: number
): void {
  const safe = Math.max(0, Math.round(coinAmount));
  if (safe <= 0) return;
  buf.dirty = true;
  buf.missionCoinsCollected += safe;
  buf.eventCoinsCollected += safe;
  buf.achCoins += safe;
}

export interface MultiKillFrameFxBudget {
  burstCount: number;
  spawnScoreText: boolean;
  spawnCoinText: boolean;
}

/**
 * Progressively caps per-kill burst particle and floating-text allocations when many enemies
 * die in the exact same simulation frame (e.g. Finisher Nova, Vortex implosion, barrel chain),
 * eliminating synchronous Canvas strokeText / particle allocation frame spikes.
 */
export function computeMultiKillFrameFxBudget(
  killsInCurrentFrame: number,
  qualityTier: AdaptiveQualityTier = 'high'
): MultiKillFrameFxBudget {
  const k = Math.max(1, Math.floor(killsInCurrentFrame));
  const isPerf = qualityTier === 'performance';
  if (k <= 2) {
    return {
      burstCount: isPerf ? 6 : 12,
      spawnScoreText: true,
      spawnCoinText: true,
    };
  }
  if (k <= 5) {
    return {
      burstCount: isPerf ? 3 : 5,
      spawnScoreText: true,
      spawnCoinText: false,
    };
  }
  return {
    burstCount: isPerf ? 1 : 2,
    spawnScoreText: false,
    spawnCoinText: false,
  };
}

/**
 * O(1) finite-safe angle wrapping to [-PI, PI]. Never loops on NaN/Infinity.
 */
export function wrapAngleSafe(rad: number): number {
  if (!Number.isFinite(rad)) return 0;
  return Math.atan2(Math.sin(rad), Math.cos(rad));
}

/**
 * Zero-distance and NaN-safe magnetic pull step for pickups.
 */
export function computeSafePullDelta(
  dx: number,
  dy: number,
  maxRadius: number,
  pullSpeed: number,
  dt: number
): { x: number; y: number } {
  if (
    !Number.isFinite(dx) ||
    !Number.isFinite(dy) ||
    !Number.isFinite(maxRadius) ||
    !Number.isFinite(pullSpeed) ||
    !Number.isFinite(dt) ||
    maxRadius <= 0 ||
    dt <= 0
  ) {
    return { x: 0, y: 0 };
  }
  const dist = Math.hypot(dx, dy);
  if (dist <= 0.001 || dist >= maxRadius) {
    return { x: 0, y: 0 };
  }
  const effectiveSpeed = pullSpeed * (1 - dist / maxRadius);
  const step = Math.min(dist, Math.max(0, effectiveSpeed * dt));
  return {
    x: (dx / dist) * step,
    y: (dy / dist) * step,
  };
}

/**
 * Iterative BFS chain detonation planner so overlapping barrel explosions
 * never mutate shared arrays recursively or access out-of-bounds indices.
 */
export function collectChainDetonatedBarrels<
  T extends { id: number; x: number; y: number; radius: number }
>(
  seed: T,
  pool: readonly T[],
  getExplosionRadius: (barrel: T) => number
): T[] {
  const ordered: T[] = [seed];
  const seenIds = new Set<number>([seed.id]);
  let head = 0;

  while (head < ordered.length) {
    const current = ordered[head++];
    const blastRadius = getExplosionRadius(current);
    if (!Number.isFinite(blastRadius) || blastRadius <= 0) continue;
    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      if (!candidate || seenIds.has(candidate.id)) continue;
      const dist = Math.hypot(candidate.x - current.x, candidate.y - current.y);
      if (Number.isFinite(dist) && dist <= blastRadius + candidate.radius) {
        seenIds.add(candidate.id);
        ordered.push(candidate);
      }
    }
  }

  return ordered;
}
