export type ShatterShardShape = 'triangle' | 'diamond' | 'prism';

export interface CyberShatterShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  aspect: number;
  rotation: number;
  angularVelocity: number;
  tiltPhase: number;
  tiltSpeed: number;
  color: string;
  edgeColor: string;
  shape: ShatterShardShape;
  life: number;
  maxLife: number;
  drag: number;
  gravity: number;
}

export interface CyberShatterRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  rotation: number;
  angularVelocity: number;
  sides: number;
  color: string;
  lineWidth: number;
  life: number;
  maxLife: number;
}

export interface CyberShatterSpark {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  drag: number;
}

export interface CyberShatterState {
  width: number;
  height: number;
  reducedMotion: boolean;
  elapsed: number;
  nextScheduledBurstAt: number;
  burstStage: number;
  shards: CyberShatterShard[];
  rings: CyberShatterRing[];
  sparks: CyberShatterSpark[];
}

export const MAX_VICTORY_SHARDS = 140;
export const MAX_VICTORY_SPARKS = 160;
export const MAX_VICTORY_RINGS = 8;

const SHARD_PALETTE: Array<{ fill: string; edge: string }> = [
  { fill: '#00f3ff', edge: '#e0f2fe' },
  { fill: '#38bdf8', edge: '#ffffff' },
  { fill: '#34d399', edge: '#d1fae5' },
  { fill: '#facc15', edge: '#fef9c3' },
  { fill: '#22d3ee', edge: '#cffafe' },
];

const SHARD_SHAPES: ShatterShardShape[] = ['triangle', 'diamond', 'prism'];

export function createCyberShatterState(
  width: number,
  height: number,
  reducedMotion: boolean = false,
  rand: () => number = Math.random
): CyberShatterState {
  const safeW = Math.max(1, Number.isFinite(width) ? width : 800);
  const safeH = Math.max(1, Number.isFinite(height) ? height : 600);
  const state: CyberShatterState = {
    width: safeW,
    height: safeH,
    reducedMotion,
    elapsed: 0,
    nextScheduledBurstAt: reducedMotion ? Number.POSITIVE_INFINITY : 0.36,
    burstStage: 0,
    shards: [],
    rings: [],
    sparks: [],
  };

  if (reducedMotion) {
    // Minimal non-distracting static prism accents when user prefers reduced motion
    emitCyberShatterBurst(state, safeW * 0.5, safeH * 0.5, 14, 0.25, rand);
    for (const shard of state.shards) {
      shard.vx *= 0.15;
      shard.vy *= 0.15;
      shard.angularVelocity = 0;
      shard.tiltSpeed = 0;
    }
    state.rings.length = 0;
    state.sparks.length = 0;
    return state;
  }

  emitCyberShatterBurst(state, safeW * 0.5, safeH * 0.5, 48, 1.0, rand);
  return state;
}

