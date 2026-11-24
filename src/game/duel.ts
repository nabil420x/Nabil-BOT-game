import type { DifficultyMode, EnemyType, WeaponType } from './types.ts';
import type { ArenaMapTheme } from './arenaObstacles.ts';

export type DuelModeType = 'local' | 'online';
export type DuelMatchFormat = 'pvpve_1v1' | 'pvp_solo' | 'pvp_team';
export type DuelTeamId = 'alpha' | 'omega';
export type DuelSlotId = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6';
export const ALL_DUEL_SLOTS: DuelSlotId[] = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
export const MAX_PURE_PVP_PLAYERS = 6;

export const DUEL_SLOT_COLORS: Record<DuelSlotId, string> = {
  p1: '#00f3ff',
  p2: '#ff0077',
  p3: '#10b981',
  p4: '#fbbf24',
  p5: '#c084fc',
  p6: '#38bdf8',
};

export const DUEL_TEAM_COLORS: Record<DuelTeamId, string> = {
  alpha: '#00f3ff',
  omega: '#ff0077',
};

export type DuelCameraMode = 'both' | 'p1' | 'p2';
export type DuelSpectatorCamera = DuelCameraMode;

export interface DuelTeamScoreSummary {
  team: DuelTeamId;
  name: string;
  color: string;
  totalPoints: number;
  pvpKills: number;
  deaths: number;
  playerCount: number;
}

export interface DuelConfig {
  mode: DuelModeType;
  matchFormat?: DuelMatchFormat;
  mapTheme?: ArenaMapTheme;
  durationSeconds: number;
  level: number;
  difficulty: DifficultyMode;
  p1Name: string;
  p2Name: string;
  roomCode?: string;
  localSlot?: DuelSlotId;
  isSpectator?: boolean;
  freePointerMove?: boolean;
  players?: DuelPlayerScore[];
}

export const CYBER_MOMENTUM_KILL_THRESHOLD = 3;
export const CYBER_MOMENTUM_DURATION_SECONDS = 6.0;
export const CYBER_MOMENTUM_SPEED_MULTIPLIER = 1.35;
export const PVP_TAKEDOWN_BASE_POINTS = 350;

export interface DuelPlayerScore {
  slot: DuelSlotId;
  name: string;
  color: string;
  team?: DuelTeamId;
  kills: number;
  pvpKills: number;
  baseKillPoints: number;
  comboBonusPoints: number;
  pvpBonusPoints: number;
  damageDealt: number;
  deaths: number;
  comboStreak: number;
  bestCombo: number;
  finisherCharge?: number;
  finisherReady?: boolean;
  momentumKills: number;
  momentumTimer: number;
  momentumActivations: number;
  totalPoints: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  respawnTimer: number;
  connected: boolean;
  ready: boolean;
}

export interface DuelHudSnapshot {
  mode: DuelModeType;
  matchFormat?: DuelMatchFormat;
  mapTheme?: ArenaMapTheme;
  roomCode?: string;
  localSlot: DuelSlotId;
  isSpectator?: boolean;
  spectatorCount?: number;
  spectatorCamera?: DuelSpectatorCamera;
  cameraMode?: DuelCameraMode;
  freePointerMove?: boolean;
  activeWeapon?: WeaponType;
  unlockedWeapons?: Record<WeaponType, boolean>;
  dashCooldown?: number;
  dashCooldownTimer?: number;
  wallCharges?: number;
  maxWallCharges?: number;
  wallCooldownTimer?: number;
  wallCooldownTotal?: number;
  finisherCharge?: number;
  finisherReady?: boolean;
  timeRemaining: number;
  durationSeconds: number;
  level: number;
  p1: DuelPlayerScore;
  p2: DuelPlayerScore;
  players?: DuelPlayerScore[];
  teamScores?: {
    alpha: DuelTeamScoreSummary;
    omega: DuelTeamScoreSummary;
  };
  activeEnemies: number;
}

export type DuelFeedEventType =
  | 'first_blood'
  | 'kill_streak'
  | 'cyber_momentum'
  | 'pvp_takedown'
  | 'comeback'
  | 'lead_change';

