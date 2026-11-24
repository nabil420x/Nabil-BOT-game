import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CYBER_MOMENTUM_DURATION_SECONDS,
  CYBER_MOMENTUM_SPEED_MULTIPLIER,
  formatDuelTimer,
  createInitialDuelPlayerScore,
  generateCompetitiveDuelSpawns,
  computeDuelKillReward,
  getDuelLeaderboardOrder,
  computeDuelVictorySummary,
  advanceCyberMomentumOnKill,
  stepCyberMomentumTimer,
  getCyberMomentumSpeedMultiplier,
  resetCyberMomentum,
  computeDuelPvpTakedownReward,
  buildDuelInviteUrl,
  buildDuelWatchUrl,
  parseDuelCodeFromSearch,
  parseDuelInviteFromSearch,
  createDuelEventTracker,
  evaluateDuelMajorEvents,
  formatDuelElapsedLabel,
  isPurePvpFormat,
  canDamageDuelTarget,
  assignBalancedTeam,
  computeDuelTeamScores,
  computePvpProjectileDamage,
  applyPvpDamageToPool,
} from './duel';

test('formatDuelTimer formats countdown seconds into MM:SS with zero clamping', () => {
  assert.equal(formatDuelTimer(120), '02:00');
  assert.equal(formatDuelTimer(240), '04:00');
  assert.equal(formatDuelTimer(65), '01:05');
  assert.equal(formatDuelTimer(9.2), '00:10');
  assert.equal(formatDuelTimer(0), '00:00');
  assert.equal(formatDuelTimer(-4), '00:00');
});

test('generateCompetitiveDuelSpawns creates balanced 1:1 enemy pairs for both players inside arena bounds', () => {
  const spawns = generateCompetitiveDuelSpawns({
    p1Pos: { x: 400, y: 800 },
    p2Pos: { x: 1800, y: 800 },
    arenaW: 2200,
    arenaH: 1600,
    pairsCount: 3,
    waveNumber: 2,
    level: 5,
    spawnSeqStart: 1,
    rand: () => 0.4,
  });

  assert.equal(spawns.length, 6);
  const p1Spawns = spawns.filter((s) => s.assignedTo === 'p1');
  const p2Spawns = spawns.filter((s) => s.assignedTo === 'p2');
  assert.equal(p1Spawns.length, 3);
  assert.equal(p2Spawns.length, 3);

  for (let i = 0; i < 3; i++) {
    assert.equal(p1Spawns[i].type, p2Spawns[i].type, 'Matched pair must spawn identical enemy type');
    assert.notEqual(p1Spawns[i].spawnId, p2Spawns[i].spawnId);
  }

  for (const s of spawns) {
    assert.ok(s.x >= 75 && s.x <= 2200 - 75);
    assert.ok(s.y >= 75 && s.y <= 1600 - 75);
  }
});

test('computeDuelKillReward accurately breaks down base points and combo bonus points', () => {
  const noStreak = computeDuelKillReward('swarmer', 1, 10);
  assert.equal(noStreak.basePoints, 100);
  assert.equal(noStreak.comboBonus, 0);
  assert.equal(noStreak.totalPoints, 100);

  const highStreak = computeDuelKillReward('tank', 12, 70); // 280 * 2.0 * 1.1 = 616
  assert.equal(highStreak.basePoints, 280);
  assert.equal(highStreak.totalPoints, 616);
  assert.equal(highStreak.comboBonus, 616 - 280);
});

