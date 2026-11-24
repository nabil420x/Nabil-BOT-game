import type { ArenaBarrel, ArenaBarrelType } from './types';

export interface BarrelExplosionOutcome {
  type: ArenaBarrelType;
  x: number;
  y: number;
  radius: number;
  damage: number;
  cryoFreezeSeconds: number;
  trauma: number;
  primaryColor: string;
  secondaryColor: string;
  label: string;
}

export function createArenaBarrel(
  id: number,
  type: ArenaBarrelType,
  arenaWidth: number,
  arenaHeight: number,
  playerX: number,
  playerY: number,
  wave: number,
  rng: () => number = Math.random
): ArenaBarrel {
  const margin = 170;
  const safeSpanX = Math.max(120, arenaWidth - margin * 2);
  const safeSpanY = Math.max(120, arenaHeight - margin * 2);

  let x = margin + rng() * safeSpanX;
  let y = margin + rng() * safeSpanY;

  // Retry up to 8 times so tactical barrels never spawn directly on top of the player
  for (let attempt = 0; attempt < 8; attempt++) {
    const dist = Math.hypot(x - playerX, y - playerY);
    if (dist >= 230) break;
    x = margin + rng() * safeSpanX;
    y = margin + rng() * safeSpanY;
  }

  // Fallback push-away if arena RNG clustered near player
  const finalDx = x - playerX;
  const finalDy = y - playerY;
  const finalDist = Math.hypot(finalDx, finalDy);
  if (finalDist < 220) {
    const angle = finalDist > 1 ? Math.atan2(finalDy, finalDx) : rng() * Math.PI * 2;
    x = Math.min(arenaWidth - margin, Math.max(margin, playerX + Math.cos(angle) * 260));
    y = Math.min(arenaHeight - margin, Math.max(margin, playerY + Math.sin(angle) * 260));
  }

  const maxHp = Math.max(24, Math.round(28 + Math.min(60, wave * 3)));
  return {
    id,
    type,
    x,
    y,
    radius: 19,
    hp: maxHp,
    maxHp,
    pulsePhase: rng() * Math.PI * 2,
    waveCreated: Math.max(1, wave),
  };
}

export function computeBarrelExplosionOutcome(
  barrel: ArenaBarrel,
  wave: number
): BarrelExplosionOutcome {
  const safeWave = Math.max(1, wave);
  if (barrel.type === 'cryo') {
    return {
      type: 'cryo',
      x: barrel.x,
      y: barrel.y,
      radius: 215,
      damage: 55 + safeWave * 9,
      cryoFreezeSeconds: 3.8,
      trauma: 0.16,
      primaryColor: '#38bdf8',
      secondaryColor: '#cffafe',
      label: '❄️ CRYO-NOVA STASIS!',
    };
  }

  return {
    type: 'plasma',
    x: barrel.x,
    y: barrel.y,
    radius: 195,
    damage: 120 + safeWave * 18,
    cryoFreezeSeconds: 0,
    trauma: 0.24,
    primaryColor: '#ff5500',
    secondaryColor: '#fde047',
    label: '💥 PLASMA DETONATION!',
  };
}

export function applyBarrelDamage(
  barrel: ArenaBarrel,
  damage: number
): { barrel: ArenaBarrel; destroyed: boolean } {
  const nextHp = barrel.hp - Math.max(1, damage);
  if (nextHp <= 0) {
    return {
      barrel: { ...barrel, hp: 0 },
      destroyed: true,
    };
  }
  return {
    barrel: { ...barrel, hp: nextHp },
    destroyed: false,
  };
}
