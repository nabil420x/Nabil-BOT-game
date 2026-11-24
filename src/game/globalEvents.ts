import type {
  CraftId,
  CraftSkinId,
  GlobalEventDef,
  GlobalEventObjective,
  GlobalEventObjectiveType,
  GlobalEventState,
  GlobalEventWindowInfo,
  NeonCraftSkinDef,
} from './types';
import { addDiamonds } from './diamonds';

export const GLOBAL_EVENT_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours
export const GLOBAL_EVENT_EPOCH_MS = Date.UTC(2026, 10, 17, 0, 0, 0); // 2026-11-17T00:00:00Z
export const GLOBAL_EVENT_STORAGE_KEY = 'nabilbot_global_event_v1';

export const NEON_CRAFT_SKINS: Record<CraftId, NeonCraftSkinDef> = {
  vanguard_alpha: {
    craftId: 'vanguard_alpha',
    skinId: 'neon',
    name: 'Neon Cyber-Pulse Alpha',
    tagline: 'Hyper-charged dual-cyan & synth-magenta grid hull lines',
    hullFill: '#071324',
    primaryNeon: '#00ffd5',
    secondaryNeon: '#ff00aa',
    thrusterNeon: '#00f3ff',
    shieldNeon: '#00ffd5',
    trailColor: '#00ffd5',
  },
  phantom_shadow: {
    craftId: 'phantom_shadow',
    skinId: 'neon',
    name: 'Neon Synthwave Phantom',
    tagline: 'Electric ultraviolet edges & plasma-magenta wing ribbons',
    hullFill: '#140529',
    primaryNeon: '#ff00e6',
    secondaryNeon: '#00f3ff',
    thrusterNeon: '#f0abfc',
    shieldNeon: '#e879f9',
    trailColor: '#ff00e6',
  },
  titan_dread: {
    craftId: 'titan_dread',
    skinId: 'neon',
    name: 'Neon Plasma Dreadnought',
    tagline: 'Superheated neon lime & molten gold bastion armor grid',
    hullFill: '#0b1b12',
    primaryNeon: '#39ff14',
    secondaryNeon: '#fde047',
    thrusterNeon: '#39ff14',
    shieldNeon: '#4ade80',
    trailColor: '#39ff14',
  },
  solar_phoenix: {
    craftId: 'solar_phoenix',
    skinId: 'neon',
    name: 'Neon Ultraviolet Phoenix',
    tagline: 'Blazing neon crimson-orange solar veins & radiant plume',
    hullFill: '#210714',
    primaryNeon: '#ff2a85',
    secondaryNeon: '#fbbf24',
    thrusterNeon: '#ff6b00',
    shieldNeon: '#ff2a85',
    trailColor: '#ff2a85',
  },
  aegis_celestial: {
    craftId: 'aegis_celestial',
    skinId: 'neon',
    name: 'Neon Hyper-Prism Aegis',
    tagline: 'Holographic prism cyan-gold nacelles & synchronized lattice ring',
    hullFill: '#07162b',
    primaryNeon: '#38bdf8',
    secondaryNeon: '#facc15',
    thrusterNeon: '#a855f7',
    shieldNeon: '#38bdf8',
    trailColor: '#a855f7',
  },
  astral_valkyrie: {
    craftId: 'astral_valkyrie',
    skinId: 'neon',
    name: 'Neon Astral Supernova',
    tagline: 'Pure bioluminescent white-cyan starlight filigree & aura',
    hullFill: '#091533',
    primaryNeon: '#7df9ff',
    secondaryNeon: '#f472b6',
    thrusterNeon: '#ffffff',
    shieldNeon: '#7df9ff',
    trailColor: '#7df9ff',
  },
  cyber_falcon: {
    craftId: 'cyber_falcon',
    skinId: 'neon',
    name: 'Neon Hyper-Falcon',
    tagline: 'Electric aqua-mint wingtips with high-voltage cyan afterburner',
    hullFill: '#061c1d',
    primaryNeon: '#2dd4bf',
    secondaryNeon: '#38bdf8',
    thrusterNeon: '#5eead4',
    shieldNeon: '#2dd4bf',
    trailColor: '#2dd4bf',
  },
  nebula_harbinger: {
    craftId: 'nebula_harbinger',
    skinId: 'neon',
    name: 'Neon Nebula Eclipse',
    tagline: 'Bioluminescent magenta-orchid void lattice & gravity core',
    hullFill: '#1a0726',
    primaryNeon: '#e879f9',
    secondaryNeon: '#38bdf8',
    thrusterNeon: '#f472b6',
    shieldNeon: '#e879f9',
    trailColor: '#e879f9',
  },
  zenith_emperor: {
    craftId: 'zenith_emperor',
    skinId: 'neon',
    name: 'Neon Sovereign Zenith',
    tagline: 'Blinding imperial gold-neon filigree & ruby plasma halo',
    hullFill: '#1f1604',
    primaryNeon: '#fde047',
    secondaryNeon: '#fb7185',
    thrusterNeon: '#fef08a',
    shieldNeon: '#fde047',
    trailColor: '#fde047',
  },
  tempest_raptor: {
    craftId: 'tempest_raptor',
    skinId: 'neon',
    name: 'Neon Crimson Tempest',
    tagline: 'Razored neon scarlet blades & hyper-cyan plasma overdrive',
    hullFill: '#240712',
    primaryNeon: '#fb7185',
    secondaryNeon: '#38bdf8',
    thrusterNeon: '#00f3ff',
    shieldNeon: '#fb7185',
    trailColor: '#fb7185',
  },
  seraph_nova: {
    craftId: 'seraph_nova',
    skinId: 'neon',
    name: 'Neon Prism Seraph',
    tagline: 'Pure holographic diamond-white filigree & ultraviolet aurora halo',
    hullFill: '#0b1930',
    primaryNeon: '#e0f2fe',
    secondaryNeon: '#e879f9',
    thrusterNeon: '#7df9ff',
    shieldNeon: '#e879f9',
    trailColor: '#e0f2fe',
  },
};

