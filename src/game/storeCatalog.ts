import type {
  CompanionDroneDef,
  CompanionDroneId,
  PermanentModuleDef,
  PermanentModuleId,
  PreRunBoosterId,
  StoreBundleDef,
  StoreGearState,
  ThrusterTrailDef,
  ThrusterTrailId,
  WeaponType,
} from './types';
import type { DiamondRelics } from './diamonds';
import { loadSupplyCrateState, saveSupplyCrateState, PRE_RUN_BOOSTERS } from './supplyCrate';
import { spendDiamonds } from './diamonds';
import { awardWeaponMasteryXp, loadWeaponMastery, saveWeaponMastery } from './mastery';

export const STORE_GEAR_STORAGE_KEY = 'nabilbot_store_gear_v1';

export const COMPANION_DRONES: Record<CompanionDroneId, CompanionDroneDef> = {
  scout_spark: {
    id: 'scout_spark',
    name: 'Spark-01 Laser Bot',
    role: 'Rapid Escort Turret',
    tier: 'standard',
    price: 850,
    diamondCost: 38,
    color: '#00f3ff',
    secondaryColor: '#38bdf8',
    icon: '🛰️',
    fireIntervalSec: 0.65,
    boltDamage: 15,
    pierce: 1,
    description:
      'Compact autonomous escort drone that orbits your airframe and fires crisp cyan laser darts at nearby hostiles.',
    perkSummary: '15 DMG Laser · 0.65s Fire Rate · 560px Lock Range',
  },
  aegis_orbiter: {
    id: 'aegis_orbiter',
    name: 'Aegis Guard Drone',
    role: 'Defensive Shield Support',
    tier: 'tactical',
    price: 2100,
    diamondCost: 82,
    color: '#34d399',
    secondaryColor: '#6ee7b7',
    icon: '🛡️',
    fireIntervalSec: 0.72,
    boltDamage: 18,
    pierce: 1,
    shieldPerCycle: 5,
    shieldCycleSec: 4.5,
    description:
      'Armored defense satellite that fires emerald guardian bolts and pulses +5 Shield directly into your hull every 4.5s.',
    perkSummary: '18 DMG Bolts · +5 Shield Pulse every 4.5s',
  },
  coin_collector_bot: {
    id: 'coin_collector_bot',
    name: 'Midas Magnet Drone',
    role: 'Harvest & Credit Amplifier',
    tier: 'tactical',
    price: 2700,
    diamondCost: 105,
    color: '#fbbf24',
    secondaryColor: '#fde047',
    icon: '🪙',
    fireIntervalSec: 0.70,
    boltDamage: 17,
    pierce: 1,
    magnetBonusPx: 110,
    coinMultBonus: 0.15,
    description:
      'Equipped with a golden tractor emitter that expands pickup magnet range by +110px and increases all Cyber Coin drops by +15%.',
    perkSummary: '+110px Coin Magnet · +15% Coin Yield · 17 DMG',
  },
  cryo_sentinel: {
    id: 'cryo_sentinel',
    name: 'Cryo-Frost Sentinel',
    role: 'Sub-Zero Crowd Suppressor',
    tier: 'tactical',
    price: 3800,
    diamondCost: 145,
    color: '#67e8f9',
    secondaryColor: '#a5f3fc',
    icon: '❄️',
    fireIntervalSec: 0.74,
    boltDamage: 24,
    pierce: 2,
    cryoSlowSec: 2.2,
    description:
      'Launches piercing sub-zero frost needles that slow hit targets by 45% for 2.2 seconds, neutralizing fast rushers.',
    perkSummary: '2.2s Cryo Slow · 2x Pierce · 24 DMG',
  },
  inferno_wyrm: {
    id: 'inferno_wyrm',
    name: 'Inferno Dragonling',
    role: 'Heavy Explosive Bombardier',
    tier: 'apex',
    price: 5600,
    diamondCost: 210,
    color: '#ff5500',
    secondaryColor: '#ffb400',
    icon: '🔥',
    fireIntervalSec: 0.85,
    boltDamage: 40,
    pierce: 1,
    explosionRadius: 56,
    description:
      'Fierce cybernetic fire-wyrm companion that hurls explosive 56px plasma firebombs into enemy packs.',
    perkSummary: '40 DMG Firebombs · 56px Blast Radius',
  },
  archon_seraph: {
    id: 'archon_seraph',
    name: 'Archon Seraph Unit',
    role: 'Celestial Diamond Wingman',
    tier: 'apex',
    price: 0,
    diamondCost: 225,
    color: '#e879f9',
    secondaryColor: '#38bdf8',
    icon: '👼',
    fireIntervalSec: 0.46,
    boltDamage: 44,
    pierce: 3,
    shieldPerCycle: 8,
    shieldCycleSec: 3.5,
    magnetBonusPx: 80,
    description:
      'Diamond Vault celestial seraph unit. Fires rapid 3-pierce tachyon spears, restores +8 Shield every 3.5s, and pulls loot +80px.',
    perkSummary: '44 DMG · 3x Pierce · +8 Shield/3.5s · +80px Magnet',
  },
  volt_arc_bot: {
    id: 'volt_arc_bot',
    name: 'Volt-9 Chain Spark',
    role: 'High-Voltage Pierce Drone',
    tier: 'tactical',
    price: 3200,
    diamondCost: 125,
    color: '#fde047',
    secondaryColor: '#00f3ff',
    icon: '⚡',
    fireIntervalSec: 0.52,
    boltDamage: 22,
    pierce: 3,
    description:
      'Overclocked lightning escort that launches high-velocity 3x-piercing volt spears every 0.52 seconds.',
    perkSummary: '22 DMG Volt · 0.52s Fast Cadence · 3x Pierce',
  },
  nova_harvester: {
    id: 'nova_harvester',
    name: 'Prism Loot Harvester',
    role: 'Jackpot Economy Bombardier',
    tier: 'tactical',
    price: 4500,
    diamondCost: 170,
    color: '#f472b6',
    secondaryColor: '#fde047',
    icon: '🧲',
    fireIntervalSec: 0.68,
    boltDamage: 28,
    pierce: 2,
    explosionRadius: 45,
    magnetBonusPx: 160,
    coinMultBonus: 0.22,
    description:
      'Upgraded treasury wingman with a massive +160px magnet beam, +22% coin yield, and 45px prismatic splash bolts.',
    perkSummary: '+160px Magnet · +22% Coins · 28 DMG (45px Splash)',
  },
  void_reaper_drone: {
    id: 'void_reaper_drone',
    name: 'Void Reaper Sentinel',
    role: 'Apex Diamond Annihilator',
    tier: 'apex',
    price: 0,
    diamondCost: 285,
    color: '#38bdf8',
    secondaryColor: '#c084fc',
    icon: '🔱',
    fireIntervalSec: 0.42,
    boltDamage: 58,
    pierce: 4,
    explosionRadius: 55,
    shieldPerCycle: 10,
    shieldCycleSec: 3.5,
    magnetBonusPx: 110,
    description:
      'Apex Diamond Vault wingman firing rapid 58-damage void detonators (4x pierce + 55px blast) with +10 Shield repair cycles.',
    perkSummary: '58 DMG · 4x Pierce · 55px Blast · +10 Shield/3.5s',
  },
};

