import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TACTICAL_WALL_DEPLOY_DISTANCE,
  TACTICAL_WALL_MAX_CHARGES,
  TACTICAL_WALL_MAX_HP,
  applyDamageToTacticalWall,
  canProjectileHitTacticalWall,
  checkCircleTacticalWallHit,
  computeWallPlacement,
  consumeTacticalWallCharge,
  createInitialTacticalWallChargeState,
  createTacticalWall,
  enforceOwnerWallCap,
  findProjectileTacticalWallHit,
  resolveCircleTacticalWallCollisions,
  stepTacticalWallChargeState,
  stepTacticalWalls,
} from './duelWalls.ts';

test('wall placement positions shield ahead along player aim and clamps safely inside arena', () => {
  const rightAim = computeWallPlacement({
    playerX: 400,
    playerY: 500,
    angle: 0,
    arenaW: 2200,
    arenaH: 1600,
  });
  assert.equal(rightAim.x, 400 + TACTICAL_WALL_DEPLOY_DISTANCE);
  assert.equal(rightAim.y, 500);

  const cornerClamp = computeWallPlacement({
    playerX: 15,
    playerY: 15,
    angle: Math.PI,
    arenaW: 2200,
    arenaH: 1600,
  });
  assert.equal(cornerClamp.x, 48);
  assert.equal(cornerClamp.y, 48);
});

test('wall blocks EVERY shot (owner, teammate, enemy, bot) and shatters at 0 HP', () => {
  const wall = createTacticalWall({
    id: 'w1',
    ownerSlot: 'p1',
    ownerTeam: 'alpha',
    color: '#00f3ff',
    x: 600,
    y: 500,
    angle: 0, // facing right: blocks vertical X=600 corridor +/-56px along Y
  });

  // Owner's own shots cannot pass through the wall
  assert.equal(
    canProjectileHitTacticalWall({
      wall,
      projectileOwnerSlot: 'p1',
      projectileOwnerTeam: 'alpha',
      matchFormat: 'pvp_team',
    }),
    true
  );

  // Teammate's shots also cannot pass through the wall
  assert.equal(
    canProjectileHitTacticalWall({
      wall,
      projectileOwnerSlot: 'p3',
      projectileOwnerTeam: 'alpha',
      matchFormat: 'pvp_team',
    }),
    true
  );

  // Enemy player fires into the wall -> blocked (including fast swept segment)
  const hit = findProjectileTacticalWallHit({
    prevX: 650,
    prevY: 510,
    x: 560, // even if projectile skipped past X=600 in 1 tick!
    y: 510,
    radius: 6,
    walls: [wall],
    projectileOwnerSlot: 'p2',
    projectileOwnerTeam: 'omega',
    matchFormat: 'pvp_solo',
  });
  assert.ok(hit, 'Swept enemy projectile should strike wall instead of tunneling');
  assert.equal(hit?.wall.id, 'w1');

  // Owner firing directly into own wall -> blocked at origin/swept segment too
  const ownerHit = findProjectileTacticalWallHit({
    prevX: 595, // spawning near/inside wall face
    prevY: 500,
    x: 640,
    y: 500,
    radius: 6,
    walls: [wall],
    projectileOwnerSlot: 'p1',
    projectileOwnerTeam: 'alpha',
    matchFormat: 'pvp_solo',
  });
  assert.ok(ownerHit, 'Owner projectile must not pass through their own shield wall');

  // Enemy shot wide outside halfWidth misses the wall cleanly
  const miss = findProjectileTacticalWallHit({
    prevX: 650,
    prevY: 620,
    x: 560,
    y: 620,
    radius: 6,
    walls: [wall],
    projectileOwnerSlot: 'p2',
    projectileOwnerTeam: 'omega',
    matchFormat: 'pvp_solo',
  });
  assert.equal(miss, null);

  // Sustained firing damages and eventually destroys the wall
  const dmg1 = applyDamageToTacticalWall(wall, 80);
  assert.equal(dmg1.destroyed, false);
  assert.equal(dmg1.wall.hp, TACTICAL_WALL_MAX_HP - 80);

  const dmg2 = applyDamageToTacticalWall(dmg1.wall, 120);
  assert.equal(dmg2.destroyed, true);
  assert.equal(dmg2.wall.hp, 0);

  // Destroyed walls no longer block projectiles
  const afterDestroy = findProjectileTacticalWallHit({
    prevX: 650,
    prevY: 510,
    x: 560,
    y: 510,
    radius: 6,
    walls: [dmg2.wall],
    projectileOwnerSlot: 'p2',
    projectileOwnerTeam: 'omega',
    matchFormat: 'pvp_solo',
  });
  assert.equal(afterDestroy, null);
});

