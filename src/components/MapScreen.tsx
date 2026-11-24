import React, { useState } from 'react';
import { MapPin, Navigation, Play, Lock, ArrowLeft, ShoppingBag, CheckCircle, Flame } from 'lucide-react';
import { REGIONS, MapRegionId, LEVELS, isRegionUnlocked } from '../game/levels';
import { soundEngine } from '../game/audio';
import { DifficultyMode } from '../game/types';
import { DIFFICULTY_MODIFIERS, loadDifficultyMode, saveDifficultyMode } from '../game/rules';

interface MapScreenProps {
  highestLevelUnlocked: number;
  coins: number;
  diamonds?: number;
  difficulty?: DifficultyMode;
  onChangeDifficulty?: (mode: DifficultyMode) => void;
  onDeployLevel: (level: number) => void;
  onNavigateHome: () => void;
  onNavigateStore: () => void;
  onNavigateProfile?: () => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  highestLevelUnlocked,
  coins,
  diamonds = 0,
  difficulty: controlledDifficulty,
  onChangeDifficulty,
  onDeployLevel,
  onNavigateHome,
  onNavigateStore,
  onNavigateProfile,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<MapRegionId>('dhaka');
  const [localDifficulty, setLocalDifficulty] = useState<DifficultyMode>(() => loadDifficultyMode());
  const activeDifficulty = controlledDifficulty ?? localDifficulty;

  const handleSelectDifficulty = (mode: DifficultyMode) => {
    soundEngine.playPickup();
    setLocalDifficulty(mode);
    saveDifficultyMode(mode);
    if (onChangeDifficulty) {
      onChangeDifficulty(mode);
    }
  };

  const selectedRegion = REGIONS[selectedRegionId];
  const regionLevels = LEVELS.filter((lvl) => lvl.region === selectedRegionId);
  const isSelectedUnlocked = isRegionUnlocked(selectedRegionId, highestLevelUnlocked);

  return (
    <div className="absolute inset-0 z-30 bg-[#05070e] text-slate-100 flex flex-col p-4 sm:p-8 overflow-y-auto select-none">
      {/* Top Header Bar */}
      <div className="w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-500/30">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNavigateHome}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>🏠 HOME</span>
          </button>

          <div className="px-3.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(0,243,255,0.3)] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>🗺️ MAPS ({LEVELS.length} SECTORS)</span>
          </div>

          <button
            onClick={onNavigateStore}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-400/60 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>🛒 STORE</span>
          </button>

          {onNavigateProfile && (
            <button
              onClick={onNavigateProfile}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-400/60 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>👤 PROFILE</span>
            </button>
          )}
        </div>

        {/* Right: Coins & Diamonds Balance */}
        <div className="flex items-center gap-3 flex-wrap">
          <div
            onClick={onNavigateStore}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 border border-amber-500/40 hover:border-amber-400 rounded-lg cursor-pointer transition-all shadow-[0_0_10px_rgba(255,180,0,0.2)]"
            title="Click to visit Weapon Store"
          >
            <span className="text-base">🪙</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-amber-300 font-bold tracking-wider uppercase font-mono">COINS</span>
              <span className="text-xs font-bold font-mono-numbers text-amber-400">{coins.toLocaleString()}</span>
            </div>
          </div>

