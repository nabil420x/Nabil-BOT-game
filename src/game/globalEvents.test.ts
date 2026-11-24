import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BONUS_EVENT_CHALLENGES,
  GLOBAL_EVENT_DURATION_MS,
  GLOBAL_EVENT_EPOCH_MS,
  GLOBAL_EVENT_ROTATION,
  NEON_CRAFT_SKINS,
  applyGlobalEventProgress,
  areAllEventObjectivesComplete,
  claimBonusEventChallengeState,
  claimGlobalEventNeonSkinState,
  claimGlobalEventObjectiveState,
  createInitialGlobalEventState,
  equipCraftSkinState,
  formatCountdown48h,
  getGlobalEventWindow,
  syncStateWithClock,
} from './globalEvents';

test('48-hour global event clock calculates accurate window, countdown, and rotates every 48h', () => {
  const t0 = GLOBAL_EVENT_EPOCH_MS + 1000 * 60 * 30; // +30m into Cycle 0
  const w0 = getGlobalEventWindow(t0);
  assert.equal(w0.cycleIndex, 0);
  assert.equal(w0.eventDef.id, GLOBAL_EVENT_ROTATION[0].id);
  assert.equal(w0.remainingMs, GLOBAL_EVENT_DURATION_MS - 1000 * 60 * 30);
  assert.equal(formatCountdown48h(w0.remainingMs), '47h 30m 00s');

  // Exactly 48 hours later -> Cycle 1
  const t1 = t0 + GLOBAL_EVENT_DURATION_MS;
  const w1 = getGlobalEventWindow(t1);
  assert.equal(w1.cycleIndex, 1);
  assert.equal(w1.eventDef.id, GLOBAL_EVENT_ROTATION[1].id);
  assert.notEqual(w1.eventDef.rewardCraftId, w0.eventDef.rewardCraftId);

  // Across all 11 cycles, every craft gets its exclusive Neon skin spotlighted
  assert.equal(GLOBAL_EVENT_ROTATION.length, 11);
  const rewardCrafts = new Set(
    GLOBAL_EVENT_ROTATION.map((_, i) =>
      getGlobalEventWindow(GLOBAL_EVENT_EPOCH_MS + i * GLOBAL_EVENT_DURATION_MS).eventDef.rewardCraftId
    )
  );
  assert.equal(rewardCrafts.size, 11);
  for (const craftId of rewardCrafts) {
    assert.ok(NEON_CRAFT_SKINS[craftId]);
    assert.equal(NEON_CRAFT_SKINS[craftId].skinId, 'neon');
  }
});

test('global event tracks special objectives, awards sub-rewards, and unlocks exclusive Neon Craft Skin', () => {
  const now = GLOBAL_EVENT_EPOCH_MS + 5000;
  let state = createInitialGlobalEventState(now);
  assert.equal(state.objectives.length, 3);
  assert.equal(areAllEventObjectivesComplete(state), false);

  // Cycle 0 objectives: kills_total (40), augments_installed (3), collect_coins (80)
  const p1 = applyGlobalEventProgress(state, 'kills_total', 40, now);
  assert.equal(p1.changed, true);
  assert.equal(p1.newlyCompleted.length, 1);
  state = p1.nextState;

  // Cannot claim Neon skin before all 3 objectives complete
  const earlyClaim = claimGlobalEventNeonSkinState(state, now);
  assert.equal(earlyClaim.success, false);

  state = applyGlobalEventProgress(state, 'augments_installed', 3, now).nextState;
  state = applyGlobalEventProgress(state, 'collect_coins', 80, now).nextState;
  assert.equal(areAllEventObjectivesComplete(state), true);

  // Claim objective reward once (idempotent guard on double-claim)
  const objId = state.objectives[0].id;
  const objClaim1 = claimGlobalEventObjectiveState(state, objId, now);
  assert.equal(objClaim1.success, true);
  assert.ok(objClaim1.rewardCoins > 0);
  assert.ok(objClaim1.rewardDiamonds > 0);
  state = objClaim1.nextState;

  const objClaim2 = claimGlobalEventObjectiveState(state, objId, now);
  assert.equal(objClaim2.success, false);

  // Claim Exclusive Neon Skin
  const skinClaim = claimGlobalEventNeonSkinState(state, now);
  assert.equal(skinClaim.success, true);
  assert.equal(skinClaim.craftId, 'vanguard_alpha');
  assert.equal(skinClaim.nextState.skinClaimed, true);
  assert.equal(skinClaim.nextState.unlockedNeonSkins.vanguard_alpha, true);
  assert.equal(skinClaim.nextState.equippedSkins.vanguard_alpha, 'neon');
});

