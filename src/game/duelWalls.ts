import type { DuelMatchFormat, DuelSlotId, DuelTeamId } from './duel.ts';

export const TACTICAL_WALL_IMAGE_SRC = '/assets/aistudio/image_ad8c5361_07de5611.jpg';

export const TACTICAL_WALL_MAX_HP = 180;
export const TACTICAL_WALL_HALF_WIDTH = 56;
export const TACTICAL_WALL_HALF_THICKNESS = 14;
export const TACTICAL_WALL_DEPLOY_DISTANCE = 64;
export const TACTICAL_WALL_DURATION_SECONDS = 3; // Auto-destroys after 3 seconds if not shattered earlier
export const TACTICAL_WALL_MAX_CHARGES = 2;
export const TACTICAL_WALL_RECHARGE_SECONDS = 6.0;
export const TACTICAL_WALL_MAX_ACTIVE_PER_PLAYER = 4;

export interface DuelTacticalWall {
  id: string;
  ownerSlot: DuelSlotId;
  ownerTeam?: DuelTeamId;
  color: string;
  x: number;
  y: number;
  angle: number;
  halfWidth: number;
  halfThickness: number;
  hp: number;
  maxHp: number;
  ttl: number;
  maxTtl: number;
  hitFlash: number;
}

export interface TacticalWallChargeSlotState {
  charges: number;
  maxCharges: number;
  cooldownTimer: number;
  cooldownTotal: number;
}

export function createInitialTacticalWallChargeState(): TacticalWallChargeSlotState {
  return {
    charges: TACTICAL_WALL_MAX_CHARGES,
    maxCharges: TACTICAL_WALL_MAX_CHARGES,
    cooldownTimer: 0,
    cooldownTotal: TACTICAL_WALL_RECHARGE_SECONDS,
  };
}

export function stepTacticalWallChargeState(
  state: TacticalWallChargeSlotState,
  dt: number
): TacticalWallChargeSlotState {
  if (state.charges >= state.maxCharges) {
    return {
      ...state,
      charges: state.maxCharges,
      cooldownTimer: 0,
    };
  }
  let charges = state.charges;
  let timer = state.cooldownTimer - Math.max(0, dt);
  while (timer <= 0 && charges < state.maxCharges) {
    charges += 1;
    if (charges < state.maxCharges) {
      timer += state.cooldownTotal;
    } else {
      timer = 0;
    }
  }
  return {
    ...state,
    charges,
    cooldownTimer: Math.max(0, timer),
  };
}

export function consumeTacticalWallCharge(
  state: TacticalWallChargeSlotState
): { consumed: boolean; nextState: TacticalWallChargeSlotState } {
  if (state.charges <= 0) {
    return { consumed: false, nextState: state };
  }
  const nextCharges = state.charges - 1;
  const nextTimer =
    state.cooldownTimer > 0 ? state.cooldownTimer : state.cooldownTotal;
  return {
    consumed: true,
    nextState: {
      ...state,
      charges: nextCharges,
      cooldownTimer: nextCharges < state.maxCharges ? nextTimer : 0,
    },
  };
}

export function computeWallPlacement(params: {
  playerX: number;
  playerY: number;
  angle: number;
  arenaW: number;
  arenaH: number;
  deployDistance?: number;
  margin?: number;
}): { x: number; y: number; angle: number } {
  const dist = params.deployDistance ?? TACTICAL_WALL_DEPLOY_DISTANCE;
  const margin = params.margin ?? 48;
  const rawX = params.playerX + Math.cos(params.angle) * dist;
  const rawY = params.playerY + Math.sin(params.angle) * dist;
  return {
    x: Math.round(Math.max(margin, Math.min(params.arenaW - margin, rawX)) * 10) / 10,
    y: Math.round(Math.max(margin, Math.min(params.arenaH - margin, rawY)) * 10) / 10,
    angle: Number(params.angle.toFixed(4)),
  };
}