          <div
            onClick={onNavigateStore}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 rounded-lg cursor-pointer transition-all shadow-[0_0_10px_rgba(0,243,255,0.25)]"
            title="Diamonds available in Diamond Vault"
          >
            <span className="text-base">💎</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-cyan-300 font-bold tracking-wider uppercase font-mono">DIAMONDS</span>
              <span className="text-xs font-black font-mono-numbers text-cyan-300">{diamonds.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-6xl mx-auto mt-6 flex flex-col gap-6 pb-12">
        {/* Title & Tagline */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white flex items-center gap-2.5">
              <Navigation className="w-7 h-7 text-cyan-400" />
              REGIONAL COMBAT THEATERS · BANGLADESH 2077
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-mono max-w-5xl leading-relaxed">
              Choose your combat theater across {Object.keys(REGIONS).length} cyber maps ({LEVELS.length} sectors): <strong className="text-cyan-300">Dhaka</strong>, <strong className="text-emerald-300">Rajshahi Biosphere</strong>, <strong className="text-amber-300">Chattogram</strong>, <strong className="text-purple-300">Sylhet Highlands</strong>, <strong className="text-teal-300">Sundarbans Bio-Vault</strong>, <strong className="text-pink-300">Cox&apos;s Bazar Orbital</strong>, <strong className="text-sky-300">Kuakata Abyssal Rift</strong>, <strong className="text-amber-400">Bengal Singularity</strong>, <strong className="text-cyan-300">Barishal Floating Nebula</strong>, <strong className="text-blue-300">Rangpur Cryo-Aurora</strong>, <strong className="text-orange-300">Khulna Hyper-Core</strong>, and <strong className="text-rose-300">Bengal Eternity Throne</strong>. Unlock new regions strictly through combat sector progression!
            </p>
          </div>
        </div>

        {/* Combat Difficulty Protocol Selector */}
        <section
          aria-label="Combat Difficulty Selector"
          className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
        >
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>COMBAT DIFFICULTY PROTOCOL</span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Scales hostile spawn speed, simultaneous wave density, and enemy attack damage across all {LEVELS.length} sectors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
            {(['easy', 'normal', 'nightmare'] as DifficultyMode[]).map((mode) => {
              const mod = DIFFICULTY_MODIFIERS[mode];
              const isSelected = activeDifficulty === mode;

              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectDifficulty(mode)}
                  className={`px-3.5 py-2.5 rounded-lg border text-left transition-all cursor-pointer sm:min-w-[150px] ${
                    isSelected
                      ? 'bg-slate-900 border-2 shadow-lg'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                  }`}
                  style={
                    isSelected
                      ? {
                          borderColor: mod.color,
                          boxShadow: `0 0 18px ${mod.color}33`,
                        }
                      : {}
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-xs font-black tracking-wider uppercase"
                      style={{ color: isSelected ? mod.color : '#e2e8f0' }}
                    >
                      {mod.label}
                    </span>
                    {isSelected && (
                      <span
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: mod.color }}
                      />
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-300 mt-1 font-mono-numbers">
                    {mod.spawnRateMultiplier}x SPAWN · {mod.damageMultiplier}x DMG
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 12 Regional Map Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(REGIONS) as MapRegionId[]).map((rId) => {
            const reg = REGIONS[rId];
            const isSelected = selectedRegionId === rId;
            const unlocked = isRegionUnlocked(rId, highestLevelUnlocked);
            const totalInRegion = reg.endLevel - reg.startLevel + 1;
            const completedCount = Math.max(
              0,
              Math.min(totalInRegion, highestLevelUnlocked - reg.startLevel + 1)
            );

            return (
              <div
                key={rId}
                onClick={() => setSelectedRegionId(rId)}
                className={`group rounded-xl border overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 border-2 shadow-[0_0_25px_rgba(0,243,255,0.4)] transform -translate-y-1'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-600'
                }`}
                style={isSelected ? { borderColor: reg.primaryColor } : {}}
              >
                {/* Visual Image Header */}
                <div className="relative w-full h-44 sm:h-48 overflow-hidden bg-slate-900">
                  <img
                    src={reg.imageSrc}
                    alt={reg.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  {/* Top Overlay Badge */}
                  <div className="absolute top-3 left-2.5 right-2.5 flex justify-between items-center gap-1.5">
                    <span
                      className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase font-mono shadow-md whitespace-nowrap"
                      style={{
                        backgroundColor: 'rgba(6, 11, 22, 0.88)',
                        color: reg.primaryColor,
                        border: `1px solid ${reg.primaryColor}66`,
                      }}
                    >
                      SECTORS {String(reg.startLevel).padStart(2, '0')}-{String(reg.endLevel).padStart(2, '0')}
                    </span>

                    {unlocked ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-400/50 text-[9px] font-bold tracking-wider flex items-center gap-1 whitespace-nowrap">
                        <CheckCircle className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                        UNLOCKED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-950/90 text-slate-300 border border-slate-600/60 text-[9px] font-bold tracking-wider flex items-center gap-1 whitespace-nowrap">
                        <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        REQ LVL {reg.startLevel}
                      </span>
                    )}
                  </div>

                  {/* Bottom Image Title */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="text-xs font-bold text-amber-300 font-mono tracking-wider">
                      {reg.subTitle}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                      {reg.name}
                    </h3>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                  <div>
                    <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      {reg.landmark}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3 font-mono">
                      {reg.description}
                    </p>
                  </div>

                  {/* Status & Action */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="text-[10px] font-mono">
                      <span className="text-slate-400">STATUS: </span>
                      <span className="font-bold text-white font-mono-numbers">
                        {unlocked ? `${completedCount}/${totalInRegion} SECTORS` : 'LOCKED'}
                      </span>
                    </div>

                    {unlocked ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRegionId(rId);
                          onDeployLevel(reg.startLevel);
                        }}
                        className="px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                        style={{
                          backgroundColor: reg.primaryColor,
                          color: '#05070e',
                          boxShadow: `0 0 12px ${reg.primaryColor}55`,
                        }}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>DEPLOY</span>
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-slate-400 border border-slate-800 flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span>CLEAR SECTOR {reg.startLevel - 1}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Region Detailed Mission Theater */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.6)]">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: selectedRegion.primaryColor }}
                />
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wider">
                  {selectedRegion.name} · {selectedRegion.subTitle}
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {selectedRegion.tagline} · {selectedRegion.threatLevel}
              </p>
            </div>

            {isSelectedUnlocked ? (
              <button
                onClick={() => onDeployLevel(selectedRegion.startLevel)}
                className="px-5 py-2.5 rounded-lg text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg"
                style={{
                  backgroundColor: selectedRegion.primaryColor,
                  boxShadow: `0 0 16px ${selectedRegion.primaryColor}66`,
                }}
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>DEPLOY SECTOR {selectedRegion.startLevel}</span>
              </button>
            ) : (
              <div className="px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>LOCKED · CLEAR SECTOR {selectedRegion.startLevel - 1}</span>
              </div>
            )}
          </div>

          {/* 7 Sectors Grid */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {regionLevels.map((lvl) => {
              const isLevelUnlocked = isSelectedUnlocked && lvl.level <= highestLevelUnlocked;
              const isBoss = lvl.hasBoss;

              return (
                <div
                  key={lvl.level}
                  onClick={() => {
                    if (isLevelUnlocked) {
                      onDeployLevel(lvl.level);
                    }
                  }}
                  className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between ${
                    isLevelUnlocked
                      ? 'bg-slate-900/90 border-slate-700 hover:border-cyan-400 cursor-pointer shadow-md'
                      : 'bg-slate-950/60 border-slate-900 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="font-bold text-cyan-400 flex items-center gap-1">
                        {!isLevelUnlocked && <Lock className="w-3 h-3 text-slate-500" />}
                        SECTOR {lvl.level}
                      </span>
                      {isBoss ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/40 text-[9px] font-bold">
                          BOSS SUMMIT
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono-numbers">{lvl.hostileQuota} HOSTILES</span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-white tracking-wide">{lvl.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">{lvl.difficultyLabel}</div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">PRIZE</span>
                    <span className="text-amber-400 font-bold font-mono-numbers">+{lvl.clearRewardScrap * 5} 🪙</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
