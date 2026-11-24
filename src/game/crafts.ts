import { CraftDef, CraftId } from './types';

export const CRAFTS: Record<CraftId, CraftDef> = {
  vanguard_alpha: {
    id: 'vanguard_alpha',
    name: 'Vanguard Alpha Mk-IV',
    callsign: 'VG-ALPHA',
    model: 'VG-ALPHA',
    role: 'Balanced Autonomous Interceptor',
    price: 0, // Starter craft (Free)
    tier: 'starter',
    hullColor: '#00f3ff', // Neon Cyan
    accentColor: '#0088ff',
    glowColor: 'rgba(0, 243, 255, 0.4)',
    thrusterColor: '#00f3ff',
    primaryColor: '#00f3ff',
    engineColor: '#00f3ff',
    speedMultiplier: 1.0,
    shieldBonus: 0,
    damageMultiplier: 1.0,
    fireRateMultiplier: 1.0,
    dashCooldownMultiplier: 1.0,
    magnetRadiusBonus: 0,
    statModifiers: {
      speedBonus: 0,
      maxShieldBonus: 0,
      shieldRechargeBonus: 0,
      damageMultiplier: 1.0,
      fireRateMultiplier: 1.0,
      dashCooldownReduction: 0,
      magnetRadiusBonus: 0,
    },
    description:
      'Standard Bangladesh Armed Cyber Corps all-round tactical flyer with balanced speed, baseline shield, and responsive thrusters.',
    perkDescription: 'Standard issue flight chassis. Balanced handling with zero energy penalties.',
  },
  cyber_falcon: {
    id: 'cyber_falcon',
    name: 'Cyber Falcon-X2',
    callsign: 'CF-FALCON',
    model: 'CF-FALCON',
    role: 'Rapid Strike Recon Flyer',
    price: 1400,
    diamondCost: 60,
    tier: 'interceptor',
    hullColor: '#2dd4bf', // Hyper Teal
    accentColor: '#38bdf8',
    glowColor: 'rgba(45, 212, 191, 0.4)',
    thrusterColor: '#38bdf8',
    primaryColor: '#2dd4bf',
    engineColor: '#38bdf8',
    speedMultiplier: 1.18,
    shieldBonus: 30,
    damageMultiplier: 1.08,
    fireRateMultiplier: 1.15,
    dashCooldownMultiplier: 0.80,
    magnetRadiusBonus: 45,
    statModifiers: {
      speedBonus: 0.18,
      maxShieldBonus: 30,
      shieldRechargeBonus: 12,
      damageMultiplier: 1.08,
      fireRateMultiplier: 1.15,
      dashCooldownReduction: 0.20,
      magnetRadiusBonus: 45,
    },
    description:
      'Affordable twin-fin tactical striker built for rapid flanking, +15% fire rate, and crisp -20% dash cooldown.',
    perkDescription: '+18% Speed, +15% Fire Rate, -20% Dash Cooldown, +30 Max Shield.',
  },
  phantom_shadow: {
    id: 'phantom_shadow',
    name: 'Phantom Shadow-Wing',
    callsign: 'PH-SHADOW',
    model: 'PH-SHADOW',
    role: 'Hyper-Agility Stealth Interceptor',
    price: 1900,
    diamondCost: 80,
    tier: 'interceptor',
    hullColor: '#a855f7', // Neon Violet
    accentColor: '#ff0077',
    glowColor: 'rgba(168, 85, 247, 0.4)',
    thrusterColor: '#ff0077',
    primaryColor: '#a855f7',
    engineColor: '#ff0077',
    speedMultiplier: 1.25,
    shieldBonus: 20,
    damageMultiplier: 1.10,
    fireRateMultiplier: 1.05,
    dashCooldownMultiplier: 0.625,
    magnetRadiusBonus: 50,
    statModifiers: {
      speedBonus: 0.25, // +25% Speed
      maxShieldBonus: 20,
      shieldRechargeBonus: 10,
      damageMultiplier: 1.10, // +10% Damage
      fireRateMultiplier: 1.05,
      dashCooldownReduction: 0.3, // -30% Dash CD (1.5s -> 1.05s)
      magnetRadiusBonus: 50,
    },
    description:
      'Aerodynamic delta-wing stealth craft with phase-dampening micro-thrusters and hyper-rapid kinetic dash.',
    perkDescription: '+25% Flight Speed, -30% Dash Cooldown (1.05s), +10% Weapon Damage.',
  },
  titan_dread: {
    id: 'titan_dread',
    name: 'Titan Dreadnought Cruiser',
    callsign: 'TT-DREAD',
    model: 'TT-DREAD',
    role: 'Heavy Armored Flying Citadel',
    price: 3000,
    diamondCost: 120,
    tier: 'heavy',
    hullColor: '#ffaa00', // Amber Gold
    accentColor: '#ff4400',
    glowColor: 'rgba(255, 170, 0, 0.4)',
    thrusterColor: '#ff5500',
    primaryColor: '#ffaa00',
    engineColor: '#ff5500',
    speedMultiplier: 0.95,
    shieldBonus: 100,
    damageMultiplier: 1.15,
    fireRateMultiplier: 1.0,
    dashCooldownMultiplier: 1.0,
    magnetRadiusBonus: 120,
    statModifiers: {
      speedBonus: -0.05, // Slightly heavier
      maxShieldBonus: 100, // +100 Shield (300 Shield total!)
      shieldRechargeBonus: 25,
      damageMultiplier: 1.15,
      fireRateMultiplier: 1.0,
      dashCooldownReduction: 0,
      magnetRadiusBonus: 120, // Huge coin attractor!
    },
    description:
      'Colossal flying bastion with reinforced dual armor plating, +100 max shield, and high-capacity magnetic scrap collector.',
    perkDescription: '+100 Max Shield (300 Total), +25/s Fast Recharge, Massive Coin Magnet (+120px).',
  },
  solar_phoenix: {
    id: 'solar_phoenix',
    name: 'Solar Phoenix Raider',
    callsign: 'PX-SOLAR',
    model: 'PX-SOLAR',
    role: 'Overcharged Solar Energy Raider',
    price: 4800,
    diamondCost: 175,
    tier: 'solar',
    hullColor: '#10b981', // Emerald Green
    accentColor: '#ffd700',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    thrusterColor: '#ffd700',
    primaryColor: '#10b981',
    engineColor: '#ffd700',
    speedMultiplier: 1.15,
    shieldBonus: 60,
    damageMultiplier: 1.25,
    fireRateMultiplier: 1.25,
    dashCooldownMultiplier: 0.81,
    magnetRadiusBonus: 80,
    statModifiers: {
      speedBonus: 0.15,
      maxShieldBonus: 60,
      shieldRechargeBonus: 15,
      damageMultiplier: 1.25, // +25% Damage
      fireRateMultiplier: 1.25, // +25% Fire Rate!
      dashCooldownReduction: 0.15,
      magnetRadiusBonus: 80,
    },
    description:
      'Forged in the Rajshahi Cartoon Biosphere. Harnesses ambient solar particles to supercharge cyclic weapon fire rates.',
    perkDescription: '+25% Cyclic Fire Rate, +25% Weapon Damage, Radiant Solar Trail.',
  },
  nebula_harbinger: {
    id: 'nebula_harbinger',
    name: 'Nebula Harbinger MK-V',
    callsign: 'NB-HARBINGER',
    model: 'NB-HARBINGER',
    role: 'Deep-Space Harvester Cruiser',
    price: 6000,
    diamondCost: 215,
    tier: 'solar',
    hullColor: '#c084fc', // Nebula Violet
    accentColor: '#f472b6',
    glowColor: 'rgba(192, 132, 252, 0.45)',
    thrusterColor: '#f472b6',
    primaryColor: '#c084fc',
    engineColor: '#f472b6',
    speedMultiplier: 1.18,
    shieldBonus: 120,
    damageMultiplier: 1.35,
    fireRateMultiplier: 1.18,
    dashCooldownMultiplier: 0.72,
    magnetRadiusBonus: 200,
    statModifiers: {
      speedBonus: 0.18,
      maxShieldBonus: 120,
      shieldRechargeBonus: 22,
      damageMultiplier: 1.35,
      fireRateMultiplier: 1.18,
      dashCooldownReduction: 0.28,
      magnetRadiusBonus: 200,
    },
    description:
      'Void-forged sweep cruiser equipped with a colossal +200px coin magnet array, 270 Max Shield, and +35% amplified firepower.',
    perkDescription: '+200px Coin Magnet, +120 Shield, +35% Damage, -28% Dash Cooldown.',
  },
  aegis_celestial: {
    id: 'aegis_celestial',
    name: 'Aegis Celestial Flagship',
    callsign: 'AG-CELESTIAL',
    model: 'AG-CELESTIAL',
    role: 'God-Tier Supreme Aerial Dominator',
    price: 8000,
    diamondCost: 265,
    tier: 'godtier',
    hullColor: '#f43f5e', // Crimson Rose
    accentColor: '#00f3ff', // Radiant Cyan
    glowColor: 'rgba(244, 63, 94, 0.5)',
    thrusterColor: '#00ffff',
    primaryColor: '#f43f5e',
    engineColor: '#00ffff',
    speedMultiplier: 1.20,
    shieldBonus: 150,
    damageMultiplier: 1.50,
    fireRateMultiplier: 1.20,
    dashCooldownMultiplier: 0.56,
    magnetRadiusBonus: 160,
    statModifiers: {
      speedBonus: 0.20,
      maxShieldBonus: 150, // 350 Total Shield!
      shieldRechargeBonus: 30,
      damageMultiplier: 1.50, // +50% Weapon Damage!
      fireRateMultiplier: 1.20,
      dashCooldownReduction: 0.35,
      magnetRadiusBonus: 160,
    },
    description:
      'The absolute pinnacle of Bangladesh 2077 aerospace engineering. Triple particle wings, +150 max shield, and +50% weapon damage amplification.',
    perkDescription: '+50% All Weapon Damage, +150 Max Shield (350 Total), Triple Particle Thrusters.',
  },
  astral_valkyrie: {
    id: 'astral_valkyrie',
    name: 'Astral Valkyrie Mk-IX',
    callsign: 'VK-ASTRAL',
    model: 'VK-ASTRAL',
    role: 'Celestial Diamond Flagship',
    price: 0,
    diamondCost: 240, // 240 Cyber Diamonds
    tier: 'godtier',
    hullColor: '#38bdf8', // Diamond Cyan
    accentColor: '#c084fc', // Celestial Lavender
    glowColor: 'rgba(56, 189, 248, 0.5)',
    thrusterColor: '#38bdf8',
    primaryColor: '#38bdf8',
    engineColor: '#c084fc',
    speedMultiplier: 1.35,
    shieldBonus: 200,
    damageMultiplier: 1.40,
    fireRateMultiplier: 1.25,
    dashCooldownMultiplier: 0.50,
    magnetRadiusBonus: 180,
    statModifiers: {
      speedBonus: 0.35,
      maxShieldBonus: 200, // 400 Total Shield!
      shieldRechargeBonus: 35,
      damageMultiplier: 1.40,
      fireRateMultiplier: 1.25,
      dashCooldownReduction: 0.40,
      magnetRadiusBonus: 180,
    },
    description:
      'The sacred celestial starship constructed with Sylhet highland diamond lattices. Unlocks 400 Max Shield, -40% Dash Cooldown (0.90s), and massive 180px coin attraction.',
    perkDescription: '+200 Max Shield (400 Total), +35% Flight Speed, -40% Dash Cooldown (0.90s), +40% Damage.',
  },
  zenith_emperor: {
    id: 'zenith_emperor',
    name: 'Zenith Emperor Omega',
    callsign: 'ZN-EMPEROR',
    model: 'ZN-EMPEROR',
    role: 'Supreme Diamond Warship',
    price: 0,
    diamondCost: 320,
    tier: 'godtier',
    hullColor: '#facc15', // Imperial Sun Gold
    accentColor: '#f43f5e', // Apex Crimson
    glowColor: 'rgba(250, 204, 21, 0.55)',
    thrusterColor: '#fde047',
    primaryColor: '#facc15',
    engineColor: '#f43f5e',
    speedMultiplier: 1.30,
    shieldBonus: 260,
    damageMultiplier: 1.60,
    fireRateMultiplier: 1.30,
    dashCooldownMultiplier: 0.55,
    magnetRadiusBonus: 220,
    statModifiers: {
      speedBonus: 0.30,
      maxShieldBonus: 260, // 410+ Total Shield!
      shieldRechargeBonus: 40,
      damageMultiplier: 1.60, // +60% Damage!
      fireRateMultiplier: 1.30,
      dashCooldownReduction: 0.45,
      magnetRadiusBonus: 220,
    },
    description:
      'The pinnacle Diamond Vault sovereign warship. Commands +60% weapon damage, +260 Max Shield, +30% fire rate, and a 220px golden harvest halo.',
    perkDescription: '+60% Weapon Damage, +260 Max Shield, +30% Fire Rate, -45% Dash CD.',
  },
  tempest_raptor: {
    id: 'tempest_raptor',
    name: 'Tempest Raptor-S7',
    callsign: 'TP-RAPTOR',
    model: 'TP-RAPTOR',
    role: 'Blitzkrieg Twin-Blade Interceptor',
    price: 3800,
    diamondCost: 145,
    tier: 'interceptor',
    hullColor: '#fb7185', // Rose Crimson
    accentColor: '#38bdf8', // Azure Steel
    glowColor: 'rgba(251, 113, 133, 0.45)',
    thrusterColor: '#38bdf8',
    primaryColor: '#fb7185',
    engineColor: '#38bdf8',
    speedMultiplier: 1.28,
    shieldBonus: 45,
    damageMultiplier: 1.18,
    fireRateMultiplier: 1.18,
    dashCooldownMultiplier: 0.68,
    magnetRadiusBonus: 95,
    statModifiers: {
      speedBonus: 0.28,
      maxShieldBonus: 45,
      shieldRechargeBonus: 18,
      damageMultiplier: 1.18,
      fireRateMultiplier: 1.18,
      dashCooldownReduction: 0.32,
      magnetRadiusBonus: 95,
    },
    description:
      'High-speed twin-blade intercept fighter built for relentless dogfighting, combining +28% velocity with -32% dash cooldown.',
    perkDescription: '+28% Speed, +18% Damage & Fire Rate, -32% Dash CD, +45 Shield.',
  },
  seraph_nova: {
    id: 'seraph_nova',
    name: 'Seraph Nova Prime',
    callsign: 'SR-NOVA',
    model: 'SR-NOVA',
    role: 'Diamond Arch-Prism Cruiser',
    price: 0,
    diamondCost: 380,
    tier: 'godtier',
    hullColor: '#e0f2fe', // Astral Platinum-Cyan
    accentColor: '#e879f9', // Hyper Orchid
    glowColor: 'rgba(224, 242, 254, 0.55)',
    thrusterColor: '#38bdf8',
    primaryColor: '#e0f2fe',
    engineColor: '#e879f9',
    speedMultiplier: 1.34,
    shieldBonus: 300,
    damageMultiplier: 1.55,
    fireRateMultiplier: 1.28,
    dashCooldownMultiplier: 0.58,
    magnetRadiusBonus: 240,
    statModifiers: {
      speedBonus: 0.34,
      maxShieldBonus: 300,
      shieldRechargeBonus: 45,
      damageMultiplier: 1.55,
      fireRateMultiplier: 1.28,
      dashCooldownReduction: 0.42,
      magnetRadiusBonus: 240,
    },
    description:
      'Flagship Diamond Vault arch-cruiser wielding crystal prism wings, +300 Max Shield, +55% weapon damage, and a vast 240px harvest field.',
    perkDescription: '+300 Max Shield, +55% Damage, +34% Speed, +28% Fire Rate, -42% Dash CD.',
  },
  mirage_viper: {
    id: 'mirage_viper',
    name: 'Mirage Viper-X9',
    callsign: 'MV-VIPER',
    model: 'MV-VIPER',
    role: 'Razor Twin-Needle Interceptor',
    price: 2450,
    diamondCost: 96,
    tier: 'interceptor',
    hullColor: '#f59e0b', // Desert Mirage Gold
    accentColor: '#38bdf8',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    thrusterColor: '#fbbf24',
    primaryColor: '#f59e0b',
    engineColor: '#fbbf24',
    speedMultiplier: 1.24,
    shieldBonus: 35,
    damageMultiplier: 1.12,
    fireRateMultiplier: 1.22,
    dashCooldownMultiplier: 0.74,
    magnetRadiusBonus: 70,
    statModifiers: {
      speedBonus: 0.24,
      maxShieldBonus: 35,
      shieldRechargeBonus: 16,
      damageMultiplier: 1.12,
      fireRateMultiplier: 1.22,
      dashCooldownReduction: 0.26,
      magnetRadiusBonus: 70,
    },
    description:
      'Twin-lance desert interceptor tuned for blistering fire rate (+22%) and razor-sharp +24% evasion speed.',
    perkDescription: '+24% Speed, +22% Fire Rate, -26% Dash CD, +12% Damage.',
  },
  colossus_bastion: {
    id: 'colossus_bastion',
    name: 'Colossus Bastion Mk-VIII',
    callsign: 'CB-BASTION',
    model: 'CB-BASTION',
    role: 'Ultra-Heavy Armored Warship',
    price: 4600,
    diamondCost: 170,
    tier: 'heavy',
    hullColor: '#38bdf8', // Cobalt Bastion
    accentColor: '#fbbf24',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    thrusterColor: '#60a5fa',
    primaryColor: '#38bdf8',
    engineColor: '#60a5fa',
    speedMultiplier: 0.96,
    shieldBonus: 180,
    damageMultiplier: 1.28,
    fireRateMultiplier: 1.08,
    dashCooldownMultiplier: 0.90,
    magnetRadiusBonus: 150,
    statModifiers: {
      speedBonus: -0.04,
      maxShieldBonus: 180,
      shieldRechargeBonus: 32,
      damageMultiplier: 1.28,
      fireRateMultiplier: 1.08,
      dashCooldownReduction: 0.10,
      magnetRadiusBonus: 150,
    },
    description:
      'Hexagonal siege fortress bearing +180 Max Shield, rapid +32/s shield regeneration, +28% heavy weapon impact, and a 150px magnet.',
    perkDescription: '+180 Max Shield, +32/s Regen, +28% Damage, +150px Magnet.',
  },
  frost_valkyrie: {
    id: 'frost_valkyrie',
    name: 'Cryo Valkyrie S4',
    callsign: 'CV-FROST',
    model: 'CV-FROST',
    role: 'Glacial Overclock Raider',
    price: 5400,
    diamondCost: 200,
    tier: 'solar',
    hullColor: '#67e8f9', // Sub-Zero Ice
    accentColor: '#818cf8',
    glowColor: 'rgba(103, 232, 249, 0.45)',
    thrusterColor: '#a5f3fc',
    primaryColor: '#67e8f9',
    engineColor: '#a5f3fc',
    speedMultiplier: 1.20,
    shieldBonus: 110,
    damageMultiplier: 1.30,
    fireRateMultiplier: 1.28,
    dashCooldownMultiplier: 0.75,
    magnetRadiusBonus: 130,
    statModifiers: {
      speedBonus: 0.20,
      maxShieldBonus: 110,
      shieldRechargeBonus: 24,
      damageMultiplier: 1.30,
      fireRateMultiplier: 1.28,
      dashCooldownReduction: 0.25,
      magnetRadiusBonus: 130,
    },
    description:
      'Sub-zero thermal-cooled frame from Rangpur Cryo Labs pushing +28% fire rate, +30% damage, and glacial deflector shields.',
    perkDescription: '+28% Fire Rate, +30% Damage, +110 Shield, +20% Speed.',
  },
  eclipse_phantom: {
    id: 'eclipse_phantom',
    name: 'Eclipse Wraith Alpha',
    callsign: 'EW-ALPHA',
    model: 'EW-ALPHA',
    role: 'Apex Coin & Diamond Flagship',
    price: 9600,
    diamondCost: 310,
    tier: 'godtier',
    hullColor: '#e879f9', // Hyper Orchid
    accentColor: '#facc15',
    glowColor: 'rgba(232, 121, 249, 0.5)',
    thrusterColor: '#f472b6',
    primaryColor: '#e879f9',
    engineColor: '#f472b6',
    speedMultiplier: 1.32,
    shieldBonus: 185,
    damageMultiplier: 1.55,
    fireRateMultiplier: 1.26,
    dashCooldownMultiplier: 0.62,
    magnetRadiusBonus: 195,
    statModifiers: {
      speedBonus: 0.32,
      maxShieldBonus: 185,
      shieldRechargeBonus: 34,
      damageMultiplier: 1.55,
      fireRateMultiplier: 1.26,
      dashCooldownReduction: 0.38,
      magnetRadiusBonus: 195,
    },
    description:
      'Supreme coin-unlockable delta stealth flagship. Combines +55% weapon damage, +32% speed, +185 shield, and -38% dash cooldown.',
    perkDescription: '+55% Damage, +32% Speed, +185 Shield, -38% Dash CD.',
  },
  kronos_sovereign: {
    id: 'kronos_sovereign',
    name: 'Kronos Sovereign X',
    callsign: 'KS-OMEGA',
    model: 'KS-OMEGA',
    role: 'Supreme Mythic Vault Titan',
    price: 0,
    diamondCost: 420,
    tier: 'godtier',
    hullColor: '#fde047', // Celestial Sun Gold
    accentColor: '#22d3ee',
    glowColor: 'rgba(253, 224, 71, 0.55)',
    thrusterColor: '#22d3ee',
    primaryColor: '#fde047',
    engineColor: '#22d3ee',
    speedMultiplier: 1.38,
    shieldBonus: 340,
    damageMultiplier: 1.68,
    fireRateMultiplier: 1.34,
    dashCooldownMultiplier: 0.52,
    magnetRadiusBonus: 260,
    statModifiers: {
      speedBonus: 0.38,
      maxShieldBonus: 340,
      shieldRechargeBonus: 50,
      damageMultiplier: 1.68,
      fireRateMultiplier: 1.34,
      dashCooldownReduction: 0.48,
      magnetRadiusBonus: 260,
    },
    description:
      'The ultimate Diamond Vault warship. Unlocks +340 Max Shield, +68% all damage, +38% velocity, +34% fire rate, and -48% dash cooldown.',
    perkDescription: '+340 Shield · +68% DMG · +38% Speed · +34% Fire Rate · -48% Dash.',
  },
};

