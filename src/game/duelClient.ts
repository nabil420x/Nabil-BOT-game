import type { DifficultyMode, EnemyType, WeaponType, CraftId } from './types';
import type { ArenaMapTheme } from './arenaObstacles';
import type {
  DuelCompetitiveSpawn,
  DuelMatchFormat,
  DuelPlayerScore,
  DuelSlotId,
  DuelTeamId,
  DuelVictorySummary,
} from './duel';
import type { DuelTacticalWall } from './duelWalls';

export interface DuelLobbyChatMessage {
  id: string;
  slot: DuelSlotId | 'spectator';
  sender: string;
  text: string;
  timestamp: number;
}

export interface DuelRoomStatePayload {
  roomCode: string;
  status: 'lobby' | 'playing' | 'finished';
  isPublic?: boolean;
  matchFormat?: DuelMatchFormat;
  mapTheme?: ArenaMapTheme;
  maxPlayers?: number;
  durationSeconds: number;
  timeRemaining: number;
  level: number;
  difficulty: DifficultyMode;
  p1: DuelPlayerScore;
  p2: DuelPlayerScore;
  players?: DuelPlayerScore[];
  spectatorCount?: number;
  chatLog?: DuelLobbyChatMessage[];
}

export interface OpenDuelRoomInfo {
  roomCode: string;
  hostName: string;
  matchFormat?: DuelMatchFormat;
  mapTheme?: ArenaMapTheme;
  playerCount?: number;
  maxPlayers?: number;
  level: number;
  difficulty: DifficultyMode;
  durationSeconds: number;
  spectatorCount?: number;
  createdAt: number;
}

export interface LiveDuelMatchInfo {
  roomCode: string;
  p1Name: string;
  p2Name: string;
  matchFormat?: DuelMatchFormat;
  mapTheme?: ArenaMapTheme;
  playerCount?: number;
  maxPlayers?: number;
  level: number;
  difficulty: DifficultyMode;
  timeRemaining: number;
  spectatorCount: number;
  createdAt: number;
}

export interface DuelRoomPreview {
  exists: boolean;
  roomCode?: string;
  status?: 'lobby' | 'playing' | 'finished';
  isPublic?: boolean;
  matchFormat?: DuelMatchFormat;
  mapTheme?: ArenaMapTheme;
  playerCount?: number;
  maxPlayers?: number;
  hostName?: string;
  p2Name?: string;
  level?: number;
  difficulty?: DifficultyMode;
  durationSeconds?: number;
  timeRemaining?: number;
  p1Connected?: boolean;
  p2Connected?: boolean;
  spectatorCount?: number;
  canJoin?: boolean;
  canSpectate?: boolean;
  error?: string;
}

export interface RemotePlayerTelemetry {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  isDashing: boolean;
  activeWeapon: WeaponType;
  activeCraft: CraftId;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  respawnTimer: number;
  momentumTimer?: number;
}

export interface RemoteProjectilePayload {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  damage: number;
  rangeRemaining: number;
  pierceRemaining: number;
  isHoming?: boolean;
  explosionRadius?: number;
  pullRadius?: number;
  weaponType?: WeaponType;
}

export interface SpectateJoinedPayload {
  roomCode: string;
  spectatorId: string;
  roomState: DuelRoomStatePayload;
  elapsedSeconds: number;
  activeSpawns: DuelCompetitiveSpawn[];
  tacticalWalls?: DuelTacticalWall[];
  p1State: RemotePlayerTelemetry | null;
  p2State: RemotePlayerTelemetry | null;
  playerStates?: Partial<Record<DuelSlotId, RemotePlayerTelemetry>>;
  summary: DuelVictorySummary | null;
}

export interface DuelClientHandlers {
  onConnectionChange?: (connected: boolean) => void;
  onRoomJoined?: (payload: { slot: DuelSlotId; roomCode: string; roomState: DuelRoomStatePayload }) => void;
  onSpectateJoined?: (payload: SpectateJoinedPayload) => void;
  onRoomState?: (roomState: DuelRoomStatePayload) => void;
  onLobbyChat?: (message: DuelLobbyChatMessage) => void;
  onMatchStarted?: (roomState: DuelRoomStatePayload) => void;
  onTimerTick?: (timeRemaining: number, elapsedSeconds: number) => void;
  onSpawnWave?: (waveNumber: number, spawns: DuelCompetitiveSpawn[]) => void;
  onRemotePlayerState?: (slot: DuelSlotId, state: RemotePlayerTelemetry) => void;
  onRemoteProjectile?: (slot: DuelSlotId, projectile: RemoteProjectilePayload) => void;
  onWallDeployed?: (wall: DuelTacticalWall) => void;
  onWallDamaged?: (payload: { wallId: string; hp: number; maxHp: number; attackerSlot?: DuelSlotId }) => void;
  onWallDestroyed?: (payload: { wallId: string; attackerSlot?: DuelSlotId }) => void;
  onPvpHit?: (payload: {
    attackerSlot: DuelSlotId;
    targetSlot: DuelSlotId;
    damage: number;
    fromX: number;
    fromY: number;
  }) => void;
  onScoreboardUpdate?: (payload: {
    spawnId?: string;
    killerSlot?: DuelSlotId;
    rewardPoints?: number;
    momentumTriggered?: boolean;
    p1: DuelPlayerScore;
    p2: DuelPlayerScore;
    players?: DuelPlayerScore[];
  }) => void;
  onMatchFinished?: (summary: DuelVictorySummary) => void;
  onError?: (message: string) => void;
}

