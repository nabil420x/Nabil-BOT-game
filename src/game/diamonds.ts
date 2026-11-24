export const DIAMONDS_STORAGE_KEY = 'nabilbot_diamonds';
export const DIAMOND_RELICS_KEY = 'nabilbot_diamond_relics';

export interface DiamondRelics {
  chrono_flux: boolean; // +2.5s combo window
  quantum_nanite: boolean; // Passive shield auto-repair
  solar_overcharge: boolean; // +15% Fire Rate & +20% Finisher Charge Rate
  midas_treasury: boolean; // +35% Bonus Cyber Coins from all combat drops
  void_overdrive: boolean; // +12% All Weapon & Companion Damage + +10/s Shield Recharge
}

export const DIAMOND_RELIC_COSTS: Record<keyof DiamondRelics, number> = {
  chrono_flux: 165,
  quantum_nanite: 200,
  solar_overcharge: 240,
  midas_treasury: 185,
  void_overdrive: 225,
};

export function loadDiamonds(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const val = localStorage.getItem(DIAMONDS_STORAGE_KEY);
    return val ? Math.max(0, parseInt(val, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

export function saveDiamonds(amount: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DIAMONDS_STORAGE_KEY, String(Math.max(0, Math.floor(amount))));
  } catch {
    // ignore
  }
}

export function addDiamonds(amount: number): number {
  const current = loadDiamonds();
  const next = current + Math.max(0, Math.floor(amount));
  saveDiamonds(next);
  return next;
}

export function spendDiamonds(cost: number): { success: boolean; remaining: number; error?: string } {
  const current = loadDiamonds();
  if (current < cost) {
    return {
      success: false,
      remaining: current,
      error: `Insufficient diamonds! Need ${cost} 💎, but you have ${current} 💎. Complete Daily Missions to earn diamonds.`,
    };
  }
  const next = current - cost;
  saveDiamonds(next);
  return {
    success: true,
    remaining: next,
  };
}

export function loadDiamondRelics(): DiamondRelics {
  const defaults: DiamondRelics = {
    chrono_flux: false,
    quantum_nanite: false,
    solar_overcharge: false,
    midas_treasury: false,
    void_overdrive: false,
  };
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(DIAMOND_RELICS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      chrono_flux: !!parsed.chrono_flux,
      quantum_nanite: !!parsed.quantum_nanite,
      solar_overcharge: !!parsed.solar_overcharge,
      midas_treasury: !!parsed.midas_treasury,
      void_overdrive: !!parsed.void_overdrive,
    };
  } catch {
    return defaults;
  }
}

export function saveDiamondRelics(relics: DiamondRelics): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DIAMOND_RELICS_KEY, JSON.stringify(relics));
  } catch {
    // ignore
  }
}
