import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUGMENT_ORDER,
  CYBER_AUGMENTS,
  MULTI_KILL_WINDOW_SEC,
  OVERDRIVE_DURATION_SEC,
  applyAugmentSelection,
  computeAugmentModifiers,
  computeGoldenCoreJackpot,
  computeWingmanOrbitPosition,
  createEmptyAugments,
  createGoldenDataCore,
  createInitialMultiKillState,
  rollAugmentDraftChoices,
  selectWingmanTarget,
  stepGoldenDataCore,
  stepMultiKillStreak,
} from './augments.ts';
import type { Enemy } from './types.ts';

test('rollAugmentDraftChoices returns distinct unmaxed chips and respects maxStacks', () => {
  const empty = createEmptyAugments();
  const choices = rollAugmentDraftChoices(empty, 3, () => 0.42);
  assert.equal(choices.length, 3);
  const ids = new Set(choices.map((c) => c.def.id));
  assert.equal(ids.size, 3);
  for (const c of choices) {
    assert.equal(c.currentLevel, 0);
    assert.equal(c.nextLevel, 1);
  }

  // Max out all except 2 chips -> should return only those 2
  const nearlyMaxed = createEmptyAugments();
  for (const id of AUGMENT_ORDER) {
    nearlyMaxed[id] = CYBER_AUGMENTS[id].maxStacks;
  }
  nearlyMaxed.wingman_drone = 1;
  nearlyMaxed.chain_arc = 2;

  const remChoices = rollAugmentDraftChoices(nearlyMaxed, 3, () => 0.1);
  assert.equal(remChoices.length, 2);
  const remIds = remChoices.map((c) => c.def.id).sort();
  assert.deepEqual(remIds, ['chain_arc', 'wingman_drone']);

  // All maxed -> returns empty array
  nearlyMaxed.wingman_drone = CYBER_AUGMENTS.wingman_drone.maxStacks;
  nearlyMaxed.chain_arc = CYBER_AUGMENTS.chain_arc.maxStacks;
  assert.deepEqual(rollAugmentDraftChoices(nearlyMaxed, 3), []);
});

test('applyAugmentSelection increments stack up to maxStacks', () => {
  let augs = createEmptyAugments();
  const maxW = CYBER_AUGMENTS.wingman_drone.maxStacks;
  for (let i = 0; i < maxW + 3; i++) {
    augs = applyAugmentSelection(augs, 'wingman_drone');
  }
  assert.equal(augs.wingman_drone, maxW);
});

test('computeAugmentModifiers calculates combined stack bonuses accurately', () => {
  const baseMods = computeAugmentModifiers(createEmptyAugments());
  assert.equal(baseMods.wingmanCount, 0);
  assert.equal(baseMods.chainArcTargets, 0);
  assert.equal(baseMods.ricochetBounces, 0);
  assert.equal(baseMods.cryoSlowFactor, 1.0);
  assert.equal(baseMods.fireRateMult, 1.0);

  const stacked = {
    wingman_drone: 2,
    chain_arc: 2,
    vampiric_core: 2,
    ricochet_rounds: 2,
    cryo_aura: 2,
    overclock_vents: 2,
    magnet_greed: 2,
  };
  const mods = computeAugmentModifiers(stacked);
  assert.equal(mods.wingmanCount, 2);
  assert.equal(mods.chainArcTargets, 3);
  assert.ok(mods.chainArcDamageRatio > 0.5);
  assert.equal(mods.vampiricShieldPerKill, 12);
  assert.equal(mods.vampiricHpEveryKills, 4);
  assert.equal(mods.ricochetBounces, 2);
  assert.equal(mods.bonusPierce, 2);
  assert.ok(mods.cryoAuraRadius > 200);
  assert.ok(mods.cryoSlowFactor < 0.7);
  assert.ok(mods.fireRateMult > 1.3);
  assert.ok(mods.damageMult > 1.25);
  assert.ok(mods.heatReduction > 0.3);
  assert.equal(mods.magnetRadiusBonus, 280);
  assert.equal(mods.coinMult, 1.5);
  assert.equal(mods.scoreMult, 1.5);
});

test('computeWingmanOrbitPosition and selectWingmanTarget handle orbital spread and KO skipping', () => {
  const d0 = computeWingmanOrbitPosition(500, 500, 0, 2, 0, 50);
  const d1 = computeWingmanOrbitPosition(500, 500, 1, 2, 0, 50);
  // 2 drones at t=0 should be opposite each other on X axis
  assert.ok(Math.abs(d0.x - 550) < 0.01);
  assert.ok(Math.abs(d1.x - 450) < 0.01);

  const enemies: Array<Pick<Enemy, 'id' | 'x' | 'y' | 'state'>> = [
    { id: 1, x: 520, y: 500, state: 'ko' }, // closest but already KO
    { id: 2, x: 700, y: 500, state: 'seek' }, // alive & nearest valid
    { id: 3, x: 1400, y: 500, state: 'seek' }, // out of range
  ];
  const target = selectWingmanTarget(500, 500, enemies, 580);
  assert.ok(target !== null);
  assert.equal(target.id, 2);
  assert.equal(target.dist, 200);
});