export const COMPANION_ORDER: CompanionDroneId[] = [
  'scout_spark',
  'aegis_orbiter',
  'coin_collector_bot',
  'volt_arc_bot',
  'cryo_sentinel',
  'nova_harvester',
  'inferno_wyrm',
  'archon_seraph',
  'void_reaper_drone',
];

export const THRUSTER_TRAILS: Record<ThrusterTrailId, ThrusterTrailDef> = {
  trail_standard: {
    id: 'trail_standard',
    name: 'Standard Ion Exhaust',
    subtitle: 'Factory Issue Blue Plasma',
    price: 0,
    colors: ['#00f3ff', '#38bdf8'],
    icon: '💨',
    speedBonus: 0,
    coolingBonus: 0,
    magnetBonusPx: 0,
    dashCdReduction: 0,
    shieldRechargeBonus: 0,
    perkSummary: 'Baseline Ion Jet Visuals',
    description: 'Clean cyan plasma wake issued with every Bangladesh Cyber Corps craft.',
  },
  trail_cyber_rainbow: {
    id: 'trail_cyber_rainbow',
    name: 'Prismatic Spectrum Trail',
    subtitle: 'Full-Chroma Neon Ribbon',
    price: 1100,
    diamondCost: 45,
    colors: ['#00f3ff', '#a855f7', '#ec4899', '#facc15'],
    icon: '🌈',
    speedBonus: 0.05,
    coolingBonus: 0,
    magnetBonusPx: 0,
    dashCdReduction: 0,
    shieldRechargeBonus: 0,
    perkSummary: '+5% Flight Speed · Prismatic Afterimage',
    description: 'Leaves a luminous shifting rainbow neon ribbon behind your thrusters while tuning flight speed +5%.',
  },
  trail_solar_flare: {
    id: 'trail_solar_flare',
    name: 'Solar Ember Flame',
    subtitle: 'Superheated Molten Wake',
    price: 1800,
    diamondCost: 70,
    colors: ['#ff3300', '#ff8800', '#ffd700'],
    icon: '🔥',
    speedBonus: 0.03,
    coolingBonus: 0.12,
    magnetBonusPx: 0,
    dashCdReduction: 0,
    shieldRechargeBonus: 0,
    perkSummary: '+12% Weapon Heat Cooling · +3% Speed',
    description: 'Searing golden-crimson ember plumes that vent excess barrel heat +12% faster during sustained fire.',
  },
  trail_emerald_matrix: {
    id: 'trail_emerald_matrix',
    name: 'Digital Matrix Stream',
    subtitle: 'Emerald Code Cascade',
    price: 2150,
    diamondCost: 85,
    colors: ['#10b981', '#34d399', '#6ee7b7'],
    icon: '❇️',
    speedBonus: 0.03,
    coolingBonus: 0,
    magnetBonusPx: 65,
    dashCdReduction: 0,
    shieldRechargeBonus: 0,
    perkSummary: '+65px Loot Magnet · +3% Speed',
    description: 'Streams cascading emerald matrix telemetry behind your hull while expanding scrap/coin harvest range by +65px.',
  },
  trail_void_lightning: {
    id: 'trail_void_lightning',
    name: 'Phantom Void Lightning',
    subtitle: 'High-Voltage Violet Arcs',
    price: 2850,
    diamondCost: 110,
    colors: ['#c084fc', '#818cf8', '#00f3ff'],
    icon: '⚡',
    speedBonus: 0.05,
    coolingBonus: 0,
    magnetBonusPx: 0,
    dashCdReduction: 0.10,
    shieldRechargeBonus: 0,
    perkSummary: '-10% Dash Cooldown · +5% Speed',
    description: 'Crackling ultraviolet lightning wakes that shave 10% off tactical Dash recharge cooldowns.',
  },
  trail_celestial_gold: {
    id: 'trail_celestial_gold',
    name: 'Imperial Starlight Ribbon',
    subtitle: 'Diamond Vault Exclusive FX',
    price: 0,
    diamondCost: 135,
    colors: ['#fde047', '#fef08a', '#38bdf8', '#f472b6'],
    icon: '✨',
    speedBonus: 0.08,
    coolingBonus: 0.10,
    magnetBonusPx: 60,
    dashCdReduction: 0.08,
    shieldRechargeBonus: 12,
    perkSummary: '+8% Speed · +10% Cooling · +12/s Shield Recharge',
    description: 'Radiant golden starlight ribbon that accelerates thrust (+8%), cools weapons (+10%), and strengthens shield recovery.',
  },
  trail_crimson_afterburn: {
    id: 'trail_crimson_afterburn',
    name: 'Crimson Afterburner',
    subtitle: 'Turbo Scarlet Plasma Jet',
    price: 1450,
    diamondCost: 58,
    colors: ['#fb7185', '#f43f5e', '#ffb400'],
    icon: '🚀',
    speedBonus: 0.04,
    coolingBonus: 0.08,
    magnetBonusPx: 0,
    dashCdReduction: 0.05,
    shieldRechargeBonus: 0,
    perkSummary: '+4% Speed · +8% Cooling · -5% Dash CD',
    description: 'Twin-stage crimson afterburner stream tuned for crisp acceleration and sustained weapon cooling.',
  },
  trail_arctic_aurora: {
    id: 'trail_arctic_aurora',
    name: 'Arctic Aurora Ribbon',
    subtitle: 'Sub-Zero Frost Wake',
    price: 2500,
    diamondCost: 98,
    colors: ['#67e8f9', '#38bdf8', '#a5f3fc'],
    icon: '❄️',
    speedBonus: 0.04,
    coolingBonus: 0.06,
    magnetBonusPx: 90,
    dashCdReduction: 0,
    shieldRechargeBonus: 6,
    perkSummary: '+90px Magnet · +4% Speed · +6/s Shield',
    description: 'Luminous glacial aurora ribbon that draws nearby loot +90px inward while gently cooling barrels and shields.',
  },
  trail_quantum_prism: {
    id: 'trail_quantum_prism',
    name: 'Quantum Nova Wake',
    subtitle: 'Mythic Diamond Vault FX',
    price: 0,
    diamondCost: 175,
    colors: ['#38bdf8', '#e879f9', '#fde047', '#ffffff'],
    icon: '💠',
    speedBonus: 0.10,
    coolingBonus: 0.12,
    magnetBonusPx: 85,
    dashCdReduction: 0.12,
    shieldRechargeBonus: 14,
    perkSummary: '+10% Speed · +12% Cool · -12% Dash CD · +14/s Shield',
    description: 'Supreme prismatic star-wake engineered with diamond quantum condensers for unmatched agility, cooling, and shield regen.',
  },
};

