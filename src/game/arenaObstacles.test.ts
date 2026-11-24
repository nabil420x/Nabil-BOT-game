import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CYBER_FOREST_BACKDROP_SRC,
  buildArenaObstacles,
  resolveCircleObstacleCollisions,
  checkProjectileObstacleHit,
  getSafeArenaSpawnPoint,
} from './arenaObstacles';

test('buildArenaObstacles produces symmetric walls, cyber trees, crystals, and crates for crystal ruins and empty for sector', () => {
  assert.equal(buildArenaObstacles('sector').length, 0);

  const obstacles = buildArenaObstacles('cyber_forest_ruins', 2200, 1600);
  assert.ok(obstacles.length >= 12);
  assert.ok(obstacles.some((o) => o.kind === 'wall'));
  assert.ok(obstacles.some((o) => o.kind === 'tree'));
  assert.ok(obstacles.some((o) => o.kind === 'crystal'));
  assert.ok(obstacles.some((o) => o.kind === 'crate'));
  assert.equal(CYBER_FOREST_BACKDROP_SRC, '/assets/aistudio/image_b2497551_f5b1d164.jpg');
});

test('resolveCircleObstacleCollisions pushes overlapping players smoothly clear of walls and trees', () => {
  const obstacles = buildArenaObstacles('cyber_forest_ruins', 2200, 1600);
  const tree = obstacles.find((o) => o.kind === 'tree')!;
  const wall = obstacles.find((o) => o.kind === 'wall')!;

  // Player inside tree radius
  const resTree = resolveCircleObstacleCollisions(tree.x + 8, tree.y, 18, obstacles, 2200, 1600);
  assert.equal(resTree.collided, true);
  assert.ok(Math.hypot(resTree.x - tree.x, resTree.y - tree.y) >= (tree.radius || 0) + 17.9);

  // Player inside rectangular frosted wall
  const resWall = resolveCircleObstacleCollisions(wall.x, wall.y - 5, 18, obstacles, 2200, 1600);
  assert.equal(resWall.collided, true);
  const hw = (wall.w || 0) / 2;
  const hh = (wall.h || 0) / 2;
  const stillInside =
    Math.abs(resWall.x - wall.x) < hw + 17.5 && Math.abs(resWall.y - wall.y) < hh + 17.5;
  assert.equal(stillInside, false);

  // Player in open center lane should pass untouched
  const openRes = resolveCircleObstacleCollisions(1100, 800, 18, obstacles, 2200, 1600);
  assert.equal(openRes.collided, false);
  assert.equal(openRes.x, 1100);
  assert.equal(openRes.y, 800);
});

test('checkProjectileObstacleHit detects bullets hitting trees and frosted bunker walls', () => {
  const obstacles = buildArenaObstacles('cyber_forest_ruins', 2200, 1600);
  const tree = obstacles.find((o) => o.kind === 'tree')!;
  const wall = obstacles.find((o) => o.kind === 'wall')!;

  assert.equal(checkProjectileObstacleHit(tree.x, tree.y, 6, obstacles)?.id, tree.id);
  assert.equal(checkProjectileObstacleHit(wall.x, wall.y, 6, obstacles)?.id, wall.id);
  assert.equal(checkProjectileObstacleHit(1100, 800, 6, obstacles), null);
});

test('getSafeArenaSpawnPoint guarantees all team and solo spawns stay clear of obstacles', () => {
  const obstacles = buildArenaObstacles('cyber_forest_ruins', 2200, 1600);

  for (let idx = 0; idx < 6; idx++) {
    const soloSpawn = getSafeArenaSpawnPoint({
      slotIndex: idx,
      totalSlots: 6,
      isTeamMode: false,
      obstacles,
      arenaW: 2200,
      arenaH: 1600,
    });
    assert.equal(checkProjectileObstacleHit(soloSpawn.x, soloSpawn.y, 20, obstacles), null);

    const teamSpawn = getSafeArenaSpawnPoint({
      slotIndex: Math.floor(idx / 2),
      totalSlots: 6,
      team: idx % 2 === 0 ? 'alpha' : 'omega',
      isTeamMode: true,
      obstacles,
      arenaW: 2200,
      arenaH: 1600,
    });
    assert.equal(checkProjectileObstacleHit(teamSpawn.x, teamSpawn.y, 20, obstacles), null);
  }
});