export async function fetchDuelDirectory(): Promise<{
  rooms: OpenDuelRoomInfo[];
  liveMatches: LiveDuelMatchInfo[];
}> {
  try {
    const res = await fetch('/api/duel/rooms');
    if (!res.ok) return { rooms: [], liveMatches: [] };
    const data = await res.json();
    return {
      rooms: Array.isArray(data.rooms) ? data.rooms : [],
      liveMatches: Array.isArray(data.liveMatches) ? data.liveMatches : [],
    };
  } catch {
    return { rooms: [], liveMatches: [] };
  }
}

export async function fetchOpenDuelRooms(): Promise<OpenDuelRoomInfo[]> {
  const { rooms } = await fetchDuelDirectory();
  return rooms;
}

export async function fetchDuelRoomPreview(roomCode: string): Promise<DuelRoomPreview> {
  const cleaned = roomCode.toUpperCase().trim();
  if (!cleaned) return { exists: false, error: 'Invalid room code' };
  try {
    const res = await fetch(`/api/duel/rooms/${encodeURIComponent(cleaned)}`);
    const data = await res.json();
    return data as DuelRoomPreview;
  } catch {
    return { exists: false, error: 'Unable to check room status' };
  }
}

export class DuelClient {
  private ws: WebSocket | null = null;
  private handlers: DuelClientHandlers;
  public roomCode: string | null = null;
  public slot: DuelSlotId | null = null;
  public isSpectator = false;

  constructor(handlers: DuelClientHandlers = {}) {
    this.handlers = handlers;
  }

  public setHandlers(handlers: DuelClientHandlers) {
    this.handlers = handlers;
  }

