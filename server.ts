import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import type { DifficultyMode, EnemyType } from './src/game/types.ts';
import {
  ALL_DUEL_SLOTS,
  DUEL_TEAM_COLORS,
  MAX_PURE_PVP_PLAYERS,
  assignBalancedTeam,
  canDamageDuelTarget,
  createInitialDuelPlayerScore,
  generateCompetitiveDuelSpawns,
  computeDuelKillReward,
  computeDuelPvpTakedownReward,
  computeDuelVictorySummary,
  computeDuelTeamScores,
  advanceCyberMomentumOnKill,
  stepCyberMomentumTimer,
  resetCyberMomentum,
  createDuelEventTracker,
  evaluateDuelMajorEvents,
  isPurePvpFormat,
  type DuelCompetitiveSpawn,
  type DuelEventTracker,
  type DuelKillFeedEvent,
  type DuelMatchFormat,
  type DuelPlayerScore,
  type DuelSlotId,
  type DuelTeamId,
  type DuelVictorySummary,
} from './src/game/duel.ts';
import {
  buildArenaObstacles,
  getSafeArenaSpawnPoint,
  type ArenaMapTheme,
} from './src/game/arenaObstacles.ts';
import {
  TACTICAL_WALL_MAX_ACTIVE_PER_PLAYER,
  TACTICAL_WALL_MAX_HP,
  applyDamageToTacticalWall,
  canProjectileHitTacticalWall,
  createTacticalWall,
  type DuelTacticalWall,
} from './src/game/duelWalls.ts';
import { buildPlayableLauncherHtml } from './src/game/install.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ARENA_WIDTH = 2200;
const ARENA_HEIGHT = 1600;
const PORT = Number(process.env.PORT) || 3000;

interface DuelRoomClient {
  ws: WebSocket;
  slot: DuelSlotId;
  pos: { x: number; y: number };
  lastTelemetry?: Record<string, unknown>;
}

interface DuelSpectatorClient {
  id: string;
  ws: WebSocket;
  name: string;
}

interface DuelChatEntry {
  id: string;
  slot: DuelSlotId | 'spectator';
  sender: string;
  text: string;
  timestamp: number;
}

interface DuelRoom {
  roomCode: string;
  status: 'lobby' | 'playing' | 'finished';
  isPublic: boolean;
  matchFormat: DuelMatchFormat;
  mapTheme: ArenaMapTheme;
  maxPlayers: number;
  createdAt: number;
  durationSeconds: number;
  timeRemaining: number;
  elapsedSeconds: number;
  level: number;
  difficulty: DifficultyMode;
  p1: DuelPlayerScore;
  p2: DuelPlayerScore;
  players: Map<DuelSlotId, DuelPlayerScore>;
  clients: Map<DuelSlotId, DuelRoomClient>;
  spectators: Map<string, DuelSpectatorClient>;
  activeSpawns: Map<string, DuelCompetitiveSpawn>;
  tacticalWalls: Map<string, DuelTacticalWall>;
  wallSeq: number;
  wallLastDeployBySlot: Map<DuelSlotId, number>;
  claimedKills: Set<string>;
  chatLog: DuelChatEntry[];
  killFeed: DuelKillFeedEvent[];
  eventTracker: DuelEventTracker;
  spawnSeq: number;
  waveNumber: number;
  timerInterval: NodeJS.Timeout | null;
  spawnInterval: NodeJS.Timeout | null;
  summary: DuelVictorySummary | null;
}

const rooms = new Map<string, DuelRoom>();
const socketRoomMap = new WeakMap<
  WebSocket,
  { roomCode: string; role: DuelSlotId | 'spectator'; spectatorId?: string }
>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  if (rooms.has(code)) return generateRoomCode();
  return code;
}

function sendJson(ws: WebSocket, payload: Record<string, unknown>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastToRoom(room: DuelRoom, payload: Record<string, unknown>, excludeSlot?: DuelSlotId) {
  for (const [slot, client] of room.clients.entries()) {
    if (excludeSlot && slot === excludeSlot) continue;
    sendJson(client.ws, payload);
  }
  for (const spectator of room.spectators.values()) {
    sendJson(spectator.ws, payload);
  }
}

function getOrderedRoomPlayers(room: DuelRoom): DuelPlayerScore[] {
  const list: DuelPlayerScore[] = [];
  for (const slot of ALL_DUEL_SLOTS) {
    const entry = room.players.get(slot);
    if (entry) list.push(entry);
  }
  return list;
}

function syncRoomLegacyP1P2(room: DuelRoom) {
  const p1 = room.players.get('p1');
  if (p1) room.p1 = p1;
  const p2 = room.players.get('p2');
  if (p2) {
    room.p2 = p2;
  } else {
    room.p2 = createInitialDuelPlayerScore('p2', 'Waiting for Challenger...', 10, 150, false);
  }
}

function serializeRoomState(room: DuelRoom) {
  syncRoomLegacyP1P2(room);
  const players = getOrderedRoomPlayers(room);
  return {
    roomCode: room.roomCode,
    status: room.status,
    isPublic: room.isPublic,
    matchFormat: room.matchFormat,
    mapTheme: room.mapTheme,
    maxPlayers: room.maxPlayers,
    durationSeconds: room.durationSeconds,
    timeRemaining: room.timeRemaining,
    level: room.level,
    difficulty: room.difficulty,
    p1: room.p1,
    p2: room.p2,
    players,
    teamScores: room.matchFormat === 'pvp_team' ? computeDuelTeamScores(players) : undefined,
    spectatorCount: room.spectators.size,
    chatLog: room.chatLog,
  };
}

function clearRoomTimers(room: DuelRoom) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
  if (room.spawnInterval) {
    clearInterval(room.spawnInterval);
    room.spawnInterval = null;
  }
}

