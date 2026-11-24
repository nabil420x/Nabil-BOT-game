import React, { useState, useEffect } from 'react';
import { UserProfile, CraftId, Achievement, MapRegionId } from '../game/types';
import { AVATAR_OPTIONS, loadUserProfile, saveUserProfile, calculateMilitaryRank } from '../game/profile';
import { loadAchievements, getAchievementStats, TIER_CONFIG } from '../game/achievements';
import { soundEngine } from '../game/audio';
import { LEVELS, REGIONS } from '../game/levels';
import { Trophy, Medal, Award, CheckCircle, Sparkles, Shield, Flame, Star, Zap, Lock } from 'lucide-react';

interface ProfileScreenProps {
  onBackToHome: () => void;
  onOpenMap: () => void;
  onOpenStore: () => void;
  onStartGame: () => void;
  onOpenDailyMissions?: () => void;
  onOpenLeaderboard?: () => void;
  unclaimedMissionsCount?: number;
  activeCraft?: CraftId;
  coins: number;
  diamonds?: number;
  initialTab?: 'profile' | 'medals';
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBackToHome,
  onOpenMap,
  onOpenStore,
  onStartGame,
  onOpenDailyMissions,
  onOpenLeaderboard,
  unclaimedMissionsCount = 0,
  activeCraft = 'vanguard_alpha',
  coins,
  diamonds = 0,
  initialTab = 'profile',
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'medals'>(initialTab);
  const [profile, setProfile] = useState<UserProfile>(() => loadUserProfile());
  const [achievements, setAchievements] = useState<Achievement[]>(() => loadAchievements());
  const [medalFilter, setMedalFilter] = useState<'all' | 'combat' | 'mastery' | 'progression' | 'elite'>('all');
  const [name, setName] = useState(profile.name);
  const [callsign, setCallsign] = useState(profile.callsign);
  const [tagline, setTagline] = useState(profile.tagline);
  const [avatarId, setAvatarId] = useState(profile.avatarId);
  const [homeRegion, setHomeRegion] = useState<MapRegionId>(profile.homeRegion);
  const [themeColor, setThemeColor] = useState(profile.themeColor);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    const p = loadUserProfile();
    setProfile(p);
    setAchievements(loadAchievements());
    setName(p.name);
    setCallsign(p.callsign);
    setTagline(p.tagline);
    setAvatarId(p.avatarId);
    setHomeRegion(p.homeRegion);
    setThemeColor(p.themeColor);
  }, []);

  const activeAvatar = AVATAR_OPTIONS.find((a) => a.id === avatarId) || AVATAR_OPTIONS[0];

  const handleSave = () => {
    soundEngine.playPickup();
    const updated: UserProfile = {
      ...profile,
      name: name.trim() || 'Commander NaBil',
      callsign: callsign.trim().toUpperCase() || 'NABIL-01',
      tagline: tagline.trim() || 'Defending the Sovereign Cyber Grids of Bangladesh 2077',
      avatarId,
      homeRegion,
      themeColor,
      rankTitle: calculateMilitaryRank(profile.highestLevel, profile.totalPurges),
    };
    saveUserProfile(updated);
    setProfile(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const handleReset = () => {
    soundEngine.playPickup();
    setName('Commander NaBil');
    setCallsign('NABIL-01');
    setTagline('Defending the Sovereign Cyber Grids of Bangladesh 2077');
    setAvatarId('nabil_prime');
    setHomeRegion('dhaka');
    setThemeColor('#00f3ff');
  };

  const dynamicRank = calculateMilitaryRank(profile.highestLevel, profile.totalPurges);
  const achStats = getAchievementStats(achievements);

  const filteredAchievements = achievements.filter((ach) => {
    if (medalFilter === 'all') return true;
    return ach.category === medalFilter;
  });

  const unlockedBadges = achievements.filter((a) => a.isUnlocked);

  return (
    <div className="relative w-screen h-screen overflow-y-auto bg-[#04060b] text-slate-100 flex flex-col font-mono select-none">
      {/* Background Cyber Grid Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, ${themeColor}15 0%, transparent 60%), linear-gradient(rgba(0,243,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.08) 1px, transparent 1px)`,
            backgroundSize: '100% 100%, 60px 60px, 60px 60px',
          }}
        />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-20 border-b border-slate-800 bg-slate-950/95 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEngine.playPickup();
              onBackToHome();
            }}
            className="px-4 py-2 border border-slate-700 hover:border-cyan-400 bg-slate-900/60 hover:bg-slate-800 text-xs font-bold tracking-wider text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            🏠 HOME
          </button>
          <button
            onClick={() => {
              soundEngine.playPickup();
              onOpenMap();
            }}
            className="px-4 py-2 border border-slate-700 hover:border-emerald-400 bg-slate-900/60 hover:bg-slate-800 text-xs font-bold tracking-wider text-slate-300 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            🗺️ MAPS (40 SECTORS)
          </button>
          <button
            onClick={() => {
              soundEngine.playPickup();
              onOpenStore();
            }}
            className="px-4 py-2 border border-slate-700 hover:border-amber-400 bg-slate-900/60 hover:bg-slate-800 text-xs font-bold tracking-wider text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
          >
            🛒 STORE
          </button>
          {onOpenDailyMissions && (
            <button
              onClick={() => {
                soundEngine.playPickup();
                onOpenDailyMissions();
              }}
              className="px-4 py-2 border border-slate-700 hover:border-amber-400 bg-slate-900/60 hover:bg-slate-800 text-xs font-bold tracking-wider text-slate-300 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>🎯 DAILY MISSIONS</span>
              {unclaimedMissionsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] animate-pulse">
                  {unclaimedMissionsCount}
                </span>
              )}
            </button>
          )}

          {onOpenLeaderboard && (
            <button
              onClick={() => {
                soundEngine.playPickup();
                onOpenLeaderboard();
              }}
              className="px-4 py-2 border border-slate-700 hover:border-amber-400 bg-slate-900/60 hover:bg-slate-800 text-xs font-bold tracking-wider text-slate-300 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>🏆 LEADERBOARD</span>
            </button>
          )}

          <div className="px-4 py-2 border-2 border-cyan-400 bg-cyan-950/40 text-xs font-bold tracking-wider text-cyan-300 flex items-center gap-2">
            <span>👤</span>
            <span>COMMANDER PROFILE & MEDALS</span>
          </div>
        </div>

        {/* Coin & Diamond Balance Badges */}
        <div className="flex items-center gap-2.5">
          <div
            onClick={onOpenStore}
            className="flex items-center gap-2.5 px-3.5 py-2 border border-amber-400/40 bg-amber-950/20 cursor-pointer hover:border-amber-400 transition-colors"
            title="Click to visit Weapon Store"
          >
            <span className="text-xl">🪙</span>
            <div className="text-right">
              <div className="text-[10px] text-amber-400/70 uppercase tracking-widest font-bold">COINS</div>
              <div className="text-sm font-black text-amber-300 tracking-wider">{coins.toLocaleString()}</div>
            </div>
          </div>

          <div
            onClick={onOpenStore}
            className="flex items-center gap-2.5 px-3.5 py-2 border border-cyan-400/40 bg-cyan-950/20 cursor-pointer hover:border-cyan-400 transition-colors"
            title="Click to visit Diamond Vault"
          >
            <span className="text-xl">💎</span>
            <div className="text-right">
              <div className="text-[10px] text-cyan-400/70 uppercase tracking-widest font-bold">DIAMONDS</div>
              <div className="text-sm font-black text-cyan-300 tracking-wider">{diamonds.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full p-6 lg:p-8 flex flex-col gap-6">
        {/* Banner */}
        <div className="border border-cyan-500/30 bg-slate-900/85 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                <span>●</span>
                <span>BANGLADESH 2077 · COMMANDER PROFILE & MEDAL RECOGNITION</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white uppercase">
                {activeTab === 'profile' ? 'COMMANDER REGISTRATION & DOSSIER' : 'MEDALS & COMBAT ACHIEVEMENTS'}
              </h1>
              <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                {activeTab === 'profile'
                  ? 'Customize your combat identity, assign regional garrisons, and view your authenticated Bangladesh Armed Cyber Corps ID card.'
                  : 'Track hardcore milestone achievements including 4,000 Kills, Untouchable No-Hit Clears (3x), 45x Combo Streaks, and Sector Boss Masteries.'}
              </p>
            </div>

            {/* Quick stats counter */}
            <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 p-3 shrink-0">
              <div className="text-center px-2">
                <div className="text-[10px] text-slate-400 uppercase font-bold">MEDALS EARNED</div>
                <div className="text-lg font-black text-amber-400">
                  {achStats.unlockedCount} / {achStats.totalCount}
                </div>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-center px-2">
                <div className="text-[10px] text-slate-400 uppercase font-bold">COMPLETION</div>
                <div className="text-lg font-black text-cyan-400">
                  {achStats.percentComplete}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex border-b border-slate-800 gap-2">
          <button
            onClick={() => {
              soundEngine.playPickup();
              setActiveTab('profile');
            }}
            className={`py-3 px-6 text-xs font-black tracking-widest uppercase transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <span>👤</span>
            <span>COMMANDER DOSSIER</span>
          </button>
          <button
            onClick={() => {
              soundEngine.playPickup();
              setActiveTab('medals');
            }}
            className={`py-3 px-6 text-xs font-black tracking-widest uppercase transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'medals'
                ? 'border-amber-400 text-amber-300 bg-amber-950/30'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            <Medal className="w-4 h-4 text-amber-400" />
            <span>MEDALS & ACHIEVEMENTS</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {achStats.unlockedCount}/{achStats.totalCount}
            </span>
          </button>
        </div>

        {/* Save confirmation toast */}
        {savedToast && (
          <div className="bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 px-6 py-3 text-sm font-bold tracking-wider flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <span>✓</span>
              <span>PROFILE PROTOCOL SAVED SUCCESSFULLY!</span>
            </div>
            <span className="text-xs text-emerald-400/80">LOCAL DATABASE SYNCED</span>
          </div>
        )}

        {/* TAB 1: PROFILE DOSSIER */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Form: Profile Creator */}
            <div className="lg:col-span-7 flex flex-col gap-6 border border-slate-800 bg-slate-950/60 p-6 lg:p-8">
              <h2 className="text-lg font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                <span>🛠️</span>
                <span>COMMANDER REGISTRATION & CUSTOMIZER</span>
              </h2>

              {/* Callsign and Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Commander Name / Callsign:
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={30}
                    placeholder="Enter commander name..."
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 px-4 py-2.5 text-sm text-white focus:outline-none tracking-wider font-mono"
                  />
                  <input
                    type="text"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                    maxLength={10}
                    placeholder="CALLSIGN"
                    className="w-32 bg-slate-900 border border-slate-700 focus:border-cyan-400 px-4 py-2.5 text-sm text-cyan-400 font-bold focus:outline-none tracking-widest font-mono text-center"
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <span className="text-[10px] text-slate-500 uppercase">PRESETS:</span>
                  {['Commander NaBil', 'Bengal Apex Saber', 'Padma Cyber Vanguard', 'Chattogram Titan'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setName(p);
                        setCallsign(p.slice(0, 8).toUpperCase().replace(/\s/g, ''));
                      }}
                      className="text-[10px] text-cyan-400/80 hover:text-cyan-300 underline cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pilot Tagline */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Pilot Motto / Tactical Tagline:
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  maxLength={70}
                  placeholder="Enter motto..."
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 px-4 py-2.5 text-sm text-white focus:outline-none tracking-wider font-mono"
                />
              </div>

              {/* Avatar Mech Selection */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Cyber Combat Mech Avatar:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {AVATAR_OPTIONS.map((av) => {
                    const isSelected = avatarId === av.id;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playPickup();
                          setAvatarId(av.id);
                        }}
                        className={`p-3 border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20'
                            : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{av.badge}</span>
                          {isSelected && <span className="text-xs font-black text-cyan-400">ACTIVE</span>}
                        </div>
                        <div className="text-xs font-bold text-white truncate">{av.name}</div>
                        <div className="text-[10px] text-cyan-400/80 font-mono mt-0.5">{av.role}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Home Base Regional Garrison */}
              <div className="flex flex-col gap-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Home Base Regional Garrison (Bangladesh 2077):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.values(REGIONS).map((reg) => {
                    const isSelected = homeRegion === reg.id;
                    return (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playPickup();
                          setHomeRegion(reg.id);
                        }}
                        className={`p-3 border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-2 bg-slate-900/80 shadow-md'
                            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                        }`}
                        style={{ borderColor: isSelected ? reg.primaryColor : undefined }}
                      >
                        <div
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: isSelected ? reg.primaryColor : '#cbd5e1' }}
                        >
                          {reg.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Levels {reg.startLevel} - {reg.endLevel} · {reg.subTitle}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Theme Color */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Hologram Theme Accent:
                </label>
                <div className="flex gap-3">
                  {[
                    { c: '#00f3ff', label: 'Neon Cyan' },
                    { c: '#00ff88', label: 'Emerald Green' },
                    { c: '#ffaa00', label: 'Amber Gold' },
                    { c: '#ff0077', label: 'Neon Crimson' },
                    { c: '#9d00ff', label: 'Cosmic Violet' },
                  ].map((clr) => (
                    <button
                      key={clr.c}
                      type="button"
                      onClick={() => setThemeColor(clr.c)}
                      className={`w-9 h-9 border-2 transition-transform cursor-pointer flex items-center justify-center ${
                        themeColor === clr.c ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: clr.c }}
                      title={clr.label}
                    >
                      {themeColor === clr.c && <span className="text-black font-black text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-3 px-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black tracking-widest uppercase text-sm transition-colors cursor-pointer shadow-lg shadow-cyan-500/20"
                >
                  SAVE PROFILE
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3 px-5 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  RESET DEFAULTS
                </button>
              </div>
            </div>

            {/* Right Hologram ID Card Dossier */}
            <div className="lg:col-span-5 flex flex-col gap-6 sticky top-8">
              <div
                className="border-2 p-6 relative overflow-hidden transition-all duration-300"
                style={{
                  borderColor: themeColor,
                  backgroundColor: 'rgba(5, 8, 16, 0.90)',
                  boxShadow: `0 0 35px ${themeColor}22, inset 0 0 20px ${themeColor}11`,
                }}
              >
                {/* Corner brackets */}
                <div
                  className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2"
                  style={{ borderColor: themeColor }}
                />
                <div
                  className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2"
                  style={{ borderColor: themeColor }}
                />
                <div
                  className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2"
                  style={{ borderColor: themeColor }}
                />
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2"
                  style={{ borderColor: themeColor }}
                />

                {/* Dossier Header */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-6">
                  <div>
                    <div className="text-[10px] text-slate-400 tracking-widest uppercase font-bold">
                      BANGLADESH ARMED CYBER CORPS
                    </div>
                    <div className="text-xs font-black text-white tracking-wider">OFFICIAL MILITARY ID DOSSIER</div>
                  </div>
                  <div
                    className="px-2.5 py-1 text-[10px] font-black tracking-widest uppercase border"
                    style={{
                      borderColor: `${themeColor}66`,
                      backgroundColor: `${themeColor}15`,
                      color: themeColor,
                    }}
                  >
                    SEC-LEVEL {LEVELS.length}
                  </div>
                </div>

                {/* Pilot Avatar & Badge */}
                <div className="flex items-center gap-5 mb-5">
                  <div
                    className="w-20 h-20 rounded-full border-2 flex items-center justify-center text-4xl relative shrink-0 shadow-lg"
                    style={{
                      borderColor: themeColor,
                      backgroundColor: `${themeColor}20`,
                      boxShadow: `0 0 20px ${themeColor}44`,
                    }}
                  >
                    <span>{activeAvatar.badge}</span>
                    <div
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border border-slate-950 flex items-center justify-center text-[10px] font-black text-black"
                      style={{ backgroundColor: themeColor }}
                    >
                      ★
                    </div>
                  </div>

                  <div className="overflow-hidden">
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">{callsign}</div>
                    <h3 className="text-xl font-black text-white tracking-tight truncate">{name}</h3>
                    <div
                      className="text-[11px] font-bold mt-0.5 tracking-wider truncate"
                      style={{ color: themeColor }}
                    >
                      {dynamicRank}
                    </div>
                  </div>
                </div>

                {/* Tagline / Motto */}
                <div className="border border-slate-800 bg-slate-900/60 p-3 mb-5 text-xs text-slate-300 italic">
                  "{tagline}"
                </div>

                {/* Earned Badges Strip on ID Card (Requested by User) */}
                <div className="border border-slate-800 bg-slate-900/50 p-3 mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] text-amber-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                      <Medal className="w-3.5 h-3.5" />
                      <span>HONORARY BADGES EARNED ({unlockedBadges.length})</span>
                    </div>
                    <button
                      onClick={() => {
                        soundEngine.playPickup();
                        setActiveTab('medals');
                      }}
                      className="text-[10px] text-cyan-400 hover:underline font-bold"
                    >
                      VIEW ALL →
                    </button>
                  </div>
                  {unlockedBadges.length === 0 ? (
                    <div className="text-[11px] text-slate-500 italic py-1">
                      No medals earned yet. Eliminate hostiles in the arena to unlock badges!
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {unlockedBadges.slice(0, 8).map((b) => (
                        <div
                          key={b.id}
                          className="px-2 py-1 bg-slate-800/80 border border-slate-700 text-xs flex items-center gap-1.5 rounded"
                          title={`${b.title}: ${b.description}`}
                        >
                          <span>{b.icon}</span>
                          <span className="text-[10px] font-bold text-slate-200">{b.title}</span>
                        </div>
                      ))}
                      {unlockedBadges.length > 8 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{unlockedBadges.length - 8} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Career Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SECTORS UNLOCKED</div>
                    <div className="text-lg font-black text-cyan-300">
                      {profile.highestLevel} / {LEVELS.length}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      ALL {Object.keys(REGIONS).length} REGIONS · BANGLADESH 2077
                    </div>
                  </div>

                  <div className="border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">HOSTILES PURGED</div>
                    <div className="text-lg font-black text-emerald-300">
                      {profile.totalPurges}
                    </div>
                    <div className="text-[10px] text-slate-400">TOTAL COMBAT KILLS</div>
                  </div>

                  <div className="border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">BEST SCORE</div>
                    <div className="text-lg font-black text-amber-300">
                      {profile.bestScore.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">RECORD HIGH-SCORE</div>
                  </div>

                  <div className="border border-slate-800 bg-slate-900/40 p-3">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">TOTAL BATTLES</div>
                    <div className="text-lg font-black text-pink-300">
                      {profile.totalBattles}
                    </div>
                    <div className="text-[10px] text-slate-400">SORTIES DEPLOYED</div>
                  </div>
                </div>

                {/* Garrison & Regional Base */}
                <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-400 uppercase tracking-wider">HOME STATION:</span>
                  <span className="font-bold text-white uppercase tracking-wider">
                    {REGIONS[homeRegion]?.name || 'DHAKA CYBER METROPOLIS'}
                  </span>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    soundEngine.playPickup();
                    onStartGame();
                  }}
                  className="w-full py-3.5 px-6 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black tracking-widest uppercase text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>⚔️</span>
                  <span>DEPLOY TO LEVEL {profile.highestLevel} NOW</span>
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      soundEngine.playPickup();
                      onOpenMap();
                    }}
                    className="py-2.5 px-4 border border-emerald-500/50 hover:border-emerald-400 bg-slate-900/80 hover:bg-slate-800 text-emerald-300 font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer text-center"
                  >
                    🗺️ {LEVELS.length} REGIONAL MAPS
                  </button>
                  <button
                    onClick={() => {
                      soundEngine.playPickup();
                      onOpenStore();
                    }}
                    className="py-2.5 px-4 border border-amber-500/50 hover:border-amber-400 bg-slate-900/80 hover:bg-slate-800 text-amber-300 font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer text-center"
                  >
                    🛒 WEAPON STORE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEDALS & ACHIEVEMENTS HANGAR */}
        {activeTab === 'medals' && (
          <div className="flex flex-col gap-6">
            {/* Overview Tier Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="border border-amber-500/40 bg-amber-950/20 p-4">
                <div className="flex items-center justify-between text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <span>BRONZE TIER</span>
                  <span>🥉</span>
                </div>
                <div className="text-2xl font-black text-amber-200">
                  {achStats.bronzeUnlocked} / {achStats.bronzeTotal}
                </div>
                <div className="text-[10px] text-amber-400/70 mt-1">Foundational Combat Medals</div>
              </div>

              <div className="border border-slate-400/40 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between text-slate-300 text-xs font-bold uppercase tracking-wider mb-1">
                  <span>SILVER TIER</span>
                  <span>🥈</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {achStats.silverUnlocked} / {achStats.silverTotal}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Tactical Specialization Badges</div>
              </div>

              <div className="border border-yellow-500/40 bg-yellow-950/20 p-4">
                <div className="flex items-center justify-between text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <span>GOLD TIER</span>
                  <span>🥇</span>
                </div>
                <div className="text-2xl font-black text-yellow-200">
                  {achStats.goldUnlocked} / {achStats.goldTotal}
                </div>
                <div className="text-[10px] text-yellow-400/70 mt-1">Sector Boss & 45x Combo Milestones</div>
              </div>

              <div className="border border-cyan-400/40 bg-cyan-950/20 p-4">
                <div className="flex items-center justify-between text-cyan-300 text-xs font-bold uppercase tracking-wider mb-1">
                  <span>PLATINUM TIER</span>
                  <span>👑</span>
                </div>
                <div className="text-2xl font-black text-cyan-200">
                  {achStats.platinumUnlocked} / {achStats.platinumTotal}
                </div>
                <div className="text-[10px] text-cyan-400/70 mt-1">Supreme Marshal Achievements</div>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
              {[
                { id: 'all', label: `ALL MEDALS (${achievements.length})` },
                { id: 'combat', label: '⚔️ COMBAT PURGE' },
                { id: 'mastery', label: '🛡️ TACTICAL MASTERY' },
                { id: 'progression', label: '🗺️ SECTOR PROGRESSION' },
                { id: 'elite', label: '👑 ELITE PROTOCOL' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    soundEngine.playPickup();
                    setMedalFilter(f.id as any);
                  }}
                  className={`px-4 py-2 text-xs font-bold tracking-wider uppercase transition-colors cursor-pointer border ${
                    medalFilter === f.id
                      ? 'border-amber-400 bg-amber-950/40 text-amber-300'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.map((ach) => {
                const tier = TIER_CONFIG[ach.tier];
                const progressPct = Math.min(100, Math.round((ach.currentProgress / ach.targetProgress) * 100));

                return (
                  <div
                    key={ach.id}
                    className={`border p-5 relative overflow-hidden transition-all ${
                      ach.isUnlocked
                        ? 'bg-slate-900/70 hover:bg-slate-900 shadow-lg'
                        : 'bg-slate-950/40 opacity-75 hover:opacity-90'
                    }`}
                    style={{
                      borderColor: ach.isUnlocked ? tier.color : '#1e293b',
                      boxShadow: ach.isUnlocked ? `0 0 15px ${tier.color}22` : 'none',
                    }}
                  >
                    {/* Top Row: Icon + Title + Tier */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-lg border flex items-center justify-center text-2xl shrink-0"
                        style={{
                          borderColor: ach.isUnlocked ? tier.color : '#334155',
                          backgroundColor: ach.isUnlocked ? `${tier.color}15` : '#0f172a',
                        }}
                      >
                        {ach.isUnlocked ? ach.icon : <Lock className="w-5 h-5 text-slate-600" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-black text-white truncate tracking-wide">
                            {ach.title}
                          </h3>
                          <span
                            className="text-[9px] font-black uppercase px-2 py-0.5 rounded border shrink-0"
                            style={{
                              borderColor: `${tier.color}66`,
                              backgroundColor: `${tier.color}15`,
                              color: tier.color,
                            }}
                          >
                            {tier.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {ach.description}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar & Counters */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                        <span>
                          {ach.isUnlocked ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-black">
                              <CheckCircle className="w-3 h-3" />
                              UNLOCKED
                            </span>
                          ) : (
                            <span>PROGRESS</span>
                          )}
                        </span>
                        <span className="font-mono text-slate-300">
                          {ach.currentProgress.toLocaleString()} / {ach.targetProgress.toLocaleString()} ({progressPct}%)
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-950 border border-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-500 rounded-full"
                          style={{
                            width: `${progressPct}%`,
                            backgroundColor: ach.isUnlocked ? '#00ff88' : tier.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Reward Bounty */}
                    <div className="mt-3 flex items-center justify-between text-xs pt-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">BOUNTY REWARD:</span>
                      <div className="flex items-center gap-1 text-amber-300 font-bold">
                        <span>🪙</span>
                        <span>+{ach.rewardCoins} COINS</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