test('getDuelLeaderboardOrder and computeDuelVictorySummary determine winner, margins, and tie states', () => {
  const p1 = createInitialDuelPlayerScore('p1', 'AlphaBot', 10, 150, true);
  const p2 = createInitialDuelPlayerScore('p2', 'NovaBot', 10, 150, true);

  p1.kills = 14;
  p1.baseKillPoints = 1600;
  p1.comboBonusPoints = 400;
  p1.totalPoints = 2000;

  p2.kills = 18;
  p2.baseKillPoints = 2100;
  p2.comboBonusPoints = 650;
  p2.totalPoints = 2750;

  const [first, second] = getDuelLeaderboardOrder(p1, p2);
  assert.equal(first.slot, 'p2');
  assert.equal(second.slot, 'p1');

  const summary = computeDuelVictorySummary(p1, p2, 'local', 120, 1);
  assert.equal(summary.winnerSlot, 'p2');
  assert.equal(summary.winnerName, 'NovaBot');
  assert.equal(summary.isTie, false);
  assert.equal(summary.totalArenaKills, 32);
  assert.equal(summary.pointMargin, 750);
  assert.equal(summary.killMargin, 4);

  // Exact tie scenario
  const tieP1 = createInitialDuelPlayerScore('p1', 'AlphaBot');
  const tieP2 = createInitialDuelPlayerScore('p2', 'NovaBot');
  tieP1.kills = 5;
  tieP1.totalPoints = 500;
  tieP2.kills = 5;
  tieP2.totalPoints = 500;
  const tieSummary = computeDuelVictorySummary(tieP1, tieP2, 'online', 240, 8);
  assert.equal(tieSummary.isTie, true);
  assert.equal(tieSummary.winnerSlot, 'tie');
  assert.equal(tieSummary.totalArenaKills, 10);
});

test('Cyber Momentum triggers on 3 consecutive kills, boosts movement speed, decays over time, and resets on KO', () => {
  let state = { momentumKills: 0, momentumTimer: 0, momentumActivations: 0 };

  const k1 = advanceCyberMomentumOnKill(state);
  assert.equal(k1.triggered, false);
  assert.equal(k1.momentumKills, 1);
  assert.equal(k1.momentumTimer, 0);
  assert.equal(getCyberMomentumSpeedMultiplier(k1.momentumTimer), 1.0);

  const k2 = advanceCyberMomentumOnKill(k1);
  assert.equal(k2.triggered, false);
  assert.equal(k2.momentumKills, 2);
  assert.equal(getCyberMomentumSpeedMultiplier(k2.momentumTimer), 1.0);

  const k3 = advanceCyberMomentumOnKill(k2);
  assert.equal(k3.triggered, true);
  assert.equal(k3.momentumKills, 0);
  assert.equal(k3.momentumActivations, 1);
  assert.equal(k3.momentumTimer, CYBER_MOMENTUM_DURATION_SECONDS);
  assert.equal(getCyberMomentumSpeedMultiplier(k3.momentumTimer), CYBER_MOMENTUM_SPEED_MULTIPLIER);

  // Timer decay & expiration
  const midTimer = stepCyberMomentumTimer(k3.momentumTimer, 2.5);
  assert.equal(midTimer, CYBER_MOMENTUM_DURATION_SECONDS - 2.5);
  assert.equal(getCyberMomentumSpeedMultiplier(midTimer), CYBER_MOMENTUM_SPEED_MULTIPLIER);

  const expiredTimer = stepCyberMomentumTimer(midTimer, 10);
  assert.equal(expiredTimer, 0);
  assert.equal(getCyberMomentumSpeedMultiplier(expiredTimer), 1.0);

  // KO reset clears partial progress and active timer
  const partial = advanceCyberMomentumOnKill({ momentumKills: 1, momentumTimer: 4.0, momentumActivations: 1 });
  const cleared = resetCyberMomentum();
  assert.equal(partial.momentumKills, 2);
  assert.deepEqual(cleared, { momentumKills: 0, momentumTimer: 0 });
});

test('buildDuelInviteUrl, buildDuelWatchUrl, parseDuelCodeFromSearch, parseDuelInviteFromSearch, and computeDuelPvpTakedownReward work cleanly', () => {
  const url = buildDuelInviteUrl('https://example.com/', 'ab7k9p');
  assert.equal(url, 'https://example.com/?duel=AB7K9P');
  const watchUrl = buildDuelWatchUrl('https://example.com/', 'ab7k9p');
  assert.equal(watchUrl, 'https://example.com/?watch=AB7K9P');

  assert.equal(parseDuelCodeFromSearch('?duel=ab7k9p'), 'AB7K9P');
  assert.equal(parseDuelCodeFromSearch('?room=XYZ123'), 'XYZ123');
  assert.equal(parseDuelCodeFromSearch('?watch=sp3c99'), 'SP3C99');
  assert.equal(parseDuelCodeFromSearch('?autostart=1'), null);

  assert.deepEqual(parseDuelInviteFromSearch('?watch=sp3c99'), { roomCode: 'SP3C99', spectate: true });
  assert.deepEqual(parseDuelInviteFromSearch('?duel=ab7k9p&spectate=1'), { roomCode: 'AB7K9P', spectate: true });
  assert.deepEqual(parseDuelInviteFromSearch('?duel=ab7k9p'), { roomCode: 'AB7K9P', spectate: false });
  assert.equal(parseDuelInviteFromSearch('?autostart=1'), null);

  assert.equal(computeDuelPvpTakedownReward(10), 350);
  assert.equal(computeDuelPvpTakedownReward(75), 385);
});

