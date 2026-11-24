import type {
  CyberAugmentChoice,
  CyberAugmentDef,
  CyberAugmentId,
  DifficultyMode,
  Enemy,
} from './types';

export const AUGMENT_ORDER: CyberAugmentId[] = [
  'wingman_drone',
  'chain_arc',
  'vampiric_core',
  'ricochet_rounds',
  'cryo_aura',
  'overclock_vents',
  'magnet_greed',
];

export const CYBER_AUGMENTS: Record<CyberAugmentId, CyberAugmentDef> = {
  wingman_drone: {
    id: 'wingman_drone',
    name: 'WINGMAN ASSAULT DRONE',
    shortTag: 'DRONE',
    rarity: 'apex',
    maxStacks: 3,
    color: '#00f3ff',
    icon: '🛸',
    description: 'Deploys an autonomous orbital plasma drone that locks onto nearby hostiles and fires rapid bolts.',
    statSummary: '+1 Orbital Drone per chip (max 3)',
  },
  chain_arc: {
    id: 'chain_arc',
    name: 'TESLA ARC PROTOCOL',
    shortTag: 'TESLA',
    rarity: 'apex',
    maxStacks: 3,
    color: '#38bdf8',
    icon: '⚡',
    description: 'Weapon impacts discharge high-voltage lightning arcs to nearby hostiles within 230px.',
    statSummary: '+2 Arc Jumps · +15% Chain Damage/lvl',
  },
  vampiric_core: {
    id: 'vampiric_core',
    name: 'VAMPIRIC NANITE CORE',
    shortTag: 'LEECH',
    rarity: 'elite',
    maxStacks: 3,
    color: '#00ff88',
    icon: '💚',
    description: 'Harvests enemy nanites on elimination to rapidly recharge shields and repair hull HP sockets.',
    statSummary: '+6 Shield/Kill · +1 HP every 5 Kills',
  },
  ricochet_rounds: {
    id: 'ricochet_rounds',
    name: 'RICOCHET PRISM BARREL',
    shortTag: 'BOUNCE',
    rarity: 'elite',
    maxStacks: 3,
    color: '#f472b6',
    icon: '🪩',
    description: 'Supercharges rounds with prismatic bounce geometry off arena barriers and extra pierce.',
    statSummary: '+1 Wall Bounce · +1 Pierce · +12% Speed',
  },
  cryo_aura: {
    id: 'cryo_aura',
    name: 'CRYO-PULSE FIELD',
    shortTag: 'CRYO',
    rarity: 'core',
    maxStacks: 3,
    color: '#67e8f9',
    icon: '❄️',
    description: 'Projects a sub-zero stasis ring around NaBil-BOT that chills approaching enemies and deals cryo shatter.',
    statSummary: '220px Chill Zone · -32% Enemy Speed',
  },
  overclock_vents: {
    id: 'overclock_vents',
    name: 'CRYO-VENT OVERCLOCK',
    shortTag: 'OC-VENT',
    rarity: 'core',
    maxStacks: 4,
    color: '#fbbf24',
    icon: '🔥',
    description: 'Upgrades barrel cooling and reactor output for sustained, high-velocity rapid fire.',
    statSummary: '+16% Fire Rate · +14% DMG · -18% Heat',
  },
  magnet_greed: {
    id: 'magnet_greed',
    name: 'QUANTUM GREED COIL',
    shortTag: 'GREED',
    rarity: 'core',
    maxStacks: 3,
    color: '#ffd700',
    icon: '🧲',
    description: 'Amplifies magnetic pickup sweep radius and boosts cyber coin and score payouts.',
    statSummary: '+140px Magnet · +25% Coins & Score',
  },
};

export interface AugmentModifiers {
  wingmanCount: number;
  chainArcTargets: number;
  chainArcDamageRatio: number;
  vampiricShieldPerKill: number;
  vampiricHpEveryKills: number; // 0 if disabled
  ricochetBounces: number;
  bonusPierce: number;
  projSpeedMult: number;
  cryoAuraRadius: number;
  cryoSlowFactor: number; // 1.0 when inactive, down to ~0.58 when stacked
  cryoDamagePerTick: number;
  fireRateMult: number;
  damageMult: number;
  heatReduction: number;
  magnetRadiusBonus: number;
  coinMult: number;
  scoreMult: number;
}

