import type {
  ActiveBountyContract,
  BossRushRecord,
  BossRushStageDef,
} from './types';

export const BOSS_RUSH_STORAGE_KEY = 'nabilbot_boss_rush_record_v1';
export const MAX_BOUNTY_DIAMONDS_PER_RUN = 2;

export const BOSS_RUSH_TITANS: BossRushStageDef[] = [
  {
    stage: 1,
    name: 'Dhaka Interceptor Titan',
    regionLabel: 'Dhaka Cyber Grid',
    arenaLevel: 5,
    hpMultiplier: 1.35,
    speedMultiplier: 1.05,
    color: '#00f3ff',
    escortCount: 2,
    coinReward: 120,
    diamondReward: 1,
  },
  {
    stage: 2,
    name: 'Sundarban Venom Goliath',
    regionLabel: 'Sundarbans Bio-Vault',
    arenaLevel: 29,
    hpMultiplier: 1.75,
    speedMultiplier: 1.12,
    color: '#00ff88',
    escortCount: 2,
    coinReward: 170,
    diamondReward: 1,
  },
  {
    stage: 3,
    name: 'Singularity Void Overlord',
    regionLabel: 'Bengal Singularity',
    arenaLevel: 55,
    hpMultiplier: 2.2,
    speedMultiplier: 1.18,
    color: '#c084fc',
    escortCount: 3,
    coinReward: 220,
    diamondReward: 1,
  },
  {
    stage: 4,
    name: 'Rangpur Cryo Colossus',
    regionLabel: 'Rangpur Cryo Citadel',
    arenaLevel: 75,
    hpMultiplier: 2.75,
    speedMultiplier: 1.24,
    color: '#38bdf8',
    escortCount: 3,
    coinReward: 280,
    diamondReward: 1,
  },
  {
    stage: 5,
    name: 'Khulna Inferno Leviathan',
    regionLabel: 'Khulna Core Reactor',
    arenaLevel: 85,
    hpMultiplier: 3.4,
    speedMultiplier: 1.3,
    color: '#ff6200',
    escortCount: 4,
    coinReward: 340,
    diamondReward: 1,
  },
  {
    stage: 6,
    name: 'Eternity Apex Emperor',
    regionLabel: 'Padma Eternity Throne',
    arenaLevel: 100,
    hpMultiplier: 4.2,
    speedMultiplier: 1.38,
    color: '#ff0077',
    escortCount: 4,
    coinReward: 420,
    diamondReward: 1,
  },
];

export function getBossRushStageDef(stage: number): BossRushStageDef {
  const idx = Math.max(0, Math.min(BOSS_RUSH_TITANS.length - 1, Math.floor(stage) - 1));
  return BOSS_RUSH_TITANS[idx];
}

export function computeBossRushStageRewards(stage: number): {
  coins: number;
  diamonds: number;
  hpHeal: number;
  scoreBonus: number;
} {
  const def = getBossRushStageDef(stage);
  return {
    coins: def.coinReward,
    diamonds: def.diamondReward,
    hpHeal: 2,
    scoreBonus: 400 + def.stage * 220,
  };
}

export function createDefaultBossRushRecord(): BossRushRecord {
  return {
    bestStage: 0,
    clears: 0,
    fastestClearSeconds: null,
    totalBossesDefeated: 0,
  };
}

export function loadBossRushRecord(): BossRushRecord {
  if (typeof window === 'undefined') return createDefaultBossRushRecord();
  try {
    const raw = localStorage.getItem(BOSS_RUSH_STORAGE_KEY);
    if (!raw) return createDefaultBossRushRecord();
    const parsed = JSON.parse(raw) as Partial<BossRushRecord>;
    return {
      bestStage: Math.max(0, Math.min(BOSS_RUSH_TITANS.length, Number(parsed.bestStage) || 0)),
      clears: Math.max(0, Number(parsed.clears) || 0),
      fastestClearSeconds:
        typeof parsed.fastestClearSeconds === 'number' && parsed.fastestClearSeconds > 0
          ? parsed.fastestClearSeconds
          : null,
      totalBossesDefeated: Math.max(0, Number(parsed.totalBossesDefeated) || 0),
    };
  } catch {
    return createDefaultBossRushRecord();
  }
}