export const TRAIL_ORDER: ThrusterTrailId[] = [
  'trail_standard',
  'trail_cyber_rainbow',
  'trail_crimson_afterburn',
  'trail_solar_flare',
  'trail_emerald_matrix',
  'trail_arctic_aurora',
  'trail_void_lightning',
  'trail_celestial_gold',
  'trail_quantum_prism',
];

export const PERMANENT_MODULES: Record<PermanentModuleId, PermanentModuleDef> = {
  kinetic_plating: {
    id: 'kinetic_plating',
    name: 'Titanium Hull Plating',
    category: 'ARMOR MODULE',
    price: 2800,
    diamondCost: 105,
    color: '#38bdf8',
    icon: '🔩',
    statLabel: '+2 Max HP · +25 Max Shield',
    description:
      'Permanently reinforces every airframe you pilot with +2 extra Health Pips (12 → 14 base HP) and +25 Max Shield.',
  },
  magnet_overdrive: {
    id: 'magnet_overdrive',
    name: 'Quantum Harvester Coil',
    category: 'ECONOMY MODULE',
    price: 2200,
    diamondCost: 85,
    color: '#fbbf24',
    icon: '🧲',
    statLabel: '+90px Magnet · +12% Coin Drops',
    description:
      'Permanently widens coin & scrap attraction by +90px and boosts all Cyber Coin pickup values by +12%.',
  },
  thermal_vent: {
    id: 'thermal_vent',
    name: 'Cryo-Heat Exchanger',
    category: 'WEAPON TECH',
    price: 3200,
    diamondCost: 120,
    color: '#2dd4bf',
    icon: '❄️',
    statLabel: '-18% Heat Build · +20% Faster Cooling',
    description:
      'Vents plasma barrel heat continuously, cutting heat buildup by 18% and accelerating passive cooling by +20%.',
  },
  vampiric_siphon: {
    id: 'vampiric_siphon',
    name: 'Nanite Siphon Matrix',
    category: 'SUSTAIN MODULE',
    price: 3900,
    diamondCost: 145,
    color: '#f43f5e',
    icon: '🩸',
    statLabel: '+1 HP every 15 Kills',
    description:
      'Harvests bio-nanites from purged hostiles—permanently restoring +1 HP socket after every 15 enemy eliminations.',
  },
  crit_amplifier: {
    id: 'crit_amplifier',
    name: 'Optic Crit Processor',
    category: 'WEAPON TECH',
    price: 3600,
    diamondCost: 135,
    color: '#facc15',
    icon: '🎯',
    statLabel: '+10% Critical Hit Chance',
    description:
      'Integrates predictive weakpoint targeting across every weapon you fire, permanently adding +10% Critical Strike chance.',
  },
  shield_capacitor: {
    id: 'shield_capacitor',
    name: 'Hyper-Phase Capacitor',
    category: 'DEFENSE MODULE',
    price: 4400,
    diamondCost: 165,
    color: '#a855f7',
    icon: '⚡',
    statLabel: '+45 Shield · +15/s Regen · -22% Delay',
    description:
      'Supercharges deflector cells with +45 Max Shield, +15/s recharge speed, and 22% faster shield recovery after taking damage.',
  },
};

export const MODULE_ORDER: PermanentModuleId[] = [
  'magnet_overdrive',
  'kinetic_plating',
  'thermal_vent',
  'crit_amplifier',
  'vampiric_siphon',
  'shield_capacitor',
];

export const BOOSTER_SHOP_PRICES: Record<PreRunBoosterId, number> = {
  shield_overcharge: 550,
  coin_rush: 650,
  weapon_overclock: 750,
  finisher_charged: 750,
  bounty_radar_vip: 850,
  headstart_augment: 980,
};