export const GLOBAL_EVENT_ROTATION: GlobalEventDef[] = [
  {
    id: 'neon_vanguard_blitz',
    title: 'Neon Vanguard Overclock',
    subtitle: 'Purge rogue AI swarms across any sector to forge the exclusive Neon Vanguard Alpha skin.',
    badgeIcon: '⚡',
    accentColor: '#00ffd5',
    secondaryColor: '#ff00aa',
    rewardCraftId: 'vanguard_alpha',
    objectives: [
      {
        id: 'ev_vanguard_kills',
        title: 'Grid Sweep',
        description: 'Eliminate 40 hostiles in any campaign sector.',
        objectiveType: 'kills_total',
        targetValue: 40,
        rewardCoins: 250,
        rewardDiamonds: 2,
        icon: '🎯',
      },
      {
        id: 'ev_vanguard_augments',
        title: 'Chip Calibration',
        description: 'Install 3 Cyber-Chip Augments during combat runs.',
        objectiveType: 'augments_installed',
        targetValue: 3,
        rewardCoins: 300,
        rewardDiamonds: 2,
        icon: '🧩',
      },
      {
        id: 'ev_vanguard_coins',
        title: 'Neon Salvage',
        description: 'Harvest 80 Cyber Coins inside active battles.',
        objectiveType: 'collect_coins',
        targetValue: 80,
        rewardCoins: 350,
        rewardDiamonds: 3,
        icon: '🪙',
      },
    ],
  },
  {
    id: 'neon_phantom_eclipse',
    title: 'Cyber Eclipse Protocol',
    subtitle: 'Hunt stealth assassins and hold razor-sharp combos to unlock Neon Phantom Shadow-Wing.',
    badgeIcon: '🌌',
    accentColor: '#ff00e6',
    secondaryColor: '#00f3ff',
    rewardCraftId: 'phantom_shadow',
    objectives: [
      {
        id: 'ev_phantom_kills',
        title: 'Shadow Hunter',
        description: 'Eliminate 12 stealth Phantom or Sniper drones.',
        objectiveType: 'kills_phantom',
        targetValue: 12,
        rewardCoins: 350,
        rewardDiamonds: 2,
        icon: '👻',
      },
      {
        id: 'ev_phantom_combo',
        title: 'Hyper-Chain',
        description: 'Reach a 20x Combat Combo streak.',
        objectiveType: 'combo_streak',
        targetValue: 20,
        rewardCoins: 400,
        rewardDiamonds: 3,
        icon: '🔥',
      },
      {
        id: 'ev_phantom_sectors',
        title: 'Sector Raider',
        description: 'Clear 3 battle sectors during this 48h window.',
        objectiveType: 'clear_sectors',
        targetValue: 3,
        rewardCoins: 450,
        rewardDiamonds: 3,
        icon: '🚀',
      },
    ],
  },
  {
    id: 'neon_titan_siege',
    title: 'Bastion Plasma Surge',
    subtitle: 'Smash armored walkers and breach heavy lines to claim Neon Titan Dreadnought.',
    badgeIcon: '🛡️',
    accentColor: '#39ff14',
    secondaryColor: '#fde047',
    rewardCraftId: 'titan_dread',
    objectives: [
      {
        id: 'ev_titan_tanks',
        title: 'Armor Shatter',
        description: 'Destroy 15 Heavy Tanks or Behemoth walkers.',
        objectiveType: 'kills_tank',
        targetValue: 15,
        rewardCoins: 400,
        rewardDiamonds: 2,
        icon: '💥',
      },
      {
        id: 'ev_titan_cores',
        title: 'Jackpot Interceptor',
        description: 'Destroy 2 fleeing Golden Data-Cores.',
        objectiveType: 'golden_cores',
        targetValue: 2,
        rewardCoins: 450,
        rewardDiamonds: 3,
        icon: '💎',
      },
      {
        id: 'ev_titan_kills',
        title: 'Heavy Barrage',
        description: 'Eliminate 75 total hostiles.',
        objectiveType: 'kills_total',
        targetValue: 75,
        rewardCoins: 450,
        rewardDiamonds: 3,
        icon: '⚡',
      },
    ],
  },
  {
    id: 'neon_solar_flare',
    title: 'Hypernova Flare Event',
    subtitle: 'Clear sniper lines and overcharge chips to forge Neon Solar Phoenix Raider.',
    badgeIcon: '🦅',
    accentColor: '#ff2a85',
    secondaryColor: '#fbbf24',
    rewardCraftId: 'solar_phoenix',
    objectives: [
      {
        id: 'ev_solar_snipers',
        title: 'Skywatch Takedown',
        description: 'Eliminate 20 Sniper or Storm Drones.',
        objectiveType: 'kills_sniper',
        targetValue: 20,
        rewardCoins: 350,
        rewardDiamonds: 2,
        icon: '🔭',
      },
      {
        id: 'ev_solar_augments',
        title: 'Solar Reactor',
        description: 'Install 5 Cyber-Chip Augments.',
        objectiveType: 'augments_installed',
        targetValue: 5,
        rewardCoins: 400,
        rewardDiamonds: 3,
        icon: '🔋',
      },
      {
        id: 'ev_solar_sectors',
        title: 'Orbital Sweep',
        description: 'Clear 4 combat sectors.',
        objectiveType: 'clear_sectors',
        targetValue: 4,
        rewardCoins: 500,
        rewardDiamonds: 3,
        icon: '🌟',
      },
    ],
  },
  {
    id: 'neon_aegis_overdrive',
    title: 'Prism Aegis Protocol',
    subtitle: 'Topple Goliath bosses and dominate waves to unlock Neon Aegis Celestial Flagship.',
    badgeIcon: '👑',
    accentColor: '#38bdf8',
    secondaryColor: '#facc15',
    rewardCraftId: 'aegis_celestial',
    objectives: [
      {
        id: 'ev_aegis_boss',
        title: 'Apex Challenger',
        description: 'Defeat 1 Goliath Apex Boss.',
        objectiveType: 'kills_boss',
        targetValue: 1,
        rewardCoins: 600,
        rewardDiamonds: 4,
        icon: '👑',
      },
      {
        id: 'ev_aegis_coins',
        title: 'Prism Vault',
        description: 'Collect 150 Cyber Coins in combat.',
        objectiveType: 'collect_coins',
        targetValue: 150,
        rewardCoins: 400,
        rewardDiamonds: 2,
        icon: '🪙',
      },
      {
        id: 'ev_aegis_kills',
        title: 'Protocol Purge',
        description: 'Eliminate 90 total hostiles.',
        objectiveType: 'kills_total',
        targetValue: 90,
        rewardCoins: 450,
        rewardDiamonds: 3,
        icon: '⚔️',
      },
    ],
  },
  {
    id: 'neon_astral_singularity',
    title: 'Astral Singularity Surge',
    subtitle: 'Master high-velocity combos & golden cores to claim Neon Astral Valkyrie Mk-IX.',
    badgeIcon: '✨',
    accentColor: '#7df9ff',
    secondaryColor: '#f472b6',
    rewardCraftId: 'astral_valkyrie',
    objectives: [
      {
        id: 'ev_astral_swarmers',
        title: 'Starlight Purge',
        description: 'Eliminate 50 Swarmer drones.',
        objectiveType: 'kills_swarmer',
        targetValue: 50,
        rewardCoins: 350,
        rewardDiamonds: 2,
        icon: '👾',
      },
      {
        id: 'ev_astral_cores',
        title: 'Core Harvester',
        description: 'Destroy 3 Golden Data-Cores.',
        objectiveType: 'golden_cores',
        targetValue: 3,
        rewardCoins: 500,
        rewardDiamonds: 4,
        icon: '💠',
      },
      {
        id: 'ev_astral_combo',
        title: 'Singularity Streak',
        description: 'Reach a 25x Combat Combo streak.',
        objectiveType: 'combo_streak',
        targetValue: 25,
        rewardCoins: 500,
        rewardDiamonds: 3,
        icon: '⚡',
      },
    ],
  },
  {
    id: 'neon_falcon_tempest',
    title: 'Cyber Falcon Velocity Strike',
    subtitle: 'Trigger Dash Overcharges & detonate tactical barrels to earn Neon Hyper-Falcon.',
    badgeIcon: '🦅',
    accentColor: '#2dd4bf',
    secondaryColor: '#38bdf8',
    rewardCraftId: 'cyber_falcon',
    objectives: [
      {
        id: 'ev_falcon_barrels',
        title: 'Powderkeg Blitz',
        description: 'Detonate 5 Tactical Plasma or Cryo Barrels.',
        objectiveType: 'barrels_detonated',
        targetValue: 5,
        rewardCoins: 350,
        rewardDiamonds: 3,
        icon: '🛢️',
      },
      {
        id: 'ev_falcon_dash',
        title: 'Phase Reflex',
        description: 'Trigger 4 Perfect-Dash Overcharges.',
        objectiveType: 'dash_overcharges',
        targetValue: 4,
        rewardCoins: 400,
        rewardDiamonds: 3,
        icon: '💨',
      },
      {
        id: 'ev_falcon_swarmers',
        title: 'Swarm Shredder',
        description: 'Eliminate 45 Swarmer drones.',
        objectiveType: 'kills_swarmer',
        targetValue: 45,
        rewardCoins: 350,
        rewardDiamonds: 2,
        icon: '⚡',
      },
    ],
  },
  {
    id: 'neon_nebula_eclipse',
    title: 'Nebula Void Harvest',
    subtitle: 'Smash armored walkers & crack Golden Cores to claim Neon Nebula Eclipse.',
    badgeIcon: '🌌',
    accentColor: '#e879f9',
    secondaryColor: '#38bdf8',
    rewardCraftId: 'nebula_harbinger',
    objectives: [
      {
        id: 'ev_nebula_coins',
        title: 'Cosmic Collector',
        description: 'Harvest 140 Cyber Coins in active combat.',
        objectiveType: 'collect_coins',
        targetValue: 140,
        rewardCoins: 420,
        rewardDiamonds: 3,
        icon: '🪙',
      },
      {
        id: 'ev_nebula_tanks',
        title: 'Walker Breaker',
        description: 'Destroy 14 Heavy Tanks or Behemoths.',
        objectiveType: 'kills_tank',
        targetValue: 14,
        rewardCoins: 450,
        rewardDiamonds: 3,
        icon: '🛡️',
      },
      {
        id: 'ev_nebula_cores',
        title: 'Golden Intercept',
        description: 'Destroy 2 Golden Data-Cores.',
        objectiveType: 'golden_cores',
        targetValue: 2,
        rewardCoins: 500,
        rewardDiamonds: 4,
        icon: '💠',
      },
    ],
  },
  {
    id: 'neon_zenith_sovereign',
    title: 'Zenith Sovereign Crucible',
    subtitle: 'Prove supreme mastery against Titan bosses to unlock Neon Sovereign Zenith.',
    badgeIcon: '⚜️',
    accentColor: '#fde047',
    secondaryColor: '#fb7185',
    rewardCraftId: 'zenith_emperor',
    objectives: [
      {
        id: 'ev_zenith_boss',
        title: 'Emperor Challenge',
        description: 'Defeat 2 Goliath Apex Bosses.',
        objectiveType: 'kills_boss',
        targetValue: 2,
        rewardCoins: 700,
        rewardDiamonds: 5,
        icon: '👑',
      },
      {
        id: 'ev_zenith_combo',
        title: 'Imperial Chain',
        description: 'Reach a 28x Combat Combo streak.',
        objectiveType: 'combo_streak',
        targetValue: 28,
        rewardCoins: 500,
        rewardDiamonds: 3,
        icon: '🔥',
      },
      {
        id: 'ev_zenith_augments',
        title: 'Neural Ascension',
        description: 'Install 6 Cyber-Chip Augments.',
        objectiveType: 'augments_installed',
        targetValue: 6,
        rewardCoins: 450,
        rewardDiamonds: 3,
        icon: '🧩',
      },
    ],
  },
  {
    id: 'neon_tempest_raptor',
    title: 'Stormbreaker Dogfight',
    subtitle: 'Dominate sniper drones & sectors with razor speed for Neon Crimson Tempest.',
    badgeIcon: '🛩️',
    accentColor: '#fb7185',
    secondaryColor: '#38bdf8',
    rewardCraftId: 'tempest_raptor',
    objectives: [
      {
        id: 'ev_raptor_snipers',
        title: 'Crosshair Hunter',
        description: 'Eliminate 18 Sniper or Storm Drones.',
        objectiveType: 'kills_sniper',
        targetValue: 18,
        rewardCoins: 400,
        rewardDiamonds: 3,
        icon: '🎯',
      },
      {
        id: 'ev_raptor_dash',
        title: 'Sonic Dodge',
        description: 'Trigger 5 Perfect-Dash Overcharges.',
        objectiveType: 'dash_overcharges',
        targetValue: 5,
        rewardCoins: 450,
        rewardDiamonds: 3,
        icon: '⚡',
      },
      {
        id: 'ev_raptor_sectors',
        title: 'Sector Blitz',
        description: 'Clear 4 combat sectors.',
        objectiveType: 'clear_sectors',
        targetValue: 4,
        rewardCoins: 550,
        rewardDiamonds: 4,
        icon: '🚀',
      },
    ],
  },
  {
    id: 'neon_seraph_nova',
    title: 'Celestial Seraph Ascension',
    subtitle: 'Full-spectrum endurance & demolition event to unlock Neon Prism Seraph.',
    badgeIcon: '🌟',
    accentColor: '#e0f2fe',
    secondaryColor: '#e879f9',
    rewardCraftId: 'seraph_nova',
    objectives: [
      {
        id: 'ev_seraph_kills',
        title: 'Starlight Crusade',
        description: 'Eliminate 100 hostiles across any battle mode.',
        objectiveType: 'kills_total',
        targetValue: 100,
        rewardCoins: 550,
        rewardDiamonds: 4,
        icon: '✨',
      },
      {
        id: 'ev_seraph_barrels',
        title: 'Nova Demolition',
        description: 'Detonate 6 Tactical Arena Barrels.',
        objectiveType: 'barrels_detonated',
        targetValue: 6,
        rewardCoins: 450,
        rewardDiamonds: 3,
        icon: '💥',
      },
      {
        id: 'ev_seraph_boss',
        title: 'Titan Purification',
        description: 'Defeat 1 Goliath Boss in Campaign, Endless, or Boss Rush.',
        objectiveType: 'kills_boss',
        targetValue: 1,
        rewardCoins: 650,
        rewardDiamonds: 5,
        icon: '👑',
      },
    ],
  },
];

