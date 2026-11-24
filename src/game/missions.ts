import { CelebrationParticle, CelebrationVariant, DailyMission, DailyMissionsState, DailyStreakReward, DailyStreakState, MissionObjectiveType, SocialFollowState } from './types';
import { addDiamonds } from './diamonds';

export const DAILY_MISSIONS_STORAGE_KEY = 'nabilbot_daily_missions_v3';
export const DAILY_STREAK_STORAGE_KEY = 'nabilbot_daily_streak_v1';
export const FACEBOOK_FOLLOW_REWARD_KEY = 'nabilbot_fb_follow_reward_v1';
export const FACEBOOK_FOLLOW_URL = 'https://www.facebook.com/profile.php?id=100086479151613';
export const FACEBOOK_FOLLOW_REWARD_DIAMONDS = 50;

export function getTodayDateKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getTodayKey(): string {
  return getTodayDateKey();
}

export function getPreviousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  const prev = new Date(Date.UTC(y, (m || 1) - 1, (d || 1) - 1));
  return `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, '0')}-${String(prev.getUTCDate()).padStart(2, '0')}`;
}

export function getDefaultMissionsForToday(): DailyMission[] {
  return [
    {
      id: 'm_swarmers_60',
      title: 'Swarm Exterminator',
      description: 'Purge 60 Swarmer drones across any mission sectors.',
      objectiveType: 'kills_swarmer',
      targetValue: 60,
      currentValue: 0,
      rewardCoins: 300,
      rewardDiamonds: 1,
      isCompleted: false,
      isClaimed: false,
      icon: '👾',
    },
    {
      id: 'm_snipers_25',
      title: 'Counter-Air Defense',
      description: 'Eliminate 25 Sniper turrets or Storm Drones.',
      objectiveType: 'kills_sniper',
      targetValue: 25,
      currentValue: 0,
      rewardCoins: 350,
      rewardDiamonds: 1,
      isCompleted: false,
      isClaimed: false,
      icon: '⚡',
    },
    {
      id: 'm_tanks_18',
      title: 'Heavy Armor Breaker',
      description: 'Destroy 18 Heavy Tanks or Behemoth walkers.',
      objectiveType: 'kills_tank',
      targetValue: 18,
      currentValue: 0,
      rewardCoins: 400,
      rewardDiamonds: 1,
      isCompleted: false,
      isClaimed: false,
      icon: '🛡️',
    },
    {
      id: 'm_phantoms_15',
      title: 'Ghost In The Grid',
      description: 'Eliminate 15 stealth Phantom Assassins.',
      objectiveType: 'kills_phantom',
      targetValue: 15,
      currentValue: 0,
      rewardCoins: 450,
      rewardDiamonds: 2,
      isCompleted: false,
      isClaimed: false,
      icon: '🌌',
    },
    {
      id: 'm_coins_120',
      title: 'Cyber Credit Scavenger',
      description: 'Collect 120 Cyber Coins directly from arena drops.',
      objectiveType: 'collect_coins',
      targetValue: 120,
      currentValue: 0,
      rewardCoins: 350,
      rewardDiamonds: 1,
      isCompleted: false,
      isClaimed: false,
      icon: '🪙',
    },
    {
      id: 'm_boss_2',
      title: 'Apex Sovereign Slayer',
      description: 'Defeat 2 Goliath Apex Bosses (Sectors 7, 14, 21, 28, 34, 40, 50, 55, 60, 70, 75, 80, 85, 90, 95, or 100).',
      objectiveType: 'kills_boss',
      targetValue: 2,
      currentValue: 0,
      rewardCoins: 750,
      rewardDiamonds: 2,
      isCompleted: false,
      isClaimed: false,
      icon: '👑',
    },
  ];
}

let cachedMissionsRaw: string | null = null;
let cachedMissionsState: DailyMissionsState | null = null;

function cloneMissionsState(state: DailyMissionsState): DailyMissionsState {
  return {
    lastResetDay: state.lastResetDay,
    missions: state.missions.map((m) => ({ ...m })),
  };
}

