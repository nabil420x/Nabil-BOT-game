export type ArenaMapTheme = 'sector' | 'cyber_forest_ruins';

export const CYBER_FOREST_BACKDROP_SRC = '/assets/aistudio/image_b2497551_f5b1d164.jpg';

export type ArenaObstacleKind = 'wall' | 'tree' | 'crystal' | 'crate';

export interface ArenaObstacle {
  id: string;
  kind: ArenaObstacleKind;
  shape: 'rect' | 'circle';
  /** Center X in world coordinates */
  x: number;
  /** Center Y in world coordinates */
  y: number;
  /** Full width for rect obstacles */
  w?: number;
  /** Full height for rect obstacles */
  h?: number;
  /** Radius for circle obstacles */
  radius?: number;
  color: string;
  accentColor: string;
  secondaryColor?: string;
}

/**
 * Builds deterministic symmetrical obstacles for the selected arena map theme.
 * `'cyber_forest_ruins'` recreates the frosted cyber-bunker walls, crystal clusters,
 * supply crates, and bioluminescent circuit trees from the reference landscape.
 */
export function buildArenaObstacles(
  mapTheme: ArenaMapTheme,
  arenaW: number = 2200,
  arenaH: number = 1600
): ArenaObstacle[] {
  if (mapTheme !== 'cyber_forest_ruins') {
    return [];
  }

  const cx = Math.round(arenaW / 2);
  const cy = Math.round(arenaH / 2);

  return [
    // Frosted metallic cyber-bunker cover walls (west & east mid-flanks)
    {
      id: 'wall_west_upper',
      kind: 'wall',
      shape: 'rect',
      x: cx - 520,
      y: cy - 260,
      w: 190,
      h: 58,
      color: '#94a3b8',
      accentColor: '#e0f2fe',
      secondaryColor: '#a855f7',
    },
    {
      id: 'wall_west_lower',
      kind: 'wall',
      shape: 'rect',
      x: cx - 520,
      y: cy + 260,
      w: 190,
      h: 58,
      color: '#94a3b8',
      accentColor: '#e0f2fe',
      secondaryColor: '#a855f7',
    },
    {
      id: 'wall_east_upper',
      kind: 'wall',
      shape: 'rect',
      x: cx + 520,
      y: cy - 260,
      w: 190,
      h: 58,
      color: '#94a3b8',
      accentColor: '#e0f2fe',
      secondaryColor: '#a855f7',
    },
    {
      id: 'wall_east_lower',
      kind: 'wall',
      shape: 'rect',
      x: cx + 520,
      y: cy + 260,
      w: 190,
      h: 58,
      color: '#94a3b8',
      accentColor: '#e0f2fe',
      secondaryColor: '#a855f7',
    },

    // Center crystal-conduit bunker pillars (framing center lane cleanly)
    {
      id: 'wall_center_north',
      kind: 'wall',
      shape: 'rect',
      x: cx,
      y: cy - 230,
      w: 250,
      h: 62,
      color: '#64748b',
      accentColor: '#e0f2fe',
      secondaryColor: '#d946ef',
    },
    {
      id: 'wall_center_south',
      kind: 'wall',
      shape: 'rect',
      x: cx,
      y: cy + 230,
      w: 250,
      h: 62,
      color: '#64748b',
      accentColor: '#e0f2fe',
      secondaryColor: '#d946ef',
    },

    // Bioluminescent Circuit Trees ("gach" cover matching the reference artwork)
    {
      id: 'tree_nw',
      kind: 'tree',
      shape: 'circle',
      x: cx - 280,
      y: cy - 360,
      radius: 48,
      color: '#14b8a6',
      accentColor: '#67e8f9',
      secondaryColor: '#facc15',
    },
    {
      id: 'tree_ne',
      kind: 'tree',
      shape: 'circle',
      x: cx + 280,
      y: cy - 360,
      radius: 48,
      color: '#14b8a6',
      accentColor: '#67e8f9',
      secondaryColor: '#facc15',
    },
    {
      id: 'tree_sw',
      kind: 'tree',
      shape: 'circle',
      x: cx - 280,
      y: cy + 360,
      radius: 48,
      color: '#14b8a6',
      accentColor: '#67e8f9',
      secondaryColor: '#facc15',
    },
    {
      id: 'tree_se',
      kind: 'tree',
      shape: 'circle',
      x: cx + 280,
      y: cy + 360,
      radius: 48,
      color: '#14b8a6',
      accentColor: '#67e8f9',
      secondaryColor: '#facc15',
    },

    // Glowing Violet & Teal Crystal Clusters near mid-lanes
    {
      id: 'crystal_west',
      kind: 'crystal',
      shape: 'circle',
      x: cx - 320,
      y: cy,
      radius: 36,
      color: '#a855f7',
      accentColor: '#38bdf8',
      secondaryColor: '#e879f9',
    },
    {
      id: 'crystal_east',
      kind: 'crystal',
      shape: 'circle',
      x: cx + 320,
      y: cy,
      radius: 36,
      color: '#a855f7',
      accentColor: '#38bdf8',
      secondaryColor: '#e879f9',
    },

    // Armored Supply Crates tucked near outer flanks
    {
      id: 'crate_nw',
      kind: 'crate',
      shape: 'rect',
      x: cx - 720,
      y: cy - 150,
      w: 58,
      h: 58,
      color: '#78350f',
      accentColor: '#d97706',
      secondaryColor: '#e0f2fe',
    },
    {
      id: 'crate_se',
      kind: 'crate',
      shape: 'rect',
      x: cx + 720,
      y: cy + 150,
      w: 58,
      h: 58,
      color: '#78350f',
      accentColor: '#d97706',
      secondaryColor: '#e0f2fe',
    },
    {
      id: 'crate_sw',
      kind: 'crate',
      shape: 'rect',
      x: cx - 720,
      y: cy + 150,
      w: 58,
      h: 58,
      color: '#78350f',
      accentColor: '#d97706',
      secondaryColor: '#e0f2fe',
    },
    {
      id: 'crate_ne',
      kind: 'crate',
      shape: 'rect',
      x: cx + 720,
      y: cy - 150,
      w: 58,
      h: 58,
      color: '#78350f',
      accentColor: '#d97706',
      secondaryColor: '#e0f2fe',
    },
  ];
}