test('OBB ship pushout slides ships smoothly outside wall boundaries at angled rotations', () => {
  const angledWall = createTacticalWall({
    id: 'w_rot',
    ownerSlot: 'p2',
    color: '#ff0077',
    x: 800,
    y: 600,
    angle: Math.PI / 4, // 45 degrees
  });

  const hitCheck = checkCircleTacticalWallHit(802, 602, 18, angledWall);
  assert.equal(hitCheck.hit, true);

  const pushed = resolveCircleTacticalWallCollisions(802, 602, 18, [angledWall], 2200, 1600);
  assert.equal(pushed.collided, true);
  const recheck = checkCircleTacticalWallHit(pushed.x, pushed.y, 17.5, angledWall);
  assert.equal(recheck.hit, false);
});

test('wall charge cooldown, active cap eviction, and default persistence until destroyed stay deterministic', () => {
  let state = createInitialTacticalWallChargeState();
  assert.equal(state.charges, TACTICAL_WALL_MAX_CHARGES);

  const c1 = consumeTacticalWallCharge(state);
  assert.equal(c1.consumed, true);
  assert.equal(c1.nextState.charges, TACTICAL_WALL_MAX_CHARGES - 1);

  const c2 = consumeTacticalWallCharge(c1.nextState);
  assert.equal(c2.consumed, true);
  assert.equal(c2.nextState.charges, 0);

  const empty = consumeTacticalWallCharge(c2.nextState);
  assert.equal(empty.consumed, false);

  state = stepTacticalWallChargeState(c2.nextState, c2.nextState.cooldownTotal + 0.1);
  assert.equal(state.charges, 1);

  const defaultWall = createTacticalWall({
    id: 'auto_3s',
    ownerSlot: 'p1',
    color: '#00f3ff',
    x: 420,
    y: 360,
    angle: 0.4,
  });
  assert.equal(defaultWall.ttl, 3);
  const beforeExpiry = stepTacticalWalls([defaultWall], 2.9);
  assert.equal(beforeExpiry.expiredIds.length, 0);
  assert.equal(beforeExpiry.walls.length, 1);
  assert.equal(beforeExpiry.walls[0].x, 420);
  assert.equal(beforeExpiry.walls[0].y, 360);

  const atExpiry = stepTacticalWalls(beforeExpiry.walls, 0.15);
  assert.deepEqual(atExpiry.expiredIds, ['auto_3s']);
  assert.equal(atExpiry.walls.length, 0);

  const list = [
    createTacticalWall({ id: '1', ownerSlot: 'p1', color: '#00f3ff', x: 100, y: 100, angle: 0, ttl: 10 }),
    createTacticalWall({ id: '2', ownerSlot: 'p1', color: '#00f3ff', x: 200, y: 100, angle: 0, ttl: 2 }),
    createTacticalWall({ id: '3', ownerSlot: 'p1', color: '#00f3ff', x: 300, y: 100, angle: 0, ttl: 10 }),
  ];
  const capped = enforceOwnerWallCap(list, 'p1', 2);
  assert.deepEqual(capped.map((w) => w.id), ['2', '3']);

  const stepped = stepTacticalWalls(capped, 3);
  assert.deepEqual(stepped.expiredIds, ['2']);
  assert.deepEqual(stepped.walls.map((w) => w.id), ['3']);
});