export const BOOSTER_DIAMOND_PRICES: Record<PreRunBoosterId, number> = {
  shield_overcharge: 22,
  coin_rush: 26,
  weapon_overclock: 30,
  finisher_charged: 30,
  bounty_radar_vip: 34,
  headstart_augment: 38,
};

export const BOOSTER_ORDER: PreRunBoosterId[] = [
  'shield_overcharge',
  'coin_rush',
  'weapon_overclock',
  'finisher_charged',
  'bounty_radar_vip',
  'headstart_augment',
];

export const STORE_BUNDLES: StoreBundleDef[] = [
  {
    id: 'bundle_starter_kit',
    name: 'Cyber Cadet Arsenal Kit',
    tagline: 'Instant multi-pellet shotgun + escort drone + combat shield surge',
    badge: 'SAVE 650+ COINS',
    priceCoins: 1350,
    priceDiamonds: 58,
    originalValueLabel: '2,000🪙 Value',
    color: '#00f3ff',
    icon: '📦',
    unlockWeapons: ['scatter'],
    unlockCompanions: ['scout_spark'],
    grantBoosters: ['shield_overcharge'],
    grantMasteryXp: 80,
    highlights: [
      'Unlocks Flak Scattergun (600🪙)',
      'Unlocks Spark-01 Laser Bot (850🪙)',
      'Arms +60 Shield Booster (550🪙) + 80 Mastery XP',
    ],
  },
  {
    id: 'bundle_vanguard_pack',
    name: 'Vanguard Pro Combat Pack',
    tagline: 'Economy harvester module + rainbow thruster wake + twin next-run boosters',
    badge: 'BEST VALUE',
    priceCoins: 2850,
    priceDiamonds: 115,
    originalValueLabel: '4,800🪙 Value',
    color: '#fbbf24',
    icon: '⚡',
    unlockTrails: ['trail_cyber_rainbow'],
    unlockModules: ['magnet_overdrive'],
    grantBoosters: ['weapon_overclock', 'finisher_charged'],
    grantMasteryXp: 150,
    highlights: [
      'Unlocks Quantum Harvester Coil Module (2,200🪙)',
      'Unlocks Prismatic Spectrum Trail (1,100🪙)',
      'Arms +20% DMG & Nova Ready Boosters + 150 XP',
    ],
  },
  {
    id: 'bundle_diamond_apex',
    name: 'Sylhet Apex Treasure Chest',
    tagline: 'Exclusive Starlight Trail + 2,500 Cyber Coins + VIP Bounty & Chip Draft',
    badge: 'DIAMOND DEAL',
    priceDiamonds: 130,
    originalValueLabel: '135💎 + 4,330🪙 Value',
    color: '#e879f9',
    icon: '👑',
    unlockTrails: ['trail_celestial_gold'],
    grantCoins: 2500,
    grantBoosters: ['headstart_augment', 'bounty_radar_vip'],
    highlights: [
      'Unlocks Imperial Starlight Trail (135💎 Value)',
      'Grants +2,500 Cyber Coins immediately',
      'Arms Chip W1 & VIP Bounty Boosters',
    ],
  },
  {
    id: 'bundle_storm_striker',
    name: 'Storm Striker Armory Pack',
    tagline: 'Prism Splitter Carbine + Volt-9 Escort Drone + Crimson Afterburner Trail',
    badge: 'SAVE 3,000 COINS',
    priceCoins: 5200,
    priceDiamonds: 195,
    originalValueLabel: '8,200🪙 Value',
    color: '#38bdf8',
    icon: '⚡',
    unlockWeapons: ['prism_splitter'],
    unlockCompanions: ['volt_arc_bot'],
    unlockTrails: ['trail_crimson_afterburn'],
    grantBoosters: ['weapon_overclock'],
    grantMasteryXp: 180,
    highlights: [
      'Unlocks Prism Arc Splitter Weapon (2,800🪙)',
      'Unlocks Volt-9 Chain Spark Drone (3,200🪙)',
      'Unlocks Crimson Afterburner Trail (1,450🪙) + 180 XP',
    ],
  },
  {
    id: 'bundle_apex_dominion',
    name: 'Apex Sovereign Superpack',
    tagline: 'Quantum Nova Trail + Hyper-Phase Shield Module + 3,500 Coins & 250 XP',
    badge: 'SUPREME VAULT PACK',
    priceDiamonds: 195,
    originalValueLabel: '175💎 + 9,630🪙 Value',
    color: '#f472b6',
    icon: '💎',
    unlockTrails: ['trail_quantum_prism'],
    unlockModules: ['shield_capacitor'],
    grantCoins: 3500,
    grantBoosters: ['headstart_augment', 'finisher_charged'],
    grantMasteryXp: 250,
    highlights: [
      'Unlocks Quantum Nova Wake Trail (175💎 Value)',
      'Installs Hyper-Phase Capacitor Module (4,400🪙)',
      'Grants +3,500 Cyber Coins + 2 Boosters + 250 XP',
    ],
  },
];

export function createInitialStoreGearState(): StoreGearState {
  return {
    unlockedCompanions: {
      scout_spark: false,
      aegis_orbiter: false,
      coin_collector_bot: false,
      volt_arc_bot: false,
      cryo_sentinel: false,
      nova_harvester: false,
      inferno_wyrm: false,
      archon_seraph: false,
      void_reaper_drone: false,
    },
    activeCompanion: null,
    unlockedTrails: {
      trail_standard: true,
      trail_cyber_rainbow: false,
      trail_crimson_afterburn: false,
      trail_solar_flare: false,
      trail_emerald_matrix: false,
      trail_arctic_aurora: false,
      trail_void_lightning: false,
      trail_celestial_gold: false,
      trail_quantum_prism: false,
    },
    activeTrail: 'trail_standard',
    unlockedModules: {
      kinetic_plating: false,
      magnet_overdrive: false,
      thermal_vent: false,
      vampiric_siphon: false,
      crit_amplifier: false,
      shield_capacitor: false,
    },
    purchasedBundles: {},
  };
}