export const CRAFT_ORDER: CraftId[] = [
  'vanguard_alpha',
  'cyber_falcon',
  'phantom_shadow',
  'mirage_viper',
  'titan_dread',
  'tempest_raptor',
  'colossus_bastion',
  'solar_phoenix',
  'frost_valkyrie',
  'nebula_harbinger',
  'aegis_celestial',
  'eclipse_phantom',
  'astral_valkyrie',
  'zenith_emperor',
  'seraph_nova',
  'kronos_sovereign',
];

export function getCraftDef(id: CraftId): CraftDef {
  const c = CRAFTS[id] || CRAFTS.vanguard_alpha;
  return {
    ...c,
    model: c.callsign,
    primaryColor: c.hullColor,
    engineColor: c.thrusterColor,
    speedMultiplier: 1 + c.statModifiers.speedBonus,
    shieldBonus: c.statModifiers.maxShieldBonus,
    damageMultiplier: c.statModifiers.damageMultiplier,
    fireRateMultiplier: c.statModifiers.fireRateMultiplier,
    dashCooldownMultiplier: 1 - c.statModifiers.dashCooldownReduction,
    magnetRadiusBonus: c.statModifiers.magnetRadiusBonus,
  };
}

export const CRAFT_STORAGE_KEY = 'nabilbot_unlocked_crafts_v1';
export const ACTIVE_CRAFT_KEY = 'nabilbot_active_craft_v1';

