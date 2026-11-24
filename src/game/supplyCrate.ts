import type {
  PreRunBoosterDef,
  PreRunBoosterId,
  SupplyCrateReward,
  SupplyCrateState,
  SupplyCrateTier,
  WeaponType,
} from './types';
import { addDiamonds } from './diamonds';
import { awardWeaponMasteryXp, loadWeaponMastery, saveWeaponMastery } from './mastery';

export const SUPPLY_CRATE_STORAGE_KEY = 'nabilbot_supply_crate_v1';

export const SUPPLY_CRATE_COSTS: Record<SupplyCrateTier, number> = {
  daily_free: 0,
  standard: 650,
  apex: 1650,
};

export const PRE_RUN_BOOSTERS: Record<PreRunBoosterId, PreRunBoosterDef> = {
  shield_overcharge: {
    id: 'shield_overcharge',
    name: 'Aegis Barrier Core',
    shortLabel: '+60 SHIELD',
    description: 'Starts your next run with +60 Max Shield & instant barrier charge.',
    color: '#38bdf8',
    icon: '🛡️',
  },
  weapon_overclock: {
    id: 'weapon_overclock',
    name: 'Hyper-Barrel Overclock',
    shortLabel: '+20% DMG',
    description: 'Boosts all weapon damage by +20% for the entire next run.',
    color: '#ff5500',
    icon: '⚡',
  },
  coin_rush: {
    id: 'coin_rush',
    name: 'Midas Magnet Protocol',
    shortLabel: '+50% COINS',
    description: 'Multiplies Cyber Coin pickup yield by +50% on your next run.',
    color: '#fbbf24',
    icon: '🪙',
  },
  headstart_augment: {
    id: 'headstart_augment',
    name: 'Instant Cyber-Chip Draft',
    shortLabel: 'CHIP W1',
    description: 'Triggers an instant Cyber-Chip Augment Draft right at Wave 1 deployment.',
    color: '#c084fc',
    icon: '💠',
  },
  finisher_charged: {
    id: 'finisher_charged',
    name: 'Nova Reactor Core',
    shortLabel: 'NOVA W1',
    description: 'Deploys into Wave 1 with 100% Combo Finisher ([E] / NOVA) charged & ready!',
    color: '#f43f5e',
    icon: '💥',
  },
  bounty_radar_vip: {
    id: 'bounty_radar_vip',
    name: 'Golden Bounty Beacon',
    shortLabel: 'VIP BOUNTY',
    description: 'Spawns an instant HVT Bounty target within 4s & boosts Bounty coin payouts +40%.',
    color: '#facc15',
    icon: '🎯',
  },
};