export interface ObstacleCollisionResult {
  x: number;
  y: number;
  collided: boolean;
  normalX: number;
  normalY: number;
}

/**
 * Resolves smooth circle-vs-obstacle pushout for players so ships slide naturally
 * along frosted walls, crystal clusters, crates, and circuit trees without snagging.
 */
export function resolveCircleObstacleCollisions(
  x: number,
  y: number,
  radius: number,
  obstacles: ArenaObstacle[],
  arenaW: number = 2200,
  arenaH: number = 1600,
  wallPad: number = 15
): ObstacleCollisionResult {
  let nx = x;
  let ny = y;
  let collided = false;
  let normalX = 0;
  let normalY = 0;

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (obs.shape === 'circle') {
        const obsR = obs.radius || 32;
        const dx = nx - obs.x;
        const dy = ny - obs.y;
        const minDist = radius + obsR;
        const distSq = dx * dx + dy * dy;
        if (distSq < minDist * minDist) {
          collided = true;
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const ux = dx / dist;
            const uy = dy / dist;
            const push = minDist - dist;
            nx += ux * push;
            ny += uy * push;
            normalX = ux;
            normalY = uy;
          } else {
            nx += minDist;
            normalX = 1;
            normalY = 0;
          }
        }
      } else {
        const hw = (obs.w || 80) * 0.5;
        const hh = (obs.h || 50) * 0.5;
        const minX = obs.x - hw;
        const maxX = obs.x + hw;
        const minY = obs.y - hh;
        const maxY = obs.y + hh;

        const closestX = Math.max(minX, Math.min(maxX, nx));
        const closestY = Math.max(minY, Math.min(maxY, ny));
        const dx = nx - closestX;
        const dy = ny - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq === 0) {
          // Center is strictly inside rectangle — push out along shallowest axis
          const leftPen = nx - minX;
          const rightPen = maxX - nx;
          const topPen = ny - minY;
          const bottomPen = maxY - ny;
          const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);
          collided = true;
          if (minPen === leftPen) {
            nx = minX - radius;
            normalX = -1;
            normalY = 0;
          } else if (minPen === rightPen) {
            nx = maxX + radius;
            normalX = 1;
            normalY = 0;
          } else if (minPen === topPen) {
            ny = minY - radius;
            normalX = 0;
            normalY = -1;
          } else {
            ny = maxY + radius;
            normalX = 0;
            normalY = 1;
          }
        } else if (distSq < radius * radius) {
          collided = true;
          const dist = Math.sqrt(distSq);
          const ux = dx / dist;
          const uy = dy / dist;
          const push = radius - dist;
          nx += ux * push;
          ny += uy * push;
          normalX = ux;
          normalY = uy;
        }
      }
    }

    const pad = radius + wallPad;
    if (nx < pad) {
      nx = pad;
      collided = true;
      normalX = 1;
    } else if (nx > arenaW - pad) {
      nx = arenaW - pad;
      collided = true;
      normalX = -1;
    }
    if (ny < pad) {
      ny = pad;
      collided = true;
      normalY = 1;
    } else if (ny > arenaH - pad) {
      ny = arenaH - pad;
      collided = true;
      normalY = -1;
    }
  }

  return { x: nx, y: ny, collided, normalX, normalY };
}

