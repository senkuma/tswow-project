import {
    abilityPercent, ALL_SCHOOLS, createClassItem, createFamilySpell, createPassiveSpell, damageTaken, onMeleeHit,
    scalesWithAttackPower, triggerSpell, withAttackPower,
} from "classkit";
import { GrowthAnchor, makeGrowingWeapon } from "growingweapons";
import { VOID_BARRIER } from "./abilities/BulwarkAbilities";
import { FAMILY_BIT } from "./abilities/FamilyBits";
import { COLLAPSE, VOID_STRIKE } from "./abilities/GravityAbilities";
import { VOID_SHARDS } from "./abilities/VoidShards";
import { MODULE_NAME } from "./Constants";
import { VOID_KNIGHT_CONTEXT as VK } from "./VoidKnightClass";

/**
 * Umbra, the Void Knight's growing weapon: a plain level 1 greatsword that
 * gains weapon damage, strength, stamina and the melee ratings (critical
 * strike, haste, hit) with every level, and awakens a passive every 25
 * levels. Until level 80 it keeps pace with two-handers of the wielder's
 * level; its last twenty levels climb to the server's endgame greatswords
 * (item level 277 scaled by the endgame power factor).
 */
const WORN_GREATSWORD = 49778;        // level 1 two-handed sword, 3-5 damage
const BASE_AVERAGE_DAMAGE = 4;
const CORRUPTED_ASHBRINGER_DISPLAY = 35097;
const SWING_SECONDS = 3.6;
// Quality 6 is Artifact in 3.3.5 (TSWoW's enum calls it HEIRLOOM; heirlooms are 7).
const ARTIFACT_QUALITY = 6;
const SHADOW_SHOCK = 16583;           // NPC: instant Shadow damage
const VISUAL_SHADOW_SHOCK = 4209;

const SHARD_RESONANCE_CHANCE = 6;
const SHARD_RESONANCE_COOLDOWN_MS = 3000;
const HEART_OF_THE_VOID_CHANCE = 10;
const AP_UMBRAL_SLASH = 0.4;

/** Flat damage per swing that brings the sword to `dps` damage per second. */
function swingDamage(dps: number) {
    return Math.round(dps * SWING_SECONDS - BASE_AVERAGE_DAMAGE);
}

interface UmbraLevel {
    level: number;
    dps: number;
    strength: number;
    stamina: number;
    crit: number;
    haste: number;
    hit: number;
}

function anchor({ level, dps, strength, stamina, crit, haste, hit }: UmbraLevel): GrowthAnchor {
    return {
        level,
        // Listed in the order the weapon's progress panel shows them.
        bonuses: {
            WEAPON_DAMAGE: swingDamage(dps), STRENGTH: strength, STAMINA: stamina,
            CRIT_RATING: crit, HASTE_RATING: haste, HIT_RATING: hit,
        },
    };
}

const UMBRA_GROWTH = [
    anchor({ level: 1, dps: 4, strength: 2, stamina: 2, crit: 1, haste: 1, hit: 1 }),
    anchor({ level: 20, dps: 20, strength: 12, stamina: 11, crit: 6, haste: 5, hit: 4 }),
    anchor({ level: 40, dps: 40, strength: 28, stamina: 26, crit: 14, haste: 11, hit: 9 }),
    anchor({ level: 60, dps: 70, strength: 50, stamina: 48, crit: 25, haste: 20, hit: 16 }),
    anchor({ level: 70, dps: 100, strength: 72, stamina: 70, crit: 36, haste: 29, hit: 23 }),
    // A fine item level 200 greatsword.
    anchor({ level: 80, dps: 160, strength: 105, stamina: 105, crit: 55, haste: 44, hit: 36 }),
    // Glorenzelg between its item level 271 and 284 versions (277) times the endgame power factor;
    // ratings as on item level 277 two-handers, scaled like the server's rating tables.
    anchor({ level: 100, dps: 1060, strength: 615, stamina: 680, crit: 390, haste: 310, hit: 260 }),
];

// ---------------------------------------------------------------- milestone passives

const UMBRAL_EDGE = createPassiveSpell(VK, 'umbra-umbral-edge', {
    name: 'Umbral Edge',
    description: 'Increases the damage of Void Strike and Collapse by $s1%.',
    icon: 'Spell_Shadow_UnholyStrength',
    effects: [abilityPercent('DAMAGE', 10, [VOID_STRIKE, COLLAPSE])],
});

const SHARD_RESONANCE = createPassiveSpell(VK, 'umbra-shard-resonance', {
    name: 'Shard Resonance',
    description: 'Your melee attacks have a $h% chance to grant you a Void Shard.'
        + '  This effect cannot occur more than once every 3 sec.',
    icon: 'INV_Enchant_VoidCrystal',
    effects: [triggerSpell(VOID_SHARDS.ID)],
    configure: onMeleeHit(SHARD_RESONANCE_CHANCE, SHARD_RESONANCE_COOLDOWN_MS),
});

const DARK_BULWARK = createPassiveSpell(VK, 'umbra-dark-bulwark', {
    name: 'Dark Bulwark',
    description: 'Increases the damage absorbed by Void Barrier by $s1% and reduces all damage taken by $S2%.',
    icon: 'Spell_Shadow_SacrificialShield',
    effects: [abilityPercent('ALL_EFFECTS', 15, [VOID_BARRIER]), damageTaken(ALL_SCHOOLS, -3)],
});

/** Heart of the Void's proc. */
const UMBRAL_SLASH = createFamilySpell(VK, {
    id: 'umbra-umbral-slash',
    parent: SHADOW_SHOCK,
    familyBit: FAMILY_BIT.UMBRA_PROC_1,
    name: 'Umbral Slash',
    icon: 'Spell_Shadow_ShadowWordPain',
    school: 'SHADOW',
    visual: { id: VISUAL_SHADOW_SHOCK },
    configure: spell => {
        spell.Power.CostBase.set(0);
        spell.Effects.get(0).PointsBase.set(300);
        scalesWithAttackPower(spell, AP_UMBRAL_SLASH);
    },
});

const HEART_OF_THE_VOID = createPassiveSpell(VK, 'umbra-heart-of-the-void', {
    name: 'Heart of the Void',
    description: 'Your melee attacks have a $h% chance to release an Umbral Slash, dealing'
        + ` ${withAttackPower(`$${UMBRAL_SLASH.ID}m1`, AP_UMBRAL_SLASH)} Shadow damage to the target.`,
    icon: 'Spell_Shadow_ShadowWordPain',
    effects: [triggerSpell(UMBRAL_SLASH.ID)],
    configure: onMeleeHit(HEART_OF_THE_VOID_CHANCE),
});

export const UMBRA = makeGrowingWeapon(MODULE_NAME, createClassItem(VK, {
    id: 'umbra',
    parent: WORN_GREATSWORD,
    display: CORRUPTED_ASHBRINGER_DISPLAY,
    name: 'Umbra, Edge of the Event Horizon',
    description: 'Light does not escape it. Neither will they.',
})
    .Quality.set(ARTIFACT_QUALITY)
    .RequiredLevel.set(1)
    .Delay.set(SWING_SECONDS * 1000, 'MILLISECONDS'), {
    id: 'umbra',
    growth: UMBRA_GROWTH,
    milestones: [
        { level: 25, spell: UMBRAL_EDGE.ID },
        { level: 50, spell: SHARD_RESONANCE.ID },
        { level: 75, spell: DARK_BULWARK.ID },
        { level: 100, spell: HEART_OF_THE_VOID.ID },
    ],
});
