import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOSS_RUSH_TITANS,
  MAX_BOUNTY_DIAMONDS_PER_RUN,
  computeBossRushStageRewards,
  createBountyContractState,
  getBossRushStageDef,
  projectToRadar,
  resolveBountyCompletion,
  stepBountyContract,
} from './bountyAndBossRush';

test('Boss Rush has 6 progressively scaling Titans and stage rewards', () => {
  assert.equal(BOSS_RUSH_TITANS.length, 6);
  const s1 = getBossRushStageDef(1);
  const s6 = getBossRushStageDef(6);
  assert.ok(s6.hpMultiplier > s1.hpMultiplier);
  assert.ok(s6.speedMultiplier > s1.speedMultiplier);
  assert.ok(s6.coinReward > s1.coinReward);

  const r1 = computeBossRushStageRewards(1);
  const r6 = computeBossRushStageRewards(6);
  assert.equal(r1.diamonds, 1);
  assert.equal(r6.diamonds, 1);
  assert.equal(r1.hpHeal, 2);
  assert.ok(r6.coins > r1.coins);
});

test('HVT Bounty Contract expires when timer reaches zero and enforces diamond cap', () => {
  const contract = createBountyContractState(42, () => 0.1);
  assert.equal(contract.enemyId, 42);
  assert.ok(contract.duration >= 20);
  assert.ok(contract.rewardCoins >= 90);

  const mid = stepBountyContract(contract, 5);
  assert.equal(mid.expired, false);
  assert.equal(mid.contract.timeRemaining, contract.duration - 5);

  const end = stepBountyContract(mid.contract, contract.duration);
  assert.equal(end.expired, true);
  assert.equal(end.contract.timeRemaining, 0);

  const underCap = resolveBountyCompletion(contract, 0);
  assert.equal(underCap.diamondsEarned, 1);
  assert.equal(underCap.totalCoins, contract.rewardCoins);
  assert.equal(underCap.shieldRestore, 50);

  const atCap = resolveBountyCompletion(contract, MAX_BOUNTY_DIAMONDS_PER_RUN);
  assert.equal(atCap.diamondsEarned, 0);
  assert.equal(atCap.totalCoins, contract.rewardCoins + 75);
});

test('projectToRadar maps and clamps world coordinates into radar box', () => {
  const center = projectToRadar(1200, 1200, 2400, 2400, 100, 200, 120);
  assert.equal(center.x, 160);
  assert.equal(center.y, 260);

  const clampedLow = projectToRadar(-500, -100, 2400, 2400, 100, 200, 120);
  assert.equal(clampedLow.x, 100);
  assert.equal(clampedLow.y, 200);

  const clampedHigh = projectToRadar(3000, 3000, 2400, 2400, 100, 200, 120);
  assert.equal(clampedHigh.x, 220);
  assert.equal(clampedHigh.y, 320);
});