export function createTacticalWall(params: {
  id: string;
  ownerSlot: DuelSlotId;
  ownerTeam?: DuelTeamId;
  color: string;
  x: number;
  y: number;
  angle: number;
  hp?: number;
  maxHp?: number;
  ttl?: number;
}): DuelTacticalWall {
  const maxHp = params.maxHp ?? TACTICAL_WALL_MAX_HP;
  const maxTtl = params.ttl ?? TACTICAL_WALL_DURATION_SECONDS;
  return {
    id: params.id,
    ownerSlot: params.ownerSlot,
    ownerTeam: params.ownerTeam,
    color: params.color,
    x: params.x,
    y: params.y,
    angle: params.angle,
    halfWidth: TACTICAL_WALL_HALF_WIDTH,
    halfThickness: TACTICAL_WALL_HALF_THICKNESS,
    hp: params.hp ?? maxHp,
    maxHp,
    ttl: maxTtl,
    maxTtl,
    hitFlash: 0,
  };
}

export function enforceOwnerWallCap(
  walls: DuelTacticalWall[],
  ownerSlot: DuelSlotId,
  maxActivePerPlayer: number = TACTICAL_WALL_MAX_ACTIVE_PER_PLAYER
): DuelTacticalWall[] {
  const ownerWalls = walls.filter((w) => w.ownerSlot === ownerSlot);
  if (ownerWalls.length <= maxActivePerPlayer) return walls;
  const toDropCount = ownerWalls.length - maxActivePerPlayer;
  const dropIds = new Set(ownerWalls.slice(0, toDropCount).map((w) => w.id));
  return walls.filter((w) => !dropIds.has(w.id));
}

export function stepTacticalWalls(
  walls: DuelTacticalWall[],
  dt: number
): { walls: DuelTacticalWall[]; expiredIds: string[] } {
  const next: DuelTacticalWall[] = [];
  const expiredIds: string[] = [];
  const safeDt = Math.max(0, dt);
  for (const wall of walls) {
    if (wall.hp <= 0) {
      expiredIds.push(wall.id);
      continue;
    }
    const usesTimedTtl = wall.maxTtl > 0;
    const ttl = usesTimedTtl ? wall.ttl - safeDt : wall.ttl;
    if (usesTimedTtl && ttl <= 0) {
      expiredIds.push(wall.id);
      continue;
    }
    next.push({
      ...wall,
      ttl,
      hitFlash: Math.max(0, (wall.hitFlash || 0) - safeDt * 4.5),
    });
  }
  return { walls: next, expiredIds };
}

export function canProjectileHitTacticalWall(_params: {
  wall: Pick<DuelTacticalWall, 'ownerSlot' | 'ownerTeam'>;
  isEnemyProjectile?: boolean;
  projectileOwnerSlot?: DuelSlotId;
  projectileOwnerTeam?: DuelTeamId;
  matchFormat?: DuelMatchFormat;
}): boolean {
  // Solid tactical cover: nobody's gunfire (enemy, teammate, owner, or bot) passes through the wall
  return true;
}