export function normalizeStoreGearState(raw: Partial<StoreGearState> | null | undefined): StoreGearState {
  const base = createInitialStoreGearState();
  if (!raw) return base;

  for (const id of COMPANION_ORDER) {
    if (raw.unlockedCompanions?.[id]) base.unlockedCompanions[id] = true;
  }
  if (raw.activeCompanion && base.unlockedCompanions[raw.activeCompanion]) {
    base.activeCompanion = raw.activeCompanion;
  }

  for (const id of TRAIL_ORDER) {
    if (raw.unlockedTrails?.[id]) base.unlockedTrails[id] = true;
  }
  base.unlockedTrails.trail_standard = true;
  if (raw.activeTrail && base.unlockedTrails[raw.activeTrail]) {
    base.activeTrail = raw.activeTrail;
  }

  for (const id of MODULE_ORDER) {
    if (raw.unlockedModules?.[id]) base.unlockedModules[id] = true;
  }

  if (raw.purchasedBundles && typeof raw.purchasedBundles === 'object') {
    for (const [k, v] of Object.entries(raw.purchasedBundles)) {
      if (v) base.purchasedBundles[k] = true;
    }
  }

  return base;
}

export function loadStoreGearState(): StoreGearState {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createInitialStoreGearState();
  }
  try {
    const raw = localStorage.getItem(STORE_GEAR_STORAGE_KEY);
    if (!raw) return createInitialStoreGearState();
    return normalizeStoreGearState(JSON.parse(raw));
  } catch {
    return createInitialStoreGearState();
  }
}

export function saveStoreGearState(state: StoreGearState): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(STORE_GEAR_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function isCompanionDiamondExclusive(id: CompanionDroneId): boolean {
  const def = COMPANION_DRONES[id];
  return Boolean(def && def.price === 0 && (def.diamondCost ?? 0) > 0);
}

export function purchaseCompanionState(
  state: StoreGearState,
  coins: number,
  id: CompanionDroneId
): {
  success: boolean;
  remainingCoins: number;
  updatedState: StoreGearState;
  error?: string;
} {
  if (state.unlockedCompanions[id]) {
    return {
      success: false,
      remainingCoins: coins,
      updatedState: state,
      error: 'Companion drone is already unlocked.',
    };
  }
  const def = COMPANION_DRONES[id];
  if (isCompanionDiamondExclusive(id)) {
    return {
      success: false,
      remainingCoins: coins,
      updatedState: state,
      error: `${def.name} requires ${def.diamondCost} Diamonds in the Diamond Vault.`,
    };
  }
  if (coins < def.price) {
    return {
      success: false,
      remainingCoins: coins,
      updatedState: state,
      error: `Insufficient coins! Need ${def.price - coins} more coins.`,
    };
  }
  const updatedState: StoreGearState = {
    ...state,
    unlockedCompanions: {
      ...state.unlockedCompanions,
      [id]: true,
    },
    activeCompanion: id,
  };
  return {
    success: true,
    remainingCoins: coins - def.price,
    updatedState,
  };
}

export function purchaseCompanionWithDiamondsState(
  state: StoreGearState,
  diamonds: number,
  id: CompanionDroneId
): {
  success: boolean;
  remainingDiamonds: number;
  updatedState: StoreGearState;
  cost: number;
  error?: string;
} {
  if (state.unlockedCompanions[id]) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedState: state,
      cost: 0,
      error: 'Companion drone is already unlocked.',
    };
  }
  const def = COMPANION_DRONES[id];
  const cost = def?.diamondCost ?? 0;
  if (!def || cost <= 0) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedState: state,
      cost: 0,
      error: `${def?.name ?? id} cannot be purchased with Diamonds.`,
    };
  }
  if (diamonds < cost) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedState: state,
      cost,
      error: `Insufficient diamonds! Need ${cost - diamonds} more 💎.`,
    };
  }
  const updatedState: StoreGearState = {
    ...state,
    unlockedCompanions: {
      ...state.unlockedCompanions,
      [id]: true,
    },
    activeCompanion: id,
  };
  return {
    success: true,
    remainingDiamonds: diamonds - cost,
    updatedState,
    cost,
  };
}

export function unlockDiamondCompanionState(
  state: StoreGearState,
  id: CompanionDroneId
): StoreGearState {
  return {
    ...state,
    unlockedCompanions: {
      ...state.unlockedCompanions,
      [id]: true,
    },
    activeCompanion: id,
  };
}

export function equipCompanionState(
  state: StoreGearState,
  id: CompanionDroneId | null
): { success: boolean; updatedState: StoreGearState; error?: string } {
  if (id === null) {
    return {
      success: true,
      updatedState: { ...state, activeCompanion: null },
    };
  }
  if (!state.unlockedCompanions[id]) {
    return {
      success: false,
      updatedState: state,
      error: 'Unlock this companion drone first.',
    };
  }
  return {
    success: true,
    updatedState: { ...state, activeCompanion: id },
  };
}

export function isTrailDiamondExclusive(id: ThrusterTrailId): boolean {
  const def = THRUSTER_TRAILS[id];
  return Boolean(def && def.price === 0 && (def.diamondCost ?? 0) > 0);
}

export function purchaseTrailState(
  state: StoreGearState,
  coins: number,
  id: ThrusterTrailId
): {
  success: boolean;
  remainingCoins: number;
  updatedState: StoreGearState;
  error?: string;
} {
  if (state.unlockedTrails[id]) {
    return {
      success: false,
      remainingCoins: coins,
      updatedState: state,
      error: 'Thruster trail is already unlocked.',
    };
  }
  const def = THRUSTER_TRAILS[id];
  if (isTrailDiamondExclusive(id)) {
    return {
      success: false,
      remainingCoins: coins,
      updatedState: state,
      error: `${def.name} requires ${def.diamondCost} Diamonds in the Diamond Vault.`,
    };
  }
  if (coins < def.price) {
    return {
      success: false,
      remainingCoins: coins,
      updatedState: state,
      error: `Insufficient coins! Need ${def.price - coins} more coins.`,
    };
  }
  return {
    success: true,
    remainingCoins: coins - def.price,
    updatedState: {
      ...state,
      unlockedTrails: {
        ...state.unlockedTrails,
        [id]: true,
      },
      activeTrail: id,
    },
  };
}