export function loadUnlockedCrafts(): Record<CraftId, boolean> {
  const defaults: Record<CraftId, boolean> = {
    vanguard_alpha: true,
    cyber_falcon: false,
    phantom_shadow: false,
    mirage_viper: false,
    titan_dread: false,
    tempest_raptor: false,
    colossus_bastion: false,
    solar_phoenix: false,
    frost_valkyrie: false,
    nebula_harbinger: false,
    aegis_celestial: false,
    eclipse_phantom: false,
    astral_valkyrie: false,
    zenith_emperor: false,
    seraph_nova: false,
    kronos_sovereign: false,
  };

  if (typeof window === 'undefined') return defaults;

  try {
    const raw = localStorage.getItem(CRAFT_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      vanguard_alpha: true, // Always unlocked
      cyber_falcon: !!parsed.cyber_falcon,
      phantom_shadow: !!parsed.phantom_shadow,
      mirage_viper: !!parsed.mirage_viper,
      titan_dread: !!parsed.titan_dread,
      tempest_raptor: !!parsed.tempest_raptor,
      colossus_bastion: !!parsed.colossus_bastion,
      solar_phoenix: !!parsed.solar_phoenix,
      frost_valkyrie: !!parsed.frost_valkyrie,
      nebula_harbinger: !!parsed.nebula_harbinger,
      aegis_celestial: !!parsed.aegis_celestial,
      eclipse_phantom: !!parsed.eclipse_phantom,
      astral_valkyrie: !!parsed.astral_valkyrie,
      zenith_emperor: !!parsed.zenith_emperor,
      seraph_nova: !!parsed.seraph_nova,
      kronos_sovereign: !!parsed.kronos_sovereign,
    };
  } catch {
    return defaults;
  }
}