export function checkCircleTacticalWallHit(
  cx: number,
  cy: number,
  cRadius: number,
  wall: Pick<DuelTacticalWall, 'x' | 'y' | 'angle' | 'halfWidth' | 'halfThickness'>
): { hit: boolean; pushX: number; pushY: number; normalX: number; normalY: number } {
  const nx = Math.cos(wall.angle);
  const ny = Math.sin(wall.angle);
  const tx = -ny;
  const ty = nx;

  const dx = cx - wall.x;
  const dy = cy - wall.y;
  const localN = dx * nx + dy * ny;
  const localT = dx * tx + dy * ty;

  const clampedN = Math.max(-wall.halfThickness, Math.min(wall.halfThickness, localN));
  const clampedT = Math.max(-wall.halfWidth, Math.min(wall.halfWidth, localT));

  const diffN = localN - clampedN;
  const diffT = localT - clampedT;
  const distSq = diffN * diffN + diffT * diffT;

  if (distSq > cRadius * cRadius) {
    return { hit: false, pushX: 0, pushY: 0, normalX: 0, normalY: 0 };
  }

  let pushLocalN = 0;
  let pushLocalT = 0;
  let normalLocalN = 0;
  let normalLocalT = 0;

  if (distSq > 0.0001) {
    const dist = Math.sqrt(distSq);
    const overlap = cRadius - dist;
    normalLocalN = diffN / dist;
    normalLocalT = diffT / dist;
    pushLocalN = normalLocalN * overlap;
    pushLocalT = normalLocalT * overlap;
  } else {
    const penN = wall.halfThickness - Math.abs(localN);
    const penT = wall.halfWidth - Math.abs(localT);
    if (penN <= penT) {
      normalLocalN = localN >= 0 ? 1 : -1;
      pushLocalN = normalLocalN * (penN + cRadius);
    } else {
      normalLocalT = localT >= 0 ? 1 : -1;
      pushLocalT = normalLocalT * (penT + cRadius);
    }
  }

  return {
    hit: true,
    pushX: pushLocalN * nx + pushLocalT * tx,
    pushY: pushLocalN * ny + pushLocalT * ty,
    normalX: normalLocalN * nx + normalLocalT * tx,
    normalY: normalLocalN * ny + normalLocalT * ty,
  };
}

export function resolveCircleTacticalWallCollisions(
  cx: number,
  cy: number,
  cRadius: number,
  walls: DuelTacticalWall[],
  arenaW: number,
  arenaH: number,
  margin: number = 15
): { x: number; y: number; collided: boolean; normalX: number; normalY: number } {
  let x = cx;
  let y = cy;
  let collided = false;
  let normalX = 0;
  let normalY = 0;

  for (const wall of walls) {
    if (wall.hp <= 0) continue;
    const res = checkCircleTacticalWallHit(x, y, cRadius, wall);
    if (res.hit) {
      x += res.pushX;
      y += res.pushY;
      collided = true;
      normalX = res.normalX;
      normalY = res.normalY;
    }
  }

  const minBound = cRadius + margin;
  x = Math.max(minBound, Math.min(arenaW - minBound, x));
  y = Math.max(minBound, Math.min(arenaH - minBound, y));

  return { x, y, collided, normalX, normalY };
}

export function findProjectileTacticalWallHit(params: {
  prevX: number;
  prevY: number;
  x: number;
  y: number;
  radius: number;
  walls: DuelTacticalWall[];
  isEnemyProjectile?: boolean;
  projectileOwnerSlot?: DuelSlotId;
  projectileOwnerTeam?: DuelTeamId;
  matchFormat?: DuelMatchFormat;
}): { wall: DuelTacticalWall; hitX: number; hitY: number } | null {
  const { prevX, prevY, x, y, radius, walls } = params;
  // Sub-sample swept segment inclusive of spawn/origin (s=0 -> 1) so no bullet starts inside or tunnels past
  const steps = 4;
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const sx = prevX + (x - prevX) * t;
    const sy = prevY + (y - prevY) * t;
    for (const wall of walls) {
      if (wall.hp <= 0) continue;
      if (
        !canProjectileHitTacticalWall({
          wall,
          isEnemyProjectile: params.isEnemyProjectile,
          projectileOwnerSlot: params.projectileOwnerSlot,
          projectileOwnerTeam: params.projectileOwnerTeam,
          matchFormat: params.matchFormat,
        })
      ) {
        continue;
      }
      if (checkCircleTacticalWallHit(sx, sy, radius, wall).hit) {
        return { wall, hitX: sx, hitY: sy };
      }
    }
  }
  return null;
}

export function applyDamageToTacticalWall(
  wall: DuelTacticalWall,
  rawDamage: number
): {
  wall: DuelTacticalWall;
  damageApplied: number;
  destroyed: boolean;
} {
  const damageApplied = Math.max(1, Math.round(rawDamage));
  const nextHp = Math.max(0, wall.hp - damageApplied);
  const destroyed = nextHp <= 0;
  return {
    wall: {
      ...wall,
      hp: nextHp,
      hitFlash: 1.0,
    },
    damageApplied,
    destroyed,
  };
}
