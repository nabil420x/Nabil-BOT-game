import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, CheckCircle, Clock, Sparkles, X, Flame, ExternalLink } from 'lucide-react';
import {
  DailyMissionsState,
  DailyMission,
  DailyStreakState,
  SocialFollowState,
  CelebrationParticle,
  CelebrationVariant,
} from '../game/types';
import {
  DAILY_STREAK_REWARD_LADDER,
  FACEBOOK_FOLLOW_URL,
  FACEBOOK_FOLLOW_REWARD_DIAMONDS,
  loadDailyMissionsState,
  claimMissionReward,
  getUnclaimedMissionsCount,
  loadDailyStreakState,
  getDailyStreakSnapshot,
  claimDailyStreakReward,
  loadFacebookFollowState,
  markFacebookFollowVisited,
  claimFacebookFollowReward,
  generateCelebrationParticles,
  stepCelebrationParticles,
} from '../game/missions';
import { soundEngine } from '../game/audio';

interface CelebrationRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  diamonds: number;
  onRewardClaimed: (claimedCoins: number, claimedDiamonds: number) => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  isOpen,
  onClose,
  coins,
  diamonds,
  onRewardClaimed,
}) => {
  const [missionsState, setMissionsState] = useState<DailyMissionsState>(() => loadDailyMissionsState());
  const [streakState, setStreakState] = useState<DailyStreakState>(() => loadDailyStreakState());
  const [fbFollowState, setFbFollowState] = useState<SocialFollowState>(() => loadFacebookFollowState());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [burstCount, setBurstCount] = useState(0);

  const modalCardRef = useRef<HTMLDivElement | null>(null);
  const celebrationCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<CelebrationParticle[]>([]);
  const ringsRef = useRef<CelebrationRing[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  const stopCelebrationLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    particlesRef.current = [];
    ringsRef.current = [];
    lastTsRef.current = 0;
    const canvas = celebrationCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setIsCelebrating(false);
  }, []);

  const renderCelebrationFrame = useCallback(
    (ts: number) => {
      const canvas = celebrationCanvasRef.current;
      const card = modalCardRef.current;
      if (!canvas || !card) {
        stopCelebrationLoop();
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const cssW = Math.max(1, card.clientWidth);
      const cssH = Math.max(1, card.clientHeight);
      const targetW = Math.round(cssW * dpr);
      const targetH = Math.round(cssH * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const dt = lastTsRef.current ? Math.min(0.05, Math.max(0.008, (ts - lastTsRef.current) / 1000)) : 0.016;
      lastTsRef.current = ts;

      particlesRef.current = stepCelebrationParticles(particlesRef.current, dt);

      const nextRings: CelebrationRing[] = [];
      for (let i = 0; i < ringsRef.current.length; i++) {
        const ring = ringsRef.current[i];
        const nextLife = ring.life - dt;
        if (nextLife <= 0) continue;
        const progress = 1 - nextLife / ring.maxLife;
        nextRings.push({
          ...ring,
          radius: 14 + (ring.maxRadius - 14) * (1 - Math.pow(1 - progress, 2)),
          life: nextLife,
        });
      }
      ringsRef.current = nextRings;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, cssW, cssH);

        // Draw expanding radial shockwave rings
        for (let i = 0; i < ringsRef.current.length; i++) {
          const r = ringsRef.current[i];
          const alpha = Math.max(0, r.life / r.maxLife) * 0.75;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = r.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Draw celebratory coins, diamonds, stars & sparks
        for (let i = 0; i < particlesRef.current.length; i++) {
          const p = particlesRef.current[i];
          const alpha = Math.min(1, Math.max(0, p.life / Math.min(0.35, p.maxLife)));
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.strokeStyle = '#ffffff';

          if (p.shape === 'coin') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.65, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 1.2;
            ctx.globalAlpha = alpha * 0.85;
            ctx.stroke();
          } else if (p.shape === 'diamond') {
            const s = p.size * 0.85;
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s * 0.72, 0);
            ctx.lineTo(0, s);
            ctx.lineTo(-s * 0.72, 0);
            ctx.closePath();
            ctx.fill();
            ctx.lineWidth = 1.1;
            ctx.stroke();
          } else if (p.shape === 'star') {
            const outer = p.size * 0.9;
            const inner = p.size * 0.34;
            ctx.beginPath();
            for (let k = 0; k < 8; k++) {
              const r = k % 2 === 0 ? outer : inner;
              const a = (k * Math.PI) / 4;
              if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
              else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        ctx.restore();
      }

      if (particlesRef.current.length > 0 || ringsRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(renderCelebrationFrame);
      } else {
        rafRef.current = null;
        lastTsRef.current = 0;
        setIsCelebrating(false);
      }
    },
    [stopCelebrationLoop]
  );

  const triggerCelebrationBurst = useCallback(
    (buttonEl: HTMLButtonElement | null, variant: CelebrationVariant) => {
      const card = modalCardRef.current;
      if (!card) return;

      const cardRect = card.getBoundingClientRect();
      let originX = cardRect.width * 0.5;
      let originY = cardRect.height * 0.45;
      if (buttonEl) {
        const btnRect = buttonEl.getBoundingClientRect();
        originX = btnRect.left - cardRect.left + btnRect.width * 0.5;
        originY = btnRect.top - cardRect.top + btnRect.height * 0.5;
      }

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const count = prefersReducedMotion ? 10 : variant === 'diamond' ? 46 : 36;
      const newParticles = generateCelebrationParticles(originX, originY, variant, count);
      particlesRef.current = [...particlesRef.current.slice(-140), ...newParticles];

      const ringColor = variant === 'diamond' ? '#00f3ff' : variant === 'streak' ? '#fb923c' : '#fbbf24';
      ringsRef.current.push(
        { x: originX, y: originY, radius: 14, maxRadius: 150, life: 0.48, maxLife: 0.48, color: ringColor },
        { x: originX, y: originY, radius: 10, maxRadius: 95, life: 0.36, maxLife: 0.36, color: '#ffffff' }
      );

      setIsCelebrating(true);
      setBurstCount((prev) => prev + 1);

      if (rafRef.current === null) {
        lastTsRef.current = 0;
        rafRef.current = requestAnimationFrame(renderCelebrationFrame);
      }
    },
    [renderCelebrationFrame]
  );

  useEffect(() => {
    if (isOpen) {
      setMissionsState(loadDailyMissionsState());
      setStreakState(loadDailyStreakState());
      setFbFollowState(loadFacebookFollowState());
    } else {
      stopCelebrationLoop();
    }
  }, [isOpen, stopCelebrationLoop]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const diffMs = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeUntilReset(
        `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const handleClaim = (missionId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const buttonEl = e.currentTarget;
    const res = claimMissionReward(missionId);
    if (res.success) {
      soundEngine.playVictory();
      setMissionsState(res.updatedState);
      onRewardClaimed(res.rewardCoins, res.rewardDiamonds);
      triggerCelebrationBurst(buttonEl, 'mission');
      setToastMessage(`★ REWARD CLAIMED: +${res.rewardCoins} COINS & +${res.rewardDiamonds} 💎! ★`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const handleClaimStreak = (e: React.MouseEvent<HTMLButtonElement>) => {
    const buttonEl = e.currentTarget;
    const res = claimDailyStreakReward();
    if (res.success) {
      soundEngine.playVictory();
      setStreakState(res.updatedState);
      onRewardClaimed(res.rewardCoins, res.rewardDiamonds);
      triggerCelebrationBurst(buttonEl, 'streak');
      setToastMessage(`🔥 DAY ${res.streakDay} STREAK CLAIMED: +${res.rewardCoins} COINS & +${res.rewardDiamonds} 💎! 🔥`);
      setTimeout(() => setToastMessage(null), 3200);
    }
  };

  const handleVisitFacebook = () => {
    soundEngine.playPickup();
    const updated = markFacebookFollowVisited();
    setFbFollowState(updated);
  };

  const handleClaimFacebookFollow = (e: React.MouseEvent<HTMLButtonElement>) => {
    const buttonEl = e.currentTarget;
    const res = claimFacebookFollowReward();
    if (res.success) {
      soundEngine.playVictory();
      setFbFollowState(res.updatedState);
      onRewardClaimed(0, res.rewardDiamonds);
      triggerCelebrationBurst(buttonEl, 'diamond');
      setToastMessage(`💎 +${res.rewardDiamonds} CYBER DIAMONDS CLAIMED FOR FOLLOWING ON FACEBOOK! 💎`);
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const unclaimedCount = getUnclaimedMissionsCount(missionsState);
  const streakSnap = getDailyStreakSnapshot(streakState);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none">
      <div
        ref={modalCardRef}
        data-celebration-active={isCelebrating ? 'true' : 'false'}
        data-celebration-bursts={burstCount}
        className="relative w-full max-w-3xl bg-[#090d19] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,243,255,0.25)] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Celebratory Particle Burst Canvas Overlay */}
        <canvas
          ref={celebrationCanvasRef}
          data-testid="daily-claim-celebration"
          className="pointer-events-none absolute inset-0 z-30 w-full h-full"
        />
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cyan-500/20 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black tracking-wider text-white">
                  DAILY COMBAT MISSIONS
                </h2>
                {unclaimedCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs animate-pulse">
                    {unclaimedCount} REWARDS READY
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Complete daily tactical objectives in the combat arena to harvest bonus Cyber Coins & exclusive Cyber Diamonds 💎
              </p>
              <p className="text-[11px] text-cyan-300 font-mono mt-0.5 font-bold">
                (💎 Cyber Diamonds can ONLY be obtained from Daily Missions!)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Sub-Header */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>DAILY CYCLE RESETS IN:</span>
            <span className="text-cyan-300 font-bold font-mono-numbers">{timeUntilReset}</span>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-slate-400">WALLET:</span>
            <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold font-mono-numbers">
              🪙 {coins.toLocaleString()} COINS
            </span>
            <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-black font-mono-numbers shadow-[0_0_10px_rgba(0,243,255,0.25)]">
              💎 {diamonds.toLocaleString()} DIAMONDS
            </span>
          </div>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold font-mono text-center shadow-[0_0_20px_rgba(255,180,0,0.3)] animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* Scrollable Body: Daily Streak Tracker + Missions List */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          {/* Daily Play Streak Card */}
          <div
            data-testid="daily-streak-banner"
            className="p-4 rounded-xl bg-gradient-to-r from-amber-950/35 via-slate-900/90 to-cyan-950/35 border border-amber-500/40 shadow-[0_0_24px_rgba(245,158,11,0.12)]"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      data-testid="daily-streak-count"
                      className="text-sm sm:text-base font-black tracking-wider text-amber-300 font-mono-numbers"
                    >
                      {streakSnap.currentStreak} DAY{streakSnap.currentStreak === 1 ? '' : 'S'} STREAK
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700 text-[10px] font-mono text-slate-300">
                      BEST: {streakSnap.bestStreak}D
                    </span>
                    {streakSnap.hasPlayedToday && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-mono font-bold text-emerald-300">
                        PLAYED TODAY
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono mt-0.5">
                    Play on consecutive days to boost daily streak bonus Coins &amp; Cyber Diamonds.
                  </p>
                </div>
              </div>

              {streakSnap.hasClaimedToday ? (
                <button
                  type="button"
                  disabled
                  data-testid="claim-streak-btn"
                  className="px-3.5 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-bold font-mono uppercase tracking-wider cursor-not-allowed flex items-center gap-1.5 shrink-0"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>STREAK CLAIMED</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClaimStreak}
                  data-testid="claim-streak-btn"
                  className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs tracking-wider uppercase shadow-[0_0_18px_rgba(245,158,11,0.45)] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Flame className="w-4 h-4 fill-slate-950" />
                  <span>
                    CLAIM DAY {streakSnap.claimableDay} (+{streakSnap.todayReward.coins}🪙 +{streakSnap.todayReward.diamonds}💎)
                  </span>
                </button>
              )}
            </div>

            {/* 7-Day Consecutive Streak Ladder */}
            <div className="grid grid-cols-7 gap-1.5">
              {DAILY_STREAK_REWARD_LADDER.map((tier) => {
                const isCompletedDay =
                  streakSnap.hasClaimedToday
                    ? tier.day <= ((streakSnap.currentStreak - 1) % 7) + 1
                    : tier.day < streakSnap.cycleDay;
                const isTodayTarget = !streakSnap.hasClaimedToday && tier.day === streakSnap.cycleDay;

                return (
                  <div
                    key={tier.day}
                    className={`p-1.5 rounded-lg border text-center font-mono transition-all ${
                      isTodayTarget
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                        : isCompletedDay
                        ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-[9px] font-bold">
                      {isCompletedDay ? '✓ ' : ''}D{tier.day}
                    </div>
                    <div className="text-[10px] font-bold text-amber-300 font-mono-numbers">
                      +{tier.coins}🪙
                    </div>
                    <div className="text-[10px] font-black text-cyan-300 font-mono-numbers">
                      +{tier.diamonds}💎
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {missionsState.missions.map((mission: DailyMission) => {
            const currentVal = mission.currentValue ?? mission.currentProgress ?? 0;
            const targetVal = mission.targetValue ?? mission.targetProgress ?? 1;
            const isClaimed = mission.isClaimed ?? mission.claimed ?? false;
            const isComplete = currentVal >= targetVal;
            const progressRatio = Math.min(1, currentVal / targetVal);

            return (
              <div
                key={mission.id}
                className={`p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isClaimed
                    ? 'bg-slate-950/40 border-slate-800 opacity-60'
                    : isComplete
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_20px_rgba(255,180,0,0.15)]'
                    : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Mission Details */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`p-2.5 rounded-lg border text-lg shrink-0 mt-0.5 ${
                      isClaimed
                        ? 'bg-slate-800 border-slate-700 text-slate-500'
                        : isComplete
                        ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                        : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                    }`}
                  >
                    {isClaimed ? '✓' : isComplete ? '★' : '🎯'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white tracking-wide">{mission.title}</h3>
                      {isClaimed && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          CLAIMED
                        </span>
                      )}
                      {!isClaimed && isComplete && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 font-bold animate-pulse">
                          OBJECTIVE COMPLETED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono leading-relaxed">
                      {mission.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isClaimed
                              ? 'bg-slate-600'
                              : isComplete
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                              : 'bg-gradient-to-r from-cyan-500 to-blue-400'
                          }`}
                          style={{ width: `${progressRatio * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-300 font-mono-numbers shrink-0">
                        {Math.min(currentVal, targetVal)}/{targetVal}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reward & Claim Button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                      <span>🪙</span>
                      <span>+{mission.rewardCoins}</span>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-black font-mono shadow-[0_0_8px_rgba(0,243,255,0.2)]">
                      <span>💎</span>
                      <span>+{mission.rewardDiamonds ?? 1}</span>
                    </div>
                  </div>

                  {isClaimed ? (
                    <button
                      disabled
                      className="px-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-500 text-xs font-bold tracking-wider uppercase font-mono cursor-not-allowed flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>CLAIMED</span>
                    </button>
                  ) : isComplete ? (
                    <button
                      onClick={(e) => handleClaim(mission.id, e)}
                      data-testid={`claim-mission-${mission.id}`}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(255,180,0,0.5)] transition-all cursor-pointer flex items-center gap-1.5 transform active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>CLAIM REWARD</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold tracking-wider uppercase font-mono cursor-not-allowed flex items-center gap-1.5"
                    >
                      <span>IN PROGRESS</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Special Community Follow Bonus (Below Daily Missions) */}
          <div
            data-testid="facebook-follow-bonus-card"
            className={`p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              fbFollowState.claimed
                ? 'bg-slate-950/50 border-slate-800 opacity-75'
                : 'bg-gradient-to-r from-blue-950/45 via-slate-900/90 to-cyan-950/35 border-blue-500/50 shadow-[0_0_24px_rgba(59,130,246,0.18)]'
            }`}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-300 font-black text-lg shrink-0">
                f
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Follow Official Facebook Profile
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                    SPECIAL BONUS · ONE-TIME
                  </span>
                  {fbFollowState.claimed && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                      CLAIMED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 font-mono leading-relaxed">
                  Follow our creator profile on Facebook, then claim your one-time{' '}
                  <strong className="text-cyan-300">+{FACEBOOK_FOLLOW_REWARD_DIAMONDS} Cyber Diamonds 💎</strong> reward!
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-xs font-black font-mono shadow-[0_0_10px_rgba(0,243,255,0.25)]">
                <span>💎</span>
                <span>+{FACEBOOK_FOLLOW_REWARD_DIAMONDS}</span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={FACEBOOK_FOLLOW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleVisitFacebook}
                  data-testid="facebook-follow-link"
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all flex items-center gap-1.5"
                >
                  <span>{fbFollowState.visited ? 'OPEN FACEBOOK' : 'FOLLOW ON FACEBOOK'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {fbFollowState.claimed ? (
                  <button
                    type="button"
                    disabled
                    data-testid="claim-facebook-follow-btn"
                    className="px-3.5 py-2 rounded-lg bg-slate-800/70 border border-slate-700 text-slate-400 text-xs font-bold font-mono uppercase tracking-wider cursor-not-allowed flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CLAIMED</span>
                  </button>
                ) : fbFollowState.visited ? (
                  <button
                    type="button"
                    onClick={handleClaimFacebookFollow}
                    data-testid="claim-facebook-follow-btn"
                    className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-slate-950 font-black text-xs tracking-wider uppercase shadow-[0_0_18px_rgba(0,243,255,0.5)] transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>CLAIM +{FACEBOOK_FOLLOW_REWARD_DIAMONDS} 💎</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    data-testid="claim-facebook-follow-btn"
                    className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold font-mono uppercase tracking-wider cursor-not-allowed"
                    title="Click Follow on Facebook first to unlock claiming +50 diamonds"
                  >
                    FOLLOW FIRST
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Missions reset every 24 hours UTC. Deploy into combat sectors to progress!
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