function spawnBalancedWaveForRoom(room: DuelRoom) {
  if (room.status !== 'playing' || isPurePvpFormat(room.matchFormat)) return;
  const p1Pos = room.clients.get('p1')?.pos || { x: Math.round(ARENA_WIDTH * 0.35), y: Math.round(ARENA_HEIGHT / 2) };
  const p2Pos = room.clients.get('p2')?.pos || { x: Math.round(ARENA_WIDTH * 0.65), y: Math.round(ARENA_HEIGHT / 2) };
  const pairsCount = room.elapsedSeconds >= 60 ? 2 : 1;

  const spawns = generateCompetitiveDuelSpawns({
    p1Pos,
    p2Pos,
    arenaW: ARENA_WIDTH,
    arenaH: ARENA_HEIGHT,
    pairsCount,
    waveNumber: room.waveNumber,
    level: room.level,
    spawnSeqStart: room.spawnSeq,
  });

  room.spawnSeq += spawns.length;
  for (const sp of spawns) {
    room.activeSpawns.set(sp.spawnId, sp);
  }
  if (room.activeSpawns.size > 40) {
    const excess = room.activeSpawns.size - 40;
    let removed = 0;
    for (const key of room.activeSpawns.keys()) {
      room.activeSpawns.delete(key);
      removed += 1;
      if (removed >= excess) break;
    }
  }
  if (room.elapsedSeconds > 0 && room.elapsedSeconds % 25 === 0) {
    room.waveNumber += 1;
  }

  broadcastToRoom(room, {
    type: 'duel:spawn_wave',
    waveNumber: room.waveNumber,
    spawns,
  });
}

function finishDuelRoom(room: DuelRoom) {
  if (room.status === 'finished') return;
  room.status = 'finished';
  room.timeRemaining = 0;
  clearRoomTimers(room);
  syncRoomLegacyP1P2(room);
  const players = getOrderedRoomPlayers(room);

  const summary = computeDuelVictorySummary(
    room.p1,
    room.p2,
    'online',
    room.durationSeconds,
    room.level,
    room.killFeed,
    {
      matchFormat: room.matchFormat,
      mapTheme: room.mapTheme,
      players,
    }
  );
  room.summary = summary;

  broadcastToRoom(room, {
    type: 'duel:match_finished',
    summary,
  });
}

function startDuelRoomMatch(room: DuelRoom) {
  clearRoomTimers(room);

  const obstacles = buildArenaObstacles(room.mapTheme, ARENA_WIDTH, ARENA_HEIGHT);
  const isTeam = room.matchFormat === 'pvp_team';
  const connectedSlots = ALL_DUEL_SLOTS.filter((slot) => room.clients.has(slot));
  const totalSlots = Math.max(2, connectedSlots.length);

  for (const [slot, existing] of room.players.entries()) {
    const isConn = room.clients.has(slot);
    if (!isConn && slot !== 'p1' && slot !== 'p2') {
      room.players.delete(slot);
      continue;
    }
    const fresh = createInitialDuelPlayerScore(
      slot,
      existing.name,
      10,
      150,
      isConn,
      isTeam ? existing.team || 'alpha' : undefined
    );
    room.players.set(slot, fresh);
  }
  syncRoomLegacyP1P2(room);

  room.status = 'playing';
  room.timeRemaining = room.durationSeconds;
  room.elapsedSeconds = 0;
  room.claimedKills.clear();
  room.activeSpawns.clear();
  room.tacticalWalls.clear();
  room.wallSeq = 0;
  room.wallLastDeployBySlot.clear();
  room.killFeed = [];
  room.eventTracker = createDuelEventTracker();
  room.spawnSeq = 1;
  room.waveNumber = 1;
  room.summary = null;

  let slotIdx = 0;
  for (const slot of ALL_DUEL_SLOTS) {
    const client = room.clients.get(slot);
    if (!client) continue;
    const score = room.players.get(slot);
    const spawn = getSafeArenaSpawnPoint({
      slotIndex: slotIdx++,
      totalSlots,
      team: isTeam ? score?.team || 'alpha' : undefined,
      isTeamMode: isTeam,
      obstacles,
      arenaW: ARENA_WIDTH,
      arenaH: ARENA_HEIGHT,
    });
    client.pos = { x: spawn.x, y: spawn.y };
    client.lastTelemetry = undefined;
  }

  broadcastToRoom(room, {
    type: 'duel:match_started',
    roomState: serializeRoomState(room),
  });

  // Only spawn AI enemy waves in PvPvE 1v1 mode — Pure-PvP modes never spawn AI bots
  if (!isPurePvpFormat(room.matchFormat)) {
    spawnBalancedWaveForRoom(room);
    room.spawnInterval = setInterval(() => {
      spawnBalancedWaveForRoom(room);
    }, 2400);
  }

  // Authoritative 1-second server countdown timer
  room.timerInterval = setInterval(() => {
    if (room.status !== 'playing') return;
    room.timeRemaining = Math.max(0, room.timeRemaining - 1);
    room.elapsedSeconds += 1;
    for (const p of room.players.values()) {
      p.momentumTimer = stepCyberMomentumTimer(p.momentumTimer, 1);
    }
    // Step finite-TTL walls if configured; persistent walls (maxTtl <= 0) remain until destroyed
    for (const [wallId, wall] of room.tacticalWalls.entries()) {
      if (wall.maxTtl > 0) {
        wall.ttl -= 1;
        if (wall.ttl <= 0) {
          room.tacticalWalls.delete(wallId);
          broadcastToRoom(room, {
            type: 'duel:wall_destroyed',
            wallId,
          });
        }
      }
    }
    syncRoomLegacyP1P2(room);

    broadcastToRoom(room, {
      type: 'duel:timer_tick',
      timeRemaining: room.timeRemaining,
      elapsedSeconds: room.elapsedSeconds,
    });

    if (room.timeRemaining <= 0) {
      finishDuelRoom(room);
    }
  }, 1000);
}