export function createEmptyAugments(): Partial<Record<CyberAugmentId, number>> {
  return {};
}

export function applyAugmentSelection(
  current: Partial<Record<CyberAugmentId, number>>,
  id: CyberAugmentId,
  allowOverclockSurge: boolean = false
): Partial<Record<CyberAugmentId, number>> {
  const def = CYBER_AUGMENTS[id];
  const prev = current[id] || 0;
  const next = allowOverclockSurge ? prev + 1 : Math.min(def.maxStacks, prev + 1);
  return {
    ...current,
    [id]: next,
  };
}

export function rollAugmentDraftChoices(
  current: Partial<Record<CyberAugmentId, number>>,
  count: number = 3,
  rng: () => number = Math.random,
  allowOverclockFallback: boolean = false
): CyberAugmentChoice[] {
  const available = AUGMENT_ORDER.filter((id) => {
    const lvl = current[id] || 0;
    return lvl < CYBER_AUGMENTS[id].maxStacks;
  });

  const shuffle = (arr: CyberAugmentId[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  };

  if (available.length === 0 && !allowOverclockFallback) return [];

  const pool = shuffle(available);
  const picked: CyberAugmentChoice[] = pool.slice(0, Math.min(count, pool.length)).map((id) => {
    const cur = current[id] || 0;
    return {
      def: CYBER_AUGMENTS[id],
      currentLevel: cur,
      nextLevel: cur + 1,
      isOverclockSurge: false,
    };
  });

  if (allowOverclockFallback && picked.length < count) {
    const pickedIds = new Set(picked.map((c) => c.def.id));
    const overclockCandidates = shuffle(AUGMENT_ORDER.filter((id) => !pickedIds.has(id)));
    for (const id of overclockCandidates) {
      if (picked.length >= count) break;
      const cur = Math.max(CYBER_AUGMENTS[id].maxStacks, current[id] || 0);
      picked.push({
        def: CYBER_AUGMENTS[id],
        currentLevel: cur,
        nextLevel: cur + 1,
        isOverclockSurge: true,
      });
    }
  }

  return picked;
}

export function computeAugmentModifiers(
  augments: Partial<Record<CyberAugmentId, number>> = {}
): AugmentModifiers {
  const wingmanRaw = augments.wingman_drone || 0;
  const chainRaw = augments.chain_arc || 0;
  const vampRaw = augments.vampiric_core || 0;
  const ricoRaw = augments.ricochet_rounds || 0;
  const cryoRaw = augments.cryo_aura || 0;
  const ocRaw = augments.overclock_vents || 0;
  const greedRaw = augments.magnet_greed || 0;

  const wingman = Math.min(3, wingmanRaw);
  const chain = Math.min(3, chainRaw);
  const vamp = Math.min(3, vampRaw);
  const rico = Math.min(3, ricoRaw);
  const cryo = Math.min(3, cryoRaw);
  const oc = Math.min(4, ocRaw);
  const greed = Math.min(3, greedRaw);

  const overclockSurgeStacks =
    Math.max(0, wingmanRaw - 3) +
    Math.max(0, chainRaw - 3) +
    Math.max(0, vampRaw - 3) +
    Math.max(0, ricoRaw - 3) +
    Math.max(0, cryoRaw - 3) +
    Math.max(0, ocRaw - 4) +
    Math.max(0, greedRaw - 3);

  const surgeDmgBonus = Math.min(1.8, overclockSurgeStacks * 0.06);
  const surgeFireRateBonus = Math.min(1.0, overclockSurgeStacks * 0.05);
  const surgeEconomyBonus = Math.min(2.5, overclockSurgeStacks * 0.12);
  const surgeShieldBonus = Math.min(30, overclockSurgeStacks * 2);

  return {
    wingmanCount: wingman,
    chainArcTargets: chain > 0 ? 1 + chain : 0,
    chainArcDamageRatio: chain > 0 ? 0.35 + chain * 0.12 + Math.min(0.45, Math.max(0, chainRaw - 3) * 0.06) : 0,
    vampiricShieldPerKill: vamp * 6 + surgeShieldBonus,
    vampiricHpEveryKills: vamp > 0 ? Math.max(3, 6 - vamp) : 0, // 5, 4, 3 kills per HP heal
    ricochetBounces: rico,
    bonusPierce: rico + Math.min(3, Math.max(0, ricoRaw - 3)),
    projSpeedMult: 1 + rico * 0.12,
    cryoAuraRadius: cryo > 0 ? 200 + (cryo - 1) * 35 : 0,
    cryoSlowFactor: cryo > 0 ? Math.max(0.55, 0.72 - (cryo - 1) * 0.08) : 1.0,
    cryoDamagePerTick: cryo * 6 + Math.max(0, cryoRaw - 3) * 3,
    fireRateMult: 1 + oc * 0.16 + surgeFireRateBonus,
    damageMult: 1 + oc * 0.14 + surgeDmgBonus,
    heatReduction: Math.min(0.65, oc * 0.18),
    magnetRadiusBonus: greed * 140,
    coinMult: 1 + greed * 0.25 + surgeEconomyBonus,
    scoreMult: 1 + greed * 0.25 + surgeEconomyBonus,
  };
}

// --- Wingman Orbital Drone Math ---

export function computeWingmanOrbitPosition(
  playerX: number,
  playerY: number,
  index: number,
  total: number,
  timeSec: number,
  orbitRadius: number = 48
): { x: number; y: number; orbitAngle: number } {
  const count = Math.max(1, total);
  const baseAngle = timeSec * 2.2 + (index * Math.PI * 2) / count;
  return {
    x: playerX + Math.cos(baseAngle) * orbitRadius,
    y: playerY + Math.sin(baseAngle) * orbitRadius,
    orbitAngle: baseAngle,
  };
}

export function selectWingmanTarget(
  droneX: number,
  droneY: number,
  enemies: ReadonlyArray<Pick<Enemy, 'id' | 'x' | 'y' | 'state'>>,
  maxRange: number = 580
): { id: number; x: number; y: number; dist: number; angle: number } | null {
  let bestDist = maxRange;
  let bestTarget: { id: number; x: number; y: number } | null = null;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.state === 'ko') continue;
    const d = Math.hypot(e.x - droneX, e.y - droneY);
    if (d < bestDist) {
      bestDist = d;
      bestTarget = e;
    }
  }
  if (!bestTarget) return null;
  return {
    id: bestTarget.id,
    x: bestTarget.x,
    y: bestTarget.y,
    dist: bestDist,
    angle: Math.atan2(bestTarget.y - droneY, bestTarget.x - droneX),
  };
}

