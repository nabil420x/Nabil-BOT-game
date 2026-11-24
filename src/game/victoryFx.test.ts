import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_VICTORY_SHARDS,
  MAX_VICTORY_SPARKS,
  createCyberShatterState,
  emitCyberShatterBurst,
  stepCyberShatterState,
} from './victoryFx';

test('createCyberShatterState spawns initial burst of crystalline shards and prism wave', () => {
  const state = createCyberShatterState(1280, 720, false);
  assert.ok(state.shards.length >= 20, 'initial cyber-shatter should spawn shard particles');
  assert.ok(state.rings.length >= 1, 'initial cyber-shatter should emit an octagonal prism ring');
  assert.ok(state.sparks.length > 0, 'initial cyber-shatter should spawn neon streaks');

  for (const shard of state.shards) {
    assert.ok(Number.isFinite(shard.x) && Number.isFinite(shard.y));
    assert.ok(Number.isFinite(shard.vx) && Number.isFinite(shard.vy));
    assert.ok(shard.size > 0 && shard.maxLife > 0);
  }
});

test('createCyberShatterState honors reducedMotion preference', () => {
  const state = createCyberShatterState(1024, 640, true);
  assert.equal(state.reducedMotion, true);
  assert.equal(state.rings.length, 0);
  assert.equal(state.sparks.length, 0);
  for (const shard of state.shards) {
    assert.equal(shard.angularVelocity, 0);
    assert.equal(shard.tiltSpeed, 0);
  }
});

test('emitCyberShatterBurst respects shard and spark caps', () => {
  const state = createCyberShatterState(800, 600, false);
  for (let i = 0; i < 8; i++) {
    emitCyberShatterBurst(state, 400, 300, 50, 1.2);
  }
  assert.ok(state.shards.length <= MAX_VICTORY_SHARDS);
  assert.ok(state.sparks.length <= MAX_VICTORY_SPARKS);
});

test('stepCyberShatterState clamps extreme dt, advances motion, triggers staggered waves, and prunes expired shards', () => {
  const state = createCyberShatterState(1280, 720, false);
  const firstShard = state.shards[0];
  const initialX = firstShard.x;
  const initialY = firstShard.y;

  // Step with oversized dt -> clamped cleanly to <= 0.05s
  stepCyberShatterState(state, 9.0);
  assert.ok(state.elapsed <= 0.051);
  assert.notEqual(firstShard.x, initialX);
  assert.notEqual(firstShard.y, initialY);

  // Advance across staggered follow-up bursts (0.36s, 0.74s)
  for (let i = 0; i < 20; i++) {
    stepCyberShatterState(state, 0.045);
  }
  assert.ok(state.burstStage >= 2, 'follow-up cyber-shatter celebration bursts should trigger');

  // Step far enough without new bursts so existing reduced-motion shards expire cleanly
  const rmState = createCyberShatterState(800, 600, true);
  for (let i = 0; i < 100; i++) {
    stepCyberShatterState(rmState, 0.05);
  }
  assert.equal(rmState.shards.length, 0);
});