export function purchaseTrailWithDiamondsState(
  state: StoreGearState,
  diamonds: number,
  id: ThrusterTrailId
): {
  success: boolean;
  remainingDiamonds: number;
  updatedState: StoreGearState;
  cost: number;
  error?: string;
} {
  if (state.unlockedTrails[id]) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedState: state,
      cost: 0,
      error: 'Thruster trail is already unlocked.',
    };
  }
  const def = THRUSTER_TRAILS[id];
  const cost = def?.diamondCost ?? 0;
  if (!def || cost <= 0) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedState: state,
      cost: 0,
      error: `${def?.name ?? id} cannot be purchased with Diamonds.`,
    };
  }
  if (diamonds < cost) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedState: state,
      cost,
      error: `Insufficient diamonds! Need ${cost - diamonds} more 💎.`,
    };
  }
  return {
    success: true,
    remainingDiamonds: diamonds - cost,
    updatedState: {
      ...state,
      unlockedTrails: {
        ...state.unlockedTrails,
        [id]: true,
      },
      activeTrail: id,
    },
    cost,
  };
}

export function unlockDiamondTrailState(
  state: StoreGearState,
  id: ThrusterTrailId
): StoreGearState {
  return {
    ...state,
    unlockedTrails: {
      ...state.unlockedTrails,
      [id]: true,
    },
    activeTrail: id,
  };
}

export function equipTrailState(
  state: StoreGearState,
  id: ThrusterTrailId
): { success: boolean; updatedState: StoreGearState; error?: string } {
  if (!state.unlockedTrails[id]) {
    return {
      success: false,
      updatedState: state,
      error: 'Unlock this thruster trail first.',
    };
  }
  return {
    success: true,
    updatedState: { ...state, activeTrail: id },
  };
}

export function purchaseModuleState(
  state: StoreGearState,
  coins: number,
  id: PermanentModuleId
): {
  success: boolean;
  remainingCoins: number;
  updatedState: StoreGearState;
  error?: string;
} {
  if (state.unlockedModules[id]) {
    return {
      success: false,
      remainingCoins: coins,
      updatedState: state,
      error: 'Module is already permanently active.',
    };
  }
  const def = PERMANENT_MODULES[id];
  if (coins < def.price) {
    return {
      success: false,
      remainingCoins: coins,
      updatedState: state,
      error: `Insufficient coins! Need ${def.price - coins} more coins.`,
    };
  }
  return {
    success: true,
    remainingCoins: coins - def.price,
    updatedState: {
      ...state,
      unlockedModules: {
        ...state.unlockedModules,
        [id]: true,
      },
    },
  };
}

export function purchaseModuleWithDiamondsState(
  state: StoreGearState,
  diamonds: number,
  id: PermanentModuleId
): {
  success: boolean;
  remainingDiamonds: number;
  updatedState: StoreGearState;
  cost: number;
  error?: string;
} {
  if (state.unlockedModules[id]) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedState: state,
      cost: 0,
      error: 'Module is already permanently active.',
    };
  }
  const def = PERMANENT_MODULES[id];
  const cost = def?.diamondCost ?? 0;
  if (!def || cost <= 0) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedState: state,
      cost: 0,
      error: `${def?.name ?? id} cannot be purchased with Diamonds.`,
    };
  }
  if (diamonds < cost) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedState: state,
      cost,
      error: `Insufficient diamonds! Need ${cost - diamonds} more 💎.`,
    };
  }
  return {
    success: true,
    remainingDiamonds: diamonds - cost,
    updatedState: {
      ...state,
      unlockedModules: {
        ...state.unlockedModules,
        [id]: true,
      },
    },
    cost,
  };
}

export interface ComputedStoreGearModifiers {
  maxHpBonus: number;
  maxShieldBonus: number;
  speedBonus: number;
  coolingMultiplier: number;
  heatPerShotMultiplier: number;
  dashCdMultiplier: number;
  magnetBonusPx: number;
  coinMultiplier: number;
  fireRateMultiplier: number;
  damageMultiplier: number;
  critChanceBonus: number;
  shieldRechargeBonus: number;
  shieldDelayMultiplier: number;
  vampiricKillsPerHp: number;
  finisherChargeMultiplier: number;
}

