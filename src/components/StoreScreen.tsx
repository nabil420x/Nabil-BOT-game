import React, { useState } from 'react';
import {
  ShoppingBag,
  Zap,
  Flame,
  Sparkles,
  Check,
  Lock,
  ArrowLeft,
  Play,
  Rocket,
  Shield,
  Wind,
  Crosshair,
  Magnet,
  Gem,
  Award,
  Bot,
  Cpu,
  Package,
} from 'lucide-react';
import { WEAPONS, WEAPON_ORDER } from '../game/weapons';
import {
  WeaponType,
  CraftId,
  CraftSkinId,
  CompanionDroneId,
  ThrusterTrailId,
  PermanentModuleId,
  PreRunBoosterId,
  StoreGearState,
} from '../game/types';
import { CRAFTS, CRAFT_ORDER, getCraftDef } from '../game/crafts';
import { soundEngine } from '../game/audio';
import {
  loadDiamonds,
  spendDiamonds,
  loadDiamondRelics,
  saveDiamondRelics,
  DiamondRelics,
  DIAMOND_RELIC_COSTS,
} from '../game/diamonds';
import { loadWeaponMastery, getMasteryTierForXp, formatMasteryPerksSummary } from '../game/mastery';
import {
  NEON_CRAFT_SKINS,
  equipCraftSkin,
  getActiveCraftSkin,
  isNeonSkinUnlocked,
  loadGlobalEventState,
} from '../game/globalEvents';
import { CraftNeonPreviewSvg } from './GlobalEventsModal';
import {
  COMPANION_DRONES,
  COMPANION_ORDER,
  THRUSTER_TRAILS,
  TRAIL_ORDER,
  PERMANENT_MODULES,
  MODULE_ORDER,
  BOOSTER_SHOP_PRICES,
  BOOSTER_DIAMOND_PRICES,
  BOOSTER_ORDER,
  STORE_BUNDLES,
  loadStoreGearState,
  saveStoreGearState,
  isCompanionDiamondExclusive,
  isTrailDiamondExclusive,
  purchaseCompanionState,
  purchaseCompanionWithDiamondsState,
  equipCompanionState,
  unlockDiamondCompanionState,
  purchaseTrailState,
  purchaseTrailWithDiamondsState,
  equipTrailState,
  unlockDiamondTrailState,
  purchaseModuleState,
  purchaseModuleWithDiamondsState,
  purchaseBoosterWithCoins,
  purchaseBoosterWithDiamonds,
  purchaseStoreBundle,
} from '../game/storeCatalog';
import { isWeaponDiamondExclusive } from '../game/rules';
import { isCraftDiamondExclusive } from '../game/crafts';
import { loadSupplyCrateState, PRE_RUN_BOOSTERS } from '../game/supplyCrate';

function getWeaponIcon(id: WeaponType): string {
  switch (id) {
    case 'pulse': return '⚡';
    case 'scatter': return '💥';
    case 'beam': return '💫';
    case 'missile': return '🚀';
    case 'leviathan': return '🔱';
    case 'vortex': return '🌀';
    case 'inferno': return '🔥';
    case 'chrono_thunder': return '⏳';
    case 'supernova': return '🌟';
    case 'aegis_titan': return '🛡️';
    case 'hyperion_astral': return '💎';
    case 'plasma_scythe': return '🌙';
    case 'cryo_shatter': return '❄️';
    case 'omega_singularity': return '🕳️';
    case 'prism_splitter': return '🔮';
    case 'void_rail': return '🌌';
    case 'celestial_eclipse': return '☄️';
    default: return '🔫';
  }
}

function getCraftIcon(cId: CraftId): string {
  switch (cId) {
    case 'vanguard_alpha': return '✈️';
    case 'cyber_falcon': return '🦅';
    case 'phantom_shadow': return '🛸';
    case 'titan_dread': return '🛡️';
    case 'solar_phoenix': return '🔥';
    case 'aegis_celestial': return '⚡';
    case 'nebula_harbinger': return '🌌';
    case 'astral_valkyrie': return '👑';
    case 'zenith_emperor': return '⚜️';
    case 'tempest_raptor': return '🌩️';
    case 'seraph_nova': return '🌟';
    default: return '🚀';
  }
}

type StoreTabId = 'weapons' | 'crafts' | 'companions' | 'trails' | 'tech_boosts' | 'diamond_vault';

interface StoreScreenProps {
  coins: number;
  diamonds: number;
  unlockedWeapons: Record<WeaponType, boolean>;
  activeWeapon: WeaponType;
  onBuyWeapon: (weapon: WeaponType) => void;
  onEquipWeapon: (weapon: WeaponType) => void;
  activeCraft?: CraftId;
  unlockedCrafts?: Record<CraftId, boolean>;
  onBuyCraft?: (craftId: CraftId) => void;
  onEquipCraft?: (craftId: CraftId) => void;
  onDiamondPurchase?: (
    type: 'weapon' | 'craft' | 'relic' | 'companion' | 'trail',
    id: string,
    cost: number
  ) => void;
  onSkinUpdated?: () => void;
  onGearUpdated?: () => void;
  onWalletSync?: (newCoins: number, newDiamonds: number) => void;
  onUnlockBundleWeapons?: (weapons: WeaponType[]) => void;
  onBackToHome: () => void;
  onNavigateMap?: () => void;
  onNavigateProfile?: () => void;
  onOpenSupplyCrates?: () => void;
  onDeployGame: () => void;
}

const DEFAULT_UNLOCKED_CRAFTS: Record<CraftId, boolean> = {
  vanguard_alpha: true,
  phantom_shadow: false,
  titan_dread: false,
  solar_phoenix: false,
  aegis_celestial: false,
  astral_valkyrie: false,
  cyber_falcon: false,
  nebula_harbinger: false,
  zenith_emperor: false,
  tempest_raptor: false,
  seraph_nova: false,
};

