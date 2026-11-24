import { Achievement, AchievementEvent } from './types';

export const ACHIEVEMENTS_STORAGE_KEY = 'nabilbot_achievements_v2';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  // --- COMBAT PURGE MEDALS ---
  {
    id: 'first_blood',
    title: 'Vanguard Initiate',
    description: 'Purge 50 hostile drones in the cyber arena to earn your combat stripes.',
    category: 'combat',
    tier: 'bronze',
    icon: '🎖️',
    currentProgress: 0,
    targetProgress: 50,
    isUnlocked: false,
    rewardCoins: 100,
  },
  {
    id: 'swarm_slayer',
    title: 'Swarm Slayer',
    description: 'Destroy 400 total hostiles across your combat career.',
    category: 'combat',
    tier: 'silver',
    icon: '⚔️',
    currentProgress: 0,
    targetProgress: 400,
    isUnlocked: false,
    rewardCoins: 250,
  },
  {
    id: 'centurion_purger',
    title: 'Apex Exterminator',
    description: 'Purge 1,500 total hostiles from Bangladesh cyber grids.',
    category: 'combat',
    tier: 'gold',
    icon: '💀',
    currentProgress: 0,
    targetProgress: 1500,
    isUnlocked: false,
    rewardCoins: 600,
  },
  {
    id: 'kills_1000',
    title: '4,000 Kills Legend',
    description: 'Reach an elite milestone of 4,000 total career enemy purges.',
    category: 'combat',
    tier: 'platinum',
    icon: '👑',
    currentProgress: 0,
    targetProgress: 4000,
    isUnlocked: false,
    rewardCoins: 1500,
  },

  // --- TACTICAL MASTERY & SKILL MEDALS ---
  {
    id: 'no_hit_run',
    title: 'No Hit Run (Untouchable x3)',
    description: 'Complete 3 full mission sectors without taking any hull or shield damage.',
    category: 'mastery',
    tier: 'gold',
    icon: '🛡️',
    currentProgress: 0,
    targetProgress: 3,
    isUnlocked: false,
    rewardCoins: 900,
  },
  {
    id: 'combo_master',
    title: 'Combo Overlord (45x)',
    description: 'Execute an uninterrupted 45x kill combo streak in a single battle.',
    category: 'mastery',
    tier: 'gold',
    icon: '⚡',
    currentProgress: 0,
    targetProgress: 45,
    isUnlocked: false,
    rewardCoins: 650,
  },
  {
    id: 'ghost_hunter',
    title: 'Spectre Cleanser',
    description: 'Hunt and eliminate 50 cloaked Phantom Assassins.',
    category: 'mastery',
    tier: 'silver',
    icon: '👁️',
    currentProgress: 0,
    targetProgress: 50,
    isUnlocked: false,
    rewardCoins: 500,
  },
  {
    id: 'behemoth_breaker',
    title: 'Behemoth Toppler',
    description: 'Smash through 40 heavy shielded Behemoth siege walkers and Tanks.',
    category: 'mastery',
    tier: 'gold',
    icon: '💥',
    currentProgress: 0,
    targetProgress: 40,
    isUnlocked: false,
    rewardCoins: 700,
  },

  // --- SECTOR PROGRESSION MEDALS ---
  {
    id: 'dhaka_liberator',
    title: 'Capital Liberator',
    description: 'Defeat the actual Goliath Dreadnought boss in Dhaka Sector 7 or higher.',
    category: 'progression',
    tier: 'gold',
    icon: '🏙️',
    currentProgress: 0,
    targetProgress: 1,
    isUnlocked: false,
    rewardCoins: 500,
  },
  {
    id: 'biosphere_guardian',
    title: 'Cartoon Biosphere Sovereign',
    description: 'Conquer the Padma Apex Goliath boss in Rajshahi Sector 14 or higher.',
    category: 'progression',
    tier: 'gold',
    icon: '🌳',
    currentProgress: 0,
    targetProgress: 1,
    isUnlocked: false,
    rewardCoins: 750,
  },
  {
    id: 'naval_supreme',
    title: 'Supreme Ragnarok Conqueror',
    description: 'Defeat 2 Goliath Dreadnought bosses in Chattogram Sector 21+.',
    category: 'progression',
    tier: 'platinum',
    icon: '🔱',
    currentProgress: 0,
    targetProgress: 2,
    isUnlocked: false,
    rewardCoins: 1500,
  },
  {
    id: 'sylhet_apex',
    title: 'Celestial Singularity Overlord',
    description: 'Defeat 2 Omni-Goliath bosses in Sylhet Celestial Highlands Sector 28.',
    category: 'progression',
    tier: 'platinum',
    icon: '💎',
    currentProgress: 0,
    targetProgress: 2,
    isUnlocked: false,
    rewardCoins: 2000,
  },
  {
    id: 'campaign_victor',
    title: 'Grand Cyber Marshal',
    description: 'Clear and conquer all 100 combat sectors across Bangladesh 2077.',
    category: 'progression',
    tier: 'platinum',
    icon: '🎖️',
    currentProgress: 0,
    targetProgress: 100,
    isUnlocked: false,
    rewardCoins: 5000,
  },

  // --- ELITE WEALTH & ARSENAL MEDALS ---
  {
    id: 'coin_hoarder',
    title: 'Cyber Millionaire',
    description: 'Collect 10,000 Cyber Coins from battlefield drops and bounties.',
    category: 'elite',
    tier: 'gold',
    icon: '🪙',
    currentProgress: 0,
    targetProgress: 10000,
    isUnlocked: false,
    rewardCoins: 1000,
  },
  {
    id: 'fleet_commander',
    title: 'Fleet Commander',
    description: 'Unlock 5 distinct combat airframes across the Hangar & Diamond Vault.',
    category: 'elite',
    tier: 'gold',
    icon: '🚀',
    currentProgress: 0,
    targetProgress: 5,
    isUnlocked: false,
    rewardCoins: 1200,
  },
  {
    id: 'godtier_wielder',
    title: 'God-Tier Arsenal Sovereign',
    description: 'Acquire 3 distinct God-Tier or Diamond Vault weapons.',
    category: 'elite',
    tier: 'platinum',
    icon: '🌟',
    currentProgress: 0,
    targetProgress: 3,
    isUnlocked: false,
    rewardCoins: 1500,
  },
  {
    id: 'storm_breaker',
    title: 'Atmospheric Ace',
    description: 'Shoot down 75 high-velocity Storm Drones.',
    category: 'combat',
    tier: 'silver',
    icon: '🌪️',
    currentProgress: 0,
    targetProgress: 75,
    isUnlocked: false,
    rewardCoins: 450,
  },
];

