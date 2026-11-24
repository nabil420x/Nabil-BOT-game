/**
 * Procedural Web Audio Synth for retro-futuristic arcade game feel
 * Zero external audio files required, zero load latency, zero HTTP requests.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private soundLastPlayedAt: Record<string, number> = {};
  private heavyNoiseCountWindowStart = 0;
  private heavyNoiseCountInWindow = 0;

  constructor() {
    // Check localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('neon_vanguard_muted');
      if (saved !== null) {
        this.isMuted = saved === 'true';
      }
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : 0.35;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private canPlay(key: string, minIntervalMs: number): boolean {
    if (this.isMuted) return false;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const last = this.soundLastPlayedAt[key] || 0;
    if (now - last < minIntervalMs) return false;
    this.soundLastPlayedAt[key] = now;
    return true;
  }

  private canSpawnHeavyNoise(minIntervalMs: number = 75): boolean {
    if (!this.canPlay('__heavy_noise_gate', minIntervalMs)) return false;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (now - this.heavyNoiseCountWindowStart > 450) {
      this.heavyNoiseCountWindowStart = now;
      this.heavyNoiseCountInWindow = 0;
    }
    if (this.heavyNoiseCountInWindow >= 4) return false;
    this.heavyNoiseCountInWindow += 1;
    return true;
  }

  private getSharedNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (!this.noiseBuffer) {
      const bufferSize = Math.max(1024, Math.floor(this.ctx.sampleRate * 0.5));
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.35,
        this.ctx.currentTime
      );
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('neon_vanguard_muted', String(this.isMuted));
    }
    return this.isMuted;
  }

  /**
   * Primary Pulse laser shot
   */
  public playPulseShoot() {
    if (!this.canPlay('pulse', 42)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Pitch varied ±8%
    const baseFreq = 580 * (0.92 + Math.random() * 0.16);
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * Scatter shotgun blast
   */
  public playScatterShoot() {
    if (!this.canPlay('scatter', 65)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Low punch
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
    oscGain.gain.setValueAtTime(0.4, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.15);

    // Burst noise (shared pre-allocated buffer, zero GC)
    const buffer = this.getSharedNoiseBuffer();
    if (!buffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.value = 1.8;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.13);
  }

  /**
   * Arc Beam sound
   */
  public playBeamShoot() {
    if (!this.canPlay('beam', 60)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(840, t);
    osc.frequency.linearRampToValueAtTime(420, t + 0.2);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  /**
   * Phase Thruster Dash whoosh
   */
  public playDash() {
    if (!this.canPlay('dash', 80)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.22);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  /**
   * Light hit impact
   */
  public playHitImpact() {
    if (!this.canPlay('hit', 48)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const freq = 260 * (0.92 + Math.random() * 0.16);
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.07);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  /**
   * Heavy explosion / KO boom
   */
  public playExplosion() {
    if (!this.canPlay('explosion', 75)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    // Sub bass drop
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.4);
    oscGain.gain.setValueAtTime(0.5, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);

    // Filtered noise rumble (shared buffer + concurrent noise cap)
    const buffer = this.canSpawnHeavyNoise(75) ? this.getSharedNoiseBuffer() : null;
    if (!buffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.35);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.36);
  }

  /**
   * Shield block / deflect metallic ding
   */
  public playShieldDeflect() {
    if (!this.canPlay('shield_deflect', 55)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(980, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Critical hit / Armor Shatter sound
   */
  public playCritHit() {
    if (!this.canPlay('crit', 55)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  /**
   * Scrap / nanite pickup chime
   */
  public playPickup() {
    if (!this.canPlay('pickup', 65)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(523.25, t); // C5
    osc1.frequency.setValueAtTime(659.25, t + 0.05); // E5
    osc1.frequency.setValueAtTime(783.99, t + 0.1); // G5

    osc2.frequency.setValueAtTime(1046.5, t + 0.1); // C6

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t + 0.1);
    osc1.stop(t + 0.25);
    osc2.stop(t + 0.25);
  }

  /**
   * Cyber Momentum 3-kill speed surge chime
   */
  public playMomentumBoost() {
    if (!this.canPlay('momentum', 200)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const notes = [587.33, 783.99, 1046.5];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.055);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.15, t + idx * 0.055 + 0.18);
      gain.gain.setValueAtTime(0.24, t + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.055 + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.055);
      osc.stop(t + idx * 0.055 + 0.22);
    });
  }

  /**
   * Telegraph charging sound for sniper laser
   */
  public playTelegraphTone() {
    if (!this.canPlay('telegraph', 160)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(950, t + 0.5);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.52);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.52);
  }

  /**
   * Victory Fanfare
   */
  public playVictory() {
    if (!this.canPlay('victory', 180)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const notes = [440, 554.37, 659.25, 880];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startT = t + idx * 0.12;
      gain.gain.setValueAtTime(0.25, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startT);
      osc.stop(startT + 0.35);
    });
  }

  /**
   * Defeat Sting
   */
  public playDefeat() {
    if (!this.canPlay('defeat', 200)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const notes = [440, 415.3, 392, 349.23];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      const startT = t + idx * 0.15;
      gain.gain.setValueAtTime(0.25, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startT);
      osc.stop(startT + 0.35);
    });
  }

  /**
   * 20-Hit Combo Finisher armed notification chime
   */
  public playFinisherReady() {
    if (!this.canPlay('finisher_ready', 220)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const notes = [659.25, 987.77, 1318.51];
    const t = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const startT = t + idx * 0.045;
      osc.frequency.setValueAtTime(freq, startT);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.08, startT + 0.22);
      gain.gain.setValueAtTime(0.24, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.24);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startT);
      osc.stop(startT + 0.24);
    });
  }

  /**
   * Combo Finisher AoE Nova Detonation (sub-bass drop + electric surge + shockwave burst)
   */
  public playComboFinisher() {
    if (!this.canPlay('combo_finisher', 250)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Deep sub-bass drop
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(190, t);
    sub.frequency.exponentialRampToValueAtTime(28, t + 0.55);
    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.58);
    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(t);
    sub.stop(t + 0.58);

    // Shimmering plasma harmonic chord
    const chord = [440, 659.25, 880];
    chord.forEach((freq) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.42);
      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.45);
    });

    // Filtered noise shockwave roar (shared noise buffer + heavy gate)
    const buffer = this.canSpawnHeavyNoise(90) ? this.getSharedNoiseBuffer() : null;
    if (!buffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, t);
    filter.frequency.exponentialRampToValueAtTime(140, t + 0.45);
    filter.Q.value = 1.1;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 0.46);
  }

  /**
   * Weapon Overheat thermal alarm + steam hiss
   */
  public playOverheat() {
    if (!this.canPlay('overheat', 250)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.32);
    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.34);

    // Steam vent noise (shared buffer)
    const buffer = this.getSharedNoiseBuffer();
    if (!buffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2200, t);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.22, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 0.29);
  }

  /**
   * Weapon cooled down & unlocked chime
   */
  public playWeaponCooldownReady() {
    if (!this.canPlay('cooldown_ready', 160)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(860, t + 0.14);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  /**
   * Cyber-Storm neon lightning discharge
   */
  public playCyberThunder() {
    if (!this.canPlay('thunder', 220)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const buffer = this.getSharedNoiseBuffer();
    if (!buffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, t);
    filter.frequency.exponentialRampToValueAtTime(90, t + 0.4);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.24, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 0.41);
  }

  /**
   * Perfect-timing Dash Overcharge electric phase chime
   */
  public playDashOvercharge() {
    if (!this.canPlay('dash_overcharge', 140)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [660, 990, 1320];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.032;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.35, start + 0.14);

      gain.gain.setValueAtTime(0.24, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.16);
    });
  }

  /**
   * Cyber-Chip Augment Draft holographic triad chime
   */
  public playAugmentDraft() {
    if (!this.canPlay('augment_draft', 200)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [440, 659.25, 880, 1174.66];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.05;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  /**
   * Cyber-Chip installed confirmation chord
   */
  public playAugmentSelect() {
    if (!this.canPlay('augment_select', 180)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 783.99, 1046.5, 1567.98];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.035;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.06, start + 0.24);
      gain.gain.setValueAtTime(0.24, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  /**
   * Multi-Kill Streak rising arcade chime scaled by streak tier
   */
  public playMultiKillFanfare(tier: number) {
    if (!this.canPlay('multikill', 110)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const clampedTier = Math.max(2, Math.min(6, tier));
    const base = 440 * Math.pow(1.12, clampedTier - 2);
    const notes = [base, base * 1.25, base * 1.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.04;
      osc.type = clampedTier >= 4 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  }

  /**
   * Golden Data-Core warp spawn sparkle
   */
  public playGoldenCoreSpawn() {
    if (!this.canPlay('golden_spawn', 240)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [880, 1174.66, 1479.98];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.055;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  /**
   * Golden Data-Core Jackpot cascade celebration
   */
  public playGoldenCoreJackpot() {
    if (!this.canPlay('golden_jackpot', 250)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const notes = [587.33, 739.99, 880, 1174.66, 1479.98, 1760];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.042;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.24, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + 0.34);
    });
  }

  /**
   * Subtle high-tech Wingman drone plasma chirp
   */
  public playWingmanLaser() {
    if (!this.canPlay('wingman', 75)) return;
    this.initCtx();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, t);
    osc.frequency.exponentialRampToValueAtTime(340, t + 0.08);
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.085);
  }
}

export const soundEngine = new SoundEngine();