export function emitCyberShatterBurst(
  state: CyberShatterState,
  originX: number,
  originY: number,
  shardCount: number = 32,
  power: number = 1.0,
  rand: () => number = Math.random
): void {
  const ox = Number.isFinite(originX) ? originX : state.width * 0.5;
  const oy = Number.isFinite(originY) ? originY : state.height * 0.5;
  const safePower = Math.max(0.15, Math.min(2.2, Number.isFinite(power) ? power : 1.0));
  const count = Math.max(1, Math.min(80, Math.round(shardCount)));

  if (!state.reducedMotion && state.rings.length < MAX_VICTORY_RINGS) {
    const baseMaxR = Math.min(state.width, state.height) * (0.42 + rand() * 0.16) * Math.min(1.25, safePower);
    state.rings.push({
      x: ox,
      y: oy,
      radius: 18,
      maxRadius: Math.max(140, baseMaxR),
      rotation: rand() * Math.PI * 2,
      angularVelocity: (rand() > 0.5 ? 1 : -1) * (0.4 + rand() * 0.6),
      sides: rand() > 0.45 ? 8 : 6,
      color: rand() > 0.35 ? '#00f3ff' : '#facc15',
      lineWidth: 2.6,
      life: 0.72,
      maxLife: 0.72,
    });
  }

  for (let i = 0; i < count; i++) {
    if (state.shards.length >= MAX_VICTORY_SHARDS) {
      state.shards.shift();
    }
    const angle = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.36;
    const speed = (150 + rand() * 440) * safePower;
    const palette = SHARD_PALETTE[i % SHARD_PALETTE.length];
    const shape = SHARD_SHAPES[i % SHARD_SHAPES.length];
    const maxLife = 1.35 + rand() * 1.15;

    state.shards.push({
      x: ox + Math.cos(angle) * (8 + rand() * 24),
      y: oy + Math.sin(angle) * (8 + rand() * 24),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 45 * safePower,
      size: 6 + rand() * 10,
      aspect: 0.45 + rand() * 0.45,
      rotation: angle + rand() * Math.PI,
      angularVelocity: (rand() - 0.5) * 9.5,
      tiltPhase: rand() * Math.PI * 2,
      tiltSpeed: 4 + rand() * 6,
      color: palette.fill,
      edgeColor: palette.edge,
      shape,
      life: maxLife,
      maxLife,
      drag: 1.85 + rand() * 0.8,
      gravity: 95 + rand() * 75,
    });
  }

  if (!state.reducedMotion) {
    const sparkCount = Math.min(44, Math.round(count * 0.9));
    for (let s = 0; s < sparkCount; s++) {
      if (state.sparks.length >= MAX_VICTORY_SPARKS) {
        state.sparks.shift();
      }
      const angle = rand() * Math.PI * 2;
      const speed = (280 + rand() * 560) * safePower;
      const maxLife = 0.48 + rand() * 0.52;
      const sx = ox + Math.cos(angle) * 6;
      const sy = oy + Math.sin(angle) * 6;
      state.sparks.push({
        x: sx,
        y: sy,
        prevX: sx,
        prevY: sy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: s % 4 === 0 ? '#facc15' : s % 3 === 0 ? '#34d399' : '#00f3ff',
        life: maxLife,
        maxLife,
        drag: 3.1,
      });
    }
  }
}

export function stepCyberShatterState(
  state: CyberShatterState,
  rawDt: number,
  rand: () => number = Math.random
): void {
  const dt = Math.max(0.001, Math.min(0.05, Number.isFinite(rawDt) ? rawDt : 0.016));
  state.elapsed += dt;

  // Scheduled follow-up cyber-shatter waves around the victory frame
  if (!state.reducedMotion && state.elapsed >= state.nextScheduledBurstAt) {
    state.burstStage += 1;
    if (state.burstStage === 1) {
      emitCyberShatterBurst(state, state.width * 0.24, state.height * 0.34, 28, 0.85, rand);
      state.nextScheduledBurstAt = 0.74;
    } else if (state.burstStage === 2) {
      emitCyberShatterBurst(state, state.width * 0.76, state.height * 0.34, 28, 0.85, rand);
      state.nextScheduledBurstAt = 1.28;
    } else if (state.burstStage === 3) {
      emitCyberShatterBurst(state, state.width * 0.5, state.height * 0.26, 32, 0.92, rand);
      state.nextScheduledBurstAt = state.elapsed + 2.4;
    } else {
      const rx = state.width * (0.2 + rand() * 0.6);
      const ry = state.height * (0.22 + rand() * 0.45);
      emitCyberShatterBurst(state, rx, ry, 20, 0.7, rand);
      state.nextScheduledBurstAt = state.elapsed + 2.6;
    }
  }

  for (let i = state.rings.length - 1; i >= 0; i--) {
    const r = state.rings[i];
    r.life -= dt;
    if (r.life <= 0) {
      state.rings.splice(i, 1);
      continue;
    }
    const progress = 1 - r.life / Math.max(0.01, r.maxLife);
    const eased = 1 - Math.pow(1 - progress, 3);
    r.radius = 18 + (r.maxRadius - 18) * eased;
    r.rotation += r.angularVelocity * dt;
  }

  for (let i = state.shards.length - 1; i >= 0; i--) {
    const s = state.shards[i];
    s.life -= dt;
    if (s.life <= 0) {
      state.shards.splice(i, 1);
      continue;
    }
    const damping = Math.exp(-s.drag * dt);
    s.vx *= damping;
    s.vy = s.vy * damping + s.gravity * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.rotation += s.angularVelocity * dt;
    s.tiltPhase += s.tiltSpeed * dt;
  }

  for (let i = state.sparks.length - 1; i >= 0; i--) {
    const sp = state.sparks[i];
    sp.life -= dt;
    if (sp.life <= 0) {
      state.sparks.splice(i, 1);
      continue;
    }
    sp.prevX = sp.x;
    sp.prevY = sp.y;
    const damping = Math.exp(-sp.drag * dt);
    sp.vx *= damping;
    sp.vy *= damping;
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
  }
}

