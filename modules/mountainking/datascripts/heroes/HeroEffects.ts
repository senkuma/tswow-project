import { ALL_SCHOOLS, createFamilySpell, scalesWithAttackPower, withAttackPower } from "classkit";
import { MOUNTAIN_KING_CONTEXT as MK } from "../MountainKingClass";

// Parents.
const LIGHTNING_STRIKE_NPC = 23687;   // single-target lightning from the sky
const STORMBOLT_NPC = 19136;          // Warcraft III Storm Bolt
const CHAIN_LIGHTNING = 421;          // rank 1, jumps to 3 targets
const HEALING_POTION = 441;           // plain instant self-heal
const AVATAR_NPC = 19135;             // Warcraft III Avatar: three self auras

// Visuals.
const VISUAL_THROWN_HAMMER = 5779;
const VISUAL_LIGHTNING_ORBS = 37;     // Lightning Shield
const VISUAL_STONEFORM = 5787;

const DURATION_8_SEC = 31;
const DURATION_10_SEC = 1;

const AP_STORMCALLER_BOLT = 0.4;
const AP_WILDHAMMER_THROW = 0.25;
const AP_CHAIN_THUNDER = 0.3;
const AP_THANES_RESOLVE = 0.3;

// ---------------------------------------------------------------- Stormcaller

/** Stormcaller keystone: lightning called down on Hammer Blow, Thunder Clap and Storm Bolt hits. */
export const STORMCALLER_BOLT = createFamilySpell(MK, {
    id: 'hero-stormcaller-bolt',
    parent: LIGHTNING_STRIKE_NPC,
    familyBit: 25,
    name: 'Stormcaller\'s Bolt',
    icon: 'Spell_Lightning_LightningBolt01',
    school: 'NATURE',
    configure: spell => {
        spell.Effects.get(0).PointsBase.set(200);
        scalesWithAttackPower(spell, AP_STORMCALLER_BOLT);
    },
});
export const STORMCALLER_BOLT_DAMAGE = withAttackPower(`$${STORMCALLER_BOLT.ID}s1`, AP_STORMCALLER_BOLT);

/** Stormcaller capstone buff. */
export const STORM_SURGE = createFamilySpell(MK, {
    id: 'hero-storm-surge',
    parent: AVATAR_NPC,
    familyBit: 26,
    name: 'Storm Surge',
    icon: 'Spell_Nature_UnrelentingStorm',
    school: 'NATURE',
    visual: { id: VISUAL_LIGHTNING_ORBS },
    configure: spell => {
        spell.Duration.set(DURATION_8_SEC)
            .AuraDescription.enGB.set('Attack speed increased by $s1%.  Nature damage increased by $s2%.');
        spell.Effects.get(0).Aura.MOD_MELEE_HASTE.set().PercentBase.set(20);
        spell.Effects.get(1).Aura.MOD_DAMAGE_PERCENT_DONE.set().Schools.set(['NATURE']).PercentBase.set(10);
        spell.Effects.get(2).Aura.MOD_SCALE.set().PercentBase.set(10);
    },
});

// ---------------------------------------------------------------- Thane of Ironforge

/** Thane keystone: Hammer Blow and Mountain Breaker restore health. */
export const THANES_RESOLVE_HEAL = createFamilySpell(MK, {
    id: 'hero-thanes-resolve-heal',
    parent: HEALING_POTION,
    familyBit: 27,
    name: 'Thane\'s Resolve',
    icon: 'Spell_Holy_SealOfMight',
    school: 'PHYSICAL',
    configure: spell => {
        spell.Effects.get(0).PointsBase.set(100);
        // Healing Potion shares the potion cooldown category; every proc would lock real potions.
        spell.Cooldown.Category.set(0)
            .Cooldown.CategoryTime.set(0)
            .Cooldown.Time.set(0)
            .BonusData.APBonus.set(AP_THANES_RESOLVE)
            .BonusData.DirectBonus.set(0);
    },
});
export const THANES_RESOLVE_HEALING = withAttackPower(`$${THANES_RESOLVE_HEAL.ID}s1`, AP_THANES_RESOLVE);

/** Thane capstone buff. */
export const LIVING_STONE = createFamilySpell(MK, {
    id: 'hero-living-stone',
    parent: AVATAR_NPC,
    familyBit: 28,
    name: 'Living Stone',
    icon: 'Spell_Nature_StoneSkinTotem',
    school: 'PHYSICAL',
    visual: { id: VISUAL_STONEFORM },
    configure: spell => {
        spell.Duration.set(DURATION_10_SEC)
            .AuraDescription.enGB.set('Damage taken reduced by $S1%.  Armor increased by $s2%.');
        spell.Effects.get(0).Aura.MOD_DAMAGE_PERCENT_TAKEN.set().Schools.set(ALL_SCHOOLS).PercentBase.set(-20);
        spell.Effects.get(1).Aura.MOD_RESISTANCE_PCT.set().Schools.set('PHYSICAL').PercentBase.set(30);
        spell.Effects.get(2).Aura.MOD_SCALE.set().PercentBase.set(15);
    },
});

// ---------------------------------------------------------------- Wildhammer

/** Wildhammer keystone: a second, spectral hammer thrown with every Storm Bolt. */
export const WILDHAMMER_THROW = createFamilySpell(MK, {
    id: 'hero-wildhammer-throw',
    parent: STORMBOLT_NPC,
    familyBit: 29,
    name: 'Wildhammer Throw',
    icon: 'INV_Hammer_03',
    school: 'NATURE',
    visual: { id: VISUAL_THROWN_HAMMER, missileSpeed: 24 },
    configure: spell => {
        // Storm Bolt's stun.
        spell.Effects.get(1).clear();
        spell.Effects.get(0).PointsBase.set(100);
        scalesWithAttackPower(spell, AP_WILDHAMMER_THROW);
    },
});
export const WILDHAMMER_THROW_DAMAGE = withAttackPower(`$${WILDHAMMER_THROW.ID}s1`, AP_WILDHAMMER_THROW);

/** Wildhammer capstone: lightning that arcs between enemies. */
export const CHAIN_THUNDER = createFamilySpell(MK, {
    id: 'hero-chain-thunder',
    parent: CHAIN_LIGHTNING,
    familyBit: 30,
    name: 'Chain Thunder',
    icon: 'Spell_Nature_ChainLightning',
    school: 'NATURE',
    configure: spell => {
        spell.Power.CostBase.set(0).Power.CostPercent.set(0);
        spell.Effects.get(0).PointsBase.set(250);
        spell.Effects.get(0).ChainTarget.set(4);
        scalesWithAttackPower(spell, AP_CHAIN_THUNDER);
    },
});
export const CHAIN_THUNDER_DAMAGE = withAttackPower(`$${CHAIN_THUNDER.ID}s1`, AP_CHAIN_THUNDER);