let cachedAchievementsRaw: string | null = null;
let cachedAchievementsList: Achievement[] | null = null;

export function loadAchievements(): Achievement[] {
  if (typeof window === 'undefined') {
    return INITIAL_ACHIEVEMENTS.map((a) => ({ ...a }));
  }
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) {
      cachedAchievementsRaw = null;
      cachedAchievementsList = null;
      saveAchievements(INITIAL_ACHIEVEMENTS);
      return INITIAL_ACHIEVEMENTS.map((a) => ({ ...a }));
    }
    if (cachedAchievementsRaw === raw && cachedAchievementsList) {
      return cachedAchievementsList.map((a) => ({ ...a }));
    }
    const savedList: Achievement[] = JSON.parse(raw);
    // Merge with any newly added achievements
    const merged = INITIAL_ACHIEVEMENTS.map((init) => {
      const match = savedList.find((s) => s.id === init.id);
      if (!match) return { ...init };
      return {
        ...init,
        currentProgress: match.currentProgress ?? 0,
        isUnlocked: !!match.isUnlocked,
        unlockedAt: match.unlockedAt,
      };
    });
    cachedAchievementsRaw = raw;
    cachedAchievementsList = merged.map((a) => ({ ...a }));
    return merged;
  } catch {
    return INITIAL_ACHIEVEMENTS.map((a) => ({ ...a }));
  }
}