test('48-hour rotation resets event objectives cleanly while preserving permanently unlocked Neon skins', () => {
  const t0 = GLOBAL_EVENT_EPOCH_MS + 1000;
  let state = createInitialGlobalEventState(t0);
  state = applyGlobalEventProgress(state, 'kills_total', 40, t0).nextState;
  state = applyGlobalEventProgress(state, 'augments_installed', 3, t0).nextState;
  state = applyGlobalEventProgress(state, 'collect_coins', 80, t0).nextState;
  state = claimGlobalEventNeonSkinState(state, t0).nextState;

  // Advance by 48 hours to Cycle 1 (Neon Phantom Eclipse)
  const t1 = t0 + GLOBAL_EVENT_DURATION_MS;
  const { nextState, rotated } = syncStateWithClock(state, t1);
  assert.equal(rotated, true);
  assert.equal(nextState.cycleIndex, 1);
  assert.equal(nextState.eventId, GLOBAL_EVENT_ROTATION[1].id);
  assert.equal(nextState.skinClaimed, false);
  assert.ok(nextState.objectives.every((o) => o.currentValue === 0 && !o.isCompleted));
  // Unlocked & equipped Neon skin from Cycle 0 stays intact!
  assert.equal(nextState.unlockedNeonSkins.vanguard_alpha, true);
  assert.equal(nextState.equippedSkins.vanguard_alpha, 'neon');

  // Verify peak combo_streak tracking in Cycle 1
  const c1 = applyGlobalEventProgress(nextState, 'combo_streak', 12, t1).nextState;
  assert.equal(c1.objectives.find((o) => o.objectiveType === 'combo_streak')?.currentValue, 12);
  const c2 = applyGlobalEventProgress(c1, 'combo_streak', 8, t1).nextState; // lower value does not regress peak
  assert.equal(c2.objectives.find((o) => o.objectiveType === 'combo_streak')?.currentValue, 12);
  const c3 = applyGlobalEventProgress(c2, 'combo_streak', 22, t1).nextState; // hits target 20
  assert.equal(c3.objectives.find((o) => o.objectiveType === 'combo_streak')?.isCompleted, true);
});

test('equipCraftSkinState guards locked Neon skins and allows toggling unlocked skins', () => {
  const state = createInitialGlobalEventState(GLOBAL_EVENT_EPOCH_MS);
  const lockedTry = equipCraftSkinState(state, 'phantom_shadow', 'neon');
  assert.equal(lockedTry.success, false);

  const unlockedState = {
    ...state,
    unlockedNeonSkins: { vanguard_alpha: true },
  };
  const equipRes = equipCraftSkinState(unlockedState, 'vanguard_alpha', 'neon');
  assert.equal(equipRes.success, true);
  assert.equal(equipRes.nextState.equippedSkins.vanguard_alpha, 'neon');

  const unequipRes = equipCraftSkinState(equipRes.nextState, 'vanguard_alpha', 'default');
  assert.equal(unequipRes.success, true);
  assert.equal(unequipRes.nextState.equippedSkins.vanguard_alpha, 'default');
});

test('bonus special event challenges track barrels_detonated & dash_overcharges and claim rewards idempotently', () => {
  const now = GLOBAL_EVENT_EPOCH_MS + 2000;
  let state = createInitialGlobalEventState(now);
  assert.equal(BONUS_EVENT_CHALLENGES.length, 4);
  assert.equal(state.bonusChallenges?.length, 4);

  // Track barrel detonations & perfect dash overcharges
  state = applyGlobalEventProgress(state, 'barrels_detonated', 10, now).nextState;
  state = applyGlobalEventProgress(state, 'dash_overcharges', 8, now).nextState;

  const barrelChallenge = state.bonusChallenges?.find((c) => c.objectiveType === 'barrels_detonated');
  const dashChallenge = state.bonusChallenges?.find((c) => c.objectiveType === 'dash_overcharges');
  assert.equal(barrelChallenge?.isCompleted, true);
  assert.equal(dashChallenge?.isCompleted, true);

  // Claim bonus challenge reward once (idempotent on double-claim)
  const claim1 = claimBonusEventChallengeState(state, barrelChallenge!.id, now);
  assert.equal(claim1.success, true);
  assert.ok(claim1.rewardCoins > 0);
  assert.ok(claim1.rewardDiamonds > 0);
  state = claim1.nextState;

  const claim2 = claimBonusEventChallengeState(state, barrelChallenge!.id, now);
  assert.equal(claim2.success, false);

  // Rotating 48h cycle preserves evergreen bonus challenge progress & claim status
  const tNext = now + GLOBAL_EVENT_DURATION_MS;
  const synced = syncStateWithClock(state, tNext);
  assert.equal(synced.rotated, true);
  assert.equal(synced.nextState.bonusChallenges?.find((c) => c.objectiveType === 'barrels_detonated')?.isClaimed, true);
  assert.equal(synced.nextState.bonusChallenges?.find((c) => c.objectiveType === 'dash_overcharges')?.isCompleted, true);
});
