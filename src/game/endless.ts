import type { DifficultyMode, EndlessRecord, EndlessWaveConfig } from './types';
import { getDifficultyModifier } from './rules';

export const ENDLESS_RECORD_STORAGE_KEY = 'nabilbot_endless_record_v1';

export function createInitialEndlessRecord(): EndlessRecord {
  return {
    bestWave: 0,
    bestScore: 0,
    totalRuns: 0,
    totalBossesPurged: 0,
  };
}

/**
 * Computes progressive wave scaling for Endless Overdrive Mode.
 * Boss waves strike every 3rd wave, scaling up to dual-boss encounters at wave 9+.
 */
export function computeEndlessWaveConfig(
  wave: number,
  difficulty: DifficultyMode = 'normal'
): EndlessWaveConfig {
  const safeWave = Math.max(1, Math.floor(wave));
  const diffMod = getDifficultyModifier(difficulty);
  const effectiveLevel = Math.min(100, 1 + Math.floor((safeWave - 1) * 3.5));

  const rawBudget = 640 + (safeWave - 1) * 290 + Math.floor(Math.pow(safeWave, 1.35) * 45);
  const totalBudget = Math.round(rawBudget * diffMod.budgetMultiplier);

  const rawMaxSim = Math.min(28, 7 + Math.floor(safeWave * 1.35) + diffMod.maxSimultaneousOffset);
  const maxSimultaneous = Math.max(4, rawMaxSim);

  const baseDelay = Math.max(0.28, 1.15 - safeWave * 0.045);
  const spawnDelaySec = Number((baseDelay * diffMod.spawnDelayMultiplier).toFixed(3));

  const isBossWave = safeWave % 3 === 0;
  const bossCount = isBossWave ? (safeWave >= 9 ? 2 : 1) : 0;

  return {
    wave: safeWave,
    effectiveLevel,
    totalBudget,
    maxSimultaneous,
    spawnDelaySec,
    isBossWave,
    bossCount,
  };
}

/**
 * Computes bonus Coins, Diamonds, and Score awarded when clearing an Endless wave.
 */
export function computeEndlessWaveClearReward(wave: number): {
  coins: number;
  diamonds: number;
  scoreBonus: number;
} {
  const safeWave = Math.max(1, Math.floor(wave));
  const isBossWave = safeWave % 3 === 0;
  return {
    coins: 45 + safeWave * 18 + (isBossWave ? 65 : 0),
    diamonds: isBossWave ? 1 : 0,
    scoreBonus: safeWave * 150 + (isBossWave ? 400 : 0),
  };
}

export function applyEndlessProgressState(
  record: EndlessRecord,
  update: { wave?: number; score?: number; newRun?: boolean; bossKilled?: boolean }
): EndlessRecord {
  const wave = Math.max(0, Math.floor(update.wave ?? 0));
  const score = Math.max(0, Math.floor(update.score ?? 0));
  return {
    bestWave: Math.max(record.bestWave, wave),
    bestScore: Math.max(record.bestScore, score),
    totalRuns: record.totalRuns + (update.newRun ? 1 : 0),
    totalBossesPurged: record.totalBossesPurged + (update.bossKilled ? 1 : 0),
  };
}

export function loadEndlessRecord(): EndlessRecord {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createInitialEndlessRecord();
  }
  try {
    const raw = localStorage.getItem(ENDLESS_RECORD_STORAGE_KEY);
    if (!raw) return createInitialEndlessRecord();
    const parsed = JSON.parse(raw) as Partial<EndlessRecord>;
    return {
      bestWave: Math.max(0, Number(parsed.bestWave) || 0),
      bestScore: Math.max(0, Number(parsed.bestScore) || 0),
      totalRuns: Math.max(0, Number(parsed.totalRuns) || 0),
      totalBossesPurged: Math.max(0, Number(parsed.totalBossesPurged) || 0),
    };
  } catch {
    return createInitialEndlessRecord();
  }
}

export function saveEndlessRecord(record: EndlessRecord): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(ENDLESS_RECORD_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Ignore storage quota errors
  }
}

export function recordEndlessMilestone(update: {
  wave?: number;
  score?: number;
  newRun?: boolean;
  bossKilled?: boolean;
}): EndlessRecord {
  const current = loadEndlessRecord();
  const next = applyEndlessProgressState(current, update);
  saveEndlessRecord(next);
  return next;
}