export function saveAchievements(achievements: Achievement[]): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(achievements);
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, serialized);
    cachedAchievementsRaw = serialized;
    cachedAchievementsList = achievements.map((a) => ({ ...a }));
  } catch {
    // ignore
  }
}

export function recordAchievementEvent(
  event: AchievementEvent
): { updatedAchievements: Achievement[]; newlyUnlocked: Achievement[]; rewardCoinsTotal: number } {
  const currentList = loadAchievements();
  const newlyUnlocked: Achievement[] = [];
  let rewardCoinsTotal = 0;
  let hasChanges = false;

  const nextList = currentList.map((ach) => {
    if (ach.isUnlocked) return ach;

    let progressDelta = 0;
    let absoluteValue: number | null = null;

    switch (event.type) {
      case 'kill':
      case 'kills_total':
        if (ach.id === 'first_blood' || ach.id === 'swarm_slayer' || ach.id === 'centurion_purger' || ach.id === 'kills_1000') {
          if (event.type === 'kills_total' && typeof event.amount === 'number') {
            absoluteValue = event.amount;
          } else {
            progressDelta = event.amount ?? 1;
          }
        }
        break;

      case 'kill_phantom':
        if (ach.id === 'ghost_hunter') {
          progressDelta = event.amount ?? 1;
        }
        break;

      case 'kill_behemoth':
        if (ach.id === 'behemoth_breaker') {
          progressDelta = event.amount ?? 1;
        }
        break;

      case 'kill_storm_drone':
        if (ach.id === 'storm_breaker') {
          progressDelta = event.amount ?? 1;
        }
        break;

      case 'no_hit_clear':
        if (ach.id === 'no_hit_run') {
          progressDelta = 1;
        }
        break;

      case 'combo_streak':
        if (ach.id === 'combo_master') {
          const streak = event.amount ?? 0;
          if (streak > ach.currentProgress) {
            absoluteValue = streak;
          }
        }
        break;

      case 'kill_boss': {
        const lvl = event.metadata?.level ?? event.amount ?? 0;
        if (ach.id === 'dhaka_liberator' && lvl >= 7) {
          progressDelta = 1;
        }
        if (ach.id === 'biosphere_guardian' && lvl >= 14) {
          progressDelta = 1;
        }
        if (ach.id === 'naval_supreme' && lvl >= 21) {
          progressDelta = 1;
        }
        if (ach.id === 'sylhet_apex' && lvl >= 28) {
          progressDelta = 1;
        }
        break;
      }

      case 'level_clear': {
        const lvl = event.metadata?.level ?? event.amount ?? 0;
        if (ach.id === 'campaign_victor' && lvl > ach.currentProgress) {
          absoluteValue = lvl;
        }
        break;
      }

      case 'coins_collected':
        if (ach.id === 'coin_hoarder') {
          if (typeof event.amount === 'number' && event.metadata?.isTotalLifetime) {
            absoluteValue = event.amount;
          } else {
            progressDelta = event.amount ?? 0;
          }
        }
        break;

      case 'craft_unlocked':
        if (ach.id === 'fleet_commander') {
          const craftCount = event.amount ?? 1;
          if (craftCount > ach.currentProgress) {
            absoluteValue = craftCount;
          }
        }
        break;

      case 'weapon_equipped':
        if (ach.id === 'godtier_wielder' && event.metadata?.isGodTier) {
          const count = event.amount ?? 1;
          if (count > ach.currentProgress) {
            absoluteValue = count;
          }
        }
        break;
    }

    if (progressDelta > 0 || absoluteValue !== null) {
      hasChanges = true;
      const nextProgress = Math.min(
        ach.targetProgress,
        absoluteValue !== null ? Math.max(ach.currentProgress, absoluteValue) : ach.currentProgress + progressDelta
      );
      const isNowUnlocked = nextProgress >= ach.targetProgress;

      if (isNowUnlocked && !ach.isUnlocked) {
        newlyUnlocked.push({
          ...ach,
          currentProgress: nextProgress,
          isUnlocked: true,
          unlockedAt: Date.now(),
        });
        rewardCoinsTotal += ach.rewardCoins;
      }

      return {
        ...ach,
        currentProgress: nextProgress,
        isUnlocked: isNowUnlocked,
        unlockedAt: isNowUnlocked ? (ach.unlockedAt || Date.now()) : undefined,
      };
    }

    return ach;
  });

  if (hasChanges) {
    saveAchievements(nextList);

    // If coins were rewarded, credit them to wallet
    if (rewardCoinsTotal > 0 && typeof window !== 'undefined') {
      try {
        const curCoins = parseInt(localStorage.getItem('nabilbot_coins') || '500', 10);
        localStorage.setItem('nabilbot_coins', String(curCoins + rewardCoinsTotal));
      } catch {
        // ignore
      }
    }
  }

  return {
    updatedAchievements: nextList,
    newlyUnlocked,
    rewardCoinsTotal,
  };
}