test('Match Kill Feed tracks First Blood, Kill Streaks, Cyber Momentum, PvP Takedowns, Lead Flips, and Comebacks chronologically', () => {
  const tracker = createDuelEventTracker();
  const p1 = createInitialDuelPlayerScore('p1', 'AlphaBot');
  const p2 = createInitialDuelPlayerScore('p2', 'NovaBot');
  const feed = [];

  assert.equal(formatDuelElapsedLabel(0), '00:00');
  assert.equal(formatDuelElapsedLabel(75), '01:15');

  // 1. P1 gets opening kills (1st kill -> First Blood, 3rd kill -> Cyber Momentum + 3x Kill Streak)
  p1.kills = 1;
  p1.comboStreak = 1;
  p1.totalPoints = 100;
  feed.push(
    ...evaluateDuelMajorEvents({
      tracker,
      p1,
      p2,
      actingSlot: 'p1',
      elapsedSeconds: 5,
      killRewardPoints: 100,
    })
  );

  p1.kills = 3;
  p1.comboStreak = 3;
  p1.totalPoints = 400; // >= 250 lead over p2 (0)
  feed.push(
    ...evaluateDuelMajorEvents({
      tracker,
      p1,
      p2,
      actingSlot: 'p1',
      elapsedSeconds: 18,
      momentumTriggered: true,
      killRewardPoints: 150,
    })
  );

  // 2. P2 falls 400 pts behind, scores a PvP takedown + big kill to rally from >=250 deficit and overtake P1
  p2.kills = 1;
  p2.comboStreak = 1;
  p2.totalPoints = 100;
  feed.push(
    ...evaluateDuelMajorEvents({
      tracker,
      p1,
      p2,
      actingSlot: 'p2',
      elapsedSeconds: 30,
      killRewardPoints: 100,
    })
  );

  p2.pvpKills = 1;
  p2.comboStreak = 5;
  p2.totalPoints = 600; // overtakes p1 (400) after trailing by 400!
  feed.push(
    ...evaluateDuelMajorEvents({
      tracker,
      p1,
      p2,
      actingSlot: 'p2',
      elapsedSeconds: 52,
      pvpKO: true,
      pvpRewardPoints: 350,
    })
  );

  const types = feed.map((e) => e.type);
  assert.ok(types.includes('first_blood'), 'Should emit first_blood');
  assert.ok(types.includes('cyber_momentum'), 'Should emit cyber_momentum');
  assert.ok(types.includes('kill_streak'), 'Should emit kill_streak at 3x and 5x');
  assert.ok(types.includes('pvp_takedown'), 'Should emit pvp_takedown');
  assert.ok(types.includes('comeback'), 'Should emit comeback when rallying from >=250 deficit');

  // Verify chronological ordering
  for (let i = 1; i < feed.length; i++) {
    assert.ok(feed[i].timeSeconds >= feed[i - 1].timeSeconds);
  }

  // Verify summary preserves full killFeed
  const summary = computeDuelVictorySummary(p1, p2, 'online', 120, 12, feed);
  assert.ok(summary.killFeed);
  assert.equal(summary.killFeed.length, feed.length);
  assert.equal(summary.killFeed[0].type, 'first_blood');
  assert.equal(summary.killFeed[0].timeLabel, '00:05');
});