export function computeStoreGearModifiers(
  state: StoreGearState,
  relics?: Partial<DiamondRelics>
): ComputedStoreGearModifiers {
  const activeCompanion = state.activeCompanion ? COMPANION_DRONES[state.activeCompanion] : null;
  const activeTrail = THRUSTER_TRAILS[state.activeTrail] || THRUSTER_TRAILS.trail_standard;

  let maxHpBonus = 0;
  let maxShieldBonus = 0;
  let speedBonus = activeTrail.speedBonus;
  let coolingMultiplier = 1 + activeTrail.coolingBonus;
  let heatPerShotMultiplier = 1.0;
  const dashCdMultiplier = Math.max(0.75, 1 - activeTrail.dashCdReduction);
  let magnetBonusPx = activeTrail.magnetBonusPx + (activeCompanion?.magnetBonusPx ?? 0);
  let coinMultiplier = 1 + (activeCompanion?.coinMultBonus ?? 0);
  let fireRateMultiplier = 1.0;
  let damageMultiplier = 1.0;
  let critChanceBonus = 0;
  let shieldRechargeBonus = activeTrail.shieldRechargeBonus;
  let shieldDelayMultiplier = 1.0;
  let vampiricKillsPerHp = 0;
  let finisherChargeMultiplier = 1.0;

  if (state.unlockedModules.kinetic_plating) {
    maxHpBonus += 2;
    maxShieldBonus += 25;
  }
  if (state.unlockedModules.magnet_overdrive) {
    magnetBonusPx += 90;
    coinMultiplier += 0.12;
  }
  if (state.unlockedModules.thermal_vent) {
    heatPerShotMultiplier *= 0.82;
    coolingMultiplier += 0.20;
  }
  if (state.unlockedModules.vampiric_siphon) {
    vampiricKillsPerHp = 15;
  }
  if (state.unlockedModules.crit_amplifier) {
    critChanceBonus += 0.10;
  }
  if (state.unlockedModules.shield_capacitor) {
    maxShieldBonus += 45;
    shieldRechargeBonus += 15;
    shieldDelayMultiplier *= 0.78;
  }

  if (relics?.solar_overcharge) {
    fireRateMultiplier += 0.15;
    finisherChargeMultiplier += 0.25;
  }
  if (relics?.midas_treasury) {
    coinMultiplier += 0.35;
  }
  if (relics?.void_overdrive) {
    damageMultiplier += 0.12;
    shieldRechargeBonus += 10;
  }

  return {
    maxHpBonus,
    maxShieldBonus,
    speedBonus,
    coolingMultiplier,
    heatPerShotMultiplier,
    dashCdMultiplier,
    magnetBonusPx,
    coinMultiplier,
    fireRateMultiplier,
    damageMultiplier,
    critChanceBonus,
    shieldRechargeBonus,
    shieldDelayMultiplier,
    vampiricKillsPerHp,
    finisherChargeMultiplier,
  };
}

export function purchaseBoosterWithCoins(
  boosterId: PreRunBoosterId,
  currentCoins: number
): {
  success: boolean;
  remainingCoins: number;
  armedBoosters: PreRunBoosterId[];
  error?: string;
} {
  const cost = BOOSTER_SHOP_PRICES[boosterId] ?? 300;
  const crateState = loadSupplyCrateState();
  if (crateState.armedBoosters.includes(boosterId)) {
    return {
      success: false,
      remainingCoins: currentCoins,
      armedBoosters: crateState.armedBoosters,
      error: `${PRE_RUN_BOOSTERS[boosterId].name} is already armed for your next run!`,
    };
  }
  if (currentCoins < cost) {
    return {
      success: false,
      remainingCoins: currentCoins,
      armedBoosters: crateState.armedBoosters,
      error: `Need ${cost - currentCoins} more coins to arm ${PRE_RUN_BOOSTERS[boosterId].name}.`,
    };
  }

  const nextBoosters = [...crateState.armedBoosters, boosterId];
  saveSupplyCrateState({
    ...crateState,
    armedBoosters: nextBoosters,
  });
  const remainingCoins = currentCoins - cost;
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('nabilbot_coins', String(remainingCoins));
  }
  return {
    success: true,
    remainingCoins,
    armedBoosters: nextBoosters,
  };
}

export function purchaseBoosterWithDiamondsState(
  armedBoosters: PreRunBoosterId[],
  boosterId: PreRunBoosterId,
  currentDiamonds: number
): {
  success: boolean;
  remainingDiamonds: number;
  armedBoosters: PreRunBoosterId[];
  cost: number;
  error?: string;
} {
  const cost = BOOSTER_DIAMOND_PRICES[boosterId] ?? 14;
  if (armedBoosters.includes(boosterId)) {
    return {
      success: false,
      remainingDiamonds: currentDiamonds,
      armedBoosters,
      cost: 0,
      error: `${PRE_RUN_BOOSTERS[boosterId].name} is already armed for your next run!`,
    };
  }
  if (currentDiamonds < cost) {
    return {
      success: false,
      remainingDiamonds: currentDiamonds,
      armedBoosters,
      cost,
      error: `Need ${cost - currentDiamonds} more 💎 Diamonds to arm ${PRE_RUN_BOOSTERS[boosterId].name}.`,
    };
  }
  return {
    success: true,
    remainingDiamonds: currentDiamonds - cost,
    armedBoosters: [...armedBoosters, boosterId],
    cost,
  };
}

export function purchaseBoosterWithDiamonds(
  boosterId: PreRunBoosterId
): {
  success: boolean;
  remainingDiamonds: number;
  armedBoosters: PreRunBoosterId[];
  cost: number;
  error?: string;
} {
  const crateState = loadSupplyCrateState();
  const cost = BOOSTER_DIAMOND_PRICES[boosterId] ?? 14;
  if (crateState.armedBoosters.includes(boosterId)) {
    return {
      success: false,
      remainingDiamonds: 0,
      armedBoosters: crateState.armedBoosters,
      cost: 0,
      error: `${PRE_RUN_BOOSTERS[boosterId].name} is already armed for your next run!`,
    };
  }
  const dRes = spendDiamonds(cost);
  if (!dRes.success) {
    return {
      success: false,
      remainingDiamonds: dRes.remaining,
      armedBoosters: crateState.armedBoosters,
      cost,
      error: dRes.error || `Need ${cost} 💎 Diamonds to arm ${PRE_RUN_BOOSTERS[boosterId].name}.`,
    };
  }
  const nextBoosters = [...crateState.armedBoosters, boosterId];
  saveSupplyCrateState({
    ...crateState,
    armedBoosters: nextBoosters,
  });
  return {
    success: true,
    remainingDiamonds: dRes.remaining,
    armedBoosters: nextBoosters,
    cost,
  };
}