export const StoreScreen: React.FC<StoreScreenProps> = ({
  coins,
  diamonds,
  unlockedWeapons,
  activeWeapon,
  onBuyWeapon,
  onEquipWeapon,
  activeCraft = 'vanguard_alpha',
  unlockedCrafts = DEFAULT_UNLOCKED_CRAFTS,
  onBuyCraft,
  onEquipCraft,
  onDiamondPurchase,
  onSkinUpdated,
  onGearUpdated,
  onWalletSync,
  onUnlockBundleWeapons,
  onBackToHome,
  onNavigateMap,
  onNavigateProfile,
  onOpenSupplyCrates,
  onDeployGame,
}) => {
  const [activeTab, setActiveTab] = useState<StoreTabId>('weapons');
  const [selectedWeaponId, setSelectedWeaponId] = useState<WeaponType>(
    isWeaponDiamondExclusive(activeWeapon) ? 'pulse' : activeWeapon
  );
  const [selectedCraftId, setSelectedCraftId] = useState<CraftId>(
    isCraftDiamondExclusive(activeCraft) ? 'vanguard_alpha' : activeCraft
  );
  const [storeGear, setStoreGear] = useState<StoreGearState>(() => loadStoreGearState());
  const [selectedCompanionId, setSelectedCompanionId] = useState<CompanionDroneId>(
    () => loadStoreGearState().activeCompanion || 'scout_spark'
  );
  const [selectedTrailId, setSelectedTrailId] = useState<ThrusterTrailId>(
    () => loadStoreGearState().activeTrail || 'trail_standard'
  );
  const [armedBoosters, setArmedBoosters] = useState<PreRunBoosterId[]>(
    () => loadSupplyCrateState().armedBoosters
  );
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);
  const [diamondRelics, setDiamondRelics] = useState<DiamondRelics>(() => loadDiamondRelics());
  const [weaponMastery] = useState(() => loadWeaponMastery());
  const [eventState, setEventState] = useState(() => loadGlobalEventState());

  const showNotice = (msg: string, ms: number = 3200) => {
    setPurchaseNotice(msg);
    setTimeout(() => setPurchaseNotice(null), ms);
  };

  // Counts (Vault exclusives stay in Diamond Vault; Coin+Diamond items appear in main tabs)
  const coinWeaponIds = WEAPON_ORDER.filter((wId) => !isWeaponDiamondExclusive(wId));
  const coinCraftIds = CRAFT_ORDER.filter((cId) => !isCraftDiamondExclusive(cId));
  const unlockedCompanionCount = COMPANION_ORDER.filter((id) => storeGear.unlockedCompanions[id]).length;
  const unlockedTrailCount = TRAIL_ORDER.filter((id) => storeGear.unlockedTrails[id]).length;

  // Weapon Details
  const selectedWeapon = WEAPONS[selectedWeaponId];
  const selectedMasteryRec = weaponMastery[selectedWeaponId];
  const selectedMastery = getMasteryTierForXp(selectedMasteryRec?.xp || 0);
  const selectedMasteryPerks = formatMasteryPerksSummary(selectedMastery);
  const isWeaponUnlocked = unlockedWeapons[selectedWeaponId];
  const isWeaponEquipped = activeWeapon === selectedWeaponId;
  const isWeaponVaultOnly = isWeaponDiamondExclusive(selectedWeaponId);
  const canAffordWeapon = !isWeaponVaultOnly && selectedWeapon.price > 0 && coins >= selectedWeapon.price;
  const weaponDiamondCost = selectedWeapon.diamondCost ?? 0;
  const canAffordWeaponDiamonds = weaponDiamondCost > 0 && diamonds >= weaponDiamondCost;

  // Craft Details
  const selectedCraft = getCraftDef(selectedCraftId);
  const isCraftUnlocked = unlockedCrafts[selectedCraftId];
  const isCraftEquipped = activeCraft === selectedCraftId;
  const isCraftVaultOnly = isCraftDiamondExclusive(selectedCraftId);
  const canAffordCraft = !isCraftVaultOnly && selectedCraft.price > 0 && coins >= selectedCraft.price;
  const craftDiamondCost = selectedCraft.diamondCost ?? 0;
  const canAffordCraftDiamonds = craftDiamondCost > 0 && diamonds >= craftDiamondCost;
  const isSelectedNeonUnlocked = isNeonSkinUnlocked(selectedCraftId, eventState);
  const selectedCraftSkin: CraftSkinId = getActiveCraftSkin(selectedCraftId, eventState);

  // Companion Details
  const selectedCompanion = COMPANION_DRONES[selectedCompanionId];
  const isCompanionUnlocked = storeGear.unlockedCompanions[selectedCompanionId];
  const isCompanionEquipped = storeGear.activeCompanion === selectedCompanionId;
  const isCompanionVaultOnly = isCompanionDiamondExclusive(selectedCompanionId);
  const canAffordCompanion = !isCompanionVaultOnly && selectedCompanion.price > 0 && coins >= selectedCompanion.price;
  const companionDiamondCost = selectedCompanion.diamondCost ?? 0;
  const canAffordCompanionDiamonds = companionDiamondCost > 0 && diamonds >= companionDiamondCost;

  // Trail Details
  const selectedTrail = THRUSTER_TRAILS[selectedTrailId];
  const isTrailUnlocked = storeGear.unlockedTrails[selectedTrailId];
  const isTrailEquipped = storeGear.activeTrail === selectedTrailId;
  const isTrailVaultOnly = isTrailDiamondExclusive(selectedTrailId);
  const canAffordTrail = !isTrailVaultOnly && selectedTrail.price > 0 && coins >= selectedTrail.price;
  const trailDiamondCost = selectedTrail.diamondCost ?? 0;
  const canAffordTrailDiamonds = trailDiamondCost > 0 && diamonds >= trailDiamondCost;

  const handleToggleCraftSkin = (craftId: CraftId, skinId: CraftSkinId) => {
    const res = equipCraftSkin(craftId, skinId);
    if (res.success) {
      soundEngine.playPickup();
      setEventState(res.updatedState);
      onSkinUpdated?.();
      showNotice(
        skinId === 'neon'
          ? `⚡ EQUIPPED ${NEON_CRAFT_SKINS[craftId].name.toUpperCase()}!`
          : `EQUIPPED STANDARD CHASSIS FOR ${getCraftDef(craftId).name.toUpperCase()}`
      );
    } else {
      soundEngine.playDefeat();
      showNotice(res.error || 'Unlock Neon Skin in 48h Global Event!');
    }
  };

  const handleBuyWeaponClick = (wId: WeaponType) => {
    const wep = WEAPONS[wId];
    if (coins < wep.price) {
      showNotice(`Insufficient coins! Need ${wep.price - coins} more coins.`);
      return;
    }
    onBuyWeapon(wId);
    setSelectedWeaponId(wId);
    showNotice(`★ UNLOCKED ${wep.name.toUpperCase()}! ★`);
  };

  const handleEquipWeaponClick = (wId: WeaponType) => {
    onEquipWeapon(wId);
    setSelectedWeaponId(wId);
    showNotice(`[ EQUIPPED ${WEAPONS[wId].name.toUpperCase()} ]`);
  };

  const handleBuyCraftClick = (cId: CraftId) => {
    const craft = getCraftDef(cId);
    if (coins < craft.price) {
      showNotice(`Insufficient coins! Need ${craft.price - coins} more coins.`);
      return;
    }
    if (onBuyCraft) {
      onBuyCraft(cId);
      setSelectedCraftId(cId);
      showNotice(`★ PURCHASED & EQUIPPED ${craft.name.toUpperCase()}! ★`);
    }
  };

  const handleEquipCraftClick = (cId: CraftId) => {
    if (onEquipCraft) {
      onEquipCraft(cId);
      setSelectedCraftId(cId);
      showNotice(`[ PILOTING ${getCraftDef(cId).name.toUpperCase()} ]`);
    }
  };

  const handleBuyCompanionClick = (id: CompanionDroneId) => {
    const res = purchaseCompanionState(storeGear, coins, id);
    if (!res.success) {
      soundEngine.playDefeat();
      showNotice(res.error || 'Unable to unlock companion drone.');
      return;
    }
    soundEngine.playVictory();
    saveStoreGearState(res.updatedState);
    setStoreGear(res.updatedState);
    setSelectedCompanionId(id);
    onWalletSync?.(res.remainingCoins, diamonds);
    onGearUpdated?.();
    showNotice(`🛰️ DEPLOYED ${COMPANION_DRONES[id].name.toUpperCase()} TO ESCORT SLOT!`);
  };

  const handleBuyCompanionWithDiamondsClick = (id: CompanionDroneId) => {
    const res = purchaseCompanionWithDiamondsState(storeGear, diamonds, id);
    if (!res.success) {
      soundEngine.playDefeat();
      showNotice(res.error || 'Insufficient diamonds.');
      return;
    }
    const spendRes = spendDiamonds(res.cost);
    if (!spendRes.success) {
      soundEngine.playDefeat();
      showNotice(spendRes.error || 'Insufficient diamonds.');
      return;
    }
    soundEngine.playVictory();
    saveStoreGearState(res.updatedState);
    setStoreGear(res.updatedState);
    setSelectedCompanionId(id);
    onWalletSync?.(coins, spendRes.remaining);
    onGearUpdated?.();
    showNotice(`🛰️ DEPLOYED ${COMPANION_DRONES[id].name.toUpperCase()} (-${res.cost} 💎)!`);
  };

  const handleEquipCompanionClick = (id: CompanionDroneId | null) => {
    const res = equipCompanionState(storeGear, id);
    if (!res.success) {
      soundEngine.playDefeat();
      showNotice(res.error || 'Unlock this companion drone first.');
      return;
    }
    soundEngine.playPickup();
    saveStoreGearState(res.updatedState);
    setStoreGear(res.updatedState);
    onGearUpdated?.();
    showNotice(
      id === null
        ? '[ ESCORT DRONE UNEQUIPPED ]'
        : `🛰️ ESCORT ACTIVE: ${COMPANION_DRONES[id].name.toUpperCase()}`
    );
  };

  const handleBuyTrailClick = (id: ThrusterTrailId) => {
    const res = purchaseTrailState(storeGear, coins, id);
    if (!res.success) {
      soundEngine.playDefeat();
      showNotice(res.error || 'Unable to unlock thruster trail.');
      return;
    }
    soundEngine.playVictory();
    saveStoreGearState(res.updatedState);
    setStoreGear(res.updatedState);
    setSelectedTrailId(id);
    onWalletSync?.(res.remainingCoins, diamonds);
    onGearUpdated?.();
    showNotice(`🌈 EQUIPPED ${THRUSTER_TRAILS[id].name.toUpperCase()}!`);
  };

  const handleBuyTrailWithDiamondsClick = (id: ThrusterTrailId) => {
    const res = purchaseTrailWithDiamondsState(storeGear, diamonds, id);
    if (!res.success) {
      soundEngine.playDefeat();
      showNotice(res.error || 'Insufficient diamonds.');
      return;
    }
    const spendRes = spendDiamonds(res.cost);
    if (!spendRes.success) {
      soundEngine.playDefeat();
      showNotice(spendRes.error || 'Insufficient diamonds.');
      return;
    }
    soundEngine.playVictory();
    saveStoreGearState(res.updatedState);
    setStoreGear(res.updatedState);
    setSelectedTrailId(id);
    onWalletSync?.(coins, spendRes.remaining);
    onGearUpdated?.();
    showNotice(`🌈 EQUIPPED ${THRUSTER_TRAILS[id].name.toUpperCase()} (-${res.cost} 💎)!`);
  };

  const handleEquipTrailClick = (id: ThrusterTrailId) => {
    const res = equipTrailState(storeGear, id);
    if (!res.success) {
      soundEngine.playDefeat();
      showNotice(res.error || 'Unlock this trail first.');
      return;
    }
    soundEngine.playPickup();
    saveStoreGearState(res.updatedState);
    setStoreGear(res.updatedState);
    onGearUpdated?.();
    showNotice(`✨ TRAIL ACTIVE: ${THRUSTER_TRAILS[id].name.toUpperCase()}`);
  };

  const handleBuyModuleClick = (id: PermanentModuleId) => {
    const res = purchaseModuleState(storeGear, coins, id);
    if (!res.success) {
      soundEngine.playDefeat();
      showNotice(res.error || 'Unable to purchase module.');
      return;
    }
    soundEngine.playVictory();
    saveStoreGearState(res.updatedState);
    setStoreGear(res.updatedState);
    onWalletSync?.(res.remainingCoins, diamonds);
    onGearUpdated?.();
    showNotice(`⚙️ MODULE PERMANENTLY INSTALLED: ${PERMANENT_MODULES[id].name.toUpperCase()}!`);
  };

  const handleBuyModuleWithDiamondsClick = (id: PermanentModuleId) => {
    const res = purchaseModuleWithDiamondsState(storeGear, diamonds, id);
    if (!res.success) {
      soundEngine.playDefeat();
      showNotice(res.error || 'Insufficient diamonds.');
      return;
    }
    const spendRes = spendDiamonds(res.cost);
    if (!spendRes.success) {
      soundEngine.playDefeat();
      showNotice(spendRes.error || 'Insufficient diamonds.');
      return;
    }
    soundEngine.playVictory();
    saveStoreGearState(res.updatedState);
    setStoreGear(res.updatedState);
    onWalletSync?.(coins, spendRes.remaining);
    onGearUpdated?.();
    showNotice(`⚙️ MODULE PERMANENTLY INSTALLED: ${PERMANENT_MODULES[id].name.toUpperCase()} (-${res.cost} 💎)!`);
  };

  const handleBuyBoosterClick = (id: PreRunBoosterId) => {
    const res = purchaseBoosterWithCoins(id, coins);
    if (!res.success) {
      soundEngine.playDefeat();
      showNotice(res.error || 'Unable to arm booster.');
      return;
    }
    soundEngine.playPickup();
    setArmedBoosters(res.armedBoosters);
    onWalletSync?.(res.remainingCoins, diamonds);
    showNotice(`⚡ ARMED ${PRE_RUN_BOOSTERS[id].name.toUpperCase()} FOR NEXT DEPLOYMENT!`);
  };

  const handleBuyBoosterWithDiamondsClick = (id: PreRunBoosterId) => {
    const res = purchaseBoosterWithDiamonds(id);
    if (!res.success) {
      soundEngine.playDefeat();
      showNotice(res.error || 'Insufficient diamonds.');
      return;
    }
    soundEngine.playPickup();
    setArmedBoosters(res.armedBoosters);
    onWalletSync?.(coins, res.remainingDiamonds);
    showNotice(`⚡ ARMED ${PRE_RUN_BOOSTERS[id].name.toUpperCase()} (-${res.cost} 💎)!`);
  };

  const handleBuyBundleClick = (bundleId: string, currency?: 'coins' | 'diamonds') => {
    const res = purchaseStoreBundle(bundleId, {
      currentCoins: coins,
      activeWeapon,
      gearState: storeGear,
      currency,
    });
    if (!res.success) {
      soundEngine.playDefeat();
      showNotice(res.error || 'Unable to claim bundle.');
      return;
    }
    soundEngine.playVictory();
    setStoreGear(res.updatedGearState);
    setArmedBoosters(res.armedBoosters);
    if (res.unlockedWeaponsList.length > 0) {
      onUnlockBundleWeapons?.(res.unlockedWeaponsList);
    }
    onWalletSync?.(res.remainingCoins, res.remainingDiamonds ?? loadDiamonds());
    onGearUpdated?.();
    showNotice(`📦 CLAIMED ${res.bundle?.name.toUpperCase()}! GEAR & BOOSTERS ACTIVATED!`);
  };

  const handleDiamondBuy = (
    type: 'weapon' | 'craft' | 'relic' | 'companion' | 'trail',
    id: string,
    cost: number,
    name: string
  ) => {
    const res = spendDiamonds(cost);
    if (!res.success) {
      showNotice(
        res.error || `Need ${cost} 💎 Diamonds! Clear Daily Combat Missions to obtain diamonds.`
      );
      soundEngine.playDefeat();
      return;
    }

    soundEngine.playVictory();
    if (type === 'relic') {
      const updated = {
        ...diamondRelics,
        [id]: true,
      };
      saveDiamondRelics(updated);
      setDiamondRelics(updated);
    } else if (type === 'companion') {
      const updated = unlockDiamondCompanionState(storeGear, id as CompanionDroneId);
      saveStoreGearState(updated);
      setStoreGear(updated);
      setSelectedCompanionId(id as CompanionDroneId);
    } else if (type === 'trail') {
      const updated = unlockDiamondTrailState(storeGear, id as ThrusterTrailId);
      saveStoreGearState(updated);
      setStoreGear(updated);
      setSelectedTrailId(id as ThrusterTrailId);
    }

    onDiamondPurchase?.(type, id, cost);
    onGearUpdated?.();
    showNotice(`★ ACQUIRED ${name.toUpperCase()} FROM DIAMOND VAULT! (-${cost} 💎) ★`);
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#060913]/95 text-slate-100 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden select-none">
      {/* Top Header Bar */}
      <div className="w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-cyan-500/30">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onBackToHome}
            className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>🏠 HOME</span>
          </button>

          {onNavigateMap && (
            <button
              onClick={onNavigateMap}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold tracking-wider"
            >
              <span>🗺️ MAPS</span>
            </button>
          )}

          {onNavigateProfile && (
            <button
              onClick={onNavigateProfile}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold tracking-wider"
            >
              <span>👤 PROFILE</span>
            </button>
          )}

          {onOpenSupplyCrates && (
            <button
              type="button"
              data-testid="store-supply-crate-btn"
              onClick={onOpenSupplyCrates}
              className="p-2 rounded-lg bg-slate-900 border border-amber-500/40 hover:border-amber-300 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold tracking-wider"
            >
              <span>🎁 CRATES</span>
            </button>
          )}

          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-wider text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              CYBER ARMORY &amp; SUPERSTORE
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 font-mono">
              {WEAPON_ORDER.length} Weapons · {CRAFT_ORDER.length} Airframes · {COMPANION_ORDER.length} Drones · {TRAIL_ORDER.length} Trails · {MODULE_ORDER.length} Modules &amp; {STORE_BUNDLES.length} Bundles
            </p>
          </div>
        </div>

        {/* Balances & Quick Deploy */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/50 rounded-lg shadow-[0_0_12px_rgba(255,180,0,0.2)]">
            <span className="text-lg">🪙</span>
            <div>
              <div className="text-[9px] text-amber-300 uppercase font-bold tracking-wider">COINS</div>
              <div
                data-testid="store-coins-balance"
                className="text-base sm:text-lg font-bold font-mono-numbers text-amber-400"
              >
                {coins.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-400/50 rounded-lg shadow-[0_0_12px_rgba(0,243,255,0.25)]">
            <span className="text-lg">💎</span>
            <div>
              <div className="text-[9px] text-cyan-300 uppercase font-bold tracking-wider">DIAMONDS</div>
              <div
                data-testid="store-diamonds-balance"
                className="text-base sm:text-lg font-black font-mono-numbers text-cyan-300"
              >
                {diamonds.toLocaleString()}
              </div>
            </div>
          </div>

          <button
            onClick={onDeployGame}
            className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider rounded flex items-center gap-2 shadow-[0_0_15px_rgba(0,243,255,0.4)] transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>DEPLOY</span>
          </button>
        </div>
      </div>

      {/* Floating Notice Bar */}
      {purchaseNotice && (
        <div
          data-testid="store-purchase-notice"
          className="w-full max-w-6xl mx-auto mt-3 py-2 px-4 bg-cyan-950/90 border border-cyan-400 text-center text-xs font-bold text-cyan-300 rounded tracking-wider font-mono animate-fade-in shadow-[0_0_20px_rgba(0,243,255,0.3)]"
        >
          {purchaseNotice}
        </div>
      )}

      {/* Store Department Navigation Tabs (6 Departments) */}
      <div className="w-full max-w-6xl mx-auto mt-4 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
        <button
          data-testid="store-tab-weapons"
          onClick={() => setActiveTab('weapons')}
          className={`px-3 sm:px-4 py-2.5 rounded-xl border text-[11px] sm:text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'weapons'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_18px_rgba(0,243,255,0.3)]'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>WEAPONS ({coinWeaponIds.length})</span>
        </button>

        <button
          data-testid="store-tab-crafts"
          onClick={() => setActiveTab('crafts')}
          className={`px-3 sm:px-4 py-2.5 rounded-xl border text-[11px] sm:text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'crafts'
              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_18px_rgba(255,180,0,0.3)]'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Rocket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>HANGAR ({coinCraftIds.length})</span>
        </button>

        <button
          data-testid="store-tab-companions"
          onClick={() => setActiveTab('companions')}
          className={`px-3 sm:px-4 py-2.5 rounded-xl border text-[11px] sm:text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'companions'
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.3)]'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>DRONES ({unlockedCompanionCount}/{COMPANION_ORDER.length})</span>
        </button>

        <button
          data-testid="store-tab-trails"
          onClick={() => setActiveTab('trails')}
          className={`px-3 sm:px-4 py-2.5 rounded-xl border text-[11px] sm:text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'trails'
              ? 'bg-pink-500/20 border-pink-400 text-pink-200 shadow-[0_0_18px_rgba(236,72,153,0.3)]'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
          <span>TRAILS ({unlockedTrailCount}/{TRAIL_ORDER.length})</span>
        </button>

        <button
          data-testid="store-tab-tech"
          onClick={() => setActiveTab('tech_boosts')}
          className={`px-3 sm:px-4 py-2.5 rounded-xl border text-[11px] sm:text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'tech_boosts'
              ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-[0_0_18px_rgba(99,102,241,0.3)]'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>TECH &amp; BOOSTS</span>
        </button>

        <button
          data-testid="store-tab-vault"
          onClick={() => setActiveTab('diamond_vault')}
          className={`px-3 sm:px-4 py-2.5 rounded-xl border text-[11px] sm:text-xs font-black tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'diamond_vault'
              ? 'bg-gradient-to-r from-purple-500/30 to-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_22px_rgba(0,243,255,0.4)]'
              : 'bg-slate-950/60 border-purple-500/40 text-purple-300 hover:text-purple-100 hover:border-purple-400'
          }`}
        >
          <Gem className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
          <span>VAULT (16)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* DEPARTMENT 1: WEAPONS ARMORY                             */}
      {/* ======================================================== */}
      {activeTab === 'weapons' && (
        <div className="w-full max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          <div className="lg:col-span-8 flex flex-col gap-3">
            {/* God-Tier Weapons */}
            <div className="flex items-center gap-2 pt-1 pb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-widest text-amber-300 font-mono">
                ★ GOD-TIER PROTOCOLS (ULTIMATE POWER · SUPREME ARMS)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {WEAPON_ORDER.filter((wId) => WEAPONS[wId].tier === 'godtier' && !isWeaponDiamondExclusive(wId)).map((wId) => {
                const wep = WEAPONS[wId];
                const unlocked = unlockedWeapons[wId];
                const equipped = activeWeapon === wId;
                const isSelected = selectedWeaponId === wId;

                return (
                  <div
                    key={wId}
                    data-testid={`weapon-card-${wId}`}
                    onClick={() => setSelectedWeaponId(wId)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-2 shadow-[0_0_25px_rgba(255,200,0,0.4)]'
                        : 'bg-slate-950/80 border-amber-500/30 hover:border-amber-400'
                    }`}
                    style={isSelected ? { borderColor: wep.color } : {}}
                  >
                    <div className="flex justify-between items-start gap-1 mb-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-amber-950/90 text-amber-300 border border-amber-500/40 shrink-0">
                        ★ GOD
                      </span>
                      {equipped ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500 text-slate-950">
                          EQUIPPED
                        </span>
                      ) : unlocked ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          OWNED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-amber-400 border border-amber-500/40 whitespace-nowrap">
                          🪙 {wep.price}{wep.diamondCost ? ` · 💎 ${wep.diamondCost}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getWeaponIcon(wId)}</span>
                      <div className="font-bold text-xs tracking-wide text-white leading-tight">
                        {wep.name}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-2 font-mono leading-relaxed mb-2">
                      {wep.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono">
                      <span className="text-slate-400">DMG: <strong className="text-white">{wep.damage}</strong></span>
                      <span className="text-slate-400">{wep.fireRate}/s</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Monster-Tier Weapons */}
            <div className="flex items-center gap-2 pt-4 pb-1">
              <Flame className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black uppercase tracking-widest text-purple-300 font-mono">
                MONSTER-TIER ARMAMENTS (HEAVY DESTRUCTION)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {WEAPON_ORDER.filter((wId) => WEAPONS[wId].tier === 'monster' && !isWeaponDiamondExclusive(wId)).map((wId) => {
                const wep = WEAPONS[wId];
                const unlocked = unlockedWeapons[wId];
                const equipped = activeWeapon === wId;
                const isSelected = selectedWeaponId === wId;

                return (
                  <div
                    key={wId}
                    data-testid={`weapon-card-${wId}`}
                    onClick={() => setSelectedWeaponId(wId)}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-2 shadow-[0_0_20px_rgba(176,38,255,0.4)]'
                        : 'bg-slate-950/80 border-purple-500/30 hover:border-purple-400'
                    }`}
                    style={isSelected ? { borderColor: wep.color } : {}}
                  >
                    <div className="flex justify-between items-start gap-1 mb-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-purple-950/80 text-purple-300 border border-purple-500/40 shrink-0">
                        MONSTER
                      </span>
                      {equipped ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500 text-slate-950">
                          EQUIPPED
                        </span>
                      ) : unlocked ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          OWNED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-amber-400 border border-amber-500/40 whitespace-nowrap">
                          🪙 {wep.price}{wep.diamondCost ? ` · 💎 ${wep.diamondCost}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getWeaponIcon(wId)}</span>
                      <div className="font-bold text-sm tracking-wide text-white leading-tight">
                        {wep.name}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-2 font-mono leading-relaxed mb-2">
                      {wep.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono">
                      <span className="text-slate-400">DMG: <strong className="text-white">{wep.damage}</strong></span>
                      <span className="text-slate-400">RATE: <strong className="text-white">{wep.fireRate}/s</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tactical Ballistic Arsenal */}
            <div className="flex items-center gap-2 pt-4 pb-1">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-black uppercase tracking-widest text-cyan-300 font-mono">
                TACTICAL BALLISTIC ARSENAL (VERSATILE MULTI-ROLE)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {WEAPON_ORDER.filter(
                (wId) => (WEAPONS[wId].tier === 'starter' || WEAPONS[wId].tier === 'advanced') && !isWeaponDiamondExclusive(wId)
              ).map((wId) => {
                const wep = WEAPONS[wId];
                const unlocked = unlockedWeapons[wId];
                const equipped = activeWeapon === wId;
                const isSelected = selectedWeaponId === wId;

                return (
                  <div
                    key={wId}
                    data-testid={`weapon-card-${wId}`}
                    onClick={() => setSelectedWeaponId(wId)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-2 shadow-[0_0_15px_rgba(0,243,255,0.4)]'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-600'
                    }`}
                    style={isSelected ? { borderColor: wep.color } : {}}
                  >
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <span className="text-[9px] text-slate-400 uppercase font-mono">
                        [{wep.keyLabel}] {wep.tier === 'starter' ? 'CORE' : 'TACTICAL'}
                      </span>
                      {equipped ? (
                        <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-cyan-500 text-slate-950">
                          EQUIPPED
                        </span>
                      ) : unlocked ? (
                        <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-300">
                          OWNED
                        </span>
                      ) : (
                        <span className="px-1 py-0.5 rounded text-[8px] font-bold text-amber-400 whitespace-nowrap">
                          🪙 {wep.price}{wep.diamondCost ? ` · 💎 ${wep.diamondCost}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-xs tracking-wide text-white mb-1">
                      {getWeaponIcon(wId)} {wep.name}
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                      <span>DMG {wep.damage}</span>
                      <span>{wep.fireRate}/s</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Weapon Inspector Panel */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  WEAPON TELEMETRY
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                  style={{
                    backgroundColor: `${selectedWeapon.color}22`,
                    color: selectedWeapon.color,
                    border: `1px solid ${selectedWeapon.color}66`,
                  }}
                >
                  KEY [{selectedWeapon.keyLabel}] · {selectedWeapon.tier}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-inner border"
                  style={{
                    backgroundColor: `${selectedWeapon.color}15`,
                    borderColor: `${selectedWeapon.color}44`,
                  }}
                >
                  {getWeaponIcon(selectedWeapon.id)}
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-wide">{selectedWeapon.name}</h2>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">
                    COST:{' '}
                    {isWeaponVaultOnly ? (
                      <strong className="text-cyan-300">💎 {weaponDiamondCost} DIAMONDS</strong>
                    ) : selectedWeapon.price === 0 ? (
                      <strong className="text-emerald-400">FREE STARTER</strong>
                    ) : (
                      <span>
                        <strong className="text-amber-400">🪙 {selectedWeapon.price} COINS</strong>
                        {weaponDiamondCost > 0 && (
                          <>
                            {' '}
                            <span className="text-slate-500">OR</span>{' '}
                            <strong className="text-cyan-300">💎 {weaponDiamondCost}</strong>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {selectedWeapon.description}
              </p>

              <div className="mt-5 space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>BASE DAMAGE PER HIT</span>
                    <span className="text-white font-bold">{selectedWeapon.damage} HP</span>
                  </div>
                  <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded"
                      style={{ width: `${Math.min(100, (selectedWeapon.damage / 320) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>FIRE RATE</span>
                    <span className="text-white font-bold">{selectedWeapon.fireRate} / SEC</span>
                  </div>
                  <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded"
                      style={{ width: `${Math.min(100, (selectedWeapon.fireRate / 14) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>MAX RANGE</span>
                    <span className="text-white font-bold">{selectedWeapon.range} PX</span>
                  </div>
                  <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded"
                      style={{ width: `${Math.min(100, (selectedWeapon.range / 1800) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Weapon Mastery */}
                <div
                  data-testid="store-weapon-mastery"
                  className="p-3 rounded-lg bg-slate-900/80 border border-amber-500/35"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="flex items-center gap-1.5 font-bold text-amber-300">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      MASTERY LVL {selectedMastery.level} · {selectedMastery.title}
                    </span>
                    <span className="text-slate-400">
                      {selectedMastery.nextXp !== null
                        ? `${selectedMastery.xp}/${selectedMastery.nextXp} XP`
                        : `${selectedMastery.xp} XP (MAX)`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden mb-2">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${selectedMastery.progressPercent}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {selectedMasteryPerks.length > 0 ? (
                      <span className="text-emerald-300 font-bold">
                        ACTIVE BUFFS: {selectedMasteryPerks.join(' · ')}
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Fire &amp; defeat enemies with this weapon to unlock -Heat &amp; +Crit buffs (Next: 25 XP).
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-2">
              {isWeaponEquipped ? (
                <div className="w-full py-3 bg-cyan-500/20 border border-cyan-400/60 rounded-lg text-center text-xs font-bold text-cyan-300 tracking-wider flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  ACTIVE WEAPON EQUIPPED
                </div>
              ) : isWeaponUnlocked ? (
                <button
                  onClick={() => handleEquipWeaponClick(selectedWeaponId)}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                >
                  EQUIP TO CHASSIS
                </button>
              ) : isWeaponVaultOnly ? (
                <button
                  onClick={() => setActiveTab('diamond_vault')}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400 text-cyan-200 font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Gem className="w-4 h-4 text-cyan-300" />
                  <span>UNLOCK IN DIAMOND VAULT (💎 {weaponDiamondCost})</span>
                </button>
              ) : (
                <>
                  <button
                    data-testid={`buy-weapon-coins-${selectedWeaponId}`}
                    onClick={() => handleBuyWeaponClick(selectedWeaponId)}
                    disabled={!canAffordWeapon}
                    className={`w-full py-3 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                      canAffordWeapon
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_20px_rgba(255,180,0,0.4)] cursor-pointer'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    {canAffordWeapon ? (
                      <span>🪙 BUY FOR {selectedWeapon.price} COINS</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>NEED {selectedWeapon.price - coins} MORE COINS</span>
                      </>
                    )}
                  </button>

                  {weaponDiamondCost > 0 && (
                    <button
                      data-testid={`buy-weapon-diamonds-${selectedWeaponId}`}
                      onClick={() =>
                        handleDiamondBuy('weapon', selectedWeaponId, weaponDiamondCost, selectedWeapon.name)
                      }
                      disabled={!canAffordWeaponDiamonds}
                      className={`w-full py-2.5 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                        canAffordWeaponDiamonds
                          ? 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 shadow-[0_0_16px_rgba(0,243,255,0.35)] cursor-pointer'
                          : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <Gem className="w-3.5 h-3.5" />
                      <span>
                        {canAffordWeaponDiamonds
                          ? `BUY FOR ${weaponDiamondCost} 💎 DIAMONDS`
                          : `NEED ${weaponDiamondCost} 💎 DIAMONDS`}
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DEPARTMENT 2: FLYING CRAFTS HANGAR                       */}
      {/* ======================================================== */}
      {activeTab === 'crafts' && (
        <div className="w-full max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-black uppercase tracking-widest text-amber-300 font-mono flex items-center gap-2">
                <Rocket className="w-4 h-4 text-amber-400" />
                TACTICAL COMBAT AIRFRAMES · SPEED &amp; DEFENSE SPECIALIZATION
              </span>
              <span className="text-xs text-slate-400 font-mono font-mono-numbers">
                {coinCraftIds.filter((cId) => unlockedCrafts[cId]).length}/{coinCraftIds.length} UNLOCKED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {coinCraftIds.map((cId) => {
                const craft = getCraftDef(cId);
                const unlocked = unlockedCrafts[cId];
                const isEquipped = activeCraft === cId;
                const isSelected = selectedCraftId === cId;

                return (
                  <div
                    key={cId}
                    onClick={() => setSelectedCraftId(cId)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-2 shadow-[0_0_25px_rgba(0,243,255,0.35)]'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                    style={isSelected ? { borderColor: craft.primaryColor } : {}}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase font-mono"
                        style={{
                          backgroundColor: `${craft.primaryColor}22`,
                          color: craft.primaryColor,
                          border: `1px solid ${craft.primaryColor}55`,
                        }}
                      >
                        {craft.role}
                      </span>

                      {isEquipped ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-400 text-slate-950 shadow-md">
                          PILOTING
                        </span>
                      ) : unlocked ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          READY
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-amber-400 border border-amber-500/40 font-mono-numbers">
                          🪙 {craft.price}{craft.diamondCost ? ` · 💎 ${craft.diamondCost}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="my-2 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl border"
                        style={{
                          backgroundColor: `${craft.primaryColor}15`,
                          borderColor: `${craft.primaryColor}44`,
                        }}
                      >
                        {getCraftIcon(cId)}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5 flex-wrap">
                          <span>{craft.name}</span>
                          {isNeonSkinUnlocked(cId, eventState) && (
                            <span className="text-[10px] font-mono font-black text-cyan-300">⚡ NEON</span>
                          )}
                        </h3>
                        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                          {craft.model}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-mono line-clamp-2 leading-relaxed mb-3">
                      {craft.description}
                    </p>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800 text-[10px] font-mono">
                      <div className="bg-slate-900 p-1.5 rounded text-center">
                        <span className="text-slate-400 block text-[9px]">SPEED</span>
                        <span className="font-bold text-cyan-300">
                          {Math.round((craft.speedMultiplier - 1) * 100) >= 0 ? '+' : ''}
                          {Math.round((craft.speedMultiplier - 1) * 100)}%
                        </span>
                      </div>
                      <div className="bg-slate-900 p-1.5 rounded text-center">
                        <span className="text-slate-400 block text-[9px]">SHIELD</span>
                        <span className="font-bold text-emerald-300">+{craft.shieldBonus}</span>
                      </div>
                      <div className="bg-slate-900 p-1.5 rounded text-center">
                        <span className="text-slate-400 block text-[9px]">DAMAGE</span>
                        <span className="font-bold text-amber-300">
                          {Math.round((craft.damageMultiplier - 1) * 100) >= 0 ? '+' : ''}
                          {Math.round((craft.damageMultiplier - 1) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Craft Inspector Panel */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  HANGAR SCHEMATICS
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                  style={{
                    backgroundColor: `${selectedCraft.primaryColor}22`,
                    color: selectedCraft.primaryColor,
                    border: `1px solid ${selectedCraft.primaryColor}66`,
                  }}
                >
                  {selectedCraft.tier}
                </span>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center relative overflow-hidden">
                <div className="flex justify-center mb-2">
                  <CraftNeonPreviewSvg
                    craftId={selectedCraftId}
                    isNeon={selectedCraftSkin === 'neon'}
                    size={90}
                  />
                </div>
                <h2 className="text-lg font-black text-white tracking-wide">{selectedCraft.name}</h2>
                <div className="text-xs font-mono text-cyan-400">
                  {selectedCraftSkin === 'neon'
                    ? NEON_CRAFT_SKINS[selectedCraftId].name
                    : selectedCraft.model}
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1">
                  PRICE:{' '}
                  {isCraftVaultOnly ? (
                    <strong className="text-cyan-300">💎 {craftDiamondCost} DIAMONDS</strong>
                  ) : selectedCraft.price === 0 ? (
                    <strong className="text-emerald-400">FREE STANDARD</strong>
                  ) : (
                    <strong className="text-amber-400">
                      🪙 {selectedCraft.price} COINS
                      {craftDiamondCost > 0 && (
                        <span className="text-cyan-300"> · 💎 {craftDiamondCost}</span>
                      )}
                    </strong>
                  )}
                </div>

                {/* Standard vs Exclusive Neon Skin Switcher */}
                <div
                  data-testid="hangar-skin-selector"
                  className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>AIRFRAME SKIN</span>
                    <span className={isSelectedNeonUnlocked ? 'text-cyan-300 font-bold' : 'text-slate-500'}>
                      {isSelectedNeonUnlocked ? 'Neon Unlocked' : 'Earn via 48h Global Event'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleCraftSkin(selectedCraftId, 'default')}
                      className={`py-1.5 px-2 rounded text-[11px] font-bold uppercase cursor-pointer transition-colors ${
                        selectedCraftSkin === 'default'
                          ? 'bg-slate-700 text-white border border-slate-500'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      type="button"
                      data-testid="hangar-neon-skin-btn"
                      onClick={() => handleToggleCraftSkin(selectedCraftId, 'neon')}
                      disabled={!isSelectedNeonUnlocked}
                      className={`py-1.5 px-2 rounded text-[11px] font-bold uppercase flex items-center justify-center gap-1 transition-colors ${
                        selectedCraftSkin === 'neon'
                          ? 'bg-cyan-400 text-slate-950 cursor-pointer'
                          : isSelectedNeonUnlocked
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 hover:bg-cyan-500/30 cursor-pointer'
                          : 'bg-slate-950 text-slate-500 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      {!isSelectedNeonUnlocked && <Lock className="w-3 h-3" />}
                      <span>⚡ Neon</span>
                    </button>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {selectedCraft.description}
              </p>

              <div className="mt-5 space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span className="flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-cyan-400" />
                      VELOCITY MODIFIER
                    </span>
                    <span className="text-white font-bold">{selectedCraft.speedMultiplier}x</span>
                  </div>
                  <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded"
                      style={{ width: `${Math.min(100, (selectedCraft.speedMultiplier / 1.5) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      SHIELD BONUS
                    </span>
                    <span className="text-white font-bold">+{selectedCraft.shieldBonus} SHIELD</span>
                  </div>
                  <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded"
                      style={{ width: `${Math.min(100, (selectedCraft.shieldBonus / 300) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span className="flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                      DAMAGE AMPLIFIER
                    </span>
                    <span className="text-white font-bold">{selectedCraft.damageMultiplier}x</span>
                  </div>
                  <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded"
                      style={{ width: `${Math.min(100, (selectedCraft.damageMultiplier / 1.6) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span className="flex items-center gap-1.5">
                      <Magnet className="w-3.5 h-3.5 text-purple-400" />
                      MAGNET HARVEST RADIUS
                    </span>
                    <span className="text-white font-bold">+{selectedCraft.magnetRadiusBonus} PX</span>
                  </div>
                  <div className="w-full h-2 rounded bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded"
                      style={{ width: `${Math.min(100, (selectedCraft.magnetRadiusBonus / 200) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-2">
              {isCraftEquipped ? (
                <div className="w-full py-3 bg-cyan-500/20 border border-cyan-400/60 rounded-lg text-center text-xs font-bold text-cyan-300 tracking-wider flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  ACTIVE FLYING CRAFT PILOTED
                </div>
              ) : isCraftUnlocked ? (
                <button
                  onClick={() => handleEquipCraftClick(selectedCraftId)}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-[0_0_15px_rgba(0,243,255,0.4)]"
                >
                  PILOT THIS AIRFRAME
                </button>
              ) : isCraftVaultOnly ? (
                <button
                  onClick={() => setActiveTab('diamond_vault')}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-cyan-400 text-cyan-200 font-bold text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Gem className="w-4 h-4 text-cyan-300" />
                  <span>UNLOCK IN DIAMOND VAULT (💎 {craftDiamondCost})</span>
                </button>
              ) : (
                <>
                  <button
                    data-testid={`buy-craft-coins-${selectedCraftId}`}
                    onClick={() => handleBuyCraftClick(selectedCraftId)}
                    disabled={!canAffordCraft}
                    className={`w-full py-3 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                      canAffordCraft
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_20px_rgba(255,180,0,0.4)] cursor-pointer'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    {canAffordCraft ? (
                      <span>🪙 PURCHASE AIRFRAME FOR {selectedCraft.price} COINS</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>NEED {selectedCraft.price - coins} MORE COINS</span>
                      </>
                    )}
                  </button>

                  {craftDiamondCost > 0 && (
                    <button
                      data-testid={`buy-craft-diamonds-${selectedCraftId}`}
                      onClick={() =>
                        handleDiamondBuy('craft', selectedCraftId, craftDiamondCost, selectedCraft.name)
                      }
                      disabled={!canAffordCraftDiamonds}
                      className={`w-full py-2.5 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                        canAffordCraftDiamonds
                          ? 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 shadow-[0_0_16px_rgba(0,243,255,0.35)] cursor-pointer'
                          : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <Gem className="w-3.5 h-3.5" />
                      <span>
                        {canAffordCraftDiamonds
                          ? `BUY FOR ${craftDiamondCost} 💎 DIAMONDS`
                          : `NEED ${craftDiamondCost} 💎 DIAMONDS`}
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DEPARTMENT 3: AUTONOMOUS COMPANION DRONES                */}
      {/* ======================================================== */}
      {activeTab === 'companions' && (
        <div className="w-full max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-300 font-mono flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                AUTONOMOUS WINGMAN DRONES · ORBIT, TARGET &amp; SUPPORT YOU LIVE IN COMBAT
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {unlockedCompanionCount}/{COMPANION_ORDER.length} OWNED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COMPANION_ORDER.map((id) => {
                const drone = COMPANION_DRONES[id];
                const unlocked = storeGear.unlockedCompanions[id];
                const equipped = storeGear.activeCompanion === id;
                const isSelected = selectedCompanionId === id;

                return (
                  <div
                    key={id}
                    data-testid={`companion-card-${id}`}
                    onClick={() => setSelectedCompanionId(id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-2 shadow-[0_0_22px_rgba(16,185,129,0.3)]'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                    style={isSelected ? { borderColor: drone.color } : {}}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider font-mono"
                        style={{
                          backgroundColor: `${drone.color}22`,
                          color: drone.color,
                          border: `1px solid ${drone.color}55`,
                        }}
                      >
                        {drone.role}
                      </span>
                      {equipped ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-400 text-slate-950">
                          ACTIVE ESCORT
                        </span>
                      ) : unlocked ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          OWNED
                        </span>
                      ) : isCompanionDiamondExclusive(id) ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                          💎 {drone.diamondCost}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-amber-400 border border-amber-500/40 font-mono-numbers">
                          🪙 {drone.price}{drone.diamondCost ? ` · 💎 ${drone.diamondCost}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 my-2">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shrink-0"
                        style={{
                          backgroundColor: `${drone.color}18`,
                          borderColor: `${drone.color}44`,
                        }}
                      >
                        {drone.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{drone.name}</h3>
                        <p className="text-[11px] font-mono text-emerald-300 mt-0.5">{drone.perkSummary}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-mono leading-relaxed line-clamp-2">
                      {drone.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Companion Inspector */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  DRONE TELEMETRY
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase"
                  style={{
                    backgroundColor: `${selectedCompanion.color}22`,
                    color: selectedCompanion.color,
                    border: `1px solid ${selectedCompanion.color}55`,
                  }}
                >
                  {selectedCompanion.tier}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl border"
                  style={{
                    backgroundColor: `${selectedCompanion.color}18`,
                    borderColor: `${selectedCompanion.color}44`,
                  }}
                >
                  {selectedCompanion.icon}
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">{selectedCompanion.name}</h2>
                  <div className="text-xs font-mono text-slate-400">
                    {isCompanionVaultOnly ? (
                      <strong className="text-cyan-300">💎 {companionDiamondCost} DIAMONDS</strong>
                    ) : (
                      <strong className="text-amber-400">
                        🪙 {selectedCompanion.price} COINS
                        {companionDiamondCost > 0 && (
                          <span className="text-cyan-300"> · 💎 {companionDiamondCost}</span>
                        )}
                      </strong>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {selectedCompanion.description}
              </p>

              <div className="mt-4 space-y-2.5 font-mono text-xs bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">TURRET DAMAGE</span>
                  <span className="text-white font-bold">{selectedCompanion.boltDamage} DMG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">FIRE CADENCE</span>
                  <span className="text-cyan-300 font-bold">Every {selectedCompanion.fireIntervalSec}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SHOT PIERCE</span>
                  <span className="text-amber-300 font-bold">{selectedCompanion.pierce}x</span>
                </div>
                {selectedCompanion.shieldPerCycle && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">SHIELD SUPPORT</span>
                    <span className="text-emerald-300 font-bold">
                      +{selectedCompanion.shieldPerCycle} / {selectedCompanion.shieldCycleSec}s
                    </span>
                  </div>
                )}
                {selectedCompanion.magnetBonusPx && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">MAGNET BOOST</span>
                    <span className="text-amber-300 font-bold">+{selectedCompanion.magnetBonusPx} PX</span>
                  </div>
                )}
                {selectedCompanion.cryoSlowSec && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">CRYO SLOW</span>
                    <span className="text-cyan-300 font-bold">{selectedCompanion.cryoSlowSec}s Chill</span>
                  </div>
                )}
                {selectedCompanion.explosionRadius && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">BLAST RADIUS</span>
                    <span className="text-orange-400 font-bold">{selectedCompanion.explosionRadius} PX</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-2">
              {isCompanionEquipped ? (
                <>
                  <div className="w-full py-2.5 bg-emerald-500/20 border border-emerald-400/60 rounded-lg text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    ACTIVE WINGMAN DEPLOYED
                  </div>
                  <button
                    onClick={() => handleEquipCompanionClick(null)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold uppercase rounded-lg cursor-pointer"
                  >
                    UNEQUIP DRONE
                  </button>
                </>
              ) : isCompanionUnlocked ? (
                <button
                  onClick={() => handleEquipCompanionClick(selectedCompanionId)}
                  className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  DEPLOY THIS DRONE
                </button>
              ) : isCompanionVaultOnly ? (
                <button
                  onClick={() => setActiveTab('diamond_vault')}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400 text-cyan-200 font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Gem className="w-4 h-4 text-cyan-300" />
                  <span>UNLOCK IN DIAMOND VAULT (💎 {companionDiamondCost})</span>
                </button>
              ) : (
                <>
                  <button
                    data-testid={`buy-companion-${selectedCompanionId}`}
                    onClick={() => handleBuyCompanionClick(selectedCompanionId)}
                    disabled={!canAffordCompanion}
                    className={`w-full py-3 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                      canAffordCompanion
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_20px_rgba(255,180,0,0.4)] cursor-pointer'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    {canAffordCompanion ? (
                      <span>🪙 BUY DRONE FOR {selectedCompanion.price} COINS</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>NEED {selectedCompanion.price - coins} MORE COINS</span>
                      </>
                    )}
                  </button>

                  {companionDiamondCost > 0 && (
                    <button
                      data-testid={`buy-companion-diamonds-${selectedCompanionId}`}
                      onClick={() => handleBuyCompanionWithDiamondsClick(selectedCompanionId)}
                      disabled={!canAffordCompanionDiamonds}
                      className={`w-full py-2.5 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                        canAffordCompanionDiamonds
                          ? 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 shadow-[0_0_16px_rgba(0,243,255,0.35)] cursor-pointer'
                          : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <Gem className="w-3.5 h-3.5" />
                      <span>
                        {canAffordCompanionDiamonds
                          ? `BUY FOR ${companionDiamondCost} 💎 DIAMONDS`
                          : `NEED ${companionDiamondCost} 💎 DIAMONDS`}
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DEPARTMENT 4: THRUSTER TRAILS & FLIGHT FX                */}
      {/* ======================================================== */}
      {activeTab === 'trails' && (
        <div className="w-full max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-black uppercase tracking-widest text-pink-300 font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                NEON THRUSTER WAKES · VISUAL JET RIBBONS + FLIGHT PERFORMANCE TUNING
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {unlockedTrailCount}/{TRAIL_ORDER.length} OWNED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TRAIL_ORDER.map((id) => {
                const trail = THRUSTER_TRAILS[id];
                const unlocked = storeGear.unlockedTrails[id];
                const equipped = storeGear.activeTrail === id;
                const isSelected = selectedTrailId === id;
                const gradient = `linear-gradient(90deg, ${trail.colors.join(', ')})`;

                return (
                  <div
                    key={id}
                    data-testid={`trail-card-${id}`}
                    onClick={() => setSelectedTrailId(id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-2 border-pink-400 shadow-[0_0_22px_rgba(236,72,153,0.3)]'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400">{trail.subtitle}</span>
                      {equipped ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-pink-400 text-slate-950">
                          EQUIPPED
                        </span>
                      ) : unlocked ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          OWNED
                        </span>
                      ) : isTrailDiamondExclusive(id) ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                          💎 {trail.diamondCost}
                        </span>
                      ) : trail.price === 0 ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-emerald-300 border border-emerald-500/40">
                          FREE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-900 text-amber-400 border border-amber-500/40 font-mono-numbers">
                          🪙 {trail.price}{trail.diamondCost ? ` · 💎 ${trail.diamondCost}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xl">
                        {trail.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{trail.name}</h3>
                        <div className="text-[11px] font-mono text-pink-300">{trail.perkSummary}</div>
                      </div>
                    </div>

                    {/* Visual Jet Spectrum Bar */}
                    <div
                      className="w-full h-3 rounded-full my-2 shadow-inner"
                      style={{ background: gradient, boxShadow: `0 0 12px ${trail.colors[0]}55` }}
                    />

                    <p className="text-xs text-slate-300 font-mono leading-relaxed line-clamp-2">
                      {trail.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Trail Inspector */}
          <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-xl">
            <div>
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  EXHAUST SPECTRUM INSPECTOR
                </span>
                <span className="text-sm">{selectedTrail.icon}</span>
              </div>

              <h2 className="mt-4 text-lg font-black text-white">{selectedTrail.name}</h2>
              <div className="text-xs font-mono text-slate-400 mt-0.5">{selectedTrail.subtitle}</div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                {isTrailVaultOnly ? (
                  <strong className="text-cyan-300">💎 {trailDiamondCost} DIAMONDS</strong>
                ) : selectedTrail.price === 0 ? (
                  <strong className="text-emerald-400">FREE STANDARD</strong>
                ) : (
                  <strong className="text-amber-400">
                    🪙 {selectedTrail.price} COINS
                    {trailDiamondCost > 0 && (
                      <span className="text-cyan-300"> · 💎 {trailDiamondCost}</span>
                    )}
                  </strong>
                )}
              </div>

              <div
                className="w-full h-6 rounded-xl my-4 border border-white/15"
                style={{
                  background: `linear-gradient(90deg, ${selectedTrail.colors.join(', ')})`,
                  boxShadow: `0 0 20px ${selectedTrail.colors[0]}66`,
                }}
              />

              <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {selectedTrail.description}
              </p>

              <div className="mt-4 space-y-2 font-mono text-xs bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">FLIGHT SPEED</span>
                  <span className="text-cyan-300 font-bold">
                    {selectedTrail.speedBonus > 0 ? `+${Math.round(selectedTrail.speedBonus * 100)}%` : 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">BARREL COOLING</span>
                  <span className="text-amber-300 font-bold">
                    {selectedTrail.coolingBonus > 0 ? `+${Math.round(selectedTrail.coolingBonus * 100)}%` : 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">LOOT MAGNET</span>
                  <span className="text-emerald-300 font-bold">
                    {selectedTrail.magnetBonusPx > 0 ? `+${selectedTrail.magnetBonusPx} PX` : 'Standard'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">DASH COOLDOWN</span>
                  <span className="text-purple-300 font-bold">
                    {selectedTrail.dashCdReduction > 0
                      ? `-${Math.round(selectedTrail.dashCdReduction * 100)}%`
                      : 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-2">
              {isTrailEquipped ? (
                <div className="w-full py-3 bg-pink-500/20 border border-pink-400/60 rounded-lg text-center text-xs font-bold text-pink-200 flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  ACTIVE THRUSTER TRAIL
                </div>
              ) : isTrailUnlocked ? (
                <button
                  onClick={() => handleEquipTrailClick(selectedTrailId)}
                  className="w-full py-3 bg-pink-400 hover:bg-pink-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                >
                  EQUIP THRUSTER TRAIL
                </button>
              ) : isTrailVaultOnly ? (
                <button
                  onClick={() => setActiveTab('diamond_vault')}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400 text-cyan-200 font-bold text-xs uppercase tracking-wider rounded-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Gem className="w-4 h-4 text-cyan-300" />
                  <span>UNLOCK IN DIAMOND VAULT (💎 {trailDiamondCost})</span>
                </button>
              ) : (
                <>
                  <button
                    data-testid={`buy-trail-${selectedTrailId}`}
                    onClick={() => handleBuyTrailClick(selectedTrailId)}
                    disabled={!canAffordTrail}
                    className={`w-full py-3 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                      canAffordTrail
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_20px_rgba(255,180,0,0.4)] cursor-pointer'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    {canAffordTrail ? (
                      <span>🪙 BUY TRAIL FOR {selectedTrail.price} COINS</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>NEED {selectedTrail.price - coins} MORE COINS</span>
                      </>
                    )}
                  </button>

                  {trailDiamondCost > 0 && (
                    <button
                      data-testid={`buy-trail-diamonds-${selectedTrailId}`}
                      onClick={() => handleBuyTrailWithDiamondsClick(selectedTrailId)}
                      disabled={!canAffordTrailDiamonds}
                      className={`w-full py-2.5 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 ${
                        canAffordTrailDiamonds
                          ? 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 shadow-[0_0_16px_rgba(0,243,255,0.35)] cursor-pointer'
                          : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <Gem className="w-3.5 h-3.5" />
                      <span>
                        {canAffordTrailDiamonds
                          ? `BUY FOR ${trailDiamondCost} 💎 DIAMONDS`
                          : `NEED ${trailDiamondCost} 💎 DIAMONDS`}
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DEPARTMENT 5: TECH, MODULES, BOOSTERS & BUNDLES          */}
      {/* ======================================================== */}
      {activeTab === 'tech_boosts' && (
        <div className="w-full max-w-6xl mx-auto mt-6 flex flex-col gap-8 pb-12">
          {/* Section A: Armory Value Bundles */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-amber-300 font-mono flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                FEATURED ARMORY VALUE BUNDLES (DISCOUNTED GEAR PACKS)
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STORE_BUNDLES.map((bundle) => {
                const claimed = Boolean(storeGear.purchasedBundles[bundle.id]);
                const hasCoinOption = Boolean(bundle.priceCoins && bundle.priceCoins > 0);
                const hasDiamondOption = Boolean(bundle.priceDiamonds && bundle.priceDiamonds > 0);
                const affordableCoins = hasCoinOption && coins >= (bundle.priceCoins ?? 0);
                const affordableDiamonds = hasDiamondOption && diamonds >= (bundle.priceDiamonds ?? 0);

                return (
                  <div
                    key={bundle.id}
                    data-testid={`store-bundle-${bundle.id}`}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-400/60 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                          style={{
                            backgroundColor: `${bundle.color}22`,
                            color: bundle.color,
                            border: `1px solid ${bundle.color}55`,
                          }}
                        >
                          {bundle.badge}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 line-through">
                          {bundle.originalValueLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-2xl">{bundle.icon}</span>
                        <div>
                          <h3 className="font-black text-sm text-white">{bundle.name}</h3>
                          <p className="text-[11px] font-mono text-slate-400">{bundle.tagline}</p>
                        </div>
                      </div>

                      <ul className="mt-3 space-y-1.5 text-[11px] font-mono text-slate-200 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        {bundle.highlights.map((hl, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{hl}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      {claimed ? (
                        <div className="w-full py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" />
                          BUNDLE CLAIMED
                        </div>
                      ) : hasCoinOption ? (
                        <>
                          <button
                            data-testid={`buy-bundle-${bundle.id}`}
                            onClick={() => handleBuyBundleClick(bundle.id, 'coins')}
                            disabled={!affordableCoins}
                            className={`w-full py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all ${
                              affordableCoins
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                            }`}
                          >
                            🪙 BUY PACK FOR {bundle.priceCoins} COINS
                          </button>

                          {hasDiamondOption && (
                            <button
                              data-testid={`buy-bundle-diamonds-${bundle.id}`}
                              onClick={() => handleBuyBundleClick(bundle.id, 'diamonds')}
                              disabled={!affordableDiamonds}
                              className={`w-full py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                                affordableDiamonds
                                  ? 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 cursor-pointer'
                                  : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                              }`}
                            >
                              <Gem className="w-3.5 h-3.5" />
                              <span>BUY FOR {bundle.priceDiamonds} 💎 DIAMONDS</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          data-testid={`buy-bundle-${bundle.id}`}
                          onClick={() => handleBuyBundleClick(bundle.id, 'diamonds')}
                          disabled={!affordableDiamonds}
                          className={`w-full py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all ${
                            affordableDiamonds
                              ? 'bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 cursor-pointer'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          💎 CLAIM FOR {bundle.priceDiamonds} DIAMONDS
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section B: Permanent Ship Modules */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-indigo-300 font-mono flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                PERMANENT CYBER MODULES (STACK ON EVERY RUN FOREVER)
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MODULE_ORDER.map((mId) => {
                const mod = PERMANENT_MODULES[mId];
                const unlocked = storeGear.unlockedModules[mId];
                const affordableCoins = coins >= mod.price;
                const affordableDiamonds = diamonds >= mod.diamondCost;

                return (
                  <div
                    key={mId}
                    data-testid={`module-card-${mId}`}
                    className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-mono uppercase text-indigo-300">{mod.category}</span>
                        <span className="text-xl">{mod.icon}</span>
                      </div>
                      <h3 className="font-bold text-sm text-white">{mod.name}</h3>
                      <div className="text-[11px] font-mono font-bold text-cyan-300 mt-1">{mod.statLabel}</div>
                      <p className="text-[11px] font-mono text-slate-400 mt-2 leading-relaxed">{mod.description}</p>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      {unlocked ? (
                        <div className="w-full py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[11px] font-bold text-center flex items-center justify-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          PERMANENTLY ACTIVE
                        </div>
                      ) : (
                        <>
                          <button
                            data-testid={`buy-module-${mId}`}
                            onClick={() => handleBuyModuleClick(mId)}
                            disabled={!affordableCoins}
                            className={`w-full py-2 rounded-lg font-bold text-xs uppercase ${
                              affordableCoins
                                ? 'bg-indigo-500 hover:bg-indigo-400 text-white cursor-pointer'
                                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                            }`}
                          >
                            {affordableCoins ? `🪙 INSTALL (${mod.price} COINS)` : `NEED ${mod.price - coins} COINS`}
                          </button>

                          <button
                            data-testid={`buy-module-diamonds-${mId}`}
                            onClick={() => handleBuyModuleWithDiamondsClick(mId)}
                            disabled={!affordableDiamonds}
                            className={`w-full py-2 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-1.5 ${
                              affordableDiamonds
                                ? 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 cursor-pointer'
                                : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                            }`}
                          >
                            <Gem className="w-3.5 h-3.5" />
                            <span>
                              {affordableDiamonds
                                ? `INSTALL (${mod.diamondCost} 💎 DIAMONDS)`
                                : `NEED ${mod.diamondCost} 💎`}
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section C: Pre-Run Tactical Boosters (Coin + Diamond Shop) */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-cyan-300 font-mono flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                SINGLE-RUN TACTICAL BOOSTERS (ARM NOW FOR YOUR NEXT BATTLE)
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {BOOSTER_ORDER.map((bId) => {
                const booster = PRE_RUN_BOOSTERS[bId];
                const price = BOOSTER_SHOP_PRICES[bId];
                const diamondPrice = BOOSTER_DIAMOND_PRICES[bId];
                const armed = armedBoosters.includes(bId);
                const affordableCoins = coins >= price;
                const affordableDiamonds = diamonds >= diamondPrice;

                return (
                  <div
                    key={bId}
                    data-testid={`booster-card-${bId}`}
                    className="p-4 rounded-xl bg-slate-950 border border-cyan-500/25 flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-11 h-11 rounded-lg flex items-center justify-center text-2xl shrink-0 border"
                        style={{
                          backgroundColor: `${booster.color}18`,
                          borderColor: `${booster.color}44`,
                        }}
                      >
                        {booster.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{booster.name}</h3>
                        <p className="text-[11px] font-mono text-slate-300 mt-0.5 leading-relaxed">
                          {booster.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      {armed ? (
                        <div className="w-full py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" />
                          ARMED FOR NEXT RUN
                        </div>
                      ) : (
                        <>
                          <button
                            data-testid={`buy-booster-${bId}`}
                            onClick={() => handleBuyBoosterClick(bId)}
                            disabled={!affordableCoins}
                            className={`w-full py-2 rounded-lg font-bold text-xs uppercase ${
                              affordableCoins
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                            }`}
                          >
                            🪙 ARM FOR {price} COINS
                          </button>

                          <button
                            data-testid={`buy-booster-diamonds-${bId}`}
                            onClick={() => handleBuyBoosterWithDiamondsClick(bId)}
                            disabled={!affordableDiamonds}
                            className={`w-full py-2 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-1.5 ${
                              affordableDiamonds
                                ? 'bg-gradient-to-r from-cyan-400 to-sky-500 hover:from-cyan-300 hover:to-sky-400 text-slate-950 cursor-pointer'
                                : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                            }`}
                          >
                            <Gem className="w-3.5 h-3.5" />
                            <span>💎 ARM FOR {diamondPrice} DIAMONDS</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* ======================================================== */}
      {/* DEPARTMENT 6: DIAMOND VAULT (11 EXCLUSIVE PROTOCOLS)     */}
      {/* ======================================================== */}
      {activeTab === 'diamond_vault' && (
        <div className="w-full max-w-6xl mx-auto mt-6 flex flex-col gap-6 pb-12">
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/70 via-slate-900/80 to-cyan-950/70 border border-cyan-400/40 shadow-[0_0_25px_rgba(0,243,255,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-400/60 text-2xl">💎</div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-wider text-white flex items-center gap-2 flex-wrap">
                  <span>CELESTIAL DIAMOND VAULT</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 border border-cyan-400 text-cyan-300">
                    16 EXCLUSIVE PROTOCOLS
                  </span>
                </h2>
                <p className="text-xs text-slate-300 font-mono mt-0.5 leading-relaxed">
                  Spend Cyber Diamonds earned from Daily Missions, Streaks &amp; Bosses on flagship airframes, Apex wingmen, starlight trails, god weapons, and permanent relics.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-cyan-500/30">
              <span className="text-xs font-mono text-slate-400">YOUR DIAMONDS:</span>
              <span className="text-xl font-black font-mono-numbers text-cyan-300">
                💎 {diamonds.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Zenith Emperor Omega Craft */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-amber-400/40 hover:border-amber-300 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/20 border-b border-l border-amber-400/50 text-[10px] font-mono font-bold text-amber-300 rounded-bl-xl">
                SUPREME AIRFRAME
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-3xl">
                    ⚜️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{CRAFTS.zenith_emperor.name}</h3>
                    <div className="text-xs font-mono text-amber-300">{CRAFTS.zenith_emperor.model}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  {CRAFTS.zenith_emperor.description}
                </p>
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] font-mono mb-4 text-center">
                  <div>
                    <span className="text-slate-400 block text-[9px]">SHIELD BONUS</span>
                    <span className="text-emerald-300 font-bold">+{CRAFTS.zenith_emperor.shieldBonus}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">SPEED</span>
                    <span className="text-cyan-300 font-bold">+32% Velocity</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">DAMAGE</span>
                    <span className="text-amber-300 font-bold">1.45x AMP</span>
                  </div>
                </div>
              </div>
              <div>
                {activeCraft === 'zenith_emperor' ? (
                  <div className="w-full py-3 bg-amber-500/20 border border-amber-400/60 rounded-xl text-center text-xs font-bold text-amber-300 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> ACTIVE AIRFRAME PILOTED
                  </div>
                ) : unlockedCrafts.zenith_emperor ? (
                  <button
                    onClick={() => handleEquipCraftClick('zenith_emperor')}
                    className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                  >
                    PILOT ZENITH EMPEROR
                  </button>
                ) : (
                  <button
                    onClick={() => handleDiamondBuy('craft', 'zenith_emperor', CRAFTS.zenith_emperor.diamondCost ?? 320, CRAFTS.zenith_emperor.name)}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= (CRAFTS.zenith_emperor.diamondCost ?? 320)
                        ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {CRAFTS.zenith_emperor.diamondCost ?? 320} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 2. Astral Valkyrie Craft */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 hover:border-cyan-400 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500/20 border-b border-l border-cyan-400/50 text-[10px] font-mono font-bold text-cyan-300 rounded-bl-xl">
                FLYING AIRFRAME
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-3xl">
                    👑
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Astral Valkyrie Mk-IX</h3>
                    <div className="text-xs font-mono text-cyan-400">CELESTIAL DIAMOND FLAGSHIP</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  Constructed with Sylhet highland diamond lattices. Unlocks 400 Max Shield, +35% Flight Speed, 0.90s Hyper-Dash (-40% CD), and +40% weapon damage amplification.
                </p>
              </div>
              <div>
                {activeCraft === 'astral_valkyrie' ? (
                  <div className="w-full py-3 bg-cyan-500/20 border border-cyan-400/60 rounded-xl text-center text-xs font-bold text-cyan-300 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> ACTIVE AIRFRAME PILOTED
                  </div>
                ) : unlockedCrafts.astral_valkyrie ? (
                  <button
                    onClick={() => handleEquipCraftClick('astral_valkyrie')}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                  >
                    PILOT ASTRAL VALKYRIE
                  </button>
                ) : (
                  <button
                    onClick={() => handleDiamondBuy('craft', 'astral_valkyrie', CRAFTS.astral_valkyrie.diamondCost ?? 240, 'Astral Valkyrie Mk-IX')}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= (CRAFTS.astral_valkyrie.diamondCost ?? 240)
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {CRAFTS.astral_valkyrie.diamondCost ?? 240} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 3. Archon Seraph Companion */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-fuchsia-500/30 hover:border-fuchsia-400 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-fuchsia-500/20 border-b border-l border-fuchsia-400/50 text-[10px] font-mono font-bold text-fuchsia-300 rounded-bl-xl">
                CELESTIAL WINGMAN
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/40 flex items-center justify-center text-3xl">
                    👼
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{COMPANION_DRONES.archon_seraph.name}</h3>
                    <div className="text-xs font-mono text-fuchsia-300">{COMPANION_DRONES.archon_seraph.perkSummary}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  {COMPANION_DRONES.archon_seraph.description}
                </p>
              </div>
              <div>
                {storeGear.activeCompanion === 'archon_seraph' ? (
                  <div className="w-full py-3 bg-fuchsia-500/20 border border-fuchsia-400/60 rounded-xl text-center text-xs font-bold text-fuchsia-200 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> ACTIVE WINGMAN DEPLOYED
                  </div>
                ) : storeGear.unlockedCompanions.archon_seraph ? (
                  <button
                    onClick={() => handleEquipCompanionClick('archon_seraph')}
                    className="w-full py-3 bg-fuchsia-400 hover:bg-fuchsia-300 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                  >
                    DEPLOY ARCHON SERAPH
                  </button>
                ) : (
                  <button
                    onClick={() => handleDiamondBuy('companion', 'archon_seraph', COMPANION_DRONES.archon_seraph.diamondCost ?? 225, COMPANION_DRONES.archon_seraph.name)}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= (COMPANION_DRONES.archon_seraph.diamondCost ?? 225)
                        ? 'bg-gradient-to-r from-fuchsia-400 to-cyan-400 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {COMPANION_DRONES.archon_seraph.diamondCost ?? 225} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 4. Imperial Starlight Trail */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-yellow-400/30 hover:border-yellow-300 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-yellow-500/20 border-b border-l border-yellow-400/50 text-[10px] font-mono font-bold text-yellow-200 rounded-bl-xl">
                CELESTIAL TRAIL FX
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-yellow-500/10 border border-yellow-400/40 flex items-center justify-center text-3xl">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{THRUSTER_TRAILS.trail_celestial_gold.name}</h3>
                    <div className="text-xs font-mono text-yellow-300">
                      {THRUSTER_TRAILS.trail_celestial_gold.perkSummary}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  {THRUSTER_TRAILS.trail_celestial_gold.description}
                </p>
              </div>
              <div>
                {storeGear.activeTrail === 'trail_celestial_gold' ? (
                  <div className="w-full py-3 bg-yellow-500/20 border border-yellow-400/60 rounded-xl text-center text-xs font-bold text-yellow-200 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> ACTIVE STARLIGHT TRAIL
                  </div>
                ) : storeGear.unlockedTrails.trail_celestial_gold ? (
                  <button
                    onClick={() => handleEquipTrailClick('trail_celestial_gold')}
                    className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                  >
                    EQUIP STARLIGHT TRAIL
                  </button>
                ) : (
                  <button
                    onClick={() => handleDiamondBuy('trail', 'trail_celestial_gold', THRUSTER_TRAILS.trail_celestial_gold.diamondCost ?? 135, THRUSTER_TRAILS.trail_celestial_gold.name)}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= (THRUSTER_TRAILS.trail_celestial_gold.diamondCost ?? 135)
                        ? 'bg-gradient-to-r from-yellow-300 to-amber-500 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {THRUSTER_TRAILS.trail_celestial_gold.diamondCost ?? 135} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 5. Hyperion Astral Cannon */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-purple-500/30 hover:border-purple-400 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-purple-500/20 border-b border-l border-purple-400/50 text-[10px] font-mono font-bold text-purple-300 rounded-bl-xl">
                GOD-TIER WEAPON
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-400/40 flex items-center justify-center text-3xl">
                    💎
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Hyperion Astral Cannon</h3>
                    <div className="text-xs font-mono text-purple-400">280 DMG · INFINITE PIERCE</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  Fires dual hyper-accelerated 280-damage tachyon beams with 100% infinite armor piercing and radiant diamond particle shock blooms.
                </p>
              </div>
              <div>
                {activeWeapon === 'hyperion_astral' ? (
                  <div className="w-full py-3 bg-purple-500/20 border border-purple-400/60 rounded-xl text-center text-xs font-bold text-purple-300 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> ACTIVE WEAPON EQUIPPED
                  </div>
                ) : unlockedWeapons.hyperion_astral ? (
                  <button
                    onClick={() => handleEquipWeaponClick('hyperion_astral')}
                    className="w-full py-3 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                  >
                    EQUIP HYPERION CANNON
                  </button>
                ) : (
                  <button
                    onClick={() => handleDiamondBuy('weapon', 'hyperion_astral', WEAPONS.hyperion_astral.diamondCost ?? 260, 'Hyperion Astral Cannon')}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= (WEAPONS.hyperion_astral.diamondCost ?? 260)
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {WEAPONS.hyperion_astral.diamondCost ?? 260} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 6. Hydra Micro-Missiles */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-400 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 border-b border-l border-emerald-400/50 text-[10px] font-mono font-bold text-emerald-300 rounded-bl-xl">
                DIAMOND VAULT WEAPON
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center text-3xl">
                    🚀
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Hydra Micro-Missiles</h3>
                    <div className="text-xs font-mono text-emerald-400">HOMING TACTICAL CLUSTER</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  {WEAPONS.missile.description}
                </p>
              </div>
              <div>
                {activeWeapon === 'missile' ? (
                  <div className="w-full py-3 bg-emerald-500/20 border border-emerald-400/60 rounded-xl text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> ACTIVE WEAPON EQUIPPED
                  </div>
                ) : unlockedWeapons.missile ? (
                  <button
                    onClick={() => handleEquipWeaponClick('missile')}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                  >
                    EQUIP HYDRA MISSILES
                  </button>
                ) : (
                  <button
                    onClick={() => handleDiamondBuy('weapon', 'missile', WEAPONS.missile.diamondCost ?? 280, 'Hydra Micro-Missiles')}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= (WEAPONS.missile.diamondCost ?? 280)
                        ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {WEAPONS.missile.diamondCost ?? 280} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 7. Inferno Dragonfire */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-orange-500/30 hover:border-orange-400 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-orange-500/20 border-b border-l border-orange-400/50 text-[10px] font-mono font-bold text-orange-300 rounded-bl-xl">
                BEAST DIAMOND WEAPON
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-orange-500/10 border border-orange-400/40 flex items-center justify-center text-3xl">
                    🔥
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Inferno Dragonfire</h3>
                    <div className="text-xs font-mono text-orange-400">BEAST-TIER SOLAR TORRENT</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  {WEAPONS.inferno.description}
                </p>
              </div>
              <div>
                {activeWeapon === 'inferno' ? (
                  <div className="w-full py-3 bg-orange-500/20 border border-orange-400/60 rounded-xl text-center text-xs font-bold text-orange-300 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> ACTIVE WEAPON EQUIPPED
                  </div>
                ) : unlockedWeapons.inferno ? (
                  <button
                    onClick={() => handleEquipWeaponClick('inferno')}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                  >
                    EQUIP INFERNO DRAGONFIRE
                  </button>
                ) : (
                  <button
                    onClick={() => handleDiamondBuy('weapon', 'inferno', WEAPONS.inferno.diamondCost ?? 350, 'Inferno Dragonfire')}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= (WEAPONS.inferno.diamondCost ?? 350)
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {WEAPONS.inferno.diamondCost ?? 350} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 8. Relic: Temporal Flux Matrix */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 hover:border-amber-400 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/20 border-b border-l border-amber-400/50 text-[10px] font-mono font-bold text-amber-300 rounded-bl-xl">
                COMBAT RELIC
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-3xl">
                    ⏳
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Temporal Flux Matrix</h3>
                    <div className="text-xs font-mono text-amber-400">+2.5s COMBO HOLD WINDOW (5.5s)</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  Permanently expands consecutive-hit combo retention window from 3.0s to 5.5 seconds for massive score chains.
                </p>
              </div>
              <div>
                {diamondRelics.chrono_flux ? (
                  <div className="w-full py-3 bg-emerald-500/20 border border-emerald-400/60 rounded-xl text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> RELIC PERMANENTLY ACTIVE
                  </div>
                ) : (
                  <button
                    onClick={() => handleDiamondBuy('relic', 'chrono_flux', DIAMOND_RELIC_COSTS.chrono_flux, 'Temporal Flux Matrix')}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= DIAMOND_RELIC_COSTS.chrono_flux
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {DIAMOND_RELIC_COSTS.chrono_flux} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 9. Relic: Quantum Nanite Core */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-400 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 border-b border-l border-emerald-400/50 text-[10px] font-mono font-bold text-emerald-300 rounded-bl-xl">
                DEFENSE RELIC
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-400/40 flex items-center justify-center text-3xl">
                    🛡️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Quantum Nanite Core</h3>
                    <div className="text-xs font-mono text-emerald-400">+15 SHIELD/SEC AUTO-REPAIR</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  Passively regenerates +15 Shield per second continuously even under enemy barrage.
                </p>
              </div>
              <div>
                {diamondRelics.quantum_nanite ? (
                  <div className="w-full py-3 bg-emerald-500/20 border border-emerald-400/60 rounded-xl text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> RELIC PERMANENTLY ACTIVE
                  </div>
                ) : (
                  <button
                    onClick={() => handleDiamondBuy('relic', 'quantum_nanite', DIAMOND_RELIC_COSTS.quantum_nanite, 'Quantum Nanite Core')}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= DIAMOND_RELIC_COSTS.quantum_nanite
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {DIAMOND_RELIC_COSTS.quantum_nanite} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 10. Relic: Solar Overcharge Matrix */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-amber-400/30 hover:border-amber-300 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/20 border-b border-l border-amber-400/50 text-[10px] font-mono font-bold text-amber-300 rounded-bl-xl">
                OVERCLOCK RELIC
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-3xl">
                    ☀️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Solar Overcharge Matrix</h3>
                    <div className="text-xs font-mono text-amber-300">+15% FIRE RATE · +25% FINISHER CHARGE</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  Accelerates every equipped weapon&apos;s rate of fire by +15% and charges Combo Nova Finishers 25% faster permanently.
                </p>
              </div>
              <div>
                {diamondRelics.solar_overcharge ? (
                  <div className="w-full py-3 bg-emerald-500/20 border border-emerald-400/60 rounded-xl text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> RELIC PERMANENTLY ACTIVE
                  </div>
                ) : (
                  <button
                    onClick={() => handleDiamondBuy('relic', 'solar_overcharge', DIAMOND_RELIC_COSTS.solar_overcharge, 'Solar Overcharge Matrix')}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= DIAMOND_RELIC_COSTS.solar_overcharge
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {DIAMOND_RELIC_COSTS.solar_overcharge} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 11. Relic: Midas Treasury Protocol */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-yellow-500/30 hover:border-yellow-400 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-yellow-500/20 border-b border-l border-yellow-400/50 text-[10px] font-mono font-bold text-yellow-300 rounded-bl-xl">
                TREASURY RELIC
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-yellow-500/10 border border-yellow-400/40 flex items-center justify-center text-3xl">
                    🪙
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Midas Treasury Protocol</h3>
                    <div className="text-xs font-mono text-yellow-300">+35% CYBER COIN DROPS FOREVER</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  Permanently amplifies all Cyber Coins collected in campaign, Endless, and Boss Rush runs by +35%. Stacks with all modules and drones.
                </p>
              </div>
              <div>
                {diamondRelics.midas_treasury ? (
                  <div className="w-full py-3 bg-emerald-500/20 border border-emerald-400/60 rounded-xl text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> RELIC PERMANENTLY ACTIVE
                  </div>
                ) : (
                  <button
                    onClick={() => handleDiamondBuy('relic', 'midas_treasury', DIAMOND_RELIC_COSTS.midas_treasury, 'Midas Treasury Protocol')}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= DIAMOND_RELIC_COSTS.midas_treasury
                        ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {DIAMOND_RELIC_COSTS.midas_treasury} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 12. Seraph Nova Prime Craft */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-fuchsia-400/40 hover:border-fuchsia-300 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-fuchsia-500/20 border-b border-l border-fuchsia-400/50 text-[10px] font-mono font-bold text-fuchsia-300 rounded-bl-xl">
                CELESTIAL APEX AIRFRAME
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/40 flex items-center justify-center text-3xl">
                    🌟
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{CRAFTS.seraph_nova.name}</h3>
                    <div className="text-xs font-mono text-fuchsia-300">{CRAFTS.seraph_nova.model}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  {CRAFTS.seraph_nova.description}
                </p>
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] font-mono mb-4 text-center">
                  <div>
                    <span className="text-slate-400 block text-[9px]">SHIELD BONUS</span>
                    <span className="text-emerald-300 font-bold">+{CRAFTS.seraph_nova.shieldBonus}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">SPEED</span>
                    <span className="text-cyan-300 font-bold">+38% Velocity</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">DAMAGE</span>
                    <span className="text-amber-300 font-bold">1.48x AMP</span>
                  </div>
                </div>
              </div>
              <div>
                {activeCraft === 'seraph_nova' ? (
                  <div className="w-full py-3 bg-fuchsia-500/20 border border-fuchsia-400/60 rounded-xl text-center text-xs font-bold text-fuchsia-200 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> ACTIVE AIRFRAME PILOTED
                  </div>
                ) : unlockedCrafts.seraph_nova ? (
                  <button
                    onClick={() => handleEquipCraftClick('seraph_nova')}
                    className="w-full py-3 bg-fuchsia-400 hover:bg-fuchsia-300 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                  >
                    PILOT SERAPH NOVA
                  </button>
                ) : (
                  <button
                    onClick={() => handleDiamondBuy('craft', 'seraph_nova', CRAFTS.seraph_nova.diamondCost ?? 380, CRAFTS.seraph_nova.name)}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= (CRAFTS.seraph_nova.diamondCost ?? 380)
                        ? 'bg-gradient-to-r from-fuchsia-400 to-amber-400 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {CRAFTS.seraph_nova.diamondCost ?? 380} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 13. Celestial Eclipse Cannon */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-rose-500/35 hover:border-rose-400 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500/20 border-b border-l border-rose-400/50 text-[10px] font-mono font-bold text-rose-300 rounded-bl-xl">
                GOD-TIER DIAMOND WEAPON
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-rose-500/10 border border-rose-400/40 flex items-center justify-center text-3xl">
                    ☄️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{WEAPONS.celestial_eclipse.name}</h3>
                    <div className="text-xs font-mono text-rose-300">210 DMG · TRIPLE HOMING NOVA</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  {WEAPONS.celestial_eclipse.description}
                </p>
              </div>
              <div>
                {activeWeapon === 'celestial_eclipse' ? (
                  <div className="w-full py-3 bg-rose-500/20 border border-rose-400/60 rounded-xl text-center text-xs font-bold text-rose-200 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> ACTIVE WEAPON EQUIPPED
                  </div>
                ) : unlockedWeapons.celestial_eclipse ? (
                  <button
                    onClick={() => handleEquipWeaponClick('celestial_eclipse')}
                    className="w-full py-3 bg-rose-400 hover:bg-rose-300 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                  >
                    EQUIP CELESTIAL ECLIPSE
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      handleDiamondBuy(
                        'weapon',
                        'celestial_eclipse',
                        WEAPONS.celestial_eclipse.diamondCost ?? 330,
                        WEAPONS.celestial_eclipse.name
                      )
                    }
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= (WEAPONS.celestial_eclipse.diamondCost ?? 330)
                        ? 'bg-gradient-to-r from-rose-400 to-fuchsia-500 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {WEAPONS.celestial_eclipse.diamondCost ?? 330} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 14. Void Reaper Stealth Unit Companion */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-purple-500/35 hover:border-purple-400 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-purple-500/20 border-b border-l border-purple-400/50 text-[10px] font-mono font-bold text-purple-300 rounded-bl-xl">
                APEX STEALTH WINGMAN
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-400/40 flex items-center justify-center text-3xl">
                    {COMPANION_DRONES.void_reaper_drone.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{COMPANION_DRONES.void_reaper_drone.name}</h3>
                    <div className="text-xs font-mono text-purple-300">{COMPANION_DRONES.void_reaper_drone.perkSummary}</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  {COMPANION_DRONES.void_reaper_drone.description}
                </p>
              </div>
              <div>
                {storeGear.activeCompanion === 'void_reaper_drone' ? (
                  <div className="w-full py-3 bg-purple-500/20 border border-purple-400/60 rounded-xl text-center text-xs font-bold text-purple-200 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> ACTIVE WINGMAN DEPLOYED
                  </div>
                ) : storeGear.unlockedCompanions.void_reaper_drone ? (
                  <button
                    onClick={() => handleEquipCompanionClick('void_reaper_drone')}
                    className="w-full py-3 bg-purple-400 hover:bg-purple-300 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                  >
                    DEPLOY VOID REAPER
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      handleDiamondBuy(
                        'companion',
                        'void_reaper_drone',
                        COMPANION_DRONES.void_reaper_drone.diamondCost ?? 285,
                        COMPANION_DRONES.void_reaper_drone.name
                      )
                    }
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= (COMPANION_DRONES.void_reaper_drone.diamondCost ?? 285)
                        ? 'bg-gradient-to-r from-purple-400 to-cyan-400 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {COMPANION_DRONES.void_reaper_drone.diamondCost ?? 285} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 15. Quantum Prism Rainbow Jet Trail */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-400/35 hover:border-cyan-300 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-500/20 border-b border-l border-cyan-400/50 text-[10px] font-mono font-bold text-cyan-200 rounded-bl-xl">
                PRISMATIC TRAIL FX
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-3xl">
                    {THRUSTER_TRAILS.trail_quantum_prism.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{THRUSTER_TRAILS.trail_quantum_prism.name}</h3>
                    <div className="text-xs font-mono text-cyan-300">
                      {THRUSTER_TRAILS.trail_quantum_prism.perkSummary}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  {THRUSTER_TRAILS.trail_quantum_prism.description}
                </p>
              </div>
              <div>
                {storeGear.activeTrail === 'trail_quantum_prism' ? (
                  <div className="w-full py-3 bg-cyan-500/20 border border-cyan-400/60 rounded-xl text-center text-xs font-bold text-cyan-200 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> ACTIVE PRISM TRAIL
                  </div>
                ) : storeGear.unlockedTrails.trail_quantum_prism ? (
                  <button
                    onClick={() => handleEquipTrailClick('trail_quantum_prism')}
                    className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase rounded-xl cursor-pointer"
                  >
                    EQUIP PRISM TRAIL
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      handleDiamondBuy(
                        'trail',
                        'trail_quantum_prism',
                        THRUSTER_TRAILS.trail_quantum_prism.diamondCost ?? 175,
                        THRUSTER_TRAILS.trail_quantum_prism.name
                      )
                    }
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= (THRUSTER_TRAILS.trail_quantum_prism.diamondCost ?? 175)
                        ? 'bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {THRUSTER_TRAILS.trail_quantum_prism.diamondCost ?? 175} DIAMONDS
                  </button>
                )}
              </div>
            </div>

            {/* 16. Relic: Void Overdrive Matrix */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-violet-500/35 hover:border-violet-400 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-violet-500/20 border-b border-l border-violet-400/50 text-[10px] font-mono font-bold text-violet-300 rounded-bl-xl">
                OVERDRIVE RELIC
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-violet-500/10 border border-violet-400/40 flex items-center justify-center text-3xl">
                    🌀
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Void Overdrive Matrix</h3>
                    <div className="text-xs font-mono text-violet-300">+12% ALL DAMAGE · +10 SHIELD/SEC</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 font-mono leading-relaxed mb-4">
                  Permanently boosts all weapon &amp; escort drone damage by +12% while knitting +10 Shield every second continuously.
                </p>
              </div>
              <div>
                {diamondRelics.void_overdrive ? (
                  <div className="w-full py-3 bg-emerald-500/20 border border-emerald-400/60 rounded-xl text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> RELIC PERMANENTLY ACTIVE
                  </div>
                ) : (
                  <button
                    onClick={() => handleDiamondBuy('relic', 'void_overdrive', DIAMOND_RELIC_COSTS.void_overdrive, 'Void Overdrive Matrix')}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase cursor-pointer ${
                      diamonds >= DIAMOND_RELIC_COSTS.void_overdrive
                        ? 'bg-gradient-to-r from-violet-400 to-fuchsia-500 text-slate-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    💎 UNLOCK FOR {DIAMOND_RELIC_COSTS.void_overdrive} DIAMONDS
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