test('Pure PvP Team and Solo rules block friendly fire on same team and compute team victory summaries accurately', () => {
  assert.equal(isPurePvpFormat('pvpve_1v1'), false);
  assert.equal(isPurePvpFormat('pvp_solo'), true);
  assert.equal(isPurePvpFormat('pvp_team'), true);

  assert.equal(
    canDamageDuelTarget('pvp_team', { slot: 'p1', team: 'alpha' }, { slot: 'p3', team: 'alpha' }),
    false,
    'Same team members must not damage each other'
  );
  assert.equal(
    canDamageDuelTarget('pvp_team', { slot: 'p1', team: 'alpha' }, { slot: 'p2', team: 'omega' }),
    true,
    'Opposing teams can damage each other'
  );
  assert.equal(
    canDamageDuelTarget('pvp_solo', { slot: 'p1', team: 'alpha' }, { slot: 'p3', team: 'alpha' }),
    true,
    'In Solo FFA everyone else is a valid target'
  );
  assert.equal(
    canDamageDuelTarget('pvp_solo', { slot: 'p1' }, { slot: 'p1' }),
    false,
    'Players can never damage themselves'
  );

  const p1 = createInitialDuelPlayerScore('p1', 'AlphaOne', 10, 150, true, 'alpha');
  const p2 = createInitialDuelPlayerScore('p2', 'OmegaOne', 10, 150, true, 'omega');
  const p3 = createInitialDuelPlayerScore('p3', 'AlphaTwo', 10, 150, true, 'alpha');
  const p4 = createInitialDuelPlayerScore('p4', 'OmegaTwo', 10, 150, true, 'omega');

  assert.equal(assignBalancedTeam([p1, p2, p3]), 'omega');

  p1.pvpKills = 3;
  p1.totalPoints = 1050;
  p3.pvpKills = 1;
  p3.totalPoints = 350;
  p2.pvpKills = 2;
  p2.totalPoints = 700;
  p4.pvpKills = 0;
  p4.totalPoints = 0;

  const teamScores = computeDuelTeamScores([p1, p2, p3, p4]);
  assert.equal(teamScores.alpha.totalPoints, 1400);
  assert.equal(teamScores.omega.totalPoints, 700);
  assert.equal(teamScores.alpha.pvpKills, 4);

  const teamSummary = computeDuelVictorySummary(p1, p2, 'online', 120, 1, [], {
    matchFormat: 'pvp_team',
    mapTheme: 'cyber_forest_ruins',
    players: [p1, p2, p3, p4],
  });
  assert.equal(teamSummary.winningTeam, 'alpha');
  assert.equal(teamSummary.matchFormat, 'pvp_team');
  assert.equal(teamSummary.mapTheme, 'cyber_forest_ruins');
  assert.equal(teamSummary.players?.length, 4);
  assert.equal(teamSummary.pointMargin, 700);

  const soloSummary = computeDuelVictorySummary(p1, p2, 'online', 120, 1, [], {
    matchFormat: 'pvp_solo',
    mapTheme: 'cyber_forest_ruins',
    players: [p1, p2, p3, p4],
  });
  assert.equal(soloSummary.winnerSlot, 'p1');
  assert.equal(soloSummary.winnerName, 'AlphaOne');
  assert.equal(soloSummary.players?.[0].slot, 'p1');
});

test('PvP projectile damage scaling and shield-to-HP depletion reach KO reliably without excessive tankiness', () => {
  const pulsePvp = computePvpProjectileDamage(24);
  assert.equal(pulsePvp, 20);
  assert.equal(computePvpProjectileDamage(5), 12, 'Minimum PvP pellet damage floors at 12');
  assert.equal(computePvpProjectileDamage(300), 180, 'Maximum single projectile PvP damage caps at 180');

  let shield = 150;
  let hp = 10;
  let hits = 0;
  let ko = false;

  while (!ko && hits < 20) {
    hits += 1;
    const res = applyPvpDamageToPool({ shield, hp, maxHp: 10, damage: pulsePvp });
    shield = res.shield;
    hp = res.hp;
    ko = res.isKO;
  }

  assert.equal(ko, true, 'Starter weapon hits must reliably KO opponent');
  assert.ok(hits >= 9 && hits <= 13, `Expected 9-13 Pulse hits to KO full shield+HP, got ${hits}`);
  assert.equal(shield, 0);
  assert.equal(hp, 0);
});

