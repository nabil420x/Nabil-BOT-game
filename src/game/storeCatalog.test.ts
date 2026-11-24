import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOOSTER_DIAMOND_PRICES,
  BOOSTER_ORDER,
  BOOSTER_SHOP_PRICES,
  COMPANION_DRONES,
  COMPANION_ORDER,
  MODULE_ORDER,
  PERMANENT_MODULES,
  STORE_BUNDLES,
  THRUSTER_TRAILS,
  TRAIL_ORDER,
  computeStoreGearModifiers,
  createInitialStoreGearState,
  equipCompanionState,
  equipTrailState,
  isCompanionDiamondExclusive,
  isTrailDiamondExclusive,
  normalizeStoreGearState,
  purchaseBoosterWithDiamondsState,
  purchaseCompanionState,
  purchaseCompanionWithDiamondsState,
  purchaseModuleState,
  purchaseModuleWithDiamondsState,
  purchaseStoreBundle,
  purchaseTrailState,
  purchaseTrailWithDiamondsState,
  unlockDiamondCompanionState,
  unlockDiamondTrailState,
} from './storeCatalog';
import { WEAPONS, WEAPON_ORDER } from './weapons';
import { CRAFTS, CRAFT_ORDER, isCraftDiamondExclusive, purchaseCraft, purchaseCraftWithDiamonds } from './crafts';
import { getWeaponPrice, purchaseWeapon } from './rules';
import { SUPPLY_CRATE_COSTS } from './supplyCrate';
import { DIAMOND_RELIC_COSTS } from './diamonds';

test('store expansion exposes 17 weapons, 11 crafts, 9 companions, 9 trails, 6 modules, 6 boosters, and 5 bundles with raised pricing', () => {
  assert.equal(WEAPON_ORDER.length, 17);
  assert.equal(CRAFT_ORDER.length, 11);
  assert.equal(COMPANION_ORDER.length, 9);
  assert.equal(TRAIL_ORDER.length, 9);
  assert.equal(MODULE_ORDER.length, 6);
  assert.equal(BOOSTER_ORDER.length, 6);
  assert.equal(STORE_BUNDLES.length, 5);

  assert.equal(WEAPONS.plasma_scythe.price, 2000);
  assert.equal(WEAPONS.plasma_scythe.diamondCost, 80);
  assert.equal(WEAPONS.cryo_shatter.cryoSlowDuration, 2.6);
  assert.equal(WEAPONS.omega_singularity.price, 9500);
  assert.equal(WEAPONS.omega_singularity.diamondCost, 310);
  assert.equal(WEAPONS.prism_splitter.price, 2800);
  assert.equal(WEAPONS.void_rail.price, 5500);
  assert.equal(WEAPONS.celestial_eclipse.diamondCost, 330);
  assert.equal(getWeaponPrice('omega_singularity'), 9500);
  assert.equal(getWeaponPrice('void_rail'), 5500);

  assert.equal(CRAFTS.cyber_falcon.price, 1400);
  assert.equal(CRAFTS.cyber_falcon.diamondCost, 60);
  assert.equal(CRAFTS.nebula_harbinger.price, 6000);
  assert.equal(CRAFTS.tempest_raptor.price, 3800);
  assert.equal(CRAFTS.zenith_emperor.diamondCost, 320);
  assert.equal(CRAFTS.seraph_nova.diamondCost, 380);

  assert.equal(SUPPLY_CRATE_COSTS.standard, 650);
  assert.equal(SUPPLY_CRATE_COSTS.apex, 1650);
  assert.equal(DIAMOND_RELIC_COSTS.chrono_flux, 165);
  assert.equal(DIAMOND_RELIC_COSTS.void_overdrive, 225);

  // Every non-free store item has a positive diamondCost
  for (const wId of WEAPON_ORDER) {
    if (WEAPONS[wId].price > 0) {
      assert.ok((WEAPONS[wId].diamondCost ?? 0) > 0, `weapon ${wId} should be buyable with diamonds`);
    }
  }
  for (const cId of CRAFT_ORDER) {
    if (CRAFTS[cId].price > 0) {
      assert.ok((CRAFTS[cId].diamondCost ?? 0) > 0, `craft ${cId} should be buyable with diamonds`);
    }
  }
  for (const compId of COMPANION_ORDER) {
    assert.ok((COMPANION_DRONES[compId].diamondCost ?? 0) > 0, `companion ${compId} should have diamondCost`);
  }
  for (const tId of TRAIL_ORDER) {
    if (THRUSTER_TRAILS[tId].price > 0) {
      assert.ok((THRUSTER_TRAILS[tId].diamondCost ?? 0) > 0, `trail ${tId} should have diamondCost`);
    }
  }
  for (const mId of MODULE_ORDER) {
    assert.ok(PERMANENT_MODULES[mId].diamondCost > 0, `module ${mId} should have diamondCost`);
  }
  for (const bId of BOOSTER_ORDER) {
    assert.ok(BOOSTER_SHOP_PRICES[bId] >= 550, `booster ${bId} should have raised coin price`);
    assert.ok(BOOSTER_DIAMOND_PRICES[bId] >= 22, `booster ${bId} should have raised diamond price`);
  }
});