export const BONUS_EVENT_CHALLENGES: Array<
  Omit<GlobalEventObjective, 'currentValue' | 'isCompleted' | 'isClaimed'>
> = [
  {
    id: 'bonus_ev_demolitionist',
    title: 'Arena Powderkeg',
    description: 'Detonate 8 Plasma or Cryo tactical barrels in combat.',
    objectiveType: 'barrels_detonated',
    targetValue: 8,
    rewardCoins: 450,
    rewardDiamonds: 5,
    icon: '🛢️',
  },
  {
    id: 'bonus_ev_phantom_dash',
    title: 'Overcharge Acrobat',
    description: 'Trigger 6 Perfect-Dash Overcharges near enemy fire.',
    objectiveType: 'dash_overcharges',
    targetValue: 6,
    rewardCoins: 500,
    rewardDiamonds: 6,
    icon: '💨',
  },
  {
    id: 'bonus_ev_treasure_fleet',
    title: 'Dhaka Coin Syndicate',
    description: 'Collect 250 Cyber Coins inside combat sectors.',
    objectiveType: 'collect_coins',
    targetValue: 250,
    rewardCoins: 650,
    rewardDiamonds: 6,
    icon: '🪙',
  },
  {
    id: 'bonus_ev_titan_hunter',
    title: 'Apex Leviathan Purge',
    description: 'Eliminate 120 hostiles across any battle mode.',
    objectiveType: 'kills_total',
    targetValue: 120,
    rewardCoins: 800,
    rewardDiamonds: 8,
    icon: '⚔️',
  },
];