export function loadDailyMissionsState(): DailyMissionsState {
  const todayKey = getTodayKey();
  const defaultState: DailyMissionsState = {
    lastResetDay: todayKey,
    missions: getDefaultMissionsForToday(),
  };

  if (typeof window === 'undefined') return defaultState;

  try {
    const raw = localStorage.getItem(DAILY_MISSIONS_STORAGE_KEY);
    if (!raw) {
      cachedMissionsRaw = null;
      cachedMissionsState = null;
      saveDailyMissionsState(defaultState);
      return defaultState;
    }
    if (cachedMissionsRaw === raw && cachedMissionsState && cachedMissionsState.lastResetDay === todayKey) {
      return cloneMissionsState(cachedMissionsState);
    }
    const parsed = JSON.parse(raw) as DailyMissionsState;
    // Check if new day -> reset missions
    if (parsed.lastResetDay !== todayKey || !parsed.missions || parsed.missions.length === 0) {
      const refreshed: DailyMissionsState = {
        lastResetDay: todayKey,
        missions: getDefaultMissionsForToday().map((m) => ({
          ...m,
          targetProgress: m.targetValue,
          currentProgress: m.currentValue,
          claimed: m.isClaimed,
        })),
      };
      saveDailyMissionsState(refreshed);
      return refreshed;
    }
    const defaultMissions = getDefaultMissionsForToday();
    parsed.missions = parsed.missions.map((m) => {
      const defMatch = defaultMissions.find((d) => d.id === m.id);
      return {
        ...m,
        rewardDiamonds: defMatch?.rewardDiamonds ?? Math.min(2, m.rewardDiamonds ?? 1),
        targetProgress: m.targetValue,
        currentProgress: m.currentValue,
        claimed: m.isClaimed,
      };
    });
    cachedMissionsRaw = raw;
    cachedMissionsState = cloneMissionsState(parsed);
    return parsed;
  } catch {
    return defaultState;
  }
}

export function saveDailyMissionsState(state: DailyMissionsState): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(DAILY_MISSIONS_STORAGE_KEY, serialized);
    cachedMissionsRaw = serialized;
    cachedMissionsState = cloneMissionsState(state);
  } catch {
    // ignore
  }
}

export function recordMissionProgress(
  eventOrType: MissionObjectiveType | { type: MissionObjectiveType; amount?: number },
  amount: number = 1
): { updatedState: DailyMissionsState; newlyCompleted: DailyMission[] } {
  const state = loadDailyMissionsState();
  const rawType = typeof eventOrType === 'string' ? eventOrType : eventOrType.type;
  const addAmount = typeof eventOrType === 'object' && eventOrType.amount !== undefined ? eventOrType.amount : amount;
  const newlyCompleted: DailyMission[] = [];

  let changed = false;
  state.missions = state.missions.map((m) => {
    if (m.isCompleted) return m;

    let matched = false;
    if (m.objectiveType === rawType) {
      matched = true;
    } else if (rawType === 'kill_swarmers' && m.objectiveType === 'kills_swarmer') {
      matched = true;
    } else if (rawType === 'kill_tank_phantom' && (m.objectiveType === 'kills_tank' || m.objectiveType === 'kills_phantom')) {
      matched = true;
    } else if (rawType === 'destroy_boss' && m.objectiveType === 'kills_boss') {
      matched = true;
    } else if (rawType === 'kill_total' && m.objectiveType === 'kills_total') {
      matched = true;
    }

    if (matched) {
      const nextVal = Math.min(m.targetValue, m.currentValue + addAmount);
      if (nextVal !== m.currentValue) {
        changed = true;
        const nowCompleted = nextVal >= m.targetValue;
        if (nowCompleted && !m.isCompleted) {
          newlyCompleted.push({ ...m, currentValue: nextVal, currentProgress: nextVal, isCompleted: true });
        }
        return {
          ...m,
          currentValue: nextVal,
          currentProgress: nextVal,
          targetProgress: m.targetValue,
          isCompleted: nowCompleted,
        };
      }
    }
    return m;
  });

  if (changed) {
    saveDailyMissionsState(state);
  }

  return { updatedState: state, newlyCompleted };
}

export function claimMissionReward(missionId: string): {
  success: boolean;
  rewardCoins: number;
  rewardDiamonds: number;
  updatedState: DailyMissionsState;
} {
  const state = loadDailyMissionsState();
  let rewardCoins = 0;
  let rewardDiamonds = 0;
  let success = false;

  state.missions = state.missions.map((m) => {
    if (m.id === missionId && m.isCompleted && !m.isClaimed) {
      rewardCoins = m.rewardCoins;
      rewardDiamonds = Math.min(2, m.rewardDiamonds ?? 1);
      success = true;
      return {
        ...m,
        isClaimed: true,
      };
    }
    return m;
  });

  if (success) {
    saveDailyMissionsState(state);
    // Add coins to wallet
    if (typeof window !== 'undefined') {
      const curCoins = parseInt(localStorage.getItem('nabilbot_coins') || '500', 10);
      const nextCoins = curCoins + rewardCoins;
      localStorage.setItem('nabilbot_coins', String(nextCoins));
    }
    // Add diamonds to wallet (EXCLUSIVE SOURCE: Daily Missions & Streaks)
    addDiamonds(rewardDiamonds);
  }

  return { success, rewardCoins, rewardDiamonds, updatedState: state };
}