export function getAchievementStats(achievements?: Achievement[]): {
  total: number;
  unlocked: number;
  percent: number;
  totalCount: number;
  unlockedCount: number;
  percentComplete: number;
  bronzeTotal: number;
  bronzeUnlocked: number;
  silverTotal: number;
  silverUnlocked: number;
  goldTotal: number;
  goldUnlocked: number;
  platinumTotal: number;
  platinumUnlocked: number;
} {
  const list = achievements || loadAchievements();
  const total = list.length;
  const unlocked = list.filter((a) => a.isUnlocked).length;
  const percent = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  const bronzeTotal = list.filter((a) => a.tier === 'bronze').length;
  const bronzeUnlocked = list.filter((a) => a.tier === 'bronze' && a.isUnlocked).length;

  const silverTotal = list.filter((a) => a.tier === 'silver').length;
  const silverUnlocked = list.filter((a) => a.tier === 'silver' && a.isUnlocked).length;

  const goldTotal = list.filter((a) => a.tier === 'gold').length;
  const goldUnlocked = list.filter((a) => a.tier === 'gold' && a.isUnlocked).length;

  const platinumTotal = list.filter((a) => a.tier === 'platinum').length;
  const platinumUnlocked = list.filter((a) => a.tier === 'platinum' && a.isUnlocked).length;

  return {
    total,
    unlocked,
    percent,
    totalCount: total,
    unlockedCount: unlocked,
    percentComplete: percent,
    bronzeTotal,
    bronzeUnlocked,
    silverTotal,
    silverUnlocked,
    goldTotal,
    goldUnlocked,
    platinumTotal,
    platinumUnlocked,
  };
}

export const TIER_CONFIG: Record<
  Achievement['tier'],
  { label: string; color: string; border: string; bg: string; glow: string }
> = {
  bronze: {
    label: 'BRONZE MEDAL',
    color: '#cd7f32',
    border: 'border-[#cd7f32]/60',
    bg: 'bg-[#cd7f32]/10',
    glow: 'rgba(205, 127, 50, 0.3)',
  },
  silver: {
    label: 'SILVER MEDAL',
    color: '#e2e8f0',
    border: 'border-slate-300/60',
    bg: 'bg-slate-300/10',
    glow: 'rgba(226, 232, 240, 0.3)',
  },
  gold: {
    label: 'GOLD MEDAL',
    color: '#fbbf24',
    border: 'border-amber-400/70',
    bg: 'bg-amber-400/15',
    glow: 'rgba(251, 191, 36, 0.4)',
  },
  platinum: {
    label: 'PLATINUM PROTOCOL',
    color: '#00f3ff',
    border: 'border-cyan-400',
    bg: 'bg-cyan-500/20',
    glow: 'rgba(0, 243, 255, 0.5)',
  },
};