async function bootstrap() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, roomsActive: rooms.size });
  });

  app.get('/manifest.webmanifest', (_req, res) => {
    const prodPath = path.join(__dirname, 'dist', 'manifest.webmanifest');
    const devPath = path.join(__dirname, 'public', 'manifest.webmanifest');
    const targetPath =
      process.env.NODE_ENV === 'production' && fs.existsSync(prodPath)
        ? prodPath
        : devPath;
    if (!fs.existsSync(targetPath)) {
      res.status(404).json({ error: 'Manifest not found' });
      return;
    }
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(targetPath);
  });

  app.get('/api/download-launcher', (req, res) => {
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '')
      .split(',')[0]
      .trim()
      .toLowerCase();
    const proto = forwardedProto === 'https' || forwardedProto === 'http' ? forwardedProto : req.protocol;
    const forwardedHost = String(req.headers['x-forwarded-host'] || '')
      .split(',')[0]
      .trim();
    const rawHost = (forwardedHost || req.get('host') || 'localhost:3000').replace(/[^a-zA-Z0-9.:-]/g, '');
    const gameUrl = `${proto}://${rawHost}/`;
    const html = buildPlayableLauncherHtml(gameUrl);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="NaBil-BOT-Cyber-Protocol.html"'
    );
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
  });

  app.get('/api/duel/rooms', (_req, res) => {
    const openRooms = [];
    const liveMatches = [];
    for (const room of rooms.values()) {
      let connectedCount = 0;
      for (const client of room.clients.values()) {
        if (client.ws.readyState === WebSocket.OPEN) connectedCount += 1;
      }
      if (room.isPublic && room.status === 'lobby' && connectedCount > 0 && connectedCount < room.maxPlayers) {
        openRooms.push({
          roomCode: room.roomCode,
          hostName: room.p1.name,
          matchFormat: room.matchFormat,
          mapTheme: room.mapTheme,
          playerCount: connectedCount,
          maxPlayers: room.maxPlayers,
          level: room.level,
          difficulty: room.difficulty,
          durationSeconds: room.durationSeconds,
          spectatorCount: room.spectators.size,
          createdAt: room.createdAt,
        });
      } else if (room.isPublic && room.status === 'playing' && connectedCount > 0) {
        liveMatches.push({
          roomCode: room.roomCode,
          p1Name: room.p1.name,
          p2Name: room.p2.name,
          matchFormat: room.matchFormat,
          mapTheme: room.mapTheme,
          playerCount: connectedCount,
          maxPlayers: room.maxPlayers,
          level: room.level,
          difficulty: room.difficulty,
          timeRemaining: room.timeRemaining,
          spectatorCount: room.spectators.size,
          createdAt: room.createdAt,
        });
      }
    }
    openRooms.sort((a, b) => b.createdAt - a.createdAt);
    liveMatches.sort((a, b) => b.createdAt - a.createdAt);
    res.json({ rooms: openRooms, liveMatches });
  });

  app.get('/api/duel/rooms/:code', (req, res) => {
    const code = String(req.params.code || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) {
      res.status(404).json({ exists: false, error: 'Room not found' });
      return;
    }
    const p1Connected = room.clients.get('p1')?.ws.readyState === WebSocket.OPEN;
    const p2Connected = room.clients.get('p2')?.ws.readyState === WebSocket.OPEN;
    let connectedCount = 0;
    for (const client of room.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) connectedCount += 1;
    }
    res.json({
      exists: true,
      roomCode: room.roomCode,
      status: room.status,
      isPublic: room.isPublic,
      matchFormat: room.matchFormat,
      mapTheme: room.mapTheme,
      playerCount: connectedCount,
      maxPlayers: room.maxPlayers,
      hostName: room.p1.name,
      p2Name: room.p2.name,
      level: room.level,
      difficulty: room.difficulty,
      durationSeconds: room.durationSeconds,
      timeRemaining: room.timeRemaining,
      p1Connected,
      p2Connected,
      spectatorCount: room.spectators.size,
      canJoin: room.status === 'lobby' && connectedCount < room.maxPlayers,
      canSpectate: room.status === 'lobby' || room.status === 'playing',
    });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws/duel' });

  wss.on('connection', (ws: WebSocket) => {
    ws.on('message', (raw) => {
      let msg: Record<string, any>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        sendJson(ws, { type: 'duel:error', message: 'Invalid JSON payload' });
        return;
      }

      const type = String(msg.type || '');

      if (type === 'duel:create_room') {
        const roomCode = generateRoomCode();
        const durationSeconds = Number(msg.durationSeconds) === 240 ? 240 : 120;
        const level = Math.max(1, Math.min(100, Number(msg.level) || 1));
        const difficulty: DifficultyMode =
          msg.difficulty === 'easy' || msg.difficulty === 'nightmare' ? msg.difficulty : 'normal';
        const matchFormat: DuelMatchFormat =
          msg.matchFormat === 'pvp_solo' || msg.matchFormat === 'pvp_team' ? msg.matchFormat : 'pvpve_1v1';
        const defaultMapTheme: ArenaMapTheme = isPurePvpFormat(matchFormat) ? 'cyber_forest_ruins' : 'sector';
        const mapTheme: ArenaMapTheme =
          msg.mapTheme === 'cyber_forest_ruins'
            ? 'cyber_forest_ruins'
            : msg.mapTheme === 'sector'
            ? 'sector'
            : defaultMapTheme;
        const maxPlayers = isPurePvpFormat(matchFormat) ? MAX_PURE_PVP_PLAYERS : 2;
        const isPublic = msg.isPublic !== false;
        const p1Name = String(msg.playerName || 'Commander P1').slice(0, 20);
        const hostTeam: DuelTeamId | undefined = matchFormat === 'pvp_team' ? 'alpha' : undefined;

        const p1Score = createInitialDuelPlayerScore('p1', p1Name, 10, 150, true, hostTeam);
        const p2Placeholder = createInitialDuelPlayerScore(
          'p2',
          'Waiting for Challenger...',
          10,
          150,
          false,
          matchFormat === 'pvp_team' ? 'omega' : undefined
        );

        const players = new Map<DuelSlotId, DuelPlayerScore>();
        players.set('p1', p1Score);

        const obstacles = buildArenaObstacles(mapTheme, ARENA_WIDTH, ARENA_HEIGHT);
        const p1Spawn = getSafeArenaSpawnPoint({
          slotIndex: 0,
          totalSlots: maxPlayers,
          team: hostTeam,
          isTeamMode: matchFormat === 'pvp_team',
          obstacles,
          arenaW: ARENA_WIDTH,
          arenaH: ARENA_HEIGHT,
        });

        const room: DuelRoom = {
          roomCode,
          status: 'lobby',
          isPublic,
          matchFormat,
          mapTheme,
          maxPlayers,
          createdAt: Date.now(),
          durationSeconds,
          timeRemaining: durationSeconds,
          elapsedSeconds: 0,
          level,
          difficulty,
          p1: p1Score,
          p2: p2Placeholder,
          players,
          clients: new Map(),
          spectators: new Map(),
          activeSpawns: new Map(),
          tacticalWalls: new Map(),
          wallSeq: 0,
          wallLastDeployBySlot: new Map(),
          claimedKills: new Set(),
          chatLog: [],
          killFeed: [],
          eventTracker: createDuelEventTracker(),
          spawnSeq: 1,
          waveNumber: 1,
          timerInterval: null,
          spawnInterval: null,
          summary: null,
        };

        room.clients.set('p1', {
          ws,
          slot: 'p1',
          pos: { x: p1Spawn.x, y: p1Spawn.y },
        });
        rooms.set(roomCode, room);
        socketRoomMap.set(ws, { roomCode, role: 'p1' });

        sendJson(ws, {
          type: 'duel:room_joined',
          slot: 'p1',
          roomCode,
          roomState: serializeRoomState(room),
        });
        return;
      }

      if (type === 'duel:join_room') {
        const roomCode = String(msg.roomCode || '').toUpperCase().trim();
        const room = rooms.get(roomCode);
        if (!room) {
          sendJson(ws, { type: 'duel:error', message: `Duel room "${roomCode}" not found.` });
          return;
        }
        if (room.status === 'playing') {
          sendJson(ws, {
            type: 'duel:error',
            message: `Arena room "${roomCode}" match is already in progress. Use Spectate Live to watch!`,
          });
          return;
        }

        const candidateSlots = ALL_DUEL_SLOTS.slice(0, room.maxPlayers);
        let assignedSlot: DuelSlotId | null = null;
        for (const s of candidateSlots) {
          const existingClient = room.clients.get(s);
          if (!existingClient || existingClient.ws.readyState !== WebSocket.OPEN) {
            assignedSlot = s;
            break;
          }
        }
        if (!assignedSlot) {
          sendJson(ws, {
            type: 'duel:error',
            message: `Arena room "${roomCode}" is already full (${room.maxPlayers}/${room.maxPlayers}). You can still spectate live!`,
          });
          return;
        }

        const playerName = String(msg.playerName || `Pilot ${assignedSlot.toUpperCase()}`).slice(0, 20);
        const assignedTeam: DuelTeamId | undefined =
          room.matchFormat === 'pvp_team'
            ? assignBalancedTeam(getOrderedRoomPlayers(room))
            : undefined;
        const playerScore = createInitialDuelPlayerScore(
          assignedSlot,
          playerName,
          10,
          150,
          true,
          assignedTeam
        );
        playerScore.ready = false;
        room.players.set(assignedSlot, playerScore);
        syncRoomLegacyP1P2(room);

        const obstacles = buildArenaObstacles(room.mapTheme, ARENA_WIDTH, ARENA_HEIGHT);
        const spawn = getSafeArenaSpawnPoint({
          slotIndex: ALL_DUEL_SLOTS.indexOf(assignedSlot),
          totalSlots: room.maxPlayers,
          team: assignedTeam,
          isTeamMode: room.matchFormat === 'pvp_team',
          obstacles,
          arenaW: ARENA_WIDTH,
          arenaH: ARENA_HEIGHT,
        });

        room.clients.set(assignedSlot, {
          ws,
          slot: assignedSlot,
          pos: { x: spawn.x, y: spawn.y },
        });
        socketRoomMap.set(ws, { roomCode, role: assignedSlot });

        sendJson(ws, {
          type: 'duel:room_joined',
          slot: assignedSlot,
          roomCode,
          roomState: serializeRoomState(room),
        });

        broadcastToRoom(room, {
          type: 'duel:room_state',
          roomState: serializeRoomState(room),
        });
        return;
      }

      if (type === 'duel:spectate_room') {
        const roomCode = String(msg.roomCode || '').toUpperCase().trim();
        const room = rooms.get(roomCode);
        if (!room) {
          sendJson(ws, { type: 'duel:error', message: `Duel room "${roomCode}" not found.` });
          return;
        }
        const spectatorId = `spec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const specName = String(msg.playerName || 'Spectator').slice(0, 20);
        room.spectators.set(spectatorId, { id: spectatorId, ws, name: specName });
        socketRoomMap.set(ws, { roomCode, role: 'spectator', spectatorId });

        const playerStates: Record<string, unknown> = {};
        for (const [slot, client] of room.clients.entries()) {
          if (client.lastTelemetry) {
            playerStates[slot] = client.lastTelemetry;
          }
        }

        sendJson(ws, {
          type: 'duel:spectate_joined',
          roomCode,
          spectatorId,
          roomState: serializeRoomState(room),
          elapsedSeconds: room.elapsedSeconds,
          activeSpawns: Array.from(room.activeSpawns.values()),
          tacticalWalls: Array.from(room.tacticalWalls.values()),
          p1State: room.clients.get('p1')?.lastTelemetry || null,
          p2State: room.clients.get('p2')?.lastTelemetry || null,
          playerStates,
          summary: room.summary,
        });

        broadcastToRoom(room, {
          type: 'duel:room_state',
          roomState: serializeRoomState(room),
        });
        return;
      }

      const binding = socketRoomMap.get(ws);
      if (!binding) {
        sendJson(ws, { type: 'duel:error', message: 'Not connected to any duel room.' });
        return;
      }
      const room = rooms.get(binding.roomCode);
      if (!room) {
        sendJson(ws, { type: 'duel:error', message: 'Duel room no longer exists.' });
        return;
      }

      if (type === 'duel:lobby_chat') {
        const text = String(msg.text || '').trim().slice(0, 120);
        if (!text) return;
        const sender =
          binding.role === 'spectator'
            ? room.spectators.get(binding.spectatorId || '')?.name || 'Spectator'
            : room.players.get(binding.role)?.name || binding.role.toUpperCase();
        const entry: DuelChatEntry = {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          slot: binding.role,
          sender,
          text,
          timestamp: Date.now(),
        };
        room.chatLog.push(entry);
        if (room.chatLog.length > 20) room.chatLog.shift();
        broadcastToRoom(room, {
          type: 'duel:lobby_chat',
          message: entry,
        });
        return;
      }

      // Spectators are strictly read-only for gameplay & match control events
      if (binding.role === 'spectator') {
        return;
      }
      const playerSlot = binding.role;
      const actorScore = room.players.get(playerSlot);

      if (type === 'duel:toggle_ready') {
        if (!actorScore) return;
        actorScore.ready = typeof msg.ready === 'boolean' ? msg.ready : !actorScore.ready;
        syncRoomLegacyP1P2(room);
        broadcastToRoom(room, {
          type: 'duel:room_state',
          roomState: serializeRoomState(room),
        });
        return;
      }

      if (type === 'duel:switch_team') {
        if (room.status !== 'lobby' || room.matchFormat !== 'pvp_team' || !actorScore) return;
        const requestedTeam: DuelTeamId =
          msg.team === 'alpha' || msg.team === 'omega'
            ? msg.team
            : actorScore.team === 'alpha'
            ? 'omega'
            : 'alpha';
        actorScore.team = requestedTeam;
        actorScore.color = DUEL_TEAM_COLORS[requestedTeam];
        syncRoomLegacyP1P2(room);
        broadcastToRoom(room, {
          type: 'duel:room_state',
          roomState: serializeRoomState(room),
        });
        return;
      }

      if (type === 'duel:start_match') {
        if (room.clients.size < 2) {
          sendJson(ws, { type: 'duel:error', message: 'Wait for at least 2 players to join the arena first.' });
          return;
        }
        if (room.matchFormat === 'pvp_team') {
          const teamScores = computeDuelTeamScores(getOrderedRoomPlayers(room));
          if (teamScores.alpha.playerCount === 0 || teamScores.omega.playerCount === 0) {
            sendJson(ws, {
              type: 'duel:error',
              message: 'Team Battle needs at least 1 player on Team Alpha and 1 player on Team Omega.',
            });
            return;
          }
        }
        startDuelRoomMatch(room);
        return;
      }

      if (type === 'duel:request_rematch') {
        if (room.clients.size < 2) {
          sendJson(ws, { type: 'duel:error', message: 'At least 2 players must be connected for a rematch.' });
          return;
        }
        startDuelRoomMatch(room);
        return;
      }

      if (type === 'duel:player_state') {
        const client = room.clients.get(playerSlot);
        if (client && typeof msg.x === 'number' && typeof msg.y === 'number') {
          client.pos = { x: msg.x, y: msg.y };
        }
        const playerScore = actorScore || room.p1;
        if (typeof msg.hp === 'number') playerScore.hp = msg.hp;
        if (typeof msg.maxHp === 'number') playerScore.maxHp = msg.maxHp;
        if (typeof msg.shield === 'number') playerScore.shield = msg.shield;
        if (typeof msg.maxShield === 'number') playerScore.maxShield = msg.maxShield;
        if (typeof msg.respawnTimer === 'number') playerScore.respawnTimer = msg.respawnTimer;
        if (typeof msg.momentumTimer === 'number') playerScore.momentumTimer = Math.max(0, msg.momentumTimer);

        const statePayload = {
          x: msg.x,
          y: msg.y,
          vx: msg.vx,
          vy: msg.vy,
          angle: msg.angle,
          isDashing: Boolean(msg.isDashing),
          activeWeapon: msg.activeWeapon,
          activeCraft: msg.activeCraft,
          hp: playerScore.hp,
          maxHp: playerScore.maxHp,
          shield: playerScore.shield,
          maxShield: playerScore.maxShield,
          respawnTimer: playerScore.respawnTimer,
          momentumTimer: playerScore.momentumTimer,
        };
        if (client) client.lastTelemetry = statePayload;

        broadcastToRoom(
          room,
          {
            type: 'duel:remote_player_state',
            slot: playerSlot,
            state: statePayload,
          },
          playerSlot
        );
        return;
      }

      if (type === 'duel:spawn_projectile') {
        broadcastToRoom(
          room,
          {
            type: 'duel:remote_projectile',
            slot: playerSlot,
            projectile: msg.projectile,
          },
          playerSlot
        );
        return;
      }

      if (type === 'duel:deploy_wall') {
        if (room.status !== 'playing' || !actorScore) return;
        const now = Date.now();
        const prevDeployAt = room.wallLastDeployBySlot.get(playerSlot) || 0;
        if (now - prevDeployAt < 250) return;
        room.wallLastDeployBySlot.set(playerSlot, now);

        const clientPos = room.clients.get(playerSlot)?.pos;
        const rawX = typeof msg.x === 'number' && Number.isFinite(msg.x) ? msg.x : (clientPos?.x ?? ARENA_WIDTH / 2);
        const rawY = typeof msg.y === 'number' && Number.isFinite(msg.y) ? msg.y : (clientPos?.y ?? ARENA_HEIGHT / 2);
        const rawAngle = typeof msg.angle === 'number' && Number.isFinite(msg.angle) ? msg.angle : 0;

        const safeX = Math.max(48, Math.min(ARENA_WIDTH - 48, rawX));
        const safeY = Math.max(48, Math.min(ARENA_HEIGHT - 48, rawY));

        // Cap active walls per slot to prevent cluttering arena; evict oldest first
        const ownedIds: string[] = [];
        for (const [id, existingWall] of room.tacticalWalls.entries()) {
          if (existingWall.ownerSlot === playerSlot) ownedIds.push(id);
        }
        while (ownedIds.length >= TACTICAL_WALL_MAX_ACTIVE_PER_PLAYER) {
          const evictId = ownedIds.shift();
          if (evictId) {
            room.tacticalWalls.delete(evictId);
            broadcastToRoom(room, {
              type: 'duel:wall_destroyed',
              wallId: evictId,
            });
          }
        }

        const wallId = `wall_${++room.wallSeq}`;
        const wall = createTacticalWall({
          id: wallId,
          ownerSlot: playerSlot,
          ownerTeam: actorScore.team,
          color: actorScore.color,
          x: Math.round(safeX * 10) / 10,
          y: Math.round(safeY * 10) / 10,
          angle: Number(rawAngle.toFixed(4)),
          hp: TACTICAL_WALL_MAX_HP,
          maxHp: TACTICAL_WALL_MAX_HP,
        });
        room.tacticalWalls.set(wallId, wall);
        broadcastToRoom(room, {
          type: 'duel:wall_deployed',
          wall,
        });
        return;
      }

      if (type === 'duel:damage_wall') {
        if (room.status !== 'playing' || !actorScore) return;
        const wallId = String(msg.wallId || '').trim();
        if (!wallId) return;
        const wall = room.tacticalWalls.get(wallId);
        if (!wall) return;
        if (
          !canProjectileHitTacticalWall({
            wall,
            projectileOwnerSlot: playerSlot,
            projectileOwnerTeam: actorScore.team,
            matchFormat: room.matchFormat,
          })
        ) {
          return;
        }
        const dmg = Math.max(1, Math.min(250, Number(msg.damage) || 20));
        const res = applyDamageToTacticalWall(wall, dmg);
        if (res.destroyed) {
          room.tacticalWalls.delete(wallId);
          broadcastToRoom(room, {
            type: 'duel:wall_destroyed',
            wallId,
            attackerSlot: playerSlot,
          });
        } else {
          room.tacticalWalls.set(wallId, res.wall);
          broadcastToRoom(room, {
            type: 'duel:wall_damaged',
            wallId,
            hp: res.wall.hp,
            maxHp: res.wall.maxHp,
            attackerSlot: playerSlot,
          });
        }
        return;
      }

      if (type === 'duel:claim_kill') {
        if (room.status !== 'playing' || isPurePvpFormat(room.matchFormat)) return;
        const spawnId = msg.spawnId ? String(msg.spawnId) : '';
        if (spawnId && room.claimedKills.has(spawnId)) {
          return;
        }
        if (spawnId) {
          room.claimedKills.add(spawnId);
          room.activeSpawns.delete(spawnId);
        }

        const scorer = actorScore || room.p1;
        const enemyType = (msg.enemyType as EnemyType) || 'swarmer';
        scorer.kills += 1;
        scorer.comboStreak = Number(msg.comboStreak) || scorer.comboStreak + 1;
        if (scorer.comboStreak > scorer.bestCombo) {
          scorer.bestCombo = scorer.comboStreak;
        }

        const reward = computeDuelKillReward(enemyType, scorer.comboStreak, room.elapsedSeconds);
        scorer.baseKillPoints += reward.basePoints;
        scorer.comboBonusPoints += reward.comboBonus;
        scorer.totalPoints = scorer.baseKillPoints + scorer.comboBonusPoints + scorer.pvpBonusPoints;
        if (typeof msg.damageDealt === 'number' && msg.damageDealt > scorer.damageDealt) {
          scorer.damageDealt = msg.damageDealt;
        }

        const momentumRes = advanceCyberMomentumOnKill(scorer);
        scorer.momentumKills = momentumRes.momentumKills;
        scorer.momentumTimer = momentumRes.momentumTimer;
        scorer.momentumActivations = momentumRes.momentumActivations;

        syncRoomLegacyP1P2(room);
        const majorEvents = evaluateDuelMajorEvents({
          tracker: room.eventTracker,
          p1: room.p1,
          p2: room.p2,
          actingSlot: playerSlot,
          elapsedSeconds: room.elapsedSeconds,
          momentumTriggered: momentumRes.triggered,
          killRewardPoints: reward.totalPoints,
        });
        if (majorEvents.length > 0) {
          room.killFeed.push(...majorEvents);
        }

        const players = getOrderedRoomPlayers(room);
        broadcastToRoom(room, {
          type: 'duel:scoreboard_update',
          spawnId,
          killerSlot: playerSlot,
          rewardPoints: reward.totalPoints,
          momentumTriggered: momentumRes.triggered,
          p1: room.p1,
          p2: room.p2,
          players,
          teamScores: room.matchFormat === 'pvp_team' ? computeDuelTeamScores(players) : undefined,
        });
        return;
      }

      if (type === 'duel:pvp_hit') {
        if (room.status !== 'playing') return;
        const requestedTarget = String(msg.targetSlot || '') as DuelSlotId;
        const targetSlot: DuelSlotId = ALL_DUEL_SLOTS.includes(requestedTarget)
          ? requestedTarget
          : playerSlot === 'p1'
          ? 'p2'
          : 'p1';
        const shooter = room.players.get(playerSlot);
        const target = room.players.get(targetSlot);
        if (!shooter || !target || !room.clients.has(targetSlot)) return;
        if (!canDamageDuelTarget(room.matchFormat, shooter, target)) {
          return;
        }

        const damage = Math.max(1, Math.min(250, Number(msg.damage) || 20));
        shooter.damageDealt += damage;
        broadcastToRoom(
          room,
          {
            type: 'duel:pvp_hit_applied',
            attackerSlot: playerSlot,
            targetSlot,
            damage,
            fromX: Number(msg.fromX) || 0,
            fromY: Number(msg.fromY) || 0,
          },
          playerSlot
        );
        return;
      }

      if (type === 'duel:report_ko') {
        if (room.status !== 'playing' || !actorScore) return;
        actorScore.hp = 0;
        actorScore.shield = 0;
        actorScore.respawnTimer = 2.5;
        actorScore.deaths += 1;
        actorScore.comboStreak = 0;
        const resetMom = resetCyberMomentum();
        actorScore.momentumKills = resetMom.momentumKills;
        actorScore.momentumTimer = resetMom.momentumTimer;

        let killerSlot: DuelSlotId | undefined;
        let rewardPoints = 0;
        let momentumTriggered = false;
        const rawKiller = String(msg.killerSlot || '') as DuelSlotId;
        if (ALL_DUEL_SLOTS.includes(rawKiller) && rawKiller !== playerSlot) {
          const attacker = room.players.get(rawKiller);
          if (attacker && canDamageDuelTarget(room.matchFormat, attacker, actorScore)) {
            killerSlot = rawKiller;
            attacker.pvpKills += 1;
            attacker.comboStreak += 1;
            if (attacker.comboStreak > attacker.bestCombo) {
              attacker.bestCombo = attacker.comboStreak;
            }
            rewardPoints = computeDuelPvpTakedownReward(room.elapsedSeconds);
            attacker.pvpBonusPoints += rewardPoints;
            attacker.totalPoints = attacker.baseKillPoints + attacker.comboBonusPoints + attacker.pvpBonusPoints;

            const momRes = advanceCyberMomentumOnKill(attacker);
            attacker.momentumKills = momRes.momentumKills;
            attacker.momentumTimer = momRes.momentumTimer;
            attacker.momentumActivations = momRes.momentumActivations;
            momentumTriggered = momRes.triggered;

            syncRoomLegacyP1P2(room);
            if (!isPurePvpFormat(room.matchFormat)) {
              const majorEvents = evaluateDuelMajorEvents({
                tracker: room.eventTracker,
                p1: room.p1,
                p2: room.p2,
                actingSlot: rawKiller,
                elapsedSeconds: room.elapsedSeconds,
                pvpKO: true,
                pvpRewardPoints: rewardPoints,
                momentumTriggered,
              });
              if (majorEvents.length > 0) {
                room.killFeed.push(...majorEvents);
              }
            } else {
              room.killFeed.push({
                id: `df_${room.eventTracker.seq++}`,
                timeSeconds: Math.floor(room.elapsedSeconds),
                timeLabel: `${String(Math.floor(room.elapsedSeconds / 60)).padStart(2, '0')}:${String(Math.floor(room.elapsedSeconds % 60)).padStart(2, '0')}`,
                type: 'pvp_takedown',
                slot: killerSlot,
                actorName: attacker.name,
                title: 'PvP Takedown',
                detail: `${attacker.name} eliminated ${actorScore.name}`,
                pointsDelta: rewardPoints,
              });
            }
          }
        }

        syncRoomLegacyP1P2(room);
        const players = getOrderedRoomPlayers(room);
        broadcastToRoom(room, {
          type: 'duel:scoreboard_update',
          killerSlot,
          victimSlot: playerSlot,
          rewardPoints,
          momentumTriggered,
          p1: room.p1,
          p2: room.p2,
          players,
          teamScores: room.matchFormat === 'pvp_team' ? computeDuelTeamScores(players) : undefined,
        });
        return;
      }
    });

    ws.on('close', () => {
      const binding = socketRoomMap.get(ws);
      if (!binding) return;
      const room = rooms.get(binding.roomCode);
      if (!room) return;

      if (binding.role === 'spectator') {
        if (binding.spectatorId) {
          room.spectators.delete(binding.spectatorId);
        }
      } else {
        const currentClient = room.clients.get(binding.role);
        if (currentClient && currentClient.ws !== ws) return;

        room.clients.delete(binding.role);
        if (binding.role === 'p1') {
          const p1Score = room.players.get('p1');
          if (p1Score) p1Score.connected = false;
        } else if (room.status === 'lobby') {
          room.players.delete(binding.role);
        } else {
          const pScore = room.players.get(binding.role);
          if (pScore) pScore.connected = false;
        }
        syncRoomLegacyP1P2(room);
      }

      if (room.clients.size === 0 && room.spectators.size === 0) {
        clearRoomTimers(room);
        rooms.delete(room.roomCode);
      } else {
        broadcastToRoom(room, {
          type: 'duel:room_state',
          roomState: serializeRoomState(room),
        });
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(
      express.static(distDir, {
        setHeaders(res, filePath) {
          const base = path.basename(filePath);
          if (
            base === 'index.html' ||
            base === 'sw.js' ||
            base === 'registerSW.js' ||
            base === 'manifest.webmanifest'
          ) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
          } else if (filePath.includes(`${path.sep}assets${path.sep}`) && !filePath.includes(`${path.sep}aistudio${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[NaBil-BOT Server] HTTP + WebSocket listening on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[NaBil-BOT Server] Fatal bootstrap error:', err);
  process.exit(1);
});
