import { UserProfile } from './types';

export interface AvatarOption {
  id: string;
  name: string;
  role: string;
  badge: string;
  color: string;
  tagline: string;
  description: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'nabil_prime',
    name: 'NaBil-Prime Core',
    role: 'Supreme Vanguard Protocol',
    badge: '🤖',
    color: '#00f3ff',
    tagline: 'Autonomous Heavy Combat Core',
    description: 'Precision-engineered vanguard protocol equipped with dual particle generators and hyper-reaction cyber processors.',
  },
  {
    id: 'bengal_tiger',
    name: 'Royal Bengal Mecha',
    role: 'Apex Cyber Predator',
    badge: '🐅',
    color: '#ff5500',
    tagline: 'Apex Predator of Sundarbans & Padma',
    description: 'Aggressive cybernetic predator unit infused with plasma fangs and high-torque kinetic shock dampeners.',
  },
  {
    id: 'cyber_samurai',
    name: 'Neon Ronin Operative',
    role: 'Stealth Particle Specialist',
    badge: '⚡',
    color: '#ff0077',
    tagline: 'Particle Blade & High-Impact Master',
    description: 'Agile strike operative specialized in rapid lateral maneuvers and lethal hyper-focused particle beams.',
  },
  {
    id: 'padma_falcon',
    name: 'Padma Aero-Falcon',
    role: 'High-Altitude Interceptor',
    badge: '🦅',
    color: '#00ff88',
    tagline: 'Emerald High-Velocity Interceptor',
    description: 'Supersonic interceptor unit designed for clean solar energy harvesting and zero-friction atmospheric flight.',
  },
  {
    id: 'void_stalker',
    name: 'Void Cosmic Phantom',
    role: 'Singularity Spatial Entity',
    badge: '🌌',
    color: '#9d00ff',
    tagline: 'Singularity & Gravitational Specialist',
    description: 'Experimental dark matter operative capable of warping localized space-time and bending enemy projectile paths.',
  },
  {
    id: 'titan_sentinel',
    name: 'Chattogram Titan Sentinel',
    role: 'Deep Ocean Iron Bastion',
    badge: '🛡️',
    color: '#ffaa00',
    tagline: 'Deep Sea Maritime Iron Fortress',
    description: 'Heavy armor dreadnought forged in the naval shipyards of Karnaphuli, built to withstand apocalyptic fleet sieges.',
  },
];

export const PROFILE_STORAGE_KEY = 'nabilbot_user_profile_v2';

export function calculateMilitaryRank(highestLevel: number, totalPurges: number): string {
  if (highestLevel >= 18 && totalPurges >= 100) {
    return 'SUPREME CYBER MARSHAL';
  }
  if (highestLevel >= 15) {
    return 'NAVAL GRAND ADMIRAL';
  }
  if (highestLevel >= 11) {
    return 'BIOSPHERE HIGH GUARDIAN';
  }
  if (highestLevel >= 6) {
    return 'SECTOR ELITE ENFORCER';
  }
  return 'CYBER COMBAT CADET';
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'usr_' + Date.now(),
  name: 'Commander NaBil',
  callsign: 'NABIL-01',
  tagline: 'Defending the Sovereign Cyber Grids of Bangladesh 2077',
  avatarId: 'nabil_prime',
  homeRegion: 'dhaka',
  themeColor: '#00f3ff',
  rankTitle: 'CYBER COMBAT CADET',
  createdAt: Date.now(),
  totalBattles: 0,
  totalPurges: 0,
  highestLevel: 1,
  bestScore: 0,
  totalCoinsEarned: 500,
};

export function loadUserProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_USER_PROFILE };
  }
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      // First-time profile initialization
      saveUserProfile(DEFAULT_USER_PROFILE);
      return { ...DEFAULT_USER_PROFILE };
    }
    const parsed = JSON.parse(raw);
    const highestLevel = parsed.highestLevel || 1;
    const totalPurges = parsed.totalPurges || 0;
    return {
      id: parsed.id || 'usr_' + Date.now(),
      name: parsed.name || 'Commander NaBil',
      callsign: parsed.callsign || 'NABIL-01',
      tagline: parsed.tagline || 'Defending the Sovereign Cyber Grids of Bangladesh 2077',
      avatarId: parsed.avatarId || 'nabil_prime',
      homeRegion: parsed.homeRegion || 'dhaka',
      themeColor: parsed.themeColor || '#00f3ff',
      rankTitle: calculateMilitaryRank(highestLevel, totalPurges),
      createdAt: parsed.createdAt || Date.now(),
      totalBattles: parsed.totalBattles || 0,
      totalPurges: totalPurges,
      highestLevel: highestLevel,
      bestScore: parsed.bestScore || 0,
      totalCoinsEarned: parsed.totalCoinsEarned || 500,
    };
  } catch {
    return { ...DEFAULT_USER_PROFILE };
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = {
      ...profile,
      rankTitle: calculateMilitaryRank(profile.highestLevel, profile.totalPurges),
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore save errors
  }
}

export function recordBattleResult(
  killsInRun: number,
  clearedLevel: number,
  score: number,
  coinsGained: number
): UserProfile {
  const current = loadUserProfile();
  current.totalBattles += 1;
  current.totalPurges += killsInRun;
  current.highestLevel = Math.max(current.highestLevel, clearedLevel);
  current.bestScore = Math.max(current.bestScore, score);
  current.totalCoinsEarned += coinsGained;
  current.rankTitle = calculateMilitaryRank(current.highestLevel, current.totalPurges);
  saveUserProfile(current);
  return current;
}