/**
 * Returns the first obstacle intersected by a projectile circle, or null if clear.
 */
export function checkProjectileObstacleHit(
  px: number,
  py: number,
  pRadius: number,
  obstacles: ArenaObstacle[]
): ArenaObstacle | null {
  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    if (obs.shape === 'circle') {
      const obsR = obs.radius || 32;
      const dx = px - obs.x;
      const dy = py - obs.y;
      const rSum = pRadius + obsR;
      if (dx * dx + dy * dy <= rSum * rSum) {
        return obs;
      }
    } else {
      const hw = (obs.w || 80) * 0.5;
      const hh = (obs.h || 50) * 0.5;
      const closestX = Math.max(obs.x - hw, Math.min(obs.x + hw, px));
      const closestY = Math.max(obs.y - hh, Math.min(obs.y + hh, py));
      const dx = px - closestX;
      const dy = py - closestY;
      if (dx * dx + dy * dy <= pRadius * pRadius) {
        return obs;
      }
    }
  }
  return null;
}

/**
 * Computes guaranteed obstacle-clear spawn coordinates for Solo FFA or Team Battle slots.
 */
export function getSafeArenaSpawnPoint(params: {
  slotIndex: number;
  totalSlots: number;
  team?: 'alpha' | 'omega';
  isTeamMode: boolean;
  obstacles: ArenaObstacle[];
  arenaW?: number;
  arenaH?: number;
  playerRadius?: number;
}): { x: number; y: number; angle: number } {
  const {
    slotIndex,
    totalSlots,
    team,
    isTeamMode,
    obstacles,
    arenaW = 2200,
    arenaH = 1600,
    playerRadius = 24,
  } = params;

  let rawX = arenaW * 0.35;
  let rawY = arenaH * 0.5;
  let angle = 0;

  if (isTeamMode && team) {
    const isAlpha = team === 'alpha';
    rawX = isAlpha ? Math.round(arenaW * 0.14) : Math.round(arenaW * 0.86);
    const bandOffsets = [0, -240, 240, -420, 420];
    const offset = bandOffsets[slotIndex % bandOffsets.length];
    rawY = Math.round(arenaH * 0.5 + offset);
    angle = isAlpha ? 0 : Math.PI;
  } else if (totalSlots <= 2) {
    const isLeft = slotIndex % 2 === 0;
    rawX = isLeft ? Math.round(arenaW * 0.22) : Math.round(arenaW * 0.78);
    rawY = Math.round(arenaH * 0.5);
    angle = isLeft ? 0 : Math.PI;
  } else {
    const theta = (slotIndex / Math.max(1, totalSlots)) * Math.PI * 2 + Math.PI;
    rawX = Math.round(arenaW * 0.5 + Math.cos(theta) * (arenaW * 0.36));
    rawY = Math.round(arenaH * 0.5 + Math.sin(theta) * (arenaH * 0.36));
    angle = Math.atan2(arenaH * 0.5 - rawY, arenaW * 0.5 - rawX);
  }

  const safe = resolveCircleObstacleCollisions(rawX, rawY, playerRadius + 16, obstacles, arenaW, arenaH, 32);
  return {
    x: Math.round(safe.x),
    y: Math.round(safe.y),
    angle,
  };
}