test('companion drones, thruster trails, and permanent modules purchase, equip, and compute modifiers cleanly', () => {
  let state = createInitialStoreGearState();

  // Default trail unlocked & active
  assert.equal(state.unlockedTrails.trail_standard, true);
  assert.equal(state.activeTrail, 'trail_standard');
  assert.equal(state.activeCompanion, null);

  // Buying diamond-exclusive companion with coins is rejected
  assert.equal(isCompanionDiamondExclusive('archon_seraph'), true);
  assert.equal(isCompanionDiamondExclusive('scout_spark'), false);
  const blockedDiamond = purchaseCompanionState(state, 99999, 'archon_seraph');
  assert.equal(blockedDiamond.success, false);
  assert.equal(purchaseCompanionState(state, 99999, 'void_reaper_drone').success, false);

  // Buying coin companions deducts raised coins & auto-equips
  const compBuy = purchaseCompanionState(state, 1000, 'scout_spark'); // 850 coins
  assert.equal(compBuy.success, true);
  assert.equal(compBuy.remainingCoins, 150);
  state = compBuy.updatedState;
  assert.equal(state.unlockedCompanions.scout_spark, true);
  assert.equal(state.activeCompanion, 'scout_spark');

  const voltBuy = purchaseCompanionState(state, 3300, 'volt_arc_bot'); // 3200 coins
  assert.equal(voltBuy.success, true);
  assert.equal(voltBuy.remainingCoins, 100);
  state = voltBuy.updatedState;
  assert.equal(state.unlockedCompanions.volt_arc_bot, true);
  assert.equal(state.activeCompanion, 'volt_arc_bot');

  // Cannot equip locked companion, can unequip active companion
  assert.equal(equipCompanionState(state, 'inferno_wyrm').success, false);
  const unequipped = equipCompanionState(state, null);
  assert.equal(unequipped.success, true);
  assert.equal(unequipped.updatedState.activeCompanion, null);

  // Unlock diamond companion & diamond trail + permanent modules
  assert.equal(isTrailDiamondExclusive('trail_celestial_gold'), true);
  assert.equal(isTrailDiamondExclusive('trail_void_lightning'), false);
  state = unlockDiamondCompanionState(state, 'archon_seraph');
  state = unlockDiamondTrailState(state, 'trail_celestial_gold');

  const trailCoinFail = purchaseTrailState(state, 100, 'trail_cyber_rainbow');
  assert.equal(trailCoinFail.success, false);

  const trailCoinInsufficient = purchaseTrailState(state, 2800, 'trail_void_lightning');
  assert.equal(trailCoinInsufficient.success, false); // 2850 needed
  const trailOk = purchaseTrailState(state, 3000, 'trail_void_lightning');
  assert.equal(trailOk.success, true);
  assert.equal(trailOk.remainingCoins, 150);
  state = trailOk.updatedState;

  const crimsonTrail = purchaseTrailState(state, 1600, 'trail_crimson_afterburn'); // 1450 coins
  assert.equal(crimsonTrail.success, true);
  assert.equal(crimsonTrail.remainingCoins, 150);
  state = crimsonTrail.updatedState;

  // Equip back celestial gold trail
  const eqGold = equipTrailState(state, 'trail_celestial_gold');
  assert.equal(eqGold.success, true);
  state = eqGold.updatedState;

  // Purchase permanent modules with raised coin costs
  const modPlating = purchaseModuleState(state, 3000, 'kinetic_plating'); // 2800 coins
  assert.equal(modPlating.success, true);
  assert.equal(modPlating.remainingCoins, 200);
  state = modPlating.updatedState;

  const modSiphon = purchaseModuleState(state, 4100, 'vampiric_siphon'); // 3900 coins
  assert.equal(modSiphon.success, true);
  assert.equal(modSiphon.remainingCoins, 200);
  state = modSiphon.updatedState;

  const modMagnet = purchaseModuleState(state, 2300, 'magnet_overdrive'); // 2200 coins
  assert.equal(modMagnet.success, true);
  assert.equal(modMagnet.remainingCoins, 100);
  state = modMagnet.updatedState;

  const modThermal = purchaseModuleState(state, 3300, 'thermal_vent'); // 3200 coins
  assert.equal(modThermal.success, true);
  assert.equal(modThermal.remainingCoins, 100);
  state = modThermal.updatedState;

  const modCrit = purchaseModuleState(state, 3700, 'crit_amplifier'); // 3600 coins
  assert.equal(modCrit.success, true);
  assert.equal(modCrit.remainingCoins, 100);
  state = modCrit.updatedState;

  const modCap = purchaseModuleState(state, 4500, 'shield_capacitor'); // 4400 coins
  assert.equal(modCap.success, true);
  assert.equal(modCap.remainingCoins, 100);
  state = modCap.updatedState;

  // Verify computed modifiers stack modules + trail + companion + diamond relics
  const mods = computeStoreGearModifiers(state, {
    chrono_flux: true,
    quantum_nanite: true,
    solar_overcharge: true,
    midas_treasury: true,
    void_overdrive: true,
  });

  assert.equal(mods.maxHpBonus, 2);
  assert.equal(mods.maxShieldBonus, 70); // 25 kinetic_plating + 45 shield_capacitor
  assert.equal(mods.vampiricKillsPerHp, 15);
  assert.ok(mods.speedBonus >= 0.08);
  assert.ok(mods.coolingMultiplier >= 1.29);
  assert.ok(mods.heatPerShotMultiplier < 0.85);
  assert.ok(mods.magnetBonusPx >= 230); // 60 trail + 80 archon_seraph + 90 module
  assert.ok(mods.coinMultiplier >= 1.46); // 1 + 0.12 + 0.35
  assert.ok(mods.fireRateMultiplier >= 1.14);
  assert.equal(mods.shieldRechargeBonus, 37); // 12 plating + 15 shield_capacitor + 10 void_overdrive
  assert.ok(Math.abs(mods.critChanceBonus - 0.1) < 1e-6);
  assert.ok(Math.abs(mods.shieldDelayMultiplier - 0.78) < 1e-6);
  assert.ok(Math.abs(mods.damageMultiplier - 1.12) < 1e-6);

  // Normalization recovers cleanly from malformed storage
  const normalized = normalizeStoreGearState({ activeTrail: 'invalid_id' as any, activeCompanion: 'cryo_sentinel' });
  assert.equal(normalized.activeTrail, 'trail_standard');
  assert.equal(normalized.activeCompanion, null);
});