// --- Multi-Kill Streak Announcer ---

export const MULTI_KILL_WINDOW_SEC = 2.0;

export interface MultiKillState {
  count: number;
  timer: number;
  label: string;
  tier: number;
}

export function createInitialMultiKillState(): MultiKillState {
  return {
    count: 0,
    timer: 0,
    label: '',
    tier: 0,
  };
}

export function getMultiKillLabel(count: number): { label: string; tier: number; color: string } {
  if (count >= 6) return { label: `CYBER GODLIKE! (${count}x)`, tier: 6, color: '#facc15' };
  if (count === 5) return { label: 'MEGA OVERLOAD! (5x)', tier: 5, color: '#ff0077' };
  if (count === 4) return { label: 'ULTRA BREACH! (4x)', tier: 4, color: '#c084fc' };
  if (count === 3) return { label: 'TRIPLE SURGE! (3x)', tier: 3, color: '#38bdf8' };
  if (count === 2) return { label: 'DOUBLE PURGE! (2x)', tier: 2, color: '#00ff88' };
  return { label: '', tier: 0, color: '#ffffff' };
}

export function stepMultiKillStreak(
  state: MultiKillState,
  isNewKill: boolean,
  dt: number
): { state: MultiKillState; triggeredTier: number; label: string; color: string } {
  let count = state.count;
  let timer = Math.max(0, state.timer - dt);
  if (timer <= 0 && !isNewKill) {
    return {
      state: createInitialMultiKillState(),
      triggeredTier: 0,
      label: '',
      color: '#ffffff',
    };
  }

  let triggeredTier = 0;
  let color = '#ffffff';
  let label = state.label;

  if (isNewKill) {
    count = state.timer > 0 ? state.count + 1 : 1;
    timer = MULTI_KILL_WINDOW_SEC;
    const info = getMultiKillLabel(count);
    if (info.tier >= 2) {
      label = info.label;
      triggeredTier = info.tier;
      color = info.color;
    } else {
      label = '';
    }
  }

  return {
    state: {
      count,
      timer,
      label,
      tier: triggeredTier || (count >= 2 ? getMultiKillLabel(count).tier : 0),
    },
    triggeredTier,
    label,
    color,
  };
}

