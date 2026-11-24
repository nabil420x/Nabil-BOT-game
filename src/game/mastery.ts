import { WeaponType } from './types';
import { WEAPON_ORDER } from './weapons';

export const WEAPON_MASTERY_STORAGE_KEY = 'nabilbot_weapon_mastery_v1';

export interface WeaponMasteryTierDef {
  level: number;
  title: string;
  minXp: number;
  heatReduction: number; // e.g. 0.12 = -12% heat per shot
  critChance: number; // e.g. 0.06 = +6% critical hit chance
  damageBonus: number; // e.g. 0.05 = +5% base weapon damage
  coolingBonus: number; // e.g. 0.10 = +10% faster heat dissipation
  badgeColor: string;
}

export const WEAPON_MASTERY_TIERS: WeaponMasteryTierDef[] = [
  {
    level: 0,
    title: 'ROOKIE',
    minXp: 0,
    heatReduction: 0,
    critChance: 0,
    damageBonus: 0,
    coolingBonus: 0,
    badgeColor: '#94a3b8',
  },
  {
    level: 1,
    title: 'ADEPT',
    minXp: 25,
    heatReduction: 0.12,
    critChance: 0.06,
    damageBonus: 0.05,
    coolingBonus: 0.05,
    badgeColor: '#38bdf8',
  },
  {
    level: 2,
    title: 'VETERAN',
    minXp: 75,
    heatReduction: 0.20,
    critChance: 0.12,
    damageBonus: 0.10,
    coolingBonus: 0.10,
    badgeColor: '#00ff88',
  },
  {
    level: 3,
    title: 'SPECIALIST',
    minXp: 160,
    heatReduction: 0.28,
    critChance: 0.18,
    damageBonus: 0.16,
    coolingBonus: 0.15,
    badgeColor: '#ffb400',
  },
  {
    level: 4,
    title: 'MASTER',
    minXp: 300,
    heatReduction: 0.35,
    critChance: 0.25,
    damageBonus: 0.22,
    coolingBonus: 0.20,
    badgeColor: '#c084fc',
  },
  {
    level: 5,
    title: 'CYBER APEX',
    minXp: 500,
    heatReduction: 0.42,
    critChance: 0.32,
    damageBonus: 0.30,
    coolingBonus: 0.25,
    badgeColor: '#facc15',
  },
];

export interface WeaponMasteryRecord {
  xp: number;
  level: number;
  shots: number;
  hits: number;
  kills: number;
}

export type WeaponMasteryMap = Record<WeaponType, WeaponMasteryRecord>;

export interface MasteryTierProgress extends WeaponMasteryTierDef {
  xp: number;
  nextXp: number | null;
  progressPercent: number;
}

export function getMasteryTierForXp(xp: number): MasteryTierProgress {
  const safeXp = Math.max(0, Math.floor(xp || 0));
  let current = WEAPON_MASTERY_TIERS[0];
  for (let i = WEAPON_MASTERY_TIERS.length - 1; i >= 0; i--) {
    if (safeXp >= WEAPON_MASTERY_TIERS[i].minXp) {
      current = WEAPON_MASTERY_TIERS[i];
      break;
    }
  }
  const nextTier = WEAPON_MASTERY_TIERS.find((t) => t.level === current.level + 1);
  if (!nextTier) {
    return {
      ...current,
      xp: safeXp,
      nextXp: null,
      progressPercent: 100,
    };
  }
  const span = Math.max(1, nextTier.minXp - current.minXp);
  const progressPercent = Math.max(
    0,
    Math.min(100, Math.round(((safeXp - current.minXp) / span) * 100))
  );
  return {
    ...current,
    xp: safeXp,
    nextXp: nextTier.minXp,
    progressPercent,
  };
}

export function createEmptyMasteryMap(): WeaponMasteryMap {
  const map = {} as WeaponMasteryMap;
  for (const wId of WEAPON_ORDER) {
    map[wId] = { xp: 0, level: 0, shots: 0, hits: 0, kills: 0 };
  }
  return map;
}

export function getMasteryXpGainForAction(action: 'shot' | 'hit' | 'kill'): number {
  switch (action) {
    case 'shot':
      return 1;
    case 'hit':
      return 2;
    case 'kill':
      return 10;
  }
}

export function awardWeaponMasteryXp(
  map: WeaponMasteryMap,
  weapon: WeaponType,
  action: 'shot' | 'hit' | 'kill',
  count: number = 1
): {
  updatedMap: WeaponMasteryMap;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  tier: MasteryTierProgress;
} {
  const existing = map[weapon] || { xp: 0, level: 0, shots: 0, hits: 0, kills: 0 };
  const safeCount = Math.max(1, Math.floor(count));
  const xpGain = getMasteryXpGainForAction(action) * safeCount;
  const previousLevel = getMasteryTierForXp(existing.xp).level;
  const nextXp = existing.xp + xpGain;
  const tier = getMasteryTierForXp(nextXp);

  const updatedRecord: WeaponMasteryRecord = {
    xp: nextXp,
    level: tier.level,
    shots: existing.shots + (action === 'shot' ? safeCount : 0),
    hits: existing.hits + (action === 'hit' ? safeCount : 0),
    kills: existing.kills + (action === 'kill' ? safeCount : 0),
  };

  return {
    updatedMap: {
      ...map,
      [weapon]: updatedRecord,
    },
    leveledUp: tier.level > previousLevel,
    previousLevel,
    newLevel: tier.level,
    tier,
  };
}

export function loadWeaponMastery(): WeaponMasteryMap {
  const base = createEmptyMasteryMap();
  if (typeof window === 'undefined') return base;
  try {
    const raw = localStorage.getItem(WEAPON_MASTERY_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    for (const wId of WEAPON_ORDER) {
      const rec = parsed?.[wId];
      if (rec && typeof rec === 'object') {
        const xp = Math.max(0, Number(rec.xp) || 0);
        base[wId] = {
          xp,
          level: getMasteryTierForXp(xp).level,
          shots: Math.max(0, Number(rec.shots) || 0),
          hits: Math.max(0, Number(rec.hits) || 0),
          kills: Math.max(0, Number(rec.kills) || 0),
        };
      }
    }
  } catch {
    // ignore storage parse error
  }
  return base;
}

export function saveWeaponMastery(map: WeaponMasteryMap): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WEAPON_MASTERY_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage write error
  }
}

export function formatMasteryPerksSummary(tier: Pick<WeaponMasteryTierDef, 'heatReduction' | 'critChance' | 'damageBonus' | 'coolingBonus'>): string[] {
  const perks: string[] = [];
  if (tier.heatReduction > 0) perks.push(`-${Math.round(tier.heatReduction * 100)}% Heat`);
  if (tier.critChance > 0) perks.push(`+${Math.round(tier.critChance * 100)}% Crit`);
  if (tier.damageBonus > 0) perks.push(`+${Math.round(tier.damageBonus * 100)}% Dmg`);
  if (tier.coolingBonus > 0) perks.push(`+${Math.round(tier.coolingBonus * 100)}% Cool`);
  return perks;
}