export function applyBundleRewardsToState(
  bundle: StoreBundleDef,
  params: {
    currentCoins: number;
    activeWeapon: WeaponType;
    gearState: StoreGearState;
  }
): {
  nextCoins: number;
  updatedGearState: StoreGearState;
  unlockedWeaponsList: WeaponType[];
} {
  let nextCoins = params.currentCoins;
  if (bundle.grantCoins) {
    nextCoins += bundle.grantCoins;
  }

  const nextGear: StoreGearState = {
    ...params.gearState,
    unlockedCompanions: { ...params.gearState.unlockedCompanions },
    unlockedTrails: { ...params.gearState.unlockedTrails },
    unlockedModules: { ...params.gearState.unlockedModules },
    purchasedBundles: {
      ...params.gearState.purchasedBundles,
      [bundle.id]: true,
    },
  };

  for (const cId of bundle.unlockCompanions || []) {
    nextGear.unlockedCompanions[cId] = true;
    nextGear.activeCompanion = cId;
  }
  for (const tId of bundle.unlockTrails || []) {
    nextGear.unlockedTrails[tId] = true;
    nextGear.activeTrail = tId;
  }
  for (const mId of bundle.unlockModules || []) {
    nextGear.unlockedModules[mId] = true;
  }

  return {
    nextCoins,
    updatedGearState: nextGear,
    unlockedWeaponsList: bundle.unlockWeapons || [],
  };
}

export function purchaseStoreBundle(
  bundleId: string,
  params: {
    currentCoins: number;
    activeWeapon: WeaponType;
    gearState: StoreGearState;
    currency?: 'coins' | 'diamonds';
    currentDiamonds?: number;
  }
): {
  success: boolean;
  error?: string;
  bundle?: StoreBundleDef;
  remainingCoins: number;
  remainingDiamonds?: number;
  updatedGearState: StoreGearState;
  unlockedWeaponsList: WeaponType[];
  armedBoosters: PreRunBoosterId[];
} {
  const bundle = STORE_BUNDLES.find((b) => b.id === bundleId);
  if (!bundle) {
    return {
      success: false,
      error: 'Bundle not found.',
      remainingCoins: params.currentCoins,
      updatedGearState: params.gearState,
      unlockedWeaponsList: [],
      armedBoosters: loadSupplyCrateState().armedBoosters,
    };
  }

  if (params.gearState.purchasedBundles[bundle.id]) {
    return {
      success: false,
      error: 'This Armory Bundle has already been claimed.',
      remainingCoins: params.currentCoins,
      updatedGearState: params.gearState,
      unlockedWeaponsList: [],
      armedBoosters: loadSupplyCrateState().armedBoosters,
    };
  }

  const useDiamonds =
    params.currency === 'diamonds' ||
    (!bundle.priceCoins && Boolean(bundle.priceDiamonds && bundle.priceDiamonds > 0));

  let nextCoins = params.currentCoins;
  let remainingDiamonds: number | undefined;

  if (useDiamonds) {
    const dCost = bundle.priceDiamonds ?? 0;
    if (dCost <= 0) {
      return {
        success: false,
        error: 'This bundle cannot be purchased with Diamonds.',
        remainingCoins: params.currentCoins,
        updatedGearState: params.gearState,
        unlockedWeaponsList: [],
        armedBoosters: loadSupplyCrateState().armedBoosters,
      };
    }
    if (typeof params.currentDiamonds === 'number') {
      if (params.currentDiamonds < dCost) {
        return {
          success: false,
          error: `Insufficient diamonds! Need ${dCost} 💎, but you have ${params.currentDiamonds} 💎.`,
          remainingCoins: params.currentCoins,
          remainingDiamonds: params.currentDiamonds,
          updatedGearState: params.gearState,
          unlockedWeaponsList: [],
          armedBoosters: loadSupplyCrateState().armedBoosters,
        };
      }
      remainingDiamonds = params.currentDiamonds - dCost;
    } else {
      const dRes = spendDiamonds(dCost);
      if (!dRes.success) {
        return {
          success: false,
          error: dRes.error || `Need ${dCost} Diamonds!`,
          remainingCoins: params.currentCoins,
          remainingDiamonds: dRes.remaining,
          updatedGearState: params.gearState,
          unlockedWeaponsList: [],
          armedBoosters: loadSupplyCrateState().armedBoosters,
        };
      }
      remainingDiamonds = dRes.remaining;
    }
  } else if (bundle.priceCoins && bundle.priceCoins > 0) {
    if (params.currentCoins < bundle.priceCoins) {
      return {
        success: false,
        error: `Need ${bundle.priceCoins - params.currentCoins} more Cyber Coins.`,
        remainingCoins: params.currentCoins,
        updatedGearState: params.gearState,
        unlockedWeaponsList: [],
        armedBoosters: loadSupplyCrateState().armedBoosters,
      };
    }
    nextCoins -= bundle.priceCoins;
  }

  const applied = applyBundleRewardsToState(bundle, {
    currentCoins: nextCoins,
    activeWeapon: params.activeWeapon,
    gearState: params.gearState,
  });
  nextCoins = applied.nextCoins;
  const nextGear = applied.updatedGearState;
  saveStoreGearState(nextGear);

  const crateState = loadSupplyCrateState();
  const nextBoosters = [...crateState.armedBoosters];
  for (const bId of bundle.grantBoosters || []) {
    if (!nextBoosters.includes(bId)) nextBoosters.push(bId);
  }
  if ((bundle.grantBoosters?.length || 0) > 0) {
    saveSupplyCrateState({
      ...crateState,
      armedBoosters: nextBoosters,
    });
  }

  if (bundle.grantMasteryXp && bundle.grantMasteryXp > 0) {
    const masteryMap = loadWeaponMastery();
    const xpRes = awardWeaponMasteryXp(
      masteryMap,
      params.activeWeapon,
      'kill',
      Math.ceil(bundle.grantMasteryXp / 12)
    );
    saveWeaponMastery(xpRes.updatedMap);
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('nabilbot_coins', String(nextCoins));
  }

  return {
    success: true,
    bundle,
    remainingCoins: nextCoins,
    remainingDiamonds,
    updatedGearState: nextGear,
    unlockedWeaponsList: applied.unlockedWeaponsList,
    armedBoosters: nextBoosters,
  };
}