export function saveUnlockedCrafts(crafts: Record<CraftId, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CRAFT_STORAGE_KEY, JSON.stringify(crafts));
  } catch {
    // ignore
  }
}

export function loadActiveCraft(): CraftId {
  if (typeof window === 'undefined') return 'vanguard_alpha';
  try {
    const saved = localStorage.getItem(ACTIVE_CRAFT_KEY) as CraftId;
    if (saved && CRAFTS[saved]) return saved;
  } catch {
    // ignore
  }
  return 'vanguard_alpha';
}

export function saveActiveCraft(craft: CraftId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_CRAFT_KEY, craft);
  } catch {
    // ignore
  }
}

export function isCraftDiamondExclusive(craftId: CraftId): boolean {
  const def = getCraftDef(craftId);
  return def.price === 0 && (def.diamondCost ?? 0) > 0;
}

export function purchaseCraft(
  coins: number,
  unlockedCrafts: Record<CraftId, boolean>,
  craftId: CraftId
): {
  success: boolean;
  remainingCoins: number;
  updatedCrafts: Record<CraftId, boolean>;
  error?: string;
} {
  if (unlockedCrafts[craftId]) {
    return {
      success: false,
      remainingCoins: coins,
      updatedCrafts: unlockedCrafts,
      error: 'Flying craft is already unlocked.',
    };
  }

  const def = getCraftDef(craftId);
  if (isCraftDiamondExclusive(craftId)) {
    return {
      success: false,
      remainingCoins: coins,
      updatedCrafts: unlockedCrafts,
      error: `${def.name} is exclusive to the Diamond Vault (${def.diamondCost} Diamonds).`,
    };
  }

  if (coins < def.price) {
    return {
      success: false,
      remainingCoins: coins,
      updatedCrafts: unlockedCrafts,
      error: `Insufficient coins. Need ${def.price} coins, but have ${coins}.`,
    };
  }

  const updated = {
    ...unlockedCrafts,
    [craftId]: true,
  };
  saveUnlockedCrafts(updated);

  return {
    success: true,
    remainingCoins: coins - def.price,
    updatedCrafts: updated,
  };
}

export function purchaseCraftWithDiamonds(
  diamonds: number,
  unlockedCrafts: Record<CraftId, boolean>,
  craftId: CraftId
): {
  success: boolean;
  remainingDiamonds: number;
  updatedCrafts: Record<CraftId, boolean>;
  cost: number;
  error?: string;
} {
  if (unlockedCrafts[craftId]) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedCrafts: unlockedCrafts,
      cost: 0,
      error: 'Flying craft is already unlocked.',
    };
  }

  const def = getCraftDef(craftId);
  const cost = def.diamondCost ?? 0;
  if (cost <= 0) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedCrafts: unlockedCrafts,
      cost: 0,
      error: `${def.name} cannot be purchased with Diamonds.`,
    };
  }

  if (diamonds < cost) {
    return {
      success: false,
      remainingDiamonds: diamonds,
      updatedCrafts: unlockedCrafts,
      cost,
      error: `Insufficient diamonds. Need ${cost} 💎, but have ${diamonds} 💎.`,
    };
  }

  const updated = {
    ...unlockedCrafts,
    [craftId]: true,
  };
  saveUnlockedCrafts(updated);

  return {
    success: true,
    remainingDiamonds: diamonds - cost,
    updatedCrafts: updated,
    cost,
  };
}
