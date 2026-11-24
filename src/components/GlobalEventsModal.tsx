import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, Flame, Lock, Palette, Sparkles, X } from 'lucide-react';
import {
  GLOBAL_EVENT_DURATION_MS,
  GLOBAL_EVENT_ROTATION,
  NEON_CRAFT_SKINS,
  areAllEventObjectivesComplete,
  claimBonusEventChallenge,
  claimGlobalEventNeonSkin,
  claimGlobalEventObjective,
  equipCraftSkin,
  getActiveCraftSkin,
  getGlobalEventWindow,
  isNeonSkinUnlocked,
  loadGlobalEventState,
} from '../game/globalEvents';
import { CRAFTS } from '../game/crafts';
import type { CraftId, CraftSkinId, GlobalEventDef, GlobalEventState, GlobalEventWindowInfo } from '../game/types';
import { soundEngine } from '../game/audio';

interface GlobalEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  diamonds: number;
  activeCraft: CraftId;
  unlockedCrafts: Record<CraftId, boolean>;
  onRewardClaimed: (claimedCoins: number, claimedDiamonds: number) => void;
  onSkinUpdated?: () => void;
}

export const CraftNeonPreviewSvg: React.FC<{
  craftId: CraftId;
  isNeon: boolean;
  size?: number;
}> = ({ craftId, isNeon, size = 84 }) => {
  const craft = CRAFTS[craftId] || CRAFTS.vanguard_alpha;
  const skin = NEON_CRAFT_SKINS[craftId];
  const fill = isNeon ? skin.hullFill : '#0b1626';
  const stroke = isNeon ? skin.primaryNeon : craft.hullColor;
  const accent = isNeon ? skin.secondaryNeon : craft.accentColor;
  const thruster = isNeon ? skin.thrusterNeon : craft.thrusterColor;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className="shrink-0"
      aria-hidden="true"
    >
      {/* Background tactical reticle */}
      <circle
        cx="60"
        cy="60"
        r="52"
        fill="none"
        stroke={isNeon ? skin.shieldNeon : stroke}
        strokeOpacity={isNeon ? 0.55 : 0.25}
        strokeWidth={isNeon ? 1.8 : 1}
        strokeDasharray={isNeon ? '6 5' : '4 6'}
      />
      {isNeon && (
        <circle
          cx="60"
          cy="60"
          r="43"
          fill="none"
          stroke={accent}
          strokeOpacity="0.45"
          strokeWidth="1.2"
        />
      )}

      {/* Rotated craft facing upper-right (-45 deg) */}
      <g transform="translate(60, 60) rotate(-35)">
        {/* Thruster flame */}
        <polygon
          points="-22,-6 -42,0 -22,6"
          fill={thruster}
          fillOpacity="0.88"
        />

        {craftId === 'phantom_shadow' ? (
          <>
            <polygon
              points="34,0 5,-28 -18,-10 -6,0 -18,10 5,28"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <line x1="16" y1="0" x2="0" y2="-16" stroke={accent} strokeWidth="2" />
            <line x1="16" y1="0" x2="0" y2="16" stroke={accent} strokeWidth="2" />
          </>
        ) : craftId === 'titan_dread' ? (
          <>
            <polygon
              points="28,-13 28,13 10,25 -20,22 -14,0 -20,-22 10,-25"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <rect x="-8" y="-16" width="5" height="32" fill={accent} />
          </>
        ) : craftId === 'solar_phoenix' ? (
          <>
            <path
              d="M 32 0 Q 0 -30 -20 -26 L -8 -8 L -18 0 L -8 8 L -20 26 Q 0 30 32 0 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <line x1="10" y1="0" x2="-12" y2="-18" stroke={accent} strokeWidth="2" />
            <line x1="10" y1="0" x2="-12" y2="18" stroke={accent} strokeWidth="2" />
          </>
        ) : craftId === 'aegis_celestial' ? (
          <>
            <polygon points="34,0 -14,-13 -6,0 -14,13" fill={fill} stroke={stroke} strokeWidth="3" />
            <rect x="-15" y="-25" width="30" height="5" fill={fill} stroke={accent} strokeWidth="2" />
            <rect x="-15" y="20" width="30" height="5" fill={fill} stroke={accent} strokeWidth="2" />
            <circle cx="0" cy="0" r="17" fill="none" stroke={stroke} strokeWidth="1.8" />
          </>
        ) : craftId === 'astral_valkyrie' ? (
          <>
            <polygon
              points="36,0 4,-12 -10,-28 -18,-8 -8,0 -18,8 -10,28 4,12"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <line x1="22" y1="0" x2="-7" y2="-20" stroke={accent} strokeWidth="2" />
            <line x1="22" y1="0" x2="-7" y2="20" stroke={accent} strokeWidth="2" />
          </>
        ) : craftId === 'cyber_falcon' ? (
          <>
            <polygon
              points="36,0 12,-9 4,-29 -14,-16 -10,0 -14,16 4,29 12,9"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <line x1="18" y1="-4" x2="-2" y2="-21" stroke={accent} strokeWidth="2" />
            <line x1="18" y1="4" x2="-2" y2="21" stroke={accent} strokeWidth="2" />
          </>
        ) : craftId === 'nebula_harbinger' ? (
          <>
            <polygon
              points="34,0 14,-15 -6,-26 -20,-18 -12,0 -20,18 -6,26 14,15"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <circle cx="0" cy="0" r="14" fill="none" stroke={accent} strokeWidth="1.6" strokeDasharray="4 3" />
          </>
        ) : craftId === 'zenith_emperor' ? (
          <>
            <polygon
              points="38,0 18,-10 2,-31 -14,-21 -9,0 -14,21 2,31 18,10"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <polygon points="10,-16 26,0 10,16" fill="none" stroke={accent} strokeWidth="2" />
          </>
        ) : craftId === 'tempest_raptor' ? (
          <>
            <polygon
              points="37,0 12,-9 18,-28 -11,-20 -16,0 -11,20 18,28 12,9"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <line x1="22" y1="0" x2="-8" y2="-16" stroke={accent} strokeWidth="2" />
            <line x1="22" y1="0" x2="-8" y2="16" stroke={accent} strokeWidth="2" />
          </>
        ) : craftId === 'seraph_nova' ? (
          <>
            <polygon
              points="39,0 14,-11 -2,-33 -18,-23 -11,0 -18,23 -2,33 14,11"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <circle cx="0" cy="0" r="13" fill="none" stroke={accent} strokeWidth="2" />
          </>
        ) : craftId === 'mirage_viper' ? (
          <>
            <polygon
              points="39,0 12,-7 -4,-29 -18,-14 -8,0 -18,14 -4,29 12,7"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <line x1="22" y1="-3" x2="-4" y2="-20" stroke={accent} strokeWidth="2" />
            <line x1="22" y1="3" x2="-4" y2="20" stroke={accent} strokeWidth="2" />
          </>
        ) : craftId === 'colossus_bastion' ? (
          <>
            <polygon
              points="30,-11 30,11 10,28 -20,25 -14,0 -20,-25 10,-28"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <rect x="-12" y="-17" width="8" height="34" fill={accent} fillOpacity="0.85" />
          </>
        ) : craftId === 'frost_valkyrie' ? (
          <>
            <polygon
              points="37,0 10,-11 -2,-30 -16,-16 -9,0 -16,16 -2,30 10,11"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <polygon points="8,-12 24,0 8,12" fill="none" stroke={accent} strokeWidth="1.8" />
          </>
        ) : craftId === 'eclipse_phantom' ? (
          <>
            <path
              d="M 38 0 L 10 -12 Q -8 -34 -22 -24 L -10 -7 L -18 0 L -10 7 L -22 24 Q -8 34 10 12 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <circle cx="0" cy="0" r="11" fill="none" stroke={accent} strokeWidth="1.8" />
          </>
        ) : craftId === 'kronos_sovereign' ? (
          <>
            <polygon
              points="40,0 16,-11 2,-34 -16,-22 -9,0 -16,22 2,34 16,11"
              fill={fill}
              stroke={stroke}
              strokeWidth="3"
            />
            <circle cx="0" cy="0" r="15" fill="none" stroke={accent} strokeWidth="2" strokeDasharray="5 3" />
          </>
        ) : (
          <>
            <polygon points="32,0 -20,-21 -9,0 -20,21" fill={fill} stroke={stroke} strokeWidth="3" />
            {isNeon && (
              <>
                <line x1="18" y1="0" x2="-14" y2="-13" stroke={accent} strokeWidth="2" />
                <line x1="18" y1="0" x2="-14" y2="13" stroke={accent} strokeWidth="2" />
              </>
            )}
          </>
        )}

        {/* Turret & Core */}
        <rect x="14" y="-2.5" width="14" height="5" fill={accent} rx="1.5" />
        <circle cx="4" cy="0" r="5" fill={stroke} />
      </g>
    </svg>
  );
};