  private getWsUrl(): string {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws/duel`;
  }

  public async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      await new Promise<void>((resolve, reject) => {
        const ws = this.ws!;
        const onOpen = () => {
          cleanup();
          resolve();
        };
        const onErr = () => {
          cleanup();
          reject(new Error('WebSocket connection failed'));
        };
        const cleanup = () => {
          ws.removeEventListener('open', onOpen);
          ws.removeEventListener('error', onErr);
        };
        ws.addEventListener('open', onOpen);
        ws.addEventListener('error', onErr);
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.getWsUrl());
      this.ws = ws;

      let settled = false;

      ws.onopen = () => {
        settled = true;
        this.handlers.onConnectionChange?.(true);
        resolve();
      };

      ws.onerror = () => {
        this.handlers.onConnectionChange?.(false);
        this.handlers.onError?.('Unable to reach Cyber Duel WebSocket server.');
        if (!settled) {
          settled = true;
          reject(new Error('WebSocket connection failed'));
        }
      };

      ws.onclose = () => {
        this.handlers.onConnectionChange?.(false);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data));
          this.dispatchMessage(msg);
        } catch {
          // ignore malformed messages
        }
      };
    });
  }

  private dispatchMessage(msg: any) {
    switch (msg.type) {
      case 'duel:room_joined':
        this.roomCode = msg.roomCode;
        this.slot = msg.slot;
        this.isSpectator = false;
        this.handlers.onRoomJoined?.({
          slot: msg.slot,
          roomCode: msg.roomCode,
          roomState: msg.roomState,
        });
        break;
      case 'duel:spectate_joined':
        this.roomCode = msg.roomCode;
        this.slot = null;
        this.isSpectator = true;
        this.handlers.onSpectateJoined?.({
          roomCode: msg.roomCode,
          spectatorId: msg.spectatorId,
          roomState: msg.roomState,
          elapsedSeconds: msg.elapsedSeconds || 0,
          activeSpawns: msg.activeSpawns || [],
          tacticalWalls: Array.isArray(msg.tacticalWalls) ? msg.tacticalWalls : [],
          p1State: msg.p1State || null,
          p2State: msg.p2State || null,
          playerStates: msg.playerStates || undefined,
          summary: msg.summary || null,
        });
        break;
      case 'duel:room_state':
        this.handlers.onRoomState?.(msg.roomState);
        break;
      case 'duel:lobby_chat':
        if (msg.message) {
          this.handlers.onLobbyChat?.(msg.message);
        }
        break;
      case 'duel:match_started':
        this.handlers.onMatchStarted?.(msg.roomState);
        break;
      case 'duel:timer_tick':
        this.handlers.onTimerTick?.(msg.timeRemaining, msg.elapsedSeconds);
        break;
      case 'duel:spawn_wave':
        this.handlers.onSpawnWave?.(msg.waveNumber, msg.spawns || []);
        break;
      case 'duel:remote_player_state':
        this.handlers.onRemotePlayerState?.(msg.slot, msg.state);
        break;
      case 'duel:remote_projectile':
        this.handlers.onRemoteProjectile?.(msg.slot, msg.projectile);
        break;
      case 'duel:wall_deployed':
        if (msg.wall) {
          this.handlers.onWallDeployed?.(msg.wall as DuelTacticalWall);
        }
        break;
      case 'duel:wall_damaged':
        if (msg.wallId) {
          this.handlers.onWallDamaged?.({
            wallId: String(msg.wallId),
            hp: Number(msg.hp) || 0,
            maxHp: Number(msg.maxHp) || 180,
            attackerSlot: msg.attackerSlot,
          });
        }
        break;
      case 'duel:wall_destroyed':
        if (msg.wallId) {
          this.handlers.onWallDestroyed?.({
            wallId: String(msg.wallId),
            attackerSlot: msg.attackerSlot,
          });
        }
        break;
      case 'duel:pvp_hit_applied':
        this.handlers.onPvpHit?.({
          attackerSlot: msg.attackerSlot,
          targetSlot: msg.targetSlot,
          damage: msg.damage,
          fromX: msg.fromX,
          fromY: msg.fromY,
        });
        break;
      case 'duel:scoreboard_update':
        this.handlers.onScoreboardUpdate?.({
          spawnId: msg.spawnId,
          killerSlot: msg.killerSlot,
          rewardPoints: msg.rewardPoints,
          momentumTriggered: Boolean(msg.momentumTriggered),
          p1: msg.p1,
          p2: msg.p2,
          players: Array.isArray(msg.players) ? msg.players : undefined,
        });
        break;
      case 'duel:match_finished':
        this.handlers.onMatchFinished?.(msg.summary);
        break;
      case 'duel:error':
        this.handlers.onError?.(msg.message || 'Duel server error');
        break;
      default:
        break;
    }
  }

  private send(payload: Record<string, unknown>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public async createRoom(params: {
    playerName: string;
    durationSeconds: number;
    level: number;
    difficulty: DifficultyMode;
    isPublic?: boolean;
    matchFormat?: DuelMatchFormat;
    mapTheme?: ArenaMapTheme;
  }) {
    await this.connect();
    this.send({ type: 'duel:create_room', ...params });
  }

  public async joinRoom(roomCode: string, playerName: string) {
    await this.connect();
    this.send({
      type: 'duel:join_room',
      roomCode: roomCode.toUpperCase().trim(),
      playerName,
    });
  }

  public async spectateRoom(roomCode: string, playerName: string) {
    await this.connect();
    this.send({
      type: 'duel:spectate_room',
      roomCode: roomCode.toUpperCase().trim(),
      playerName,
    });
  }

  public toggleReady(ready?: boolean) {
    this.send({ type: 'duel:toggle_ready', ready });
  }

  public switchTeam(team: DuelTeamId) {
    this.send({ type: 'duel:switch_team', team });
  }

  public sendLobbyChat(text: string) {
    this.send({ type: 'duel:lobby_chat', text });
  }

  public startMatch() {
    this.send({ type: 'duel:start_match', roomCode: this.roomCode });
  }

  public requestRematch() {
    this.send({ type: 'duel:request_rematch', roomCode: this.roomCode });
  }

  public sendPlayerState(state: RemotePlayerTelemetry) {
    this.send({ type: 'duel:player_state', ...state });
  }

  public sendProjectile(projectile: RemoteProjectilePayload) {
    this.send({ type: 'duel:spawn_projectile', projectile });
  }

  public deployTacticalWall(params: { x: number; y: number; angle: number }) {
    this.send({
      type: 'duel:deploy_wall',
      x: params.x,
      y: params.y,
      angle: params.angle,
    });
  }

  public damageTacticalWall(wallId: string, damage: number) {
    this.send({
      type: 'duel:damage_wall',
      wallId,
      damage,
    });
  }

  public sendPvpHit(targetSlot: DuelSlotId, damage: number, fromX: number, fromY: number) {
    this.send({ type: 'duel:pvp_hit', targetSlot, damage, fromX, fromY });
  }

  public claimKill(params: {
    spawnId?: string;
    enemyType: EnemyType;
    comboStreak: number;
    damageDealt: number;
  }) {
    this.send({ type: 'duel:claim_kill', ...params });
  }

  public reportKO(killerSlot?: DuelSlotId) {
    this.send({ type: 'duel:report_ko', killerSlot });
  }

  public disconnect() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close();
      this.ws = null;
    }
    this.roomCode = null;
    this.slot = null;
    this.isSpectator = false;
  }
}