export function getSupplyDayKey(nowMs: number = Date.now()): string {
  const d = new Date(nowMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createInitialSupplyCrateState(nowMs: number = Date.now()): SupplyCrateState {
  return {
    lastDailyResetDay: getSupplyDayKey(nowMs),
    freeKeys: 1,
    totalOpened: 0,
    armedBoosters: [],
    lastReward: null,
  };
}

export function syncSupplyCrateDay(
  state: SupplyCrateState,
  nowMs: number = Date.now()
): SupplyCrateState {
  const today = getSupplyDayKey(nowMs);
  if (state.lastDailyResetDay === today) {
    return state;
  }
  return {
    ...state,
    lastDailyResetDay: today,
    freeKeys: Math.max(1, state.freeKeys),
  };
}

function addArmedBoosterUnique(
  armed: PreRunBoosterId[],
  booster: PreRunBoosterId
): PreRunBoosterId[] {
  if (armed.includes(booster)) return armed;
  return [...armed, booster];
}

export function rollSupplyCrateReward(
  tier: SupplyCrateTier,
  rng: () => number = Math.random
): SupplyCrateReward {
  const roll = rng();

  if (tier === 'apex') {
    if (roll < 0.2) {
      return {
        id: 'apex_diamond_jackpot',
        rarity: 'apex',
        title: 'Apex Diamond Vault',
        subtitle: '+8 Cyber Diamonds & +250 Coins',
        icon: '💎',
        coinsAwarded: 250,
        diamondsAwarded: 8,
        masteryXpAwarded: 0,
      };
    }
    if (roll < 0.48) {
      return {
        id: 'apex_diamond_pack',
        rarity: 'epic',
        title: 'Quantum Prism Cache',
        subtitle: '+4 Cyber Diamonds & Instant Cyber-Chip Booster',
        icon: '💠',
        coinsAwarded: 120,
        diamondsAwarded: 4,
        masteryXpAwarded: 0,
        boosterGranted: 'headstart_augment',
      };
    }
    if (roll < 0.74) {
      return {
        id: 'apex_overclock_cache',
        rarity: 'epic',
        title: 'Overclock Arsenal Drop',
        subtitle: '+20% Damage Booster, +180 Mastery XP & +2 Diamonds',
        icon: '⚡',
        coinsAwarded: 150,
        diamondsAwarded: 2,
        masteryXpAwarded: 180,
        boosterGranted: 'weapon_overclock',
      };
    }
    return {
      id: 'apex_aegis_jackpot',
      rarity: 'rare',
      title: 'Aegis Citadel Cache',
      subtitle: '+60 Max Shield Booster, +550 Coins & +2 Diamonds',
      icon: '🛡️',
      coinsAwarded: 550,
      diamondsAwarded: 2,
      masteryXpAwarded: 90,
      boosterGranted: 'shield_overcharge',
    };
  }

  // Standard & Daily Free Drop table
  if (roll < 0.14) {
    return {
      id: 'crate_diamond_cache',
      rarity: 'epic',
      title: 'Cyber Diamond Cache',
      subtitle: '+3 Cyber Diamonds & +100 Coins',
      icon: '💎',
      coinsAwarded: 100,
      diamondsAwarded: 3,
      masteryXpAwarded: 0,
    };
  }
  if (roll < 0.36) {
    const boosterPool: PreRunBoosterId[] = [
      'shield_overcharge',
      'weapon_overclock',
      'coin_rush',
      'headstart_augment',
    ];
    const picked = boosterPool[Math.floor(rng() * boosterPool.length) % boosterPool.length];
    const def = PRE_RUN_BOOSTERS[picked];
    return {
      id: `crate_booster_${picked}`,
      rarity: 'rare',
      title: `${def.name}`,
      subtitle: `Armed for next run (${def.shortLabel}) + 1 Diamond`,
      icon: def.icon,
      coinsAwarded: 75,
      diamondsAwarded: 1,
      masteryXpAwarded: 0,
      boosterGranted: picked,
    };
  }
  if (roll < 0.68) {
    return {
      id: 'crate_mastery_core',
      rarity: 'rare',
      title: 'Weapon Mastery Data Core',
      subtitle: '+110 Mastery XP on equipped weapon & +120 Coins',
      icon: '🎯',
      coinsAwarded: 120,
      diamondsAwarded: 1,
      masteryXpAwarded: 110,
    };
  }
  return {
    id: 'crate_coin_stash',
    rarity: 'common',
    title: 'Cyber Coin Supply Drop',
    subtitle: '+220 Cyber Coins & +60 Mastery XP',
    icon: '🪙',
    coinsAwarded: 220,
    diamondsAwarded: 0,
    masteryXpAwarded: 60,
  };
}

export function openSupplyCrateState(
  state: SupplyCrateState,
  tier: SupplyCrateTier,
  params: { currentCoins: number; nowMs?: number; rng?: () => number }
): {
  success: boolean;
  error?: string;
  updatedState: SupplyCrateState;
  reward: SupplyCrateReward | null;
  coinCost: number;
  netCoinsDelta: number;
} {
  const synced = syncSupplyCrateDay(state, params.nowMs ?? Date.now());
  const cost = SUPPLY_CRATE_COSTS[tier];

  if (tier === 'daily_free') {
    if (synced.freeKeys <= 0) {
      return {
        success: false,
        error: 'Daily free supply key already claimed today.',
        updatedState: synced,
        reward: null,
        coinCost: 0,
        netCoinsDelta: 0,
      };
    }
  } else if (params.currentCoins < cost) {
    return {
      success: false,
      error: `Need ${cost} Cyber Coins to open this crate.`,
      updatedState: synced,
      reward: null,
      coinCost: cost,
      netCoinsDelta: 0,
    };
  }

  const reward = rollSupplyCrateReward(tier, params.rng);
  const nextBoosters = reward.boosterGranted
    ? addArmedBoosterUnique(synced.armedBoosters, reward.boosterGranted)
    : synced.armedBoosters;

  const updatedState: SupplyCrateState = {
    ...synced,
    freeKeys: tier === 'daily_free' ? Math.max(0, synced.freeKeys - 1) : synced.freeKeys,
    totalOpened: synced.totalOpened + 1,
    armedBoosters: nextBoosters,
    lastReward: reward,
  };

  return {
    success: true,
    updatedState,
    reward,
    coinCost: cost,
    netCoinsDelta: reward.coinsAwarded - cost,
  };
}

export function consumeBoostersFromState(state: SupplyCrateState): {
  consumed: PreRunBoosterId[];
  updatedState: SupplyCrateState;
} {
  if (state.armedBoosters.length === 0) {
    return { consumed: [], updatedState: state };
  }
  return {
    consumed: [...state.armedBoosters],
    updatedState: {
      ...state,
      armedBoosters: [],
    },
  };
}

export function loadSupplyCrateState(nowMs: number = Date.now()): SupplyCrateState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createInitialSupplyCrateState(nowMs);
  }
  try {
    const raw = localStorage.getItem(SUPPLY_CRATE_STORAGE_KEY);
    if (!raw) {
      const fresh = createInitialSupplyCrateState(nowMs);
      saveSupplyCrateState(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as Partial<SupplyCrateState>;
    const normalized: SupplyCrateState = {
      lastDailyResetDay: parsed.lastDailyResetDay || getSupplyDayKey(nowMs),
      freeKeys: typeof parsed.freeKeys === 'number' ? Math.max(0, parsed.freeKeys) : 1,
      totalOpened: Math.max(0, Number(parsed.totalOpened) || 0),
      armedBoosters: Array.isArray(parsed.armedBoosters)
        ? parsed.armedBoosters.filter((id): id is PreRunBoosterId => id in PRE_RUN_BOOSTERS)
        : [],
      lastReward: parsed.lastReward || null,
    };
    const synced = syncSupplyCrateDay(normalized, nowMs);
    if (synced !== normalized) {
      saveSupplyCrateState(synced);
    }
    return synced;
  } catch {
    return createInitialSupplyCrateState(nowMs);
  }
}

export function saveSupplyCrateState(state: SupplyCrateState): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(SUPPLY_CRATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function openSupplyCrate(
  tier: SupplyCrateTier,
  currentCoins: number,
  activeWeapon: WeaponType = 'pulse'
): {
  success: boolean;
  error?: string;
  updatedState: SupplyCrateState;
  reward: SupplyCrateReward | null;
  newCoinsBalance: number;
  newDiamondsBalance?: number;
} {
  const current = loadSupplyCrateState();
  const res = openSupplyCrateState(current, tier, { currentCoins });
  if (!res.success || !res.reward) {
    return {
      success: false,
      error: res.error,
      updatedState: res.updatedState,
      reward: null,
      newCoinsBalance: currentCoins,
    };
  }

  saveSupplyCrateState(res.updatedState);
  const newCoinsBalance = Math.max(0, currentCoins + res.netCoinsDelta);
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('nabilbot_coins', String(newCoinsBalance));
  }

  let newDiamondsBalance: number | undefined;
  if (res.reward.diamondsAwarded > 0) {
    newDiamondsBalance = addDiamonds(res.reward.diamondsAwarded);
  }

  if (res.reward.masteryXpAwarded > 0) {
    const masteryMap = loadWeaponMastery();
    const xpRes = awardWeaponMasteryXp(masteryMap, activeWeapon, 'kill', Math.ceil(res.reward.masteryXpAwarded / 12));
    saveWeaponMastery(xpRes.updatedMap);
  }

  return {
    success: true,
    updatedState: res.updatedState,
    reward: res.reward,
    newCoinsBalance,
    newDiamondsBalance,
  };
}

export function consumeArmedBoostersForRun(): PreRunBoosterId[] {
  const current = loadSupplyCrateState();
  const { consumed, updatedState } = consumeBoostersFromState(current);
  if (consumed.length > 0) {
    saveSupplyCrateState(updatedState);
  }
  return consumed;
}