test('new coin weapons purchase cleanly via purchaseWeapon at raised prices', () => {
  const initial = Object.fromEntries(WEAPON_ORDER.map((id) => [id, id === 'pulse'])) as Record<
    (typeof WEAPON_ORDER)[number],
    boolean
  >;
  const scythe = purchaseWeapon(2100, initial, 'plasma_scythe'); // 2000
  assert.equal(scythe.success, true);
  assert.equal(scythe.remainingCoins, 100);
  assert.equal(scythe.updatedWeapons.plasma_scythe, true);

  const prism = purchaseWeapon(2900, scythe.updatedWeapons, 'prism_splitter'); // 2800
  assert.equal(prism.success, true);
  assert.equal(prism.remainingCoins, 100);

  const cryo = purchaseWeapon(4100, prism.updatedWeapons, 'cryo_shatter'); // 4000
  assert.equal(cryo.success, true);
  assert.equal(cryo.remainingCoins, 100);

  const voidRail = purchaseWeapon(5600, cryo.updatedWeapons, 'void_rail'); // 5500
  assert.equal(voidRail.success, true);
  assert.equal(voidRail.remainingCoins, 100);

  const omega = purchaseWeapon(9800, voidRail.updatedWeapons, 'omega_singularity'); // 9500
  assert.equal(omega.success, true);
  assert.equal(omega.remainingCoins, 300);
});