export function recordBossRushMilestone(params: {
  stageCleared?: number;
  victory?: boolean;
  clearSeconds?: number;
  bossDefeated?: boolean;
}): BossRushRecord {
  const current = loadBossRushRecord();
  const stage = Math.max(0, Math.min(BOSS_RUSH_TITANS.length, params.stageCleared || 0));
  const next: BossRushRecord = {
    bestStage: Math.max(current.bestStage, stage),
    clears: current.clears + (params.victory ? 1 : 0),
    fastestClearSeconds:
      params.victory && typeof params.clearSeconds === 'number' && params.clearSeconds > 0
        ? current.fastestClearSeconds === null
          ? Math.round(params.clearSeconds)
          : Math.min(current.fastestClearSeconds, Math.round(params.clearSeconds))
        : current.fastestClearSeconds,
    totalBossesDefeated: current.totalBossesDefeated + (params.bossDefeated ? 1 : 0),
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BOSS_RUSH_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failure
    }
  }
  return next;
}

export interface BountyTemplate {
  codename: string;
  duration: number;
  rewardCoins: number;
}

export const BOUNTY_CONTRACTS: BountyTemplate[] = [
  { codename: 'Gilded Ravager', duration: 22, rewardCoins: 95 },
  { codename: 'Vault-Breaker Apex', duration: 24, rewardCoins: 120 },
  { codename: 'Solar Warden', duration: 20, rewardCoins: 110 },
  { codename: 'Obsidian Marauder', duration: 23, rewardCoins: 135 },
  { codename: 'Pulse Syndicate', duration: 22, rewardCoins: 150 },
];

export function createBountyContractState(
  enemyId: number,
  rng: () => number = Math.random
): ActiveBountyContract {
  const idx = Math.floor(Math.max(0, Math.min(0.9999, rng())) * BOUNTY_CONTRACTS.length);
  const tpl = BOUNTY_CONTRACTS[idx];
  return {
    enemyId,
    codename: tpl.codename,
    timeRemaining: tpl.duration,
    duration: tpl.duration,
    rewardCoins: tpl.rewardCoins,
    rewardDiamonds: 1,
  };
}

export function stepBountyContract(
  contract: ActiveBountyContract,
  dt: number
): { contract: ActiveBountyContract; expired: boolean } {
  const nextTime = Math.max(0, contract.timeRemaining - Math.max(0, dt));
  return {
    contract: {
      ...contract,
      timeRemaining: nextTime,
    },
    expired: nextTime <= 0,
  };
}

export function resolveBountyCompletion(
  contract: ActiveBountyContract,
  diamondsEarnedThisRun: number
): {
  totalCoins: number;
  diamondsEarned: number;
  shieldRestore: number;
  scoreBonus: number;
} {
  const canGrantDiamond = diamondsEarnedThisRun < MAX_BOUNTY_DIAMONDS_PER_RUN;
  const diamondsEarned = canGrantDiamond ? contract.rewardDiamonds : 0;
  const overflowCoinBonus = canGrantDiamond ? 0 : 75;
  return {
    totalCoins: contract.rewardCoins + overflowCoinBonus,
    diamondsEarned,
    shieldRestore: 50,
    scoreBonus: 350,
  };
}

export function projectToRadar(
  worldX: number,
  worldY: number,
  arenaWidth: number,
  arenaHeight: number,
  radarX: number,
  radarY: number,
  radarSize: number
): { x: number; y: number } {
  const nx = Math.max(0, Math.min(1, worldX / Math.max(1, arenaWidth)));
  const ny = Math.max(0, Math.min(1, worldY / Math.max(1, arenaHeight)));
  return {
    x: radarX + nx * radarSize,
    y: radarY + ny * radarSize,
  };
}