export function formatCountdown48h(remainingMs: number): string {
  const safeMs = Math.max(0, Math.floor(remainingMs));
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export function getGlobalEventWindow(nowMs: number = Date.now()): GlobalEventWindowInfo {
  const cycleIndex = Math.floor((nowMs - GLOBAL_EVENT_EPOCH_MS) / GLOBAL_EVENT_DURATION_MS);
  const cycleStartMs = GLOBAL_EVENT_EPOCH_MS + cycleIndex * GLOBAL_EVENT_DURATION_MS;
  const cycleEndMs = cycleStartMs + GLOBAL_EVENT_DURATION_MS;
  const remainingMs = Math.max(0, cycleEndMs - nowMs);
  const len = GLOBAL_EVENT_ROTATION.length;
  const rotIdx = ((cycleIndex % len) + len) % len;
  const eventDef = GLOBAL_EVENT_ROTATION[rotIdx];

  return {
    cycleIndex,
    cycleStartMs,
    cycleEndMs,
    remainingMs,
    durationMs: GLOBAL_EVENT_DURATION_MS,
    formattedCountdown: formatCountdown48h(remainingMs),
    eventDef,
  };
}

export function buildObjectivesForEvent(def: GlobalEventDef): GlobalEventObjective[] {
  return def.objectives.map((o) => ({
    ...o,
    currentValue: 0,
    isCompleted: false,
    isClaimed: false,
  }));
}

export function buildBonusEventChallenges(): GlobalEventObjective[] {
  return BONUS_EVENT_CHALLENGES.map((o) => ({
    ...o,
    currentValue: 0,
    isCompleted: false,
    isClaimed: false,
  }));
}

export function normalizeBonusEventChallenges(
  existing?: GlobalEventObjective[]
): GlobalEventObjective[] {
  const byId = new Map((existing || []).map((o) => [o.id, o]));
  return BONUS_EVENT_CHALLENGES.map((def) => {
    const saved = byId.get(def.id);
    if (!saved) {
      return {
        ...def,
        currentValue: 0,
        isCompleted: false,
        isClaimed: false,
      };
    }
    const currentValue = Math.min(def.targetValue, Math.max(0, saved.currentValue || 0));
    const isCompleted = Boolean(saved.isCompleted || currentValue >= def.targetValue);
    return {
      ...def,
      currentValue,
      isCompleted,
      isClaimed: Boolean(saved.isClaimed),
    };
  });
}

export function createInitialGlobalEventState(nowMs: number = Date.now()): GlobalEventState {
  const win = getGlobalEventWindow(nowMs);
  return {
    cycleIndex: win.cycleIndex,
    eventId: win.eventDef.id,
    objectives: buildObjectivesForEvent(win.eventDef),
    skinClaimed: false,
    unlockedNeonSkins: {},
    equippedSkins: {},
    bonusChallenges: buildBonusEventChallenges(),
  };
}

export function syncStateWithClock(
  state: GlobalEventState,
  nowMs: number = Date.now()
): { nextState: GlobalEventState; rotated: boolean } {
  const win = getGlobalEventWindow(nowMs);
  const normalizedBonus = normalizeBonusEventChallenges(state.bonusChallenges);
  if (state.cycleIndex === win.cycleIndex && state.eventId === win.eventDef.id) {
    if (!state.bonusChallenges || state.bonusChallenges.length !== normalizedBonus.length) {
      return {
        nextState: { ...state, bonusChallenges: normalizedBonus },
        rotated: false,
      };
    }
    return { nextState: state, rotated: false };
  }
  return {
    rotated: true,
    nextState: {
      cycleIndex: win.cycleIndex,
      eventId: win.eventDef.id,
      objectives: buildObjectivesForEvent(win.eventDef),
      skinClaimed: false,
      unlockedNeonSkins: { ...state.unlockedNeonSkins },
      equippedSkins: { ...state.equippedSkins },
      bonusChallenges: normalizedBonus,
    },
  };
}

export function areAllEventObjectivesComplete(state: GlobalEventState): boolean {
  return state.objectives.length > 0 && state.objectives.every((o) => o.isCompleted);
}

export function applyGlobalEventProgress(
  state: GlobalEventState,
  type: GlobalEventObjectiveType,
  value: number = 1,
  nowMs: number = Date.now()
): { nextState: GlobalEventState; changed: boolean; newlyCompleted: GlobalEventObjective[] } {
  const { nextState: synced, rotated } = syncStateWithClock(state, nowMs);
  let changed = rotated;
  const newlyCompleted: GlobalEventObjective[] = [];

  const updatedObjectives = synced.objectives.map((obj) => {
    if (obj.objectiveType !== type || obj.isCompleted) return obj;

    // Combo streak represents a peak value rather than cumulative additions
    const nextVal =
      type === 'combo_streak'
        ? Math.min(obj.targetValue, Math.max(obj.currentValue, value))
        : Math.min(obj.targetValue, obj.currentValue + value);

    if (nextVal === obj.currentValue) return obj;

    changed = true;
    const isCompleted = nextVal >= obj.targetValue;
    const nextObj: GlobalEventObjective = {
      ...obj,
      currentValue: nextVal,
      isCompleted,
    };
    if (isCompleted) {
      newlyCompleted.push(nextObj);
    }
    return nextObj;
  });

  const updatedBonus = (synced.bonusChallenges || buildBonusEventChallenges()).map((obj) => {
    if (obj.objectiveType !== type || obj.isCompleted) return obj;
    const nextVal =
      type === 'combo_streak'
        ? Math.min(obj.targetValue, Math.max(obj.currentValue, value))
        : Math.min(obj.targetValue, obj.currentValue + value);
    if (nextVal === obj.currentValue) return obj;
    changed = true;
    const isCompleted = nextVal >= obj.targetValue;
    const nextObj: GlobalEventObjective = {
      ...obj,
      currentValue: nextVal,
      isCompleted,
    };
    if (isCompleted) {
      newlyCompleted.push(nextObj);
    }
    return nextObj;
  });

  if (!changed) {
    return { nextState: synced, changed: false, newlyCompleted: [] };
  }

  return {
    changed: true,
    newlyCompleted,
    nextState: {
      ...synced,
      objectives: updatedObjectives,
      bonusChallenges: updatedBonus,
    },
  };
}

export function claimGlobalEventObjectiveState(
  state: GlobalEventState,
  objectiveId: string,
  nowMs: number = Date.now()
): {
  success: boolean;
  rewardCoins: number;
  rewardDiamonds: number;
  nextState: GlobalEventState;
} {
  const { nextState: synced } = syncStateWithClock(state, nowMs);
  let rewardCoins = 0;
  let rewardDiamonds = 0;
  let success = false;

  const updatedObjectives = synced.objectives.map((obj) => {
    if (obj.id === objectiveId && obj.isCompleted && !obj.isClaimed) {
      rewardCoins = obj.rewardCoins;
      rewardDiamonds = obj.rewardDiamonds;
      success = true;
      return { ...obj, isClaimed: true };
    }
    return obj;
  });

  if (!success) {
    return { success: false, rewardCoins: 0, rewardDiamonds: 0, nextState: synced };
  }

  return {
    success: true,
    rewardCoins,
    rewardDiamonds,
    nextState: {
      ...synced,
      objectives: updatedObjectives,
    },
  };
}

export function claimBonusEventChallengeState(
  state: GlobalEventState,
  challengeId: string,
  nowMs: number = Date.now()
): {
  success: boolean;
  rewardCoins: number;
  rewardDiamonds: number;
  nextState: GlobalEventState;
} {
  const { nextState: synced } = syncStateWithClock(state, nowMs);
  let rewardCoins = 0;
  let rewardDiamonds = 0;
  let success = false;

  const updatedBonus = (synced.bonusChallenges || buildBonusEventChallenges()).map((obj) => {
    if (obj.id === challengeId && obj.isCompleted && !obj.isClaimed) {
      rewardCoins = obj.rewardCoins;
      rewardDiamonds = obj.rewardDiamonds;
      success = true;
      return { ...obj, isClaimed: true };
    }
    return obj;
  });

  if (!success) {
    return { success: false, rewardCoins: 0, rewardDiamonds: 0, nextState: synced };
  }

  return {
    success: true,
    rewardCoins,
    rewardDiamonds,
    nextState: {
      ...synced,
      bonusChallenges: updatedBonus,
    },
  };
}

export function claimGlobalEventNeonSkinState(
  state: GlobalEventState,
  nowMs: number = Date.now()
): {
  success: boolean;
  craftId: CraftId;
  alreadyOwnedSkin: boolean;
  bonusDiamonds: number;
  nextState: GlobalEventState;
  error?: string;
} {
  const win = getGlobalEventWindow(nowMs);
  const { nextState: synced } = syncStateWithClock(state, nowMs);
  const craftId = win.eventDef.rewardCraftId;

  if (!areAllEventObjectivesComplete(synced)) {
    return {
      success: false,
      craftId,
      alreadyOwnedSkin: false,
      bonusDiamonds: 0,
      nextState: synced,
      error: 'Complete all 3 special event objectives first to forge the Neon Skin.',
    };
  }

  if (synced.skinClaimed) {
    return {
      success: false,
      craftId,
      alreadyOwnedSkin: true,
      bonusDiamonds: 0,
      nextState: synced,
      error: 'Neon Skin milestone already claimed for this 48h cycle.',
    };
  }

  const alreadyOwnedSkin = Boolean(synced.unlockedNeonSkins[craftId]);
  const bonusDiamonds = alreadyOwnedSkin ? 10 : 3;

  return {
    success: true,
    craftId,
    alreadyOwnedSkin,
    bonusDiamonds,
    nextState: {
      ...synced,
      skinClaimed: true,
      unlockedNeonSkins: {
        ...synced.unlockedNeonSkins,
        [craftId]: true,
      },
      equippedSkins: {
        ...synced.equippedSkins,
        [craftId]: 'neon', // Auto-equip freshly forged Neon Skin!
      },
    },
  };
}

export function equipCraftSkinState(
  state: GlobalEventState,
  craftId: CraftId,
  skinId: CraftSkinId
): { success: boolean; nextState: GlobalEventState; error?: string } {
  if (skinId === 'neon' && !state.unlockedNeonSkins[craftId]) {
    return {
      success: false,
      nextState: state,
      error: 'Unlock this Neon Skin via a 48h Global Event before equipping.',
    };
  }
  return {
    success: true,
    nextState: {
      ...state,
      equippedSkins: {
        ...state.equippedSkins,
        [craftId]: skinId,
      },
    },
  };
}

export function getUnclaimedGlobalEventRewardsCount(
  state: GlobalEventState,
  nowMs: number = Date.now()
): number {
  const { nextState: synced } = syncStateWithClock(state, nowMs);
  const objCount = synced.objectives.filter((o) => o.isCompleted && !o.isClaimed).length;
  const bonusCount = (synced.bonusChallenges || []).filter((o) => o.isCompleted && !o.isClaimed).length;
  const skinReady = areAllEventObjectivesComplete(synced) && !synced.skinClaimed ? 1 : 0;
  return objCount + bonusCount + skinReady;
}

// ============================================================================
// BROWSER PERSISTENCE HELPERS
// ============================================================================

let cachedEventRaw: string | null = null;
let cachedEventState: GlobalEventState | null = null;

function cloneGlobalEventState(state: GlobalEventState): GlobalEventState {
  return {
    ...state,
    objectives: state.objectives.map((o) => ({ ...o })),
    bonusChallenges: (state.bonusChallenges || []).map((o) => ({ ...o })),
    unlockedNeonSkins: { ...state.unlockedNeonSkins },
    equippedSkins: { ...state.equippedSkins },
  };
}

export function loadGlobalEventState(nowMs: number = Date.now()): GlobalEventState {
  const defaults = createInitialGlobalEventState(nowMs);
  if (typeof window === 'undefined') return defaults;

  try {
    const raw = localStorage.getItem(GLOBAL_EVENT_STORAGE_KEY);
    if (!raw) {
      saveGlobalEventState(defaults);
      return defaults;
    }

    if (cachedEventRaw === raw && cachedEventState) {
      const { nextState, rotated } = syncStateWithClock(cloneGlobalEventState(cachedEventState), nowMs);
      if (rotated) saveGlobalEventState(nextState);
      return nextState;
    }

    const parsed = JSON.parse(raw) as Partial<GlobalEventState>;
    const hydrated: GlobalEventState = {
      cycleIndex: typeof parsed.cycleIndex === 'number' ? parsed.cycleIndex : defaults.cycleIndex,
      eventId: typeof parsed.eventId === 'string' ? parsed.eventId : defaults.eventId,
      objectives: Array.isArray(parsed.objectives) ? parsed.objectives : defaults.objectives,
      skinClaimed: Boolean(parsed.skinClaimed),
      unlockedNeonSkins: parsed.unlockedNeonSkins || {},
      equippedSkins: parsed.equippedSkins || {},
    };

    hydrated.bonusChallenges = normalizeBonusEventChallenges(parsed.bonusChallenges);
    const { nextState, rotated } = syncStateWithClock(hydrated, nowMs);
    if (rotated) {
      saveGlobalEventState(nextState);
    } else {
      cachedEventRaw = raw;
      cachedEventState = cloneGlobalEventState(nextState);
    }
    return nextState;
  } catch {
    return defaults;
  }
}

export function saveGlobalEventState(state: GlobalEventState): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(GLOBAL_EVENT_STORAGE_KEY, serialized);
    cachedEventRaw = serialized;
    cachedEventState = cloneGlobalEventState(state);
  } catch {
    // ignore
  }
}