test('all Store categories support buying with Diamonds alongside Coins', () => {
  let gear = createInitialStoreGearState();

  // Crafts: Coin store rejects Vault-exclusive craft; Diamond purchase unlocks coin-tier craft
  const initialCrafts = Object.fromEntries(
    CRAFT_ORDER.map((id) => [id, id === 'vanguard_alpha'])
  ) as Record<(typeof CRAFT_ORDER)[number], boolean>;
  assert.equal(isCraftDiamondExclusive('zenith_emperor'), true);
  assert.equal(isCraftDiamondExclusive('cyber_falcon'), false);
  assert.equal(purchaseCraft(99999, initialCrafts, 'zenith_emperor').success, false);

  const craftDiamondRes = purchaseCraftWithDiamonds(80, initialCrafts, 'cyber_falcon'); // 60💎
  assert.equal(craftDiamondRes.success, true);
  assert.equal(craftDiamondRes.remainingDiamonds, 20);
  assert.equal(craftDiamondRes.updatedCrafts.cyber_falcon, true);

  const craftDiamondFail = purchaseCraftWithDiamonds(40, craftDiamondRes.updatedCrafts, 'titan_dread'); // 120💎
  assert.equal(craftDiamondFail.success, false);
  assert.equal(craftDiamondFail.remainingDiamonds, 40);

  // Companions via Diamonds
  const compDiamondRes = purchaseCompanionWithDiamondsState(gear, 100, 'aegis_orbiter'); // 82💎
  assert.equal(compDiamondRes.success, true);
  assert.equal(compDiamondRes.remainingDiamonds, 18);
  assert.equal(compDiamondRes.updatedState.unlockedCompanions.aegis_orbiter, true);
  assert.equal(compDiamondRes.updatedState.activeCompanion, 'aegis_orbiter');
  gear = compDiamondRes.updatedState;

  assert.equal(purchaseCompanionWithDiamondsState(gear, 10, 'inferno_wyrm').success, false);

  // Trails via Diamonds
  const trailDiamondRes = purchaseTrailWithDiamondsState(gear, 60, 'trail_cyber_rainbow'); // 45💎
  assert.equal(trailDiamondRes.success, true);
  assert.equal(trailDiamondRes.remainingDiamonds, 15);
  assert.equal(trailDiamondRes.updatedState.unlockedTrails.trail_cyber_rainbow, true);
  assert.equal(trailDiamondRes.updatedState.activeTrail, 'trail_cyber_rainbow');
  gear = trailDiamondRes.updatedState;

  assert.equal(purchaseTrailWithDiamondsState(gear, 15, 'trail_solar_flare').success, false);

  // Permanent Modules via Diamonds
  const modDiamondRes = purchaseModuleWithDiamondsState(gear, 100, 'magnet_overdrive'); // 85💎
  assert.equal(modDiamondRes.success, true);
  assert.equal(modDiamondRes.remainingDiamonds, 15);
  assert.equal(modDiamondRes.updatedState.unlockedModules.magnet_overdrive, true);
  gear = modDiamondRes.updatedState;

  assert.equal(purchaseModuleWithDiamondsState(gear, 20, 'shield_capacitor').success, false);

  // Pre-Run Boosters via Diamonds
  const boosterRes = purchaseBoosterWithDiamondsState([], 'shield_overcharge', 30); // 22💎
  assert.equal(boosterRes.success, true);
  assert.equal(boosterRes.remainingDiamonds, 8);
  assert.deepEqual(boosterRes.armedBoosters, ['shield_overcharge']);

  assert.equal(purchaseBoosterWithDiamondsState(boosterRes.armedBoosters, 'shield_overcharge', 100).success, false);
  assert.equal(purchaseBoosterWithDiamondsState(boosterRes.armedBoosters, 'headstart_augment', 5).success, false);

  // Coin Armory Bundles purchasable with Diamonds without spending Coins
  const bundleFail = purchaseStoreBundle('bundle_starter_kit', {
    currentCoins: 0,
    activeWeapon: 'pulse',
    gearState: gear,
    currency: 'diamonds',
    currentDiamonds: 20, // needs 58💎
  });
  assert.equal(bundleFail.success, false);
  assert.equal(bundleFail.remainingDiamonds, 20);

  const bundleOk = purchaseStoreBundle('bundle_starter_kit', {
    currentCoins: 500,
    activeWeapon: 'pulse',
    gearState: gear,
    currency: 'diamonds',
    currentDiamonds: 80, // costs 58💎
  });
  assert.equal(bundleOk.success, true);
  assert.equal(bundleOk.remainingCoins, 500);
  assert.equal(bundleOk.remainingDiamonds, 22);
  assert.equal(bundleOk.updatedGearState.purchasedBundles.bundle_starter_kit, true);
  assert.equal(bundleOk.updatedGearState.unlockedCompanions.scout_spark, true);
  assert.deepEqual(bundleOk.unlockedWeaponsList, ['scatter']);
});