export interface DuelKillFeedEvent {
  id: string;
  timeSeconds: number;
  timeLabel: string;
  type: DuelFeedEventType;
  slot: DuelSlotId;
  actorName: string;
  title: string;
  detail: string;
  pointsDelta?: number;
}

export interface DuelEventTracker {
  seq: number;
  hadFirstBlood: boolean;
  leaderSlot: DuelSlotId | null;
  maxDeficitBySlot: Record<DuelSlotId, number>;
  recordedStreaks: Record<DuelSlotId, Set<number>>;
}

export interface DuelVictorySummary {
  winnerSlot: DuelSlotId | 'tie';
  winnerName: string;
  isTie: boolean;
  mode: DuelModeType;
  matchFormat?: DuelMatchFormat;
  mapTheme?: ArenaMapTheme;
  winningTeam?: DuelTeamId | 'tie';
  teamScores?: {
    alpha: DuelTeamScoreSummary;
    omega: DuelTeamScoreSummary;
  };
  players?: DuelPlayerScore[];
  durationSeconds: number;
  level: number;
  totalArenaKills: number;
  p1: DuelPlayerScore;
  p2: DuelPlayerScore;
  pointMargin: number;
  killMargin: number;
  killFeed?: DuelKillFeedEvent[];
}

export interface DuelCompetitiveSpawn {
  spawnId: string;
  type: EnemyType;
  x: number;
  y: number;
  assignedTo: DuelSlotId;
}

export function isPurePvpFormat(format?: DuelMatchFormat): boolean {
  return format === 'pvp_solo' || format === 'pvp_team';
}