export function recordGlobalEventProgress(
  type: GlobalEventObjectiveType,
  value: number = 1,
  nowMs: number = Date.now()
): { updatedState: GlobalEventState; newlyCompleted: GlobalEventObjective[] } {
  const cur = loadGlobalEventState(nowMs);
  const res = applyGlobalEventProgress(cur, type, value, nowMs);
  if (res.changed) {
    saveGlobalEventState(res.nextState);
  }
  return { updatedState: res.nextState, newlyCompleted: res.newlyCompleted };
}

export function claimGlobalEventObjective(
  objectiveId: string,
  nowMs: number = Date.now()
): {
  success: boolean;
  rewardCoins: number;
  rewardDiamonds: number;
  updatedState: GlobalEventState;
} {
  const cur = loadGlobalEventState(nowMs);
  const res = claimGlobalEventObjectiveState(cur, objectiveId, nowMs);
  if (res.success) {
    saveGlobalEventState(res.nextState);
    if (typeof window !== 'undefined' && res.rewardCoins > 0) {
      const curCoins = parseInt(localStorage.getItem('nabilbot_coins') || '500', 10);
      localStorage.setItem('nabilbot_coins', String(curCoins + res.rewardCoins));
    }
    if (res.rewardDiamonds > 0) {
      addDiamonds(res.rewardDiamonds);
    }
  }
  return {
    success: res.success,
    rewardCoins: res.rewardCoins,
    rewardDiamonds: res.rewardDiamonds,
    updatedState: res.nextState,
  };
}