export const GlobalEventsModal: React.FC<GlobalEventsModalProps> = ({
  isOpen,
  onClose,
  coins,
  diamonds,
  activeCraft,
  unlockedCrafts,
  onRewardClaimed,
  onSkinUpdated,
}) => {
  const [windowInfo, setWindowInfo] = useState<GlobalEventWindowInfo>(() => getGlobalEventWindow());
  const [eventState, setEventState] = useState<GlobalEventState>(() => loadGlobalEventState());
  const [notice, setNotice] = useState<string | null>(null);
  const [inspectedEvent, setInspectedEvent] = useState<GlobalEventDef | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const refresh = () => {
      const now = Date.now();
      const win = getGlobalEventWindow(now);
      setWindowInfo(win);
      setEventState(loadGlobalEventState(now));
    };

    refresh();
    const timer = window.setInterval(refresh, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const { eventDef, formattedCountdown, remainingMs, durationMs, cycleIndex } = windowInfo;
  const featuredCraft = CRAFTS[eventDef.rewardCraftId];
  const featuredSkin = NEON_CRAFT_SKINS[eventDef.rewardCraftId];
  const completedCount = eventState.objectives.filter((o) => o.isCompleted).length;
  const allComplete = areAllEventObjectivesComplete(eventState);
  const featuredUnlocked = isNeonSkinUnlocked(eventDef.rewardCraftId, eventState);
  const featuredEquipped = getActiveCraftSkin(eventDef.rewardCraftId, eventState) === 'neon';
  const elapsedPct = Math.min(100, Math.max(0, ((durationMs - remainingMs) / durationMs) * 100));
  const bonusChallenges = eventState.bonusChallenges || [];

  const showToast = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => {
      setNotice((prev) => (prev === msg ? null : prev));
    }, 3600);
  };

  const handleClaimObjective = (objectiveId: string) => {
    const res = claimGlobalEventObjective(objectiveId);
    if (res.success) {
      soundEngine.playVictory();
      setEventState(res.updatedState);
      onRewardClaimed(res.rewardCoins, res.rewardDiamonds);
      showToast(`Claimed +${res.rewardCoins} Coins & +${res.rewardDiamonds} Diamonds!`);
    }
  };

  const handleClaimBonusChallenge = (challengeId: string) => {
    const res = claimBonusEventChallenge(challengeId);
    if (res.success) {
      soundEngine.playVictory();
      setEventState(res.updatedState);
      onRewardClaimed(res.rewardCoins, res.rewardDiamonds);
      showToast(`Special Challenge Claimed! +${res.rewardCoins} Coins & +${res.rewardDiamonds} Diamonds!`);
    }
  };

  const handleClaimNeonSkin = () => {
    const res = claimGlobalEventNeonSkin();
    if (res.success) {
      soundEngine.playVictory();
      setEventState(res.updatedState);
      onRewardClaimed(0, res.bonusDiamonds);
      onSkinUpdated?.();
      showToast(
        res.alreadyOwnedSkin
          ? `Milestone Complete! +${res.bonusDiamonds} Bonus Diamonds awarded!`
          : `Unlocked & Equipped ${featuredSkin.name} (+${res.bonusDiamonds} Diamonds)!`
      );
    } else {
      soundEngine.playDefeat();
      showToast(res.error || 'Complete all 3 objectives first.');
    }
  };

  const handleEquipSkin = (craftId: CraftId, skinId: CraftSkinId) => {
    const res = equipCraftSkin(craftId, skinId);
    if (res.success) {
      soundEngine.playPickup();
      setEventState(res.updatedState);
      onSkinUpdated?.();
      showToast(
        skinId === 'neon'
          ? `Equipped ${NEON_CRAFT_SKINS[craftId].name} on ${CRAFTS[craftId].name}!`
          : `Switched ${CRAFTS[craftId].name} back to Standard chassis paint.`
      );
    }
  };

  return (
    <div
      data-testid="global-events-modal"
      className="fixed inset-0 z-50 bg-[#040710]/90 flex items-center justify-center p-3 sm:p-6 select-none"
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#09111f] border-2 border-cyan-400/50 rounded-2xl p-4 sm:p-6 shadow-[0_0_50px_rgba(0,255,213,0.2)]">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-start justify-between gap-3 w-full sm:w-auto">
            <div className="flex items-start sm:items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl border shrink-0"
                style={{
                  backgroundColor: `${eventDef.accentColor}1a`,
                  borderColor: `${eventDef.accentColor}66`,
                }}
              >
                {eventDef.badgeIcon}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-wide text-white">
                    {eventDef.title}
                  </h2>
                  <span className="text-xs font-mono text-cyan-300">
                    Cycle #{cycleIndex + 1} · 48h Global Event
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{eventDef.subtitle}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Global Event Modal"
              className="sm:hidden p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <div
              data-testid="global-event-countdown"
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 flex items-center gap-2 text-xs font-mono"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-400">Rotates in</span>
              <span className="text-cyan-300 font-bold tabular-nums">{formattedCountdown}</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Global Event Modal Desktop"
              className="hidden sm:inline-flex p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {notice && (
          <div
            role="status"
            className="mt-3 px-4 py-2 rounded-lg bg-cyan-950/80 border border-cyan-400/60 text-xs font-mono font-bold text-cyan-200 text-center"
          >
            {notice}
          </div>
        )}

        {/* Featured Milestone Reward Card (Exclusive Neon Craft Skin) */}
        <div
          className="mt-4 p-4 sm:p-5 rounded-xl bg-slate-950/90 border flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{ borderColor: `${eventDef.accentColor}66` }}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 text-center sm:text-left">
            <div className="p-2 rounded-xl bg-[#060c18] border border-slate-800 shrink-0">
              <CraftNeonPreviewSvg craftId={eventDef.rewardCraftId} isNeon={true} size={86} />
            </div>

            <div>
              <div className="text-[11px] font-mono font-bold tracking-wider text-amber-300">
                48H GRAND MILESTONE REWARD · EXCLUSIVE SKIN
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                {featuredSkin.name}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                For <strong className="text-cyan-300">{featuredCraft.name}</strong> — {featuredSkin.tagline}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 mt-2 text-[11px] font-mono text-slate-400 tabular-nums">
                <span className="whitespace-nowrap">
                  Objectives: <strong className="text-white">{completedCount}/{eventState.objectives.length}</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">
                  Bonus: <strong className="text-cyan-300">+3 Diamonds</strong>
                </span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">
                  Window Elapsed: <strong className="text-slate-200">{elapsedPct.toFixed(0)}%</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 md:min-w-[210px]">
            {!eventState.skinClaimed ? (
              <button
                type="button"
                data-testid="claim-neon-skin-btn"
                onClick={handleClaimNeonSkin}
                disabled={!allComplete}
                className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  allComplete
                    ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-[0_0_20px_rgba(0,255,213,0.45)]'
                    : 'bg-slate-900 border border-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {allComplete ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Claim Neon Skin</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Complete {completedCount}/3 First</span>
                  </>
                )}
              </button>
            ) : featuredEquipped ? (
              <button
                type="button"
                data-testid="toggle-featured-skin-btn"
                onClick={() => handleEquipSkin(eventDef.rewardCraftId, 'default')}
                className="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400 text-emerald-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Neon Equipped (Switch Off)</span>
              </button>
            ) : (
              <button
                type="button"
                data-testid="toggle-featured-skin-btn"
                onClick={() => handleEquipSkin(eventDef.rewardCraftId, 'neon')}
                className="px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Palette className="w-4 h-4" />
                <span>Equip Neon Skin</span>
              </button>
            )}

            {featuredUnlocked && !unlockedCrafts[eventDef.rewardCraftId] && (
              <span className="text-[10px] font-mono text-amber-300 text-center">
                Skin saved! Unlock airframe in Hangar to pilot.
              </span>
            )}
          </div>
        </div>

        {/* 3 Special 48h Objectives */}
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Special 48-Hour Event Objectives</span>
            </h3>
            <span className="text-xs font-mono text-slate-400 tabular-nums">
              Wallet: {coins.toLocaleString()} Coins · {diamonds.toLocaleString()} Diamonds
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {eventState.objectives.map((obj) => {
              const pct = Math.min(100, Math.round((obj.currentValue / Math.max(1, obj.targetValue)) * 100));
              return (
                <div
                  key={obj.id}
                  data-testid={`event-objective-${obj.id}`}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>{obj.icon}</span>
                        <span>{obj.title}</span>
                      </span>
                      <span className="text-xs font-mono text-cyan-300 tabular-nums font-bold">
                        {obj.currentValue}/{obj.targetValue}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      {obj.description}
                    </p>

                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: obj.isCompleted ? '#34d399' : eventDef.accentColor,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-mono text-amber-300 tabular-nums">
                      +{obj.rewardCoins}🪙 · +{obj.rewardDiamonds}💎
                    </span>

                    {obj.isClaimed ? (
                      <span className="text-[11px] font-mono font-bold text-emerald-400">
                        Claimed
                      </span>
                    ) : obj.isCompleted ? (
                      <button
                        type="button"
                        onClick={() => handleClaimObjective(obj.id)}
                        className="px-3 py-1 rounded bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-[11px] font-black uppercase tracking-wider cursor-pointer"
                      >
                        Claim
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-500">
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bonus Special Event Challenges (Evergreen Extra Operations) */}
        {bonusChallenges.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/90">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-fuchsia-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                <span>Bonus Special Event Operations ({bonusChallenges.length} Extra Challenges)</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Always Active · Extra Coins &amp; Diamonds
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {bonusChallenges.map((ch) => {
                const pct = Math.min(100, Math.round((ch.currentValue / Math.max(1, ch.targetValue)) * 100));
                return (
                  <div
                    key={ch.id}
                    data-testid={`bonus-challenge-${ch.id}`}
                    className="p-3 rounded-xl bg-slate-950/90 border border-fuchsia-500/25 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-black text-white flex items-center gap-1.5">
                          <span>{ch.icon}</span>
                          <span>{ch.title}</span>
                        </span>
                        <span className="text-[11px] font-mono text-fuchsia-300 tabular-nums font-bold">
                          {ch.currentValue}/{ch.targetValue}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                        {ch.description}
                      </p>

                      <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden mb-2.5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: ch.isCompleted ? '#34d399' : '#e879f9',
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] font-mono text-amber-300 tabular-nums">
                        +{ch.rewardCoins}🪙 · +{ch.rewardDiamonds}💎
                      </span>

                      {ch.isClaimed ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400">
                          Claimed
                        </span>
                      ) : ch.isCompleted ? (
                        <button
                          type="button"
                          onClick={() => handleClaimBonusChallenge(ch.id)}
                          className="px-2.5 py-1 rounded bg-fuchsia-400 hover:bg-fuchsia-300 text-slate-950 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Claim
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-500">
                          {pct}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Neon Skin Vault & Upcoming 48h Rotation Schedule */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Neon Craft Skin Rotation Vault ({GLOBAL_EVENT_ROTATION.length} Rotating Cycles)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Unlocked: {Object.values(eventState.unlockedNeonSkins).filter(Boolean).length}/{GLOBAL_EVENT_ROTATION.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {GLOBAL_EVENT_ROTATION.map((ev, idx) => {
              const craftDef = CRAFTS[ev.rewardCraftId];
              const skinDef = NEON_CRAFT_SKINS[ev.rewardCraftId];
              const unlocked = Boolean(eventState.unlockedNeonSkins[ev.rewardCraftId]);
              const equipped = getActiveCraftSkin(ev.rewardCraftId, eventState) === 'neon';
              const isLiveNow = ev.id === eventDef.id;
              const isPilotedCraft = activeCraft === ev.rewardCraftId;
              const isInspected = inspectedEvent?.id === ev.id;

              return (
                <div
                  key={ev.id}
                  onClick={() => setInspectedEvent(isInspected ? null : ev)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center text-center justify-between cursor-pointer transition-colors ${
                    isLiveNow
                      ? 'bg-slate-900 border-cyan-400/70'
                      : isInspected
                      ? 'bg-slate-900/90 border-fuchsia-400/70'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold mb-1" style={{ color: isLiveNow ? ev.accentColor : '#94a3b8' }}>
                    {isLiveNow ? 'LIVE NOW' : `CYCLE #${idx + 1}`}
                  </div>

                  <CraftNeonPreviewSvg craftId={ev.rewardCraftId} isNeon={unlocked || isLiveNow || isInspected} size={56} />

                  <div className="mt-1">
                    <div className="text-[11px] font-bold text-white leading-tight">
                      {craftDef.callsign}
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      {skinDef.name.replace('Neon ', '')}
                    </div>
                  </div>

                  <div className="mt-2 w-full">
                    {unlocked ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEquipSkin(ev.rewardCraftId, equipped ? 'default' : 'neon');
                        }}
                        className={`w-full py-1 rounded text-[10px] font-black uppercase cursor-pointer ${
                          equipped
                            ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                            : 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 hover:bg-cyan-500/30'
                        }`}
                      >
                        {equipped ? (isPilotedCraft ? 'Active' : 'Equipped') : 'Equip Neon'}
                      </button>
                    ) : (
                      <div className="text-[10px] font-mono text-slate-500 py-1">
                        {isLiveNow ? 'In Progress' : 'Click Preview'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {inspectedEvent && (
            <div
              data-testid="inspected-event-preview"
              className="mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-fuchsia-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="text-[11px] font-mono font-bold text-fuchsia-300 flex items-center gap-1.5">
                  <span>{inspectedEvent.badgeIcon}</span>
                  <span>CYCLE PREVIEW · {inspectedEvent.title}</span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">{inspectedEvent.subtitle}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {inspectedEvent.objectives.map((o) => (
                    <span
                      key={o.id}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200"
                    >
                      {o.icon} {o.title} ({o.targetValue})
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedEvent(null)}
                className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300 cursor-pointer shrink-0"
              >
                Hide Preview
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