export function renderCyberShatterFrame(
  ctx: CanvasRenderingContext2D,
  state: CyberShatterState
): void {
  ctx.clearRect(0, 0, state.width, state.height);

  // 1. Expanding polygonal cyber-prism shockwaves
  for (let i = 0; i < state.rings.length; i++) {
    const r = state.rings[i];
    const alpha = Math.max(0, Math.min(1, r.life / Math.max(0.01, r.maxLife)));
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.rotation);
    ctx.globalAlpha = alpha * 0.65;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.lineWidth * (0.4 + alpha * 0.6);
    ctx.beginPath();
    for (let k = 0; k < r.sides; k++) {
      const a = (k / r.sides) * Math.PI * 2;
      const px = Math.cos(a) * r.radius;
      const py = Math.sin(a) * r.radius;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // 2. High-velocity cyber-shatter streaks
  ctx.lineCap = 'round';
  for (let i = 0; i < state.sparks.length; i++) {
    const sp = state.sparks[i];
    const alpha = Math.max(0, Math.min(1, sp.life / Math.max(0.01, sp.maxLife)));
    ctx.save();
    ctx.globalAlpha = alpha * 0.9;
    ctx.strokeStyle = sp.color;
    ctx.lineWidth = 1.6 + alpha * 1.4;
    ctx.beginPath();
    ctx.moveTo(sp.prevX, sp.prevY);
    ctx.lineTo(sp.x, sp.y);
    ctx.stroke();
    ctx.restore();
  }

  // 3. Tumbling crystalline cyber-shatter shards
  for (let i = 0; i < state.shards.length; i++) {
    const s = state.shards[i];
    const alpha = Math.max(0, Math.min(1, (s.life / Math.max(0.01, s.maxLife)) * 1.35));
    const tiltScale = state.reducedMotion ? 1 : 0.35 + 0.65 * Math.abs(Math.cos(s.tiltPhase));
    const glint = state.reducedMotion ? 0.5 : Math.abs(Math.sin(s.tiltPhase));
    const w = s.size;
    const h = s.size * s.aspect * tiltScale;

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.color;
    ctx.strokeStyle = glint > 0.72 ? '#ffffff' : s.edgeColor;
    ctx.lineWidth = 1.15;

    ctx.beginPath();
    if (s.shape === 'triangle') {
      ctx.moveTo(w, 0);
      ctx.lineTo(-w * 0.75, -h);
      ctx.lineTo(-w * 0.45, h * 0.85);
    } else if (s.shape === 'diamond') {
      ctx.moveTo(w, 0);
      ctx.lineTo(0, -h);
      ctx.lineTo(-w, 0);
      ctx.lineTo(0, h);
    } else {
      ctx.moveTo(w, -h * 0.35);
      ctx.lineTo(-w * 0.4, -h);
      ctx.lineTo(-w, h * 0.45);
      ctx.lineTo(w * 0.25, h);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner specular shard highlight
    if (glint > 0.55) {
      ctx.globalAlpha = alpha * 0.45;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(w * 0.65, 0);
      ctx.lineTo(-w * 0.1, -h * 0.45);
      ctx.lineTo(-w * 0.2, h * 0.2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