export function getUnclaimedMissionsCount(state?: DailyMissionsState): number {
  const s = state || loadDailyMissionsState();
  return s.missions.filter((m) => {
    const isDone = m.isCompleted || (m.currentValue ?? m.currentProgress ?? 0) >= (m.targetValue ?? m.targetProgress ?? 1);
    const isClaimed = m.isClaimed ?? m.claimed ?? false;
    return isDone && !isClaimed;
  }).length;
}

// ============================================================================
// DAILY STREAK TRACKING SYSTEM
// ============================================================================

export const DAILY_STREAK_REWARD_LADDER: DailyStreakReward[] = [
  { day: 1, coins: 150, diamonds: 1, label: 'DAY 1 · INITIATE' },
  { day: 2, coins: 250, diamonds: 1, label: 'DAY 2 · VANGUARD' },
  { day: 3, coins: 400, diamonds: 1, label: 'DAY 3 · SENTINEL' },
  { day: 4, coins: 600, diamonds: 1, label: 'DAY 4 · STRIKER' },
  { day: 5, coins: 850, diamonds: 2, label: 'DAY 5 · PHANTOM' },
  { day: 6, coins: 1100, diamonds: 2, label: 'DAY 6 · TITAN' },
  { day: 7, coins: 1500, diamonds: 2, label: 'DAY 7 · APEX' },
];

export function createInitialDailyStreakState(): DailyStreakState {
  return {
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedDay: null,
    lastClaimedDay: null,
    totalCheckIns: 0,
  };
}

export function getDailyStreakReward(streakDay: number): DailyStreakReward {
  const clamped = Math.max(1, Math.floor(streakDay));
  if (clamped <= DAILY_STREAK_REWARD_LADDER.length) {
    return DAILY_STREAK_REWARD_LADDER[clamped - 1];
  }
  return {
    day: clamped,
    coins: 1500 + (clamped - 7) * 150,
    diamonds: 2,
    label: `DAY ${clamped} · APEX`,
  };
}

export function advanceDailyStreakState(
  state: DailyStreakState,
  todayKey: string = getTodayDateKey()
): { nextState: DailyStreakState; advanced: boolean } {
  if (state.lastPlayedDay === todayKey) {
    return { nextState: { ...state }, advanced: false };
  }
  const prevKey = getPreviousDateKey(todayKey);
  const isConsecutive = state.lastPlayedDay === prevKey;
  const nextStreak = isConsecutive ? Math.max(1, state.currentStreak + 1) : 1;

  return {
    advanced: true,
    nextState: {
      currentStreak: nextStreak,
      bestStreak: Math.max(state.bestStreak, nextStreak),
      lastPlayedDay: todayKey,
      lastClaimedDay: state.lastClaimedDay,
      totalCheckIns: state.totalCheckIns + 1,
    },
  };
}

export interface DailyStreakSnapshot {
  currentStreak: number;
  bestStreak: number;
  hasPlayedToday: boolean;
  hasClaimedToday: boolean;
  claimableDay: number;
  todayReward: DailyStreakReward;
  cycleDay: number; // 1..7 active highlight in 7-day ladder
}

export function getDailyStreakSnapshot(
  state: DailyStreakState,
  todayKey: string = getTodayDateKey()
): DailyStreakSnapshot {
  const prevKey = getPreviousDateKey(todayKey);
  const hasPlayedToday = state.lastPlayedDay === todayKey;
  const hasClaimedToday = state.lastClaimedDay === todayKey;
  const isStreakActive = hasPlayedToday || state.lastPlayedDay === prevKey;
  const effectiveStreak = isStreakActive ? Math.max(0, state.currentStreak) : 0;
  const claimableDay = hasPlayedToday ? Math.max(1, effectiveStreak) : effectiveStreak + 1;
  const todayReward = getDailyStreakReward(claimableDay);
  const cycleDay = ((claimableDay - 1) % 7) + 1;

  return {
    currentStreak: effectiveStreak,
    bestStreak: Math.max(state.bestStreak, effectiveStreak),
    hasPlayedToday,
    hasClaimedToday,
    claimableDay,
    todayReward,
    cycleDay,
  };
}

