import { LeaderboardEntry, CraftId, MapRegionId } from './types';
import { loadUserProfile } from './profile';

export const LEADERBOARD_STORAGE_KEY = 'nabilbot_mock_leaderboard_v1';

export const BASE_LEADERBOARD_ENTRIES: Omit<LeaderboardEntry, 'rank'>[] = [
  {
    id: 'lead_01',
    callsign: 'AERO-CYBER-99',
    commanderName: 'Tariq Al-Amin',
    avatarBadge: '👑',
    region: 'dhaka',
    score: 184500,
    highestLevel: 21,
    activeCraft: 'aegis_celestial',
    date: '2026-11-07',
  },
  {
    id: 'lead_02',
    callsign: 'PADMA_PHOENIX',
    commanderName: 'Farhana Yasmin',
    avatarBadge: '🦅',
    region: 'rajshahi',
    score: 168200,
    highestLevel: 20,
    activeCraft: 'solar_phoenix',
    date: '2026-11-06',
  },
  {
    id: 'lead_03',
    callsign: 'KARNAPHULI_TITAN',
    commanderName: 'Capt. Rezaul Karim',
    avatarBadge: '🛡️',
    region: 'chattogram',
    score: 154800,
    highestLevel: 19,
    activeCraft: 'titan_dread',
    date: '2026-11-08',
  },
  {
    id: 'lead_04',
    callsign: 'NEON_HUNTER_DK',
    commanderName: 'Shafin Ahmed',
    avatarBadge: '⚡',
    region: 'dhaka',
    score: 141200,
    highestLevel: 18,
    activeCraft: 'phantom_shadow',
    date: '2026-11-08',
  },
  {
    id: 'lead_05',
    callsign: 'SILK_VALLEY_ACE',
    commanderName: 'Nusrat Jahan',
    avatarBadge: '🐅',
    region: 'rajshahi',
    score: 128900,
    highestLevel: 17,
    activeCraft: 'solar_phoenix',
    date: '2026-11-05',
  },
  {
    id: 'lead_06',
    callsign: 'PATENGA_STORM',
    commanderName: 'Maj. Zulfiqar Ali',
    avatarBadge: '🌊',
    region: 'chattogram',
    score: 115400,
    highestLevel: 16,
    activeCraft: 'titan_dread',
    date: '2026-11-04',
  },
  {
    id: 'lead_07',
    callsign: 'MOTIJHEEL_PULSE',
    commanderName: 'Tanvir Hasan',
    avatarBadge: '🤖',
    region: 'dhaka',
    score: 104600,
    highestLevel: 15,
    activeCraft: 'phantom_shadow',
    date: '2026-11-08',
  },
  {
    id: 'lead_08',
    callsign: 'VARENDRA_SPECTRE',
    commanderName: 'Mehedi Hasan',
    avatarBadge: '🌌',
    region: 'rajshahi',
    score: 96800,
    highestLevel: 14,
    activeCraft: 'vanguard_alpha',
    date: '2026-11-07',
  },
  {
    id: 'lead_09',
    callsign: 'BAY_DRYDOCK_99',
    commanderName: 'Lt. Saiful Islam',
    avatarBadge: '🔱',
    region: 'chattogram',
    score: 89400,
    highestLevel: 13,
    activeCraft: 'titan_dread',
    date: '2026-11-06',
  },
  {
    id: 'lead_10',
    callsign: 'DHANMONDI_BLAZE',
    commanderName: 'Adnan Sami',
    avatarBadge: '🔥',
    region: 'dhaka',
    score: 81200,
    highestLevel: 12,
    activeCraft: 'vanguard_alpha',
    date: '2026-11-07',
  },
  {
    id: 'lead_11',
    callsign: 'PADMA_EMERALD',
    commanderName: 'Sultana Razia',
    avatarBadge: '🌳',
    region: 'rajshahi',
    score: 72500,
    highestLevel: 11,
    activeCraft: 'solar_phoenix',
    date: '2026-11-05',
  },
  {
    id: 'lead_12',
    callsign: 'OFFSHORE_VANGUARD',
    commanderName: 'Imtiaz Hossain',
    avatarBadge: '⚓',
    region: 'chattogram',
    score: 64100,
    highestLevel: 10,
    activeCraft: 'vanguard_alpha',
    date: '2026-11-04',
  },
];

export async function fetchGlobalLeaderboard(filterRegion?: MapRegionId | 'all'): Promise<LeaderboardEntry[]> {
  // Simulate network latency (250ms) for mock API feel
  await new Promise((resolve) => setTimeout(resolve, 180));

  const profile = loadUserProfile();
  const playerEntry: Omit<LeaderboardEntry, 'rank'> = {
    id: 'player_active',
    callsign: profile.callsign || 'NABIL-01',
    commanderName: profile.name || 'Commander NaBil',
    avatarBadge: profile.avatarId === 'bengal_tiger' ? '🐅' : profile.avatarId === 'padma_falcon' ? '🦅' : '🤖',
    region: profile.homeRegion || 'dhaka',
    score: Math.max(profile.bestScore || 0, 12500),
    highestLevel: profile.highestLevel || 1,
    activeCraft: profile.activeCraft || 'vanguard_alpha',
    isPlayer: true,
    date: new Date().toISOString().split('T')[0],
  };

  let allEntries = [...BASE_LEADERBOARD_ENTRIES, playerEntry];

  if (filterRegion && filterRegion !== 'all') {
    allEntries = allEntries.filter((e) => e.region === filterRegion);
  }

  // Sort descending by score
  allEntries.sort((a, b) => b.score - a.score);

  // Assign ranks
  return allEntries.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}
