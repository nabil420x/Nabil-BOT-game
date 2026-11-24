import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyEndlessProgressState,
  computeEndlessWaveClearReward,
  computeEndlessWaveConfig,
  createInitialEndlessRecord,
} from './endless';
import {
  applyBarrelDamage,
  computeBarrelExplosionOutcome,
  createArenaBarrel,
} from './arenaObjects';
import {
  SUPPLY_CRATE_COSTS,
  consumeBoostersFromState,
  createInitialSupplyCrateState,
  getSupplyDayKey,
  openSupplyCrateState,
  syncSupplyCrateDay,
} from './supplyCrate';

test('endless mode scales wave budget, effective level, and boss encounters every 3rd wave', () => {
  const w1 = computeEndlessWaveConfig(1, 'normal');
  const w3 = computeEndlessWaveConfig(3, 'normal');
  const w9 = computeEndlessWaveConfig(9, 'nightmare');

  assert.equal(w1.isBossWave, false);
  assert.equal(w1.bossCount, 0);
  assert.equal(w3.isBossWave, true);
  assert.equal(w3.bossCount, 1);
  assert.ok(w3.totalBudget > w1.totalBudget);
  assert.equal(w9.isBossWave, true);
  assert.equal(w9.bossCount, 2);

  const reward1 = computeEndlessWaveClearReward(1);
  const reward3 = computeEndlessWaveClearReward(3);
  assert.equal(reward1.diamonds, 0);
  assert.equal(reward3.diamonds, 1);
  assert.ok(reward3.coins > reward1.coins);

  const rec0 = createInitialEndlessRecord();
  const rec1 = applyEndlessProgressState(rec0, { wave: 4, score: 5200, newRun: true, bossKilled: true });
  assert.equal(rec1.bestWave, 4);
  assert.equal(rec1.bestScore, 5200);
  assert.equal(rec1.totalRuns, 1);
  assert.equal(rec1.totalBossesPurged, 1);
});

test('tactical arena barrels spawn safely away from player and resolve plasma vs cryo detonations', () => {
  const playerX = 1200;
  const playerY = 900;
  const barrel = createArenaBarrel(1, 'cryo', 2400, 1800, playerX, playerY, 4, () => 0.5);
  assert.ok(Math.hypot(barrel.x - playerX, barrel.y - playerY) >= 220);

  const hit1 = applyBarrelDamage(barrel, 10);
  assert.equal(hit1.destroyed, false);
  const hit2 = applyBarrelDamage(hit1.barrel, 500);
  assert.equal(hit2.destroyed, true);

  const cryoBoom = computeBarrelExplosionOutcome(barrel, 4);
  assert.equal(cryoBoom.type, 'cryo');
  assert.ok(cryoBoom.cryoFreezeSeconds > 3.0);

  const plasmaBarrel = { ...barrel, type: 'plasma' as const };
  const plasmaBoom = computeBarrelExplosionOutcome(plasmaBarrel, 4);
  assert.equal(plasmaBoom.type, 'plasma');
  assert.ok(plasmaBoom.damage > cryoBoom.damage);
  assert.equal(plasmaBoom.cryoFreezeSeconds, 0);
});

test('supply crate grants daily free key, enforces coin cost, arms unique boosters, and resets on new day', () => {
  const day1Ms = Date.UTC(2026, 10, 18, 10, 0, 0);
  const day2Ms = Date.UTC(2026, 10, 19, 10, 0, 0);

  const state0 = createInitialSupplyCrateState(day1Ms);
  assert.equal(state0.freeKeys, 1);
  assert.equal(state0.lastDailyResetDay, getSupplyDayKey(day1Ms));

  // Open free daily drop (rng = 0.25 -> booster reward on standard/daily table)
  const freeOpen = openSupplyCrateState(state0, 'daily_free', {
    currentCoins: 0,
    nowMs: day1Ms,
    rng: () => 0.25,
  });
  assert.equal(freeOpen.success, true);
  assert.equal(freeOpen.updatedState.freeKeys, 0);
  assert.equal(freeOpen.updatedState.armedBoosters.length, 1);

  // Second free claim same day must be rejected
  const freeBlocked = openSupplyCrateState(freeOpen.updatedState, 'daily_free', {
    currentCoins: 0,
    nowMs: day1Ms,
  });
  assert.equal(freeBlocked.success, false);

  // Insufficient coins for Apex crate must fail cleanly
  const poorApex = openSupplyCrateState(freeOpen.updatedState, 'apex', {
    currentCoins: SUPPLY_CRATE_COSTS.apex - 10,
    nowMs: day1Ms,
  });
  assert.equal(poorApex.success, false);

  // Next calendar day restores free key while keeping armed boosters
  const syncedDay2 = syncSupplyCrateDay(freeOpen.updatedState, day2Ms);
  assert.equal(syncedDay2.freeKeys, 1);
  assert.equal(syncedDay2.armedBoosters.length, 1);

  // Consuming boosters clears armed queue for the launched run
  const consumedRes = consumeBoostersFromState(syncedDay2);
  assert.equal(consumedRes.consumed.length, 1);
  assert.equal(consumedRes.updatedState.armedBoosters.length, 0);
});
