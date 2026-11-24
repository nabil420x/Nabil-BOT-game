import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Crosshair, Lock, Shield, Unlock, Zap } from 'lucide-react';
import { WEAPONS } from '../game/weapons';
import { WeaponType } from '../game/types';
import {
  computeTouchAimVector,
  computeTouchStickVector,
  isBarrierBypassWeapon,
} from '../game/rules';

interface TouchControlsOverlayProps {
  onMoveVector: (dx: number, dy: number) => void;
  onSetFiring: (firing: boolean) => void;
  onAimAngle?: (angle: number | null) => void;
  onDash: () => void;
  onFinisher?: () => void;
  onDeployWall?: () => void;
  wallCharges?: number;
  maxWallCharges?: number;
  wallCooldownTimer?: number;
  onCycleWeapon?: (direction: 1 | -1) => void;
  activeWeapon?: WeaponType;
  weaponHeat?: number;
  weaponOverheated?: boolean;
  dashReady?: boolean;
  dashOvercharged?: boolean;
  finisherReady?: boolean;
  compactMobile?: boolean;
}

export const TouchControlsOverlay: React.FC<TouchControlsOverlayProps> = ({
  onMoveVector,
  onSetFiring,
  onAimAngle,
  onDash,
  onFinisher,
  onDeployWall,
  wallCharges = 2,
  maxWallCharges = 2,
  wallCooldownTimer = 0,
  onCycleWeapon,
  activeWeapon = 'pulse',
  weaponHeat = 0,
  weaponOverheated = false,
  dashReady = true,
  dashOvercharged = false,
  finisherReady = false,
  compactMobile = false,
}) => {
  // Left Virtual Movement Stick refs (zero re-render during drag)
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const movePointerRef = useRef<number | null>(null);
  const originRef = useRef<{ cx: number; cy: number }>({ cx: 0, cy: 0 });

  // Right Twin-Stick Fire & Aim Pad refs
  const firePadRef = useRef<HTMLButtonElement | null>(null);
  const aimDotRef = useRef<HTMLDivElement | null>(null);
  const firePointerRef = useRef<number | null>(null);
  const fireCenterRef = useRef<{ cx: number; cy: number }>({ cx: 0, cy: 0 });

  const [isHoldingFire, setIsHoldingFire] = useState(false);
  const [autoFireLocked, setAutoFireLocked] = useState(false);
  const [isManualAiming, setIsManualAiming] = useState(false);

  const stickMaxRadius = 42;

  // Store callback props in refs so 10Hz HUD sync re-renders in App.tsx never re-run
  // the unmount cleanup effect (which previously zeroed out active touch stick/fire input!).
  const onMoveVectorRef = useRef(onMoveVector);
  const onSetFiringRef = useRef(onSetFiring);
  const onAimAngleRef = useRef(onAimAngle);
  onMoveVectorRef.current = onMoveVector;
  onSetFiringRef.current = onSetFiring;
  onAimAngleRef.current = onAimAngle;

  useEffect(() => {
    onSetFiringRef.current(isHoldingFire || autoFireLocked);
  }, [isHoldingFire, autoFireLocked]);

  useEffect(() => {
    return () => {
      onMoveVectorRef.current(0, 0);
      onSetFiringRef.current(false);
      onAimAngleRef.current?.(null);
    };
  }, []);

  const updateStickFromPointer = (clientX: number, clientY: number) => {
    const dx = clientX - originRef.current.cx;
    const dy = clientY - originRef.current.cy;
    const vec = computeTouchStickVector(dx, dy, stickMaxRadius, 0.12);
    if (knobRef.current) {
      knobRef.current.style.transform = `translate3d(${vec.knobX.toFixed(1)}px, ${vec.knobY.toFixed(1)}px, 0)`;
    }
    onMoveVectorRef.current(vec.normX, vec.normY);
  };

  const resetStick = () => {
    movePointerRef.current = null;
    if (ringRef.current) {
      ringRef.current.style.transform = 'translate3d(0px, 0px, 0)';
    }
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate3d(0px, 0px, 0)';
    }
    onMoveVectorRef.current(0, 0);
  };

  const updateFireAimFromPointer = (clientX: number, clientY: number) => {
    const dx = clientX - fireCenterRef.current.cx;
    const dy = clientY - fireCenterRef.current.cy;
    const aim = computeTouchAimVector(dx, dy, 12);
    if (aimDotRef.current) {
      aimDotRef.current.style.transform = `translate3d(${aim.knobX.toFixed(1)}px, ${aim.knobY.toFixed(1)}px, 0)`;
    }
    setIsManualAiming(aim.active);
    onAimAngleRef.current?.(aim.angle);
  };

  const resetFireAim = () => {
    firePointerRef.current = null;
    setIsHoldingFire(false);
    setIsManualAiming(false);
    if (aimDotRef.current) {
      aimDotRef.current.style.transform = 'translate3d(0px, 0px, 0)';
    }
    onAimAngleRef.current?.(null);
  };

  const wepDef = WEAPONS[activeWeapon] || WEAPONS.pulse;
  const isBypass = isBarrierBypassWeapon(activeWeapon);
  const clampedHeat = Math.max(0, Math.min(100, weaponHeat));
  const ringCircumference = 2 * Math.PI * 38;
  const ringOffset = ringCircumference * (1 - clampedHeat / 100);
  const firingVisualActive = isHoldingFire || autoFireLocked;

  return (
    <div
      data-testid="mobile-touch-controls"
      onContextMenu={(e) => e.preventDefault()}
      className="absolute inset-0 pointer-events-none z-20 select-none"
    >
      {/* Left Adaptive / Floating Virtual Analog Movement Zone */}
      <div
        ref={zoneRef}
        data-testid="touch-joystick"
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          movePointerRef.current = e.pointerId;
          const zoneRect = e.currentTarget.getBoundingClientRect();
          const baseCx = zoneRect.left + zoneRect.width * 0.5;
          const baseCy = zoneRect.top + zoneRect.height * 0.5;
          // Float ring subtly toward initial thumb landing point (clamped inside pad zone)
          const offX = Math.max(-22, Math.min(22, e.clientX - baseCx));
          const offY = Math.max(-22, Math.min(22, e.clientY - baseCy));
          originRef.current = { cx: baseCx + offX, cy: baseCy + offY };
          if (ringRef.current) {
            ringRef.current.style.transform = `translate3d(${offX.toFixed(1)}px, ${offY.toFixed(1)}px, 0)`;
          }
          updateStickFromPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (movePointerRef.current !== e.pointerId) return;
          e.stopPropagation();
          updateStickFromPointer(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (movePointerRef.current !== e.pointerId) return;
          e.stopPropagation();
          try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
          resetStick();
        }}
        onPointerCancel={(e) => {
          if (movePointerRef.current !== e.pointerId) return;
          try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
          resetStick();
        }}
        className={`pointer-events-auto touch-none absolute flex items-center justify-center cursor-grab active:cursor-grabbing ${
          compactMobile
            ? 'bottom-2.5 left-2.5 w-32 h-32'
            : 'bottom-6 left-4 sm:bottom-8 sm:left-6 w-36 h-36 sm:w-40 sm:h-40'
        }`}
        aria-label="Virtual Movement Joystick"
      >
        <div
          ref={ringRef}
          className={`relative rounded-full border-2 border-cyan-400/60 bg-[#060d18]/78 flex items-center justify-center shadow-[0_0_24px_rgba(0,243,255,0.22)] will-change-transform ${
            compactMobile ? 'w-24 h-24' : 'w-28 h-28'
          }`}
        >
          {/* Crosshair guide lines & deadzone ring */}
          <div
            className={`rounded-full border border-cyan-400/25 pointer-events-none ${
              compactMobile ? 'w-14 h-14' : 'w-16 h-16'
            }`}
          />
          <div className="absolute inset-y-3 w-[1px] bg-cyan-400/15 pointer-events-none" />
          <div className="absolute inset-x-3 h-[1px] bg-cyan-400/15 pointer-events-none" />
          <div
            ref={knobRef}
            data-testid="touch-joystick-knob"
            className={`absolute rounded-full bg-gradient-to-br from-cyan-300 to-cyan-500 border-2 border-white shadow-[0_0_16px_rgba(0,243,255,0.8)] pointer-events-none will-change-transform ${
              compactMobile ? 'w-10 h-10' : 'w-11 h-11'
            }`}
            style={{
              transform: 'translate3d(0px, 0px, 0)',
            }}
          />
          <span className="absolute bottom-1 text-[8px] font-mono font-bold tracking-widest text-cyan-200/80 pointer-events-none">
            MOVE
          </span>
        </div>
      </div>

      {/* Right Ergonomic Combat Cluster: Weapon Switcher + Finisher + Dash + Auto-Fire + Aim/Fire Stick */}
      <div
        className={`absolute flex flex-col items-end pointer-events-none ${
          compactMobile
            ? 'bottom-2.5 right-2.5 gap-1.5'
            : 'bottom-6 right-4 sm:bottom-8 sm:right-6 gap-2.5'
        }`}
      >
        {/* Compact Quick Weapon Switcher & Auto-Fire Lock Row */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {onCycleWeapon && (
            <div className="flex items-center bg-[#060d18]/90 border border-slate-700/80 rounded-lg px-1 py-0.5 shadow-lg">
              <button
                type="button"
                data-testid="touch-weapon-prev"
                tabIndex={-1}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  onCycleWeapon(-1);
                }}
                className="touch-none p-1.5 text-slate-300 hover:text-cyan-300 active:scale-90 transition-transform cursor-pointer"
                aria-label="Previous Weapon"
                title="Previous Unlocked Weapon"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-1.5 flex flex-col items-center min-w-[68px] max-w-[92px]">
                <span
                  className="text-[9px] font-mono font-black tracking-tight truncate max-w-full"
                  style={{ color: wepDef.color }}
                >
                  {wepDef.name.split(' ')[0].toUpperCase()}
                </span>
                <span
                  className={`text-[8px] font-mono font-bold tracking-wider ${
                    isBypass ? 'text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  {isBypass ? '⚡PIERCE' : `[${wepDef.keyLabel}]`}
                </span>
              </div>
              <button
                type="button"
                data-testid="touch-weapon-next"
                tabIndex={-1}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  onCycleWeapon(1);
                }}
                className="touch-none p-1.5 text-slate-300 hover:text-cyan-300 active:scale-90 transition-transform cursor-pointer"
                aria-label="Next Weapon"
                title="Next Unlocked Weapon"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            data-testid="touch-autofire-btn"
            tabIndex={-1}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              setAutoFireLocked((prev) => !prev);
            }}
            className={`touch-none px-2.5 py-1.5 rounded-lg border font-mono font-black text-[9px] tracking-wider flex items-center gap-1 transition-colors cursor-pointer ${
              autoFireLocked
                ? 'bg-pink-500/30 border-pink-400 text-pink-100 shadow-[0_0_12px_rgba(255,0,119,0.5)]'
                : 'bg-[#060d18]/90 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
            aria-label="Toggle Auto-Fire Lock"
            aria-pressed={autoFireLocked}
            title="Lock Auto-Fire Hands-Free"
          >
            {autoFireLocked ? <Lock className="w-3 h-3 text-pink-300" /> : <Unlock className="w-3 h-3 text-slate-400" />}
            <span>{autoFireLocked ? 'AUTO ON' : 'AUTO'}</span>
          </button>
        </div>

        {/* Main Action Row: NOVA + WALL + DASH + Twin-Stick AIM/FIRE */}
        <div className={`flex items-end pointer-events-none ${compactMobile ? 'gap-1.5' : 'gap-2.5 sm:gap-3'}`}>
          {onDeployWall && (
            <button
              type="button"
              data-testid="touch-wall-btn"
              tabIndex={-1}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.blur();
                onDeployWall();
              }}
              className={`relative pointer-events-auto touch-none rounded-full border-2 font-black font-mono flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${
                compactMobile ? 'w-13 h-13 text-[8px]' : 'w-15 h-15 text-[9px]'
              } ${
                wallCharges > 0
                  ? 'border-cyan-300 bg-cyan-500/30 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.5)]'
                  : 'border-slate-600/80 bg-slate-900/85 text-slate-400'
              }`}
              aria-label={`Deploy Cyber Shield Wall (${wallCharges}/${maxWallCharges})`}
              title="Deploy Cyber Shield Wall [R]"
            >
              <Shield className="w-4 h-4 mb-0.5 text-cyan-300" />
              <span>{wallCharges > 0 ? `WALL ${wallCharges}` : `${wallCooldownTimer.toFixed(1)}s`}</span>
            </button>
          )}

          {finisherReady && onFinisher && (
            <button
              type="button"
              data-testid="touch-finisher-btn"
              tabIndex={-1}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.currentTarget.blur();
                onFinisher();
              }}
              className={`pointer-events-auto touch-none rounded-full border-2 border-amber-300 bg-amber-400 text-slate-950 font-black font-mono flex flex-col items-center justify-center shadow-[0_0_18px_rgba(250,204,21,0.7)] active:scale-95 cursor-pointer ${
                compactMobile ? 'w-12 h-12 text-[9px]' : 'w-14 h-14 text-[10px]'
              }`}
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>NOVA</span>
            </button>
          )}

          <button
            type="button"
            data-testid="touch-dash-btn"
            tabIndex={-1}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              onDash();
            }}
            className={`pointer-events-auto touch-none rounded-full border-2 font-black font-mono flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer ${
              compactMobile ? 'w-14 h-14 text-[9px]' : 'w-16 h-16 text-[10px]'
            } ${
              dashOvercharged
                ? 'border-amber-300 bg-amber-500/30 text-amber-100 shadow-[0_0_20px_rgba(251,191,36,0.65)]'
                : dashReady
                ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.45)]'
                : 'border-slate-600/80 bg-slate-900/85 text-slate-400'
            }`}
            aria-label="Dash"
          >
            <Zap className="w-4 h-4 mb-0.5" />
            <span>{dashOvercharged ? 'OVER!' : 'DASH'}</span>
          </button>

          {/* Twin-Stick Fire + Drag-to-Aim Pad with Heat Arc */}
          <button
            ref={firePadRef}
            type="button"
            data-testid="touch-fire-btn"
            tabIndex={-1}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              e.currentTarget.setPointerCapture(e.pointerId);
              firePointerRef.current = e.pointerId;
              const rect = e.currentTarget.getBoundingClientRect();
              fireCenterRef.current = {
                cx: rect.left + rect.width * 0.5,
                cy: rect.top + rect.height * 0.5,
              };
              setIsHoldingFire(true);
              updateFireAimFromPointer(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (firePointerRef.current !== e.pointerId) return;
              e.stopPropagation();
              updateFireAimFromPointer(e.clientX, e.clientY);
            }}
            onPointerUp={(e) => {
              if (firePointerRef.current !== e.pointerId) return;
              e.stopPropagation();
              try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
              resetFireAim();
            }}
            onPointerCancel={(e) => {
              if (firePointerRef.current !== e.pointerId) return;
              try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
              resetFireAim();
            }}
            className={`relative pointer-events-auto touch-none rounded-full border-2 font-black font-mono flex flex-col items-center justify-center transition-colors cursor-pointer ${
              compactMobile ? 'w-[74px] h-[74px] text-[9px]' : 'w-[84px] h-[84px] text-[10px]'
            } ${
              weaponOverheated
                ? 'border-red-400 bg-red-950/80 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.65)]'
                : firingVisualActive
                ? 'border-white bg-pink-500/85 text-white shadow-[0_0_24px_rgba(255,0,119,0.8)]'
                : 'border-pink-400/80 bg-pink-500/30 text-pink-100 shadow-[0_0_18px_rgba(255,0,119,0.38)]'
            }`}
            aria-label="Aim and Fire"
          >
            {/* Heat Gauge SVG Ring */}
            <svg
              className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
              viewBox="0 0 84 84"
            >
              <circle
                cx="42"
                cy="42"
                r="38"
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="3"
              />
              {clampedHeat > 1 && (
                <circle
                  cx="42"
                  cy="42"
                  r="38"
                  fill="none"
                  stroke={weaponOverheated ? '#ef4444' : clampedHeat > 72 ? '#f59e0b' : '#22d3ee'}
                  strokeWidth="3"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  strokeLinecap="round"
                />
              )}
            </svg>

            {/* Manual Aim Dot Indicator (tracks drag angle) */}
            <div
              ref={aimDotRef}
              className={`absolute w-3 h-3 rounded-full pointer-events-none will-change-transform transition-opacity ${
                isManualAiming ? 'opacity-100 bg-cyan-300 shadow-[0_0_10px_#00f3ff]' : 'opacity-0'
              }`}
              style={{ transform: 'translate3d(0px, 0px, 0)' }}
            />

            <Crosshair className="w-6 h-6 mb-0.5 pointer-events-none" />
            <span className="pointer-events-none">
              {weaponOverheated ? 'COOL' : isManualAiming ? 'AIM' : autoFireLocked ? 'AUTO' : 'FIRE'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