export function claimDailyStreakBonusState(
  state: DailyStreakState,
  todayKey: string = getTodayDateKey()
): {
  success: boolean;
  rewardCoins: number;
  rewardDiamonds: number;
  streakDay: number;
  nextState: DailyStreakState;
  error?: string;
} {
  if (state.lastClaimedDay === todayKey) {
    return {
      success: false,
      rewardCoins: 0,
      rewardDiamonds: 0,
      streakDay: state.currentStreak,
      nextState: { ...state },
      error: 'Daily streak bonus already claimed today.',
    };
  }

  const { nextState: playedState } = advanceDailyStreakState(state, todayKey);
  const streakDay = Math.max(1, playedState.currentStreak);
  const reward = getDailyStreakReward(streakDay);

  return {
    success: true,
    rewardCoins: reward.coins,
    rewardDiamonds: reward.diamonds,
    streakDay,
    nextState: {
      ...playedState,
      lastClaimedDay: todayKey,
    },
  };
}

export function loadDailyStreakState(): DailyStreakState {
  const defaults = createInitialDailyStreakState();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(DAILY_STREAK_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<DailyStreakState>;
    return {
      currentStreak: typeof parsed.currentStreak === 'number' ? Math.max(0, parsed.currentStreak) : 0,
      bestStreak: typeof parsed.bestStreak === 'number' ? Math.max(0, parsed.bestStreak) : 0,
      lastPlayedDay: typeof parsed.lastPlayedDay === 'string' ? parsed.lastPlayedDay : null,
      lastClaimedDay: typeof parsed.lastClaimedDay === 'string' ? parsed.lastClaimedDay : null,
      totalCheckIns: typeof parsed.totalCheckIns === 'number' ? Math.max(0, parsed.totalCheckIns) : 0,
    };
  } catch {
    return defaults;
  }
}