// --- Golden Data-Core Cache Pinata + Overdrive Surge ---

export const OVERDRIVE_DURATION_SEC = 5.5;
export const OVERDRIVE_FIRE_RATE_MULT = 1.4;

export interface GoldenDataCore {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  life: number;
  maxLife: number;
  phase: number;
}

export function createGoldenDataCore(
  id: number,
  arenaWidth: number,
  arenaHeight: number,
  level: number,
  difficulty: DifficultyMode = 'normal',
  rng: () => number = Math.random
): GoldenDataCore {
  const margin = 220;
  const x = margin + rng() * Math.max(200, arenaWidth - margin * 2);
  const y = margin + rng() * Math.max(200, arenaHeight - margin * 2);
  const diffScale = difficulty === 'nightmare' ? 1.35 : difficulty === 'easy' ? 0.8 : 1.0;
  const maxHp = Math.round((75 + Math.min(100, level * 5)) * diffScale);
  const maxLife = 16.0;
  return {
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 22,
    hp: maxHp,
    maxHp,
    life: maxLife,
    maxLife,
    phase: rng() * Math.PI * 2,
  };
}

export function stepGoldenDataCore(
  core: GoldenDataCore,
  playerX: number,
  playerY: number,
  dt: number,
  arenaWidth: number,
  arenaHeight: number
): GoldenDataCore {
  const phase = core.phase + dt * 3.4;
  const dx = core.x - playerX;
  const dy = core.y - playerY;
  const dist = Math.hypot(dx, dy);

  const fleeAngle = dist > 1 ? Math.atan2(dy, dx) : phase;
  const weave = Math.sin(phase) * 0.95;
  const moveAngle = (dist < 420 ? fleeAngle : fleeAngle + Math.PI * 0.5) + weave;
  const speed = dist < 240 ? 225 : 165;

  let vx = Math.cos(moveAngle) * speed;
  let vy = Math.sin(moveAngle) * speed;
  let x = core.x + vx * dt;
  let y = core.y + vy * dt;

  const pad = core.radius + 70;
  if (x < pad) {
    x = pad;
    vx = Math.abs(vx);
  } else if (x > arenaWidth - pad) {
    x = arenaWidth - pad;
    vx = -Math.abs(vx);
  }
  if (y < pad) {
    y = pad;
    vy = Math.abs(vy);
  } else if (y > arenaHeight - pad) {
    y = arenaHeight - pad;
    vy = -Math.abs(vy);
  }

  return {
    ...core,
    x,
    y,
    vx,
    vy,
    phase,
    life: Math.max(0, core.life - dt),
  };
}

export function computeGoldenCoreJackpot(level: number): {
  coinCount: number;
  coinValue: number;
  diamonds: number;
  score: number;
  overdriveSeconds: number;
} {
  return {
    coinCount: 6,
    coinValue: 18 + Math.min(40, Math.floor(level / 3) * 3),
    diamonds: 1,
    score: 350 + level * 25,
    overdriveSeconds: OVERDRIVE_DURATION_SEC,
  };
}