test('stepMultiKillStreak escalates tiers inside window and resets on expiry', () => {
  let state = createInitialMultiKillState();
  let step = stepMultiKillStreak(state, true, 0);
  state = step.state;
  assert.equal(state.count, 1);
  assert.equal(step.triggeredTier, 0);

  step = stepMultiKillStreak(state, true, 0.3);
  state = step.state;
  assert.equal(state.count, 2);
  assert.equal(step.triggeredTier, 2);
  assert.ok(step.label.includes('DOUBLE PURGE'));

  step = stepMultiKillStreak(state, true, 0.2);
  state = step.state;
  assert.equal(step.triggeredTier, 3);
  assert.ok(step.label.includes('TRIPLE SURGE'));

  step = stepMultiKillStreak(state, true, 0.2);
  state = step.state;
  assert.equal(step.triggeredTier, 4);
  assert.ok(step.label.includes('ULTRA BREACH'));

  step = stepMultiKillStreak(state, true, 0.2);
  state = step.state;
  assert.equal(step.triggeredTier, 5);
  assert.ok(step.label.includes('MEGA OVERLOAD'));

  step = stepMultiKillStreak(state, true, 0.2);
  state = step.state;
  assert.equal(step.triggeredTier, 6);
  assert.ok(step.label.includes('CYBER GODLIKE!'));

  // Advance past window -> resets cleanly
  const expired = stepMultiKillStreak(state, false, MULTI_KILL_WINDOW_SEC + 0.5);
  assert.equal(expired.state.count, 0);
  assert.equal(expired.state.timer, 0);
});

test('Golden Data-Core stays inside arena bounds and grants jackpot rewards', () => {
  let core = createGoldenDataCore(99, 2200, 1600, 10, 'normal', () => 0.5);
  assert.ok(core.hp > 0);
  assert.ok(core.life > 0);

  for (let i = 0; i < 60; i++) {
    core = stepGoldenDataCore(core, core.x + 20, core.y + 10, 0.05, 2200, 1600);
    assert.ok(core.x >= core.radius + 70 - 0.01);
    assert.ok(core.x <= 2200 - (core.radius + 70) + 0.01);
    assert.ok(core.y >= core.radius + 70 - 0.01);
    assert.ok(core.y <= 1600 - (core.radius + 70) + 0.01);
  }

  const jackpot = computeGoldenCoreJackpot(10);
  assert.equal(jackpot.diamonds, 1);
  assert.equal(jackpot.overdriveSeconds, OVERDRIVE_DURATION_SEC);
  assert.ok(jackpot.coinCount >= 6);
  assert.ok(jackpot.score > 400);
});

test('rollAugmentDraftChoices with allowOverclockFallback always yields 3 chips for every level clear across 100 levels', () => {
  const allMaxed = createEmptyAugments();
  for (const id of AUGMENT_ORDER) {
    allMaxed[id] = CYBER_AUGMENTS[id].maxStacks;
  }

  // Default behavior still returns []
  assert.deepEqual(rollAugmentDraftChoices(allMaxed, 3, () => 0.3), []);

  // Overclock fallback ALWAYS yields 3 distinct chips so every level clear offers a draft
  const surgeChoices = rollAugmentDraftChoices(allMaxed, 3, () => 0.3, true);
  assert.equal(surgeChoices.length, 3);
  assert.equal(new Set(surgeChoices.map((c) => c.def.id)).size, 3);
  for (const choice of surgeChoices) {
    assert.equal(choice.isOverclockSurge, true);
    assert.equal(choice.nextLevel, choice.currentLevel + 1);
  }

  const boosted = applyAugmentSelection(allMaxed, surgeChoices[0].def.id, true);
  assert.equal(boosted[surgeChoices[0].def.id], CYBER_AUGMENTS[surgeChoices[0].def.id].maxStacks + 1);

  const baseMaxMods = computeAugmentModifiers(allMaxed);
  const surgedMods = computeAugmentModifiers(boosted);
  assert.ok(surgedMods.damageMult > baseMaxMods.damageMult);
  assert.ok(surgedMods.fireRateMult > baseMaxMods.fireRateMult);
  assert.ok(surgedMods.coinMult > baseMaxMods.coinMult);
});