export function formatDuelTimer(secondsRemaining: number): string {
  const clamped = Math.max(0, Math.ceil(secondsRemaining));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function createInitialDuelPlayerScore(
  slot: DuelSlotId,
  name: string,
  maxHp: number = 10,
  maxShield: number = 150,
  connected: boolean = true,
  team?: DuelTeamId
): DuelPlayerScore {
  const defaultNames: Record<DuelSlotId, string> = {
    p1: 'Commander P1',
    p2: 'Challenger P2',
    p3: 'Pilot P3',
    p4: 'Pilot P4',
    p5: 'Pilot P5',
    p6: 'Pilot P6',
  };
  return {
    slot,
    name: name.trim() || defaultNames[slot],
    color: team ? DUEL_TEAM_COLORS[team] : DUEL_SLOT_COLORS[slot],
    team,
    kills: 0,
    pvpKills: 0,
    baseKillPoints: 0,
    comboBonusPoints: 0,
    pvpBonusPoints: 0,
    damageDealt: 0,
    deaths: 0,
    comboStreak: 0,
    bestCombo: 0,
    finisherCharge: 0,
    finisherReady: false,
    momentumKills: 0,
    momentumTimer: 0,
    momentumActivations: 0,
    totalPoints: 0,
    hp: maxHp,
    maxHp,
    shield: maxShield,
    maxShield,
    respawnTimer: 0,
    connected,
    ready: slot === 'p1',
  };
}

export const PVP_SHIELD_RECHARGE_DELAY_SECONDS = 3.2;
export const PVP_SHIELD_RECHARGE_RATE_PER_SECOND = 22;
export const PVP_RESPAWN_DURATION_SECONDS = 2.5;

export function canDamageDuelTarget(
  format: DuelMatchFormat | undefined,
  attacker: { slot: DuelSlotId; team?: DuelTeamId },
  target: { slot: DuelSlotId; team?: DuelTeamId }
): boolean {
  if (attacker.slot === target.slot) return false;
  if (format === 'pvp_team') {
    const aTeam = attacker.team || 'alpha';
    const tTeam = target.team || 'omega';
    return aTeam !== tTeam;
  }
  return true;
}

export function computePvpProjectileDamage(rawDamage: number): number {
  const scaled = Math.round(Math.max(0, rawDamage) * 0.85);
  return Math.max(12, Math.min(180, scaled));
}

export function applyPvpDamageToPool(params: {
  shield: number;
  hp: number;
  maxHp: number;
  damage: number;
}): {
  shield: number;
  hp: number;
  shieldAbsorbed: number;
  hpLost: number;
  isKO: boolean;
} {
  const safeShield = Math.max(0, params.shield);
  const safeHp = Math.max(0, params.hp);
  const safeDamage = Math.max(0, params.damage);

  const shieldAbsorbed = Math.min(safeShield, safeDamage);
  const nextShield = Math.max(0, safeShield - shieldAbsorbed);
  const overflow = Math.max(0, safeDamage - shieldAbsorbed);

  let hpLost = 0;
  if (overflow > 0 && safeHp > 0) {
    hpLost = Math.max(1, Math.round(overflow / 8));
  }
  const nextHp = Math.max(0, safeHp - hpLost);

  return {
    shield: nextShield,
    hp: nextHp,
    shieldAbsorbed,
    hpLost,
    isKO: nextHp <= 0,
  };
}

export function assignBalancedTeam(existingPlayers: DuelPlayerScore[]): DuelTeamId {
  let alphaCount = 0;
  let omegaCount = 0;
  for (const p of existingPlayers) {
    if (!p.connected) continue;
    if (p.team === 'omega') omegaCount += 1;
    else alphaCount += 1;
  }
  return omegaCount < alphaCount ? 'omega' : 'alpha';
}

export function computeDuelTeamScores(players: DuelPlayerScore[]): {
  alpha: DuelTeamScoreSummary;
  omega: DuelTeamScoreSummary;
} {
  const alpha: DuelTeamScoreSummary = {
    team: 'alpha',
    name: 'Team Cyan (Alpha)',
    color: DUEL_TEAM_COLORS.alpha,
    totalPoints: 0,
    pvpKills: 0,
    deaths: 0,
    playerCount: 0,
  };
  const omega: DuelTeamScoreSummary = {
    team: 'omega',
    name: 'Team Magenta (Omega)',
    color: DUEL_TEAM_COLORS.omega,
    totalPoints: 0,
    pvpKills: 0,
    deaths: 0,
    playerCount: 0,
  };

  for (const p of players) {
    const bucket = p.team === 'omega' ? omega : alpha;
    bucket.totalPoints += p.totalPoints;
    bucket.pvpKills += p.pvpKills;
    bucket.deaths += p.deaths;
    if (p.connected) bucket.playerCount += 1;
  }

  return { alpha, omega };
}

export function formatDuelElapsedLabel(elapsedSeconds: number): string {
  const clamped = Math.max(0, Math.floor(elapsedSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function createDuelEventTracker(): DuelEventTracker {
  return {
    seq: 1,
    hadFirstBlood: false,
    leaderSlot: null,
    maxDeficitBySlot: { p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, p6: 0 },
    recordedStreaks: {
      p1: new Set<number>(),
      p2: new Set<number>(),
      p3: new Set<number>(),
      p4: new Set<number>(),
      p5: new Set<number>(),
      p6: new Set<number>(),
    },
  };
}

export const DUEL_STREAK_MILESTONES = [3, 5, 10, 15, 20, 30] as const;

export function evaluateDuelMajorEvents(params: {
  tracker: DuelEventTracker;
  p1: DuelPlayerScore;
  p2: DuelPlayerScore;
  actingSlot: DuelSlotId;
  elapsedSeconds: number;
  pvpKO?: boolean;
  pvpRewardPoints?: number;
  momentumTriggered?: boolean;
  killRewardPoints?: number;
}): DuelKillFeedEvent[] {
  const {
    tracker,
    p1,
    p2,
    actingSlot,
    elapsedSeconds,
    pvpKO = false,
    pvpRewardPoints = 0,
    momentumTriggered = false,
    killRewardPoints = 0,
  } = params;

  const events: DuelKillFeedEvent[] = [];
  const actor = actingSlot === 'p2' ? p2 : p1;
  const rival = actingSlot === 'p2' ? p1 : p2;
  const timeSec = Math.max(0, Math.floor(elapsedSeconds));
  const timeLabel = formatDuelElapsedLabel(timeSec);

  const pushEvent = (
    type: DuelFeedEventType,
    title: string,
    detail: string,
    pointsDelta?: number
  ) => {
    events.push({
      id: `df_${tracker.seq++}`,
      timeSeconds: timeSec,
      timeLabel,
      type,
      slot: actingSlot,
      actorName: actor.name,
      title,
      detail,
      pointsDelta,
    });
  };

  if (!tracker.hadFirstBlood) {
    tracker.hadFirstBlood = true;
    pushEvent(
      'first_blood',
      'First Blood',
      pvpKO
        ? `${actor.name} opened the duel by eliminating ${rival.name}`
        : `${actor.name} drew first blood in the arena`,
      pvpKO ? pvpRewardPoints : killRewardPoints
    );
  }

  if (pvpKO) {
    pushEvent(
      'pvp_takedown',
      'PvP Takedown',
      `${actor.name} shut down ${rival.name} in direct combat`,
      pvpRewardPoints
    );
  }

  if (momentumTriggered) {
    pushEvent(
      'cyber_momentum',
      'Cyber Momentum Surge',
      `${actor.name} hit 3 rapid kills for +35% speed overdrive`
    );
  }

  for (const milestone of DUEL_STREAK_MILESTONES) {
    if (actor.comboStreak >= milestone && !tracker.recordedStreaks[actingSlot].has(milestone)) {
      tracker.recordedStreaks[actingSlot].add(milestone);
      pushEvent(
        'kill_streak',
        `${milestone}x Kill Streak`,
        `${actor.name} reached an unstoppable ${actor.comboStreak}x combo streak`
      );
    }
  }

  // Track comeback from >= 250-point deficit before refreshing leaderSlot
  const priorMaxDeficit = tracker.maxDeficitBySlot[actingSlot] || 0;
  let comebackEmitted = false;
  if (priorMaxDeficit >= 250 && actor.totalPoints >= rival.totalPoints) {
    comebackEmitted = true;
    pushEvent(
      'comeback',
      'Comeback Surge',
      `${actor.name} rallied from -${priorMaxDeficit.toLocaleString()} pts to ${
        actor.totalPoints > rival.totalPoints ? 'overtake' : 'tie'
      } ${rival.name}`
    );
    tracker.maxDeficitBySlot[actingSlot] = 0;
  }

  // Record trailing deficits for future comeback detection
  if (p1.totalPoints > p2.totalPoints) {
    tracker.maxDeficitBySlot.p2 = Math.max(
      tracker.maxDeficitBySlot.p2,
      p1.totalPoints - p2.totalPoints
    );
  } else if (p2.totalPoints > p1.totalPoints) {
    tracker.maxDeficitBySlot.p1 = Math.max(
      tracker.maxDeficitBySlot.p1,
      p2.totalPoints - p1.totalPoints
    );
  }

  // Lead change detection (when lead flips cleanly after opponent previously held the lead)
  let nextLeader: DuelSlotId | null = tracker.leaderSlot;
  if (p1.totalPoints > p2.totalPoints) nextLeader = 'p1';
  else if (p2.totalPoints > p1.totalPoints) nextLeader = 'p2';

  if (
    !comebackEmitted &&
    tracker.leaderSlot !== null &&
    nextLeader !== null &&
    nextLeader !== tracker.leaderSlot &&
    nextLeader === actingSlot
  ) {
    pushEvent(
      'lead_change',
      'Lead Flip',
      `${actor.name} surged ahead of ${rival.name} (${actor.totalPoints.toLocaleString()} vs ${rival.totalPoints.toLocaleString()})`
    );
  }

  tracker.leaderSlot = nextLeader;
  return events;
}

export function computeDuelPvpTakedownReward(elapsedSeconds: number = 0): number {
  const escalation = elapsedSeconds >= 60 ? 1.1 : 1.0;
  return Math.round(PVP_TAKEDOWN_BASE_POINTS * escalation);
}

export function buildDuelInviteUrl(origin: string, roomCode: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanCode = roomCode.toUpperCase().trim();
  return `${cleanOrigin}/?duel=${encodeURIComponent(cleanCode)}`;
}

export function buildDuelWatchUrl(origin: string, roomCode: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const cleanCode = roomCode.toUpperCase().trim();
  return `${cleanOrigin}/?watch=${encodeURIComponent(cleanCode)}`;
}

export function parseDuelInviteFromSearch(
  search: string
): { roomCode: string; spectate: boolean } | null {
  try {
    const params = new URLSearchParams(search);
    const watchRaw = params.get('watch');
    if (watchRaw) {
      const cleaned = watchRaw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
      if (cleaned.length >= 4) return { roomCode: cleaned, spectate: true };
    }
    const duelRaw = params.get('duel') || params.get('room') || '';
    const cleaned = duelRaw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    if (cleaned.length >= 4) {
      const spectateFlag = params.get('spectate') === '1' || params.get('spectate') === 'true';
      return { roomCode: cleaned, spectate: spectateFlag };
    }
    return null;
  } catch {
    return null;
  }
}

export function parseDuelCodeFromSearch(search: string): string | null {
  return parseDuelInviteFromSearch(search)?.roomCode || null;
}

export function advanceCyberMomentumOnKill(current: {
  momentumKills: number;
  momentumTimer: number;
  momentumActivations: number;
}): {
  momentumKills: number;
  momentumTimer: number;
  momentumActivations: number;
  triggered: boolean;
} {
  const nextKills = current.momentumKills + 1;
  if (nextKills >= CYBER_MOMENTUM_KILL_THRESHOLD) {
    return {
      momentumKills: 0,
      momentumTimer: CYBER_MOMENTUM_DURATION_SECONDS,
      momentumActivations: current.momentumActivations + 1,
      triggered: true,
    };
  }
  return {
    momentumKills: nextKills,
    momentumTimer: current.momentumTimer,
    momentumActivations: current.momentumActivations,
    triggered: false,
  };
}

export function stepCyberMomentumTimer(momentumTimer: number, dt: number): number {
  return Math.max(0, momentumTimer - Math.max(0, dt));
}

export function getCyberMomentumSpeedMultiplier(momentumTimer: number): number {
  return momentumTimer > 0 ? CYBER_MOMENTUM_SPEED_MULTIPLIER : 1.0;
}

export function resetCyberMomentum(): { momentumKills: number; momentumTimer: number } {
  return { momentumKills: 0, momentumTimer: 0 };
}

export function getDuelEnemyBasePoints(type: EnemyType): number {
  switch (type) {
    case 'swarmer':
      return 100;
    case 'sniper':
      return 180;
    case 'storm_drone':
      return 220;
    case 'tank':
      return 280;
    case 'phantom':
      return 250;
    case 'behemoth':
      return 450;
    case 'goliath':
      return 800;
    default:
      return 100;
  }
}

export function getDuelComboMultiplier(comboStreak: number): number {
  if (comboStreak >= 20) return 2.5;
  if (comboStreak >= 12) return 2.0;
  if (comboStreak >= 6) return 1.5;
  if (comboStreak >= 3) return 1.25;
  return 1.0;
}

export function computeDuelKillReward(
  enemyType: EnemyType,
  comboStreak: number,
  elapsedSeconds: number = 0
): { basePoints: number; comboBonus: number; totalPoints: number } {
  const basePoints = getDuelEnemyBasePoints(enemyType);
  const mult = getDuelComboMultiplier(comboStreak);
  // Small escalation (+10% in final minute) keeps late-duel comebacks exciting
  const escalation = elapsedSeconds >= 60 ? 1.1 : 1.0;
  const scaledTotal = Math.round(basePoints * mult * escalation);
  const comboBonus = Math.max(0, scaledTotal - basePoints);
  return {
    basePoints,
    comboBonus,
    totalPoints: basePoints + comboBonus,
  };
}

export function selectDuelArchetype(
  waveNumber: number,
  level: number,
  rand: () => number = Math.random
): EnemyType {
  const roll = rand();
  if (waveNumber >= 4 && level >= 5 && roll < 0.14) return 'behemoth';
  if (waveNumber >= 3 && roll < 0.30) return 'phantom';
  if (waveNumber >= 2 && roll < 0.48) return 'tank';
  if (roll < 0.66) return 'storm_drone';
  if (roll < 0.82) return 'sniper';
  return 'swarmer';
}

function clampArenaCoord(val: number, max: number, margin: number): number {
  return Math.max(margin, Math.min(max - margin, val));
}

/**
 * Generates strictly symmetric / balanced spawn pairs around Player 1 and Player 2
 * so both players receive identical enemy archetypes, identical counts, and matched distance.
 */
export function generateCompetitiveDuelSpawns(params: {
  p1Pos: { x: number; y: number };
  p2Pos: { x: number; y: number };
  arenaW: number;
  arenaH: number;
  pairsCount: number;
  waveNumber: number;
  level: number;
  spawnSeqStart: number;
  rand?: () => number;
}): DuelCompetitiveSpawn[] {
  const {
    p1Pos,
    p2Pos,
    arenaW,
    arenaH,
    pairsCount,
    waveNumber,
    level,
    spawnSeqStart,
    rand = Math.random,
  } = params;

  const spawns: DuelCompetitiveSpawn[] = [];
  const margin = 75;
  let seq = spawnSeqStart;

  for (let i = 0; i < pairsCount; i++) {
    const sharedType = selectDuelArchetype(waveNumber, level, rand);
    const angleP1 = rand() * Math.PI * 2;
    const angleP2 = (angleP1 + Math.PI) % (Math.PI * 2); // Mirrored opposite angle
    const radius = 340 + rand() * 140;

    const p1X = clampArenaCoord(p1Pos.x + Math.cos(angleP1) * radius, arenaW, margin);
    const p1Y = clampArenaCoord(p1Pos.y + Math.sin(angleP1) * radius, arenaH, margin);

    const p2X = clampArenaCoord(p2Pos.x + Math.cos(angleP2) * radius, arenaW, margin);
    const p2Y = clampArenaCoord(p2Pos.y + Math.sin(angleP2) * radius, arenaH, margin);

    spawns.push({
      spawnId: `duel_${seq++}_p1`,
      type: sharedType,
      x: Math.round(p1X),
      y: Math.round(p1Y),
      assignedTo: 'p1',
    });

    spawns.push({
      spawnId: `duel_${seq++}_p2`,
      type: sharedType,
      x: Math.round(p2X),
      y: Math.round(p2Y),
      assignedTo: 'p2',
    });
  }

  return spawns;
}

export function getDuelLeaderboardOrder(
  p1: DuelPlayerScore,
  p2: DuelPlayerScore
): [DuelPlayerScore, DuelPlayerScore] {
  if (p2.totalPoints > p1.totalPoints) return [p2, p1];
  if (p1.totalPoints > p2.totalPoints) return [p1, p2];
  if (p2.kills > p1.kills) return [p2, p1];
  return [p1, p2];
}

export function sortDuelRosterByScore(players: DuelPlayerScore[]): DuelPlayerScore[] {
  return [...players].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.pvpKills !== a.pvpKills) return b.pvpKills - a.pvpKills;
    if (b.kills !== a.kills) return b.kills - a.kills;
    return a.deaths - b.deaths;
  });
}

export function computeDuelVictorySummary(
  p1: DuelPlayerScore,
  p2: DuelPlayerScore,
  mode: DuelModeType,
  durationSeconds: number,
  level: number,
  killFeed: DuelKillFeedEvent[] = [],
  options?: {
    matchFormat?: DuelMatchFormat;
    mapTheme?: ArenaMapTheme;
    players?: DuelPlayerScore[];
  }
): DuelVictorySummary {
  const matchFormat = options?.matchFormat || 'pvpve_1v1';
  const mapTheme = options?.mapTheme || 'sector';
  const roster = options?.players && options.players.length > 0 ? options.players : [p1, p2];
  const sorted = sortDuelRosterByScore(roster);

  if (matchFormat === 'pvp_team') {
    const teamScores = computeDuelTeamScores(roster);
    const topPlayer = sorted[0] || p1;
    let winningTeam: DuelTeamId | 'tie' = 'tie';
    let winnerName = 'Tie Match';
    if (teamScores.alpha.totalPoints > teamScores.omega.totalPoints) {
      winningTeam = 'alpha';
      winnerName = teamScores.alpha.name;
    } else if (teamScores.omega.totalPoints > teamScores.alpha.totalPoints) {
      winningTeam = 'omega';
      winnerName = teamScores.omega.name;
    } else if (teamScores.alpha.pvpKills > teamScores.omega.pvpKills) {
      winningTeam = 'alpha';
      winnerName = teamScores.alpha.name;
    } else if (teamScores.omega.pvpKills > teamScores.alpha.pvpKills) {
      winningTeam = 'omega';
      winnerName = teamScores.omega.name;
    }

    const totalArenaKills = roster.reduce((sum, p) => sum + p.pvpKills + p.kills, 0);
    return {
      winnerSlot: winningTeam === 'tie' ? 'tie' : topPlayer.slot,
      winnerName,
      isTie: winningTeam === 'tie',
      mode,
      matchFormat,
      mapTheme,
      winningTeam,
      teamScores,
      players: sorted.map((p) => ({ ...p })),
      durationSeconds,
      level,
      totalArenaKills,
      p1: { ...p1 },
      p2: { ...p2 },
      pointMargin: Math.abs(teamScores.alpha.totalPoints - teamScores.omega.totalPoints),
      killMargin: Math.abs(teamScores.alpha.pvpKills - teamScores.omega.pvpKills),
      killFeed: killFeed.slice(),
    };
  }

  if (options?.players && options.players.length > 2) {
    const top1 = sorted[0];
    const top2 = sorted[1] || top1;
    const isTie =
      top1.totalPoints === top2.totalPoints &&
      top1.pvpKills === top2.pvpKills &&
      top1.kills === top2.kills;
    const totalArenaKills = roster.reduce((sum, p) => sum + p.pvpKills + p.kills, 0);
    return {
      winnerSlot: isTie ? 'tie' : top1.slot,
      winnerName: isTie ? 'Tie Match' : top1.name,
      isTie,
      mode,
      matchFormat,
      mapTheme,
      players: sorted.map((p) => ({ ...p })),
      durationSeconds,
      level,
      totalArenaKills,
      p1: { ...p1 },
      p2: { ...p2 },
      pointMargin: Math.abs(top1.totalPoints - top2.totalPoints),
      killMargin: Math.abs(top1.pvpKills + top1.kills - (top2.pvpKills + top2.kills)),
      killFeed: killFeed.slice(),
    };
  }

  const totalArenaKills = p1.kills + p2.kills + (isPurePvpFormat(matchFormat) ? p1.pvpKills + p2.pvpKills : 0);
  const pointMargin = Math.abs(p1.totalPoints - p2.totalPoints);
  const killMargin = Math.abs(p1.kills - p2.kills);

  let winnerSlot: DuelSlotId | 'tie' = 'tie';
  let winnerName = 'Tie Match';

  if (p1.totalPoints > p2.totalPoints) {
    winnerSlot = 'p1';
    winnerName = p1.name;
  } else if (p2.totalPoints > p1.totalPoints) {
    winnerSlot = 'p2';
    winnerName = p2.name;
  } else if (p1.pvpKills + p1.kills > p2.pvpKills + p2.kills) {
    winnerSlot = 'p1';
    winnerName = p1.name;
  } else if (p2.pvpKills + p2.kills > p1.pvpKills + p1.kills) {
    winnerSlot = 'p2';
    winnerName = p2.name;
  }

  return {
    winnerSlot,
    winnerName,
    isTie: winnerSlot === 'tie',
    mode,
    matchFormat,
    mapTheme,
    players: sorted.map((p) => ({ ...p })),
    durationSeconds,
    level,
    totalArenaKills,
    p1: { ...p1 },
    p2: { ...p2 },
    pointMargin,
    killMargin,
    killFeed: killFeed.slice(),
  };
}