export function saveDailyStreakState(state: DailyStreakState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DAILY_STREAK_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function recordDailyPlayStreak(todayKey: string = getTodayDateKey()): DailyStreakState {
  const current = loadDailyStreakState();
  const { nextState, advanced } = advanceDailyStreakState(current, todayKey);
  if (advanced) {
    saveDailyStreakState(nextState);
  }
  return nextState;
}

export function claimDailyStreakReward(todayKey: string = getTodayDateKey()): {
  success: boolean;
  rewardCoins: number;
  rewardDiamonds: number;
  streakDay: number;
  updatedState: DailyStreakState;
  error?: string;
} {
  const current = loadDailyStreakState();
  const res = claimDailyStreakBonusState(current, todayKey);
  if (res.success) {
    saveDailyStreakState(res.nextState);
    if (typeof window !== 'undefined') {
      const curCoins = parseInt(localStorage.getItem('nabilbot_coins') || '500', 10);
      localStorage.setItem('nabilbot_coins', String(curCoins + res.rewardCoins));
    }
    addDiamonds(res.rewardDiamonds);
  }
  return {
    success: res.success,
    rewardCoins: res.rewardCoins,
    rewardDiamonds: res.rewardDiamonds,
    streakDay: res.streakDay,
    updatedState: res.nextState,
    error: res.error,
  };
}

// ============================================================================
// FACEBOOK PROFILE FOLLOW ONE-TIME BONUS (+50 DIAMONDS)
// ============================================================================

export function createInitialSocialFollowState(): SocialFollowState {
  return {
    visited: false,
    claimed: false,
  };
}

export function markSocialFollowVisitedState(state: SocialFollowState): SocialFollowState {
  if (state.visited) return { ...state };
  return {
    ...state,
    visited: true,
  };
}

export function claimSocialFollowRewardState(state: SocialFollowState): {
  success: boolean;
  rewardDiamonds: number;
  nextState: SocialFollowState;
  error?: string;
} {
  if (state.claimed) {
    return {
      success: false,
      rewardDiamonds: 0,
      nextState: { ...state },
      error: 'Facebook follow reward already claimed.',
    };
  }
  if (!state.visited) {
    return {
      success: false,
      rewardDiamonds: 0,
      nextState: { ...state },
      error: 'Visit and follow the Facebook profile first to unlock this reward.',
    };
  }
  return {
    success: true,
    rewardDiamonds: FACEBOOK_FOLLOW_REWARD_DIAMONDS,
    nextState: {
      visited: true,
      claimed: true,
      claimedAt: Date.now(),
    },
  };
}

export function loadFacebookFollowState(): SocialFollowState {
  const defaults = createInitialSocialFollowState();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(FACEBOOK_FOLLOW_REWARD_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<SocialFollowState>;
    return {
      visited: Boolean(parsed.visited),
      claimed: Boolean(parsed.claimed),
      claimedAt: typeof parsed.claimedAt === 'number' ? parsed.claimedAt : undefined,
    };
  } catch {
    return defaults;
  }
}

export function saveFacebookFollowState(state: SocialFollowState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FACEBOOK_FOLLOW_REWARD_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function markFacebookFollowVisited(): SocialFollowState {
  const next = markSocialFollowVisitedState(loadFacebookFollowState());
  saveFacebookFollowState(next);
  return next;
}

export function claimFacebookFollowReward(): {
  success: boolean;
  rewardDiamonds: number;
  updatedState: SocialFollowState;
  error?: string;
} {
  const res = claimSocialFollowRewardState(loadFacebookFollowState());
  if (res.success) {
    saveFacebookFollowState(res.nextState);
    addDiamonds(res.rewardDiamonds);
  }
  return {
    success: res.success,
    rewardDiamonds: res.rewardDiamonds,
    updatedState: res.nextState,
    error: res.error,
  };
}

// ============================================================================
// CELEBRATORY REWARD CLAIM PARTICLE BURST HELPERS
// ============================================================================

const CELEBRATION_PALETTES: Record<CelebrationVariant, string[]> = {
  mission: ['#fbbf24', '#facc15', '#00f3ff', '#34d399', '#ffffff'],
  streak: ['#fb923c', '#fbbf24', '#f43f5e', '#fde047', '#00f3ff'],
  diamond: ['#00f3ff', '#38bdf8', '#a5f3fc', '#c084fc', '#ffffff'],
};

const CELEBRATION_SHAPES: Record<CelebrationVariant, CelebrationParticle['shape'][]> = {
  mission: ['coin', 'star', 'spark', 'diamond'],
  streak: ['coin', 'star', 'diamond', 'spark'],
  diamond: ['diamond', 'star', 'diamond', 'spark'],
};

export function generateCelebrationParticles(
  originX: number,
  originY: number,
  variant: CelebrationVariant = 'mission',
  count: number = variant === 'diamond' ? 44 : 36,
  rand: () => number = Math.random
): CelebrationParticle[] {
  const safeCount = Math.max(8, Math.min(80, Math.round(count)));
  const palette = CELEBRATION_PALETTES[variant] || CELEBRATION_PALETTES.mission;
  const shapes = CELEBRATION_SHAPES[variant] || CELEBRATION_SHAPES.mission;
  const particles: CelebrationParticle[] = [];

  for (let i = 0; i < safeCount; i++) {
    const angle = (i / safeCount) * Math.PI * 2 + (rand() - 0.5) * 0.45;
    const speed = 130 + rand() * 290;
    const maxLife = 0.75 + rand() * 0.6;
    const shape = shapes[i % shapes.length];
    const color = palette[Math.floor(rand() * palette.length) % palette.length];
    particles.push({
      x: originX + (rand() - 0.5) * 14,
      y: originY + (rand() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (95 + rand() * 110),
      size: shape === 'spark' ? 3 + rand() * 3.5 : 5 + rand() * 5,
      life: maxLife,
      maxLife,
      color,
      rotation: rand() * Math.PI * 2,
      rotationSpeed: (rand() - 0.5) * 12,
      shape,
      gravity: shape === 'spark' ? 280 : 380,
    });
  }

  return particles;
}

export function stepCelebrationParticles(
  particles: CelebrationParticle[],
  dt: number
): CelebrationParticle[] {
  const safeDt = Math.max(0, Math.min(0.05, dt));
  const next: CelebrationParticle[] = [];
  const drag = Math.pow(0.28, safeDt);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const nextLife = p.life - safeDt;
    if (nextLife <= 0) continue;

    const nextVx = p.vx * drag;
    const nextVy = p.vy * drag + p.gravity * safeDt;
    next.push({
      ...p,
      x: p.x + nextVx * safeDt,
      y: p.y + nextVy * safeDt,
      vx: nextVx,
      vy: nextVy,
      rotation: p.rotation + p.rotationSpeed * safeDt,
      life: nextLife,
    });
  }

  return next;
}