export function claimBonusEventChallenge(
  challengeId: string,
  nowMs: number = Date.now()
): {
  success: boolean;
  rewardCoins: number;
  rewardDiamonds: number;
  updatedState: GlobalEventState;
} {
  const cur = loadGlobalEventState(nowMs);
  const res = claimBonusEventChallengeState(cur, challengeId, nowMs);
  if (res.success) {
    saveGlobalEventState(res.nextState);
    if (typeof window !== 'undefined' && res.rewardCoins > 0) {
      const curCoins = parseInt(localStorage.getItem('nabilbot_coins') || '500', 10);
      localStorage.setItem('nabilbot_coins', String(curCoins + res.rewardCoins));
    }
    if (res.rewardDiamonds > 0) {
      addDiamonds(res.rewardDiamonds);
    }
  }
  return {
    success: res.success,
    rewardCoins: res.rewardCoins,
    rewardDiamonds: res.rewardDiamonds,
    updatedState: res.nextState,
  };
}

export function claimGlobalEventNeonSkin(nowMs: number = Date.now()): {
  success: boolean;
  craftId: CraftId;
  alreadyOwnedSkin: boolean;
  bonusDiamonds: number;
  updatedState: GlobalEventState;
  error?: string;
} {
  const cur = loadGlobalEventState(nowMs);
  const res = claimGlobalEventNeonSkinState(cur, nowMs);
  if (res.success) {
    saveGlobalEventState(res.nextState);
    if (res.bonusDiamonds > 0) {
      addDiamonds(res.bonusDiamonds);
    }
  }
  return {
    success: res.success,
    craftId: res.craftId,
    alreadyOwnedSkin: res.alreadyOwnedSkin,
    bonusDiamonds: res.bonusDiamonds,
    updatedState: res.nextState,
    error: res.error,
  };
}

export function equipCraftSkin(craftId: CraftId, skinId: CraftSkinId): {
  success: boolean;
  updatedState: GlobalEventState;
  error?: string;
} {
  const cur = loadGlobalEventState();
  const res = equipCraftSkinState(cur, craftId, skinId);
  if (res.success) {
    saveGlobalEventState(res.nextState);
  }
  return {
    success: res.success,
    updatedState: res.nextState,
    error: res.error,
  };
}

export function isNeonSkinUnlocked(craftId: CraftId, state?: GlobalEventState): boolean {
  const s = state || loadGlobalEventState();
  return Boolean(s.unlockedNeonSkins[craftId]);
}

export function getActiveCraftSkin(craftId: CraftId, state?: GlobalEventState): CraftSkinId {
  const s = state || loadGlobalEventState();
  if (s.equippedSkins[craftId] === 'neon' && s.unlockedNeonSkins[craftId]) {
    return 'neon';
  }
  return 'default';
}
